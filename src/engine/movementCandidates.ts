/**
 * Generate and score movement candidates for an agent.
 *
 * Scans reachable locations in the movement graph, scores each by
 * motivationPull × distanceDecay, returns sorted candidates for the
 * selection pipeline.
 */

import type { WorldGraph } from './graph';
import type { AxiologicalProfile } from '../types/agent';
import type { MovementCandidate } from '../types/movement';
import { findShortestPath } from './pathfinding';
import {
  DISTANCE_DECAY_FACTOR,
  P0_BASE_MOTIVATION_PULL,
  P0_AMBITION_WEIGHT,
  MAX_CANDIDATE_DISTANCE,
  DEFAULT_QUEST_PRIORITY,
} from '../data/movement-content';
import { isEncounterVisibleToAgent } from './questVisibility';

/**
 * Score a movement candidate: motivationPull × distanceDecay.
 */
export function scoreMovementCandidate(motivationPull: number, tickDistance: number): number {
  const distanceDecay = 1 / (1 + DISTANCE_DECAY_FACTOR * tickDistance);
  return motivationPull * distanceDecay;
}

/**
 * Generate movement candidates for an agent at a given location.
 *
 * Finds all reachable location nodes within MAX_CANDIDATE_DISTANCE,
 * computes a motivation score for each based on the agent's axiological profile
 * and any quest encounters present, returns scored MovementCandidate entries.
 */
export function generateMovementCandidates(
  graph: WorldGraph,
  agentId: string,
  currentLocationId: string,
  profile: AxiologicalProfile,
): MovementCandidate[] {
  const candidates: MovementCandidate[] = [];

  const allLocations = graph.getNodesByType('location');

  for (const loc of allLocations) {
    if (loc.id === currentLocationId) continue;

    const pathResult = findShortestPath(graph, agentId, currentLocationId, loc.id);
    if (!pathResult || pathResult.totalCost > MAX_CANDIDATE_DISTANCE) continue;
    if (pathResult.path.length === 0) continue;

    const { pull: basePull, bestTemplateId } = computeBasePull(graph, loc.id, agentId, profile);
    if (basePull <= 0) continue;

    const score = scoreMovementCandidate(basePull, pathResult.totalCost);

    candidates.push({
      destinationId: loc.id,
      bestTemplateId,
      motivationPull: basePull,
      distanceDecay: 1 / (1 + DISTANCE_DECAY_FACTOR * pathResult.totalCost),
      score,
      tickDistance: pathResult.totalCost,
      path: pathResult.path,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Compute motivation pull for a destination based on encounter templates there.
 * Uses the best-matching encounter's questPriority as a multiplier.
 * P1: reads encounter templates at the destination and scores by visibility + quest priority.
 */
function computeBasePull(
  graph: WorldGraph,
  locationId: string,
  agentId: string,
  profile: AxiologicalProfile,
): { pull: number; bestTemplateId: string } {
  const node = graph.getNode(locationId);
  if (!node) return { pull: 0, bestTemplateId: '' };

  // Skip non-hex-center locations (agents move hex-to-hex)
  const locType = node.properties?.locationType;
  if (locType !== 'hex_center') return { pull: 0, bestTemplateId: '' };

  // Base pull from P0 heuristic (always computed)
  const ambitionBonus = Math.max(0, profile.ambition_contentment) * P0_AMBITION_WEIGHT;
  const baseHeuristicPull = P0_BASE_MOTIVATION_PULL + ambitionBonus;

  // Check for encounter templates at this location
  const encounterEdges = graph.getIncomingEdges(locationId, 'encounter_at');
  let bestPull = 0;
  let bestTemplateId = '';

  for (const edge of encounterEdges) {
    const encNode = graph.getNode(edge.source);
    if (!encNode) continue;

    // Check visibility
    const visibleTo = encNode.properties?.visibleTo as string[] | undefined;
    if (!isEncounterVisibleToAgent(graph, agentId, visibleTo)) continue;

    // Quest priority multiplier
    const questPriority = (encNode.properties?.questPriority as number) ?? DEFAULT_QUEST_PRIORITY;

    // Apply quest priority to base pull
    const pull = baseHeuristicPull * questPriority;

    if (pull > bestPull) {
      bestPull = pull;
      bestTemplateId = encNode.id;
    }
  }

  // Fallback: if no encounters, use P0 heuristic for hex centers
  if (bestPull === 0) {
    return { pull: baseHeuristicPull, bestTemplateId: '' };
  }

  return { pull: bestPull, bestTemplateId };
}
