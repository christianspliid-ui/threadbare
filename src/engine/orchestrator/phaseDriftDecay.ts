import type { GameState } from '../../types/gameState';
import { PERSONALITY_DRIFT_DECAY_PER_TICK } from '../../data/encounter-experience-constants';
import { decayAllDrift } from '../encounters/driftAccumulator';

export interface DriftDecayPhaseResult {
  archetypeDrift: GameState['archetypeDrift'];
  decayedCount: number;
}

/**
 * Applies per-tick passive drift decay to all agents' personality axes.
 *
 * Drift is the *temporary delta* layer: it decays toward zero at
 * `PERSONALITY_DRIFT_DECAY_PER_TICK` per tick. Composed with the baseline via
 * `liveAxisPosition`, this pulls each agent's **live position back toward their
 * baseline** (their born/marked standing), not toward neutral — so an unreinforced
 * streak of behavior fades while the baseline persists. (THR-528)
 *
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

  const decayed = decayAllDrift(drift, PERSONALITY_DRIFT_DECAY_PER_TICK, state.tick);
  return { archetypeDrift: decayed, decayedCount: nonZero.length };
}
