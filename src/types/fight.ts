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
 * THR-1556 (duels plan doc §1) — a fight's mode. `'npc'`: the mortal rolls
 * against a card. `'agent'`: a **duel** — both sides are mortals who roll, each
 * against the other's derived card, and each has a per-fight clock.
 */
export type FightMode = 'npc' | 'agent';

/** How the opponent of a duel lost (duels plan doc §3), read from the fighter's side. */
export type FightOpponentLoss = 'clock' | 'struck_down' | 'yielded' | 'routed';

/**
 * The opponent's synthesized roll for one duel step (duels plan doc §1). Transient:
 * never an action, never stored in `state.unifiedActions`. Only its band lands on
 * `fightState.opponentBands` and the `fight.step` trace.
 */
export interface OpponentFightRoll {
  readonly opponentId: string;
  readonly band: import('./unifiedAction').StepOutcome;
  readonly probability: number;
  readonly roll: number;
  /** The opponent's resolved reach and difficulty (priced from the fighter's card). */
  readonly reach: ReachDomain;
  readonly difficulty: number;
  /** The opponent's own named terms (standing, courage, momentum, advantages). */
  readonly modifiers: readonly FightNamedModifier[];
}

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
  /** The factor line in words (an advantage's label), when the name alone is a key. */
  readonly label?: string;
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
  /** FB7 — every advantage the fighter brings (the fight's, or read directly before it starts). */
  readonly advantages: readonly FightAdvantage[];
}

// ─── FB2 (THR-1538): the fight's own state ──────────────────────

/**
 * How a fight ended (plan doc §6). The action's final outcome is read from it
 * through `FIGHT_RESULT_ACTION_OUTCOME`, never from the step history.
 */
export type FightResult =
  | 'overcome' | 'driven_off' | 'bargained' | 'yielded' | 'broke_off' | 'routed' | 'struck_down';

/** Why a `broke_off` fight ended before its last clash resolved (plan doc §1). */
export type FightEndReason = 'opponent_gone' | 'separated' | 'no_opponent';

/** A runtime decision taken inside a fight (plan doc §8, written by FB4). Never a choice memory. */
export interface FightFork {
  readonly stepIndex: number;
  readonly kind: 'concession' | 'temper';
  readonly choice: 'fight_on' | 'yield' | 'bargain' | 'refuse' | 'fled' | 'berserk' | 'none';
  readonly side?: 'fighter' | 'opponent';
  readonly decidedBy: 'conviction' | 'coin' | 'temper';
}

/** An advantage the world lent the fighter, read once at fight start (plan doc §11, FB7). */
export interface FightAdvantage {
  readonly key: string;
  readonly label: string;
  readonly delta: number;
  readonly appliesTo: 'nerve' | 'clash' | 'first_behind_clash';
  readonly spent?: boolean;
  readonly sourceId?: string;
}

/** The ending's face — one member per distinct story (plan doc 1 keys its chronicle on it). */
export type FightEndingFace =
  | 'overcome_monster' | 'overcome_mortal' | 'driven_off' | 'bargained'
  | 'yielded_to_mortal' | 'yielded_to_monster' | 'routed' | 'broke_off'
  | 'mauled' | 'spared' | 'slain';

/**
 * What an ending writer wrote, recorded on the resolved action so the aftermath's
 * chips are state-backed (Law 56). Declared here by FB2; filled by plan docs 1
 * (the fighter's side) and 5 (a duel's other side).
 */
export interface FightEndingRecord {
  readonly face: FightEndingFace;
  readonly scarWritten: boolean;
  readonly grudgeWritten: boolean;
  readonly humiliation?: { counterpartyId: string; delta: number };
  readonly reputation?: { counterpartyId: string; delta: number };
  readonly reward?: { templateId: string; instanceId: string; tier: number };
  readonly killRoll?: { chance: number; roll: number };
  readonly guard?: 'the_first' | 'avatar' | 'warded';
  readonly drift?: { axis: import('./agent').ValuePair; pole: 'positive' | 'negative' };
  readonly eventSignificance?: number;
}

/** What a fight did to a monster's lair. Declared by FB2; written by plan doc 3. */
export interface FightLairOutcome {
  readonly lairId: string;
  readonly felled: boolean;
  readonly lairCleared: boolean;
  readonly clearingProgressAfter?: number;
}

/**
 * A fight's action-local state (plan doc §4) — a sibling of `supportBindings` on
 * the `UnifiedAction`. Created at the block's first fight step and updated after
 * every fight step by the handler in `executeStepResult`.
 *
 * *Clock (fight)* (UL): the opponent's wear, in segments — not the doom clock.
 * *Exchange* (UL): one clash step.
 */
export interface FightState {
  readonly opponentId: string | null;
  readonly clockSize: number;
  /** After lazy recovery. */
  readonly clockAtStart: number;
  readonly clockNow: number;
  /** True when the clock lives on the opponent node (monsters). */
  readonly persistent: boolean;
  /** Clash steps resolved. */
  readonly exchanges: number;
  /** Quintessence ratio queued as `fight_harm` (FB3). */
  readonly harmTaken: number;
  /** Wounding exchanges taken (a clash at cost or failed). */
  readonly wounds: number;
  /** Clashes whose clock write landed (> 0). */
  readonly blowsLanded: number;
  /** Modifier carried into the next fight step (FB3). */
  readonly momentum: number;
  readonly temperFired: boolean;
  readonly berserk: boolean;
  readonly advantages: readonly FightAdvantage[];
  readonly result?: FightResult;
  readonly endReason?: FightEndReason;
  readonly forks: readonly FightFork[];
  /** Band conditions applied this fight (FB3), for plan doc 4's chips. */
  readonly conditionsApplied: readonly string[];
  /** Artifact ids whose Storied level rose during this fight. */
  readonly storiedClimbs: readonly string[];
  readonly ending?: FightEndingRecord;
  readonly opponentEnding?: FightEndingRecord;
  readonly lairOutcome?: FightLairOutcome;

  // ─── THR-1556 (duels plan doc §1–3): the opponent side of an agent-mode fight ───
  // All optional and absent on an NPC-mode fight, so its shape is unchanged.

  /** `'agent'` for a duel; absent ⇒ `'npc'`. */
  readonly fightMode?: FightMode;
  /** The fighter's own per-fight clock — filled by the opponent's landing blows. */
  readonly fighterClockSize?: number;
  readonly fighterClockNow?: number;
  /** The opponent's band on each fight step, in step order (nerve first). */
  readonly opponentBands?: readonly import('./unifiedAction').StepOutcome[];
  /** How the opponent lost, when the fight ended with them beaten, yielded or fled. */
  readonly opponentLoss?: FightOpponentLoss;
  /** The opponent's running state, mirroring the fighter's. */
  readonly opponentMomentum?: number;
  readonly opponentAdvantages?: readonly FightAdvantage[];
  readonly opponentWounds?: number;
  readonly opponentBlowsLanded?: number;
  readonly opponentHarmTaken?: number;
}
