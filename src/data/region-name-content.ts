import type { RegionFeatureType } from '../engine/regionDetection';

/** Geographic name fragments keyed by feature type */
export const REGION_NAME_FRAGMENTS: Record<
  Exclude<RegionFeatureType, 'sea'>,
  { nouns: string[]; suffixes: string[]; adjectives: string[] }
> = {
  mountain_range: {
    nouns: ['Crags', 'Peaks', 'Spires', 'Teeth', 'Spine', 'Horns', 'Crown'],
    suffixes: ['wall', 'spire', 'peak', 'horn', 'crest'],
    adjectives: ['Iron', 'Grey', 'White', 'Black', 'Shattered', 'Frozen', 'Jagged'],
  },
  hill_country: {
    nouns: ['Hollows', 'Downs', 'Ridges', 'Folds', 'Rises', 'Knolls', 'Barrows'],
    suffixes: ['dale', 'hollow', 'downs', 'ridge', 'fell'],
    adjectives: ['Rolling', 'Green', 'Windswept', 'Barren', 'Gentle', 'Stony'],
  },
  forest: {
    nouns: ['Wood', 'Canopy', 'Thicket', 'Weald', 'Shade', 'Boughs', 'Timber'],
    suffixes: ['wood', 'weald', 'grove', 'shade', 'tangle'],
    adjectives: ['Deep', 'Dark', 'Old', 'Whispering', 'Tangled', 'Ancient', 'Green'],
  },
  plains: {
    nouns: ['Reach', 'Expanse', 'Fields', 'Flats', 'Steppe', 'Sweep', 'Grasslands'],
    suffixes: ['reach', 'field', 'plain', 'mead', 'lea'],
    adjectives: ['Vast', 'Golden', 'Empty', 'Windswept', 'Sunlit', 'Endless'],
  },
  desert: {
    nouns: ['Wastes', 'Sands', 'Barrens', 'Dust', 'Dunes', 'Scorch', 'Flats'],
    suffixes: ['waste', 'scar', 'burn', 'dust', 'blight'],
    adjectives: ['Red', 'White', 'Scorched', 'Dry', 'Blasted', 'Salt', 'Burning'],
  },
  wetland: {
    nouns: ['Marshes', 'Mire', 'Fen', 'Bogs', 'Pools', 'Shallows', 'Mere'],
    suffixes: ['mere', 'fen', 'mire', 'marsh', 'pool'],
    adjectives: ['Black', 'Still', 'Murky', 'Grey', 'Rotting', 'Silent', 'Drowned'],
  },
  tundra: {
    nouns: ['Wastes', 'Expanse', 'Flats', 'Reach', 'Barrens', 'Frost', 'Ice'],
    suffixes: ['frost', 'ice', 'waste', 'reach', 'pale'],
    adjectives: ['Frozen', 'White', 'Bitter', 'Howling', 'Dead', 'Pale', 'Endless'],
  },
  river: {
    nouns: ['River', 'Waters', 'Current', 'Flow', 'Torrent', 'Run'],
    suffixes: ['water', 'flow', 'run', 'brook', 'stream'],
    adjectives: ['Swift', 'Dark', 'Silver', 'Broad', 'Winding', 'Cold'],
  },
  lake: {
    nouns: ['Lake', 'Mere', 'Pool', 'Tarn', 'Waters', 'Basin'],
    suffixes: ['mere', 'lake', 'pool', 'tarn', 'deep'],
    adjectives: ['Still', 'Clear', 'Dark', 'Mirror', 'Deep', 'Silver'],
  },
};

/** Patterns for regions claimed by a historical culture. */
export const CLAIMED_NAME_PATTERNS: string[] = [
  'The {culture_adj} {geo_noun}',
  '{culture_noun}{geo_suffix}',
  'The {culture_adj} {feature_type}',
  '{culture_noun} {geo_noun}',
];

/** Patterns for unclaimed wilderness regions. */
export const UNCLAIMED_NAME_PATTERNS: string[] = [
  'The {geo_adj} {feature_type}',
  'The {geo_noun}',
];
