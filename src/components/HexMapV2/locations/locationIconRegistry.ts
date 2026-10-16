/**
 * locationIconRegistry.ts — Registry of location icon definitions for the hex map.
 *
 * One entry per LocationType: the size class it draws at (and, below, its label importance).
 * The shape each type draws is its carved icon, `PLACE_ICON` → `iconShape()` (THR-1879 table,
 * THR-1903) — read through `placeIconShape` in `locationIconTextures.ts`, never stored here.
 * Adding a place type: one entry here plus its `PLACE_ICON` row (Law 58;
 * `placeIcons.coverage.test.ts` names a missing one).
 *
 * NFP #1 (tunability): All size scale values are named constants.
 * NFP #4 (fail-soft): An unknown type draws the `fallback` shape at `small` and warns once
 *   (`resolvePlaceIconDef`), instead of being skipped.
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

/** A location type's map icon entry: its size class. The shape comes from `PLACE_ICON`. */
export interface LocationIconDef {
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

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * One entry per LocationType: its size class on the map. The shape is not here — it is the
 * carved icon `iconShape(PLACE_ICON[type])` (THR-1879's table), rasterised by
 * `buildMapIconTexture` in the map's ink (THR-1878 plan D13, THR-1903). The hand-drawn
 * silhouettes retired with THR-1903; the open places keep temporary `own` copies in the icon
 * registry until Christian picks their carved shapes (THR-1908).
 *
 * Size class assignment:
 * - full:   capital, city (largest hexes)
 * - medium: town, castle, fort, temple, ruined_city
 * - small:  hamlet, tower, shrine, ruins, ruined_tower, ruined_village, mining, camp, battleground
 * - tiny:   unexplored_poi
 */
export const LOCATION_ICON_REGISTRY: Record<LocationType, LocationIconDef> = {
  capital:        { sizeClass: 'full' },
  city:           { sizeClass: 'full' },
  town:           { sizeClass: 'medium' },
  castle:         { sizeClass: 'medium' },
  fort:           { sizeClass: 'medium' },
  temple:         { sizeClass: 'medium' },
  ruined_city:    { sizeClass: 'medium' },
  hamlet:         { sizeClass: 'small' },
  tower:          { sizeClass: 'small' },
  shrine:         { sizeClass: 'small' },
  ruins:          { sizeClass: 'small' },
  ruined_tower:   { sizeClass: 'small' },
  ruined_village: { sizeClass: 'small' },
  mining:         { sizeClass: 'small' },
  camp:           { sizeClass: 'small' },
  battleground:   { sizeClass: 'small' },
  unexplored_poi: { sizeClass: 'tiny' },
  // Monster lairs — sphere-tinted fill applied at texture build time
  lair:           { sizeClass: 'small' },
  cleared_lair:   { sizeClass: 'small' },
  // ── Sphere-resonant wonder locations ──
  healing_spring:  { sizeClass: 'small' },
  master_forge:    { sizeClass: 'small' },
  living_archive:  { sizeClass: 'small' },
  fey_crossing:    { sizeClass: 'small' },
  sacrifice_site:  { sizeClass: 'small' },
  convergence:     { sizeClass: 'medium' },
  time_scar:       { sizeClass: 'small' },
  standing_stones: { sizeClass: 'small' },
  shadow_hollow:   { sizeClass: 'small' },
  ley_nexus:       { sizeClass: 'small' },
  // ── Wilderness interest locations ──
  cavern:          { sizeClass: 'small' },
  grove:           { sizeClass: 'small' },
  hot_spring:      { sizeClass: 'small' },
  shipwreck:       { sizeClass: 'small' },
  ancient_road:    { sizeClass: 'small' },
  monument:        { sizeClass: 'small' },
  // ── Natural anomalies (economy/treasure) ──
  gem_deposit:     { sizeClass: 'small' },
  golden_grove:    { sizeClass: 'small' },
  crystal_cavern:  { sizeClass: 'small' },
  ancient_vault:   { sizeClass: 'small' },
  sunken_treasury: { sizeClass: 'small' },
  herb_garden:     { sizeClass: 'tiny' },
  fossil_bed:      { sizeClass: 'tiny' },
  iron_seep:       { sizeClass: 'tiny' },
  pearl_shoal:     { sizeClass: 'tiny' },
  glowcap_hollow:  { sizeClass: 'tiny' },
  // ── Monster/danger locations ──
  nest:            { sizeClass: 'small' },
  haunted_ground:  { sizeClass: 'small' },
  corruption_zone: { sizeClass: 'small' },
  // ── Ruins layer (THR-153) ──
  place_of_power:  { sizeClass: 'medium' },
};

/** The size class an unknown place type's fallback mark draws at (plan D13). */
export const UNKNOWN_PLACE_SIZE_CLASS: LocationSizeClass = 'small';

/** The entry an unknown place type draws with (plan D13, Law 58). */
const UNKNOWN_PLACE_DEF: LocationIconDef = { sizeClass: UNKNOWN_PLACE_SIZE_CLASS };

/**
 * A place type's map icon entry, or — for a type with no entry — the fallback entry at
 * `small` with `known: false`, so the caller draws the fallback mark instead of skipping.
 */
export function resolvePlaceIconDef(type: string): { def: LocationIconDef; known: boolean } {
  if (Object.prototype.hasOwnProperty.call(LOCATION_ICON_REGISTRY, type)) {
    return { def: LOCATION_ICON_REGISTRY[type as LocationType], known: true };
  }
  return { def: UNKNOWN_PLACE_DEF, known: false };
}
