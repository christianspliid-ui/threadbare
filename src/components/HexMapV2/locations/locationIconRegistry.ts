/**
 * locationIconRegistry.ts — Registry of location icon definitions for the hex map.
 *
 * Production-quality hand-drawn SVG silhouette paths for all 17 LocationType values.
 * Art style matches Phase 5 terrain signifiers: organic paths, multi-layer opacity,
 * sun-from-right shadow (shadow on left face of structures).
 *
 * Icon style guide:
 * - Capital/City: complex fortified settlements (full size class)
 * - Castles/Forts/Tower: military structures (medium/small)
 * - Temples/Shrines: religious architecture (medium/small)
 * - Ruins: broken versions of their intact counterparts
 * - Mining/Camp/Battleground/POI: utility and special markers
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
  | 'unexplored_poi'
  | 'lair'
  | 'cleared_lair'
  // Sphere-resonant wonder locations
  | 'healing_spring'
  | 'master_forge'
  | 'living_archive'
  | 'fey_crossing'
  | 'sacrifice_site'
  | 'convergence'
  | 'time_scar'
  | 'standing_stones'
  | 'shadow_hollow'
  | 'ley_nexus'
  // Wilderness interest locations
  | 'cavern'
  | 'grove'
  | 'hot_spring'
  | 'shipwreck'
  | 'ancient_road'
  | 'monument'
  // Natural anomalies (economy/treasure)
  | 'gem_deposit'
  | 'golden_grove'
  | 'crystal_cavern'
  | 'ancient_vault'
  | 'sunken_treasury'
  | 'herb_garden'
  | 'fossil_bed'
  | 'iron_seep'
  | 'pearl_shoal'
  | 'glowcap_hollow'
  // Monster/danger locations
  | 'nest'
  | 'haunted_ground'
  | 'corruption_zone'
  // Ruins layer (THR-153) — transformed elder_ruin
  | 'place_of_power';

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

/**
 * Size classes that render centered on the hex (no ring offset).
 * Large locations stay centered to avoid spillover into neighbor hexes.
 * Smaller size classes distribute in a ring around the hex center.
 */
export const CENTERED_SIZE_CLASSES = new Set<LocationSizeClass>(['full', 'medium']);

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
  lair:           'small',
  cleared_lair:   'small',
  // Sphere-resonant — convergence is town-tier; rest are small
  convergence:     'town',
  healing_spring:  'small',
  master_forge:    'small',
  living_archive:  'small',
  fey_crossing:    'small',
  sacrifice_site:  'small',
  time_scar:       'small',
  standing_stones: 'small',
  shadow_hollow:   'small',
  ley_nexus:       'small',
  // Wilderness interest
  cavern:          'small',
  grove:           'small',
  hot_spring:      'small',
  shipwreck:       'small',
  ancient_road:    'small',
  monument:        'small',
  // Natural anomalies — most are small; crystal_cavern and ancient_vault are notable
  gem_deposit:     'small',
  golden_grove:    'small',
  crystal_cavern:  'small',
  ancient_vault:   'small',
  sunken_treasury: 'small',
  herb_garden:     'small',
  fossil_bed:      'small',
  iron_seep:       'small',
  pearl_shoal:     'small',
  glowcap_hollow:  'small',
  // Monster/danger
  nest:            'small',
  haunted_ground:  'small',
  corruption_zone: 'small',
  // Ruins layer (THR-153)
  place_of_power:  'town',
};

// ── Production SVG paths ───────────────────────────────────────────────────────
// All paths use viewBox "0 0 100 100". Hand-drawn silhouette style matching Phase 5.
// Multi-layer opacity (0.2–1.0) for depth. Sun-from-right: shadow on LEFT face.
// Organic paths — irregular vertices, no mechanical precision. Filled only, no strokes.

/**
 * Capital: Grand crenellated castle — central keep with flanking towers, banner on pole.
 * Shadow layer on left wall face. 4 layers.
 */
const CAPITAL_PATHS: LocationPathDef[] = [
  // City mass / curtain wall base
  { d: 'M12 82 L12 42 L18 42 L18 37 L24 37 L24 42 L36 42 L36 37 L44 37 L44 42 L56 42 L56 37 L64 37 L64 42 L76 42 L76 37 L82 37 L82 42 L88 42 L88 82 Z', opacity: 0.25 },
  // Shadow layer — left wall face
  { d: 'M12 42 L12 82 L26 82 L26 42 Z', opacity: 0.2 },
  // Central keep with flanking towers
  { d: 'M30 82 L30 28 L36 28 L36 22 L44 22 L44 18 L56 18 L56 22 L64 22 L64 28 L70 28 L70 82 Z M19 82 L19 50 L28 50 L28 82 Z M72 82 L72 50 L81 50 L81 82 Z', opacity: 0.65 },
  // Banner pole + flag, keep crenellations
  { d: 'M49 18 L49 8 L49 18 Z M49 8 L58 11 L49 14 Z M31 28 L31 22 L36 22 L36 28 Z M43 28 L43 22 L49 22 L49 28 Z M51 28 L51 22 L57 22 L57 28 Z M64 28 L64 22 L69 22 L69 28 Z', opacity: 1.0 },
];

/**
 * City: Walled town — crenellated curtain wall spanning full width, 2-3 towers behind.
 * Shadow on left wall sections. 3 layers.
 */
const CITY_PATHS: LocationPathDef[] = [
  // Full wall + towers base
  { d: 'M10 82 L10 48 L17 48 L17 42 L25 42 L25 48 L38 48 L38 42 L46 42 L46 48 L54 48 L54 42 L62 42 L62 48 L75 48 L75 42 L83 42 L83 48 L90 48 L90 82 Z', opacity: 0.3 },
  // Shadow — left portion of wall
  { d: 'M10 48 L10 82 L24 82 L24 48 Z', opacity: 0.2 },
  // Towers behind wall — left tower, centre tower (tallest), right tower
  { d: 'M16 82 L16 34 L27 34 L27 82 Z M42 82 L42 22 L58 22 L58 82 Z M73 82 L73 38 L84 38 L84 82 Z', opacity: 1.0 },
];

/**
 * Town: Building cluster with central spire — 3-4 varied buildings, tallest has pointed spire.
 * Organic rooflines, shadow on left faces. 3 layers.
 */
const TOWN_PATHS: LocationPathDef[] = [
  // Building cluster base — organic footprint
  { d: 'M18 82 L18 54 L33 54 L33 58 L41 58 L41 46 L59 46 L59 58 L67 58 L67 52 L82 52 L82 82 Z', opacity: 0.3 },
  // Shadow layer — left sides of buildings
  { d: 'M18 54 L18 82 L28 82 L28 54 Z M41 46 L41 82 L50 82 L50 46 Z', opacity: 0.2 },
  // Rooflines and spire — pointed central spire, gabled secondary roofs
  { d: 'M18 54 L26 38 L33 54 Z M33 58 L41 48 L41 58 Z M41 46 L50 26 L59 46 Z M59 58 L67 50 L67 58 Z M67 52 L75 40 L82 52 Z', opacity: 1.0 },
];

/**
 * Hamlet: Two modest peaked-roof cottages — simple silhouettes, thatched roofline feel.
 * Shadow on left walls. 2 layers.
 */
const HAMLET_PATHS: LocationPathDef[] = [
  // Two house bodies + shadow on left wall
  { d: 'M14 82 L14 56 L42 56 L42 82 Z M52 82 L52 60 L82 60 L82 82 Z M14 56 L14 82 L22 82 L22 56 Z M52 60 L52 82 L60 82 L60 60 Z', opacity: 0.35 },
  // Roof triangles — irregular gabled peaks, slightly uneven
  { d: 'M11 56 L28 34 L45 56 Z M49 60 L67 42 L85 60 Z', opacity: 1.0 },
];

/**
 * Castle: Stocky fortified tower — single main tower with crenellations, buttressed base.
 * Heavier and wider than tower. Shadow on left face. 3 layers.
 */
const CASTLE_PATHS: LocationPathDef[] = [
  // Outer curtain wall — wide, low
  { d: 'M14 82 L14 52 L22 52 L22 46 L30 46 L30 52 L70 52 L70 46 L78 46 L78 52 L86 52 L86 82 Z', opacity: 0.3 },
  // Shadow layer — left face of keep and wall
  { d: 'M28 82 L28 28 L40 28 L40 82 Z M14 52 L14 82 L27 82 L27 52 Z', opacity: 0.2 },
  // Central keep with crenellations
  { d: 'M28 82 L28 28 L72 28 L72 82 Z M28 28 L28 22 L36 22 L36 28 Z M44 28 L44 22 L52 22 L52 28 Z M56 28 L56 22 L64 22 L64 28 Z M64 28 L64 22 L72 22 L72 28 Z', opacity: 1.0 },
];

/**
 * Fort: Low-profile military square — wide rectangular body, corner turret nubs.
 * Distinctly wider than tall, military silhouette. 3 layers.
 */
const FORT_PATHS: LocationPathDef[] = [
  // Fort body base
  { d: 'M16 74 L16 36 L84 36 L84 74 Z', opacity: 0.3 },
  // Shadow — left face
  { d: 'M16 36 L16 74 L30 74 L30 36 Z', opacity: 0.2 },
  // Corner turrets + wall merlons
  { d: 'M10 80 L10 30 L24 30 L24 36 L76 36 L76 30 L90 30 L90 80 Z M24 36 L24 30 L30 30 L30 36 Z M42 36 L42 30 L48 30 L48 36 Z M52 36 L52 30 L58 30 L58 36 Z M70 36 L70 30 L76 30 L76 36 Z', opacity: 1.0 },
];

/**
 * Tower: Single slim watchtower — much taller than wide, flat-top cap, no crenellations.
 * Narrower than castle. Shadow on left face. 2 layers.
 */
const TOWER_PATHS: LocationPathDef[] = [
  // Tower body shadow (left face)
  { d: 'M39 82 L39 24 L48 24 L48 82 Z', opacity: 0.25 },
  // Tower silhouette + cap + narrow slit window
  { d: 'M39 82 L39 24 L62 24 L62 82 Z M36 24 L36 18 L65 18 L65 24 Z M48 48 L48 56 L53 56 L53 48 Z', opacity: 1.0 },
];

/**
 * Temple: Domed religious structure — central dome, flanking pinnacles, stepped base.
 * Distinct from castle — wider, rounder dome mass. 3 layers.
 */
const TEMPLE_PATHS: LocationPathDef[] = [
  // Stepped base platform
  { d: 'M12 82 L12 72 L88 72 L88 82 Z M16 72 L16 65 L84 65 L84 72 Z', opacity: 0.3 },
  // Shadow — left side of dome mass
  { d: 'M20 65 L20 38 L38 22 L38 65 Z', opacity: 0.2 },
  // Dome silhouette + flanking spires
  { d: 'M20 65 L20 38 L38 22 L50 18 L62 22 L80 38 L80 65 Z M36 65 L36 30 L42 30 L42 65 Z M58 65 L58 30 L64 30 L64 65 Z M30 30 L30 24 L38 20 L38 30 Z M62 30 L62 24 L70 20 L70 30 Z', opacity: 1.0 },
];

/**
 * Shrine: Dolmen standing stones — two upright stones with capstone, mystical simplicity.
 * Shadow on left upright. 2 layers.
 */
const SHRINE_PATHS: LocationPathDef[] = [
  // Shadow — left upright face
  { d: 'M24 82 L24 46 L32 46 L32 82 Z', opacity: 0.25 },
  // Two uprights + capstone spanning them
  { d: 'M24 82 L24 46 L36 46 L36 82 Z M64 82 L64 46 L76 46 L76 82 Z M18 46 L18 38 L82 38 L82 46 Z', opacity: 1.0 },
];

/**
 * Ruins: Generic crumbled building — partial standing walls with gaps, rubble mounds.
 * Broken silhouette reads as "destroyed structure." 3 layers.
 */
const RUINS_PATHS: LocationPathDef[] = [
  // Rubble mound at ground level
  { d: 'M12 82 L12 72 L28 72 L38 66 L48 72 L52 68 L62 72 L72 68 L82 72 L88 72 L88 82 Z', opacity: 0.3 },
  // Partial standing walls — broken gaps between sections
  { d: 'M14 72 L14 44 L26 44 L26 72 Z M54 72 L54 36 L64 36 L64 52 L72 52 L72 72 Z', opacity: 0.65 },
  // Remaining arch / top fragment
  { d: 'M26 44 L26 38 L38 28 L50 38 L50 44 Z', opacity: 1.0 },
];

/**
 * Ruined City: Broken version of city icon — wall has gaps, one tower toppled, rubble at base.
 * Must read as "this was once a walled city." 3 layers.
 */
const RUINED_CITY_PATHS: LocationPathDef[] = [
  // Partial curtain wall — gaps on right section, left section standing
  { d: 'M10 82 L10 48 L17 48 L17 42 L25 42 L25 48 L38 48 L38 42 L46 42 L46 48 L54 48 L54 82 Z M72 52 L72 42 L80 42 L80 52 L90 52 L90 82 L72 82 Z', opacity: 0.3 },
  // Shadow on left wall section
  { d: 'M10 48 L10 82 L24 82 L24 48 Z', opacity: 0.2 },
  // Left tower (intact), centre tower (truncated/broken), rubble mound right side
  { d: 'M16 82 L16 34 L27 34 L27 82 Z M42 82 L42 22 L50 22 L55 35 L58 22 L58 48 L58 82 Z M60 78 L68 64 L76 72 L84 66 L90 72 L90 82 Z', opacity: 1.0 },
];

/**
 * Ruined Tower: Truncated broken tower — same slim body as tower (LIART-07)
 * but top cut at irregular angle with crack. Must read as "broken tower." 3 layers.
 */
const RUINED_TOWER_PATHS: LocationPathDef[] = [
  // Shadow on left face (same proportion as tower)
  { d: 'M39 82 L39 38 L48 38 L48 82 Z', opacity: 0.25 },
  // Truncated tower body — top cut jagged
  { d: 'M39 82 L39 38 L62 38 L62 82 Z', opacity: 0.65 },
  // Jagged broken top + rubble at base
  { d: 'M36 38 L42 28 L47 35 L53 24 L59 32 L65 38 Z M32 78 L40 70 L50 76 L60 68 L68 76 L68 82 L32 82 Z', opacity: 1.0 },
];

/**
 * Ruined Village: Collapsed hamlet — same 2-house layout as hamlet (LIART-04)
 * but one roof collapsed and one structure leaning. Must read as "ruined village." 2 layers.
 */
const RUINED_VILLAGE_PATHS: LocationPathDef[] = [
  // Foundation outlines — same footprint as hamlet but with gaps/debris
  { d: 'M14 82 L14 56 L42 56 L42 82 Z M52 82 L52 60 L82 60 L82 82 Z M14 56 L14 82 L22 82 L22 56 Z', opacity: 0.3 },
  // Left cottage: roof collapsed (broken peak). Right cottage: leaning wall + partial roof.
  { d: 'M11 56 L20 42 L28 50 L36 38 L45 56 Z M49 60 L56 54 L63 60 Z M62 60 L62 52 L70 46 L78 52 L78 60 Z M54 76 L48 82 L82 82 L82 76 Z', opacity: 1.0 },
];

/**
 * Mining: Triangular headframe above shaft entrance — industrial silhouette.
 * Headframe is an A-frame with dark opening beneath. 3 layers.
 */
const MINING_PATHS: LocationPathDef[] = [
  // Platform / ground level
  { d: 'M12 82 L12 74 L88 74 L88 82 Z', opacity: 0.3 },
  // Shadow — left face of headframe
  { d: 'M36 74 L50 30 L50 74 Z', opacity: 0.2 },
  // A-frame headframe + shaft opening
  { d: 'M36 74 L50 30 L64 74 Z M42 74 L42 58 L58 58 L58 74 Z', opacity: 1.0 },
];

/**
 * Camp: Tent cluster — two conical tents side by side, slightly different heights.
 * Left tent has shadow on left face. 2 layers.
 */
const CAMP_PATHS: LocationPathDef[] = [
  // Shadow — left face of left tent
  { d: 'M18 76 L36 34 L36 76 Z', opacity: 0.25 },
  // Two conical tents + ground line
  { d: 'M18 76 L36 34 L54 76 Z M50 76 L66 44 L82 76 Z M14 76 L14 82 L86 82 L86 76 Z', opacity: 1.0 },
];

/**
 * Battleground: Crossed swords in X formation — two sword silhouettes crossing center.
 * Simple iconic shape, immediately readable. 3 layers.
 */
const BATTLEGROUND_PATHS: LocationPathDef[] = [
  // Sword bodies — each a long tapered blade shape
  { d: 'M22 14 L30 14 L78 82 L70 82 Z', opacity: 0.5 },
  { d: 'M78 14 L70 14 L22 82 L30 82 Z', opacity: 0.5 },
  // Crossguard intersection
  { d: 'M38 46 L62 46 L62 54 L38 54 Z', opacity: 1.0 },
];

/**
 * Unexplored POI: Upside-down teardrop marker with organic question mark cutout.
 * Tiny size class — must read clearly at 25% of HEX_SIZE. 2 layers.
 */
const UNEXPLORED_POI_PATHS: LocationPathDef[] = [
  // Outer teardrop body
  { d: 'M50 10 L62 26 L68 38 L68 52 L62 64 L50 72 L38 64 L32 52 L32 38 L38 26 Z', opacity: 0.35 },
  // Question mark shape — top arc + dot
  { d: 'M44 36 L44 30 L56 30 L56 40 L50 46 L50 54 L48 54 L48 46 L54 40 L54 34 L46 34 L46 36 Z M48 58 L52 58 L52 62 L48 62 Z', opacity: 1.0 },
];

/**
 * Lair: Cave entrance silhouette — jagged downward arch with stalagmite teeth.
 * Sphere-tinted fill is applied at texture build time (sphere fill override).
 * sizeClass is 'small' as base; LocationIconMesh overrides per lairTier.
 * 2 layers: outer arch (opacity 1.0) + inner void (opacity 0.7).
 */
const LAIR_PATHS: LocationPathDef[] = [
  // Outer cave arch — rough inverted U with jagged stalactite/stalagmite teeth
  { d: 'M18 82 L18 58 L22 52 L20 44 L26 40 L24 34 L32 28 L36 24 L42 20 L50 18 L58 20 L64 24 L68 28 L76 34 L74 40 L80 44 L78 52 L82 58 L82 82 Z M26 82 L26 70 L30 62 L34 68 L38 58 L42 66 L46 56 L50 64 L54 56 L58 66 L62 58 L66 68 L70 62 L74 70 L74 82 Z', opacity: 1.0 },
  // Inner void — dark interior opening
  { d: 'M30 72 L30 58 L34 54 L36 50 L42 46 L50 44 L58 46 L64 50 L66 54 L70 58 L70 72 Z', opacity: 0.7 },
];

/**
 * Cleared Lair: Cracked/broken cave arch — same arch shape but bisected by a horizontal crack.
 * Fixed 'small' sizeClass, fixed fill #2a2520 (no sphere tint).
 * 2 layers: partial arch (opacity 1.0) + ghost fill (opacity 0.2).
 */
const CLEARED_LAIR_PATHS: LocationPathDef[] = [
  // Partial arch — bisected by crack (gap between top and bottom halves)
  { d: 'M18 82 L18 58 L22 52 L20 44 L26 40 L24 34 L32 28 L36 24 L42 20 L50 18 L58 20 L64 24 L68 28 L76 34 L74 40 L80 44 L78 52 L82 58 L82 82 L74 82 L74 70 L70 62 L66 68 L62 58 L58 66 L54 56 L50 64 L46 56 L42 66 L38 58 L34 68 L30 62 L26 70 L26 82 Z M24 50 L76 50 L78 54 L22 54 Z', opacity: 1.0 },
  // Ghost interior — very faint, communicates "was here, gone now"
  { d: 'M30 72 L30 58 L34 54 L36 50 L42 46 L50 44 L58 46 L64 50 L66 54 L70 58 L70 72 Z', opacity: 0.2 },
];

// ── Sphere-Resonant Wonder Location Icons ────────────────────────────────────

/**
 * Healing Spring: Upwelling water with radiating ripples — bowl shape with 3 arced lines.
 * Gentle, organic. 2 layers.
 */
const HEALING_SPRING_PATHS: LocationPathDef[] = [
  // Bowl / pool base
  { d: 'M24 72 Q24 54 50 50 Q76 54 76 72 Z', opacity: 0.3 },
  // Ripple arcs + upwelling jet
  { d: 'M36 62 Q50 52 64 62 M30 68 Q50 56 70 68 M50 50 L50 32 Q52 28 50 24 Q48 28 50 32', opacity: 1.0 },
];

/**
 * Master Forge: Anvil silhouette with sparks — heavy flat-topped anvil with hammer above.
 * 2 layers.
 */
const MASTER_FORGE_PATHS: LocationPathDef[] = [
  // Anvil base
  { d: 'M28 82 L28 58 L22 58 L22 52 L78 52 L78 58 L72 58 L72 82 Z', opacity: 0.35 },
  // Anvil body + hammer + spark dots
  { d: 'M30 58 L30 44 L24 44 L24 38 L76 38 L76 44 L70 44 L70 58 Z M44 38 L44 22 L40 18 L60 18 L56 22 L56 38 Z M34 28 L30 24 M66 28 L70 24 M38 22 L36 16 M62 22 L64 16', opacity: 1.0 },
];

/**
 * Living Archive: Open book with hovering wisps — book shape with 3 floating dots above.
 * 2 layers.
 */
const LIVING_ARCHIVE_PATHS: LocationPathDef[] = [
  // Book body — open pages
  { d: 'M20 76 L20 40 L50 46 L80 40 L80 76 L50 70 Z', opacity: 0.35 },
  // Pages + spine + floating knowledge wisps
  { d: 'M20 40 L50 46 L50 70 M50 46 L80 40 M24 48 L46 52 M54 52 L76 48 M38 28 L38 32 L42 32 L42 28 Z M50 22 L50 26 L54 26 L54 22 Z M62 28 L62 32 L66 32 L66 28 Z', opacity: 1.0 },
];

/**
 * Fey Crossing: Mushroom ring with spiraling motes — circle of small mushroom shapes.
 * 2 layers.
 */
const FEY_CROSSING_PATHS: LocationPathDef[] = [
  // Fairy ring ground circle
  { d: 'M50 28 Q74 28 76 50 Q76 72 50 74 Q26 74 24 50 Q24 28 50 28 Z M50 34 Q68 34 70 50 Q70 66 50 68 Q32 68 30 50 Q30 34 50 34 Z', opacity: 0.2 },
  // Mushroom caps around the ring + central shimmer
  { d: 'M46 30 L50 24 L54 30 Z M68 44 L74 40 L74 48 Z M68 58 L74 54 L74 62 Z M54 72 L50 78 L46 72 Z M26 58 L20 54 L20 62 Z M26 44 L20 40 L20 48 Z M48 48 L50 44 L52 48 L50 52 Z', opacity: 1.0 },
];

/**
 * Sacrifice Site: Flat stone altar with dark stain — low rectangular altar, drip marks.
 * 2 layers.
 */
const SACRIFICE_SITE_PATHS: LocationPathDef[] = [
  // Dark stain pool beneath
  { d: 'M30 78 Q32 70 50 68 Q68 70 70 78 Z', opacity: 0.3 },
  // Stone altar slab + blood channels + upright stones flanking
  { d: 'M28 68 L28 56 L72 56 L72 68 Z M24 68 L24 46 L32 46 L32 56 Z M68 56 L68 46 L76 46 L76 68 Z M40 56 L40 48 M50 56 L50 44 M60 56 L60 48', opacity: 1.0 },
];

/**
 * Convergence: Concentric power rings with central spike — 2 rings with a vertical line.
 * 2 layers.
 */
const CONVERGENCE_PATHS: LocationPathDef[] = [
  // Outer ring
  { d: 'M50 18 Q82 18 82 50 Q82 82 50 82 Q18 82 18 50 Q18 18 50 18 Z M50 26 Q74 26 74 50 Q74 74 50 74 Q26 74 26 50 Q26 26 50 26 Z', opacity: 0.25 },
  // Inner ring + central spike
  { d: 'M50 34 Q66 34 66 50 Q66 66 50 66 Q34 66 34 50 Q34 34 50 34 Z M50 42 Q58 42 58 50 Q58 58 50 58 Q42 58 42 50 Q42 42 50 42 Z M50 12 L50 88', opacity: 1.0 },
];

/**
 * Time Scar: Jagged crack / fissure — zigzag line splitting the hex vertically.
 * 2 layers.
 */
const TIME_SCAR_PATHS: LocationPathDef[] = [
  // Glow / distortion zone around crack
  { d: 'M40 20 L34 38 L42 50 L36 64 L44 82 L56 82 L64 64 L58 50 L66 38 L60 20 Z', opacity: 0.2 },
  // Jagged crack line
  { d: 'M48 16 L44 30 L52 42 L46 56 L54 68 L48 84 M52 16 L56 30 L48 42 L54 56 L46 68 L52 84', opacity: 1.0 },
];

/**
 * Standing Stones: Three vertical menhirs in a row — tallest in center.
 * 2 layers.
 */
const STANDING_STONES_PATHS: LocationPathDef[] = [
  // Shadow on left faces
  { d: 'M22 82 L22 46 L28 46 L28 82 Z M46 82 L46 32 L52 32 L52 82 Z', opacity: 0.25 },
  // Three standing stones — center tallest
  { d: 'M22 82 L22 46 L24 40 L30 40 L32 46 L32 82 Z M44 82 L44 32 L48 24 L54 24 L58 32 L58 82 Z M68 82 L68 50 L70 44 L76 44 L78 50 L78 82 Z', opacity: 1.0 },
];

/**
 * Shadow Hollow: Downward-curving depression with dark void — concave shape.
 * 2 layers.
 */
const SHADOW_HOLLOW_PATHS: LocationPathDef[] = [
  // Dark void fill
  { d: 'M20 50 Q30 72 50 76 Q70 72 80 50 Q80 82 50 82 Q20 82 20 50 Z', opacity: 0.4 },
  // Rim / edge of hollow with wisps of darkness
  { d: 'M16 48 Q30 70 50 74 Q70 70 84 48 M28 56 L24 64 M72 56 L76 64 M44 68 L40 78 M56 68 L60 78', opacity: 1.0 },
];

/**
 * Ley Nexus: Radiating star / starburst — 6-pointed lines from center.
 * 2 layers.
 */
const LEY_NEXUS_PATHS: LocationPathDef[] = [
  // Glow around center
  { d: 'M50 30 Q66 30 70 50 Q66 70 50 70 Q34 70 30 50 Q34 30 50 30 Z', opacity: 0.25 },
  // 6-pointed starburst from center
  { d: 'M50 50 L50 18 M50 50 L50 82 M50 50 L22 34 M50 50 L78 34 M50 50 L22 66 M50 50 L78 66 M44 44 L56 56 M56 44 L44 56', opacity: 1.0 },
];

/**
 * Place of Power (THR-153) — luminous crown of rays around a cairn-stone.
 * A transformed elder ruin: stable, holder-bound, broadcasts passive essence.
 * Distinct from ley_nexus by the solid ring (stability) vs ley's starburst.
 * 3 layers.
 */
const PLACE_OF_POWER_PATHS: LocationPathDef[] = [
  // Outer aureole — soft halo
  { d: 'M50 20 Q80 20 80 50 Q80 80 50 80 Q20 80 20 50 Q20 20 50 20 Z', opacity: 0.18 },
  // Ring of rays (crown)
  { d: 'M50 26 L52 12 L48 12 Z M74 38 L86 30 L84 34 Z M74 62 L86 70 L84 66 Z M50 74 L52 88 L48 88 Z M26 62 L14 70 L16 66 Z M26 38 L14 30 L16 34 Z', opacity: 0.7 },
  // Central cairn / pedestal stone
  { d: 'M42 66 L42 50 Q42 42 50 42 Q58 42 58 50 L58 66 Z', opacity: 1.0 },
];

// ── Wilderness Interest Location Icons ───────────────────────────────────────

/**
 * Cavern: Dark arch cave entrance — wider and lower than lair, no teeth.
 * 2 layers.
 */
const CAVERN_PATHS: LocationPathDef[] = [
  // Cave arch shadow
  { d: 'M18 82 L18 56 Q30 34 50 30 Q70 34 82 56 L82 82 Z', opacity: 0.3 },
  // Cave opening — dark interior
  { d: 'M24 82 L24 58 Q36 40 50 36 Q64 40 76 58 L76 82 Z M32 82 L32 62 Q40 48 50 44 Q60 48 68 62 L68 82 Z', opacity: 1.0 },
];

/**
 * Grove: Three trees in cluster — simple trunk+canopy silhouettes.
 * 2 layers.
 */
const GROVE_PATHS: LocationPathDef[] = [
  // Shadow on left tree
  { d: 'M22 82 L22 52 L28 52 L28 82 Z', opacity: 0.25 },
  // Three trees — trunks + canopy circles
  { d: 'M24 82 L24 54 L28 54 L28 82 Z M48 82 L48 48 L52 48 L52 82 Z M72 82 L72 56 L76 56 L76 82 Z M14 54 Q14 34 26 34 Q38 34 38 54 Q38 62 26 62 Q14 62 14 54 Z M38 48 Q38 28 50 28 Q62 28 62 48 Q62 56 50 56 Q38 56 38 48 Z M62 56 Q62 40 74 40 Q86 40 86 56 Q86 64 74 64 Q62 64 62 56 Z', opacity: 1.0 },
];

/**
 * Hot Spring: Steaming pool with rising wisps — curved pool with wavy lines above.
 * 2 layers.
 */
const HOT_SPRING_PATHS: LocationPathDef[] = [
  // Pool
  { d: 'M20 72 Q20 58 50 54 Q80 58 80 72 Q80 82 50 82 Q20 82 20 72 Z', opacity: 0.35 },
  // Steam wisps
  { d: 'M34 52 Q32 42 36 36 Q40 30 38 22 M50 48 Q48 38 52 32 Q56 26 54 18 M66 52 Q64 42 68 36 Q72 30 70 22', opacity: 1.0 },
];

/**
 * Shipwreck: Broken ship hull sticking out of water — angled broken mast + hull ribs.
 * 2 layers.
 */
const SHIPWRECK_PATHS: LocationPathDef[] = [
  // Water line
  { d: 'M10 72 Q30 68 50 72 Q70 76 90 72 L90 82 L10 82 Z', opacity: 0.3 },
  // Broken hull + tilted mast
  { d: 'M30 72 L34 48 L40 44 L46 48 L50 72 Z M38 44 L32 20 M32 20 L26 24 L32 28 M36 60 L44 60 M34 54 L42 54', opacity: 1.0 },
];

/**
 * Monument: Obelisk / tall standing stone — single tall narrow monolith.
 * 2 layers.
 */
const MONUMENT_PATHS: LocationPathDef[] = [
  // Shadow on left face
  { d: 'M40 82 L40 28 L48 28 L48 82 Z', opacity: 0.25 },
  // Obelisk body with pointed top
  { d: 'M40 82 L40 28 L50 14 L60 28 L60 82 Z', opacity: 1.0 },
];

/**
 * Ancient Road: Two parallel lines with broken sections — worn paving stones.
 * 2 layers.
 */
const ANCIENT_ROAD_PATHS: LocationPathDef[] = [
  // Road surface
  { d: 'M20 56 L80 44 L80 56 L20 68 Z', opacity: 0.25 },
  // Paving lines — broken in places
  { d: 'M20 56 L38 52 M44 50 L62 46 M68 44 L80 42 M20 68 L34 64 M40 62 L58 58 M64 56 L80 52', opacity: 1.0 },
];

// ── Natural Anomaly Icons ────────────────────────────────────────────────────
// Economy/treasure locations use a shared diamond-with-sparkle base icon
// with a subtype-specific inner symbol. This signals "discoverable resource."

/**
 * Gem Deposit: Diamond shape with inner gem facets.
 * 2 layers.
 */
const GEM_DEPOSIT_PATHS: LocationPathDef[] = [
  { d: 'M50 20 L76 50 L50 80 L24 50 Z', opacity: 0.25 },
  { d: 'M50 26 L70 50 L50 74 L30 50 Z M38 44 L50 32 L62 44 M38 56 L50 68 L62 56 M30 50 L50 44 L70 50 L50 56 Z', opacity: 1.0 },
];

/**
 * Crystal Cavern: Cluster of angular crystal shards pointing up.
 * 2 layers.
 */
const CRYSTAL_CAVERN_PATHS: LocationPathDef[] = [
  { d: 'M30 82 L30 50 L38 50 L38 82 Z M46 82 L46 36 L54 36 L54 82 Z M62 82 L62 46 L70 46 L70 82 Z', opacity: 0.25 },
  { d: 'M28 50 L34 22 L40 50 Z M44 36 L50 10 L56 36 Z M60 46 L66 26 L72 46 Z M22 62 L28 48 L34 62 Z M66 58 L72 42 L78 58 Z', opacity: 1.0 },
];

// For less-visually-distinctive anomalies, reuse the gem_deposit diamond base
// with minor variations. The icon registry fail-soft means unregistered types
// simply don't render an icon — that's acceptable until custom art is added.

// ── Monster/Danger Location Icons ────────────────────────────────────────────

/**
 * Nest: Oval hive mound with dark entrance holes — like a termite mound.
 * 2 layers.
 */
const NEST_PATHS: LocationPathDef[] = [
  { d: 'M30 82 Q20 60 30 40 Q40 24 50 22 Q60 24 70 40 Q80 60 70 82 Z', opacity: 0.3 },
  { d: 'M34 82 Q26 62 34 44 Q42 28 50 26 Q58 28 66 44 Q74 62 66 82 Z M40 52 L44 48 L48 52 L44 56 Z M52 44 L56 40 L60 44 L56 48 Z M44 64 L48 60 L52 64 L48 68 Z M56 56 L60 52 L64 56 L60 60 Z', opacity: 1.0 },
];

/**
 * Haunted Ground: Tilted grave markers — 2-3 askew headstones with wisps.
 * 2 layers.
 */
const HAUNTED_GROUND_PATHS: LocationPathDef[] = [
  { d: 'M14 82 L14 76 L86 76 L86 82 Z', opacity: 0.25 },
  { d: 'M22 76 L20 46 Q20 38 28 38 Q36 38 34 46 L32 76 Z M44 76 L46 40 Q46 32 54 30 Q62 32 60 40 L58 76 Z M68 76 L66 50 Q66 42 74 42 Q82 42 80 50 L78 76 Z M26 38 Q24 28 28 24 M52 30 Q50 20 54 14 M74 42 Q76 32 74 26', opacity: 1.0 },
];

/**
 * Corruption Zone: Cracked ground with seeping tendrils — irregular fissures.
 * 2 layers.
 */
const CORRUPTION_ZONE_PATHS: LocationPathDef[] = [
  { d: 'M20 40 Q30 30 50 28 Q70 30 80 40 Q84 60 80 72 Q70 82 50 82 Q30 82 20 72 Q16 60 20 40 Z', opacity: 0.3 },
  { d: 'M50 28 L46 42 L52 52 L48 66 L50 82 M34 36 L38 48 L34 60 L36 74 M66 36 L62 48 L66 60 L64 74 M28 50 L38 52 M72 50 L62 52', opacity: 1.0 },
];

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Complete registry of location icon definitions.
 * All 17 location types are registered with production hand-drawn SVG paths (Plan 02).
 * Multi-layer opacity compositing, sun-from-right shadow, organic irregular paths.
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
  // Monster lairs — sphere-tinted fill applied at texture build time
  lair:           { paths: LAIR_PATHS,            viewBox: '0 0 100 100', sizeClass: 'small'  },
  cleared_lair:   { paths: CLEARED_LAIR_PATHS,    viewBox: '0 0 100 100', sizeClass: 'small'  },
  // ── Sphere-resonant wonder locations ──
  healing_spring:  { paths: HEALING_SPRING_PATHS,  viewBox: '0 0 100 100', sizeClass: 'small'  },
  master_forge:    { paths: MASTER_FORGE_PATHS,    viewBox: '0 0 100 100', sizeClass: 'small'  },
  living_archive:  { paths: LIVING_ARCHIVE_PATHS,  viewBox: '0 0 100 100', sizeClass: 'small'  },
  fey_crossing:    { paths: FEY_CROSSING_PATHS,    viewBox: '0 0 100 100', sizeClass: 'small'  },
  sacrifice_site:  { paths: SACRIFICE_SITE_PATHS,  viewBox: '0 0 100 100', sizeClass: 'small'  },
  convergence:     { paths: CONVERGENCE_PATHS,     viewBox: '0 0 100 100', sizeClass: 'medium' },
  time_scar:       { paths: TIME_SCAR_PATHS,       viewBox: '0 0 100 100', sizeClass: 'small'  },
  standing_stones: { paths: STANDING_STONES_PATHS, viewBox: '0 0 100 100', sizeClass: 'small'  },
  shadow_hollow:   { paths: SHADOW_HOLLOW_PATHS,   viewBox: '0 0 100 100', sizeClass: 'small'  },
  ley_nexus:       { paths: LEY_NEXUS_PATHS,       viewBox: '0 0 100 100', sizeClass: 'small'  },
  // ── Wilderness interest locations ──
  cavern:          { paths: CAVERN_PATHS,          viewBox: '0 0 100 100', sizeClass: 'small'  },
  grove:           { paths: GROVE_PATHS,           viewBox: '0 0 100 100', sizeClass: 'small'  },
  hot_spring:      { paths: HOT_SPRING_PATHS,      viewBox: '0 0 100 100', sizeClass: 'small'  },
  shipwreck:       { paths: SHIPWRECK_PATHS,       viewBox: '0 0 100 100', sizeClass: 'small'  },
  ancient_road:    { paths: ANCIENT_ROAD_PATHS,    viewBox: '0 0 100 100', sizeClass: 'small'  },
  monument:        { paths: MONUMENT_PATHS,        viewBox: '0 0 100 100', sizeClass: 'small'  },
  // ── Natural anomalies (economy/treasure) ──
  gem_deposit:     { paths: GEM_DEPOSIT_PATHS,     viewBox: '0 0 100 100', sizeClass: 'small'  },
  golden_grove:    { paths: GROVE_PATHS,           viewBox: '0 0 100 100', sizeClass: 'small'  },
  crystal_cavern:  { paths: CRYSTAL_CAVERN_PATHS,  viewBox: '0 0 100 100', sizeClass: 'small'  },
  ancient_vault:   { paths: RUINS_PATHS,           viewBox: '0 0 100 100', sizeClass: 'small'  },
  sunken_treasury: { paths: SHIPWRECK_PATHS,       viewBox: '0 0 100 100', sizeClass: 'small'  },
  herb_garden:     { paths: GROVE_PATHS,           viewBox: '0 0 100 100', sizeClass: 'tiny'   },
  fossil_bed:      { paths: GEM_DEPOSIT_PATHS,     viewBox: '0 0 100 100', sizeClass: 'tiny'   },
  iron_seep:       { paths: MINING_PATHS,          viewBox: '0 0 100 100', sizeClass: 'tiny'   },
  pearl_shoal:     { paths: GEM_DEPOSIT_PATHS,     viewBox: '0 0 100 100', sizeClass: 'tiny'   },
  glowcap_hollow:  { paths: FEY_CROSSING_PATHS,    viewBox: '0 0 100 100', sizeClass: 'tiny'   },
  // ── Monster/danger locations ──
  nest:            { paths: NEST_PATHS,            viewBox: '0 0 100 100', sizeClass: 'small'  },
  haunted_ground:  { paths: HAUNTED_GROUND_PATHS,  viewBox: '0 0 100 100', sizeClass: 'small'  },
  corruption_zone: { paths: CORRUPTION_ZONE_PATHS, viewBox: '0 0 100 100', sizeClass: 'small'  },
  // ── Ruins layer (THR-153) ──
  place_of_power:  { paths: PLACE_OF_POWER_PATHS,  viewBox: '0 0 100 100', sizeClass: 'medium' },
};
