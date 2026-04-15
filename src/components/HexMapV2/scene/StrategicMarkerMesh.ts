/**
 * StrategicMarkerMesh.ts — Three.js scene module for strategic action hex overlays.
 *
 * Renders two types of markers onto hexes where agents have active strategic activity:
 *
 * 1. **Project markers** — family-colored dot at the SE corner of the hex, with a
 *    gentle pulse animation, indicating an active multi-tick project in progress.
 *
 * 2. **Control pips** — tiny family-colored dots distributed around the hex ring,
 *    indicating active control stances. Opacity scales with health (firm → degraded).
 *
 * Follows the ActivityIconMesh pattern:
 * - Canvas-rasterized textures built once at module load (never at frame time)
 * - Sprite-based rendering — one sprite per marker
 * - Layer factory returns `{ group, rebuild, tick, setVisible, dispose }`
 * - RING and SE slot positions derived from HEX_CONSTANTS.HEX_SIZE
 *
 * NFP #1 (Tunability): All sizes, opacities, positions, and animation parameters
 *   are named constants imported from strategicPresentation.ts.
 * NFP #3 (Determinism): Pulse driven by monotonic elapsed time, no PRNG.
 * NFP #4 (Fail-soft): Unknown behavior families fall back to BEHAVIOR_FAMILY_FALLBACK.
 *   Empty data arrays produce an empty group without error.
 * NFP #7 (Performance): Textures built once per color. Instance count bounded by
 *   strategic activity (typically < 50 per session).
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  BEHAVIOR_FAMILY_PRESENTATION,
  BEHAVIOR_FAMILY_FALLBACK,
  STRATEGIC_PROJECT_PULSE_PERIOD,
  STRATEGIC_PROJECT_PULSE_MIN,
  STRATEGIC_PROJECT_PULSE_MAX,
  STRATEGIC_CONTROL_OPACITY_FIRM,
  STRATEGIC_CONTROL_OPACITY_DEGRADED,
  STRATEGIC_MARKER_TEXTURE_SIZE,
  STRATEGIC_PROJECT_MARKER_SIZE,
  STRATEGIC_CONTROL_PIP_SIZE,
  STRATEGIC_PROJECT_MARKER_Z,
  STRATEGIC_CONTROL_PIP_Z,
} from '../../../engine/strategicPresentation';
import type { HexStrategicOverlay } from '../../../engine/strategicPresentation';

// ── Layout constants ───────────────────────────────────────────────────────────

const HEX = HEX_CONSTANTS.HEX_SIZE;

/** World-unit size of a project dot sprite. */
const PROJECT_SPRITE_SIZE = HEX * STRATEGIC_PROJECT_MARKER_SIZE * 2;

/** World-unit size of a control pip sprite. */
const CONTROL_SPRITE_SIZE = HEX * STRATEGIC_CONTROL_PIP_SIZE * 2;

/** SE-slot offset from hex center (lower-right quadrant). */
const PROJECT_OFFSET_X =  HEX * 0.45;
const PROJECT_OFFSET_Y = -HEX * 0.45;

/** Radius for control pip ring (slightly inside the hex boundary). */
const CONTROL_RING_RADIUS = HEX * 0.72;

/** Angles for distributing control pips around the hex (every 60°, flat-top). */
const CONTROL_PIP_ANGLES_RAD: readonly number[] = [0, 1, 2, 3, 4, 5].map(
  i => (i * 60 * Math.PI) / 180,
);

// ── Texture cache ──────────────────────────────────────────────────────────────

/** Cached textures keyed by hex color string (e.g. "#c8a84e"). */
const dotTextureCache = new Map<string, THREE.CanvasTexture>();

function buildDotTexture(color: string): THREE.CanvasTexture {
  const cached = dotTextureCache.get(color);
  if (cached) return cached;

  const size = STRATEGIC_MARKER_TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    // Soft glow halo
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    gradient.addColorStop(0, color + 'cc');
    gradient.addColorStop(0.5, color + '66');
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Solid core
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  dotTextureCache.set(color, texture);
  return texture;
}

function getFamilyColor(behaviorFamily: string): string {
  const entry = (BEHAVIOR_FAMILY_PRESENTATION as Record<string, { color: string } | undefined>)[
    behaviorFamily
  ];
  return entry?.color ?? BEHAVIOR_FAMILY_FALLBACK.color;
}

// ── Data interfaces ────────────────────────────────────────────────────────────

/** A single project marker entry for the layer. */
export interface StrategicProjectMarkerData {
  hexCol: number;
  hexRow: number;
  behaviorFamily: string;
  /** 0–1 progress fraction — for potential future arc texture variation. */
  progressFraction: number;
}

/** A single control pip entry for the layer. */
export interface StrategicControlPipData {
  hexCol: number;
  hexRow: number;
  behaviorFamily: string;
  degradation: number;  // 0 = firm, 1 = about to collapse
  ringIndex: number;    // 0–5, position around the hex
}

// ── Layer interface ────────────────────────────────────────────────────────────

export interface StrategicMarkerLayer {
  /** THREE.Group — add to the scene once and leave mounted. */
  group: THREE.Group;
  /** Replace all markers from a new set of hex strategic overlays. */
  rebuild(overlays: Map<string, HexStrategicOverlay>): void;
  /** Advance the pulse animation. Call once per render frame. */
  tick(elapsedS: number): void;
  /** Toggle layer visibility (hide when zoomed past threshold). */
  setVisible(visible: boolean): void;
  /** Release all GPU resources. Call when the scene is torn down. */
  dispose(): void;
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Create the strategic marker layer.
 *
 * Returns a StrategicMarkerLayer whose group should be added to the Three.js scene
 * once. Call rebuild() when strategicState changes, tick() every frame, and
 * dispose() on scene teardown.
 */
export function createStrategicMarkerLayer(): StrategicMarkerLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS; // between locations and agents

  /** Currently live project sprite materials — updated each tick for pulse. */
  let projectMaterials: THREE.SpriteMaterial[] = [];
  /** Currently live control pip sprite materials — static opacity. */
  let controlMaterials: THREE.SpriteMaterial[] = [];

  // ── Internal helpers ───────────────────────────────────────────────────────

  function clearSprites(): void {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    for (const mat of projectMaterials) mat.dispose();
    for (const mat of controlMaterials) mat.dispose();
    projectMaterials = [];
    controlMaterials = [];
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function rebuild(overlays: Map<string, HexStrategicOverlay>): void {
    clearSprites();

    for (const overlay of overlays.values()) {
      const worldCenter = hexToWorld(
        { col: overlay.hexCol, row: overlay.hexRow },
        HEX,
      );

      // ── Project markers (one per active project on this hex) ───────────────
      overlay.projects.forEach((proj, idx) => {
        const color = getFamilyColor(proj.behaviorFamily);
        const texture = buildDotTexture(color);

        const mat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          opacity: STRATEGIC_PROJECT_PULSE_MAX,
        });

        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(PROJECT_SPRITE_SIZE, PROJECT_SPRITE_SIZE, 1);

        // Stack multiple projects slightly offset so they don't fully overlap
        const stackOffsetX = idx * PROJECT_SPRITE_SIZE * 0.4;
        sprite.position.set(
          worldCenter.x + PROJECT_OFFSET_X + stackOffsetX,
          worldCenter.y + PROJECT_OFFSET_Y,
          STRATEGIC_PROJECT_MARKER_Z,
        );
        sprite.renderOrder = RENDER_ORDER.LOCATIONS;

        group.add(sprite);
        projectMaterials.push(mat);
      });

      // ── Control pips (one per active control stance on this hex) ─────────
      overlay.controls.forEach((ctrl, idx) => {
        const color = getFamilyColor(ctrl.behaviorFamily);
        const texture = buildDotTexture(color);

        // Opacity: firm = OPACITY_FIRM, degraded = OPACITY_DEGRADED (linear)
        const opacity =
          STRATEGIC_CONTROL_OPACITY_FIRM -
          ctrl.degradation * (STRATEGIC_CONTROL_OPACITY_FIRM - STRATEGIC_CONTROL_OPACITY_DEGRADED);

        const mat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          opacity,
        });

        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(CONTROL_SPRITE_SIZE, CONTROL_SPRITE_SIZE, 1);

        // Distribute around ring
        const angle = CONTROL_PIP_ANGLES_RAD[idx % CONTROL_PIP_ANGLES_RAD.length];
        sprite.position.set(
          worldCenter.x + Math.cos(angle) * CONTROL_RING_RADIUS,
          worldCenter.y + Math.sin(angle) * CONTROL_RING_RADIUS,
          STRATEGIC_CONTROL_PIP_Z,
        );
        sprite.renderOrder = RENDER_ORDER.LOCATIONS;

        group.add(sprite);
        controlMaterials.push(mat);
      });
    }
  }

  function tick(elapsedS: number): void {
    if (projectMaterials.length === 0) return;

    // Sine pulse between PULSE_MIN and PULSE_MAX
    const phase = (elapsedS / STRATEGIC_PROJECT_PULSE_PERIOD) * Math.PI * 2;
    const pulse = 0.5 + 0.5 * Math.sin(phase); // 0–1
    const opacity =
      STRATEGIC_PROJECT_PULSE_MIN +
      pulse * (STRATEGIC_PROJECT_PULSE_MAX - STRATEGIC_PROJECT_PULSE_MIN);

    for (const mat of projectMaterials) {
      mat.opacity = opacity;
    }
  }

  function setVisible(visible: boolean): void {
    group.visible = visible;
  }

  function dispose(): void {
    clearSprites();
    // dotTextureCache is module-level and intentionally not cleared here.
  }

  return { group, rebuild, tick, setVisible, dispose };
}
