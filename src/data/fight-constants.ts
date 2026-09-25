/**
 * Fight tunables (NFP #1) — plan doc `Docs/plans/2026-09-23-fight-block.md`,
 * § Constants table.
 *
 * FB1 (THR-1537) lands the numbers a fight step reads to price itself against its
 * opponent. Later slices add the clock, harm, momentum and advantage numbers here,
 * so every fight number lives in one file.
 */

import type { ActionScale, StepOutcome, UnifiedActionOutcome } from '../types/unifiedAction';
import type { FightEndingFace, FightRatingWord, FightResult, FightTemper } from '../types/fight';
import type { ReachDomain } from '../types/traits';
import { BRANCH_DECISION_DRIFT_MAGNITUDE } from './nudge-constants';

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
 * Clash bands where blows were traded (plan doc §9, THR-1541): the clash landed on
 * the opponent *and* the fighter was struck back, so both sides raise `attacked`.
 * Every other landing band raises it on the opponent alone.
 */
export const FIGHT_TRADED_BLOW_BANDS: readonly StepOutcome[] = ['near_miss', 'success_at_cost'];

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

// ─── The forks (FB4, THR-1540; plan doc §8) ─────────────────────────────

/**
 * Where on the opponent's clock the temper checkpoint sits: it fires once, when
 * `clockNow` first reaches `ceil(clockSize × this)`. A clock that starts at or
 * past it fires at the first clash.
 */
export const FIGHT_TEMPER_CLOCK_FRACTION = 0.5;

/**
 * Clash bands after which the fighter decides whether to stand or yield. A
 * critical failure is absent: it already ends the fight struck down.
 */
export const FIGHT_CONCESSION_BANDS: readonly StepOutcome[] = ['success_at_cost', 'failure'];

/** The axis the concession fork reads: the positive pole (courage) fights on, the negative yields. */
export const FIGHT_CONCESSION_AXIS = 'courage_prudence' as const;

/**
 * The axis a bargainer's offer is weighed on, by the fighter: the positive pole
 * (mercy) takes the bargain, the negative (ruthlessness) refuses it.
 */
export const FIGHT_BARGAIN_AXIS = 'mercy_ruthlessness' as const;

/** The `monsterState` flag the temper checkpoint sets, so the lair card may name the temper once seen. */
export const FIGHT_TEMPER_SHOWN_PROP = 'temperShown';

// ─── The block, advantages and allies (FB7, THR-1543; plan doc §11–12) ──────

/** Most clash steps in one fight block — the default and the maximum (THR-1531). */
export const FIGHT_EXCHANGE_CAP = 3;

/** The duration every fight step carries: one tick per exchange. */
export const FIGHT_STEP_DURATION: Readonly<{ min: number; max: number }> = { min: 1, max: 1 };

/**
 * The fail behaviour every fight step carries. A failing exchange must not end the
 * action (`advanceStep` ends on `fail_action`); a critical failure still ends it by
 * the lifecycle's own rule.
 */
export const FIGHT_STEP_FAIL_BEHAVIOR = 'continue_weakened' as const;

/** The grudge advantage: an injury-class `hostile_to` toward the opponent (clash steps). */
export const FIGHT_ADVANTAGE_OLD_WOUND = 0.10;

/** The spent-secret advantage: the first clash where the fighter is behind. */
export const FIGHT_ADVANTAGE_SECRET = 0.10;

/** Storied arms: a carried thing at or above this Storied level steadies the nerve step. */
export const FIGHT_ADVANTAGE_STORIED_MIN_LEVEL = 2;
export const FIGHT_ADVANTAGE_STORIED = 0.05;

/** Blessed: the nerve step only. */
export const FIGHT_ADVANTAGE_BLESSED = 0.05;

/** Cursed (the condition, or a cursed thing carried): clash steps only. */
export const FIGHT_ADVANTAGE_CURSED = -0.05;

/** Each ally at the fighter's side — a favour called, or a company member on the hex. */
export const FIGHT_ALLY_ASSIST = 0.05;

/** Most company members counted as allies in one fight (THR-1271). */
export const FIGHT_ALLY_MAX = 3;

/** The advantage keys — one per row of the plan doc's §11 table. */
export const FIGHT_ADVANTAGE_KEYS = {
  oldWound: 'old_wound',
  secret: 'their_secret',
  favour: 'favour_called',
  company: 'company',
  storied: 'storied_arms',
  blessed: 'blessed',
  cursed: 'cursed',
} as const;

/**
 * The advantage lines the forecast and the trace name (Law 13/14: words, never a
 * key). `{opponent}` is the opponent's name; `{ally}` the ally's.
 */
export const FIGHT_ADVANTAGE_LABELS: Readonly<Record<string, string>> = {
  old_wound: 'An old wound between them sharpens every blow',
  their_secret: 'Knows a secret {opponent} would rather keep',
  favour_called: '{ally} answers an old favour and stands beside them',
  company: '{ally} of their company fights at their side',
  storied_arms: 'Carries a thing that has seen fights before',
  blessed: 'Blessed, and it steadies the nerve',
  cursed: 'Cursed, and the curse drags at every blow',
};

/** The condition traits the Blessed and Cursed advantages read. */
export const FIGHT_BLESSED_CONDITION_ID = 'trait.condition.blessed';
export const FIGHT_CURSED_CONDITION_ID = 'trait.condition.cursed';

/** The factor-line words for the fight's own named terms (courage, momentum). */
export const FIGHT_NAMED_TERM_LINES: Readonly<Record<string, { readonly for: string; readonly against: string }>> = {
  courage: { for: 'Their courage steadies them', against: 'Their caution holds them back' },
  momentum: { for: 'The last exchange carries them forward', against: 'The last exchange has them on the back foot' },
};

/** The complication pool's placeholder for the opponent's name. */
export const FIGHT_OPPONENT_PLACEHOLDER = '{opponent}';

// ─── Duels: the opposed fight (THR-1556, duels plan doc `2026-09-23-mortal-duels.md` §1–4) ───

/**
 * Salt for the duel opponent's own roll stream:
 * `mulberry32((seed + tick × this + hash(actionId + opponentId)) >>> 0)`. Unused
 * elsewhere (131 is taken three times), so the opponent's d100 never draws from,
 * or collides with, the step stream the fighter rolls on.
 */
export const DUEL_OPPONENT_STREAM_SALT = 6271;

// ─── Fight endings: the defeat faces and the death gate (THR-1548, plan doc ───
// `Docs/plans/2026-09-23-defeat-and-victory.md` §1–3, slice D1) ─────────────────

/**
 * The chance a **monster** victor kills a mortal it struck down, by its temper
 * (THR-1266). Only `struck_down` can kill, and only after both guards (The First,
 * the god's avatar) have passed. Berserk 0.15 against a bold guard is about 2% per
 * visit (THR-1531). Kill criterion: if more than 4% of 200+ monster fights end
 * `slain`, halve these.
 */
export const FIGHT_KILL_CHANCE_BY_TEMPER: Readonly<Record<FightTemper, number>> = {
  berserk: 0.15,
  stubborn: 0.05,
  skittish: 0,
  bargainer: 0,
};

/**
 * The chance a ruthless mortal victor kills in a duel (agent mode). Declared here so
 * the ending's numbers live together; the mercy decision that reads it is plan doc
 * 5's E2 (THR-1557), not D1.
 */
export const FIGHT_DUEL_KILL_CHANCE_RUTHLESS = 0.25;

/**
 * How far an ending drifts the fighter's values: toward prudence on a yield or a
 * rout (D1); toward mercy on a bargain, toward courage on a won duel (D2). The
 * branch-decision magnitude, so a fight moves a person as far as a hard choice does.
 */
export const FIGHT_ENDING_DRIFT = BRANCH_DECISION_DRIFT_MAGNITUDE;

/**
 * Face lost at home by yielding to another person (§2b). A reputation write toward
 * the fighter's home settlement; yielding to a monster costs nothing.
 */
export const FIGHT_HUMILIATION_REPUTATION = 0.05;

/** The `cause` the humiliation's reputation write carries. */
export const FIGHT_HUMILIATION_CAUSE = 'fight_humiliation';

/** Scarred — the one fight wound that never heals (a `scar`-class condition). */
export const FIGHT_SCARRED_TRAIT_ID = 'trait.scar.scarred';

/** The scar's intensity on its `has_trait` edge. A narrative mark: it moves no capability. */
export const FIGHT_SCARRED_INTENSITY = 1;

/** The reactive loop's harm class for a death in a fight — the plot's own class. */
export const FIGHT_DEATH_HARM_CLASS = 'named_death' as const;

// ─── Fight endings: victory yields and the chronicle (THR-1549, plan doc ───
// `Docs/plans/2026-09-23-defeat-and-victory.md` §4–5, slice D2) ─────────────────

/** Settlement gratitude for felling a monster (a `reputation_with` write, within the 0.15 cap). */
export const FIGHT_VICTORY_REPUTATION_OVERCOME = 0.10;

/** Settlement gratitude for driving a monster off. */
export const FIGHT_VICTORY_REPUTATION_DRIVEN_OFF = 0.03;

/**
 * Standing gained for beating a mortal, or for being yielded to by one — written toward
 * the loser's faction, failing that the loser's home settlement. *Standing* is a
 * `reputation_with` write (UL Reputation), never world renown (`reputationScore`).
 */
export const FIGHT_VICTORY_REPUTATION_DUEL = 0.05;

/** The `cause` each victory reputation write carries. */
export const FIGHT_GRATITUDE_CAUSE = 'fight_gratitude';
export const FIGHT_STANDING_CAUSE = 'fight_standing';

/**
 * How far a lair's grateful settlement may be, in hexes. The nearest settlement-class
 * location within this radius takes the gratitude; ties break by node id.
 */
export const FIGHT_GRATITUDE_RADIUS_HEXES = 3;

/** Which endings reach the chronicle. */
export type FightEventTier = 'notable' | 'routine';

/**
 * A `fight_ended` event's significance by tier. Notable endings clear `phaseNarrative`'s
 * 0.8 chronicle threshold; routine ones reach the event log and the digest only.
 */
export const FIGHT_EVENT_SIGNIFICANCE: Readonly<Record<FightEventTier, number>> = {
  notable: 0.85,
  routine: 0.4,
};

/**
 * Which faces reach the chronicle. Kill criterion (plan doc): if fight lines flood the
 * chronicle (more than one per 10 ticks on a medium map), move faces to `routine`,
 * keeping felled, slain and spared.
 */
export const FIGHT_EVENT_TIER_BY_FACE: Readonly<Record<FightEndingFace, FightEventTier>> = {
  overcome_monster: 'notable',
  overcome_mortal: 'notable',
  driven_off: 'notable',
  bargained: 'notable',
  yielded_to_mortal: 'notable',
  mauled: 'notable',
  spared: 'notable',
  slain: 'notable',
  yielded_to_monster: 'routine',
  routed: 'routine',
  broke_off: 'routine',
};
