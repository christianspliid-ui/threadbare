import {
  VITALITY_PROSPERITY_WEIGHT,
  VITALITY_FACTION_WEIGHT,
  VITALITY_THREAT_WEIGHT,
  VITALITY_TRADE_WEIGHT,
  VITALITY_DRIFT_RATE,
} from './constants';

export interface VitalityInput {
  /** Current prosperity score, 0–100 */
  prosperity: number;
  /** Average faction health, 0–1 */
  factionHealth: number;
  /** Normalized threat pressure, 0–1. Higher = more danger. */
  threatPressure: number;
  /** Normalized trade activity, 0–1 */
  tradeActivity: number;
  /** Current vitality value to drift from, 0–1 */
  currentVitality: number;
}

/**
 * Compute the next vitality value for a settlement.
 *
 * Derives a target vitality from weighted inputs (prosperity, faction health,
 * threat pressure, trade activity), then drifts the current value toward that
 * target at VITALITY_DRIFT_RATE per tick. This produces smooth transitions
 * rather than step-changes.
 *
 * Returns a value clamped to [0, 1].
 */
export function computeVitality(input: VitalityInput): number {
  const { prosperity, factionHealth, threatPressure, tradeActivity, currentVitality } = input;

  const normalizedProsperity = Math.min(prosperity / 100, 1);

  const targetVitality = Math.max(0, Math.min(1,
    (normalizedProsperity * VITALITY_PROSPERITY_WEIGHT)
    + (factionHealth * VITALITY_FACTION_WEIGHT)
    - (threatPressure * VITALITY_THREAT_WEIGHT)
    + (tradeActivity * VITALITY_TRADE_WEIGHT),
  ));

  // Drift current vitality toward the target value
  const newVitality = currentVitality + (targetVitality - currentVitality) * VITALITY_DRIFT_RATE;
  return Math.max(0, Math.min(1, newVitality));
}
