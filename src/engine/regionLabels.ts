/**
 * regionLabels.ts — the names the player reads on the map.
 *
 * Three tiers since THR-1155, each from the object it names: **realm** from
 * `realmProjection` (the Realm whose border encloses the label), **area** from
 * `areaProjection` (the Area node), **river** from the river paths. The domain and
 * province tiers are gone with the stamps they read — a name over a nation now moves
 * when the nation does, because it is placed at the centre of the ground the Realm
 * actually holds rather than at the centroid of a worldgen culture region.
 *
 * Label positions are in Three.js world space (Y-flipped from hex pixel space).
 *
 * NFP #1 Tunability: All thresholds are named constants.
 * NFP #3 Determinism: River name generation uses mulberry32 seeded PRNG.
 * NFP #4 Fail-soft: Functions return empty arrays on invalid input, never throw.
 */

import type { RegionLabel } from './regionTypes';
import type { AreaProjection } from './areaProjection';
import type { RealmProjection } from './realmProjection';
import type { RiverPath } from './worldGenData';
import { hexToPixel } from '../lib/hexMath';
import { REGION_MAP_LABEL_MIN_SIZE } from './regionDetection';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** HEX_SIZE in world units — matches HEX_CONSTANTS.HEX_SIZE in HexFillMesh.ts.
 * Defined here to avoid circular import with HexMapV2 scene layer. */
const HEX_SIZE = 10;

/** Minimum river path length (hexes) to generate a river label */
export const RIVER_LABEL_MIN_LENGTH = 5;

/** Label priority (lower = higher priority in collision detection) */
export const LABEL_PRIORITY: Record<RegionLabel['tier'], number> = {
  realm: 0,
  area: 1,
  river: 2,
};

// ─── River name word pools (NFP #3: seeded selection) ────────────────────────

const RIVER_NAME_ADJECTIVES = [
  'Grey', 'Silver', 'Ash', 'Iron', 'White',
  'Dark', 'Stone', 'Clear', 'Swift', 'Long',
];

const RIVER_NAME_NOUNS = [
  'vale', 'run', 'brook', 'water', 'flow',
  'ford', 'bend', 'reach', 'deep', 'fall',
];

// ─── PRNG ────────────────────────────────────────────────────────────────────

/**
 * mulberry32 PRNG — same algorithm used throughout the codebase.
 * Returns a float in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/** Convert hex grid coords to Three.js world position (Y-flipped). */
function hexToWorld(col: number, row: number): { x: number; y: number } {
  const { x, y } = hexToPixel({ col, row }, HEX_SIZE);
  return { x, y: -y }; // Y-flip for Three.js y-up coordinate system
}

/** Compute the world-space bounding box width of a set of hexes. */
function computeHexesWorldWidth(hexes: { col: number; row: number }[]): number {
  if (hexes.length === 0) return 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const h of hexes) {
    const { x } = hexToPixel({ col: h.col, row: h.row }, HEX_SIZE);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  return maxX - minX;
}

// ─── Label generators ─────────────────────────────────────────────────────────

/**
 * Generates the political label tier — one name per Realm, over the ground it holds.
 *
 * Replaced `generateRegionLabels` (THR-1155). The old function placed a domain label at
 * the centroid of the culture region worldgen drew and a second, thinner label per
 * province; both were fixed for the life of the world. A Realm's label sits at the
 * centroid of its *claimed hexes*, so when it takes or loses towns the name moves with
 * the border — and the province tier is gone, because a province is not something the
 * player can act on.
 *
 * NFP #4 Fail-soft: a malformed Realm entry is skipped, not thrown; a Realm with no
 * claimed hexes carries no label (it has no border to name either).
 */
export function generateRealmLabels(realmProjection: RealmProjection): RegionLabel[] {
  const labels: RegionLabel[] = [];

  for (const realm of realmProjection.realms) {
    try {
      if (realm.hexes.length === 0) continue;
      if (!realm.name) continue; // a Realm with no name carries no label
      let sumX = 0;
      let sumY = 0;
      for (const h of realm.hexes) {
        const w = hexToWorld(h.col, h.row);
        sumX += w.x;
        sumY += w.y;
      }
      labels.push({
        id: `realm-${realm.id}`,
        tier: 'realm',
        text: realm.name,
        worldX: sumX / realm.hexes.length,
        worldY: sumY / realm.hexes.length,
        worldWidth: computeHexesWorldWidth(realm.hexes),
      });
    } catch {
      // Fail-soft: skip malformed Realm entry
    }
  }

  return labels;
}

/**
 * Generates the area label tier — one label per Area large enough to carry one.
 *
 * Split out of the old `generateRegionLabels` by THR-1155: the name a player reads over
 * a mountain range comes from the Area's own graph node, through `areaProjection`,
 * rather than from a renderer-side cluster joined to that node by list position.
 *
 * NFP #4 Fail-soft: a malformed Area is skipped, not thrown.
 */
export function generateAreaLabels(areaProjection: AreaProjection): RegionLabel[] {
  const labels: RegionLabel[] = [];

  for (const area of areaProjection.areas) {
    try {
      if (area.hexes.length < REGION_MAP_LABEL_MIN_SIZE) continue;
      if (!area.name) continue; // an Area worldgen never named carries no label
      const { x, y } = hexToWorld(area.center.col, area.center.row);
      labels.push({
        id: `area-${area.id}`,
        tier: 'area',
        text: area.name,
        worldX: x,
        worldY: y,
      });
    } catch {
      // Fail-soft: skip malformed Area entry
    }
  }

  return labels;
}

/**
 * Generates river labels for major rivers (>= RIVER_LABEL_MIN_LENGTH hexes).
 *
 * Label text: "{Adjective}{noun} River" — generated from seeded PRNG.
 * Label position: midpoint hex of the river path.
 *
 * NFP #3 Determinism: mulberry32(seed + riverId * 7919) — prime offset avoids
 * collision with other name-generation calls that use the same seed.
 * NFP #4 Fail-soft: Skips rivers with invalid hex arrays.
 */
export function generateRiverLabels(riverPaths: RiverPath[], seed: number): RegionLabel[] {
  const labels: RegionLabel[] = [];

  for (let i = 0; i < riverPaths.length; i++) {
    const river = riverPaths[i];
    try {
      if (!river.hexes || river.hexes.length < RIVER_LABEL_MIN_LENGTH) continue;

      // Midpoint hex for label placement
      const midIdx = Math.floor(river.hexes.length / 2);
      const midHex = river.hexes[midIdx];
      const { x, y } = hexToWorld(midHex.col, midHex.row);

      // Seeded name generation — unique per river
      // Use river index + a prime multiple for variety, avoid overlap with other name generators
      const prng = mulberry32(seed + i * 7919 + 31337);
      const adjIdx = Math.floor(prng() * RIVER_NAME_ADJECTIVES.length);
      const nounIdx = Math.floor(prng() * RIVER_NAME_NOUNS.length);
      const name = `${RIVER_NAME_ADJECTIVES[adjIdx]}${RIVER_NAME_NOUNS[nounIdx]} River`;

      labels.push({
        id: `river-${river.id}`,
        tier: 'river',
        text: name,
        worldX: x,
        worldY: y,
      });
    } catch {
      // Fail-soft: skip malformed river path
    }
  }

  return labels;
}
