import { useMemo } from 'react';
import type { WorldGraph } from '../../../types/graph';
import type { HexTile } from '../../../types';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
  getHexCultures,
  getHexFactions,
} from '../../../engine/hexZoom';
import type { HexCultureSummary, HexFactionSummary } from '../../../engine/hexZoom';
import { getHexRegionData } from '../../../engine/hexRegion';
import type { HexRegionData } from '../../../engine/hexRegion';

export interface UseHexZoomDataParams {
  graph: WorldGraph;
  ascendantId: string;
  focusedHex: { col: number; row: number } | null;
  focusedLocationId: string | null;
  tiles: HexTile[];
  fogDisabled?: boolean;
  /** TB-086: Version counter for change detection (graph is mutated in place). */
  worldVersion?: number;
}

export interface UseHexZoomDataReturn {
  hexLocations: ReturnType<typeof getLocationsInHex>;
  hexAgentsByLocation: Record<string, ReturnType<typeof getAgentsAtLocation>>;
  hexConnections: ReturnType<typeof getLocationConnections>;
  hexSphereInfluence: ReturnType<typeof getHexSphereInfluence> | null;
  hexLineOfSight: ReturnType<typeof getLineOfSight>;
  hexTotalAgents: number;
  hexCultures: HexCultureSummary[];
  hexFactions: HexFactionSummary[];
  hexRegionData: HexRegionData | null;
  focusedLocation: ReturnType<typeof graph.getNode> | null;
  focusedLocationAgents: ReturnType<typeof getAgentsAtLocation>;
}

/**
 * Derives all hex zoom level data from the game state.
 * Pure memoized queries — no state mutations, no side effects.
 */
export function useHexZoomData({
  graph,
  ascendantId,
  focusedHex,
  focusedLocationId,
  tiles,
  fogDisabled,
  worldVersion = 0,
}: UseHexZoomDataParams): UseHexZoomDataReturn {
  // TB-086: All memos depend on worldVersion instead of graph identity.
  // The graph object never changes (mutated in place), so identity-based
  // deps would never trigger recomputation after mid-tick mutations.

  const hexLocations = useMemo(() => {
    if (!focusedHex) return [];
    return getLocationsInHex(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex, worldVersion]);

  const hexAgentsByLocation = useMemo(() => {
    const map: Record<string, ReturnType<typeof getAgentsAtLocation>> = {};
    for (const loc of hexLocations) {
      map[loc.id] = getAgentsAtLocation(graph, loc.id);
    }
    return map;
  }, [graph, hexLocations, worldVersion]);

  const hexConnections = useMemo(() => {
    return getLocationConnections(graph, hexLocations.map(l => l.id));
  }, [graph, hexLocations, worldVersion]);

  const hexSphereInfluence = useMemo(() => {
    if (!focusedHex) return null;
    return getHexSphereInfluence(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex, worldVersion]);

  const hexLineOfSight = useMemo(() => {
    if (fogDisabled) return 'full' as const;
    if (!focusedHex) return 'none' as const;
    return getLineOfSight(graph, ascendantId, focusedHex);
  }, [graph, ascendantId, focusedHex, fogDisabled, worldVersion]);

  const hexTotalAgents = useMemo(() => {
    return Object.values(hexAgentsByLocation).reduce((sum, agents) => sum + agents.length, 0);
  }, [hexAgentsByLocation]);

  const hexCultures = useMemo(() => {
    if (!focusedHex) return [];
    return getHexCultures(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex, worldVersion]);

  const hexFactions = useMemo(() => {
    if (!focusedHex) return [];
    return getHexFactions(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex, worldVersion]);

  const focusedLocation = useMemo(() => {
    if (!focusedLocationId) return null;
    return graph.getNode(focusedLocationId) ?? null;
  }, [graph, focusedLocationId, worldVersion]);

  const focusedLocationAgents = useMemo(() => {
    if (!focusedLocationId) return [];
    return getAgentsAtLocation(graph, focusedLocationId);
  }, [graph, focusedLocationId, worldVersion]);

  const regionId = useMemo(() => {
    if (!focusedHex) return undefined;
    const tile = tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row);
    return tile?.regionId;
  }, [tiles, focusedHex]);

  const hexRegionData = useMemo(() => {
    if (!regionId || !graph) return null;
    return getHexRegionData(graph, regionId);
  }, [graph, regionId, worldVersion]);

  return {
    hexLocations,
    hexAgentsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    hexCultures,
    hexFactions,
    hexRegionData,
    focusedLocation,
    focusedLocationAgents,
  };
}
