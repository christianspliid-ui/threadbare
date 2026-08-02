import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MIN_RUNS_FOR_ALL_RED,
  WORKFLOW_DIR,
  WORKFLOW_RUN_LOOKBACK,
  classifyWorkflowHealth,
  findScheduledWorkflowFiles,
  hasScheduleTrigger,
  type ScheduledWorkflowInput,
  type WorkflowRunRecord,
} from "../check-workflow-health";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const NOW_MS = new Date("2026-08-02T12:00:00Z").getTime();

function runRecord(conclusion: string | null, ageHours = 12, status = "completed"): WorkflowRunRecord {
  return { conclusion, status, createdAtMs: NOW_MS - ageHours * 60 * 60 * 1000 };
}

function workflow(overrides: Partial<ScheduledWorkflowInput> = {}): ScheduledWorkflowInput {
  return {
    name: "Stale Claim Sweep",
    file: "stale-claim-sweep.yml",
    state: "active",
    runs: [],
    ...overrides,
  };
}

/** N consecutive failures, newest first. */
function allRed(n: number): WorkflowRunRecord[] {
  return Array.from({ length: n }, (_, i) => runRecord("failure", 12 * (i + 1)));
}

describe("hasScheduleTrigger", () => {
  it("recognises a real scheduled workflow", () => {
    expect(
      hasScheduleTrigger(`name: Stale Claim Sweep

on:
  schedule:
    - cron: "0 */12 * * *"
  workflow_dispatch:
`),
    ).toBe(true);
  });

  it("rejects a workflow with no schedule trigger", () => {
    expect(
      hasScheduleTrigger(`name: CI

on:
  push:
    branches: [main]
  pull_request:
`),
    ).toBe(false);
  });

  it("does not read a commented-out schedule as live", () => {
    // The exact shape someone leaves behind when they disable a lane by hand.
    expect(
      hasScheduleTrigger(`name: Retired Sweep

on:
  # schedule:
  #   - cron: "0 */12 * * *"
  workflow_dispatch:
`),
    ).toBe(false);
  });

  it("requires a cron entry, not merely the schedule key", () => {
    expect(
      hasScheduleTrigger(`name: Half Written

on:
  schedule:
  workflow_dispatch:
`),
    ).toBe(false);
  });
});

describe("findScheduledWorkflowFiles", () => {
  it("derives membership from the tree rather than a hardcoded list", () => {
    const found = findScheduledWorkflowFiles(REPO_ROOT);
    expect(found).not.toBeNull();

    // Cross-check against the directory independently: every file the probe
    // claims is scheduled must actually carry the trigger, and none it skipped
    // may. This is what stops the predicate from silently narrowing.
    const dir = path.join(REPO_ROOT, WORKFLOW_DIR);
    const expected = fs
      .readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f))
      .filter((f) => hasScheduleTrigger(fs.readFileSync(path.join(dir, f), "utf8")));

    expect([...(found as string[])].sort()).toEqual([...expected].sort());
    // Guard against a vacuous pass: the repo does have scheduled workflows.
    expect(expected.length).toBeGreaterThan(0);
  });

  it("returns null when the workflow directory cannot be read", () => {
    expect(findScheduledWorkflowFiles(path.join(REPO_ROOT, "no-such-dir-9f3a"))).toBeNull();
  });
});

describe("classifyWorkflowHealth", () => {
  it("reports all-red and asks for a human when every scheduled run failed", () => {
    const result = classifyWorkflowHealth([workflow({ runs: allRed(5) })]);

    expect(result.verdict).toBe("all-red");
    expect(result.needsChristian).toBe(true);
    expect(result.workflows[0].considered).toHaveLength(5);
  });

  it("is the THR-834 reference case: 88-of-88 red surfaces as all-red", () => {
    // The probe only ever sees a window, not all 88 — the point is that the
    // window it does see is unanimously red and that is enough.
    const result = classifyWorkflowHealth([
      workflow({ runs: allRed(WORKFLOW_RUN_LOOKBACK) }),
    ]);

    expect(result.verdict).toBe("all-red");
    expect(result.needsChristian).toBe(true);
    expect(result.summary).toContain("Stale Claim Sweep");
  });

  it("does not alarm on a single isolated failure", () => {
    const result = classifyWorkflowHealth([workflow({ runs: allRed(1) })]);

    expect(result.verdict).toBe("healthy");
    expect(result.needsChristian).toBe(false);
  });

  it(`requires ${MIN_RUNS_FOR_ALL_RED} consecutive failures before alarming`, () => {
    const below = classifyWorkflowHealth([workflow({ runs: allRed(MIN_RUNS_FOR_ALL_RED - 1) })]);
    const at = classifyWorkflowHealth([workflow({ runs: allRed(MIN_RUNS_FOR_ALL_RED) })]);

    expect(below.verdict).toBe("healthy");
    expect(at.verdict).toBe("all-red");
  });

  it("clears the alarm as soon as one run goes green", () => {
    const result = classifyWorkflowHealth([
      workflow({ runs: [runRecord("success", 12), ...allRed(4)] }),
    ]);

    expect(result.verdict).toBe("healthy");
    expect(result.needsChristian).toBe(false);
  });

  it("distinguishes never-run from all-red, and does not call it a failure", () => {
    const result = classifyWorkflowHealth([workflow({ name: "Weekly Drift Scan", runs: [] })]);

    expect(result.verdict).toBe("never-run");
    expect(result.needsChristian).toBe(false);
  });

  it("treats a window of only cancelled runs as never-run, not all-red", () => {
    const result = classifyWorkflowHealth([
      workflow({ runs: [runRecord("cancelled"), runRecord("skipped"), runRecord("neutral")] }),
    ]);

    expect(result.verdict).toBe("never-run");
    expect(result.needsChristian).toBe(false);
  });

  it("ignores runs still in flight rather than counting them as failures", () => {
    const result = classifyWorkflowHealth([
      workflow({ runs: [runRecord(null, 1, "in_progress"), runRecord("success", 13)] }),
    ]);

    expect(result.verdict).toBe("healthy");
    expect(result.workflows[0].considered).toEqual(["success"]);
  });

  it("distinguishes disabled from all-red, and flags an inactivity disable", () => {
    const result = classifyWorkflowHealth([
      workflow({ state: "disabled_inactivity", runs: [] }),
    ]);

    expect(result.verdict).toBe("disabled");
    expect(result.needsChristian).toBe(true);
    expect(result.summary).toMatch(/switched off automatically/);
  });

  it("reports a manual disable without paging a human about a chosen state", () => {
    const result = classifyWorkflowHealth([workflow({ state: "disabled_manually", runs: [] })]);

    expect(result.verdict).toBe("disabled");
    expect(result.needsChristian).toBe(false);
  });

  it("does not let a stale green history mask a disabled schedule", () => {
    // A workflow GitHub has stopped running may still have five green runs on
    // record. State outranks history.
    const result = classifyWorkflowHealth([
      workflow({
        state: "disabled_inactivity",
        runs: Array.from({ length: 5 }, () => runRecord("success")),
      }),
    ]);

    expect(result.verdict).toBe("disabled");
    expect(result.needsChristian).toBe(true);
  });

  it("degrades to unknown when a workflow's history could not be fetched", () => {
    const result = classifyWorkflowHealth([workflow({ runs: null })]);

    expect(result.verdict).toBe("unknown");
    expect(result.needsChristian).toBe(false);
  });

  it("surfaces the worst verdict across workflows and keeps every report", () => {
    const result = classifyWorkflowHealth([
      workflow({ name: "Weekly Drift Scan", file: "drift-scan.yml", runs: [runRecord("success")] }),
      workflow({ runs: allRed(3) }),
    ]);

    expect(result.verdict).toBe("all-red");
    expect(result.needsChristian).toBe(true);
    expect(result.workflows).toHaveLength(2);
    expect(result.workflows[0].verdict).toBe("healthy");
    // The summary names only what needs attention, not the healthy lane.
    expect(result.summary).toContain("Stale Claim Sweep");
    expect(result.summary).not.toContain("Weekly Drift Scan");
  });

  it("reports healthy in plain language when every lane is green", () => {
    const result = classifyWorkflowHealth([
      workflow({ runs: [runRecord("success")] }),
      workflow({ name: "Weekly Drift Scan", file: "drift-scan.yml", runs: [runRecord("success")] }),
    ]);

    expect(result.verdict).toBe("healthy");
    expect(result.needsChristian).toBe(false);
    expect(result.summary).toBe("All 2 scheduled background jobs are running normally.");
  });

  it("degrades to unknown when no scheduled workflows were found at all", () => {
    const result = classifyWorkflowHealth([]);

    expect(result.verdict).toBe("unknown");
    expect(result.needsChristian).toBe(false);
  });
});
