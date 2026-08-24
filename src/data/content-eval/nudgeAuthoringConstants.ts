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
import { vaguenessTermsFor } from './nudgeAuditDetectors';

export type { ProseFieldClass } from './nudgeAuditDetectors';
export {
  EVASIVE_VAGUENESS_TERMS,
  NATURAL_INDEFINITE_TERMS,
  VAGUE_INTENSIFIERS,
  vaguenessTermsFor,
} from './nudgeAuditDetectors';

// ─── Hand shape ──────────────────────────────────────────────────────

/**
 * Authored hand size per nudge-bearing step. Below the floor the step has no
 * real decision in it; above the ceiling the player is reading a catalogue
 * rather than weighing options. Warn-level at authoring time.
 */
export const NUDGE_HAND_MIN = 4;
export const NUDGE_HAND_MAX = 8;

/**
 * Ceiling on the summed `forecastDelta` of one step's authored hand — the
 * authoring-time answer to "what bounds hand strength?" (THR-827).
 *
 * Nothing bounds it at runtime. `ResolutionInput.actionModifiers` carried a
 * "capped at ±0.20" note that was never enforced by any caller and was never
 * true — `resolutionModifiers.ts` bounds each contributor and never their sum.
 * The verdict recorded on THR-827 was that the note was stale, which leaves this
 * file holding the only real bound on how far a god may bend one step.
 *
 * Counted over **every authored card**, including trait-gated and sphere-gated
 * ones: what any single god can actually play is a subset (their accessible
 * spheres and essence decide which), so the authored total is the only figure an
 * author can see while writing. The golden exemplar's two hands sum to 0.46
 * (step 0, six cards) and 0.53 (step 1, six cards); 0.70 admits the reference
 * implementation with headroom and still rejects a hand that would carry
 * a competent actor from any difficulty straight to `PROBABILITY_CEILING`.
 *
 * Warn-level, director-tunable, and **not** a runtime clamp: the renderer draws
 * whatever `NudgeHand.playable` contains and resolution consumes the full sum.
 * Tightening this is editing this number, never truncating a hand in play.
 */
export const NUDGE_HAND_MAX_TOTAL_DELTA = 0.70;

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
 * floors at `PROBABILITY_FLOOR` and stays floored across the hand a *typical* god
 * can play: 0% of that cohort clears the floor unaided, with two cards (+0.22), or
 * with the +0.37 subset the measured ascendant's accessible spheres allowed.
 *
 * That +0.37 is one god's playable subset, **not** the hand's ceiling (corrected
 * THR-827; it previously read here as "the full hand"). The measurement was
 * taken against the retired Darkhollow Vault exemplar, whose five
 * non-trait-gated step-0 cards summed to 0.55 — at that total the whole cohort
 * cleared the floor (0.127..0.219). Sphere access is pool-driven
 * (`buildNudgePhaseModel`: any sphere with essence > 0), so 0.55 is reachable.
 *
 * ─── Verdict on that gap (THR-831) ──────────────────────────────────
 * **0.45 stands. The measurement was never an invariant to preserve — it
 * described the pathology this ceiling exists to prevent, at the boundary.**
 *
 * THR-831 asked whether the constant was mis-set because a full hand clears a
 * floor its justification said held. Re-derived, the alternative does not exist
 * in the direction the question names. `computeResolutionThreshold` is
 * `p = capability − difficulty + modifiers` clamped at `PROBABILITY_FLOOR`, so a
 * step is floored exactly when `difficulty ≥ capability + modifiers − 0.05`.
 * Difficulty sits on the *same* side as the floor: **lowering this ceiling makes
 * a hand clear the floor more easily, never less.** Keeping the off-reach cohort
 * pinned against a 0.55 hand would mean *raising* it to ≥ 0.62 — into `severe`,
 * the band the rule exists to keep open-draw content out of. The retune option
 * was arithmetically backwards.
 *
 * So the ceiling's direction was always right and only its rationale was wrong.
 * And the game-feel answer falls out of the same arithmetic: a god holding
 * essence across light/mind/time/entropy lifting an off-reach mortal off the
 * floor is the feature working. That is what broad sphere access buys — you are
 * still bending a mortal's odds rather than substituting your competence for
 * theirs (`rulebook.md` § The nudge), but a wide pool bends them further than a
 * narrow one. A ceiling tuned to keep the cohort floored *through* a full hand
 * would make broad access buy nothing, which is the decorative-hand failure in
 * its other form.
 *
 * `nudgeModel.test.ts` pins the boundary in both directions rather than leaving
 * the clearing side implicit: floored across the measured subset, clearing for
 * the whole cohort at a full non-trait hand, and graded in between.
 *
 * A hand that cannot move the forecast word is decorative — the player spends
 * essence and watches the forecast word hold still. So: an off-reach step stays
 * at `fair` or below. A step that *wants* to be `steep`/`severe` is fine, but it
 * must be authored for actors who plausibly hold the reach (role-gated,
 * faction-gated, or late-run). The current golden exemplar (The Swollen Ford)
 * demonstrates the open-draw branch — ambient content with every step at or
 * under this ceiling; the retired Darkhollow Vault demonstrated the gated
 * branch, drawing a thief into an `eye`/`shadow` vault.
 *
 * Value is the `steep` band floor from `DIFFICULTY_WORD_BANDS`, so the rule reads
 * in the same vocabulary the author sees: "off-reach steps stay under `steep`".
 */
export const NUDGE_OFF_REACH_MAX_DIFFICULTY = 0.45;

/**
 * The attention tier that means "open draw": ambient content a mortal draws by
 * being where it is, with no selection on reach, role, or faction.
 *
 * This is the population `NUDGE_OFF_REACH_MAX_DIFFICULTY` binds over. Above this
 * tier a template has an author-chosen audience, and whether its steps are
 * reachable is a question about that audience — not one the checklist can answer
 * from the template alone.
 */
export const OPEN_DRAW_ATTENTION_TIER = 'background';

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
 * For/against factor lines per step.
 *
 * **The floor is retired for authoring (variance rule, Christian 2026-07-30):**
 * a factor line must report state that could have been otherwise — agent, hex,
 * global modifiers, earlier steps — and all of that is derived, so new content
 * authors NO static `factorLines` (a line true on every run is priced into
 * `difficulty` and belongs in the prose). `FACTOR_LINES_MIN` survives only as
 * the historical guardrail un-migrated templates were written against; the cap
 * still bounds what the panel will readably show, and the both-signs rule
 * still binds any step that carries 2+ authored lines.
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
 * Vagueness lexicon — target **zero** occurrences in *outcome* prose.
 *
 * Each of these is a word that stands where a picturable noun belongs. "It cost
 * them something" is the failure mode this list exists to catch: the sentence
 * has a shape but no image, and the reader has nothing to see.
 *
 * ─── This is now a derivation, not a second list (THR-877 / THR-899) ──
 * It used to be a hand-written array of ten terms, and `nudgeAuditDetectors.ts`
 * carried a *different* hand-written array of ~35. They overlapped on four
 * words. Authors were told to write against the union because either could be
 * the one that failed them, and THR-868 lost a full rewrite cycle to cleaning
 * the wrong one.
 *
 * Two lists cannot be kept in step by discipline, so there are no longer two:
 * `nudgeAuditDetectors.ts` is the single authority for the terms, and this is
 * the strictest scope it defines — exactly `vaguenessTermsFor('outcome')`,
 * i.e. evasive terms plus natural indefinites. Adding a term there changes this
 * automatically, and `vagueness-scope.test.ts` pins the identity so the two can
 * never silently re-diverge.
 *
 * **Scope matters when you read a violation.** This is the *outcome*-prose bar.
 * Scene setup is held only to {@link EVASIVE_VAGUENESS_TERMS} — "someone is
 * asking around after the agent" is correct prose there, and was never the
 * detector's prey.
 */
export const VAGUENESS_LEXICON: readonly string[] = vaguenessTermsFor('outcome');

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
