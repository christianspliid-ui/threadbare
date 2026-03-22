/**
 * MovementTrailMesh.ts — Three.js scene module for agent movement trail rendering.
 *
 * Ports the SVG-based MovementTrails component from HexMap to Three.js.
 * Trail segments are Line objects that fade from TRAIL_OPACITY_MAX to TRAIL_OPACITY_MIN
 * over TRAIL_FADE_DURATION milliseconds, then are disposed.
 *
 * NFP #1 (tunability): All timing and opacity values are named constants.
 * NFP #4 (fail-soft): Non-Line children in the group are silently skipped in updateTrails.
 * NFP #7 (performance): Trail segments are disposed immediately on expiry — no leaked geometries.
 */

import * as THREE from 'three';
import {
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
} from '../../../data/agent-visual-content';
import { RENDER_ORDER } from './RenderLayers';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Duration in milliseconds for trail segments to fully fade out.
 * After this time, the segment is removed from the group and disposed.
 * NFP #1: change this number to tune trail persistence.
 */
export const TRAIL_FADE_DURATION = 2000;

/**
 * Z position for trail line geometry.
 * Below agent sprites (AGENT_SPRITE_Z = 0.09) so trails render behind agents.
 */
const TRAIL_Z = 0.085;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Data for a single trail segment — the line drawn between two hex positions
 * after an agent moves from one to the other.
 */
export interface TrailSegment {
  /** World X coordinate of the segment start (fromHex position) */
  fromX: number;
  /** World Y coordinate of the segment start */
  fromY: number;
  /** World X coordinate of the segment end (toHex position) */
  toX: number;
  /** World Y coordinate of the segment end */
  toY: number;
  /** Faction hex color string (e.g. '#e53e3e') — used for LineBasicMaterial color */
  factionColor: string;
  /** performance.now() when this segment was created — used for fade timing */
  startTime: number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates an empty THREE.Group to hold trail line segments.
 *
 * The group uses RENDER_ORDER.AGENTS (9) — same layer as agents.
 * Trail lines are positioned at TRAIL_Z (0.085), slightly below agent sprites (0.09),
 * so they render visually behind agents on the same render layer.
 *
 * @returns empty THREE.Group ready to receive trail segments
 */
export function createMovementTrailMesh(): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.AGENTS;
  return group;
}

// ── Segment adder ─────────────────────────────────────────────────────────────

/**
 * Adds a new trail segment line to the trail group.
 *
 * Creates a THREE.Line with LineBasicMaterial at maximum opacity.
 * Stores `startTime` in userData for fade timing in updateTrails.
 *
 * @param group   — the trail group returned by createMovementTrailMesh
 * @param segment — the segment data to add
 */
export function addTrailSegment(group: THREE.Group, segment: TrailSegment): void {
  const points = [
    new THREE.Vector3(segment.fromX, segment.fromY, TRAIL_Z),
    new THREE.Vector3(segment.toX,   segment.toY,   TRAIL_Z),
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color:       segment.factionColor,
    transparent: true,
    opacity:     TRAIL_OPACITY_MAX,
    depthWrite:  false,
  });

  const line = new THREE.Line(geometry, material);
  line.renderOrder = RENDER_ORDER.AGENTS;
  line.userData.startTime = segment.startTime;

  group.add(line);
}

// ── Per-frame updater ─────────────────────────────────────────────────────────

/**
 * Fades and disposes expired trail segments.
 *
 * Called once per frame from the Three.js render loop (before renderer.render()).
 * For each Line in the group:
 *   - Calculates age = now - userData.startTime
 *   - If age > TRAIL_FADE_DURATION: removes from group, disposes geometry+material
 *   - Otherwise: lerps opacity from TRAIL_OPACITY_MAX to TRAIL_OPACITY_MIN
 *
 * NFP #4: Non-Line children are silently skipped.
 *
 * @param group — the trail group created by createMovementTrailMesh
 */
export function updateTrails(group: THREE.Group): void {
  if (group.children.length === 0) return;

  const now = performance.now();
  const toDispose: THREE.Line[] = [];

  for (const child of group.children) {
    // NFP #4: Skip non-Line objects
    if (!(child instanceof THREE.Line)) continue;

    const startTime = (child.userData.startTime as number) ?? now;
    const age = now - startTime;

    if (age >= TRAIL_FADE_DURATION) {
      toDispose.push(child);
    } else {
      // Lerp opacity: t=0 → TRAIL_OPACITY_MAX, t=1 → TRAIL_OPACITY_MIN
      const t = age / TRAIL_FADE_DURATION;
      const opacity = TRAIL_OPACITY_MAX + (TRAIL_OPACITY_MIN - TRAIL_OPACITY_MAX) * t;
      (child.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  }

  // Dispose and remove expired segments
  for (const line of toDispose) {
    group.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }
}
