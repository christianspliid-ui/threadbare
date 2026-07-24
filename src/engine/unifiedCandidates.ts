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
import type { EffectRuntimeState } from '../types/effects';
import { getActionGates } from './effects/effectQueries';
import { livingGroupMemberCount } from './groups/groupQueries';
import { GROUP_MIN_MEMBERS } from '../data/group-constants';

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
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
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

  // Effect-gated reach domains: action_gate blocks/unlocks entire reach domains
  const actionGates = effectStates !== undefined
    ? getActionGates(graph, actorId, effectStates)
    : { blocked: [] as import('../types/traits').ReachDomain[], unlocked: [] as import('../types/traits').ReachDomain[] };
  const blockedReaches = new Set(actionGates.blocked);

  const candidates: ActionCandidate[] = [];

  // Living-member count of the actor's company, resolved at most once per call
  // and only when a group-exclusive template is actually encountered. Most
  // actors are ungrouped, so the lookup is skipped entirely for them.
  let cachedGroupMemberCount: number | undefined;
  const groupMemberCount = (): number => {
    if (cachedGroupMemberCount === undefined) {
      cachedGroupMemberCount = livingGroupMemberCount(graph, actorId);
    }
    return cachedGroupMemberCount;
  };

  for (const template of templates) {
    // Action gate: skip templates whose reach domain is blocked by an effect
    if (blockedReaches.has(template.reach)) {
      continue;
    }
    // Scale gate: skip cosmic/regional templates — agents only self-initiate
    // personal/local actions through the array-scored path. This does NOT gate
    // branching encounters: those surface via the encounter cache → scoring →
    // phaseAgentDecision path (encounterCache.ts / encounterFilterPipeline.ts),
    // which is scale-agnostic, so cosmic/regional branching encounters (THR-466)
    // still fire. The two paths are independent — this gate is orthogonal.
    if (template.scale === 'cosmic' || template.scale === 'regional') {
      continue;
    }

    // Filter by actor affinity
    if (template.actorAffinities && template.actorAffinities.length > 0) {
      const affinities = template.actorAffinities;
      const actorTypeMatches = actorType != null && affinities.includes(actorType as any);
      if (!actorTypeMatches) {
        // Group-exclusive reachability (THR-74): a grouped agent is still
        // `actorType: 'individual'`, so a `['group']`-only template never matches
        // their own type through the ordinary path. Allow the draw when the actor
        // belongs to a company that can field enough living members to attempt it
        // — `minGroupMembers` on the template, defaulting to the minimum company
        // size. This is the sole path by which party-exclusive content becomes
        // reachable; swept templates carrying both `'individual'` and `'group'`
        // already pass on the `'individual'` match above, unaffected.
        const groupEligible =
          affinities.includes('group') &&
          groupMemberCount() >= (template.minGroupMembers ?? GROUP_MIN_MEMBERS);
        if (!groupEligible) {
          continue;
        }
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
