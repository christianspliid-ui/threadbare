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
 * | RARITY_ENCOUNTER_SCORE_MULTIPLIER | {1:1.0,2:1.3,3:1.7,4:2.5} | Rarity boost on encounter base score |
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
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import type { ScoringTrace } from '../types/trace';
import type { ValuePair, AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { SphereAffinity } from '../types/sphereAffinity';
import type { FundamentState } from '../types/worldSoul';
import { computeCapability, computeTier } from './domainCapability';
import { computeResolutionThreshold } from './resolutionService';
// Distance matrix removed — hex distance used for travel cost estimation
import { getDivineInfluences, buildValueOverlay } from './interventionEffects';
import { BASE_ENCOUNTER_GROWTH, difficultyScaling, PROMOTION_ELIGIBLE_MULTIPLIER } from './capabilityGrowth';
import { computeBondModifier } from './socialEncounterGeneration';
import { getScoringBoost } from './factionRankBonus';
import { getTraitsForNode } from './traits';
import type { TraitDefinitionProperties, ReputationEffects } from '../types/traits';
import { REPUTATION_SCORING_WEIGHT, MARK_REVEAL_SCORING_BONUS, MARK_REVEAL_SCORING_CAP, INTEL_SCORING_BONUS } from '../data/agent-behavior-constants';
import type { HiddenMark, IntelligenceRecord } from '../types/unifiedAction';
import { evaluateMarkReveals } from './hiddenMarks';
import { findActionableIntelligence, emitIntelligenceReferenced } from './intelligence';
import { getChainProgress, computeChainBonus } from './encounterChains';
import { getNodeSphereAffinity, getDominantSphere, SPHERE_AXIOLOGICAL_MAP, applyAxiologicalShift } from './sphereAffinity';
import { SPHERE_OPPOSITES } from './cosmology';
import { SPHERE_NAMES } from '../types/index';
import type { EffectRuntimeState } from '../types/effects';
import { getBehaviorWeights, computeBehaviorWeightMultiplier } from './effects/effectQueries';
import type { EligibilityFunnelCounters } from './kpi/gameplayKpi';
import type { TraceBuffer } from './traceBuffer';
import { computeBranchingCuratorMultiplier } from './encounter/branchingCurator';

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
  WANDERLUST_MAX_DISCOUNT,
  WANDERLUST_PAIR,
  ROLE_PRIMARY_AFFINITY_BONUS,
  ROLE_SECONDARY_AFFINITY_BONUS,
  NOVELTY_GLOBAL_HALF_LIFE,
  NOVELTY_GLOBAL_MAX_PENALTY,
  NOVELTY_AGENT_HALF_LIFE,
  NOVELTY_AGENT_MAX_PENALTY,
  NOVELTY_CATEGORY_WINDOW_TICKS,
  NOVELTY_CATEGORY_QUOTA_SOFT,
  NOVELTY_CATEGORY_QUOTA_MAX_PENALTY,
  NOVELTY_COMBINED_CAP,
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
  WANDERLUST_MAX_DISCOUNT,
  WANDERLUST_PAIR,
  RUIN_LOCATION_SUBTYPES,
  RUINS_SEEKER_TRAIT_TAG,
  RUINS_TRAIT_BONUS,
  RUINS_TRAIT_BONUS_PER_LEVEL,
  EXPLORATION_ATTRACTION_WEIGHT,
  DIVINE_HUNCH_FIND_BONUS,
  ANOMALY_DISCOVERY_BASE_BONUS,
  ANOMALY_EYE_SCALING,
  ANOMALY_VEIL_SCALING,
  ANOMALY_EYE_THRESHOLD,
  ROLE_PRIMARY_AFFINITY_BONUS,
  ROLE_SECONDARY_AFFINITY_BONUS,
  NOVELTY_GLOBAL_HALF_LIFE,
  NOVELTY_GLOBAL_MAX_PENALTY,
  NOVELTY_AGENT_HALF_LIFE,
  NOVELTY_AGENT_MAX_PENALTY,
  NOVELTY_CATEGORY_WINDOW_TICKS,
  NOVELTY_CATEGORY_QUOTA_SOFT,
  NOVELTY_CATEGORY_QUOTA_MAX_PENALTY,
  NOVELTY_COMBINED_CAP,
  NOVELTY_TEMPLATE_SHARE_CEILING,
  NOVELTY_EMA_DECAY,
  NOVELTY_EMA_CEILING_THRESHOLD,
  NOVELTY_GLOBAL_SHARE_TARGET,
  NOVELTY_GLOBAL_SHARE_MIN_SAMPLES,
  NOVELTY_GLOBAL_SHARE_EXPONENT,
} from '../data/agent-behavior-constants';
import { ANOMALY_RESOURCE_MAP } from '../data/resource-content';
import { NPC_ROLE_REACH_MAP } from '../types/npc';
import type { NpcRole } from '../types/npc';
import type { HexTile } from '../types/index';
import { getRarityTier } from './rarity';
import { RARITY_ENCOUNTER_SCORE_MULTIPLIER } from '../data/rarity-constants';
import { forecastEncounterExpectedUtility, type EncounterForecast } from './plannerForecast';

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

// ─── Ruins Exploration Scoring ──────────────────────────────────

/** Adventurers Guild rank → effective ruin_seeker level */
const GUILD_RANK_RUIN_LEVEL: Record<string, number> = {
  journeyman: 1,
  sergeant: 2,
  lieutenant: 3,
  leader: 3,
};

/**
 * Compute ruins location bonus. Only active when the agent has a `ruin_seeker`
 * trait (from divine bestowment or archetype), a possession with
 * `grantsTraitWhileHeld: 'ruin_seeker'` (treasure maps), OR is a member of
 * the Adventurers Guild (rank determines effective level).
 *
 * Returns 0 for non-ruin locations or agents without any ruin-seeking source.
 */
export function computeRuinsBonus(
  graph: WorldGraph,
  locationId: string,
  agentId: string,
): number {
  // Check location is a ruin type
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return 0;
  const subtype = locationNode.properties?.subtype ?? locationNode.properties?.locationType;
  if (!subtype || !RUIN_LOCATION_SUBTYPES.has(subtype as string)) return 0;

  // Check agent has ruin_seeker trait via has_trait edges
  let traitLevel = 0;
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;
    const tags = traitNode.properties?.tags as string[] | undefined;
    if (tags && tags.includes(RUINS_SEEKER_TRAIT_TAG)) {
      traitLevel = Math.max(traitLevel, (edge.properties?.level as number) ?? 1);
    }
  }

  // Check possessions that grant ruin_seeker while held (treasure maps)
  const possessionEdges = graph.getOutgoingEdges(agentId, 'possesses');
  for (const edge of possessionEdges) {
    const item = graph.getNode(edge.target);
    if (!item) continue;
    if (item.properties?.grantsTraitWhileHeld === RUINS_SEEKER_TRAIT_TAG) {
      const itemLevel = (item.properties?.grantedTraitLevel as number) ?? 1;
      traitLevel = Math.max(traitLevel, itemLevel);
    }
  }

  // Check Adventurers Guild membership via member_of edges
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  for (const edge of memberEdges) {
    const factionDefId = edge.properties?.factionDefId as string | undefined;
    if (factionDefId !== 'adventuring_guild') continue;
    const rank = (edge.properties?.rank as string) ?? 'journeyman';
    const guildLevel = GUILD_RANK_RUIN_LEVEL[rank] ?? 1;
    traitLevel = Math.max(traitLevel, guildLevel);
  }

  if (traitLevel === 0) return 0;

  return RUINS_TRAIT_BONUS + traitLevel * RUINS_TRAIT_BONUS_PER_LEVEL;
}

/**
 * Compute anomaly discovery bonus — Eye/Veil-skilled agents are drawn to anomaly encounters.
 * Only applies when the location is an undiscovered anomaly.
 * Scales with agent's Eye and Veil capabilities.
 *
 * @returns Scoring bonus (0.0 if agent doesn't qualify or location isn't an anomaly)
 */
export function computeAnomalyDiscoveryBonus(
  graph: WorldGraph,
  locationId: string,
  agentId: string,
): number {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return 0;

  // Check location is an undiscovered anomaly
  const props = locationNode.properties as Record<string, unknown> | undefined;
  if (!props) return 0;
  if (props.isAnomalyLocation !== true) return 0;
  if (props.discoveredByExploration === true) return 0; // already discovered

  const subtype = (props.locationSubtype ?? props.locationType) as string | undefined;
  if (!subtype || !ANOMALY_RESOURCE_MAP[subtype]) return 0;

  // Check agent's Eye capability meets threshold
  let eyeCap: number;
  let veilCap: number;
  try {
    eyeCap = computeCapability(graph, agentId, 'eye');
  } catch {
    eyeCap = 0;
  }
  if (eyeCap < ANOMALY_EYE_THRESHOLD) return 0;

  try {
    veilCap = computeCapability(graph, agentId, 'veil');
  } catch {
    veilCap = 0;
  }

  // Scale bonus with Eye and Veil capability
  const eyeBonus = eyeCap * ANOMALY_EYE_SCALING * 10; // per 0.1 capability
  const veilBonus = veilCap * ANOMALY_VEIL_SCALING * 10;

  return ANOMALY_DISCOVERY_BASE_BONUS + eyeBonus + veilBonus;
}

/**
 * Compute exploration attraction bonus from hex.mark_ground divine action.
 * Applies regardless of trait — direct divine override.
 */
export function computeExplorationAttractionBonus(
  tiles: readonly HexTile[] | undefined,
  col: number | undefined,
  row: number | undefined,
): number {
  if (!tiles || col === undefined || row === undefined) return 0;
  const tile = tiles.find(t => t.coord.col === col && t.coord.row === row);
  if (!tile) return 0;
  return (tile.explorationAttraction ?? 0) * EXPLORATION_ATTRACTION_WEIGHT;
}

/**
 * Compute divine hunch bonus for Find-type encounters.
 * Written by hex.whisper_intuition to the thread edge.
 * Applies regardless of trait — direct divine override.
 */
export function computeDivineHunchBonus(
  graph: WorldGraph,
  agentId: string,
  encounterReach: string | undefined,
  tick: number,
): number {
  // Divine hunch boosts encounters at the Eye and Shadow reaches (Find-oriented)
  if (encounterReach !== 'eye' && encounterReach !== 'shadow') return 0;

  // Check thread edges for divineHunch property
  const threadEdges = graph.getIncomingEdges(agentId, 'thread');
  for (const edge of threadEdges) {
    const hunch = edge.properties?.divineHunch as
      | { strength?: number; expiresAtTick?: number } | undefined;
    if (!hunch) continue;
    if (hunch.expiresAtTick !== undefined && hunch.expiresAtTick <= tick) continue;
    return (hunch.strength ?? 1) * DIVINE_HUNCH_FIND_BONUS;
  }
  return 0;
}

// ─── Result Types ───────────────────────────────────────────────

export interface ScoredCandidate {
  entry: EncounterCacheEntry;
  completionProb: number;
  expectedReward: number;
  /** Phase 4: Expected utility from 5-tier outcome ladder (replaces binary completionProb * reward) */
  expectedUtility: number;
  /** Phase 4: Estimated benefit of pushing (Q spend for better odds), 0 if not applicable */
  pushBenefit: number;
  /** Phase 4: Estimated benefit of resist option, 0 if not applicable */
  resistBenefit: number;
  travelCost: number;
  totalCost: number;
  valuePerTick: number;
  axiologicalScore: number;
  ambitionBoost: number;
  desireMultiplier: number;
  familiarityPenalty: number;
  explorationBonus: number;
  chainBonus: number;
  resonance: number;
  globalResonance: number;
  ruinsBonus: number;
  attractionBonus: number;
  hunchBonus: number;
  rarityMultiplier: number;
  roleAffinityMultiplier: number;
  markRevealBonus: number;
  /** Flat additive boost from actionable intelligence held by the agent (THR-113). 0 or INTEL_SCORING_BONUS. */
  intelBonus: number;
  /** Flat additive bias from doom identity + active omen state for this encounter type (THR-81). */
  identityBiasBonus: number;
  /** Novelty pressure multiplier applied after curator bias (1.0 = no pressure, <1.0 = penalized). */
  noveltyMultiplier: number;
  finalScore: number;
  action: 'start_local' | 'queue_movement' | 'attempt_remote';
}

export interface DecisionResult {
  selected: ScoredCandidate | null;
  rankedCandidates: ScoredCandidate[];
  topCandidates: ScoredCandidate[];
  trace: ScoringTrace;
}

// ─── Novelty Tracking ──────────────────────────────────────────

/** Global novelty state stored in GameState and updated per tick when agents commit to encounters. */
export interface EncounterNoveltyRecord {
  /** Last tick each template was selected globally (across all agents). templateId → tick */
  globalLastSelected: Record<string, number>;
  /** Selection count per reach-category within the current rolling window. */
  categoryWindowCounts: Record<string, number>;
  /** Selection count per template within the current rolling window (for rung-4 share ceiling). */
  templateWindowCounts: Record<string, number>;
  /** Total selections in the current rolling window. */
  categoryWindowTotal: number;
  /** Tick when the current category window started. */
  categoryWindowStart: number;
  /** Per-template EMA frequency state for rung-5 ceiling (THR-464).
   * Stores { ema, lastTick } so the decayed value can be computed lazily per-tick. */
  selectionEMA: Record<string, { ema: number; lastTick: number }>;
}

/**
 * Global recency penalty: exponential decay since last global selection of this template.
 * Returns 0 when the template has never been selected.
 */
export function computeGlobalNoveltyPenalty(
  record: EncounterNoveltyRecord | undefined,
  templateId: string,
  currentTick: number,
): number {
  if (!record) return 0;
  const lastTick = record.globalLastSelected[templateId];
  if (lastTick === undefined) return 0;
  const ticksSince = Math.max(0, currentTick - lastTick);
  return NOVELTY_GLOBAL_MAX_PENALTY * Math.exp(-Math.LN2 * ticksSince / NOVELTY_GLOBAL_HALF_LIFE);
}

/**
 * Per-agent recency penalty: exponential decay since this agent last selected this template.
 * Returns 0 when the agent has never selected this template.
 */
export function computeAgentNoveltyPenalty(
  agentLastSelected: Record<string, number> | undefined,
  templateId: string,
  currentTick: number,
): number {
  if (!agentLastSelected) return 0;
  const lastTick = agentLastSelected[templateId];
  if (lastTick === undefined) return 0;
  const ticksSince = Math.max(0, currentTick - lastTick);
  return NOVELTY_AGENT_MAX_PENALTY * Math.exp(-Math.LN2 * ticksSince / NOVELTY_AGENT_HALF_LIFE);
}

/**
 * Combined novelty multiplier: 1 minus the capped sum of global recency, agent recency,
 * and category quota penalties. Returns a value in [1 - NOVELTY_COMBINED_CAP, 1.0].
 * Deterministic: same inputs → same output (no PRNG).
 */
export function computeNoveltyMultiplier(
  globalRecord: EncounterNoveltyRecord | undefined,
  agentLastSelected: Record<string, number> | undefined,
  templateId: string,
  category: string,
  currentTick: number,
): number {
  const globalPenalty = computeGlobalNoveltyPenalty(globalRecord, templateId, currentTick);
  const agentPenalty = computeAgentNoveltyPenalty(agentLastSelected, templateId, currentTick);

  let quotaPenalty = 0;
  if (globalRecord && globalRecord.categoryWindowTotal > 0) {
    const categoryCount = globalRecord.categoryWindowCounts[category] ?? 0;
    const categoryFraction = categoryCount / globalRecord.categoryWindowTotal;
    if (categoryFraction > NOVELTY_CATEGORY_QUOTA_SOFT) {
      const excess = categoryFraction - NOVELTY_CATEGORY_QUOTA_SOFT;
      const maxExcess = 1 - NOVELTY_CATEGORY_QUOTA_SOFT;
      quotaPenalty = NOVELTY_CATEGORY_QUOTA_MAX_PENALTY * Math.min(1, excess / maxExcess);
    }
  }

  const combinedPenalty = Math.min(
    NOVELTY_COMBINED_CAP,
    globalPenalty + agentPenalty + quotaPenalty,
  );
  return 1 - combinedPenalty;
}

/**
 * Rung-4 share-ceiling multiplier (applied OUTSIDE the combined novelty cap).
 * If a template has captured more than NOVELTY_TEMPLATE_SHARE_CEILING of the
 * rolling window's selections, returns a proportional suppressor (ceiling/actual).
 * Returns 1.0 when the template is within the ceiling or the window is too small.
 * Applied directly to finalScore, bypassing NOVELTY_COMBINED_CAP, so extreme
 * baseline dominance cannot escape it.
 */
export function computeShareCeilingMultiplier(
  globalRecord: EncounterNoveltyRecord | undefined,
  templateId: string,
): number {
  if (!globalRecord || globalRecord.categoryWindowTotal < 10) return 1;
  const templateCount = (globalRecord.templateWindowCounts ?? {})[templateId] ?? 0;
  if (templateCount === 0) return 1;
  const templateShare = templateCount / globalRecord.categoryWindowTotal;
  if (templateShare <= NOVELTY_TEMPLATE_SHARE_CEILING) return 1;
  return NOVELTY_TEMPLATE_SHARE_CEILING / templateShare;
}

/**
 * Rung-5 EMA frequency ceiling (THR-464) — applied OUTSIDE the combined novelty cap.
 *
 * Uses an exponentially-weighted moving average (EMA) of per-template selections to
 * provide a persistent frequency signal that doesn't suffer from rolling-window sparsity.
 * When the EMA exceeds NOVELTY_EMA_CEILING_THRESHOLD, returns a proportional suppressor
 * (threshold/ema) that drives the effective score below competing alternatives.
 *
 * Why EMA outperforms the rung-4 rolling window:
 *   The rolling window resets every NOVELTY_CATEGORY_WINDOW_TICKS ticks. When selections
 *   are sparse (e.g. total=1 at tick 30), the `categoryWindowTotal < 10` guard makes
 *   rung 4 permanently inactive, leaving extreme-advantage templates uncapped. The EMA
 *   uses lazy per-tick decay so every selection accumulates regardless of window resets.
 *
 * Equilibrium analysis: at DECAY=0.85 (half-life ≈4.25 ticks) and THRESHOLD=1.5, the
 * ceiling activates after ~2 selections within ~4 ticks. The steady-state selection rate
 * converges to ≈1 per 3–4 ticks, giving <40 selections per 120-tick run for a template
 * that would otherwise dominate — well below the 8% KPI bound for ~1000 total selections.
 */
export function computeEMACeilingMultiplier(
  globalRecord: EncounterNoveltyRecord | undefined,
  templateId: string,
  currentTick: number,
): number {
  if (!globalRecord?.selectionEMA) return 1;
  const entry = globalRecord.selectionEMA[templateId];
  if (!entry) return 1;
  const decayedEMA = entry.ema * Math.pow(NOVELTY_EMA_DECAY, Math.max(0, currentTick - entry.lastTick));
  if (decayedEMA <= NOVELTY_EMA_CEILING_THRESHOLD) return 1;
  return NOVELTY_EMA_CEILING_THRESHOLD / decayedEMA;
}

/**
 * Rung 6 (THR-464): Global share ceiling — direct feedback from the eligibility funnel.
 *
 * When a template's cumulative share (selections/total) exceeds NOVELTY_GLOBAL_SHARE_TARGET,
 * applies a polynomial penalty (target/share)^EXPONENT. At exponent=8 this is effectively
 * blocking when share ≥ 2×target regardless of novelty recovery level:
 *   share=8% target=4%: (0.5)^8=0.004  →  score ≈ 0 for any competitor-winning template
 *
 * Unlike the EMA ceiling (rung 5), this ceiling cannot be bypassed by global-novelty
 * decay — it reads the actual distribution accumulated over the full run.
 */
export function computeGlobalShareMultiplier(
  templateId: string,
  funnelTotal: number,
  funnel: EligibilityFunnelCounters | null,
): number {
  if (!funnel || funnelTotal < NOVELTY_GLOBAL_SHARE_MIN_SAMPLES) return 1;
  const count = funnel.byTemplate[templateId]?.selected ?? 0;
  if (count === 0) return 1;
  const share = count / funnelTotal;
  if (share <= NOVELTY_GLOBAL_SHARE_TARGET) return 1;
  const ratio = NOVELTY_GLOBAL_SHARE_TARGET / share;
  return Math.pow(ratio, NOVELTY_GLOBAL_SHARE_EXPONENT);
}

// ─── Step Probability ───────────────────────────────────────────

/**
 * Estimate a single step's success probability using the shared resolution service.
 *
 * Phase 2: This now uses the same math as live resolution — no planner-only offsets.
 * The old STEP_PROBABILITY_OFFSET (+0.7) is removed; forecast and live use the same
 * threshold formula: P = capability + sphereFactor - normalizedDifficulty + modifiers.
 *
 * Legacy encounter difficulty (0–100) is normalized at this boundary.
 *
 * - capability is 0–1 (from computeCapability)
 * - difficulty is 0–100 (from encounter step — normalized here)
 * - Clamped to [0.05, 0.95] — never guaranteed success or failure
 */
export function estimateStepProbability(
  capability: number,
  difficulty: number,
  modifierTotal?: number,
): number {
  return computeResolutionThreshold({
    actorId: '', // not needed for threshold computation
    domain: 'iron', // not needed for threshold computation
    capability,
    difficulty,
    sphereFactor: 0,
    actionModifiers: modifierTotal ?? 0,
  });
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
 * Check whether an agent has a pursues-edge to any ambition with positive
 * reachAffinity for the given reach. Shared predicate for curator metadata
 * and the encounter scoring boost so both stay in lockstep.
 */
export function agentPursuesReach(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain,
): boolean {
  const pursuesEdges = graph.getOutgoingEdges(agentId, 'pursues');
  for (const edge of pursuesEdges) {
    const ambition = graph.getNode(edge.target);
    const reachAffinity = ambition?.properties?.reachAffinity as
      | Partial<Record<ReachDomain, number>>
      | undefined;
    if (reachAffinity && (reachAffinity[reach] ?? 0) > 0) return true;
  }
  return false;
}

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
  return agentPursuesReach(graph, agentId, reachPrimary) ? AMBITION_REACH_BOOST : 0;
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

// ─── Reputation Scoring Bonus ──────────────────────────────────

/**
 * Compute additive scoring bonus from agent's reputation traits.
 * Reads reputation traits with reputationEffects.scoringModifiers and
 * sums the modifier for the encounter's primary reach, scaled by trait level.
 */
export function computeReputationScoringBonus(
  graph: WorldGraph,
  agentId: string,
  entry: EncounterCacheEntry,
): number {
  const traitEdges = getTraitsForNode(graph, agentId);
  let bonus = 0;

  for (const edge of traitEdges) {
    const traitNode = graph.getNode(edge.target);
    if (!traitNode) continue;

    const props = traitNode.properties as unknown as TraitDefinitionProperties;
    if (props.subcategory !== 'reputation') continue;

    const effects = props.reputationEffects as ReputationEffects | undefined;
    if (!effects?.scoringModifiers) continue;

    const modifier = effects.scoringModifiers[entry.reachPrimary as ReachDomain] ?? 0;
    if (modifier === 0) continue;

    const level = (edge.properties as { level?: number }).level ?? 1;
    bonus += modifier * level * REPUTATION_SCORING_WEIGHT;
  }

  return bonus;
}

// ─── Role-Reach Affinity ──────────────────────────────────────────

/**
 * Multiplicative bonus when an encounter's primary reach aligns with
 * the agent's NPC role reach affinity. Guards prefer iron encounters,
 * scholars prefer eye encounters, etc.
 *
 * Returns 1.0 + ROLE_PRIMARY_AFFINITY_BONUS   if encounter reach matches role primary
 *         1.0 + ROLE_SECONDARY_AFFINITY_BONUS if encounter reach matches role secondary
 *         1.0                                 if no match or agent has no role
 *
 * Fail-soft: missing npcRole or unmapped role → 1.0 (no bonus, no penalty).
 */
export function computeRoleAffinityMultiplier(
  agentNode: GraphNode,
  encounterReachPrimary: ReachDomain,
): number {
  const role = agentNode.properties?.npcRole as NpcRole | undefined;
  if (!role) return 1.0;

  const affinity = NPC_ROLE_REACH_MAP[role];
  if (!affinity) return 1.0;

  if (encounterReachPrimary === affinity.primary) {
    return 1.0 + ROLE_PRIMARY_AFFINITY_BONUS;
  }
  if (encounterReachPrimary === affinity.secondary) {
    return 1.0 + ROLE_SECONDARY_AFFINITY_BONUS;
  }
  return 1.0;
}

// ─── Main: Score and Select ─────────────────────────────────────

/**
 * Score all candidate encounter cache entries for an agent and select
 * the highest-scoring one. Deterministic: same inputs → same output.
 */
/** Minimal runtime view needed by encounter scoring for funnel counters and curator nudge traces. */
interface ScoringRuntime {
  eligibilityFunnel: EligibilityFunnelCounters | null;
  traceBuffer?: TraceBuffer;
}

export function scoreAndSelect(
  candidates: readonly EncounterCacheEntry[],
  agentId: string,
  agentLocationId: string,
  graph: WorldGraph,
  tick: number,
  fundament?: FundamentState,
  tiles?: readonly HexTile[],
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  /** Combined encounter-type bias from doom identity + active omen. Capped at ±IDENTITY_ENCOUNTER_BIAS_CAP per source. */
  encounterTypeBias?: Partial<Record<string, number>>,
  /** Active hidden marks for this agent — matching candidates score higher (THR-112). */
  hiddenMarks?: readonly HiddenMark[],
  /** Active intelligence records for this agent — actionable intel boosts scoring (THR-113). */
  intelligenceRecords?: readonly IntelligenceRecord[],
  runtime?: ScoringRuntime,
  /** Global novelty record from GameState — penalizes recently over-selected templates (THR-453). */
  noveltyRecord?: EncounterNoveltyRecord,
): DecisionResult {
  // Fail-soft: missing agent → null result
  const agentNode = graph.getNode(agentId);
  if (!agentNode) {
    return {
      selected: null,
      rankedCandidates: [],
      topCandidates: [],
      trace: buildTrace(agentId, tick, null, []),
    };
  }

  // Fail-soft: empty candidates → null result
  if (candidates.length === 0) {
    return {
      selected: null,
      rankedCandidates: [],
      topCandidates: [],
      trace: buildTrace(agentId, tick, null, []),
    };
  }

  const profile = resolveProfile(graph, agentId, tick, fundament);

  // Pre-fetch behavior weights once per agent (behavior_weight effects)
  const behaviorWeights = effectStates !== undefined
    ? getBehaviorWeights(graph, agentId, effectStates)
    : [];

  // Read agent tracking records (fail-soft: treat missing as empty)
  const familiarityRecord = agentNode.properties?.familiarityRecord as FamiliarityRecord | undefined;
  const explorationRecord = agentNode.properties?.explorationRecord as ExplorationRecord | undefined;
  const agentNoveltyLastSelected = agentNode.properties?.agentNoveltyLastSelected as Record<string, number> | undefined;
  const chainProgress = getChainProgress(agentNode.properties as Record<string, unknown>);

  const scored: ScoredCandidate[] = [];
  // Dedup `intelligence_referenced` trace emission: a single record can match
  // many candidates in one scoreAndSelect call, but we only want one audit trace
  // per (record, scoring_boost) pair per call.
  const emittedIntelRecords = new Set<string>();
  // Track pre-novelty winner to detect novelty-driven selection changes (NFP #2 inspectability).
  let preNoveltyBestScore = -Infinity;
  let preNoveltyBestId: string | null = null;

  // THR-464 rung 6: Pre-compute funnel total once (O(n_templates)) for the global share ceiling.
  const funnel = runtime?.eligibilityFunnel ?? null;
  let funnelTotal = 0;
  if (funnel) {
    for (const rec of Object.values(funnel.byTemplate)) {
      funnelTotal += rec.selected;
    }
  }

  for (const entry of candidates) {
    // 1. Completion probability (kept for backward compat / trace output)
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

    // 3. Phase 4: Expected utility from 5-tier outcome ladder (replaces binary model).
    // Uses the same math as live resolution via forecastEncounterExpectedUtility.
    // Reward scale includes both direct reward and growth value.
    const rewardWithGrowth = entry.successRewardEstimate + growthValue;
    const forecast = forecastEncounterExpectedUtility(entry, agentId, graph, rewardWithGrowth);
    const expectedUtility = forecast.expectedUtility;
    const pushBenefit = forecast.pushBenefit;
    const resistBenefit = forecast.resistBenefit;

    // 3b. Binary expected reward — fallback when EU is negative (incapable agents, extreme difficulty).
    const expectedReward =
      completionProb * (entry.successRewardEstimate + growthValue);

    // 4. Travel cost (B.3: dampened by TRAVEL_COST_WEIGHT, modulated by personality wanderlust)
    const wanderlust = Math.min(1, Math.max(0, -(profile[WANDERLUST_PAIR] ?? 0))); // clamped 0..1, higher = more curious
    const personalTravelCostWeight = TRAVEL_COST_WEIGHT * (1 - wanderlust * WANDERLUST_MAX_DISCOUNT);
    // Hex-distance travel cost: consistent with hex-based awareness model
    const agentHex = resolveLocationToHex(graph, agentLocationId);
    const entryHex = resolveLocationToHex(graph, entry.locationId);
    const distance = (agentHex && entryHex) ? hexDistance(agentHex, entryHex) : Infinity;
    let travelCost: number;
    if (distance === 0) {
      travelCost = 0;
    } else if (!entry.requiresPresence) {
      travelCost = 0;
    } else if (!isFinite(distance)) {
      travelCost = 9999; // Unreachable — effectively eliminates candidate
    } else {
      travelCost = distance * personalTravelCostWeight;
    }

    // 5. Total cost (floor at 1)
    const totalCost = Math.max(travelCost + entry.totalTickCost, 1);

    // 6. Value per tick — Phase 4 hybrid ranking model.
    // 5-tier EU drives ranking when positive (capable agents, manageable difficulty).
    // Binary expectedReward (completionProb × reward) is the fallback when EU ≤ 0,
    // preserving travel-cost and desire-multiplier scoring invariants for incapable
    // agents where EU goes negative. This is intentional: pure EU ranking inverts
    // those invariants (negative ÷ larger cost = higher score), so EU acts as the
    // primary signal where it's meaningful and steps aside where it isn't.
    const euRanking = expectedUtility > 0 ? expectedUtility : expectedReward;
    const valuePerTick = (euRanking + pushBenefit + resistBenefit) / totalCost;

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

    // D.2: Behavior weight multiplier (behavior_weight effects on the agent)
    desireMultiplier *= computeBehaviorWeightMultiplier(behaviorWeights, entry.reachPrimary);

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

    // 15. C.2: Chain bonus — next stage in an active encounter chain
    const chainBonus = computeChainBonus(entry.templateId, chainProgress);

    // 16. Ruins exploration bonus (gated behind ruin_seeker trait or treasure map possession)
    const ruinsBonus = computeRuinsBonus(graph, entry.locationId, agentId);

    // 16b. Anomaly discovery bonus — Eye/Veil-skilled agents drawn to undiscovered anomalies
    const anomalyBonus = computeAnomalyDiscoveryBonus(graph, entry.locationId, agentId);

    // 17. Exploration attraction bonus (divine action: hex.mark_ground)
    const attractionBonus = computeExplorationAttractionBonus(tiles, entryHex?.col, entryHex?.row);

    // 18. Divine hunch bonus (divine action: hex.whisper_intuition)
    const hunchBonus = computeDivineHunchBonus(graph, agentId, entry.reachPrimary, tick);

    // 18b. Reputation trait scoring bonus
    const reputationBonus = computeReputationScoringBonus(graph, agentId, entry);

    // 19. Rarity multiplier — based on location node's rarityTier (fail-soft: missing node → tier 1 → multiplier 1.0)
    const locationNode = graph.getNode(entry.locationId);
    const locRarityTier = getRarityTier(locationNode ?? { id: '', type: 'location', name: '', properties: {} });
    const rarityMultiplier = RARITY_ENCOUNTER_SCORE_MULTIPLIER[locRarityTier];

    // 20. Role-reach affinity — professional identity shapes encounter preference
    const roleAffinityMultiplier = computeRoleAffinityMultiplier(agentNode, entry.reachPrimary);

    // 21. Final score — rarity + role affinity multipliers on baseScore (exploration/ruins/chain bonuses are fixed)
    const baseScore = valuePerTick * desireMultiplier + factionScoringBoost + reputationBonus + resonance + globalResonance;
    // 22. Doom identity + omen bias — additive, applied after all multipliers (already capped at source)
    const identityBiasBonus = encounterTypeBias?.[entry.encounterType] ?? 0;
    // 23. Hidden mark reveal bonus — encounters matching an agent's marks score higher (THR-112)
    let markRevealBonus = 0;
    if (hiddenMarks && hiddenMarks.length > 0) {
      const markMatches = evaluateMarkReveals(hiddenMarks, agentId, entry.templateId);
      const rawBonus = markMatches.reduce((sum, m) => sum + MARK_REVEAL_SCORING_BONUS * m.mark.severity, 0);
      markRevealBonus = Math.min(rawBonus, MARK_REVEAL_SCORING_CAP);
    }
    // 24. Intelligence scoring bonus (THR-113) — actionable intel adds a flat boost once per candidate
    let intelBonus = 0;
    if (intelligenceRecords && intelligenceRecords.length > 0) {
      // Resolve region from the location node so region-only records (no
      // targetEntityId) still count as actionable intel for this candidate.
      const entryRegion =
        typeof locationNode?.properties?.region === 'string'
          ? (locationNode.properties.region as string)
          : typeof locationNode?.properties?.regionId === 'string'
            ? (locationNode.properties.regionId as string)
            : undefined;
      const intelMatch = findActionableIntelligence(intelligenceRecords, agentId, {
        templateId: entry.templateId,
        locationId: entry.locationId,
        targetAgentId: entry.targetAgentId,
        region: entryRegion,
      });
      if (intelMatch) {
        intelBonus = INTEL_SCORING_BONUS;
        if (!emittedIntelRecords.has(intelMatch.recordId)) {
          emitIntelligenceReferenced(tick, agentId, intelMatch.recordId, 'scoring_boost', {
            templateId: entry.templateId,
            intelCategory: intelMatch.category,
          });
          emittedIntelRecords.add(intelMatch.recordId);
        }
      }
    }
    const rawFinalScore = baseScore * rarityMultiplier * roleAffinityMultiplier * (1 - familiarityPenalty) + explorationBonus + chainBonus
      + ruinsBonus + anomalyBonus + attractionBonus + hunchBonus + identityBiasBonus + markRevealBonus + intelBonus;

    // 17b. Branching curator bias (THR-452) — boost under-selected branching templates
    const curatorMultiplier = computeBranchingCuratorMultiplier(entry, agentId, tick, runtime ?? null);
    const preNoveltyScore = rawFinalScore * curatorMultiplier;
    if (preNoveltyScore > preNoveltyBestScore) {
      preNoveltyBestScore = preNoveltyScore;
      preNoveltyBestId = entry.templateId;
    }
    // 17c. Novelty pressure (THR-453) — penalise recently over-selected templates
    const noveltyMultiplier = computeNoveltyMultiplier(noveltyRecord, agentNoveltyLastSelected, entry.templateId, entry.reachPrimary, tick);
    // 17d. Share-ceiling backstop (THR-464 rung 4) — rolling-window ceiling, guards sparse windows
    const ceilingMultiplier = computeShareCeilingMultiplier(noveltyRecord, entry.templateId);
    // 17e. EMA frequency ceiling (THR-464 rung 5) — persistent frequency signal, immune to window resets
    const emaCeilingMultiplier = computeEMACeilingMultiplier(noveltyRecord, entry.templateId, tick);
    // 17f. Global share ceiling (THR-464 rung 6) — direct feedback from eligibility funnel; bypasses novelty decay
    const globalShareMultiplier = computeGlobalShareMultiplier(entry.templateId, funnelTotal, funnel);
    const finalScore = preNoveltyScore * noveltyMultiplier * ceilingMultiplier * emaCeilingMultiplier * globalShareMultiplier;

    // 17. Action classification
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
      expectedUtility,
      pushBenefit,
      resistBenefit,
      travelCost,
      totalCost,
      valuePerTick,
      axiologicalScore,
      ambitionBoost,
      desireMultiplier,
      familiarityPenalty,
      explorationBonus,
      chainBonus,
      resonance,
      globalResonance,
      ruinsBonus,
      attractionBonus,
      hunchBonus,
      rarityMultiplier,
      roleAffinityMultiplier,
      markRevealBonus,
      intelBonus,
      identityBiasBonus,
      noveltyMultiplier,
      finalScore,
      action,
    });

    // Funnel: record scored (only if the template already has a funnel record from the filter pipeline)
    const scoredFunnelRec = runtime?.eligibilityFunnel?.byTemplate[entry.templateId];
    if (scoredFunnelRec) scoredFunnelRec.scored++;
  }

  // Sort descending by finalScore
  scored.sort((a, b) => b.finalScore - a.finalScore);

  const top5 = scored.slice(0, 5);
  const best = scored[0];

  const selected = best.finalScore >= IDLE_SCORE_THRESHOLD ? best : null;

  // Funnel: record selected
  if (selected) {
    const selectedFunnelRec = runtime?.eligibilityFunnel?.byTemplate[selected.entry.templateId];
    if (selectedFunnelRec) selectedFunnelRec.selected++;
  }

  // Detect if novelty pressure changed which template won (NFP #2 — emit trace for inspectability)
  const noveltyChangedSelection =
    selected !== null &&
    preNoveltyBestId !== null &&
    selected.entry.templateId !== preNoveltyBestId;
  const preNoveltyWinnerId = noveltyChangedSelection ? preNoveltyBestId : null;

  return {
    selected,
    rankedCandidates: scored,
    topCandidates: top5,
    trace: buildTrace(agentId, tick, selected, top5, noveltyChangedSelection, preNoveltyWinnerId),
  };
}

// ─── Trace Builder ──────────────────────────────────────────────

function buildTrace(
  agentId: string,
  tick: number,
  selected: ScoredCandidate | null,
  top5: ScoredCandidate[],
  noveltyChangedSelection?: boolean,
  preNoveltyWinnerId?: string | null,
): ScoringTrace {
  return {
    id: 0,
    tick,
    timestamp: tick,
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
      chainBonus: c.chainBonus,
      finalScore: c.finalScore,
      travelCost: c.travelCost,
      completionProb: c.completionProb,
      resonance: c.resonance,
      globalResonance: c.globalResonance,
      rarityMultiplier: c.rarityMultiplier,
      roleAffinityMultiplier: c.roleAffinityMultiplier,
      noveltyMultiplier: c.noveltyMultiplier,
      // Phase 4: rich forecast fields
      expectedUtility: c.expectedUtility,
      pushBenefit: c.pushBenefit,
      resistBenefit: c.resistBenefit,
      identityBiasBonus: c.identityBiasBonus,
    })),
    selectedTemplateId: selected?.entry.templateId ?? null,
    selectedLocationId: selected?.entry.locationId ?? null,
    action: selected ? selected.action : 'idle',
    noveltyChangedSelection: noveltyChangedSelection ?? false,
    preNoveltyWinnerId: preNoveltyWinnerId ?? null,
    summary: selected
      ? `Agent ${agentId} chose ${selected.entry.templateId} (score=${selected.finalScore.toFixed(3)})`
      : `Agent ${agentId} idles (no candidates above threshold)`,
  };
}
