/**
 * The query-prize floor on a batch brief (THR-1489).
 *
 * `check-authoring-brief.ts` calls `process.exit` at the end of `main()`, so the
 * script itself is unreachable from a test. The floor's judgment lives in the
 * two pure exports this file covers, for the reason the `*-predicate.ts` modules
 * exist elsewhere in `scripts/`.
 *
 * The population these tests build is synthetic on purpose. Measured 2026-09-13,
 * the real corpus at `Docs/plans/encounters/` holds eight briefs of which one
 * records a rolled slot block at all — a single slot, below the batch threshold
 * — so a test sweeping the live corpus would pass without judging anything. That
 * is the empty-population false pass, and it is exactly what this gate reports as
 * `VACUOUS` at runtime rather than as green.
 */
import { describe, it, expect } from "vitest";

import {
  BATCH_SLOT_FLOOR_THRESHOLD,
  QUERY_PRIZE_BRIEF_FLOOR,
  QUERY_PRIZE_FACE,
  batchBriefReports,
  briefFloorReport,
} from "../check-authoring-brief.js";

/** A brief whose rolled block carries exactly these shape faces. */
function brief(shapes: readonly string[]): string {
  return [
    "# Batch brief — fixture",
    "",
    "```",
    ...shapes.flatMap((shape, index) => [`slot ${index + 1}:`, `  shape: ${shape}`]),
    "```",
    "",
  ].join("\n");
}

const SIX_WITHOUT_QUERY: readonly string[] = [
  "single_test",
  "test_and_consequence",
  "personality_fork",
  "opt_in_complication",
  "seeded_sequel",
  "danger_confrontation_aftermath",
];

describe("the query-prize floor", () => {
  it("fails a batch of six that rolls no query_prize face", () => {
    const report = briefFloorReport("fixture.md", brief(SIX_WITHOUT_QUERY));

    expect(report.slots).toBe(BATCH_SLOT_FLOOR_THRESHOLD);
    expect(report.belowThreshold).toBe(false);
    expect(report.queryPrizeSlots).toBe(0);
    expect(report.satisfied).toBe(false);
  });

  it("passes the same batch once one slot carries the face", () => {
    // The controlled arm: identical input but for the single face under test, so
    // the failure above is attributable to the floor and not to the fixture's
    // shape, its slot count, or the parser failing to see the block at all.
    const withFace = [QUERY_PRIZE_FACE, ...SIX_WITHOUT_QUERY.slice(1)];
    const report = briefFloorReport("fixture.md", brief(withFace));

    expect(report.slots).toBe(BATCH_SLOT_FLOOR_THRESHOLD);
    expect(report.queryPrizeSlots).toBe(QUERY_PRIZE_BRIEF_FLOOR);
    expect(report.satisfied).toBe(true);
  });

  it("reads the face by its printed label as well as its id", () => {
    // `draw:packet` prints `shape:        Query Prize  [any + queried ending]`
    // while the format doc's skeleton writes the bare id. A parser that took one
    // spelling would fail a compliant batch, which is how a gate gets switched
    // off rather than fixed.
    const labelled = [
      "Query Prize  [any + queried ending]",
      ...SIX_WITHOUT_QUERY.slice(1),
    ];
    expect(briefFloorReport("fixture.md", brief(labelled)).queryPrizeSlots).toBe(1);

    // And it is not merely matching any line containing the words: a shape that
    // only mentions a prize in prose is not the face.
    const decoy = ["single_test", ...SIX_WITHOUT_QUERY.slice(1)];
    const withProse = brief(decoy).replace(
      "# Batch brief — fixture",
      "# Batch brief — fixture\n\nEvery ending should be a query prize eventually.",
    );
    expect(briefFloorReport("fixture.md", withProse).queryPrizeSlots).toBe(0);
  });

  it("does not judge a brief that records fewer slots than a batch", () => {
    // A one-slot proof brief is not a batch and owes no floor — reported as
    // below-threshold rather than as compliant, so the runtime census can tell
    // "nothing to judge" from "judged and passed".
    const report = briefFloorReport("fixture.md", brief(["single_test"]));

    expect(report.belowThreshold).toBe(true);
    expect(report.satisfied).toBe(true);
    expect(report.queryPrizeSlots).toBe(0);
  });

  it("counts no slots in a brief with no rolled block at all", () => {
    const report = briefFloorReport("fixture.md", "# Batch brief\n\nNo rolls recorded.\n");

    expect(report.slots).toBe(0);
    expect(report.belowThreshold).toBe(true);
  });

  it("returns an empty report set rather than throwing on a missing directory", () => {
    // Fail-soft (NFP #4): a check that throws when its corpus directory is absent
    // fails the whole run for a reason unrelated to what it measures.
    expect(batchBriefReports("/no/such/root/at/all")).toEqual([]);
  });

  it("reads the live corpus without throwing, and says how much of it it judged", () => {
    // Deliberately asserts the *shape* of the answer, not a count: the corpus
    // grows, and a pinned number here would be a snapshot that rots (THR-688
    // rule A — predicates, not counts).
    const reports = batchBriefReports(process.cwd());
    for (const report of reports) {
      expect(report.slots).toBeGreaterThanOrEqual(0);
      expect(report.belowThreshold).toBe(report.slots < BATCH_SLOT_FLOOR_THRESHOLD);
      if (report.belowThreshold) expect(report.satisfied).toBe(true);
    }
  });
});
