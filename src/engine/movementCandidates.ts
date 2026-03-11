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
import { DISTANCE_DECAY_FACTOR } from '../data/movement-content';

/** Maximum tick distance to consider for movement candidates */
const MAX_CANDIDATE_DISTANCE = 40;

/**
 * Score a movement candidate: motivationPull × distanceDecay.
 *
 * P0: threat and social modifiers are not yet applied (deferred to P1).
 */
export function scoreMovementCandidate(motivationPull: number, tickDistance: number): number {
  const distanceDecay = 1 / (1 + DISTANCE_DECAY_FACTOR * tickDistance);
  return motivationPull * distanceDecay;
}

/**
 * Generate movement candidates for an agent at a given location.
 *
 * Finds all reachable location nodes within MAX_CANDIDATE_DISTANCE,
 * computes a motivation score for each based on the agent's axiological profile,
 * and returns scored MovementCandidate entries.
 *
 * P0: motivation is a simple heuristic based on location having encounters.
 * Full axiological scoring against encounter templates deferred to P1 integration.
 */
export function generateMovementCandidates(
  graph: WorldGraph,
  agentId: string,
  currentLocationId: string,
  profile: AxiologicalProfile,
): MovementCandidate[] {
  const candidates: MovementCandidate[] = [];

  // Gather all location nodes as potential destinations
  const allLocations = graph.getNodesByType('location');

  for (const loc of allLocations) {
    if (loc.id === currentLocationId) continue;

    // Find path
    const pathResult = findShortestPath(graph, agentId, currentLocationId, loc.id);
    if (!pathResult || pathResult.totalCost > MAX_CANDIDATE_DISTANCE) continue;
    if (pathResult.path.length === 0) continue;

    // P0 motivation heuristic: base pull of 0.5 for any reachable location
    // In P1 this will be replaced by axiological scoring against destination encounter templates
    const basePull = computeBasePull(graph, loc.id, profile);
    if (basePull <= 0) continue;

    const score = scoreMovementCandidate(basePull, pathResult.totalCost);

    candidates.push({
      destinationId: loc.id,
      bestTemplateId: '', // P0 placeholder — filled in P1 with encounter template scoring
      motivationPull: basePull,
      distanceDecay: 1 / (1 + DISTANCE_DECAY_FACTOR * pathResult.totalCost),
      score,
      tickDistance: pathResult.totalCost,
      path: pathResult.path,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * P0 motivation heuristic: locations that are hex centers score higher.
 * Scaled by the agent's ambition (ambitious agents are more motivated to move).
 * This is a placeholder — P1 replaces with full axiological scoring of encounter templates.
 */
function computeBasePull(graph: WorldGraph, locationId: string, profile: AxiologicalProfile): number {
  // Locations that are hex centers get a base pull (agents want to explore)
  const node = graph.getNode(locationId);
  if (!node) return 0;

  // Skip non-hex-center locations for P0 (agents move hex-to-hex)
  const locType = node.properties?.locationType;
  if (locType !== 'hex_center') return 0;

  // Base pull: 0.3 + ambition bonus
  const ambitionBonus = Math.max(0, profile.ambition_contentment) * 0.4;
  return 0.3 + ambitionBonus;
}
