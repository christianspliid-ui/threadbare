/**
 * The fight's forks, decided at runtime (THR-1540, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §8, §12).
 *
 * Two decisions a fight takes after a clash lands, never authored as branches:
 *
 *  - **Temper** — once, when the opponent's clock first reaches
 *    `ceil(clockSize × FIGHT_TEMPER_CLOCK_FRACTION)`: a skittish opponent is
 *    driven off, a berserk one turns berserk, a bargainer offers terms the fighter
 *    weighs on `mercy_ruthlessness`, a stubborn one does nothing. A clock that
 *    starts at or past the checkpoint fires it at the first clash
 *    (`temperAtStart`).
 *  - **Concession** — after a clash that wounds (at cost, failure), and not after
 *    the last: the fighter stands or yields, on `courage_prudence`.
 *
 * Precedence within one clash (plan doc §5): `overcome` first (the handler's
 * clock-full check), then temper, then concession — and no fork runs once
 * `fightState.result` is set.
 *
 * Both pole decisions go through the pure `decideBranchPole`: the fighter's live
 * value lean plus the hand's lean on the same axis, with the step rng drawn only
 * inside the neutral band. Unattended fights have no hand, so the card lean is 0.
 *
 * Every decision lands in `fightState.forks` and is traced as `fight.fork` —
 * **never** as a choice memory, so no fork can shadow the fight's result memory or
 * erase a card record the hand wrote by step index (plan doc §6, the memory rule).
 */

import type { GameState } from '../../types/gameState';
import type { ValuePair } from '../../types/agent';
import type { StepNudge, StepOutcome, UnifiedAction } from '../../types/unifiedAction';
import type { FightFork, FightState, FightTemper } from '../../types/fight';
import type { FightForkTrace } from '../../types/traces/fight-traces';
import {
  FIGHT_BARGAIN_AXIS,
  FIGHT_CONCESSION_AXIS,
  FIGHT_CONCESSION_BANDS,
  FIGHT_TEMPER_CLOCK_FRACTION,
  FIGHT_TEMPER_SHOWN_PROP,
} from '../../data/fight-constants';
import { decideBranchPole, readLiveAxisLean } from '../encounters/branchDecision';
import { sumHandLean } from '../encounters/poleLean';
import { emitTrace } from '../traceBuffer';
import { readOpponentCard } from './opponentCard';

/** What the fork runner needs about the step that just resolved. */
export interface FightForkContext {
  readonly state: GameState;
  /** The action carrying the handler's updated `fightState`. */
  readonly action: UnifiedAction;
  readonly templateId: string;
  readonly stepIndex: number;
  readonly outcome: StepOutcome;
  /** True on the block's last clash: a yield is moot there (plan doc §8). */
  readonly isLast: boolean;
  /** The step's seeded resolution rng; drawn only inside the neutral band. */
  readonly rng: () => number;
  readonly tick: number;
  /** The resolved (dealt) step's cards, for the hand's lean. */
  readonly handNudges?: readonly StepNudge[];
}

/** The clock segment the temper checkpoint sits at. At least 1, so a fresh clock never fires it. */
export function temperCheckpoint(clockSize: number): number {
  return Math.max(1, Math.ceil(clockSize * FIGHT_TEMPER_CLOCK_FRACTION));
}

/** Whether the fighter is behind: more wounding exchanges taken than blows landed (plan doc §11). */
export function isFighterBehind(fight: Pick<FightState, 'wounds' | 'blowsLanded'>): boolean {
  return fight.wounds > fight.blowsLanded;
}

/** The opponent's temper, read from its card (the card's own word wins, then `trait.temper.*`; default stubborn). */
function readTemper(ctx: FightForkContext, fight: FightState): FightTemper {
  return readOpponentCard(ctx.state.graph, fight.opponentId, ctx.tick).temper;
}

/** The fighter's pole decision on one axis: profile lean + the hand's lean, coin in the neutral band. */
function decideFighterPole(ctx: FightForkContext, axis: ValuePair) {
  const profileLean = readLiveAxisLean(ctx.state, ctx.action.actorId, axis);
  const cardLean = sumHandLean(ctx.handNudges, ctx.action.activeNudges, axis);
  return decideBranchPole(profileLean, cardLean, ctx.rng);
}

function recordFork(
  ctx: FightForkContext,
  fight: FightState,
  fork: FightFork,
  detail: {
    readonly axis: ValuePair | null;
    readonly profileLean: number;
    readonly cardLean: number;
    readonly trigger: FightForkTrace['trigger'];
    readonly temper?: FightTemper;
    readonly temperAtStart?: boolean;
  },
): FightState {
  emitTrace({
    category: 'fight.fork',
    tick: ctx.tick,
    agentId: ctx.action.actorId,
    actionId: ctx.action.actionId,
    templateId: ctx.templateId,
    fighterId: ctx.action.actorId,
    opponentId: fight.opponentId,
    fork: fork.kind,
    side: fork.side ?? 'fighter',
    stepIndex: fork.stepIndex,
    axis: detail.axis,
    ...(detail.temper ? { temper: detail.temper } : {}),
    profileLean: detail.profileLean,
    cardLean: detail.cardLean,
    decidedBy: fork.decidedBy,
    choice: fork.choice,
    trigger: detail.trigger,
    ...(detail.temperAtStart ? { temperAtStart: true } : {}),
    summary: `fight.fork: ${fork.kind} (${fork.side ?? 'fighter'}) → ${fork.choice} by ${fork.decidedBy}`,
  } as Omit<FightForkTrace, 'id' | 'timestamp'>);
  return { ...fight, forks: [...fight.forks, fork] };
}

/**
 * Mark a persistent opponent's temper as seen, so the lair card (plan doc 4) may
 * name it. Written **only when the opponent carries `monsterState`** — the bag
 * plan doc 3's M1 mints; a mortal or a card-less node is left untouched.
 */
function markTemperShown(ctx: FightForkContext, fight: FightState): void {
  if (!fight.persistent || !fight.opponentId) return;
  const node = ctx.state.graph.getNode(fight.opponentId);
  const bag = node?.properties.monsterState;
  if (!bag || typeof bag !== 'object') return;
  (bag as Record<string, unknown>)[FIGHT_TEMPER_SHOWN_PROP] = true;
}

/**
 * The temper checkpoint's effect, once. `trigger: 'quarter'` is a
 * `fight_offer_quarter` complication firing it early (plan doc §12), where a
 * stubborn or berserk opponent's answer reads as a refusal.
 */
function fireTemper(
  ctx: FightForkContext,
  fight: FightState,
  trigger: FightForkTrace['trigger'],
): FightState {
  const temper = readTemper(ctx, fight);
  const temperAtStart = trigger === 'clash'
    && fight.clockAtStart >= temperCheckpoint(fight.clockSize)
    && fight.exchanges <= 1;
  markTemperShown(ctx, fight);
  const fired: FightState = { ...fight, temperFired: true };
  const base = { stepIndex: ctx.stepIndex, kind: 'temper' as const, side: 'opponent' as const };

  switch (temper) {
    case 'skittish':
      return recordFork(ctx, { ...fired, result: 'driven_off' },
        { ...base, choice: 'fled', decidedBy: 'temper' },
        { axis: null, profileLean: 0, cardLean: 0, trigger, temper, temperAtStart });
    case 'berserk':
      return recordFork(ctx, { ...fired, berserk: true },
        { ...base, choice: 'berserk', decidedBy: 'temper' },
        { axis: null, profileLean: 0, cardLean: 0, trigger, temper, temperAtStart });
    case 'bargainer': {
      const decision = decideFighterPole(ctx, FIGHT_BARGAIN_AXIS);
      const bargained = decision.pole === 'positive';
      return recordFork(ctx, bargained ? { ...fired, result: 'bargained' } : fired,
        { ...base, choice: bargained ? 'bargain' : 'refuse', decidedBy: decision.decidedBy },
        {
          axis: FIGHT_BARGAIN_AXIS, profileLean: decision.profileLean, cardLean: decision.cardLean,
          trigger, temper, temperAtStart,
        });
    }
    case 'stubborn':
    default:
      return recordFork(ctx, fired,
        { ...base, choice: trigger === 'quarter' ? 'refuse' : 'none', decidedBy: 'temper' },
        { axis: null, profileLean: 0, cardLean: 0, trigger, temper: 'stubborn', temperAtStart });
  }
}

/** The fighter's stand-or-yield decision on `courage_prudence`. The negative pole yields. */
function decideConcession(
  ctx: FightForkContext,
  fight: FightState,
  trigger: FightForkTrace['trigger'],
): FightState {
  const decision = decideFighterPole(ctx, FIGHT_CONCESSION_AXIS);
  const yielded = decision.pole === 'negative';
  return recordFork(ctx, yielded ? { ...fight, result: 'yielded' } : fight,
    {
      stepIndex: ctx.stepIndex, kind: 'concession', side: 'fighter',
      choice: yielded ? 'yield' : 'fight_on', decidedBy: decision.decidedBy,
    },
    { axis: FIGHT_CONCESSION_AXIS, profileLean: decision.profileLean, cardLean: decision.cardLean, trigger });
}

/**
 * Run the clash's forks, in precedence order: temper, then concession. Called by
 * the fight handler after the clock-full check and the step's costs. Returns the
 * fight state unchanged when a result is already set, on a nerve step, or when no
 * fork is due.
 */
export function runFightForks(ctx: FightForkContext, role: 'nerve' | 'clash'): FightState | undefined {
  let fight = ctx.action.fightState;
  if (!fight || fight.result || role !== 'clash') return fight;

  if (!fight.temperFired && fight.clockNow >= temperCheckpoint(fight.clockSize)) {
    fight = fireTemper(ctx, fight, 'clash');
    if (fight.result) return fight;
  }

  if (!ctx.isLast && FIGHT_CONCESSION_BANDS.includes(ctx.outcome)) {
    fight = decideConcession(ctx, fight, 'clash');
  }
  return fight;
}

/**
 * `fight_offer_quarter`'s side rule (plan doc §12, THR-1265): quarter is offered
 * to whichever side is losing.
 *
 *  - The fighter is behind (`isFighterBehind`) → the fighter's concession fork runs
 *    now. On the last clash a yield is moot (the fight is ending `broke_off`), so
 *    the offer lapses, traced with choice `none`.
 *  - Otherwise (NPC mode) → the opponent's temper checkpoint fires now: a
 *    bargainer bargains, a skittish one flees, a berserk one turns, a stubborn one
 *    refuses. It answers on the last clash too, because a bargain or a flight
 *    changes how the fight ends. A temper already shown refuses.
 *
 * Agent mode's opponent-side concession is plan doc 5's (E1). FB7 wires the
 * complication effect to this function; it is a no-op once a result is set.
 */
export function resolveQuarterOffer(ctx: FightForkContext): FightState | undefined {
  const fight = ctx.action.fightState;
  if (!fight || fight.result) return fight;

  if (isFighterBehind(fight)) {
    if (ctx.isLast) {
      return recordFork(ctx, fight,
        { stepIndex: ctx.stepIndex, kind: 'concession', side: 'fighter', choice: 'none', decidedBy: 'conviction' },
        { axis: FIGHT_CONCESSION_AXIS, profileLean: 0, cardLean: 0, trigger: 'quarter' });
    }
    return decideConcession(ctx, fight, 'quarter');
  }

  if (fight.temperFired) {
    return recordFork(ctx, fight,
      { stepIndex: ctx.stepIndex, kind: 'temper', side: 'opponent', choice: 'refuse', decidedBy: 'temper' },
      { axis: null, profileLean: 0, cardLean: 0, trigger: 'quarter', temper: readTemper(ctx, fight) });
  }
  return fireTemper(ctx, fight, 'quarter');
}
