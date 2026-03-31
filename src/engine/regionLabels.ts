/**
 * regionLabels.ts — Label data generation from region data.
 *
 * Produces RegionLabel arrays for kingdoms, baronies, geographic regions, and rivers.
 * Label positions are in Three.js world space (Y-flipped from hex pixel space).
 *
 * NFP #1 Tunability: All thresholds are named constants.
 * NFP #3 Determinism: River name generation uses mulberry32 seeded PRNG.
 * NFP #4 Fail-soft: Functions return empty arrays on invalid input, never throw.
 */

import type { RegionLabel, RegionData } from './regionTypes';
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
  domain: 0,
  province: 1,
  geographic: 2,
  river: 3,
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
 * Generates region labels for domains, provinces, and geographic regions.
 *
 * - Domains: one label at geographic centroid of all domain hexes.
 * - Provinces: one label at centroid.
 * - Geographic regions >= REGION_MAP_LABEL_MIN_SIZE: one label at center.
 *
 * NFP #4 Fail-soft: Returns empty array if regionData is invalid.
 */
export function generateRegionLabels(regionData: RegionData): RegionLabel[] {
  const labels: RegionLabel[] = [];

  // Domain labels — at geographic centroid of all domain hexes, width from same.
  for (const d of regionData.domains) {
    try {
      const domainHexes = regionData.provinces
        .filter(p => d.provinceIds.includes(p.id))
        .flatMap(p => p.hexes);
      let sumX = 0;
      let sumY = 0;
      for (const h of domainHexes) {
        const w = hexToWorld(h.col, h.row);
        sumX += w.x;
        sumY += w.y;
      }
      const cx = domainHexes.length > 0 ? sumX / domainHexes.length : hexToWorld(d.capitalHex.col, d.capitalHex.row).x;
      const cy = domainHexes.length > 0 ? sumY / domainHexes.length : hexToWorld(d.capitalHex.col, d.capitalHex.row).y;
      labels.push({
        id: `domain-${d.id}`,
        tier: 'domain',
        text: d.name,
        worldX: cx,
        worldY: cy,
        worldWidth: computeHexesWorldWidth(domainHexes),
      });
    } catch {
      // Fail-soft: skip malformed domain entry
    }
  }

  // Province labels — at centroid, width from province hexes
  for (const p of regionData.provinces) {
    try {
      const { x, y } = hexToWorld(p.centroid.col, p.centroid.row);
      labels.push({
        id: `province-${p.id}`,
        tier: 'province',
        text: p.name,
        worldX: x,
        worldY: y,
        worldWidth: computeHexesWorldWidth(p.hexes),
      });
    } catch {
      // Fail-soft: skip malformed province entry
    }
  }

  // Geographic labels — only regions large enough to label
  for (const g of regionData.geographicRegions) {
    try {
      if (g.hexes.length < REGION_MAP_LABEL_MIN_SIZE) continue;
      const { x, y } = hexToWorld(g.centerCol, g.centerRow);
      labels.push({
        id: `geo-${g.id}`,
        tier: 'geographic',
        text: g.name,
        worldX: x,
        worldY: y,
      });
    } catch {
      // Fail-soft: skip malformed geo region entry
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
