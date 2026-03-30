/**
 * Terrain Transformation Table — maps hex state thresholds to terrain changes.
 *
 * When corruption crosses HEX_CORRUPTION_TRANSFORM_THRESHOLD, terrain degrades.
 * When divineInfluence crosses HEX_DIVINE_TRANSFORM_THRESHOLD, terrain restores/upgrades.
 *
 * Transformations are defined as static data here — tunable by editing this table.
 * Missing terrain types → no transformation (fail-soft).
 */
import type { TerrainType } from '../types/index';

export interface TerrainTransformation {
  readonly from: TerrainType;
  readonly to: TerrainType;
  readonly trigger: 'corruption' | 'divineInfluence';
}

export const TERRAIN_TRANSFORMATIONS: readonly TerrainTransformation[] = [
  // ── Corruption degrades ────────────────────────────────────────────────────
  { from: 'grassland',        to: 'moor_bog',       trigger: 'corruption' },
  { from: 'farmland',         to: 'grassland',      trigger: 'corruption' },
  { from: 'temperate_forest', to: 'dead_forest',    trigger: 'corruption' },
  { from: 'dense_forest',     to: 'dead_forest',    trigger: 'corruption' },
  { from: 'light_forest',     to: 'dead_forest',    trigger: 'corruption' },
  { from: 'boreal_forest',    to: 'dead_forest',    trigger: 'corruption' },
  { from: 'floodplain',       to: 'swamp',          trigger: 'corruption' },
  { from: 'savanna',          to: 'badlands',       trigger: 'corruption' },
  { from: 'hills',            to: 'badlands',       trigger: 'corruption' },
  { from: 'oasis',            to: 'desert',         trigger: 'corruption' },
  { from: 'steppe',           to: 'rocky_desert',   trigger: 'corruption' },

  // ── Divine influence restores / upgrades ──────────────────────────────────
  { from: 'dead_forest',      to: 'light_forest',   trigger: 'divineInfluence' },
  { from: 'moor_bog',         to: 'grassland',      trigger: 'divineInfluence' },
  { from: 'badlands',         to: 'hills',          trigger: 'divineInfluence' },
  { from: 'desert',           to: 'oasis',          trigger: 'divineInfluence' },
  { from: 'swamp',            to: 'floodplain',     trigger: 'divineInfluence' },
  { from: 'rocky_desert',     to: 'steppe',         trigger: 'divineInfluence' },
  { from: 'broken_lands',     to: 'grassland',      trigger: 'divineInfluence' },
];

/**
 * Build a fast-lookup map keyed by `${trigger}:${from}` → to.
 * O(1) per lookup instead of O(n) scan.
 */
export const TERRAIN_TRANSFORMATION_MAP: ReadonlyMap<string, TerrainType> = new Map(
  TERRAIN_TRANSFORMATIONS.map(t => [`${t.trigger}:${t.from}`, t.to]),
);

/**
 * Look up a terrain transformation result.
 * Returns null if no transformation is defined for this trigger+terrain combination.
 */
export function getTerrainTransformation(
  trigger: 'corruption' | 'divineInfluence',
  terrain: TerrainType,
): TerrainType | null {
  return TERRAIN_TRANSFORMATION_MAP.get(`${trigger}:${terrain}`) ?? null;
}
