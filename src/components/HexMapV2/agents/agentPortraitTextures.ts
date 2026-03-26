/**
 * agentPortraitTextures.ts — Canvas texture builders for agent rendering.
 *
 * Builds THREE.CanvasTexture objects for:
 *   - Faction dot textures (colored circle, optional retinue gold ring)
 *   - Portrait textures (circular clip of portrait image with faction/retinue ring)
 *
 * All textures are built once and cached; no per-frame cost.
 *
 * NFP #1 (tunability): Sizes, line widths, and colors are named constants or params.
 * NFP #4 (fail-soft): Portrait load failures fall back to faction dot texture silently.
 */

import * as THREE from 'three';
import {
  FACTION_DOT_TEXTURE_SIZE,
  PORTRAIT_TEXTURE_SIZE,
  RETINUE_BORDER_COLOR,
  RETINUE_BORDER_ALT_COLOR,
} from './agentSpriteTypes';

// ── Dot Texture Builders ─────────────────────────────────────────────────────

/**
 * Builds a faction dot texture: a solid-filled circle in the faction color.
 *
 * @param factionColor — CSS color string for the dot fill
 * @param size — canvas resolution in pixels (default FACTION_DOT_TEXTURE_SIZE=64)
 * @returns THREE.CanvasTexture with needsUpdate=true
 */
export function buildFactionDotTexture(
  factionColor: string,
  size: number = FACTION_DOT_TEXTURE_SIZE,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = factionColor;
  ctx.fill();
  ctx.closePath();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a retinue dot texture: faction-color fill + gold ring + white inner highlight.
 *
 * The two-tone ring (gold outer + white inner) visually distinguishes retinue agents
 * from regular faction members at regional zoom.
 *
 * @param factionColor — CSS color string for the dot fill
 * @param size — canvas resolution in pixels (default FACTION_DOT_TEXTURE_SIZE=64)
 * @returns THREE.CanvasTexture with needsUpdate=true
 */
export function buildRetinueDotTexture(
  factionColor: string,
  size: number = FACTION_DOT_TEXTURE_SIZE,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 2;

  // Fill circle with faction color
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = factionColor;
  ctx.fill();
  ctx.closePath();

  // Gold outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = RETINUE_BORDER_COLOR;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.closePath();

  // White inner highlight ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  ctx.strokeStyle = RETINUE_BORDER_ALT_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.closePath();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Portrait Texture Loader ──────────────────────────────────────────────────

/**
 * Loads a portrait image and rasterizes it as a circular clip with a faction/retinue ring.
 *
 * Async because it waits for the image to load. On failure, falls back to a
 * faction dot texture (fail-soft per NFP #4).
 *
 * @param url — image URL to load (crossOrigin='anonymous')
 * @param ringColor — faction color or retinue gold for the outer ring
 * @param isRetinue — if true, draws gold ring + white highlight; else draws faction ring
 * @returns Promise resolving to THREE.CanvasTexture (always resolves, never rejects)
 */
export async function loadPortraitTexture(
  url: string,
  ringColor: string,
  isRetinue: boolean,
): Promise<THREE.CanvasTexture> {
  const size = PORTRAIT_TEXTURE_SIZE;

  return new Promise<THREE.CanvasTexture>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 4;

      // Circular clip for the portrait image
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      // Cover crop: extract centered square from non-square source
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();

      if (isRetinue) {
        // Gold retinue ring (thicker)
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = RETINUE_BORDER_COLOR;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.closePath();

        // White inner highlight ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
        ctx.strokeStyle = RETINUE_BORDER_ALT_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      } else {
        // Faction color ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      resolve(tex);
    };

    // NFP #4: On error, fall back to faction dot texture — never reject
    img.onerror = () => {
      resolve(buildFactionDotTexture(ringColor));
    };

    img.src = url;
  });
}

// ── Texture Cache Builder ────────────────────────────────────────────────────

/**
 * Pre-builds faction dot textures for all faction indices.
 *
 * Called once at scene initialization to avoid per-frame texture creation.
 * The cache lives for the scene's lifetime.
 *
 * @param factionColors — array of faction color strings (indexed 0-5)
 * @returns Map<factionIndex, CanvasTexture>
 */
export function buildFactionDotTextureCache(
  factionColors: string[],
): Map<number, THREE.CanvasTexture> {
  const cache = new Map<number, THREE.CanvasTexture>();
  for (let i = 0; i < factionColors.length; i++) {
    cache.set(i, buildFactionDotTexture(factionColors[i]));
  }
  return cache;
}
