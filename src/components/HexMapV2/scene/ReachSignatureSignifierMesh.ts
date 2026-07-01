/**
 * ReachSignatureSignifierMesh.ts — Three.js scene layer for the three
 * engine-backed ascendant reach-signature footprints (THR-554):
 *
 *  • warhost — Iron muster ring with crossed blades (force red)
 *  • rift    — Veil tear / vesica, pulsing, tinted to the amplified sphere
 *  • wonder  — Stone monument glyph with a radiant crown (matter tan)
 *
 * Mirrors the LocationRaritySignifierMesh pattern exactly: a factory returns a
 * THREE.Group plus a dispose() and a tick() for the pulsing (rift) materials.
 * One sprite per marker, positioned via hexToWorld, drawn from a cached
 * CanvasTexture keyed by (kind, colour).
 *
 * NFP #1 (tunability): all sizes/opacities/periods are named constants.
 * NFP #3 (determinism): markers arrive pre-sorted; textures are cache-keyed.
 * NFP #4 (fail-soft): missing 2D context or empty input yields an empty group.
 */

import * as THREE from 'three';
import { hexToWorld } from '../../../lib/worldPosition';
import { RENDER_ORDER, LAYER_Z } from './RenderLayers';
import { HEX_CONSTANTS } from './HexFillMesh';
import { SPHERE_COLORS } from '../../icons/constants';
import type { ReachSignatureMarker } from '../../../engine/reachSignatureMarkers';
import {
  WARHOST_SIGNIFIER_COLOR,
  WONDER_SIGNIFIER_COLOR,
  RIFT_SIGNIFIER_FALLBACK_COLOR,
  REACH_SIGNATURE_TEXTURE_SIZE,
  WARHOST_SPRITE_SCALE,
  RIFT_SPRITE_SCALE,
  WONDER_SPRITE_SCALE,
  REACH_SIGNATURE_STATIC_OPACITY,
  RIFT_PULSE_MIN_OPACITY,
  RIFT_PULSE_MAX_OPACITY,
  RIFT_PULSE_PERIOD_S,
} from './reachSignatureVisualConstants';

/** Scene-layer runtime state for reach-signature signifier sprites. */
export interface ReachSignatureSignifierLayerGroup {
  signifierGroup: THREE.Group;
  materials: THREE.SpriteMaterial[];
  /** Rift materials only — driven by tickReachSignatureSignifiers. */
  pulsingMaterials: THREE.SpriteMaterial[];
  dispose: () => void;
}

/** Texture cache keyed by `${kind}:${color}`. Built once, shared across sprites. */
const signatureTextureCache = new Map<string, THREE.CanvasTexture>();

/** Resolve the glyph tint for a marker. Rift follows its amplified sphere. */
function markerColor(marker: ReachSignatureMarker): string {
  switch (marker.kind) {
    case 'warhost':
      return WARHOST_SIGNIFIER_COLOR;
    case 'wonder':
      return WONDER_SIGNIFIER_COLOR;
    case 'rift':
      return (marker.sphere && SPHERE_COLORS[marker.sphere]) || RIFT_SIGNIFIER_FALLBACK_COLOR;
  }
}

/** Sprite diameter (world units) for a marker kind. */
function markerScale(kind: ReachSignatureMarker['kind']): number {
  const mult =
    kind === 'warhost' ? WARHOST_SPRITE_SCALE : kind === 'rift' ? RIFT_SPRITE_SCALE : WONDER_SPRITE_SCALE;
  return HEX_CONSTANTS.HEX_SIZE * mult;
}

// ── Glyph drawing ─────────────────────────────────────────────────────────────

/** Iron / Warhost: a martial ring with crossed blades. */
function drawWarhost(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const c = size / 2;
  const r = size * 0.4;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  // Outer muster ring.
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.stroke();
  // Crossed blades (two diagonal bars).
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  const b = r * 0.72;
  ctx.beginPath();
  ctx.moveTo(c - b, c - b);
  ctx.lineTo(c + b, c + b);
  ctx.moveTo(c + b, c - b);
  ctx.lineTo(c - b, c + b);
  ctx.stroke();
}

/** Veil / Rift: a vertical vesica (tear) with a bright seam. */
function drawRift(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const c = size / 2;
  const halfH = size * 0.42;
  const halfW = size * 0.2;
  // Soft outer glow.
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(c, c - halfH);
  ctx.quadraticCurveTo(c + halfW, c, c, c + halfH);
  ctx.quadraticCurveTo(c - halfW, c, c, c - halfH);
  ctx.fill();
  // Bright central seam.
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c, c - halfH * 0.85);
  ctx.lineTo(c, c + halfH * 0.85);
  ctx.stroke();
}

/** Stone / Wonder: an upright monument with a radiant crown. */
function drawWonder(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  const c = size / 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Monument body — a tapered obelisk.
  ctx.globalAlpha = 0.85;
  const baseY = size * 0.82;
  const topY = size * 0.34;
  const halfBase = size * 0.14;
  const halfTop = size * 0.06;
  ctx.beginPath();
  ctx.moveTo(c - halfBase, baseY);
  ctx.lineTo(c - halfTop, topY);
  ctx.lineTo(c + halfTop, topY);
  ctx.lineTo(c + halfBase, baseY);
  ctx.closePath();
  ctx.fill();
  // Radiant crown — short rays from the apex.
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = 'round';
  const rayLen = size * 0.13;
  const apexY = topY - size * 0.02;
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * (Math.PI / 7);
    ctx.beginPath();
    ctx.moveTo(c, apexY);
    ctx.lineTo(c + Math.cos(angle) * rayLen, apexY + Math.sin(angle) * rayLen);
    ctx.stroke();
  }
}

function getSignatureTexture(kind: ReachSignatureMarker['kind'], color: string): THREE.CanvasTexture {
  const key = `${kind}:${color}`;
  const cached = signatureTextureCache.get(key);
  if (cached) return cached;

  const size = REACH_SIGNATURE_TEXTURE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (kind === 'warhost') drawWarhost(ctx, size, color);
    else if (kind === 'rift') drawRift(ctx, size, color);
    else drawWonder(ctx, size, color);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  signatureTextureCache.set(key, texture);
  return texture;
}

export function createReachSignatureSignifierLayer(
  markers: readonly ReachSignatureMarker[],
): ReachSignatureSignifierLayerGroup {
  const signifierGroup = new THREE.Group();
  signifierGroup.renderOrder = RENDER_ORDER.REACH_SIGNATURE_SIGNIFIER;

  const materials: THREE.SpriteMaterial[] = [];
  const pulsingMaterials: THREE.SpriteMaterial[] = [];
  let disposed = false;

  for (const marker of markers) {
    const color = markerColor(marker);
    const isRift = marker.kind === 'rift';
    const material = new THREE.SpriteMaterial({
      map: getSignatureTexture(marker.kind, color),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: isRift ? RIFT_PULSE_MIN_OPACITY : REACH_SIGNATURE_STATIC_OPACITY,
    });

    const sprite = new THREE.Sprite(material);
    const scale = markerScale(marker.kind);
    const { x: wx, y: wy } = hexToWorld({ col: marker.hexCol, row: marker.hexRow }, HEX_CONSTANTS.HEX_SIZE);
    sprite.position.set(wx, wy, LAYER_Z.REACH_SIGNATURE_SIGNIFIER);
    sprite.scale.set(scale, scale, 1);
    signifierGroup.add(sprite);

    materials.push(material);
    if (isRift) pulsingMaterials.push(material);
  }

  return {
    signifierGroup,
    materials,
    pulsingMaterials,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      // Materials share cached textures — dispose materials only, not the shared
      // texture map (a rebuild reuses the cache).
      for (const mat of materials) mat.dispose();
      signifierGroup.clear();
    },
  };
}

/** Drive the rift pulse. No-op when there are no rifts (NFP #7: cheap idle). */
export function tickReachSignatureSignifiers(
  layer: ReachSignatureSignifierLayerGroup,
  elapsedS: number,
): void {
  if (layer.pulsingMaterials.length === 0) return;

  const pulseT = (Math.sin((elapsedS / RIFT_PULSE_PERIOD_S) * Math.PI * 2) + 1) / 2;
  const opacity = RIFT_PULSE_MIN_OPACITY + (RIFT_PULSE_MAX_OPACITY - RIFT_PULSE_MIN_OPACITY) * pulseT;
  for (const material of layer.pulsingMaterials) material.opacity = opacity;
}
