import { describe, expect, it } from "vitest";

import {
  PLAN_DOC_PATH_PATTERN,
  classifyPlanDocLiveness,
  extractPlanDocPaths,
  extractPlanDocPathsFromIssue,
  summarizePlanDocLiveness,
} from "../plan-doc-liveness-predicate";

// ---------------------------------------------------------------------------
// THR-921 — a plan doc named by a Ready-for-Dev issue must resolve on
// origin/main, the branch point every executor worktree is cut from.
//
// Both directions are asserted throughout. A predicate that answered "live" for
// everything would make the gate vacuous while reporting PASS on every fixture —
// the failure shape CLAUDE.md names as a vacuous probe — so each block pins a
// negative case next to its positive one.
// ---------------------------------------------------------------------------

describe("extractPlanDocPaths", () => {
  it("pulls the path out of the canonical `Plan doc:` line, stripping backticks and bold markers", () => {
    const description = "**Plan doc:** `Docs/plans/2026-07-30-encounter-authoring-frameworks.md`";
    expect(extractPlanDocPaths(description)).toEqual([
      "Docs/plans/2026-07-30-encounter-authoring-frameworks.md",
    ]);
  });

  it("finds audit paths and nested audit directories", () => {
    const text = "See Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md for the report.";
    expect(extractPlanDocPaths(text)).toEqual([
      "Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md",
    ]);
  });

  it("dedupes the two-place rule — the same path in description and handoff comment yields one entry", () => {
    // The two-place rule (CLAUDE.md) deliberately writes the path twice so neither
    // surface is a single point of failure; the gate should check it once.
    const combined = [
      "**Plan doc:** `Docs/plans/2026-08-01-x.md`",
      "Handoff: implement per Docs/plans/2026-08-01-x.md, all three pillars.",
    ].join("\n");
    expect(extractPlanDocPaths(combined)).toEqual(["Docs/plans/2026-08-01-x.md"]);
  });

  it("returns every distinct path when an issue names more than one", () => {
    const text = "Supersedes `Docs/plans/2026-07-01-old.md`; new design in `Docs/plans/2026-08-01-new.md`.";
    expect(extractPlanDocPaths(text)).toEqual([
      "Docs/plans/2026-07-01-old.md",
      "Docs/plans/2026-08-01-new.md",
    ]);
  });

  it.each([
    ["a src path the ticket exists to create", "Add the guard to `src/engine/routeEvents.ts`."],
    ["a scripts path", "Edit scripts/check-process.ts line 42."],
    ["a skill doc", "Widen `.claude/skills/pull-work/SKILL.md` Step 6."],
    ["a canon page", "Load Docs/canon/process.md at session start."],
    ["a non-markdown Docs file", "Regenerate Docs/plans/diagram.png."],
    ["pure prose", "The encounter pacing feels wrong."],
    ["empty", ""],
    ["null", null],
  ])("ignores %s", (_label, text) => {
    expect(extractPlanDocPaths(text)).toEqual([]);
  });

  it("exposes a non-global pattern, so repeated .test() calls are stable", () => {
    // A /g regex carries lastIndex across calls; exporting one would make the
    // second identical .test() return false.
    const sample = "Docs/plans/2026-08-01-x.md";
    expect(PLAN_DOC_PATH_PATTERN.test(sample)).toBe(true);
    expect(PLAN_DOC_PATH_PATTERN.test(sample)).toBe(true);
  });
});

describe("extractPlanDocPathsFromIssue", () => {
  it("reads the description when the issue has no comments at all", () => {
    // A T1 child filed straight into Ready for Dev is born with zero comments
    // (orchestrator SKILL.md), so a comment-only reader would see nothing.
    expect(
      extractPlanDocPathsFromIssue({
        description: "**Plan doc:** `Docs/plans/2026-08-01-x.md`",
        comments: [],
      }),
    ).toEqual(["Docs/plans/2026-08-01-x.md"]);
  });

  it("reads a path that appears only in a handoff comment, not the description", () => {
    expect(
      extractPlanDocPathsFromIssue({
        description: "Implement the gate.",
        comments: [{ body: "Handoff. **Plan doc:** `Docs/plans/2026-08-01-x.md`" }],
      }),
    ).toEqual(["Docs/plans/2026-08-01-x.md"]);
  });

  it("does not read the latest comment only — an earlier handoff still counts", () => {
    // THR-895's defect shape: `handoff-keywords` consults `chooseLatestComment` alone, so a
    // later checkpoint comment pushes the real handoff out of view. This gate must not
    // inherit that, or a plan doc named in the original handoff goes unchecked.
    expect(
      extractPlanDocPathsFromIssue({
        description: "Implement the gate.",
        comments: [
          { body: "Handoff. **Plan doc:** `Docs/plans/2026-08-01-x.md`" },
          { body: "Checkpoint: partial work on branch pickup/thr-999." },
        ],
      }),
    ).toEqual(["Docs/plans/2026-08-01-x.md"]);
  });

  it("dedupes across surfaces when the two-place rule is followed correctly", () => {
    // THR-884 had the path in both places, correctly, and was still unreadable —
    // the two-place rule protects against a missing reference, not a missing file.
    expect(
      extractPlanDocPathsFromIssue({
        description: "**Plan doc:** `Docs/plans/2026-07-30-encounter-authoring-frameworks.md`",
        comments: [{ body: "Per Docs/plans/2026-07-30-encounter-authoring-frameworks.md, all three pillars." }],
      }),
    ).toEqual(["Docs/plans/2026-07-30-encounter-authoring-frameworks.md"]);
  });

  it.each([
    ["null description and null comments", { description: null, comments: null }],
    ["a null comment body", { description: "", comments: [{ body: null }] }],
    ["missing keys entirely", {}],
  ])("returns nothing for %s without throwing", (_label, issue) => {
    expect(extractPlanDocPathsFromIssue(issue)).toEqual([]);
  });
});

describe("classifyPlanDocLiveness", () => {
  it("clears a path that resolves on origin/main", () => {
    const verdict = classifyPlanDocLiveness({ path: "Docs/plans/a.md", onMain: true });
    expect(verdict.status).toBe("live");
    expect(verdict.blocksPromotion).toBe(false);
  });

  it("reports THR-884's shape — present only on an open PR — as stranded, naming the PR", () => {
    // impediment #321: the path 404'd in any fresh worktree because PR #1122 was still open.
    const verdict = classifyPlanDocLiveness({
      path: "Docs/plans/2026-07-30-encounter-authoring-frameworks.md",
      onMain: false,
      openPrNumber: 1122,
      prScanRan: true,
    });
    expect(verdict.status).toBe("stranded");
    expect(verdict.blocksPromotion).toBe(true);
    expect(verdict.message).toContain("#1122");
  });

  it("reports a path on no branch at all as missing", () => {
    const verdict = classifyPlanDocLiveness({
      path: "Docs/plans/typo-in-the-filename.md",
      onMain: false,
      openPrNumber: null,
      prScanRan: true,
    });
    expect(verdict.status).toBe("missing");
    expect(verdict.blocksPromotion).toBe(true);
  });

  it("keeps a skipped PR scan distinct from a negative one", () => {
    // THR-828: a check that did not run must not report a verdict. Folding this
    // into `missing` would tell a lane to hold for a reason nobody verified.
    const verdict = classifyPlanDocLiveness({
      path: "Docs/plans/a.md",
      onMain: false,
      openPrNumber: null,
      prScanRan: false,
    });
    expect(verdict.status).toBe("unresolved");
    expect(verdict.blocksPromotion).toBe(true);
    expect(verdict.message).toContain("did not run");
  });
});

describe("summarizePlanDocLiveness", () => {
  it("clears a promotion when every named doc is live", () => {
    const verdicts = [
      classifyPlanDocLiveness({ path: "Docs/plans/a.md", onMain: true }),
      classifyPlanDocLiveness({ path: "Docs/plans/b.md", onMain: true }),
    ];
    expect(summarizePlanDocLiveness(verdicts)).toEqual({ ok: true, blocking: [] });
  });

  it("holds the promotion when any single doc is stranded, and names only the blocker", () => {
    // THR-887's shape: one live doc alongside one that lived solely on PR #1129,
    // which made its Done-when unsatisfiable from the executor's branch point.
    const verdicts = [
      classifyPlanDocLiveness({ path: "Docs/plans/live.md", onMain: true }),
      classifyPlanDocLiveness({
        path: "Docs/plans/2026-07-30-repertoire-engine.md",
        onMain: false,
        openPrNumber: 1129,
        prScanRan: true,
      }),
    ];
    const summary = summarizePlanDocLiveness(verdicts);
    expect(summary.ok).toBe(false);
    expect(summary.blocking).toHaveLength(1);
    expect(summary.blocking[0]?.path).toBe("Docs/plans/2026-07-30-repertoire-engine.md");
  });

  it("clears an issue that names no plan doc at all", () => {
    expect(summarizePlanDocLiveness([])).toEqual({ ok: true, blocking: [] });
  });
});
