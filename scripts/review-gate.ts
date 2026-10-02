/**
 * THR-1691 — the automatic code-review gate.
 *
 * Nobody reviews code before it merges here: the pickup lane writes it, CI runs the
 * machine gates, and `gh pr merge --auto` ships it. Christian is chat-only and does
 * not review diffs (THR-608), so there is no fallback reviewer. The `review-gate`
 * skill runs a cold, suspicious reviewer plus a refuting verifier over the diff and
 * records the outcome as a **receipt**; this script is the enforcement half — the
 * PreToolUse hook `.claude/hooks/review-gate.sh` calls it before any `gh pr merge`.
 *
 * It **blocks**, it does not advise: the previous review gate (`claude-review.yml`,
 * THR-182/183) was advisory and was deleted as decorative (THR-487, THR-269).
 *
 * Verdicts (exit code is the PreToolUse contract — 0 allow, 2 deny):
 *   - not a merge-arming command, or `--disable-auto`            → allow
 *   - a `git push` to a branch whose PR has NO auto-merge armed    → allow
 *     (a push to an armed PR merges with no further `gh pr merge`, so it is
 *     judged exactly like a merge of the pushed commit)
 *   - the PR diff classifies docs-only (the CI predicate)          → allow
 *   - a commit in the range carries `Review-gate exempt: <reason>` → allow (audited)
 *   - a receipt for the head SHA with zero `open` findings         → allow
 *   - a receipt for an ancestor SHA whose delta to head — counting
 *     only files in this PR's own diff, so a `git merge origin/main`
 *     does not stale it — is docs-only                             → allow
 *   - a PR head missing locally even after a fetch                 → deny
 *   - otherwise                                                    → deny
 *
 * Fail-soft (NFP #4): an error in the gate itself allows with a loud warning and an
 * appended line in `.claude/review-receipts/gate-errors.log` — a broken gate must not
 * stall every lane, and must not pass silently either.
 *
 * Subcommands:
 *   node --experimental-strip-types scripts/review-gate.ts hook            # stdin: hook JSON
 *   node --experimental-strip-types scripts/review-gate.ts write-receipt <findings.json>
 *     findings.json = { "rounds": 1, "findings": [{ severity, file, line, summary, disposition }] }
 *     Stamps the receipt for HEAD and prints the PR-comment markdown on stdout.
 */

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { classifyDiff } from "./docs-only-predicate.ts";

export const EXEMPTION_TOKEN = "Review-gate exempt:";
export const RECEIPT_DIR = ".claude/review-receipts";
export const BASE_REF = "origin/main";
/** Marker line the PR comment carries, so a later session in another tree can find the receipt. */
export const COMMENT_MARKER_PREFIX = "<!-- review-gate-receipt";

export type Disposition = "fixed" | "rebutted" | "open";

export type ReceiptFinding = {
  severity: string;
  file: string;
  line: number;
  summary: string;
  disposition: Disposition;
};

export type Receipt = {
  sha: string;
  rounds: number;
  findings: ReceiptFinding[];
  reviewedAt: string;
};

export type GateDecision = { verdict: "allow" | "deny"; reason: string };

// ---------------------------------------------------------------------------
// Pure parts
// ---------------------------------------------------------------------------

const SEPARATORS = new Set([";", "&", "|"]);
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/**
 * Index of `seq` (e.g. `gh pr merge`) at a **command position** — the start of the
 * line or right after `;`, `&`, `|`, past any `VAR=value` prefixes — or -1. Tokenised,
 * so the same text inside a quoted commit message or PR body never matches (a raw
 * substring test denied `git commit -m "… gh pr merge …"` on every code branch).
 */
export function findCommand(words: readonly string[], seq: readonly string[]): number {
  for (let i = 0; i + seq.length <= words.length; i++) {
    if (!seq.every((w, k) => words[i + k] === w)) continue;
    let j = i - 1;
    while (j >= 0 && ENV_ASSIGNMENT.test(words[j])) j--;
    if (j < 0 || SEPARATORS.has(words[j])) return i;
  }
  return -1;
}

/** The words of the command that starts at `start`, up to the next separator. */
function commandSegment(words: readonly string[], start: number): string[] {
  const out: string[] = [];
  for (let j = start; j < words.length && !SEPARATORS.has(words[j]); j++) out.push(words[j]);
  return out;
}

/** Does this shell command arm (or perform) a PR merge? Disarming is never gated. */
export function isMergeCommand(command: string): boolean {
  const words = shellWords(command);
  const i = findCommand(words, ["gh", "pr", "merge"]);
  if (i < 0) return false;
  return !commandSegment(words, i).includes("--disable-auto");
}

/** Is this shell command a `git push`? (Gated only when the target PR already has auto-merge armed.) */
export function isPushCommand(command: string): boolean {
  return findCommand(shellWords(command), ["git", "push"]) >= 0;
}

/** `git push` flags that consume the next word as their value. */
const PUSH_VALUE_FLAGS = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);

/**
 * What a `git push` sends where: the local `source` rev (default `HEAD`) and the remote
 * branch `dest` (null = the current branch's upstream). `git push origin HEAD:topic`
 * → `{ source: "HEAD", dest: "topic" }`.
 */
export function extractPushTarget(command: string): { source: string; dest: string | null } {
  const words = shellWords(command);
  const i = findCommand(words, ["git", "push"]);
  if (i < 0) return { source: "HEAD", dest: null };
  const positional: string[] = [];
  const segment = commandSegment(words, i + 2);
  for (let j = 0; j < segment.length; j++) {
    const w = segment[j];
    if (PUSH_VALUE_FLAGS.has(w)) { j++; continue; }
    if (w.startsWith("-")) continue;
    positional.push(w);
  }
  const refspec = positional[1];
  if (!refspec) return { source: "HEAD", dest: null };
  const spec = refspec.replace(/^\+/, "");
  const colon = spec.indexOf(":");
  const source = colon >= 0 ? spec.slice(0, colon) || "HEAD" : spec;
  const rawDest = colon >= 0 ? spec.slice(colon + 1) : spec;
  return { source, dest: rawDest.replace(/^refs\/heads\//, "") || null };
}

/** Minimal shell-word splitter: respects single and double quotes, enough for argv inspection. */
export function shellWords(command: string): string[] {
  const words: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let inWord = false;
  for (const ch of command) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      inWord = true;
      continue;
    }
    if (/\s/.test(ch) || ch === ";" || ch === "&" || ch === "|") {
      if (inWord) words.push(current);
      current = "";
      inWord = false;
      if (ch !== " " && ch !== "\t" && ch !== "\n") words.push(ch);
      continue;
    }
    current += ch;
    inWord = true;
  }
  if (inWord) words.push(current);
  return words;
}

/** `gh pr merge` flags that consume the next word as their value. */
const VALUE_FLAGS = new Set([
  "-t", "--subject", "-b", "--body", "-F", "--body-file",
  "--match-head-commit", "-A", "--author-email", "-R", "--repo",
]);

/**
 * The PR the command names (`gh pr merge 123 --auto`, a URL, or a branch), or null
 * when it targets the current branch. Also returns `--repo` when given.
 */
export function extractMergeTarget(command: string): { target: string | null; repo: string | null } {
  const words = shellWords(command);
  const start = findCommand(words, ["gh", "pr", "merge"]);
  for (let i = Math.max(start, 0); start >= 0 && i + 2 < words.length; i++) {
    if (words[i] === "gh" && words[i + 1] === "pr" && words[i + 2] === "merge") {
      let target: string | null = null;
      let repo: string | null = null;
      for (let j = i + 3; j < words.length; j++) {
        const w = words[j];
        if (w === ";" || w === "&" || w === "|") break;
        if (VALUE_FLAGS.has(w)) {
          if (w === "-R" || w === "--repo") repo = words[j + 1] ?? null;
          j++;
          continue;
        }
        if (w.startsWith("--repo=")) { repo = w.slice("--repo=".length); continue; }
        if (w.startsWith("-")) continue;
        if (target === null) target = w;
      }
      return { target, repo };
    }
  }
  return { target: null, repo: null };
}

/**
 * First non-empty exemption reason in the concatenated commit bodies. Line-anchored,
 * so a sentence that *mentions* the token (like this docblock) never waives anything.
 */
export function parseExemptReason(commitBodies: string): string | null {
  for (const raw of commitBodies.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.startsWith(EXEMPTION_TOKEN)) continue;
    const reason = line.slice(EXEMPTION_TOKEN.length).trim();
    if (reason.length > 0) return reason;
  }
  return null;
}

export function openFindings(receipt: Receipt): ReceiptFinding[] {
  return receipt.findings.filter((f) => f.disposition === "open");
}

/** Parse the marker line out of a PR comment body. */
export function parseCommentMarker(body: string): { sha: string; open: number } | null {
  const m = body.match(/<!-- review-gate-receipt sha=([0-9a-f]{7,40}) open=(\d+) -->/);
  return m ? { sha: m[1], open: Number(m[2]) } : null;
}

export type GateInputs = {
  headSha: string;
  /** Files changed `origin/main...head`. */
  files: readonly string[];
  commitBodies: string;
  /** Receipt for exactly `headSha`, if any. */
  exactReceipt: Receipt | null;
  /** Older receipts whose delta to head is docs-only (already filtered by the caller). */
  carriedReceipt: Receipt | null;
  /** A PR-comment marker for `headSha`, the cross-tree fallback. */
  commentMarker: { sha: string; open: number } | null;
};

/** The whole verdict, pure — every Done-when case is a row of this function. */
export function decideReviewGate(inputs: GateInputs): GateDecision {
  if (inputs.files.length > 0 && classifyDiff(inputs.files) === "docs-only") {
    return { verdict: "allow", reason: "docs-only diff — the review gate covers code diffs only" };
  }
  const exempt = parseExemptReason(inputs.commitBodies);
  if (exempt) {
    return { verdict: "allow", reason: `exempt — \`${EXEMPTION_TOKEN} ${exempt}\` (audited by the weekly retro)` };
  }
  const receipt = inputs.exactReceipt ?? inputs.carriedReceipt;
  if (receipt) {
    const open = openFindings(receipt);
    if (open.length > 0) {
      return {
        verdict: "deny",
        reason:
          `receipt ${receipt.sha.slice(0, 10)} has ${open.length} open finding(s):\n` +
          open.map((f) => `  - [${f.severity}] ${f.file}:${f.line} — ${f.summary}`).join("\n") +
          "\nFix or rebut them (review-gate skill, step 4). After 2 rounds with findings still open, do NOT arm — park the ticket.",
      };
    }
    const how = inputs.exactReceipt ? "for this head" : `carried from ${receipt.sha.slice(0, 10)} across a docs-only delta`;
    return { verdict: "allow", reason: `clean review receipt ${how} (${receipt.rounds} round(s), ${receipt.findings.length} finding(s) resolved)` };
  }
  if (inputs.commentMarker && inputs.commentMarker.sha === inputs.headSha) {
    return inputs.commentMarker.open === 0
      ? { verdict: "allow", reason: "clean review receipt found in the PR comments" }
      : { verdict: "deny", reason: `the PR's review comment records ${inputs.commentMarker.open} open finding(s)` };
  }
  return {
    verdict: "deny",
    reason:
      `no review receipt for head ${inputs.headSha.slice(0, 10)}. Run the review-gate skill ` +
      "(.claude/skills/review-gate/SKILL.md) — cold reviewer, refuting verifier, then " +
      "`node --experimental-strip-types scripts/review-gate.ts write-receipt <findings.json>`. " +
      "A receipt for an older commit counts only when everything since it is docs-only.",
  };
}

/** The PR comment — the durable, greppable record the six-week renewal reads. */
export function renderReceiptComment(receipt: Receipt): string {
  const open = openFindings(receipt).length;
  const lines = [
    `${COMMENT_MARKER_PREFIX} sha=${receipt.sha} open=${open} -->`,
    `**Review gate (THR-1691)** — head \`${receipt.sha.slice(0, 10)}\`, ${receipt.rounds} round(s), ` +
      `${receipt.findings.length} confirmed finding(s), ${open} open.`,
  ];
  if (receipt.findings.length === 0) {
    lines.push("", "No confirmed findings.");
  } else {
    lines.push("", "| severity | location | finding | disposition |", "|---|---|---|---|");
    for (const f of receipt.findings) {
      lines.push(`| ${f.severity} | \`${f.file}:${f.line}\` | ${f.summary.replace(/\|/g, "\\|")} | ${f.disposition} |`);
    }
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Impure shell
// ---------------------------------------------------------------------------

function git(cwd: string, args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function ghAvailable(): boolean {
  return process.env.REVIEW_GATE_NO_GH !== "1";
}

function gh(cwd: string, args: string[]): string {
  return execFileSync("gh", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }).trim();
}

function readReceipt(file: string): Receipt | null {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Receipt;
    if (typeof parsed.sha !== "string" || !Array.isArray(parsed.findings)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * The part of a receipt→head delta that is this PR's own work. A file counts only if
 * it is also in the PR's diff against `origin/main`: after `git merge origin/main` (the
 * prescribed fix for a DIRTY PR) the two-dot delta lists every file main changed, and
 * those are main's reviewed code, not this PR's. A file both sides touched stays in.
 */
export function ownDelta(delta: readonly string[], prFiles: readonly string[]): string[] {
  const own = new Set(prFiles);
  return delta.filter((f) => own.has(f));
}

function findCarriedReceipt(cwd: string, receiptDir: string, headSha: string, prFiles: readonly string[]): Receipt | null {
  if (!existsSync(receiptDir)) return null;
  for (const name of readdirSync(receiptDir)) {
    if (!name.endsWith(".json")) continue;
    const receipt = readReceipt(path.join(receiptDir, name));
    if (!receipt || receipt.sha === headSha) continue;
    try {
      // Ancestor of head, and this PR's own delta since it is docs-only.
      execFileSync("git", ["-C", cwd, "merge-base", "--is-ancestor", receipt.sha, headSha], { stdio: "ignore" });
      const delta = ownDelta(git(cwd, ["diff", "--name-only", receipt.sha, headSha]).split("\n").filter(Boolean), prFiles);
      if (delta.length === 0 || classifyDiff(delta) === "docs-only") return receipt;
    } catch {
      // Not an ancestor, or unknown object — not a candidate.
    }
  }
  return null;
}

/**
 * An MSYS-style `/c/Users/…` path (what Git Bash hands around) is meaningless to a
 * native `git.exe` spawned from node — every `git -C` then throws and the gate
 * fail-softs into ALLOW. Normalise it to `C:/Users/…` on Windows.
 */
export function normalizeCwd(cwd: string, platform: string = process.platform): string {
  if (platform !== "win32") return cwd;
  const m = cwd.match(/^\/([a-zA-Z])(\/.*)?$/);
  return m ? `${m[1].toUpperCase()}:${m[2] ?? "/"}` : cwd;
}

type PrView = {
  number?: number;
  state?: string;
  headRefOid?: string;
  autoMergeRequest?: unknown;
  comments?: { body: string }[];
};

/**
 * `gh pr view` — or, for the hermetic fixture tests, the JSON in
 * `REVIEW_GATE_PR_FIXTURE` (the hook must be drivable without GitHub). Null when
 * there is no PR or gh is unavailable.
 */
function viewPr(cwd: string, selector: string | null, repo: string | null, fields: string): PrView | null {
  const fixture = process.env.REVIEW_GATE_PR_FIXTURE;
  if (fixture) return JSON.parse(fixture) as PrView;
  if (!ghAvailable()) return null;
  const args = ["pr", "view", ...(selector ? [selector] : []), "--json", fields];
  if (repo) args.push("--repo", repo);
  try {
    return JSON.parse(gh(cwd, args)) as PrView;
  } catch {
    return null;
  }
}

/** Is `sha` a commit this repo has? Fetches it once (and the PR's head ref) if not. */
function ensureCommit(cwd: string, sha: string, prNumber: number | undefined): boolean {
  const has = () => {
    try {
      execFileSync("git", ["-C", cwd, "cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  if (has()) return true;
  for (const ref of [sha, ...(prNumber ? [`pull/${prNumber}/head`] : [])]) {
    try {
      execFileSync("git", ["-C", cwd, "fetch", "-q", "origin", ref], { stdio: "ignore", timeout: 30_000 });
    } catch {
      // try the next ref
    }
    if (has()) return true;
  }
  return false;
}

/** Everything `decideReviewGate` needs for `headSha`, read from this tree. */
function gatherGateInputs(cwd: string, headSha: string, prComments: readonly string[]): GateInputs {
  const top = git(cwd, ["rev-parse", "--show-toplevel"]);
  const receiptDir = path.join(top, RECEIPT_DIR);
  const files = git(cwd, ["diff", "--name-only", `${BASE_REF}...${headSha}`]).split("\n").filter(Boolean);
  const commitBodies = git(cwd, ["log", "--format=%B", `${BASE_REF}..${headSha}`]);
  const exactPath = path.join(receiptDir, `${headSha}.json`);
  const exactReceipt = existsSync(exactPath) ? readReceipt(exactPath) : null;
  const carriedReceipt = exactReceipt ? null : findCarriedReceipt(cwd, receiptDir, headSha, files);
  let commentMarker: { sha: string; open: number } | null = null;
  for (const body of prComments) {
    const marker = parseCommentMarker(body);
    if (marker && marker.sha === headSha) commentMarker = marker;
  }
  return { headSha, files, commitBodies, exactReceipt, carriedReceipt, commentMarker };
}

function evaluateMerge(command: string, cwd: string): GateDecision {
  const { target, repo } = extractMergeTarget(command);
  let headSha: string;
  let prComments: string[] = [];
  if (target && (ghAvailable() || process.env.REVIEW_GATE_PR_FIXTURE)) {
    const view = viewPr(cwd, target, repo, "number,headRefOid,comments");
    if (!view?.headRefOid) {
      return { verdict: "deny", reason: `could not read PR ${target}'s head from GitHub — retry once gh can reach it` };
    }
    headSha = view.headRefOid;
    prComments = (view.comments ?? []).map((c) => c.body);
    // A head made on GitHub's side (Update branch) may be missing here; reading the
    // diff would then throw and the fail-soft path would ALLOW an unreviewed merge.
    if (!ensureCommit(cwd, headSha, view.number)) {
      return {
        verdict: "deny",
        reason: `PR ${target}'s head ${headSha.slice(0, 10)} is not in this repo even after a fetch — git fetch origin, then retry`,
      };
    }
  } else {
    headSha = git(cwd, ["rev-parse", "HEAD"]);
    const view = viewPr(cwd, null, null, "comments");
    prComments = (view?.comments ?? []).map((c) => c.body);
  }
  return decideReviewGate(gatherGateInputs(cwd, headSha, prComments));
}

/**
 * A push to a PR whose auto-merge is already armed merges the pushed commit with no
 * further `gh pr merge` — so the gate has to stand here too, or a fix pushed after a
 * red CI ships unreviewed. Pushes to unarmed or PR-less branches are not judged.
 */
function evaluatePush(command: string, cwd: string): GateDecision {
  const { source, dest } = extractPushTarget(command);
  const view = viewPr(cwd, dest, null, "number,state,autoMergeRequest,comments");
  if (!view || !view.autoMergeRequest || (view.state && view.state !== "OPEN")) {
    return { verdict: "allow", reason: "push to a branch with no armed PR — not judged" };
  }
  const headSha = git(cwd, ["rev-parse", `${source}^{commit}`]);
  const decision = decideReviewGate(gatherGateInputs(cwd, headSha, (view.comments ?? []).map((c) => c.body)));
  if (decision.verdict === "allow") return decision;
  return {
    verdict: "deny",
    reason:
      `PR #${view.number ?? "?"} has auto-merge armed, so this push would merge ${headSha.slice(0, 10)} unreviewed. ` +
      `Review the new head and write its receipt before pushing, or disarm first ` +
      `(\`gh pr merge ${view.number ?? "<N>"} --disable-auto\`) and re-arm after the review.\n${decision.reason}`,
  };
}

export function evaluateHookPayload(payload: { command: string; cwd: string }): GateDecision {
  const { command } = payload;
  const cwd = normalizeCwd(payload.cwd);
  if (isMergeCommand(command)) return evaluateMerge(command, cwd);
  if (isPushCommand(command)) return evaluatePush(command, cwd);
  return { verdict: "allow", reason: "not a merge command" };
}

function logGateError(cwd: string, message: string): void {
  try {
    const dir = path.join(cwd, RECEIPT_DIR);
    mkdirSync(dir, { recursive: true });
    appendFileSync(path.join(dir, "gate-errors.log"), `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging is best-effort; the stderr warning already carries the message.
  }
}

function runHook(): number {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    return 0;
  }
  let command = "";
  let cwd = process.cwd();
  try {
    const parsed = JSON.parse(raw) as { tool_input?: { command?: string }; cwd?: string };
    command = parsed.tool_input?.command ?? "";
    if (parsed.cwd) cwd = normalizeCwd(parsed.cwd);
  } catch {
    return 0; // Not a payload we understand — not ours to judge.
  }
  try {
    const decision = evaluateHookPayload({ command, cwd });
    if (decision.verdict === "deny") {
      process.stderr.write(`Review gate BLOCKED this command (THR-1691): ${decision.reason}\n`);
      return 2;
    }
    if (decision.reason !== "not a merge command") {
      process.stderr.write(`review-gate: allow — ${decision.reason}\n`);
    }
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
    process.stderr.write(
      `review-gate: WARNING — the gate itself failed (${message}); ALLOWING fail-soft. ` +
        `Logged to ${RECEIPT_DIR}/gate-errors.log for the weekly retro.\n`,
    );
    logGateError(cwd, `${command.slice(0, 120)} :: ${message}`);
    return 0;
  }
}

function writeReceipt(findingsPath: string): number {
  const input = JSON.parse(readFileSync(findingsPath, "utf8")) as { rounds?: number; findings?: ReceiptFinding[] };
  const cwd = process.cwd();
  const sha = git(cwd, ["rev-parse", "HEAD"]);
  const receipt: Receipt = {
    sha,
    rounds: input.rounds ?? 1,
    findings: input.findings ?? [],
    reviewedAt: new Date().toISOString(),
  };
  const dir = path.join(git(cwd, ["rev-parse", "--show-toplevel"]), RECEIPT_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${sha}.json`), `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${renderReceiptComment(receipt)}\n`);
  return 0;
}

const isEntry = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isEntry) {
  const [sub, arg] = process.argv.slice(2);
  if (sub === "hook") process.exit(runHook());
  else if (sub === "write-receipt" && arg) process.exit(writeReceipt(arg));
  else {
    process.stderr.write("usage: review-gate.ts hook | write-receipt <findings.json>\n");
    process.exit(1);
  }
}
