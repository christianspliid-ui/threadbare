/**
 * The calibration card pin (THR-1628) — a harness-only seam over a mortal
 * opponent's **derived** card.
 *
 * In a duel each duellist's raw clash score does two jobs: it sets their own dice
 * (`computeCapability`), and, through `deriveMightWord`, it sets the card the other
 * side faces. Both read the same `computeRawScore`, so a calibration fixture that
 * re-stamps raw to keep one side's odds on the re-fitted dice flips the other
 * side's card word (THR-1581, forecast-window plan § Amendment 2026-09-26 (second),
 * decision 3). This seam lets the duel calibration pin each duellist's card at the
 * words it read on `main`, and stamp raw for the dice alone.
 *
 * **Never reachable from play.** The pins exist only for the synchronous duration
 * of a `withCalibrationCardPins` call, which only `src/testing/` makes (guarded by
 * `calibrationCardPins.test.ts`). Outside that call `applyCalibrationCardPin`
 * returns the card it was given, unchanged. `readOpponentCard` — the production
 * read, shared by the UI, the lair and the debug bridge — is not touched: the pin
 * rides `resolveFightStepInputs`, the one place a card prices a step.
 *
 * Only a `derived` card is pinned. A monster's card is authored, so there is
 * nothing to decouple, and a default card has no opponent to key on.
 */

import type { FightRatingWord, OpponentCard } from '../../types/fight';

/** The words a pinned opponent's card reads. */
export interface CalibrationCardPin {
  readonly might: FightRatingWord;
  readonly dread: FightRatingWord;
}

let activePins: ReadonlyMap<string, CalibrationCardPin> | null = null;

/**
 * Run `fn` with the given opponents' derived cards pinned, then drop the pins —
 * also when `fn` throws. Pins do not nest: an inner call replaces the outer pins
 * and restores them on exit.
 */
export function withCalibrationCardPins<T>(
  pins: ReadonlyMap<string, CalibrationCardPin>,
  fn: () => T,
): T {
  const previous = activePins;
  activePins = pins;
  try {
    return fn();
  } finally {
    activePins = previous;
  }
}

/** The card with its pinned words, or the card itself when no pin applies. */
export function applyCalibrationCardPin(card: OpponentCard): OpponentCard {
  if (activePins === null || card.source !== 'derived' || !card.opponentId) return card;
  const pin = activePins.get(card.opponentId);
  return pin ? { ...card, might: pin.might, dread: pin.dread } : card;
}
