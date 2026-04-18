/**
 * Faction Quest Generation — produces faction quest candidates for the agent decision pipeline.
 *
 * Called during phaseAgentDecision for each agent with active faction membership.
 * Reads the agent's member_of edges, finds faction definitions, filters quest templates
 * by rank access, and produces EncounterCacheEntry candidates that merge into the
 * normal scoring pipeline.
 *
 * Also generates join and promotion lifecycle candidates (TB-061):
 * - Join: visible to non-members at guild hall locations
 * - Promotion: visible to members near next rank threshold
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phases 2-3
 * NFP: Tunability (questPriority, reach weights), Determinism (seeded PRNG),
 *       Fail-soft (missing data → skip), Inspectability (traces).
 */

import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import type { EncounterTemplate } from '../types/encounter';
import type { FactionDefinition, FactionRankTier } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import {
  FACTION_DEFINITIONS,
  PROMOTION_PARTIAL_SUCCESS_MARGIN,
  FACTION_REPUTATION_MAINTENANCE_PRIORITY_BOOST,
  FACTION_REPUTATION_MAINTENANCE_THRESHOLD,
  FACTION_REPUTATION_PROMOTION_URGENCY_GAP,
} from '../data/faction-definitions';
import {
  FACTION_ENCOUNTER_META,
  FACTION_JOIN_TEMPLATE,
  FACTION_PROMOTION_TEMPLATE,
  getFactionEncounterById,
} from '../data/faction-encounter-content';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { QUEST_HOOK_PRIORITY_BOOST, QUEST_HOOK_COOLDOWN_TICKS } from './ruins/constants';

// ─── Ruin Quest Hook Boost ───────────────────────────────────────────────────

/**
 * Return the set of quest template IDs that have an active ruin quest hook
 * (questHookPostedTick within QUEST_HOOK_COOLDOWN_TICKS of current tick).
 * Used to boost matching templates for Adventurer's Guild candidates.
 */
function getActiveRuinQuestTemplateIds(graph: WorldGraph, tick: number): Set<string> {
  const active = new Set<string>();
  for (const n of graph.getNodesByType('location')) {
    const props = n.properties as Record<string, unknown>;
    const hookTick = props.questHookPostedTick as number | undefined;
    const templateId = props.questHookTemplateId as string | undefined;
    if (hookTick != null && templateId && tick - hookTick < QUEST_HOOK_COOLDOWN_TICKS) {
      active.add(templateId);
    }
  }
  return active;
}

// ─── Main Generator ──────────────────────────────────────────────────────

/**
 * Generate faction quest encounter candidates for a given agent.
 *
 * For each faction the agent belongs to (via member_of edges with factionDefId),
 * filters the faction's quest templates by rank access and produces
 * EncounterCacheEntry candidates at the agent's current location.
 *
 * @param graph - World graph
 * @param agentId - The agent to generate candidates for
 * @param locationId - The agent's current location
 * @param tick - Current tick (for cooldown checks)
 * @returns Array of EncounterCacheEntry candidates to merge into scoring
 */
export function generateFactionQuestCandidates(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
  _tick: number,
): EncounterCacheEntry[] {
  const candidates: EncounterCacheEntry[] = [];

  // Find all faction memberships for this agent
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');

  // Pre-collect active ruin quest hooks once — applies boost for Adventurer's Guild members
  const activeRuinHooks = getActiveRuinQuestTemplateIds(graph, _tick);

  for (const edge of memberEdges) {
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    const factionDefId = props.factionDefId;
    if (!factionDefId) continue; // Pre-faction member_of edge (economic guilds)

    const definition = FACTION_DEFINITIONS.get(factionDefId);
    if (!definition) continue; // Unknown faction definition — fail-soft

    const reputation = props.reputation ?? 0;
    const currentRank = computeRankFromReputation(reputation, definition);

    // Get quest templates accessible at current rank
    const accessibleTemplates = getAccessibleTemplates(definition, currentRank);

    // Quest hook boost applies only to Adventurer's Guild members (Channel 6)
    const isAdventurersGuild = factionDefId === 'adventuring_guild';

    for (const template of accessibleTemplates) {
      const meta = FACTION_ENCOUNTER_META.get(template.id);
      const nextTier = getNextRank(definition, currentRank);
      const reputationGap = nextTier ? Math.max(0, nextTier.minReputation - reputation) : 1;
      const maintenanceBoost = (
        reputation <= FACTION_REPUTATION_MAINTENANCE_THRESHOLD
        || reputationGap <= FACTION_REPUTATION_PROMOTION_URGENCY_GAP
        || props.promotionPending
      ) ? FACTION_REPUTATION_MAINTENANCE_PRIORITY_BOOST : 0;

      // Boost priority when the guild has posted an active quest hook for this template
      const questHookBoost = isAdventurersGuild && activeRuinHooks.has(template.id)
        ? QUEST_HOOK_PRIORITY_BOOST
        : 0;

      candidates.push(buildCacheEntry(template, locationId, {
        visibleTo: [`faction:${edge.target}`],
        requiresPresence: false,
        questPriority: (template.questPriority ?? (meta?.questType === 'elite' ? 8.0 : meta?.questType === 'senior' ? 5.0 : 3.0)) + maintenanceBoost + questHookBoost,
        successRewardEstimate: meta?.reputationReward ?? 0.04,
      }));
    }
  }

  return candidates;
}

function getNextRank(
  definition: FactionDefinition,
  currentRank: FactionRankTier,
): FactionRankTier | null {
  const index = definition.rankTiers.indexOf(currentRank);
  if (index < 0 || index >= definition.rankTiers.length - 1) return null;
  return definition.rankTiers[index + 1];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Build an EncounterCacheEntry from an encounter template with overrides.
 */
function buildCacheEntry(
  template: EncounterTemplate,
  locationId: string,
  overrides: Partial<EncounterCacheEntry>,
): EncounterCacheEntry {
  const totalTickCost = template.steps.reduce(
    (sum, step) => sum + (step.duration ?? 1), 0,
  );

  return {
    templateId: template.id,
    locationId,
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: template.reachPrimary,
    reachSecondary: template.reachSecondary,
    threatRating: template.threatRating,
    encounterType: template.encounterType,
    motivations: template.motivations,
    requiresPresence: false,
    remotePenalty: 0,
    sphereAffinity: template.sphereAffinity,
    questPriority: template.questPriority ?? 3.0,
    totalTickCost,
    successRewardEstimate: 0.04,
    stepCount: template.steps.length,
    stepDifficulties: template.steps.map(s => s.difficulty),
    stepReaches: template.steps.map(s => s.reach),
    ...overrides,
  };
}

/**
 * Filter faction quest templates by rank access.
 * Returns templates whose prefix matches the current rank's encounterAccess list.
 * Uses the unified FACTION_ENCOUNTER_META registry (covers ag.* and mc.* templates).
 */
function getAccessibleTemplates(
  definition: FactionDefinition,
  currentRank: FactionRankTier,
): EncounterTemplate[] {
  const accessPrefixes = currentRank.encounterAccess;
  if (accessPrefixes.length === 0) return [];

  return [...FACTION_ENCOUNTER_META.entries()]
    .filter(([id, meta]) =>
      meta.factionDefId === definition.id &&
      accessPrefixes.some(prefix => id.startsWith(prefix)))
    .map(([id]) => getFactionEncounterById(id))
    .filter((t): t is EncounterTemplate => t !== undefined);
}

// ─── Lifecycle Candidates (Join & Promotion) — TB-061 ────────────────────

/**
 * Generate faction join and promotion lifecycle candidates for a given agent.
 *
 * Join candidates:
 *   - Generated for ALL agents (not just members) at locations with guild halls
 *   - Uses `not_faction:<defId>` visibility filter so members are excluded
 *
 * Promotion candidates:
 *   - Generated for members whose reputation is within striking distance
 *     of the next rank threshold (within PROMOTION_PARTIAL_SUCCESS_MARGIN)
 *   - Must be at a location with a guild hall sublocation
 */
export function generateFactionLifecycleCandidates(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
): EncounterCacheEntry[] {
  const candidates: EncounterCacheEntry[] = [];

  // Check if current location has any guild/faction hall sublocations.
  // factionSeeding writes sublocationTypeId: 'sublocation-type.faction-hall';
  // existing test mocks use locationSubtype: 'guild-hall' — support both.
  const sublocations = graph.getOutgoingEdges(locationId, 'contains')
    .map(e => graph.getNode(e.target))
    .filter(n => n && (
      n.properties?.sublocationTypeId === 'sublocation-type.faction-hall' ||
      n.properties?.locationSubtype === 'guild-hall'
    ));

  if (sublocations.length === 0) return candidates;

  // Find the guild hall's sublocation ID (first one)
  const guildHallNode = sublocations[0]!;
  const guildHallId = guildHallNode.id;

  // Determine which faction this guild hall belongs to
  const factionDefId = guildHallNode.properties?.factionDefId as string | undefined;
  if (!factionDefId) return candidates;

  const definition = FACTION_DEFINITIONS.get(factionDefId);
  if (!definition) return candidates;

  // Check if agent is already a member of this faction
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of')
    .filter(e => {
      const props = e.properties as Partial<MemberOfEdgeProperties>;
      return props.factionDefId === factionDefId;
    });

  const isMember = memberEdges.length > 0;

  if (!isMember) {
    // ── Join candidate ──
    // Use per-faction joinEncounterTemplateId if defined; fall back to ag.join default
    const joinTemplateId = definition.joinEncounterTemplateId;
    const joinTemplate = joinTemplateId ? getFactionEncounterById(joinTemplateId) : FACTION_JOIN_TEMPLATE;
    if (joinTemplate) {
      candidates.push(buildCacheEntry(joinTemplate, locationId, {
        sublocationId: guildHallId,
        sublocationTypeId: 'sublocation-type.guild-hall',
        visibleTo: [`not_faction:${factionDefId}`],
        requiresPresence: true,
        questPriority: joinTemplate.questPriority ?? 6.0,
        successRewardEstimate: 0.05,
      }));
    }
  } else {
    // ── Promotion candidate (members only) ──
    const edge = memberEdges[0];
    const props = edge.properties as Partial<MemberOfEdgeProperties>;
    const reputation = props.reputation ?? 0;
    const currentRank = computeRankFromReputation(reputation, definition);

    // Use per-faction promotionEncounterTemplateId if defined; fall back to ag.promotion default
    const promoTemplateId = definition.promotionEncounterTemplateId;
    const promoTemplate = promoTemplateId ? getFactionEncounterById(promoTemplateId) : FACTION_PROMOTION_TEMPLATE;

    // Find next rank tier
    const currentTierIndex = definition.rankTiers.indexOf(currentRank);
    if (currentTierIndex >= 0 && currentTierIndex < definition.rankTiers.length - 1 && promoTemplate) {
      const nextTier = definition.rankTiers[currentTierIndex + 1];
      const gap = nextTier.minReputation - reputation;

      // When promotionPending flag is set, always inject at elevated priority 9.0 —
      // this takes precedence over the standard partial-success-margin promotion.
      const promotionPending = props.promotionPending as boolean | undefined;
      if (promotionPending) {
        candidates.push(buildCacheEntry(promoTemplate, locationId, {
          sublocationId: guildHallId,
          sublocationTypeId: 'sublocation-type.faction-hall',
          visibleTo: [`faction:${edge.target}`],
          requiresPresence: true,
          questPriority: 9.0, // Elevated priority for auto-triggered promotion
          successRewardEstimate: 0.05,
        }));
      } else if (gap <= PROMOTION_PARTIAL_SUCCESS_MARGIN) {
        // Offer promotion when close to next rank threshold (standard path)
        candidates.push(buildCacheEntry(promoTemplate, locationId, {
          sublocationId: guildHallId,
          sublocationTypeId: 'sublocation-type.guild-hall',
          visibleTo: [`faction:${edge.target}`],
          requiresPresence: true,
          questPriority: promoTemplate.questPriority ?? 7.0,
          successRewardEstimate: 0.05,
        }));
      }
    }
  }

  return candidates;
}
