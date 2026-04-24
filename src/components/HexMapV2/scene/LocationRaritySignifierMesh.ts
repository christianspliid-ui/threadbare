import * as THREE from 'three';
import { RARITY_TIER_COLORS } from '../../../types/rarity';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import type { LocationNode } from './LocationIconMesh';
import {
  RARITY_SIGNIFIER_MIN_TIER,
  RARITY_SIGNIFIER_SPRITE_SCALE_MYTHIC,
  RARITY_SIGNIFIER_SPRITE_SCALE_LEGENDARY,
  RARITY_SIGNIFIER_TEXTURE_SIZE,
  RARITY_SIGNIFIER_RING_INNER_RADIUS_FRAC,
  RARITY_SIGNIFIER_RING_OUTER_RADIUS_FRAC,
  RARITY_SIGNIFIER_STATIC_OPACITY,
  RARITY_SIGNIFIER_PULSE_MIN_OPACITY,
  RARITY_SIGNIFIER_PULSE_MAX_OPACITY,
  RARITY_SIGNIFIER_PULSE_PERIOD_S,
} from './rarityVisualConstants';

/** Scene-layer runtime state for rarity signifier sprites. */
export interface LocationRaritySignifierLayerGroup {
  signifierGroup: THREE.Group;
  materials: THREE.SpriteMaterial[];
  pulsingMaterials: THREE.SpriteMaterial[];
  dispose: () => void;
}

const signifierTextureCache = new Map<string, THREE.CanvasTexture>();
const warnedInvalidTierLocations = new Set<string>();
const FALLBACK_MYTHIC_COLOR = '#4b0082';
const LEGENDARY_TIER = 4;

function getLocationKey(loc: LocationNode): string {
  return `${loc.hexCol},${loc.hexRow}:${loc.name}`;
}

function warnInvalidTierOnce(loc: LocationNode, rawTier: unknown): void {
  const key = getLocationKey(loc);
  if (warnedInvalidTierLocations.has(key)) return;
  warnedInvalidTierLocations.add(key);
  console.warn(
    `[LocationRaritySignifierMesh] Invalid rarity tier for location "${loc.name}" (${loc.hexCol},${loc.hexRow}):`,
    rawTier,
  );
}

function normalizeRarityTier(loc: LocationNode): number {
  const rawTier = loc.rarityTier;
  if (rawTier == null) return 1;
  if (!Number.isFinite(rawTier) || !Number.isInteger(rawTier) || rawTier < 1 || rawTier > 4) {
    warnInvalidTierOnce(loc, rawTier);
    return 1;
  }
  return rawTier;
}

function getRarityColor(tier: number): string {
  if (tier === 3 || tier === 4) return RARITY_TIER_COLORS[tier];
  return FALLBACK_MYTHIC_COLOR;
}

function getSignifierTexture(color: string): THREE.CanvasTexture {
  const cached = signifierTextureCache.get(color);
  if (cached) return cached;

  const size = RARITY_SIGNIFIER_TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const innerR = cx * RARITY_SIGNIFIER_RING_INNER_RADIUS_FRAC;
    const outerR = cx * RARITY_SIGNIFIER_RING_OUTER_RADIUS_FRAC;
    const midR = (innerR + outerR) / 2;
    const ringWidth = outerR - innerR;

    // Outer soft glow for readability over terrain.
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth * 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Core ring.
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  signifierTextureCache.set(color, texture);
  return texture;
}

export function createLocationRaritySignifierLayer(
  locations: LocationNode[],
): LocationRaritySignifierLayerGroup {
  const signifierGroup = new THREE.Group();
  signifierGroup.renderOrder = RENDER_ORDER.LOCATION_RARITY_SIGNIFIER;

  const materials: THREE.SpriteMaterial[] = [];
  const pulsingMaterials: THREE.SpriteMaterial[] = [];
  let disposed = false;

  for (const loc of locations) {
    const tier = normalizeRarityTier(loc);
    if (tier < RARITY_SIGNIFIER_MIN_TIER) continue;

    const color = getRarityColor(tier);
    const isLegendary = tier === LEGENDARY_TIER;
    const material = new THREE.SpriteMaterial({
      map: getSignifierTexture(color),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: isLegendary
        ? RARITY_SIGNIFIER_PULSE_MIN_OPACITY
        : RARITY_SIGNIFIER_STATIC_OPACITY,
    });

    const sprite = new THREE.Sprite(material);
    const spriteScale = HEX_CONSTANTS.HEX_SIZE * (
      isLegendary
        ? RARITY_SIGNIFIER_SPRITE_SCALE_LEGENDARY
        : RARITY_SIGNIFIER_SPRITE_SCALE_MYTHIC
    );
    const { x: wx, y: wy } = hexToWorld({ col: loc.hexCol, row: loc.hexRow }, HEX_CONSTANTS.HEX_SIZE);
    sprite.position.set(wx, wy, LAYER_Z.LOCATION_RARITY_SIGNIFIER);
    sprite.scale.set(spriteScale, spriteScale, 1);
    signifierGroup.add(sprite);

    materials.push(material);
    if (isLegendary) pulsingMaterials.push(material);
  }

  return {
    signifierGroup,
    materials,
    pulsingMaterials,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      for (const mat of materials) {
        mat.map?.dispose();
        mat.dispose();
      }
      signifierGroup.clear();
    },
  };
}

export function tickLocationRaritySignifiers(
  layer: LocationRaritySignifierLayerGroup,
  elapsedS: number,
): void {
  if (layer.pulsingMaterials.length === 0) return;

  const pulseT = (Math.sin((elapsedS / RARITY_SIGNIFIER_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const opacity = RARITY_SIGNIFIER_PULSE_MIN_OPACITY
    + (RARITY_SIGNIFIER_PULSE_MAX_OPACITY - RARITY_SIGNIFIER_PULSE_MIN_OPACITY) * pulseT;

  for (const material of layer.pulsingMaterials) {
    material.opacity = opacity;
  }
}
