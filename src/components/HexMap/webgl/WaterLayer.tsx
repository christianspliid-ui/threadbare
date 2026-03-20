/**
 * Animated water plane for ocean/lake/river hexes.
 * Uses a custom shader for gentle wave animation and color variation.
 * Flat diorama style — no specular, just animated color ripples.
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
const WAVE_AMPLITUDE = 0.02;

/** Wave frequency (higher = more waves per hex) */
const WAVE_FREQUENCY = 2.5;

/** Wave animation speed */
const WAVE_SPEED = 0.3;

/** Water base color — rich blue for diorama */
const WATER_COLOR = new THREE.Color('#2a5a7a');

/** Water highlight color — lighter ripple peaks */
const WATER_HIGHLIGHT = new THREE.Color('#4a8aaa');

/** Deep water tint */
const WATER_DEEP = new THREE.Color('#1a3858');

/** Water opacity */
const WATER_OPACITY = 0.8;

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

// ── Water shader ─────────────────────────────────────────────────────────

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveFrequency;
  varying vec2 vWorldXZ;
  varying float vDepth;

  attribute float aDepth;

  void main() {
    vec3 pos = position;

    // Gentle wave displacement
    float wave1 = sin(pos.x * uWaveFrequency + uTime) * cos(pos.z * uWaveFrequency * 0.7 + uTime * 0.8);
    float wave2 = sin(pos.x * uWaveFrequency * 1.3 - uTime * 0.6) * cos(pos.z * uWaveFrequency * 0.5 + uTime * 1.1);
    pos.y += (wave1 + wave2 * 0.5) * uWaveAmplitude;

    vWorldXZ = pos.xz;
    vDepth = aDepth;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const waterFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uHighlightColor;
  uniform vec3 uDeepColor;
  uniform float uOpacity;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  varying vec2 vWorldXZ;
  varying float vDepth;

  void main() {
    // Animated ripple pattern — two scales for natural look
    float ripple1 = sin(vWorldXZ.x * 4.0 + uTime * 0.8) * sin(vWorldXZ.y * 3.5 - uTime * 0.6);
    float ripple2 = sin(vWorldXZ.x * 7.0 - uTime * 1.2) * sin(vWorldXZ.y * 6.0 + uTime * 0.9);
    float ripple = ripple1 * 0.6 + ripple2 * 0.4;

    // Blend between base and highlight based on ripple
    vec3 color = mix(uBaseColor, uHighlightColor, ripple * 0.3 + 0.15);

    // Tint toward deep color for deep water hexes
    color = mix(color, uDeepColor, vDepth * 0.6);

    // Scene fog
    float fogFactor = smoothstep(fogNear, fogFar, gl_FragCoord.z / gl_FragCoord.w);
    color = mix(color, fogColor, fogFactor);

    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function WaterLayer({ tiles }: WaterLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

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
    const depths = new Float32Array(totalVerts);
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

    const DEEP_TERRAINS = new Set(['deep_ocean', 'ocean']);

    for (const tile of waterTiles) {
      const { col, row } = tile.coord;
      const cx = col * HEX_SCALE_X;
      const cz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);

      const depthOffset = tile.terrain === 'deep_ocean' ? -0.04 : 0;
      const depthVal = DEEP_TERRAINS.has(tile.terrain) ? 1.0 : 0.0;

      for (let i = 0; i < 6; i++) {
        const [c0x, c0z] = corners[i];
        const [c1x, c1z] = corners[(i + 1) % 6];

        // Center vertex
        const idx = vi * 3;
        positions[idx] = cx;
        positions[idx + 1] = WATER_Y + depthOffset;
        positions[idx + 2] = cz;
        depths[vi] = depthVal;
        vi++;

        // Corner 0
        const i1 = vi * 3;
        positions[i1] = cx + c0x;
        positions[i1 + 1] = WATER_Y + depthOffset;
        positions[i1 + 2] = cz + c0z;
        depths[vi] = depthVal;
        vi++;

        // Corner 1
        const i2 = vi * 3;
        positions[i2] = cx + c1x;
        positions[i2 + 1] = WATER_Y + depthOffset;
        positions[i2 + 2] = cz + c1z;
        depths[vi] = depthVal;
        vi++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));
    geo.computeVertexNormals();
    return geo;
  }, [waterTiles]);

  // Custom water shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      fog: true,
      uniforms: {
        uTime: { value: 0 },
        uWaveAmplitude: { value: WAVE_AMPLITUDE },
        uWaveFrequency: { value: WAVE_FREQUENCY },
        uBaseColor: { value: WATER_COLOR },
        uHighlightColor: { value: WATER_HIGHLIGHT },
        uDeepColor: { value: WATER_DEEP },
        uOpacity: { value: WATER_OPACITY },
        fogColor: { value: new THREE.Color('#0a0a0c') },
        fogNear: { value: 60 },
        fogFar: { value: 120 },
      },
    });
  }, []);

  // Animate
  useFrame(({ clock }) => {
    if (material) {
      material.uniforms.uTime.value = clock.getElapsedTime() * WAVE_SPEED;
    }
  });

  if (waterTiles.length === 0) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}
