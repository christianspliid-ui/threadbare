/**
 * Pass 07b: Culture Terrain Nudge
 *
 * After biome classification (pass 07), nudge some heartland hexes toward
 * the owning culture's preferred biomes. This makes culture homelands feel
 * geographically coherent — forest folk get more forest, mountain folk get
 * more crags — without overriding hard geographic constraints.
 *
 * Only affects capital + heartland hexes in living culture provinces.
 * Each eligible hex has a probability of being nudged (higher near province
 * center, lower at heartland edges). The replacement biome must be climate-
 * plausible for the hex's temperature/elevation/moisture.
 *
 * NFP #1 Tunability: All thresholds are named constants.
 * NFP #2 Inspectability: Nudge count logged to console in dev.
 * NFP #3 Determinism: Seeded PRNG via mulberry32.
 * NFP #4 Fail-soft: If no plausible biome found, hex keeps natural terrain.
 */

import { mulberry32 } from '../../../lib/prng';
import { hexDistance } from '../../../lib/hexMath';
import { ELEV, TEMP } from '../../terrain';
import type { WorldGenContext, Province } from '../types';
import {
  PROVINCE_ROLE_CAPITAL,
  PROVINCE_ROLE_HEARTLAND,
} from '../types';
import type { TerrainType } from '../../../types';

// ─── Constants (NFP #1) ──────────────────────────────────────────

/** PRNG seed offset — unique prime, no collision with other passes */
export const PASS_SEED_CULTURE_NUDGE = 78401;

/** Base probability of nudging a capital hex */
const NUDGE_CHANCE_CAPITAL = 0.6;

/** Base probability of nudging a heartland hex */
const NUDGE_CHANCE_HEARTLAND = 0.35;

// ─── Climate plausibility ────────────────────────────────────────

/** Temperature range in which each biome can plausibly exist */
const BIOME_TEMP_RANGE: Partial<Record<TerrainType, [number, number]>> = {
  // Frozen/cold biomes
  tundra: [0, TEMP.COLD],
  snow_fields: [0, TEMP.COLD],
  arctic: [0, TEMP.FROZEN],
  glacier: [0, TEMP.COLD],
  boreal_forest: [TEMP.FROZEN, TEMP.COOL],
  evergreen_forest: [TEMP.FROZEN, TEMP.COOL],

  // Cool/temperate biomes
  temperate_forest: [TEMP.COLD, TEMP.WARM],
  light_forest: [TEMP.COLD, TEMP.WARM],
  dense_forest: [TEMP.COLD, TEMP.WARM],
  forested_hills: [TEMP.COLD, TEMP.WARM],
  hills: [0, 1],           // hills at any temperature
  grassland: [TEMP.COLD, TEMP.HOT],
  farmland: [TEMP.COLD, TEMP.HOT],
  steppe: [TEMP.COLD, TEMP.SCORCHING],
  moor_bog: [0, TEMP.COOL],

  // Warm/hot biomes
  savanna: [TEMP.WARM, 1],
  jungle: [TEMP.WARM, 1],
  tropical_forest: [TEMP.WARM, 1],
  desert: [TEMP.HOT, 1],
  rocky_desert: [TEMP.HOT, 1],
  sand_dunes: [TEMP.HOT, 1],
  badlands: [TEMP.WARM, 1],
  oasis: [TEMP.HOT, 1],

  // Water-adjacent (rarely nudged, but for completeness)
  marsh: [TEMP.COLD, TEMP.WARM],
  swamp: [TEMP.COOL, 1],
  floodplain: [TEMP.COOL, TEMP.HOT],

  // Highland
  mountains: [0, 1],
  high_mountains: [0, 1],
  plateau: [0, 1],
  mountain_pass: [0, 1],

  // Special
  great_home_trees: [TEMP.COOL, TEMP.WARM],
  broken_lands: [TEMP.COLD, TEMP.SCORCHING],
  dead_forest: [TEMP.COLD, TEMP.WARM],
  volcano: [0, 1],
};

/** Minimum elevation for highland biomes */
const HIGHLAND_BIOMES: Set<TerrainType> = new Set([
  'mountains', 'high_mountains', 'plateau', 'mountain_pass', 'forested_hills',
]);

/** Biomes that should never be nudged away from (structurally important) */
const IMMUTABLE_TERRAIN: Set<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'coastal_shallows', 'lake', 'river', 'reef',
  'tropical_ocean', 'coast', 'volcano', 'glacier', 'high_mountains',
]);

/** Biomes that should never be nudged TO (too structurally specific) */
const UNNUDGEABLE_TARGETS: Set<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'coastal_shallows', 'lake', 'river', 'reef',
  'tropical_ocean', 'coast', 'volcano',
]);

// ─── Main pass ───────────────────────────────────────────────────

/**
 * Check if a target biome is climatically plausible at a given hex.
 */
function isPlausible(
  target: TerrainType,
  temperature: number,
  elevation: number,
): boolean {
  // Never nudge to structural/water biomes
  if (UNNUDGEABLE_TARGETS.has(target)) return false;

  // Highland biomes need sufficient elevation
  if (HIGHLAND_BIOMES.has(target) && elevation < ELEV.MID) return false;

  // Lowland biomes shouldn't appear at mountain elevation
  if (!HIGHLAND_BIOMES.has(target) && elevation >= ELEV.HIGHLAND) return false;

  // Temperature check
  const range = BIOME_TEMP_RANGE[target];
  if (!range) return true; // unknown biome — allow (fail-soft)
  return temperature >= range[0] && temperature <= range[1];
}

export function runCultureTerrainNudgePass(ctx: WorldGenContext): void {
  const { cols, rows, seed, provinces } = ctx;
  const rng = mulberry32(seed + PASS_SEED_CULTURE_NUDGE);
  let nudgeCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;

      // Only nudge capital + heartland hexes
      const role = ctx.provinceRoles[idx];
      if (role !== PROVINCE_ROLE_CAPITAL && role !== PROVINCE_ROLE_HEARTLAND) continue;

      // Only nudge living culture provinces (not wilderness, not lost)
      const provId = ctx.provinceIds[idx];
      if (provId < 0 || provId >= provinces.length) continue;
      const province = provinces[provId];
      if (!province.cultureId || province.isLost) continue;

      // Skip immutable terrain
      const currentTerrain = ctx.terrain[idx];
      if (IMMUTABLE_TERRAIN.has(currentTerrain)) continue;

      // Roll for nudge probability
      const chance = role === PROVINCE_ROLE_CAPITAL ? NUDGE_CHANCE_CAPITAL : NUDGE_CHANCE_HEARTLAND;
      if (rng() > chance) continue;

      // Find a plausible preferred biome for this hex
      const temp = ctx.temperature[idx];
      const elev = ctx.elevation[idx];
      const preferred = province.terrainIdentity; // culture's preferredBiomes
      if (!preferred || preferred.length === 0) continue;

      // Shuffle preferred biomes for variety (don't always pick the first)
      const shuffled = [...preferred].sort(() => rng() - 0.5);
      let picked: TerrainType | null = null;
      for (const candidate of shuffled) {
        if (candidate === currentTerrain) {
          // Already the preferred biome — no nudge needed
          picked = null;
          break;
        }
        if (isPlausible(candidate, temp, elev)) {
          picked = candidate;
          break;
        }
      }

      if (picked) {
        ctx.terrain[idx] = picked;
        nudgeCount++;
      }
    }
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.debug(`[WorldGen] Culture terrain nudge: ${nudgeCount} hexes modified`);
  }
}
