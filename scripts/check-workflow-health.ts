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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowVerdict = "healthy" | "all-red" | "never-run" | "disabled" | "unknown";

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
  workflows: WorkflowReport[];
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
 * Classify scheduled-workflow health. Pure: no IO, no clock, no network.
 *
 * Folds per-workflow verdicts into one by worst-severity. `needsChristian` is the
 * disjunction — one dead lane is worth surfacing even when every other is green.
 */
export function classifyWorkflowHealth(
  workflows: ScheduledWorkflowInput[],
): WorkflowHealthResult {
  if (workflows.length === 0) {
    return {
      verdict: "unknown",
      summary: "No scheduled workflows were found, so none could be checked.",
      needsChristian: false,
      workflows: [],
    };
  }

  const reports = workflows.map(classifyOne);

  const worst = reports.reduce<WorkflowVerdict>(
    (acc, r) => (SEVERITY[r.verdict] > SEVERITY[acc] ? r.verdict : acc),
    "healthy",
  );

  const needsChristian = reports.some((r) => r.needsChristian);
  const flagged = reports.filter((r) => r.needsChristian);

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

  return { verdict: worst, summary, needsChristian, workflows: reports };
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
  const registered = fetchWorkflows();

  let result: WorkflowHealthResult;

  if (files === null) {
    result = {
      verdict: "unknown",
      summary: `Could not read ${WORKFLOW_DIR} — scheduled background jobs not checked.`,
      needsChristian: false,
      workflows: [],
    };
  } else if (registered === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub's Actions API — scheduled background jobs not checked.",
      needsChristian: false,
      workflows: [],
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

    result = classifyWorkflowHealth(inputs);
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
    console.log(`[workflow-health] ${result.summary}`);
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
