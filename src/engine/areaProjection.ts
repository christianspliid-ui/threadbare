/**
 * areaProjection.ts — the Area partition, as the map needs it (THR-1155).
 *
 * The renderer used to run its own region detector and keep the result in a React
 * state with no setter, joined to the graph's Area nodes by list position. Two
 * partitions, one of them invisible to every system that could act on an Area, and a
 * name over a mountain range that belonged to whichever unrelated cluster shared its
 * index. This replaces the source and keeps the layers: the borders, the labels and
 * the chronicle all read a projection of the graph and the tiles, so the picture and
 * the game state cannot disagree.
 *
 * Two reads over one source, deliberately:
 *   - `getHexRegionData(graph, regionId)` (`hexRegion.ts`) is the **point** read —
 *     one Area's name, feature type, hex count and historical culture, for the
 *     chronicle and the sidebar. It stays.
 *   - `buildAreaProjection` is the **partition** read — every hex to its Area and
 *     every Area to its hexes, which is the shape a border mesh and a label layer
 *     need and a point read cannot cheaply give.
 *
 * If you find yourself writing a third way to ask what Area a hex is in, stop:
 * `tile.regionId` → `getHexRegionData` is the answer, and `hexAreaId` here is that
 * same answer batched.
 *
 * NFP #2 Inspectability: keyed by `"col,row"` like every other per-hex map.
 * NFP #3 Determinism: pure — same tiles and graph in, same projection out.
 * NFP #4 Fail-soft: an Area node missing for a stamp is skipped, never thrown; the
 * layer draws the Areas that do resolve.
 */

import type { HexTile, HexCoord } from '../types';
import type { WorldGraph } from './graph';
import type { RegionFeatureType } from './regionDetection';
import { hexKeyFromCoord } from '../lib/hexKey';

/** One Area, as the map draws it. */
export interface AreaProjectionEntry {
  /** The `region` node id — `region_N`. The Area's identity everywhere. */
  id: string;
  /** The name the player reads. Empty only for an Area worldgen never named. */
  name: string;
  featureType: RegionFeatureType | undefined;
  /** Every hex stamped with this Area, in tile order. */
  hexes: HexCoord[];
  /** Label anchor — the node's snapped centre, which is a hex inside the Area. */
  center: HexCoord;
}

export interface AreaProjection {
  areas: AreaProjectionEntry[];
  /** `"col,row"` → Area node id. Every land hex is present (THR-1155 coverage). */
  hexAreaId: Map<string, string>;
}

/**
 * Build the Area partition from the tiles' stamps and the Areas' nodes.
 *
 * The tiles are the membership authority — `tile.regionId` is what worldgen stamped
 * and what every consumer resolves through — and the nodes supply the name, feature
 * type and label anchor. An Area whose node is gone contributes no hexes rather than
 * an unnamed cluster, so the map never draws a border around something the world no
 * longer holds.
 */
export function buildAreaProjection(tiles: HexTile[], graph: WorldGraph): AreaProjection {
  const hexAreaId = new Map<string, string>();
  const hexesByArea = new Map<string, HexCoord[]>();

  for (const tile of tiles) {
    const areaId = tile.regionId;
    if (!areaId) continue;
    if (!graph.getNode(areaId)) continue;
    hexAreaId.set(hexKeyFromCoord(tile.coord), areaId);
    let hexes = hexesByArea.get(areaId);
    if (!hexes) {
      hexes = [];
      hexesByArea.set(areaId, hexes);
    }
    hexes.push(tile.coord);
  }

  const areas: AreaProjectionEntry[] = [];
  for (const [areaId, hexes] of hexesByArea) {
    const node = graph.getNode(areaId)!;
    const centerCol = node.properties.centerCol as number | undefined;
    const centerRow = node.properties.centerRow as number | undefined;
    areas.push({
      id: areaId,
      name: node.name ?? '',
      featureType: node.properties.featureType as RegionFeatureType | undefined,
      hexes,
      // A node with no stamped centre falls back to its first hex, which is inside
      // the Area by construction — a label never lands in the sea.
      center: centerCol !== undefined && centerRow !== undefined
        ? { col: centerCol, row: centerRow }
        : hexes[0],
    });
  }

  // Stable order by node id, so two builds of the same world produce the same array
  // and a layer that indexes into it is not at the mercy of Map insertion order.
  areas.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return { areas, hexAreaId };
}
