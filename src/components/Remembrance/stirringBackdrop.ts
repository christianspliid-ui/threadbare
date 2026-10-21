import type { StirringImage } from '../../types/remembrance';

/** Salt so the backdrop draw does not share a stream with the fragment filters. */
const STIRRING_BACKDROP_SALT = 0x9e3779b9;

/**
 * THR-1989: the stirring image for a run when the player does not pick one.
 * Pure and seeded (NFP 3) — the same seed gives the same image on every load.
 * Returns null for an empty list (fail-soft: the flow then shows no backdrop).
 */
export function drawStirringBackdrop(images: StirringImage[], seed: number): StirringImage | null {
  if (images.length === 0) return null;
  let h = Math.imul((seed | 0) ^ STIRRING_BACKDROP_SALT, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return images[(h >>> 0) % images.length];
}
