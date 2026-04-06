/**
 * Attachment Slot System — tunable constants.
 *
 * Every cap, threshold, and bonus is a named constant.
 * Changing game feel = changing a number here, not rewriting logic.
 *
 * Design doc: Docs/plans/2026-04-06-attachment-slot-system-design.md
 */

import type { PossessionSubcategory } from '../types/attachments';

// ─── Possession Slot Caps ─────────────────────────────────────────
// Base maximum items per slot tag (before slot-expansion bonuses).

export const SLOT_CAPS: Record<string, number> = {
  weapon: 2,
  vestment: 1,
  ring: 2,
  necklace: 1,
  tome: 2,
  spell: 3,
  consumable: 4,
  utility: 2,
  mount: 1,
  ally: 1,
  companion: 1,
  wealth: 3,
  brand: 2,
  agreement: 4,
  quest: 3,
};

// ─── Condition Slot Caps ──────────────────────────────────────────

export const CONDITION_CAPS: Record<string, number> = {
  wound: 3,
  disease: 2,
  curse: 2,
  blessing: 2,
  bestowed: 2,
};

// ─── Overflow Behavior ────────────────────────────────────────────

/** Ticks before an inactive overflow item is auto-dropped (2 game days @ 12 ticks/day). */
export const OVERFLOW_DISPOSAL_TIMEOUT_TICKS = 24;

/** Reputation bonus granted when agent gifts an overflow item. */
export const OVERFLOW_GIFT_REPUTATION_BONUS = 0.05;

/** Wealth score added when agent sells an overflow item. */
export const OVERFLOW_SELL_WEALTH_BONUS = 5;

/** Divine influence bonus when agent offers an overflow item at a shrine. */
export const OVERFLOW_OFFER_DIVINE_INFLUENCE_BONUS = 0.03;

// ─── Condition Overflow ───────────────────────────────────────────

/** Difficulty threshold for wound incapacitation check (sigmoid → d100). */
export const WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4;

/** Difficulty threshold for disease mortality check. */
export const DISEASE_MORTALITY_CHECK_DIFFICULTY = 0.5;

/** Per-tick axiological drift rate when curses overflow. */
export const CURSE_CORRUPTION_DRIFT_PER_TICK = 0.01;

/** When blessings overflow, fade the oldest first. */
export const BLESSING_FADE_OLDEST_FIRST = true;

/** Bestowed power rejection threshold (=== cap + 1). */
export const BESTOWED_REJECTION_THRESHOLD = 3;

// ─── Slot Expansion ───────────────────────────────────────────────

/** Maximum bonus slots a single item can grant to any one slot tag. */
export const MAX_SLOT_BONUS_PER_ITEM = 3;

/** Fixed-point loop cap for cascade deactivation (slot-expander deactivated → re-evaluate). */
export const MAX_DEACTIVATION_CASCADES = 3;

// ─── Legacy Subcategory → Slot Tag Migration ──────────────────────
// Maps old PossessionSubcategory values to new slotTag values.
// Used by resolveSlotTag() during the migration period.

export const SUBCATEGORY_TO_SLOT_TAG: Record<PossessionSubcategory, string> = {
  arms: 'weapon',
  vestments: 'vestment',
  mounts_beasts: 'mount',
  tomes_scrolls: 'tome',
  relics_talismans: 'ring',   // default; content should specify slotTag explicitly
  tools_instruments: 'utility',
  provisions: 'consumable',
};

// ─── Slot Tag Display Names ───────────────────────────────────────

export const SLOT_TAG_DISPLAY_NAMES: Record<string, string> = {
  weapon: 'Weapons',
  vestment: 'Vestment',
  ring: 'Rings',
  necklace: 'Necklace',
  tome: 'Tomes',
  spell: 'Spells',
  consumable: 'Consumables',
  utility: 'Utility',
  mount: 'Mount',
  ally: 'Ally',
  companion: 'Companion',
  wealth: 'Wealth',
  brand: 'Brands',
  agreement: 'Agreements',
  quest: 'Quest Items',
  wound: 'Wounds',
  disease: 'Diseases',
  curse: 'Curses',
  blessing: 'Blessings',
  bestowed: 'Bestowed',
};
