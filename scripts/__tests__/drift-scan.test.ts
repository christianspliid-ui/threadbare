import { describe, expect, it } from "vitest";
import {
  BROKEN_WINDOWS_PCT,
  COUPLING_CREEP_PCT,
  SKILL_FRESHNESS_ARCHIVE_DAYS,
  SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
  SKILL_FRESHNESS_STALE_DAYS,
  TEST_FLAKE_MIN_RUNS,
  evaluateBrokenWindows,
  evaluateCouplingCreep,
  evaluateSkillFreshness,
  evaluateTestSuiteHealth,
  evaluateUlDrift,
  executeSignalSteps,
  parseCodesightImporters,
  type SkillFreshnessEntry,
  parseUlShardTerms,
  formatIssueTitle,
  driftIssueSignalName,
  isDriftIssueForSignal,
} from "../drift-scan/index";

describe("drift-scan S1", () => {
  it("flags coupling growth above threshold", () => {
    const graph = [
      "- `src\\engine\\graph.ts` — imported by **120** files",
      "- `src\\types\\index.ts` — imported by **90** files",
    ].join("\n");
    const parsed = parseCodesightImporters(graph);
    const result = evaluateCouplingCreep(
      parsed,
      [
        { file: "src/engine/graph.ts", count: 100 },
        { file: "src/types/index.ts", count: 90 },
      ],
      COUPLING_CREEP_PCT,
    );

    expect(result.status).toBe("red");
    if (result.status === "red") {
      expect(result.summary).toContain("1 file(s)");
      expect(result.body).toContain("src/engine/graph.ts");
    }
  });
});

describe("drift-scan S2", () => {
  it("flags broken-windows increase above threshold", () => {
    const result = evaluateBrokenWindows(
      {
        todo: 12,
        deferred: 3,
        tsIgnore: 0,
        skipCalls: 2,
        explicitAny: 1,
        total: 18,
      },
      12,
      BROKEN_WINDOWS_PCT,
    );

    expect(result.status).toBe("red");
    if (result.status === "red") {
      expect(result.summary).toContain("12 → 18");
    }
  });
});

describe("drift-scan S3", () => {
  it("flags flake candidates when min observation count is met", () => {
    const evaluation = evaluateTestSuiteHealth({
      runtimeMs: 45_000,
      suites: [
        {
          file: "src/foo.test.ts",
          passed: false,
          durationMs: 10_000,
          slowestTests: [{ name: "foo should pass", durationMs: 4_000 }],
        },
      ],
      priorRuntimeMs: 40_000,
      priorSuiteHistory: {
        "src/foo.test.ts": [true, false, true].slice(0, TEST_FLAKE_MIN_RUNS),
      },
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.summary).toContain("flake candidate");
      expect(evaluation.signal.body).toContain("src/foo.test.ts");
    }
  });
});

describe("drift-scan S4", () => {
  it("flags canonical-unused and used-uncanonical terms", () => {
    const shard = [
      "### World Thread",
      "",
      "**Aliases:** none",
      "**Status:** canonical",
      "",
      "### Ascendant",
      "",
      "**Aliases:** none",
      "**Status:** canonical",
    ].join("\n");

    const terms = parseUlShardTerms(shard, "Cosmology.md");
    const evaluation = evaluateUlDrift({
      runDate: "2026-03-05",
      terms,
      priorLastSeen: {
        "world thread": "2026-01-01",
        ascendant: "2026-03-01",
      },
      corpus: [
        { file: "Docs/a.md", text: "Ascendant remains core." },
        { file: "Docs/b.md", text: "MysticLedger is drafted." },
        { file: "Docs/c.md", text: "MysticLedger appears again." },
        { file: "Docs/d.md", text: "MysticLedger is still referenced." },
        { file: "Docs/e.md", text: "MysticLedger closes the loop." },
      ],
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.summary).toContain("canonical-unused");
      expect(evaluation.signal.summary).toContain("used-uncanonical");
    }
  });
});

describe("drift-scan fail-soft", () => {
  it("continues executing later signals after a thrown error", async () => {
    let tailRan = false;

    const outcomes = await executeSignalSteps([
      { id: "S1", name: "first", run: async () => ({ status: "green" }) },
      {
        id: "S2",
        name: "boom",
        run: async () => {
          throw new Error("synthetic failure");
        },
      },
      {
        id: "S3",
        name: "tail",
        run: async () => {
          tailRan = true;
          return { status: "green" };
        },
      },
    ]);

    expect(outcomes).toHaveLength(3);
    expect(outcomes[1]?.result.status).toBe("skipped");
    expect(tailRan).toBe(true);
  });
});

describe("drift-scan S5", () => {
  const runDate = "2026-05-08";

  const makeEntry = (overrides: Partial<SkillFreshnessEntry>): SkillFreshnessEntry => ({
    skillName: "sample-skill",
    path: ".claude/skills/sample-skill/SKILL.md",
    lastValidatedAt: "2026-05-01",
    createdAt: "2026-01-01",
    ...overrides,
  });

  it("returns green when all skills are within freshness window", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "fresh", lastValidatedAt: "2026-04-20" })],
      priorLastValidatedAt: {},
      staleDays: SKILL_FRESHNESS_STALE_DAYS,
      archiveDays: SKILL_FRESHNESS_ARCHIVE_DAYS,
      bootstrapGraceDays: SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
    });

    expect(evaluation.signal.status).toBe("green");
  });

  it("flags stale skills above threshold", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "stale", lastValidatedAt: "2026-02-01" })],
      priorLastValidatedAt: {},
      staleDays: 30,
      archiveDays: 400,
      bootstrapGraceDays: SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.summary).toContain("1 stale");
    }
  });

  it("flags archive candidates above archive threshold", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "archive", lastValidatedAt: "2025-01-01" })],
      priorLastValidatedAt: {},
      staleDays: 30,
      archiveDays: 120,
      bootstrapGraceDays: SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.summary).toContain("1 archive-candidate");
      expect(evaluation.signal.body).toContain("Archive-candidate skills");
    }
  });

  it("suppresses missing metadata within grace window", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "new-skill", lastValidatedAt: null, createdAt: "2026-05-05" })],
      priorLastValidatedAt: {},
      staleDays: SKILL_FRESHNESS_STALE_DAYS,
      archiveDays: SKILL_FRESHNESS_ARCHIVE_DAYS,
      bootstrapGraceDays: 7,
    });

    expect(evaluation.signal.status).toBe("green");
  });

  it("flags missing metadata past grace window", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "old-skill", lastValidatedAt: null, createdAt: "2026-04-01" })],
      priorLastValidatedAt: {},
      staleDays: SKILL_FRESHNESS_STALE_DAYS,
      archiveDays: SKILL_FRESHNESS_ARCHIVE_DAYS,
      bootstrapGraceDays: 7,
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.summary).toContain("1 bootstrap-needed");
    }
  });

  it("flags baseline regression when validation date moves backwards", () => {
    const evaluation = evaluateSkillFreshness({
      runDate,
      entries: [makeEntry({ skillName: "regressed", lastValidatedAt: "2026-04-10" })],
      priorLastValidatedAt: { regressed: "2026-04-20" },
      staleDays: SKILL_FRESHNESS_STALE_DAYS,
      archiveDays: SKILL_FRESHNESS_ARCHIVE_DAYS,
      bootstrapGraceDays: SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS,
    });

    expect(evaluation.signal.status).toBe("red");
    if (evaluation.signal.status === "red") {
      expect(evaluation.signal.body).toContain("validation date regressed");
    }
  });
});

describe("drift-scan S10 (quick-ref vs rulebook)", () => {
  it("stops doom-stage capture at a close-paren instead of inventing a phantom stage (THR-914)", async () => {
    const { lintQuickReferenceVsRulebook } = await import("../lint-rulebook");
    const quickRef =
      "**Doom** (7 archetypes × 5 stages: Whispers, Signs, Tremors, Crisis, Culmination) ticks toward an Unmaking.";
    const rulebook =
      "Doom advances through Whispers, Signs, Tremors, Crisis, and Culmination before the Unmaking.";
    const result = lintQuickReferenceVsRulebook(quickRef, rulebook);
    expect(result.status).toBe("green");
  });

  it("still reports a stage genuinely missing from the rulebook", async () => {
    const { lintQuickReferenceVsRulebook } = await import("../lint-rulebook");
    const quickRef = "Doom (5 stages: Whispers, Signs, Tremors, Crisis, Culmination) ticks onward.";
    const rulebook = "Doom advances through Whispers, Signs, Tremors, and Crisis.";
    const result = lintQuickReferenceVsRulebook(quickRef, rulebook);
    expect(result.status).toBe("red");
    if (result.status === "red") {
      expect(result.body).toContain("Culmination");
      expect(result.body).not.toContain("ticks onward");
    }
  });
});

describe("drift-scan signal-scoped dedup (THR-756)", () => {
  // The eleven signal names main() actually files under, including the three
  // that carry an arrow so the arrow/em-dash distinction stays pinned.
  const SIGNAL_NAMES = [
    "coupling creep",
    "broken-windows tally",
    "test suite health",
    "UL drift",
    "Skill freshness",
    "rulebook → UL",
    "rulebook → Canon pages",
    "rulebook IMPL tags",
    "rulebook → Vision",
    "quick-ref vs rulebook",
    "interface-map coverage",
  ];

  it("round-trips every signal name through the generated title", () => {
    for (const name of SIGNAL_NAMES) {
      const title = formatIssueTitle("2026-07-24", name, "3 things drifted");
      expect(driftIssueSignalName(title)).toBe(name);
    }
  });

  it("matches the same signal across run dates — the duplicate-filing regression", () => {
    const lastWeek = formatIssueTitle(
      "2026-07-22",
      "UL drift",
      "6 canonical-unused, 15 used-uncanonical",
    );
    const thisWeek = formatIssueTitle(
      "2026-07-24",
      "UL drift",
      "6 canonical-unused, 15 used-uncanonical",
    );

    // The pre-fix dedup compared titles for equality. The embedded run date
    // makes that comparison false even when the drift is identical, which is
    // exactly how THR-706↔THR-746 (and four more pairs) came to be filed.
    expect(lastWeek).not.toBe(thisWeek);
    expect(isDriftIssueForSignal(lastWeek, "UL drift")).toBe(true);
  });

  it("does not match a different signal", () => {
    const ulDrift = formatIssueTitle("2026-07-24", "UL drift", "6 canonical-unused");
    const rulebookUl = formatIssueTitle("2026-07-24", "rulebook → UL", "8 broken references");

    expect(isDriftIssueForSignal(ulDrift, "rulebook → UL")).toBe(false);
    expect(isDriftIssueForSignal(rulebookUl, "UL drift")).toBe(false);
    expect(isDriftIssueForSignal(ulDrift, "interface-map coverage")).toBe(false);
  });

  it("ignores a signal name that appears in the summary rather than the name slot", () => {
    // The Linear query filters on the `drift-scan` label only, so the matcher is
    // the sole guard against adopting — and then overwriting — the wrong issue.
    // A substring test would match both of these; the position-anchored parse
    // must not.
    const otherSignal = formatIssueTitle(
      "2026-07-24",
      "coupling creep",
      "3 file(s) grew, worst offender tracked in the UL drift shard",
    );
    expect(isDriftIssueForSignal(otherSignal, "UL drift")).toBe(false);
    expect(isDriftIssueForSignal(otherSignal, "coupling creep")).toBe(true);

    // A human-filed ticket that merely names a signal is not that signal's issue.
    expect(isDriftIssueForSignal("Rework the UL drift signal thresholds", "UL drift")).toBe(false);
  });

  it("takes the first em dash as the name boundary when the summary carries one too", () => {
    const title = formatIssueTitle("2026-07-24", "test suite health", "runtime up 22% — 3 flaky");
    expect(driftIssueSignalName(title)).toBe("test suite health");
    expect(isDriftIssueForSignal(title, "test suite health")).toBe(true);
  });

  it("is case-insensitive on the signal name", () => {
    const title = formatIssueTitle("2026-07-24", "Skill freshness", "23 stale");
    expect(isDriftIssueForSignal(title, "skill freshness")).toBe(true);
  });

  it("returns null for titles the scan did not generate", () => {
    expect(driftIssueSignalName("Drift scan: UL drift — 6 canonical-unused")).toBeNull();
    expect(driftIssueSignalName("UL drift — 6 canonical-unused")).toBeNull();
    expect(
      driftIssueSignalName("Prune candidate: 5 engine modules have zero importers"),
    ).toBeNull();
    // A hand-written ticket that merely mentions the scan must not be adopted
    // as a signal's issue and silently overwritten.
    expect(
      isDriftIssueForSignal(
        "Drift scan: update open signal issues instead of filing weekly duplicates",
        "UL drift",
      ),
    ).toBe(false);
  });
});
