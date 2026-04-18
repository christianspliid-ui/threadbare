/**
 * Phase: Reputation Traits — tally decay, threshold checks, trait assignment/removal,
 * and power renown computation.
 *
 * Runs as orchestrator phase 6.64 (after phaseEconomicTraits at 6.632).
 * Processes all actor nodes (individuals, factions, monsters).
 *
 * ─── Constants ────────────────────────────────────────────────
 * | Name                               | Default | Purpose                              |
 * |------------------------------------|---------|--------------------------------------|
 * | REPUTATION_LEVEL_1_THRESHOLD       | 3       | Completions for Level 1 (Whispered)  |
 * | REPUTATION_LEVEL_2_THRESHOLD       | 8       | Completions for Level 2 (Known)      |
 * | REPUTATION_LEVEL_3_THRESHOLD       | 15      | Completions for Level 3 (Legendary)  |
 * | REPUTATION_TALLY_DECAY_PER_TICK    | 0.02    | Tally decay rate per tick            |
 * | REPUTATION_POWER_TIER_NOTED        | 4       | Min tier for Noted renown (L1)       |
 * | REPUTATION_POWER_TIER_RENOWNED     | 6       | Min tier for Renowned (L2)           |
 * | REPUTATION_POWER_TIER_LEGENDARY    | 8       | Min tier for Legendary (L3)          |
 *
 * ─── Tracing ─────────────────────────────────────────────────
 * Emits 'reputation_trait' traces for tally increments, trait assignments,
 * reinforcements, removals, and decays.
 *
 * ─── Fail-soft ───────────────────────────────────────────────
 * | Failure case                    | Fallback                             |
 * |---------------------------------|--------------------------------------|
 * | Missing actor node              | Skip                                 |
 * | Missing trait definition node   | Skip (ensureTraitNodes handles)      |
 * | Missing reputationTallies prop  | Treat as empty ({})                  |
 * | computeCapability throws        | Use 0 for that reach                 |
 *
 * ─── PRNG ────────────────────────────────────────────────────
 * None — reputation traits are deterministic threshold checks.
 *
 * Design doc: plan file jiggly-tinkering-papert.md
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { ReputationTallyKey, ReputationTallies } from '../types/agent';
import type { EncounterTemplate } from '../types/encounter';
import { REACH_DOMAINS } from '../types/traits';
import { REACH_VALUE_PAIR } from '../types/agent';
import { assignTrait, removeTrait, reinforceTrait, getTraitsForNode } from './traits';
import { computeCapability, computeTier } from './domainCapability';
import { emitTrace } from './traceBuffer';
import { getAnyEncounterById } from '../data/encounter-content';
import { REPUTATION_TRAIT_DEFINITIONS, getReputationTraitId } from '../data/reputation-trait-content';
import {
  REPUTATION_LEVEL_1_THRESHOLD,
  REPUTATION_LEVEL_2_THRESHOLD,
  REPUTATION_LEVEL_3_THRESHOLD,
  REPUTATION_TALLY_DECAY_PER_TICK,
  REPUTATION_POWER_TIER_NOTED,
  REPUTATION_POWER_TIER_RENOWNED,
  REPUTATION_POWER_TIER_LEGENDARY,
  REPUTATION_POSITIVE_ENCOUNTER_TYPES,
  REPUTATION_NEGATIVE_ENCOUNTER_TYPES,
  FACTION_REP_MIN_MEMBERS_FOR_TRAIT,
  FACTION_REP_RANK_WEIGHT_FALLOFF,
  FACTION_REP_AGGREGATION_INTERVAL_TICKS,
  FACTION_REP_DECAY_PER_AGGREGATION,
} from '../data/agent-behavior-constants';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { computeRankFromReputation } from '../types/faction';

// ─── Trait Node Initialization ─────────────────────────────────────

function ensureReputationTraitNodes(graph: WorldGraph): void {
  // Check if the first trait node exists in this specific graph.
  // If it does, all others were added together, so skip.
  // If not, add all trait definition nodes.
  // This avoids module-level singleton state that persists across test sessions.
  if (REPUTATION_TRAIT_DEFINITIONS.length === 0) return;

  const firstTraitId = REPUTATION_TRAIT_DEFINITIONS[0].id;
  if (graph.getNode(firstTraitId)) {
    // First trait already exists, so all trait nodes are already in this graph
    return;
  }

  // Add all trait definition nodes
  for (const node of REPUTATION_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) {
      graph.addNode(node);
    }
  }
}

/** Reset initialization flag (for tests / new sessions) — now a no-op since we check graph state */
export function resetReputationTraitInit(): void {
  // No-op: initialization is now graph-aware via ensureReputationTraitNodes check
}

// ─── Tally Helpers ─────────────────────────────────────────────────

function getTallies(graph: WorldGraph, actorId: string): ReputationTallies {
  const node = graph.getNode(actorId);
  return (node?.properties?.reputationTallies as ReputationTallies) ?? {};
}

function setTallies(graph: WorldGraph, actorId: string, tallies: ReputationTallies): void {
  const node = graph.getNode(actorId);
  if (!node) return;
  node.properties.reputationTallies = tallies;
}

function tallyKey(reach: ReachDomain, polarity: 'positive' | 'negative'): ReputationTallyKey {
  return `${reach}.${polarity}`;
}

// ─── Threshold ─────────────────────────────────────────────────────

function levelFromTally(tally: number): number {
  if (tally >= REPUTATION_LEVEL_3_THRESHOLD) return 3;
  if (tally >= REPUTATION_LEVEL_2_THRESHOLD) return 2;
  if (tally >= REPUTATION_LEVEL_1_THRESHOLD) return 1;
  return 0;
}

// ─── Polarity Determination ────────────────────────────────────────

/**
 * Determine reputation polarity for an encounter completion.
 *
 * Layer 1: Explicit template tag (reputationPolarity field)
 * Layer 2: Encounter type heuristic (assist/build = positive, steal/duel = negative)
 * Layer 3: Agent axiological profile tiebreaker
 */
export function determinePolarity(
  template: EncounterTemplate,
  graph: WorldGraph,
  agentId: string,
): 'positive' | 'negative' | null {
  // Layer 1: explicit tag
  if (template.reputationPolarity) {
    return template.reputationPolarity;
  }

  // Layer 2: encounter type heuristic
  if (REPUTATION_POSITIVE_ENCOUNTER_TYPES.has(template.encounterType)) {
    return 'positive';
  }
  if (REPUTATION_NEGATIVE_ENCOUNTER_TYPES.has(template.encounterType)) {
    return 'negative';
  }

  // Layer 3: axiological profile tiebreaker
  const valuePair = REACH_VALUE_PAIR[template.reachPrimary];
  if (!valuePair) return null;

  const agentNode = graph.getNode(agentId);
  const profile = agentNode?.properties?.axiologicalProfile as Record<string, number> | undefined;
  if (!profile) return null;

  const value = profile[valuePair] ?? 0;
  if (value > 0) return 'positive';   // virtue pole
  if (value < 0) return 'negative';   // flaw pole
  return null; // exactly 0 = no contribution
}

// ─── Tally Increment Hook ──────────────────────────────────────────

/**
 * Called from orchestrator after encounter step success.
 * Increments the appropriate reach-polarity tally on the agent.
 */
export function processReputationTally(
  graph: WorldGraph,
  agentId: string,
  encounterId: string,
  stepSuccess: boolean,
  encounterCompleted: boolean,
  tick: number,
): void {
  if (!stepSuccess) return;

  const template = getAnyEncounterById(encounterId);
  if (!template) return;

  const polarity = determinePolarity(template, graph, agentId);
  if (!polarity) return;

  const reach = template.reachPrimary;
  const key = tallyKey(reach, polarity);

  const tallies = getTallies(graph, agentId);
  const oldValue = tallies[key] ?? 0;
  // Increment by 1 per step success, bonus 1 for full completion
  const increment = encounterCompleted ? 2 : 1;
  const newValue = oldValue + increment;
  tallies[key] = newValue;
  setTallies(graph, agentId, tallies);

  emitTrace({
    tick,
    category: 'reputation_trait',
    agentId,
    reach,
    polarity,
    action: 'tally_increment',
    tallyValue: newValue,
    cause: encounterId,
    summary: `${agentId} +${increment} ${reach}.${polarity} reputation tally (now ${newValue.toFixed(1)})`,
  } as unknown as Parameters<typeof emitTrace>[0]);
}

// ─── Orchestrator Phase ────────────────────────────────────────────

/**
 * Phase 6.64: Reputation Traits.
 * Decays tallies, checks thresholds, assigns/reinforces/removes reputation traits,
 * and computes power renown.
 */
export function phaseReputationTraits(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  ensureReputationTraitNodes(graph);

  // Process all actors (individuals, factions, monsters)
  const actors = graph.getNodesByType('actor');

  for (const actor of actors) {
    const actorId = actor.id;
    const tallies = getTallies(graph, actorId);

    // ── Decay tallies ──
    let anyTallyChanged = false;
    for (const key of Object.keys(tallies) as ReputationTallyKey[]) {
      const oldVal = tallies[key] ?? 0;
      if (oldVal > 0) {
        tallies[key] = Math.max(0, oldVal - REPUTATION_TALLY_DECAY_PER_TICK);
        anyTallyChanged = true;
      }
    }
    if (anyTallyChanged) {
      setTallies(graph, actorId, tallies);
    }

    // ── Check reach reputation thresholds ──
    for (const reach of REACH_DOMAINS) {
      const posKey = tallyKey(reach, 'positive');
      const negKey = tallyKey(reach, 'negative');
      const posTally = tallies[posKey] ?? 0;
      const negTally = tallies[negKey] ?? 0;

      const posLevel = levelFromTally(posTally);
      const negLevel = levelFromTally(negTally);

      const posTraitId = getReputationTraitId(reach, 'positive');
      const negTraitId = getReputationTraitId(reach, 'negative');

      // Polarity competition: higher tally wins. Ties = no change.
      if (posLevel > 0 && posLevel >= negLevel) {
        syncReputationTrait(graph, actorId, posTraitId, posLevel, tick, reach, 'positive');
        // Remove competing negative if present
        removeIfPresent(graph, actorId, negTraitId, tick, reach, 'negative');
      } else if (negLevel > 0 && negLevel > posLevel) {
        syncReputationTrait(graph, actorId, negTraitId, negLevel, tick, reach, 'negative');
        // Remove competing positive if present
        removeIfPresent(graph, actorId, posTraitId, tick, reach, 'positive');
      } else {
        // Both below threshold — remove both if present
        removeIfPresent(graph, actorId, posTraitId, tick, reach, 'positive');
        removeIfPresent(graph, actorId, negTraitId, tick, reach, 'negative');
      }
    }

    // ── Power renown ──
    let maxTier = 0;
    for (const reach of REACH_DOMAINS) {
      try {
        const cap = computeCapability(graph, actorId, reach);
        const tier = computeTier(cap);
        if (tier > maxTier) maxTier = tier;
      } catch {
        // fail-soft: skip this reach
      }
    }

    const renownLevel = maxTier >= REPUTATION_POWER_TIER_LEGENDARY ? 3
      : maxTier >= REPUTATION_POWER_TIER_RENOWNED ? 2
      : maxTier >= REPUTATION_POWER_TIER_NOTED ? 1
      : 0;

    const renownTraitId = 'trait.reputation.power.renown';
    if (renownLevel > 0) {
      syncReputationTrait(graph, actorId, renownTraitId, renownLevel, tick, 'power', 'renown');
    } else {
      removeIfPresent(graph, actorId, renownTraitId, tick, 'power', 'renown');
    }
  }

  // ── Faction reputation aggregation (runs every N ticks) ──
  if (tick % FACTION_REP_AGGREGATION_INTERVAL_TICKS === 0) {
    aggregateFactionReputations(graph, tick);
  }

  return {};
}

// ─── Faction Aggregation ───────────────────────────────────────────

/**
 * For each faction actor node, scan member_of edges, aggregate member tallies
 * with rank-weighted contributions, and assign faction-level reputation traits.
 * Runs every FACTION_REP_AGGREGATION_INTERVAL_TICKS ticks.
 */
function aggregateFactionReputations(graph: WorldGraph, tick: number): void {
  const factionNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction');

  for (const factionNode of factionNodes) {
    const factionId = factionNode.id;
    const factionDefId = factionNode.properties.factionDefId as string | undefined;

    const definition = factionDefId ? FACTION_DEFINITIONS.get(factionDefId) : undefined;
    if (!definition) {
      emitTrace({
        tick,
        category: 'faction_reputation_trait',
        agentId: factionId,
        action: 'faction_aggregation_skipped',
        summary: `Faction ${factionId}: no definition found, skipping aggregation`,
      } as unknown as Parameters<typeof emitTrace>[0]);
      continue;
    }

    const memberEdges = graph.getIncomingEdges(factionId, 'member_of');
    if (memberEdges.length < FACTION_REP_MIN_MEMBERS_FOR_TRAIT) continue;

    // Decay faction-level tallies first
    const factionTallies = getTallies(graph, factionId);
    for (const key of Object.keys(factionTallies) as ReputationTallyKey[]) {
      const v = factionTallies[key] ?? 0;
      if (v > 0) factionTallies[key] = Math.max(0, v - FACTION_REP_DECAY_PER_AGGREGATION);
    }

    // Aggregate member tallies per reach×polarity with rank weighting
    const totalRanks = definition.rankTiers.length;
    const aggregated: Partial<Record<ReputationTallyKey, number>> = {};

    let validMemberCount = 0;
    for (const edge of memberEdges) {
      const memberId = edge.source;
      const memberNode = graph.getNode(memberId);
      if (!memberNode) continue; // fail-soft: skip missing members

      const props = edge.properties as Partial<MemberOfEdgeProperties>;
      const reputation = props.reputation ?? 0;

      const currentRank = computeRankFromReputation(reputation, definition);
      const tierIndex = definition.rankTiers.indexOf(currentRank);
      const rankIndexFromTop = (totalRanks - 1) - Math.max(0, tierIndex);
      const weight = 1 - (rankIndexFromTop / totalRanks) * FACTION_REP_RANK_WEIGHT_FALLOFF;

      const memberTallies = getTallies(graph, memberId);
      for (const reach of REACH_DOMAINS) {
        for (const polarity of ['positive', 'negative'] as const) {
          const key = tallyKey(reach, polarity);
          const memberVal = (memberTallies[key] ?? 0) * weight;
          aggregated[key] = (aggregated[key] ?? 0) + memberVal;
        }
      }
      validMemberCount++;
    }

    if (validMemberCount === 0) continue;

    // Normalize by member count and merge with decayed faction tallies
    for (const reach of REACH_DOMAINS) {
      for (const polarity of ['positive', 'negative'] as const) {
        const key = tallyKey(reach, polarity);
        const contributed = (aggregated[key] ?? 0) / validMemberCount;
        const existing = factionTallies[key] ?? 0;
        // Take max of existing (decayed) and contributed — let the higher value win
        factionTallies[key] = Math.max(existing, contributed);
      }
    }

    setTallies(graph, factionId, factionTallies);

    // Assign/remove traits based on aggregated tallies
    for (const reach of REACH_DOMAINS) {
      const posKey = tallyKey(reach, 'positive');
      const negKey = tallyKey(reach, 'negative');
      const posTally = factionTallies[posKey] ?? 0;
      const negTally = factionTallies[negKey] ?? 0;
      const posLevel = levelFromTally(posTally);
      const negLevel = levelFromTally(negTally);

      const posTraitId = getReputationTraitId(reach, 'positive');
      const negTraitId = getReputationTraitId(reach, 'negative');

      if (posLevel > 0 && posLevel >= negLevel) {
        syncReputationTrait(graph, factionId, posTraitId, posLevel, tick, reach, 'positive');
        removeIfPresent(graph, factionId, negTraitId, tick, reach, 'negative');
        emitTrace({
          tick,
          category: 'faction_reputation_trait',
          agentId: factionId,
          reach,
          polarity: 'positive',
          action: 'trait_assigned',
          traitLevel: posLevel,
          memberCount: validMemberCount,
          aggregatedTally: posTally,
          summary: `Faction ${factionId}: ${reach}.positive L${posLevel} (${validMemberCount} members, tally ${posTally.toFixed(2)})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      } else if (negLevel > 0 && negLevel > posLevel) {
        syncReputationTrait(graph, factionId, negTraitId, negLevel, tick, reach, 'negative');
        removeIfPresent(graph, factionId, posTraitId, tick, reach, 'positive');
        emitTrace({
          tick,
          category: 'faction_reputation_trait',
          agentId: factionId,
          reach,
          polarity: 'negative',
          action: 'trait_assigned',
          traitLevel: negLevel,
          memberCount: validMemberCount,
          aggregatedTally: negTally,
          summary: `Faction ${factionId}: ${reach}.negative L${negLevel} (${validMemberCount} members, tally ${negTally.toFixed(2)})`,
        } as unknown as Parameters<typeof emitTrace>[0]);
      } else {
        removeIfPresent(graph, factionId, posTraitId, tick, reach, 'positive');
        removeIfPresent(graph, factionId, negTraitId, tick, reach, 'negative');
      }
    }
  }
}

// ─── Sync Helpers ──────────────────────────────────────────────────

function syncReputationTrait(
  graph: WorldGraph,
  actorId: string,
  traitId: string,
  targetLevel: number,
  tick: number,
  reach: ReachDomain | 'power',
  polarity: 'positive' | 'negative' | 'renown',
): void {
  const existing = getTraitsForNode(graph, actorId).find(e => e.target === traitId);

  if (!existing) {
    // Assign new
    assignTrait(graph, actorId, traitId, { tick, source: 'reputation_accumulation' });
    // If target level > 1, reinforce to reach it
    for (let i = 1; i < targetLevel; i++) {
      reinforceTrait(graph, actorId, traitId, tick);
    }
    emitTrace({
      tick,
      category: 'reputation_trait',
      agentId: actorId,
      reach,
      polarity,
      action: 'trait_assigned',
      traitLevel: targetLevel,
      summary: `${actorId} gained reputation trait ${traitId} at level ${targetLevel}`,
    } as unknown as Parameters<typeof emitTrace>[0]);
  } else {
    // Check if reinforcement needed
    const currentLevel = (existing.properties as { level?: number }).level ?? 1;
    if (targetLevel > currentLevel) {
      for (let i = currentLevel; i < targetLevel; i++) {
        reinforceTrait(graph, actorId, traitId, tick);
      }
      emitTrace({
        tick,
        category: 'reputation_trait',
        agentId: actorId,
        reach,
        polarity,
        action: 'trait_reinforced',
        traitLevel: targetLevel,
        summary: `${actorId} reputation ${traitId} reinforced to level ${targetLevel}`,
      } as unknown as Parameters<typeof emitTrace>[0]);
    }
    // Note: we don't downgrade levels — decay removes the trait when tally drops below threshold
  }
}

function removeIfPresent(
  graph: WorldGraph,
  actorId: string,
  traitId: string,
  tick: number,
  reach: ReachDomain | 'power',
  polarity: 'positive' | 'negative' | 'renown',
): void {
  const existing = getTraitsForNode(graph, actorId).find(e => e.target === traitId);
  if (existing) {
    removeTrait(graph, actorId, traitId);
    emitTrace({
      tick,
      category: 'reputation_trait',
      agentId: actorId,
      reach,
      polarity,
      action: 'trait_removed',
      summary: `${actorId} lost reputation trait ${traitId}`,
    } as unknown as Parameters<typeof emitTrace>[0]);
  }
}
