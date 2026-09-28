/**
 * World scenario — faith and politics at game start as one block of named settings
 * (THR-1632, plan `Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md`).
 *
 * Christian's direction on the fork (2026-09-26): *"This should be tunable for different
 * scenarios. To begin let's go with something that allows us to test and see balance and
 * interaction."* So the landscape a world starts with — how many faiths, where the holy
 * places stand, how much ground nobody holds, whether town guilds read as guilds — is one
 * object a test, the CLI or a later scenario picker can override, and the default is the
 * world that puts the most systems in contact.
 *
 * Same seed + same scenario = same world. With every knob at its "today" value
 * (`WORLD_SCENARIO_TODAY`) worldgen produces the t0 graph it produced before this block
 * existed — a test pins that.
 *
 * Game words: a Temple of the Spheres instance per culture is a **congregation** (the
 * glossary already uses *chapter* for the encounter reading unit); a settlement outside
 * every culture's heartland that takes the nearest culture takes it as its **fringe**.
 */

import {
  WILDERNESS_PROVINCE_COUNT,
  CORNER_WILDERNESS_COUNT,
} from '../engine/worldgen/constants';

export interface WorldScenario {
  /** Temple of the Spheres congregations per living culture. 0 = one world-wide Temple (today's world). */
  templeCongregationsPerCulture: 0 | 1;
  /** Floor of holy places (shrine or temple Locations) on each living culture's heartland. 0 = no floor. */
  holyPlacesMinPerCulture: number;
  /** Wilderness provinces at worldgen — the ground nobody holds. Default reads WILDERNESS_PROVINCE_COUNT. */
  wildernessProvinceCount: number;
  /** Of those, how many are placed in the map corners. Default reads CORNER_WILDERNESS_COUNT. */
  cornerWildernessCount: number;
  /** Settlements within this many hexes of a heartland take that culture as its fringe. 0 = off. */
  cultureFringeMaxHexes: number;
  /** Each congregation consecrates a pilgrim route to its seat at game start. */
  seedCongregationPilgrimRoutes: boolean;
  /** Town guilds carry factionType 'guild' and factionClass 'guild'. */
  labelSettlementGuilds: boolean;
}

/** The first default: the world that puts the most systems in contact (THR-1596, decided 2026-09-26). */
export const DEFAULT_WORLD_SCENARIO: Readonly<WorldScenario> = Object.freeze({
  templeCongregationsPerCulture: 1,
  holyPlacesMinPerCulture: 2,
  wildernessProvinceCount: WILDERNESS_PROVINCE_COUNT,
  cornerWildernessCount: CORNER_WILDERNESS_COUNT,
  cultureFringeMaxHexes: 8,
  seedCongregationPilgrimRoutes: true,
  labelSettlementGuilds: true,
});

/**
 * Every knob at the value that reproduces the world as it was before this block existed:
 * one world-wide Temple, no holy-place floor, no fringe, no seeded pilgrim routes, town
 * guilds untyped. The wilderness counts were always these constants.
 */
export const WORLD_SCENARIO_TODAY: Readonly<WorldScenario> = Object.freeze({
  templeCongregationsPerCulture: 0,
  holyPlacesMinPerCulture: 0,
  wildernessProvinceCount: WILDERNESS_PROVINCE_COUNT,
  cornerWildernessCount: CORNER_WILDERNESS_COUNT,
  cultureFringeMaxHexes: 0,
  seedCongregationPilgrimRoutes: false,
  labelSettlementGuilds: false,
});

// ─── Documented ranges (resolveWorldScenario clamps into these) ────────────────

/** Upper bound on the holy-place floor per culture — keeps the top-up far inside the distance-matrix cap. */
export const HOLY_PLACES_MIN_PER_CULTURE_MAX = 6;
/** Upper bound on wilderness provinces; the province pass spaces seeds, so more would not place anyway. */
export const WILDERNESS_PROVINCE_COUNT_MAX = 30;
/** The map has four corners. */
export const CORNER_WILDERNESS_COUNT_MAX = 4;
/** Upper bound on fringe reach, in hexes. */
export const CULTURE_FRINGE_MAX_HEXES_MAX = 24;

// ─── Constants the scenario's passes read (NFP #1) ─────────────────────────────

/** Which Location subtypes can take a culture as their fringe. Ruins, lairs, wonders and anomalies stay cultureless. */
export const CULTURE_FRINGE_SUBTYPES: ReadonlySet<string> = new Set([
  'capital', 'city', 'town', 'hamlet', 'camp', 'farmland', 'fort', 'shrine', 'temple',
]);
/** `culturalStrength` of a fringe link — half a heartland's (read by the genome and the hex culture panel). */
export const CULTURE_FRINGE_STRENGTH = 0.5;
/** `sphereInfluence` of a top-up holy place toward its congregation's venerated sphere. */
export const HOLY_PLACE_SPHERE_BIAS = 0.6;
/** The first top-up for a culture with no temple on its ground is a temple. */
export const HOLY_PLACE_TOPUP_FIRST_TEMPLE = true;
/** The holy-place top-up's own PRNG stream (checked free against every worldgen offset, 2026-09-28). */
export const HOLY_PLACE_TOPUP_SEED_OFFSET = 53731;
/** `culturalStrength` of a congregation's `belongs_to` edge to its culture — a faith of that people. */
export const CONGREGATION_CULTURE_STRENGTH = 1.0;
/** The Temple definition congregations are instances of. */
export const TEMPLE_OF_SPHERES_DEF_ID = 'temple_of_spheres';

// ─── Content (game words) ─────────────────────────────────────────────────────

/** A congregation's name; `{culture}` is the culture node's display name. */
export const CONGREGATION_NAME_TEMPLATE = 'The {culture} Congregation of the Spheres';
/** The faction-page line under a congregation's kind (S2, THR-1659); `{sphere}` is the sphere's display name. */
export const CONGREGATION_SPHERE_LINE = 'Venerates {sphere}.';
/** How a fringe settlement's culture reads in the hex culture panel (S2, THR-1659). */
export const CULTURE_FRINGE_LABEL = '{culture} fringe';

/** A culture named 'The Witness Skyfield' gives 'The Witness Skyfield Congregation…', not 'The The …'. */
export function formatCongregationName(cultureName: string): string {
  return CONGREGATION_NAME_TEMPLATE.replace('{culture}', cultureName.replace(/^The\s+/i, ''));
}

export function formatCongregationSphereLine(sphere: string): string {
  const label = sphere.length > 0 ? sphere[0].toUpperCase() + sphere.slice(1) : sphere;
  return CONGREGATION_SPHERE_LINE.replace('{sphere}', label);
}

export function formatCultureFringeLabel(cultureName: string): string {
  return CULTURE_FRINGE_LABEL.replace('{culture}', cultureName);
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

let warnedOutOfRange = false;

function clampInt(value: unknown, min: number, max: number, fallback: number, key: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    if (value !== undefined) warnOnce(key, value);
    return fallback;
  }
  const clamped = Math.min(max, Math.max(min, Math.round(value)));
  if (clamped !== value) warnOnce(key, value);
  return clamped;
}

function warnOnce(key: string, value: unknown): void {
  if (warnedOutOfRange) return;
  warnedOutOfRange = true;
  console.warn(`[worldScenario] '${key}' = ${String(value)} is outside its documented range; clamped`);
}

/**
 * Merge a partial override over the default and clamp every knob into its documented
 * range (fail-soft: an out-of-range value warns once and is clamped, never thrown).
 */
export function resolveWorldScenario(overrides?: Partial<WorldScenario>): WorldScenario {
  const d = DEFAULT_WORLD_SCENARIO;
  const o = overrides ?? {};
  const congregations = o.templeCongregationsPerCulture;
  return {
    templeCongregationsPerCulture:
      congregations === undefined ? d.templeCongregationsPerCulture
      : clampInt(congregations, 0, 1, d.templeCongregationsPerCulture, 'templeCongregationsPerCulture') as 0 | 1,
    holyPlacesMinPerCulture: o.holyPlacesMinPerCulture === undefined ? d.holyPlacesMinPerCulture
      : clampInt(o.holyPlacesMinPerCulture, 0, HOLY_PLACES_MIN_PER_CULTURE_MAX, d.holyPlacesMinPerCulture, 'holyPlacesMinPerCulture'),
    wildernessProvinceCount: o.wildernessProvinceCount === undefined ? d.wildernessProvinceCount
      : clampInt(o.wildernessProvinceCount, 0, WILDERNESS_PROVINCE_COUNT_MAX, d.wildernessProvinceCount, 'wildernessProvinceCount'),
    cornerWildernessCount: o.cornerWildernessCount === undefined ? d.cornerWildernessCount
      : clampInt(o.cornerWildernessCount, 0, CORNER_WILDERNESS_COUNT_MAX, d.cornerWildernessCount, 'cornerWildernessCount'),
    cultureFringeMaxHexes: o.cultureFringeMaxHexes === undefined ? d.cultureFringeMaxHexes
      : clampInt(o.cultureFringeMaxHexes, 0, CULTURE_FRINGE_MAX_HEXES_MAX, d.cultureFringeMaxHexes, 'cultureFringeMaxHexes'),
    seedCongregationPilgrimRoutes: typeof o.seedCongregationPilgrimRoutes === 'boolean'
      ? o.seedCongregationPilgrimRoutes : d.seedCongregationPilgrimRoutes,
    labelSettlementGuilds: typeof o.labelSettlementGuilds === 'boolean'
      ? o.labelSettlementGuilds : d.labelSettlementGuilds,
  };
}
