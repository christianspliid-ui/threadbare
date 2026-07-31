#!/usr/bin/env node

/**
 * Armed auto-merge PR health probe (THR-897).
 *
 * Answers one question: **of the PRs that are armed and waiting to merge, which
 * ones can never get there on their own?**
 *
 * ## The gap this closes
 *
 * pull-work Step 0.8 (shipped by THR-702) sweeps armed PRs and runs
 * `gh pr update-branch` on the oldest one at `mergeStateStatus: BEHIND`. That
 * matches on `BEHIND` **only**. A PR that goes `DIRTY` — a real merge conflict —
 * is not `BEHIND`, so the sweep skips it, and `update-branch` would not fix it
 * anyway. Auto-merge never fires on a conflicted PR.
 *
 * The result is the worst shape a stall can take: a PR that reads *armed, open,
 * and actively swept* while being structurally incapable of merging, with
 * nothing surfacing it. Measured 2026-07-31: 2 of 3 open PRs were in that
 * state, one of them carrying the deliverable that unblocked 11 content
 * tickets, un-drained for ~12h across three sweeps that each reported success.
 *
 * ## What this probe does instead
 *
 * Classifies every armed PR into what it actually needs, rather than testing
 * one value for equality:
 *
 * | class           | `mergeStateStatus`             | who can clear it |
 * |-----------------|--------------------------------|------------------|
 * | `drainable`     | `BEHIND`                       | the sweep — `gh pr update-branch` |
 * | `conflicted`    | `DIRTY`                        | **a session** — `git merge origin/main`, resolve, push |
 * | `waiting`       | `CLEAN` `BLOCKED` `HAS_HOOKS` `UNSTABLE` | nobody; auto-merge fires on green |
 * | `indeterminate` | `UNKNOWN` `DRAFT`              | nobody; re-query (see below) |
 *
 * Only `drainable` is the sweep's to fix. `conflicted` is the class that was
 * silently dropped, and it is reported with **the conflicting file names**
 * (via a read-only `git merge-tree`) so the session that picks it up starts
 * with the diagnosis already done.
 *
 * ## `UNKNOWN` is not "fine" — it means "not computed yet"
 *
 * GitHub computes `mergeStateStatus` lazily; a first read returns `UNKNOWN` and
 * merely *schedules* the computation. Measured 2026-07-31, PRs #1132 and #1166
 * each read `DIRTY` and then `UNKNOWN` minutes apart with no intervening push.
 * A probe that classified on one read would call a conflicted PR healthy on
 * roughly every other run. So `indeterminate` entries are re-queried up to
 * `ARMED_UNKNOWN_REQUERIES` times before being believed.
 *
 * ## Two age tiers, because a conflict is an agent's job until it isn't
 *
 * A conflicted PR is session work, not a Christian decision (THR-608: technical
 * verdicts are the agent's). So the first tier reports rather than escalates:
 *
 * - past `ARMED_DIRTY_ESCALATE_MINUTES` (one sweep interval + slack) →
 *   `needsSession: true`. Surfaced to the lane, not to Christian.
 * - past `ARMED_DIRTY_ABANDONED_HOURS` → `needsChristian: true`. At this point
 *   ~12 hourly sessions have each had a chance and none cleared it, so the
 *   stall is systemic rather than a task waiting for its turn.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped. A missing `gh`, a network failure, or an
 * unfetchable PR ref degrades to `unknown` and exits 0. This probe must never
 * be the reason a pickup run or an hourly brief fails.
 *
 * Usage:
 *   npm run check:armed-prs               # advisory; always exits 0
 *   npm run check:armed-prs -- --json     # machine-readable single-line JSON
 *   npm run check:armed-prs -- --strict   # exits 1 when a human is needed
 */

import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/**
 * How long an armed PR may sit conflicted before the report escalates from
 * "noted" to "a session must pick this up". The sweep runs hourly, so anything
 * past one interval has already been skipped at least once — 90 minutes gives
 * a full interval plus slack for a run that starts late.
 */
export const ARMED_DIRTY_ESCALATE_MINUTES = 90;

/**
 * How long an armed PR may sit conflicted before it stops being session work
 * and becomes Christian's. At 12 hours roughly a dozen hourly runs have each
 * had the chance to clear it and none did, which is a systemic stall rather
 * than a queue waiting its turn.
 */
export const ARMED_DIRTY_ABANDONED_HOURS = 12;

/**
 * How many times to re-query a PR reading `UNKNOWN` before believing it.
 * GitHub computes mergeability lazily — the first read only schedules it.
 */
export const ARMED_UNKNOWN_REQUERIES = 3;

/** Pause between `UNKNOWN` re-queries, giving GitHub time to compute. */
export const ARMED_UNKNOWN_REQUERY_DELAY_MS = 2500;

/**
 * Cap on conflicting file names reported per PR. A conflict spanning more than
 * this many files is a rebase problem, not a merge problem, and the count
 * communicates that better than the list would.
 */
export const ARMED_CONFLICT_FILE_LIMIT = 10;

/** GitHub `owner/repo` these PRs belong to. */
export const GH_REPO = "christianspliid-ui/threadbare";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * GitHub's `mergeStateStatus` enum. `DRAFT` and `UNKNOWN` both mean "no verdict
 * available", for different reasons.
 */
export type MergeStateStatus =
  | "BEHIND"
  | "BLOCKED"
  | "CLEAN"
  | "DIRTY"
  | "DRAFT"
  | "HAS_HOOKS"
  | "UNKNOWN"
  | "UNSTABLE";

/** What an armed PR needs in order to reach `main`. */
export type ArmedPrClass = "drainable" | "conflicted" | "waiting" | "indeterminate";

export type ArmedPrVerdict =
  | "healthy"
  | "drainable"
  | "conflicted"
  | "abandoned"
  | "unknown";

export interface ArmedPrRecord {
  number: number;
  title: string;
  mergeStateStatus: MergeStateStatus;
  /** When auto-merge was armed, epoch ms. */
  enabledAtMs: number;
  /** Head commit, used to compute conflicting files. */
  headRefOid: string;
}

export interface ArmedPrReport {
  number: number;
  title: string;
  klass: ArmedPrClass;
  mergeStateStatus: MergeStateStatus;
  /** How long it has been armed, in minutes. */
  armedForMinutes: number;
  /** Conflicting file names — populated for `conflicted` only. */
  conflictFiles: string[];
  /** True when a `conflicted` PR is past `ARMED_DIRTY_ESCALATE_MINUTES`. */
  escalated: boolean;
}

export interface ArmedPrInput {
  prs: ArmedPrRecord[];
  /** Evaluation time, epoch ms. Injected so tests are deterministic (NFP #3). */
  nowMs: number;
  /**
   * Conflicting file names for a PR head, or `null` when the comparison could
   * not be made (unfetchable ref, git failure). Injected for testability.
   */
  conflictFilesFor: (headRefOid: string) => string[] | null;
}

export interface ArmedPrResult {
  verdict: ArmedPrVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /** A session must pick this up — surfaced to the lane, not to Christian. */
  needsSession: boolean;
  /** PR the sweep should `update-branch` this run, or `null`. */
  updateCandidate: number | null;
  /** Every armed PR, classified. */
  prs: ArmedPrReport[];
  counts: Record<ArmedPrClass, number>;
}

/**
 * The classification table. Written as data rather than a chain of `if`s so
 * that adding a state is a one-line edit and an unhandled state is impossible
 * to introduce silently — the `Record` type requires every arm.
 */
const CLASS_BY_STATE: Record<MergeStateStatus, ArmedPrClass> = {
  BEHIND: "drainable",
  DIRTY: "conflicted",
  CLEAN: "waiting",
  BLOCKED: "waiting",
  HAS_HOOKS: "waiting",
  UNSTABLE: "waiting",
  UNKNOWN: "indeterminate",
  DRAFT: "indeterminate",
};

/**
 * Classify a single `mergeStateStatus`. An unrecognised value (GitHub adds
 * enum members over time) is `indeterminate` rather than `waiting` — the
 * fail-safe direction, since `waiting` means "nobody needs to do anything".
 */
export function classifyMergeState(state: string): ArmedPrClass {
  return CLASS_BY_STATE[state as MergeStateStatus] ?? "indeterminate";
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Classify armed-PR health. Pure: no IO, no clock, no git.
 *
 * Verdict precedence runs worst-first. A conflicted PR outranks a drainable
 * one because the drainable case self-heals on the next sweep and the
 * conflicted case never does — reporting "drainable" while a conflict sits
 * underneath is exactly the silence THR-897 was filed for.
 */
export function classifyArmedPrs(input: ArmedPrInput): ArmedPrResult {
  const { prs, nowMs, conflictFilesFor } = input;

  const escalateMs = ARMED_DIRTY_ESCALATE_MINUTES * 60 * 1000;
  const abandonedMs = ARMED_DIRTY_ABANDONED_HOURS * 60 * 60 * 1000;

  const reports: ArmedPrReport[] = prs.map((pr) => {
    const klass = classifyMergeState(pr.mergeStateStatus);
    const armedForMs = Math.max(0, nowMs - pr.enabledAtMs);
    const conflictFiles =
      klass === "conflicted" ? (conflictFilesFor(pr.headRefOid) ?? []) : [];

    return {
      number: pr.number,
      title: pr.title,
      klass,
      mergeStateStatus: pr.mergeStateStatus,
      armedForMinutes: Math.round(armedForMs / 60000),
      conflictFiles: conflictFiles.slice(0, ARMED_CONFLICT_FILE_LIMIT),
      escalated: klass === "conflicted" && armedForMs >= escalateMs,
    };
  });

  const counts: Record<ArmedPrClass, number> = {
    drainable: 0,
    conflicted: 0,
    waiting: 0,
    indeterminate: 0,
  };
  for (const r of reports) {
    counts[r.klass] += 1;
  }

  // Oldest drainable PR is the sweep's single update candidate
  // (ARMED_SWEEP_MAX_UPDATES = 1 — updating several re-stales the others).
  const updateCandidate =
    reports
      .filter((r) => r.klass === "drainable")
      .sort((a, b) => b.armedForMinutes - a.armedForMinutes)[0]?.number ?? null;

  const conflicted = reports
    .filter((r) => r.klass === "conflicted")
    .sort((a, b) => b.armedForMinutes - a.armedForMinutes);

  const abandoned = conflicted.filter((r) => r.armedForMinutes * 60000 >= abandonedMs);

  // 1. Conflicted past the abandoned threshold. Loudest case: sessions have had
  //    their chance and the stall outlived them.
  if (abandoned.length > 0) {
    const oldest = abandoned[0];
    const hours = Math.floor(oldest.armedForMinutes / 60);
    return {
      verdict: "abandoned",
      summary:
        `A finished change has been stuck for ${hours} hours and cannot merge on its own: PR #${oldest.number} ` +
        `("${oldest.title}") has a conflict that ${ARMED_DIRTY_ABANDONED_HOURS}+ automated attempts have not cleared. ` +
        "Nothing is broken on the live site, but that work is not reaching it.",
      needsChristian: true,
      needsSession: true,
      updateCandidate,
      prs: reports,
      counts,
    };
  }

  // 2. Conflicted. Session work — reported, never silently skipped.
  if (conflicted.length > 0) {
    const names = conflicted.map((r) => `#${r.number}`).join(", ");
    const oldest = conflicted[0];
    const files =
      oldest.conflictFiles.length > 0
        ? ` Conflicting files on #${oldest.number}: ${oldest.conflictFiles.join(", ")}.`
        : "";
    return {
      verdict: "conflicted",
      summary:
        `${conflicted.length} armed ${plural(conflicted.length, "PR has", "PRs have")} a merge conflict and cannot ` +
        `auto-merge: ${names}. These need a session to run \`git merge origin/main\`, resolve, and push — ` +
        `\`update-branch\` does not fix a conflict.${files}`,
      needsChristian: false,
      needsSession: conflicted.some((r) => r.escalated),
      updateCandidate,
      prs: reports,
      counts,
    };
  }

  // 3. Drainable only — the sweep's normal, healthy job.
  if (counts.drainable > 0) {
    return {
      verdict: "drainable",
      summary:
        `${counts.drainable} armed ${plural(counts.drainable, "PR is", "PRs are")} behind main and will be ` +
        `updated one per run, oldest first (#${updateCandidate}).`,
      needsChristian: false,
      needsSession: false,
      updateCandidate,
      prs: reports,
      counts,
    };
  }

  // 4. Nothing actionable, but some state could not be determined.
  if (counts.indeterminate > 0 && counts.waiting === 0) {
    return {
      verdict: "unknown",
      summary:
        `Could not determine the merge state of ${counts.indeterminate} armed ` +
        `${plural(counts.indeterminate, "PR", "PRs")} — GitHub had not finished computing it.`,
      needsChristian: false,
      needsSession: false,
      updateCandidate,
      prs: reports,
      counts,
    };
  }

  return {
    verdict: "healthy",
    summary:
      prs.length === 0
        ? "No PRs are waiting to merge."
        : `${prs.length} armed ${plural(prs.length, "PR is", "PRs are")} waiting on checks and will merge on green.`,
    needsChristian: false,
    needsSession: false,
    updateCandidate,
    prs: reports,
    counts,
  };
}

/**
 * Parse conflicting file names out of `git merge-tree --write-tree --name-only`.
 *
 * Output shape on conflict:
 * ```
 * <tree-oid>
 * <conflicted path>
 * <conflicted path>
 *
 * Auto-merging ...
 * CONFLICT (content): ...
 * ```
 * On a clean merge the tree oid is the only content before the blank line.
 * Returns `[]` for a clean merge, so an empty array means "no conflicts" and
 * `null` from the caller means "could not tell" — two different answers that
 * must not collapse into one.
 */
export function parseConflictFiles(mergeTreeOutput: string): string[] {
  const lines = mergeTreeOutput.split(/\r?\n/);
  const files: string[] = [];

  // Line 0 is the written tree oid; conflicting paths follow until a blank line.
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "") {
      break;
    }
    files.push(line.trim());
  }

  return files;
}

// ---------------------------------------------------------------------------
// IO layer — every call fail-soft
// ---------------------------------------------------------------------------

function run(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    }).trim();
  } catch (error) {
    // `git merge-tree` exits non-zero *because* there are conflicts, and still
    // writes the file list to stdout. Recover it rather than losing the answer.
    const stdout = (error as { stdout?: string | Buffer })?.stdout;
    if (typeof stdout === "string" && stdout.length > 0) {
      return stdout.trim();
    }
    if (Buffer.isBuffer(stdout) && stdout.length > 0) {
      return stdout.toString("utf8").trim();
    }
    return null;
  }
}

interface RawPr {
  number: number;
  title: string;
  mergeStateStatus: string;
  headRefOid: string;
  autoMergeRequest: { enabledAt: string } | null;
}

function listArmedPrs(): RawPr[] | null {
  const raw = run("gh", [
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,title,mergeStateStatus,headRefOid,autoMergeRequest",
  ]);
  if (raw === null) {
    return null;
  }
  try {
    const all = JSON.parse(raw) as RawPr[];
    return all.filter((pr) => pr.autoMergeRequest !== null);
  } catch {
    return null;
  }
}

function requeryMergeState(prNumber: number): string | null {
  const raw = run("gh", ["pr", "view", String(prNumber), "--json", "mergeStateStatus"]);
  if (raw === null) {
    return null;
  }
  try {
    return (JSON.parse(raw) as { mergeStateStatus: string }).mergeStateStatus;
  } catch {
    return null;
  }
}

function sleep(ms: number): void {
  // Synchronous pause — this is a short-lived CLI probe, not a server.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Re-query any PR reading `UNKNOWN`. GitHub computes mergeability lazily, so a
 * single read is not evidence — see the header note and the measured #1132 /
 * #1166 flap.
 */
function resolveIndeterminate(prs: RawPr[]): RawPr[] {
  const resolved = [...prs];

  for (let attempt = 0; attempt < ARMED_UNKNOWN_REQUERIES; attempt += 1) {
    const pending = resolved.filter((pr) => classifyMergeState(pr.mergeStateStatus) === "indeterminate");
    if (pending.length === 0) {
      break;
    }
    sleep(ARMED_UNKNOWN_REQUERY_DELAY_MS);
    for (const pr of pending) {
      const state = requeryMergeState(pr.number);
      if (state !== null) {
        pr.mergeStateStatus = state;
      }
    }
  }

  return resolved;
}

/**
 * Conflicting file names between `origin/main` and a PR head, computed
 * read-only. `git merge-tree --write-tree` performs the merge in the object
 * database without touching the working tree or the index, so this is safe to
 * run mid-session against a dirty tree.
 */
function conflictFilesFor(headRefOid: string): string[] | null {
  if (run("git", ["cat-file", "-e", `${headRefOid}^{commit}`]) === null) {
    if (run("git", ["fetch", "origin", headRefOid, "--quiet"]) === null) {
      return null;
    }
  }
  const output = run("git", ["merge-tree", "--write-tree", "--name-only", "origin/main", headRefOid]);
  if (output === null) {
    return null;
  }
  return parseConflictFiles(output);
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");

  run("git", ["fetch", "origin", "main", "--quiet"]);

  const raw = listArmedPrs();

  let result: ArmedPrResult;

  if (raw === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub to list open pull requests — merge health not checked.",
      needsChristian: false,
      needsSession: false,
      updateCandidate: null,
      prs: [],
      counts: { drainable: 0, conflicted: 0, waiting: 0, indeterminate: 0 },
    };
  } else {
    const settled = resolveIndeterminate(raw);
    result = classifyArmedPrs({
      nowMs: Date.now(),
      conflictFilesFor,
      prs: settled.map((pr) => ({
        number: pr.number,
        title: pr.title,
        mergeStateStatus: pr.mergeStateStatus as MergeStateStatus,
        enabledAtMs: Date.parse(pr.autoMergeRequest?.enabledAt ?? "") || Date.now(),
        headRefOid: pr.headRefOid,
      })),
    });
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[armed-prs] verdict=${result.verdict} needs-session=${result.needsSession ? "yes" : "no"} ` +
        `needs-christian=${result.needsChristian ? "yes" : "no"}` +
        (result.updateCandidate !== null ? ` update-candidate=#${result.updateCandidate}` : ""),
    );
    console.log(`[armed-prs] ${result.summary}`);
    for (const pr of result.prs) {
      const files = pr.conflictFiles.length > 0 ? ` — conflicts: ${pr.conflictFiles.join(", ")}` : "";
      console.log(
        `[armed-prs]   #${pr.number} ${pr.klass} (${pr.mergeStateStatus}, armed ${pr.armedForMinutes}m` +
          `${pr.escalated ? ", ESCALATED" : ""})${files}`,
      );
    }
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
