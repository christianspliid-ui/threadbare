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
 * | REPUTATION_REACTION_MAX_LEVEL   | 3       | Max level for reputation trait scaling       |
 * | REPUTATION_BOND_SHIFT_SCALE     | 0.2     | Dampens raw reputation reaction sum          |
 * | REPUTATION_BOND_SHIFT_MAX       | 0.25    | Clamp on final reputation bond shift         |
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
import type { ReputationReactionEffect } from '../types/traits';
import {
  computeRewardEstimate, computeTotalTickCost,
  computeRewardEstimateUnified, computeTotalTickCostUnified,
  RARITY_TO_THREAT, CRUD_TO_ENCOUNTER_TYPE,
} from './encounterCache';
import { isActionStepBranch } from '../types/unifiedAction';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../data/social-encounter-content';
import { SOCIAL_SCENE_TEMPLATES } from '../data/social-scene-templates';
import { TAVERN_UNIFIED_ENCOUNTER_TEMPLATES } from '../data/tavern-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from '../data/secret-encounter-content';
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
  REPUTATION_REACTION_MAX_LEVEL,
  REPUTATION_BOND_SHIFT_SCALE,
  REPUTATION_BOND_SHIFT_MAX,
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
  REPUTATION_REACTION_MAX_LEVEL,
  REPUTATION_BOND_SHIFT_SCALE,
  REPUTATION_BOND_SHIFT_MAX,
} from '../data/agent-behavior-constants';

// ─── Cooperative/Destructive encounter type classification ───

const COOPERATIVE_TYPES = new Set(['assist', 'hire', 'trade', 'build', 'lead']);
const DESTRUCTIVE_TYPES = new Set(['steal', 'duel']);

// ─── Reputation reaction valences ───────────────────────────
// Maps each ReputationReactionEffect to a signed social valence (-1 to +1).
// Positive = reaction makes interaction more likely/favorable.
// Negative = reaction makes interaction less likely/favorable.

const REPUTATION_REACTION_VALENCES: Record<ReputationReactionEffect, number> = {
  approach:    1.0,
  reverence:   1.0,
  defer:       0.5,
  discount:    0.5,
  recruit:     0.5,
  avoid:      -0.5,
  challenge:  -0.5,
  price_gouge: -0.5,
  flee:       -1.0,
  hostility:  -1.0,
};
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

    // Filter UnifiedActionTemplate social encounters by locationSubtypes (THR-100 Phase 3)
    const matchingUnifiedSocial: UnifiedActionTemplate[] = SOCIAL_ENCOUNTER_TEMPLATES
      .filter(tmpl => (tmpl.locationSubtypes ?? []).includes(locationType as never));

    // Filter UnifiedActionTemplate tavern encounters (THR-101 Phase 3).
    // Tavern templates gate by sublocation-type.tavern; engine dispatches them
    // only when agent is at a tavern sublocation (atTavern === true).
    const matchingUnifiedTavern: UnifiedActionTemplate[] = atTavern
      ? TAVERN_UNIFIED_ENCOUNTER_TEMPLATES.filter(tmpl =>
          (tmpl.locationSubtypes ?? []).includes(TAVERN_SUBLOCATION_TYPE_ID as never),
        )
      : [];

    // Filter legacy EncounterTemplate social scenes + secret discovery by locationTypes
    const matchingTemplates = [
      ...SOCIAL_SCENE_TEMPLATES,
      // Secret discovery templates that don't require tavern sublocation (THR-30)
      ...SECRET_DISCOVERY_ENCOUNTER_TEMPLATES.filter(t => !t.sublocationTypes?.length),
    ].filter(tmpl => tmpl.locationTypes.includes(locationType));

    // Legacy tavern-exclusive templates — retained for secret-discovery only
    // (THR-30). Tavern-specific templates migrated to UnifiedActionTemplate in
    // THR-101; see matchingUnifiedTavern above.
    const extraTemplates: EncounterTemplate[] = atTavern
      ? [
          // Secret discovery templates that require tavern sublocation (THR-30)
          ...SECRET_DISCOVERY_ENCOUNTER_TEMPLATES.filter(tmpl =>
            tmpl.sublocationTypes?.includes(TAVERN_SUBLOCATION_TYPE_ID)
            && tmpl.locationTypes.includes(locationType),
          ),
        ]
      : [];

    // Add faction-scoped social templates if agents share a faction (TB-062)
    const factionTemplates = getSharedFactionSocialTemplates(
      graph, agentId, targetAgentId, locationType,
    );

    // Slot priority: faction (reserved) → unified tavern → extra (secret-discovery)
    //   → unified social → legacy scene
    const factionSlots = Math.min(factionTemplates.length, RESERVED_FACTION_SOCIAL_SLOTS);
    const slotsAfterFaction = Math.max(0, MAX_SOCIAL_CANDIDATES_PER_AGENT - factionSlots);

    const selectedFaction = factionTemplates.slice(0, factionSlots);

    // Unified tavern templates fill next when at a tavern (highest priority for
    // location-specific encounters — THR-101).
    const selectedUnifiedTavern = matchingUnifiedTavern.slice(0, slotsAfterFaction);
    const slotsAfterTavern = Math.max(0, slotsAfterFaction - selectedUnifiedTavern.length);

    // Legacy tavern-adjacent templates (secret-discovery only) fill next
    const selectedExtra = extraTemplates.slice(0, slotsAfterTavern);
    const slotsAfterExtra = Math.max(0, slotsAfterTavern - selectedExtra.length);

    // Unified social templates (migrated 14 main templates) fill remaining
    const selectedUnified = matchingUnifiedSocial.slice(0, slotsAfterExtra);
    const slotsAfterUnified = Math.max(0, slotsAfterExtra - selectedUnified.length);

    // Legacy scene templates fill any remaining slots
    const selectedLegacy = matchingTemplates.slice(0, slotsAfterUnified);

    // Emit faction candidates (legacy format)
    for (const tmpl of selectedFaction) {
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

    // Emit unified tavern candidates (THR-101 Phase 3).
    // Always resident at the tavern sublocation (agentLocationId when atTavern).
    for (const tmpl of selectedUnifiedTavern) {
      const stepReaches = tmpl.steps.map(s =>
        (isActionStepBranch(s) ? s.fallback.reach : s.reach),
      );
      const stepDifficulties = tmpl.steps.map(s =>
        (isActionStepBranch(s) ? s.fallback.difficulty : s.difficulty),
      );
      candidates.push({
        templateId: tmpl.id,
        locationId: targetLocationId,
        sublocationId: atTavern ? agentLocationId : null,
        sublocationTypeId: atTavern ? TAVERN_SUBLOCATION_TYPE_ID : null,
        targetAgentId,
        reachPrimary: tmpl.reach,
        reachSecondary: tmpl.reach,
        threatRating: RARITY_TO_THREAT[tmpl.rarityTier] ?? 'trivial',
        encounterType: CRUD_TO_ENCOUNTER_TYPE[tmpl.crudType] ?? 'assist',
        motivations: [...(tmpl.motivations ?? [])],
        visibleTo: undefined,
        requiresPresence: true,
        remotePenalty: 0,
        remoteMaxRange: undefined,
        sphereAffinity: undefined,
        questPriority: questPriorityMultiplier,
        totalTickCost: computeTotalTickCostUnified(tmpl),
        successRewardEstimate: computeRewardEstimateUnified(tmpl),
        stepCount: tmpl.steps.length,
        stepDifficulties,
        stepReaches,
      });
    }

    // Emit extra (legacy secret-discovery) candidates
    for (const tmpl of selectedExtra) {
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

    // Emit unified social candidates (THR-100 Phase 3)
    for (const tmpl of selectedUnified) {
      const stepReaches = tmpl.steps.map(s =>
        (isActionStepBranch(s) ? s.fallback.reach : s.reach),
      );
      const stepDifficulties = tmpl.steps.map(s =>
        (isActionStepBranch(s) ? s.fallback.difficulty : s.difficulty),
      );
      candidates.push({
        templateId: tmpl.id,
        locationId: targetLocationId,
        sublocationId: atTavern ? agentLocationId : null,
        sublocationTypeId: atTavern ? TAVERN_SUBLOCATION_TYPE_ID : null,
        targetAgentId,
        reachPrimary: tmpl.reach,
        reachSecondary: tmpl.reach,
        threatRating: RARITY_TO_THREAT[tmpl.rarityTier] ?? 'trivial',
        encounterType: CRUD_TO_ENCOUNTER_TYPE[tmpl.crudType] ?? 'assist',
        motivations: [...(tmpl.motivations ?? [])],
        visibleTo: undefined,
        requiresPresence: true,
        remotePenalty: 0,
        remoteMaxRange: undefined,
        sphereAffinity: undefined,
        questPriority: questPriorityMultiplier,
        totalTickCost: computeTotalTickCostUnified(tmpl),
        successRewardEstimate: computeRewardEstimateUnified(tmpl),
        stepCount: tmpl.steps.length,
        stepDifficulties,
        stepReaches,
      });
    }

    // Emit legacy scene candidates
    for (const tmpl of selectedLegacy) {
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
 * Compute the bond modifier shift contributed by the target agent's reputation traits.
 *
 * Walks the target's has_trait edges, collects reputation traits with parseable
 * reputationEffects.reactions, and sums signed reaction contributions:
 *   approach / reverence → +1.0, defer / discount / recruit → +0.5
 *   avoid / challenge / price_gouge → -0.5, flee / hostility → -1.0
 *
 * Each reaction contributes: magnitude × valence × (level / REPUTATION_REACTION_MAX_LEVEL)
 * Final value is scaled by REPUTATION_BOND_SHIFT_SCALE and clamped to ±REPUTATION_BOND_SHIFT_MAX.
 */
export function computeReputationBondShift(
  graph: WorldGraph,
  targetAgentId: string,
): number {
  const traitEdges = graph.getOutgoingEdges(targetAgentId, 'has_trait');
  if (traitEdges.length === 0) return 0;

  let rawShift = 0;

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const reputationEffects = (traitNode.properties as { reputationEffects?: { reactions?: Array<{ effect: ReputationReactionEffect; magnitude: number }> } }).reputationEffects;
    if (!reputationEffects?.reactions) continue;

    const level = (edge.properties.level as number) ?? 1;
    const levelScale = level / REPUTATION_REACTION_MAX_LEVEL;

    for (const reaction of reputationEffects.reactions) {
      const valence = REPUTATION_REACTION_VALENCES[reaction.effect] ?? 0;
      rawShift += reaction.magnitude * valence * levelScale;
    }
  }

  const scaled = rawShift * REPUTATION_BOND_SHIFT_SCALE;
  return Math.max(-REPUTATION_BOND_SHIFT_MAX, Math.min(REPUTATION_BOND_SHIFT_MAX, scaled));
}

/**
 * Compute bond modifier for scoring social encounters.
 *
 * - Strong trust → cooperative boost (reputation not applied — personal history dominates)
 * - Hostile trust → rival boost (reputation not applied — personal history dominates)
 * - No bond → stranger modifier + curiosity bonus + reputation shift from target's traits
 * - Weak bond → reputation shift only
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

  const reputationShift = computeReputationBondShift(graph, targetAgentId);

  // No significant bond → stranger
  if (trust === 0) {
    const eyeCap = computeCapability(graph, agentId, 'eye');
    const curiosityBonus = eyeCap > STRANGER_CURIOSITY_THRESHOLD ? STRANGER_CURIOSITY_BONUS : 0;
    return STRANGER_MODIFIER + curiosityBonus + reputationShift;
  }

  // Weak bond — reputation signal only
  return reputationShift;
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
