import { useMemo, useCallback, useEffect, useState } from 'react';
import type { AscendantArchetype } from '../../../types/influence';
import type { WorldGraph } from '../../../types/graph';
import type { LocationSubtype } from '../../../types';
import { getAvatarHexPosition } from '../../../engine/visibility';
import { hexToPixel } from '../../../lib/hexMath';
import { enableTracing, disableTracing } from '../../../engine/traceBuffer';

interface UseAvatarDataParams {
  graph: WorldGraph;
  ascendantId: string;
  archetype: AscendantArchetype;
}

export interface UseAvatarDataReturn {
  avatarPos: { col: number; row: number } | null;
  sphereColor: string;
  locationOverlays: Map<string, LocationSubtype>;
  avatarPixelPos: { x: number; y: number } | null;
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
  // Avatar position
  const avatarPos = useMemo(
    () => getAvatarHexPosition(graph, ascendantId),
    [graph, ascendantId]
  );

  // Sphere color based on primary foundation sphere
  const sphereColor = useMemo(() => {
    const primarySphere = archetype.sphereAlignment.primary;
    const sphereColorMap: Record<string, string> = {
      chaos: '#ff6633',
      order: '#3366ff',
      light: '#ffdd44',
      darkness: '#9933cc',
    };
    return sphereColorMap[primarySphere] ?? '#ff6633';
  }, [archetype.sphereAlignment.primary]);

  // Build location overlay map: hex coord key → LocationSubtype for hex map rendering
  const locationOverlays = useMemo(() => {
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
  }, [graph]);

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
    sphereColor,
    locationOverlays,
    avatarPixelPos,
    debugPanelOpen,
    handleToggleDebug,
  };
}
