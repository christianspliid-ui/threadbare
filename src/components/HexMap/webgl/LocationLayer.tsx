/**
 * 3D location/settlement overlay layer for the WebGL hex map.
 * Renders each location as a distinct 3D mesh at its hex position.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import type { HexTile, LocationSubtype } from '../../../types';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { MAX_ELEVATION_HEIGHT, MIN_ELEVATION_HEIGHT } from './hexMeshGeometry';
import { getLocationGeometry, LOCATION_COLORS } from './locationGeometry';

// ── Types ───────────────────────────────────────────────────────────────────

interface LocationLayerProps {
  tiles: HexTile[];
  locationOverlays?: Map<string, LocationSubtype>;
}

interface LocationEntry {
  col: number;
  row: number;
  subtype: LocationSubtype;
  geometry: THREE.BufferGeometry;
  color: string;
  position: [number, number, number];
}

// ── Elevation helper ────────────────────────────────────────────────────────

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

// ── Component ───────────────────────────────────────────────────────────────

export function LocationLayer({ tiles, locationOverlays }: LocationLayerProps) {
  const locations = useMemo(() => {
    if (!locationOverlays || locationOverlays.size === 0) return [];

    const tileMap = new Map<string, HexTile>();
    for (const t of tiles) {
      tileMap.set(`${t.coord.col},${t.coord.row}`, t);
    }

    const entries: LocationEntry[] = [];

    for (const [key, subtype] of locationOverlays) {
      if (subtype === 'wilderness') continue;

      const geometry = getLocationGeometry(subtype);
      if (!geometry) continue;

      const color = LOCATION_COLORS[subtype] ?? '#8a7a60';
      const [colStr, rowStr] = key.split(',');
      const col = Number(colStr);
      const row = Number(rowStr);

      const tile = tileMap.get(key);
      const elevation = tile ? tile.geoParams.elevation : 0;
      const y = elevationToY(elevation);

      const px = col * HEX_SCALE_X;
      const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

      entries.push({
        col, row, subtype,
        geometry,
        color,
        position: [px, y, pz],
      });
    }

    return entries;
  }, [tiles, locationOverlays]);

  if (locations.length === 0) return null;

  return (
    <group>
      {locations.map((loc, i) => (
        <mesh
          key={`${loc.col},${loc.row}`}
          geometry={loc.geometry}
          position={loc.position}
        >
          <meshBasicMaterial color={loc.color} fog />
        </mesh>
      ))}
    </group>
  );
}
