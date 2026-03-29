/**
 * BattleIndicatorLayer.ts — Three.js scene module for battle/siege indicators.
 *
 * Renders visual indicators on hexes where battles and sieges are occurring:
 *   - Field battle: pulsing red crossed-swords indicator at hex center
 *   - Siege: orange encirclement ring around the settlement hex
 *
 * Both indicators pulse to signal active combat. Call tickBattleIndicators
 * each frame from the render loop.
 *
 * NFP #1 (tunability): All colors, scales, and animation parameters are named constants.
 * NFP #2 (inspectability): BattleIndicatorData exposes all data needed to trace why
 *   an indicator appears at a particular hex.
 * NFP #3 (determinism): No PRNG — pulse driven by monotonic elapsed time.
 * NFP #4 (fail-soft): Missing edges, unknown locations, and texture failures all
 *   silently skip — never crash the scene.
 */

import * as THREE from 'three';
import type { WorldGraph } from '../../../engine/graph';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from './HexFillMesh';

// ── Constants ────────────────────────────────────────────────────────────────

/** Sprite size for field battle indicator (world units) */
export const BATTLE_SPRITE_SIZE = 12;

/** Sprite size for siege indicator (world units — ring around hex) */
export const SIEGE_RING_SIZE = 20;

/** Canvas resolution for battle indicator sprites */
export const BATTLE_TEXTURE_SIZE = 64;

/** Field battle indicator color */
export const FIELD_BATTLE_COLOR = '#f87171';

/** Siege indicator color */
export const SIEGE_COLOR = '#fb923c';

/** Pulse animation period in seconds */
export const BATTLE_PULSE_PERIOD_S = 1.2;

/** Minimum opacity during pulse */
export const BATTLE_PULSE_MIN_OPACITY = 0.5;

/** Maximum opacity during pulse */
export const BATTLE_PULSE_MAX_OPACITY = 1.0;

// ── Battle Indicator Data ─────────────────────────────────────────────────────

/** All data needed to render a single battle/siege indicator. */
export interface BattleIndicatorData {
  /** Battle actor node ID */
  id: string;
  /** Hex column of the battle location */
  hexCol: number;
  /** Hex row */
  hexRow: number;
  /** Whether this is a siege (true) or field battle (false) */
  isSiege: boolean;
}

// ── Texture factory ───────────────────────────────────────────────────────────

let fieldBattleTexture: THREE.CanvasTexture | null = null;
let siegeTexture: THREE.CanvasTexture | null = null;

/** Build or return cached field battle (crossed swords) texture. */
function getFieldBattleTexture(): THREE.CanvasTexture {
  if (fieldBattleTexture) return fieldBattleTexture;

  const canvas = document.createElement('canvas');
  canvas.width = BATTLE_TEXTURE_SIZE;
  canvas.height = BATTLE_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    fieldBattleTexture = new THREE.CanvasTexture(canvas);
    return fieldBattleTexture;
  }

  const cx = BATTLE_TEXTURE_SIZE / 2;
  const cy = BATTLE_TEXTURE_SIZE / 2;
  const r = BATTLE_TEXTURE_SIZE * 0.44;

  // Semi-transparent background circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,30,30,0.25)';
  ctx.fill();

  // Draw crossed swords: two diagonal lines
  ctx.strokeStyle = FIELD_BATTLE_COLOR;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // First sword: top-left to bottom-right
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.55);
  ctx.stroke();

  // Second sword: top-right to bottom-left
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.55, cy - r * 0.55);
  ctx.lineTo(cx - r * 0.55, cy + r * 0.55);
  ctx.stroke();

  // Central diamond (crossguards)
  ctx.fillStyle = FIELD_BATTLE_COLOR;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.18);
  ctx.lineTo(cx + r * 0.18, cy);
  ctx.lineTo(cx, cy + r * 0.18);
  ctx.lineTo(cx - r * 0.18, cy);
  ctx.closePath();
  ctx.fill();

  fieldBattleTexture = new THREE.CanvasTexture(canvas);
  return fieldBattleTexture;
}

/** Build or return cached siege (encirclement ring) texture. */
function getSiegeTexture(): THREE.CanvasTexture {
  if (siegeTexture) return siegeTexture;

  const canvas = document.createElement('canvas');
  canvas.width = BATTLE_TEXTURE_SIZE;
  canvas.height = BATTLE_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    siegeTexture = new THREE.CanvasTexture(canvas);
    return siegeTexture;
  }

  const cx = BATTLE_TEXTURE_SIZE / 2;
  const cy = BATTLE_TEXTURE_SIZE / 2;
  const outerR = BATTLE_TEXTURE_SIZE * 0.46;
  const innerR = BATTLE_TEXTURE_SIZE * 0.32;

  // Dashed ring with gap pattern — encirclement
  ctx.strokeStyle = SIEGE_COLOR;
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Arrow-heads pointing inward to signal encirclement
  ctx.setLineDash([]);
  ctx.strokeStyle = SIEGE_COLOR;
  ctx.fillStyle = SIEGE_COLOR;
  ctx.lineWidth = 2;

  const arrows = 4;
  for (let i = 0; i < arrows; i++) {
    const angle = (Math.PI * 2 * i) / arrows - Math.PI / 2;
    const tipR = innerR + 2;
    const tx = cx + Math.cos(angle) * tipR;
    const ty = cy + Math.sin(angle) * tipR;
    const left = angle + Math.PI / 2;
    const right = angle - Math.PI / 2;
    const spread = 5;
    const baseR = outerR - 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(cx + Math.cos(angle) * baseR + Math.cos(left) * spread,
               cy + Math.sin(angle) * baseR + Math.sin(left) * spread);
    ctx.lineTo(cx + Math.cos(angle) * baseR + Math.cos(right) * spread,
               cy + Math.sin(angle) * baseR + Math.sin(right) * spread);
    ctx.closePath();
    ctx.fill();
  }

  siegeTexture = new THREE.CanvasTexture(canvas);
  return siegeTexture;
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Query the graph for all active battle/siege nodes.
 * Resolves hex position via located_at edge → location node.
 *
 * NFP #4: Battle nodes with missing edges are silently skipped.
 */
export function buildBattleIndicatorData(graph: WorldGraph): BattleIndicatorData[] {
  const result: BattleIndicatorData[] = [];

  const battleNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.battleState != null);

  for (const battle of battleNodes) {
    // Resolve hex position via located_at edge
    const locEdges = graph.getOutgoingEdges(battle.id, 'located_at');
    if (locEdges.length === 0) continue;

    const locationNode = graph.getNode(locEdges[0].target);
    if (!locationNode) continue;

    const hexCol = locationNode.properties.hexCol as number | undefined;
    const hexRow = locationNode.properties.hexRow as number | undefined;
    if (hexCol == null || hexRow == null) continue;

    const battleState = battle.properties.battleState as { battleType?: string } | undefined;
    const isSiege = battleState?.battleType === 'siege';

    result.push({ id: battle.id, hexCol, hexRow, isSiege });
  }

  return result;
}

// ── Scene group ───────────────────────────────────────────────────────────────

export interface BattleIndicatorLayerGroup {
  /** THREE.Group containing all battle/siege sprites */
  group: THREE.Group;
  /** All sprite materials — update opacity each frame for pulse */
  materials: THREE.SpriteMaterial[];
  /** Dispose all GPU resources */
  dispose: () => void;
}

/**
 * Creates a THREE.Group of battle/siege indicator sprites.
 *
 * @param battles — battle indicator data (use buildBattleIndicatorData to populate from graph)
 * @returns BattleIndicatorLayerGroup ready to be added to the scene
 */
export function createBattleIndicatorLayer(battles: BattleIndicatorData[]): BattleIndicatorLayerGroup {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.BATTLE_INDICATORS;

  const materials: THREE.SpriteMaterial[] = [];

  for (const battle of battles) {
    const { x: wx, y: wy } = hexToWorld(
      { col: battle.hexCol, row: battle.hexRow },
      HEX_CONSTANTS.HEX_SIZE,
    );

    const texture = battle.isSiege ? getSiegeTexture() : getFieldBattleTexture();
    const spriteSize = battle.isSiege ? SIEGE_RING_SIZE : BATTLE_SPRITE_SIZE;

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: BATTLE_PULSE_MAX_OPACITY,
    });
    materials.push(mat);

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(spriteSize, spriteSize, 1);
    sprite.position.set(wx, wy, LAYER_Z.BATTLE_INDICATORS);
    sprite.renderOrder = RENDER_ORDER.BATTLE_INDICATORS;
    group.add(sprite);
  }

  const dispose = () => {
    for (const mat of materials) {
      mat.dispose();
    }
    materials.length = 0;
  };

  return { group, materials, dispose };
}

/**
 * Update battle indicator pulse animation. Call once per render frame.
 *
 * @param layerGroup — the BattleIndicatorLayerGroup to animate
 * @param elapsedS — elapsed time in seconds (from THREE.Clock or performance.now)
 */
export function tickBattleIndicators(
  layerGroup: BattleIndicatorLayerGroup,
  elapsedS: number,
): void {
  const range = BATTLE_PULSE_MAX_OPACITY - BATTLE_PULSE_MIN_OPACITY;
  const t = (Math.sin((elapsedS / BATTLE_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const opacity = BATTLE_PULSE_MIN_OPACITY + range * t;

  for (const mat of layerGroup.materials) {
    mat.opacity = opacity;
  }
}
