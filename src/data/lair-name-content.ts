/**
 * Lair-name lexicons — THR-1312.
 *
 * The content half of the lair namer. Every table here is *data*: the resolver in
 * `src/engine/naming/lairNames.ts` owns the grammar, this file owns the words. The
 * split, the family indirection, and the "first entry is the terminal fallback"
 * rule are all lifted from `work-name-content.ts` deliberately — THR-1291 §5 asked
 * for one naming idiom, and a second one wearing different variable names would be
 * the same drift under a new spelling.
 *
 * **Why terrain families rather than terrain keys.** `TerrainType` is a 30-member
 * union and a lair may sit on any of the ~22 land members. Keying nouns per terrain
 * would be 22 hand-written pools that no one will keep level, and it buys nothing:
 * naming cares about the *shape* of the hole in the ground, and `dense_forest` and
 * `jungle` want the same nouns. Six families cover the land union; an unmapped
 * terrain falls to `burrow`, whose nouns read sensibly anywhere.
 *
 * **Why the sphere roots are separate from the terrain roots.** They answer different
 * questions — terrain says what the place *is*, sphere says what *haunts* it — and
 * the resolver pools them additively, so a name can tilt either way without the two
 * tables having to know about each other. Same additive rule as the work namer's
 * reach + foundation pools.
 */

import type { SphereName } from '../types/index';

/**
 * The naming families. Six, against ~22 land terrains — see the header note on why
 * this indirection exists rather than a per-terrain table.
 */
export type LairNameFamily =
  | 'burrow'
  | 'thicket'
  | 'mire'
  | 'deep'
  | 'waste'
  | 'blight';

/**
 * Terrain → naming family. Water terrains are absent on purpose: `seedMonsterLairs`
 * excludes them, so a water key here would be a row describing a state the engine
 * forbids. A terrain absent from this map falls to `'burrow'` — the coverage half of
 * the fail-soft row. An unmapped terrain is a content gap, never a crash.
 */
export const LAIR_TERRAIN_FAMILY: Readonly<Record<string, LairNameFamily>> = {
  // Lowlands
  grassland: 'burrow',
  farmland: 'burrow',
  savanna: 'burrow',
  steppe: 'burrow',
  floodplain: 'burrow',
  // Forest
  temperate_forest: 'thicket',
  dense_forest: 'thicket',
  boreal_forest: 'thicket',
  jungle: 'thicket',
  tropical_forest: 'thicket',
  evergreen_forest: 'thicket',
  light_forest: 'thicket',
  dead_forest: 'thicket',
  forested_hills: 'thicket',
  great_home_trees: 'thicket',
  // Wet
  swamp: 'mire',
  marsh: 'mire',
  moor_bog: 'mire',
  // Elevated
  hills: 'deep',
  mountains: 'deep',
  high_mountains: 'deep',
  plateau: 'deep',
  badlands: 'deep',
  mountain_pass: 'deep',
  // Extreme
  desert: 'waste',
  rocky_desert: 'waste',
  sand_dunes: 'waste',
  tundra: 'waste',
  glacier: 'waste',
  volcano: 'waste',
  arctic: 'waste',
  snow_fields: 'waste',
  // Special
  broken_lands: 'blight',
  oasis: 'blight',
};

/** The family a lair on this terrain is named from. Never throws; unknown → `'burrow'`. */
export function familyForTerrain(terrain: string | undefined): LairNameFamily {
  if (!terrain) return 'burrow';
  return LAIR_TERRAIN_FAMILY[terrain] ?? 'burrow';
}

/**
 * The thing itself, per family. The first entry of each pool is its **terminal
 * fallback** — the noun a nameless lair degrades to when every other pool misses
 * (`lairFallbackNoun` reads it), so these lists must never be empty.
 *
 * `Lair` appears in no pool. Not because the word is wrong — it is the plainest
 * word for the thing — but because the whole ticket is that players were reading
 * the *category* where a name should be, and a namer whose output can be "The Cold
 * Lair" has kept the habit while passing the regex.
 */
export const LAIR_NOUNS_BY_FAMILY: Readonly<Record<LairNameFamily, readonly string[]>> = {
  burrow: ['Den', 'Burrow', 'Warren', 'Hollow', 'Covert', 'Earth', 'Diggings'],
  thicket: ['Thicket', 'Tangle', 'Snare', 'Roost', 'Bramble', 'Bower', 'Undergrowth'],
  mire: ['Mire', 'Sink', 'Wallow', 'Fen', 'Slough', 'Drowning', 'Seep'],
  deep: ['Deep', 'Delve', 'Gullet', 'Undercut', 'Crag', 'Maw', 'Shaft'],
  waste: ['Scour', 'Waste', 'Bleaching', 'Scrape', 'Drift', 'Barrow', 'Hollow'],
  blight: ['Blight', 'Wound', 'Rift', 'Scar', 'Breach', 'Sore', 'Ruin'],
};

/** The terminal noun for a family — the last thing standing before "The Den". */
export function lairFallbackNoun(family: LairNameFamily): string {
  return LAIR_NOUNS_BY_FAMILY[family][0];
}

/**
 * What the place *is* — terrain flavor, keyed by family.
 *
 * Every root is a capitalised standalone adjective, and the resolver only ever
 * renders them *spaced* against the noun. That constraint is inherited rather than
 * rediscovered: the work namer drafted a concatenating `{root}{noun}` pattern and a
 * 150-tick run produced "The StandingHouse", because capitalised adjective + capitalised
 * noun is CamelCase mush. Compound roots would need their own lowercase table.
 */
export const LAIR_ROOTS_BY_FAMILY: Readonly<Record<LairNameFamily, readonly string[]>> = {
  burrow: ['Trampled', 'Low', 'Open', 'Windbent', 'Long', 'Cattle', 'Furrowed'],
  thicket: ['Choking', 'Rootbound', 'Shaded', 'Blackleaf', 'Thorn', 'Green', 'Creeping'],
  mire: ['Sunken', 'Reeking', 'Fevered', 'Rotting', 'Leech', 'Drowned', 'Still'],
  deep: ['Splintered', 'Echoing', 'Stonebound', 'Cold', 'Iron', 'Broken', 'Sheer'],
  waste: ['Bleached', 'Windscoured', 'Salt', 'Blistered', 'Glass', 'Starving', 'Frozen'],
  blight: ['Unmade', 'Weeping', 'Sundered', 'Fouled', 'Hungering', 'Wrong', 'Faithless'],
};

/**
 * What *haunts* it — sphere flavor, keyed by the lair's `dominantSphere`.
 *
 * All twelve spheres are present. That is not completionism: `dominantSphere` is
 * derived from terrain by `getDominantSphere`, which picks the argmax over the full
 * `SPHERE_NAMES` affinity vector, so any sphere is reachable and a missing row would
 * be a silent hole that only shows up on some maps.
 */
export const LAIR_ROOTS_BY_SPHERE: Readonly<Record<SphereName, readonly string[]>> = {
  chaos: ['Churning', 'Shifting', 'Riotous', 'Unruled'],
  order: ['Patterned', 'Regimented', 'Reckoned', 'Lawbound'],
  light: ['Blinding', 'Burning', 'Gilded', 'Glaring'],
  darkness: ['Lightless', 'Smothered', 'Blind', 'Starless'],
  force: ['Crushing', 'Battering', 'Hammered', 'Rending'],
  matter: ['Stonefast', 'Heavy', 'Petrified', 'Oreblack'],
  energy: ['Crackling', 'Seared', 'Storm', 'Kindled'],
  life: ['Teeming', 'Fecund', 'Breeding', 'Swollen'],
  mind: ['Whispering', 'Watchful', 'Mazed', 'Knowing'],
  spirit: ['Haunted', 'Ancestral', 'Keening', 'Restless'],
  time: ['Ageless', 'Worn', 'Patient', 'Unhurried'],
  entropy: ['Rotting', 'Failing', 'Crumbling', 'Ashen'],
};

/**
 * Pattern set. Tokens: `{root}` (terrain or sphere flavor), `{noun}` (family).
 *
 * Two patterns, both spaced (see the note on `LAIR_ROOTS_BY_FAMILY`). The articled
 * and bare forms read differently enough to be worth both — "The Choking Snare" is a
 * place someone warns you about, "Blackleaf Thicket" is a place on a map — and having
 * two doubles the collision headroom the resolver walks through.
 */
export const LAIR_NAME_PATTERNS: readonly string[] = [
  'The {root} {noun}',
  '{root} {noun}',
];
