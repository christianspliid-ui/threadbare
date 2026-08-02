import { describe, expect, it } from "vitest";

import {
  LINEAR_BACKED_CHECK_NAMES,
  LINEAR_KEY_MISSING_REASON,
  type SkippedCheck,
  formatSkippedChecks,
  formatSummaryLine,
  resolveVerdict,
} from "../process-check-verdict";

// ---------------------------------------------------------------------------
// THR-828 — a run whose sub-checks did not execute must not call itself "passed".
//
// The defect being pinned: with LINEAR_API_KEY unset the lint skipped three
// assertions, recorded one warning, and printed `check:process passed with 1
// warning(s).` Both directions are asserted here. A formatter that always said
// "passed-with-gaps" would be just as useless as one that always said "passed" —
// it would train its reader to ignore the token — so the covered run is pinned
// to the bare `passed` string as tightly as the uncovered one is pinned away
// from it.
// ---------------------------------------------------------------------------

const linearKeyUnset: SkippedCheck[] = LINEAR_BACKED_CHECK_NAMES.map((check) => ({
  check,
  reason: LINEAR_KEY_MISSING_REASON,
}));

describe("resolveVerdict", () => {
  it("calls a run with no errors and no skips passed", () => {
    expect(resolveVerdict(0, 0)).toBe("passed");
  });

  it("downgrades a clean run to passed-with-gaps when a sub-check did not run", () => {
    expect(resolveVerdict(0, 1)).toBe("passed-with-gaps");
  });

  it("lets errors dominate — a failed run stays failed even with gaps", () => {
    expect(resolveVerdict(2, 3)).toBe("failed");
  });

  it("is not a constant — the three branches are genuinely reachable and distinct", () => {
    expect(new Set([resolveVerdict(0, 0), resolveVerdict(0, 1), resolveVerdict(1, 0)]).size).toBe(3);
  });
});

describe("formatSummaryLine — the uncovered run", () => {
  const line = formatSummaryLine({ errorCount: 0, warnCount: 1, skipped: linearKeyUnset });

  it("does not print an unqualified pass (the THR-828 regression)", () => {
    // The exact string the old code emitted for this exact input.
    expect(line).not.toContain("check:process passed with 1 warning(s).");
    // Nothing may follow the verdict token that would let a boundary-anchored grep
    // read this line as a covered run.
    expect(/check:process passed[ .]/.test(line)).toBe(false);
  });

  it("names every sub-check that did not run, and why", () => {
    for (const check of LINEAR_BACKED_CHECK_NAMES) {
      expect(line).toContain(check);
    }
    expect(line).toContain(LINEAR_KEY_MISSING_REASON);
  });

  it("states how many sub-checks were skipped", () => {
    expect(line).toContain(`${LINEAR_BACKED_CHECK_NAMES.length} sub-check(s) did not run`);
  });

  it("still reports the warning count", () => {
    expect(line).toContain("1 warning(s)");
  });
});

describe("formatSummaryLine — the covered run", () => {
  it("says passed, unqualified, when nothing was skipped and nothing was found", () => {
    expect(formatSummaryLine({ errorCount: 0, warnCount: 0, skipped: [] })).toBe(
      "check:process passed (no findings).",
    );
  });

  it("says passed, unqualified, when warnings exist but every sub-check ran", () => {
    expect(formatSummaryLine({ errorCount: 0, warnCount: 2, skipped: [] })).toBe(
      "check:process passed with 2 warning(s).",
    );
  });

  it("is visibly distinguishable from the uncovered run — Done-when 3", () => {
    const covered = formatSummaryLine({ errorCount: 0, warnCount: 1, skipped: [] });
    const uncovered = formatSummaryLine({ errorCount: 0, warnCount: 1, skipped: linearKeyUnset });
    expect(covered).not.toBe(uncovered);
  });
});

describe("formatSummaryLine — failures", () => {
  it("reports error and warning counts", () => {
    expect(formatSummaryLine({ errorCount: 2, warnCount: 1, skipped: [] })).toBe(
      "check:process failed with 2 error(s) and 1 warning(s).",
    );
  });

  it("carries the gap clause too — a failing run can also be an incomplete one", () => {
    const line = formatSummaryLine({ errorCount: 1, warnCount: 0, skipped: linearKeyUnset });
    expect(line).toContain("check:process failed with 1 error(s)");
    expect(line).toContain("sub-check(s) did not run");
  });
});

describe("formatSkippedChecks", () => {
  it("renders each skip as name (reason)", () => {
    expect(formatSkippedChecks([{ check: "orphan issues", reason: "LINEAR_API_KEY unset" }])).toBe(
      "orphan issues (LINEAR_API_KEY unset)",
    );
  });

  it("joins multiple skips", () => {
    expect(
      formatSkippedChecks([
        { check: "a", reason: "r1" },
        { check: "b", reason: "r2" },
      ]),
    ).toBe("a (r1), b (r2)");
  });

  it("renders empty for no skips, so the gap clause collapses away", () => {
    expect(formatSkippedChecks([])).toBe("");
  });
});
