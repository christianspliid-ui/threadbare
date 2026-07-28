#!/usr/bin/env node

/**
 * GitHub Actions health probe — billing-block detector (THR-768).
 *
 * Answers one question: **is the merge gate actually running, or only pretending to?**
 *
 * ## The failure class
 *
 * When the account's Actions budget is exhausted, every workflow run concludes
 * `failure` in 3–5 seconds having executed **zero steps**, carrying GitHub's own
 * annotation:
 *
 * > The job was not started because recent account payments have failed or your
 * > spending limit needs to be increased. Please check the 'Billing & plans'
 * > section in your settings
 *
 * Two consequences, the second far worse than the first:
 *
 * 1. **Finished work strands.** `Linear Auto-Close` never runs, so a correctly
 *    closed ticket sits In Dev holding the WIP=1 slot. A startup-failed run is
 *    never retriggered by anything — see `--recover` below.
 * 2. **Branch protection goes vacuous while still reading as enforced.** When
 *    `Detect code changes` dies at startup, the required `Test · Typecheck ·
 *    Build` check records as `skipped`, and a skipped required check *satisfies*
 *    branch protection. Anything can reach `main` with no test having run.
 *    Reproduced end to end on PR #853 (2026-07-25) and again on PR #1022
 *    (2026-07-28, which carried engine + content changes).
 *
 * The hole at (2) is closed at source by the `Guard — change detection health`
 * step in `.github/workflows/ci.yml`, which turns that `skipped` into a
 * `failure`. This probe is the *other* half: it names the outage, tells the lane
 * to stand down, and cleans up afterwards.
 *
 * ## Why a detector rather than "notice it"
 *
 * The class is trivially machine-detectable — a fixed string — yet it has cost
 * four separate sessions the same manual rediagnosis (impediments #91, #136, and
 * the 2026-07-25 / 2026-07-28 occurrences). Each diagnosis was slow because the
 * signature is **indistinguishable from a transient Actions incident** until you
 * re-run something. That ambiguity has already produced one wrong call, retracted
 * four minutes later (`Design/user-actions.md`, 2026-07-25 15:16).
 *
 * So disambiguation is part of the detector, not left to judgment:
 *
 * | verdict         | meaning                                                                   | needs a human |
 * |-----------------|---------------------------------------------------------------------------|---------------|
 * | `healthy`       | no startup failures in the lookback window                                | no  |
 * | `recovered`     | startup failures in the window, but the newest completed run executed jobs | no  |
 * | `billing-block` | newest run failed at startup **and** a fresh re-run reproduced it          | **yes** |
 * | `transient`     | newest run failed at startup but a fresh re-run executed jobs             | no  |
 * | `unknown`       | probe could not determine state (network, auth, no re-runnable candidate) | no (fail-soft) |
 *
 * `recovered` exists because the cheap check comes first: if the newest completed
 * run executed jobs, the block has already lifted and there is nothing to
 * re-run. Today's occurrence (2026-07-28) recovered at 17:03:03Z between two
 * hourly ticks, so without this verdict the very next tick would have burned a
 * re-run to rediscover a resolved outage.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped; anything unexpected degrades to `unknown` and
 * exits 0. This probe must never be the reason an hourly tick fails.
 *
 * Usage:
 *   npm run check:actions              # advisory; always exits 0
 *   npm run check:actions -- --strict  # exits 1 on billing-block (lane stands down)
 *   npm run check:actions -- --json    # machine-readable single-line JSON
 *   npm run check:actions -- --no-probe  # skip the re-run disambiguator (read-only)
 *   npm run check:actions -- --recover           # LIST auto-close runs stranded by an outage
 *   npm run check:actions -- --recover --apply   # ...and actually re-run them
 */

import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/** GitHub `owner/repo` whose Actions runs describe the merge gate. */
export const GH_REPO = "christianspliid-ui/threadbare";

/** How many recent workflow runs to consider. One hour of this repo's traffic is ~8. */
export const ACTIONS_LOOKBACK = 20;

/**
 * How many of the newest *failed* runs to pull annotations for. Bounds API cost:
 * annotations need one call per job per run, and one confirmed startup failure is
 * as informative as ten.
 */
export const ANNOTATION_INSPECT_LIMIT = 6;

/**
 * A run that concluded `failure` in under this many seconds executed nothing.
 * Real CI here takes 4–12 minutes; the startup failures measured across all four
 * occurrences completed in 3–5s. 60s is far outside both distributions, so it
 * cannot confuse a fast genuine failure with a job that never started.
 *
 * This is only a *candidate* filter — `BILLING_ANNOTATION_PATTERN` is what
 * actually confirms the class.
 */
export const STARTUP_FAILURE_MAX_SECONDS = 60;

/**
 * GitHub's annotation for a budget-exhausted account. Matched loosely (either
 * half suffices) because the wording has drifted slightly between occurrences
 * while both clauses survived.
 */
export const BILLING_ANNOTATION_PATTERN =
  /recent account payments have failed|spending limit needs to be increased/i;

/** Workflow whose stranded runs `--recover` re-runs, and its workflow file. */
export const RECOVERABLE_WORKFLOW = "Linear Auto-Close";
export const RECOVERABLE_WORKFLOW_FILE = "linear-autoclose.yml";

/**
 * How many `RECOVERABLE_WORKFLOW` runs `--recover` scans, and how many of its
 * failures get an annotation lookup.
 *
 * Deliberately wider than `ACTIONS_LOOKBACK` / `ANNOTATION_INSPECT_LIMIT`, and
 * scanned against the workflow directly rather than filtered out of the general
 * run list. Measured 2026-07-28: the general list is interleaved across all
 * workflows, so 20 runs reached back only ~35 minutes and the 6-annotation cap
 * truncated it further — recovery found 3 stranded runs and **missed the one that
 * mattered** (THR-822's own auto-close, 7 runs deep). Under-reporting is harmless
 * for the *verdict* (decided by the newest completed run) but is the whole ball
 * game for recovery, so this path pays for a wider net.
 */
export const RECOVERY_LOOKBACK = 40;

/** How long to wait for a probe re-run to reach a conclusion, and how often to look. */
export const PROBE_TIMEOUT_SECONDS = 90;
export const PROBE_POLL_INTERVAL_SECONDS = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionsVerdict = "healthy" | "recovered" | "billing-block" | "transient" | "unknown";

export interface WorkflowRunRecord {
  id: number;
  workflowName: string;
  /** `null` while the run is still in flight. */
  conclusion: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  /**
   * True when this run concluded `failure` having executed nothing, with the
   * billing annotation present. Resolved by the IO layer so the classifier stays
   * pure.
   */
  startupFailure: boolean;
}

/** Outcome of re-running one startup-failed workflow. */
export type ProbeOutcome =
  /** The fresh run also died at startup — the block is live. */
  | "reproduced"
  /** The fresh run executed jobs — the earlier failure was transient. */
  | "executed"
  /** Could not re-run or could not read the result. */
  | "unavailable";

export interface ActionsHealthInput {
  /** Recent workflow runs, newest first. */
  runs: WorkflowRunRecord[];
  /**
   * Re-run disambiguator. Called at most once, and only when the newest
   * completed run died at startup. Injected so tests are pure (NFP #3).
   */
  probe: (run: WorkflowRunRecord) => ProbeOutcome;
}

export interface ActionsHealthResult {
  verdict: ActionsVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Whether this belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /**
   * Whether the executor lane should decline to claim new implementation work.
   * True only while the gate is *actively* vacuous — a recovered or transient
   * window does not stand the lane down.
   */
  standDown: boolean;
  /** Startup-failed runs seen in the lookback window. */
  startupFailureCount: number;
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

/**
 * Classify Actions health. Pure: no IO, no clock, no `gh`.
 *
 * Order matters, and the cheap checks come first deliberately. The probe costs a
 * real re-run plus up to `PROBE_TIMEOUT_SECONDS` of waiting, so it fires only
 * when the newest completed run actually died at startup — i.e. when the outage
 * still looks live.
 */
export function classifyActionsHealth(input: ActionsHealthInput): ActionsHealthResult {
  const { runs, probe } = input;

  const startupFailures = runs.filter((r) => r.startupFailure);
  const startupFailureCount = startupFailures.length;

  if (runs.length === 0) {
    return {
      verdict: "unknown",
      summary: "No recent workflow runs were visible — could not tell whether the merge gate is running.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
    };
  }

  if (startupFailureCount === 0) {
    return {
      verdict: "healthy",
      summary: "Automated checks are running normally.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
    };
  }

  // Newest run that actually reached a conclusion. In-flight runs tell us nothing
  // either way, so they are skipped rather than treated as healthy.
  const newestCompleted = runs.find((r) => r.conclusion !== null);

  if (!newestCompleted) {
    return {
      verdict: "unknown",
      summary:
        `${startupFailureCount} recent check run(s) failed without starting, and every newer run is still in progress — ` +
        "the outcome is not yet readable.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
    };
  }

  // Cheapest decisive signal: the newest completed run executed jobs, so whatever
  // caused the earlier failures is over. No re-run needed.
  if (!newestCompleted.startupFailure) {
    return {
      verdict: "recovered",
      summary:
        `Automated checks are running again. ${startupFailureCount} run(s) earlier failed without starting, ` +
        "but the most recent one completed normally, so the problem has cleared on its own.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
    };
  }

  // The newest completed run died at startup. Disambiguate: a genuine transient
  // resumes, a billing block reproduces in seconds.
  const outcome = probe(newestCompleted);

  if (outcome === "reproduced") {
    return {
      verdict: "billing-block",
      summary:
        "GitHub has stopped running our automated checks because the account's build budget is exhausted. " +
        "Nothing can be safely merged until it is topped up — the safety checks look like they passed but never actually ran. " +
        "This one needs you: it is fixed under Billing & plans in the GitHub account settings.",
      needsChristian: true,
      standDown: true,
      startupFailureCount,
    };
  }

  if (outcome === "executed") {
    return {
      verdict: "transient",
      summary:
        `${startupFailureCount} recent check run(s) failed without starting, but a fresh run executed normally — ` +
        "this was a temporary GitHub hiccup, not a billing block. No action needed.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
    };
  }

  return {
    verdict: "unknown",
    summary:
      `${startupFailureCount} recent check run(s) failed without starting, but the follow-up check could not be completed, ` +
      "so it is unclear whether this is a billing block or a temporary glitch.",
    needsChristian: false,
    standDown: false,
    startupFailureCount,
  };
}

/**
 * Whether a failed run's shape and annotations mark it as "never started".
 *
 * Both halves are required. Duration alone would misread a genuinely fast
 * failure; the annotation alone would be enough in principle, but the duration
 * filter is what keeps the annotation lookup bounded to a handful of candidates.
 */
export function isStartupFailure(args: {
  conclusion: string | null;
  durationSeconds: number;
  annotations: string[];
}): boolean {
  if (args.conclusion !== "failure") {
    return false;
  }
  if (args.durationSeconds > STARTUP_FAILURE_MAX_SECONDS) {
    return false;
  }
  return args.annotations.some((a) => BILLING_ANNOTATION_PATTERN.test(a));
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
  } catch {
    return null;
  }
}

function ghJson<T>(endpoint: string): T | null {
  const raw = run("gh", ["api", endpoint]);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Annotation messages for every job in a run.
 *
 * `gh run view --log-failed` returns `log not found` for a startup failure — no
 * log is ever produced because no step ran, and that emptiness reads like a
 * tooling error rather than a diagnosis. The reason lives *only* here, on the
 * check-run annotations endpoint. Recorded because the obvious command is a dead
 * end (THR-768 comment, 2026-07-28).
 */
function fetchRunAnnotations(runId: number): string[] {
  const jobs = ghJson<{ jobs: Array<{ id: number }> }>(
    `repos/${GH_REPO}/actions/runs/${runId}/jobs`,
  );
  if (!jobs?.jobs) {
    return [];
  }
  const messages: string[] = [];
  for (const job of jobs.jobs) {
    const annotations = ghJson<Array<{ message?: string }>>(
      `repos/${GH_REPO}/check-runs/${job.id}/annotations`,
    );
    for (const a of annotations ?? []) {
      if (a.message) {
        messages.push(a.message);
      }
    }
  }
  return messages;
}

interface RawRun {
  databaseId: number;
  workflowName: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
}

function fetchRuns(): WorkflowRunRecord[] | null {
  const raw = run("gh", [
    "run",
    "list",
    "--limit",
    String(ACTIONS_LOOKBACK),
    "--json",
    "databaseId,workflowName,conclusion,createdAt,updatedAt",
  ]);
  if (raw === null) {
    return null;
  }

  let parsed: RawRun[];
  try {
    parsed = JSON.parse(raw) as RawRun[];
  } catch {
    return null;
  }

  // Annotation lookups are the expensive part, so only the newest few failures
  // get one; older failures keep startupFailure=false, which at worst
  // under-reports the count in the summary and never changes the verdict (the
  // verdict is decided by the newest completed run).
  let inspected = 0;

  return parsed.map((r) => {
    const createdAtMs = Date.parse(r.createdAt);
    const updatedAtMs = Date.parse(r.updatedAt);
    const durationSeconds = (updatedAtMs - createdAtMs) / 1000;

    let startupFailure = false;
    if (
      r.conclusion === "failure" &&
      durationSeconds <= STARTUP_FAILURE_MAX_SECONDS &&
      inspected < ANNOTATION_INSPECT_LIMIT
    ) {
      inspected += 1;
      startupFailure = isStartupFailure({
        conclusion: r.conclusion,
        durationSeconds,
        annotations: fetchRunAnnotations(r.databaseId),
      });
    }

    return {
      id: r.databaseId,
      workflowName: r.workflowName,
      conclusion: r.conclusion,
      createdAtMs,
      updatedAtMs,
      startupFailure,
    };
  });
}

function sleepSeconds(seconds: number): void {
  // Synchronous by design — this script is a linear probe, not an event loop,
  // and Atomics.wait is the only dependency-free blocking sleep in Node.
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, seconds * 1000);
}

/**
 * Re-run one startup-failed workflow and report whether it reproduced.
 *
 * This is the disambiguator the ticket insists must be mechanical rather than a
 * judgment call: a transient resumes, a billing block dies again in ~3 seconds
 * with the same annotation.
 */
function probeByRerun(target: WorkflowRunRecord): ProbeOutcome {
  if (run("gh", ["run", "rerun", String(target.id)]) === null) {
    return "unavailable";
  }

  const deadline = Date.now() + PROBE_TIMEOUT_SECONDS * 1000;

  while (Date.now() < deadline) {
    sleepSeconds(PROBE_POLL_INTERVAL_SECONDS);

    const fresh = ghJson<{ conclusion: string | null; run_started_at: string; updated_at: string }>(
      `repos/${GH_REPO}/actions/runs/${target.id}`,
    );
    if (!fresh || fresh.conclusion === null) {
      continue;
    }

    if (fresh.conclusion !== "failure") {
      return "executed";
    }

    const durationSeconds = (Date.parse(fresh.updated_at) - Date.parse(fresh.run_started_at)) / 1000;
    return isStartupFailure({
      conclusion: fresh.conclusion,
      durationSeconds,
      annotations: fetchRunAnnotations(target.id),
    })
      ? "reproduced"
      : "executed";
  }

  return "unavailable";
}

/**
 * Startup-failed runs of the recoverable workflow, newest first.
 *
 * Queried against the workflow file directly — not filtered out of the general
 * run list — so the window is measured in *auto-close runs* rather than in
 * whatever else happened to run alongside them.
 */
function fetchStrandedAutoCloseRuns(): WorkflowRunRecord[] | null {
  const raw = run("gh", [
    "run",
    "list",
    "--workflow",
    RECOVERABLE_WORKFLOW_FILE,
    "--limit",
    String(RECOVERY_LOOKBACK),
    "--json",
    "databaseId,workflowName,conclusion,createdAt,updatedAt",
  ]);
  if (raw === null) {
    return null;
  }

  let parsed: RawRun[];
  try {
    parsed = JSON.parse(raw) as RawRun[];
  } catch {
    return null;
  }

  const stranded: WorkflowRunRecord[] = [];

  for (const r of parsed) {
    if (r.conclusion !== "failure") {
      continue;
    }
    const createdAtMs = Date.parse(r.createdAt);
    const updatedAtMs = Date.parse(r.updatedAt);
    const durationSeconds = (updatedAtMs - createdAtMs) / 1000;
    if (durationSeconds > STARTUP_FAILURE_MAX_SECONDS) {
      continue;
    }
    if (
      !isStartupFailure({
        conclusion: r.conclusion,
        durationSeconds,
        annotations: fetchRunAnnotations(r.databaseId),
      })
    ) {
      continue;
    }
    stranded.push({
      id: r.databaseId,
      workflowName: r.workflowName,
      conclusion: r.conclusion,
      createdAtMs,
      updatedAtMs,
      startupFailure: true,
    });
  }

  return stranded;
}

/**
 * Scope item 5 — recovery.
 *
 * A startup-failed run is never retriggered by anything, so every `Linear
 * Auto-Close` run that died during an outage leaves its ticket stranded In Dev
 * holding the WIP=1 slot.
 *
 * `--recover` lists; `--recover --apply` re-runs. Dry by default because this is
 * the one path in the probe that mutates CI state — re-running is idempotent (the
 * workflow skips issues already closed), but a script that fires workflows should
 * say so before it does it.
 */
function recoverStrandedAutoCloses(apply: boolean): void {
  const stranded = fetchStrandedAutoCloseRuns();

  if (stranded === null) {
    console.log(`[actions-health] recover: could not list ${RECOVERABLE_WORKFLOW} runs — skipped.`);
    return;
  }

  if (stranded.length === 0) {
    console.log(
      `[actions-health] recover: no stranded ${RECOVERABLE_WORKFLOW} runs in the last ${RECOVERY_LOOKBACK}.`,
    );
    return;
  }

  console.log(
    `[actions-health] recover: ${stranded.length} stranded ${RECOVERABLE_WORKFLOW} run(s)` +
      (apply ? " — re-running." : " — pass --apply to re-run them."),
  );

  for (const r of stranded) {
    if (!apply) {
      console.log(`[actions-health]   ${r.id} (would re-run)`);
      continue;
    }
    const ok = run("gh", ["run", "rerun", String(r.id)]) !== null;
    console.log(`[actions-health]   ${r.id} ${ok ? "re-run queued" : "re-run FAILED"}`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");
  const noProbe = argv.includes("--no-probe");
  const recover = argv.includes("--recover");
  const apply = argv.includes("--apply");

  const runs = fetchRuns();

  let result: ActionsHealthResult;

  if (runs === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub Actions — merge-gate health not checked.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
    };
  } else {
    result = classifyActionsHealth({
      runs,
      probe: noProbe ? () => "unavailable" : probeByRerun,
    });
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[actions-health] verdict=${result.verdict} needs-christian=${result.needsChristian ? "yes" : "no"} ` +
        `stand-down=${result.standDown ? "yes" : "no"} startup-failures=${result.startupFailureCount}`,
    );
    console.log(`[actions-health] ${result.summary}`);
  }

  if (recover) {
    recoverStrandedAutoCloses(apply);
  }

  process.exit(strict && result.standDown ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
