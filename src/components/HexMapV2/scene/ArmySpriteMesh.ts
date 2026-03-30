/**
 * ArmySpriteMesh.ts — Three.js scene module for army shield sprite rendering.
 *
 * Places one THREE.Sprite per army hex using a canvas-drawn heraldic shield icon.
 * Armies in active battles are filtered out (BattleIndicatorMesh shows instead).
 * Icon size scales with army size via three named tiers (small/medium/large).
 * Color is faction-specific via per-faction sprite material.
 *
 * Follows the LocationIconMesh / AgentSpriteMesh pattern:
 * - Factory function returns THREE.Group
 * - All tunable values are named constants
 * - fail-soft on missing data (skip, never crash)
 *
 * NFP #1 (tunability): All scale thresholds and icon sizes are named constants.
 * NFP #3 (determinism): Armies sorted by id for stable rendering.
 * NFP #4 (fail-soft): Missing or invalid army data silently skips — never crashes.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Maximum army size to be classified as 'small'. 1–SMALL_MAX = small tier. */
export const ARMY_SIZE_SMALL_MAX = 49;

/** Maximum army size to be classified as 'medium'. SMALL_MAX+1–MEDIUM_MAX = medium tier. */
export const ARMY_SIZE_MEDIUM_MAX = 149;

/** Sprite scale for small armies (diameter in world units). */
const ARMY_SCALE_SMALL = 4.0;

/** Sprite scale for medium armies (diameter in world units). */
const ARMY_SCALE_MEDIUM = 6.0;

/** Sprite scale for large armies (diameter in world units, 150+ troops). */
const ARMY_SCALE_LARGE = 8.0;

/** Canvas size for the shield atlas texture in pixels. */
const ATLAS_SIZE = 256;

/** Outline color for the shield silhouette (dark, high-contrast). */
const SHIELD_OUTLINE_COLOR = '#1a1a1f';

/** Outline stroke width in canvas pixels. */
const SHIELD_OUTLINE_WIDTH = 8;

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Minimal data needed to render one army's shield sprite.
 * Comes from the world graph — populated by game data.
 */
export interface ArmyRenderData {
  /** Unique ID for this army node in the graph. */
  armyId: string;
  /** Hex column of the army's current position. */
  hexCol: number;
  /** Hex row of the army's current position. */
  hexRow: number;
  /** Faction heraldic color as a CSS hex string (e.g. '#e63946'). */
  factionColor: string;
  /** Army size in troops — drives small/medium/large icon scale. */
  armySize: number;
  /** If true, army is in an active battle — skip rendering (BattleIndicatorMesh shows instead). */
  isInBattle: boolean;
}

// ── Scale helper ─────────────────────────────────────────────────────────────

/**
 * Returns the Three.js sprite scale (world-unit diameter) for a given army size.
 * Three tiers: small (1–49), medium (50–149), large (150+).
 *
 * NFP #1: Thresholds are named constants — tune ARMY_SIZE_SMALL_MAX / ARMY_SIZE_MEDIUM_MAX.
 *
 * @param armySize - Number of troops
 */
export function getArmySizeScale(armySize: number): number {
  if (armySize <= ARMY_SIZE_SMALL_MAX) return ARMY_SCALE_SMALL;
  if (armySize <= ARMY_SIZE_MEDIUM_MAX) return ARMY_SCALE_MEDIUM;
  return ARMY_SCALE_LARGE;
}

// ── Texture factory ──────────────────────────────────────────────────────────

/**
 * Builds a canvas texture containing a heraldic shield silhouette.
 *
 * Shield shape: classic heater/escutcheon style (flat top, pointed base).
 * Fill color from `factionColor`; outline from SHIELD_OUTLINE_COLOR.
 *
 * NFP #4: If canvas context unavailable, returns a plain colored CanvasTexture.
 *
 * @param factionColor - CSS color string for the shield fill
 */
function buildShieldTexture(factionColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const w = ATLAS_SIZE;
    const h = ATLAS_SIZE;
    const cx = w / 2;

    // Heater-shield path (flat top, curved sides, pointed base)
    // Coordinates normalized to ATLAS_SIZE canvas
    ctx.beginPath();
    // Top-left corner
    ctx.moveTo(cx * 0.15, h * 0.08);
    // Top edge (flat)
    ctx.lineTo(cx * 1.85, h * 0.08);
    // Right side curves inward slightly then sweeps to point
    ctx.bezierCurveTo(
      cx * 1.95, h * 0.08,   // control 1
      cx * 2.0,  h * 0.40,   // control 2
      cx,        h * 0.92,   // end: bottom point
    );
    // Left side mirrors
    ctx.bezierCurveTo(
      cx * 0.0,  h * 0.40,   // control 1
      cx * 0.05, h * 0.08,   // control 2
      cx * 0.15, h * 0.08,   // end: back to start
    );
    ctx.closePath();

    // Fill with faction color
    ctx.fillStyle = factionColor;
    ctx.fill();

    // Outline
    ctx.strokeStyle = SHIELD_OUTLINE_COLOR;
    ctx.lineWidth = SHIELD_OUTLINE_WIDTH;
    ctx.stroke();

    // Inner highlight band — slightly smaller shield shape at lower opacity
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx * 0.28, h * 0.16);
    ctx.lineTo(cx * 1.72, h * 0.16);
    ctx.bezierCurveTo(
      cx * 1.82, h * 0.16,
      cx * 1.85, h * 0.42,
      cx,        h * 0.84,
    );
    ctx.bezierCurveTo(
      cx * 0.15, h * 0.42,
      cx * 0.18, h * 0.16,
      cx * 0.28, h * 0.16,
    );
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Texture cache (module-level) ──────────────────────────────────────────────

/** Cache of shield textures keyed by faction color string. Avoids per-army canvas allocation. */
const shieldTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Returns (or builds) a cached shield texture for the given faction color.
 * Module-level cache — built once per faction color, no per-frame cost.
 */
export function getShieldTexture(factionColor: string): THREE.CanvasTexture {
  let tex = shieldTextureCache.get(factionColor);
  if (!tex) {
    tex = buildShieldTexture(factionColor);
    shieldTextureCache.set(factionColor, tex);
  }
  return tex;
}

// ── Scene Module Factory ──────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing shield sprites for all provided armies.
 *
 * Armies with `isInBattle === true` are filtered out — the BattleIndicatorMesh
 * renders crossed-swords for them instead.
 *
 * One Sprite per army. Faction colors are handled by pre-built material per
 * faction color group (shared textures via getShieldTexture cache).
 *
 * @param armies      Array of ArmyRenderData to render
 * @returns           THREE.Group at RENDER_ORDER.ARMIES z-level
 *
 * NFP #3: Armies sorted by armyId for deterministic rendering.
 * NFP #4: Returns empty Group if armies is empty.
 *         Silently skips armies with missing/invalid data.
 */
export function createArmySpriteMesh(armies: ArmyRenderData[]): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.AGENTS; // Use same render order as agents; Z-position handles depth

  if (armies.length === 0) return group;

  // Filter out armies in battle, sort by id for determinism (NFP #3)
  const toRender = armies
    .filter(a => !a.isInBattle)
    .sort((a, b) => a.armyId.localeCompare(b.armyId));

  for (const army of toRender) {
    // NFP #4: skip armies with invalid hex positions
    if (army.hexCol == null || army.hexRow == null) continue;

    const worldPos = hexToWorld({ col: army.hexCol, row: army.hexRow }, HEX_CONSTANTS.HEX_SIZE);
    const scale = getArmySizeScale(army.armySize);
    const texture = getShieldTexture(army.factionColor);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(worldPos.x, worldPos.y, LAYER_Z.ARMIES);
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
  }

  return group;
}
