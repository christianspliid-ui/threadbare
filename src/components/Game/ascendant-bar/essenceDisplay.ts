/**
 * Essence display — the readable spend (THR-1607, plan B4:
 * `Docs/plans/2026-09-27-thr-1606-what-your-hand-did.md` § UI pillar).
 *
 * Round-1 cold testers could not say what their essence was. The bars had no
 * numbers, filled against a `/10` scale while pools start at fifty (so every bar
 * sat full and a spend never moved one), and re-sorted by level so a spend
 * silently reordered the list. This module owns the tunables for the fix and the
 * one piece of cross-tree state it needs: which sphere a hovered card would draw
 * from, so the essence row can light up before the player commits (Law 47).
 *
 * The hover signal is a three-line store rather than a context for the same
 * reason `designerView.ts` is: exactly one value crosses between two unrelated
 * trees (the action drawer and the ascendant bar).
 */

import type { SphereName } from '../../../types';
import { INITIAL_ESSENCE_PER_SPHERE } from '../../../engine/influence';

// ─── Tunables (NFP #1) ─────────────────────────────────────────────────────

/**
 * What a full essence bar means. Bound to the starting pool rather than a
 * literal, so the bar always reads "as full as you began" at the start of a run
 * and a spend visibly takes a bite out of it. A pool above the ceiling clamps
 * the fill at 100% while the numeral keeps the true balance.
 */
export const ESSENCE_BAR_CEILING = INITIAL_ESSENCE_PER_SPHERE;

/** How long a row shows its spend (the Law 15 delta cluster) after a cast. */
export const ESSENCE_SPEND_FLASH_MS = 2500;

/**
 * Whether the Elder powers fold (the four Foundation spheres) starts closed.
 * The taste profile: Foundation spheres are elder magic, discovered, not selected.
 */
export const ESSENCE_FOUNDATION_FOLDED_DEFAULT = true;

/**
 * Fill percentage for a pool. Fail-soft (NFP #4): a non-finite or negative
 * level draws an empty bar rather than a NaN width.
 */
export function essenceFillPct(level: number, ceiling: number = ESSENCE_BAR_CEILING): number {
  if (!Number.isFinite(level) || level <= 0 || !(ceiling > 0)) return 0;
  return Math.min(100, (level / ceiling) * 100);
}

// ─── Card-hover preview ────────────────────────────────────────────────────

let previewSphere: SphereName | null = null;
const listeners = new Set<() => void>();

/** Current previewed sphere — the `getSnapshot` half of `useSyncExternalStore`. */
export function getEssencePreviewSphere(): SphereName | null {
  return previewSphere;
}

/** Set (or clear, with `null`) the sphere a hovered card would draw from. */
export function setEssencePreviewSphere(sphere: SphereName | null): void {
  if (previewSphere === sphere) return;
  previewSphere = sphere;
  for (const listener of listeners) listener();
}

/** Subscribe — the `subscribe` half of `useSyncExternalStore`. */
export function subscribeEssencePreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam — restores the module to its initial state. */
export function resetEssencePreview(): void {
  previewSphere = null;
  listeners.clear();
}
