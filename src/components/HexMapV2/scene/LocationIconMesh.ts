/**
 * LocationIconMesh.ts — Three.js scene module for location icon sprites.
 *
 * Places one THREE.Sprite per location using the location icon registry.
 * Capital locations additionally receive a red ring sprite overlay.
 * Sprites are textured from CanvasTextures built once at startup.
 *
 * Follows the SignifierMesh.ts pattern: factory function returns THREE.Group,
 * all tunable values are named constants.
 *
 * NFP #1 (tunability): LOCATION_ICON_Z and LOCATION_ICON_THRESHOLD are named constants.
 * NFP #4 (fail-soft): Unknown location types, missing textures silently skip — never crash.
 */

import * as THREE from 'three';
import { hexToPixel } from '../../../lib/hexMath';
import { RENDER_ORDER } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  LOCATION_ICON_REGISTRY,
  LOCATION_SIZE_SCALE,
} from '../locations/locationIconRegistry';
import { buildLocationIconTextureCache } from '../locations/locationIconTextures';

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
 * @param locations  Array of location nodes to render
 * @returns          THREE.Group at RENDER_ORDER.LOCATIONS (8)
 *
 * NFP #4: Returns empty Group if locations is empty.
 *         Silently skips unknown locationType or missing textures — never crashes.
 */
export function createLocationIconMesh(locations: LocationNode[]): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.LOCATIONS;

  if (locations.length === 0) return group;

  // Build texture cache once (no per-frame cost)
  const textureCache = buildLocationIconTextureCache(LOCATION_ICON_REGISTRY);

  // Build capital ring texture once (shared across all capitals)
  let capitalRingTexture: THREE.CanvasTexture | null = null;

  for (const loc of locations) {
    // NFP #4: Skip unknown location type
    const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
    if (!iconDef) continue;

    // NFP #4: Skip missing texture
    const texture = textureCache.get(loc.locationType);
    if (!texture) continue;

    // Compute sprite size from size class
    const spriteSize = HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass];

    // Compute world position (Y-flip: SVG y-down, Three.js y-up)
    const { x, y } = hexToPixel({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);

    // Create icon sprite
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, -y, LOCATION_ICON_Z);
    sprite.scale.set(spriteSize, spriteSize, 1);
    group.add(sprite);

    // Capital locations: add red ring overlay sprite
    if (loc.isCapital) {
      // Build capital ring texture lazily (only if at least one capital exists)
      if (!capitalRingTexture) {
        capitalRingTexture = buildCapitalRingTexture();
      }
      const ringMaterial = new THREE.SpriteMaterial({
        map: capitalRingTexture,
        transparent: true,
        depthWrite: false,
      });
      const ringSprite = new THREE.Sprite(ringMaterial);
      // Slightly above icon to ensure ring renders on top
      ringSprite.position.set(x, -y, LOCATION_ICON_Z + 0.001);
      ringSprite.scale.set(spriteSize, spriteSize, 1);
      group.add(ringSprite);
    }
  }

  return group;
}
