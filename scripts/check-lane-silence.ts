#!/usr/bin/env node

/**
 * Fleet-wide scheduled-lane silence detector (THR-1001).
 *
 * Answers the one question `check:task-heartbeat` structurally cannot:
 * **did the whole fleet stop, and was that on purpose?**
 *
 * ## Why a second probe rather than a wider first one
 *
 * `check-scheduled-task-heartbeat.ts` (THR-837) declares a lane stalled only when
 * a *sibling* of equal-or-tighter cadence kept firing. That clause is correct and
 * load-bearing for its question — without it a powered-down machine reads as a
 * fleet of broken lanes. But it means a silence that takes down **every** lane at
 * once has, by construction, no witness, and is reported `ok`. That is exactly the
 * 2026-08-03 → 08-05 gap: 62 hours, all three hourly lanes, and its own test
 * (`"stays silent when the whole machine was off"`) asserts the silence. Widening
 * that predicate would break the guard it exists to be. So: two probes, two
 * questions.
 *
 * ## Why commit history, not `lastRunAt`
 *
 * The ticket's cheap first cut was to compare `lastRunAt` against `nextRunAt`.
 * That signal is unusable at precisely this boundary. On resume the scheduler
 * fires a catch-up burst and every lane's `lastRunAt` lands within milliseconds of
 * the wake — measured 2026-07-31, a Monday-only weekly task reported a Friday
 * afternoon `lastRunAt` inside a 36 ms window with two hourly lanes. `lastRunAt`
 * is a wake stamp, not a run, so at the first post-pause run every lane looks
 * current and the gap that just happened is invisible.
 *
 * Commits are stamped when the work happened and no wake rewrites them. `origin/ops`
 * is exclusively lane exhaust (THR-947) and `origin/main` carries shipped work, so
 * the union of their commit timestamps is the durable record of "the fleet produced
 * something". A human commit on `main` also counts as activity — it over-counts
 * rather than under-counts, which is the right failure direction for an alarm.
 *
 * ## Detection is retrospective, and that is the honest ceiling
 *
 * This probe runs inside `keep-work-flowing-cc`, which is one of the lanes that
 * goes silent. When the fleet is down, nothing runs it. So it cannot page *during*
 * an outage — it reports on the first run after resumption, and on every run while
 * a partial silence is ongoing. The win is resolution, not immediacy: a repeat is
 * caught within `SILENCE_THRESHOLD_HOURS` of the fleet coming back rather than
 * whenever the next weekly retro happens to look. A watchdog that lives outside the
 * fleet (Task Scheduler, a GitHub Action) would be needed for true during-outage
 * paging; that is deliberately not attempted here.
 *
 * ## Verdicts
 *
 * | verdict       | meaning                                                        | needs a human |
 * |---------------|----------------------------------------------------------------|---------------|
 * | `active`      | no silence past threshold inside the lookback                   | no  |
 * | `silent`      | the fleet is quiet right now, past threshold, no marker covers it | **yes** |
 * | `paused`      | quiet right now, and a pause marker covers it                   | no  |
 * | `recovered`   | a past silence past threshold, uncovered — the retrospective outage report | **yes** |
 * | `pause-stale` | a marker is active but the lanes have been writing again        | **yes** (housekeeping) |
 * | `unknown`     | git unavailable or unreadable                                   | no (fail-soft) |
 *
 * ## Usage
 *
 *   npm run check:lane-silence --silent -- --json
 *   npm run check:lane-silence -- --now 2026-08-05T12:00:00Z --no-fetch
 *
 * Flags: `--json` · `--strict` (exit 1 when a human is needed) · `--now <iso>`
 * (deterministic override) · `--no-fetch` (skip the refresh; use local refs) ·
 * `--pause-marker <path>` (override the marker location).
 */

import { execFileSync } from "node:child_process";
import {
  describePause,
  isPauseActive,
  pauseCoversGap,
  readPauseMarker,
  type PauseMarker,
} from "./pause-marker.ts";

// --- Tunable constants (NFP #1) -------------------------------------------

/**
 * Hours of fleet-wide quiet before it counts as a silence.
 *
 * Measured on `origin/ops` across 2026-08-02 → 08-06: writes land every ~30–60
 * minutes around the clock, and the largest *healthy* gap in that sample was
 * **3h00m** (08-02 11:30 → 14:30). The incident this probe exists for was 62h.
 * Six hours is twice the observed healthy maximum and a tenth of the incident —
 * wide enough that ordinary quiet never trips it, tight enough that a repeat is
 * caught the same morning instead of the next weekly retro.
 */
const SILENCE_THRESHOLD_HOURS = 6;

/** How far back to scan for a completed silence. One week matches the retro cadence that used to be the only detector. */
const LOOKBACK_HOURS = 168;

/** A marker still set after the lanes have been writing this long is stale housekeeping, not a pause. */
const MARKER_STALE_HOURS = 3;

/** Refs whose commits count as evidence the fleet produced something. */
const ACTIVITY_REFS = ["origin/main", "origin/ops"] as const;

const HOUR_MS = 3_600_000;

// --- Types -----------------------------------------------------------------

export interface SilenceGap {
  startIso: string;
  endIso: string;
  hours: number;
  /** True when the gap extends to `now` rather than having ended. */
  ongoing: boolean;
  /** True when a pause marker covers this gap. */
  covered: boolean;
}

export interface LaneSilenceResult {
  verdict: "active" | "silent" | "paused" | "recovered" | "pause-stale" | "unknown";
  needsChristian: boolean;
  /** Commits inspected across the activity refs. */
  checked: number;
  /** Longest uncovered gap in the lookback, if any. */
  worst: SilenceGap | null;
  gaps: SilenceGap[];
  pause: string;
  summary: string;
}

// --- Gap detection ---------------------------------------------------------

/**
 * Find every quiet stretch longer than the threshold in a descending list of
 * commit timestamps, plus the still-open stretch between the newest commit and now.
 */
export function findGaps(
  timestampsMs: number[],
  nowMs: number,
  marker: PauseMarker,
  thresholdHours: number = SILENCE_THRESHOLD_HOURS,
): SilenceGap[] {
  const sorted = [...timestampsMs].sort((a, b) => a - b);
  const thresholdMs = thresholdHours * HOUR_MS;
  const gaps: SilenceGap[] = [];

  const push = (startMs: number, endMs: number, ongoing: boolean) => {
    if (endMs - startMs <= thresholdMs) return;
    gaps.push({
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
      hours: Math.round(((endMs - startMs) / HOUR_MS) * 10) / 10,
      ongoing,
      covered: pauseCoversGap(marker, startMs, endMs),
    });
  };

  for (let i = 1; i < sorted.length; i++) push(sorted[i - 1], sorted[i], false);
  if (sorted.length > 0) push(sorted[sorted.length - 1], nowMs, true);

  return gaps.sort((a, b) => b.hours - a.hours);
}

// --- Core evaluation -------------------------------------------------------

export function evaluate(
  timestampsMs: number[],
  nowMs: number,
  marker: PauseMarker,
): LaneSilenceResult {
  const pause = describePause(marker);

  if (timestampsMs.length === 0) {
    return {
      verdict: "unknown",
      needsChristian: false,
      checked: 0,
      worst: null,
      gaps: [],
      pause,
      summary: "Lane-silence probe found no commits on the activity refs — cannot judge.",
    };
  }

  const gaps = findGaps(timestampsMs, nowMs, marker);
  const ongoing = gaps.find((g) => g.ongoing) ?? null;
  const uncovered = gaps.filter((g) => !g.covered);
  const worst = uncovered[0] ?? null;

  const newestMs = Math.max(...timestampsMs);
  const quietHours = (nowMs - newestMs) / HOUR_MS;

  // A marker left behind after the lanes resumed silences future monitoring. Catch
  // it before it can: the fleet writing again is proof the pause is over.
  if (isPauseActive(marker, nowMs) && quietHours < MARKER_STALE_HOURS) {
    return {
      verdict: "pause-stale",
      needsChristian: true,
      checked: timestampsMs.length,
      worst,
      gaps,
      pause,
      summary:
        `A pause marker is still set (${marker.reason}) but the scheduled lanes have been writing again — ` +
        `the most recent commit is ${quietHours.toFixed(1)}h old. Delete ${marker.markerPath} so lane-silence ` +
        `monitoring is live again; while it is set, a real outage would be reported as a deliberate pause.`,
    };
  }

  if (ongoing && !ongoing.covered) {
    return {
      verdict: "silent",
      needsChristian: true,
      checked: timestampsMs.length,
      worst,
      gaps,
      pause,
      summary:
        `No scheduled Claude Code lane has written to ${ACTIVITY_REFS.join(" or ")} since ${ongoing.startIso} — ` +
        `${ongoing.hours}h of fleet-wide silence, past the ${SILENCE_THRESHOLD_HOURS}h threshold, and no pause ` +
        `marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared.`,
    };
  }

  if (ongoing && ongoing.covered) {
    return {
      verdict: "paused",
      needsChristian: false,
      checked: timestampsMs.length,
      worst,
      gaps,
      pause,
      summary:
        `Scheduled lanes are paused on purpose — ${ongoing.hours}h quiet since ${ongoing.startIso}, ` +
        `covered by the pause marker ("${marker.reason}"). Not an outage.`,
    };
  }

  if (worst) {
    return {
      verdict: "recovered",
      needsChristian: true,
      checked: timestampsMs.length,
      worst,
      gaps,
      pause,
      summary:
        `The scheduled lanes went silent for ${worst.hours}h (${worst.startIso} → ${worst.endIso}) and have since ` +
        `resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; ` +
        `if it was not, this is the outage no lane reported at the time.`,
    };
  }

  return {
    verdict: "active",
    needsChristian: false,
    checked: timestampsMs.length,
    worst: null,
    gaps,
    pause,
    summary:
      `Scheduled lanes are writing normally — no gap over ${SILENCE_THRESHOLD_HOURS}h in the last ` +
      `${LOOKBACK_HOURS / 24} days across ${ACTIVITY_REFS.join(" + ")}.`,
  };
}

// --- Git ------------------------------------------------------------------

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/**
 * Collect commit timestamps from the activity refs inside the lookback window.
 *
 * A missing ref is skipped rather than fatal — a fresh clone may not track `ops`.
 */
export function collectActivity(nowMs: number, fetch: boolean): number[] {
  if (fetch) {
    try {
      git(["fetch", "origin", "main", "ops", "--quiet"]);
    } catch {
      // Stale refs are better than no answer; the caller reports the degradation.
    }
  }

  const sinceIso = new Date(nowMs - LOOKBACK_HOURS * HOUR_MS).toISOString();
  const stamps: number[] = [];

  for (const ref of ACTIVITY_REFS) {
    let out: string;
    try {
      out = git(["log", ref, "--since", sinceIso, "--format=%cI"]);
    } catch {
      continue; // ref not present locally
    }
    for (const line of out.split(/\r?\n/)) {
      const t = Date.parse(line.trim());
      if (!Number.isNaN(t) && t <= nowMs) stamps.push(t);
    }
  }

  return stamps;
}

// --- CLI -------------------------------------------------------------------

function flagValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : undefined;
}

function main(): void {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const strict = argv.includes("--strict");
  const nowRaw = flagValue(argv, "--now");
  const nowMs = nowRaw ? Date.parse(nowRaw) : Date.now();

  let result: LaneSilenceResult;

  if (Number.isNaN(nowMs)) {
    result = {
      verdict: "unknown",
      needsChristian: false,
      checked: 0,
      worst: null,
      gaps: [],
      pause: "not consulted",
      summary: "Lane-silence probe could not run: unparseable --now value.",
    };
  } else {
    try {
      const marker = readPauseMarker(flagValue(argv, "--pause-marker"));
      const stamps = collectActivity(nowMs, !argv.includes("--no-fetch"));
      result = evaluate(stamps, nowMs, marker);
    } catch (e) {
      result = {
        verdict: "unknown",
        needsChristian: false,
        checked: 0,
        worst: null,
        gaps: [],
        pause: "not consulted",
        summary: `Lane-silence probe could not run: ${(e as Error).message}`,
      };
    }
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`verdict: ${result.verdict}`);
    console.log(result.summary);
    console.log(result.pause);
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (process.argv[1] && process.argv[1].includes("check-lane-silence")) {
  main();
}
