/**
 * HexPulseMesh.ts — Ambient glow layer for tense/volatile hexes in HexMapV2.
 *
 * Renders a radial gradient quad at each hex where the location activity pulse
 * is `tense` or `volatile`. Uses an InstancedMesh so all glowing hexes share
 * a single draw call. AdditiveBlending makes the glow brighten whatever is
 * underneath without occluding terrain or signifier art.
 *
 * Tense hexes glow amber; volatile hexes glow red. The material opacity breathes
 * slowly via tickHexPulse to give a living-world feel.
 *
 * NFP #1 (tunability): All constants named in HEX_PULSE_CONSTANTS.
 * NFP #2 (inspectability): updateHexPulseMesh returns the active instance count.
 * NFP #4 (fail-soft): Empty or null locationActivityMap → mesh.count = 0, no throw.
 * NFP #7 (performance): Pre-allocated InstancedMesh; no per-frame allocation.
 *   Opacity tick is a single uniform write — O(1) regardless of instance count.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import type { LocationActivitySummary } from '../../../types/locationActivity';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

export const HEX_PULSE_CONSTANTS = {
  /** Maximum pre-allocated instances — covers any realistic map. */
  MAX_INSTANCES: 500,
  /** Amber glow for tense activity level. */
  TENSE_COLOR: '#d4a040',
  /** Red glow for volatile activity level. */
  VOLATILE_COLOR: '#c0392b',
  /** Base material opacity (0–1). Breathes ± PULSE_AMPLITUDE at PULSE_SPEED Hz. */
  BASE_OPACITY: 0.45,
  /** Opacity oscillation amplitude (0–1). Total range: BASE_OPACITY ± PULSE_AMPLITUDE. */
  PULSE_AMPLITUDE: 0.12,
  /** Breathing oscillation frequency in Hz. */
  PULSE_SPEED_HZ: 0.6,
  /** Scale of the glow quad as a fraction of hex diameter.
   *  1.0 = exactly fills hex; 1.5 = extends half a hex beyond each edge. */
  GLOW_SCALE_FRACTION: 1.6,
  /** Texture resolution in pixels. Power of 2 for GPU efficiency. */
  TEXTURE_SIZE: 128,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export interface HexPulseMeshResult {
  mesh: THREE.InstancedMesh;
  dispose(): void;
}

// ── Texture builder ──────────────────────────────────────────────────────────

function buildGlowTexture(): THREE.CanvasTexture {
  const size = HEX_PULSE_CONSTANTS.TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0.0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.85, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates the pre-allocated HexPulseMesh InstancedMesh.
 * Add `result.mesh` to the scene once; call `updateHexPulseMesh` when data changes.
 */
export function createHexPulseMesh(): HexPulseMeshResult {
  const texture = buildGlowTexture();
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    opacity: HEX_PULSE_CONSTANTS.BASE_OPACITY,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, HEX_PULSE_CONSTANTS.MAX_INSTANCES);
  mesh.renderOrder = RENDER_ORDER.HEX_PULSE;
  mesh.frustumCulled = false;
  mesh.count = 0;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

// ── Update ───────────────────────────────────────────────────────────────────

const _mat4 = new THREE.Matrix4();
const _tenseColor = new THREE.Color(HEX_PULSE_CONSTANTS.TENSE_COLOR);
const _volatileColor = new THREE.Color(HEX_PULSE_CONSTANTS.VOLATILE_COLOR);

/**
 * Rebuilds InstancedMesh transforms and colors from the current locationActivityMap.
 * Only tense and volatile hexes get an instance. Returns the active instance count.
 *
 * @param result  - HexPulseMeshResult from createHexPulseMesh
 * @param map     - Map<"col,row", LocationActivitySummary> from GameView
 * @param hexSize - HEX_CONSTANTS.HEX_SIZE (world units per hex)
 */
export function updateHexPulseMesh(
  result: HexPulseMeshResult,
  map: Map<string, LocationActivitySummary> | undefined,
  hexSize: number,
): number {
  if (!map || map.size === 0) {
    result.mesh.count = 0;
    return 0;
  }

  const glowDiameter = hexSize * 2 * HEX_PULSE_CONSTANTS.GLOW_SCALE_FRACTION;
  let idx = 0;

  for (const summary of map.values()) {
    if (idx >= HEX_PULSE_CONSTANTS.MAX_INSTANCES) break;
    const { pulse, hexCol, hexRow } = summary;
    if (pulse !== 'tense' && pulse !== 'volatile') continue;

    const wp = hexToWorld({ col: hexCol, row: hexRow }, hexSize);
    _mat4.makeScale(glowDiameter, glowDiameter, 1);
    _mat4.setPosition(wp.x, wp.y, LAYER_Z.HEX_PULSE);
    result.mesh.setMatrixAt(idx, _mat4);
    result.mesh.setColorAt(idx, pulse === 'volatile' ? _volatileColor : _tenseColor);
    idx++;
  }

  result.mesh.count = idx;
  result.mesh.instanceMatrix.needsUpdate = true;
  if (result.mesh.instanceColor) result.mesh.instanceColor.needsUpdate = true;
  return idx;
}

// ── Tick ─────────────────────────────────────────────────────────────────────

/**
 * Breathes the glow opacity — call once per frame from the render loop.
 * Single uniform write, O(1) regardless of instance count.
 *
 * @param result    - HexPulseMeshResult
 * @param elapsedS  - Total elapsed seconds from THREE.Clock (monotonic)
 */
export function tickHexPulse(result: HexPulseMeshResult, elapsedS: number): void {
  if (result.mesh.count === 0) return;
  const mat = result.mesh.material as THREE.MeshBasicMaterial;
  mat.opacity =
    HEX_PULSE_CONSTANTS.BASE_OPACITY +
    Math.sin(elapsedS * HEX_PULSE_CONSTANTS.PULSE_SPEED_HZ * Math.PI * 2) *
      HEX_PULSE_CONSTANTS.PULSE_AMPLITUDE;
}
