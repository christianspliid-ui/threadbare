/**
 * Nudge authoring guardrails — THR-774 (WS1, the builder pipeline).
 *
 * Director-tunable authoring rubric for nudge-native encounters, the sibling of
 * `registerRubric.ts`. Every number the authoring skills and the advisory lint
 * check a hand against lives here (NFP #1): tightening a guardrail is editing a
 * number in this file, never rewriting a skill.
 *
 * ─── Why this file is not `data/nudge-constants.ts` ─────────────────
 * `data/nudge-constants.ts` holds the numbers the **runtime** consumes — rider
 * priority, erosion multipliers, difficulty word bands. These are different in
 * kind: they gate *authoring time* and *advisory lint* and are read by no
 * gameplay path, so they stay out of the client bundle. Nothing under
 * `src/components/**`, `src/engine/**` (outside tests), or the tick loop may
 * import this module. The NFP audit on the WS1/WS2 plan asked for exactly this
 * split; keeping it is what stops authoring policy leaking into gameplay.
 *
 * ─── What these are NOT ─────────────────────────────────────────────
 * `NUDGE_HAND_MIN`/`MAX` are **not** the rejected "fixed action count / capped
 * action slots" approach (see CLAUDE.md § Rejected Approaches). They are
 * per-step *authoring* ranges for hand quality, enforced at warn level while an
 * encounter is being written. At runtime the renderer draws whatever
 * `NudgeHand.playable` contains, uncapped, and the pool stays open-ended and
 * data-driven. A hand of nine is a lint warning, never a truncation.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § Shared sections
 * Program: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772 epic)
 */

import type { StepOutcome } from '../../types/unifiedAction';

// ─── Hand shape ──────────────────────────────────────────────────────

/**
 * Authored hand size per nudge-bearing step. Below the floor the step has no
 * real decision in it; above the ceiling the player is reading a catalogue
 * rather than weighing options. Warn-level at authoring time.
 */
export const NUDGE_HAND_MIN = 4;
export const NUDGE_HAND_MAX = 8;

/**
 * Distinct spheres a hand must span. The hand is the replayability engine
 * (program ruling 3/4): a different god sees a different subset, and that only
 * holds if the authored spread is wide enough for gods to differ on it.
 */
export const HAND_SPHERE_COVERAGE_MIN = 4;

/**
 * Every hand carries at least this many sphere-less (common-pool) options, so a
 * god with no matching sphere is never handed an empty step.
 */
export const HAND_COMMON_OPTIONS_MIN = 1;

// ─── Reach reachability (THR-821) ────────────────────────────────────

/**
 * Difficulty ceiling for a nudge-bearing step whose reach the acting mortal is
 * **not** expected to hold.
 *
 * Measured 2026-07-27 (`npm run measure:nudge-headroom`, seeds 42/99;
 * `Docs/audits/2026-07-27-thr-821-nudge-headroom.md`): a `notable`-tier mortal —
 * the tier a newly-threaded NPC lands in — carries capability 0.027..0.119 in a
 * non-primary/secondary reach. Against a step at 0.45, `computeResolutionThreshold`
 * floors at `PROBABILITY_FLOOR` and **stays** floored through the whole authored
 * hand: 0% of that cohort clears the floor unaided, with two cards (+0.22), at the
 * documented `actionModifiers` cap (+0.20), or with the full hand (+0.37).
 *
 * A hand that cannot move the forecast word is decorative — the player spends
 * essence and watches nothing change. So: an off-reach step stays at `fair` or
 * below. A step that *wants* to be `steep`/`severe` is fine, but it must be
 * authored for actors who plausibly hold the reach (role-gated, faction-gated, or
 * late-run) — which is what the golden exemplar does, drawing a thief into an
 * `eye`/`shadow` vault.
 *
 * Value is the `steep` band floor from `DIFFICULTY_WORD_BANDS`, so the rule reads
 * in the same vocabulary the author sees: "off-reach steps stay under `steep`".
 */
export const NUDGE_OFF_REACH_MAX_DIFFICULTY = 0.45;

// ─── Band-fragment coverage ──────────────────────────────────────────

/**
 * `forecastDelta` at or above which a nudge must carry fragments for **both**
 * `failure` and `critical_failure`.
 *
 * Every nudge needs at least one failure-band fragment regardless (see
 * `FAILURE_BAND_OUTCOMES`) — the god's hand must be traceable in failure at any
 * size. This constant marks the point where a single misfire line stops being
 * enough: a nudge that moved the odds this much and still lost owes the player
 * a distinct reading of *how* it lost at each depth.
 */
export const NUDGE_BIG_DELTA = 0.15;

/**
 * The failure textures. `near_miss` is a failure texture for authoring purposes
 * even though `isStepSuccess()` counts it as advancing — the step got through,
 * the nudge did not land clean, and the prose owes that.
 */
export const FAILURE_BAND_OUTCOMES: readonly StepOutcome[] = [
  'near_miss',
  'failure',
  'critical_failure',
];

/**
 * The full six-value band domain a step's hand must cover between them. Not the
 * five-band `EncounterOutcomeBand` and not `OutcomeBand` from
 * `outcomeConsequences.ts` — either would type-check while being the wrong
 * domain (the same trap `StepNudge.bandProse` documents).
 */
export const ALL_BAND_OUTCOMES: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

// ─── Test panel ──────────────────────────────────────────────────────

/**
 * For/against factor lines per step. Two is the floor for a *weighing* (one
 * line is an assertion); four is where the panel stops being readable at a
 * glance.
 */
export const FACTOR_LINES_MIN = 2;
export const FACTOR_LINES_MAX = 4;

/** Words in a reach purpose line — "what this step is testing", not a sentence. */
export const REACH_PURPOSE_MAX_WORDS = 4;

// ─── Word budgets (warn-level) ───────────────────────────────────────

/**
 * Card-discipline budgets from the 2026-07-25 prose pilot. Warn-level: going
 * over is a signal the field is carrying someone else's job, not an error.
 */
export const NUDGE_WORD_BUDGETS = {
  /** Encounter scene / vignette prose. */
  scene: 60,
  /** One for/against factor line. */
  factorLine: 12,
  /** A nudge card's `fiction` body. */
  fiction: 30,
  /** A step's base band prose. */
  bandBase: 60,
  /** A `bandProse` fragment appended for an active nudge. */
  bandFragment: 25,
} as const;

/** `StepNudge.name` word cap — interactive-plain, same rule as any label. */
export const NUDGE_NAME_MAX_WORDS = 6;

// ─── Abstraction / vagueness detectors ───────────────────────────────

/**
 * Vagueness lexicon — target **zero** occurrences in authored encounter prose.
 *
 * Each of these is a word that stands where a picturable noun belongs. "It cost
 * them something" is the failure mode this list exists to catch: the sentence
 * has a shape but no image, and the reader has nothing to see.
 */
export const VAGUENESS_LEXICON: readonly string[] = [
  'something',
  'anything',
  'nothing',
  'thing',
  'things',
  'way',
  'ways',
  'somehow',
  'whatever',
  'somewhere',
];

/**
 * Annotation patterns — the writer stepping in to gloss their own image.
 * Budget is `ANNOTATION_MAX_PER_ENCOUNTER` across the whole encounter, not per
 * field: one is a rhythm, three is a tic.
 *
 * `notButClause` catches "not X but Y" inside a single sentence.
 * `emDashNot` catches an em-dash followed by a negation ("— not the way …").
 */
export const ANNOTATION_PATTERNS: Readonly<Record<string, RegExp>> = {
  notButClause: /\bnot\b[^.!?]*\bbut\b/i,
  emDashNot: /—\s*not\b/i,
};

/** Annotation clauses permitted across one encounter's prose. */
export const ANNOTATION_MAX_PER_ENCOUNTER = 1;

// ─── Shared generic pool ─────────────────────────────────────────────

/**
 * The **only** nudge families that may be reused across encounters (program
 * ruling 3: options are per-encounter authored content; generics are the narrow
 * exception). Everything else is written for the encounter it sits in.
 *
 * This list is the canonical one. Extending the shared pool means editing this
 * array — which is deliberately a code change with a reviewer, not a judgement
 * call an authoring session makes on its own.
 */
export const SHARED_GENERIC_NUDGE_FAMILIES: readonly string[] = [
  /** Focus / steady-breath: the mortal's own nerve, held a moment longer. */
  'focus',
  /** Moment's luck: the coin lands the right way up. */
  'luck',
  /** Blessing: unlock-gated, the god's overt favour. */
  'blessing',
  /** Oath / word: a promise the mortal already made, remembered on cue. */
  'oath',
  /** Light in dark: literal illumination where there was none. */
  'light',
  /** Strength surge: the body finds one more pull. */
  'strength',
] as const;

/**
 * Genericity test for a candidate shared-pool card: it must read correctly in at
 * least this many *unrelated* encounters. Below the bar it is encounter-specific
 * content wearing a generic name.
 */
export const GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN = 3;
