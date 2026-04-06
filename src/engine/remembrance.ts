/**
 * Remembrance Filtering Funnel Engine
 *
 * Implements the scored-filter pipeline for character creation:
 *   Stirring Image → Origin Fragments → Drive Fragments → Hungers → Identity
 *
 * All filtering uses score-and-sort with seeded jitter for determinism.
 */

import { SPHERE_NAMES } from '../types/index';
import type { SphereName, CosmologyProfile } from '../types/index';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import type { SphereAlignment } from '../types/influence';
import type {
  StirringImage,
  RemembranceFragment,
  HungerDefinition,
} from '../types/remembrance';
import type { MapSizePreset } from './gameInit';

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of origin/drive fragments returned by each filter pass */
const FRAGMENT_SELECTION_COUNT = 3;

/** Weight of seeded jitter relative to cluster-overlap score (tie-breaking) */
const JITTER_WEIGHT = 0.15;

/** Primary sphere weight in cosmology derivation */
const COSMOLOGY_PRIMARY_WEIGHT = 0.25;

/** Secondary sphere weight in cosmology derivation */
const COSMOLOGY_SECONDARY_WEIGHT = 0.20;

/** Max bias magnitude applied from tag → value pair mapping */
const TAG_BIAS_MAGNITUDE = 0.4;

/** Seeded noise magnitude added on top of bias (range [-N, N]) */
const PERSONALITY_NOISE_MAGNITUDE = 0.35;

// ─── Tag → Personality Bias Map ──────────────────────────────────────────────

/**
 * Maps fragment tags to partial AxiologicalProfile adjustments.
 * Positive = toward virtue pole (first named), negative = toward flaw pole.
 */
const TAG_BIASES: Partial<Record<string, Partial<Record<ValuePair, number>>>> = {
  caretaker:     { loyalty_ambition: 0.4, preservation_transformation: 0.3, sacrifice_survival: 0.3 },
  scholar:       { revelation_discretion: 0.4, tradition_novelty: 0.2, honesty_cunning: 0.2 },
  leader:        { mercy_ruthlessness: 0.2, loyalty_ambition: -0.2, courage_prudence: 0.3 },
  ruler:         { loyalty_ambition: -0.3, asceticism_extravagance: -0.3, mercy_ruthlessness: -0.2 },
  healer:        { mercy_ruthlessness: 0.4, sacrifice_survival: 0.3, loyalty_ambition: 0.2 },
  wanderer:      { tradition_novelty: -0.3, courage_prudence: 0.3, revelation_discretion: 0.3 },
  love:          { loyalty_ambition: 0.4, sacrifice_survival: 0.4, mercy_ruthlessness: 0.3 },
  vengeance:     { mercy_ruthlessness: -0.4, courage_prudence: -0.2, loyalty_ambition: -0.3 },
  obsession:     { revelation_discretion: -0.3, honesty_cunning: -0.2, tradition_novelty: -0.2 },
  perfectionism: { preservation_transformation: -0.4, honesty_cunning: 0.2, courage_prudence: -0.2 },
  preservation:  { preservation_transformation: 0.4, tradition_novelty: 0.3, sacrifice_survival: 0.2 },
  freedom:       { tradition_novelty: -0.3, loyalty_ambition: -0.3, courage_prudence: 0.2 },
  humble:        { asceticism_extravagance: 0.3, loyalty_ambition: 0.2, courage_prudence: -0.1 },
  compassion:    { mercy_ruthlessness: 0.4, sacrifice_survival: 0.3, loyalty_ambition: 0.2 },
  military:      { mercy_ruthlessness: -0.2, courage_prudence: 0.3, loyalty_ambition: 0.3 },
  authority:     { loyalty_ambition: -0.2, asceticism_extravagance: -0.2, mercy_ruthlessness: -0.1 },
  knowledge:     { revelation_discretion: 0.4, honesty_cunning: 0.2, tradition_novelty: 0.1 },
  solitary:      { loyalty_ambition: -0.2, revelation_discretion: 0.2, courage_prudence: -0.1 },
  restless:      { tradition_novelty: -0.2, courage_prudence: 0.2, loyalty_ambition: -0.2 },
};

// ─── Divine Name Tables ───────────────────────────────────────────────────────

/** Maps hunger IDs to pools of adjectives for divine name generation */
const HUNGER_ADJECTIVES: Record<string, string[]> = {
  'hunger.gather':   ['Patient', 'Boundless', 'Sheltering', 'Endless', 'Steadfast'],
  'hunger.witness':  ['Knowing', 'Unveiled', 'Dreaming', 'Watching', 'Silent'],
  'hunger.reclaim':  ['Unyielding', 'Returning', 'Exacting', 'Sovereign', 'Reborn'],
  'hunger.reshape':  ['Unfinished', 'Burning', 'Relentless', 'Shaping', 'Inevitable'],
  'hunger.preserve': ['Holding', 'Eternal', 'Faithful', 'Guarding', 'Undying'],
  'hunger.wander':   ['Distant', 'Turning', 'Restless', 'Wandering', 'Unbound'],
  'hunger.sever':    ['Severing', 'Cutting', 'Stark', 'Final', 'Absolute'],
  'hunger.bind':     ['Weaving', 'Binding', 'Fixed', 'Anchoring', 'True'],
  'hunger.kindle':   ['Kindling', 'Bright', 'Rising', 'Living', 'Radiant'],
};

/** Maps origin tags to pools of nouns for divine name generation */
const ORIGIN_NOUNS: Record<string, string[]> = {
  caretaker: ['Shepherd', 'Ward', 'Keeper', 'Tender', 'Guardian'],
  scholar:   ['Archivist', 'Librarian', 'Lorekeeper', 'Warden', 'Reader'],
  leader:    ['General', 'Marshal', 'Warlord', 'Commander', 'Captain'],
  ruler:     ['Throne', 'Crown', 'Dominion', 'Sovereign', 'Regent'],
  healer:    ['Mender', 'Physician', 'Balm', 'Curative', 'Restorer'],
  wanderer:  ['Pilgrim', 'Wayfarer', 'Drifter', 'Horizon', 'Traveler'],
};

/** Fallback adjectives and nouns when no mapping matches */
const FALLBACK_ADJECTIVES = ['Ancient', 'Distant', 'Forgotten', 'Hidden', 'Timeless'];
const FALLBACK_NOUNS = ['One', 'Voice', 'Hand', 'Eye', 'Heart'];

// ─── Hunger → Map Size ───────────────────────────────────────────────────────

/** Maps hunger IDs to preferred map sizes. Wider hungers prefer larger worlds. */
const HUNGER_MAP_SIZES: Record<string, MapSizePreset> = {
  'hunger.gather':   'medium',
  'hunger.witness':  'large',
  'hunger.reclaim':  'medium',
  'hunger.reshape':  'large',
  'hunger.preserve': 'medium',
  'hunger.wander':   'epic',
  'hunger.sever':    'small',
  'hunger.bind':     'medium',
  'hunger.kindle':   'medium',
};

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

/** Count overlapping elements between two string arrays. */
function overlapScore(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter(x => setB.has(x)).length;
}

/** Score + jitter sort, return top N items. */
function scoredTopN<T>(
  items: T[],
  scoreFn: (item: T) => number,
  n: number,
  rng: () => number,
): T[] {
  const scored = items.map(item => ({
    item,
    score: scoreFn(item) + rng() * JITTER_WEIGHT,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map(s => s.item);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Filter origin fragments based on the chosen stirring image.
 * Scores by cluster overlap; returns exactly 3 fragments.
 */
export function filterOriginFragments(
  stirringImage: StirringImage,
  allOrigins: RemembranceFragment[],
  seed: number,
): RemembranceFragment[] {
  const rng = mulberry32(seed);
  const clusters = stirringImage.fragmentClusters;
  return scoredTopN(
    allOrigins,
    fragment => overlapScore(fragment.stirringClusters, clusters),
    FRAGMENT_SELECTION_COUNT,
    rng,
  );
}

/**
 * Filter drive fragments compatible with the chosen origin.
 * Scores by: origin-tag match in requiredOriginTags + stirring cluster overlap.
 * Returns exactly 3 fragments.
 */
export function filterDriveFragments(
  origin: RemembranceFragment,
  allDrives: RemembranceFragment[],
  seed: number,
): RemembranceFragment[] {
  const rng = mulberry32(seed);
  return scoredTopN(
    allDrives,
    drive => {
      // How many of the drive's required origin tags appear in the origin's tags?
      const tagMatch = drive.requiredOriginTags
        ? overlapScore(drive.requiredOriginTags, origin.tags)
        : 0;
      // Bonus for stirring cluster overlap with origin's own stirring clusters
      const clusterBonus = overlapScore(drive.stirringClusters, origin.stirringClusters) * 0.5;
      return tagMatch + clusterBonus;
    },
    FRAGMENT_SELECTION_COUNT,
    rng,
  );
}

/**
 * Filter hungers based on combined origin + drive hunger weights.
 * Returns 2–3 hungers sorted by combined score.
 */
export function filterHungers(
  origin: RemembranceFragment,
  drive: RemembranceFragment,
  allHungers: HungerDefinition[],
  seed: number,
): HungerDefinition[] {
  const rng = mulberry32(seed);

  // Build combined hunger weight map
  const combined: Record<string, number> = {};
  for (const [id, w] of Object.entries(origin.hungerWeights)) {
    combined[id] = (combined[id] ?? 0) + (w ?? 0);
  }
  for (const [id, w] of Object.entries(drive.hungerWeights)) {
    combined[id] = (combined[id] ?? 0) + (w ?? 0);
  }

  const count = 2 + Math.floor(rng() * 2); // 2 or 3
  return scoredTopN(
    allHungers,
    hunger => combined[hunger.id] ?? 0,
    count,
    rng,
  );
}

/**
 * Select the best prose variant for a hunger based on drive tags.
 * Falls back to the first variant if no drive tag matches any variant.
 */
export function selectHungerProse(
  hunger: HungerDefinition,
  drive: RemembranceFragment,
): string {
  const driveTagSet = new Set(drive.tags);
  const match = hunger.proseVariants.find(v => driveTagSet.has(v.driveTag));
  return (match ?? hunger.proseVariants[0]).prose;
}

/**
 * Build an AxiologicalProfile from fragment tags + seeded noise.
 * Maps known tags to value pair biases, then adds seeded jitter.
 */
export function buildPersonalitySeed(
  origin: RemembranceFragment,
  drive: RemembranceFragment,
  hunger: HungerDefinition,
  seed: number,
): AxiologicalProfile {
  const rng = mulberry32(seed);

  // Start with zeroed profile
  const biases: Record<ValuePair, number> = {} as Record<ValuePair, number>;
  for (const pair of VALUE_PAIRS) {
    biases[pair] = 0;
  }

  // Accumulate biases from all tags across origin, drive, and hunger affinities
  const allTags = [...origin.tags, ...drive.tags];
  for (const tag of allTags) {
    const tagBias = TAG_BIASES[tag];
    if (tagBias) {
      for (const [pair, delta] of Object.entries(tagBias) as [ValuePair, number][]) {
        biases[pair] = (biases[pair] ?? 0) + delta;
      }
    }
  }

  // Normalize biases and add seeded noise, clamping to [-1, 1]
  const profile = {} as AxiologicalProfile;
  for (const pair of VALUE_PAIRS) {
    const bias = Math.max(-TAG_BIAS_MAGNITUDE, Math.min(TAG_BIAS_MAGNITUDE, biases[pair]));
    const noise = (rng() * 2 - 1) * PERSONALITY_NOISE_MAGNITUDE;
    profile[pair] = Math.max(-1, Math.min(1, bias + noise));
  }

  return profile;
}

/**
 * Generate a divine name in "The [Adjective] [Noun]" format.
 * Adjective drawn from hunger pool; noun drawn from origin tag pool.
 * Deterministic with the same seed.
 */
export function generateDivineName(
  hunger: HungerDefinition,
  origin: RemembranceFragment,
  seed: number,
): string {
  const rng = mulberry32(seed);

  const adjectives = HUNGER_ADJECTIVES[hunger.id] ?? FALLBACK_ADJECTIVES;
  const adjective = adjectives[Math.floor(rng() * adjectives.length)];

  // Find noun pool from first matching origin tag
  let nouns = FALLBACK_NOUNS;
  for (const tag of origin.tags) {
    if (ORIGIN_NOUNS[tag]) {
      nouns = ORIGIN_NOUNS[tag];
      break;
    }
  }
  const noun = nouns[Math.floor(rng() * nouns.length)];

  return `The ${adjective} ${noun}`;
}

/**
 * Derive a full CosmologyProfile from the ascendant's identity.
 * Primary sphere gets 0.25, secondary gets 0.20, remaining 10 spheres share
 * the rest evenly (≈ 0.055 each). Always sums to exactly 1.0.
 */
export function deriveCosmologyFromIdentity(identity: {
  sphereAlignment: SphereAlignment;
  mortalTags: string[];
  hungerId: string;
}): CosmologyProfile {
  const { primary, secondary } = identity.sphereAlignment;
  const totalSpheres = SPHERE_NAMES.length; // 12
  const remainder = 1.0 - COSMOLOGY_PRIMARY_WEIGHT - COSMOLOGY_SECONDARY_WEIGHT;
  const otherCount = totalSpheres - 2;
  const baseWeight = remainder / otherCount;

  const profile = {} as CosmologyProfile;
  for (const sphere of SPHERE_NAMES) {
    if (sphere === primary) {
      profile[sphere] = COSMOLOGY_PRIMARY_WEIGHT;
    } else if (sphere === secondary) {
      profile[sphere] = COSMOLOGY_SECONDARY_WEIGHT;
    } else {
      profile[sphere] = baseWeight;
    }
  }
  return profile;
}

/**
 * Map a hunger ID to a MapSizePreset recommendation.
 * Hungers that drive exploration prefer larger worlds.
 */
export function deriveMapSize(hungerId: string): MapSizePreset {
  return HUNGER_MAP_SIZES[hungerId] ?? 'medium';
}
