/**
 * 3D location/settlement overlay layer for the WebGL hex map.
 * Renders each location as a GLTF building model at its hex position.
 * Falls back to procedural geometry if models haven't loaded yet.
 */
import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import type { HexTile, LocationSubtype } from '../../../types';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { MAX_ELEVATION_HEIGHT, MIN_ELEVATION_HEIGHT } from './hexMeshGeometry';
import { getLocationGeometry, LOCATION_COLORS } from './locationGeometry';
import type { ModelId } from './modelLoader';
import { loadAllModels, getModel, getSharedMaterial, modelsReady } from './modelLoader';

// ── Location → GLTF model mapping ──────────────────────────────────────────

/** Map location subtypes to GLTF building models */
const LOCATION_MODEL_MAP: Partial<Record<LocationSubtype, ModelId>> = {
  hamlet: 'home_A',
  town: 'home_B',
  city: 'market',
  capital: 'castle',
  camp: 'tent',
  farmland: 'lumbermill',
  castle: 'castle',
  fort: 'barracks',
  tower: 'tower_A',
  shrine: 'church',
  temple: 'church',
  mining: 'mine',
  ruins: 'destroyed',
  ruined_tower: 'destroyed',
  ruined_city: 'destroyed',
  ruined_village: 'destroyed',
  battleground: 'weaponrack',
  unexplored_poi: 'target',
};

/** Scale multiplier per location type (some buildings need sizing adjustment) */
const LOCATION_SCALE: Partial<Record<LocationSubtype, number>> = {
  hamlet: 0.35,
  town: 0.35,
  city: 0.4,
  capital: 0.45,
  camp: 0.35,
  farmland: 0.3,
  castle: 0.45,
  fort: 0.4,
  tower: 0.35,
  shrine: 0.35,
  temple: 0.4,
  mining: 0.35,
  ruins: 0.35,
  ruined_tower: 0.3,
  ruined_city: 0.35,
  ruined_village: 0.3,
  battleground: 0.3,
  unexplored_poi: 0.25,
};

// ── Types ───────────────────────────────────────────────────────────────────

interface LocationLayerProps {
  tiles: HexTile[];
  locationOverlays?: Map<string, LocationSubtype>;
}

interface LocationEntry {
  col: number;
  row: number;
  subtype: LocationSubtype;
  position: [number, number, number];
  scale: number;
  rotationY: number;
}

// ── Elevation helper ────────────────────────────────────────────────────────

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

/** Simple hash for deterministic rotation per location */
function locationHash(col: number, row: number): number {
  return ((col * 16807 + row * 48271) & 0x7fffffff) / 0x7fffffff;
}

// ── Component ───────────────────────────────────────────────────────────────

export function LocationLayer({ tiles, locationOverlays }: LocationLayerProps) {
  const [gltfReady, setGltfReady] = useState(modelsReady());

  useEffect(() => {
    if (gltfReady) return;
    loadAllModels().then(() => setGltfReady(true));
  }, [gltfReady]);

  const locations = useMemo(() => {
    if (!locationOverlays || locationOverlays.size === 0) return [];

    const tileMap = new Map<string, HexTile>();
    for (const t of tiles) {
      tileMap.set(`${t.coord.col},${t.coord.row}`, t);
    }

    const entries: LocationEntry[] = [];

    for (const [key, subtype] of locationOverlays) {
      if (subtype === 'wilderness') continue;

      const [colStr, rowStr] = key.split(',');
      const col = Number(colStr);
      const row = Number(rowStr);

      const tile = tileMap.get(key);
      const elevation = tile ? tile.geoParams.elevation : 0;
      const y = elevationToY(elevation);

      const px = col * HEX_SCALE_X;
      const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

      const scale = LOCATION_SCALE[subtype] ?? 0.35;
      const rotationY = locationHash(col, row) * Math.PI * 2;

      entries.push({
        col, row, subtype,
        position: [px, y, pz],
        scale,
        rotationY,
      });
    }

    return entries;
  }, [tiles, locationOverlays]);

  if (locations.length === 0) return null;

  if (gltfReady) {
    return <GLTFLocations locations={locations} />;
  }

  return <FallbackLocations locations={locations} />;
}

/** GLTF building rendering */
function GLTFLocations({ locations }: { locations: LocationEntry[] }) {
  const material = getSharedMaterial();

  return (
    <group>
      {locations.map((loc) => {
        const modelId = LOCATION_MODEL_MAP[loc.subtype];
        const model = modelId ? getModel(modelId) : null;

        if (model && material) {
          return (
            <mesh
              key={`${loc.col},${loc.row}`}
              geometry={model.geometry}
              material={material}
              position={loc.position}
              scale={[loc.scale, loc.scale, loc.scale]}
              rotation={[0, loc.rotationY, 0]}
            />
          );
        }

        // No GLTF model for this subtype — use procedural fallback
        const fallbackGeo = getLocationGeometry(loc.subtype);
        if (!fallbackGeo) return null;
        const color = LOCATION_COLORS[loc.subtype] ?? '#8a7a60';

        return (
          <mesh
            key={`${loc.col},${loc.row}`}
            geometry={fallbackGeo}
            position={loc.position}
          >
            <meshBasicMaterial color={color} fog />
          </mesh>
        );
      })}
    </group>
  );
}

/** Procedural geometry fallback (while GLTF loads) */
function FallbackLocations({ locations }: { locations: LocationEntry[] }) {
  return (
    <group>
      {locations.map((loc) => {
        const geometry = getLocationGeometry(loc.subtype);
        if (!geometry) return null;
        const color = LOCATION_COLORS[loc.subtype] ?? '#8a7a60';

        return (
          <mesh
            key={`${loc.col},${loc.row}`}
            geometry={geometry}
            position={loc.position}
          >
            <meshBasicMaterial color={color} fog />
          </mesh>
        );
      })}
    </group>
  );
}
