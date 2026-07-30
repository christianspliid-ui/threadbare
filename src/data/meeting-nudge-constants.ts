/**
 * Meet The First — nudge-conversion constants. THR-868 (WS6).
 *
 * Every magic number the converted meeting depends on lives here (NFP #1).
 * Retuning how hard the First's soul is to steer is changing a number in this
 * file, never rewriting `resolveFormativeTest`.
 *
 * Plan: `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md`
 * Program: `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772 epic)
 *
 * **Band vocabulary reconciliation (executor note).** The plan's constants table
 * names its five bands `fated / favorable / uncertain / perilous / doomed`.
 * Those are `ForecastTier` values — the *pre-roll* expectation — not resolved
 * outcomes. The ladder a nudge hand actually resolves onto is the six-value
 * `StepOutcome`, which is what `nudges.ts` already speaks (`bandProse` keys on
 * it, riders remap it, `EROSION_BAND_MULT` is keyed by it), and `StepNudge`'s
 * own doc comment warns against substituting a five-band type here. Keying
 * these tables on `StepOutcome` is therefore the no-parallel-resolver choice the
 * plan asks for. The plan's five values map in ladder order, with the second
 * middle texture (`near_miss`) reading as the soft-failure side of the tempered
 * band — every plan number is preserved:
 *
 * | plan band   | `StepOutcome`      | shift   |
 * |-------------|--------------------|---------|
 * | fated       | `critical_success` | `+0.40` |
 * | favorable   | `success`          | `+0.30` |
 * | uncertain   | `success_at_cost`  | `+0.15` |
 * | (tempered−) | `near_miss`        | `−0.15` |
 * | perilous    | `failure`          | `−0.20` |
 * | doomed      | `critical_failure` | `−0.35` |
 *
 * Revert path: the whole conversion is data-presence gated. A dilemma template
 * with no `nudges[]` renders the legacy choice path, so setting
 * `MEETING_FORMATIVE_TEST_COUNT` to 0 — or simply shipping no converted
 * templates — restores the pre-WS6 meeting without touching logic.
 */

import type { StepOutcome } from '../types/unifiedAction';
import { QUINTESSENCE_THRESHOLDS } from '../types/quintessence';

// ─── Test structure ──────────────────────────────────────────────────

/**
 * Formative tests per meeting (Christian, grill verdict 8). Two tests plus the
 * bond test is three fate rolls total — enough for the lesson to repeat once
 * before the climax, short enough that onboarding stays under the kill-criteria
 * budget.
 */
export const MEETING_FORMATIVE_TEST_COUNT = 2;

/**
 * Every roll the meeting takes: the formative tests plus the bond test. Derived
 * rather than written, so cutting `MEETING_FORMATIVE_TEST_COUNT` to 1 (the
 * onboarding-length kill criterion) re-prices the nudge cost cap automatically.
 */
export const MEETING_TEST_COUNT_TOTAL = MEETING_FORMATIVE_TEST_COUNT + 1;

// ─── Band → soul write ───────────────────────────────────────────────

/**
 * Signed shift toward the **leaned** pole, per resolved band.
 *
 * Positive writes the pole the played hand leaned toward; negative writes the
 * opposite pole — the moment broke the other way. That asymmetry is the whole
 * design: "you nudged toward mercy, fate landed ruthlessness" (grill verdict 1)
 * has to be reachable, and a player who wants the other pole leans the other
 * way rather than hunting for a failure.
 *
 * Monotone non-increasing across the ladder — a better roll never writes less.
 */
export const MEETING_POLE_SHIFT_BY_BAND: Readonly<Record<StepOutcome, number>> = {
  critical_success: 0.40,
  success: 0.30,
  success_at_cost: 0.15,
  near_miss: -0.15,
  failure: -0.20,
  critical_failure: -0.35,
};

/**
 * The band that writes the tempered (reduced-magnitude) shift — the moment
 * lands, but only partly. Named so the tempered row is greppable from the
 * plan's `MEETING_TEMPERED_BAND` reference rather than inferred from magnitudes.
 */
export const MEETING_TEMPERED_BAND: StepOutcome = 'success_at_cost';

// ─── Scarring ────────────────────────────────────────────────────────
//
// Quintessence is a 0–1 ratio (`QUINTESSENCE_DEFAULT` is 1.0), so the plan's
// erosion figures of "4" and "8" are percentage points expressed here as ratio
// units. Light by construction: a First who fails both formative tests and the
// bond at the worst band still starts well clear of `weakened`.

/** Starting-quintessence erosion on a `failure` band (plan: perilous). */
export const MEETING_SCAR_EROSION_PERILOUS = 0.04;

/** Starting-quintessence erosion on a `critical_failure` band (plan: doomed). */
export const MEETING_SCAR_EROSION_DOOMED = 0.08;

/**
 * Erosion per resolved band. Only the two clear-failure bands scar; the
 * tempered textures cost the shift, not the mortal's substance.
 *
 * Stated over the full six-value domain so no band falls through by accident —
 * the same discipline `RIDER_MAPS` uses in `nudges.ts`.
 */
export const MEETING_SCAR_EROSION_BY_BAND: Readonly<Record<StepOutcome, number>> = {
  critical_success: 0,
  success: 0,
  success_at_cost: 0,
  near_miss: 0,
  failure: MEETING_SCAR_EROSION_PERILOUS,
  critical_failure: MEETING_SCAR_EROSION_DOOMED,
};

/**
 * Floor on the First's starting quintessence — one point above the `weakened`
 * band's lower bound, so a scarred First can never start `critical` or `broken`
 * (Christian, grill verdict 6: light scarring, never starts broken).
 *
 * Failure writes character, not a wall: a mortal who begins the game locked out
 * of candidacy by the broken gate has no story to be in.
 */
export const MEETING_QUINTESSENCE_FLOOR = QUINTESSENCE_THRESHOLDS.CRITICAL + 0.01;

// ─── Bond reception ──────────────────────────────────────────────────

/** How the mortal receives the god reaching for them. */
export type BondReception = 'awe' | 'devotion' | 'bargain' | 'doubt' | 'defiance';

/**
 * Resolved band → reception (Christian, chat 2026-07-30).
 *
 * The bond **always forms** — a defiant First still bonds, and defies you. The
 * band colors the relationship; it never denies it. Both middle textures read
 * as `bargain`: the moment did not land cleanly, so the mortal negotiates.
 *
 * Every one of the five receptions is reachable from some band; a reception no
 * band can produce is dead content, and the unit test pins that.
 */
export const BOND_RECEPTION_BY_BAND: Readonly<Record<StepOutcome, BondReception>> = {
  critical_success: 'awe',
  success: 'devotion',
  success_at_cost: 'bargain',
  near_miss: 'bargain',
  failure: 'doubt',
  critical_failure: 'defiance',
};

/** Reception used when a bond test template is malformed — neutral, never a refusal. */
export const BOND_RECEPTION_FALLBACK: BondReception = 'bargain';

// ─── Affordability ───────────────────────────────────────────────────

/**
 * Nudges the god must be able to play in **every** test, however they spent
 * earlier (Christian, grill verdict 3: real essence, but guaranteed affordable).
 * A teaching encounter that can price the player out of its own lesson has
 * failed at the one job it has.
 */
export const MEETING_MIN_AFFORDABLE_NUDGES = 2;

/**
 * Maximum authored essence cost of any meeting nudge, given the god's starting
 * pool. Derived so the guarantee holds across all three rolls even if the player
 * spends the cap every time.
 *
 * A content invariant test enforces this over the converted population — pinned
 * non-empty, because a cap that matches nothing passes vacuously.
 */
export function meetingNudgeCostCap(startingPool: number): number {
  const pool = Number.isFinite(startingPool) ? Math.max(0, startingPool) : 0;
  return pool / (MEETING_TEST_COUNT_TOTAL * MEETING_MIN_AFFORDABLE_NUDGES);
}

// ─── Pool coverage ───────────────────────────────────────────────────

/**
 * Converted templates a selection slot needs before the converted path is
 * preferred over the legacy one. Below this, a reach would draw the same
 * converted test every run, which reads worse than the legacy choice scene.
 */
export const MEETING_POOL_MIN_CONVERTED = 3;

// ─── Pure fate ───────────────────────────────────────────────────────

/**
 * Coin threshold deciding which pole a *zero-lean* hand writes. A god who plays
 * no pole-leaning cards gets pure fate — which pole is a seeded draw, not a
 * silent default to the virtue side.
 */
export const MEETING_NEUTRAL_LEAN_COIN = 0.5;
