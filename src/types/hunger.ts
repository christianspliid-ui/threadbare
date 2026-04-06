/**
 * Hunger & Ascendant Lens Types
 *
 * A Hunger is the god's core drive — the obsessive lens through which they
 * perceive every mortal situation. The AscendantLens bundles a Hunger with
 * the god's mortal-era backstory to produce a unique narrative voice that
 * colors all meeting encounter prose.
 *
 * Until the Remembrance Flow ships, `buildStubAscendantLens` provides
 * defaults derived from the current archetype system's sphere pair.
 */

import type { CreationSphereName, SphereName } from './index';
import type { ReachDomain } from './traits';

// ─── Hunger IDs ──────────────────────────────────────────────────

/** The 10 Hunger archetypes — each a different way a god relates to mortals */
export type HungerId =
  | 'gather'
  | 'witness'
  | 'preserve'
  | 'reshape'
  | 'reclaim'
  | 'consume'
  | 'sever'
  | 'kindle'
  | 'bind'
  | 'wander';

// ─── Hunger Definition ───────────────────────────────────────────

export interface HungerDefinition {
  /** Unique hunger identifier */
  id: HungerId;
  /** Display name */
  name: string;
  /** How this god perceives mortals — the narrative filter on every scene */
  perceptionStyle: string;
  /** Emotional coloring of all prose generated under this hunger */
  emotionalTone: string;
  /** Reach domains this Hunger draws toward when generating candidates */
  candidateReachBias: readonly string[];
  /** Emotional registers this Hunger resonates with in dilemma scoring */
  dilemmaResonanceTags: readonly string[];
}

// ─── Ascendant Lens ──────────────────────────────────────────────

/**
 * The god's complete narrative identity — consumed by every piece of
 * meeting prose. Combines the cosmic Hunger with mortal-era backstory.
 */
export interface AscendantLens {
  /** The god's core drive */
  hunger: HungerDefinition;
  /** What the god was before ascension — shepherd, scholar, ruler, etc. */
  mortalOrigin: string;
  /** The obsession that survived ascension */
  drive: string;
  /** Drive's emotional core for resonance matching */
  driveTags: readonly string[];
  /** How long ago the god ascended — affects prose tone */
  timeSinceAscension: 'recent' | 'ancient';
  /** The god's mortal name — for rare intimate surfacing */
  mortalName: string;
}

// ─── Hunger Catalog ──────────────────────────────────────────────

/** All 10 Hunger definitions — the complete catalog */
export const HUNGER_CATALOG: readonly HungerDefinition[] = [
  {
    id: 'gather',
    name: 'Gather',
    perceptionStyle:
      'reads the threads of belonging — who protects, who needs shelter, who holds a community together without being seen',
    emotionalTone: 'warmth edged with possessiveness',
    candidateReachBias: ['heart', 'stone', 'gold'],
    dilemmaResonanceTags: ['belonging', 'protection', 'community', 'sacrifice', 'loyalty', 'shelter'],
  },
  {
    id: 'witness',
    name: 'Witness',
    perceptionStyle:
      'sees what is hidden — lies behind smiles, patterns beneath chaos, the secret architecture of every situation',
    emotionalTone: 'detached curiosity sharpening into hunger',
    candidateReachBias: ['eye', 'shadow', 'veil'],
    dilemmaResonanceTags: ['secrets', 'knowledge', 'observation', 'truth', 'patterns', 'investigation'],
  },
  {
    id: 'preserve',
    name: 'Preserve',
    perceptionStyle:
      'feels the weight of what has been lost — every crack in a wall, every forgotten name, every story fading into silence',
    emotionalTone: 'grief transmuted into iron determination',
    candidateReachBias: ['stone', 'star', 'veil'],
    dilemmaResonanceTags: ['loss', 'memory', 'restoration', 'tradition', 'endurance', 'legacy'],
  },
  {
    id: 'reshape',
    name: 'Reshape',
    perceptionStyle:
      'sees potential — not what is, but what could be, if the right pressure were applied at the right moment',
    emotionalTone: 'visionary impatience',
    candidateReachBias: ['iron', 'heart', 'eye'],
    dilemmaResonanceTags: ['transformation', 'ambition', 'vision', 'power', 'revolution', 'creation'],
  },
  {
    id: 'reclaim',
    name: 'Reclaim',
    perceptionStyle:
      'perceives injustice like a wound — stolen things, broken oaths, debts unpaid, the gap between what is and what should have been',
    emotionalTone: 'cold fury beneath careful patience',
    candidateReachBias: ['iron', 'shadow', 'star'],
    dilemmaResonanceTags: ['justice', 'vengeance', 'restoration', 'duty', 'oath', 'debt'],
  },
  {
    id: 'consume',
    name: 'Consume',
    perceptionStyle:
      'senses vitality — strength waiting to be absorbed, territory waiting to be claimed, power waiting to be gathered',
    emotionalTone: 'appetite wearing the mask of purpose',
    candidateReachBias: ['iron', 'gold', 'shadow'],
    dilemmaResonanceTags: ['power', 'conquest', 'growth', 'hunger', 'domination', 'territory'],
  },
  {
    id: 'sever',
    name: 'Sever',
    perceptionStyle:
      'sees chains — obligations, debts, loyalties, traditions, every invisible thread binding a person to something they did not choose',
    emotionalTone: 'fierce tenderness for the trapped',
    candidateReachBias: ['shadow', 'veil', 'star'],
    dilemmaResonanceTags: ['freedom', 'rebellion', 'independence', 'chains', 'escape', 'solitude'],
  },
  {
    id: 'kindle',
    name: 'Kindle',
    perceptionStyle:
      'perceives the spark in others — dormant talent, suppressed passion, the ember of something extraordinary waiting for a breath of air',
    emotionalTone: 'infectious enthusiasm verging on recklessness',
    candidateReachBias: ['heart', 'star', 'eye'],
    dilemmaResonanceTags: ['creation', 'inspiration', 'passion', 'art', 'movement', 'spark'],
  },
  {
    id: 'bind',
    name: 'Bind',
    perceptionStyle:
      'sees the architecture of obligation — who owes what to whom, where promises are kept and where they fray, the invisible scaffolding of civilization',
    emotionalTone: 'the serenity of someone who believes order is love',
    candidateReachBias: ['gold', 'eye', 'heart'],
    dilemmaResonanceTags: ['order', 'law', 'covenant', 'structure', 'loyalty', 'obligation'],
  },
  {
    id: 'wander',
    name: 'Wander',
    perceptionStyle:
      'notices what others walk past — the path nobody takes, the sound from behind the locked door, the horizon line that promises something uncharted',
    emotionalTone: 'restless joy in the unknown',
    candidateReachBias: ['veil', 'eye', 'star'],
    dilemmaResonanceTags: ['journey', 'discovery', 'curiosity', 'exploration', 'wonder', 'horizon'],
  },
] as const;

// ─── Sphere → Hunger Mapping ─────────────────────────────────────

/** Default Hunger for each Creation Sphere — used by `buildStubAscendantLens` */
const SPHERE_TO_HUNGER: Record<CreationSphereName, HungerId> = {
  force: 'reshape',
  matter: 'bind',
  energy: 'kindle',
  life: 'gather',
  mind: 'witness',
  spirit: 'preserve',
  time: 'preserve',
  entropy: 'consume',
};

/** Default fallback Hunger when sphere doesn't map */
const FALLBACK_HUNGER_ID: HungerId = 'gather';

// ─── Stub Builder ────────────────────────────────────────────────

/**
 * Build a stub AscendantLens from sphere pair.
 * Used until the Remembrance Flow provides a player-authored lens.
 *
 * Maps the primary sphere to a default Hunger and fills in placeholder
 * mortal-origin data. The secondary sphere is currently unused but
 * reserved for future nuance.
 */
export function buildStubAscendantLens(
  primarySphere: CreationSphereName,
  _secondarySphere: CreationSphereName,
): AscendantLens {
  const hungerId = SPHERE_TO_HUNGER[primarySphere] ?? FALLBACK_HUNGER_ID;
  const hunger = HUNGER_CATALOG.find((h) => h.id === hungerId) ?? HUNGER_CATALOG[0];

  return {
    hunger,
    mortalOrigin: 'unknown',
    drive: 'a nameless yearning that survived the crossing',
    driveTags: [...hunger.dilemmaResonanceTags.slice(0, 3)],
    timeSinceAscension: 'ancient',
    mortalName: 'the Forgotten',
  };
}

// ─── Intent Derivation ──────────────────────────────────────────

/** Result of deriving intent from the Hunger lens. */
export interface DerivedIntent {
  primaryReach: ReachDomain;
  secondaryReach: ReachDomain;
  sphere: SphereName;
}

/**
 * Derive meeting encounter intent from the Ascendant's Hunger.
 *
 * The Hunger's `candidateReachBias` provides an ordered list of preferred
 * reaches. We pick primary and secondary from that list using a seeded
 * PRNG to add slight variety across meetings while staying on-theme.
 * The sphere comes from the ascendant's sphere alignment.
 *
 * NFP #3: Determinism — seeded PRNG ensures same seed = same result.
 */
export function deriveIntentFromHunger(
  lens: AscendantLens,
  ascendantSphere: SphereName,
  seed: number,
): DerivedIntent {
  const biasReaches = lens.hunger.candidateReachBias;

  // Simple seeded PRNG (same algorithm as meetingEncounter.ts)
  let s = seed;
  s = ((s << 5) - s + 0x48756e67) | 0; // salt: "Hung"
  const rng = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Pick primary from first two bias reaches (weighted toward first)
  const primaryIdx = rng() < 0.7 ? 0 : Math.min(1, biasReaches.length - 1);
  const primaryReach = biasReaches[primaryIdx] as ReachDomain;

  // Pick secondary from remaining bias reaches (avoiding primary)
  const remaining = biasReaches.filter((_, i) => i !== primaryIdx);
  const secondaryIdx = Math.floor(rng() * remaining.length);
  const secondaryReach = (remaining[secondaryIdx] ?? biasReaches[0]) as ReachDomain;

  return {
    primaryReach,
    secondaryReach,
    sphere: ascendantSphere,
  };
}
