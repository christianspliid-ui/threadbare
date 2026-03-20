/**
 * Animated water plane for ocean/lake/river hexes.
 * Renders a translucent mesh at a fixed Y level with animated wave displacement.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { TerrainType } from '../../../types';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Water surface Y position (slightly below min terrain elevation) */
const WATER_Y = -0.08;

/** Wave amplitude in world units */
const WAVE_AMPLITUDE = 0.03;

/** Wave frequency (higher = more waves per hex) */
const WAVE_FREQUENCY = 3.0;

/** Wave animation speed */
const WAVE_SPEED = 0.4;

/** Water color */
const WATER_COLOR = '#1a3a5a';

/** Water opacity */
const WATER_OPACITY = 0.75;

/** Hex outer radius for water tiles (slightly smaller than terrain to show edges) */
const WATER_HEX_RADIUS = 0.92;

/** Terrain types that are water */
const WATER_TERRAINS: Set<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows',
  'coast', 'lake', 'river', 'reef',
]);

// ── Component ───────────────────────────────────────────────────────────────

interface WaterLayerProps {
  tiles: HexTile[];
}

export function WaterLayer({ tiles }: WaterLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const waterTiles = useMemo(
    () => tiles.filter(t => WATER_TERRAINS.has(t.terrain)),
    [tiles],
  );

  // Build water surface geometry — one hex shape per water tile
  const geometry = useMemo(() => {
    if (waterTiles.length === 0) return new THREE.BufferGeometry();

    const vertsPerHex = 18; // 6 triangles × 3 vertices
    const totalVerts = waterTiles.length * vertsPerHex;
    const positions = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    let vi = 0;

    // Pre-compute hex corners
    const corners: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      corners.push([
        WATER_HEX_RADIUS * Math.cos(angle),
        WATER_HEX_RADIUS * Math.sin(angle),
      ]);
    }

    for (const tile of waterTiles) {
      const { col, row } = tile.coord;
      const cx = col * HEX_SCALE_X;
      const cz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

      // Deeper water sits lower
      const depthOffset = tile.terrain === 'deep_ocean' ? -0.04 : 0;

      for (let i = 0; i < 6; i++) {
        const [c0x, c0z] = corners[i];
        const [c1x, c1z] = corners[(i + 1) % 6];
        const idx = vi * 3;
        const uvIdx = vi * 2;

        // Center vertex
        positions[idx] = cx;
        positions[idx + 1] = WATER_Y + depthOffset;
        positions[idx + 2] = cz;
        uvs[uvIdx] = cx * 0.5;
        uvs[uvIdx + 1] = cz * 0.5;
        vi++;

        // Corner 0
        const i1 = vi * 3;
        const u1 = vi * 2;
        positions[i1] = cx + c0x;
        positions[i1 + 1] = WATER_Y + depthOffset;
        positions[i1 + 2] = cz + c0z;
        uvs[u1] = (cx + c0x) * 0.5;
        uvs[u1 + 1] = (cz + c0z) * 0.5;
        vi++;

        // Corner 1
        const i2 = vi * 3;
        const u2 = vi * 2;
        positions[i2] = cx + c1x;
        positions[i2 + 1] = WATER_Y + depthOffset;
        positions[i2 + 2] = cz + c1z;
        uvs[u2] = (cx + c1x) * 0.5;
        uvs[u2 + 1] = (cz + c1z) * 0.5;
        vi++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }, [waterTiles]);

  // Animate wave displacement
  useFrame(({ clock }) => {
    if (!meshRef.current || waterTiles.length === 0) return;
    const geo = meshRef.current.geometry;
    const pos = geo.getAttribute('position');
    if (!pos) return;

    const t = clock.getElapsedTime() * WAVE_SPEED;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Two overlapping sine waves for organic motion
      const wave = Math.sin(x * WAVE_FREQUENCY + t) * Math.cos(z * WAVE_FREQUENCY * 0.7 + t * 0.8);
      pos.setY(i, WATER_Y + wave * WAVE_AMPLITUDE);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  if (waterTiles.length === 0) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhongMaterial
        color={WATER_COLOR}
        transparent
        opacity={WATER_OPACITY}
        side={THREE.DoubleSide}
        shininess={60}
        specular={new THREE.Color('#4a6a8a')}
      />
    </mesh>
  );
}
