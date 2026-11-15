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
import { formatEssencePool } from '../../../data/essence-format';
import { ESSENCE_ROW_BALANCE, ESSENCE_ROW_BALANCE_ARIA } from '../../../data/essence-refill-content';

// ─── Tunables (NFP #1) ─────────────────────────────────────────────────────

/**
 * The bar's end when the pool's limit cannot be read (THR-2148: the fallback
 * only — a row with a `cap` ends its bar at the cap, so a full bar means a full
 * pool). Bound to the starting pool rather than a literal. A pool above the
 * ceiling clamps the fill at 100% while the numeral keeps the true balance.
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
 * THR-1986 — Law 51 key for the Elder powers header latch. The header stays off
 * the rail until the first charge to an elder pool, the first hover of a card
 * that draws on one, or (THR-2231) the first card face that prices a cost in
 * one, then stays for good.
 */
export const ESSENCE_ELDER_HEADER_LATCH_KEY = 'threadbare.ui.elderPowersSeen';

export function readElderHeaderLatch(): boolean {
  try {
    return globalThis.localStorage?.getItem(ESSENCE_ELDER_HEADER_LATCH_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeElderHeaderLatch(): void {
  try {
    globalThis.localStorage?.setItem(ESSENCE_ELDER_HEADER_LATCH_KEY, '1');
  } catch {
    // In memory only — the component state still holds it this session.
  }
}

/**
 * Fill percentage for a pool. Fail-soft (NFP #4): a non-finite or negative
 * level draws an empty bar rather than a NaN width.
 */
export function essenceFillPct(level: number, ceiling: number = ESSENCE_BAR_CEILING): number {
  if (!Number.isFinite(level) || level <= 0 || !(ceiling > 0)) return 0;
  return Math.min(100, (level / ceiling) * 100);
}

/**
 * THR-2148 (U2) — the row's balance, with its limit when it can be read: "53 / 55",
 * whole numbers (Law 13, 2026-11-02 amendment), and its accessible name "53 of 55".
 */
export function essenceBalanceText(level: number, cap?: number): { text: string; aria: string } {
  const balance = formatEssencePool(level);
  if (cap === undefined || !Number.isFinite(cap) || cap <= 0) return { text: balance, aria: balance };
  const limit = formatEssencePool(cap);
  return {
    text: ESSENCE_ROW_BALANCE.replace('{balance}', balance).replace('{cap}', limit),
    aria: ESSENCE_ROW_BALANCE_ARIA.replace('{balance}', balance).replace('{cap}', limit),
  };
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

// ─── Priced pools (THR-2231) ───────────────────────────────────────────────
//
// A card face names its paying pool in words ("✦2 Order"). The Elder powers
// header used to wait for a charge or a hover, so a footer could price "Order"
// before the player had ever seen an Order row. Every rendered card face that
// prints a paying pool announces it here; the essence block latches the header
// (Law 51) the first time an announced pool is one of its elder rows. Same
// shape as the hover store above — one value set crossing two unrelated trees
// (the Stage hand / god-rail hand and the ascendant bar), no prop threading.

const pricedSpheres = new Set<SphereName>();
let pricedVersion = 0;
const pricedListeners = new Set<() => void>();

/** Record that a visible card face prices its cost in `sphere`. Idempotent. */
export function announcePricedSphere(sphere: SphereName): void {
  if (pricedSpheres.has(sphere)) return;
  pricedSpheres.add(sphere);
  pricedVersion += 1;
  for (const listener of pricedListeners) listener();
}

/** Whether any card face has priced a cost in `sphere` this session. */
export function hasPricedSphere(sphere: SphereName): boolean {
  return pricedSpheres.has(sphere);
}

/** `getSnapshot` for `useSyncExternalStore` — bumps on each new pool. */
export function getPricedSpheresVersion(): number {
  return pricedVersion;
}

export function subscribePricedSpheres(listener: () => void): () => void {
  pricedListeners.add(listener);
  return () => {
    pricedListeners.delete(listener);
  };
}

/** Test seam — restores the module to its initial state. */
export function resetEssencePreview(): void {
  previewSphere = null;
  listeners.clear();
  pricedSpheres.clear();
  pricedVersion = 0;
  pricedListeners.clear();
}
