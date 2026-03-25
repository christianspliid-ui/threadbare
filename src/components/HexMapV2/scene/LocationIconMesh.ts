/**
 * LocationIconMesh.ts — Three.js scene module for location icon sprites.
 *
 * Places one THREE.Sprite per location using the location icon registry.
 * Large locations (full/medium size class) are centered on the hex.
 * Smaller locations distribute on fixed vertex slots around the hex center,
 * using getFixedSlotOffset with VERTEX_ANGLES_DEG (0°/60°/120°/…).
 *
 * Capital locations additionally receive a red ring sprite overlay.
 *
 * Follows the SignifierMesh.ts pattern: factory function returns THREE.Group,
 * all tunable values are named constants.
 *
 * NFP #1 (tunability): LOCATION_ICON_Z, LOCATION_ICON_THRESHOLD, ring constants are named.
 * NFP #3 (determinism): ring slots sorted by name for stable assignment.
 * NFP #4 (fail-soft): Unknown location types, missing textures silently skip — never crash.
 */

import * as THREE from 'three';
import { hexToPixel } from '../../../lib/hexMath';
import { getFixedSlotOffset } from '../../../lib/movementPath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  LOCATION_ICON_REGISTRY,
  LOCATION_SIZE_SCALE,
  CENTERED_SIZE_CLASSES,
} from '../locations/locationIconRegistry';
import { buildLocationIconTextureCache } from '../locations/locationIconTextures';
import {
  SLOT_RING_RADIUS,
  VERTEX_ANGLES_DEG,
  LOCATION_RING_SCALE_FACTOR,
  MAX_RING_LOCATIONS,
} from '../../../data/agent-visual-content';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Z offset for location icon sprites — above SIGNIFIER_Z (0.07), below agents. */
export const LOCATION_ICON_Z = 0.08;

/**
 * Minimum zoom level (d3-zoom k) at which location icons are visible.
 * Matches SIGNIFIER_ZOOM_THRESHOLD: show at regional (k>=5) and hero-local (k>=15).
 */
export const LOCATION_ICON_THRESHOLD = 5;

/** Red color for capital location ring markers (hex string for canvas). */
const CAPITAL_RING_COLOR = '#cc3333';

/** Canvas size for the capital ring texture. */
const CAPITAL_RING_SIZE = 128;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Minimal node data needed to render a location icon.
 * Comes from the world graph — populated by game data, not hardcoded.
 */
export interface LocationNode {
  locationType: string;
  hexCol: number;
  hexRow: number;
  name: string;
  isCapital?: boolean;
}

// ── Capital ring texture (built once) ────────────────────────────────────────

/**
 * Builds a red circle stroke texture for capital location ring markers.
 * Returns a THREE.CanvasTexture with a red circle outline on transparent background.
 *
 * NFP #4: If canvas context unavailable, returns a plain CanvasTexture.
 */
function buildCapitalRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CAPITAL_RING_SIZE;
  canvas.height = CAPITAL_RING_SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.arc(
      CAPITAL_RING_SIZE / 2,
      CAPITAL_RING_SIZE / 2,
      CAPITAL_RING_SIZE / 2 - 6,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = CAPITAL_RING_COLOR;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Scene Module Factory ──────────────────────────────────────────────────────

/**
 * Creates a THREE.Group containing icon sprites for all provided locations.
 *
 * Large locations (full/medium size class) are centered on their hex.
 * Smaller locations (small/tiny) distribute in a ring with a rotation offset
 * from the agent ring to avoid overlap.
 *
 * @param locations  Array of location nodes to render
 * @returns          THREE.Group at RENDER_ORDER.LOCATIONS (8)
 *
 * NFP #3: Ring slots sorted by name for deterministic assignment.
 * NFP #4: Returns empty Group if locations is empty.
 *         Silently skips unknown locationType or missing textures — never crashes.
 */
export function createLocationIconMesh(locations: LocationNode[]): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS;

  if (locations.length === 0) return group;

  // Build texture cache once (no per-frame cost)
  const textureCache = buildLocationIconTextureCache(LOCATION_ICON_REGISTRY);

  // Build capital ring texture lazily (shared across all capitals)
  let capitalRingTexture: THREE.CanvasTexture | null = null;

  // Group locations by hex key for ring layout computation
  const hexGroups = new Map<string, LocationNode[]>();
  for (const loc of locations) {
    const key = `${loc.hexCol},${loc.hexRow}`;
    if (!hexGroups.has(key)) hexGroups.set(key, []);
    hexGroups.get(key)!.push(loc);
  }

  // Sort each group by name for deterministic ring slot assignment (NFP #3)
  for (const hexLocs of hexGroups.values()) {
    hexLocs.sort((a, b) => a.name.localeCompare(b.name));
  }

  for (const hexLocs of hexGroups.values()) {
    // Partition into centered vs ring-eligible locations
    const centered: LocationNode[] = [];
    const ringEligible: LocationNode[] = [];

    for (const loc of hexLocs) {
      const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
      if (!iconDef) continue; // NFP #4: skip unknown type

      if (CENTERED_SIZE_CLASSES.has(iconDef.sizeClass)) {
        centered.push(loc);
      } else {
        ringEligible.push(loc);
      }
    }

    // ── Render centered locations (at hex center, full registry scale) ──
    for (const loc of centered) {
      addLocationSprite(group, loc, textureCache, 0, 0, 1.0);

      if (loc.isCapital) {
        if (!capitalRingTexture) capitalRingTexture = buildCapitalRingTexture();
        addCapitalRing(group, loc, textureCache, capitalRingTexture, 0, 0);
      }
    }

    // ── Render ring locations (distributed around hex center, downscaled) ──
    const visible = ringEligible.slice(0, MAX_RING_LOCATIONS);
    for (let i = 0; i < visible.length; i++) {
      const loc = visible[i];
      const offset = getFixedSlotOffset(i, visible.length, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);

      addLocationSprite(group, loc, textureCache, offset.x, offset.y, LOCATION_RING_SCALE_FACTOR);

      if (loc.isCapital) {
        if (!capitalRingTexture) capitalRingTexture = buildCapitalRingTexture();
        addCapitalRing(group, loc, textureCache, capitalRingTexture, offset.x, offset.y);
      }
    }
  }

  return group;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Adds a location icon sprite to the group at the given offset from hex center.
 *
 * @param group         Target THREE.Group
 * @param loc           Location node data
 * @param textureCache  Pre-built texture cache
 * @param offsetX       X offset from hex center (0 for centered locations)
 * @param offsetY       Y offset from hex center (0 for centered locations)
 * @param scaleFactor   Additional scale multiplier (1.0 for centered, <1 for ring)
 */
function addLocationSprite(
  group: THREE.Group,
  loc: LocationNode,
  textureCache: Map<string, THREE.CanvasTexture>,
  offsetX: number,
  offsetY: number,
  scaleFactor: number,
): void {
  const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
  if (!iconDef) return;

  const texture = textureCache.get(loc.locationType);
  if (!texture) return; // NFP #4: skip missing texture

  const spriteSize = HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass] * scaleFactor;
  const { x, y } = hexToPixel({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  // Y-flip: SVG y-down, Three.js y-up. Ring offset Y is also flipped.
  sprite.position.set(x + offsetX, -y - offsetY, LOCATION_ICON_Z);
  sprite.scale.set(spriteSize, spriteSize, 1);
  group.add(sprite);
}

/**
 * Adds a capital ring overlay sprite at the same position as the location icon.
 */
function addCapitalRing(
  group: THREE.Group,
  loc: LocationNode,
  textureCache: Map<string, THREE.CanvasTexture>,
  capitalRingTexture: THREE.CanvasTexture,
  offsetX: number,
  offsetY: number,
): void {
  const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
  if (!iconDef) return;

  const spriteSize = HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass];
  const { x, y } = hexToPixel({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);

  const ringMaterial = new THREE.SpriteMaterial({
    map: capitalRingTexture,
    transparent: true,
    depthWrite: false,
  });
  const ringSprite = new THREE.Sprite(ringMaterial);
  ringSprite.position.set(x + offsetX, -y - offsetY, LOCATION_ICON_Z + 0.001);
  ringSprite.scale.set(spriteSize, spriteSize, 1);
  group.add(ringSprite);
}
