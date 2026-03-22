/**
 * regionTypes.ts — Single source of truth for region data structures.
 *
 * Used by:
 *   - regionDetection.ts (geographic region detection)
 *   - regionPolitical.ts (Plan 02, barony/kingdom assignment)
 *   - renderer (Plan 02-03, border + label rendering)
 *
 * NFP #2 Inspectability: All maps keyed by "col,row" for easy per-hex tracing.
 */

import type { HexCoord } from '../types';
import type { RegionFeatureType } from './regionDetection';

// ─── Geographic Region ───────────────────────────────────────────

/**
 * A detected geographic region cluster.
 * Produced by detectRegionsBorderCost() in regionDetection.ts.
 * Extends (and replaces) the old RegionCluster interface with an id field.
 */
export interface RegionCluster {
  id: number;
  featureType: RegionFeatureType;
  hexes: HexCoord[];
  /** Centroid column — snapped to nearest in-region hex (not floating point) */
  centerCol: number;
  /** Centroid row — snapped to nearest in-region hex (not floating point) */
  centerRow: number;
  /** Placeholder name from seeded generator (filled by Plan 02) */
  name: string;
}

// ─── Political Regions ───────────────────────────────────────────

/**
 * A barony — one level of political hierarchy.
 * Corresponds roughly to a geographic region or small group of regions.
 * Filled by regionPolitical.ts (Plan 02).
 */
export interface BaronyRegion {
  id: number;
  cultureId: string | null;    // null = unclaimed wilderness
  capitalHex: HexCoord;
  geographicRegionIds: number[]; // geographic region ids this barony spans
  hexes: HexCoord[];
  centroid: { col: number; row: number };
  name: string;
}

/**
 * A kingdom — top-level political tier, grouping multiple baronies.
 * Filled by regionPolitical.ts (Plan 02).
 */
export interface KingdomRegion {
  id: number;
  cultureId: string | null;    // null = unclaimed wilderness
  capitalHex: HexCoord;
  baronyIds: number[];         // baronies within this kingdom
  centroid: { col: number; row: number };
  name: string;
}

// ─── Labels ──────────────────────────────────────────────────────

/**
 * A region label for the map renderer.
 * Produced by labelPlacement.ts (Plan 03).
 */
export interface RegionLabel {
  id: string;
  tier: 'kingdom' | 'barony' | 'geographic' | 'river';
  text: string;
  /** World-space X coordinate (Three.js scene space) */
  worldX: number;
  /** World-space Y coordinate (Three.js scene space) */
  worldY: number;
}

// ─── Aggregate ───────────────────────────────────────────────────

/**
 * Complete region data threaded through WorldGenResult.
 *
 * NFP #2 Inspectability: All per-hex assignments exposed as maps for O(1) lookup
 * and complete traceability of which hex belongs to which region/barony/kingdom.
 *
 * NFP #4 Fail-soft: baronies/kingdoms/labels start empty (Plan 02/03 fills them).
 * Callers must handle empty arrays gracefully.
 */
export interface RegionData {
  geographicRegions: RegionCluster[];
  baronies: BaronyRegion[];       // empty until Plan 02
  kingdoms: KingdomRegion[];      // empty until Plan 02
  labels: RegionLabel[];          // empty until Plan 03
  /** "col,row" -> geographic region id */
  hexRegionId: Map<string, number>;
  /** "col,row" -> barony id (empty until Plan 02) */
  hexBaronyId: Map<string, number>;
  /** "col,row" -> kingdom id (empty until Plan 02) */
  hexKingdomId: Map<string, number>;
}
