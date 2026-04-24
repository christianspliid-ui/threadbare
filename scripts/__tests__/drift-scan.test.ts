import { describe, expect, it } from "vitest";
import {
  BROKEN_WINDOWS_PCT,
  COUPLING_CREEP_PCT,
  TEST_FLAKE_MIN_RUNS,
  evaluateBrokenWindows,
  evaluateCouplingCreep,
  evaluateTestSuiteHealth,
  evaluateUlDrift,
  executeSignalSteps,
  parseCodesightImporters,
  parseUlShardTerms,
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
