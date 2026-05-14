/**
 * Schism Plant Helper (THR-430).
 *
 * Sets the pending-resolution marker on a faction node when the player casts
 * action.faction.schism. Snapshots baseline cohesion at plant time so the
 * resolution phase can compute a meaningful cohesion-drop signal.
 *
 * Intercepted by unifiedActionResolution.ts (sibling to faction_verb) because
 * the operation needs GameState (for runtime + tick) and emits a chronicle
 * event that requires touchWorld/touchStructure invalidation.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld, touchStructure } from './simulationRuntime';
import { computeFactionCohesion } from './factionTopology';
import { emitTrace } from './traceBuffer';
import { appendRecentEvent } from './encounterAftermath';
import { formatSchismPlantChronicle } from '../data/faction-schism-content';
import { SCHISM_PLANT_CHRONICLE_SIGNIFICANCE } from '../data/game-config';

/**
 * Mark `factionId` as having a pending schism that resolves in `delay` ticks.
 *
 * Idempotent: re-casting on a faction already mid-schism resets the
 * resolution tick and re-snapshots baseline cohesion, but does not stack.
 */
export function applyPlantSchism(
  state: GameState,
  runtime: SimulationRuntime | undefined,
  factionId: string,
  actorAgentId: string,
  resolutionDelay: number,
  tick: number,
): boolean {
  const faction = state.graph.getNode(factionId);
  if (!faction || (faction.properties?.actorStatus as string | undefined) === 'dissolved') {
    return false;
  }

  const baselineCohesion = computeFactionCohesion(state, factionId);
  const resolutionTick = tick + resolutionDelay;

  faction.properties.schismPendingResolutionTick = resolutionTick;
  faction.properties.schismPlantedTick = tick;
  faction.properties.schismActorAgentId = actorAgentId;
  faction.properties.schismBaselineCohesion = baselineCohesion;

  if (runtime) {
    touchWorld(runtime);
    touchStructure(runtime);
  }

  const factionName = faction.name ?? 'faction';
  const event: TickEvent = {
    id: `${factionId}_chronicle_schism_plant_${tick}`,
    tick,
    type: 'narrative',
    message: formatSchismPlantChronicle(factionName),
    significance: SCHISM_PLANT_CHRONICLE_SIGNIFICANCE,
    actorId: actorAgentId,
  };
  state.recentEvents = appendRecentEvent(state.recentEvents ?? [], event);

  emitTrace({
    tick,
    category: 'schism_planted',
    factionId,
    factionName,
    actorAgentId,
    resolutionTick,
    baselineCohesion,
    summary: `schism_planted[${factionId}]: actor=${actorAgentId} cohesion=${baselineCohesion.toFixed(2)} resolves@${resolutionTick}`,
  });

  return true;
}
