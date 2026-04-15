/**
 * Social Encounter Generation — produces social encounter candidates
 * for the encounter scoring pipeline.
 *
 * Scans visible agents (same location or adjacent) and creates
 * EncounterCacheEntry objects from social encounter templates,
 * weighted by bond strength between agents.
 *
 * ─── Constants ────────────────────────────────────────────────
 * | Name                            | Default | Purpose                                     |
 * |---------------------------------|---------|---------------------------------------------|
 * | STRONG_BOND_THRESHOLD           | 0.6     | Trust above this → cooperative boost        |
 * | HOSTILE_BOND_THRESHOLD          | -0.3    | Trust below this → rival boost              |
 * | COOPERATIVE_BOND_BOOST          | 0.4     | Score boost for cooperative encounters       |
 * | RIVAL_BOND_BOOST                | 0.3     | Score boost for destructive encounters       |
 * | STRANGER_MODIFIER               | -0.1    | Penalty for encountering strangers           |
 * | STRANGER_CURIOSITY_THRESHOLD    | 0.3     | Eye capability threshold for curiosity bonus |
 * | STRANGER_CURIOSITY_BONUS        | 0.15    | Bonus for perceptive agents meeting strangers|
 * | MAX_SOCIAL_CANDIDATES_PER_AGENT | 3       | Max templates generated per target agent     |
 *
 * ─── Tracing ─────────────────────────────────────────────────
 * Emits 'social_encounter_generation' trace per agent.
 *
 * ─── Fail-soft ───────────────────────────────────────────────
 * | Failure case                     | Fallback                        |
 * |----------------------------------|---------------------------------|
 * | Agent node missing               | Return empty array              |
 * | Agent not located_at anywhere    | Return empty array              |
 * | No visible agents                | Return empty array              |
 * | Distance matrix missing entries  | Skip that location              |
 *
 * ─── PRNG ────────────────────────────────────────────────────
 * None — candidate generation is deterministic. Scoring and selection
 * happen downstream with seeded RNG.
 */

import type { EncounterCacheEntry } from './encounterCache';
import type { WorldGraph } from './graph';
import type { DistanceMatrix } from './distanceMatrix';
import { computeRewardEstimate, computeTotalTickCost } from './encounterCache';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../data/social-encounter-content';
import { SOCIAL_SCENE_TEMPLATES } from '../data/social-scene-templates';
import { TAVERN_ENCOUNTER_TEMPLATES } from '../data/tavern-encounter-content';
import { FACTION_SOCIAL_TEMPLATES } from '../data/faction-encounter-content';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import type { MemberOfEdgeProperties } from '../types/disposition';
import type { EncounterTemplate } from '../types/encounter';
import { getTrust } from './trustMechanics';
import { computeCapability } from './domainCapability';
import { emitTrace } from './traceBuffer';
import { TAVERN_SUBLOCATION_TYPE_ID } from './sublocation';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  STRONG_BOND_THRESHOLD,
  HOSTILE_BOND_THRESHOLD,
  COOPERATIVE_BOND_BOOST,
  RIVAL_BOND_BOOST,
  STRANGER_MODIFIER,
  STRANGER_CURIOSITY_THRESHOLD,
  STRANGER_CURIOSITY_BONUS,
  MAX_SOCIAL_CANDIDATES_PER_AGENT,
  VISIBLE_AGENT_MAX_HOPS,
  TAVERN_SOCIAL_ENCOUNTER_BOOST,
  TAVERN_COLOCATION_PARENT,
  SOCIAL_DENSITY_BONUS_PER_AGENT,
  SOCIAL_DENSITY_CAP,
} from '../data/agent-behavior-constants';

import {
  STRONG_BOND_THRESHOLD,
  HOSTILE_BOND_THRESHOLD,
  COOPERATIVE_BOND_BOOST,
  RIVAL_BOND_BOOST,
  STRANGER_MODIFIER,
  STRANGER_CURIOSITY_THRESHOLD,
  STRANGER_CURIOSITY_BONUS,
  MAX_SOCIAL_CANDIDATES_PER_AGENT,
  VISIBLE_AGENT_MAX_HOPS,
  TAVERN_SOCIAL_ENCOUNTER_BOOST,
  TAVERN_COLOCATION_PARENT,
  SOCIAL_DENSITY_BONUS_PER_AGENT,
  SOCIAL_DENSITY_CAP,
} from '../data/agent-behavior-constants';

// ─── Cooperative/Destructive encounter type classification ───

const COOPERATIVE_TYPES = new Set(['assist', 'hire', 'trade', 'build', 'lead']);
const DESTRUCTIVE_TYPES = new Set(['steal', 'duel']);
const RESERVED_FACTION_SOCIAL_SLOTS = 1;

// ─── Core Functions ──────────────────────────────────────────

/**
 * Generate social encounter candidates for an agent.
 *
 * Scans for visible agents (same or adjacent locations within 2 hops),
 * then produces up to MAX_SOCIAL_CANDIDATES_PER_AGENT EncounterCacheEntry
 * objects per visible target.
 *
 * Tavern behaviour (when agent is at a sublocation-type.tavern):
 *   - Colocation expands to include all agents at the parent location
 *   - Tavern-exclusive encounter templates are added to the pool
 *   - questPriority is multiplied by (1 + TAVERN_SOCIAL_ENCOUNTER_BOOST)
 *   - Social density bonus applied based on agent count at target location
 */
export function generateSocialCandidates(
  graph: WorldGraph,
  agentId: string,
  agentLocationId: string,
  distanceMatrix: DistanceMatrix,
): EncounterCacheEntry[] {
  // Fail-soft: missing agent node
  if (!graph.getNode(agentId)) return [];

  // ── Tavern detection ────────────────────────────────────────
  const agentLocNode = graph.getNode(agentLocationId);
  const agentSublocationTypeId = agentLocNode
    ? (agentLocNode.properties.sublocationTypeId as string | undefined)
    : undefined;
  const atTavern = agentSublocationTypeId === TAVERN_SUBLOCATION_TYPE_ID;

  // When at a tavern, use parent location ID for distance matrix lookups
  // so agents at the parent location are also visible (TAVERN_COLOCATION_PARENT).
  let scanLocationId = agentLocationId;
  let tavernParentId: string | undefined;
  if (atTavern && TAVERN_COLOCATION_PARENT && agentLocNode) {
    tavernParentId = agentLocNode.properties.parentLocationId as string | undefined;
    if (tavernParentId) scanLocationId = tavernParentId;
  }

  // Find visible agents — pass tavern sublocation as extra scan target so
  // agents inside the tavern are still visible when scanning from parent.
  const extraScanIds = (atTavern && tavernParentId)
    ? new Set([agentLocationId])
    : undefined;

  const visibleAgents = findVisibleAgents(
    graph,
    agentId,
    scanLocationId,
    distanceMatrix,
    extraScanIds,
  );

  if (visibleAgents.length === 0) return [];

  const tavernBoostMultiplier = atTavern ? (1 + TAVERN_SOCIAL_ENCOUNTER_BOOST) : 1;

  const candidates: EncounterCacheEntry[] = [];

  for (const { agentId: targetAgentId, locationId: targetLocationId } of visibleAgents) {
    // Get location type for template filtering.
    // If target is at a sublocation, walk up to parent for the locationType.
    const locationNode = graph.getNode(targetLocationId);
    if (!locationNode) continue;

    let locationType = (locationNode.properties.locationType as string) ?? '';
    if (!locationType && locationNode.properties.sublocationTypeId) {
      const parentId = locationNode.properties.parentLocationId as string | undefined;
      if (parentId) {
        const parentNode = graph.getNode(parentId);
        locationType = (parentNode?.properties.locationType as string) ?? '';
      }
    }

    // Social density bonus: more agents at target → higher questPriority boost.
    const agentsAtTarget = graph.getIncomingEdges(targetLocationId, 'located_at').length;
    const densityBonus = Math.min(
      Math.max(0, agentsAtTarget - 1) * SOCIAL_DENSITY_BONUS_PER_AGENT,
      SOCIAL_DENSITY_CAP,
    );

    const questPriorityMultiplier = tavernBoostMultiplier + densityBonus;

    // Filter standard social templates + deep social scene templates by location type
    const matchingTemplates = [
      ...SOCIAL_ENCOUNTER_TEMPLATES,
      ...SOCIAL_SCENE_TEMPLATES,
    ].filter(tmpl => tmpl.locationTypes.includes(locationType));

    // Include tavern-exclusive templates when acting agent is at a tavern
    const extraTemplates: EncounterTemplate[] = atTavern
      ? TAVERN_ENCOUNTER_TEMPLATES.filter(tmpl =>
          tmpl.sublocationTypes?.includes(TAVERN_SUBLOCATION_TYPE_ID)
          && tmpl.locationTypes.includes(locationType),
        )
      : [];

    // Add faction-scoped social templates if agents share a faction (TB-062)
    const factionTemplates = getSharedFactionSocialTemplates(
      graph, agentId, targetAgentId, locationType,
    );

    // Sublocation-specific templates (e.g. tavern) come first so they occupy
    // slots before generic social templates when the limit is tight.
    const selectedTemplates = selectSocialTemplates(
      [...extraTemplates, ...matchingTemplates],
      factionTemplates,
      MAX_SOCIAL_CANDIDATES_PER_AGENT,
    );

    for (const tmpl of selectedTemplates) {
      candidates.push({
        templateId: tmpl.id,
        locationId: targetLocationId,
        sublocationId: atTavern ? agentLocationId : null,
        sublocationTypeId: atTavern ? TAVERN_SUBLOCATION_TYPE_ID : null,
        targetAgentId,
        reachPrimary: tmpl.reachPrimary,
        reachSecondary: tmpl.reachSecondary,
        threatRating: tmpl.threatRating,
        encounterType: tmpl.encounterType,
        motivations: [...tmpl.motivations],
        visibleTo: tmpl.visibleTo ? [...tmpl.visibleTo] : undefined,
        requiresPresence: !tmpl.remoteAttempt,
        remotePenalty: 0,
        remoteMaxRange: undefined,
        sphereAffinity: tmpl.sphereAffinity,
        questPriority: (tmpl.questPriority ?? 1.0) * questPriorityMultiplier,
        totalTickCost: computeTotalTickCost(tmpl),
        successRewardEstimate: computeRewardEstimate(tmpl),
        stepCount: tmpl.steps.length,
        stepDifficulties: tmpl.steps.map(s => s.difficulty),
        stepReaches: tmpl.steps.map(s => s.reach),
      });
    }
  }

  emitTrace({
    tick: 0,
    category: 'social_encounter_generation',
    agentId,
    summary: `Social candidates for ${agentId}: ${candidates.length} entries from ${visibleAgents.length} visible agents${atTavern ? ' [tavern boost active]' : ''}`,
    candidateCount: candidates.length,
    visibleAgentCount: visibleAgents.length,
    atTavern,
    tavernBoostApplied: atTavern ? TAVERN_SOCIAL_ENCOUNTER_BOOST : 0,
  });

  return candidates;
}

/**
 * Compute bond modifier for scoring social encounters.
 *
 * - Strong trust → cooperative boost for cooperative encounters
 * - Hostile trust → rival boost for destructive encounters
 * - No bond → stranger modifier (with curiosity bonus for perceptive agents)
 */
export function computeBondModifier(
  graph: WorldGraph,
  agentId: string,
  targetAgentId: string,
): number {
  const trust = getTrust(graph, agentId, targetAgentId);

  if (trust > STRONG_BOND_THRESHOLD) {
    return COOPERATIVE_BOND_BOOST;
  }

  if (trust < HOSTILE_BOND_THRESHOLD) {
    return RIVAL_BOND_BOOST;
  }

  // No significant bond → stranger
  if (trust === 0) {
    // Check if the agent is perceptive (high Eye capability)
    const eyeCap = computeCapability(graph, agentId, 'eye');
    if (eyeCap > STRANGER_CURIOSITY_THRESHOLD) {
      return STRANGER_MODIFIER + STRANGER_CURIOSITY_BONUS;
    }
    return STRANGER_MODIFIER;
  }

  // Weak bond — no modifier
  return 0;
}

// ─── Internal Helpers ────────────────────────────────────────

interface VisibleAgent {
  agentId: string;
  locationId: string;
}

/**
 * Find all agents visible to the source agent:
 * - Agents at the same location
 * - Agents at locations within VISIBLE_AGENT_MAX_HOPS of the agent's location
 * - Agents at any extraLocationIds (e.g. a tavern sublocation when scanning from its parent)
 */
function findVisibleAgents(
  graph: WorldGraph,
  sourceAgentId: string,
  sourceLocationId: string,
  distanceMatrix: DistanceMatrix,
  extraLocationIds?: ReadonlySet<string>,
): VisibleAgent[] {
  const results: VisibleAgent[] = [];

  // Get all nearby location IDs (within 2 hops)
  const nearbyLocationIds = new Set<string>([sourceLocationId]);
  const sourceDistances = distanceMatrix.distances.get(sourceLocationId);
  if (sourceDistances) {
    for (const [locId, hops] of sourceDistances) {
      if (hops <= VISIBLE_AGENT_MAX_HOPS) {
        nearbyLocationIds.add(locId);
      }
    }
  }
  // Include any explicitly requested extra scan locations (e.g. tavern sublocation)
  if (extraLocationIds) {
    for (const id of extraLocationIds) nearbyLocationIds.add(id);
  }

  // For each nearby location, find agents located there
  for (const locId of nearbyLocationIds) {
    const incomingEdges = graph.getIncomingEdges(locId, 'located_at');
    for (const edge of incomingEdges) {
      const agentNode = graph.getNode(edge.source);
      if (!agentNode) continue;
      if (agentNode.type !== 'actor') continue;
      if (agentNode.properties.actorType !== 'individual') continue;
      const spotlightTier = (agentNode.properties.spotlightTier ?? 'spotlight') as string;
      const factionLinked = graph.getOutgoingEdges(edge.source, 'member_of')
        .some(memberEdge => (memberEdge.properties.factionDefId as string | undefined) != null);
      if (spotlightTier !== 'spotlight' && !factionLinked) continue;
      if (edge.source === sourceAgentId) continue; // Skip self

      results.push({
        agentId: edge.source,
        locationId: locId,
      });
    }
  }

  return results;
}

function selectSocialTemplates(
  matchingTemplates: EncounterTemplate[],
  factionTemplates: EncounterTemplate[],
  limit: number,
): EncounterTemplate[] {
  if (limit <= 0) return [];
  if (factionTemplates.length === 0) return matchingTemplates.slice(0, limit);

  const reservedFactionCount = Math.min(RESERVED_FACTION_SOCIAL_SLOTS, factionTemplates.length, limit);
  const prioritizedFactionTemplates = factionTemplates.slice(0, reservedFactionCount);
  const remainingSlots = limit - prioritizedFactionTemplates.length;
  const genericTemplates = matchingTemplates.slice(0, remainingSlots);
  const extraFactionTemplates = factionTemplates
    .slice(reservedFactionCount, reservedFactionCount + Math.max(0, limit - prioritizedFactionTemplates.length - genericTemplates.length));
  return [...prioritizedFactionTemplates, ...genericTemplates, ...extraFactionTemplates].slice(0, limit);
}

/**
 * Find faction-scoped social templates for two agents who share faction membership.
 * Returns templates from all shared factions' socialTemplateIds that match the location type.
 *
 * TB-062: Faction Social Encounters
 */
export function getSharedFactionSocialTemplates(
  graph: WorldGraph,
  agentId: string,
  targetAgentId: string,
  locationType: string,
): EncounterTemplate[] {
  const agentFactions = graph.getOutgoingEdges(agentId, 'member_of');
  const targetFactions = graph.getOutgoingEdges(targetAgentId, 'member_of');

  // Build set of factionDefIds for the target agent
  const targetFactionDefIds = new Set<string>();
  for (const edge of targetFactions) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (props.factionDefId) targetFactionDefIds.add(props.factionDefId);
  }

  // Find shared factionDefIds
  const sharedDefIds: string[] = [];
  for (const edge of agentFactions) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    if (props.factionDefId && targetFactionDefIds.has(props.factionDefId)) {
      sharedDefIds.push(props.factionDefId);
    }
  }

  if (sharedDefIds.length === 0) return [];

  // Collect social templates from all shared factions
  const templates: EncounterTemplate[] = [];
  const templateIdSet = new Set<string>();

  for (const defId of sharedDefIds) {
    const definition = FACTION_DEFINITIONS.get(defId);
    if (!definition) continue;

    for (const templateId of definition.socialTemplateIds) {
      if (templateIdSet.has(templateId)) continue;
      templateIdSet.add(templateId);

      const tmpl = FACTION_SOCIAL_TEMPLATES.find(t => t.id === templateId);
      if (tmpl && tmpl.locationTypes.includes(locationType)) {
        templates.push(tmpl);
      }
    }
  }

  return templates;
}
