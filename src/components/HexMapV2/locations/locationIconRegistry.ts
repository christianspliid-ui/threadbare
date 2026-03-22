/**
 * locationIconRegistry.ts — Registry of location icon definitions for the hex map.
 *
 * Provides placeholder SVG path data for all 17 LocationType values.
 * Plan 02 replaces placeholder paths with production-quality silhouette art.
 *
 * Each entry uses simple geometric shapes as stand-ins:
 * - Capital/City: concentric shapes (large footprint)
 * - Castles/Forts: rectangular fortifications
 * - Temples/Shrines: dome/arch shapes
 * - Ruins: broken/irregular geometry
 * - Camps/POI: simple markers
 *
 * NFP #1 (tunability): All size scale values are named constants.
 * NFP #4 (fail-soft): Unknown types should silently skip — callers check registry membership.
 */

// ── Type definitions ──────────────────────────────────────────────────────────

/** All supported location types in the game world. */
export type LocationType =
  | 'capital'
  | 'city'
  | 'town'
  | 'hamlet'
  | 'castle'
  | 'fort'
  | 'tower'
  | 'temple'
  | 'shrine'
  | 'ruins'
  | 'ruined_city'
  | 'ruined_tower'
  | 'ruined_village'
  | 'mining'
  | 'camp'
  | 'battleground'
  | 'unexplored_poi';

/** Visual size class for a location — determines sprite scale on the hex. */
export type LocationSizeClass = 'full' | 'medium' | 'small' | 'tiny';

/** Importance tier used for label font size and visibility thresholds. */
export type LocationImportance = 'capital' | 'city' | 'town' | 'small';

/** A single SVG path with its opacity (for multi-layer compositing). */
export interface LocationPathDef {
  d: string;
  opacity: number;
}

/** Full definition for a location icon type. */
export interface LocationIconDef {
  paths: LocationPathDef[];
  viewBox: string;
  sizeClass: LocationSizeClass;
}

// ── NFP #1: Tunable scale constants ──────────────────────────────────────────

/**
 * World-space sprite size as a fraction of HEX_SIZE per size class.
 * Tune these to adjust icon prominence on the map.
 */
export const LOCATION_SIZE_SCALE: Record<LocationSizeClass, number> = {
  full:   0.80,
  medium: 0.60,
  small:  0.40,
  tiny:   0.25,
};

// ── Importance mapping ────────────────────────────────────────────────────────

/**
 * Maps each LocationType to its importance tier.
 * Tier drives label font size and zoom visibility thresholds.
 */
export const LOCATION_IMPORTANCE_MAP: Record<LocationType, LocationImportance> = {
  capital:        'capital',
  city:           'city',
  town:           'town',
  castle:         'town',
  fort:           'town',
  temple:         'town',
  ruined_city:    'town',
  hamlet:         'small',
  tower:          'small',
  shrine:         'small',
  ruins:          'small',
  ruined_tower:   'small',
  ruined_village: 'small',
  mining:         'small',
  camp:           'small',
  battleground:   'small',
  unexplored_poi: 'small',
};

// ── Placeholder SVG paths ─────────────────────────────────────────────────────
// All paths use viewBox "0 0 100 100" for consistency.
// Each icon uses 2-3 layers at different opacities (0.4, 0.7, 1.0) matching the
// multi-layer signifier style from Phase 05.
// Plan 02 replaces these with hand-drawn production silhouettes.

/** Capital: Large city with crown-like spires — multiple rings + tower shapes */
const CAPITAL_PATHS: LocationPathDef[] = [
  // Outer ring / city mass (base layer)
  { d: 'M50 20 L70 35 L80 55 L70 75 L50 85 L30 75 L20 55 L30 35 Z', opacity: 0.4 },
  // Inner keep
  { d: 'M50 30 L63 42 L68 58 L60 68 L50 73 L40 68 L32 58 L37 42 Z', opacity: 0.7 },
  // Central tower
  { d: 'M44 30 L44 55 L56 55 L56 30 L52 22 L48 22 Z', opacity: 1.0 },
];

/** City: Large walled settlement — oval with gate */
const CITY_PATHS: LocationPathDef[] = [
  // City walls (oval)
  { d: 'M50 15 C75 15 85 30 85 50 C85 70 75 85 50 85 C25 85 15 70 15 50 C15 30 25 15 50 15 Z', opacity: 0.4 },
  // Inner district
  { d: 'M50 28 C65 28 72 37 72 50 C72 63 65 72 50 72 C35 72 28 63 28 50 C28 37 35 28 50 28 Z', opacity: 0.7 },
  // Central hall
  { d: 'M42 42 L42 58 L58 58 L58 42 Z', opacity: 1.0 },
];

/** Town: Medium walled settlement — simple rectangle with towers */
const TOWN_PATHS: LocationPathDef[] = [
  // Wall base
  { d: 'M25 35 L75 35 L75 75 L25 75 Z', opacity: 0.4 },
  // Corner towers
  { d: 'M22 30 L36 30 L36 45 L22 45 Z M64 30 L78 30 L78 45 L64 45 Z', opacity: 0.7 },
  // Gate / main building
  { d: 'M40 60 L60 60 L60 75 L40 75 Z M46 45 L54 45 L54 60 L46 60 Z', opacity: 1.0 },
];

/** Hamlet: Small cluster of houses */
const HAMLET_PATHS: LocationPathDef[] = [
  // House base shapes
  { d: 'M20 55 L50 55 L50 75 L20 75 Z M55 55 L80 55 L80 75 L55 75 Z', opacity: 0.4 },
  // Roof triangles
  { d: 'M18 55 L35 38 L52 55 Z M53 55 L67 41 L82 55 Z', opacity: 1.0 },
];

/** Castle: Fortified stronghold — keep with outer wall */
const CASTLE_PATHS: LocationPathDef[] = [
  // Outer curtain wall
  { d: 'M15 30 L85 30 L85 80 L15 80 Z', opacity: 0.35 },
  // Battlements (merlons) on top
  { d: 'M15 25 L25 25 L25 30 L15 30 Z M35 25 L45 25 L45 30 L35 30 Z M55 25 L65 25 L65 30 L55 30 Z M75 25 L85 25 L85 30 L75 30 Z', opacity: 0.7 },
  // Central keep tower
  { d: 'M38 30 L62 30 L62 80 L38 80 Z M44 20 L44 30 L56 30 L56 20 Z', opacity: 1.0 },
];

/** Fort: Military outpost — square with corner bastions */
const FORT_PATHS: LocationPathDef[] = [
  // Fort body
  { d: 'M25 25 L75 25 L75 75 L25 75 Z', opacity: 0.4 },
  // Corner bastions (diamond shapes)
  { d: 'M25 25 L10 18 L18 10 L25 25 Z M75 25 L90 18 L82 10 L75 25 Z M25 75 L10 82 L18 90 L25 75 Z M75 75 L90 82 L82 90 L75 75 Z', opacity: 0.7 },
  // Gate arch
  { d: 'M40 60 Q50 50 60 60 L60 75 L40 75 Z', opacity: 1.0 },
];

/** Tower: Lone watchtower — tall narrow structure */
const TOWER_PATHS: LocationPathDef[] = [
  // Tower body
  { d: 'M38 25 L62 25 L62 80 L38 80 Z', opacity: 0.5 },
  // Crenellated top
  { d: 'M36 18 L42 18 L42 25 L36 25 Z M46 18 L54 18 L54 25 L46 25 Z M58 18 L64 18 L64 25 L58 25 Z', opacity: 0.8 },
  // Arrow slit
  { d: 'M47 40 L53 40 L53 55 L47 55 Z', opacity: 1.0 },
];

/** Temple: Sacred structure — dome with columns */
const TEMPLE_PATHS: LocationPathDef[] = [
  // Dome
  { d: 'M20 55 C20 25 80 25 80 55 Z', opacity: 0.4 },
  // Steps / base
  { d: 'M15 65 L85 65 L85 75 L15 75 Z M18 55 L82 55 L82 65 L18 65 Z', opacity: 0.7 },
  // Columns
  { d: 'M25 55 L30 55 L30 65 L25 65 Z M45 55 L50 55 L50 65 L45 65 Z M65 55 L70 55 L70 65 L65 65 Z', opacity: 1.0 },
];

/** Shrine: Small sacred marker — obelisk or standing stone */
const SHRINE_PATHS: LocationPathDef[] = [
  // Standing stone / obelisk
  { d: 'M43 20 L57 20 L60 80 L40 80 Z', opacity: 0.5 },
  // Glow / aura ring
  { d: 'M50 45 C60 45 65 50 65 55 C65 60 60 65 50 65 C40 65 35 60 35 55 C35 50 40 45 50 45 Z', opacity: 1.0 },
];

/** Ruins: Collapsed structure — broken walls */
const RUINS_PATHS: LocationPathDef[] = [
  // Broken wall segments
  { d: 'M15 65 L35 65 L35 75 L15 75 Z M55 60 L70 60 L70 75 L55 75 Z', opacity: 0.4 },
  // Collapsed sections (diagonal rubble)
  { d: 'M35 55 L50 55 L40 75 Z M65 55 L80 65 L65 75 Z', opacity: 0.7 },
  // Remaining arch / keystone
  { d: 'M40 30 L60 30 L65 45 L55 45 L55 55 L45 55 L45 45 L35 45 Z', opacity: 1.0 },
];

/** Ruined City: Large collapsed settlement — extensive rubble */
const RUINED_CITY_PATHS: LocationPathDef[] = [
  // Outer ruined wall (partial)
  { d: 'M15 20 L40 20 L40 30 L15 30 Z M60 20 L85 20 L85 50 L75 50 L75 30 L60 30 Z', opacity: 0.35 },
  // Rubble mounds
  { d: 'M20 65 L35 50 L50 65 Z M50 70 L65 55 L80 70 Z', opacity: 0.6 },
  // Broken tower stump
  { d: 'M42 30 L58 30 L62 55 L38 55 Z', opacity: 1.0 },
];

/** Ruined Tower: Collapsed watchtower — broken stump */
const RUINED_TOWER_PATHS: LocationPathDef[] = [
  // Tower stump
  { d: 'M38 45 L62 45 L62 80 L38 80 Z', opacity: 0.5 },
  // Broken top (jagged)
  { d: 'M38 45 L44 35 L50 42 L56 32 L62 45 Z', opacity: 0.8 },
  // Rubble at base
  { d: 'M30 75 L40 68 L50 75 L60 68 L70 75 L70 80 L30 80 Z', opacity: 1.0 },
];

/** Ruined Village: Small abandoned settlement — scattered foundations */
const RUINED_VILLAGE_PATHS: LocationPathDef[] = [
  // Foundation outlines
  { d: 'M20 40 L40 40 L40 60 L20 60 Z M55 45 L75 45 L75 65 L55 65 Z', opacity: 0.35 },
  // Overgrowth hint
  { d: 'M25 60 Q35 55 45 60 Q50 63 45 68 Q35 73 25 68 Z M58 65 Q68 60 78 65 Q83 68 78 73 Q68 78 58 73 Z', opacity: 0.5 },
  // Chimney stubs
  { d: 'M28 32 L32 32 L32 40 L28 40 Z M62 37 L66 37 L66 45 L62 45 Z', opacity: 1.0 },
];

/** Mining: Resource extraction site — pickaxe / shaft entrance */
const MINING_PATHS: LocationPathDef[] = [
  // Mineshaft entrance
  { d: 'M30 50 Q50 30 70 50 L70 80 L30 80 Z', opacity: 0.4 },
  // Support beams
  { d: 'M38 50 L38 80 L42 80 L42 50 Z M58 50 L58 80 L62 80 L62 50 Z', opacity: 0.7 },
  // Cart / load symbol
  { d: 'M40 62 L60 62 L60 72 L40 72 Z', opacity: 1.0 },
];

/** Camp: Temporary military or traveler camp — tent shape */
const CAMP_PATHS: LocationPathDef[] = [
  // Main tent
  { d: 'M50 20 L80 70 L20 70 Z', opacity: 0.5 },
  // Tent flap
  { d: 'M50 20 L58 70 L42 70 Z', opacity: 0.8 },
  // Fire pit
  { d: 'M45 72 L50 68 L55 72 L50 78 Z', opacity: 1.0 },
];

/** Battleground: Site of conflict — crossed swords / marker */
const BATTLEGROUND_PATHS: LocationPathDef[] = [
  // Sword 1 (diagonal //)
  { d: 'M20 20 L30 20 L80 70 L70 80 Z', opacity: 0.5 },
  // Sword 2 (diagonal \\)
  { d: 'M80 20 L70 20 L20 70 L30 80 Z', opacity: 0.5 },
  // Center medallion
  { d: 'M42 42 L58 42 L58 58 L42 58 Z', opacity: 1.0 },
];

/** Unexplored POI: Mystery marker — question mark / eye symbol */
const UNEXPLORED_POI_PATHS: LocationPathDef[] = [
  // Outer ring
  { d: 'M50 20 C70 20 80 35 80 50 C80 65 70 80 50 80 C30 80 20 65 20 50 C20 35 30 20 50 20 Z', opacity: 0.3 },
  // Question mark top arc
  { d: 'M38 38 C38 25 62 25 62 38 C62 50 55 52 52 58 L48 58 C46 50 46 44 38 38 Z', opacity: 0.8 },
  // Question mark dot
  { d: 'M46 64 L54 64 L54 72 L46 72 Z', opacity: 1.0 },
];

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Complete registry of location icon definitions.
 * All 17 location types are registered with placeholder SVG paths.
 * Plan 02 replaces these paths with production hand-drawn silhouettes.
 *
 * Size class assignment:
 * - full:   capital, city (largest hexes)
 * - medium: town, castle, fort, temple, ruined_city
 * - small:  hamlet, tower, shrine, ruins, ruined_tower, ruined_village, mining, camp, battleground
 * - tiny:   unexplored_poi
 */
export const LOCATION_ICON_REGISTRY: Record<LocationType, LocationIconDef> = {
  capital:        { paths: CAPITAL_PATHS,        viewBox: '0 0 100 100', sizeClass: 'full'   },
  city:           { paths: CITY_PATHS,           viewBox: '0 0 100 100', sizeClass: 'full'   },
  town:           { paths: TOWN_PATHS,           viewBox: '0 0 100 100', sizeClass: 'medium' },
  castle:         { paths: CASTLE_PATHS,         viewBox: '0 0 100 100', sizeClass: 'medium' },
  fort:           { paths: FORT_PATHS,           viewBox: '0 0 100 100', sizeClass: 'medium' },
  temple:         { paths: TEMPLE_PATHS,         viewBox: '0 0 100 100', sizeClass: 'medium' },
  ruined_city:    { paths: RUINED_CITY_PATHS,    viewBox: '0 0 100 100', sizeClass: 'medium' },
  hamlet:         { paths: HAMLET_PATHS,         viewBox: '0 0 100 100', sizeClass: 'small'  },
  tower:          { paths: TOWER_PATHS,          viewBox: '0 0 100 100', sizeClass: 'small'  },
  shrine:         { paths: SHRINE_PATHS,         viewBox: '0 0 100 100', sizeClass: 'small'  },
  ruins:          { paths: RUINS_PATHS,          viewBox: '0 0 100 100', sizeClass: 'small'  },
  ruined_tower:   { paths: RUINED_TOWER_PATHS,   viewBox: '0 0 100 100', sizeClass: 'small'  },
  ruined_village: { paths: RUINED_VILLAGE_PATHS, viewBox: '0 0 100 100', sizeClass: 'small'  },
  mining:         { paths: MINING_PATHS,         viewBox: '0 0 100 100', sizeClass: 'small'  },
  camp:           { paths: CAMP_PATHS,           viewBox: '0 0 100 100', sizeClass: 'small'  },
  battleground:   { paths: BATTLEGROUND_PATHS,   viewBox: '0 0 100 100', sizeClass: 'small'  },
  unexplored_poi: { paths: UNEXPLORED_POI_PATHS, viewBox: '0 0 100 100', sizeClass: 'tiny'   },
};
