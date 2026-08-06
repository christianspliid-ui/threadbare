/**
 * Deliberate-pause marker (THR-1001).
 *
 * ## Why this exists
 *
 * Between `2026-08-03 08:02` and `2026-08-05 22:36` every scheduled Claude Code
 * lane wrote nothing — 62 hours across two weekdays. It was found a week later by
 * `weekly-workflow-retro`, which reasonably read it as an outage. Christian
 * confirmed it was a **deliberate, controlled pause on token/usage limits**, and
 * flagged that it will recur.
 *
 * So the fleet has two silences that look identical from every surface: paused on
 * purpose, and silently broken. A heartbeat check without a way to tell them apart
 * would page on every future usage-limit pause — which trains the reader to ignore
 * it, and is worse than the current silence.
 *
 * This module is the signal. It is deliberately the dumbest thing that works,
 * because of the one hard constraint: **setting the marker must not require an
 * agent to be running.** Token limits are precisely when no agent is running, so
 * anything that needs a lane, a session, or a git commit to declare the pause is
 * unusable at the only moment it matters.
 *
 * ## Setting it (Christian, no agent involved)
 *
 * Create the file. Its *presence* is the pause:
 *
 *   C:\Users\chris\.claude\threadbare-pause.json
 *
 * Any content is accepted. The two useful shapes:
 *
 * - **Free text** — the first non-empty line becomes the reason, and the pause runs
 *   open-ended from the file's mtime. `echo paused on token limits > ...` is a
 *   complete, valid marker. Empty file works too.
 * - **JSON** — `{ "reason": "...", "since": "<iso>", "until": "<iso>" }`. All three
 *   optional: `since` defaults to the file's mtime, `until` to open-ended. This is
 *   the shape used to describe a pause window after the fact.
 *
 * Delete the file to end the pause. Forgetting to is handled rather than trusted:
 * an open-ended marker left behind while the lanes are demonstrably writing again
 * is reported as stale housekeeping by `check-lane-silence.ts`, so a stray marker
 * cannot silence monitoring indefinitely.
 *
 * ## Failure direction (NFP #4)
 *
 * A missing file is simply "no pause". An **unreadable** file (permissions, I/O)
 * reports `present: false` with `error` set — it does not suppress anything. The
 * alternative, treating an unreadable marker as an active pause, converts one bad
 * file into permanently silent monitoring, which is the vacuous-gate failure this
 * project treats as the worst outcome. A free-text file is a *valid* form rather
 * than a parse failure, so this path is reachable only by real I/O trouble.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// --- Tunable constants (NFP #1) -------------------------------------------

/** Default marker location. Outside the repo on purpose: it must be settable with no clone, no session, no git. */
export const PAUSE_MARKER_DEFAULT = path.join(
  os.homedir(),
  ".claude",
  "threadbare-pause.json",
);

/** Env var that overrides the marker path (used by tests and by ad-hoc dry runs). */
export const PAUSE_MARKER_ENV = "THREADBARE_PAUSE_MARKER";

// --- Types -----------------------------------------------------------------

export interface PauseMarker {
  /** Whether a marker file was found and read. */
  present: boolean;
  /** Human-readable reason for the pause. */
  reason?: string;
  /** Pause start (epoch ms). Defaults to the marker file's mtime. */
  sinceMs?: number;
  /** Pause end (epoch ms), or null for open-ended. */
  untilMs?: number | null;
  /** True when the marker was free text rather than JSON. */
  freeform?: boolean;
  /** Set when the file exists but could not be read. Never suppresses an alert. */
  error?: string;
  /** Path consulted, for reporting. */
  markerPath: string;
}

// --- Reading ---------------------------------------------------------------

/**
 * Resolve which marker path to consult: explicit argument, then env var, then default.
 */
export function resolveMarkerPath(explicit?: string): string {
  return explicit ?? process.env[PAUSE_MARKER_ENV] ?? PAUSE_MARKER_DEFAULT;
}

/**
 * Read and interpret the marker file. Never throws.
 */
export function readPauseMarker(explicitPath?: string): PauseMarker {
  const markerPath = resolveMarkerPath(explicitPath);

  let raw: string;
  let mtimeMs: number;
  try {
    if (!fs.existsSync(markerPath)) return { present: false, markerPath };
    raw = fs.readFileSync(markerPath, "utf8");
    // Floor to whole milliseconds. `mtimeMs` carries sub-millisecond precision
    // (ext4 stores nanoseconds; this machine reports e.g. `...924.74`) while every
    // clock it is compared against — `Date.now()`, an `--now` override, a parsed
    // ISO string — is integer ms. Without the floor, a marker created *now* reads
    // as not-yet-active whenever `Date.now()` truncates below the fraction, which
    // is a coin flip on each run rather than a platform quirk: the `isPauseActive`
    // guard `atMs < sinceMs` fires on a difference of less than one millisecond.
    // A pause is a wall-clock instant; sub-millisecond precision must never decide
    // whether monitoring is suppressed.
    mtimeMs = Math.floor(fs.statSync(markerPath).mtimeMs);
  } catch (e) {
    // Fail-soft, and deliberately toward *not* suppressing: see the header note.
    return { present: false, error: (e as Error).message, markerPath };
  }

  const trimmed = raw.trim();

  // JSON shape — an explicit window.
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        reason?: string;
        since?: string;
        until?: string | null;
      };
      const since = parsed.since ? Date.parse(parsed.since) : NaN;
      const until = parsed.until ? Date.parse(parsed.until) : NaN;
      return {
        present: true,
        reason: parsed.reason?.trim() || "no reason given",
        sinceMs: Number.isNaN(since) ? mtimeMs : since,
        untilMs: Number.isNaN(until) ? null : until,
        markerPath,
      };
    } catch {
      // Fall through to the free-text reading rather than discarding the pause:
      // a malformed JSON marker is still someone declaring a pause.
    }
  }

  // Free-text shape (including empty) — open-ended from the file's mtime.
  const firstLine = trimmed.split(/\r?\n/).find((l) => l.trim() !== "");
  return {
    present: true,
    reason: firstLine?.trim() || "no reason given",
    sinceMs: mtimeMs,
    untilMs: null,
    freeform: true,
    markerPath,
  };
}

// --- Interpretation --------------------------------------------------------

/**
 * Is the pause in force at `atMs`?
 *
 * A marker with an `until` in the past has expired and suppresses nothing — that
 * is what lets a marker describe a *historical* window without blinding the probe
 * to everything that happened afterwards.
 */
export function isPauseActive(marker: PauseMarker, atMs: number): boolean {
  if (!marker.present) return false;
  if (marker.sinceMs !== undefined && atMs < marker.sinceMs) return false;
  if (marker.untilMs !== null && marker.untilMs !== undefined && atMs > marker.untilMs) {
    return false;
  }
  return true;
}

/**
 * Does the marker window cover a silence spanning `[startMs, endMs]`?
 *
 * Covered means the marker window contains the **midpoint** of the gap. Midpoint
 * rather than full containment because a human declaring a pause will not bracket
 * it to the minute — he notices after it starts and deletes the file after it
 * ends. A window containing the middle of a 62-hour silence is unambiguously about
 * that silence; requiring exact edges would reject every realistic marker.
 */
export function pauseCoversGap(
  marker: PauseMarker,
  startMs: number,
  endMs: number,
): boolean {
  return isPauseActive(marker, startMs + (endMs - startMs) / 2);
}

/** One-line description for report output. */
export function describePause(marker: PauseMarker): string {
  if (!marker.present) return "no pause marker set";
  const since = marker.sinceMs ? new Date(marker.sinceMs).toISOString() : "unknown start";
  const until = marker.untilMs ? new Date(marker.untilMs).toISOString() : "open-ended";
  return `pause marker at ${marker.markerPath} — "${marker.reason}" (since ${since}, until ${until})`;
}
