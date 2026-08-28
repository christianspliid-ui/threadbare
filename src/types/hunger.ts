/**
 * Hunger & Ascendant Lens Types
 *
 * A Hunger is the god's core drive — the obsessive lens through which they
 * perceive every mortal situation. The AscendantLens bundles a Hunger with
 * the god's mortal-era backstory to produce a unique narrative voice that
 * colors all meeting encounter prose.
 *
 * THR-1213 — this module is the **type layer only**. The twelve hunger
 * definitions live in exactly one place, `src/data/hunger-catalog.ts`; until
 * this ticket there were two `HUNGER_CATALOG` exports with the same symbol
 * name, different key schemes and different field sets, which is how a
 * lookup could silently miss for every god (THR-891). Types must not import
 * data, so the stub-lens builder that needed the catalog moved to
 * `src/engine/ascendantLens.ts` — the import direction is engine → data →
 * types, one way.
 */

import type { SphereName } from './index';
import type { SphereAlignment } from './influence';
import type { ReachDomain } from './traits';

// ─── Hunger IDs ──────────────────────────────────────────────────

/**
 * The 12 Hunger archetypes — each a different way a god relates to mortals.
 *
 * THR-891: this union carried 10 members while four other shipped surfaces
 * already spoke for 12 — the remembrance catalog the player actually picks
 * from (`src/data/hunger-catalog.ts`, with art for all twelve), the meeting
 * prose register (test-pinned in both directions), the Repertoire plan doc,
 * and the nudge-cards wiki page. `haunt` and `illuminate` were never missing
 * design; they were missing only from *this* list. Added rather than removed
 * from the others, because a god can already become either one.
 */
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
  | 'wander'
  | 'haunt'
  | 'illuminate';

/**
 * The persisted and authored spelling of a hunger id (`hunger.witness`).
 *
 * Derived from {@link HungerId}, never listed twice — a form the union does
 * not know is a compile error rather than a lookup that silently misses.
 * Saved worlds, the remembrance catalog's authored keys, the meeting prose
 * maps and the vignette resonance lists all speak this form; every consumer
 * that keys on a bare id goes through {@link toHungerId}.
 */
export type StoredHungerId = `hunger.${HungerId}`;

/**
 * Every live hunger id, in catalog order — the union's runtime witness.
 *
 * `satisfies` keeps it honest in both directions: a member the union does not
 * carry fails to compile, and {@link HUNGER_ID_SET} narrowing an unknown
 * string is the only place a string becomes a `HungerId`.
 */
export const HUNGER_IDS = [
  'gather',
  'witness',
  'preserve',
  'reshape',
  'reclaim',
  'consume',
  'sever',
  'kindle',
  'bind',
  'wander',
  'haunt',
  'illuminate',
] as const satisfies readonly HungerId[];

// ─── Resonance Tags ──────────────────────────────────────────────

/**
 * The closed thematic vocabulary shared by hunger tag lists, dilemma
 * emotional registers and drive tags (THR-1213 ruling 3).
 *
 * Before this union the same theme space was spelled in three unrelated
 * places with nothing closing it, and the dilemma reader compared hunger
 * *ids* against theme *tags* — disjoint vocabularies, so the resonance
 * weight fired zero times across all 167 shipped dilemmas (THR-1158).
 *
 * The member list is a **predicate, not a snapshot** (THR-688 rule A): it is
 * the union of every tag appearing in a hunger's `dilemmaResonanceTags`, a
 * dilemma's `emotionalRegister`, and a dilemma's `driveResonance`. Widen it
 * in the same PR as the content that needs a new theme — it is the
 * vocabulary authority, not a cage. Never reach for an untyped string.
 *
 * Note the four members carried by dilemma registers and by no hunger
 * (`compassion`, `desperation`, `devotion`, `nurturing`): they are real
 * themes, and their absence from every hunger list is the same
 * disjoint-vocabulary drift in miniature.
 *
 * The vocabulary has one authority — this array — and the type is derived from
 * it rather than maintained beside it.
 *
 * A runtime list is what lets an untyped tag source be narrowed instead of cast:
 * `AscendantIdentity.mortalTags` mixes real themes (`knowledge`, `devotion`) with
 * origin words that are not themes at all (`scholar`, `rural`, `recent`), so the
 * lens resolver has to *filter*, and a filter needs values (THR-1213 slice 2).
 */
export const RESONANCE_TAGS = [
  'ambition',
  'art',
  'belonging',
  'chains',
  'clarity',
  'community',
  'compassion',
  'conquest',
  'corruption',
  'covenant',
  'creation',
  'curiosity',
  'debt',
  'desperation',
  'devotion',
  'discovery',
  'domination',
  'dreams',
  'duty',
  'endurance',
  'escape',
  'exploration',
  'freedom',
  'grief',
  'growth',
  'horizon',
  'hunger',
  'independence',
  'inspiration',
  'investigation',
  'journey',
  'justice',
  'knowledge',
  'law',
  'legacy',
  'loss',
  'loyalty',
  'memory',
  'movement',
  'nurturing',
  'oath',
  'obligation',
  'observation',
  'obsession',
  'order',
  'passion',
  'patterns',
  'power',
  'presence',
  'protection',
  'rebellion',
  'remembrance',
  'restoration',
  'revelation',
  'revolution',
  'sacrifice',
  'secrets',
  'shelter',
  'solitude',
  'spark',
  'structure',
  'territory',
  'tradition',
  'transformation',
  'truth',
  'vengeance',
  'vision',
  'wonder',
] as const;

/** @see RESONANCE_TAGS — the value list this union is derived from. */
export type ResonanceTag = typeof RESONANCE_TAGS[number];

/** Membership set for {@link toResonanceTags}. */
const RESONANCE_TAG_SET: ReadonlySet<string> = new Set<string>(RESONANCE_TAGS);

/**
 * Narrow an untyped tag list to the closed resonance vocabulary — the single
 * place a `string[]` becomes `ResonanceTag[]` (the `toHungerId` pattern).
 *
 * Fail-soft (NFP #4): an unknown tag is dropped, never thrown on. Dropping is
 * the honest reading — a tag outside the vocabulary cannot overlap anything in
 * it, so keeping it could only ever contribute zero.
 */
export function toResonanceTags(tags: readonly string[]): ResonanceTag[] {
  return tags.filter((t): t is ResonanceTag => RESONANCE_TAG_SET.has(t));
}

// ─── Hunger Definition ───────────────────────────────────────────

/** One Hunger-reveal passage, keyed by the Drive tag that triggers it. */
export interface HungerProseVariant {
  /** Which Drive tag triggers this variant */
  driveTag: string;
  /** The Hunger reveal passage */
  prose: string;
}

/** One shape a god's court can take, offered at the Hunger beat. */
export interface CourtOption {
  courtType: 'high_house' | 'circle' | 'web' | 'abyss';
  /** Evocative description of this court shape */
  prose: string;
  isDefault: boolean;
}

/**
 * One Hunger, whole — the field union of the two catalogs THR-1213 merged.
 *
 * The remembrance half (`imageAssetPath` … `ascendantLens`) speaks to the
 * player in second person at the Hunger beat; the engine half
 * (`perceptionStyle` … `dilemmaResonanceTags`) speaks about the god in third
 * person to the meeting prose. Both halves ship verbatim from the two
 * pre-merge sources; the interface is **total**, so an entry missing a field
 * is a build error rather than a runtime hole (the documented build-time
 * exception to NFP #4).
 */
export interface HungerDefinition {
  /** Unique hunger identifier — the bare canonical form */
  id: HungerId;
  /** Display name */
  name: string;

  // ── Remembrance surface (the Hunger beat the player picks from) ──
  /** Cosmic abstract art */
  imageAssetPath: string;
  /** Reveal passages, one per Drive tag */
  proseVariants: HungerProseVariant[];
  /** One-line mandate summary */
  mandateDirection: string;
  /** Default + alternative court shape */
  courtOptions: [CourtOption, CourtOption];
  sphereAlignment: SphereAlignment;
  domainAffinities: Partial<Record<ReachDomain, number>>;
  /** Second-person voice — how the player is told they see mortals */
  ascendantLens: {
    perceptionStyle: string;
    emotionalTone: string;
  };

  // ── Engine surface (the narrator's voice, and the scoring inputs) ──
  /** How this god perceives mortals — the narrative filter on every scene */
  perceptionStyle: string;
  /** Emotional coloring of all prose generated under this hunger */
  emotionalTone: string;
  /** Reach domains this Hunger draws toward when generating candidates */
  candidateReachBias: readonly string[];
  /** Emotional registers this Hunger resonates with in dilemma scoring */
  dilemmaResonanceTags: readonly ResonanceTag[];
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
  driveTags: readonly ResonanceTag[];
  /** How long ago the god ascended — affects prose tone */
  timeSinceAscension: 'recent' | 'ancient';
  /** The god's mortal name — for rare intimate surfacing */
  mortalName: string;
}

// ─── Id Bridge ───────────────────────────────────────────────────

/** Every live hunger id, for narrowing a stored identity id. */
const HUNGER_ID_SET: ReadonlySet<string> = new Set<string>(HUNGER_IDS);

/** The prefix the remembrance catalog stores its ids under (`hunger.witness`). */
const STORED_HUNGER_PREFIX = 'hunger.';

/**
 * Narrow a stored `AscendantIdentity.hungerId` to a live {@link HungerId}.
 *
 * The remembrance catalog stores dotted ids (`hunger.witness`); every
 * `HungerId` consumer keys on the bare id (`witness`). Call sites used to
 * bridge the two with `as HungerId`, which type-checks and is false — the
 * dotted string never equals a bare key, so `HUNGER_UNIQUE_CARDS` lookups
 * silently missed for *every* god and no hunger unique was ever dealt
 * (THR-891). This is the one place that conversion happens.
 *
 * Accepts either form so a legacy bare id keeps working. Fail-soft (NFP #4):
 * an unknown id returns `undefined` — an absent hunger, which callers already
 * handle — rather than throwing inside the encounter-stage build.
 */
export function toHungerId(storedId: string | undefined | null): HungerId | undefined {
  if (!storedId) return undefined;
  const bare = storedId.startsWith(STORED_HUNGER_PREFIX)
    ? storedId.slice(STORED_HUNGER_PREFIX.length)
    : storedId;
  return HUNGER_ID_SET.has(bare) ? (bare as HungerId) : undefined;
}

/**
 * Derive the stored spelling from a live {@link HungerId}.
 *
 * The inverse of {@link toHungerId}, and the only place the dotted form is
 * built — the catalog stores the bare id once and every dotted key (saves,
 * prose maps, vignette resonance, the remembrance weight tables) is derived
 * from it rather than authored a second time.
 */
export function toStoredHungerId(id: HungerId): StoredHungerId {
  return `${STORED_HUNGER_PREFIX}${id}` as StoredHungerId;
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

/**
 * The sphere → hunger default map and `buildStubAscendantLens` moved to
 * `src/engine/ascendantLens.ts` in THR-1213: they need the catalog, and the
 * catalog is data. Import them from there.
 */
