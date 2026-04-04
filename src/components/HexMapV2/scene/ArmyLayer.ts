/**
 * ArmyLayer.ts — Three.js scene module for army sprite rendering.
 *
 * Renders army actor nodes on the hex map using THREE.Sprite,
 * following the same patterns as AgentSpriteMesh.
 *
 * Army indicator design:
 *   - Colored circle with faction color and size indicator
 *   - Warband = small circle (1x), Regiment = medium (1.4x), Host = large (1.9x)
 *   - Slight downward offset from hex center to avoid agent overlap
 *   - Visible at all zoom tiers (armies are always significant)
 *
 * NFP #1 (tunability): All scale and size values are named constants.
 * NFP #2 (inspectability): ArmyRenderData exposes all data needed to trace why
 *   an army appears in a particular visual state.
 * NFP #3 (determinism): Faction color derived from stable hash of faction ID.
 * NFP #4 (fail-soft): Missing edges, unknown factions, and texture failures all
 *   silently skip — never crash the scene.
 */

import * as THREE from 'three';
import type { WorldGraph } from '../../../engine/graph';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from './HexFillMesh';
import { FACTION_HERALDIC_COLORS } from '../agents/agentSpriteTypes';
import { generateCoatOfArmsSvg, buildCoatOfArmsConfig } from '../../icons';
import { FACTION_DEFINITIONS } from '../../../data/faction-definitions';
import { MONSTER_FACTION_DEFINITIONS } from '../../../data/monster-faction-definitions';
import type { FactionDefinition } from '../../../types/faction';

/** Combined lookup of all faction definitions (regular + monster) by ID */
const ALL_FACTION_DEFS: ReadonlyMap<string, FactionDefinition> = (() => {
  const map = new Map<string, FactionDefinition>(FACTION_DEFINITIONS);
  for (const def of MONSTER_FACTION_DEFINITIONS) map.set(def.id, def);
  return map;
})();

// ── Constants ────────────────────────────────────────────────────────────────

/** Base radius for warband — smallest army size (in world units) */
export const ARMY_DOT_RADIUS_WARBAND = 5;
/** Base radius for regiment */
export const ARMY_DOT_RADIUS_REGIMENT = 7;
/** Base radius for host — largest army size */
export const ARMY_DOT_RADIUS_HOST = 10;

/** Vertical offset from hex center so armies don't overlap agent dots */
export const ARMY_VERTICAL_OFFSET = -4;

/** Canvas texture resolution for army dot sprites */
export const ARMY_TEXTURE_SIZE = 64;

/** Default fallback color when faction color cannot be resolved */
export const ARMY_FALLBACK_COLOR = '#888888';

/** Inner highlight opacity for the dot (0–1) */
export const ARMY_HIGHLIGHT_OPACITY = 0.35;

// ── Army Render Data ─────────────────────────────────────────────────────────

/** All data needed to render a single army on the hex map. */
export interface ArmyRenderData {
  /** Army actor node ID */
  id: string;
  /** Faction definition ID (extracted from faction node ID, e.g. "ironmongers") — used for coat of arms lookup */
  factionDefId: string | null;
  /** Hex column derived from located_at → location.properties.hexCol */
  hexCol: number;
  /** Hex row */
  hexRow: number;
  /** Army size category */
  size: 'warband' | 'regiment' | 'host';
  /** Faction color (hex string) */
  factionColor: string;
}

// ── Texture cache ─────────────────────────────────────────────────────────────

/** Pre-built texture cache: `${color}:${size}` → CanvasTexture */
const armyTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Build a circular army dot texture.
 * Cached by `${factionColor}:${size}` — no per-frame canvas work.
 */
function getArmyTexture(factionColor: string, size: 'warband' | 'regiment' | 'host'): THREE.CanvasTexture {
  const key = `${factionColor}:${size}`;
  const cached = armyTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = ARMY_TEXTURE_SIZE;
  canvas.height = ARMY_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Fail-soft: return a transparent 1×1 texture
    const fallback = new THREE.CanvasTexture(canvas);
    armyTextureCache.set(key, fallback);
    return fallback;
  }

  const cx = ARMY_TEXTURE_SIZE / 2;
  const cy = ARMY_TEXTURE_SIZE / 2;
  const r = ARMY_TEXTURE_SIZE * 0.42;

  // Outer circle (faction color)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = factionColor;
  ctx.fill();

  // Inner highlight (lighter center for depth)
  ctx.beginPath();
  ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${ARMY_HIGHLIGHT_OPACITY})`;
  ctx.fill();

  // Size indicator: crossed swords silhouette simplified as two lines
  // Warband: one chevron, Regiment: two, Host: three
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  const pips = size === 'warband' ? 1 : size === 'regiment' ? 2 : 3;
  for (let p = 0; p < pips; p++) {
    const yBase = cy + r * 0.05 + (p - (pips - 1) / 2) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, yBase + r * 0.12);
    ctx.lineTo(cx, yBase - r * 0.12);
    ctx.lineTo(cx + r * 0.35, yBase + r * 0.12);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  armyTextureCache.set(key, texture);
  return texture;
}

// ── Coat of Arms texture cache ───────────────────────────────────────────────

/** Cached coat of arms textures by faction definition ID */
const coaTextureCache = new Map<string, THREE.CanvasTexture | 'failed'>();

/**
 * Pre-load coat of arms textures for all known factions.
 * Call this once before building the army layer so textures are
 * ready synchronously when createArmyLayer runs.
 *
 * Returns a promise that resolves when all textures are cached.
 */
export async function preloadCoatOfArmsTextures(texSize: number): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const [defId, def] of ALL_FACTION_DEFS) {
    if (coaTextureCache.has(defId)) continue;

    const config = buildCoatOfArmsConfig(def);
    const svgStr = generateCoatOfArmsSvg(config, texSize);

    const p = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const vbW = 120;
        const vbH = 150;
        const canvas = document.createElement('canvas');
        canvas.width = texSize;
        canvas.height = Math.round((texSize * vbH) / vbW);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          coaTextureCache.set(defId, 'failed');
          resolve();
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        coaTextureCache.set(defId, texture);
        resolve();
      };
      img.onerror = () => {
        coaTextureCache.set(defId, 'failed');
        resolve();
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    });
    promises.push(p);
  }
  await Promise.all(promises);
}

/**
 * Get a cached coat of arms texture for a faction.
 * Call preloadCoatOfArmsTextures() first to ensure textures are ready.
 *
 * NFP #4 (fail-soft): Missing or failed textures return null.
 */
function getCoatOfArmsTexture(factionDefId: string): THREE.CanvasTexture | null {
  const cached = coaTextureCache.get(factionDefId);
  console.debug('[CoA] getCoatOfArmsTexture', factionDefId, 'cached=', cached ? (cached === 'failed' ? 'failed' : 'texture') : 'miss', 'allDefs has?', ALL_FACTION_DEFS.has(factionDefId));
  if (!cached || cached === 'failed') return null;
  return cached;
}

// ── Faction color helper ──────────────────────────────────────────────────────

/**
 * Derive a stable faction color from a faction node ID.
 * Uses a simple string hash → FACTION_HERALDIC_COLORS index.
 * NFP #3: deterministic, no PRNG.
 */
export function factionColorFromId(factionId: string): string {
  let hash = 0;
  for (let i = 0; i < factionId.length; i++) {
    hash = ((hash << 5) - hash + factionId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % FACTION_HERALDIC_COLORS.length;
  return FACTION_HERALDIC_COLORS[idx];
}

// ── Army query ────────────────────────────────────────────────────────────────

/**
 * Query the graph for all renderable army nodes.
 * Follows located_at → location node for hex position.
 * Follows member_of → faction for color.
 *
 * NFP #4: Armies with missing edges are silently skipped.
 */
export function buildArmyRenderData(graph: WorldGraph): ArmyRenderData[] {
  const result: ArmyRenderData[] = [];

  const armyNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null);

  for (const army of armyNodes) {
    // Resolve hex position via located_at edge → location node
    const locEdges = graph.getOutgoingEdges(army.id, 'located_at');
    if (locEdges.length === 0) {
      // Fail-soft: no location, skip (log warn without crashing)
      continue;
    }
    const locationNode = graph.getNode(locEdges[0].target);
    if (!locationNode) continue;

    const hexCol = locationNode.properties.hexCol as number | undefined;
    const hexRow = locationNode.properties.hexRow as number | undefined;
    if (hexCol == null || hexRow == null) continue;

    // Resolve faction color via member_of edge
    const memEdges = graph.getOutgoingEdges(army.id, 'member_of');
    const factionId = memEdges.length > 0 ? memEdges[0].target : null;
    const factionColor = factionId ? factionColorFromId(factionId) : ARMY_FALLBACK_COLOR;

    // Extract faction definition ID for coat of arms lookup
    // factionId format: "faction_def_{defId}" or "faction_def_{defId}_{suffix}"
    let factionDefId: string | null = null;
    if (factionId) {
      const defMatch = factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
      if (defMatch) factionDefId = defMatch[1];
    }

    // Read size from armyState property
    const armyState = army.properties.armyState as { size?: string } | undefined;
    const rawSize = armyState?.size;
    const size: ArmyRenderData['size'] =
      rawSize === 'regiment' ? 'regiment'
      : rawSize === 'host' ? 'host'
      : 'warband';

    result.push({ id: army.id, factionDefId, hexCol, hexRow, size, factionColor });
  }

  return result;
}

// ── Scene group ───────────────────────────────────────────────────────────────

export interface ArmyLayerGroup {
  /** THREE.Group containing all army sprites */
  group: THREE.Group;
  /** Dispose all GPU resources */
  dispose: () => void;
}

/**
 * Creates a THREE.Group of army sprites from ArmyRenderData.
 *
 * @param armies — army render data (use buildArmyRenderData to populate from graph)
 * @returns ArmyLayerGroup ready to be added to the scene
 */
export function createArmyLayer(armies: ArmyRenderData[]): ArmyLayerGroup {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.ARMIES;

  const materials: THREE.SpriteMaterial[] = [];

  for (const army of armies) {
    const radius = army.size === 'warband'
      ? ARMY_DOT_RADIUS_WARBAND
      : army.size === 'regiment'
        ? ARMY_DOT_RADIUS_REGIMENT
        : ARMY_DOT_RADIUS_HOST;

    const { x: wx, y: wy } = hexToWorld(
      { col: army.hexCol, row: army.hexRow },
      HEX_CONSTANTS.HEX_SIZE,
    );

    // Try coat of arms texture first, fall back to colored circle
    const coaTexture = army.factionDefId ? getCoatOfArmsTexture(army.factionDefId) : null;
    const texture = coaTexture ?? getArmyTexture(army.factionColor, army.size);
    const isCoatOfArms = coaTexture != null;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    materials.push(mat);

    const sprite = new THREE.Sprite(mat);
    // Shield aspect ratio is 120:150 (4:5) — taller than wide
    const spriteW = isCoatOfArms ? radius * 2 : radius * 2;
    const spriteH = isCoatOfArms ? radius * 2.5 : radius * 2;
    sprite.scale.set(spriteW, spriteH, 1);
    sprite.position.set(wx, wy + ARMY_VERTICAL_OFFSET, LAYER_Z.ARMIES);
    sprite.renderOrder = RENDER_ORDER.ARMIES;
    group.add(sprite);
  }

  const dispose = () => {
    for (const mat of materials) {
      mat.dispose();
    }
    materials.length = 0;
  };

  return { group, dispose };
}
