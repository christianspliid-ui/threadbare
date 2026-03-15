/**
 * Hex Threat Rating — computes composite threat score for a location.
 *
 * Score range: [0.0, 1.0] where 0 = safe, 1 = extremely dangerous.
 * Used by movement candidate scoring (threatModifier) to influence agent
 * goal evaluation: cautious agents avoid high-threat hexes.
 */

import type { WorldGraph } from './graph';
import {
  THREAT_FACTION_WEIGHT,
  THREAT_HOSTILE_AGENT_WEIGHT,
  THREAT_ENCOUNTER_WEIGHT,
} from '../data/threat-content';

/**
 * Compute the composite threat rating for a hex/location.
 * Returns a value in [0.0, 1.0].
 */
export function computeHexThreatRating(graph: WorldGraph, locationId: string): number {
  let factionThreat = 0;
  let hostileAgentThreat = 0;
  let encounterThreat = 0;

  // --- Factor 1: Controlling faction hostility ---
  const controlEdges = graph.getIncomingEdges(locationId, 'controls');
  for (const edge of controlEdges) {
    const controller = graph.getNode(edge.source);
    if (controller) {
      const hostility = (controller.properties?.hostilityToPlayer as number) ?? 0;
      factionThreat = Math.max(factionThreat, hostility);
    }
  }

  // --- Factor 2: Hostile agents at location ---
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  let hostileCount = 0;
  let totalAgents = 0;
  for (const edge of locatedAtEdges) {
    const agent = graph.getNode(edge.source);
    if (agent && agent.properties?.actorType === 'individual') {
      totalAgents++;
      const strategy = agent.properties?.cooperationStrategy as string | undefined;
      if (strategy === 'always_defect' || strategy === 'grudger') {
        hostileCount++;
      }
      // Also check if agent belongs to a hostile faction
      const memberEdges = graph.getOutgoingEdges(edge.source, 'member_of');
      for (const mEdge of memberEdges) {
        const faction = graph.getNode(mEdge.target);
        if (faction && ((faction.properties?.hostilityToPlayer as number) ?? 0) > 0.5) {
          hostileCount++;
          break;
        }
      }
    }
  }
  hostileAgentThreat = totalAgents > 0 ? Math.min(1, hostileCount / Math.max(1, totalAgents)) : 0;

  // --- Factor 3: Average encounter threat ---
  const encounterEdges = graph.getIncomingEdges(locationId, 'encounter_at');
  if (encounterEdges.length > 0) {
    let totalThreat = 0;
    for (const edge of encounterEdges) {
      const enc = graph.getNode(edge.source);
      if (enc) {
        const rating = enc.properties?.threatRating as string | undefined;
        totalThreat += threatRatingToNumber(rating);
      }
    }
    encounterThreat = totalThreat / encounterEdges.length;
  }

  // --- Composite ---
  const raw = factionThreat * THREAT_FACTION_WEIGHT
            + hostileAgentThreat * THREAT_HOSTILE_AGENT_WEIGHT
            + encounterThreat * THREAT_ENCOUNTER_WEIGHT;

  return Math.max(0, Math.min(1, raw));
}

/** Map textual threat ratings to numeric values */
function threatRatingToNumber(rating: string | undefined): number {
  switch (rating) {
    case 'trivial': return 0.1;
    case 'easy':
    case 'minor': return 0.25;
    case 'moderate': return 0.5;
    case 'hard':
    case 'serious': return 0.75;
    case 'deadly': return 1.0;
    default: return 0.3;
  }
}
