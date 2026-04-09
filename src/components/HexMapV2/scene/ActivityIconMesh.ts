/**
 * ActivityIconMesh.ts — Three.js scene module for encounter activity micro-icons.
 *
 * Renders small silhouette sprites near agents that have active encounters or
 * selected encounter intents, offset to the upper-right of the agent's world
 * position so they don't overlap the agent dot itself.
 *
 * Each icon key gets its own cached texture from activityIndicatorRegistry.
 * Icons pulse gently to signal ongoing activity without demanding constant
 * attention.
 *
 * NFP #1 (tunability): All sizes, offsets, and animation parameters are named
 *   constants imported from attention-constants.ts.
 * NFP #2 (inspectability): ActivityIconData exposes agentId, icon key, and tier
 *   so callers can trace exactly why an icon appears at a given position.
 * NFP #3 (determinism): No PRNG — pulse driven by monotonic elapsed time.
 * NFP #4 (fail-soft): Unknown reach colours fall back to a neutral grey.
 *   Empty data arrays produce an empty group without error.
 */

import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { ACTIVITY_ICON_SIZE, ACTIVITY_ICON_PULSE_PERIOD } from '../../../data/attention-constants';
import {
  buildActivityIconTextureCache,
  type ActivityIndicatorKey,
} from '../agents/activityIndicatorRegistry';

// ── Shared reach colours ──────────────────────────────────────────────────────

/** Shared reach palette — also reused by thread/tug layers for consistent coloring. */
export const REACH_ICON_COLORS: Record<string, string> = {
  iron: '#ff6b6b',
  stone: '#d4a87a',
  eye: '#ffe44d',
  gold: '#33ff77',
  veil: '#44aaff',
  heart: '#cc66ff',
  star: '#ffb355',
  shadow: '#8fd4c0',
};

// ── Layout constants ──────────────────────────────────────────────────────────

/** Canvas resolution for each reach icon texture (pixels). */
const ICON_TEXTURE_SIZE = 16;

/** World-unit offset applied to icon position so it sits above-right of the agent. */
const ICON_OFFSET_X = 3;
const ICON_OFFSET_Y = 3;

/** Amplitude of the opacity pulse (±). */
const PULSE_AMPLITUDE = 0.1;

// ── Texture cache ─────────────────────────────────────────────────────────────

const textureCache = buildActivityIconTextureCache();

function getFallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_TEXTURE_SIZE;
  canvas.height = ICON_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = ICON_TEXTURE_SIZE / 2;
    const cy = ICON_TEXTURE_SIZE / 2;
    const r = ICON_TEXTURE_SIZE * 0.44;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a040';
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

const fallbackTexture = getFallbackTexture();

// ── Data interface ────────────────────────────────────────────────────────────

/** All data needed to render one activity icon near an agent. */
export interface ActivityIconData {
  /** The agent this icon represents. */
  agentId: string;
  /** World X position of the agent (not the icon — offset applied internally). */
  worldX: number;
  /** World Y position of the agent (not the icon — offset applied internally). */
  worldY: number;
  /** Icon describing the encounter activity (travel, combat, trade, crafting, etc.). */
  iconKey: ActivityIndicatorKey;
  /**
   * Base opacity for this icon, determined by attention tier:
   *   - 0.4 = background (non-player-facing)
   *   - 0.6 = shaping tier
   *   - 0.8 = story tier
   */
  tierOpacity: number;
}

// ── Layer interface ───────────────────────────────────────────────────────────

/** Public API for the activity icon layer. */
export interface ActivityIconLayer {
  /** THREE.Group — add to the scene once and leave mounted. */
  group: THREE.Group;
  /** Replace all icons from a new data array. Disposes old sprites. */
  rebuild(icons: ActivityIconData[]): void;
  /** Advance the pulse animation. Call once per render frame. */
  tick(elapsedS: number): void;
  /** Toggle layer visibility (e.g. hide when zoomed out past threshold). */
  setVisible(visible: boolean): void;
  /** Release all GPU resources. Call when the scene is torn down. */
  dispose(): void;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create the activity icon layer.
 *
 * Returns an ActivityIconLayer whose group should be added to the Three.js
 * scene once. Call rebuild() whenever the active encounter set changes, tick()
 * every frame, and dispose() on scene teardown.
 */
export function createActivityIconLayer(): ActivityIconLayer {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ACTIVITY_ICONS;

  /** Currently live sprite materials — updated each tick for pulse. */
  let materials: THREE.SpriteMaterial[] = [];

  /** Base opacities matching materials[], used as pulse mid-point. */
  let baseOpacities: number[] = [];

  // ── internal helpers ──────────────────────────────────────────────────────

  function clearSprites(): void {
    // Remove all children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    // Dispose materials (textures are cached globally — do NOT dispose them here)
    for (const mat of materials) {
      mat.dispose();
    }
    materials = [];
    baseOpacities = [];
  }

  // ── public API ────────────────────────────────────────────────────────────

  function rebuild(icons: ActivityIconData[]): void {
    clearSprites();

    for (const icon of icons) {
      const texture = textureCache.get(icon.iconKey) ?? fallbackTexture;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: icon.tierOpacity,
      });

      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(ACTIVITY_ICON_SIZE, ACTIVITY_ICON_SIZE, 1);
      sprite.position.set(
        icon.worldX + ICON_OFFSET_X,
        icon.worldY + ICON_OFFSET_Y,
        LAYER_Z.ACTIVITY_ICONS,
      );
      sprite.renderOrder = RENDER_ORDER.ACTIVITY_ICONS;

      group.add(sprite);
      materials.push(mat);
      baseOpacities.push(icon.tierOpacity);
    }
  }

  function tick(elapsedS: number): void {
    if (materials.length === 0) return;

    const pulseFactor = Math.sin((elapsedS / ACTIVITY_ICON_PULSE_PERIOD) * Math.PI * 2);

    for (let i = 0; i < materials.length; i++) {
      materials[i].opacity = baseOpacities[i] + pulseFactor * PULSE_AMPLITUDE;
    }
  }

  function setVisible(visible: boolean): void {
    group.visible = visible;
  }

  function dispose(): void {
    clearSprites();
    // Note: textureCache is module-level and intentionally not cleared here,
    // since textures are reused across layer rebuilds. If the renderer itself
    // is being torn down, the caller should dispose the renderer's WebGL context.
  }

  return { group, rebuild, tick, setVisible, dispose };
}
