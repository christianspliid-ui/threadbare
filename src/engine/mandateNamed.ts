/**
 * Has the game named the Mandate yet? (THR-2265, decision on THR-2262.)
 *
 * One predicate, read by both places that speak of the Mandate before the player
 * has met it: the opening reveal's `mandate` rail row (trigger `mandate_named`)
 * and the card hint "Counts toward your Mandate." (`buildNudgePhaseModel`). One
 * reader, so the row and the words cannot drift (UI Law 56).
 *
 * True when any of:
 * - the run is not staged (`!state.openingRevealStaged` — CLI, fixtures,
 *   pre-bonded dev routes show the full screen from the bond);
 * - the run carries no beat state (the reveal reads it as `no_beat_state` and
 *   shows the row), or the opening spine has finished (`spine_done`);
 * - the Seat gift (`MANDATE_NAMED_GIFT_BEAT`) has resolved;
 * - a bound mortal's chapter has credited the Mandate: a live `UnifiedAction`
 *   carries non-empty `mandateDeedCredits` (the closing tick, before the phase
 *   result lands), or `state.mandateFirstCreditedTick` is set — the durable latch
 *   written by the first credit of any source (deed or cast), which outlives the
 *   resolved-action prune. `mandateState.recentDeeds` is read too, for saves from
 *   before the latch.
 *
 * The opening-reveal ceiling (`OPENING_REVEAL_CEILING_TICKS`) can still bring the
 * row before this is true; the card hint then waits for the first credit, which
 * names the Mandate in the Aftermath itself.
 *
 * ─── PRNG ─── None. Pure read, no graph writes.
 * ─── Fail-soft ─── Any throw reads `true`, so nothing hides.
 */

import type { GameState } from '../types/gameState';

/** The opening gift whose words introduce the Mandate (THR-1837 table row). */
export const MANDATE_NAMED_GIFT_BEAT = 'beat.spine.the_seat';

/** Why the Mandate counts as named, or null while it has not been. */
export type MandateNamedReason = 'not_staged' | 'no_beat_state' | 'spine_done' | 'seat' | 'deed';

export function mandateNamedReason(state: GameState): MandateNamedReason | null {
  try {
    if (state.openingRevealStaged !== true) return 'not_staged';
    if (typeof state.mandateFirstCreditedTick === 'number') return 'deed';
    if (state.mandateState?.recentDeeds?.length) return 'deed';
    for (const a of state.unifiedActions ?? []) {
      if (a.mandateDeedCredits && a.mandateDeedCredits.length > 0) return 'deed';
    }
    const beats = state.ascendantBeats;
    if (!beats) return 'no_beat_state';
    if (beats.history.some(h => h.beatId === MANDATE_NAMED_GIFT_BEAT)) return 'seat';
    if (beats.spineCursor === -1) return 'spine_done';
    return null;
  } catch {
    return 'not_staged';
  }
}

export function mandateNamed(state: GameState): boolean {
  return mandateNamedReason(state) !== null;
}
