/**
 * BattleIndicatorMesh.ts — Three.js scene module for battle crossed-swords indicators.
 *
 * Places one Sprite per active battle hex. The crossed-swords icon pulses
 * between BATTLE_PULSE_MIN and BATTLE_PULSE_MAX opacity on a BATTLE_PULSE_PERIOD_MS cycle.
 *
 * Call `tickBattlePulse(group, elapsedMs)` from the render loop each frame to
 * animate the pulsing effect.
 *
 * Follows the LocationIconMesh pattern: factory + per-frame tick function.
 *
 * NFP #1 (tunability): All pulse constants named — tune period/range without touching logic.
 * NFP #4 (fail-soft): Missing battle data silently skips — never crashes.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Scale of the crossed-swords sprite in world units. */
const BATTLE_ICON_SCALE = 10.0;

/** Duration of one full pulse cycle in milliseconds. */
export const BATTLE_PULSE_PERIOD_MS = 1200;

/** Minimum opacity at the low point of the pulse. */
export const BATTLE_PULSE_MIN = 0.4;

/** Maximum opacity at the high point of the pulse. */
export const BATTLE_PULSE_MAX = 1.0;

/** Canvas size for the crossed-swords texture in pixels. */
const BATTLE_TEXTURE_SIZE = 128;

/** Primary color of the crossed-swords icon. */
const BATTLE_ICON_COLOR = '#f87171';

/** Shadow/outline color for contrast. */
const BATTLE_ICON_SHADOW = '#7f1d1d';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Minimal data needed to render one battle indicator.
 * Comes from the world graph — populated by game data.
 */
export interface BattleRenderData {
  /** Unique ID for the battle node in the graph. */
  battleNodeId: string;
  /** Hex column of the battle location. */
  hexCol: number;
  /** Hex row of the battle location. */
  hexRow: number;
}

// ── Texture factory ──────────────────────────────────────────────────────────

/**
 * Builds a canvas texture containing a crossed-swords icon.
 *
 * Draws two sword silhouettes crossing at the center. Red fill, dark outline.
 *
 * NFP #4: If canvas context unavailable, returns a plain CanvasTexture.
 */
function buildBattleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = BATTLE_TEXTURE_SIZE;
  canvas.height = BATTLE_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const s = BATTLE_TEXTURE_SIZE;
    const cx = s / 2;
    const cy = s / 2;

    // Draw two crossed swords (simplified silhouette: two thick diagonal lines with hilts)
    const drawSword = (angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Blade: long thin rectangle
      ctx.beginPath();
      ctx.rect(-4, -cy * 0.85, 8, s * 0.65);
      ctx.fillStyle = BATTLE_ICON_SHADOW;
      ctx.fill();
      ctx.strokeStyle = BATTLE_ICON_SHADOW;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Blade fill (slightly inset, lighter)
      ctx.beginPath();
      ctx.rect(-2.5, -cy * 0.82, 5, s * 0.62);
      ctx.fillStyle = BATTLE_ICON_COLOR;
      ctx.fill();

      // Crossguard (hilt)
      ctx.beginPath();
      ctx.rect(-14, s * 0.05 - cy, 28, 7);
      ctx.fillStyle = BATTLE_ICON_SHADOW;
      ctx.fill();
      ctx.beginPath();
      ctx.rect(-12, s * 0.06 - cy, 24, 5);
      ctx.fillStyle = BATTLE_ICON_COLOR;
      ctx.fill();

      // Pommel
      ctx.beginPath();
      ctx.arc(0, cy * 0.82 - s * 0.05, 6, 0, Math.PI * 2);
      ctx.fillStyle = BATTLE_ICON_SHADOW;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, cy * 0.82 - s * 0.05, 4, 0, Math.PI * 2);
      ctx.fillStyle = BATTLE_ICON_COLOR;
      ctx.fill();

      ctx.restore();
    };

    // Two swords crossing at 45 degrees
    drawSword(Math.PI / 4);
    drawSword(-Math.PI / 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Module-level cached texture ───────────────────────────────────────────────

/** Shared crossed-swords texture — built once at first use. */
let _battleTexture: THREE.CanvasTexture | null = null;

function getBattleTexture(): THREE.CanvasTexture {
  if (!_battleTexture) {
    _battleTexture = buildBattleTexture();
  }
  return _battleTexture;
}

// ── Scene Module Factory ──────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing crossed-swords sprites for all active battles.
 *
 * All sprites share the same texture and start at full opacity.
 * Call tickBattlePulse() each frame to animate opacity.
 *
 * @param battles     Array of BattleRenderData to render
 * @returns           THREE.Group at LAYER_Z.BATTLE_INDICATOR z-level
 *
 * NFP #4: Returns empty Group if battles is empty.
 *         Silently skips battles with missing/invalid hex data.
 */
export function createBattleIndicatorMesh(battles: BattleRenderData[]): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.AGENTS; // Use same render order as agents; Z handles depth

  if (battles.length === 0) return group;

  const texture = getBattleTexture();

  for (const battle of battles) {
    // NFP #4: skip battles with invalid hex positions
    if (battle.hexCol == null || battle.hexRow == null) continue;

    const worldPos = hexToWorld({ col: battle.hexCol, row: battle.hexRow }, HEX_CONSTANTS.HEX_SIZE);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: BATTLE_PULSE_MAX,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(worldPos.x, worldPos.y, LAYER_Z.BATTLE_INDICATOR);
    sprite.scale.set(BATTLE_ICON_SCALE, BATTLE_ICON_SCALE, 1);
    group.add(sprite);
  }

  return group;
}

// ── Per-frame pulse animation ─────────────────────────────────────────────────

/**
 * Animates battle indicator opacity. Call once per frame from the render loop.
 *
 * Uses a cosine wave to smoothly oscillate between BATTLE_PULSE_MIN and BATTLE_PULSE_MAX
 * over a BATTLE_PULSE_PERIOD_MS cycle. All sprites in the group share the same phase.
 *
 * NFP #1: Pulse constants named — tune BATTLE_PULSE_PERIOD_MS/MIN/MAX to adjust feel.
 *
 * @param group      - The THREE.Group returned by createBattleIndicatorMesh
 * @param elapsedMs  - Elapsed time in milliseconds (e.g. performance.now())
 */
export function tickBattlePulse(group: THREE.Group, elapsedMs: number): void {
  if (group.children.length === 0) return;

  const t = (elapsedMs % BATTLE_PULSE_PERIOD_MS) / BATTLE_PULSE_PERIOD_MS;
  // Cosine wave: 0→PULSE_MAX→PULSE_MIN→PULSE_MAX over one period
  const opacity =
    BATTLE_PULSE_MIN +
    (BATTLE_PULSE_MAX - BATTLE_PULSE_MIN) * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));

  for (const child of group.children) {
    if (child instanceof THREE.Sprite) {
      (child.material as THREE.SpriteMaterial).opacity = opacity;
    }
  }
}
