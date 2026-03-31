/**
 * AnomalyShimmerMesh.ts — Three.js scene module for anomaly visual effects.
 *
 * Three visual states:
 *   1. Undiscovered: faint sphere-colored radial glow pulsing on the hex (shimmer)
 *   2. Discovery moment: bright flash + particle burst, crossfading shimmer → halo
 *   3. Discovered: persistent sphere-colored ring beneath the location icon (halo)
 *
 * Follows the BattleIndicatorLayer.ts pattern: factory + tick function.
 *
 * NFP #1 (tunability): All constants imported from anomalyConstants.ts.
 * NFP #3 (determinism): No PRNG — pulse driven by monotonic elapsed time.
 * NFP #4 (fail-soft): Missing sphere → fallback color, missing data → skip silently.
 */

import * as THREE from 'three';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { hexToWorld } from '../../../lib/worldPosition';
import { HEX_CONSTANTS } from './HexFillMesh';
import { getSphereColor } from '../../../data/sphereIcons';
import {
  ANOMALY_SPHERE_MAP,
  ANOMALY_FALLBACK_SPHERE_COLOR,
  SHIMMER_PULSE_PERIOD_S,
  SHIMMER_MIN_OPACITY,
  SHIMMER_MAX_OPACITY,
  SHIMMER_SPRITE_SCALE,
  SHIMMER_TEXTURE_SIZE,
  HALO_PULSE_PERIOD_S,
  HALO_MIN_OPACITY,
  HALO_MAX_OPACITY,
  HALO_SPRITE_SCALE,
  HALO_TEXTURE_SIZE,
  HALO_RING_INNER_RADIUS_FRAC,
  HALO_RING_OUTER_RADIUS_FRAC,
  REVEAL_FLASH_DURATION_MS,
  REVEAL_FLASH_PEAK_OPACITY,
  REVEAL_SHIMMER_FADEOUT_MS,
} from './anomalyConstants';

// ── Data Interface ───────────────────────────────────────────────────────────

/** Minimal data needed to render an anomaly shimmer/halo effect. */
export interface AnomalyShimmerData {
  hexCol: number;
  hexRow: number;
  locationType: string;
  discovered: boolean;
}

// ── Layer Group ──────────────────────────────────────────────────────────────

/** Internal state for an active reveal flash animation. */
interface RevealFlash {
  hexKey: string;
  startTimeS: number;
  shimmerSprite: THREE.Sprite;
  haloSprite: THREE.Sprite;
}

/** Anomaly shimmer layer group — holds both shimmer and halo sprite groups. */
export interface AnomalyShimmerLayerGroup {
  /** Group for undiscovered shimmers (additive glow) */
  shimmerGroup: THREE.Group;
  /** Group for discovered halos (soft ring) */
  haloGroup: THREE.Group;
  /** Materials for per-frame opacity animation */
  shimmerMaterials: THREE.SpriteMaterial[];
  haloMaterials: THREE.SpriteMaterial[];
  /** Active reveal flash transitions */
  revealFlashes: RevealFlash[];
  /** Dispose all GPU resources */
  dispose: () => void;
}

// ── Texture Builders ─────────────────────────────────────────────────────────

/** Cache for shimmer textures by sphere color string. */
const shimmerTextureCache = new Map<string, THREE.CanvasTexture>();
/** Cache for halo textures by sphere color string. */
const haloTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Build or return cached shimmer texture — soft radial gradient glow.
 * Center: sphere color at full alpha. Edge: sphere color at 0 alpha.
 */
function getShimmerTexture(color: string): THREE.CanvasTexture {
  const cached = shimmerTextureCache.get(color);
  if (cached) return cached;

  const size = SHIMMER_TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color + '80'); // 50% alpha
    gradient.addColorStop(1, color + '00');   // 0% alpha
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  shimmerTextureCache.set(color, texture);
  return texture;
}

/**
 * Build or return cached halo texture — soft glowing ring.
 * Ring drawn with thick stroke + multiple opacity passes for glow edge.
 */
function getHaloTexture(color: string): THREE.CanvasTexture {
  const cached = haloTextureCache.get(color);
  if (cached) return cached;

  const size = HALO_TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;
    const innerR = cx * HALO_RING_INNER_RADIUS_FRAC;
    const outerR = cx * HALO_RING_OUTER_RADIUS_FRAC;
    const midR = (innerR + outerR) / 2;
    const ringWidth = outerR - innerR;

    // Outer soft glow (wide, faint)
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth * 3;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Core ring (sharp, brighter)
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Inner glow highlight (narrow, bright)
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth * 0.4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  haloTextureCache.set(color, texture);
  return texture;
}

// ── Sphere Color Lookup ──────────────────────────────────────────────────────

/** Get the sphere color for an anomaly, with fallback. */
function getAnomalySphereColor(locationType: string): string {
  const sphere = ANOMALY_SPHERE_MAP[locationType];
  if (!sphere) return ANOMALY_FALLBACK_SPHERE_COLOR;
  return getSphereColor(sphere);
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates the anomaly shimmer layer — one group for undiscovered shimmers,
 * one group for discovered halos. Each anomaly gets a sprite in the appropriate group.
 *
 * @param anomalies — all anomaly locations (both discovered and undiscovered)
 * @returns AnomalyShimmerLayerGroup ready to be added to the scene
 */
export function createAnomalyShimmerLayer(
  anomalies: AnomalyShimmerData[],
): AnomalyShimmerLayerGroup {
  const shimmerGroup = new THREE.Group();
  shimmerGroup.renderOrder = RENDER_ORDER.ANOMALY_SHIMMER;

  const haloGroup = new THREE.Group();
  haloGroup.renderOrder = RENDER_ORDER.ANOMALY_HALO;

  const shimmerMaterials: THREE.SpriteMaterial[] = [];
  const haloMaterials: THREE.SpriteMaterial[] = [];

  for (const anomaly of anomalies) {
    const color = getAnomalySphereColor(anomaly.locationType);
    const { x: wx, y: wy } = hexToWorld(
      { col: anomaly.hexCol, row: anomaly.hexRow },
      HEX_CONSTANTS.HEX_SIZE,
    );
    const hexKey = `${anomaly.hexCol},${anomaly.hexRow}`;

    if (!anomaly.discovered) {
      // Undiscovered: faint shimmer glow
      const material = new THREE.SpriteMaterial({
        map: getShimmerTexture(color),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: SHIMMER_MIN_OPACITY,
      });
      const sprite = new THREE.Sprite(material);
      const spriteSize = HEX_CONSTANTS.HEX_SIZE * SHIMMER_SPRITE_SCALE;
      sprite.position.set(wx, wy, LAYER_Z.ANOMALY_SHIMMER);
      sprite.scale.set(spriteSize, spriteSize, 1);
      sprite.userData = { hexKey, anomalyState: 'undiscovered' };
      shimmerGroup.add(sprite);
      shimmerMaterials.push(material);
    } else {
      // Discovered: glowing ring halo
      const material = new THREE.SpriteMaterial({
        map: getHaloTexture(color),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: HALO_MIN_OPACITY,
      });
      const sprite = new THREE.Sprite(material);
      const spriteSize = HEX_CONSTANTS.HEX_SIZE * HALO_SPRITE_SCALE;
      sprite.position.set(wx, wy, LAYER_Z.ANOMALY_HALO);
      sprite.scale.set(spriteSize, spriteSize, 1);
      sprite.userData = { hexKey, anomalyState: 'discovered' };
      haloGroup.add(sprite);
      haloMaterials.push(material);
    }
  }

  return {
    shimmerGroup,
    haloGroup,
    shimmerMaterials,
    haloMaterials,
    revealFlashes: [],
    dispose: () => {
      for (const mat of shimmerMaterials) { mat.map?.dispose(); mat.dispose(); }
      for (const mat of haloMaterials) { mat.map?.dispose(); mat.dispose(); }
      shimmerGroup.clear();
      haloGroup.clear();
    },
  };
}

// ── Per-Frame Animation ──────────────────────────────────────────────────────

/**
 * Tick all anomaly shimmer/halo animations. Call once per frame from the render loop.
 *
 * @param layer — the AnomalyShimmerLayerGroup to animate
 * @param elapsedS — elapsed time in seconds (from THREE.Clock)
 */
export function tickAnomalyShimmers(
  layer: AnomalyShimmerLayerGroup,
  elapsedS: number,
): void {
  // Shimmer pulse (undiscovered)
  const shimmerT = (Math.sin((elapsedS / SHIMMER_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const shimmerOpacity = SHIMMER_MIN_OPACITY + (SHIMMER_MAX_OPACITY - SHIMMER_MIN_OPACITY) * shimmerT;
  for (const mat of layer.shimmerMaterials) {
    mat.opacity = shimmerOpacity;
  }

  // Halo pulse (discovered)
  const haloT = (Math.sin((elapsedS / HALO_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const haloOpacity = HALO_MIN_OPACITY + (HALO_MAX_OPACITY - HALO_MIN_OPACITY) * haloT;
  for (const mat of layer.haloMaterials) {
    mat.opacity = haloOpacity;
  }

  // Reveal flash transitions
  const flashDurationS = REVEAL_FLASH_DURATION_MS / 1000;
  const fadeoutDurationS = REVEAL_SHIMMER_FADEOUT_MS / 1000;
  const completed: number[] = [];

  for (let i = 0; i < layer.revealFlashes.length; i++) {
    const flash = layer.revealFlashes[i];
    const age = elapsedS - flash.startTimeS;

    if (age < fadeoutDurationS) {
      // Phase 1: shimmer fades out, halo flashes bright
      const fadeProgress = age / fadeoutDurationS;
      const shimmerMat = flash.shimmerSprite.material as THREE.SpriteMaterial;
      shimmerMat.opacity = SHIMMER_MAX_OPACITY * (1 - fadeProgress);

      const haloMat = flash.haloSprite.material as THREE.SpriteMaterial;
      haloMat.opacity = REVEAL_FLASH_PEAK_OPACITY;
    } else if (age < flashDurationS) {
      // Phase 2: shimmer gone, halo decays from flash peak to normal pulse
      flash.shimmerSprite.visible = false;
      const decayProgress = (age - fadeoutDurationS) / (flashDurationS - fadeoutDurationS);
      const haloMat = flash.haloSprite.material as THREE.SpriteMaterial;
      haloMat.opacity = REVEAL_FLASH_PEAK_OPACITY + (haloOpacity - REVEAL_FLASH_PEAK_OPACITY) * decayProgress;
    } else {
      // Phase 3: flash complete — halo joins normal pulse
      flash.shimmerSprite.visible = false;
      completed.push(i);
    }
  }

  // Remove completed flashes (reverse order to preserve indices)
  for (let i = completed.length - 1; i >= 0; i--) {
    layer.revealFlashes.splice(completed[i], 1);
  }
}

// ── Reveal Trigger ───────────────────────────────────────────────────────────

/**
 * Trigger a reveal flash animation for a specific anomaly hex.
 * Finds the shimmer sprite at that hex and crossfades it to a halo.
 *
 * @param layer — the AnomalyShimmerLayerGroup
 * @param hexCol — hex column of the anomaly
 * @param hexRow — hex row of the anomaly
 * @param elapsedS — current elapsed time (for animation start)
 * @returns true if a flash was triggered, false if no shimmer sprite found
 */
export function triggerAnomalyRevealFlash(
  layer: AnomalyShimmerLayerGroup,
  hexCol: number,
  hexRow: number,
  elapsedS: number,
): boolean {
  const hexKey = `${hexCol},${hexRow}`;

  // Find the shimmer sprite for this hex
  let shimmerSprite: THREE.Sprite | null = null;
  for (const child of layer.shimmerGroup.children) {
    if ((child as THREE.Sprite).userData?.hexKey === hexKey) {
      shimmerSprite = child as THREE.Sprite;
      break;
    }
  }
  if (!shimmerSprite) return false; // NFP #4: no shimmer at this hex

  // Create a halo sprite at the same position for the crossfade
  // (We need the anomaly's sphere color — derive from locationType in userData)
  const locationType = shimmerSprite.userData?.locationType as string | undefined;
  const color = locationType ? getAnomalySphereColor(locationType) : ANOMALY_FALLBACK_SPHERE_COLOR;

  const haloMat = new THREE.SpriteMaterial({
    map: getHaloTexture(color),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0, // starts invisible, flash will set it
  });
  const haloSprite = new THREE.Sprite(haloMat);
  const spriteSize = HEX_CONSTANTS.HEX_SIZE * HALO_SPRITE_SCALE;
  haloSprite.position.copy(shimmerSprite.position);
  haloSprite.position.z = LAYER_Z.ANOMALY_HALO;
  haloSprite.scale.set(spriteSize, spriteSize, 1);
  haloSprite.userData = { hexKey, anomalyState: 'discovered' };
  layer.haloGroup.add(haloSprite);
  layer.haloMaterials.push(haloMat);

  // Register the flash transition
  layer.revealFlashes.push({
    hexKey,
    startTimeS: elapsedS,
    shimmerSprite,
    haloSprite,
  });

  return true;
}
