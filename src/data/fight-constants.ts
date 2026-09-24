/**
 * Fight tunables (NFP #1) — plan doc `Docs/plans/2026-09-23-fight-block.md`,
 * § Constants table.
 *
 * FB1 (THR-1537) lands the numbers a fight step reads to price itself against its
 * opponent. Later slices add the clock, harm, momentum and advantage numbers here,
 * so every fight number lives in one file.
 */

import type { ActionScale, StepOutcome, UnifiedActionOutcome } from '../types/unifiedAction';
import type { FightRatingWord, FightResult, FightTemper } from '../types/fight';
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

// ─── FB2 (THR-1538): the clock and the result ───────────────────

/**
 * Clash band → segments added to the opponent's clock (plan doc §5, THR-1531).
 * A critical failure adds nothing: the fighter is struck down and the fight ends.
 */
export const FIGHT_CLOCK_BY_BAND: Readonly<Record<StepOutcome, number>> = {
  critical_success: 2,
  success: 1,
  near_miss: 1,
  success_at_cost: 1,
  failure: 0,
  critical_failure: 0,
};

/**
 * Clash bands that wound the fighter — the exchanges `FightState.wounds` counts,
 * and after which the concession fork runs (FB4).
 */
export const FIGHT_WOUNDING_BANDS: readonly StepOutcome[] = ['success_at_cost', 'failure', 'critical_failure'];

/**
 * The action's final outcome for each fight result (plan doc §6). This, not
 * `computeFinalActionOutcome`, is what the rest of the game reads: that function
 * reads any failure in the history as `success_at_cost`, so a yield would read
 * as a success to "after the fight" items and to the aftermath's band prose.
 */
export const FIGHT_RESULT_ACTION_OUTCOME: Readonly<Record<FightResult, Extract<UnifiedActionOutcome, StepOutcome>>> = {
  overcome: 'success',
  driven_off: 'success',
  bargained: 'success_at_cost',
  broke_off: 'success_at_cost',
  yielded: 'failure',
  routed: 'critical_failure',
  struck_down: 'critical_failure',
};

/** The words the result memory's `choiceText` carries (read by the chapter archive). */
export const FIGHT_RESULT_WORDS: Readonly<Record<FightResult, string>> = {
  overcome: 'overcame the foe',
  driven_off: 'drove the foe off',
  bargained: 'struck a bargain',
  broke_off: 'broke off the fight',
  yielded: 'yielded',
  routed: 'broke and ran',
  struck_down: 'was struck down',
};

/** The result memory's `choiceId` prefix: aftermath variants key on `fight:<result>`. */
export const FIGHT_RESULT_CHOICE_PREFIX = 'fight:';

/** The result memory's `stepId` and `interventionType`. */
export const FIGHT_RESULT_STEP_ID = 'fight';

/**
 * The opponent-node property a per-fight clock's effect-path writes land in (plan
 * doc §5). An effect executor holds no action, so it cannot write
 * `fightState.clockNow`; the fight handler drains this mailbox instead.
 */
export const FIGHT_CLOCK_MAILBOX_PROP = 'pendingFightClockDelta';

// ─── FB3 (THR-1539): harm, conditions, momentum ─────────────────

/**
 * The one harm scale: equal to `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION`, so a
 * fight wound and a failed encounter step cost in the same currency (plan doc §7).
 */
export const FIGHT_HARM_BASE = 0.03;

/**
 * Clash band → harm multiplier (THR-1531). Bands not listed cost nothing. A
 * critical failure (struck down) is harm ×5, THR-1266.
 */
export const FIGHT_CLASH_HARM_MULT: Readonly<Partial<Record<StepOutcome, number>>> = {
  near_miss: 0.5,
  success_at_cost: 1,
  failure: 1,
  critical_failure: 5,
};

/** Nerve band → harm multiplier (THR-1531). A rout is harm ×3. */
export const FIGHT_NERVE_HARM_MULT: Readonly<Partial<Record<StepOutcome, number>>> = {
  near_miss: 0.5,
  success_at_cost: 0.5,
  failure: 1,
  critical_failure: 3,
};

/** Harm multiplier once an opponent has gone berserk (FB4 sets `berserk`). */
export const FIGHT_BERSERK_HARM_MULT = 1.5;

/** Clash difficulty added once an opponent has gone berserk. */
export const FIGHT_BERSERK_MIGHT_DELTA = 0.15;

/** The `QuintessenceEvent.source` fight harm is queued under. */
export const FIGHT_HARM_SOURCE = 'fight_harm';

/** Intensity of a band condition (matches `CONDITION_DEFAULT_INTENSITY`). */
export const FIGHT_CONDITION_INTENSITY = 0.5;

/** `wounded` on a clash critical failure: struck down (THR-1266's "high intensity"). */
export const FIGHT_CONDITION_INTENSITY_SEVERE = 0.9;

/** A band condition: the condition trait, and whether it lands at the severe intensity. */
export interface FightBandCondition {
  readonly conditionTraitId: string;
  readonly severe?: boolean;
}

/**
 * Nerve band → condition (plan doc §7, THR-1266). The rout (critical failure)
 * leaves the fighter `terrified`; plan doc 1's rout face relies on it.
 */
export const FIGHT_NERVE_CONDITIONS: Readonly<Partial<Record<StepOutcome, FightBandCondition>>> = {
  critical_success: { conditionTraitId: 'trait.condition.inspired' },
  near_miss: { conditionTraitId: 'trait.condition.shaken' },
  success_at_cost: { conditionTraitId: 'trait.condition.shaken' },
  failure: { conditionTraitId: 'trait.condition.terrified' },
  critical_failure: { conditionTraitId: 'trait.condition.terrified' },
};

/**
 * Clash band → condition (plan doc §7, THR-1266). Struck down (critical failure)
 * is `wounded` at `FIGHT_CONDITION_INTENSITY_SEVERE`; plan doc 1's mauling face
 * relies on it.
 */
export const FIGHT_CLASH_CONDITIONS: Readonly<Partial<Record<StepOutcome, FightBandCondition>>> = {
  success_at_cost: { conditionTraitId: 'trait.condition.wounded' },
  failure: { conditionTraitId: 'trait.condition.wounded' },
  critical_failure: { conditionTraitId: 'trait.condition.wounded', severe: true },
};

/** × the fighter's live `courage_prudence` lean, on the nerve step (a named term). */
export const FIGHT_NERVE_COURAGE_WEIGHT = 0.15;

/** Nerve band → the modifier carried into the first clash. */
export const FIGHT_NERVE_CARRY: Readonly<Partial<Record<StepOutcome, number>>> = {
  critical_success: 0.10,
  success: 0,
  near_miss: -0.05,
  success_at_cost: -0.05,
  failure: -0.10,
};

/** Clash band → the modifier carried into the next clash. */
export const FIGHT_CLASH_MOMENTUM: Readonly<Partial<Record<StepOutcome, number>>> = {
  critical_success: 0.10,
  success: 0.05,
  near_miss: 0,
  success_at_cost: -0.05,
  failure: -0.05,
};

/** The named terms courage and momentum ride on (factor lines, plan doc §7). */
export const FIGHT_COURAGE_MODIFIER_NAME = 'courage';
export const FIGHT_MOMENTUM_MODIFIER_NAME = 'momentum';
