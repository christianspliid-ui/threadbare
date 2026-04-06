/**
 * FogCulling.ts — Fog-of-war color override, per-hex layer gating, and visibility computation.
 *
 * Pure logic module — no Three.js scene manipulation beyond setColorAt on InstancedMesh.
 * All scene wiring (hooking into the render loop, subscribing to state) happens in Plan 03.
 *
 * NFP #1: All fog color and sight range values are named constants in FOG_CONSTANTS.
 * NFP #2: isLayerVisibleForHex is a pure, traceable function — call with any state + layer
 *         to understand exactly why something does or doesn't render.
 * NFP #3: computeVisibilityFromSources is deterministic — same sources, same result.
 * NFP #4: Fail-soft throughout — missing tile indices are skipped, never thrown.
 */

import * as THREE from 'three';
import type { HexTile } from '../../../types';
import { getHexColor } from '../palette/colorUtils';
import { getActivePalette } from '../palette/activePalette';
import { hexNeighbors } from '../../../lib/hexMath';
import type { HexVisibilityState, VisibilityMap, LOSSource } from '../../../types/visibility';
import { visKey } from '../../../types/visibility';
import { PARCHMENT_FOG_CONSTANTS } from './fogShader';

// ── Fog Constants ─────────────────────────────────────────────────────────────

/**
 * Tunable fog-of-war constants.
 * NFP #1: Every magic number is named here.
 */
export const FOG_CONSTANTS = {
  /** @deprecated Use getActivePalette().fogUnexploredColor — kept for constant table docs */
  UNEXPLORED_HEX_COLOR: '#0a0a0c',
  /** Default sight range for the avatar (own hex only). Matches AVATAR_SIGHT_RANGE. */
  DEFAULT_SIGHT_RANGE: 0,
  /** Extra range granted for elevated positions (hill, mountain). */
  ELEVATION_BONUS: 1,
  /**
   * Duration (ms) of the visible → explored (remembered) fade-out.
   * Unexplored → explored is instant (per CONTEXT.md spec).
   */
  VISIBLE_TO_EXPLORED_DIMOUT_MS: 500,
} as const;

// ── Module-level reusable color objects (avoid per-call allocation) ──────────

/** Lazily cached fog color — refreshed when palette changes. */
let _fogColor: THREE.Color | null = null;
function getFogColor(): THREE.Color {
  if (!_fogColor) {
    _fogColor = new THREE.Color(getActivePalette().fogUnexploredColor);
  }
  return _fogColor;
}
// Reset cache when palette changes
import { onPaletteChange } from '../palette/activePalette';
onPaletteChange(() => { _fogColor = null; });
const _restoreColor = new THREE.Color();

// ── Sepia Tint ──────────────────────────────────────────────────────────────

/**
 * Converts an RGB color to sepia-tinted version for remembered hexes.
 * Uses the standard photographic sepia matrix, blended with original color
 * at SEPIA_STRENGTH, then dimmed by SEPIA_BRIGHTNESS_SCALE.
 *
 * NFP #1: Strength and brightness constants are in PARCHMENT_FOG_CONSTANTS.
 * NFP #3: Pure function — deterministic, no side effects.
 *
 * @param r - Red channel (0-1)
 * @param g - Green channel (0-1)
 * @param b - Blue channel (0-1)
 * @returns [r, g, b] sepia-tinted color, each in [0, 1]
 */
export function toSepia(r: number, g: number, b: number): [number, number, number] {
  const { SEPIA_STRENGTH, SEPIA_BRIGHTNESS_SCALE } = PARCHMENT_FOG_CONSTANTS;

  // Standard sepia matrix
  const sr = Math.min(1, r * 0.393 + g * 0.769 + b * 0.189);
  const sg = Math.min(1, r * 0.349 + g * 0.686 + b * 0.168);
  const sb = Math.min(1, r * 0.272 + g * 0.534 + b * 0.131);

  // Blend: lerp(original, sepia, strength) * brightness
  const outR = (r + (sr - r) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;
  const outG = (g + (sg - g) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;
  const outB = (b + (sb - b) * SEPIA_STRENGTH) * SEPIA_BRIGHTNESS_SCALE;

  return [outR, outG, outB];
}

// ── Fog Layer Type ───────────────────────────────────────────────────────────

/**
 * Logical layer categories used for per-hex fog gating.
 * These map to groups of scene objects, not 1:1 with RENDER_ORDER.
 */
export type FogLayer = 'terrain' | 'signifier' | 'location' | 'label' | 'agent' | 'event' | 'grid';

// ── Layer Visibility Gate ─────────────────────────────────────────────────────

/**
 * Returns true if a given fog layer should be visible for a hex with the given state.
 *
 * Gating rules (from Phase 7 UI-SPEC):
 * - unexplored: only 'terrain' shows (dark fill color, all others hidden)
 * - remembered: terrain, signifier, location, label visible; agent, event, grid hidden
 * - visible: all layers visible
 *
 * NFP #2: Pure function — deterministic, traceable, no side effects.
 *
 * @param state - The hex's current fog-of-war state
 * @param layer - The render layer category being tested
 */
export function isLayerVisibleForHex(state: HexVisibilityState, layer: FogLayer): boolean {
  switch (state) {
    case 'unexplored':
      return layer === 'terrain';
    case 'remembered':
      return layer === 'terrain' || layer === 'signifier' || layer === 'location' || layer === 'label';
    case 'visible':
      return true;
  }
}

// ── Original Color Cache ─────────────────────────────────────────────────────

/**
 * Pre-computes and caches the original (un-fogged) terrain colors for all hex tiles.
 *
 * Call once at scene initialization. The returned Float32Array and indexByKey map
 * are then passed to updateFogColors on every visibility change.
 *
 * @param tiles  - The full hex tile array (same order as InstancedMesh instances)
 * @param seed   - World seed for deterministic per-hex color noise
 * @param lakeIds - Optional lake ID array (same length as tiles, -1 = not a lake)
 * @returns colors: Float32Array (length = tiles.length * 3, r/g/b per tile)
 *          indexByKey: Map<"col,row", tileIndex>
 */
export function buildOriginalColorCache(
  tiles: HexTile[],
  seed: number,
  lakeIds?: Int16Array,
): { colors: Float32Array; indexByKey: Map<string, number> } {
  const colors = new Float32Array(tiles.length * 3);
  const indexByKey = new Map<string, number>();

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const lakeId = lakeIds ? lakeIds[i] : undefined;
    const [r, g, b] = getHexColor(tile.terrain, seed, tile.col, tile.row, {
      elevation: tile.elevation,
      lakeId: lakeId !== undefined ? lakeId : undefined,
    });
    colors[i * 3 + 0] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    indexByKey.set(visKey(tile.col, tile.row), i);
  }

  return { colors, indexByKey };
}

// ── Fog Color Override ───────────────────────────────────────────────────────

/**
 * Updates InstancedMesh instance colors based on the current visibility map.
 *
 * - unexplored hexes → FOG_CONSTANTS.UNEXPLORED_HEX_COLOR
 * - remembered/visible hexes → restored from originalColors cache
 *
 * Batches all setColorAt calls first, then sets needsUpdate once at the end
 * to minimize GPU upload overhead.
 *
 * NFP #4: Fail-soft — hexes with unknown keys in indexByKey are silently skipped.
 *
 * @param fillMesh      - The HexFill InstancedMesh
 * @param visibilityMap - Current fog state, keyed by "col,row"
 * @param indexByKey    - Mapping from "col,row" to tile index (from buildOriginalColorCache)
 * @param originalColors - Float32Array of original r/g/b values (from buildOriginalColorCache)
 */
export function updateFogColors(
  fillMesh: THREE.InstancedMesh,
  visibilityMap: VisibilityMap,
  indexByKey: Map<string, number>,
  originalColors: Float32Array,
): void {
  for (const [key, hexVis] of visibilityMap) {
    const idx = indexByKey.get(key);
    if (idx === undefined) continue; // fail-soft: unknown hex key

    if (hexVis.state === 'unexplored') {
      fillMesh.setColorAt(idx, getFogColor());
    } else {
      const r = originalColors[idx * 3 + 0];
      const g = originalColors[idx * 3 + 1];
      const b = originalColors[idx * 3 + 2];
      _restoreColor.setRGB(r, g, b, THREE.SRGBColorSpace);
      fillMesh.setColorAt(idx, _restoreColor);
    }
  }

  if (fillMesh.instanceColor) {
    fillMesh.instanceColor.needsUpdate = true;
  }
}

// ── Visibility Computation ───────────────────────────────────────────────────

/**
 * Computes the set of hexes currently visible from a list of LOS sources.
 *
 * Uses BFS outward from each source up to source.range steps.
 * Returns only the "currently visible" set — the caller (HexMapV2.tsx) diffs
 * this against the stored VisibilityMap to detect state transitions.
 *
 * NFP #3: Deterministic — output depends only on sources, cols, rows.
 * NFP #4: Bounds-checked — out-of-bounds neighbors are skipped without throwing.
 *
 * @param sources - Array of LOS sources (position + range)
 * @param cols    - Grid width (hexes with col < 0 or col >= cols are excluded)
 * @param rows    - Grid height (hexes with row < 0 or row >= rows are excluded)
 * @returns Map of "col,row" → 'visible' for all hexes within any source's range
 */
export function computeVisibilityFromSources(
  sources: LOSSource[],
  cols: number,
  rows: number,
): Map<string, 'visible'> {
  const result = new Map<string, 'visible'>();

  for (const source of sources) {
    // BFS from source hex
    const startKey = visKey(source.hexCol, source.hexRow);
    const visited = new Map<string, number>(); // key → distance
    visited.set(startKey, 0);
    result.set(startKey, 'visible');

    const queue: Array<{ col: number; row: number; dist: number }> = [
      { col: source.hexCol, row: source.hexRow, dist: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.dist >= source.range) continue;

      const neighbors = hexNeighbors({ col: current.col, row: current.row });
      for (const neighbor of neighbors) {
        // Bounds check
        if (neighbor.col < 0 || neighbor.col >= cols) continue;
        if (neighbor.row < 0 || neighbor.row >= rows) continue;

        const neighborKey = visKey(neighbor.col, neighbor.row);
        if (visited.has(neighborKey)) continue;

        visited.set(neighborKey, current.dist + 1);
        result.set(neighborKey, 'visible');
        queue.push({ col: neighbor.col, row: neighbor.row, dist: current.dist + 1 });
      }
    }
  }

  return result;
}
