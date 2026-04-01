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
import { hexKey as hexKeyFn } from '../../../lib/hexKey';
import { hexToWorld } from '../../../lib/worldPosition';
import { getFixedSlotOffset } from '../../../lib/movementPath';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import {
  LOCATION_ICON_REGISTRY,
  LOCATION_SIZE_SCALE,
  CENTERED_SIZE_CLASSES,
} from '../locations/locationIconRegistry';
import type { LocationSizeClass } from '../locations/locationIconRegistry';
import {
  buildLocationIconTexture,
  buildLocationIconTextureCache,
  LAIR_SPHERE_FILL_COLORS,
  CLEARED_LAIR_FILL_COLOR,
} from '../locations/locationIconTextures';
import { getActivePalette } from '../palette/activePalette';
import { ANOMALY_SPHERE_MAP, ANOMALY_LOCATION_TYPES } from './anomalyConstants';
import {
  SLOT_RING_RADIUS,
  VERTEX_ANGLES_DEG,
  LOCATION_RING_SCALE_FACTOR,
  MAX_RING_LOCATIONS,
} from '../../../data/agent-visual-content';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** Z offset for location icon sprites — from centralized LAYER_Z */
export const LOCATION_ICON_Z = LAYER_Z.LOCATIONS;

/**
 * Minimum zoom level (d3-zoom k) at which location icons are visible.
 * Matches SIGNIFIER_ZOOM_THRESHOLD: show at regional (k>=5) and hero-local (k>=15).
 */
export const LOCATION_ICON_THRESHOLD = 5;

/** Red color for capital location ring markers (hex string for canvas). */
const CAPITAL_RING_COLOR_DEFAULT = '#cc3333';

/** Canvas size for the capital ring texture. */
const CAPITAL_RING_SIZE = 128;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Minimal node data needed to render a location icon.
 * Comes from the world graph — populated by game data, not hardcoded.
 *
 * PHASE-D-DEFERRED: Add `rarityTier?: number` here and read it from location node properties
 * to apply Mythic/Legendary visual overlays. For tier 3 (Mythic), consider a subtle glow ring.
 * For tier 4 (Legendary), apply the RARITY_LEGENDARY_PULSE_ANIMATION CSS class or a Three.js
 * particle/shimmer overlay (similar to AnomalyShimmerMesh). See rarity-constants.ts for
 * RARITY_LEGENDARY_PULSE_ANIMATION and RARITY_NOTIFICATION_THRESHOLD.
 */
export interface LocationNode {
  locationType: string;
  hexCol: number;
  hexRow: number;
  name: string;
  isCapital?: boolean;
  /** Dominant sphere for lair nodes — drives sphere-tinted fill color */
  dominantSphere?: string;
  /** Lair escalation tier — drives sizeClass override (minor=small, major=medium, legendary=full) */
  lairTier?: string;
  /** True if this location is a natural anomaly (hidden treasure). */
  isAnomalyLocation?: boolean;
  /** True if the anomaly has been discovered through exploration. */
  discoveredByExploration?: boolean;
}

/**
 * Lair sizeClass override by tier.
 * Minor lairs render at 'small', major at 'medium', legendary at 'full'.
 * NFP #1: constants here — change game feel by changing tier mapping.
 */
const LAIR_TIER_SIZE_CLASS: Record<string, LocationSizeClass> = {
  minor:     'small',
  major:     'medium',
  legendary: 'full',
};

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
    ctx.strokeStyle = getActivePalette().capitalRingColor;
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

  // Build texture cache for standard (non-lair) location types once (no per-frame cost)
  const textureCache = buildLocationIconTextureCache(LOCATION_ICON_REGISTRY);

  // Build sphere-tinted lair textures keyed as "lair:{sphere}" and "cleared_lair"
  const lairDef = LOCATION_ICON_REGISTRY['lair'];
  const clearedLairDef = LOCATION_ICON_REGISTRY['cleared_lair'];
  if (lairDef) {
    for (const [sphere, fillColor] of Object.entries(LAIR_SPHERE_FILL_COLORS)) {
      const key = `lair:${sphere}`;
      if (!textureCache.has(key)) {
        textureCache.set(key, buildLocationIconTexture(lairDef, undefined, fillColor));
      }
    }
    // Fallback for unknown sphere — use default near-black fill
    if (!textureCache.has('lair:unknown')) {
      textureCache.set('lair:unknown', buildLocationIconTexture(lairDef));
    }
  }
  if (clearedLairDef && !textureCache.has('cleared_lair')) {
    textureCache.set('cleared_lair', buildLocationIconTexture(clearedLairDef, undefined, CLEARED_LAIR_FILL_COLOR));
  }

  // Build sphere-tinted anomaly textures keyed as "anomaly:{locationType}:{sphere}"
  for (const [anomalyType, sphere] of Object.entries(ANOMALY_SPHERE_MAP)) {
    const fillColor = LAIR_SPHERE_FILL_COLORS[sphere];
    if (!fillColor) continue;
    const anomalyDef = LOCATION_ICON_REGISTRY[anomalyType as keyof typeof LOCATION_ICON_REGISTRY];
    if (!anomalyDef) continue;
    const key = `anomaly:${anomalyType}`;
    if (!textureCache.has(key)) {
      textureCache.set(key, buildLocationIconTexture(anomalyDef, undefined, fillColor));
    }
  }

  // Build capital ring texture lazily (shared across all capitals)
  let capitalRingTexture: THREE.CanvasTexture | null = null;

  // Group locations by hex key for ring layout computation
  const hexGroups = new Map<string, LocationNode[]>();
  for (const loc of locations) {
    const key = hexKeyFn(loc.hexCol, loc.hexRow);
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

      // Lair sizeClass override: use tier-based size, not registry default
      const effectiveSizeClass: LocationSizeClass =
        loc.locationType === 'lair' && loc.lairTier
          ? (LAIR_TIER_SIZE_CLASS[loc.lairTier] ?? iconDef.sizeClass)
          : iconDef.sizeClass;

      if (CENTERED_SIZE_CLASSES.has(effectiveSizeClass)) {
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
  // Skip undiscovered anomalies — they render via shimmer layer, not as icons
  if (loc.isAnomalyLocation && !loc.discoveredByExploration) return;

  const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
  if (!iconDef) return;

  // Lair-specific texture key: "lair:{sphere}" for tinted active lairs
  let textureKey = loc.locationType;
  if (loc.locationType === 'lair') {
    const sphere = loc.dominantSphere ?? 'unknown';
    textureKey = `lair:${LAIR_SPHERE_FILL_COLORS[sphere] !== undefined ? sphere : 'unknown'}`;
  }
  // Anomaly-specific texture key: sphere-tinted fill for discovered anomalies
  if (loc.isAnomalyLocation && loc.discoveredByExploration && ANOMALY_LOCATION_TYPES.has(loc.locationType)) {
    textureKey = `anomaly:${loc.locationType}`;
  }

  const texture = textureCache.get(textureKey);
  if (!texture) return; // NFP #4: skip missing texture

  // Lair sizeClass override by tier; cleared_lair stays at registry default
  const effectiveSizeClass: LocationSizeClass =
    loc.locationType === 'lair' && loc.lairTier
      ? (LAIR_TIER_SIZE_CLASS[loc.lairTier] ?? iconDef.sizeClass)
      : iconDef.sizeClass;

  const spriteSize = HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[effectiveSizeClass] * scaleFactor;
  const { x: wx, y: wy } = hexToWorld({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  // Ring offset Y is flipped (SVG offset convention)
  sprite.position.set(wx + offsetX, wy - offsetY, LOCATION_ICON_Z);
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
  const { x: wx, y: wy } = hexToWorld({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);

  const ringMaterial = new THREE.SpriteMaterial({
    map: capitalRingTexture,
    transparent: true,
    depthWrite: false,
  });
  const ringSprite = new THREE.Sprite(ringMaterial);
  ringSprite.position.set(wx + offsetX, wy - offsetY, LOCATION_ICON_Z + 0.001);
  ringSprite.scale.set(spriteSize, spriteSize, 1);
  group.add(ringSprite);
}
