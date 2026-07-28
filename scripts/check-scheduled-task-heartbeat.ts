#!/usr/bin/env node

/**
 * Scheduled-task stall detector (THR-837).
 *
 * Answers one question: **has a scheduled lane gone quiet while its siblings kept running?**
 *
 * ## Why this exists
 *
 * On 2026-07-27T20:27:07Z the `tb-orchestrator` run was dispatched in
 * `permissionMode: "default"` and issued a `Bash` call that matched no allow rule.
 * With no user present to answer the prompt, the call blocked. The run did not
 * crash — it stayed **alive and idle for 10h49m** (the transcript shows a single
 * 649.5-minute gap between one tool result and the next), and the scheduler will
 * not dispatch a second run of a task whose previous run is still alive. So
 * eleven consecutive `:26` slots were skipped, `lastRunAt` froze at 20:27:02, and
 * nothing anywhere said a word. The lane that decides what happens next had
 * stopped deciding, and its failure mode was indistinguishable from "nothing to
 * decide."
 *
 * The permission-mode hang itself is fixed (all lanes now run
 * `bypassPermissions`), but that setting lives in the desktop app, outside this
 * repo — nothing versioned here would notice it reverting. This probe is the
 * detector, not the fix: it makes the *next* silence loud, whatever causes it.
 *
 * ## The predicate (THR-688 rule A — a membership rule, never a snapshot count)
 *
 * A task is **stalled** when all of these hold:
 *
 * 1. it is `enabled` and has a recurring `cronExpression`;
 * 2. its `lastRunAt` is more than `STALL_SLOT_THRESHOLD` cron slots behind now;
 * 3. a **sibling** — another enabled task whose slot is no longer than this one's
 *    — fired inside that same window.
 *
 * Clause 3 is what separates a genuine lane stall from a machine that was simply
 * asleep or powered off. If every task is equally behind, nothing is flagged:
 * that is a quiet machine, not a broken lane. It is also why this cannot be
 * replaced by a simple "last run older than N hours" alarm, which would page on
 * every overnight shutdown.
 *
 * ## Verdicts
 *
 * | verdict    | meaning                                                        | needs a human |
 * |------------|----------------------------------------------------------------|---------------|
 * | `ok`       | no enabled task is behind its siblings                          | no  |
 * | `stalled`  | one or more tasks match the predicate above                     | **yes** |
 * | `unknown`  | input missing or unparseable                                    | no (fail-soft) |
 *
 * A task that has never run (`lastRunAt` absent) is reported as `neverRun`
 * context, not a stall — a freshly registered monthly task is not a defect.
 *
 * ## Fail-soft (NFP #4)
 *
 * Unparseable input, an unrecognised cron shape, or a bad timestamp degrade to
 * `unknown`/skipped and exit 0. This probe must never be the reason an hourly
 * brief fails.
 *
 * ## Usage
 *
 * `list_scheduled_tasks` is an MCP tool, so its JSON has to be handed in rather
 * than fetched here:
 *
 *   node --experimental-strip-types scripts/check-scheduled-task-heartbeat.ts --input tasks.json
 *   cat tasks.json | npm run check:task-heartbeat --silent -- --json
 *   npm run check:task-heartbeat --silent -- --input tasks.json --now 2026-07-28T07:24:00Z
 *
 * Flags: `--input <path>` (default stdin) · `--json` · `--strict` (exit 1 when a
 * human is needed) · `--now <iso>` (deterministic override for tests).
 */

import fs from "node:fs";

// --- Tunable constants (NFP #1) -------------------------------------------

/** Slots a task may fall behind before it counts as stalled. */
const STALL_SLOT_THRESHOLD = 2;

/** Cron slot lengths, in seconds. */
const SLOT_SECONDS = {
  hourly: 3600,
  daily: 86400,
  weekly: 604800,
  monthly: 2592000,
} as const;

type Cadence = keyof typeof SLOT_SECONDS;

// --- Types -----------------------------------------------------------------

interface ScheduledTask {
  taskId?: string;
  enabled?: boolean;
  cronExpression?: string;
  lastRunAt?: string;
  description?: string;
}

interface StallFinding {
  taskId: string;
  cadence: Cadence;
  slotsBehind: number;
  lastRunAt: string;
  witness: string;
}

export interface HeartbeatResult {
  verdict: "ok" | "stalled" | "unknown";
  needsChristian: boolean;
  checked: number;
  stalled: StallFinding[];
  neverRun: string[];
  summary: string;
}

// --- Cron cadence ----------------------------------------------------------

/**
 * Classify a 5-field cron expression (`min hour dom mon dow`) into a cadence.
 *
 * Deliberately coarse: the probe only needs the slot *length* to count how far
 * behind a task is, not the exact next-fire time. An unrecognised shape returns
 * null and the task is skipped rather than guessed at.
 */
export function cadenceOf(cron: string | undefined): Cadence | null {
  if (!cron) return null;
  const f = cron.trim().split(/\s+/);
  if (f.length !== 5) return null;
  const [, hour, dom, , dow] = f;
  if (hour === "*") return "hourly";
  if (dow !== "*") return "weekly";
  if (dom !== "*") return "monthly";
  return "daily";
}

// --- Core evaluation -------------------------------------------------------

export function evaluate(tasks: ScheduledTask[], nowMs: number): HeartbeatResult {
  const active = tasks.filter((t) => t.enabled === true && cadenceOf(t.cronExpression));

  const neverRun: string[] = [];
  type Row = { task: ScheduledTask; cadence: Cadence; lastMs: number; slot: number };
  const rows: Row[] = [];

  for (const task of active) {
    const cadence = cadenceOf(task.cronExpression)!;
    if (!task.lastRunAt) {
      neverRun.push(task.taskId ?? "(unnamed)");
      continue;
    }
    const lastMs = Date.parse(task.lastRunAt);
    if (Number.isNaN(lastMs)) continue; // fail-soft: unreadable timestamp
    rows.push({ task, cadence, lastMs, slot: SLOT_SECONDS[cadence] * 1000 });
  }

  const stalled: StallFinding[] = [];

  for (const row of rows) {
    const behindMs = nowMs - row.lastMs;
    const slotsBehind = behindMs / row.slot;
    if (slotsBehind <= STALL_SLOT_THRESHOLD) continue;

    // Sibling clause: someone with an equal-or-tighter cadence ran inside the
    // window this task missed. Without it, a powered-off machine reads as a
    // fleet of broken lanes.
    const windowStart = nowMs - STALL_SLOT_THRESHOLD * row.slot;
    const witness = rows.find(
      (o) => o !== row && o.slot <= row.slot && o.lastMs > windowStart,
    );
    if (!witness) continue;

    stalled.push({
      taskId: row.task.taskId ?? "(unnamed)",
      cadence: row.cadence,
      slotsBehind: Math.floor(slotsBehind),
      lastRunAt: row.task.lastRunAt!,
      witness: witness.task.taskId ?? "(unnamed)",
    });
  }

  stalled.sort((a, b) => b.slotsBehind - a.slotsBehind);

  const summary =
    stalled.length === 0
      ? `All ${rows.length} enabled scheduled tasks are within ${STALL_SLOT_THRESHOLD} slots of schedule.`
      : stalled
          .map(
            (s) =>
              `${s.taskId} has not run since ${s.lastRunAt} — ${s.slotsBehind}+ ${s.cadence} slots behind, ` +
              `while ${s.witness} kept firing. The lane is stalled, not idle.`,
          )
          .join(" ");

  return {
    verdict: stalled.length === 0 ? "ok" : "stalled",
    needsChristian: stalled.length > 0,
    checked: rows.length,
    stalled,
    neverRun,
    summary,
  };
}

// --- CLI -------------------------------------------------------------------

function unknown(reason: string): HeartbeatResult {
  return {
    verdict: "unknown",
    needsChristian: false,
    checked: 0,
    stalled: [],
    neverRun: [],
    summary: `Heartbeat probe could not run: ${reason}`,
  };
}

function readInput(argv: string[]): string | null {
  const i = argv.indexOf("--input");
  try {
    if (i !== -1 && argv[i + 1]) return fs.readFileSync(argv[i + 1], "utf8");
    return fs.readFileSync(0, "utf8");
  } catch {
    return null;
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");
  const nowIdx = argv.indexOf("--now");
  const nowMs =
    nowIdx !== -1 && argv[nowIdx + 1] ? Date.parse(argv[nowIdx + 1]) : Date.now();

  let result: HeartbeatResult;
  const raw = readInput(argv);

  if (raw === null || raw.trim() === "") {
    result = unknown("no input (pass --input <path> or pipe list_scheduled_tasks JSON)");
  } else if (Number.isNaN(nowMs)) {
    result = unknown("unparseable --now value");
  } else {
    try {
      const parsed = JSON.parse(raw);
      const tasks: ScheduledTask[] = Array.isArray(parsed) ? parsed : parsed.tasks;
      result = Array.isArray(tasks)
        ? evaluate(tasks, nowMs)
        : unknown("input JSON is not an array of tasks");
    } catch (e) {
      result = unknown(`unparseable input JSON (${(e as Error).message})`);
    }
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`verdict: ${result.verdict}`);
    console.log(result.summary);
    if (result.neverRun.length > 0) {
      console.log(`never run (not a stall): ${result.neverRun.join(", ")}`);
    }
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

// Only run the CLI when invoked directly, so the test can import the pure
// functions without the process exiting underneath it.
if (process.argv[1] && process.argv[1].includes("check-scheduled-task-heartbeat")) {
  main();
}
