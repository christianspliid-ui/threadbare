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
 *     (a `gh` lookup that FAILS is not "no PR": the push is then judged as if
 *     armed, so a gh hiccup cannot wave an unreviewed head through — THR-1795)
 *     (a push to an armed PR merges with no further `gh pr merge`, so it is
 *     judged exactly like a merge of the pushed commit)
 *   - the PR diff classifies docs-only (the CI predicate)          → allow
 *   - a commit in the range carries `Review-gate exempt: <reason>` → allow (audited)
 *   - a receipt for the head SHA with zero `open` findings         → allow
 *   - a receipt for an ancestor SHA whose delta to head — counting
 *     only files in this PR's own diff, so a `git merge origin/main`
 *     does not stale it — is docs-only, counting `public/*-reference.html`
 *     pages as docs for this carry only (THR-1795)                  → allow
 * A leading `cd <dir>` on the line moves the judged repo, like `git -C <dir>`.
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
import { homedir } from "node:os";
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
 * Minimal shell-word splitter: respects single and double quotes, enough for argv
 * inspection. `;`, `&`, `|` and **newlines** come back as separator words (a newline
 * as `;`), so every line of a multi-line call is its own command; a backslash-newline
 * continuation joins lines first.
 */
export function shellWords(command: string): string[] {
  const words: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let inWord = false;
  for (const ch of command.replace(/\\\r?\n/g, " ")) {
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
    if (/\s/.test(ch) || SEPARATORS.has(ch)) {
      if (inWord) words.push(current);
      current = "";
      inWord = false;
      if (SEPARATORS.has(ch)) words.push(ch);
      else if (ch === "\n" || ch === "\r") words.push(";");
      continue;
    }
    current += ch;
    inWord = true;
  }
  if (inWord) words.push(current);
  return words;
}

/**
 * The simple commands of a shell line, each as its argv with any leading `VAR=value`
 * assignments dropped. Tokenised, so text inside a quoted commit message or PR body is
 * one word and never reads as a command (a raw substring test denied
 * `git commit -m "… gh pr merge …"` on every code branch).
 */
export function commandsOf(command: string): string[][] {
  const out: string[][] = [];
  let seg: string[] = [];
  const flush = () => {
    let k = 0;
    while (k < seg.length && ENV_ASSIGNMENT.test(seg[k])) k++;
    if (k < seg.length) out.push(seg.slice(k));
    seg = [];
  };
  for (const w of shellWords(command)) {
    if (SEPARATORS.has(w)) flush();
    else seg.push(w);
  }
  flush();
  return out;
}

const isGhPrMerge = (argv: readonly string[]) => argv[0] === "gh" && argv[1] === "pr" && argv[2] === "merge";
const isArmingMerge = (argv: readonly string[]) => isGhPrMerge(argv) && !argv.includes("--disable-auto");

/**
 * Does this shell command arm (or perform) a PR merge? Every command on the line is
 * checked, so a disarm earlier in the line cannot hide a later re-arm. Disarming
 * alone is never gated.
 */
export function isMergeCommand(command: string): boolean {
  return commandsOf(command).some(isArmingMerge);
}

/** git global options that take the next word as their value (`git -C <dir> push`). */
const GIT_VALUE_OPTIONS = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);

/** Directory-changing commands whose effect carries to later commands on the line (bash + PowerShell spellings). */
const CD_COMMANDS = new Set(["cd", "pushd", "Set-Location", "sl", "Push-Location"]);

const isAbsoluteDir = (dir: string) => /^([a-zA-Z]:)?[\\/]/.test(dir) || /^~/.test(dir);

/**
 * The directory a line's `cd` / `git -C` leaves a command in, resolved against the
 * hook's cwd, with `~` expanded to the home directory. Null when it does not resolve to
 * a directory that exists (an unexpanded `$VAR`, a `$(…)`, a tree created earlier on
 * the same line). The caller then judges the hook's cwd instead: judging a phantom tree
 * throws, and the fail-soft path would ALLOW an unreviewed push (THR-1795 review).
 */
export function resolveCommandDir(hookCwd: string, dir: string | null, home: string = homedir()): string | null {
  if (!dir) return hookCwd;
  const expanded = dir.replace(/^~(?=$|[\\/])/, () => home.replace(/\\/g, "/"));
  const resolved = path.resolve(hookCwd, normalizeCwd(expanded));
  return existsSync(resolved) ? resolved : null;
}

/** `<base>/<next>`, where an absolute `next` replaces `base` (as both `cd` and `git -C` do). */
function joinDir(base: string | null, next: string): string {
  return base && !isAbsoluteDir(next) ? `${base}/${next}` : next;
}

/**
 * Every simple command on the line with the directory a preceding `cd <dir>` left it
 * in (null = the hook's cwd). THR-1795: `cd <worktree> && git push` runs the push in
 * <worktree>, so the gate must judge HEAD there — judging the session cwd named the
 * home tree's `main` as "the pushed commit" (impediment #1146). A bare `cd` (no
 * directory argument) is left alone rather than guessed at.
 */
export function commandsWithDir(command: string): { argv: string[]; dir: string | null }[] {
  let dir: string | null = null;
  const out: { argv: string[]; dir: string | null }[] = [];
  for (const argv of commandsOf(command)) {
    if (CD_COMMANDS.has(argv[0])) {
      const target = argv.slice(1).find((w) => !w.startsWith("-"));
      if (target) dir = joinDir(dir, target);
      continue;
    }
    out.push({ argv, dir });
  }
  return out;
}

/** The directory the first arming `gh pr merge` on the line runs in (a preceding `cd`), or null. */
export function mergeDir(command: string): string | null {
  return commandsWithDir(command).find(({ argv }) => isArmingMerge(argv))?.dir ?? null;
}

/** The first `git … push` on the line: its push args and its directory (a preceding `cd`, then any `-C`). */
function findPush(command: string): { args: string[]; dir: string | null } | null {
  for (const { argv, dir: cdDir } of commandsWithDir(command)) {
    if (argv[0] !== "git") continue;
    let dir: string | null = cdDir;
    let k = 1;
    while (k < argv.length && argv[k].startsWith("-")) {
      if (GIT_VALUE_OPTIONS.has(argv[k])) {
        if (argv[k] === "-C" && argv[k + 1] !== undefined) dir = joinDir(dir, argv[k + 1]);
        k += 2;
      } else {
        k += 1;
      }
    }
    if (argv[k] === "push") return { args: argv.slice(k + 1), dir };
  }
  return null;
}

/** Is this shell command a `git push`? (Gated only when the target PR already has auto-merge armed.) */
export function isPushCommand(command: string): boolean {
  return findPush(command) !== null;
}

/** `git push` flags that consume the next word as their value. */
const PUSH_VALUE_FLAGS = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);

/**
 * What a `git push` sends where: the local `source` rev (default `HEAD`), the remote
 * branch `dest` (null = the current branch — which is also what `HEAD` means as a
 * destination, so `git push -u origin HEAD` looks up the current branch's PR, not a
 * branch named HEAD), and the `-C` directory it runs in. `git push origin HEAD:topic`
 * → `{ source: "HEAD", dest: "topic", dir: null }`.
 */
export function extractPushTarget(command: string): { source: string; dest: string | null; dir: string | null } {
  const push = findPush(command);
  if (!push) return { source: "HEAD", dest: null, dir: null };
  const positional: string[] = [];
  for (let j = 0; j < push.args.length; j++) {
    const w = push.args[j];
    if (PUSH_VALUE_FLAGS.has(w)) { j++; continue; }
    if (w.startsWith("-")) continue;
    positional.push(w);
  }
  const refspec = positional[1];
  if (!refspec) return { source: "HEAD", dest: null, dir: push.dir };
  const spec = refspec.replace(/^\+/, "");
  const colon = spec.indexOf(":");
  const source = colon >= 0 ? spec.slice(0, colon) || "HEAD" : spec;
  const dest = (colon >= 0 ? spec.slice(colon + 1) : spec).replace(/^refs\/heads\//, "");
  return { source, dest: dest && dest !== "HEAD" ? dest : null, dir: push.dir };
}

/** `gh pr merge` flags that consume the next word as their value. */
const VALUE_FLAGS = new Set([
  "-t", "--subject", "-b", "--body", "-F", "--body-file",
  "--match-head-commit", "-A", "--author-email", "-R", "--repo",
]);

/**
 * The PR the first arming `gh pr merge` names (`gh pr merge 123 --auto`, a URL, or a
 * branch), or null when it targets the current branch. Also returns `--repo` when given.
 */
export function extractMergeTarget(command: string): { target: string | null; repo: string | null } {
  const argv = commandsOf(command).find(isArmingMerge);
  if (!argv) return { target: null, repo: null };
  let target: string | null = null;
  let repo: string | null = null;
  for (let j = 3; j < argv.length; j++) {
    const w = argv[j];
    if (VALUE_FLAGS.has(w)) {
      if (w === "-R" || w === "--repo") repo = argv[j + 1] ?? null;
      j++;
      continue;
    }
    if (w.startsWith("--repo=")) { repo = w.slice("--repo=".length); continue; }
    if (w.startsWith("-")) continue;
    if (target === null) target = w;
  }
  return { target, repo };
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

/**
 * The generated/hand-kept reference pages under `public/` (`public/*-reference.html`).
 * THR-1795: `check:wiki-freshness:blocking` runs LAST by gate law and routinely forces a
 * one-line edit to one of these after the receipt is written (impediment #1156). They
 * document code; they are not code the game runs, so a receipt **carries** across them.
 * This widens the carry rule only — the CI docs-only predicate (`classifyDiff`) and the
 * gate's own docs-only allow are unchanged, so a PR whose diff is *only* these pages
 * still owes the code track.
 */
export const CARRY_SAFE_PAGE = /^public\/[^/]+-reference\.html$/;

/** Can a receipt carry across this delta (receipt → head, already narrowed by {@link ownDelta})? */
export function isCarrySafeDelta(delta: readonly string[]): boolean {
  const rest = delta.filter((f) => !CARRY_SAFE_PAGE.test(f));
  return rest.length === 0 || classifyDiff(rest) === "docs-only";
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
      if (isCarrySafeDelta(delta)) return receipt;
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

/** `gh pr view`'s own "there is no PR" answers — the only failures that mean *no PR*. */
const NO_PR_MESSAGE = /no (open )?pull requests? found/i;

/**
 * Why a `gh pr view` returned no PR, when it failed for any reason other than "there
 * is no PR" (timeout, auth, network, a detached HEAD with no selector). Pure, so the
 * classification is pinned by a unit test.
 */
export function ghLookupError(stderr: string, message: string): string | null {
  return NO_PR_MESSAGE.test(stderr) ? null : (stderr.trim().split("\n")[0] || message || "gh pr view failed");
}

/**
 * `gh pr view` — or, for the hermetic fixture tests, the JSON in
 * `REVIEW_GATE_PR_FIXTURE` (the hook must be drivable without GitHub; a fixture of
 * `{"__ghError": "<msg>"}` simulates a failed lookup). `null` when there is no PR or gh
 * is disabled; `{ error }` when the lookup itself failed — THR-1795: that used to read
 * as "no PR", so a push to an armed PR during a gh hiccup was waved through as
 * unarmed (the suspected path of impediment #1143).
 */
function viewPr(cwd: string, selector: string | null, repo: string | null, fields: string): PrView | { error: string } | null {
  const fixture = process.env.REVIEW_GATE_PR_FIXTURE;
  if (fixture) {
    const parsed = JSON.parse(fixture) as (PrView & { __ghError?: string }) | null;
    return parsed?.__ghError ? { error: parsed.__ghError } : parsed;
  }
  if (!ghAvailable()) return null;
  const args = ["pr", "view", ...(selector ? [selector] : []), "--json", fields];
  if (repo) args.push("--repo", repo);
  try {
    return JSON.parse(gh(cwd, args)) as PrView;
  } catch (err) {
    const stderr = String((err as { stderr?: unknown }).stderr ?? "");
    const error = ghLookupError(stderr, err instanceof Error ? err.message.split("\n")[0] : String(err));
    return error ? { error } : null;
  }
}

const isLookupError = (v: PrView | { error: string } | null): v is { error: string } => v !== null && "error" in v;

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

function evaluateMerge(command: string, hookCwd: string): GateDecision {
  const { target, repo } = extractMergeTarget(command);
  // `cd <dir> && gh pr merge` runs in <dir>: judge that repo, not the hook's cwd.
  const dir = mergeDir(command);
  // Unresolvable (`$VAR`, `$(…)`, a tree made earlier on the line) → judge the hook's
  // cwd, as before THR-1795: never a phantom path, which would throw into fail-soft ALLOW.
  const cwd = resolveCommandDir(hookCwd, dir) ?? hookCwd;
  let headSha: string;
  let prComments: string[] = [];
  if (target && (ghAvailable() || process.env.REVIEW_GATE_PR_FIXTURE)) {
    const looked = viewPr(cwd, target, repo, "number,headRefOid,comments");
    const view = isLookupError(looked) ? null : looked;
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
    // `gh pr merge` with no argument arms the current branch's PR — whose head is the
    // REMOTE head. Judge that, not a local HEAD another tree may have pushed past.
    const looked = viewPr(cwd, null, null, "number,headRefOid,comments");
    const view = isLookupError(looked) ? null : looked;
    prComments = (view?.comments ?? []).map((c) => c.body);
    if (view?.headRefOid) {
      headSha = view.headRefOid;
      if (!ensureCommit(cwd, headSha, view.number)) {
        return {
          verdict: "deny",
          reason: `this branch's PR head ${headSha.slice(0, 10)} is not in this repo even after a fetch — git fetch origin, then retry`,
        };
      }
    } else {
      headSha = git(cwd, ["rev-parse", "HEAD"]);
    }
  }
  return decideReviewGate(gatherGateInputs(cwd, headSha, prComments));
}

/**
 * A push to a PR whose auto-merge is already armed merges the pushed commit with no
 * further `gh pr merge` — so the gate has to stand here too, or a fix pushed after a
 * red CI ships unreviewed. Pushes to unarmed or PR-less branches are not judged.
 */
function evaluatePush(command: string, hookCwd: string): GateDecision {
  const { source, dest, dir } = extractPushTarget(command);
  // `git -C <dir> push` runs in <dir>: judge that repo, not the hook's cwd.
  // Unresolvable (`$VAR`, `$(…)`, a tree made earlier on the line) → judge the hook's
  // cwd, as before THR-1795: never a phantom path, which would throw into fail-soft ALLOW.
  const cwd = resolveCommandDir(hookCwd, dir) ?? hookCwd;
  const looked = viewPr(cwd, dest, null, "number,state,autoMergeRequest,comments");
  if (isLookupError(looked)) {
    // We cannot tell whether this push merges — so judge it as if it does. A pushed
    // commit with a clean receipt (or a docs-only diff) still goes through; an
    // unreviewed one waits for gh, exactly as a `gh pr merge` would (THR-1795).
    const headSha = git(cwd, ["rev-parse", `${source}^{commit}`]);
    const decision = decideReviewGate(gatherGateInputs(cwd, headSha, []));
    if (decision.verdict === "allow") return decision;
    return {
      verdict: "deny",
      reason:
        `could not read whether ${dest ? `branch ${dest}` : "this branch"}'s PR has auto-merge armed ` +
        `(gh: ${looked.error}), and ${headSha.slice(0, 10)} has no clean review receipt — retry once gh can reach ` +
        `GitHub, or write the receipt first.\n${decision.reason}`,
    };
  }
  const view = looked;
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
