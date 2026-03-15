/**
 * Unified Candidate Generator — generates ActionCandidates from unified action templates.
 *
 * Merges the filtering logic from both generateActionCandidates (CRUD)
 * and generateEncounterCandidates (multi-step) into a single function
 * that works against UNIFIED_ACTION_TEMPLATES.
 *
 * Filters:
 * 1. Actor affinity — template.actorAffinities includes actor's type
 * 2. Location subtype — template.locationSubtypes includes location's subtype (if specified)
 * 3. Scale gate — skip cosmic/regional templates for non-player actors
 *
 * Scoring is left to the selection pipeline (score: 0 here).
 *
 * Sprint 3E — Task 3E.1
 */

import type { WorldGraph } from './graph';
import type { ActionCandidate } from '../types/agent';
import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Constants ──────────────────────────────────────────────────

/**
 * Score bonus applied to defensive candidates when a hostile action
 * targets the agent's location. Substantial but not guaranteed to win
 * selection — the axiological profile still drives the final choice.
 */
export const THREAT_REACTION_BONUS = 0.5;

// ─── Public API ─────────────────────────────────────────────────

/**
 * Generate ActionCandidates from unified action templates for an agent at a location.
 *
 * Returns candidates with score=0 (or boosted if threat-reactive).
 * Cosmic and regional scale templates are skipped for agent-source actions
 * (those are player/divine only).
 *
 * Threat-reactive scoring: if any active (unresolved) action by another
 * actor targets this location, and a candidate template declares
 * `contestsWith` that action's template, the candidate gets a score
 * bonus of THREAT_REACTION_BONUS.
 */
export function generateUnifiedCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
  templates: readonly UnifiedActionTemplate[],
  activeActions: readonly UnifiedAction[] = [],
): ActionCandidate[] {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  const actorType = actorNode.properties.actorType as string | undefined;
  const subtype = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;

  // Collect template IDs of active hostile actions at this location (by other actors)
  const threatTemplateIds = new Set<string>();
  for (const action of activeActions) {
    if (!action.resolved && action.actorId !== actorId && action.targetId === locationId) {
      threatTemplateIds.add(action.templateId);
    }
  }

  const candidates: ActionCandidate[] = [];

  for (const template of templates) {
    // Scale gate: skip cosmic/regional templates — agents only do personal/local
    if (template.scale === 'cosmic' || template.scale === 'regional') {
      continue;
    }

    // Filter by actor affinity
    if (template.actorAffinities && template.actorAffinities.length > 0) {
      if (!actorType || !template.actorAffinities.includes(actorType as any)) {
        continue;
      }
    }

    // Filter by location subtype
    if (template.locationSubtypes && template.locationSubtypes.length > 0) {
      if (!subtype || !template.locationSubtypes.includes(subtype)) {
        continue;
      }
    }

    // Threat-reactive bonus: if this template contestsWith any active threat
    let bonus = 0;
    if (template.contestsWith && threatTemplateIds.size > 0) {
      for (const threatId of threatTemplateIds) {
        if (template.contestsWith.includes(threatId)) {
          bonus = THREAT_REACTION_BONUS;
          break;
        }
      }
    }

    // Create candidate — target is always the location
    // (Social targeting for encounter-derived templates is deferred to Sprint 5)
    candidates.push({
      templateId: template.id,
      targetId: locationId,
      domain: template.reach,
      score: bonus,
      motivations: template.motivations,
    });
  }

  return candidates;
}
