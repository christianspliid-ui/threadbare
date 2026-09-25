/**
 * Fight traces (THR-1537, plan doc `Docs/plans/2026-09-23-fight-block.md` § Tracing).
 *
 * Each is registered in the THR-928 trio (`TraceCategory`, `TRACE_CATEGORIES`,
 * `TraceEntry`) in the slice that first emits it: `fight.step` in FB1;
 * `fight.clock` and `fight.end` in FB2; `fight.fork` in FB4. Dotted, as the plan
 * names them, following `resolution.input`.
 */

import type { TraceBase } from '../trace';
import type { ActionScale, StepOutcome } from '../unifiedAction';
import type { ReachDomain } from '../traits';
import type { ValuePair } from '../agent';
import type {
  FightEndReason,
  FightFork,
  FightTemper,
  FightOpponentStatus,
  FightRatingWord,
  FightResult,
  FightRole,
  OpponentCardSource,
} from '../fight';

/** Emitted once per fight step, after the band is known. */
export interface FightStepTrace extends TraceBase {
  category: 'fight.step';
  actionId: string;
  templateId: string;
  fighterId: string;
  opponentId: string | null;
  opponentStatus: FightOpponentStatus;
  role: FightRole;
  /** The step index inside the action (the plan's `exchange`; 0 is the nerve step of a block). */
  exchange: number;
  card: {
    dread: FightRatingWord;
    might: FightRatingWord;
    /** The reach this step resolved at, after the override chain. */
    reach: ReachDomain;
    authoredReach: ReachDomain;
    readFrom: OpponentCardSource;
  };
  difficulty: number;
  opponentModifierDelta: number;
  /** Always `FIGHT_STEP_SCALE` today. */
  scale: ActionScale;
  /** The fighter's named terms; cards and trait variants ride `resolution.input`. */
  modifiers: { name: string; delta: number }[];
  band: StepOutcome;
  probability: number;
  /** Always 0 here: the step is traced before its clock write, which `fight.clock` records (THR-1538). */
  clockDelta: number;
  clockNow: number;
  clockSize: number;
  /** FB3 (THR-1539) queues fight harm; until then 0. */
  harmQueued: number;
  conditionsApplied: string[];
  /** THR-1556 (duels) — `'agent'` on a duel step; absent on an NPC-mode fight. */
  fightMode?: 'agent';
  /** THR-1556 — the opponent's synthesized band and odds on a duel step. */
  opponentBand?: StepOutcome;
  opponentProbability?: number;
  /** THR-1556 — the fighter's own per-fight clock, as the step began. */
  fighterClockNow?: number;
}

/**
 * Emitted by every clock write (THR-1538): a clash's band delta, a spell, an item,
 * a mailbox drain, or a stale mailbox cleared at a new fight's start.
 */
export interface FightClockTrace extends TraceBase {
  category: 'fight.clock';
  opponentId: string;
  delta: number;
  before: number;
  after: number;
  /** True when this write took the clock from below full to full. No ending reads it. */
  filledByThisWrite: boolean;
  /** `clash` | `mailbox` | `stale_cleared` | `debug` | an effect's tag. */
  cause: string;
  /** Where the write landed: the monster's card, the action's per-fight clock, or the mailbox. */
  store: 'monsterState' | 'fightState' | 'mailbox';
  actionId?: string;
}

/**
 * Emitted for each runtime decision inside a fight (THR-1540, plan doc §8): the
 * fighter's concession after a wounding clash, the opponent's temper at half
 * clock, and a quarter offer's answer. Forks are never choice memories.
 */
export interface FightForkTrace extends TraceBase {
  category: 'fight.fork';
  actionId: string;
  templateId: string;
  fighterId: string;
  opponentId: string | null;
  fork: FightFork['kind'];
  side: 'fighter' | 'opponent';
  /** The step index the fork was taken on. */
  stepIndex: number;
  /** The value axis the decision read; null for a temper that decides alone. */
  axis: ValuePair | null;
  temper?: FightTemper;
  profileLean: number;
  cardLean: number;
  decidedBy: FightFork['decidedBy'];
  choice: FightFork['choice'];
  /** What set the fork off: the clash itself, or a `fight_offer_quarter` complication. */
  trigger: 'clash' | 'quarter';
  /** True when a persistent clock started at or past the temper checkpoint. */
  temperAtStart?: boolean;
}

/** Emitted exactly once per fight, when its result is set (THR-1538). */
export interface FightEndTrace extends TraceBase {
  category: 'fight.end';
  actionId: string;
  templateId: string;
  fighterId: string;
  opponentId: string | null;
  result: FightResult;
  endReason?: FightEndReason;
  /** False on the no-roll route (the opponent never bound, died, or left). */
  rolled: boolean;
  exchanges: number;
  clockAtStart: number;
  clockNow: number;
  harmTaken: number;
  advantages: string[];
  /** Set when `onFightEnded` threw; the action still resolved. */
  dispatchError?: string;
  /** THR-1556 (duels) — `'agent'` on a duel; how the opponent lost, and the fighter's own clock. */
  fightMode?: 'agent';
  opponentLoss?: import('../fight').FightOpponentLoss;
  fighterClockNow?: number;
}

/**
 * Emitted once per fight by the fighter-side ending branch (THR-1548, plan doc
 * `2026-09-23-defeat-and-victory.md` § Tracing). Carries every decision the ending
 * took: the face, the guards, the kill draw, and each write it made or skipped.
 * `fightState.ending` mirrors `face`, `scarWritten`, `grudgeWritten`, `killRoll` and
 * `guard`, so a chip reads state even when tracing is off.
 */
export interface FightEndingTrace extends TraceBase {
  category: 'fight.ending';
  actionId: string;
  fighterId: string;
  /** Who won: the opponent on a defeat, the fighter on a victory, null on a break-off. */
  victorId: string | null;
  result: FightResult;
  face: import('../fight').FightEndingFace;
  /** Present exactly when a kill draw was taken. */
  killRoll?: { chance: number; roll: number };
  guard?: 'the_first' | 'avatar' | 'warded';
  scarWritten: boolean;
  scarSkipped?: 'already_scarred' | 'definition_missing' | 'immune';
  grudgeWritten: boolean;
  /** The reactive-loop node a fight death wrote. */
  outcomeNodeId?: string;
  humiliation?: { counterpartyId: string; delta: number };
  reputation?: { counterpartyId: string; delta: number };
  reward?: { templateId: string; instanceId: string; tier: number };
  drift?: { axis: ValuePair; pole: 'positive' | 'negative' };
  /** Set once D2 lands the chronicle tiers; D1 registers the category without it. */
  eventSignificance?: number;
  /** THR-1549 — the victor's standing on a yield to a mortal. */
  victorStanding?: { victorId: string; counterpartyId: string; delta: number };
  /** THR-1549 — why no trophy was drawn on an overcome/bargained ending. */
  rewardSkipped?: 'no_lair' | 'minor_lair' | 'empty_pool';
  /** THR-1549 — the trophy draw flipped to the harmful table. */
  rewardBadOutcome?: boolean;
}
