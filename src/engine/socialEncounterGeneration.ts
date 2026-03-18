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
import { getTrust } from './trustMechanics';
import { computeCapability } from './domainCapability';
import { emitTrace } from './traceBuffer';

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
} from '../data/agent-behavior-constants';

// ─── Cooperative/Destructive encounter type classification ───

const COOPERATIVE_TYPES = new Set(['assist', 'hire', 'trade', 'build', 'lead']);
const DESTRUCTIVE_TYPES = new Set(['steal', 'duel']);

// ─── Core Functions ──────────────────────────────────────────

/**
 * Generate social encounter candidates for an agent.
 *
 * Scans for visible agents (same or adjacent locations within 2 hops),
 * then produces up to MAX_SOCIAL_CANDIDATES_PER_AGENT EncounterCacheEntry
 * objects per visible target.
 */
export function generateSocialCandidates(
  graph: WorldGraph,
  agentId: string,
  agentLocationId: string,
  distanceMatrix: DistanceMatrix,
): EncounterCacheEntry[] {
  // Fail-soft: missing agent node
  if (!graph.getNode(agentId)) return [];

  // Find all visible agents (at same or adjacent locations)
  const visibleAgents = findVisibleAgents(
    graph,
    agentId,
    agentLocationId,
    distanceMatrix,
  );

  if (visibleAgents.length === 0) return [];

  const candidates: EncounterCacheEntry[] = [];

  for (const { agentId: targetAgentId, locationId: targetLocationId } of visibleAgents) {
    // Get location type for template filtering
    const locationNode = graph.getNode(targetLocationId);
    if (!locationNode) continue;
    const locationType = (locationNode.properties.locationType as string) ?? '';

    // Filter templates that match the target's location type
    const matchingTemplates = SOCIAL_ENCOUNTER_TEMPLATES.filter(tmpl =>
      tmpl.locationTypes.includes(locationType),
    );

    // Take up to MAX_SOCIAL_CANDIDATES_PER_AGENT templates
    const selectedTemplates = matchingTemplates.slice(0, MAX_SOCIAL_CANDIDATES_PER_AGENT);

    for (const tmpl of selectedTemplates) {
      candidates.push({
        templateId: tmpl.id,
        locationId: targetLocationId,
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
        questPriority: tmpl.questPriority ?? 1.0,
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
    summary: `Social candidates for ${agentId}: ${candidates.length} entries from ${visibleAgents.length} visible agents`,
    candidateCount: candidates.length,
    visibleAgentCount: visibleAgents.length,
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
 */
function findVisibleAgents(
  graph: WorldGraph,
  sourceAgentId: string,
  sourceLocationId: string,
  distanceMatrix: DistanceMatrix,
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

  // For each nearby location, find agents located there
  for (const locId of nearbyLocationIds) {
    const incomingEdges = graph.getIncomingEdges(locId, 'located_at');
    for (const edge of incomingEdges) {
      const agentNode = graph.getNode(edge.source);
      if (!agentNode) continue;
      if (agentNode.type !== 'actor') continue;
      if (edge.source === sourceAgentId) continue; // Skip self

      results.push({
        agentId: edge.source,
        locationId: locId,
      });
    }
  }

  return results;
}
