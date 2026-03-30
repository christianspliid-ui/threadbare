/**
 * Phase Magical Saturation — tick magical saturation for all locations.
 *
 * Magical saturation tracks the concentration of divine/magical energy at a
 * location. It is:
 *   - Driven UP by player actions (Ward, Place of Power), sphere-aligned encounters
 *   - Driven DOWN by natural decay each tick (this phase)
 *
 * High saturation effects (applied by other systems):
 *   - Magical actions easier (action scoring bonus)
 *   - Veil-reach agents attracted
 *   - Divine visibility radius expands
 *
 * NFP compliance:
 *   #1 Tunability: all rates and thresholds are named constants
 *   #2 Inspectability: MagicalSaturationTickTrace emitted per changed location
 *   #3 Determinism: arithmetic only
 *   #4 Fail-soft: missing saturation defaults to 0; clamp applied
 */
import type { GameState } from '../types/gameState';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAGICAL_SATURATION_DECAY_RATE = 0.02;
export const MAGICAL_SATURATION_VEIL_BONUS_THRESHOLD = 0.5;
export const MAGICAL_SATURATION_VISIBILITY_THRESHOLD = 0.3;

// ─── Phase function ───────────────────────────────────────────────────────────

/**
 * Tick magical saturation for all locations.
 *
 * Returns empty object — this phase mutates graph node properties in-place
 * (same pattern as phaseReputationDecay in the orchestrator).
 */
export function phaseMagicalSaturation(state: GameState): Partial<GameState> {
  const graph = state.graph;
  const tick = state.tick;

  const locations = graph.getNodesByType('location');

  for (const location of locations) {
    const prevSaturation = typeof location.properties.magicalSaturation === 'number'
      ? location.properties.magicalSaturation
      : 0;

    if (prevSaturation === 0) continue; // Nothing to decay

    const newSaturation = Math.max(
      0,
      Math.min(1, prevSaturation - MAGICAL_SATURATION_DECAY_RATE),
    );

    location.properties.magicalSaturation = newSaturation;

    emitTrace({
      tick,
      category: 'saturation_tick',
      summary: `Saturation at ${location.name}: ${prevSaturation.toFixed(2)} → ${newSaturation.toFixed(2)}`,
      locationId: location.id,
      prevSaturation,
      newSaturation,
      decayApplied: MAGICAL_SATURATION_DECAY_RATE,
    } as any);
  }

  return {};
}
