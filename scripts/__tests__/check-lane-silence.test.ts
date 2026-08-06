import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { evaluate, findGaps } from "../check-lane-silence";
import {
  isPauseActive,
  pauseCoversGap,
  readPauseMarker,
  type PauseMarker,
} from "../pause-marker";

// --- Fixtures ---------------------------------------------------------------

const NO_MARKER: PauseMarker = { present: false, markerPath: "(none)" };

const ms = (iso: string) => new Date(iso).getTime();

/**
 * The real `origin/ops` write history around the incident, read from the branch on
 * 2026-08-06. The 62-hour hole between `2026-08-03T06:02Z` and `2026-08-05T20:36Z`
 * is the gap `weekly-workflow-retro` found a week late; the timestamps either side
 * are the ordinary ~30-minute cadence that makes it a hole rather than the norm.
 */
const OPS_HISTORY_AROUND_INCIDENT = [
  "2026-08-03T02:01:46Z",
  "2026-08-03T02:32:19Z",
  "2026-08-03T03:00:59Z",
  "2026-08-03T04:03:00Z",
  "2026-08-03T04:42:03Z",
  "2026-08-03T06:02:00Z",
  // ---- 62 hours of nothing ----
  "2026-08-05T20:36:43Z",
  "2026-08-05T21:02:44Z",
  "2026-08-05T21:30:23Z",
  "2026-08-05T22:00:52Z",
  "2026-08-05T22:31:14Z",
  "2026-08-06T00:01:23Z",
].map(ms);

/** A healthy stretch: the real cadence, largest gap 3h00m (08-02 11:30 → 14:30 local). */
const HEALTHY_HISTORY = [
  "2026-08-02T09:30:02Z",
  "2026-08-02T12:30:42Z", // the 3h00m real-world maximum
  "2026-08-02T13:31:32Z",
  "2026-08-02T14:07:01Z",
  "2026-08-02T14:30:02Z",
  "2026-08-02T15:01:59Z",
  "2026-08-02T15:33:27Z",
].map(ms);

// --- Marker file plumbing ---------------------------------------------------

const tmpFiles: string[] = [];

/**
 * Write a marker file, optionally pinning its mtime.
 *
 * A free-text marker takes its start from the file's mtime, so any test that
 * evaluates one against a *fabricated* `now` must pin that mtime — otherwise the
 * marker starts at real wall-clock time and the assertion silently depends on
 * when the suite runs. That is not hypothetical: the stale-marker case below
 * evaluates at `2026-08-06T10:00:00Z` and passed in CI at 09:24Z on that date,
 * then failed from 10:00Z onward, because the real-mtime marker began *after*
 * the instant it was being judged at.
 */
function writeMarker(content: string, mtimeMs?: number): string {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pause-")), "threadbare-pause.json");
  fs.writeFileSync(p, content, "utf8");
  if (mtimeMs !== undefined) {
    const seconds = mtimeMs / 1000;
    fs.utimesSync(p, seconds, seconds);
  }
  tmpFiles.push(p);
  return p;
}

afterEach(() => {
  while (tmpFiles.length) {
    try {
      fs.rmSync(tmpFiles.pop()!, { force: true });
    } catch {
      /* best effort */
    }
  }
});

// --- Done-when case 1: stale lane, no marker → alerts -----------------------

describe("the fleet went silent and nobody declared it", () => {
  it("reports the historical 62h gap as recovered once the lanes are back", () => {
    // Standing where the first post-resume run stood.
    const r = evaluate(OPS_HISTORY_AROUND_INCIDENT, ms("2026-08-06T00:30:00Z"), NO_MARKER);

    expect(r.verdict).toBe("recovered");
    expect(r.needsChristian).toBe(true);
    expect(r.worst?.hours).toBeCloseTo(62.6, 0);
    expect(r.worst?.ongoing).toBe(false);
    expect(r.summary).toContain("no pause marker covering that window");
  });

  it("reports an ongoing silence as `silent` while it is still happening", () => {
    // Mid-outage: the last write was 08-03, and it is now 08-04.
    const midOutage = OPS_HISTORY_AROUND_INCIDENT.filter((t) => t < ms("2026-08-04T00:00:00Z"));
    const r = evaluate(midOutage, ms("2026-08-04T12:00:00Z"), NO_MARKER);

    expect(r.verdict).toBe("silent");
    expect(r.needsChristian).toBe(true);
    expect(r.worst?.ongoing).toBe(true);
    expect(r.summary).toContain("no pause");
  });

  it("stays quiet on a healthy week — the real 3h cadence must not trip it", () => {
    const r = evaluate(HEALTHY_HISTORY, ms("2026-08-02T16:00:00Z"), NO_MARKER);

    expect(r.verdict).toBe("active");
    expect(r.needsChristian).toBe(false);
    expect(r.gaps).toEqual([]);
  });
});

// --- Done-when case 2: same window, marker set → reports the pause ----------

describe("the same window with the pause declared", () => {
  const markerJson = JSON.stringify({
    reason: "token/usage limits",
    since: "2026-08-03T07:00:00Z",
    until: "2026-08-05T21:00:00Z",
  });

  it("reports the historical gap as a pause, not an outage", () => {
    const marker = readPauseMarker(writeMarker(markerJson));
    const r = evaluate(OPS_HISTORY_AROUND_INCIDENT, ms("2026-08-06T00:30:00Z"), marker);

    // The gap is still detected — it is just explained.
    expect(r.gaps.some((g) => g.hours > 60 && g.covered)).toBe(true);
    expect(r.verdict).toBe("active");
    expect(r.needsChristian).toBe(false);
  });

  it("reports an ongoing declared pause as `paused`", () => {
    const marker = readPauseMarker(writeMarker(markerJson));
    const midOutage = OPS_HISTORY_AROUND_INCIDENT.filter((t) => t < ms("2026-08-04T00:00:00Z"));
    const r = evaluate(midOutage, ms("2026-08-04T12:00:00Z"), marker);

    expect(r.verdict).toBe("paused");
    expect(r.needsChristian).toBe(false);
    expect(r.summary).toContain("paused on purpose");
  });

  it("does not let an expired marker excuse a later outage", () => {
    // Marker covers 08-03→08-05. A *new* silence afterwards must still alert:
    // this is what stops one declared pause from blinding the probe forever.
    const marker = readPauseMarker(writeMarker(markerJson));
    const laterSilence = [...OPS_HISTORY_AROUND_INCIDENT, ms("2026-08-06T01:00:00Z")];
    const r = evaluate(laterSilence, ms("2026-08-06T20:00:00Z"), marker);

    expect(r.verdict).toBe("silent");
    expect(r.needsChristian).toBe(true);
  });
});

// --- The stale-marker hole --------------------------------------------------

describe("a marker left behind after resume", () => {
  it("is flagged as housekeeping rather than silently suppressing monitoring", () => {
    // Pinned mtime, not real `now`: the marker must start before the instant it is
    // judged at, or the case tests nothing (see `writeMarker`).
    const marker = readPauseMarker(
      writeMarker("paused on token limits", ms("2026-08-06T08:00:00Z")),
    );
    // Free-text marker is open-ended from its mtime, and the lanes are writing.
    const r = evaluate(
      [ms("2026-08-06T09:00:00Z"), ms("2026-08-06T09:30:00Z")],
      ms("2026-08-06T10:00:00Z"),
      marker,
    );

    expect(r.verdict).toBe("pause-stale");
    expect(r.needsChristian).toBe(true);
    expect(r.summary).toContain("Delete");
  });
});

// --- Marker parsing ---------------------------------------------------------

describe("readPauseMarker", () => {
  it("treats an absent file as no pause", () => {
    const m = readPauseMarker(path.join(os.tmpdir(), "definitely-not-here-9f3a.json"));
    expect(m.present).toBe(false);
    expect(isPauseActive(m, Date.now())).toBe(false);
  });

  it("accepts free text, using the first line as the reason (the `echo >` path)", () => {
    const m = readPauseMarker(writeMarker("out of tokens until Thursday\n"));
    expect(m.present).toBe(true);
    expect(m.reason).toBe("out of tokens until Thursday");
    expect(m.freeform).toBe(true);
    expect(m.untilMs).toBeNull();
  });

  it("accepts an empty file — presence alone is a valid declaration", () => {
    const m = readPauseMarker(writeMarker(""));
    expect(m.present).toBe(true);
    expect(m.reason).toBe("no reason given");
    expect(isPauseActive(m, Date.now())).toBe(true);
  });

  it("reads an explicit JSON window", () => {
    const m = readPauseMarker(
      writeMarker(JSON.stringify({ reason: "limits", since: "2026-08-03T00:00:00Z", until: "2026-08-05T00:00:00Z" })),
    );
    expect(m.reason).toBe("limits");
    expect(isPauseActive(m, ms("2026-08-04T00:00:00Z"))).toBe(true);
    expect(isPauseActive(m, ms("2026-08-06T00:00:00Z"))).toBe(false);
    expect(isPauseActive(m, ms("2026-08-01T00:00:00Z"))).toBe(false);
  });

  it("falls back to the free-text reading on malformed JSON rather than dropping the pause", () => {
    const m = readPauseMarker(writeMarker('{"reason": "unterminated'));
    expect(m.present).toBe(true);
    expect(m.freeform).toBe(true);
  });
});

describe("pauseCoversGap", () => {
  it("covers a gap whose midpoint is inside the window, tolerating sloppy edges", () => {
    // Declared several hours after the silence began and cleared before it ended —
    // the realistic shape of a human-set marker.
    const m = readPauseMarker(
      writeMarker(JSON.stringify({ since: "2026-08-03T18:00:00Z", until: "2026-08-05T12:00:00Z" })),
    );
    expect(pauseCoversGap(m, ms("2026-08-03T06:02:00Z"), ms("2026-08-05T20:36:00Z"))).toBe(true);
  });

  it("does not cover a gap that merely touches the window at one edge", () => {
    const m = readPauseMarker(
      writeMarker(JSON.stringify({ since: "2026-08-03T00:00:00Z", until: "2026-08-03T08:00:00Z" })),
    );
    expect(pauseCoversGap(m, ms("2026-08-03T06:02:00Z"), ms("2026-08-05T20:36:00Z"))).toBe(false);
  });
});

// --- Gap arithmetic ---------------------------------------------------------

describe("findGaps", () => {
  it("returns nothing for a single commit plus a fresh now", () => {
    expect(findGaps([ms("2026-08-06T10:00:00Z")], ms("2026-08-06T11:00:00Z"), NO_MARKER)).toEqual([]);
  });

  it("sorts unordered input before measuring", () => {
    const shuffled = [...OPS_HISTORY_AROUND_INCIDENT].reverse();
    const gaps = findGaps(shuffled, ms("2026-08-06T00:30:00Z"), NO_MARKER);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].hours).toBeGreaterThan(60);
  });

  it("respects the threshold boundary", () => {
    const stamps = [ms("2026-08-06T00:00:00Z"), ms("2026-08-06T06:00:00Z")];
    // Exactly 6h apart: not a gap.
    expect(findGaps(stamps, ms("2026-08-06T06:30:00Z"), NO_MARKER)).toEqual([]);
    // 6h01m: a gap.
    const past = [ms("2026-08-06T00:00:00Z"), ms("2026-08-06T06:01:00Z")];
    expect(findGaps(past, ms("2026-08-06T06:30:00Z"), NO_MARKER)).toHaveLength(1);
  });
});

// --- Fail-soft --------------------------------------------------------------

describe("fail-soft", () => {
  it("returns unknown rather than guessing when there are no commits at all", () => {
    const r = evaluate([], Date.now(), NO_MARKER);
    expect(r.verdict).toBe("unknown");
    expect(r.needsChristian).toBe(false);
  });
});
