/**
 * regionTypes.ts — Single source of truth for region data structures.
 *
 * Used by:
 *   - regionDetection.ts (geographic region detection)
 *   - regionPolitical.ts (province/domain assignment)
 *   - renderer (border + label rendering)
 *
 * NFP #2 Inspectability: All maps keyed by "col,row" for easy per-hex tracing.
 *
 * Political hierarchy: Domain → Province → Hex → Location
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
 * A province — smallest administrative unit.
 * One per worldgen province. Filled by regionPolitical.ts.
 */
export interface ProvinceRegion {
  id: number;
  cultureId: string | null;    // null = unclaimed wilderness
  capitalHex: HexCoord;
  geographicRegionIds: number[]; // geographic region ids this province spans
  hexes: HexCoord[];
  centroid: { col: number; row: number };
  name: string;
}

/**
 * A domain — top-level political tier, grouping multiple provinces under one culture.
 * Filled by regionPolitical.ts.
 */
export interface DomainRegion {
  id: number;
  cultureId: string | null;    // null = unclaimed wilderness
  capitalHex: HexCoord;
  provinceIds: number[];        // provinces within this domain
  centroid: { col: number; row: number };
  name: string;
}

// ─── Labels ──────────────────────────────────────────────────────

/**
 * A region label for the map renderer.
 * Produced by regionLabels.ts.
 */
export interface RegionLabel {
  id: string;
  tier: 'domain' | 'province' | 'geographic' | 'river';
  text: string;
  /** World-space X coordinate (Three.js scene space) */
  worldX: number;
  /** World-space Y coordinate (Three.js scene space) */
  worldY: number;
  /** Approximate world-space width of the province/region this label belongs to.
   *  Used to scale letter-spacing so labels span a fraction of their region. */
  worldWidth?: number;
}

// ─── Aggregate ───────────────────────────────────────────────────

/**
 * Complete region data threaded through WorldGenResult.
 *
 * Political hierarchy: Domain → Province → Hex → Location
 *
 * NFP #2 Inspectability: All per-hex assignments exposed as maps for O(1) lookup
 * and complete traceability of which hex belongs to which region/province/domain.
 *
 * NFP #4 Fail-soft: provinces/domains/labels start empty (filled by regionPolitical/regionLabels).
 * Callers must handle empty arrays gracefully.
 */
export interface RegionData {
  geographicRegions: RegionCluster[];
  provinces: ProvinceRegion[];      // empty until regionPolitical.ts runs
  domains: DomainRegion[];          // empty until regionPolitical.ts runs
  labels: RegionLabel[];            // empty until regionLabels.ts runs
  /** "col,row" -> geographic region id */
  hexRegionId: Map<string, number>;
  /** "col,row" -> province id (empty until regionPolitical.ts) */
  hexProvinceId: Map<string, number>;
  /** "col,row" -> domain id (empty until regionPolitical.ts) */
  hexDomainId: Map<string, number>;
}
