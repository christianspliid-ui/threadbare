/**
 * Ascendant creation and archetype generation.
 *
 * The Ascendant is the player's divine entity. Created from a generated
 * archetype, it exists as an actor node in the graph with an avatar
 * (mortal individual) linked by avatar_of edge.
 */

import { SPHERE_NAMES, type SphereName } from '../types/index';
import type {
  AscendantArchetype,
  AscendantCreationConfig,
  AscendantProperties,
  SphereAlignment,
  EssencePool,
} from '../types/influence';
import { BASE_MAX_ESSENCE } from '../types/influence';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { WorldGraph } from './graph';
import { createStartingEssencePool } from './influence';
import { ARCHETYPE_TITLES } from '../data/ascendant-content';

// ─── Seeded PRNG (simple mulberry32) ─────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VALUE_PAIRS: ValuePair[] = [
  'mercy_ruthlessness',
  'asceticism_extravagance',
  'honesty_cunning',
  'tradition_novelty',
  'loyalty_ambition',
  'revelation_discretion',
  'preservation_transformation',
  'sacrifice_survival',
  'courage_prudence',
];

// ─── Archetype Generation ────────────────────────────────────────────

/**
 * Generate a set of Ascendant archetypes for the player to choose from.
 * Deterministic given the same seed.
 */
export function generateArchetypes(count: number, seed: number): AscendantArchetype[] {
  const rng = mulberry32(seed);
  const archetypes: AscendantArchetype[] = [];

  // Shuffle spheres to pick distinct primaries
  const shuffled = [...SPHERE_NAMES].sort(() => rng() - 0.5);

  for (let i = 0; i < count; i++) {
    const primary = shuffled[i % shuffled.length];

    // Pick secondary: different from primary, prefer allies
    const candidates = SPHERE_NAMES.filter((s) => s !== primary);
    const secondary = candidates[Math.floor(rng() * candidates.length)];

    const alignment: SphereAlignment = { primary, secondary };

    // Generate personality seed
    const personalitySeed = {} as AxiologicalProfile;
    for (const pair of VALUE_PAIRS) {
      personalitySeed[pair] = (rng() * 2 - 1) * 0.6; // range [-0.6, 0.6]
    }

    // Generate domain affinities (2-3 domains)
    const domainAffinities: Partial<Record<ReachDomain, number>> = {};
    const domainCandidates = [...REACH_DOMAINS].sort(() => rng() - 0.5);
    const numDomains = 2 + Math.floor(rng() * 2); // 2-3 domains
    for (let d = 0; d < numDomains; d++) {
      domainAffinities[domainCandidates[d]] = 2 + Math.floor(rng() * 4); // raw score 2-5
    }

    const titles = ARCHETYPE_TITLES[primary];
    const title = titles[Math.floor(rng() * titles.length)];

    archetypes.push({
      id: `archetype.${primary}_${i}`,
      name: title,
      title,
      description: `A nascent deity aligned with ${primary} and ${secondary}.`,
      sphereAlignment: alignment,
      startingDomainAffinities: domainAffinities,
      personalitySeed,
      flavorText: `The cosmic currents of ${primary} and ${secondary} converge in this emerging divine presence.`,
    });
  }

  return archetypes;
}

// ─── Ascendant Creation ──────────────────────────────────────────────

export interface CreateAscendantResult {
  ascendantId: string;
  avatarId: string;
}

/**
 * Create an Ascendant and its Avatar in the world graph.
 *
 * Creates:
 * 1. Ascendant actor node with sphere alignment, empty essence pool, personality
 * 2. Avatar actor node (individual) at the starting location
 * 3. avatar_of edge (avatar → ascendant)
 * 4. located_at edge (avatar → starting location)
 */
export function createAscendant(
  graph: WorldGraph,
  config: AscendantCreationConfig
): CreateAscendantResult {
  const ascendantId = `asc.${config.archetype.id}`;
  const avatarId = `avatar.${config.archetype.id}`;

  const startingPool: EssencePool = createStartingEssencePool();

  const ascendantProperties: AscendantProperties = {
    actorType: 'ascendant',
    sphereAlignment: config.archetype.sphereAlignment,
    essencePool: startingPool,
    maxEssence: BASE_MAX_ESSENCE,
    archetypeId: config.archetype.id,
    interventionHistory: {},
    avatarId,
  };

  // Create Ascendant node
  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: config.archetype.name,
    properties: ascendantProperties as unknown as Record<string, unknown>,
  });

  // Create Avatar node
  graph.addNode({
    id: avatarId,
    type: 'actor',
    name: config.avatar.name,
    properties: {
      actorType: 'individual',
      formDescription: config.avatar.formDescription,
      axiologicalProfile: config.archetype.personalitySeed,
    },
  });

  // Wire avatar_of edge
  graph.addEdge({
    id: `edge.avatar_of.${avatarId}`,
    source: avatarId,
    target: ascendantId,
    type: 'avatar_of',
    properties: {},
  });

  // Place avatar at starting location
  graph.addEdge({
    id: `edge.located_at.${avatarId}`,
    source: avatarId,
    target: config.avatar.startLocationId,
    type: 'located_at',
    properties: {},
  });

  return { ascendantId, avatarId };
}
