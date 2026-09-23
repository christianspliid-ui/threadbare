/**
 * Fight types — the fight block's shared vocabulary (THR-1537, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §1–3c).
 *
 * A fight is a short run of ordinary encounter steps marked with
 * `ActionStep.fightRole`. Nothing here is a new resolver: every fight roll is
 * `resolveStepCore`. What these types carry is the *opponent* — the rating card a
 * fight step prices itself against — and the resolved inputs that card produces.
 *
 * FB1 ships the card and the inputs. `FightState`, the clock, the forks and the
 * events arrive with FB2–FB7 as additive members.
 */

import type { ReachDomain } from './traits';
import type { ActionScale } from './unifiedAction';

/** The two kinds of fight step: the nerve test before, and each exchange of blows. */
export type FightRole = 'nerve' | 'clash';

/**
 * An opponent rating, in words (THR-1264). Each word maps to one step
 * difficulty through `FIGHT_RATING_DIFFICULTY`, chosen to sit inside the
 * matching `DIFFICULTY_WORD_BANDS` word so the display round-trips.
 *
 * Plan doc 3's `MonsterState` imports this type for its Dread and Might.
 */
export type FightRatingWord = 'gentle' | 'fair' | 'steep' | 'severe';

/** How an opponent reacts once its clock is half full (plan doc §8, FB4). */
export type FightTemper = 'stubborn' | 'berserk' | 'skittish' | 'bargainer';

/** Where an opponent card came from — the trace's `readFrom`. */
export type OpponentCardSource = 'monsterState' | 'derived' | 'default';

/**
 * An opponent's rating record for one fight step (plan doc §2).
 *
 * *Opponent card* (UL): a fight's rating record — not a **Card** in the god's
 * repertoire, and not a nudge card.
 */
export interface OpponentCard {
  readonly opponentId: string | null;
  /** Rates the nerve step. */
  readonly dread: FightRatingWord;
  /** Rates each clash step. */
  readonly might: FightRatingWord;
  /** Runtime override of the authored nerve reach. */
  readonly nerveReach?: ReachDomain;
  /** Runtime override of the authored clash reach. */
  readonly clashReach?: ReachDomain;
  readonly clockSize: number;
  /** After lazy recovery, at read time. */
  readonly clockFilled: number;
  readonly temper: FightTemper;
  /** True when the clock lives on the node (monsters); false = per-fight (mortals). */
  readonly persistent: boolean;
  readonly source: OpponentCardSource;
}

/**
 * Whether a fight step found its opponent (plan doc §1).
 *
 * FB1 records it; FB2 routes every status but `bound` through the no-roll end
 * (`no_opponent` / `opponent_gone`). Until FB2 lands, a fight step that found no
 * opponent rolls against `FIGHT_DEFAULT_CARD` (fail-soft table row 2).
 */
export type FightOpponentStatus =
  /** A living opponent other than the fighter. */
  | 'bound'
  /** `opponentRef` set but not bound by the action's cast, or no target node. */
  | 'unbound'
  /** The opponent node is deceased or gone. */
  | 'deceased'
  /** The opponent is the fighter themself (a seed that fell back to self-target). */
  | 'self';

/** One named term on a fight step's roll — a factor line with no hidden number. */
export interface FightNamedModifier {
  readonly name: string;
  readonly delta: number;
}

/**
 * Everything a fight step rolls with, derived in one place for the roll and the
 * attended forecast (plan doc §3b). Pure: reading it spends nothing.
 */
export interface FightStepInputs {
  readonly role: FightRole;
  readonly opponentId: string | null;
  readonly opponentStatus: FightOpponentStatus;
  readonly card: OpponentCard;
  /** The reach after the override chain: authored → card → fighter's own swap. */
  readonly reach: ReachDomain;
  /** The authored reach, for the trace. */
  readonly authoredReach: ReachDomain;
  /** Card-rated difficulty plus the opponent's delta, clamped to [0, 1]. */
  readonly difficulty: number;
  /** The opponent's own passive/conditional modifiers for this reach. */
  readonly opponentModifierDelta: number;
  /** Always `FIGHT_STEP_SCALE` today. */
  readonly scale: ActionScale;
  /** The fighter's named terms (standing modifiers first). */
  readonly modifiers: readonly FightNamedModifier[];
  /** Sum of `modifiers`. */
  readonly modifierTotal: number;
}
