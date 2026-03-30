/**
 * Phase: Colocation Detection
 *
 * Every tick, for each pair of agents sharing a location tier,
 * roll for discovery. Successful detection emits agent_encounter events.
 * Uses seeded PRNG for determinism.
 */

import type { GameState, TickEvent } from '../types/gameState';
import {
  ENCOUNTER_BASE_CHANCE_HEX,
  ENCOUNTER_BASE_CHANCE_LOCATION,
  ENCOUNTER_BASE_CHANCE_SUBLOCATION,
  EYE_PERCEPTION_WEIGHT,
  SHADOW_STEALTH_WEIGHT,
  DETECTION_CHANCE_FLOOR,
  DETECTION_CHANCE_CEILING,
  COLOCATION_EVENT_SIGNIFICANCE,
} from '../data/colocation-content';

// ─── Seeded PRNG ──────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Event Counter ────────────────────────────────────────────────
let colocationEventCounter = 0;
function nextEventId(tick: number): string {
  return `evt_colocation_${tick}_${++colocationEventCounter}`;
}
export function resetColocationEventCounter(): void {
  colocationEventCounter = 0;
}

// ─── Location Tier Detection ──────────────────────────────────────

function getBaseChance(locationType: string | undefined): number {
  switch (locationType) {
    case 'sublocation': return ENCOUNTER_BASE_CHANCE_SUBLOCATION;
    case 'location': return ENCOUNTER_BASE_CHANCE_LOCATION;
    case 'hex_center':
    default: return ENCOUNTER_BASE_CHANCE_HEX;
  }
}

// ─── Phase Function ───────────────────────────────────────────────

export function phaseColocationDetection(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 97);
  const events: TickEvent[] = [];
  const graph = state.graph;

  // Group agents by location
  const locationAgents = new Map<string, string[]>();
  const actors = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  for (const actor of actors) {
    const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
    if (locEdges.length === 0) continue;
    const locId = locEdges[0].target;
    if (!locationAgents.has(locId)) locationAgents.set(locId, []);
    locationAgents.get(locId)!.push(actor.id);
  }

  // For each location with 2+ agents, roll pairwise detection
  for (const [locId, agentIds] of locationAgents) {
    if (agentIds.length < 2) continue;

    const locNode = graph.getNode(locId);
    const locType = locNode?.properties?.locationType as string | undefined;
    const baseChance = getBaseChance(locType);

    // Pairwise detection
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const observerId = agentIds[i];
        const targetId = agentIds[j];

        const observer = graph.getNode(observerId);
        const target = graph.getNode(targetId);
        if (!observer || !target) continue;

        const observerEye = ((observer.properties?.domainCapabilities as Record<string, number>)?.eye ?? 0);
        const targetShadow = ((target.properties?.domainCapabilities as Record<string, number>)?.shadow ?? 0);

        const chance = Math.max(
          DETECTION_CHANCE_FLOOR,
          Math.min(DETECTION_CHANCE_CEILING,
            baseChance + observerEye * EYE_PERCEPTION_WEIGHT - targetShadow * SHADOW_STEALTH_WEIGHT
          )
        );

        if (rng() < chance) {
          events.push({
            id: nextEventId(state.tick),
            tick: state.tick,
            type: 'agent_encounter',
            message: `${observer.name} encounters ${target.name} at ${locNode?.name ?? 'a location'}.`,
            significance: COLOCATION_EVENT_SIGNIFICANCE,
            actorId: observer.id,
            hexCoords: locNode?.properties?.hexCol != null
              ? { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number }
              : undefined,
          });
        }
      }
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
