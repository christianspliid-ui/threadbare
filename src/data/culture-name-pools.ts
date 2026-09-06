/**
 * Culture-Specific Name Pools
 *
 * Names keyed by foundation bias and creation sphere. When an agent belongs
 * to a culture, their name is drawn from the union of their culture's
 * foundation pool + primary sphere pool, with fallback to the generic list.
 *
 * Design: names are fantasy-original, avoiding real-world ethnic mapping.
 * Foundation sets the "feel" (structured vs wild vs luminous vs veiled),
 * sphere adds domain coloring (martial vs scholarly vs natural etc).
 */

import type { CulturePhoneticSignature } from '../types/culture';
import { PHONETIC_GENERATOR_ENABLED, PHONETIC_PRIMARY_CHANCE } from '../types/culture';
import { generatePhoneticName } from '../engine/culturePhonetics';

/** Patterns that must never appear as a final agent name (THR-456) */
export const WANDERER_FALLBACK_BANNED_PATTERNS: RegExp[] = [
  /^Wanderer-\d+$/,
  /^Elite of Lair /,
];

/** Fixed canon list used when all dynamic paths are exhausted (THR-456) */
const FATAL_FALLBACK_NAMES = [
  'Stranger of the Eastern Road',
  'Walker of the Unnamed Path',
  'Pilgrim of the Far Shore',
  'Wanderer of the Empty Hills',
  'Traveller Without Clan',
];

/**
 * Epithets that compose a distinct fallback name once both flat pools are spent.
 * Paired with a given name this yields GENERIC_NAMES × FALLBACK_EPITHETS distinct
 * results that still read as a person rather than a placeholder.
 */
const FALLBACK_EPITHETS = [
  'of the Eastern Road',
  'of the Unnamed Path',
  'of the Far Shore',
  'of the Empty Hills',
  'Without Clan',
];

/**
 * Synthesize a fallback name from GENERIC_NAMES with a deterministic ordinal,
 * ensuring the result is never a banned placeholder pattern — and never a name
 * the world is already using.
 *
 * THR-1420: this branch used to return `pool[index % pool.length]` without
 * consulting `usedNames`, so it was the one path in the picker that could hand
 * back an already-taken name. Its ordinal anchor is `usedNames.size`, which does
 * not advance when the colliding name is already in the set — so two mints that
 * reached this branch against the same world returned the *same* name by
 * construction. Every tier below now walks from the anchor and takes the first
 * candidate that is both unused and unbanned.
 */
function synthesizeFallbackName(index: number, usedNames: Set<string>): string {
  const isBanned = (name: string) => WANDERER_FALLBACK_BANNED_PATTERNS.some(p => p.test(name));

  // Tier 1: generic pool, anchored at the ordinal.
  for (let i = 0; i < GENERIC_NAMES.length; i++) {
    const pick = GENERIC_NAMES[(index + i) % GENERIC_NAMES.length];
    if (usedNames.has(pick) || isBanned(pick)) continue;
    return pick;
  }

  // Tier 2: the canon list.
  for (let i = 0; i < FATAL_FALLBACK_NAMES.length; i++) {
    const pick = FATAL_FALLBACK_NAMES[(index + i) % FATAL_FALLBACK_NAMES.length];
    if (usedNames.has(pick) || isBanned(pick)) continue;
    return pick;
  }

  // Tier 3: compose given name + epithet.
  for (let g = 0; g < GENERIC_NAMES.length; g++) {
    const given = GENERIC_NAMES[(index + g) % GENERIC_NAMES.length];
    for (let e = 0; e < FALLBACK_EPITHETS.length; e++) {
      const composed = `${given} ${FALLBACK_EPITHETS[(index + e) % FALLBACK_EPITHETS.length]}`;
      if (usedNames.has(composed) || isBanned(composed)) continue;
      return composed;
    }
  }

  // Every authored combination is spoken for. Returning a duplicate is worse than
  // returning a name nobody wrote, but the tick loop must never throw (NFP #4), so
  // hand back the anchored composition and accept the collision.
  return `${GENERIC_NAMES[index % GENERIC_NAMES.length]} ${FALLBACK_EPITHETS[index % FALLBACK_EPITHETS.length]}`;
}

// ─── Foundation-Keyed Names ──────────────────────────────────────
// These set the broad cultural naming tradition.

export const FOUNDATION_NAMES: Record<string, string[]> = {
  chaos: [
    'Ryx', 'Zephka', 'Torva', 'Jaxis', 'Ylura', 'Krenn', 'Shivex',
    'Azra', 'Flick', 'Bressa', 'Nyx', 'Quirra', 'Vendal', 'Ossa',
    'Tavik', 'Ildra', 'Mokk', 'Sylene', 'Haxx', 'Druja',
    'Vraxx', 'Skell', 'Turvane', 'Ziksa', 'Ekko', 'Draska', 'Qell', 'Marn',
  ],
  order: [
    'Aldric', 'Seren', 'Tormund', 'Elara', 'Baldur', 'Callista',
    'Hemming', 'Valda', 'Osric', 'Maren', 'Geralt', 'Linnea',
    'Edric', 'Thessa', 'Conrad', 'Astrid', 'Sigurd', 'Helena',
    'Leofric', 'Brenna',
    'Roderic', 'Ingmar', 'Cordelia', 'Halvard', 'Ansel', 'Bertrand', 'Sabina', 'Wulfram',
  ],
  light: [
    'Solenne', 'Aurel', 'Liora', 'Cael', 'Luminara', 'Davin',
    'Alethia', 'Sevrin', 'Ilina', 'Beacon', 'Clariel', 'Orin',
    'Asha', 'Gallant', 'Miriel', 'Caelen', 'Adara', 'Lucen',
    'Theron', 'Suria',
    'Serapha', 'Elowen', 'Castian', 'Aurin', 'Halcyon', 'Veren', 'Solara', 'Elior',
  ],
  darkness: [
    'Vesper', 'Morthane', 'Lilith', 'Ashke', 'Corvane', 'Noctis',
    'Umbra', 'Ravka', 'Selene', 'Grigor', 'Morvyn', 'Hesper',
    'Dhalia', 'Cinder', 'Kethra', 'Luthane', 'Shade', 'Ravenna',
    'Bael', 'Sorcha',
    'Mordecai', 'Nyssa', 'Draven', 'Corvus', 'Malka', 'Threnody', 'Ossric', 'Erebos',
  ],
};

// ─── Sphere-Keyed Names ─────────────────────────────────────────
// These add domain-specific flavor to the foundation base.

export const SPHERE_NAMES_POOL: Record<string, string[]> = {
  force: [
    'Ironhide', 'Braga', 'Riven', 'Thane', 'Korr', 'Wulfgar',
    'Skara', 'Varric', 'Haldra', 'Grint', 'Sable', 'Fenrik',
    'Tyra', 'Bron', 'Kael-Mar',
    'Torvald', 'Maulk', 'Ryza', 'Dolf', 'Grendan',
  ],
  matter: [
    'Delver', 'Petra', 'Anvik', 'Quarren', 'Cobalt', 'Marl',
    'Ingrid', 'Tarn', 'Basalt', 'Henna', 'Slatewood', 'Forren',
    'Odda', 'Cleft', 'Gneiss',
    'Corbel', 'Argile', 'Steda', 'Flintlock', 'Corben',
  ],
  energy: [
    'Volta', 'Pyrra', 'Strahl', 'Embra', 'Coronal', 'Flux',
    'Vittra', 'Galvyn', 'Seren', 'Arken', 'Kindra', 'Bolter',
    'Nimbus', 'Elysca', 'Whiteflash',
    'Ignis', 'Radia', 'Fulmen', 'Voltane', 'Sear',
  ],
  life: [
    'Rowan', 'Linden', 'Briar', 'Fern', 'Hazel', 'Sylva',
    'Oren', 'Meadow', 'Celosia', 'Thorn', 'Wren', 'Yarrow',
    'Moss', 'Tansy', 'Alder',
    'Sorrel', 'Vervain', 'Fennow', 'Cress', 'Elm',
  ],
  mind: [
    'Lexan', 'Cipher', 'Sage', 'Rune', 'Quill', 'Noema',
    'Dex', 'Lorica', 'Pensiv', 'Axton', 'Lograine', 'Mnemis',
    'Scrivell', 'Lucian', 'Aphra',
    'Codex', 'Glypha', 'Vellum', 'Syntar', 'Ponder',
  ],
  spirit: [
    'Eidolon', 'Wraith', 'Somna', 'Reverie', 'Hallow', 'Whisper',
    'Seraphiel', 'Myst', 'Koda', 'Animus', 'Litany', 'Vigil',
    'Psalm', 'Requiem', 'Aethel',
    'Threnos', 'Cantor', 'Orison', 'Shrive', 'Psalter',
  ],
  time: [
    'Epoch', 'Meridian', 'Solstice', 'Duskwell', 'Relic', 'Chronn',
    'Vestige', 'Hourglass', 'Dial', 'Aeon', 'Twillen', 'Yester',
    'Memento', 'Kairn', 'Perdure',
    'Gloaming', 'Antique', 'Waneth', 'Dusklen', 'Horolo',
  ],
  entropy: [
    'Ashward', 'Decay', 'Wane', 'Corrode', 'Marrow', 'Attrith',
    'Erode', 'Blight', 'Rust', 'Hollow', 'Cinder', 'Scour',
    'Remnant', 'Tatter', 'Pallid',
    'Moulder', 'Frayn', 'Ruinal', 'Slough', 'Wither',
  ],
};

// ─── Generic Fallback Names ─────────────────────────────────────
// Used when no culture is assigned, or all cultural names are exhausted.

export const GENERIC_NAMES: string[] = [
  'Kael', 'Mirael', 'Thorne', 'Lyssa', 'Dren', 'Isolde', 'Varn', 'Ashara',
  'Brynn', 'Dara', 'Fen', 'Gale', 'Hestia', 'Jorik', 'Kira', 'Morath',
  'Selwyn', 'Talia', 'Orrin', 'Ileska', 'Garren', 'Nieve', 'Aven', 'Cadel',
  'Dessi', 'Emrys', 'Fael', 'Hadren', 'Idris', 'Jessen', 'Kess', 'Larke',
  'Maddis', 'Nael', 'Ondra', 'Penn', 'Quade', 'Rill', 'Soren', 'Tam',
  'Veris', 'Wynn', 'Yael', 'Ziven', 'Ardin', 'Brel', 'Dorin', 'Eryn',
  'Genner', 'Hask', 'Innel', 'Jevra', 'Lirik', 'Nareth', 'Ovel', 'Perris',
  'Rask', 'Taven', 'Vessen', 'Wender', 'Xen', 'Corran', 'Essra', 'Feldin',
  'Jael', 'Lowen', 'Mav', 'Nesrin', 'Renn', 'Tarin', 'Gresh', 'Oswen',
  'Dellis', 'Kelven', 'Sareth', 'Allev', 'Brinne', 'Paven', 'Effra', 'Ixin',
  'Halven', 'Prewitt', 'Sannis', 'Dolan', 'Brisa', 'Corry', 'Feln', 'Marek',
  'Tovin', 'Sella', 'Rhoen', 'Casp', 'Delwyn', 'Nira', 'Perrin', 'Vann',
];

// ─── Settlement Name Fragments (Culture-Keyed) ─────────────────
// Roots and suffixes that get mixed into location name generation
// when the settlement sits in a culture's territory.

/** Culture-flavored name roots mixed into settlement naming. */
export const SETTLEMENT_ROOTS_BY_FOUNDATION: Record<string, string[]> = {
  chaos: ['Storm', 'Rift', 'Tangle', 'Wild', 'Clash', 'Fray', 'Rend', 'Flux'],
  order: ['Law', 'Pillar', 'Bastion', 'Warden', 'Charter', 'Edict', 'Ledger', 'Canon'],
  light: ['Dawn', 'Beacon', 'Radiance', 'Glory', 'Aureate', 'Halo', 'Lumen', 'Grace'],
  darkness: ['Dusk', 'Veil', 'Shade', 'Murk', 'Gloom', 'Umbral', 'Shroud', 'Pall'],
};

export const SETTLEMENT_ROOTS_BY_SPHERE: Record<string, string[]> = {
  force:   ['Hammer', 'Anvil', 'Shield', 'Blade', 'War', 'Iron', 'Steel', 'Gauntlet'],
  matter:  ['Quarry', 'Bedrock', 'Clay', 'Cobble', 'Slate', 'Mortar', 'Brick', 'Ore'],
  energy:  ['Spark', 'Ember', 'Blaze', 'Surge', 'Flash', 'Arc', 'Volt', 'Flare'],
  life:    ['Root', 'Bloom', 'Briar', 'Vine', 'Seed', 'Bower', 'Hazel', 'Verdant'],
  mind:    ['Tome', 'Cipher', 'Script', 'Quill', 'Lore', 'Sage', 'Index', 'Glyph'],
  spirit:  ['Prayer', 'Vesper', 'Hymn', 'Vigil', 'Wraith', 'Solace', 'Reverie', 'Omen'],
  time:    ['Sundial', 'Epoch', 'Relic', 'Dusk', 'Meridian', 'Hourglass', 'Vestige', 'Eld'],
  entropy: ['Ash', 'Rust', 'Blight', 'Hollow', 'Remnant', 'Char', 'Wither', 'Tatter'],
};

/** Culture-flavored suffixes for settlements. Foundation determines the suffix palette. */
export const SETTLEMENT_SUFFIXES_BY_FOUNDATION: Record<string, string[]> = {
  chaos: [' Sprawl', '-tangle', ' Wrack', '-break', '-clash', ' Scatter', '-rend'],
  order: ['-heim', '-gar', '-hall', '-stead', '-court', '-keep', '-law'],
  light: ['-haven', '-dawn', '-crest', '-watch', '-gleam', '-glow', '-grace'],
  darkness: ['-shade', '-veil', '-deep', '-murk', '-hollow', '-shroud', '-crypt'],
};

/**
 * Build culture-specific settlement name roots.
 * Returns foundation roots + sphere roots merged, or empty if no culture.
 */
export function buildSettlementCultureRoots(
  foundationBias: string,
  primarySphere: string,
): string[] {
  const foundationRoots = SETTLEMENT_ROOTS_BY_FOUNDATION[foundationBias] ?? [];
  const sphereRoots = SETTLEMENT_ROOTS_BY_SPHERE[primarySphere] ?? [];
  return [...foundationRoots, ...sphereRoots];
}

/**
 * Get culture-specific settlement suffixes, or empty if no culture.
 */
export function getSettlementCultureSuffixes(
  foundationBias: string,
): string[] {
  return SETTLEMENT_SUFFIXES_BY_FOUNDATION[foundationBias] ?? [];
}

// ─── Name Picker ────────────────────────────────────────────────

/**
 * Build a combined name pool for a culture identity.
 * Merges the foundation pool + primary sphere pool, deduplicating.
 */
export function buildCultureNamePool(
  foundationBias: string,
  primarySphere: string,
): string[] {
  const foundationPool = FOUNDATION_NAMES[foundationBias] ?? [];
  const spherePool = SPHERE_NAMES_POOL[primarySphere] ?? [];
  return [...new Set([...foundationPool, ...spherePool])];
}

/**
 * Pick an unused name from a culture's pool, falling back to the phonetic
 * generator (when a signature is provided), then generic names.
 *
 * Layered picker order:
 *   1. Phonetic generator (PHONETIC_PRIMARY_CHANCE chance to fire first)
 *   2. Curated pool (foundation + sphere) — anchor flavor
 *   3. Phonetic generator (if pool exhausted, and signature provided)
 *   4. Generic pool
 *   5. Wanderer-N last resort
 *
 * @param foundationBias - The culture's foundation (chaos/order/light/darkness)
 * @param primarySphere - The culture's first venerated sphere
 * @param rng - Seeded PRNG
 * @param usedNames - Set of already-assigned names (mutated: chosen name is added)
 * @param signature - Optional phonetic signature (THR-15)
 * @param cultureId - For tracing
 * @param tick - Current tick for tracing
 */
export function pickCulturalName(
  foundationBias: string,
  primarySphere: string,
  rng: () => number,
  usedNames: Set<string>,
  signature?: CulturePhoneticSignature,
  cultureId?: string,
  tick?: number,
): string {
  const hasSignature = PHONETIC_GENERATOR_ENABLED && signature != null && cultureId != null;

  // Phonetic-first: PHONETIC_PRIMARY_CHANCE of trying generator before curated pool
  if (hasSignature && rng() < PHONETIC_PRIMARY_CHANCE) {
    const name = generatePhoneticName(signature!, 'personal', rng, usedNames, cultureId!, tick ?? 0);
    if (name !== null) return name;
  }

  // Curated pool (foundation + sphere)
  const culturePool = buildCultureNamePool(foundationBias, primarySphere);
  const shuffled = [...culturePool].sort(() => rng() - 0.5);
  for (const name of shuffled) {
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }

  // Pool exhausted: fall through to phonetic generator
  if (hasSignature) {
    const name = generatePhoneticName(signature!, 'personal', rng, usedNames, cultureId!, tick ?? 0);
    if (name !== null) return name;
  }

  // Generic names
  const genericShuffled = [...GENERIC_NAMES].sort(() => rng() - 0.5);
  for (const name of genericShuffled) {
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }

  // Last resort — synthesize a fallback that passes the banned-pattern guard (THR-456)
  const index = usedNames.size;
  const fallback = synthesizeFallbackName(index, usedNames);
  usedNames.add(fallback);
  return fallback;
}
