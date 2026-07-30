/**
 * Nudge Model constants — THR-773 (WS0 engine substrate).
 *
 * Every magic number the nudge model, the broken-mortal state, and the god's
 * restore action depend on lives here (NFP #1). Changing the feel of any of it
 * is changing a number in this file, never rewriting logic.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 * Program: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772 epic)
 *
 * Revert path: the whole feature is absent-safe. `BROKEN_GATE_ENABLED = false`
 * kills the broken gate; setting the three erosion multipliers to 1 / 1 / 0
 * restores the flat pre-WS0 erosion; a step with no `nudges[]` never enters the
 * nudge path at all. Full rollback is constants-only.
 */

import type { NudgeRider, StepOutcome } from '../types/unifiedAction';
import type { QuintessenceThresholdState } from '../types/resolution';

// ─── Broken mortal state ─────────────────────────────────────────────

/**
 * Master switch for the broken-state *consequences* — candidacy exclusion and
 * the homeward drift pull. **Ships false.**
 *
 * The gate must never go live before the road out of it exists: flipping this
 * to `true` is a WS5 Done-when, gated on the rebuild encounters being authored.
 * Failure is plot, not punishment — a mortal locked out of all candidacy with
 * nothing to draw is stun-locked, not broken.
 *
 * Erosion scaling, the `brokenSince` bookkeeping, and every trace stay live
 * regardless, so telemetry accrues before the gate ever opens.
 */
export const BROKEN_GATE_ENABLED = false;

/** Threshold state at which a mortal enters the broken state. */
export const BROKEN_ENTER_STATE: QuintessenceThresholdState = 'critical';

/**
 * Threshold state a broken mortal must climb *past* before re-entering the
 * story. Deliberately above `BROKEN_ENTER_STATE` — the gap is the hysteresis
 * that stops an agent flickering in and out of the state tick by tick.
 */
export const BROKEN_EXIT_STATE: QuintessenceThresholdState = 'strained';

/**
 * Threshold states ordered worst → best. Used to compare a live state against
 * the enter/exit constants without hard-coding either comparison.
 */
export const QUINTESSENCE_STATE_ORDER: readonly QuintessenceThresholdState[] = [
  'broken',
  'critical',
  'weakened',
  'strained',
  'healthy',
];

// ─── Erosion scaling ─────────────────────────────────────────────────
//
// erosion = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION
//           × bandMult × attendedMult × (1 + difficulty × DIFFICULTY_EROSION_SCALE)
//
// The base is the existing `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION` (0.03,
// `src/types/quintessence.ts`) — unchanged. These multipliers scale it.

/** Multiplier applied to a catastrophic (critical_failure) outcome. */
export const EROSION_BAND_MULT_CRITFAIL = 5;

/** Multiplier applied when the failing encounter was *attended* (story_beat). */
export const EROSION_ATTENDED_MULT = 2;

/** +100% erosion at difficulty 1.0. */
export const DIFFICULTY_EROSION_SCALE = 1.0;

/**
 * Erosion clamps the *resulting ratio* at this floor — erosion alone can never
 * reach zero. Death stays owned by the existing zero-state paths.
 */
export const QUINTESSENCE_RATIO_FLOOR = 0.02;

/**
 * Erosion multiplier per step outcome. Only failing outcomes erode at all, so
 * the success side is 0 (never reached — the call site gates on failure — but
 * stated rather than left implicit).
 */
export const EROSION_BAND_MULT: Readonly<Record<StepOutcome, number>> = {
  critical_success: 0,
  success: 0,
  success_at_cost: 0,
  near_miss: 1,
  failure: 1,
  critical_failure: EROSION_BAND_MULT_CRITFAIL,
};

/** Per rebuild-encounter success restore (band-scaled by WS5 content). */
export const REBUILD_RESTORE_BASE = 0.06;

// ─── Broken drift (movement pull) ────────────────────────────────────
//
// A broken mortal stops ranging. The pull is a scoring bonus, never a movement
// override: it makes near, tended places outscore far and wild ones, and the
// agent's own scorer still decides. Same additive channel as the Draw Together
// convergence pull (`DRAW_TOGETHER_PULL_WEIGHT`), and comparable in magnitude.

/**
 * Weight of the stay-close pull, applied as `weight / (1 + hexDistance)`. At
 * distance 0 it is the full weight; it decays away with every hex of travel.
 */
export const BROKEN_DRIFT_PULL_WEIGHT = 2.0;

/**
 * Flat bonus for a candidate at a settlement — a tended place with people in it
 * is where someone worn to nothing goes.
 */
export const BROKEN_DRIFT_SETTLEMENT_BONUS = 1.0;

/** Location subtypes that count as "safe" for the drift pull. */
export const BROKEN_DRIFT_SAFE_SUBTYPES: ReadonlySet<string> = new Set([
  'hamlet',
  'town',
  'city',
  'capital',
]);

// ─── Nudge riders ────────────────────────────────────────────────────

/**
 * Strongest-single-rider order, strongest first. When a player commits several
 * nudges carrying riders, exactly one applies — the earliest in this list.
 * Riders never stack, and they never touch the d100.
 */
export const NUDGE_RIDER_PRIORITY: readonly NudgeRider[] = [
  'no_crit_fail',
  'floor_at_cost',
  // The Gambit sits last on purpose (THR-885). It is the only rider that can
  // worsen an outcome, so when a player has also committed a protective card the
  // protection wins — a hand cannot accidentally cancel its own safety net.
  'all_or_nothing',
];

// ─── Sphere signature discount ───────────────────────────────────────

/**
 * The Signature (THR-885) — essence knocked off a card whose sphere matches one
 * the ascendant is aligned to. A discount, not a gate: full sphere *gating*
 * stays parked with THR-870.
 */
export const SPHERE_DISCOUNT = 1;

/**
 * Floor the discount can never push a card below. Free is an authored decision
 * (`essenceCost: 0` on a trait card), never something a discount arrives at —
 * otherwise a sphere-matched card silently becomes a different kind of card.
 */
export const SPHERE_DISCOUNT_MIN_COST = 1;

// ─── The Repertoire (THR-887) ────────────────────────────────────────

/**
 * Essence knocked off a card signed by the ascendant's **secondary** sphere.
 *
 * Distinct from {@link SPHERE_DISCOUNT} by *layer*, not by arithmetic — both are
 * 1, and that is a coincidence worth keeping visible rather than collapsing.
 * `SPHERE_DISCOUNT` is THR-885's per-encounter price cut, applied by
 * `effectiveNudgeCost` to a card in an authored step hand. This one is the
 * repertoire layer: it prices a *library* card the god holds because their
 * secondary sphere signs its type. Tuning one should not silently move the other.
 *
 * Primary-sphere cards are full strength (no discount, no surcharge) — the
 * primary's reward is *access*, per plan Decision 7.1.
 */
export const SECONDARY_SPHERE_DISCOUNT = 1;

/**
 * Forecast penalty carried by an echo card returned from a **somber** age
 * (plan Decision 7.4). The scarred card is cheaper — a dead god's favorite
 * trick, come back wrong — and pays for it here.
 *
 * In pip terms this is one red down-triangle. Stored as a raw forecast delta;
 * the pip tiering is display-only (recorded on THR-885).
 */
export const ECHO_CARD_SCAR_PENALTY = 5;

/** Essence knocked off a scarred echo card. Pairs with {@link ECHO_CARD_SCAR_PENALTY}. */
export const ECHO_CARD_SCAR_DISCOUNT = 1;

// ─── Motive classification ───────────────────────────────────────────

/** Receipt share that claims the motive as `choice` or `mission`. */
export const MOTIVE_DOMINANT_SHARE = 0.5;

// ─── Difficulty display ──────────────────────────────────────────────

/**
 * Step difficulty → display word. Words only — the mortal-facing surface never
 * shows the number (ruling 6).
 */
export const DIFFICULTY_WORD_BANDS: readonly { readonly min: number; readonly word: string }[] = [
  { min: 0.60, word: 'severe' },
  { min: 0.45, word: 'steep' },
  { min: 0.30, word: 'fair' },
  { min: 0, word: 'gentle' },
];

// ─── Rekindle the Thread ─────────────────────────────────────────────

/** Essence price of `divine.rekindle_thread` — expensive by design. */
export const REKINDLE_ESSENCE_COST = 6;

/**
 * Ratio the target is restored to. Lands the mortal `steady`-adjacent, above
 * the `BROKEN_EXIT_STATE` hysteresis, so the restore actually clears the state.
 */
export const REKINDLE_RESTORE_TO_RATIO = 0.6;
