/**
 * Drifting cloud shadows across the terrain.
 * A large transparent plane above the terrain with an animated noise pattern
 * that creates gentle shadow patches drifting across the landscape.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Shadow plane Y height (above terrain, below camera) */
const SHADOW_Y = 1.2;

/** Shadow opacity at darkest point */
const SHADOW_INTENSITY = 0.15;

/** Cloud scale — larger = bigger cloud patches */
const CLOUD_SCALE = 0.08;

/** Drift speed in world units per second (wind direction) */
const DRIFT_SPEED_X = 0.15;
const DRIFT_SPEED_Z = 0.08;

// ── Shader ──────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vWorldXZ;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldXZ = worldPos.xz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uCloudScale;
  uniform float uShadowIntensity;
  uniform vec2 uDriftSpeed;

  varying vec2 vWorldXZ;

  // Simplex-style noise (hash-based, good enough for clouds)
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5 * noise(p); p *= 2.01;
    f += 0.25 * noise(p); p *= 2.02;
    f += 0.125 * noise(p);
    return f;
  }

  void main() {
    vec2 drift = uDriftSpeed * uTime;
    vec2 uv = (vWorldXZ + drift) * uCloudScale;

    // Two octaves of FBM for organic cloud shapes
    float n = fbm(uv);
    // Remap to 0..1 with a soft threshold for defined cloud edges
    float shadow = smoothstep(0.0, 0.4, n * 0.5 + 0.5);
    shadow = shadow * shadow; // Sharpen slightly

    // Only darken, never lighten
    float alpha = shadow * uShadowIntensity;

    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
`;

// ── Component ───────────────────────────────────────────────────────────────

interface CloudShadowLayerProps {
  worldWidth: number;
  worldHeight: number;
}

export function CloudShadowLayer({ worldWidth, worldHeight }: CloudShadowLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uCloudScale: { value: CLOUD_SCALE },
        uShadowIntensity: { value: SHADOW_INTENSITY },
        uDriftSpeed: { value: new THREE.Vector2(DRIFT_SPEED_X, DRIFT_SPEED_Z) },
      },
    });
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  // Plane large enough to cover the world with overflow for drift
  const padding = 10;
  const planeW = worldWidth + padding * 2;
  const planeH = worldHeight + padding * 2;

  return (
    <mesh
      position={[worldWidth / 2, SHADOW_Y, worldHeight / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      <planeGeometry args={[planeW, planeH, 1, 1]} />
    </mesh>
  );
}
