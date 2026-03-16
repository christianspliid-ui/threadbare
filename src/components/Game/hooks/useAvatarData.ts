import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AscendantArchetype } from '../../../types/influence';
import type { WorldGraph } from '../../../types/graph';
import type { LocationSubtype } from '../../../types';
import { getAvatarHexPosition } from '../../../engine/visibility';
import { getAvatarMovementState } from '../../../engine/avatarMove';
import { hexToPixel } from '../../../lib/hexMath';
import { enableTracing, disableTracing } from '../../../engine/traceBuffer';
import { getSphereColor } from '../../../data/sphereIcons';

interface UseAvatarDataParams {
  graph: WorldGraph;
  ascendantId: string;
  archetype: AscendantArchetype;
}

export interface UseAvatarDataReturn {
  avatarPos: { col: number; row: number } | null;
  avatarNodeId: string | null;
  sphereColor: string;
  locationOverlays: Map<string, LocationSubtype>;
  avatarPixelPos: { x: number; y: number } | null;
  avatarRoute: { col: number; row: number }[] | null;
  avatarTargetHex: { col: number; row: number } | null;
  debugPanelOpen: boolean;
  handleToggleDebug: () => void;
}

/** Settlement priority for overlay conflicts — larger settlements win */
const SETTLEMENT_PRIORITY: Partial<Record<LocationSubtype, number>> = {
  capital: 10, city: 8, town: 6, hamlet: 4,
  fort: 3, castle: 3, temple: 3, tower: 2, shrine: 2,
  mining: 2, camp: 1, farmland: 1, ruins: 1,
  battleground: 1, oasis: 1, unexplored_poi: 0,
};

function settlementPriority(subtype: LocationSubtype): number {
  return SETTLEMENT_PRIORITY[subtype] ?? 0;
}

export function useAvatarData({
  graph,
  ascendantId,
  archetype,
}: UseAvatarDataParams): UseAvatarDataReturn {
  // Avatar position — no useMemo because the graph is mutable (same reference after
  // moveAvatarToHex); recalculating on every render is trivially cheap (2 edge hops).
  const avatarPos = getAvatarHexPosition(graph, ascendantId);

  // Derive avatar actor node ID from graph (ascendant ← avatar_of ← avatar)
  const avatarNodeId = (() => {
    const edges = graph.getIncomingEdges(ascendantId, 'avatar_of');
    return edges.length > 0 ? edges[0].source : null;
  })();

  // Sphere color based on primary creation sphere
  const sphereColor = useMemo(
    () => getSphereColor(archetype.sphereAlignment.primary),
    [archetype.sphereAlignment.primary]
  );

  // Build location overlay map: hex coord key → LocationSubtype for hex map rendering
  // No useMemo — graph is mutable, and moveAvatarToHex may create transient locations
  const locationOverlays = (() => {
    const overlayMap = new Map<string, LocationSubtype>();
    const nodes = graph.getNodesByType('location');
    for (const node of nodes) {
      const props = node.properties;
      if (props.hexCol !== undefined && props.hexRow !== undefined && props.locationSubtype) {
        const key = `${props.hexCol},${props.hexRow}`;
        // If multiple locations share a hex, prefer the "largest" settlement
        const existing = overlayMap.get(key);
        if (!existing || settlementPriority(props.locationSubtype as LocationSubtype) > settlementPriority(existing)) {
          overlayMap.set(key, props.locationSubtype as LocationSubtype);
        }
      }
    }
    return overlayMap;
  })();

  // Route visualization — extract hex coords from movement queue
  const avatarMovementState = getAvatarMovementState(graph, ascendantId);
  const avatarRoute = useMemo(() => {
    if (!avatarMovementState || avatarMovementState.movementQueue.length === 0) return null;
    const routeHexes: { col: number; row: number }[] = [];
    for (const nodeId of avatarMovementState.movementQueue) {
      const node = graph.getNode(nodeId);
      if (node && node.properties.hexCol != null && node.properties.hexRow != null) {
        routeHexes.push({ col: node.properties.hexCol as number, row: node.properties.hexRow as number });
      }
    }
    return routeHexes.length > 0 ? routeHexes : null;
  }, [avatarMovementState, graph]);

  const avatarTargetHex = avatarRoute ? avatarRoute[avatarRoute.length - 1] : null;

  // Avatar pixel position for initial zoom
  const avatarPixelPos = useMemo(() => {
    if (!avatarPos) return null;
    const HEX_SIZE = 30; // matches HexMap default
    return hexToPixel(avatarPos, HEX_SIZE);
  }, [avatarPos]);

  // Debug panel state
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  const handleToggleDebug = useCallback(() => {
    setDebugPanelOpen(prev => {
      const next = !prev;
      if (next) enableTracing();
      else disableTracing();
      return next;
    });
  }, []);

  // Backtick keyboard shortcut for debug panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`') handleToggleDebug();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleToggleDebug]);

  return {
    avatarPos,
    avatarNodeId,
    sphereColor,
    locationOverlays,
    avatarPixelPos,
    avatarRoute,
    avatarTargetHex,
    debugPanelOpen,
    handleToggleDebug,
  };
}
