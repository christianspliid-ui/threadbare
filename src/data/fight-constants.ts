/**
 * Fight tunables (NFP #1) — plan doc `Docs/plans/2026-09-23-fight-block.md`,
 * § Constants table.
 *
 * FB1 (THR-1537) lands the numbers a fight step reads to price itself against its
 * opponent. Later slices add the clock, harm, momentum and advantage numbers here,
 * so every fight number lives in one file.
 */

import type { ActionScale } from '../types/unifiedAction';
import type { FightRatingWord, FightTemper } from '../types/fight';
import type { ReachDomain } from '../types/traits';

/**
 * Card word → step difficulty. Each sits inside its `DIFFICULTY_WORD_BANDS` word
 * so the display round-trips (THR-1531).
 */
export const FIGHT_RATING_DIFFICULTY: Readonly<Record<FightRatingWord, number>> = {
  gentle: 0.20,
  fair: 0.35,
  steep: 0.50,
  severe: 0.65,
};

/** The rating words, easiest first — the order Dread offsets walk. */
export const FIGHT_RATING_WORDS: readonly FightRatingWord[] = ['gentle', 'fair', 'steep', 'severe'];

/**
 * The scale every fight step resolves at, whatever the template's scale.
 *
 * **The single most important fight number (THR-1531).** At `local` the 0.65
 * probability floor erases a monster's Might: a severe beast and a gentle one read
 * the same to a capable fighter. Read THR-1531 before touching it; the
 * `local`-template test in `fightStepInputs.test.ts` is its guard.
 */
export const FIGHT_STEP_SCALE: ActionScale = 'regional';

/** Fail-soft card: an opponent that cannot be read fights as a fair one. */
export const FIGHT_DEFAULT_CARD: Readonly<{
  dread: FightRatingWord;
  might: FightRatingWord;
  clockSize: number;
}> = { dread: 'fair', might: 'fair', clockSize: 3 };

/** A temper-less opponent fights on (plan doc §8). */
export const FIGHT_DEFAULT_TEMPER: FightTemper = 'stubborn';

/** The trait-id prefix an opponent's temper is read from (`trait.temper.berserk`). */
export const FIGHT_TEMPER_TRAIT_PREFIX = 'trait.temper.';

/**
 * A mortal opponent's derived Might, from their **raw** clash-reach score
 * (THR-1264). Raw, because capability saturates near 1.0. Highest band first.
 */
export const FIGHT_DERIVED_MIGHT_BANDS: readonly { readonly minRaw: number; readonly word: FightRatingWord }[] = [
  { minRaw: 30, word: 'severe' },
  { minRaw: 22, word: 'steep' },
  { minRaw: 15, word: 'fair' },
];

/** Below every `FIGHT_DERIVED_MIGHT_BANDS` threshold. */
export const FIGHT_DERIVED_MIGHT_FLOOR: FightRatingWord = 'gentle';

/** A mortal opponent's Dread, in words from their Might (THR-1264). */
export const FIGHT_DERIVED_DREAD_OFFSET = -1;

/** Extra Dread words for a famous opponent (THR-1532). */
export const FIGHT_FAME_DREAD_STEP = 1;

/**
 * The `reputationScore` at which a mortal opponent counts as famous: the sheet's
 * *Revered*, `REPUTATION_WORDS` tier 4 (THR-1532).
 */
export const FIGHT_FAME_REPUTATION_MIN = 0.8;

/** Per-fight clock of a mortal opponent (THR-1264). */
export const FIGHT_MORTAL_CLOCK = 2;

/** One clock segment recovers per this many ticks — read lazily, never per tick. */
export const FIGHT_CLOCK_RECOVERY_TICKS = 50;

/**
 * The `difficulty` `fightBlock` stamps on each fight step (the `fair` rating). The
 * roll never reads it; readers that never see the card (the planner, the cache,
 * the CMS, the codex) read a plausible middle value instead of zero.
 */
export const FIGHT_STEP_PLACEHOLDER_DIFFICULTY = 0.35;

/** Authored defaults when neither the spec nor the card names a reach (THR-1263). */
export const FIGHT_DEFAULT_NERVE_REACH: ReachDomain = 'heart';
export const FIGHT_DEFAULT_CLASH_REACH: ReachDomain = 'iron';

/**
 * The predicate-context encounter type every fight step reads, so `in_combat`
 * means "is a fight exchange" on every fight step, whatever its reach (plan doc
 * §3b). `effectPredicates.buildPredicateContext` keys `inCombat` on it.
 */
export const FIGHT_ENCOUNTER_TYPE = 'combat';

/** The named term the fighter's standing modifiers ride on (plan doc §3b). */
export const FIGHT_STANDING_MODIFIER_NAME = 'standing';
