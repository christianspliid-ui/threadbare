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

// ─── Foundation-Keyed Names ──────────────────────────────────────
// These set the broad cultural naming tradition.

export const FOUNDATION_NAMES: Record<string, string[]> = {
  chaos: [
    'Ryx', 'Zephka', 'Torva', 'Jaxis', 'Ylura', 'Krenn', 'Shivex',
    'Azra', 'Flick', 'Bressa', 'Nyx', 'Quirra', 'Vendal', 'Ossa',
    'Tavik', 'Ildra', 'Mokk', 'Sylene', 'Haxx', 'Druja',
  ],
  order: [
    'Aldric', 'Seren', 'Tormund', 'Elara', 'Baldur', 'Callista',
    'Hemming', 'Valda', 'Osric', 'Maren', 'Geralt', 'Linnea',
    'Edric', 'Thessa', 'Conrad', 'Astrid', 'Sigurd', 'Helena',
    'Leofric', 'Brenna',
  ],
  light: [
    'Solenne', 'Aurel', 'Liora', 'Cael', 'Luminara', 'Davin',
    'Alethia', 'Sevrin', 'Ilina', 'Beacon', 'Clariel', 'Orin',
    'Asha', 'Gallant', 'Miriel', 'Caelen', 'Adara', 'Lucen',
    'Theron', 'Suria',
  ],
  darkness: [
    'Vesper', 'Morthane', 'Lilith', 'Ashke', 'Corvane', 'Noctis',
    'Umbra', 'Ravka', 'Selene', 'Grigor', 'Morvyn', 'Hesper',
    'Dhalia', 'Cinder', 'Kethra', 'Luthane', 'Shade', 'Ravenna',
    'Bael', 'Sorcha',
  ],
};

// ─── Sphere-Keyed Names ─────────────────────────────────────────
// These add domain-specific flavor to the foundation base.

export const SPHERE_NAMES_POOL: Record<string, string[]> = {
  force: [
    'Ironhide', 'Braga', 'Riven', 'Thane', 'Korr', 'Wulfgar',
    'Skara', 'Varric', 'Haldra', 'Grint', 'Sable', 'Fenrik',
    'Tyra', 'Bron', 'Kael-Mar',
  ],
  matter: [
    'Delver', 'Petra', 'Anvik', 'Quarren', 'Cobalt', 'Marl',
    'Ingrid', 'Tarn', 'Basalt', 'Henna', 'Slatewood', 'Forren',
    'Odda', 'Cleft', 'Gneiss',
  ],
  energy: [
    'Volta', 'Pyrra', 'Strahl', 'Embra', 'Coronal', 'Flux',
    'Vittra', 'Galvyn', 'Seren', 'Arken', 'Kindra', 'Bolter',
    'Nimbus', 'Elysca', 'Whiteflash',
  ],
  life: [
    'Rowan', 'Linden', 'Briar', 'Fern', 'Hazel', 'Sylva',
    'Oren', 'Meadow', 'Celosia', 'Thorn', 'Wren', 'Yarrow',
    'Moss', 'Tansy', 'Alder',
  ],
  mind: [
    'Lexan', 'Cipher', 'Sage', 'Rune', 'Quill', 'Noema',
    'Dex', 'Lorica', 'Pensiv', 'Axton', 'Lograine', 'Mnemis',
    'Scrivell', 'Lucian', 'Aphra',
  ],
  spirit: [
    'Eidolon', 'Wraith', 'Somna', 'Reverie', 'Hallow', 'Whisper',
    'Seraphiel', 'Myst', 'Koda', 'Animus', 'Litany', 'Vigil',
    'Psalm', 'Requiem', 'Aethel',
  ],
  time: [
    'Epoch', 'Meridian', 'Solstice', 'Duskwell', 'Relic', 'Chronn',
    'Vestige', 'Hourglass', 'Dial', 'Aeon', 'Twillen', 'Yester',
    'Memento', 'Kairn', 'Perdure',
  ],
  entropy: [
    'Ashward', 'Decay', 'Wane', 'Corrode', 'Marrow', 'Attrith',
    'Erode', 'Blight', 'Rust', 'Hollow', 'Cinder', 'Scour',
    'Remnant', 'Tatter', 'Pallid',
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

  // Last resort
  const suffix = usedNames.size;
  const fallback = `Wanderer-${suffix}`;
  usedNames.add(fallback);
  return fallback;
}
