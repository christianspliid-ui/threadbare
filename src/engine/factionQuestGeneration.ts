/**
 * Faction Quest Generation — produces faction quest candidates for the agent decision pipeline.
 *
 * Called during phaseAgentDecision for each agent with active faction membership.
 * Reads the agent's member_of edges, finds faction definitions, filters quest templates
 * by rank access, and produces EncounterCacheEntry candidates that merge into the
 * normal scoring pipeline.
 *
 * Design doc: Docs/plans/2026-03-27-faction-vertical-slice-design.md — Phase 2
 * NFP: Tunability (questPriority, reach weights), Determinism (seeded PRNG),
 *       Fail-soft (missing data → skip), Inspectability (traces).
 */

import type { WorldGraph } from './graph';
import type { EncounterCacheEntry } from './encounterCache';
import type { FactionDefinition, FactionRankTier } from '../types/faction';
import { computeRankFromReputation } from '../types/faction';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { FACTION_ENCOUNTER_TEMPLATES, FACTION_ENCOUNTER_META } from '../data/faction-encounter-content';
import type { MemberOfEdgeProperties } from '../types/disposition';

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

    for (const template of accessibleTemplates) {
      const meta = FACTION_ENCOUNTER_META.get(template.id);

      // Compute total tick cost from step durations
      const totalTickCost = template.steps.reduce(
        (sum, step) => sum + (step.duration ?? 1), 0,
      );

      candidates.push({
        templateId: template.id,
        locationId,
        sublocationId: null,
        sublocationTypeId: null,
        reachPrimary: template.reachPrimary,
        reachSecondary: template.reachSecondary,
        threatRating: template.threatRating,
        encounterType: template.encounterType,
        motivations: template.motivations,
        visibleTo: [`faction:${edge.target}`],
        requiresPresence: false, // Faction quests don't require location presence
        remotePenalty: 0,
        sphereAffinity: template.sphereAffinity,
        questPriority: template.questPriority ?? (meta?.questType === 'elite' ? 8.0 : meta?.questType === 'senior' ? 5.0 : 3.0),
        totalTickCost,
        successRewardEstimate: meta?.reputationReward ?? 0.04,
      });
    }
  }

  return candidates;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Filter faction quest templates by rank access.
 * Returns templates whose prefix matches the current rank's encounterAccess list.
 */
function getAccessibleTemplates(
  definition: FactionDefinition,
  currentRank: FactionRankTier,
): typeof FACTION_ENCOUNTER_TEMPLATES {
  const accessPrefixes = currentRank.encounterAccess;
  if (accessPrefixes.length === 0) return [];

  return FACTION_ENCOUNTER_TEMPLATES.filter(template => {
    const meta = FACTION_ENCOUNTER_META.get(template.id);
    if (!meta || meta.factionDefId !== definition.id) return false;

    // Check if template ID matches any access prefix
    return accessPrefixes.some(prefix => template.id.startsWith(prefix));
  });
}
