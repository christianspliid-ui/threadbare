/**
 * ParticleBurstMesh.ts — Reusable sphere-colored particle burst effect for HexMapV2.
 *
 * Spawns a radial burst of additive-blended particles at a target hex center.
 * Particles expand outward and fade over PARTICLE_CONSTANTS.LIFETIME_MS milliseconds.
 *
 * Usage:
 *   const burst = spawnParticleBurst(scene, col, row, hexSize, '#7b5ea7', performance.now());
 *   activeBursts.push(burst);
 *   // In render loop:
 *   activeBursts = tickParticleBursts(scene, activeBursts, performance.now());
 *
 * Follows the BattleIndicatorMesh factory+tick pattern.
 *
 * NFP #1 (tunability): All constants named — change feel by adjusting PARTICLE_CONSTANTS.
 * NFP #2 (inspectability): Factory returns full ActiveBurst state for diagnostics.
 * NFP #4 (fail-soft): spawnParticleBurst is a no-op if scene is null/undefined.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { LAYER_Z } from './RenderLayers';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** All particle burst tunable constants. */
export const PARTICLE_CONSTANTS = {
  /** Number of particles per burst */
  COUNT: 16,
  /** Total animation duration in ms */
  LIFETIME_MS: 800,
  /** Maximum expansion radius in world units */
  EXPAND_RADIUS: 2.5,
  /** Point size for THREE.PointsMaterial (sizeAttenuation applies) */
  POINT_SIZE: 6.0,
  /** Initial opacity at burst spawn */
  SPAWN_OPACITY: 0.8,
  /** Jitter factor for radial spread (0 = perfectly evenly spaced) */
  DIRECTION_JITTER: 0.3,
  /** Z position for particle layer — above battle indicators, below events */
  Z_LAYER: LAYER_Z.PARTICLE_BURST,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * State for one active particle burst instance.
 * Returned by spawnParticleBurst; consumed by tickParticleBursts.
 */
export interface ActiveBurst {
  /** The Three.js Points object added to the scene */
  points: THREE.Points;
  /** performance.now() at spawn time — used to compute elapsed t */
  startMs: number;
  /**
   * Cached per-particle radial directions as flat [dx0, dy0, dx1, dy1, ...] pairs.
   * Pre-multiplied by a random magnitude within EXPAND_RADIUS.
   */
  directions: Float32Array;
  /** Center X position in Three.js world space (y-up) */
  cx: number;
  /** Center Y position in Three.js world space (y-up) */
  cy: number;
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Spawns a particle burst at a target hex center and adds it to the scene.
 *
 * @param scene     - Three.js scene (must not be null)
 * @param hexCol    - Target hex column
 * @param hexRow    - Target hex row
 * @param hexSize   - Hex radius in world units (use HEX_CONSTANTS.HEX_SIZE)
 * @param color     - CSS color string for the particle material (e.g. '#7b5ea7')
 * @param nowMs     - Current timestamp in ms (performance.now())
 * @returns         ActiveBurst state for use with tickParticleBursts
 *
 * NFP #4: Returns a minimal burst with zero particles if THREE.Points construction fails.
 */
export function spawnParticleBurst(
  scene: THREE.Scene,
  hexCol: number,
  hexRow: number,
  hexSize: number,
  color: string,
  nowMs: number,
): ActiveBurst {
  const count = PARTICLE_CONSTANTS.COUNT;
  const worldPos = hexToWorld({ col: hexCol, row: hexRow }, hexSize);
  const { x: cx, y: cy } = worldPos;

  // Build initial position buffer — all particles start at center
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = cx;
    positions[i * 3 + 1] = cy;
    positions[i * 3 + 2] = PARTICLE_CONSTANTS.Z_LAYER;
  }

  // Build radial direction vectors — evenly spaced angles with slight jitter
  // directions[i*2] = dx, directions[i*2+1] = dy (unit direction * random magnitude)
  const directions = new Float32Array(count * 2);
  const baseAngleStep = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    // Deterministic jitter using a simple hash of index — NFP #3 (seeded-style determinism)
    const jitter = ((i * 2654435761) % 1000) / 1000 * PARTICLE_CONSTANTS.DIRECTION_JITTER;
    const angle = baseAngleStep * i + jitter;
    // Magnitude varies per particle for organic spread
    const mag = 0.6 + 0.4 * (((i * 1664525 + 1013904223) & 0xffff) / 0xffff);
    directions[i * 2 + 0] = Math.cos(angle) * PARTICLE_CONSTANTS.EXPAND_RADIUS * mag;
    directions[i * 2 + 1] = Math.sin(angle) * PARTICLE_CONSTANTS.EXPAND_RADIUS * mag;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: PARTICLE_CONSTANTS.POINT_SIZE,
    sizeAttenuation: true,
    transparent: true,
    opacity: PARTICLE_CONSTANTS.SPAWN_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return { points, startMs: nowMs, directions, cx, cy };
}

// ── Per-frame tick ───────────────────────────────────────────────────────────

/**
 * Advances all active particle bursts by one frame.
 *
 * For each burst, computes t = elapsed / LIFETIME_MS:
 * - If t >= 1.0: removes from scene, disposes geometry + material
 * - Otherwise: updates particle positions (radial expansion) and opacity (linear fade)
 *
 * @param scene   - Three.js scene (needed for remove)
 * @param bursts  - Current list of active bursts
 * @param nowMs   - Current timestamp in ms (performance.now())
 * @returns       Surviving bursts (expired bursts excluded)
 *
 * NFP #4: Silently skips null/invalid bursts — never crashes the render loop.
 */
export function tickParticleBursts(
  scene: THREE.Scene,
  bursts: ActiveBurst[],
  nowMs: number,
): ActiveBurst[] {
  const surviving: ActiveBurst[] = [];

  for (const burst of bursts) {
    const elapsed = nowMs - burst.startMs;
    const t = elapsed / PARTICLE_CONSTANTS.LIFETIME_MS;

    if (t >= 1.0) {
      // Burst expired — remove from scene and dispose GPU resources
      scene.remove(burst.points);
      burst.points.geometry.dispose();
      (burst.points.material as THREE.PointsMaterial).dispose();
      continue;
    }

    // Update particle positions — expand radially with eased curve
    const expandFactor = t; // linear expansion (could ease with t*t or easeOut)
    const posAttr = burst.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const count = PARTICLE_CONSTANTS.COUNT;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = burst.cx + burst.directions[i * 2 + 0] * expandFactor;
      positions[i * 3 + 1] = burst.cy + burst.directions[i * 2 + 1] * expandFactor;
      // Z stays fixed at PARTICLE_CONSTANTS.Z_LAYER (set at spawn)
    }
    posAttr.needsUpdate = true;

    // Update opacity — linear fade from SPAWN_OPACITY to 0
    (burst.points.material as THREE.PointsMaterial).opacity =
      PARTICLE_CONSTANTS.SPAWN_OPACITY * (1 - t);

    surviving.push(burst);
  }

  return surviving;
}
