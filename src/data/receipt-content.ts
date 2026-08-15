/**
 * Divine Receipt content + tuning (THR-727).
 *
 * When a player-sourced action resolves, `processPlayerReceipts` builds a receipt and
 * decides whether it surfaces as a band-accented completion toast (minor casts) or a
 * full receipt dialogue (multi-step / rare / world-shifting casts). This module holds
 * both the tuning constants that gate that decision and the authored framing lines the
 * dialogue leads with.
 *
 * ─── Voice ──────────────────────────────────────────────────────────────────────
 * Framing lines are player-as-god register (THR-609 peak register is acceptable here —
 * the receipt is a rare, deliberate reflection surface, not at-a-glance UI). They frame
 * the *witnessed consequence*, never announce a mechanical verdict: the fortunate band
 * says "the world bent, but only just" — not "Success!". No numbers, no key:value.
 */

import type { EncounterAftermathChangeKind } from '../types/unifiedAction';
import type { RarityTier } from '../types/rarity';
import type { OutcomeBand } from '../engine/outcomeConsequences';

// ─── Presentation-tier constants (NFP #1: Tunability) ───────────────────────────

/** Multi-step casts (>= this many steps) always get the dialogue, never the bare toast. */
export const RECEIPT_MODAL_MIN_STEPS = 2;

/**
 * Rarity tier at/above which a cast always gets the dialogue. RarityTier is numeric
 * (1 Mundane · 2 Storied · 3 Mythic · 4 Legendary); `3` means "Mythic and above" — the
 * plan's "rare" floor. Read against `action.effectiveRarityTier ?? template.rarityTier`.
 */
export const RECEIPT_MODAL_RARITY_FLOOR: RarityTier = 3;

/**
 * Aftermath change kinds that force the dialogue regardless of step count or rarity —
 * these are the world-shifting consequences a bare toast would bury.
 */
export const RECEIPT_MODAL_CHANGE_KINDS: readonly EncounterAftermathChangeKind[] = [
  'trait',
  'faction_reputation',
  'future_hook',
  'shell_state',
];

/**
 * Pending-receipt cap. Oldest unacknowledged receipt is dropped when a new one arrives
 * at the cap — matters for CLI/headless runs where nothing ever acknowledges.
 */
export const RECEIPT_QUEUE_MAX = 5;

/** Toast-tier event significance — surfaces in recentEvents, below the 0.8 chronicle threshold. */
export const RECEIPT_EVENT_SIGNIFICANCE_TOAST = 0.6;

/** Modal-tier event significance — at/above the chronicle threshold so it lands in the chronicle. */
export const RECEIPT_EVENT_SIGNIFICANCE_MODAL = 0.85;

// ─── Framing lines (Content) ────────────────────────────────────────────────────

/**
 * Band-keyed framing line pools. The receipt dialogue leads with one of these above the
 * enriched overview prose. Selected deterministically by the action id hash (NFP #3 — no
 * PRNG), so replaying the same seed shows the same line. 2–3 lines per band.
 */
export const RECEIPT_FRAME_LINES: Record<OutcomeBand, readonly string[]> = {
  surge: [
    'The world bent the way you pressed it, and then bent a little further.',
    'Your will landed clean, and the answer came back louder than the asking.',
    'What you set in motion arrived whole — nothing lost between intent and outcome.',
  ],
  neutral: [
    'It went as you meant it to. The world took the shape you gave it.',
    'Quiet work, quietly done. The thread holds where you laid it.',
    'No drama in the doing — only the change, now loose in the world.',
  ],
  strained: [
    'It held, but the world charged you for the holding.',
    'You got what you reached for, and it took something on the way out.',
    'Done — though the cost of it will surface somewhere you were not looking.',
  ],
  fortunate: [
    'The world bent, but only just — a hair more resistance and it would not have.',
    'It came through on the narrowest margin, closer to slipping than you would like.',
    'Barely. What you wanted arrived, trailing the shadow of what almost happened.',
  ],
  setback: [
    'The world did not answer. Your reach closed on nothing.',
    'It slipped the shape you meant for it and settled somewhere worse.',
    'The thread would not take. What you pressed for did not come.',
  ],
  catastrophe: [
    'The world answered — and answered wrong, in a way that will be remembered.',
    'Something tore where you pushed. This one leaves a mark on the world and on you.',
    'It broke the wrong way, wholly and loudly. The consequence is already moving.',
  ],
};

/** Fallback frame line when a band has no pool (fail-soft — cannot happen given the full map). */
export const RECEIPT_FRAME_LINE_FALLBACK = 'The world settled, and what you did is now part of it.';

/**
 * Deterministic frame-line selection by action id (NFP #3). Pure string hash → index
 * into the band's pool. Same actionId + band always yields the same line.
 */
export function selectReceiptFrameLine(band: OutcomeBand | string | undefined, actionId: string): string {
  const pool = (band && RECEIPT_FRAME_LINES[band as OutcomeBand]) || undefined;
  if (!pool || pool.length === 0) return RECEIPT_FRAME_LINE_FALLBACK;
  let hash = 0;
  for (let i = 0; i < actionId.length; i++) {
    hash = (hash * 31 + actionId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}
