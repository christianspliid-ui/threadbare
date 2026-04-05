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
import { advanceDoomClock, accelerateDoomClock, decelerateDoomClock } from './doomClock';
import { processEffectEvent, applyEffectEventResult } from './effects/effectEvents';
import { instantiateReward } from './rewardPool';
import { getActiveRuleOverride } from './effects/effectQueries';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

// ─── Helpers ──────────────────────────────────────────────────────

let eventCounter = 0;
/** Reset per-tick doom event counter. Called by orchestrator.resetEventCounters() at tick start. */
export function resetDoomCounter(): void {
  eventCounter = 0;
}
function nextEventId(tick: number): string {
  return `doom_evt_${tick}_${eventCounter++}`;
}

// ─── Phase function ───────────────────────────────────────────────

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;

  // Apply doom_rate_multiplier from modify_rules effects on all agents.
  // Sum the multiplier overrides and accelerate/decelerate the clock accordingly.
  // Fail-soft: no agents or no overrides → tickModifier unchanged.
  const effectStates = state.effectStates;
  const agents = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
  let doomRateOverride = 0;
  for (const agent of agents) {
    doomRateOverride += getActiveRuleOverride(state.graph, agent.id, 'doom_rate_multiplier', effectStates);
  }
  let clockForAdvance = state.doomClock;
  if (doomRateOverride > 0) {
    clockForAdvance = accelerateDoomClock(state.doomClock, doomRateOverride);
  } else if (doomRateOverride < 0) {
    clockForAdvance = decelerateDoomClock(state.doomClock, -doomRateOverride);
  }

  const newDoom = advanceDoomClock(clockForAdvance);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];

  // Running effectStates — updated when doom threshold effects fire on escalation
  let runningEffectStates: Map<string, import('../types/effects').EffectRuntimeState> | null = null;

  if (newStage > oldStage) {
    const stageName = state.doomDefinition.stages[newStage - 1]?.name ?? `Stage ${newStage}`;
    events.push({
      id: nextEventId(state.tick),
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

    // Fire doom_threshold effect events on all agents
    // Triggers until_event('doom_threshold') expiry and transform effects
    let states = new Map(state.effectStates ?? new Map());
    const agents = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
    for (const agent of agents) {
      const eventResult = processEffectEvent(
        state.graph,
        agent.id,
        { type: 'doom_threshold', stage: newStage },
        states,
        state.tick,
      );
      states = applyEffectEventResult(state.graph, eventResult);
      // Execute transform requests from doom_threshold triggers
      for (const req of eventResult.transformRequests) {
        instantiateReward(state.graph, req.intoTemplate, agent.id, state.tick);
      }
      for (const trace of eventResult.traces) {
        emitTrace(trace as unknown as TraceEntry);
      }
    }
    runningEffectStates = states;
  }

  return {
    doomClock: newDoom,
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
    ...(runningEffectStates !== null ? { effectStates: runningEffectStates } : {}),
  };
}
