import type { GameState } from '../../types/gameState';
import { DRIFT_DECAY_RATE_PER_TICK } from '../../data/encounter-experience-constants';
import { decayAllDrift } from '../encounters/driftAccumulator';

export interface DriftDecayPhaseResult {
  archetypeDrift: GameState['archetypeDrift'];
  decayedCount: number;
}

/**
 * Applies per-tick passive drift decay to all agents' archetype axes.
 * Drift decays toward zero at DRIFT_DECAY_RATE_PER_TICK per tick.
 * Axes already at zero are skipped.
 */
export function phaseDriftDecay(state: GameState): DriftDecayPhaseResult {
  const drift = state.archetypeDrift ?? [];
  if (drift.length === 0) {
    return { archetypeDrift: drift, decayedCount: 0 };
  }

  const nonZero = drift.filter((d) => d.toPosition !== 0);
  if (nonZero.length === 0) {
    return { archetypeDrift: drift, decayedCount: 0 };
  }

  const decayed = decayAllDrift(drift, DRIFT_DECAY_RATE_PER_TICK, state.tick);
  return { archetypeDrift: decayed, decayedCount: nonZero.length };
}
