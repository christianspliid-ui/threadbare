/**
 * Return Engine — peak-end convergence for The First's hero journey arc.
 *
 * TB-035 Phase 3. The Return fires during the Return phase (85-100% doom clock).
 * Founding Gates filter impossible outcomes, Ordeal is the dominant signal,
 * relationship state is the tiebreaker, archetype defaults are soft tiebreakers.
 *
 * Pure functions + seeded PRNG. Side effects limited to graph mutations in
 * applyReturnOutcome.
 */

import type { WorldGraph } from './graph';
import type { GameState, TickEvent } from '../types/gameState';
import type { ThreadEdgeProperties, CourtPosition } from '../types/influence';
import type { MeetingChoiceRecord } from '../types/meetingEncounter';
import type { BeatOutcome, OrdealOutcome } from '../types/journeyEngine';
import type { CooperationStrategy } from '../types/disposition';
import type { GraphNode, GraphEdge } from '../types/graph';
import type {
  ReturnOutcome,
  ReturnRelationshipState,
  RippleTarget,
  RippleConsequenceResult,
  RippleGraphOp,
  ReturnResolutionResult,
  FoundingGateConfig,
  RippleTargetType,
} from '../types/returnEngine';
import {
  ALL_RETURN_OUTCOMES,
  FOUNDING_GATES,
  USURPER_BYPASS_ARCHETYPES,
  ORDEAL_OPENS,
  ORDEAL_CLOSES,
  ORDEAL_STRONG_BONUS,
  ORDEAL_WEAK_BONUS,
  RELATIONSHIP_TRUST_WEIGHT,
  RELATIONSHIP_COOPERATION_WEIGHT,
  ARCHETYPE_DEFAULT_BONUS,
  RIPPLE_MAX_TARGETS,
  RIPPLE_FACTION_SPLIT_THRESHOLD,
  RETURN_COOLDOWN,
  MAX_COOLDOWN_TICKS,
} from '../types/returnEngine';
import {
  getThreadsFrom,
  getActorTraits,
  getAgentBonds,
  getAgentMemberships,
} from './graphQueries';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';
import { RETURN_OUTCOME_PROSE, RIPPLE_CONSEQUENCE_PROSE } from '../data/return-content';
import { enrichProse, gatherNarrativeContext } from './proseEnrichment';
import type { DoomIdentityMatrix } from '../types/doomIdentity';

// ─── Founding Gates ────────────────────────────────────────────────

/**
 * Check if a Return outcome passes its founding gate.
 * Returns true if the meeting choice tags satisfy the gate requirements.
 */
export function passesFoundingGate(
  meetingRecord: MeetingChoiceRecord | undefined,
  outcome: ReturnOutcome,
  archetypeId?: string,
): boolean {
  if (!meetingRecord) {
    // No meeting record — only gateless outcomes pass
    return FOUNDING_GATES[outcome].requiredTags.length === 0;
  }

  const config = FOUNDING_GATES[outcome];
  const tags = meetingRecord.foundingGateTags ?? [];
  const intentReach = meetingRecord.intentPrimaryReach;

  // Check excluded intent reaches
  if (config.excludedIntentReaches?.includes(intentReach)) {
    return false;
  }

  // Check required intent reaches
  if (config.requiredIntentReaches && config.requiredIntentReaches.length > 0) {
    if (!config.requiredIntentReaches.includes(intentReach)) {
      return false;
    }
  }

  // No required tags = always passes
  if (config.requiredTags.length === 0) {
    return true;
  }

  // Check if at least one required tag is present
  const hasTag = config.requiredTags.some(tag => tags.includes(tag));

  // Usurper special case: archetype bypass
  if (outcome === 'usurper' && !hasTag && archetypeId) {
    return USURPER_BYPASS_ARCHETYPES.includes(archetypeId);
  }

  return hasTag;
}

/**
 * Evaluate all founding gates for a meeting record.
 * Returns a map of outcome → pass/fail.
 */
export function evaluateAllFoundingGates(
  meetingRecord: MeetingChoiceRecord | undefined,
  archetypeId?: string,
): Record<ReturnOutcome, boolean> {
  const results = {} as Record<ReturnOutcome, boolean>;
  for (const outcome of ALL_RETURN_OUTCOMES) {
    results[outcome] = passesFoundingGate(meetingRecord, outcome, archetypeId);
  }
  return results;
}

// ─── Relationship State ────────────────────────────────────────────

/**
 * Build the relationship state from thread edge properties and graph data.
 */
export function buildRelationshipState(
  threadProps: ThreadEdgeProperties,
): ReturnRelationshipState {
  const tracking = threadProps.interventionTracking as
    | { totalVignettes?: number; playerIntervened?: number; playerWithdrew?: number; supportiveCount?: number; coerciveCount?: number; essenceSpentOnEncounters?: number }
    | undefined;

  const totalVignettes = tracking?.totalVignettes ?? 0;
  const playerIntervened = tracking?.playerIntervened ?? 0;
  const interventionRatio = totalVignettes > 0 ? playerIntervened / totalVignettes : 0;
  const supportive = tracking?.supportiveCount ?? 0;
  const coercive = tracking?.coerciveCount ?? 0;
  const supportiveVsCoercive = supportive - coercive;

  // Cooperation strategy from thread context
  const cooperationStrategy = 'tit_for_tat' as CooperationStrategy; // Default

  // Trust derived from intervention pattern
  // High intervention + supportive = high trust
  // High intervention + coercive = low trust
  // Low intervention = neutral
  const trustBase = interventionRatio * 0.5;
  const trustModifier = supportiveVsCoercive * 0.1;
  const trust = Math.max(-1, Math.min(1, trustBase + trustModifier));

  return {
    bondTier: threadProps.tier,
    totalEssenceSpent: threadProps.totalEssenceSpent ?? 0,
    interventionRatio,
    supportiveVsCoercive,
    cooperationStrategy,
    trust,
  };
}

// ─── Scoring ───────────────────────────────────────────────────────

/**
 * Score an outcome based on ordeal result.
 */
function ordealScore(ordeal: OrdealOutcome, outcome: ReturnOutcome): number {
  const opens = ORDEAL_OPENS[ordeal];
  if (opens.includes(outcome)) return ORDEAL_STRONG_BONUS;
  // scraped_through opens everything — weaker bonus
  if (ordeal === 'scraped_through') return ORDEAL_WEAK_BONUS;
  return 0;
}

/**
 * Score an outcome based on relationship state.
 */
function relationshipScore(rel: ReturnRelationshipState, outcome: ReturnOutcome): number {
  switch (outcome) {
    case 'loyal_ascension':
      return (rel.trust * RELATIONSHIP_TRUST_WEIGHT +
        (rel.supportiveVsCoercive > 0 ? 1 : 0) * RELATIONSHIP_COOPERATION_WEIGHT) * 0.5;
    case 'sacrifice':
      return (rel.trust * RELATIONSHIP_TRUST_WEIGHT +
        (rel.bondTier >= 3 ? 1 : 0)) * 0.5;
    case 'vanishing':
      return ((1 - Math.abs(rel.trust)) * RELATIONSHIP_TRUST_WEIGHT +
        (rel.interventionRatio < 0.3 ? 1 : 0)) * 0.3;
    case 'transcendence':
      return (rel.trust * RELATIONSHIP_TRUST_WEIGHT +
        (rel.totalEssenceSpent > 10 ? 1 : 0)) * 0.4;
    case 'usurper':
      return ((1 - rel.trust) * RELATIONSHIP_TRUST_WEIGHT +
        (rel.supportiveVsCoercive < 0 ? 1 : 0) * RELATIONSHIP_COOPERATION_WEIGHT) * 0.5;
    case 'monster':
      return ((rel.supportiveVsCoercive < -2 ? 1 : 0) * RELATIONSHIP_COOPERATION_WEIGHT +
        (rel.interventionRatio > 0.8 ? 0.5 : 0)) * 0.5;
    default:
      return 0;
  }
}

/**
 * Default archetype trajectory bonus.
 * Maps archetype patterns to natural endings.
 */
function archetypeDefaultScore(archetypeId: string, outcome: ReturnOutcome): number {
  // Broad archetype → outcome affinities
  const heroArchetypes = ['iron_iron', 'iron_heart', 'heart_iron', 'star_iron'];
  const scholarArchetypes = ['eye_eye', 'eye_veil', 'veil_eye', 'eye_star'];
  const tricksterArchetypes = ['shadow_shadow', 'shadow_gold', 'gold_shadow'];
  const mysticArchetypes = ['star_star', 'star_veil', 'veil_star', 'star_eye'];

  if (heroArchetypes.includes(archetypeId)) {
    if (outcome === 'loyal_ascension' || outcome === 'sacrifice') return ARCHETYPE_DEFAULT_BONUS;
  }
  if (scholarArchetypes.includes(archetypeId)) {
    if (outcome === 'transcendence' || outcome === 'vanishing') return ARCHETYPE_DEFAULT_BONUS;
  }
  if (tricksterArchetypes.includes(archetypeId)) {
    if (outcome === 'usurper' || outcome === 'vanishing') return ARCHETYPE_DEFAULT_BONUS;
  }
  if (mysticArchetypes.includes(archetypeId)) {
    if (outcome === 'transcendence' || outcome === 'loyal_ascension') return ARCHETYPE_DEFAULT_BONUS;
  }

  return 0;
}

// ─── Convergence Algorithm ─────────────────────────────────────────

/**
 * Resolve the Return — the peak-end convergence model.
 *
 * 1. Filter by founding gates (hard prerequisites from meeting)
 * 2. Filter by ordeal (opens/closes outcomes)
 * 3. Score remaining candidates
 * 4. Return highest score (ties: archetype default > alphabetical)
 */
export function resolveReturn(
  meetingRecord: MeetingChoiceRecord | undefined,
  ordeal: OrdealOutcome,
  relationship: ReturnRelationshipState,
  archetypeId: string,
  beatHistory: BeatOutcome[],
): { outcome: ReturnOutcome; scores: Partial<Record<ReturnOutcome, number>>; eligible: ReturnOutcome[] } {
  // Step 1: Founding gates
  const gateResults = evaluateAllFoundingGates(meetingRecord, archetypeId);
  let eligible = ALL_RETURN_OUTCOMES.filter(o => gateResults[o]);

  // Step 2: Ordeal filtering
  const closed = ORDEAL_CLOSES[ordeal];
  eligible = eligible.filter(o => !closed.includes(o));

  // If nothing eligible, Vanishing is always gateless
  if (eligible.length === 0) {
    eligible = ['vanishing'];
  }

  // Step 3: Score
  const scores: Partial<Record<ReturnOutcome, number>> = {};
  for (const outcome of eligible) {
    let score = 0;
    score += ordealScore(ordeal, outcome);
    score += relationshipScore(relationship, outcome);
    score += archetypeDefaultScore(archetypeId, outcome);
    scores[outcome] = score;
  }

  // Step 4: Pick highest (ties: archetype default > alphabetical)
  eligible.sort((a, b) => {
    const scoreDiff = (scores[b] ?? 0) - (scores[a] ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    // Tie: prefer archetype default
    const aDefault = archetypeDefaultScore(archetypeId, a);
    const bDefault = archetypeDefaultScore(archetypeId, b);
    if (aDefault !== bDefault) return bDefault - aDefault;
    // Final tie: alphabetical
    return a.localeCompare(b);
  });

  return {
    outcome: eligible[0],
    scores,
    eligible,
  };
}

// ─── Ripple Consequences ───────────────────────────────────────────

/**
 * Gather ripple targets — the First's significant graph connections.
 */
export function gatherRippleTargets(graph: WorldGraph, agentId: string): RippleTarget[] {
  const targets: RippleTarget[] = [];

  // Artifacts: possesses edges to items with tier >= storied
  const possessesEdges = graph.getOutgoingEdges(agentId, 'possesses');
  for (const edge of possessesEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;
    const tier = (node.properties.tier as string) ?? 'common';
    const tierRanks: Record<string, number> = { common: 0, notable: 1, storied: 2, legendary: 3, mythic: 4 };
    if ((tierRanks[tier] ?? 0) >= 2) {
      targets.push({
        nodeId: edge.target,
        name: node.name,
        type: 'artifact',
        significance: tierRanks[tier] ?? 2,
      });
    }
  }

  // Bonds: relates_to edges with high trust or enmity
  const bonds = getAgentBonds(graph, agentId);
  for (const bond of bonds) {
    if (bond.sentiment > 0.5) {
      // Check for romantic basis
      const basis = (bond.edge.properties.basis as string) ?? '';
      const type: RippleTargetType = basis === 'romantic' ? 'spouse' : 'ally';
      targets.push({
        nodeId: bond.agent.id,
        name: bond.agent.name,
        type,
        significance: Math.abs(bond.sentiment) + (type === 'spouse' ? 1 : 0),
        context: { trust: bond.sentiment, basis },
      });
    } else if (bond.sentiment < -0.3) {
      targets.push({
        nodeId: bond.agent.id,
        name: bond.agent.name,
        type: 'enemy',
        significance: Math.abs(bond.sentiment),
        context: { trust: bond.sentiment },
      });
    }
  }

  // Factions: member_of edges where rank is high
  const memberships = getAgentMemberships(graph, agentId);
  for (const m of memberships) {
    const rank = (m.edge.properties.rank as number) ?? 0;
    const role = (m.edge.properties.role as string) ?? '';
    if (rank >= 2 || role === 'leader') {
      targets.push({
        nodeId: m.group.id,
        name: m.group.name,
        type: 'faction',
        significance: rank + (role === 'leader' ? 2 : 0),
        context: { rank, role },
      });
    }
  }

  // Locations: controls edges
  const controlEdges = graph.getOutgoingEdges(agentId, 'controls');
  for (const edge of controlEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;
    targets.push({
      nodeId: edge.target,
      name: node.name,
      type: 'location',
      significance: 2,
    });
  }

  // Sort by significance descending, cap at RIPPLE_MAX_TARGETS
  targets.sort((a, b) => b.significance - a.significance);
  return targets.slice(0, RIPPLE_MAX_TARGETS);
}

/**
 * Apply ripple consequences to gathered targets based on the Return outcome.
 */
export function applyRippleConsequences(
  graph: WorldGraph,
  agentId: string,
  agentName: string,
  outcome: ReturnOutcome,
  targets: RippleTarget[],
  tick: number,
  seed: number,
  doomIdentityMatrix?: DoomIdentityMatrix | null,
): RippleConsequenceResult[] {
  const results: RippleConsequenceResult[] = [];
  const rng = mulberry32(seed);

  for (const target of targets) {
    const proseKey = `${outcome}_${target.type}`;
    const prose = RIPPLE_CONSEQUENCE_PROSE[proseKey]
      ?? RIPPLE_CONSEQUENCE_PROSE[`${outcome}_default`]
      ?? `The return echoes through ${target.name}.`;

    let filledProse: string;
    try {
      const ctx = gatherNarrativeContext(graph, agentId, undefined, undefined, doomIdentityMatrix);
      filledProse = enrichProse(prose.replace(/{target}/g, target.name), ctx);
    } catch {
      // Fail-soft: simple replacement
      filledProse = prose.replace(/{name}/g, agentName).replace(/{target}/g, target.name);
    }

    const graphOps: RippleGraphOp[] = [];

    // Apply outcome-specific consequences
    switch (outcome) {
      case 'sacrifice': {
        if (target.type === 'artifact') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { sacredRelic: true, formerOwner: agentId } },
          });
        }
        if (target.type === 'location') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { sacredSite: true, sacrificeMemorial: agentName } },
          });
        }
        break;
      }
      case 'usurper': {
        if (target.type === 'faction') {
          // Faction split based on loyalty
          const roll = rng();
          if (roll < RIPPLE_FACTION_SPLIT_THRESHOLD) {
            graphOps.push({
              type: 'update_node',
              targetId: target.nodeId,
              data: { properties: { contested: true, splitCause: 'usurper_return' } },
            });
          }
        }
        if (target.type === 'artifact') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { corrupted: true, usurperClaimed: true } },
          });
        }
        break;
      }
      case 'monster': {
        if (target.type === 'location') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { placeOfDread: true, monsterOrigin: agentId } },
          });
        }
        if (target.type === 'artifact') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { cursed: true } },
          });
        }
        break;
      }
      case 'loyal_ascension': {
        if (target.type === 'faction') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { divineFavor: true } },
          });
        }
        break;
      }
      case 'transcendence': {
        if (target.type === 'location') {
          graphOps.push({
            type: 'update_node',
            targetId: target.nodeId,
            data: { properties: { geniusLoci: true, guardianId: agentId } },
          });
        }
        break;
      }
      // Vanishing: no graph ops — just the prose
    }

    // Apply graph ops
    for (const op of graphOps) {
      try {
        if (op.type === 'update_node') {
          const node = graph.getNode(op.targetId);
          if (node) {
            const newProps = { ...node.properties, ...(op.data.properties as Record<string, unknown>) };
            graph.updateNode(op.targetId, { properties: newProps });
          }
        }
      } catch {
        // Fail-soft: skip this op, log trace
      }
    }

    // Emit trace per ripple
    emitTrace({
      type: 'ripple_consequence',
      tick,
      sourceAgentId: agentId,
      returnOutcome: outcome,
      targetNodeId: target.nodeId,
      targetName: target.name,
      targetType: target.type,
      consequence: filledProse,
    });

    results.push({
      targetNodeId: target.nodeId,
      consequenceType: proseKey,
      prose: filledProse,
      graphOps,
    });
  }

  return results;
}

// ─── Return Outcome Application ────────────────────────────────────

/**
 * Apply the primary game state changes for a Return outcome.
 * Modifies the graph and returns events.
 */
export function applyReturnOutcome(
  graph: WorldGraph,
  agentId: string,
  agentName: string,
  ascendantId: string,
  outcome: ReturnOutcome,
  threadEdgeId: string,
  tick: number,
): { events: TickEvent[]; threadUpdate: Partial<ThreadEdgeProperties> } {
  const events: TickEvent[] = [];
  let nextEventSeq = 0;

  const threadUpdate: Partial<ThreadEdgeProperties> = {
    courtPosition: null, // Clear court slot for all outcomes
    storyPhase: 'return' as const,
  };

  switch (outcome) {
    case 'loyal_ascension': {
      // Agent becomes minor allied ascendant
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            actorType: 'ascendant',
            formerFirst: true,
            ascensionTick: tick,
            allied: true,
          },
        });
      }
      // Keep thread as retinue ("The Risen")
      threadUpdate.courtPosition = 'retinue' as CourtPosition;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} ascends — a new Ascendant rises, loyal to their divine patron.`,
        significance: 1.0,
        actorId: agentId,
      });
      break;
    }

    case 'usurper': {
      // Agent becomes rival ascendant
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            actorType: 'ascendant',
            formerFirst: true,
            ascensionTick: tick,
            allied: false,
            isRival: true,
          },
        });
      }
      // Sever thread
      threadUpdate.courtPosition = null;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} seizes divine power for themselves — a personal antagonist is born.`,
        significance: 1.0,
        actorId: agentId,
      });
      break;
    }

    case 'vanishing': {
      // Thread severed, agent walks away
      threadUpdate.courtPosition = null;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} walks away from the divine thread. Just absence.`,
        significance: 0.9,
        actorId: agentId,
      });
      break;
    }

    case 'sacrifice': {
      // Agent dies, sacred site/artifact at last location
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            alive: false,
            deathTick: tick,
            deathCause: 'sacrifice',
            sacredMemory: true,
          },
        });
      }
      // Thread severed (dead agent)
      threadUpdate.courtPosition = null;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} makes the ultimate sacrifice. A sacred site marks where they fell.`,
        significance: 1.0,
        actorId: agentId,
      });
      break;
    }

    case 'transcendence': {
      // Agent becomes genius loci / eternal guardian
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            actorType: 'spirit',
            transcended: true,
            transcendenceTick: tick,
            geniusLoci: true,
          },
        });
      }
      threadUpdate.courtPosition = null;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} transcends mortality, becoming an eternal guardian bound to the land.`,
        significance: 1.0,
        actorId: agentId,
      });
      break;
    }

    case 'monster': {
      // Agent becomes hostile empowered mortal
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            hostile: true,
            empowered: true,
            monsterTick: tick,
            formerFirst: true,
            threatLevel: 'major',
          },
        });
      }
      threadUpdate.courtPosition = null;
      events.push({
        id: `evt_return_${tick}_${nextEventSeq++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentName} becomes something terrible — a monster forged from divine ambition gone wrong.`,
        significance: 1.0,
        actorId: agentId,
      });
      break;
    }
  }

  return { events, threadUpdate };
}

// ─── Court Slot Lifecycle ──────────────────────────────────────────

/**
 * Clear the court slot and set the cooldown on the ascendant.
 */
export function applyCourtSlotCooldown(
  graph: WorldGraph,
  ascendantId: string,
  outcome: ReturnOutcome,
  tick: number,
): number {
  const cooldown = RETURN_COOLDOWN[outcome] ?? 5;
  const cooldownUntil = Math.min(tick + cooldown, tick + MAX_COOLDOWN_TICKS);

  const ascNode = graph.getNode(ascendantId);
  if (ascNode) {
    graph.updateNode(ascendantId, {
      properties: {
        ...ascNode.properties,
        firstSlotCooldownUntil: cooldownUntil,
      },
    });
  }

  return cooldown;
}

// ─── Full Return Orchestration ─────────────────────────────────────

/**
 * Execute the full Return sequence for a First agent.
 *
 * Called when the journey beat system fires a 'return' phase beat.
 * This replaces the normal vignette flow — instead of choices,
 * the Return resolves algorithmically.
 */
export function executeReturn(
  state: GameState,
  agentId: string,
  threadEdgeId: string,
  threadProps: ThreadEdgeProperties,
): {
  result: ReturnResolutionResult;
  events: TickEvent[];
  threadUpdate: Partial<ThreadEdgeProperties>;
} {
  const { graph, ascendantId, tick, seed } = state;

  const agentNode = graph.getNode(agentId);
  const agentName = agentNode?.name ?? 'The First';
  const meetingRecord = threadProps.meetingChoiceRecord;
  const archetypeId = meetingRecord?.archetypeId ?? '';
  const ordealOutcome: OrdealOutcome = threadProps.ordealOutcome ?? 'scraped_through';
  const beatHistory = threadProps.beatHistory ?? [];

  // Build relationship state
  const relationship = buildRelationshipState(threadProps);

  // Evaluate founding gates
  const foundingGateResults = evaluateAllFoundingGates(meetingRecord, archetypeId);

  // Resolve convergence
  const { outcome, scores, eligible } = resolveReturn(
    meetingRecord, ordealOutcome, relationship, archetypeId, beatHistory,
  );

  // Generate return prose (enriched with full narrative context including doom vocabulary)
  const returnProse = getReturnProse(
    outcome, agentName, archetypeId, graph, agentId, meetingRecord, beatHistory, state.doomIdentityMatrix,
  );

  // Apply primary outcome
  const { events: outcomeEvents, threadUpdate } = applyReturnOutcome(
    graph, agentId, agentName, ascendantId, outcome, threadEdgeId, tick,
  );

  // Gather and apply ripple consequences
  const rippleTargets = gatherRippleTargets(graph, agentId);
  const rippleSeed = hashSeed(seed, agentId, 'ripple');
  const rippleResults = applyRippleConsequences(
    graph, agentId, agentName, outcome, rippleTargets, tick, rippleSeed, state.doomIdentityMatrix,
  );

  // Apply court slot cooldown
  const cooldownTicks = applyCourtSlotCooldown(graph, ascendantId, outcome, tick);

  // Emit resolution trace
  emitTrace({
    type: 'return_resolution',
    tick,
    agentId,
    outcome,
    foundingGateResults,
    ordealOutcome,
    relationshipState: relationship,
    scores,
    eligibleOutcomes: eligible,
    beatHistory,
  });

  const result: ReturnResolutionResult = {
    outcome,
    scores,
    foundingGateResults,
    eligibleOutcomes: eligible,
    ordealOutcome,
    relationshipState: relationship,
    returnProse,
    rippleResults,
    cooldownTicks,
  };

  return { result, events: outcomeEvents, threadUpdate };
}

// ─── Helpers ───────────────────────────────────────────────────────

function getReturnProse(
  outcome: ReturnOutcome,
  agentName: string,
  archetypeId: string,
  graph: WorldGraph,
  agentId: string,
  meetingRecord?: MeetingChoiceRecord,
  beatHistory?: BeatOutcome[],
  doomIdentityMatrix?: DoomIdentityMatrix | null,
): string {
  const prose = RETURN_OUTCOME_PROSE[outcome] ?? 'The journey reaches its conclusion.';
  try {
    const ctx = gatherNarrativeContext(graph, agentId, meetingRecord, beatHistory, doomIdentityMatrix);
    return enrichProse(prose, ctx);
  } catch {
    // Fail-soft: fall back to simple name replacement
    return prose.replace(/{name}/g, agentName);
  }
}

function hashSeed(gameSeed: number, agentId: string, salt: string): number {
  let hash = gameSeed;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash + agentId.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < salt.length; i++) {
    hash = ((hash << 5) - hash + salt.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
