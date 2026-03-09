import { useMemo } from 'react';
import type { WorldGraph } from '../../../types/graph';
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

export interface UseHexZoomDataParams {
  graph: WorldGraph;
  ascendantId: string;
  focusedHex: { col: number; row: number } | null;
  focusedLocationId: string | null;
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
}: UseHexZoomDataParams): UseHexZoomDataReturn {
  const hexLocations = useMemo(() => {
    if (!focusedHex) return [];
    return getLocationsInHex(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const hexAgentsByLocation = useMemo(() => {
    const map: Record<string, ReturnType<typeof getAgentsAtLocation>> = {};
    for (const loc of hexLocations) {
      map[loc.id] = getAgentsAtLocation(graph, loc.id);
    }
    return map;
  }, [graph, hexLocations]);

  const hexConnections = useMemo(() => {
    return getLocationConnections(graph, hexLocations.map(l => l.id));
  }, [graph, hexLocations]);

  const hexSphereInfluence = useMemo(() => {
    if (!focusedHex) return null;
    return getHexSphereInfluence(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const hexLineOfSight = useMemo(() => {
    if (!focusedHex) return 'none' as const;
    return getLineOfSight(graph, ascendantId, focusedHex);
  }, [graph, ascendantId, focusedHex]);

  const hexTotalAgents = useMemo(() => {
    return Object.values(hexAgentsByLocation).reduce((sum, agents) => sum + agents.length, 0);
  }, [hexAgentsByLocation]);

  const hexCultures = useMemo(() => {
    if (!focusedHex) return [];
    return getHexCultures(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const hexFactions = useMemo(() => {
    if (!focusedHex) return [];
    return getHexFactions(graph, focusedHex.col, focusedHex.row);
  }, [graph, focusedHex]);

  const focusedLocation = useMemo(() => {
    if (!focusedLocationId) return null;
    return graph.getNode(focusedLocationId) ?? null;
  }, [graph, focusedLocationId]);

  const focusedLocationAgents = useMemo(() => {
    if (!focusedLocationId) return [];
    return getAgentsAtLocation(graph, focusedLocationId);
  }, [graph, focusedLocationId]);

  return {
    hexLocations,
    hexAgentsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    hexCultures,
    hexFactions,
    focusedLocation,
    focusedLocationAgents,
  };
}
