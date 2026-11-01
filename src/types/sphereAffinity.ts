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
  | 'notable'
  | 'mandate'
  | 'overchannel'
  | 'environmental'
  // Dominion writers (THR-1748): the tending pushes, neglect and the god's attunement.
  | 'claim'
  | 'seat'
  | 'carry'
  | 'attunement'
  // THR-1935: one-shot pushes from answering a prayer and from aid off the god's ground.
  | 'prayer_answered'
  | 'unbidden_aid';

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
  /**
   * The actor whose act made this push (THR-2081). The Mandate counts a push as the
   * god's by who acted, not by `source`: `divine_action` fires for every actor's
   * resolved action. Absent reads as not the god's.
   */
  causedBy?: string;
  /**
   * The town the card was aimed at, when `resolveTownPressureTargets` re-aimed the god's
   * push onto one of its Places (THR-2094). Absent on every other push.
   */
  aimedAtId?: string;
  /**
   * How much the card's price multiplied the god's push (THR-2094), set only above 1.
   * Carried onto the `sphere_pressure` trace as `pushScales`, to explain a larger push.
   */
  pushScale?: number;
  /**
   * Keep this push on its target: the town re-aim leaves it alone (THR-2094). Set by
   * Shift Dominion's break push, which must land on the place whose band it breaks.
   */
  keepOnTarget?: boolean;
  /**
   * The copy of a re-aimed god push left on the town at its unscaled size (THR-2094), so
   * the town's own scores — and every Dominion read of the town — move as before. Never
   * the god's for the Mandate: the Place copy carries that credit.
   */
  townEcho?: boolean;
}

/**
 * One signed change to the Mandate's god ledger (THR-2081), made by `phaseSpherePressure`
 * from a resolved score change: + the god's share of a level-up, − the opposition's
 * share of an erosion. Weighted as the world total weighs the entity.
 */
export interface MandateCredit {
  entityId: string;
  sphere: SphereName;
  points: number;
  cause: 'god' | 'opposition';
  /** The writers netted into the trace this credit came from. */
  sources: PressureSource[];
}

// ─── Scale Constants (NFP #1: Tunability) ────────────────────────

/** Hard cap per sphere per entity (triangle cost 10 = 55 total) */
export const MAX_SPHERE_SCORE = 10;

/** Pressure applied to target on successful divine action */
export const ACTION_PRESSURE_SUCCESS = 3;
/**
 * How far (hexes) a push aimed at an empty hex looks for a place to land on (THR-2087).
 * 2 reaches 99.4% of land hexes on the seeded medium world; 1 reaches 87%.
 */
export const HEX_PRESSURE_FALLBACK_RADIUS = 2;
/**
 * When the god works a town, its sphere push lands in the town's Place holding least of
 * that sphere (THR-2094 Decision 1). `false` keeps every push on the town.
 */
export const GOD_PUSH_LANDS_IN_SUBLOCATION = true;
/**
 * A re-aimed push also stays on the town at its unscaled size, crediting no Mandate, so
 * working a town still moves its Dominion band and tending (THR-2094 review). `false`
 * moves the whole push to the Place.
 */
export const GOD_PUSH_TOWN_KEEPS_ECHO = true;
/** Which target subtypes count as towns for that re-aim — the set the town cards name. */
export const GOD_PUSH_TOWN_SUBTYPES: readonly string[] = ['settlement', 'hamlet', 'town', 'city', 'capital'];
/**
 * The most a god card's essence price multiplies its push (THR-2094 Decision 2): a
 * 1-essence look pushes 3, every card at 2 essence or more pushes 6. `1` restores today.
 */
export const GOD_PUSH_ESSENCE_CAP = 2;
/** Pressure applied to target on failed divine action */
export const ACTION_PRESSURE_FAILURE = 1;
/**
 * Pressure applied per tick from a control effect. 1 → 0.03 (THR-1748 / THR-1762): at 1 a
 * hold reached score 5 in 15 ticks; a sustained hold now builds over in-game weeks.
 * Accumulates through the progress path like every fractional push.
 */
export const CONTROL_PRESSURE_PER_TICK = 0.03;
/** Pressure applied per encounter resolution step */
export const ENCOUNTER_PRESSURE_PER_STEP = 1;
/** Pressure per doom tier escalation */
export const DOOM_PRESSURE_PER_TIER = 4;
/**
 * `sourceId` prefix of doom's flat per-stage entropy push (`phaseDoom`), so the Mandate
 * ledger can tell the tide from the archetype's own stage cards (THR-2090).
 */
export const DOOM_STAGE_PUSH_SOURCE_PREFIX = 'doom-tier-';
/** Pressure from a rival probe landing on the god's turf. 2 → 4 (THR-1748 / THR-1763). */
export const RIVAL_PRESSURE_MAGNITUDE = 4;
/** Weight applied to max agentAwareness when computing effective hostility for rival action selection */
export const RIVAL_AWARENESS_HOSTILITY_WEIGHT = 0.2;
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
/**
 * Bonus in a place's own declared sphere — a lair's `dominantSphere`, an elder ruin's
 * `sphereAlignment` string (THR-1768 D4; dead until then).
 */
export const LOCATION_TYPE_BONUS = 2;

/**
 * Fewer valid individual members than this → the faction's aggregate is all zeros
 * (THR-1768 D3).
 */
export const FACTION_SPHERE_AGGREGATE_MIN_MEMBERS = 1;

/**
 * World init emits one summary `sphere_seeded` trace instead of one per node (~1,500 on
 * a medium world would flood the ring buffer). Mid-run seeds always trace per node.
 */
export const SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT = true;

/**
 * A faction's derived sphere scores: the rounded mean of its individual members' scores
 * (THR-1768 D3). Recomputed by `phaseSphereAggregation`; never a pressure target. The
 * faction's own `sphereAffinity` (monster-faction birth seed, pressure landings) is kept
 * beside it — read both through `getFactionSphereScores`.
 */
export interface FactionSphereAggregate {
  scores: Record<SphereName, number>;
  memberCount: number;
  computedTick: number;
}

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
