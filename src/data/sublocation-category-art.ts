/**
 * Sublocation Category Art Registry (THR-638, sublocation batch — the last one)
 * — the plate that represents a sublocation on the surfaces a player opens.
 *
 * **Why category art rather than per-type art.** A seeded world holds 470
 * sublocation nodes by tick 60 spanning **33 distinct** `sublocationTypeId`
 * values, and the authored vocabulary across the repo is **135** and growing:
 * `settlementGenome/` mints type ids per settlement tier, sphere, reach and
 * archetype, so per-type coverage can never close — the same unbounded-producer
 * shape the artifact batch hit with procedurally minted items. The existing
 * `sublocation-concept-art.ts` table has 12 entries and covers **80 of those 470
 * nodes (17%)**; worse, its `tavern` entry matches *nothing* in a live world
 * (the genome seeds `inn`, not `tavern`), so a third of what it does define is
 * unreachable. Ten category plates cover **470/470**, and the count does not rot
 * as the genome grows.
 *
 * **The category axis already existed.** `SublocationTag` is a 10-value union in
 * `settlementGenome/types.ts` that the genome tables already declare per entry.
 * Inventing a parallel art taxonomy would have been a second vocabulary to drift
 * against it (the faction batch's lesson: look for the existing substrate
 * first), so the plates are keyed by that union and `SUBLOCATION_TYPE_CATEGORY`
 * is seeded from the genome's own declarations — a test pins every
 * single-tag id to the tag the genome declares, so this map cannot silently
 * contradict the engine.
 *
 * **Why the map is keyed by type id and not by `genomeTags`.** The tag is on the
 * node — `materialize.ts` writes `genomeTags` — which makes keying off it look
 * correct. It is populated for only **207 of 470** nodes (44%): 186 carry no
 * `genomeTags` key at all (they come from `guildSeeding`, `factionSeeding`,
 * `phaseSublocations` and `ensureSublocations`, none of which are genome passes)
 * and 77 more carry `genomeTags: []` because their genome entry declares no tag.
 * A tag-keyed registry would therefore have rendered 56% of the population blank
 * while its own tests passed — impediment #295's exact shape for a third time.
 * Tags are used only as a *forward-compatible fallback*: a future genome type id
 * this map has not learned yet still resolves through its declared tag.
 *
 * Per STYLE.md these are **Location**-class images (35mm wide, mid-distance,
 * slight low angle, Rembrandt side-light with torchlight accents), 16:9, one
 * sphere colour + form language per category so the categories separate at a
 * glance — see `CATEGORY_SPHERE_TINT`.
 *
 * `getSublocationArtUrl` is the single entry point for "what image represents
 * this sublocation?", so `resolveEntityVisual` and `LocationView` cannot drift
 * apart the way two parallel art maps do.
 *
 * NFP #1 (tunability): a new category is one row here plus one file; a new type
 *   id is one row in `SUBLOCATION_TYPE_CATEGORY`.
 * NFP #3 (determinism): pure lookup — same id ⇒ same path, every call.
 * NFP #4 (fail-soft): unknown or absent type id returns null and the caller
 *   renders its designed gradient/glyph tile. Never throws.
 */

import type { SublocationTag } from '../engine/settlementGenome/types';

/** Directory holding the category plates. */
const CATEGORY_ART_DIR = '/assets/sublocations/categories';

/**
 * One plate per `SublocationTag`. Exhaustive by type — adding a tag to the union
 * makes this object fail to compile until a plate is registered, which is the
 * point.
 */
export const SUBLOCATION_CATEGORY_ART: Record<SublocationTag, string> = {
  military: `${CATEGORY_ART_DIR}/military.jpg`,
  authority: `${CATEGORY_ART_DIR}/authority.jpg`,
  scholarly: `${CATEGORY_ART_DIR}/scholarly.jpg`,
  arcane: `${CATEGORY_ART_DIR}/arcane.jpg`,
  religious: `${CATEGORY_ART_DIR}/religious.jpg`,
  commerce: `${CATEGORY_ART_DIR}/commerce.jpg`,
  cultural: `${CATEGORY_ART_DIR}/cultural.jpg`,
  underworld: `${CATEGORY_ART_DIR}/underworld.jpg`,
  nature: `${CATEGORY_ART_DIR}/nature.jpg`,
  borderlands: `${CATEGORY_ART_DIR}/borderlands.jpg`,
};

/**
 * Sphere colour + form language painted into each plate, so the ten categories
 * are separable at a glance and a regenerated plate keeps its identity.
 * Documentation only — nothing reads this at runtime. Hexes are STYLE.md's.
 *
 * Commerce takes Matter's umber rather than Energy's gold deliberately: Order
 * gold is already spoken for by `authority`, and two gold plates would defeat
 * the point of tinting per category.
 */
export const CATEGORY_SPHERE_TINT: Record<SublocationTag, string> = {
  military: '#ff4444',     // Force — sharp directional streaks, impact radiants
  authority: '#d4af37',    // Order — geometric grids and tessellations
  scholarly: '#2288ff',    // Mind — neural dendrites, concentric rings
  arcane: '#aa44dd',       // Spirit — ascending wisps, ethereal ribbons
  religious: '#ffeb99',    // Light — expanding aureoles and radiant beams
  commerce: '#8b6b4a',     // Matter — crystalline lattices, hexagonal facets
  cultural: '#ff9933',     // Time — concentric ripples, overlapping echoes
  underworld: '#4a3a8a',   // Darkness — absorbing voids with rim-glow
  nature: '#00cc55',       // Life — organic branching: veins, roots, mycelium
  borderlands: '#5a8a7a',  // Entropy — fracturing patterns, scattering particles
};

/**
 * Every sublocation type id authored anywhere in the repo, mapped to the one
 * category whose plate represents it.
 *
 * Keys are **normalised** — the `sublocation-type.` prefix stripped — because
 * content writes both forms: the genome and most encounters write
 * `sublocation-type.tavern` while a dozen encounter context specs write bare
 * `workshop` / `shrine` / `court`. Normalising at the lookup means neither form
 * is silently unresolvable.
 *
 * Where the genome declares exactly one tag for an id, that tag is used verbatim
 * and `sublocationCategoryArt.test.ts` pins it — this map is not free to
 * disagree with the engine. Multi-tag ids are where art-direction judgment
 * lives, and the choice is the more visually specific of the two (a
 * `fighting-pit` tagged `military,underworld` reads as underworld; a
 * `black-market` tagged `commerce,underworld` likewise).
 */
export const SUBLOCATION_TYPE_CATEGORY: Record<string, SublocationTag> = {
  // ── Commerce — markets, trade, craft, industry, storage ──
  'inn': 'commerce',
  'market-stall': 'commerce',
  'market-district': 'commerce',
  'market-square': 'commerce',
  'market': 'commerce',
  'stone-market': 'commerce',
  'grand-bazaar': 'commerce',
  'counting-house': 'commerce',
  'customs-house': 'commerce',
  'exchange': 'commerce',
  'harbor': 'commerce',
  'wharf': 'commerce',
  'warehouse': 'commerce',
  'granary': 'commerce',
  'vault': 'commerce',
  'manufactory': 'commerce',
  'mason-yard': 'commerce',
  'smelter': 'commerce',
  'workshop': 'commerce',
  'forge': 'commerce',
  'master-forge': 'commerce',
  'mine': 'commerce',
  'mine-entrance': 'commerce',
  'guild-hall': 'commerce',
  'guildhall': 'commerce',
  'guild-main': 'commerce',
  'guild_chapter': 'commerce',
  'merchant-prince-hall': 'commerce',

  // ── Authority — rule, law, seats of power, confinement ──
  'town-hall': 'authority',
  'throne-room': 'authority',
  'palace-keep': 'authority',
  'high-court': 'authority',
  'court': 'authority',
  'great-hall': 'authority',
  'courthouse': 'authority',
  'embassy': 'authority',
  'estate': 'authority',
  'jail': 'authority',
  'prison': 'authority',
  'dungeon': 'authority',
  'faction-hall': 'authority',

  // ── Military — walls, watch, arms, war ──
  'barracks': 'military',
  'royal-guard-quarters': 'military',
  'garrison': 'military',
  'gatehouse': 'military',
  'city-walls': 'military',
  'watchtower': 'military',
  'beacon-tower': 'military',
  'scout-post': 'military',
  'armory': 'military',
  'smithy': 'military',
  'arena': 'military',
  'proving-ground': 'military',
  'siege-workshop': 'military',
  'siege-stores': 'military',
  'reinforced-keep': 'military',
  'war-council': 'military',

  // ── Scholarly — books, records, observation, study ──
  'library': 'scholarly',
  'archive': 'scholarly',
  'scriptorium': 'scholarly',
  'chronicle-hall': 'scholarly',
  'academy': 'scholarly',
  'study': 'scholarly',
  'observatory': 'scholarly',
  'restricted-wing': 'scholarly',
  'whispering-stacks': 'scholarly',
  'research_circle': 'scholarly',

  // ── Arcane — wrought magic, nexuses, divination ──
  'arcane-sanctum': 'arcane',
  'arcane-council-chamber': 'arcane',
  'oracle-chamber': 'arcane',
  'divination-tent': 'arcane',
  'power-nexus': 'arcane',
  'convergence-chamber': 'arcane',
  'resonance-anvil': 'arcane',
  'resonance-core': 'arcane',
  'ore-sanctum': 'arcane',
  'ward-stones': 'arcane',
  'standing-stones': 'arcane',
  'stone-circle': 'arcane',
  'lightning-rod': 'arcane',
  'lightning-garden': 'arcane',
  'mirror-garden': 'arcane',
  'veil-threshold': 'arcane',
  'shattered-ground': 'arcane',
  'echo-chamber': 'arcane',
  'dim-pool': 'arcane',

  // ── Religious — temples, shrines, rites, the dead ──
  'temple': 'religious',
  'temple-quarter': 'religious',
  'cathedral': 'religious',
  'cloister': 'religious',
  'shrine': 'religious',
  'sacred-shrine': 'religious',
  'ancestor-shrine': 'religious',
  'beacon-shrine': 'religious',
  'forge-shrine': 'religious',
  'shadow-shrine': 'religious',
  'storm-shrine': 'religious',
  'spirit-house': 'religious',
  'pilgrim-quarter': 'religious',
  'pilgrims-pool': 'religious',
  'crypt': 'religious',
  'boneyard': 'religious',
  'bone-chapel': 'religious',
  'bone-circle': 'religious',
  'burial-mound': 'religious',
  'bloodstone-altar': 'religious',
  'hospice': 'religious',
  'plague-ward': 'religious',

  // ── Cultural — gathering, festival, performance, the commons ──
  'tavern': 'cultural',
  'tavern-common': 'cultural',
  'theater': 'cultural',
  'festival-ground': 'cultural',
  'courtyard': 'cultural',
  'debate-hall': 'cultural',
  'counselor-hall': 'cultural',
  'clocktower': 'cultural',
  'sundial-square': 'cultural',
  'sundial-garden': 'cultural',
  'well-fountain': 'cultural',

  // ── Underworld — crime, smuggling, spycraft, hidden dealings ──
  'thieves-guild': 'underworld',
  'smugglers-den': 'underworld',
  'smuggler-den': 'underworld',
  'black-market': 'underworld',
  'gambling-den': 'underworld',
  'fighting-pit': 'underworld',
  'whispering-den': 'underworld',
  'hidden-court': 'underworld',
  'hidden-passage': 'underworld',
  'spy-network': 'underworld',
  'intelligence-bureau': 'underworld',

  // ── Nature — growing things, water, cave, grove ──
  'garden': 'nature',
  'herb-garden': 'nature',
  'herbalist-hut': 'nature',
  'plague-garden': 'nature',
  'conservatory': 'nature',
  'ancient-grove': 'nature',
  'spirit-grove': 'nature',
  'healing-house': 'nature',
  'healing-spring': 'nature',
  'source-grotto': 'nature',
  'underground-pool': 'nature',
  'deep-gallery': 'nature',
  'mushroom-circle': 'nature',
  'beast-pen': 'nature',
  'wilderness': 'nature',

  // ── Borderlands — frontier, waypoint, ruin, the displaced ──
  'caravan-rest': 'borderlands',
  'caravanserai': 'borderlands',
  'refugee-quarter': 'borderlands',
  'ruins': 'borderlands',
  'ruin': 'borderlands',
  'hut': 'borderlands',
};

/**
 * Strip the `sublocation-type.` prefix content writes inconsistently, so both
 * `sublocation-type.tavern` and bare `tavern` hit the same row.
 */
export function normalizeSublocationTypeId(raw: string): string {
  return raw.startsWith('sublocation-type.')
    ? raw.slice('sublocation-type.'.length)
    : raw;
}

/**
 * Resolve a sublocation type id (plus its node's `genomeTags`, when available)
 * to a category.
 *
 * Tiers: the authored type map first — it is the only tier that covers the whole
 * live population — then the node's first declared genome tag, which keeps a
 * type id this map has not learned yet from falling all the way through.
 *
 * @param sublocationTypeId either `sublocation-type.x` or bare `x`
 * @param genomeTags        the node's `genomeTags` property, if present
 */
export function getSublocationCategory(
  sublocationTypeId: string | null | undefined,
  genomeTags?: readonly string[] | null,
): SublocationTag | null {
  if (typeof sublocationTypeId === 'string' && sublocationTypeId !== '') {
    const mapped = SUBLOCATION_TYPE_CATEGORY[normalizeSublocationTypeId(sublocationTypeId)];
    if (mapped) return mapped;
  }
  if (Array.isArray(genomeTags)) {
    for (const tag of genomeTags) {
      if (tag in SUBLOCATION_CATEGORY_ART) return tag as SublocationTag;
    }
  }
  return null;
}

/** The plate for a category, or null when the category is not one of the ten. */
export function getSublocationCategoryArtUrl(
  category: string | null | undefined,
): string | null {
  if (typeof category !== 'string' || !(category in SUBLOCATION_CATEGORY_ART)) return null;
  return SUBLOCATION_CATEGORY_ART[category as SublocationTag];
}

/**
 * The single answer to "what image represents this sublocation?".
 *
 * @param sublocationTypeId the node's `sublocationTypeId` property
 * @param genomeTags        the node's `genomeTags` property, if present
 */
export function getSublocationArtUrl(
  sublocationTypeId: string | null | undefined,
  genomeTags?: readonly string[] | null,
): string | null {
  return getSublocationCategoryArtUrl(getSublocationCategory(sublocationTypeId, genomeTags));
}
