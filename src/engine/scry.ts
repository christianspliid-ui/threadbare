/**
 * Scry Engine — Divine court state management and title generation.
 *
 * Tasks 3–5 implementation:
 * - Task 3: State creation and court initialization
 * - Task 4: Seeded title generation with rank-scaled bonuses
 * - Task 5: Agent assignment, demotion, and reassignment cost calculation
 *
 * All functions are pure and deterministic (given same seed, produce same output).
 */

import type { SphereName } from '../types';
import type { ReachDomain } from '../types/traits';
import type {
  ScryState,
  Position,
  PositionRank,
  CourtStructureType,
  CourtStructureDefinition,
  Title,
  TitleProposal,
  TitleAssignment,
  TitleEffect,
  TitleEffectType,
} from '../types/scry';
import {
  RANK_MIN_TIER,
  RANK_REASSIGNMENT_COST,
  RANK_DEMOTION_COST,
  REASSIGNMENT_ESCALATION,
} from '../types/scry';
import {
  COURT_STRUCTURES,
  POSITION_ARCHETYPES,
  TITLE_FRAGMENTS,
  TITLE_TEMPLATES,
  BONUS_RULES,
  WEAKNESS_POOL,
  DOMAIN_DISPLAY_NAMES,
} from '../data/scry-content';
import type { RetinueAgent } from './retinue';

// ─── PRNG ──────────────────────────────────────────────────────────────────

/**
 * Mulberry32 seeded PRNG. Returns a function that produces uniformly
 * distributed random numbers in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Sphere-to-Domain Affinity Map ─────────────────────────────────────────

/**
 * Maps each Reach domain to its primary Creation sphere affinity.
 * Used in title generation to build a sphere pool from the agent's top domains.
 */
const SPHERE_DOMAIN_AFFINITY: Record<ReachDomain, SphereName> = {
  iron: 'force',
  gold: 'matter',
  shadow: 'entropy',
  veil: 'spirit',
  heart: 'life',
  eye: 'mind',
  stone: 'matter',
  star: 'time',
  flesh: 'life',
};

// ─── Task 3: State Creation and Initialization ──────────────────────────────

/**
 * Create an empty, uninitialized ScryState.
 * Court structure will be null, positions array empty.
 */
export function createScryState(): ScryState {
  return {
    courtStructureType: 'high_house', // default, will be overridden on initialization
    positions: [],
    sacredSites: [],
    artifacts: [],
    titleHistory: [],
    totalReassignmentCount: 0,
    initialized: false,
  };
}

/**
 * Look up a court structure definition by type.
 * Returns null if structureType is invalid.
 */
export function getCourtStructureDefinition(
  structureType: CourtStructureType
): CourtStructureDefinition | null {
  return COURT_STRUCTURES.find((s) => s.structureType === structureType) || null;
}

/**
 * Initialize a court by choosing a structure type and creating 10 positions
 * with archetypes, plus sacred site and artifact slots.
 *
 * Returns a new ScryState with the court fully set up but no agents assigned.
 */
export function initializeCourt(
  state: ScryState,
  structureType: CourtStructureType
): ScryState {
  const structDef = getCourtStructureDefinition(structureType);
  if (!structDef) {
    // Fail-soft: invalid structure type, return unchanged state
    return state;
  }

  const newState: ScryState = {
    courtStructureType: structureType,
    positions: [],
    sacredSites: [],
    artifacts: [],
    titleHistory: [],
    totalReassignmentCount: 0,
    initialized: true,
  };

  // Create 10 positions: 1 apex + 3 inner + 6 outer
  const archetypes =
    POSITION_ARCHETYPES[structureType] || POSITION_ARCHETYPES.high_house;

  let positionId = 0;

  // Apex (1 position)
  const apexArchetypes = archetypes.apex || ['The Sovereign'];
  for (let i = 0; i < structDef.positionCounts.apex; i++) {
    newState.positions.push({
      id: `pos_apex_${positionId}`,
      rank: 'apex',
      slotIndex: i,
      archetype: apexArchetypes[i] || apexArchetypes[0],
      assignedAgentId: null,
      activeTitle: null,
      locked: false,
    });
    positionId++;
  }

  // Inner (3 positions)
  const innerArchetypes = archetypes.inner || ['The Shield', 'The Voice', 'The Eye'];
  for (let i = 0; i < structDef.positionCounts.inner; i++) {
    newState.positions.push({
      id: `pos_inner_${positionId}`,
      rank: 'inner',
      slotIndex: i,
      archetype: innerArchetypes[i] || innerArchetypes[0],
      assignedAgentId: null,
      activeTitle: null,
      locked: false,
    });
    positionId++;
  }

  // Outer (6 positions)
  const outerArchetypes = archetypes.outer || [
    'The Blade',
    'The Coin',
    'The Shadow',
    'The Flame',
    'The Root',
    'The Tide',
  ];
  for (let i = 0; i < structDef.positionCounts.outer; i++) {
    newState.positions.push({
      id: `pos_outer_${positionId}`,
      rank: 'outer',
      slotIndex: i,
      archetype: outerArchetypes[i] || outerArchetypes[0],
      assignedAgentId: null,
      activeTitle: null,
      locked: false,
    });
    positionId++;
  }

  // Initialize sacred sites
  for (let i = 0; i < structDef.sacredSiteSlots; i++) {
    newState.sacredSites.push({
      slotIndex: i,
      locationId: null,
      locationName: null,
      consecrationCost: 20,
      radiusSphereInfluence: null,
      influenceStrength: 0.3,
      bonusEssencePerTick: 0.2,
    });
  }

  // Initialize artifact slots
  for (let i = 0; i < structDef.artifactSlots; i++) {
    newState.artifacts.push({
      slotIndex: i,
      artifactId: null,
      name: null,
      bearerId: null,
      bearerName: null,
      sphereAffinity: null,
      effects: [],
      lossConsequence: null,
      creationCost: 35,
    });
  }

  return newState;
}

// ─── Task 4: Title Generation ──────────────────────────────────────────────

/**
 * Parameters for seeded title generation.
 */
export interface TitleGenerationParams {
  agent: RetinueAgent;
  positionRank: PositionRank;
  structureType: CourtStructureType;
  positionArchetype: string;
  primarySphere: SphereName;
  seed: number;
}

/**
 * Generate 3-4 title proposals for an agent filling a position.
 *
 * Algorithm:
 * 1. Build sphere pool: primarySphere + agent's top domain spheres
 * 2. Generate 3 or 4 proposals (3 + 1 if rng > 0.5)
 * 3. For each: pick sphere, build name from fragments + template, add bonuses + weakness
 */
export function generateTitleProposals(
  params: TitleGenerationParams
): TitleProposal[] {
  const rng = mulberry32(params.seed);

  // Step 1: Get agent's top 2 domains
  const agentDomains = Object.entries(params.agent.domainCapabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([domain]) => domain as ReachDomain);

  // Step 2: Build sphere pool
  const spherePool: SphereName[] = [params.primarySphere];
  for (const domain of agentDomains) {
    const sphere = SPHERE_DOMAIN_AFFINITY[domain];
    if (sphere && !spherePool.includes(sphere)) {
      spherePool.push(sphere);
    }
  }

  // Step 3: Determine number of proposals (3 or 4)
  const numProposals = rng() > 0.5 ? 4 : 3;

  // Step 4: Generate proposals
  const proposals: TitleProposal[] = [];

  for (let i = 0; i < numProposals; i++) {
    // Pick sphere from pool
    const sphereIndex = Math.floor(rng() * spherePool.length);
    const sphere = spherePool[sphereIndex];

    // Pick epithet and role from sphere fragments
    const fragments = TITLE_FRAGMENTS[sphere];
    if (!fragments) continue;

    const epithets = fragments.epithets;
    const roles = fragments.roles;

    const epithetIndex = Math.floor(rng() * epithets.length);
    const roleIndex = Math.floor(rng() * roles.length);

    const epithet = epithets[epithetIndex];
    const role = roles[roleIndex];

    // Pick template for rank
    const templates = TITLE_TEMPLATES[params.positionRank];
    if (!templates) continue;

    const templateIndex = Math.floor(rng() * templates.length);
    const template = templates[templateIndex];

    // Substitute placeholders
    const domain = agentDomains[0] || 'iron';
    const domainDisplay = DOMAIN_DISPLAY_NAMES[domain];

    const titleName = template
      .replace('{epithet}', epithet)
      .replace('{role}', role)
      .replace('{archetype}', params.positionArchetype)
      .replace('{domain}', domainDisplay);

    // Generate bonuses
    const bonuses = generateBonuses(rng, params.positionRank, sphere, domain);

    // Generate weakness
    const weakness = generateWeakness(rng, sphere);

    // Build title
    const title: Title = {
      id: `title.${params.structureType}.${params.positionRank}_${i}_s${params.seed}`,
      name: titleName,
      rank: params.positionRank,
      sphereAffinity: sphere,
      domainAffinity: domain,
      bonuses,
      weaknesses: weakness ? [weakness] : [],
      flavorText: `A title befitting ${params.agent.name}'s station.`,
      generationSeed: {
        agentId: params.agent.id,
        positionRank: params.positionRank,
        structureType: params.structureType,
        seed: params.seed,
      },
    };

    proposals.push({
      title,
      rationale: `Sphere of ${sphere}, emphasizing ${domain} domain mastery.`,
    });
  }

  return proposals;
}

/**
 * Generate bonuses for a title based on rank and sphere.
 * Apex titles get 2 bonuses, inner/outer get 1-2 based on rng.
 */
function generateBonuses(
  rng: () => number,
  rank: PositionRank,
  sphere: SphereName,
  domain: ReachDomain
): TitleEffect[] {
  const bonuses: TitleEffect[] = [];

  // Determine how many bonuses
  const numBonuses = rank === 'apex' ? 2 : rng() > 0.5 ? 2 : 1;

  const rules = BONUS_RULES[rank];
  if (!rules) return bonuses;

  // Pick random bonuses with weighted distribution
  for (let i = 0; i < numBonuses; i++) {
    const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
    let pick = rng() * totalWeight;

    let selectedRule = rules[0];
    for (const rule of rules) {
      pick -= rule.weight;
      if (pick <= 0) {
        selectedRule = rule;
        break;
      }
    }

    const value =
      selectedRule.minValue +
      rng() * (selectedRule.maxValue - selectedRule.minValue);

    bonuses.push({
      type: selectedRule.type,
      target: selectedRule.target,
      value: Math.round(value * 100) / 100,
      description: `+${value.toFixed(2)} to ${selectedRule.target}`,
    });
  }

  return bonuses;
}

/**
 * Generate a single weakness, preferring sphere-associated weaknesses.
 */
function generateWeakness(
  rng: () => number,
  sphere: SphereName
): TitleEffect | null {
  // Find weaknesses associated with this sphere
  const sphereWeaknesses = WEAKNESS_POOL.filter((w) =>
    w.sphereAssociations.includes(sphere)
  );

  // Fall back to all weaknesses if none match
  const pool = sphereWeaknesses.length > 0 ? sphereWeaknesses : WEAKNESS_POOL;

  const weaknessIndex = Math.floor(rng() * pool.length);
  const template = pool[weaknessIndex];

  const value =
    template.minValue + rng() * (template.maxValue - template.minValue);

  return {
    type: template.type,
    target: template.target,
    value: Math.round(value * 100) / 100,
    description: template.description,
  };
}

// ─── Task 5: Assignment Operations ─────────────────────────────────────────

/**
 * Get all positions that can be assigned an agent of a given tier.
 * Filters by RANK_MIN_TIER and locks status.
 */
export function getEligiblePositions(
  state: ScryState,
  agentTier: number
): Position[] {
  return state.positions.filter((pos) => {
    // Must be unassigned
    if (pos.assignedAgentId !== null) return false;

    // Must not be locked
    if (pos.locked) return false;

    // Must meet tier requirement for rank
    const minTier = RANK_MIN_TIER[pos.rank];
    return agentTier >= minTier;
  });
}

/**
 * Assign an agent to a position with a title.
 * Records the action in titleHistory and returns new state.
 * Does NOT validate tier eligibility — caller's responsibility.
 */
export function assignAgentToPosition(
  state: ScryState,
  positionId: string,
  agentId: string,
  title: Title,
  essenceCost: number,
  tick: number
): ScryState {
  const newState = { ...state };

  // Find and update position
  const positionIndex = newState.positions.findIndex((p) => p.id === positionId);
  if (positionIndex === -1) return newState; // Fail-soft

  newState.positions = [...newState.positions];
  newState.positions[positionIndex] = {
    ...newState.positions[positionIndex],
    assignedAgentId: agentId,
    activeTitle: title,
  };

  // Record in history
  const entry: TitleAssignment = {
    tick,
    positionId,
    agentId,
    titleId: title.id,
    action: 'assign',
    essenceCost,
  };

  newState.titleHistory = [...newState.titleHistory, entry];

  return newState;
}

/**
 * Demote an agent from a position, clearing both assignment and title.
 * Records demotion in titleHistory.
 */
export function demoteAgent(
  state: ScryState,
  positionId: string,
  tick: number
): ScryState {
  const newState = { ...state };

  // Find position
  const positionIndex = newState.positions.findIndex((p) => p.id === positionId);
  if (positionIndex === -1) return newState; // Fail-soft

  const position = newState.positions[positionIndex];
  if (!position.assignedAgentId) return newState; // Already unassigned

  const essenceCost = RANK_DEMOTION_COST[position.rank];

  newState.positions = [...newState.positions];
  newState.positions[positionIndex] = {
    ...newState.positions[positionIndex],
    assignedAgentId: null,
    activeTitle: null,
  };

  // Record in history
  const entry: TitleAssignment = {
    tick,
    positionId,
    agentId: position.assignedAgentId,
    titleId: position.activeTitle?.id || 'unknown',
    action: 'demote',
    essenceCost,
  };

  newState.titleHistory = [...newState.titleHistory, entry];

  return newState;
}

/**
 * Calculate the essence cost to reassign a position of a given rank,
 * accounting for escalation (higher reassignment count = higher cost).
 *
 * Formula: RANK_REASSIGNMENT_COST[rank] × REASSIGNMENT_ESCALATION^totalReassignmentCount
 */
export function getReassignmentCost(
  rank: PositionRank,
  totalReassignments: number
): number {
  const baseCost = RANK_REASSIGNMENT_COST[rank];
  const escalation = Math.pow(REASSIGNMENT_ESCALATION, totalReassignments);
  return baseCost * escalation;
}
