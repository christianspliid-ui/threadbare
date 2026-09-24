/**
 * The fight's own state, and the handler that moves it (THR-1538, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §4–6).
 *
 * Every fight roll is still `resolveStepCore`. What this module owns is what a
 * fight step does *after* its band is known:
 *
 *  - `applyFightStepResult` — the fight handler. Called from `executeStepResult`
 *    after the consequence is selected and before growth and `advanceStep`, so
 *    the clock-full check can end the fight in the same step. It creates
 *    `fightState` at the block's first fight step, lands the band on the clock,
 *    and sets `fightState.result` when the fight is decided.
 *  - `checkFightContinuation` — the check at the start of `resolveUncontestedStep`,
 *    before any roll, that ends a fight whose opponent never bound, died, or no
 *    longer shares the fighter's hex. Those ends take the no-roll route.
 *  - `withFightResultMemory` — the one choice memory a fight writes, at an index no
 *    step owns (`fightResultIndex`), so aftermath variants key on `fight:<result>`
 *    without shadowing a card record the hand wrote by step index.
 *
 * Deterministic: the only draw is the forks' coin (`fightForks.ts`, FB4), from the
 * step's own rng and only inside the neutral band.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type {
  ActionStep,
  StepNudge,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { EncounterChoiceMemory } from '../../types/encounter';
import type { FightEndReason, FightState, OpponentCard } from '../../types/fight';
import {
  FIGHT_CLOCK_BY_BAND,
  FIGHT_RESULT_CHOICE_PREFIX,
  FIGHT_RESULT_STEP_ID,
  FIGHT_RESULT_WORDS,
  FIGHT_WOUNDING_BANDS,
} from '../../data/fight-constants';
import { isAgentGone } from '../groups/groupQueries';
import { resolveLocationToHex } from '../encounterAwareness';
import { defaultOpponentCard, readOpponentCard } from './opponentCard';
import { fightRoleOf, resolveFightOpponent } from './fightStepInputs';
import { applyFightBandCondition, fightMomentumAfter, queueFightHarm } from './fightHarm';
import {
  advanceFightClock,
  applyPerFightClockDelta,
  clearStaleFightClockMailbox,
  drainFightClockMailbox,
} from './fightClock';
import { runFightForks } from './fightForks';

/**
 * The index the fight's result memory is written at: past the terminal block, an
 * index no step owns (plan doc §6, "the memory rule"). A fight template's
 * aftermath sets `branchOnStep: fightResultIndex(steps)`.
 */
export function fightResultIndex(steps: readonly unknown[]): number {
  return steps.length;
}

/** A fresh fight state, read from the opponent's card at the block's first fight step. */
export function createFightState(card: OpponentCard): FightState {
  return {
    opponentId: card.opponentId,
    clockSize: card.clockSize,
    clockAtStart: card.clockFilled,
    clockNow: card.clockFilled,
    persistent: card.persistent,
    exchanges: 0,
    harmTaken: 0,
    wounds: 0,
    blowsLanded: 0,
    momentum: 0,
    temperFired: false,
    berserk: false,
    advantages: [],
    forks: [],
    conditionsApplied: [],
    storiedClimbs: [],
  };
}

/**
 * Whether `stepIndex` is the last fight step of the template. The block is
 * terminal (plan doc §6), so this is the last step; reading "no later step carries
 * `fightRole`" also ends a hand-authored template that breaks the rule at its
 * block's end, before any stray step runs (fail-soft table).
 */
export function isLastFightStep(template: Pick<UnifiedActionTemplate, 'steps'>, stepIndex: number): boolean {
  for (let i = stepIndex + 1; i < template.steps.length; i++) {
    // A branch step carries no `fightRole` of its own (v1: a fight inside a
    // branch is a sequel, plan doc §6), so it reads as not-a-fight-step.
    if (fightRoleOf(template.steps[i] as Partial<ActionStep>)) return false;
  }
  return true;
}

function agentHex(graph: WorldGraph, agentId: string): { col: number; row: number } | null {
  const locationId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
  return locationId ? resolveLocationToHex(graph, locationId) : null;
}

/**
 * The check that runs at the start of `resolveUncontestedStep`, before any roll
 * (plan doc §1). Returns why the fight ends here, or undefined to roll.
 *
 * At the block's first fight step: an `opponentRef` that does not bind, or an
 * opponent that is the fighter themself or is missing, ends it `no_opponent`; a
 * deceased one, `opponent_gone`. Never a fallback to the target. A step with no
 * `opponentRef` on an action with no target at all fights the default card
 * (fail-soft table, row 2).
 *
 * Before every later fight step: an opponent who has died since ends it
 * `opponent_gone`; one who no longer shares the fighter's hex, `separated`. A hex
 * that cannot be resolved on either side never separates (fail-soft).
 */
export function checkFightContinuation(
  state: Pick<GameState, 'graph'>,
  action: UnifiedAction,
  step: ActionStep,
): FightEndReason | undefined {
  if (!fightRoleOf(step)) return undefined;
  const fight = action.fightState;
  if (!fight) {
    if (!step.opponentRef && !action.targetId) return undefined;
    const { status } = resolveFightOpponent(state, action, step);
    if (status === 'deceased') return 'opponent_gone';
    if (status === 'unbound' || status === 'self') return 'no_opponent';
    return undefined;
  }
  if (!fight.opponentId) return undefined;
  if (isAgentGone(state.graph.getNode(fight.opponentId))) return 'opponent_gone';
  const fighterHex = agentHex(state.graph, action.actorId);
  const opponentHex = agentHex(state.graph, fight.opponentId);
  if (fighterHex && opponentHex && (fighterHex.col !== opponentHex.col || fighterHex.row !== opponentHex.row)) {
    return 'separated';
  }
  return undefined;
}

/**
 * The fight state a no-roll end resolves with. Mid-fight it is the fight's own
 * state; at the first step there is none yet, so one is made from the default
 * card for the opponent the step named (or none).
 */
export function fightStateForNoRollEnd(
  state: Pick<GameState, 'graph'>,
  action: UnifiedAction,
  step: ActionStep | undefined,
  reason: FightEndReason,
): FightState {
  const base = action.fightState ?? createFightState({
    ...defaultOpponentCard(step ? resolveFightOpponent(state, action, step).opponentId : null),
    clockFilled: 0,
  });
  return { ...base, result: 'broke_off', endReason: reason };
}

/**
 * The fight handler (plan doc §5–7). Runs once per rolled fight step; returns the
 * action carrying the updated `fightState` (with `result` set when the fight is
 * decided). A step without `fightRole` comes back unchanged.
 *
 * Two halves: `landFightBand` moves the clock and decides the result (FB2); then
 * the step's costs land (FB3) — its harm is queued as `fight_harm`, its band
 * condition is applied through `applyConditionToActor`, and its momentum is
 * carried into the next fight step. The costs land on every band, including the
 * one that ends the fight: a rout leaves the fighter `terrified`, a strike-down
 * `wounded` at the severe intensity (plan doc §7).
 */
export function applyFightStepResult(
  state: GameState,
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'steps'>,
  step: ActionStep,
  outcome: StepOutcome,
  tick: number,
  opts: FightStepResultOptions = {},
): UnifiedAction {
  const role = fightRoleOf(step);
  if (!role) return action;
  const landed = landFightBand(state, action, template, step, outcome, tick);
  const fight = landed.fightState;
  if (!fight) return landed;

  // The step's costs read the fight as it stood when the blow landed: a berserk
  // turn decided by this clash's temper prices the *next* clash, not this one.
  const harm = queueFightHarm(state, action.actorId, {
    role,
    band: outcome,
    attended: action.effectiveTier === 'story_beat',
    difficulty: opts.difficulty ?? step.difficulty,
    berserk: fight.berserk,
  }, tick);
  const condition = applyFightBandCondition(
    state, action.actorId, role, outcome, tick, action.actionId, action.currentStep,
  );
  const costed: UnifiedAction = {
    ...landed,
    fightState: {
      ...fight,
      harmTaken: fight.harmTaken + harm,
      conditionsApplied: condition && !fight.conditionsApplied.includes(condition)
        ? [...fight.conditionsApplied, condition]
        : fight.conditionsApplied,
      momentum: fightMomentumAfter(role, outcome),
    },
  };

  // THR-1540 (plan doc §5, §8) — the forks, after the clock-full check: temper,
  // then concession; none once a result is set. Then a fight still undecided at
  // its last step ends `broke_off` — after the forks, so a bargain or a flight on
  // the last clash still decides how it ends.
  const isLast = isLastFightStep(template, action.currentStep);
  let decided = runFightForks({
    state,
    action: costed,
    templateId: action.templateId,
    stepIndex: action.currentStep,
    outcome,
    isLast,
    rng: opts.rng ?? standFirmCoin,
    tick,
    handNudges: opts.handNudges,
  }, role) ?? costed.fightState!;
  if (isLast && !decided.result) decided = { ...decided, result: 'broke_off' };
  return { ...costed, fightState: decided };
}

/** Options the handler's call site passes: the resolved difficulty, the step rng and the dealt hand. */
export interface FightStepResultOptions {
  /** The step's resolved difficulty (plan doc §3c); harm reads it. */
  readonly difficulty?: number;
  /** The step's seeded resolution rng — the forks' coin, drawn only inside the neutral band. */
  readonly rng?: () => number;
  /** The resolved (dealt) step's cards, for the hand's lean on a fork's axis. */
  readonly handNudges?: readonly StepNudge[];
}

/**
 * The fallback coin when no rng is passed (a direct call with no step stream).
 * The neutral band then reads the positive pole — the fighter stands, a bargain
 * is taken — so a caller that never supplied a coin is not handed a yield.
 * Deterministic, never `Math.random` (NFP #3).
 */
function standFirmCoin(): number {
  return 0;
}

/**
 * The fight's band landing (plan doc §5–6): creates `fightState` at the first
 * fight step, moves the clock and decides the result.
 *
 * The clock-full check, in the plan's order: (1) the band's landing write;
 * (2) the step's effect events (FB5); (3) the per-fight mailbox drain;
 * (4) the step complication's `fight_clock` (FB7); (5) the clock re-read. Full,
 * opponent alive, and a blow landed this step → `overcome`. A full clock with no
 * blow this step waits for the next landing blow; none by the last clash →
 * `broke_off`.
 */
function landFightBand(
  state: Pick<GameState, 'graph'>,
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'steps'>,
  step: ActionStep,
  outcome: StepOutcome,
  tick: number,
): UnifiedAction {
  const role = fightRoleOf(step);
  if (!role) return action;
  const graph = state.graph;

  let fight: FightState;
  if (!action.fightState) {
    // The block's first fight step: read the card (lazy recovery included) and
    // clear a mailbox an earlier fight left behind, before this fight's raises.
    const { opponentId, status } = resolveFightOpponent(state, action, step);
    const boundId = status === 'bound' ? opponentId : null;
    const card = boundId ? readOpponentCard(graph, boundId, tick) : defaultOpponentCard(null);
    if (boundId && !card.persistent) clearStaleFightClockMailbox(graph, boundId, tick, action.actionId);
    fight = createFightState(card);
  } else {
    fight = action.fightState;
    if (fight.opponentId && fight.persistent) {
      // Writes between steps (another fighter's blow, recovery) — re-read the card.
      fight = { ...fight, clockNow: readOpponentCard(graph, fight.opponentId, tick).clockFilled };
    } else if (fight.opponentId) {
      // Writes between steps count toward the clock but are not this step's blow.
      const between = drainFightClockMailbox(graph, fight.opponentId);
      if (between !== 0) {
        fight = applyPerFightClockDelta(fight, between, 'mailbox', tick, action.actionId).fightState;
      }
    }
  }

  if (role === 'nerve') {
    if (outcome === 'critical_failure') fight = { ...fight, result: 'routed' };
    return { ...action, fightState: fight };
  }

  // A clash.
  fight = {
    ...fight,
    exchanges: fight.exchanges + 1,
    wounds: fight.wounds + (FIGHT_WOUNDING_BANDS.includes(outcome) ? 1 : 0),
  };
  if (outcome === 'critical_failure') {
    return { ...action, fightState: { ...fight, result: 'struck_down' } };
  }

  let blowLanded = false;
  const delta = FIGHT_CLOCK_BY_BAND[outcome] ?? 0;
  // (1) the band's landing write.
  if (delta > 0) {
    blowLanded = true;
    if (fight.persistent && fight.opponentId) {
      advanceFightClock(graph, fight.opponentId, delta, 'clash', tick, action.actionId);
    } else {
      fight = applyPerFightClockDelta(fight, delta, 'clash', tick, action.actionId).fightState;
    }
  }
  // (2) the step's effect events — FB5 (THR-1541) raises them here.
  // (3) the mailbox drain: this step's own effect-path writes count as a blow.
  if (!fight.persistent && fight.opponentId) {
    const drained = drainFightClockMailbox(graph, fight.opponentId);
    if (drained !== 0) {
      fight = applyPerFightClockDelta(fight, drained, 'mailbox', tick, action.actionId).fightState;
      if (drained > 0) blowLanded = true;
    }
  }
  // (4) the complication's `fight_clock` — FB7 (THR-1543) reads it here.
  // (5) the re-read.
  if (fight.persistent && fight.opponentId) {
    fight = { ...fight, clockNow: readOpponentCard(graph, fight.opponentId, tick).clockFilled };
  }
  if (blowLanded) fight = { ...fight, blowsLanded: fight.blowsLanded + 1 };

  const opponentAlive = fight.opponentId === null || !isAgentGone(graph.getNode(fight.opponentId));
  if (fight.clockNow >= fight.clockSize && opponentAlive && blowLanded) {
    fight = { ...fight, result: 'overcome' };
  }
  return { ...action, fightState: fight };
}

/**
 * Write the fight's result as **one** choice memory at `fightResultIndex(steps)`
 * (plan doc §6). Replaces any earlier memory at that index; no step owns it, so no
 * card record is touched. No-op without a result.
 */
export function withFightResultMemory(
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'steps'>,
  tick: number,
): UnifiedAction {
  const result = action.fightState?.result;
  if (!result) return action;
  const stepIndex = fightResultIndex(template.steps);
  const memory: EncounterChoiceMemory = {
    stepIndex,
    stepId: FIGHT_RESULT_STEP_ID,
    choiceId: `${FIGHT_RESULT_CHOICE_PREFIX}${result}`,
    choiceText: FIGHT_RESULT_WORDS[result],
    interventionType: FIGHT_RESULT_STEP_ID,
    essenceSpent: 0,
    probabilityBoost: 0,
    tick,
  };
  return {
    ...action,
    choiceHistory: [
      ...(action.choiceHistory ?? []).filter((m) => m.stepIndex !== stepIndex),
      memory,
    ].sort((a, b) => a.stepIndex - b.stepIndex),
  };
}
