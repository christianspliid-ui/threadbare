import { describe, expect, it, vi } from "vitest";
import {
  BILLING_ANNOTATION_PATTERN,
  DISPATCH_SILENCE_MIN_MINUTES,
  STALL_MIN_SECONDS,
  STARTUP_FAILURE_MAX_SECONDS,
  classifyActionsHealth,
  isDispatchSilenced,
  isStalledRun,
  isStartupFailure,
  type ActionsHealthInput,
  type ProbeOutcome,
  type PullRequestSuiteRecord,
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
    stalled: false,
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

/** A run that hung waiting for a runner — the 2026-08-06 signature (THR-1013). */
function stalledRun(overrides: Partial<WorkflowRunRecord> = {}): WorkflowRunRecord {
  return run({
    conclusion: "cancelled",
    updatedAtMs: NOW_MS + 15 * 60 * 1000,
    stalled: true,
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

/** An open PR whose head got its Actions suite normally (THR-1014). */
function pr(overrides: Partial<PullRequestSuiteRecord> = {}): PullRequestSuiteRecord {
  return {
    number: 1,
    isDraft: false,
    headAgeMinutes: 60,
    hasActionsSuite: true,
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

  /**
   * The regression this whole class exists for. On 2026-08-06 the probe returned
   * `healthy` twice while six armed PRs could not merge, because a hung run
   * matches no clause of the billing signature. `healthy` must now be reachable
   * only when BOTH classes are absent.
   */
  it("reports stalled — never healthy — when runs hung waiting for a runner (THR-1013)", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    const result = classifyActionsHealth(
      input({ runs: [stalledRun(), stalledRun(), stalledRun()], probe }),
    );

    expect(result.verdict).toBe("stalled");
    expect(result.stalledCount).toBe(3);
    expect(result.startupFailureCount).toBe(0);
    // A stall has no billing remedy, so it must not burn a re-run to ask.
    expect(probe).not.toHaveBeenCalled();
  });

  /**
   * `cancelled` does NOT satisfy branch protection the way `skipped` does, so
   * nothing unsafe can merge during a stall — only nothing at all can. Idling the
   * lane would forfeit delivery to guard a risk that is not present.
   */
  it("keeps the lane working during a stall — visibility, not a halt", () => {
    const result = classifyActionsHealth(input({ runs: [stalledRun()] }));

    expect(result.standDown).toBe(false);
    expect(result.needsChristian).toBe(false);
    expect(result.summary).toMatch(/nothing unsafe can merge/i);
  });

  it("reports recovered when a stall has cleared, without probing", () => {
    const probe = vi.fn<[WorkflowRunRecord], ProbeOutcome>(() => "reproduced");

    const result = classifyActionsHealth(
      input({ runs: [run(), stalledRun(), stalledRun()], probe }),
    );

    expect(result.verdict).toBe("recovered");
    expect(result.stalledCount).toBe(2);
    expect(result.summary).toMatch(/hung waiting for a machine/i);
    expect(probe).not.toHaveBeenCalled();
  });

  /**
   * The two classes are independent, and a billing block is the one that makes
   * the gate vacuous — so it must keep winning when both are in the window.
   */
  it("prefers billing-block over stalled when both classes are present", () => {
    const result = classifyActionsHealth(
      input({ runs: [startupFailed(), stalledRun()], probe: () => "reproduced" }),
    );

    expect(result.verdict).toBe("billing-block");
    expect(result.standDown).toBe(true);
    expect(result.stalledCount).toBe(1);
    expect(result.startupFailureCount).toBe(1);
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

describe("isStalledRun", () => {
  /**
   * Measured from run 31124028840 (PR #1326, THR-1008): `Detect code changes`
   * cancelled at 15m03s with an empty step list, taking the required check with
   * it. Both jobs report zero steps.
   */
  it("accepts the real 2026-08-06 signature — 15 minutes, zero steps, cancelled", () => {
    expect(
      isStalledRun({
        conclusion: "cancelled",
        durationSeconds: 903,
        jobStepCounts: [0, 0, 0],
      }),
    ).toBe(true);
  });

  it("accepts the same shape concluding failure — the run-level conclusion varies", () => {
    expect(
      isStalledRun({ conclusion: "failure", durationSeconds: 1808, jobStepCounts: [0, 0, 0] }),
    ).toBe(true);
  });

  /** A concurrency supersede reaps a queued run promptly; only duration separates them. */
  it("rejects a quickly-cancelled run — that is a concurrency supersede, not a stall", () => {
    expect(
      isStalledRun({
        conclusion: "cancelled",
        durationSeconds: STALL_MIN_SECONDS - 1,
        jobStepCounts: [0, 0],
      }),
    ).toBe(false);
  });

  /** The healthy 20:05Z dispatch run: detect executed 7 steps. */
  it("rejects a run where any job executed steps, however long it took", () => {
    expect(
      isStalledRun({ conclusion: "failure", durationSeconds: 3600, jobStepCounts: [7, 0, 0] }),
    ).toBe(false);
  });

  it("rejects a successful run", () => {
    expect(
      isStalledRun({ conclusion: "success", durationSeconds: 900, jobStepCounts: [0] }),
    ).toBe(false);
  });

  /**
   * Fail-soft (NFP #4): `fetchRunJobStepCounts` returns `[]` when the jobs cannot
   * be read. Without the `length > 0` guard, "every job has zero steps" would be
   * vacuously true and an unreadable run would manufacture an outage.
   */
  it("rejects a run whose jobs could not be read at all", () => {
    expect(
      isStalledRun({ conclusion: "cancelled", durationSeconds: 900, jobStepCounts: [] }),
    ).toBe(false);
  });

  it("rejects an in-flight run", () => {
    expect(
      isStalledRun({ conclusion: null, durationSeconds: 900, jobStepCounts: [0] }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Dispatch silence — the run that was never created (THR-1014)
// ---------------------------------------------------------------------------

describe("isDispatchSilenced", () => {
  /**
   * The three PRs measured at 20:06Z on 2026-08-06, which are the ticket's own
   * Done-when fixture. #1326 got its suite at 17:45:01Z; #1327 and #1328 were
   * opened at 18:26Z and 19:32Z and never got one at all.
   */
  it("matches the two PRs measured silent and clears the one that got a suite", () => {
    expect(isDispatchSilenced(pr({ number: 1326, headAgeMinutes: 141, hasActionsSuite: true }))).toBe(false);
    expect(isDispatchSilenced(pr({ number: 1327, headAgeMinutes: 94, hasActionsSuite: false }))).toBe(true);
    expect(isDispatchSilenced(pr({ number: 1328, headAgeMinutes: 34, hasActionsSuite: false }))).toBe(true);
  });

  /** A draft not having CI is the author's own signal, not an outage. */
  it("ignores a draft PR with no suite", () => {
    expect(isDispatchSilenced(pr({ isDraft: true, hasActionsSuite: false }))).toBe(false);
  });

  /**
   * Keyed on the HEAD COMMIT's age, not the PR's. A long-lived PR force-pushed a
   * moment ago is new work, not a stalled one — measured on the 2026-08-07
   * recovery pushes, a suite appeared 4 seconds after the push.
   */
  it("ignores a freshly pushed head that has not yet had time to get a suite", () => {
    expect(
      isDispatchSilenced(pr({ headAgeMinutes: DISPATCH_SILENCE_MIN_MINUTES - 1, hasActionsSuite: false })),
    ).toBe(false);
  });

  it("matches exactly at the threshold", () => {
    expect(
      isDispatchSilenced(pr({ headAgeMinutes: DISPATCH_SILENCE_MIN_MINUTES, hasActionsSuite: false })),
    ).toBe(true);
  });
});

describe("classifyActionsHealth — dispatch silence", () => {
  /**
   * The ticket's central Done-when: `healthy` must be UNREACHABLE while a
   * qualifying PR exists. This is the exact state three separate lane runs were
   * told was healthy on 2026-08-06, and that this run was told again 17h later.
   */
  it("cannot report healthy while an open PR has no suite", () => {
    const result = classifyActionsHealth(
      input({
        runs: [run(), run()],
        pullRequests: [pr({ number: 1327, hasActionsSuite: false })],
      }),
    );

    expect(result.verdict).toBe("dispatch-silence");
    expect(result.dispatchSilencedPrs).toEqual([1327]);
    expect(result.standDown).toBe(false);
    expect(result.needsChristian).toBe(false);
  });

  it("names every silenced PR in the summary", () => {
    const result = classifyActionsHealth(
      input({
        runs: [run()],
        pullRequests: [
          pr({ number: 1327, hasActionsSuite: false }),
          pr({ number: 1328, hasActionsSuite: false }),
          pr({ number: 1326, hasActionsSuite: true }),
        ],
      }),
    );

    expect(result.dispatchSilencedPrs).toEqual([1327, 1328]);
    expect(result.summary).toContain("#1327");
    expect(result.summary).toContain("#1328");
    expect(result.summary).not.toContain("#1326");
  });

  it("stays healthy when every open PR got its suite", () => {
    const result = classifyActionsHealth(
      input({ runs: [run()], pullRequests: [pr({ number: 1326 }), pr({ number: 1330 })] }),
    );

    expect(result.verdict).toBe("healthy");
    expect(result.dispatchSilencedPrs).toEqual([]);
  });

  /**
   * Omitting the field means "not measured", which must never be read as
   * "measured clean" — the IO layer passes `undefined` when the PR list could
   * not be read at all.
   */
  it("reports the run-based verdict unchanged when PRs were not measured", () => {
    const result = classifyActionsHealth(input({ runs: [run()] }));

    expect(result.verdict).toBe("healthy");
    expect(result.dispatchSilencedPrs).toEqual([]);
  });

  /**
   * Silence overrides only benign verdicts. A billing block makes the gate
   * VACUOUS — untested code can reach `main` — so it outranks a stall and must
   * keep both its verdict and its stand-down.
   */
  it("never masks a live billing block", () => {
    const result = classifyActionsHealth(
      input({
        runs: [startupFailed()],
        probe: () => "reproduced",
        pullRequests: [pr({ number: 1327, hasActionsSuite: false })],
      }),
    );

    expect(result.verdict).toBe("billing-block");
    expect(result.standDown).toBe(true);
    expect(result.needsChristian).toBe(true);
    // Still reported, just not promoted over the more dangerous finding.
    expect(result.dispatchSilencedPrs).toEqual([1327]);
  });

  /** `stalled` is already a non-benign stall verdict; it is not downgraded either. */
  it("never masks a stall", () => {
    const result = classifyActionsHealth(
      input({
        runs: [stalledRun()],
        pullRequests: [pr({ number: 1327, hasActionsSuite: false })],
      }),
    );

    expect(result.verdict).toBe("stalled");
    expect(result.dispatchSilencedPrs).toEqual([1327]);
  });

  /**
   * `recovered` and `transient` both assert the problem has cleared, which a
   * silenced PR falsifies — so both are overridden.
   */
  it("overrides recovered, which would otherwise claim the problem cleared", () => {
    const result = classifyActionsHealth(
      input({
        runs: [run(), startupFailed()],
        pullRequests: [pr({ number: 1327, hasActionsSuite: false })],
      }),
    );

    expect(result.verdict).toBe("dispatch-silence");
    // The run-based counts survive the override rather than being reset.
    expect(result.startupFailureCount).toBe(1);
  });
});
