#!/usr/bin/env node

/**
 * GitHub Actions health probe — billing-block detector (THR-768).
 *
 * Answers one question: **is the merge gate actually running, or only pretending to?**
 *
 * ## The failure class
 *
 * When the account's Actions budget is exhausted, every workflow run concludes
 * `failure` in 3–5 seconds having executed **zero steps**, carrying GitHub's own
 * annotation:
 *
 * > The job was not started because recent account payments have failed or your
 * > spending limit needs to be increased. Please check the 'Billing & plans'
 * > section in your settings
 *
 * Two consequences, the second far worse than the first:
 *
 * 1. **Finished work strands.** `Linear Auto-Close` never runs, so a correctly
 *    closed ticket sits In Dev holding the WIP=1 slot. A startup-failed run is
 *    never retriggered by anything — see `--recover` below.
 * 2. **Branch protection goes vacuous while still reading as enforced.** When
 *    `Detect code changes` dies at startup, the required `Test · Typecheck ·
 *    Build` check records as `skipped`, and a skipped required check *satisfies*
 *    branch protection. Anything can reach `main` with no test having run.
 *    Reproduced end to end on PR #853 (2026-07-25) and again on PR #1022
 *    (2026-07-28, which carried engine + content changes).
 *
 * The hole at (2) is closed at source by the `Guard — change detection health`
 * step in `.github/workflows/ci.yml`, which turns that `skipped` into a
 * `failure`. This probe is the *other* half: it names the outage, tells the lane
 * to stand down, and cleans up afterwards.
 *
 * ## Why a detector rather than "notice it"
 *
 * The class is trivially machine-detectable — a fixed string — yet it has cost
 * four separate sessions the same manual rediagnosis (impediments #91, #136, and
 * the 2026-07-25 / 2026-07-28 occurrences). Each diagnosis was slow because the
 * signature is **indistinguishable from a transient Actions incident** until you
 * re-run something. That ambiguity has already produced one wrong call, retracted
 * four minutes later (`Design/user-actions.md`, 2026-07-25 15:16).
 *
 * So disambiguation is part of the detector, not left to judgment:
 *
 * | verdict         | meaning                                                                   | needs a human |
 * |-----------------|---------------------------------------------------------------------------|---------------|
 * | `healthy`       | no startup failures in the lookback window                                | no  |
 * | `recovered`     | startup failures in the window, but the newest completed run executed jobs | no  |
 * | `billing-block` | newest run failed at startup **and** a fresh re-run reproduced it          | **yes** |
 * | `transient`     | newest run failed at startup but a fresh re-run executed jobs             | no  |
 * | `stalled`       | newest run hung waiting for a runner and was reaped (THR-1013)            | no  |
 * | `dispatch-silence` | an open PR's head commit has no Actions check suite at all (THR-1014)  | no  |
 * | `unknown`       | probe could not determine state (network, auth, no re-runnable candidate) | no (fail-soft) |
 *
 * ## The second failure class: a hang, not a block (THR-1013)
 *
 * On 2026-08-06 GitHub stopped handing out runners. Jobs were accepted, reported
 * as started, executed **zero steps**, and were reaped at ~15 minutes as
 * `cancelled`. Six armed PRs could not merge for ~4 hours.
 *
 * This probe reported `healthy` throughout — twice, on two separate sessions —
 * because every clause of the billing signature was absent: the conclusion was
 * `cancelled` rather than `failure`, the duration was 15–31 minutes rather than
 * 3–5 seconds, and there was no annotation at all. A detector built for one
 * outage shape had nothing to say about the other, and said it confidently.
 *
 * The two classes are genuinely different and keep separate verdicts:
 *
 * |                  | billing block                    | stall                          |
 * |------------------|----------------------------------|--------------------------------|
 * | required check   | `skipped` — **satisfies** protection | `cancelled` — blocks       |
 * | danger           | untested code can reach `main`   | nothing merges                 |
 * | remedy           | Christian tops up the budget     | none; GitHub capacity returns  |
 * | lane response    | stand down                       | keep working, say so           |
 *
 * That last row is why `stalled` does not set `standDown`: see the comment at
 * its return site.
 *
 * ## The third failure class: the run is never created at all (THR-1014)
 *
 * Both classes above are properties of **a run that exists**. The strictly worse
 * case is that Actions stops reacting to `pull_request` / `push` events entirely:
 * no run, no check suite, nothing to list. Every run-list detector is
 * structurally blind to it, because a run list that stops growing is
 * indistinguishable from a quiet hour — so the probe reads a stale-but-clean
 * window and answers `healthy` with full confidence. The most complete failure
 * available is the one it could least see.
 *
 * Measured across the 2026-08-06/07 incident, from the check-suites API — which
 * is authoritative here precisely because `gh run list` cannot show what does not
 * exist. At 20:06Z on 08-06, two armed PRs had never had an Actions suite
 * created. By 11:12Z on 08-07 the silence had run **17 hours** and spread to four
 * PRs, one of which carried THR-1013's own fix for the class above:
 *
 * ```
 * PR#1329  vercel ✓  github-actions ABSENT   (carries the THR-1013 fix)
 * PR#1328  vercel ✓  github-actions ABSENT
 * PR#1327  vercel ✓  github-actions ABSENT
 * PR#1325  vercel ✓  github-actions ABSENT
 * ```
 *
 * Vercel's suite was created normally on all four, so commits and webhooks were
 * fine. `workflow_dispatch` (20:05Z) and `schedule` (03:07Z) both ran green, so
 * the workflow file and the runner pool were healthy throughout. Repo config was
 * ruled out: Actions `enabled`, all four workflows `state=active`. Only the
 * event → run-creation path was dead.
 *
 * Three properties make this class worth its own verdict:
 *
 * |                  | stall (THR-1013)               | dispatch silence (THR-1014)      |
 * |------------------|--------------------------------|----------------------------------|
 * | run exists       | yes — hangs, then reaped       | **no** — never created           |
 * | visible in       | the run list                   | only the check-suites API        |
 * | clears itself    | yes, when capacity returns     | **no** — it ran 17h and did not  |
 * | remedy           | wait                           | push an empty commit to the head |
 *
 * That third row is the operationally important one, and it is why this verdict
 * exists rather than folding into `stalled`. A stall is waited out. Dispatch
 * silence is not: on 08-07 an empty commit to each head branch created a suite
 * within four seconds and drained all four PRs, so every one of those 17 hours
 * was pure loss against a one-line recovery nobody knew to run.
 *
 * `standDown` stays FALSE, for the `stalled` reason: with no suite created the
 * required check never reports, the PR stays `BLOCKED`, and nothing unsafe
 * reaches `main`. This is a stall, not a vacuous gate.
 *
 * `recovered` exists because the cheap check comes first: if the newest completed
 * run executed jobs, the block has already lifted and there is nothing to
 * re-run. Today's occurrence (2026-07-28) recovered at 17:03:03Z between two
 * hourly ticks, so without this verdict the very next tick would have burned a
 * re-run to rediscover a resolved outage.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped; anything unexpected degrades to `unknown` and
 * exits 0. This probe must never be the reason an hourly tick fails.
 *
 * Usage:
 *   npm run check:actions              # advisory; always exits 0
 *   npm run check:actions -- --strict  # exits 1 on billing-block (lane stands down)
 *   npm run check:actions -- --json    # machine-readable single-line JSON
 *   npm run check:actions -- --no-probe  # skip the re-run disambiguator (read-only)
 *   npm run check:actions -- --recover           # LIST auto-close runs stranded by an outage
 *   npm run check:actions -- --recover --apply   # ...and actually re-run them
 */

import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/** GitHub `owner/repo` whose Actions runs describe the merge gate. */
export const GH_REPO = "christianspliid-ui/threadbare";

/** How many recent workflow runs to consider. One hour of this repo's traffic is ~8. */
export const ACTIONS_LOOKBACK = 20;

/**
 * How many of the newest *failed* runs to pull annotations for. Bounds API cost:
 * annotations need one call per job per run, and one confirmed startup failure is
 * as informative as ten.
 */
export const ANNOTATION_INSPECT_LIMIT = 6;

/**
 * A run that concluded `failure` in under this many seconds executed nothing.
 * Real CI here takes 4–12 minutes; the startup failures measured across all four
 * occurrences completed in 3–5s. 60s is far outside both distributions, so it
 * cannot confuse a fast genuine failure with a job that never started.
 *
 * This is only a *candidate* filter — `BILLING_ANNOTATION_PATTERN` is what
 * actually confirms the class.
 */
export const STARTUP_FAILURE_MAX_SECONDS = 60;

/**
 * GitHub's annotation for a budget-exhausted account. Matched loosely (either
 * half suffices) because the wording has drifted slightly between occurrences
 * while both clauses survived.
 */
export const BILLING_ANNOTATION_PATTERN =
  /recent account payments have failed|spending limit needs to be increased/i;

/**
 * A run whose jobs executed **no steps** yet lasted at least this long did not
 * fail — it hung waiting for a runner and was reaped (THR-1013).
 *
 * Ten minutes is decisive against all three neighbouring classes:
 *
 * - **Billing startup failure** completes in 3–5s, so it never reaches this
 *   floor and stays with `isStartupFailure` — which is right, because that class
 *   has a different remedy and a different verdict.
 * - **Concurrency supersede** (`cancel-in-progress: true`) reaps a queued run the
 *   moment its replacement starts. The lane pushes at most a few times an hour,
 *   so a superseded run is cancelled far inside ten minutes.
 * - **A genuine fast failure** executes steps, so it fails the zero-steps half of
 *   the predicate regardless of how long it took.
 *
 * Measured on the 2026-08-06 occurrence: 15m03s, 15m02s, 20m09s, 30m08s and
 * 31m18s — every one of them comfortably past this floor.
 */
export const STALL_MIN_SECONDS = 600;

/**
 * How many of the newest stall-*candidate* runs get a jobs lookup. Same bounding
 * rationale as `ANNOTATION_INSPECT_LIMIT`: one call per run, and the verdict is
 * decided by the newest completed run, so a truncated tail can only under-report
 * the count in the summary.
 */
export const STALL_INSPECT_LIMIT = 6;

/** Run conclusions that can carry a stall. A `success` run executed something by definition. */
export const STALL_CANDIDATE_CONCLUSIONS = new Set(["cancelled", "failure"]);

/**
 * The `app.slug` a GitHub Actions check suite carries. Anything else on the same
 * commit — `vercel`, most notably — proves the commit and its webhooks were
 * delivered fine, which is exactly what makes an absent Actions suite diagnostic
 * rather than ambiguous (THR-1014).
 */
export const ACTIONS_APP_SLUG = "github-actions";

/**
 * How old a PR's head commit must be before a missing Actions suite counts as
 * silence rather than as normal lag (THR-1014).
 *
 * Ten minutes is far outside the healthy distribution: measured on the recovery
 * pushes of 2026-08-07, a suite appeared **4 seconds** after the push on all four
 * PRs. It is also well inside the failure distribution, whose shortest observed
 * instance was 94 minutes and whose longest ran 17 hours. Nothing sits between
 * four seconds and 94 minutes, so the threshold has a wide empty band either
 * side and cannot be made to flicker by ordinary queueing.
 */
export const DISPATCH_SILENCE_MIN_MINUTES = 10;

/**
 * How many open PRs get a check-suites lookup, newest head first.
 *
 * One API call per PR, and — like `ANNOTATION_INSPECT_LIMIT` — a truncated tail
 * can only under-report the *count*, never flip the verdict: one silenced PR is
 * as decisive as ten. Twenty is comfortably above this repo's steady-state open-PR
 * population (8 during the incident that motivated the check).
 */
export const DISPATCH_SILENCE_PR_LIMIT = 20;

/** Workflow whose stranded runs `--recover` re-runs, and its workflow file. */
export const RECOVERABLE_WORKFLOW = "Linear Auto-Close";
export const RECOVERABLE_WORKFLOW_FILE = "linear-autoclose.yml";

/**
 * How many `RECOVERABLE_WORKFLOW` runs `--recover` scans, and how many of its
 * failures get an annotation lookup.
 *
 * Deliberately wider than `ACTIONS_LOOKBACK` / `ANNOTATION_INSPECT_LIMIT`, and
 * scanned against the workflow directly rather than filtered out of the general
 * run list. Measured 2026-07-28: the general list is interleaved across all
 * workflows, so 20 runs reached back only ~35 minutes and the 6-annotation cap
 * truncated it further — recovery found 3 stranded runs and **missed the one that
 * mattered** (THR-822's own auto-close, 7 runs deep). Under-reporting is harmless
 * for the *verdict* (decided by the newest completed run) but is the whole ball
 * game for recovery, so this path pays for a wider net.
 */
export const RECOVERY_LOOKBACK = 40;

/** How long to wait for a probe re-run to reach a conclusion, and how often to look. */
export const PROBE_TIMEOUT_SECONDS = 90;
export const PROBE_POLL_INTERVAL_SECONDS = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionsVerdict =
  | "healthy"
  | "recovered"
  | "billing-block"
  | "transient"
  | "stalled"
  | "dispatch-silence"
  | "unknown";

export interface WorkflowRunRecord {
  id: number;
  workflowName: string;
  /** `null` while the run is still in flight. */
  conclusion: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  /**
   * True when this run concluded `failure` having executed nothing, with the
   * billing annotation present. Resolved by the IO layer so the classifier stays
   * pure.
   */
  startupFailure: boolean;
  /**
   * True when this run hung waiting for a runner and was reaped — jobs present,
   * zero steps executed across all of them, past `STALL_MIN_SECONDS` (THR-1013).
   * Resolved by the IO layer for the same purity reason as `startupFailure`.
   */
  stalled: boolean;
}

/** Outcome of re-running one startup-failed workflow. */
export type ProbeOutcome =
  /** The fresh run also died at startup — the block is live. */
  | "reproduced"
  /** The fresh run executed jobs — the earlier failure was transient. */
  | "executed"
  /** Could not re-run or could not read the result. */
  | "unavailable";

/**
 * One open pull request, reduced to what the dispatch-silence predicate needs
 * (THR-1014). Resolved by the IO layer so the classifier stays pure.
 */
export interface PullRequestSuiteRecord {
  number: number;
  /** Draft PRs are excluded: not having CI yet is the author's explicit signal. */
  isDraft: boolean;
  /** Age of the *head commit*, not of the PR — a stale PR pushed to a minute ago is not silent. */
  headAgeMinutes: number;
  /** Whether a check suite with `app.slug === ACTIONS_APP_SLUG` exists for the head commit. */
  hasActionsSuite: boolean;
}

export interface ActionsHealthInput {
  /** Recent workflow runs, newest first. */
  runs: WorkflowRunRecord[];
  /**
   * Re-run disambiguator. Called at most once, and only when the newest
   * completed run died at startup. Injected so tests are pure (NFP #3).
   */
  probe: (run: WorkflowRunRecord) => ProbeOutcome;
  /**
   * Open pull requests and whether each head commit got an Actions suite
   * (THR-1014). Optional so the run-based verdicts stay independently
   * constructible — omitting it means "not measured", never "measured clean".
   */
  pullRequests?: PullRequestSuiteRecord[];
}

export interface ActionsHealthResult {
  verdict: ActionsVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Whether this belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /**
   * Whether the executor lane should decline to claim new implementation work.
   * True only while the gate is *actively* vacuous — a recovered or transient
   * window does not stand the lane down.
   */
  standDown: boolean;
  /** Startup-failed runs seen in the lookback window. */
  startupFailureCount: number;
  /** Runs seen in the lookback window that hung waiting for a runner (THR-1013). */
  stalledCount: number;
  /**
   * Open PRs whose head commit never got an Actions check suite (THR-1014),
   * newest head first. Empty both when nothing is silenced and when PRs were not
   * measured at all — `verdict` is what distinguishes those, not this array.
   */
  dispatchSilencedPrs: number[];
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

/**
 * Verdicts that assert nothing is currently wrong. Dispatch silence overrides
 * exactly these and no others (THR-1014).
 *
 * The three named here each make a positive claim that a silenced PR falsifies:
 * `healthy` says checks are running, `recovered` and `transient` both say the
 * problem has cleared. The verdicts deliberately *not* in this set —
 * `billing-block`, `stalled`, `unknown` — are either more dangerous or already
 * non-committal, and must not be masked by a lesser finding.
 */
const BENIGN_VERDICTS: ReadonlySet<ActionsVerdict> = new Set<ActionsVerdict>([
  "healthy",
  "recovered",
  "transient",
]);

/**
 * Classify Actions health. Pure: no IO, no clock, no `gh`.
 *
 * Two independent sources, combined at the end. `classifyFromRuns` reads the run
 * list and owns every verdict about runs that exist; the dispatch-silence check
 * reads open PRs and owns the one condition no run list can express (THR-1014).
 * Silence overrides only a benign run-verdict, so a live billing block is never
 * downgraded by it.
 */
export function classifyActionsHealth(input: ActionsHealthInput): ActionsHealthResult {
  const dispatchSilencedPrs = (input.pullRequests ?? []).filter(isDispatchSilenced).map((p) => p.number);
  const fromRuns = classifyFromRuns(input);

  if (dispatchSilencedPrs.length > 0 && BENIGN_VERDICTS.has(fromRuns.verdict)) {
    const count = dispatchSilencedPrs.length;
    const list = dispatchSilencedPrs.map((n) => `#${n}`).join(", ");
    return {
      verdict: "dispatch-silence",
      summary:
        `GitHub is not starting checks on new work at all — ${count} open pull request(s) (${list}) have been ` +
        "waiting more than " +
        `${DISPATCH_SILENCE_MIN_MINUTES} minutes without a single check being scheduled. Nothing unsafe can merge ` +
        "and finished work is safe, but those pull requests will sit unmerged indefinitely: unlike a busy-server " +
        "delay, this one does not clear on its own. Pushing any new commit to each branch starts the checks again.",
      needsChristian: false,
      // Same reasoning as `stalled`: with no suite created the required check
      // never reports, so the PR stays BLOCKED and nothing untested reaches
      // `main`. The gate is stalled, not vacuous — standing the lane down would
      // forfeit delivery to guard a risk that is not present.
      standDown: false,
      startupFailureCount: fromRuns.startupFailureCount,
      stalledCount: fromRuns.stalledCount,
      dispatchSilencedPrs,
    };
  }

  return { ...fromRuns, dispatchSilencedPrs };
}

/**
 * Whether one open PR shows dispatch silence (THR-1014).
 *
 * All three clauses are required, and each excludes a different false positive:
 *
 * - **Not a draft** — a draft PR not having CI is the author's own signal, the
 *   same carve-out the armed-PR sweep makes.
 * - **Head older than `DISPATCH_SILENCE_MIN_MINUTES`** — measured against the
 *   *head commit*, not the PR. A three-week-old PR force-pushed a minute ago is
 *   not silent, it is new; keying on PR age would report it as an outage every
 *   time someone rebased.
 * - **No Actions suite** — the signature itself.
 */
export function isDispatchSilenced(pr: PullRequestSuiteRecord): boolean {
  if (pr.isDraft) {
    return false;
  }
  if (pr.headAgeMinutes < DISPATCH_SILENCE_MIN_MINUTES) {
    return false;
  }
  return !pr.hasActionsSuite;
}

/**
 * The run-list half of the verdict. Everything it can see is a property of a run
 * that exists; the caller adds what it structurally cannot see.
 *
 * Order matters, and the cheap checks come first deliberately. The probe costs a
 * real re-run plus up to `PROBE_TIMEOUT_SECONDS` of waiting, so it fires only
 * when the newest completed run actually died at startup — i.e. when the outage
 * still looks live.
 */
function classifyFromRuns(input: ActionsHealthInput): Omit<ActionsHealthResult, "dispatchSilencedPrs"> {
  const { runs, probe } = input;

  const startupFailures = runs.filter((r) => r.startupFailure);
  const startupFailureCount = startupFailures.length;
  const stalledCount = runs.filter((r) => r.stalled).length;

  if (runs.length === 0) {
    return {
      verdict: "unknown",
      summary: "No recent workflow runs were visible — could not tell whether the merge gate is running.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
      stalledCount: 0,
    };
  }

  if (startupFailureCount === 0 && stalledCount === 0) {
    return {
      verdict: "healthy",
      summary: "Automated checks are running normally.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
      stalledCount: 0,
    };
  }

  // Newest run that actually reached a conclusion. In-flight runs tell us nothing
  // either way, so they are skipped rather than treated as healthy.
  const newestCompleted = runs.find((r) => r.conclusion !== null);

  if (!newestCompleted) {
    return {
      verdict: "unknown",
      summary:
        `${describeUnhealthyRuns(startupFailureCount, stalledCount)}, and every newer run is still in progress — ` +
        "the outcome is not yet readable.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
      stalledCount,
    };
  }

  // Cheapest decisive signal: the newest completed run executed jobs, so whatever
  // caused the earlier failures is over. No re-run needed. Covers both classes —
  // a hang clears exactly the same way a billing block does (THR-1013).
  if (!newestCompleted.startupFailure && !newestCompleted.stalled) {
    return {
      verdict: "recovered",
      summary:
        `Automated checks are running again. ${describeUnhealthyRuns(startupFailureCount, stalledCount)}, ` +
        "but the most recent one completed normally, so the problem has cleared on its own.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
      stalledCount,
    };
  }

  // The newest completed run hung rather than dying at startup. This is a GitHub
  // capacity problem, not a billing one: there is nothing to re-run against and
  // no setting to change, so the probe is skipped and Christian is not paged.
  //
  // `standDown` stays FALSE deliberately. THR-768's stand-down exists because a
  // billing block makes the gate *vacuous* — a `skipped` required check satisfies
  // branch protection, so anything could reach `main` untested. A stall is the
  // opposite failure: `cancelled` does NOT satisfy branch protection, so armed
  // PRs simply wait and merge themselves once capacity returns. Idling the lane
  // would forfeit an hour of delivery to protect against a risk that is not
  // present. What was missing on 2026-08-06 was visibility, not a halt.
  if (newestCompleted.stalled) {
    return {
      verdict: "stalled",
      summary:
        `GitHub is not giving our automated checks a machine to run on — ${stalledCount} recent run(s) waited ` +
        "and were cancelled without executing anything. Finished work is safe and nothing unsafe can merge, but " +
        "pull requests will sit unmerged until GitHub's capacity returns, which usually happens on its own.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
      stalledCount,
    };
  }

  // The newest completed run died at startup. Disambiguate: a genuine transient
  // resumes, a billing block reproduces in seconds.
  const outcome = probe(newestCompleted);

  if (outcome === "reproduced") {
    return {
      verdict: "billing-block",
      summary:
        "GitHub has stopped running our automated checks because the account's build budget is exhausted. " +
        "Nothing can be safely merged until it is topped up — the safety checks look like they passed but never actually ran. " +
        "This one needs you: it is fixed under Billing & plans in the GitHub account settings.",
      needsChristian: true,
      standDown: true,
      startupFailureCount,
      stalledCount,
    };
  }

  if (outcome === "executed") {
    return {
      verdict: "transient",
      summary:
        `${startupFailureCount} recent check run(s) failed without starting, but a fresh run executed normally — ` +
        "this was a temporary GitHub hiccup, not a billing block. No action needed.",
      needsChristian: false,
      standDown: false,
      startupFailureCount,
      stalledCount,
    };
  }

  return {
    verdict: "unknown",
    summary:
      `${startupFailureCount} recent check run(s) failed without starting, but the follow-up check could not be completed, ` +
      "so it is unclear whether this is a billing block or a temporary glitch.",
    needsChristian: false,
    standDown: false,
    startupFailureCount,
    stalledCount,
  };
}

/**
 * One clause naming whichever unhealthy classes are present, for summaries that
 * are reached by either. Both counts can be non-zero at once — a capacity
 * incident and a billing block are independent — so this never picks a winner.
 */
function describeUnhealthyRuns(startupFailureCount: number, stalledCount: number): string {
  const parts: string[] = [];
  if (startupFailureCount > 0) {
    parts.push(`${startupFailureCount} recent check run(s) failed without starting`);
  }
  if (stalledCount > 0) {
    parts.push(`${stalledCount} recent check run(s) hung waiting for a machine`);
  }
  return parts.join(" and ");
}

/**
 * Whether a failed run's shape and annotations mark it as "never started".
 *
 * Both halves are required. Duration alone would misread a genuinely fast
 * failure; the annotation alone would be enough in principle, but the duration
 * filter is what keeps the annotation lookup bounded to a handful of candidates.
 */
export function isStartupFailure(args: {
  conclusion: string | null;
  durationSeconds: number;
  annotations: string[];
}): boolean {
  if (args.conclusion !== "failure") {
    return false;
  }
  if (args.durationSeconds > STARTUP_FAILURE_MAX_SECONDS) {
    return false;
  }
  return args.annotations.some((a) => BILLING_ANNOTATION_PATTERN.test(a));
}

/**
 * Whether a run hung waiting for a runner instead of failing (THR-1013).
 *
 * All three halves are required, and each excludes a different neighbour:
 *
 * - **Conclusion** — a `success` run executed something by definition.
 * - **Zero steps across every job** — this is the actual signature. A job that
 *   never got a machine reports as started and reaps with an empty step list,
 *   whereas any job that ran, however briefly, carries steps. `jobs.length > 0`
 *   guards the vacuous case: a run whose jobs could not be read at all would
 *   otherwise satisfy "every job has zero steps" trivially.
 * - **Duration** — separates a hang from a concurrency supersede and from the
 *   billing class, per `STALL_MIN_SECONDS`.
 *
 * Note the asymmetry with `isStartupFailure`: that one needs an annotation to
 * confirm, because a 3-second failure has several possible causes. A quarter of
 * an hour of executing nothing has only one.
 */
export function isStalledRun(args: {
  conclusion: string | null;
  durationSeconds: number;
  /** Step count per job in the run, in any order. */
  jobStepCounts: number[];
}): boolean {
  if (args.conclusion === null || !STALL_CANDIDATE_CONCLUSIONS.has(args.conclusion)) {
    return false;
  }
  if (args.durationSeconds < STALL_MIN_SECONDS) {
    return false;
  }
  return args.jobStepCounts.length > 0 && args.jobStepCounts.every((n) => n === 0);
}

// ---------------------------------------------------------------------------
// IO layer — every call fail-soft
// ---------------------------------------------------------------------------

function run(command: string, args: string[]): string | null {
  try {
    return execFileSync(command, args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
}

function ghJson<T>(endpoint: string): T | null {
  const raw = run("gh", ["api", endpoint]);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Annotation messages for every job in a run.
 *
 * `gh run view --log-failed` returns `log not found` for a startup failure — no
 * log is ever produced because no step ran, and that emptiness reads like a
 * tooling error rather than a diagnosis. The reason lives *only* here, on the
 * check-run annotations endpoint. Recorded because the obvious command is a dead
 * end (THR-768 comment, 2026-07-28).
 */
function fetchRunAnnotations(runId: number): string[] {
  const jobs = ghJson<{ jobs: Array<{ id: number }> }>(
    `repos/${GH_REPO}/actions/runs/${runId}/jobs`,
  );
  if (!jobs?.jobs) {
    return [];
  }
  const messages: string[] = [];
  for (const job of jobs.jobs) {
    const annotations = ghJson<Array<{ message?: string }>>(
      `repos/${GH_REPO}/check-runs/${job.id}/annotations`,
    );
    for (const a of annotations ?? []) {
      if (a.message) {
        messages.push(a.message);
      }
    }
  }
  return messages;
}

/**
 * Step count for every job in a run, used by `isStalledRun`.
 *
 * Returns `[]` on any read failure, which classifies the run as not-stalled —
 * the fail-soft direction, since a probe that cannot see the jobs must not
 * manufacture an outage (NFP #4).
 */
function fetchRunJobStepCounts(runId: number): number[] {
  const jobs = ghJson<{ jobs: Array<{ steps?: unknown[] }> }>(
    `repos/${GH_REPO}/actions/runs/${runId}/jobs`,
  );
  if (!jobs?.jobs) {
    return [];
  }
  return jobs.jobs.map((j) => j.steps?.length ?? 0);
}

interface RawRun {
  databaseId: number;
  workflowName: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
}

function fetchRuns(): WorkflowRunRecord[] | null {
  const raw = run("gh", [
    "run",
    "list",
    "--limit",
    String(ACTIONS_LOOKBACK),
    "--json",
    "databaseId,workflowName,conclusion,createdAt,updatedAt",
  ]);
  if (raw === null) {
    return null;
  }

  let parsed: RawRun[];
  try {
    parsed = JSON.parse(raw) as RawRun[];
  } catch {
    return null;
  }

  // Annotation lookups are the expensive part, so only the newest few failures
  // get one; older failures keep startupFailure=false, which at worst
  // under-reports the count in the summary and never changes the verdict (the
  // verdict is decided by the newest completed run).
  let inspected = 0;
  // Bounded independently of `inspected`: the two classes are disjoint by
  // duration, so a window full of one must not exhaust the budget for the other.
  let stallInspected = 0;

  return parsed.map((r) => {
    const createdAtMs = Date.parse(r.createdAt);
    const updatedAtMs = Date.parse(r.updatedAt);
    const durationSeconds = (updatedAtMs - createdAtMs) / 1000;

    let startupFailure = false;
    if (
      r.conclusion === "failure" &&
      durationSeconds <= STARTUP_FAILURE_MAX_SECONDS &&
      inspected < ANNOTATION_INSPECT_LIMIT
    ) {
      inspected += 1;
      startupFailure = isStartupFailure({
        conclusion: r.conclusion,
        durationSeconds,
        annotations: fetchRunAnnotations(r.databaseId),
      });
    }

    let stalled = false;
    if (
      r.conclusion !== null &&
      STALL_CANDIDATE_CONCLUSIONS.has(r.conclusion) &&
      durationSeconds >= STALL_MIN_SECONDS &&
      stallInspected < STALL_INSPECT_LIMIT
    ) {
      stallInspected += 1;
      stalled = isStalledRun({
        conclusion: r.conclusion,
        durationSeconds,
        jobStepCounts: fetchRunJobStepCounts(r.databaseId),
      });
    }

    return {
      id: r.databaseId,
      workflowName: r.workflowName,
      conclusion: r.conclusion,
      createdAtMs,
      updatedAtMs,
      startupFailure,
      stalled,
    };
  });
}

/**
 * Open PRs paired with whether their head commit got an Actions check suite
 * (THR-1014).
 *
 * Reads the **check-suites** endpoint rather than the run list, which is the
 * whole point: a run that was never created cannot appear in a run list, but the
 * absence of its suite on a commit that has other suites is positive evidence.
 *
 * Returns `null` — never `[]` — when the PR list itself cannot be read, so the
 * caller can tell "no open PRs" from "could not look". A per-PR suite lookup that
 * fails is treated as *having* a suite: this check exists to catch a total
 * dispatch outage, and a transient API error on one commit is not that. Erring
 * toward silence here costs an hour of detection; erring the other way would
 * cry outage on every flaky call.
 */
function fetchOpenPullRequestSuites(): PullRequestSuiteRecord[] | null {
  const raw = run("gh", [
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    String(DISPATCH_SILENCE_PR_LIMIT),
    "--json",
    "number,headRefOid,isDraft",
  ]);
  if (raw === null) {
    return null;
  }

  let parsed: Array<{ number: number; headRefOid: string; isDraft: boolean }>;
  try {
    parsed = JSON.parse(raw) as Array<{ number: number; headRefOid: string; isDraft: boolean }>;
  } catch {
    return null;
  }

  const now = Date.now();
  const records: PullRequestSuiteRecord[] = [];

  for (const pr of parsed) {
    // Draft PRs are excluded by the predicate anyway; skipping them here also
    // saves the API call.
    if (pr.isDraft) {
      records.push({ number: pr.number, isDraft: true, headAgeMinutes: 0, hasActionsSuite: true });
      continue;
    }

    const suites = ghJson<{
      check_suites?: Array<{ app?: { slug?: string } | null }>;
    }>(`repos/${GH_REPO}/commits/${pr.headRefOid}/check-suites`);

    const commit = ghJson<{ commit?: { committer?: { date?: string } } }>(
      `repos/${GH_REPO}/commits/${pr.headRefOid}`,
    );
    const committedAt = commit?.commit?.committer?.date;

    // An unreadable commit date cannot be aged, so it cannot clear the
    // threshold — same fail-toward-silence rule as an unreadable suite list.
    const headAgeMinutes =
      committedAt === undefined ? 0 : Math.max(0, (now - Date.parse(committedAt)) / 60000);

    records.push({
      number: pr.number,
      isDraft: false,
      headAgeMinutes,
      hasActionsSuite:
        suites === null ||
        (suites.check_suites ?? []).some((s) => s.app?.slug === ACTIONS_APP_SLUG),
    });
  }

  return records;
}

function sleepSeconds(seconds: number): void {
  // Synchronous by design — this script is a linear probe, not an event loop,
  // and Atomics.wait is the only dependency-free blocking sleep in Node.
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, seconds * 1000);
}

/**
 * Re-run one startup-failed workflow and report whether it reproduced.
 *
 * This is the disambiguator the ticket insists must be mechanical rather than a
 * judgment call: a transient resumes, a billing block dies again in ~3 seconds
 * with the same annotation.
 */
function probeByRerun(target: WorkflowRunRecord): ProbeOutcome {
  if (run("gh", ["run", "rerun", String(target.id)]) === null) {
    return "unavailable";
  }

  const deadline = Date.now() + PROBE_TIMEOUT_SECONDS * 1000;

  while (Date.now() < deadline) {
    sleepSeconds(PROBE_POLL_INTERVAL_SECONDS);

    const fresh = ghJson<{ conclusion: string | null; run_started_at: string; updated_at: string }>(
      `repos/${GH_REPO}/actions/runs/${target.id}`,
    );
    if (!fresh || fresh.conclusion === null) {
      continue;
    }

    if (fresh.conclusion !== "failure") {
      return "executed";
    }

    const durationSeconds = (Date.parse(fresh.updated_at) - Date.parse(fresh.run_started_at)) / 1000;
    return isStartupFailure({
      conclusion: fresh.conclusion,
      durationSeconds,
      annotations: fetchRunAnnotations(target.id),
    })
      ? "reproduced"
      : "executed";
  }

  return "unavailable";
}

/**
 * Startup-failed runs of the recoverable workflow, newest first.
 *
 * Queried against the workflow file directly — not filtered out of the general
 * run list — so the window is measured in *auto-close runs* rather than in
 * whatever else happened to run alongside them.
 */
function fetchStrandedAutoCloseRuns(): WorkflowRunRecord[] | null {
  const raw = run("gh", [
    "run",
    "list",
    "--workflow",
    RECOVERABLE_WORKFLOW_FILE,
    "--limit",
    String(RECOVERY_LOOKBACK),
    "--json",
    "databaseId,workflowName,conclusion,createdAt,updatedAt",
  ]);
  if (raw === null) {
    return null;
  }

  let parsed: RawRun[];
  try {
    parsed = JSON.parse(raw) as RawRun[];
  } catch {
    return null;
  }

  const stranded: WorkflowRunRecord[] = [];

  for (const r of parsed) {
    if (r.conclusion !== "failure") {
      continue;
    }
    const createdAtMs = Date.parse(r.createdAt);
    const updatedAtMs = Date.parse(r.updatedAt);
    const durationSeconds = (updatedAtMs - createdAtMs) / 1000;
    if (durationSeconds > STARTUP_FAILURE_MAX_SECONDS) {
      continue;
    }
    if (
      !isStartupFailure({
        conclusion: r.conclusion,
        durationSeconds,
        annotations: fetchRunAnnotations(r.databaseId),
      })
    ) {
      continue;
    }
    stranded.push({
      id: r.databaseId,
      workflowName: r.workflowName,
      conclusion: r.conclusion,
      createdAtMs,
      updatedAtMs,
      startupFailure: true,
    });
  }

  return stranded;
}

/**
 * Scope item 5 — recovery.
 *
 * A startup-failed run is never retriggered by anything, so every `Linear
 * Auto-Close` run that died during an outage leaves its ticket stranded In Dev
 * holding the WIP=1 slot.
 *
 * `--recover` lists; `--recover --apply` re-runs. Dry by default because this is
 * the one path in the probe that mutates CI state — re-running is idempotent (the
 * workflow skips issues already closed), but a script that fires workflows should
 * say so before it does it.
 */
function recoverStrandedAutoCloses(apply: boolean): void {
  const stranded = fetchStrandedAutoCloseRuns();

  if (stranded === null) {
    console.log(`[actions-health] recover: could not list ${RECOVERABLE_WORKFLOW} runs — skipped.`);
    return;
  }

  if (stranded.length === 0) {
    console.log(
      `[actions-health] recover: no stranded ${RECOVERABLE_WORKFLOW} runs in the last ${RECOVERY_LOOKBACK}.`,
    );
    return;
  }

  console.log(
    `[actions-health] recover: ${stranded.length} stranded ${RECOVERABLE_WORKFLOW} run(s)` +
      (apply ? " — re-running." : " — pass --apply to re-run them."),
  );

  for (const r of stranded) {
    if (!apply) {
      console.log(`[actions-health]   ${r.id} (would re-run)`);
      continue;
    }
    const ok = run("gh", ["run", "rerun", String(r.id)]) !== null;
    console.log(`[actions-health]   ${r.id} ${ok ? "re-run queued" : "re-run FAILED"}`);
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");
  const noProbe = argv.includes("--no-probe");
  const recover = argv.includes("--recover");
  const apply = argv.includes("--apply");

  const runs = fetchRuns();
  const pullRequests = fetchOpenPullRequestSuites();

  let result: ActionsHealthResult;

  if (runs === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub Actions — merge-gate health not checked.",
      needsChristian: false,
      standDown: false,
      startupFailureCount: 0,
      stalledCount: 0,
      dispatchSilencedPrs: [],
    };
  } else {
    result = classifyActionsHealth({
      runs,
      probe: noProbe ? () => "unavailable" : probeByRerun,
      // `null` means the PR list could not be read; passing undefined keeps that
      // distinct from a measured-empty board, so an unreadable list can never
      // manufacture a clean dispatch-silence result.
      pullRequests: pullRequests ?? undefined,
    });
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[actions-health] verdict=${result.verdict} needs-christian=${result.needsChristian ? "yes" : "no"} ` +
        `stand-down=${result.standDown ? "yes" : "no"} startup-failures=${result.startupFailureCount} ` +
        `stalled=${result.stalledCount} dispatch-silenced=${result.dispatchSilencedPrs.length}`,
    );
    console.log(`[actions-health] ${result.summary}`);
  }

  if (recover) {
    recoverStrandedAutoCloses(apply);
  }

  process.exit(strict && result.standDown ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
