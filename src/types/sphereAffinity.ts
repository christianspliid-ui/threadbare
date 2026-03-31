/**
 * SphereAffinity — Per-Entity Sphere Scores
 *
 * Every entity (hex, agent, location, faction, culture) tracks its relationship
 * to all 12 spheres (4 foundation + 8 creation) as integer scores on the triangle number scale.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import { SPHERE_NAMES, type SphereName } from './index';

// ─── Core Interfaces ─────────────────────────────────────────────

/**
 * Per-entity sphere scores on the triangle number scale.
 * Scores are permanent integers; progress tracks partial advancement
 * toward the next level.
 */
export interface SphereAffinity {
  /** Permanent sphere scores — integer, triangle-number scale */
  scores: Record<SphereName, number>;
  /** Construction progress toward next level (0..nextLevelCost) per sphere */
  progress: Record<SphereName, number>;
}

/** What caused a sphere pressure event */
export type PressureSource =
  | 'divine_action'
  | 'control_effect'
  | 'encounter'
  | 'doom'
  | 'rival'
  | 'mandate'
  | 'overchannel'
  | 'environmental';

/**
 * A single sphere pressure event accumulated per tick.
 * Consumed by phaseSpherePressure to resolve permanent score changes.
 */
export interface SpherePressureEvent {
  targetEntityId: string;
  sphere: SphereName;
  /** Raw pressure magnitude — how much progress to apply */
  magnitude: number;
  source: PressureSource;
  sourceId: string;
}

// ─── Scale Constants (NFP #1: Tunability) ────────────────────────

/** Hard cap per sphere per entity (triangle cost 10 = 55 total) */
export const MAX_SPHERE_SCORE = 10;

/** Pressure applied to target on successful divine action */
export const ACTION_PRESSURE_SUCCESS = 3;
/** Pressure applied to target on failed divine action */
export const ACTION_PRESSURE_FAILURE = 1;
/** Pressure applied per tick from a control effect */
export const CONTROL_PRESSURE_PER_TICK = 1;
/** Pressure applied per encounter resolution step */
export const ENCOUNTER_PRESSURE_PER_STEP = 1;
/** Pressure per doom tier escalation */
export const DOOM_PRESSURE_PER_TIER = 4;
/** Pressure from rival divine actions */
export const RIVAL_PRESSURE_MAGNITUDE = 2;
/** Pressure from reaching mandate milestones */
export const MANDATE_PRESSURE_MILESTONE = 2;
/** Pressure from completing a mandate */
export const MANDATE_PRESSURE_COMPLETION = 5;
/** Ratio of agent sphere strength converted to location hex pressure via presence */
export const AGENT_PRESENCE_RATIO = 1.0;

// ─── Starting State Constants ─────────────────────────────────────

/** Bonus to primary sphere score when seeding an agent from archetype */
export const ARCHETYPE_SPHERE_BONUS_PRIMARY = 2;
/** Bonus to secondary sphere score when seeding an agent from archetype */
export const ARCHETYPE_SPHERE_BONUS_SECONDARY = 1;
/** Bonus to the location's thematic sphere (e.g., Force for a forge) */
export const LOCATION_TYPE_BONUS = 2;

// ─── Triangle Math ────────────────────────────────────────────────

/**
 * Investment required to advance sphere from level n-1 to n.
 * Triangle cost: level N costs N (linear, summing to triangle total).
 */
export function triangleCost(n: number): number {
  return n;
}

/**
 * Total cumulative investment to reach level n from 0.
 * Formula: n*(n+1)/2
 * Level 3 = 6, level 5 = 15, level 10 = 55.
 */
export function triangleTotal(n: number): number {
  return n * (n + 1) / 2;
}

// ─── Factory ──────────────────────────────────────────────────────

/**
 * Creates a fresh SphereAffinity with all 8 spheres at score 0 and progress 0.
 * Returns a new object each call — no shared references.
 */
export function createDefaultSphereAffinity(): SphereAffinity {
  const scores = {} as Record<SphereName, number>;
  const progress = {} as Record<SphereName, number>;
  for (const sphere of SPHERE_NAMES) {
    scores[sphere] = 0;
    progress[sphere] = 0;
  }
  return { scores, progress };
}

// ─── Terrain Sphere Table ─────────────────────────────────────────

/**
 * Maps terrain biome buckets to their primary sphere scores.
 * Sparse entries — only non-zero scores are listed.
 * Design source: Docs/plans/2026-03-28-world-soul-connection-design.md
 */
export const TERRAIN_SPHERE_TABLE: Record<string, Partial<Record<SphereName, number>>> = {
  // Forest — life domain, subtle darkness (mystery of the deep woods)
  forest:      { life: 3, spirit: 1, darkness: 1 },
  // Mountains — matter domain, subtle order (geological permanence)
  mountains:   { matter: 3, force: 1, order: 1 },
  // Plains — energy domain, subtle light (open skies)
  plains:      { energy: 2, life: 1, light: 1 },
  // Desert — force domain, subtle chaos (unpredictable wasteland)
  desert:      { force: 2, entropy: 1, chaos: 1 },
  // Swamp — entropy domain, subtle chaos (formless decay)
  swamp:       { entropy: 2, life: 1, chaos: 1 },
  // Coast — time domain, subtle light (the revealing horizon)
  coast:       { time: 2, energy: 1, light: 1 },
  // Volcanic — force domain, subtle chaos (violent transformation)
  volcanic:    { force: 3, entropy: 2, chaos: 1 },
  // Tundra — entropy domain, subtle darkness (frozen void)
  tundra:      { entropy: 2, time: 1, darkness: 1 },
  // Sacred — spirit domain, subtle light (holy radiance)
  sacred_grove: { spirit: 3, life: 2, light: 1 },
  // Ruins — time domain, subtle order (echoes of structure)
  ruins:       { time: 2, mind: 1, order: 1 },
};

/**
 * Placeholder sphere affinities for location subtypes.
 * Each location gets 1 point in one creation sphere + optional foundation sphere.
 * All 12 spheres used at least once. Values are intentionally minimal — refine during design pass.
 */
export const LOCATION_SPHERE_TABLE: Record<string, Partial<Record<SphereName, number>>> = {
  // Settlements — communities impose order on the world
  hamlet:          { life: 1 },
  town:            { mind: 1, order: 1 },
  city:            { mind: 1, order: 1 },
  capital:         { force: 1, order: 1 },
  // Rural/resource
  camp:            { energy: 1 },
  farmland:        { life: 1, light: 1 },
  // Military — fortifications are instruments of order
  castle:          { force: 1, order: 1 },
  fort:            { force: 1 },
  tower:           { mind: 1 },
  // Religious — temples channel light or darkness
  shrine:          { spirit: 1, light: 1 },
  temple:          { spirit: 1, light: 1 },
  // Industrial
  mining:          { matter: 1 },
  // Decay — ruins echo with chaos and darkness
  ruins:           { time: 1, darkness: 1 },
  ruined_tower:    { time: 1, darkness: 1 },
  ruined_city:     { entropy: 1, chaos: 1 },
  ruined_village:  { entropy: 1, chaos: 1 },
  // Conflict — battlefields are chaos manifest
  battleground:    { entropy: 1, chaos: 1 },
  // Refuge
  oasis:           { energy: 1 },
  // Mystery
  unexplored_poi:  { spirit: 1 },
  // ── Sphere-resonant wonder locations ──
  healing_spring:  { life: 2, spirit: 1 },
  master_forge:    { matter: 2, force: 1 },
  living_archive:  { mind: 2, spirit: 1 },
  fey_crossing:    { spirit: 2, chaos: 1 },
  sacrifice_site:  { entropy: 2, darkness: 1 },
  convergence:     { force: 2, energy: 1 },
  time_scar:       { time: 2, entropy: 1 },
  standing_stones: { order: 2, time: 1 },
  shadow_hollow:   { darkness: 2, entropy: 1 },
  ley_nexus:       { energy: 2, light: 1 },
  // ── Wilderness interest locations ──
  cavern:          { darkness: 1, matter: 1 },
  grove:           { life: 1, spirit: 1 },
  hot_spring:      { energy: 1, life: 1 },
  shipwreck:       { time: 1, entropy: 1 },
  ancient_road:    { order: 1, time: 1 },
  monument:        { spirit: 1, time: 1 },
  // ── Natural anomalies (economy/treasure) ──
  gem_deposit:     { matter: 1, light: 1 },
  golden_grove:    { life: 1, matter: 1 },
  crystal_cavern:  { matter: 2, energy: 1 },
  ancient_vault:   { time: 1, order: 1 },
  sunken_treasury: { time: 1, entropy: 1 },
  herb_garden:     { life: 2 },
  fossil_bed:      { time: 1, matter: 1 },
  iron_seep:       { matter: 1, force: 1 },
  pearl_shoal:     { life: 1, light: 1 },
  glowcap_hollow:  { life: 1, darkness: 1 },
  // ── Monster/danger locations ──
  nest:            { life: 1, matter: 1 },
  haunted_ground:  { spirit: 1, darkness: 1 },
  corruption_zone: { entropy: 2, chaos: 1 },
};

/**
 * Maps the full TerrainType enum to the appropriate TERRAIN_SPHERE_TABLE bucket.
 * All 42+ TerrainType values are covered. Unknown terrain returns empty object (fail-soft).
 */
export function getTerrainSphereScores(terrain: string): Partial<Record<SphereName, number>> {
  // Direct bucket lookup first
  if (terrain in TERRAIN_SPHERE_TABLE) {
    return TERRAIN_SPHERE_TABLE[terrain];
  }

  // ── Forest family ──
  if (
    terrain === 'temperate_forest' ||
    terrain === 'dense_forest' ||
    terrain === 'boreal_forest' ||
    terrain === 'jungle' ||
    terrain === 'tropical_forest' ||
    terrain === 'evergreen_forest' ||
    terrain === 'light_forest' ||
    terrain === 'great_home_trees' ||
    terrain === 'forested_hills'
  ) {
    return TERRAIN_SPHERE_TABLE['forest'];
  }

  // ── Dead/ruined forest → ruins bucket ──
  if (terrain === 'dead_forest' || terrain === 'broken_lands') {
    return TERRAIN_SPHERE_TABLE['ruins'];
  }

  // ── Mountains family ──
  if (
    terrain === 'high_mountains' ||
    terrain === 'mountain_pass' ||
    terrain === 'hills' ||
    terrain === 'plateau' ||
    terrain === 'badlands'
  ) {
    return TERRAIN_SPHERE_TABLE['mountains'];
  }

  // ── Plains / grassland family ──
  if (
    terrain === 'grassland' ||
    terrain === 'farmland' ||
    terrain === 'savanna' ||
    terrain === 'steppe' ||
    terrain === 'floodplain'
  ) {
    return TERRAIN_SPHERE_TABLE['plains'];
  }

  // ── Desert family ──
  if (
    terrain === 'rocky_desert' ||
    terrain === 'sand_dunes'
  ) {
    return TERRAIN_SPHERE_TABLE['desert'];
  }

  // ── Oasis → desert with life modifier (keep as desert bucket) ──
  if (terrain === 'oasis') {
    return { force: 1, life: 2, entropy: 1 };
  }

  // ── Swamp / wet family ──
  if (terrain === 'marsh' || terrain === 'moor_bog') {
    return TERRAIN_SPHERE_TABLE['swamp'];
  }

  // ── Coast / ocean family ──
  if (
    terrain === 'ocean' ||
    terrain === 'deep_ocean' ||
    terrain === 'tropical_ocean' ||
    terrain === 'coastal_shallows' ||
    terrain === 'lake' ||
    terrain === 'river' ||
    terrain === 'reef'
  ) {
    return TERRAIN_SPHERE_TABLE['coast'];
  }

  // ── Volcanic ──
  if (terrain === 'volcano') {
    return TERRAIN_SPHERE_TABLE['volcanic'];
  }

  // ── Tundra / ice family ──
  if (
    terrain === 'glacier' ||
    terrain === 'arctic' ||
    terrain === 'snow_fields'
  ) {
    return TERRAIN_SPHERE_TABLE['tundra'];
  }

  // ── Fail-soft: unknown terrain returns empty object ──
  return {};
}
