/**
 * God ray light beams descending onto sacred locations (temples, shrines).
 * Renders transparent additive-blended cones of light for a divine diorama effect.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HexTile, LocationSubtype } from '../../../types';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { MAX_ELEVATION_HEIGHT, MIN_ELEVATION_HEIGHT } from './hexMeshGeometry';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Which location subtypes receive god rays */
const SACRED_SUBTYPES: Set<LocationSubtype> = new Set(['temple', 'shrine']);

/** Cone base radius (how wide the beam is at ground level) */
const BEAM_RADIUS = 0.35;

/** Cone height (how far up the beam extends) */
const BEAM_HEIGHT = 3.0;

/** Base opacity of the beam */
const BEAM_OPACITY = 0.12;

/** Beam color — warm divine gold */
const BEAM_COLOR = '#f0d870';

/** Inner glow pillar radius (brighter core) */
const CORE_RADIUS = 0.08;

/** Core opacity */
const CORE_OPACITY = 0.2;

/** Core color — brighter white-gold */
const CORE_COLOR = '#fff8d0';

/** Pulse speed (radians per second) */
const PULSE_SPEED = 0.8;

/** Pulse amplitude (0–1, how much the opacity varies) */
const PULSE_AMPLITUDE = 0.3;

/** Mote count per beam */
const MOTES_PER_BEAM = 5;

/** Mote size */
const MOTE_SIZE = 0.04;

// ── Elevation helper ────────────────────────────────────────────────────────

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

// ── Component ───────────────────────────────────────────────────────────────

interface GodRayLayerProps {
  tiles: HexTile[];
  locationOverlays?: Map<string, LocationSubtype>;
}

interface BeamData {
  position: [number, number, number];
  key: string;
}

export function GodRayLayer({ tiles, locationOverlays }: GodRayLayerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const beams = useMemo(() => {
    if (!locationOverlays) return [];

    const tileMap = new Map<string, HexTile>();
    for (const t of tiles) {
      tileMap.set(`${t.coord.col},${t.coord.row}`, t);
    }

    const result: BeamData[] = [];

    for (const [key, subtype] of locationOverlays) {
      if (!SACRED_SUBTYPES.has(subtype)) continue;

      const [colStr, rowStr] = key.split(',');
      const col = Number(colStr);
      const row = Number(rowStr);

      const tile = tileMap.get(key);
      const elevation = tile ? tile.geoParams.elevation : 0;
      const y = elevationToY(elevation);

      const px = col * HEX_SCALE_X;
      const pz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

      result.push({
        position: [px, y, pz],
        key,
      });
    }

    return result;
  }, [tiles, locationOverlays]);

  // Cone geometry (shared across all beams)
  const coneGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(BEAM_RADIUS, BEAM_HEIGHT, 8, 1, true);
    // Rotate so the tip points up and base is at y=0
    geo.translate(0, BEAM_HEIGHT / 2, 0);
    return geo;
  }, []);

  // Core pillar geometry
  const coreGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(CORE_RADIUS, CORE_RADIUS * 0.5, BEAM_HEIGHT, 6, 1, true);
    geo.translate(0, BEAM_HEIGHT / 2, 0);
    return geo;
  }, []);

  // Mote (dust particle) geometry — tiny icosahedron
  const moteGeo = useMemo(() => new THREE.IcosahedronGeometry(MOTE_SIZE, 0), []);

  // Animate pulse
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.children.forEach((beamGroup, i) => {
      // Pulse the outer cone opacity
      const cone = beamGroup.children[0] as THREE.Mesh;
      const core = beamGroup.children[1] as THREE.Mesh;
      if (cone?.material && 'opacity' in cone.material) {
        const phase = t * PULSE_SPEED + i * 1.7;
        const pulse = 1 + Math.sin(phase) * PULSE_AMPLITUDE;
        (cone.material as THREE.MeshBasicMaterial).opacity = BEAM_OPACITY * pulse;
        (core.material as THREE.MeshBasicMaterial).opacity = CORE_OPACITY * pulse;
      }

      // Animate motes floating upward
      for (let m = 2; m < beamGroup.children.length; m++) {
        const mote = beamGroup.children[m] as THREE.Mesh;
        const motePhase = (t * 0.3 + m * 0.7 + i * 2.1) % 1;
        mote.position.y = motePhase * BEAM_HEIGHT;
        // Spiral motion
        const angle = t * 0.5 + m * 1.3;
        const radius = BEAM_RADIUS * 0.4 * (1 - motePhase * 0.5);
        mote.position.x = Math.cos(angle) * radius;
        mote.position.z = Math.sin(angle) * radius;
        if (mote.material && 'opacity' in mote.material) {
          // Fade in and out
          const fade = Math.sin(motePhase * Math.PI);
          (mote.material as THREE.MeshBasicMaterial).opacity = fade * 0.5;
        }
      }
    });
  });

  if (beams.length === 0) return null;

  return (
    <group ref={groupRef}>
      {beams.map(({ position, key }) => (
        <group key={key} position={position}>
          {/* Outer light cone */}
          <mesh geometry={coneGeo}>
            <meshBasicMaterial
              color={BEAM_COLOR}
              transparent
              opacity={BEAM_OPACITY}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Inner bright core */}
          <mesh geometry={coreGeo}>
            <meshBasicMaterial
              color={CORE_COLOR}
              transparent
              opacity={CORE_OPACITY}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Floating motes */}
          {Array.from({ length: MOTES_PER_BEAM }, (_, m) => (
            <mesh key={m} geometry={moteGeo}>
              <meshBasicMaterial
                color={CORE_COLOR}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
