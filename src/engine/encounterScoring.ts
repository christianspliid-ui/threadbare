/**
 * Encounter Scoring — value-per-tick scoring with desire multiplier.
 *
 * Deterministic selection of the highest-scoring candidate from a set
 * of EncounterCacheEntry objects. Each candidate is scored by:
 *   finalScore = valuePerTick * desireMultiplier
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                  | Default | Purpose                                    |
 * |-----------------------|---------|--------------------------------------------|
 * | MINIMUM_DESIRE        | 0.1     | Floor for desire multiplier (prevents zero) |
 * | GROWTH_REWARD_WEIGHT  | 0.4     | Weight for tier growth value (stub = 0)    |
 * | IDLE_SCORE_THRESHOLD  | 0.05    | Below this, agent idles instead of acting  |
 * | AMBITION_REACH_BOOST  | 0.2     | Flat boost when ambition reach matches     |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Emits ScoringTrace (category: 'encounter_scoring') with top 5
 * candidates and selected action.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                           |
 * |---------------------------------|------------------------------------|
 * | Missing agent node              | Return null selected, empty trace  |
 * | Missing axiological profile     | Use all-zeros profile              |
 * | computeCapability throws        | Use 0.5 (uncertain)               |
 * | Distance lookup fails           | Infinity travel cost → low score   |
 * | Empty candidates array          | Return null selected immediately   |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — scoring is fully deterministic. Same inputs → same output.
 */

import type { EncounterCacheEntry } from './encounterCache';
import type { WorldGraph } from './graph';
import type { DistanceMatrix } from './distanceMatrix';
import type { ScoringTrace } from '../types/trace';
import type { ValuePair, AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import { computeCapability, computeTier } from './domainCapability';
import { getDistance } from './distanceMatrix';
import { getDivineInfluences, buildValueOverlay } from './interventionEffects';
import { BASE_ENCOUNTER_GROWTH, difficultyScaling, PROMOTION_ELIGIBLE_MULTIPLIER } from './capabilityGrowth';
import { computeBondModifier } from './socialEncounterGeneration';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  MINIMUM_DESIRE,
  GROWTH_REWARD_WEIGHT,
  IDLE_SCORE_THRESHOLD,
  AMBITION_REACH_BOOST,
  STEP_PROBABILITY_OFFSET,
} from '../data/agent-behavior-constants';

import {
  MINIMUM_DESIRE,
  GROWTH_REWARD_WEIGHT,
  IDLE_SCORE_THRESHOLD,
  AMBITION_REACH_BOOST,
  STEP_PROBABILITY_OFFSET,
} from '../data/agent-behavior-constants';

// ─── Result Types ───────────────────────────────────────────────

export interface ScoredCandidate {
  entry: EncounterCacheEntry;
  completionProb: number;
  expectedReward: number;
  travelCost: number;
  totalCost: number;
  valuePerTick: number;
  axiologicalScore: number;
  ambitionBoost: number;
  desireMultiplier: number;
  finalScore: number;
  action: 'start_local' | 'queue_movement' | 'attempt_remote';
}

export interface DecisionResult {
  selected: ScoredCandidate | null;
  topCandidates: ScoredCandidate[];
  trace: ScoringTrace;
}

// ─── Step Probability ───────────────────────────────────────────

/**
 * Sigmoid-like estimate of a single step's success probability.
 *
 * P = clamp(capability - difficulty/100 + 0.5, 0.05, 0.95)
 *
 * - capability is 0–1 (from computeCapability)
 * - difficulty is 0–100 (from step)
 * - The +0.5 offset means a 50% match gives ~50% probability
 * - Clamped to [0.05, 0.95] — never guaranteed success or failure
 */
export function estimateStepProbability(
  capability: number,
  difficulty: number,
  modifierTotal?: number,
): number {
  // Offset ensures agents with moderate capability (~0.2) have ~45% per step,
  // making 3-step encounters viable (~0.09 chain). The old +0.5 made chain probabilities
  // too low for agents to ever score above IDLE_SCORE_THRESHOLD.
  const raw = capability + (modifierTotal ?? 0) - difficulty / 100 + STEP_PROBABILITY_OFFSET;
  return Math.max(0.05, Math.min(0.95, raw));
}

// ─── Completion Probability ─────────────────────────────────────

/**
 * Product of per-step probabilities for the full encounter.
 * Fail-soft: if computeCapability throws, uses 0.5 (uncertain).
 */
export function estimateCompletionProb(
  entry: EncounterCacheEntry,
  agentId: string,
  graph: WorldGraph,
): number {
  let prob = 1.0;
  for (let i = 0; i < entry.stepCount; i++) {
    let cap: number;
    try {
      cap = computeCapability(graph, agentId, entry.stepReaches[i]);
    } catch {
      cap = 0.5; // Fail-soft: uncertain capability
    }
    prob *= estimateStepProbability(cap, entry.stepDifficulties[i]);
  }
  return prob;
}

// ─── Desire Score ───────────────────────────────────────────────

/**
 * Sum the agent's axiological profile values for each motivation pair.
 * Uses absolute values so both poles contribute positively to desire.
 */
export function computeDesireScore(
  motivations: ValuePair[],
  profile: AxiologicalProfile,
): number {
  let score = 0;
  for (const motivation of motivations) {
    score += profile[motivation] ?? 0;
  }
  return score;
}

// ─── Ambition Boost ─────────────────────────────────────────────

/**
 * Simple ambition boost: walk `pursues` edges from agent, check if any
 * ambition's reachAffinity has a non-zero value for the entry's primary reach.
 * Returns AMBITION_REACH_BOOST if any match, else 0.
 */
function getAmbitionBoostForEntry(
  graph: WorldGraph,
  agentId: string,
  reachPrimary: ReachDomain,
): number {
  const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
  for (const edge of pursuesEdges) {
    const ambitionNode = graph.getNode(edge.target);
    if (!ambitionNode) continue;
    const reachAffinity = ambitionNode.properties?.reachAffinity as
      | Partial<Record<ReachDomain, number>>
      | undefined;
    if (reachAffinity && (reachAffinity[reachPrimary] ?? 0) > 0) {
      return AMBITION_REACH_BOOST;
    }
  }
  return 0;
}

// ─── Axiological Profile Resolver ───────────────────────────────

/**
 * Build the effective axiological profile for an agent, applying
 * divine influence overlays if present.
 * Fail-soft: returns all-zeros profile if agent/profile missing.
 */
function resolveProfile(
  graph: WorldGraph,
  agentId: string,
  tick: number,
): AxiologicalProfile {
  const zeroProfile = Object.fromEntries(
    VALUE_PAIRS.map((p) => [p, 0]),
  ) as AxiologicalProfile;

  const node = graph.getNode(agentId);
  if (!node) return zeroProfile;

  const baseProfile =
    (node.properties?.axiologicalProfile as AxiologicalProfile | undefined) ??
    zeroProfile;

  // Apply divine influence overlay if present
  const influences = getDivineInfluences(graph, agentId);
  if (influences.length > 0) {
    return buildValueOverlay(baseProfile, influences, tick);
  }

  return baseProfile;
}

// ─── Main: Score and Select ─────────────────────────────────────

/**
 * Score all candidate encounter cache entries for an agent and select
 * the highest-scoring one. Deterministic: same inputs → same output.
 */
export function scoreAndSelect(
  candidates: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  distanceMatrix: DistanceMatrix,
  tick: number,
): DecisionResult {
  // Fail-soft: missing agent → null result
  const agentNode = graph.getNode(agentId);
  if (!agentNode) {
    return {
      selected: null,
      topCandidates: [],
      trace: buildTrace(agentId, tick, null, []),
    };
  }

  // Fail-soft: empty candidates → null result
  if (candidates.length === 0) {
    return {
      selected: null,
      topCandidates: [],
      trace: buildTrace(agentId, tick, null, []),
    };
  }

  const profile = resolveProfile(graph, agentId, tick);

  const scored: ScoredCandidate[] = [];

  for (const entry of candidates) {
    // 1. Completion probability
    let completionProb = estimateCompletionProb(entry, agentId, graph);
    if (!entry.requiresPresence && entry.remotePenalty > 0) {
      completionProb *= 1 - entry.remotePenalty;
    }

    // 2. Growth value — estimate how much tier progress this encounter offers
    const avgDifficulty = entry.stepDifficulties.reduce((s, d) => s + d, 0) / Math.max(entry.stepCount, 1);
    const hasPromotionStep = false; // Encounter cache doesn't track per-step promotion eligibility
    const estimatedGrowth = BASE_ENCOUNTER_GROWTH * difficultyScaling(avgDifficulty) *
      (hasPromotionStep ? PROMOTION_ELIGIBLE_MULTIPLIER : 1.0);
    let currentCap: number;
    try {
      currentCap = computeCapability(graph, agentId, entry.reachPrimary);
    } catch {
      currentCap = 0.5;
    }
    const currentTier = computeTier(currentCap);
    const nextTierBoundary = currentTier / 10;
    const distanceToNext = nextTierBoundary - currentCap;
    const tierWidth = 0.1;
    const proximityToNextTier = Math.max(0, 1.0 - (distanceToNext / tierWidth));
    const growthValue = estimatedGrowth * proximityToNextTier * GROWTH_REWARD_WEIGHT;

    // 3. Expected reward
    const expectedReward =
      completionProb * (entry.successRewardEstimate + growthValue);

    // 4. Travel cost
    const distance = getDistance(distanceMatrix, agentLocationId, entry.locationId);
    let travelCost: number;
    if (distance === 0) {
      travelCost = 0;
    } else if (!entry.requiresPresence) {
      travelCost = 0;
    } else if (!isFinite(distance)) {
      travelCost = 9999; // Unreachable — effectively eliminates candidate
    } else {
      travelCost = distance;
    }

    // 5. Total cost (floor at 1)
    const totalCost = Math.max(travelCost + entry.totalTickCost, 1);

    // 6. Value per tick
    const valuePerTick = expectedReward / totalCost;

    // 7. Axiological score
    const axiologicalScore = computeDesireScore(entry.motivations, profile);

    // 8. Ambition boost
    const ambitionBoost = getAmbitionBoostForEntry(
      graph,
      agentId,
      entry.reachPrimary,
    );

    // 9. Desire multiplier (with social bond modifier for agent-targeting encounters)
    let desireMultiplier = Math.max(
      axiologicalScore + ambitionBoost,
      MINIMUM_DESIRE,
    );

    if (entry.targetAgentId) {
      const bondMod = computeBondModifier(graph, agentId, entry.targetAgentId);
      desireMultiplier *= (1.0 + bondMod);
    }

    // 10. Final score
    const finalScore = valuePerTick * desireMultiplier;

    // 11. Action classification
    let action: ScoredCandidate['action'];
    if (distance === 0) {
      action = 'start_local';
    } else if (!entry.requiresPresence) {
      action = 'attempt_remote';
    } else {
      action = 'queue_movement';
    }

    scored.push({
      entry,
      completionProb,
      expectedReward,
      travelCost,
      totalCost,
      valuePerTick,
      axiologicalScore,
      ambitionBoost,
      desireMultiplier,
      finalScore,
      action,
    });
  }

  // Sort descending by finalScore
  scored.sort((a, b) => b.finalScore - a.finalScore);

  const top5 = scored.slice(0, 5);
  const best = scored[0];

  const selected = best.finalScore >= IDLE_SCORE_THRESHOLD ? best : null;

  return {
    selected,
    topCandidates: top5,
    trace: buildTrace(agentId, tick, selected, top5),
  };
}

// ─── Trace Builder ──────────────────────────────────────────────

function buildTrace(
  agentId: string,
  tick: number,
  selected: ScoredCandidate | null,
  top5: ScoredCandidate[],
): ScoringTrace {
  return {
    id: 0,
    tick,
    timestamp: Date.now(),
    category: 'encounter_scoring',
    agentId,
    topCandidates: top5.map((c) => ({
      templateId: c.entry.templateId,
      locationId: c.entry.locationId,
      isLocal: c.action === 'start_local',
      valuePerTick: c.valuePerTick,
      desireMultiplier: c.desireMultiplier,
      finalScore: c.finalScore,
      travelCost: c.travelCost,
      completionProb: c.completionProb,
    })),
    selectedTemplateId: selected?.entry.templateId ?? null,
    selectedLocationId: selected?.entry.locationId ?? null,
    action: selected ? selected.action : 'idle',
    summary: selected
      ? `Agent ${agentId} chose ${selected.entry.templateId} (score=${selected.finalScore.toFixed(3)})`
      : `Agent ${agentId} idles (no candidates above threshold)`,
  };
}
