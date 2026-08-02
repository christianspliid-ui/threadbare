#!/usr/bin/env node

/**
 * Open-PR merge health probe (THR-897, membership widened by THR-930).
 *
 * Answers one question: **of the PRs that are open and expected to reach
 * `main`, which ones can never get there on their own?**
 *
 * ## The gap this closes
 *
 * pull-work Step 0.8 (shipped by THR-702) sweeps PRs and runs
 * `gh pr update-branch` on the oldest one at `mergeStateStatus: BEHIND`. That
 * matches on `BEHIND` **only**. A PR that goes `DIRTY` — a real merge conflict —
 * is not `BEHIND`, so the sweep skips it, and `update-branch` would not fix it
 * anyway. Auto-merge never fires on a conflicted PR.
 *
 * The result is the worst shape a stall can take: a PR that reads *open and
 * actively swept* while being structurally incapable of merging, with nothing
 * surfacing it. Measured 2026-07-31: 2 of 3 open PRs were in that state, one of
 * them carrying the deliverable that unblocked 11 content tickets, un-drained
 * for ~12h across three sweeps that each reported success.
 *
 * ## Why the input set is every open PR, not just the armed ones (THR-930)
 *
 * THR-897 fixed the *classification* of PRs inside the armed set. It left the
 * set itself as a filter, so a PR that was conflicted **and never armed** was
 * not merely misclassified — it was absent from the input, and the probe was
 * correct against its stated contract while being wrong as a health signal.
 *
 * Measured 2026-08-02, on a repo whose only open PR was #1114 (`DIRTY`,
 * unarmed, 3+ days old, holding THR-860's In-Dev slot the whole time), this
 * probe reported `counts.conflicted: 0` and the summary *"No PRs are waiting to
 * merge."* Arming is a statement about *how* a PR intends to merge; it is not a
 * statement about whether it is stuck. So membership is now **open and
 * non-draft**, and `armed` is carried per-PR instead of gating entry.
 *
 * Draft PRs stay out: a draft is deliberately not trying to merge yet, which is
 * the one case where "no promise to merge" is an author's explicit signal
 * rather than an inference.
 *
 * ## What this probe does instead
 *
 * Classifies every open non-draft PR into what it actually needs, rather than
 * testing one value for equality:
 *
 * | class           | derived from                   | who can clear it |
 * |-----------------|--------------------------------|------------------|
 * | `held`          | a `Hold:` marker in the PR body (any merge state) | nobody — it is parked on purpose |
 * | `drainable`     | `BEHIND`                       | the sweep — `gh pr update-branch`, **armed only** |
 * | `conflicted`    | `DIRTY`                        | **a session** — `git merge origin/main`, resolve, push |
 * | `waiting`       | `CLEAN` `BLOCKED` `HAS_HOOKS` `UNSTABLE`, **armed** | nobody; auto-merge fires on green |
 * | `idle`          | the same states, **unarmed**   | nobody; nothing is waiting on it |
 * | `indeterminate` | `UNKNOWN` `DRAFT`              | nobody; re-query (see below) |
 *
 * Only `drainable` is the sweep's to fix, and only when the PR is **armed** —
 * `update-branch` on an unarmed PR refreshes a branch that nothing is waiting
 * to merge, so `updateCandidate` stays armed-only by construction. `conflicted`
 * is the class that was silently dropped, and it is reported with **the
 * conflicting file names** (via a read-only `git merge-tree`) so the session
 * that picks it up starts with the diagnosis already done.
 *
 * ## `held` — a parked PR is not a stuck one (THR-985)
 *
 * THR-897 fixed classification inside the armed set; THR-930 widened the set.
 * Both left the probe reading only *mechanical* state, and two situations share
 * one signature exactly:
 *
 * * a PR that is **stuck** — conflicted, unarmed, old, nobody coming; and
 * * a PR that is **parked** — conflicted, unarmed, old, *because someone decided
 *   it should be*.
 *
 * `autoMergeRequest: null` means "not armed". It never means "should be armed",
 * yet that is how it was read. Measured: PR #1114 (THR-860) was deliberately
 * disarmed on 2026-07-30 — THR-883 holds a `blocks` relation onto its issue and
 * Christian's directive paused all content migration until the encounter-writing
 * format is locked. The probe called it `abandoned` / `needsChristian: true`
 * **hourly for 78 hours**, onto the one surface Christian actually reads,
 * raising a decision he had already made. Three separate sessions (impediments
 * #393, #406, #411) re-derived the hold by hand from Linear comments, and a
 * fourth hit it before this fix landed.
 *
 * **The signal is a `Hold:` line in the PR body**, not a Linear round-trip. The
 * Linear `blocks` relation is the authoritative *decision*; the marker is that
 * decision written where the probe can see it, and writing it is part of
 * disarming a PR on purpose. Reasons for preferring it here: this script's every
 * other input is `gh` or `git`, `LINEAR_API_KEY` is unset in the hourly lanes
 * that run this probe (so a Linear-backed branch would be dead code that never
 * executes — untestable against the live case it exists for), and a marker is
 * auditable in the PR itself rather than in a system the reader must go query.
 *
 * **The marker is line-anchored**, for the reason `linear-autoclose.yml` is
 * (THR-738): a keyword that matches mid-sentence turns prose *describing* a hold
 * into a hold. A line must read `Hold: <reason>` — with a non-empty reason, so a
 * held PR always says why — or it does not count.
 *
 * **Fail-soft direction matters here and runs one way only.** An unreadable body,
 * an absent marker, or a malformed one all yield "not held", so the PR escalates
 * exactly as it does today. A held PR misread as stuck is the status quo and
 * merely noisy; a genuinely stuck PR silently suppressed as held is a
 * regression, and this probe must never fail in that direction.
 *
 * ## `idle` — an unarmed PR is not "waiting on checks" (THR-985)
 *
 * The same blindness pointed the other way. Once #1114's conflict was cleared it
 * reported `klass: "waiting"` and *"will merge on green"* — but it is unarmed and
 * held, so nothing was waiting on it and it would not merge on anything. Any
 * unarmed PR in a green-ish state is `idle`: open, mergeable, and going nowhere
 * until someone arms it.
 *
 * ## Naming
 *
 * The file, the npm script, and the exported symbols keep their `armed` names.
 * The scope they describe has widened, but renaming them would ripple through
 * `package.json`, two skill docs, and a plan doc for no behavioural gain — the
 * docstrings and the per-PR `armed` field carry the real contract.
 *
 * ## `UNKNOWN` is not "fine" — it means "not computed yet"
 *
 * GitHub computes `mergeStateStatus` lazily; a first read returns `UNKNOWN` and
 * merely *schedules* the computation. Measured 2026-07-31, PRs #1132 and #1166
 * each read `DIRTY` and then `UNKNOWN` minutes apart with no intervening push.
 * A probe that classified on one read would call a conflicted PR healthy on
 * roughly every other run. So `indeterminate` entries are re-queried up to
 * `ARMED_UNKNOWN_REQUERIES` times before being believed.
 *
 * ## Two age tiers, because a conflict is an agent's job until it isn't
 *
 * A conflicted PR is session work, not a Christian decision (THR-608: technical
 * verdicts are the agent's). So the first tier reports rather than escalates:
 *
 * - past `ARMED_DIRTY_ESCALATE_MINUTES` (one sweep interval + slack) →
 *   `needsSession: true`. Surfaced to the lane, not to Christian.
 * - past `ARMED_DIRTY_ABANDONED_HOURS` → `needsChristian: true`. At this point
 *   ~12 hourly sessions have each had a chance and none cleared it, so the
 *   stall is systemic rather than a task waiting for its turn.
 *
 * **Unarmed conflicts run the same two tiers on a slower clock** — see
 * `UNARMED_DIRTY_ESCALATE_HOURS` / `UNARMED_DIRTY_ABANDONED_HOURS`. Arming is a
 * promise that a PR is trying to merge *now*, so its absence justifies patience,
 * not silence: THR-930's motivating case sat 3+ days. The clock also starts from
 * a different event, because an unarmed PR has no `enabledAt` — see
 * `clockStartMs`.
 *
 * ## Fail-soft (NFP #4)
 *
 * Every external call is wrapped. A missing `gh`, a network failure, or an
 * unfetchable PR ref degrades to `unknown` and exits 0. This probe must never
 * be the reason a pickup run or an hourly brief fails.
 *
 * Usage:
 *   npm run check:armed-prs               # advisory; always exits 0
 *   npm run check:armed-prs -- --json     # machine-readable single-line JSON
 *   npm run check:armed-prs -- --strict   # exits 1 when a human is needed
 */

import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

// ---------------------------------------------------------------------------
// Tunable constants (NFP #1 — changing behaviour means changing a number here)
// ---------------------------------------------------------------------------

/**
 * How long an armed PR may sit conflicted before the report escalates from
 * "noted" to "a session must pick this up". The sweep runs hourly, so anything
 * past one interval has already been skipped at least once — 90 minutes gives
 * a full interval plus slack for a run that starts late.
 */
export const ARMED_DIRTY_ESCALATE_MINUTES = 90;

/**
 * How long an armed PR may sit conflicted before it stops being session work
 * and becomes Christian's. At 12 hours roughly a dozen hourly runs have each
 * had the chance to clear it and none did, which is a systemic stall rather
 * than a queue waiting its turn.
 */
export const ARMED_DIRTY_ABANDONED_HOURS = 12;

/**
 * How long an **unarmed** PR may sit conflicted before a session must pick it
 * up (THR-930). Longer than the armed tier because arming is a promise that a
 * PR is trying to merge right now, and an unarmed PR has made no such promise —
 * it may legitimately be mid-authoring. Six hours is past the point where that
 * reading survives: an author actively working a branch resolves a conflict in
 * the session that created it.
 */
export const UNARMED_DIRTY_ESCALATE_HOURS = 6;

/**
 * How long an unarmed PR may sit conflicted before it becomes Christian's
 * (THR-930). Double the armed tier, for the same reason the escalate tier is
 * longer. The motivating case — PR #1114, unarmed and conflicted for 3+ days
 * while holding THR-860's In-Dev slot — clears this by a wide margin, which is
 * the point: no threshold in this file should let that go unreported.
 */
export const UNARMED_DIRTY_ABANDONED_HOURS = 24;

/**
 * How many times to re-query a PR reading `UNKNOWN` before believing it.
 * GitHub computes mergeability lazily — the first read only schedules it.
 */
export const ARMED_UNKNOWN_REQUERIES = 3;

/** Pause between `UNKNOWN` re-queries, giving GitHub time to compute. */
export const ARMED_UNKNOWN_REQUERY_DELAY_MS = 2500;

/**
 * Cap on conflicting file names reported per PR. A conflict spanning more than
 * this many files is a rebase problem, not a merge problem, and the count
 * communicates that better than the list would.
 */
export const ARMED_CONFLICT_FILE_LIMIT = 10;

/** GitHub `owner/repo` these PRs belong to. */
export const GH_REPO = "christianspliid-ui/threadbare";

/**
 * Line-anchored marker declaring a PR deliberately parked (THR-985).
 *
 * Matches a whole line reading `Hold: <reason>` or `Paused: <reason>`, allowing
 * a leading blockquote (`> `), list bullet, or bold wrapper so the marker can
 * sit naturally in a formatted PR body. Bold may close on either side of the
 * colon — `**Hold:** x` and `**Hold**: x` are both idiomatic markdown and both
 * count. The reason is captured and must be non-empty — see `parseHoldMarker`.
 *
 * Anchored to line start for the same reason `linear-autoclose.yml` is
 * (THR-738): an unanchored keyword makes prose *about* a hold into a hold, which
 * is precisely how a well-meant explanatory sentence becomes a silent
 * suppression of a real stall.
 */
export const HOLD_MARKER_PATTERN =
  /^[ \t]*(?:>[ \t]*)?(?:[-*][ \t]+)?\*{0,2}(?:hold|paused)\*{0,2}[ \t]*:\*{0,2}[ \t]*(.+)$/im;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * GitHub's `mergeStateStatus` enum. `DRAFT` and `UNKNOWN` both mean "no verdict
 * available", for different reasons.
 */
export type MergeStateStatus =
  | "BEHIND"
  | "BLOCKED"
  | "CLEAN"
  | "DIRTY"
  | "DRAFT"
  | "HAS_HOOKS"
  | "UNKNOWN"
  | "UNSTABLE";

/** What an open PR needs in order to reach `main`. */
export type ArmedPrClass =
  | "drainable"
  | "conflicted"
  | "waiting"
  | "idle"
  | "held"
  | "indeterminate";

export type ArmedPrVerdict =
  | "healthy"
  | "drainable"
  | "conflicted"
  | "abandoned"
  | "idle"
  | "held"
  | "unknown";

export interface ArmedPrRecord {
  number: number;
  title: string;
  mergeStateStatus: MergeStateStatus;
  /**
   * Whether auto-merge is armed on this PR (THR-930). Chooses the age tier and
   * gates `updateCandidate`; it no longer gates membership.
   */
  armed: boolean;
  /**
   * Start of this PR's staleness clock, epoch ms — `autoMergeRequest.enabledAt`
   * when armed, `createdAt` when not.
   *
   * The two events are not interchangeable and the field is deliberately not
   * called `enabledAtMs` any more: an unarmed PR has no `enabledAt`, and the
   * pre-THR-930 code defaulted a missing one to `Date.now()`, which would have
   * read every unarmed PR as zero minutes old — a conflicted PR reporting as
   * brand new on every single run.
   */
  clockStartMs: number;
  /** Head commit, used to compute conflicting files. */
  headRefOid: string;
  /**
   * Why this PR is deliberately parked, or `null` when it is not (THR-985).
   *
   * Carries the reason rather than a boolean so the report can say *what* the
   * PR is waiting on. A held PR is reported and never escalated — see the
   * header note on why the fail-soft direction runs toward escalating.
   */
  holdReason: string | null;
}

export interface ArmedPrReport {
  number: number;
  title: string;
  klass: ArmedPrClass;
  mergeStateStatus: MergeStateStatus;
  /** Whether auto-merge is armed — keeps the split legible downstream. */
  armed: boolean;
  /**
   * How long the PR has been on its staleness clock, in minutes. Measured from
   * arming when armed, from creation when not (see `clockStartMs`).
   */
  ageMinutes: number;
  /**
   * Conflicting file names. Populated whenever `mergeStateStatus` is `DIRTY` —
   * including on a `held` PR, because resolving a held PR's conflict is
   * legitimate maintenance even though re-arming it is not.
   */
  conflictFiles: string[];
  /** True when a `conflicted` PR is past its escalate tier (armed or unarmed). */
  escalated: boolean;
  /** True when a `conflicted` PR is past its abandoned tier (armed or unarmed). */
  abandoned: boolean;
  /** Why this PR is parked, or `null`. Non-null exactly when `klass` is `held`. */
  holdReason: string | null;
}

export interface ArmedPrInput {
  prs: ArmedPrRecord[];
  /** Evaluation time, epoch ms. Injected so tests are deterministic (NFP #3). */
  nowMs: number;
  /**
   * Conflicting file names for a PR head, or `null` when the comparison could
   * not be made (unfetchable ref, git failure). Injected for testability.
   */
  conflictFilesFor: (headRefOid: string) => string[] | null;
}

export interface ArmedPrResult {
  verdict: ArmedPrVerdict;
  /** One plain-language sentence (THR-608 — Christian reads this, not a diff). */
  summary: string;
  /** Belongs in the briefing's `## Needs Christian` section. */
  needsChristian: boolean;
  /** A session must pick this up — surfaced to the lane, not to Christian. */
  needsSession: boolean;
  /**
   * PR the sweep should `update-branch` this run, or `null`. **Armed and
   * `drainable` only** — `update-branch` on an unarmed PR refreshes a branch
   * that nothing is waiting to merge (THR-930 Done-when #2).
   */
  updateCandidate: number | null;
  /** Every open non-draft PR, classified. */
  prs: ArmedPrReport[];
  counts: Record<ArmedPrClass, number>;
  /** How many of `prs` have auto-merge armed. */
  armedCount: number;
  /** How many of `prs` do not — the set THR-930 made visible. */
  unarmedCount: number;
}

/**
 * The classification table. Written as data rather than a chain of `if`s so
 * that adding a state is a one-line edit and an unhandled state is impossible
 * to introduce silently — the `Record` type requires every arm.
 */
const CLASS_BY_STATE: Record<MergeStateStatus, ArmedPrClass> = {
  BEHIND: "drainable",
  DIRTY: "conflicted",
  CLEAN: "waiting",
  BLOCKED: "waiting",
  HAS_HOOKS: "waiting",
  UNSTABLE: "waiting",
  UNKNOWN: "indeterminate",
  DRAFT: "indeterminate",
};

/**
 * Classify a single `mergeStateStatus`. An unrecognised value (GitHub adds
 * enum members over time) is `indeterminate` rather than `waiting` — the
 * fail-safe direction, since `waiting` means "nobody needs to do anything".
 */
export function classifyMergeState(state: string): ArmedPrClass {
  return CLASS_BY_STATE[state as MergeStateStatus] ?? "indeterminate";
}

/**
 * Extract the reason from a `Hold:` / `Paused:` marker line in a PR body, or
 * `null` when the PR is not declared held (THR-985).
 *
 * A marker with an empty reason does **not** count. The reason is the whole
 * value of the marker — it is what turns "this PR is parked" from an assertion
 * into something a reader can check — so a bare `Hold:` is treated as absent
 * rather than as a hold nobody can justify.
 *
 * Returns `null` for a missing or unreadable body, which is the escalating
 * direction: a stall must never be suppressed by the absence of information.
 */
export function parseHoldMarker(body: string | null | undefined): string | null {
  if (typeof body !== "string" || body.length === 0) {
    return null;
  }
  // Trailing `*`s come from a fully-bolded marker (`**Hold: reason**`) and are
  // formatting, not reason.
  const reason = HOLD_MARKER_PATTERN.exec(body)?.[1]?.replace(/\*+$/, "").trim();
  return reason ? reason : null;
}

// ---------------------------------------------------------------------------
// Classification — pure, dependency-injected, the whole testable surface
// ---------------------------------------------------------------------------

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Classify armed-PR health. Pure: no IO, no clock, no git.
 *
 * Verdict precedence runs worst-first. A conflicted PR outranks a drainable
 * one because the drainable case self-heals on the next sweep and the
 * conflicted case never does — reporting "drainable" while a conflict sits
 * underneath is exactly the silence THR-897 was filed for.
 */
export function classifyArmedPrs(input: ArmedPrInput): ArmedPrResult {
  const { prs, nowMs, conflictFilesFor } = input;

  /**
   * Escalate / abandoned thresholds in ms, chosen by arming. Armed PRs run the
   * original THR-897 tiers; unarmed PRs run the slower THR-930 ones.
   */
  const tiersFor = (armed: boolean): { escalateMs: number; abandonedMs: number } =>
    armed
      ? {
          escalateMs: ARMED_DIRTY_ESCALATE_MINUTES * 60 * 1000,
          abandonedMs: ARMED_DIRTY_ABANDONED_HOURS * 60 * 60 * 1000,
        }
      : {
          escalateMs: UNARMED_DIRTY_ESCALATE_HOURS * 60 * 60 * 1000,
          abandonedMs: UNARMED_DIRTY_ABANDONED_HOURS * 60 * 60 * 1000,
        };

  const reports: ArmedPrReport[] = prs.map((pr) => {
    const stateClass = classifyMergeState(pr.mergeStateStatus);
    const held = pr.holdReason !== null;

    // Class precedence (THR-985). A declared hold outranks every mechanical
    // state: a held PR is not drainable (updating it refreshes a branch nobody
    // will merge), not conflicted-in-the-actionable-sense (its conflict is
    // real, but the stall is a decision rather than a defect), and not waiting.
    // Below that, `waiting` splits on arming — an unarmed PR in a green state
    // is `idle`, because nothing is waiting on checks that no merge depends on.
    const klass: ArmedPrClass = held
      ? "held"
      : stateClass === "waiting" && !pr.armed
        ? "idle"
        : stateClass;

    const ageMs = Math.max(0, nowMs - pr.clockStartMs);
    // Keyed off the raw merge state, not `klass`, so a held PR still reports
    // its conflicting files — resolving them is legitimate maintenance even
    // while re-arming the PR is not.
    const conflictFiles =
      pr.mergeStateStatus === "DIRTY" ? (conflictFilesFor(pr.headRefOid) ?? []) : [];
    const { escalateMs, abandonedMs } = tiersFor(pr.armed);

    return {
      number: pr.number,
      title: pr.title,
      klass,
      mergeStateStatus: pr.mergeStateStatus,
      armed: pr.armed,
      ageMinutes: Math.round(ageMs / 60000),
      conflictFiles: conflictFiles.slice(0, ARMED_CONFLICT_FILE_LIMIT),
      escalated: klass === "conflicted" && ageMs >= escalateMs,
      abandoned: klass === "conflicted" && ageMs >= abandonedMs,
      holdReason: pr.holdReason,
    };
  });

  const counts: Record<ArmedPrClass, number> = {
    drainable: 0,
    conflicted: 0,
    waiting: 0,
    idle: 0,
    held: 0,
    indeterminate: 0,
  };
  for (const r of reports) {
    counts[r.klass] += 1;
  }

  const armedCount = reports.filter((r) => r.armed).length;
  const unarmedCount = reports.length - armedCount;

  // Oldest drainable PR is the sweep's single update candidate
  // (ARMED_SWEEP_MAX_UPDATES = 1 — updating several re-stales the others).
  // Armed-only: `update-branch` on an unarmed PR refreshes a branch that
  // nothing is waiting to merge, so proposing one would be a no-op dressed as
  // progress (THR-930 Done-when #2).
  const updateCandidate =
    reports
      .filter((r) => r.klass === "drainable" && r.armed)
      .sort((a, b) => b.ageMinutes - a.ageMinutes)[0]?.number ?? null;

  const conflicted = reports
    .filter((r) => r.klass === "conflicted")
    .sort((a, b) => b.ageMinutes - a.ageMinutes);

  const abandoned = conflicted.filter((r) => r.abandoned);

  // 1. Conflicted past the abandoned threshold. Loudest case: sessions have had
  //    their chance and the stall outlived them.
  if (abandoned.length > 0) {
    const oldest = abandoned[0];
    const hours = Math.floor(oldest.ageMinutes / 60);
    return {
      verdict: "abandoned",
      summary:
        `A finished change has been stuck for ${hours} hours and cannot merge on its own: PR #${oldest.number} ` +
        `("${oldest.title}") has a conflict that repeated automated attempts have not cleared. ` +
        "Nothing is broken on the live site, but that work is not reaching it.",
      needsChristian: true,
      needsSession: true,
      updateCandidate,
      prs: reports,
      counts,
      armedCount,
      unarmedCount,
    };
  }

  // 2. Conflicted. Session work — reported, never silently skipped.
  if (conflicted.length > 0) {
    const names = conflicted.map((r) => `#${r.number}${r.armed ? "" : " (unarmed)"}`).join(", ");
    const oldest = conflicted[0];
    const files =
      oldest.conflictFiles.length > 0
        ? ` Conflicting files on #${oldest.number}: ${oldest.conflictFiles.join(", ")}.`
        : "";
    return {
      verdict: "conflicted",
      summary:
        `${conflicted.length} open ${plural(conflicted.length, "PR has", "PRs have")} a merge conflict and cannot ` +
        `merge: ${names}. These need a session to run \`git merge origin/main\`, resolve, and push — ` +
        `\`update-branch\` does not fix a conflict.${files}`,
      needsChristian: false,
      needsSession: conflicted.some((r) => r.escalated),
      updateCandidate,
      prs: reports,
      counts,
      armedCount,
      unarmedCount,
    };
  }

  // 3. Drainable only — the sweep's normal, healthy job. An unarmed BEHIND PR
  //    counts as drainable but yields no `updateCandidate`, so say so rather
  //    than printing "oldest first (#null)".
  if (counts.drainable > 0) {
    return {
      verdict: "drainable",
      summary:
        updateCandidate !== null
          ? `${counts.drainable} open ${plural(counts.drainable, "PR is", "PRs are")} behind main and will be ` +
            `updated one per run, oldest first (#${updateCandidate}).`
          : `${counts.drainable} open ${plural(counts.drainable, "PR is", "PRs are")} behind main, but ` +
            `${plural(counts.drainable, "it is", "none are")} armed for auto-merge, so the sweep will not ` +
            `update ${plural(counts.drainable, "it", "them")}.`,
      needsChristian: false,
      needsSession: false,
      updateCandidate,
      prs: reports,
      counts,
      armedCount,
      unarmedCount,
    };
  }

  // 4. Nothing actionable, and nothing informative either — every remaining PR
  //    is in a state GitHub had not finished computing.
  if (
    counts.indeterminate > 0 &&
    counts.waiting === 0 &&
    counts.idle === 0 &&
    counts.held === 0
  ) {
    return {
      verdict: "unknown",
      summary:
        `Could not determine the merge state of ${counts.indeterminate} open ` +
        `${plural(counts.indeterminate, "PR", "PRs")} — GitHub had not finished computing it.`,
      needsChristian: false,
      needsSession: false,
      updateCandidate,
      prs: reports,
      counts,
      armedCount,
      unarmedCount,
    };
  }

  // 5. Nothing needs doing. Report what is actually true of what is left rather
  //    than asserting every open PR "will merge on green" (THR-985) — that
  //    claim is false for an unarmed PR, which nothing is waiting on, and false
  //    for a held one, which must not merge at all.
  const parts: string[] = [];
  if (counts.waiting > 0) {
    parts.push(
      `${counts.waiting} ${plural(counts.waiting, "is", "are")} waiting on checks and will merge on green`,
    );
  }
  if (counts.idle > 0) {
    parts.push(
      `${counts.idle} ${plural(counts.idle, "is", "are")} not armed for auto-merge, so ` +
        `${plural(counts.idle, "it", "they")} will not merge without a session`,
    );
  }
  if (counts.held > 0) {
    const heldNames = reports
      .filter((r) => r.klass === "held")
      .map((r) => `#${r.number} (${r.holdReason})`)
      .join(", ");
    parts.push(`${counts.held} ${plural(counts.held, "is", "are")} on hold on purpose: ${heldNames}`);
  }
  if (counts.indeterminate > 0) {
    parts.push(
      `${counts.indeterminate} ${plural(counts.indeterminate, "is", "are")} in a state ` +
        "GitHub had not finished computing",
    );
  }

  // Verdict names the most informative remaining category. Anything genuinely
  // waiting on green is the healthy steady state; absent that, say plainly that
  // what is left is idle or parked instead of calling a stalled board healthy.
  const verdict: ArmedPrVerdict =
    counts.waiting > 0 ? "healthy" : counts.idle > 0 ? "idle" : counts.held > 0 ? "held" : "healthy";

  return {
    verdict,
    summary:
      prs.length === 0
        ? "No PRs are waiting to merge."
        : `${prs.length} open ${plural(prs.length, "PR", "PRs")}: ${parts.join("; ")}.`,
    needsChristian: false,
    needsSession: false,
    updateCandidate,
    prs: reports,
    counts,
    armedCount,
    unarmedCount,
  };
}

/**
 * Parse conflicting file names out of `git merge-tree --write-tree --name-only`.
 *
 * Output shape on conflict:
 * ```
 * <tree-oid>
 * <conflicted path>
 * <conflicted path>
 *
 * Auto-merging ...
 * CONFLICT (content): ...
 * ```
 * On a clean merge the tree oid is the only content before the blank line.
 * Returns `[]` for a clean merge, so an empty array means "no conflicts" and
 * `null` from the caller means "could not tell" — two different answers that
 * must not collapse into one.
 */
export function parseConflictFiles(mergeTreeOutput: string): string[] {
  const lines = mergeTreeOutput.split(/\r?\n/);
  const files: string[] = [];

  // Line 0 is the written tree oid; conflicting paths follow until a blank line.
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "") {
      break;
    }
    files.push(line.trim());
  }

  return files;
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
  } catch (error) {
    // `git merge-tree` exits non-zero *because* there are conflicts, and still
    // writes the file list to stdout. Recover it rather than losing the answer.
    const stdout = (error as { stdout?: string | Buffer })?.stdout;
    if (typeof stdout === "string" && stdout.length > 0) {
      return stdout.trim();
    }
    if (Buffer.isBuffer(stdout) && stdout.length > 0) {
      return stdout.toString("utf8").trim();
    }
    return null;
  }
}

interface RawPr {
  number: number;
  title: string;
  mergeStateStatus: string;
  headRefOid: string;
  createdAt: string;
  isDraft: boolean;
  autoMergeRequest: { enabledAt: string } | null;
  /** PR description — searched for the `Hold:` marker (THR-985). */
  body: string;
}

/**
 * Every open, non-draft PR — armed or not (THR-930).
 *
 * The `autoMergeRequest !== null` filter that used to live here was the whole
 * defect: it made an unarmed conflicted PR absent from the input rather than
 * misclassified, so the probe could report a clean bill with an unmergeable PR
 * sitting in front of it. Drafts stay excluded because a draft is the one case
 * where "not trying to merge yet" is the author's explicit signal.
 */
function listOpenPrs(): RawPr[] | null {
  const raw = run("gh", [
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,title,mergeStateStatus,headRefOid,createdAt,isDraft,autoMergeRequest,body",
  ]);
  if (raw === null) {
    return null;
  }
  try {
    const all = JSON.parse(raw) as RawPr[];
    return all.filter((pr) => !pr.isDraft);
  } catch {
    return null;
  }
}

function requeryMergeState(prNumber: number): string | null {
  const raw = run("gh", ["pr", "view", String(prNumber), "--json", "mergeStateStatus"]);
  if (raw === null) {
    return null;
  }
  try {
    return (JSON.parse(raw) as { mergeStateStatus: string }).mergeStateStatus;
  } catch {
    return null;
  }
}

function sleep(ms: number): void {
  // Synchronous pause — this is a short-lived CLI probe, not a server.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Re-query any PR reading `UNKNOWN`. GitHub computes mergeability lazily, so a
 * single read is not evidence — see the header note and the measured #1132 /
 * #1166 flap.
 */
function resolveIndeterminate(prs: RawPr[]): RawPr[] {
  const resolved = [...prs];

  for (let attempt = 0; attempt < ARMED_UNKNOWN_REQUERIES; attempt += 1) {
    const pending = resolved.filter((pr) => classifyMergeState(pr.mergeStateStatus) === "indeterminate");
    if (pending.length === 0) {
      break;
    }
    sleep(ARMED_UNKNOWN_REQUERY_DELAY_MS);
    for (const pr of pending) {
      const state = requeryMergeState(pr.number);
      if (state !== null) {
        pr.mergeStateStatus = state;
      }
    }
  }

  return resolved;
}

/**
 * Conflicting file names between `origin/main` and a PR head, computed
 * read-only. `git merge-tree --write-tree` performs the merge in the object
 * database without touching the working tree or the index, so this is safe to
 * run mid-session against a dirty tree.
 */
function conflictFilesFor(headRefOid: string): string[] | null {
  if (run("git", ["cat-file", "-e", `${headRefOid}^{commit}`]) === null) {
    if (run("git", ["fetch", "origin", headRefOid, "--quiet"]) === null) {
      return null;
    }
  }
  const output = run("git", ["merge-tree", "--write-tree", "--name-only", "origin/main", headRefOid]);
  if (output === null) {
    return null;
  }
  return parseConflictFiles(output);
}

function main(): void {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict");
  const asJson = argv.includes("--json");

  run("git", ["fetch", "origin", "main", "--quiet"]);

  const raw = listOpenPrs();

  let result: ArmedPrResult;

  if (raw === null) {
    result = {
      verdict: "unknown",
      summary: "Could not reach GitHub to list open pull requests — merge health not checked.",
      needsChristian: false,
      needsSession: false,
      updateCandidate: null,
      prs: [],
      counts: { drainable: 0, conflicted: 0, waiting: 0, idle: 0, held: 0, indeterminate: 0 },
      armedCount: 0,
      unarmedCount: 0,
    };
  } else {
    const settled = resolveIndeterminate(raw);
    result = classifyArmedPrs({
      nowMs: Date.now(),
      conflictFilesFor,
      prs: settled.map((pr) => {
        const armed = pr.autoMergeRequest !== null;
        // Armed PRs date from arming; unarmed ones from creation. Falling back
        // to `Date.now()` would read a stale PR as brand new every run, which
        // is the failure this probe exists to prevent — so fall back to the
        // other timestamp instead, and only then to now.
        const clockStartMs =
          (armed ? Date.parse(pr.autoMergeRequest?.enabledAt ?? "") : NaN) ||
          Date.parse(pr.createdAt) ||
          Date.now();

        return {
          number: pr.number,
          title: pr.title,
          mergeStateStatus: pr.mergeStateStatus as MergeStateStatus,
          armed,
          clockStartMs,
          headRefOid: pr.headRefOid,
          // An absent or unreadable body yields `null` — not held — so the PR
          // escalates as it does today (THR-985 fail-soft direction).
          holdReason: parseHoldMarker(pr.body),
        };
      }),
    });
  }

  if (asJson) {
    console.log(JSON.stringify(result));
  } else {
    console.log(
      `[armed-prs] verdict=${result.verdict} needs-session=${result.needsSession ? "yes" : "no"} ` +
        `needs-christian=${result.needsChristian ? "yes" : "no"}` +
        (result.updateCandidate !== null ? ` update-candidate=#${result.updateCandidate}` : ""),
    );
    console.log(`[armed-prs] ${result.summary}`);
    console.log(
      `[armed-prs] ${result.prs.length} open non-draft PR(s): ` +
        `${result.armedCount} armed, ${result.unarmedCount} unarmed.`,
    );
    for (const pr of result.prs) {
      const files = pr.conflictFiles.length > 0 ? ` — conflicts: ${pr.conflictFiles.join(", ")}` : "";
      const hold = pr.holdReason !== null ? ` — HELD: ${pr.holdReason}` : "";
      console.log(
        `[armed-prs]   #${pr.number} ${pr.klass} (${pr.mergeStateStatus}, ` +
          `${pr.armed ? "armed" : "UNARMED"}, ${pr.ageMinutes}m` +
          `${pr.abandoned ? ", ABANDONED" : pr.escalated ? ", ESCALATED" : ""})${hold}${files}`,
      );
    }
  }

  process.exit(strict && result.needsChristian ? 1 : 0);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main();
}
