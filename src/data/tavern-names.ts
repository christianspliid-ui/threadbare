/**
 * Tavern Name Generation — culture-aware seeded name generation.
 *
 * Produces deterministic tavern names from a seeded PRNG.
 * Pattern: {article} {adjective} {noun}, e.g. "The Rusty Anchor".
 * Falls back to generic fantasy names if culture not recognized.
 *
 * NFP #3 (Determinism): Seeded PRNG — same seed always produces same name.
 */

// ─── Generic Word Pools ──────────────────────────────────────────

const GENERIC_ADJECTIVES = [
  'Rusty', 'Broken', 'Crowned', 'Golden', 'Silver', 'Iron', 'Wandering',
  'Twisted', 'Weary', 'Merry', 'Sleepy', 'Amber', 'Old', 'Wayward',
  'Last', 'Lucky', 'Muddy', 'Tired', 'Sturdy', 'Hollow',
];

const GENERIC_NOUNS = [
  'Anchor', 'Stag', 'Wheel', 'Flagon', 'Hearth', 'Lantern', 'Barrel',
  'Crossroads', 'Goblet', 'Saddle', 'Boot', 'Compass', 'Anvil',
  'Shield', 'Hound', 'Fox', 'Crow', 'Pilgrim', 'Hammer', 'Candle',
];

// ─── Culture-Specific Word Pools ─────────────────────────────────
// Each culture gets adjective/noun pools reflecting its identity.
// Keys match culture IDs or partial culture name matches.

const CULTURE_POOLS: Record<string, { adjectives: string[]; nouns: string[] }> = {
  'northern': {
    adjectives: ['Frosted', 'Storm-Bitten', 'Windswept', 'Ice-Touched', 'Grey', 'Bitter'],
    nouns: ['Hearth', 'Mead-Hall', 'Wolf', 'Bear', 'Longship', 'Forge'],
  },
  'southern': {
    adjectives: ['Sun-Drenched', 'Dusty', 'Bronze', 'Burning', 'Sandy', 'Spiced'],
    nouns: ['Oasis', 'Caravan', 'Merchant', 'Spice', 'Camel', 'Star'],
  },
  'western': {
    adjectives: ['Fog-Laden', 'Mossy', 'Thatched', 'Crooked', 'Mossy', 'Brambled'],
    nouns: ['Oak', 'Mill', 'Ferry', 'Cobblestone', 'Shepherd', 'Apple'],
  },
  'eastern': {
    adjectives: ['Jade', 'Silk', 'Gilded', 'Porcelain', 'Crimson', 'Painted'],
    nouns: ['Lantern', 'Lotus', 'Pagoda', 'Jade', 'Silk', 'Dragon'],
  },
  'forest': {
    adjectives: ['Tangled', 'Hollow', 'Rootbound', 'Misty', 'Verdant', 'Mossy'],
    nouns: ['Oak', 'Stag', 'Mushroom', 'Owl', 'Fern', 'Grove'],
  },
  'coastal': {
    adjectives: ['Salt-Worn', 'Weathered', 'Tide-Touched', 'Driftwood', 'Foggy', 'Wave-Battered'],
    nouns: ['Anchor', 'Helm', 'Tide', 'Gull', 'Reef', 'Siren'],
  },
  'highland': {
    adjectives: ['Stone-Grey', 'Craggy', 'Wind-Scoured', 'Heathered', 'Misted', 'Rugged'],
    nouns: ['Ram', 'Crag', 'Thistle', 'Peat', 'Peak', 'Cairn'],
  },
};

// ─── Name Generation ─────────────────────────────────────────────

/**
 * Pick a random element from an array using the provided RNG.
 * Fail-soft: returns fallback if array is empty.
 */
function pickRandom<T>(arr: T[], rng: () => number, fallback: T): T {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Resolve the culture pool key from a culture ID string.
 * Matches against partial substrings for flexibility.
 * Returns undefined if no match found (triggers generic fallback).
 */
function resolveCulturePool(cultureId: string | undefined): string | undefined {
  if (!cultureId) return undefined;
  const lower = cultureId.toLowerCase();
  for (const key of Object.keys(CULTURE_POOLS)) {
    if (lower.includes(key)) return key;
  }
  return undefined;
}

/**
 * Generate a deterministic tavern name using a seeded RNG.
 *
 * @param rng Seeded RNG function returning [0, 1) values
 * @param cultureId Optional culture ID for culture-flavored names
 * @returns Name string, e.g. "The Golden Stag" or "The Frosted Hearth"
 */
export function generateTavernName(rng: () => number, cultureId?: string): string {
  const poolKey = resolveCulturePool(cultureId);
  const pool = poolKey ? CULTURE_POOLS[poolKey] : undefined;

  const adjectives = pool ? pool.adjectives : GENERIC_ADJECTIVES;
  const nouns = pool ? pool.nouns : GENERIC_NOUNS;

  const adj = pickRandom(adjectives, rng, 'Rusty');
  const noun = pickRandom(nouns, rng, 'Flagon');

  return `The ${adj} ${noun}`;
}
