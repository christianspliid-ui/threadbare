/**
 * WorldGen constants — all tunable magic numbers for the multi-pass pipeline.
 *
 * NFP #1 Tunability: Every number has a name and purpose comment.
 * Change game feel by adjusting values here — no logic rewrites needed.
 *
 * PASS_SEED_* are unique primes used to offset the world seed per pass,
 * ensuring independent PRNG streams for each pass (NFP #3 Determinism).
 */

// ─── Per-pass PRNG seed offsets (unique primes) ──────────────────
/** Grid scaffold pass — no PRNG needed, offset reserved */
export const PASS_SEED_GRID = 0;
/** Province seeding + flood-fill */
export const PASS_SEED_PROVINCES = 7919;
/** Elevation noise, ridges, canyons */
export const PASS_SEED_ELEVATION = 15731;
/** Coastline noise, islands, peninsulas, bays */
export const PASS_SEED_COASTLINE = 23497;
/** Climate: temperature + moisture fields */
export const PASS_SEED_CLIMATE = 31259;
/** Hydrology: rivers, lakes, depression filling */
export const PASS_SEED_HYDROLOGY = 39041;
/** Temperature reassessment (lake effect, river valleys) */
export const PASS_SEED_TEMP_REASSESS = 46811;
/** Biome classification pass */
export const PASS_SEED_BIOME = 54583;
/** Adjacency smoothing pass */
export const PASS_SEED_SMOOTHING = 62347;
/** Validation and determinism check */
export const PASS_SEED_VALIDATION = 70099;
/** Fantasy overlay pass — sphere-driven biome transformation */
export const PASS_SEED_FANTASY = 70109;
/** Lair seeding pass — monster lair placement at worldgen (m2.5) */
export const PASS_SEED_LAIRS = 90211;

// ─── Province constants ──────────────────────────────────────────
/** Maximum hexes any single province can claim via flood-fill */
export const PROVINCE_MAX_HEXES = 2000;
/** Minimum hex distance between any two province seed points */
export const PROVINCE_MIN_SEED_DISTANCE = 10;
/** Number of wilderness provinces (no culture bias) added after culture provinces */
export const WILDERNESS_PROVINCE_COUNT = 10;
/** Weight boost for culture province hexes matching preferredBiomes (0-1) */
export const PROVINCE_BIAS_STRENGTH_CULTURE = 0.7;
/** Weight boost for wilderness province hexes (0-1) */
export const PROVINCE_BIAS_STRENGTH_WILDERNESS = 0.3;
/** Exponential decay rate for province elevation bias by distance from seed */
export const PROVINCE_BIAS_DECAY_RATE = 0.03;
/** Hex distance from seed treated as capital region */
export const PROVINCE_CAPITAL_RADIUS = 3;
/** Hex distance from seed treated as heartland region */
export const PROVINCE_HEARTLAND_RADIUS = 8;

// ─── Elevation noise constants ───────────────────────────────────
/** Spatial scale of base elevation noise (smaller = more zoomed in terrain) */
export const ELEVATION_SCALE = 0.06;
/** Number of fractal noise octaves for elevation */
export const ELEVATION_OCTAVES = 4;
/** Amplitude decay per octave (0-1) */
export const ELEVATION_PERSISTENCE = 0.5;
/** Frequency multiplier per octave */
export const ELEVATION_LACUNARITY = 2.0;

// ─── Ridge constants ─────────────────────────────────────────────
/** Default number of ridge mountain spines */
export const RIDGE_COUNT_DEFAULT = 4;
/** Peak elevation value at ridge spine hexes (0-1).
 * With max()-blend, only exact spine hexes reach this value,
 * creating narrow linear peaks along mountain ranges. */
export const RIDGE_PEAK_ELEVATION = 0.97;
/** Number of hexes from spine to foothills transition edge */
export const RIDGE_FOOTHILLS_HEXES = 4;
/** Probability of a fork branching off at each spine step */
export const RIDGE_FORK_PROBABILITY = 0.3;
/** Minimum number of hexes in a ridge spine */
export const RIDGE_MIN_LENGTH = 30;
/** Maximum number of hexes in a ridge spine */
export const RIDGE_MAX_LENGTH = 80;
/** Max forks per ridge */
export const RIDGE_MAX_FORKS = 2;
/** Angular variance per step (radians) — controls how straight ridges are */
export const RIDGE_STEP_VARIANCE = Math.PI / 12; // 15 degrees

// ─── Canyon constants ────────────────────────────────────────────
/** Number of dry rift canyons (linear low-elevation cuts through highlands) */
export const CANYON_DRY_RIFT_COUNT = 2;
/** Elevation subtracted from canyon path hexes (0-1) */
export const CANYON_DEPTH_FACTOR = 0.3;

// ─── Sea level ───────────────────────────────────────────────────
/** Elevation threshold dividing ocean from land (matches terrain.ts ELEV.SEA_LEVEL) */
export const SEA_LEVEL = 0.38;

// ─── Coastline constants ─────────────────────────────────────────
/** Spatial scale of coastal detail noise (higher = finer features) */
export const COASTAL_NOISE_SCALE = 0.3;
/** Octaves for coastal detail noise */
export const COASTAL_NOISE_OCTAVES = 3;
/** Number of island chains to generate */
export const ISLAND_CHAIN_COUNT = 2;
/** Min island chain length (number of islands) */
export const ISLAND_CHAIN_MIN_LENGTH = 3;
/** Max island chain length */
export const ISLAND_CHAIN_MAX_LENGTH = 8;
/** Number of peninsulas to generate */
export const PENINSULA_COUNT = 2;
/** Number of bay inlets to carve */
export const BAY_CARVE_COUNT = 2;
/** Hexes from land/sea boundary that coastal detail noise applies */
export const COASTAL_NOISE_RANGE = 3;

// ─── 7-point hex sampling ────────────────────────────────────────
/** Number of sample points per hex (center + 6 corners) */
export const HEX_SAMPLE_POINTS = 7;

// ─── Climate: temperature constants ──────────────────────────────
/** How much latitude dominates temperature (0-1) */
export const TEMP_LATITUDE_WEIGHT = 0.6;
/** Temperature drop per unit elevation above sea level */
export const TEMP_ALTITUDE_PENALTY = 0.3;
/** Random variation weight in temperature */
export const TEMP_NOISE_WEIGHT = 0.15;
/** Spatial scale for temperature noise (from forceField.ts) */
export const TEMP_NOISE_SCALE = 0.04;
/** Hexes from coast that receive maritime temperature moderation */
export const TEMP_MARITIME_RADIUS = 5;
/** How strongly maritime proximity pulls temperature toward 0.5 */
export const TEMP_MARITIME_STRENGTH = 0.15;

// ─── Climate: moisture constants ──────────────────────────────────
/** Moisture bonus at coast, decaying inland */
export const MOISTURE_COASTAL_BONUS = 0.25;
/** Decay rate per hex from coast (applied to coastal bonus) */
export const MOISTURE_COASTAL_DECAY = 0.04;
/** Random variation weight in moisture */
export const MOISTURE_NOISE_WEIGHT = 0.2;
/** Spatial scale for moisture noise */
export const MOISTURE_NOISE_SCALE = 0.05;
/** Hexes past ridge spine where rain shadow begins */
export const RAIN_SHADOW_ONSET_DISTANCE = 1;
/** Moisture reduction on downwind side of a ridge */
export const RAIN_SHADOW_PENALTY = 0.25;
/** How quickly rain shadow penalty decays per hex from ridge */
export const RAIN_SHADOW_DECAY = 0.05;
/**
 * Prevailing wind direction: angle (radians) the wind travels TO.
 * Math.PI * 0.75 = ~135° = southeast. Winds originate from the northwest.
 */
export const PREVAILING_WIND_ANGLE = Math.PI * 0.75;

// ─── Temperature reassessment constants ──────────────────────────
/** Hexes from lake shore where lake-effect temperature moderation applies */
export const LAKE_EFFECT_RADIUS = 3;
/** Strength of lake-effect moderation (pulls temp toward 0.5) */
export const LAKE_EFFECT_STRENGTH = 0.08;
/** Minimum lake size (hexes) to produce lake-effect moderation */
export const LAKE_MIN_SIZE_FOR_EFFECT = 3;
/** Temperature boost applied to all river valley hexes */
export const RIVER_VALLEY_TEMP_BOOST = 0.03;
/** Moisture boost applied to all river valley hexes */
export const RIVER_VALLEY_MOISTURE_BOOST = 0.08;

// ─── Biome override constants ─────────────────────────────────────
/** Moisture threshold above which low-elevation hexes become wetlands */
export const WETLAND_MOISTURE_THRESHOLD = 0.65;
/** Maximum elevation for wetland classification */
export const WETLAND_ELEVATION_MAX = 0.50;
/** Radius from river mouth where floodplain override applies */
export const WETLAND_RIVER_MOUTH_RADIUS = 2;
/** Radius from lake shore where marsh override applies */
export const WETLAND_LAKE_SHORE_RADIUS = 1;
/** Spatial scale for desert sub-type noise */
export const DESERT_SUBTYPE_NOISE_SCALE = 0.15;
/** Minimum elevation for volcano placement */
export const VOLCANO_MIN_ELEVATION = 0.90;
/** Minimum temperature for volcano placement */
export const VOLCANO_MIN_TEMPERATURE = 0.4;

// ─── Hydrology: delta generation constants ────────────────────────
/** Hexes from coast where delta forking begins */
export const DELTA_FORK_DISTANCE_FROM_COAST = 3;
/** Spread angle of delta branches in radians (45 degrees) */
export const DELTA_FAN_ANGLE = Math.PI / 4;
/** Number of delta branches (in addition to main channel) */
export const DELTA_BRANCH_COUNT = 2;

// ─── Hydrology: wetland placement constants ───────────────────────
/** Hexes around river-sea junction where wetlands spawn */
export const WETLAND_SPAWN_PROBABILITY = 0.6; // fraction of eligible hexes that become wetland

// ─── Adjacency smoothing constants ────────────────────────────────
/** Maximum iterations of adjacency smoothing */
export const SMOOTHING_MAX_ITERATIONS = 3;
/** Stop smoothing when fewer than this fraction of hexes change per iteration */
export const SMOOTHING_MAX_PERCENT = 0.05;

// ─── Province elevation bias targets ─────────────────────────────
/** Target elevation range for mountain province bias [min, max] */
export const MOUNTAIN_PROVINCE_ELEV_RANGE: [number, number] = [0.75, 0.92];
/** Target elevation range for lowland province bias */
export const LOWLAND_PROVINCE_ELEV_RANGE: [number, number] = [0.35, 0.48];
/** Target elevation range for forest province bias */
export const FOREST_PROVINCE_ELEV_RANGE: [number, number] = [0.38, 0.50];

// ─── Biome-to-temperature-band lookup ────────────────────────────
/**
 * Latitude compatibility bands for province placement (normalized 0=pole, 1=equator).
 * Used to place culture seeds at climatically appropriate rows.
 * Key: biome terrain type. Value: [minTempBand, maxTempBand].
 */
export const BIOME_TEMP_BANDS: Partial<Record<string, [number, number]>> = {
  // Hot/equatorial
  desert: [0.7, 1.0],
  sand_dunes: [0.7, 1.0],
  rocky_desert: [0.6, 1.0],
  jungle: [0.75, 1.0],
  tropical_forest: [0.7, 1.0],
  savanna: [0.6, 0.9],
  // Warm temperate
  grassland: [0.4, 0.8],
  farmland: [0.4, 0.8],
  steppe: [0.35, 0.75],
  floodplain: [0.4, 0.8],
  oasis: [0.6, 0.9],
  // Temperate
  temperate_forest: [0.3, 0.7],
  forested_hills: [0.3, 0.65],
  hills: [0.25, 0.75],
  light_forest: [0.3, 0.7],
  evergreen_forest: [0.25, 0.6],
  // Cool
  dense_forest: [0.2, 0.6],
  swamp: [0.3, 0.7],
  marsh: [0.2, 0.7],
  // Cold
  boreal_forest: [0.1, 0.4],
  tundra: [0.0, 0.25],
  glacier: [0.0, 0.15],
  snow_fields: [0.0, 0.2],
  arctic: [0.0, 0.15],
  // Elevation
  mountains: [0.1, 0.85],
  high_mountains: [0.05, 0.7],
  plateau: [0.2, 0.8],
  badlands: [0.4, 0.85],
  // Coastal
  coast: [0.2, 0.8],
  coastal_shallows: [0.2, 0.8],
  ocean: [0.1, 0.9],
  // Default band (fallback)
  _default: [0.2, 0.8],
};
