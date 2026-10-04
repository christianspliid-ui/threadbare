/**
 * Spells as divine gifts and found tomes — the tunables (THR-1672).
 *
 * Plan: `Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md` § Constants table.
 * Acquisition channels 1 (a god teaches) and 4 (a book teaches). Both write through the
 * one grant seam, `grantSpell` (`src/engine/spellGrant.ts`).
 */

/** Master switch for channel 1: `false` hides Teach a Spell and skips `spell_grant`. */
export const SPELL_GRANT_ENABLED_DIVINE = true;

/** Master switch for channel 4: `false` makes `onItemAcquired` a no-op. */
export const SPELL_GRANT_ENABLED_TOMES = true;

/** Teach a Spell's essence price (Bestow Power is 5; a spell is narrower than a stat gift). */
export const TEACH_SPELL_ESSENCE_COST = 4;

/**
 * The highest tier a god teaches. Below the elder floor (`SPELL_GEN_FOUNDATION_MIN_TIER`,
 * 3) by design: elder magic is discovered, never given.
 */
export const DIVINE_TEACH_MAX_TIER = 2;

/** The receipt's chronicle significance (a personal gift, quiet in the feed). */
export const TEACH_SPELL_RECEIPT_SIGNIFICANCE = 0.4;

/** Doom the god pays for teaching a transgression (the nudge cards' doom scale). */
export const DIVINE_TEACH_DARK_DOOM = 0.05;

/** Detection pressure in the mortal's region for teaching a transgression. */
export const DIVINE_TEACH_DARK_DETECTION = 0.15;

/** Detection pressure per cast of a god-taught transgression, in the caster's region. */
export const DIVINE_TAUGHT_CAST_DETECTION = 0.05;

/** The highest tier a book of each kind teaches (also capped by the book's own tier). */
export const TOME_MAX_TIER: Readonly<Record<'arcane' | 'ancient', number>> = { arcane: 2, ancient: 3 };

/** The generated item cores whose books teach. */
export const TOME_TEACHING_GENERATED_CORES: readonly string[] = ['forbidden_book'];

/** A generated forbidden book at this band or above counts as ancient. */
export const TOME_ANCIENT_MIN_GENERATED_BAND = 3;

/** A book teaches each holder at most once (`taughtHolderIds` on the item). */
export const TOME_TEACHES_ONCE_PER_READER = true;

/** The item subcategory a teaching book carries. */
export const TOME_SUBCATEGORY = 'tomes_scrolls';

/** Tags that make an authored book teach, and the one that excludes it (the treasure maps). */
export const TOME_ANCIENT_TAG = '#ancient';
export const TOME_ARCANE_TAG = '#arcane';
export const TOME_EXCLUDED_TAG = '#map';

/** Essence price of *Leave A Word Behind* (authored in the card library; named here so the number has a home). */
export const CACHE_WORD_LEFT_BEHIND_ESSENCE = 3;

/** Its forecast delta: the card changes who they are, not this roll. */
export const CACHE_WORD_LEFT_BEHIND_FORECAST = 0;
