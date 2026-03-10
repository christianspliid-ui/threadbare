/**
 * Action Candidate Generator — maps enriched action templates to ActionCandidates.
 * Mirrors encounterCandidates.ts pattern for CRUD actions.
 *
 * Generates ActionCandidates from action templates available at an agent's location,
 * filters by location subtype and actor type affinity, and outputs candidates
 * for the selection pipeline.
 */

import type { WorldGraph } from './graph';
import type { ActionCandidate } from '../types/agent';
import { ACTION_TEMPLATES, type ActionTemplateData } from '../data/action-template-content';

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate ActionCandidates from CRUD action templates for an agent at a location.
 *
 * Steps:
 * 1. Gets the actor node (for actorType)
 * 2. Gets the location node (for locationSubtype)
 * 3. For each template in ACTION_TEMPLATES:
 *    a. Checks if location subtype matches (if template specifies locationSubtypes)
 *    b. Checks if actor type matches (if template specifies actorAffinities)
 *    c. Creates ActionCandidate with templateId, targetId, domain, score=0, motivations
 * 4. Returns candidates array (may be empty if no templates match)
 *
 * Filters:
 * - locationSubtypes: template specifies required location subtypes
 * - actorAffinities: template specifies required actor types (individual/faction/settlement)
 */
export function generateActionCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
): ActionCandidate[] {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  // Extract subtype from location (prefer locationSubtype, fall back to locationType)
  const subtype = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;

  // Extract actor type
  const actorType = actorNode.properties.actorType as string | undefined;

  const candidates: ActionCandidate[] = [];

  // Generate candidates from templates that pass all filters
  for (const template of ACTION_TEMPLATES) {
    // Filter by location subtype
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) {
        continue;
      }
    }

    // Filter by actor affinity
    if (template.actorAffinities && template.actorAffinities.length > 0) {
      if (!actorType || !template.actorAffinities.includes(actorType as any)) {
        continue;
      }
    }

    // Create candidate
    candidates.push({
      templateId: template.id,
      targetId: locationId,
      domain: template.reach,
      score: 0, // Selection pipeline fills this in
      motivations: template.motivations,
    });
  }

  return candidates;
}
