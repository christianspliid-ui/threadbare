import type { InterventionType } from '../types/dream';

export interface DecayParams {
  initialStrength: number;
  decayRate: number;
  minimumStrength: number;
  maxDuration: number;
  tickApplied: number;
}

/**
 * Compute current influence strength using exponential decay.
 * Formula: max(minimumStrength, initialStrength × e^(-decayRate × elapsed))
 * Returns 0 after maxDuration (influence expired).
 */
export function getCurrentStrength(params: DecayParams, currentTick: number): number {
  const elapsed = currentTick - params.tickApplied;
  if (elapsed < 0) return params.initialStrength;
  if (elapsed >= params.maxDuration) return 0;
  return Math.max(
    params.minimumStrength,
    params.initialStrength * Math.exp(-params.decayRate * elapsed),
  );
}

/** Per-intervention-type decay constants from the design doc. */
export const DECAY_CONSTANTS: Record<InterventionType, Omit<DecayParams, 'tickApplied'>> = {
  dream:                { initialStrength: 0.50, decayRate: 0.15, minimumStrength: 0.03, maxDuration: 20 },
  persuade:             { initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30 },
  deceive:              { initialStrength: 0.70, decayRate: 0.08, minimumStrength: 0.05, maxDuration: 35 },
  intimidate:           { initialStrength: 0.90, decayRate: 0.12, minimumStrength: 0.04, maxDuration: 25 },
  inspire_intervention: { initialStrength: 0.80, decayRate: 0.15, minimumStrength: 0.03, maxDuration: 20 },
  coincidence:          { initialStrength: 0.60, decayRate: 0.20, minimumStrength: 0.02, maxDuration: 15 },
  omen:                 { initialStrength: 0.50, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 25 },
  afflict_bless:        { initialStrength: 0.75, decayRate: 0.08, minimumStrength: 0.06, maxDuration: 30 },
};
