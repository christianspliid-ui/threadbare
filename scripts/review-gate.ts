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
 *   - the PR diff classifies docs-only (the CI predicate)          → allow
 *   - a commit in the range carries `Review-gate exempt: <reason>` → allow (audited)
 *   - a receipt for the head SHA with zero `open` findings         → allow
 *   - a receipt for an ancestor SHA whose delta to head is
 *     docs-only (closeout docs written after the review)          → allow
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

/** Does this shell command arm (or perform) a PR merge? Disarming is never gated. */
export function isMergeCommand(command: string): boolean {
  if (!/\bgh\s+pr\s+merge\b/.test(command)) return false;
  return !/--disable-auto\b/.test(command);
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
  for (let i = 0; i + 2 < words.length; i++) {
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

function findCarriedReceipt(cwd: string, receiptDir: string, headSha: string): Receipt | null {
  if (!existsSync(receiptDir)) return null;
  for (const name of readdirSync(receiptDir)) {
    if (!name.endsWith(".json")) continue;
    const receipt = readReceipt(path.join(receiptDir, name));
    if (!receipt || receipt.sha === headSha) continue;
    try {
      // Ancestor of head, and the delta since it is docs-only.
      execFileSync("git", ["-C", cwd, "merge-base", "--is-ancestor", receipt.sha, headSha], { stdio: "ignore" });
      const delta = git(cwd, ["diff", "--name-only", receipt.sha, headSha]).split("\n").filter(Boolean);
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

export function evaluateHookPayload(payload: { command: string; cwd: string }): GateDecision {
  const { command } = payload;
  const cwd = normalizeCwd(payload.cwd);
  if (!isMergeCommand(command)) return { verdict: "allow", reason: "not a merge command" };

  const { target, repo } = extractMergeTarget(command);
  let headSha: string;
  let prComments: string[] = [];
  if (target && ghAvailable()) {
    const args = ["pr", "view", target, "--json", "headRefOid,comments"];
    if (repo) args.push("--repo", repo);
    const view = JSON.parse(gh(cwd, args)) as { headRefOid: string; comments: { body: string }[] };
    headSha = view.headRefOid;
    prComments = view.comments.map((c) => c.body);
  } else {
    headSha = git(cwd, ["rev-parse", "HEAD"]);
    if (ghAvailable()) {
      try {
        const view = JSON.parse(gh(cwd, ["pr", "view", "--json", "comments"])) as { comments: { body: string }[] };
        prComments = view.comments.map((c) => c.body);
      } catch {
        // No PR for this branch yet, or gh offline — the local receipt is the primary path.
      }
    }
  }

  const top = git(cwd, ["rev-parse", "--show-toplevel"]);
  const receiptDir = path.join(top, RECEIPT_DIR);
  const files = git(cwd, ["diff", "--name-only", `${BASE_REF}...${headSha}`]).split("\n").filter(Boolean);
  const commitBodies = git(cwd, ["log", "--format=%B", `${BASE_REF}..${headSha}`]);
  const exactPath = path.join(receiptDir, `${headSha}.json`);
  const exactReceipt = existsSync(exactPath) ? readReceipt(exactPath) : null;
  const carriedReceipt = exactReceipt ? null : findCarriedReceipt(cwd, receiptDir, headSha);
  let commentMarker: { sha: string; open: number } | null = null;
  for (const body of prComments) {
    const marker = parseCommentMarker(body);
    if (marker && marker.sha === headSha) commentMarker = marker;
  }
  return decideReviewGate({ headSha, files, commitBodies, exactReceipt, carriedReceipt, commentMarker });
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
      process.stderr.write(`Review gate BLOCKED the merge (THR-1691): ${decision.reason}\n`);
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
