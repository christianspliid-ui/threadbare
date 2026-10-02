import { describe, expect, it } from "vitest";

import {
  formatHoldTrace,
  isHeld,
  parseClaimableFrom,
  partitionHeldCandidates,
} from "../claimable-from-predicate";

// ---------------------------------------------------------------------------
// THR-1694 — a `Ready for Dev` ticket handed off under a veto window carries
// `Claimable from: <ISO-8601 UTC>` in its description, and pull-work Step 1
// drops it from the candidates until that time passes.
//
// All three directions are asserted (Done-when): a future hold is skipped, a
// past hold is claimable, and a ticket with no line is claimable. A filter
// that only ever said "held" would empty the queue; one that only ever said
// "claimable" would reproduce the 2026-10-01 hourly claim/release loop.
// ---------------------------------------------------------------------------

const NOW = new Date("2026-10-02T20:00:00Z");
const HOUR_AHEAD = "2026-10-02T21:00:00Z";
const HOUR_BEHIND = "2026-10-02T19:00:00Z";

describe("partitionHeldCandidates", () => {
  it("skips a hold one hour ahead, claims one an hour behind, claims a ticket without the line", () => {
    const partition = partitionHeldCandidates(
      [
        { id: "THR-1", description: `Plan doc: x\n\nClaimable from: ${HOUR_AHEAD}\n` },
        { id: "THR-2", description: `Claimable from: ${HOUR_BEHIND}` },
        { id: "THR-3", description: "No hold here." },
      ],
      NOW,
    );
    expect(partition.claimable.map((c) => c.id)).toEqual(["THR-2", "THR-3"]);
    expect(partition.held.map((h) => h.candidate.id)).toEqual(["THR-1"]);
    expect(partition.earliestRelease?.toISOString()).toBe("2026-10-02T21:00:00.000Z");
  });

  it("reports the earliest release when every candidate is held", () => {
    const partition = partitionHeldCandidates(
      [
        { id: "THR-1", description: "Claimable from: 2026-10-03T09:00:00Z" },
        { id: "THR-2", description: `Claimable from: ${HOUR_AHEAD}` },
      ],
      NOW,
    );
    expect(partition.claimable).toEqual([]);
    expect(formatHoldTrace(partition)).toEqual([
      "[pull-work] skipped THR-1 — claimable from 2026-10-03T09:00:00.000Z",
      `[pull-work] skipped THR-2 — claimable from 2026-10-02T21:00:00.000Z`,
      "[pull-work] Step 1: queue held until 2026-10-02T21:00:00.000Z — no claimable work.",
    ]);
  });

  it("emits no all-held verdict when something is claimable", () => {
    const partition = partitionHeldCandidates(
      [
        { id: "THR-1", description: `Claimable from: ${HOUR_AHEAD}` },
        { id: "THR-2", description: null },
      ],
      NOW,
    );
    expect(formatHoldTrace(partition)).toEqual([
      "[pull-work] skipped THR-1 — claimable from 2026-10-02T21:00:00.000Z",
    ]);
  });
});

describe("parseClaimableFrom", () => {
  it.each([
    ["bare line", `Claimable from: ${HOUR_AHEAD}`],
    ["bold label", `**Claimable from:** ${HOUR_AHEAD}`],
    ["backticked value", `Claimable from: \`${HOUR_AHEAD}\``],
    ["bullet", `- Claimable from: ${HOUR_AHEAD}`],
    ["offset instead of Z", "Claimable from: 2026-10-02T23:00:00+02:00"],
  ])("reads a %s", (_label, description) => {
    expect(parseClaimableFrom(description)?.toISOString()).toBe("2026-10-02T21:00:00.000Z");
  });

  it.each([
    ["empty", ""],
    ["null", null],
    ["date with no time", "Claimable from: 2026-10-03"],
    ["prose mention mid-line", `Write a Claimable from: ${HOUR_AHEAD} line when handing off.`],
    ["unparseable value", "Claimable from: 2026-13-45T99:99:99Z"],
  ])("treats %s as no hold (fail-soft: never hide work on a malformed line)", (_label, description) => {
    expect(parseClaimableFrom(description)).toBeNull();
    expect(isHeld(description, NOW)).toBe(false);
  });

  it("takes the latest hold when a re-handoff left a stale line behind", () => {
    const description = `Claimable from: ${HOUR_BEHIND}\n\nre-handed off\n\nClaimable from: ${HOUR_AHEAD}`;
    expect(parseClaimableFrom(description)?.toISOString()).toBe("2026-10-02T21:00:00.000Z");
    expect(isHeld(description, NOW)).toBe(true);
  });

  it("treats the boundary instant as claimable", () => {
    expect(isHeld("Claimable from: 2026-10-02T20:00:00Z", NOW)).toBe(false);
  });
});
