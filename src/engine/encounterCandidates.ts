/**
 * Encounter Candidate Generator — maps encounter templates to ActionCandidates
 * with threat filtering and motivation mapping.
 *
 * Generates ActionCandidates from encounter templates available at an agent's location,
 * filters by threat rating vs agent capability (with courage/prudence modulation),
 * and maps motivations from encounter type or template override.
 */

import type { WorldGraph } from './graph';
import type { ActionCandidate } from '../types/agent';
import type { EncounterTemplate, ThreatRating } from '../types/encounter';
import {
  ENCOUNTER_TYPE_MOTIVATIONS,
  THREAT_CAPABILITY_BANDS,
  THREAT_COURAGE_THRESHOLD,
  THREAT_PRUDENCE_THRESHOLD,
} from '../types/encounter';
import { getEncountersByLocationType } from '../data/encounter-content';
import { computeCapability } from './domainCapability';

// ─── Constants ──────────────────────────────────────────────────

/** Threat rating tiers in order for ±1 expansion */
const THREAT_ORDER: ThreatRating[] = ['trivial', 'easy', 'moderate', 'hard', 'deadly'];

/** Encounter types that target another agent instead of the location */
const SOCIAL_ENCOUNTER_TYPES = new Set(['duel', 'steal', 'trade', 'assist']);

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate ActionCandidates from encounter templates available at an agent's location.
 *
 * Steps:
 * 1. Gets the location node and reads locationSubtype
 * 2. Gets matching encounter templates via getEncountersByLocationType
 * 3. For each template:
 *    a. Computes agent capability in the template's reachPrimary domain
 *    b. Multiplies by 100 to get 0-100 scale for THREAT_CAPABILITY_BANDS
 *    c. Checks if capability is within threat tolerance (with courage/prudence modulation)
 *    d. Determines target: location for non-social, another agent for social encounters
 *    e. Creates ActionCandidate with motivations from template or ENCOUNTER_TYPE_MOTIVATIONS
 * 4. Fallback: if no candidates passed threat filter, includes all trivial encounters
 * 5. Returns candidates array
 */
export function generateEncounterCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
): ActionCandidate[] {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  const subtype = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;
  if (!subtype) return [];

  const templates = getEncountersByLocationType(subtype);
  if (templates.length === 0) return [];

  // Get actor node and courage value for threat tolerance modulation
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  const axiologicalProfile = actorNode.properties.axiologicalProfile as Record<string, number> | undefined;
  const courageValue = axiologicalProfile?.courage_prudence ?? 0;

  const candidates: ActionCandidate[] = [];

  // Generate candidates from templates that pass threat filter
  for (const template of templates) {
    // Compute capability on 0-100 scale (sigmoid returns 0-1, multiply by 100)
    const capabilityNorm = computeCapability(graph, actorId, template.reachPrimary);
    const capability = capabilityNorm * 100;

    // Check if capability is within threat tolerance
    if (!isWithinThreatTolerance(capability, template.threatRating, courageValue)) {
      continue;
    }

    // Determine target: social encounters target another agent, others target location
    let targetId = locationId;
    if (SOCIAL_ENCOUNTER_TYPES.has(template.encounterType)) {
      const otherAgents = getOtherAgentsAtLocation(graph, actorId, locationId);
      if (otherAgents.length > 0) {
        // Use first available agent; caller's selection pipeline will differentiate further
        targetId = otherAgents[0];
      } else {
        // No other agents at location, skip this social encounter
        continue;
      }
    }

    // Create candidate
    candidates.push({
      templateId: template.id,
      targetId,
      domain: template.reachPrimary,
      score: 0, // Selection pipeline fills this in
      motivations: template.motivations ?? ENCOUNTER_TYPE_MOTIVATIONS[template.encounterType],
    });
  }

  // Fallback: if no candidates passed threat filter, include all trivial encounters
  if (candidates.length === 0) {
    const trivials = templates.filter(t => t.threatRating === 'trivial');
    for (const t of trivials) {
      let targetId = locationId;
      if (SOCIAL_ENCOUNTER_TYPES.has(t.encounterType)) {
        const otherAgents = getOtherAgentsAtLocation(graph, actorId, locationId);
        if (otherAgents.length > 0) {
          targetId = otherAgents[0];
        } else {
          // Skip social trivials with no targets
          continue;
        }
      }

      candidates.push({
        templateId: t.id,
        targetId,
        domain: t.reachPrimary,
        score: 0,
        motivations: t.motivations ?? ENCOUNTER_TYPE_MOTIVATIONS[t.encounterType],
      });
    }
  }

  return candidates;
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Check if an agent's capability is within tolerance for a threat rating.
 *
 * Default tolerance: tierIndex ± 1
 * - If courageValue > THREAT_COURAGE_THRESHOLD: expand maxTier +1
 * - If courageValue < THREAT_PRUDENCE_THRESHOLD: restrict minTier +1
 * Returns true if capability falls within ANY of the expanded band ranges.
 */
function isWithinThreatTolerance(
  capability: number,
  threat: ThreatRating,
  courageValue: number,
): boolean {
  const tierIndex = THREAT_ORDER.indexOf(threat);
  if (tierIndex < 0) return false;

  let minTier = Math.max(0, tierIndex - 1);
  let maxTier = Math.min(THREAT_ORDER.length - 1, tierIndex + 1);

  // Courageous agents stretch upward
  if (courageValue > THREAT_COURAGE_THRESHOLD) {
    maxTier = Math.min(THREAT_ORDER.length - 1, maxTier + 1);
  }

  // Prudent agents restrict upward
  if (courageValue < THREAT_PRUDENCE_THRESHOLD) {
    minTier = Math.max(0, minTier + 1);
  }

  // Check if capability falls within any band in the range
  for (let i = minTier; i <= maxTier; i++) {
    const tierName = THREAT_ORDER[i];
    const [lo, hi] = THREAT_CAPABILITY_BANDS[tierName];
    if (capability >= lo && capability <= hi) {
      return true;
    }
  }

  return false;
}

/**
 * Get all other agents at a location (by incoming located_at edges).
 * Excludes the specified actorId.
 */
function getOtherAgentsAtLocation(graph: WorldGraph, actorId: string, locationId: string): string[] {
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  return locatedAtEdges
    .map(e => e.source)
    .filter(id => id !== actorId);
}
