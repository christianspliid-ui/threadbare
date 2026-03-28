/**
 * Phase Doom — advance the doom clock and push entropy sphere pressure on tier escalation.
 *
 * Algorithm:
 *   1. Advance the doom clock by one tick.
 *   2. If the doom stage increased (tier escalation):
 *      a. Emit a doom_escalation TickEvent.
 *      b. Push entropy SpherePressureEvent on every location node in the graph.
 *         Magnitude: DOOM_PRESSURE_PER_TIER per tier.
 *   3. Return updated { doomClock, tickEvents, pendingSpherePressures }.
 *
 * NFP compliance:
 *   #1 Tunability: DOOM_PRESSURE_PER_TIER constant from sphereAffinity.ts
 *   #2 Inspectability: doom_escalation TickEvent; pressure events traced by phaseSpherePressure
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: no location nodes → no pressure pushed; stage unchanged → no events
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { DOOM_PRESSURE_PER_TIER } from '../types/sphereAffinity';
import { advanceDoomClock } from './doomClock';

// ─── Helpers ──────────────────────────────────────────────────────

let eventCounter = 0;
function nextEventId(): string {
  return `doom_evt_${Date.now()}_${eventCounter++}`;
}

// ─── Phase function ───────────────────────────────────────────────

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;
  const newDoom = advanceDoomClock(state.doomClock);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];

  if (newStage > oldStage) {
    const stageName = state.doomDefinition.stages[newStage - 1]?.name ?? `Stage ${newStage}`;
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'doom_escalation',
      message: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
      significance: 0.9,
      notification: {
        channel: 'popup',
        popup: {
          title: stageName,
          body: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
        },
      },
    });

    // Push entropy pressure burst on all location nodes — doom corrupts the world.
    // Magnitude: DOOM_PRESSURE_PER_TIER per tier escalation.
    // Fail-soft: if no location nodes exist, no pressure is pushed.
    const locationNodes = state.graph.getNodesByType('location');
    for (const locNode of locationNodes) {
      pressures.push({
        targetEntityId: locNode.id,
        sphere: 'entropy',
        magnitude: DOOM_PRESSURE_PER_TIER,
        source: 'doom',
        sourceId: `doom-tier-${newStage}`,
      });
    }
  }

  return {
    doomClock: newDoom,
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
  };
}
