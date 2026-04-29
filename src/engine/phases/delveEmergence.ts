/**
 * Phase descriptor: delve_emergence (THR-238 Land 3).
 *
 * Reads `ctx.runtime` to forward to phaseDelveEmergence (used for cache
 * invalidation on ruin transformation).
 *
 * Order: after `delve_progression` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseDelveEmergence } from '../ruins/delveVariant';

export const delveEmergencePhase: EnginePhase = {
  id: 'delve_emergence',
  slot: 'post-economy',
  afterPhase: ['delve_progression'],
  run: (state, ctx) => phaseDelveEmergence(state, ctx.runtime),
};
