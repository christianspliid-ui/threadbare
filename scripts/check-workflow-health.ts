#!/usr/bin/env node

/**
 * Scheduled-workflow health probe (THR-834).
 *
 * Answers one question: **is a scheduled GitHub workflow failing where nobody can see it?**
 *
 * ## Why this exists
 *
 * `Stale Claim Sweep` failed 88 out of 88 runs between 2026-06-13 and 2026-07-26
 * — six weeks, twice daily, deterministically red — and nothing surfaced it. It
 * was found only because an agent went looking with `gh run list`. `Weekly Drift
 * Scan` was the same shape four weeks running (THR-683), also found by accident,
 * also starving a downstream loop (the weekly retro consumes drift-scan issues as
 * its first input) while every surface reported healthy.
 *
 * No lane reads scheduled-workflow conclusions at all. GitHub emails the *actor*
 * on a failed scheduled run, and a scheduled run has no interactive actor, so the
 * mail goes nowhere. `Test · Typecheck · Build` is the only workflow anyone
 * watches, and only because it gates merges. This probe is the missing reader.
 *
 * It is the mirror image of THR-755's vacuous-green class: a gate whose **red**
 * goes unread for 88 runs is exactly as decorative as a gate whose **green** means
 * nothing. The closing question for both is the same — *does anyone read this?*
 *
 * ## The predicate (THR-688 rule A — a membership rule, never a snapshot count)
 *
 * Every workflow in `.github/workflows/` carrying a `schedule:` trigger. As of
 * 2026-08-02 that is `drift-scan.yml` and `stale-claim-sweep.yml`, but the
 * predicate is what binds: the gap applies to every scheduled workflow added
 * later, so the membership is *derived from the tree on every run* rather than
 * listed here. A hardcoded list would rot the first time someone adds a lane —
 * and rot silently, which is the failure this probe exists to end.
 *
 * ## Only `schedule`-event runs are judged
 *
 * A `workflow_dispatch` run is a human poking the workflow by hand. It proves the
 * *code* works; it does not prove the *schedule* fires, and the schedule is the
 * thing that died in both motivating cases. Counting a manual green would let one
 * debugging dispatch mask an unbroken run of scheduled reds — so the probe filters
 * to `event=schedule` and says so in its output.
 *
 * ## Verdicts
 *
 * | verdict     | meaning                                                          | needs a human |
 * |-------------|------------------------------------------------------------------|---------------|
 * | `healthy`   | at least one scheduled run in the window concluded green          | no  |
 * | `all-red`   | every conclusive scheduled run in the window failed (≥ `MIN_RUNS_FOR_ALL_RED`) | **yes** |
 * | `never-run` | no conclusive scheduled run in the window — a fresh lane, not a defect | no  |
 * | `disabled`  | GitHub is not running the schedule at all                         | **yes**, when GitHub disabled it for inactivity |
 * | `unknown`   | the probe could not determine state (network, auth, parse)        | no (fail-soft) |
 *
 * The ticket calls out the three-way split explicitly, and it is the whole
 * subtlety of the probe: a workflow with zero runs is **not** a failure, and
 * GitHub auto-disables schedules on repos idle for 60 days — which, collapsed
 * into a two-way green/red split, would read as a silent all-red and train the
 * reader to ignore the alarm.
 *
 * ## Why the window is a run count, not a duration
 *
 * `WORKFLOW_RUN_LOOKBACK` counts runs, not days. A duration window cannot serve a
 * weekly lane and a twice-daily lane at once: 48 hours is six slots for one and
 * zero for the other. "The last N scheduled runs were all red" is meaningful at
 * any cadence.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped. A network failure, a missing `gh`, an
 * unreadable workflow directory, or an unparseable response all degrade to
 * `unknown` and exit 0. This probe must never be the reason an hourly brief fails.
 *
 * Usage:
 *   npm run check:workflows                  # advisory; always exits 0
 *   npm run check:workflows -- --strict      # exits 1 when a human is needed
 *   npm run check:workflows -- --json        # machine-readable single-line JSON
 *   npm run check:workflows -- --before <ISO> # judge only runs created before <ISO>
 *
 * `--before` exists so the probe can be pointed at a known-red history to prove it
 * actually fires (THR-834's Done-when). See the verification note in
 * `Docs/plans/2026-08-02-scheduled-workflow-health-signal.md`.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/** GitHub `owner/repo` whose Actions history is read. */
export const GH_REPO = "christianspliid-ui/threadbare";

/** Directory scanned for the membership predicate. */
export const WORKFLOW_DIR = ".github/workflows";

/**
 * How many recent **scheduled** runs of each workflow to judge. Five spans five
 * weeks for a weekly lane and two and a half days for a twice-daily one — long
 * enough that a single flake cannot dominate, short enough that a recovery clears
 * the alarm promptly.
 */
export const WORKFLOW_RUN_LOOKBACK = 5;

/**
 * How many conclusive runs must be present before an unbroken run of failures is
 * called `all-red`. At 1 every isolated flake would page a human; at 2 a lane has
 * to fail twice running, which for both motivating cases still fires inside the
 * first day (twice-daily) or the first fortnight (weekly) instead of six weeks
 * and four weeks respectively.
 */
export const MIN_RUNS_FOR_ALL_RED = 2;

/** Run conclusions that count as a failure. */
export const RED_CONCLUSIONS: ReadonlySet<string> = new Set([
  "failure",
  "timed_out",
  "startup_failure",
]);

/** Run conclusions that count as a success. */
export const GREEN_CONCLUSIONS: ReadonlySet<string> = new Set(["success"]);

/**
 * Workflow `state` values GitHub reports when it is not running the schedule.
 * `disabled_inactivity` is the dangerous one — GitHub turns schedules off on
 * repos with no activity for 60 days, and nothing announces it.
 */
export const DISABLED_STATES: ReadonlySet<string> = new Set([
  "disabled_manually",
  "disabled_inactivity",
]);

/**
 * Post-merge lanes (THR-1384). A workflow that runs on `push` to `main` — the
 * heavy simulation tests, moved off the required check because they were 89% of
 * its CPU — has no merge to block, so its red has to be *read* or it is the
 * THR-834 shape again. How many recent push runs of each such lane to judge.
 */
export const PUSH_RUN_LOOKBACK = 5;

/**
 * How long a post-merge lane may stay red before it is Christian's problem
 * rather than the next session's. Under this, a red is a line in the briefing's
 * health block and an impediment row — a heavy-only regression on `main` is a
 * follow-up PR, which is the trade THR-1384 made deliberately. Past it, nobody
 * has picked the follow-up up, and that is what the `## Needs Christian`
 * section is for.
 */
export const PUSH_LANE_RED_GRACE_HOURS = 24;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowVerdict = "healthy" | "all-red" | "never-run" | "disabled" | "unknown";

/**
 * `red` — the newest conclusive push run failed, less than
 * `PUSH_LANE_RED_GRACE_HOURS` ago; `red-stale` — it has been red longer than that.
 */
export type PushLaneVerdict = "healthy" | "red" | "red-stale" | "never-run" | "unknown";

export interface PushLaneInput {
  /** Display name, e.g. "Heavy simulation tests". */
  name: string;
  /** Basename inside `.github/workflows`, e.g. "heavy-tests.yml". */
  file: string;
  /** Push-to-main runs, newest first. `null` when the fetch failed. */
  runs: WorkflowRunRecord[] | null;
}

export interface PushLaneReport {
  name: string;
  file: string;
  verdict: PushLaneVerdict;
  needsChristian: boolean;
  /** Conclusive runs considered, newest first, as raw conclusions. */
  considered: string[];
  /** When the current unbroken red streak began, or `null` when not red. */
  redSinceMs: number | null;
  /** One plain-language sentence about this lane. */
  detail: string;
}

export interface WorkflowRunRecord {
  conclusion: string | null;
  status: string;
  createdAtMs: number;
}

export interface ScheduledWorkflowInput {
  /** Display name, e.g. "Stale Claim Sweep". */
  name: string;
  /** Basename inside `.github/workflows`, e.g. "stale-claim-sweep.yml". */
  file: string;
  /** GitHub's workflow `state` field, e.g. "active" / "disabled_inactivity". */
  state: string;
  /** Scheduled runs, newest first. `null` when the fetch failed. */
  runs: WorkflowRunRecord[] | null;
}

export interface WorkflowReport {
  name: string;
  file: string;
  verdict: WorkflowVerdict;
  needsChristian: boolean;
  /** Conclusive runs considered, newest first, as raw conclusions. */
  considered: string[];
  /** One plain-language sentence about this workflow. */
  detail: string;
}

export interface WorkflowHealthResult {
  verdict: WorkflowVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Whether this belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /**
   * A post-merge lane is red but still inside its grace period (THR-1384): a
   * session's job, not Christian's — the hourly lane's uniform rule renders it
   * as one § Health line, the same treatment `check:armed-prs` gets.
   */
  needsSession: boolean;
  workflows: WorkflowReport[];
  /** Post-merge lanes, judged on their push-to-main runs (THR-1384). */
  postMerge: PushLaneReport[];
}

/** Worst-first severity, used to fold per-workflow verdicts into one. */
const SEVERITY: Record<WorkflowVerdict, number> = {
  "all-red": 4,
  disabled: 3,
  unknown: 2,
  "never-run": 1,
  healthy: 0,
};

// ---------------------------------------------------------------------------
// Membership predicate — pure, exported, tested
// ---------------------------------------------------------------------------

/**
 * True when a workflow file declares a `schedule:` trigger.
 *
 * Deliberately a narrow text scan rather than a YAML parse: the repo carries no
 * YAML dependency, and this predicate only has to recognise one key. Comments are
 * stripped first so a commented-out `# schedule:` — the exact shape someone leaves
 * behind when they disable a lane — does not read as a live trigger.
 *
 * Requires a `- cron:` entry as well, so an `on:`-block key alone is not enough.
 */
export function hasScheduleTrigger(yamlText: string): boolean {
  const withoutComments = yamlText
    .split("\n")
    .map((line) => (line.trimStart().startsWith("#") ? "" : line))
    .join("\n");

  const scheduleKey = /^[ \t]{0,4}schedule:[ \t]*$/m.test(withoutComments);
  const cronEntry = /^[ \t]*-[ \t]*cron:/m.test(withoutComments);

  return scheduleKey && cronEntry;
}

/**
 * True when a workflow file declares a `push:` trigger on `main` — the
 * post-merge lane predicate (THR-1384). Same narrow text scan, same
 * comment-stripping, for the same reasons. Requires the `push:` key *and* a
 * `branches:` entry naming `main` (flow or block form), so a workflow that
 * pushes on every branch, or one that only lists `push` under `paths`, does not
 * read as a post-merge lane.
 */
export function hasPushMainTrigger(yamlText: string): boolean {
  const withoutComments = yamlText
    .split("\n")
    .map((line) => (line.trimStart().startsWith("#") ? "" : line))
    .join("\n");

  const pushKey = /^[ \t]{0,4}push:[ \t]*$/m.test(withoutComments);
  const mainInFlow = /^[ \t]*branches:[ \t]*\[[^\]]*\bmain\b[^\]]*\]/m.test(withoutComments);
  const mainInBlock = /^[ \t]*branches:[ \t]*\n(?:[ \t]*-[ \t]*['"]?[\w./*-]+['"]?[ \t]*\n)*?[ \t]*-[ \t]*['"]?main['"]?[ \t]*$/m.test(
    withoutComments,
  );

  return pushKey && (mainInFlow || mainInBlock);
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

function classifyOne(workflow: ScheduledWorkflowInput): WorkflowReport {
  const { name, file, state, runs } = workflow;

  // 1. GitHub is not running the schedule. Outranks run history — an inactive
  //    workflow's last runs may all be green and mean nothing.
  if (DISABLED_STATES.has(state)) {
    const byInactivity = state === "disabled_inactivity";
    return {
      name,
      file,
      verdict: "disabled",
      // A manual disable was somebody's decision; an inactivity disable is a
      // surprise nobody chose and nothing else reports.
      needsChristian: byInactivity,
      considered: [],
      detail: byInactivity
        ? `"${name}" has been switched off automatically by GitHub after a long quiet period. It will not run again until it is switched back on.`
        : `"${name}" is switched off. Nothing is scheduled to run it.`,
    };
  }

  if (runs === null) {
    return {
      name,
      file,
      verdict: "unknown",
      needsChristian: false,
      considered: [],
      detail: `Could not read the run history for "${name}".`,
    };
  }

  const considered = runs
    .filter((r) => r.status === "completed" && typeof r.conclusion === "string")
    .map((r) => r.conclusion as string)
    .filter((c) => RED_CONCLUSIONS.has(c) || GREEN_CONCLUSIONS.has(c));

  // 2. Nothing conclusive to judge. A freshly added weekly lane is not a defect,
  //    and neither is a window full of cancelled runs.
  if (considered.length === 0) {
    return {
      name,
      file,
      verdict: "never-run",
      needsChristian: false,
      considered,
      detail: `"${name}" has not completed a scheduled run yet, so there is nothing to judge.`,
    };
  }

  const reds = considered.filter((c) => RED_CONCLUSIONS.has(c));

  // 3. Every conclusive run failed, and there are enough of them to rule out a flake.
  if (reds.length === considered.length && considered.length >= MIN_RUNS_FOR_ALL_RED) {
    return {
      name,
      file,
      verdict: "all-red",
      needsChristian: true,
      considered,
      detail:
        `"${name}" has failed every one of its last ${considered.length} scheduled runs. ` +
        "It is scheduled, it is starting, and it is breaking every time — so whatever it was supposed to be doing has not happened for a while.",
    };
  }

  return {
    name,
    file,
    verdict: "healthy",
    needsChristian: false,
    considered,
    detail:
      reds.length > 0
        ? `"${name}" is running, with ${reds.length} of its last ${considered.length} scheduled runs failing.`
        : `"${name}" is running normally.`,
  };
}

/**
 * Classify one post-merge lane on its push-to-main runs (THR-1384).
 *
 * The question differs from the scheduled one. A scheduled lane is judged on
 * *how many* recent runs failed, because each run is an independent attempt at
 * the same job. A post-merge lane is judged on *how long* `main` has been red,
 * because every push is a different tree and the newest verdict is the one that
 * describes the code people are building on. So: newest conclusive run green →
 * healthy; red → the unbroken red streak's age against the grace period.
 */
export function classifyPushLane(lane: PushLaneInput, nowMs: number): PushLaneReport {
  const { name, file, runs } = lane;

  if (runs === null) {
    return {
      name,
      file,
      verdict: "unknown",
      needsChristian: false,
      considered: [],
      redSinceMs: null,
      detail: `Could not read the run history for "${name}".`,
    };
  }

  const conclusive = runs.filter(
    (r) =>
      r.status === "completed" &&
      typeof r.conclusion === "string" &&
      (RED_CONCLUSIONS.has(r.conclusion) || GREEN_CONCLUSIONS.has(r.conclusion)),
  );
  const considered = conclusive.map((r) => r.conclusion as string);

  if (conclusive.length === 0) {
    return {
      name,
      file,
      verdict: "never-run",
      needsChristian: false,
      considered,
      redSinceMs: null,
      detail: `"${name}" has not completed a run on main yet, so there is nothing to judge.`,
    };
  }

  if (GREEN_CONCLUSIONS.has(conclusive[0].conclusion as string)) {
    return {
      name,
      file,
      verdict: "healthy",
      needsChristian: false,
      considered,
      redSinceMs: null,
      detail: `"${name}" is green on the latest main.`,
    };
  }

  // Newest is red: walk back to where the streak began.
  let redSinceMs = conclusive[0].createdAtMs;
  for (const r of conclusive) {
    if (!RED_CONCLUSIONS.has(r.conclusion as string)) break;
    redSinceMs = r.createdAtMs;
  }
  const redHours = Math.max(0, (nowMs - redSinceMs) / (60 * 60 * 1000));
  const stale = redHours >= PUSH_LANE_RED_GRACE_HOURS;

  return {
    name,
    file,
    verdict: stale ? "red-stale" : "red",
    needsChristian: stale,
    considered,
    redSinceMs,
    detail: stale
      ? `"${name}" has been failing on main for ${Math.round(redHours)} hours and nobody has picked it up — the code on main has a problem the merge gate does not check.`
      : `"${name}" is red on the latest main (${Math.round(redHours)} h) — a follow-up fix is owed; log it as an impediment row if no session has claimed it.`,
  };
}

/**
 * Classify scheduled-workflow health. Pure: no IO, no clock, no network.
 *
 * Folds per-workflow verdicts into one by worst-severity. `needsChristian` is the
 * disjunction — one dead lane is worth surfacing even when every other is green.
 * Post-merge lanes (THR-1384) fold into the same `needsChristian` and `summary`,
 * so the hourly lane's uniform probe rule reads them without a second branch.
 */
export function classifyWorkflowHealth(
  workflows: ScheduledWorkflowInput[],
  postMergeLanes: PushLaneInput[] = [],
  nowMs: number = Date.now(),
): WorkflowHealthResult {
  const postMerge = postMergeLanes.map((lane) => classifyPushLane(lane, nowMs));
  const postMergeFlagged = postMerge.filter((r) => r.needsChristian);
  const postMergeNoisy = postMerge.filter((r) => !r.needsChristian && r.verdict === "red");

  if (workflows.length === 0) {
    return {
      verdict: "unknown",
      summary: [
        "No scheduled workflows were found, so none could be checked.",
        ...postMergeFlagged.map((r) => r.detail),
        ...postMergeNoisy.map((r) => r.detail),
      ].join(" "),
      needsChristian: postMergeFlagged.length > 0,
      needsSession: postMergeNoisy.length > 0,
      workflows: [],
      postMerge,
    };
  }

  const reports = workflows.map(classifyOne);

  const worst = reports.reduce<WorkflowVerdict>(
    (acc, r) => (SEVERITY[r.verdict] > SEVERITY[acc] ? r.verdict : acc),
    "healthy",
  );

  const needsChristian = reports.some((r) => r.needsChristian) || postMergeFlagged.length > 0;
  const flagged = [...reports.filter((r) => r.needsChristian), ...postMergeFlagged];

  let summary: string;
  if (flagged.length > 0) {
    summary = flagged.map((r) => r.detail).join(" ");
  } else if (worst === "healthy") {
    summary = `All ${reports.length} scheduled background jobs are running normally.`;
  } else {
    summary = reports
      .filter((r) => r.verdict !== "healthy")
      .map((r) => r.detail)
      .join(" ");
  }
  // A recent post-merge red is not an ask, but it is not silence either: the
  // sentence is what the next session logs as the impediment row.
  if (postMergeNoisy.length > 0) {
    summary = `${summary} ${postMergeNoisy.map((r) => r.detail).join(" ")}`.trim();
  }

  return {
    verdict: worst,
    summary,
    needsChristian,
    needsSession: postMergeNoisy.length > 0,
    workflows: reports,
    postMerge,
  };
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

/** Basenames of workflow files in the tree that declare a `schedule:` trigger. */
export function findScheduledWorkflowFiles(repoRoot: string): string[] | null {
  const dir = path.join(repoRoot, WORKFLOW_DIR);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const scheduled: string[] = [];
  for (const entry of entries) {
    if (!/\.ya?ml$/.test(entry)) {
      continue;
    }
    try {
      if (hasScheduleTrigger(fs.readFileSync(path.join(dir, entry), "utf8"))) {
        scheduled.push(entry);
      }
    } catch {
      // Unreadable file — skip it rather than failing the whole probe.
    }
  }
  return scheduled;
}

/** Basenames of workflow files in the tree that declare a `push:` trigger on `main`. */
export function findPushMainWorkflowFiles(repoRoot: string): string[] | null {
  const dir = path.join(repoRoot, WORKFLOW_DIR);
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }

  const lanes: string[] = [];
  for (const entry of entries) {
    if (!/\.ya?ml$/.test(entry)) {
      continue;
    }
    try {
      if (hasPushMainTrigger(fs.readFileSync(path.join(dir, entry), "utf8"))) {
        lanes.push(entry);
      }
    } catch {
      // Unreadable file — skip it rather than failing the whole probe.
    }
  }
  return lanes;
}

interface GhWorkflow {
  name: string;
  path: string;
  state: string;
}

function fetchWorkflows(): GhWorkflow[] | null {
  const body = ghJson<{ workflows?: GhWorkflow[] }>(
    `repos/${GH_REPO}/actions/workflows?per_page=100`,
  );
  return body?.workflows ?? null;
}

function fetchScheduledRuns(file: string, beforeMs: number | null): WorkflowRunRecord[] | null {
  // Over-fetch when a `--before` cutoff is in play: the newest runs get filtered
  // out, so the window has to be refilled from further back.
  const perPage = beforeMs === null ? WORKFLOW_RUN_LOOKBACK : WORKFLOW_RUN_LOOKBACK * 20;

  const body = ghJson<{
    workflow_runs?: Array<{ conclusion: string | null; status: string; created_at: string }>;
  }>(
    `repos/${GH_REPO}/actions/workflows/${file}/runs?event=schedule&per_page=${perPage}`,
  );

  if (!body?.workflow_runs) {
    return null;
  }

  return body.workflow_runs
    .map((r) => ({
      conclusion: r.conclusion,
      status: r.status,
      createdAtMs: Date.parse(r.created_at),
    }))
    .filter((r) => beforeMs === null || r.createdAtMs < beforeMs)
    .slice(0, WORKFLOW_RUN_LOOKBACK);
}

/** Push-to-main runs of one post-merge lane, newest first (THR-1384). */
function fetchPushRuns(file: string, beforeMs: number | null): WorkflowRunRecord[] | null {
  const perPage = beforeMs === null ? PUSH_RUN_LOOKBACK : PUSH_RUN_LOOKBACK * 20;

  const body = ghJson<{
    workflow_runs?: Array<{ conclusion: string | null; status: string; created_at: string }>;
  }>(
    `repos/${GH_REPO}/actions/workflows/${file}/runs?event=push&branch=main&per_page=${perPage}`,
  );

  if (!body?.workflow_runs) {
    return null;
  }

  return body.workflow_runs
    .map((r) => ({
      conclusion: r.conclusion,
      status: r.status,
      createdAtMs: Date.parse(r.created_at),
    }))
    .filter((r) => beforeMs === null || r.createdAtMs < beforeMs)
    .slice(0, PUSH_RUN_LOOKBACK);
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");

  const beforeIndex = argv.indexOf("--before");
  const beforeRaw = beforeIndex >= 0 ? argv[beforeIndex + 1] : undefined;
  const beforeMs = beforeRaw ? Date.parse(beforeRaw) : null;
  if (beforeRaw && Number.isNaN(beforeMs)) {
    console.warn(`[workflow-health] warn: could not parse --before "${beforeRaw}" — ignoring it.`);
  }
  const cutoffMs = beforeMs !== null && !Number.isNaN(beforeMs) ? beforeMs : null;

  const files = findScheduledWorkflowFiles(REPO_ROOT);
  const pushFiles = findPushMainWorkflowFiles(REPO_ROOT) ?? [];
  const registered = fetchWorkflows();

  let result: WorkflowHealthResult;

  if (files === null) {
    result = {
      verdict: "unknown",
      summary: `Could not read ${WORKFLOW_DIR} — scheduled background jobs not checked.`,
      needsChristian: false,
      needsSession: false,
      workflows: [],
      postMerge: [],
    };
  } else if (registered === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub's Actions API — scheduled background jobs not checked.",
      needsChristian: false,
      needsSession: false,
      workflows: [],
      postMerge: [],
    };
  } else {
    const inputs: ScheduledWorkflowInput[] = files.map((file) => {
      const meta = registered.find((w) => path.basename(w.path) === file);
      return {
        name: meta?.name ?? file,
        file,
        state: meta?.state ?? "active",
        runs: DISABLED_STATES.has(meta?.state ?? "active")
          ? []
          : fetchScheduledRuns(file, cutoffMs),
      };
    });

    const postMergeInputs: PushLaneInput[] = pushFiles.map((file) => {
      const meta = registered.find((w) => path.basename(w.path) === file);
      return {
        name: meta?.name ?? file,
        file,
        runs: fetchPushRuns(file, cutoffMs),
      };
    });

    result = classifyWorkflowHealth(inputs, postMergeInputs, cutoffMs ?? Date.now());
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[workflow-health] verdict=${result.verdict} needs-christian=${result.needsChristian ? "yes" : "no"}` +
        (cutoffMs !== null ? ` before=${new Date(cutoffMs).toISOString()}` : ""),
    );
    for (const w of result.workflows) {
      const runs = w.considered.length > 0 ? ` [${w.considered.join(",")}]` : "";
      console.log(`[workflow-health]   ${w.file}: ${w.verdict}${runs}`);
    }
    for (const lane of result.postMerge) {
      const runs = lane.considered.length > 0 ? ` [${lane.considered.join(",")}]` : "";
      console.log(`[workflow-health]   post-merge ${lane.file}: ${lane.verdict}${runs}`);
    }
    console.log(`[workflow-health] ${result.summary}`);
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
