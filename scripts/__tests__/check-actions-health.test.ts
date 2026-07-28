import { describe, expect, it, vi } from "vitest";
import {
  BILLING_ANNOTATION_PATTERN,
  STARTUP_FAILURE_MAX_SECONDS,
  classifyActionsHealth,
  isStartupFailure,
  type ActionsHealthInput,
  type ProbeOutcome,
  type WorkflowRunRecord,
} from "../check-actions-health";

const NOW_MS = new Date("2026-07-28T17:00:00Z").getTime();

/** The exact string GitHub emitted in all four observed occurrences. */
const BILLING_ANNOTATION =
  "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings";

let nextId = 1;

function run(overrides: Partial<WorkflowRunRecord> = {}): WorkflowRunRecord {
  const id = overrides.id ?? nextId++;
  return {
    id,
    workflowName: "CI",
    conclusion: "success",
    createdAtMs: NOW_MS,
    updatedAtMs: NOW_MS + 5 * 60 * 1000,
    startupFailure: false,
    ...overrides,
  };
}

/** A run that died at startup — the billing signature. */
function startupFailed(overrides: Partial<WorkflowRunRecord> = {}): WorkflowRunRecord {
  return run({
    conclusion: "failure",
    updatedAtMs: NOW_MS + 3 * 1000,
    startupFailure: true,
    ...overrides,
  });
}

function input(overrides: Partial<ActionsHealthInput> = {}): ActionsHealthInput {
  return {
    runs: [],
    probe: () => "unavailable",
    ...overrides,
  };
}

describe("classifyActionsHealth", () => {
  it("reports healthy when no run died at startup", () => {
    const result = classifyActionsHealth(input({ runs: [run(), run(), run()] }));

    expect(result.verdict).toBe("healthy");
    expect(result.needsChristian).toBe(false);
    expect(result.standDown).toBe(false);
    expect(result.startupFailureCount).toBe(0);
  });

  it("reports unknown when no runs are visible at all", () => {
    const result = classifyActionsHealth(input({ runs: [] }));

    expect(result.verdict).toBe("unknown");
    expect(result.needsChristian).toBe(false);
    expect(result.standDown).toBe(false);
  });

  it("reports billing-block and stands the lane down when a re-run reproduces the failure", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    const result = classifyActionsHealth(
      input({ runs: [startupFailed(), startupFailed(), run()], probe }),
    );

    expect(result.verdict).toBe("billing-block");
    expect(result.needsChristian).toBe(true);
    expect(result.standDown).toBe(true);
    expect(result.startupFailureCount).toBe(2);
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("reports transient — not billing — when a fresh re-run executes jobs", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "executed");

    const result = classifyActionsHealth(input({ runs: [startupFailed()], probe }));

    expect(result.verdict).toBe("transient");
    expect(result.needsChristian).toBe(false);
    expect(result.standDown).toBe(false);
    expect(result.summary).toMatch(/not a billing block/i);
  });

  it("reports unknown — never billing-block — when the re-run cannot be read", () => {
    const result = classifyActionsHealth(
      input({ runs: [startupFailed()], probe: () => "unavailable" }),
    );

    expect(result.verdict).toBe("unknown");
    expect(result.needsChristian).toBe(false);
    expect(result.standDown).toBe(false);
  });

  /**
   * The 2026-07-28 occurrence recovered at 17:03:03Z between two hourly ticks.
   * Without this branch the next tick would burn a re-run rediscovering a
   * resolved outage — and, worse, could stand the lane down over it.
   */
  it("reports recovered WITHOUT probing when the newest completed run executed jobs", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    const result = classifyActionsHealth(
      input({ runs: [run(), startupFailed(), startupFailed()], probe }),
    );

    expect(result.verdict).toBe("recovered");
    expect(result.needsChristian).toBe(false);
    expect(result.standDown).toBe(false);
    expect(result.startupFailureCount).toBe(2);
    expect(probe).not.toHaveBeenCalled();
  });

  it("ignores in-flight runs when deciding which completed run is newest", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    // An in-flight run sits above a startup failure. It proves nothing either
    // way, so the failure below it must still drive the verdict.
    const result = classifyActionsHealth(
      input({ runs: [run({ conclusion: null }), startupFailed()], probe }),
    );

    expect(result.verdict).toBe("billing-block");
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("reports unknown when every run newer than the failures is still in flight", () => {
    const result = classifyActionsHealth(
      input({ runs: [run({ conclusion: null, startupFailure: true })] }),
    );

    expect(result.verdict).toBe("unknown");
    expect(result.standDown).toBe(false);
  });

  it("probes the newest completed startup failure, not an older one", () => {
    const newest = startupFailed({ id: 100 });
    const older = startupFailed({ id: 99 });
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    classifyActionsHealth(input({ runs: [newest, older], probe }));

    expect(probe).toHaveBeenCalledWith(newest);
  });

  it("writes a plain-language summary naming the human action (THR-608)", () => {
    const result = classifyActionsHealth(
      input({ runs: [startupFailed()], probe: () => "reproduced" }),
    );

    // Christian reads this sentence in the briefing, not a diff. It must say
    // what broke, what it means, and that it is his to fix — without jargon.
    expect(result.summary).toMatch(/budget/i);
    expect(result.summary).toMatch(/Billing & plans/);
    expect(result.summary).not.toMatch(/annotation|conclusion|workflow_run/i);
  });
});

describe("isStartupFailure", () => {
  it("accepts the real GitHub billing annotation on a 3-second failure", () => {
    expect(
      isStartupFailure({
        conclusion: "failure",
        durationSeconds: 3,
        annotations: [BILLING_ANNOTATION],
      }),
    ).toBe(true);
  });

  it("rejects a successful run even when the annotation is somehow present", () => {
    expect(
      isStartupFailure({
        conclusion: "success",
        durationSeconds: 3,
        annotations: [BILLING_ANNOTATION],
      }),
    ).toBe(false);
  });

  it("rejects a slow genuine failure — a real test failure is not a startup failure", () => {
    expect(
      isStartupFailure({
        conclusion: "failure",
        durationSeconds: STARTUP_FAILURE_MAX_SECONDS + 1,
        annotations: [BILLING_ANNOTATION],
      }),
    ).toBe(false);
  });

  it("rejects a fast failure whose annotations are unrelated", () => {
    expect(
      isStartupFailure({
        conclusion: "failure",
        durationSeconds: 3,
        annotations: ["Process completed with exit code 1", "npm ERR! code ELIFECYCLE"],
      }),
    ).toBe(false);
  });

  it("rejects a fast failure with no annotations at all", () => {
    expect(
      isStartupFailure({ conclusion: "failure", durationSeconds: 3, annotations: [] }),
    ).toBe(false);
  });

  it("matches either clause independently — the wording has drifted between occurrences", () => {
    expect(BILLING_ANNOTATION_PATTERN.test("recent account payments have failed")).toBe(true);
    expect(BILLING_ANNOTATION_PATTERN.test("your spending limit needs to be increased")).toBe(true);
    expect(BILLING_ANNOTATION_PATTERN.test("The runner has received a shutdown signal")).toBe(false);
  });
});
