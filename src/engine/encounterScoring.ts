/**
 * Encounter Scoring — value-per-tick scoring with desire multiplier.
 *
 * Deterministic selection of the highest-scoring candidate from a set
 * of EncounterCacheEntry objects. Each candidate is scored by:
 *   finalScore = valuePerTick * desireMultiplier + resonance
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                        | Default | Purpose                                    |
 * |-----------------------------|---------|--------------------------------------------|
 * | MINIMUM_DESIRE              | 0.1     | Floor for desire multiplier (prevents zero) |
 * | GROWTH_REWARD_WEIGHT        | 0.4     | Weight for tier growth value (stub = 0)    |
 * | IDLE_SCORE_THRESHOLD        | 0.05    | Below this, agent idles instead of acting  |
 * | AMBITION_REACH_BOOST        | 0.2     | Flat boost when ambition reach matches     |
 * | ENCOUNTER_RESONANCE_MULTIPLIER | 0.1  | Per net-sphere score resonance bonus       |
 * | ENCOUNTER_RESONANCE_CAP     | 0.5     | Maximum resonance modifier per encounter   |
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
 * | Missing hex sphere affinity     | resonance = 0 (fail-soft)          |
 * | No encounter sphereAffinity     | resonance = 0 (fail-soft)          |
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
import type { SphereName } from '../types/index';
import type { SphereAffinity } from '../types/sphereAffinity';
import type { FundamentState } from '../types/worldSoul';
import { computeCapability, computeTier } from './domainCapability';
import { getDistance } from './distanceMatrix';
import { getDivineInfluences, buildValueOverlay } from './interventionEffects';
import { BASE_ENCOUNTER_GROWTH, difficultyScaling, PROMOTION_ELIGIBLE_MULTIPLIER } from './capabilityGrowth';
import { computeBondModifier } from './socialEncounterGeneration';
import { getScoringBoost } from './factionRankBonus';
import { getNodeSphereAffinity, getDominantSphere, SPHERE_AXIOLOGICAL_MAP, applyAxiologicalShift } from './sphereAffinity';
import { SPHERE_OPPOSITES } from './cosmology';
import { SPHERE_NAMES } from '../types/index';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  MINIMUM_DESIRE,
  GROWTH_REWARD_WEIGHT,
  IDLE_SCORE_THRESHOLD,
  AMBITION_REACH_BOOST,
  STEP_PROBABILITY_OFFSET,
  FAMILIARITY_DECAY_PER_ATTEMPT,
  FAMILIARITY_MAX_PENALTY,
  EXPLORATION_NOVELTY_BONUS,
  EXPLORATION_BONUS_DECAY_TICKS,
  TRAVEL_COST_WEIGHT,
  PERSONALITY_SCORE_EXPONENT,
} from '../data/agent-behavior-constants';

import {
  MINIMUM_DESIRE,
  GROWTH_REWARD_WEIGHT,
  IDLE_SCORE_THRESHOLD,
  AMBITION_REACH_BOOST,
  STEP_PROBABILITY_OFFSET,
  FAMILIARITY_DECAY_PER_ATTEMPT,
  FAMILIARITY_MAX_PENALTY,
  EXPLORATION_NOVELTY_BONUS,
  EXPLORATION_BONUS_DECAY_TICKS,
  TRAVEL_COST_WEIGHT,
  PERSONALITY_SCORE_EXPONENT,
} from '../data/agent-behavior-constants';

// ─── Sphere Resonance Constants ─────────────────────────────────

/** Score bonus per net sphere alignment point (aligned minus opposed) */
export const ENCOUNTER_RESONANCE_MULTIPLIER = 0.1;

/** Maximum (and minimum negative) resonance modifier per encounter candidate */
export const ENCOUNTER_RESONANCE_CAP = 0.5;

// ─── Global Sphere Resonance Constants (World-Soul) ─────────────

/** Converts sphere weight deviation into encounter score bonus from global World-Soul state */
export const ENCOUNTER_RESONANCE_SCALE = 2.0;

/** Minimum global resonance score (prevents sphere recession from completely blocking encounters) */
export const ENCOUNTER_RESONANCE_FLOOR = -0.15;

// ─── Axiological Drift Constants (World-Soul) ─────────────────

/** Converts sphere weight deviation into axiological value shift */
export const AXIOLOGICAL_DRIFT_SCALE = 1.5;

/** Maximum drift per axiological pair from World-Soul */
export const AXIOLOGICAL_DRIFT_MAX = 0.15;

/** Minimum sphere weight deviation before drift activates (prevents noise from balanced states) */
export const DRIFT_ACTIVATION_THRESHOLD = 0.03;

/**
 * Sphere → Axiological pair drift mapping.
 * Maps each sphere to its affected axiological pair and direction.
 */
export const SPHERE_DRIFT_MAP: Record<SphereName, { pair: keyof AxiologicalProfile; direction: number }> = {
  // Foundation Spheres
  chaos: { pair: 'mercy_ambition', direction: 0.5 }, // +ambition (disruption)
  order: { pair: 'loyalty_ambition', direction: -0.5 }, // +loyalty (stability)
  light: { pair: 'tradition_progress', direction: 0.5 }, // +progress (revelation)
  darkness: { pair: 'tradition_progress', direction: -0.5 }, // +tradition (mystery)
  // Creation Spheres
  force: { pair: 'mercy_ambition', direction: 1 }, // +ambition
  matter: { pair: 'loyalty_ambition', direction: -1 }, // +loyalty
  energy: { pair: 'mercy_ambition', direction: 0.5 }, // +ambition (weaker)
  life: { pair: 'mercy_ambition', direction: -1 }, // +mercy
  mind: { pair: 'tradition_progress', direction: 1 }, // +progress
  spirit: { pair: 'tradition_progress', direction: -1 }, // +tradition
  time: { pair: 'loyalty_ambition', direction: -0.5 }, // +loyalty (weaker)
  entropy: { pair: 'mercy_ambition', direction: 1 }, // +ambition (ruthlessness)
};

/**
 * Compute the resonance bonus for an encounter at a given hex location.
 * Compares the encounter's sphere with its opposition sphere at the location.
 * Positive = aligned location, Negative = opposing location.
 * Fail-soft: undefined hexAffinity or encounterSphere → 0.
 */
export function computeResonance(
  hexAffinity: SphereAffinity | undefined,
  encounterSphere: SphereName | undefined,
): number {
  if (!hexAffinity || !encounterSphere) return 0;
  const locationScore = hexAffinity.scores[encounterSphere] ?? 0;
  const oppositionSphere = SPHERE_OPPOSITES[encounterSphere];
  const oppositionScore = oppositionSphere ? (hexAffinity.scores[oppositionSphere] ?? 0) : 0;
  const raw = (locationScore - oppositionScore) * ENCOUNTER_RESONANCE_MULTIPLIER;
  return Math.min(ENCOUNTER_RESONANCE_CAP, Math.max(-ENCOUNTER_RESONANCE_CAP, raw));
}

/**
 * Compute global encounter scoring bonus from World-Soul sphere balance.
 * Encounters whose sphere matches the world's dominant spheres score higher.
 * Fail-soft: undefined fundament or encounterSphere → 0.
 */
export function computeEncounterResonance(
  encounterSphere: SphereName | undefined,
  fundament: FundamentState | undefined,
): number {
  if (!fundament || !encounterSphere) return 0;

  const weight = fundament.sphereWeights[encounterSphere];
  if (weight === undefined) return 0;

  const balanced = 1 / SPHERE_NAMES.length;
  const deviation = weight - balanced;

  // Positive deviation → sphere is dominant → encounters score higher
  // Negative deviation → sphere is recessive → encounters score lower
  const raw = deviation * ENCOUNTER_RESONANCE_SCALE;

  // Apply floor but no cap (deviation can be large)
  return Math.max(ENCOUNTER_RESONANCE_FLOOR, raw);
}

/**
 * Compute axiological drift from World-Soul state.
 * Returns partial axiological profile with drift deltas applied to affected pairs.
 * Fail-soft: undefined fundament → empty drift object.
 */
export function computeWorldSoulValueDrift(
  fundament: FundamentState | undefined,
): Partial<AxiologicalProfile> {
  if (!fundament) return {};

  const drift: Partial<AxiologicalProfile> = {};

  // Clamp helper
  const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

  for (const sphere of SPHERE_NAMES) {
    const weight = fundament.sphereWeights[sphere];
    if (weight === undefined) continue;

    const balanced = 1 / SPHERE_NAMES.length;
    const deviation = weight - balanced;

    // Skip if below activation threshold
    if (Math.abs(deviation) < DRIFT_ACTIVATION_THRESHOLD) continue;

    const mapping = SPHERE_DRIFT_MAP[sphere];
    if (!mapping) continue;

    // Accumulate drift for this pair
    const currentDrift = drift[mapping.pair] ?? 0;
    const newDrift = currentDrift + deviation * mapping.direction * AXIOLOGICAL_DRIFT_SCALE;
    drift[mapping.pair] = clamp(newDrift, -AXIOLOGICAL_DRIFT_MAX, AXIOLOGICAL_DRIFT_MAX);
  }

  return drift;
}

// ─── Familiarity Discount (B.1) ─────────────────────────────────

/** Tracks how many times an agent has attempted each encounter template. */
export interface FamiliarityRecord {
  attemptCount: Record<string, number>;
}

/**
 * Compute familiarity penalty for a repeated encounter.
 * Returns 0..FAMILIARITY_MAX_PENALTY — multiply final score by (1 - penalty).
 * Fail-soft: missing record → 0 penalty.
 */
export function computeFamiliarityPenalty(
  record: FamiliarityRecord | undefined,
  templateId: string,
): number {
  if (!record) return 0;
  const count = record.attemptCount[templateId] ?? 0;
  if (count === 0) return 0;
  return Math.min(count * FAMILIARITY_DECAY_PER_ATTEMPT, FAMILIARITY_MAX_PENALTY);
}

// ─── Exploration Bonus (B.2) ────────────────────────────────────

/** Tracks which locations an agent has visited and when. */
export interface ExplorationRecord {
  visitedLocations: Record<string, number>;
}

/**
 * Compute exploration bonus for an encounter at a given location.
 * Unvisited = full bonus, recently visited = decaying bonus, long-ago visited = 0.
 * Fail-soft: missing record → full bonus everywhere (pushes activity).
 */
export function computeExplorationBonus(
  record: ExplorationRecord | undefined,
  locationId: string,
  currentTick: number,
): number {
  if (!record) return EXPLORATION_NOVELTY_BONUS;
  const visitTick = record.visitedLocations[locationId];
  if (visitTick === undefined) return EXPLORATION_NOVELTY_BONUS;
  const ticksSinceVisit = currentTick - visitTick;
  if (ticksSinceVisit >= EXPLORATION_BONUS_DECAY_TICKS) return 0;
  // Linear decay from full bonus to 0
  const remaining = 1 - ticksSinceVisit / EXPLORATION_BONUS_DECAY_TICKS;
  return EXPLORATION_NOVELTY_BONUS * remaining;
}

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
  familiarityPenalty: number;
  explorationBonus: number;
  resonance: number;
  globalResonance: number;
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
 * divine influence overlays, sphere-derived axiological shift, and World-Soul drift.
 * Fail-soft: returns all-zeros profile if agent/profile missing.
 */
function resolveProfile(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  fundament?: FundamentState,
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
  let profile = influences.length > 0
    ? buildValueOverlay(baseProfile, influences, tick)
    : baseProfile;

  // Apply sphere-derived axiological shift from agent's dominant sphere
  const agentAffinity = getNodeSphereAffinity(node);
  if (agentAffinity) {
    const dominant = getDominantSphere(agentAffinity);
    if (dominant) {
      profile = applyAxiologicalShift(profile, SPHERE_AXIOLOGICAL_MAP[dominant]);
    }
  }

  // Apply World-Soul axiological drift
  const worldSoulDrift = computeWorldSoulValueDrift(fundament);
  for (const [pair, drift] of Object.entries(worldSoulDrift)) {
    if (drift !== 0) {
      profile = {
        ...profile,
        [pair]: (profile[pair as keyof AxiologicalProfile] ?? 0) + drift,
      };
    }
  }

  return profile;
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
  fundament?: FundamentState,
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

  const profile = resolveProfile(graph, agentId, tick, fundament);

  // Read agent tracking records (fail-soft: treat missing as empty)
  const familiarityRecord = agentNode.properties?.familiarityRecord as FamiliarityRecord | undefined;
  const explorationRecord = agentNode.properties?.explorationRecord as ExplorationRecord | undefined;

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

    // 4. Travel cost (B.3: dampened by TRAVEL_COST_WEIGHT)
    const distance = getDistance(distanceMatrix, agentLocationId, entry.locationId);
    let travelCost: number;
    if (distance === 0) {
      travelCost = 0;
    } else if (!entry.requiresPresence) {
      travelCost = 0;
    } else if (!isFinite(distance)) {
      travelCost = 9999; // Unreachable — effectively eliminates candidate
    } else {
      travelCost = distance * TRAVEL_COST_WEIGHT;
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

    // 9. Desire multiplier (D.1: personality exponent + social bond)
    let desireMultiplier = Math.max(
      axiologicalScore + ambitionBoost,
      MINIMUM_DESIRE,
    );

    // D.1: Amplify personality signal — clamp to ≥0.01 before exponentiation to prevent NaN
    desireMultiplier = Math.pow(Math.max(desireMultiplier, 0.01), PERSONALITY_SCORE_EXPONENT);

    if (entry.targetAgentId) {
      const bondMod = computeBondModifier(graph, agentId, entry.targetAgentId);
      desireMultiplier *= (1.0 + bondMod);
    }

    // 10. Faction scoring boost (TB-062) — additive for faction encounters
    const factionScoringBoost = getScoringBoost(graph, agentId, entry.templateId);

    // 11. Sphere resonance bonus — hex sphere alignment with encounter sphere (local)
    const hexNode = graph.getNode(entry.locationId);
    const hexAffinity = hexNode ? getNodeSphereAffinity(hexNode) : undefined;
    const resonance = computeResonance(hexAffinity, entry.sphereAffinity);

    // 12. Global sphere resonance — World-Soul fundament alignment (M1.2)
    const globalResonance = computeEncounterResonance(entry.sphereAffinity, fundament);

    // 13. B.1: Familiarity penalty — repeated encounters score lower
    const familiarityPenalty = computeFamiliarityPenalty(familiarityRecord, entry.templateId);

    // 14. B.2: Exploration bonus — unvisited locations score higher
    const explorationBonus = computeExplorationBonus(explorationRecord, entry.locationId, tick);

    // 15. Final score (B.1: multiply by familiarity factor, B.2: add exploration bonus)
    const baseScore = valuePerTick * desireMultiplier + factionScoringBoost + resonance + globalResonance;
    const finalScore = baseScore * (1 - familiarityPenalty) + explorationBonus;

    // 16. Action classification
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
      familiarityPenalty,
      explorationBonus,
      resonance,
      globalResonance,
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
      familiarityPenalty: c.familiarityPenalty,
      explorationBonus: c.explorationBonus,
      finalScore: c.finalScore,
      travelCost: c.travelCost,
      completionProb: c.completionProb,
      resonance: c.resonance,
      globalResonance: c.globalResonance,
    })),
    selectedTemplateId: selected?.entry.templateId ?? null,
    selectedLocationId: selected?.entry.locationId ?? null,
    action: selected ? selected.action : 'idle',
    summary: selected
      ? `Agent ${agentId} chose ${selected.entry.templateId} (score=${selected.finalScore.toFixed(3)})`
      : `Agent ${agentId} idles (no candidates above threshold)`,
  };
}
