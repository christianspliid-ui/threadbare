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
 * Deterministic: the draws are the forks' coin (`fightForks.ts`, FB4), from the
 * step's own rng and only inside the neutral band, and — before it, in raise
 * order — whatever the step's fight events (`fightEvents.ts`, FB5) trigger on the
 * same stream (a `transform`'s probability roll).
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
import type { FightEndReason, FightRole, FightState, OpponentCard, OpponentFightRoll } from '../../types/fight';
import {
  FIGHT_CLOCK_BY_BAND,
  FIGHT_CONDITION_INTENSITY,
  FIGHT_MORTAL_CLOCK,
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
import { resolveDuelQuarterOffer, resolveQuarterOffer, runDuelForks, runFightForks } from './fightForks';
import { duelOpponentId, mirrorFightState, opponentStream, rollOpponentSide } from './opposedRoll';
import type { ComplicationEffect } from '../../types/complication';
import type { TickEvent } from '../../types/gameState';
import {
  readFightAdvantages,
  secretAppliesToClash,
  spendFavourAtFightStart,
  spendSecretAfterClash,
} from './fightAdvantages';
import { CONDITION_DURATIONS } from '../../data/condition-trait-content';
import { applyConditionToActor } from '../encounterAftermath';
import {
  raiseFightClashLanded,
  raiseFightOvercome,
  raiseFightStarted,
  raiseFightStepOutcome,
} from './fightEvents';
import type { ReachDomain } from '../../types/traits';

// The index the fight's result memory is written at lives with the authoring helper
// (FB7), so a fight template can name it without importing the engine.
import { fightResultIndex } from '../../data/fights/fightBlock';
export { fightResultIndex };

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
  // THR-1556 (duels plan doc §1–4) — an agent-mode fight against a mortal is a
  // duel: both sides rolled, and the matrix below decides it. Every other fight
  // takes the NPC-mode handler below, byte-identical to before.
  if (duelOpponentId(state, action, step)) {
    return applyDuelStepResult(state, action, template, step, role, outcome, tick, opts);
  }
  const effects = opts.complicationEffects ?? [];
  // FB7 (plan doc §11): the secret applied to this clash iff the fighter was
  // behind going into it — read off the fight as it stood before the blow lands.
  const secretApplied = role === 'clash' ? secretAppliesToClash(action.fightState) : undefined;
  const landed = landFightBand(state, action, step, outcome, tick, {
    reach: opts.reach ?? step.reach,
    rng: opts.rng ?? standFirmCoin,
    complicationClock: effects.reduce((sum, e) => sum + (e.type === 'fight_clock' ? e.delta : 0), 0),
  });
  let fight = landed.fightState;
  if (!fight) return landed;
  if (secretApplied) {
    const spent = spendSecretAfterClash(state, action.actorId, fight.opponentId, fight.advantages, secretApplied);
    fight = { ...fight, advantages: spent.advantages };
    opts.events?.push(...spent.events);
  }

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
  // FB7 (plan doc §12): the step complication's fight effects, each through the
  // fight's own writer — momentum onto the carried term, a condition through
  // `applyConditionToActor`. (Its clock write landed at step (4) of the check.)
  const complicationMomentum = effects.reduce(
    (sum, e) => sum + (e.type === 'fight_momentum' ? e.delta : 0), 0,
  );
  const conditionsApplied = new Set(fight.conditionsApplied);
  if (condition) conditionsApplied.add(condition);
  for (const effect of effects) {
    if (effect.type !== 'fight_condition') continue;
    const targetId = effect.side === 'fighter' ? action.actorId : fight.opponentId;
    if (!targetId) continue;
    const applied = applyConditionToActor(state, targetId, effect.conditionTraitId, {
      tick,
      intensity: FIGHT_CONDITION_INTENSITY,
      durationTicks: CONDITION_DURATIONS[effect.conditionTraitId] ?? 0,
      edgeId: `has_trait_${targetId}_${effect.conditionTraitId}_${tick}_fightcomp_${action.actionId}_${action.currentStep}`,
      edgeProperties: { sourceActionId: action.actionId, source: 'fight_complication' },
    });
    if (applied.applied && effect.side === 'fighter') conditionsApplied.add(effect.conditionTraitId);
  }
  const costed: UnifiedAction = {
    ...landed,
    fightState: {
      ...fight,
      harmTaken: fight.harmTaken + harm,
      conditionsApplied: [...conditionsApplied],
      momentum: fightMomentumAfter(role, outcome) + complicationMomentum,
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
  // FB7 (plan doc §12): quarter offered — to whichever side is losing. After the
  // clash's own forks, and never once a result is set.
  if (role === 'clash' && !decided.result && effects.some((e) => e.type === 'fight_offer_quarter')) {
    decided = resolveQuarterOffer({
      state,
      action: { ...costed, fightState: decided },
      templateId: action.templateId,
      stepIndex: action.currentStep,
      outcome,
      isLast,
      rng: opts.rng ?? standFirmCoin,
      tick,
      handNudges: opts.handNudges,
    }) ?? decided;
  }
  if (isLast && !decided.result) decided = { ...decided, result: 'broke_off' };
  return { ...costed, fightState: decided };
}

/** Options the handler's call site passes: the resolved difficulty, the step rng and the dealt hand. */
export interface FightStepResultOptions {
  /** The step's resolved difficulty (plan doc §3c); harm reads it. */
  readonly difficulty?: number;
  /**
   * The step's resolved reach (plan doc §3c) — the reach the fighter's
   * `encounter_outcome` is raised on (FB5, §9). Defaults to the authored reach.
   */
  readonly reach?: ReachDomain;
  /** The step's seeded resolution rng — the forks' coin, drawn only inside the neutral band. */
  readonly rng?: () => number;
  /** The resolved (dealt) step's cards, for the hand's lean on a fork's axis. */
  readonly handNudges?: readonly StepNudge[];
  /**
   * FB7 (plan doc §12) — the effects of the complication selected for this step.
   * Only the `fight_*` members are read; the complication applier ignores them.
   */
  readonly complicationEffects?: readonly ComplicationEffect[];
  /** Where the handler puts the tick events its world writes produce (a spent secret's chronicle line). */
  readonly events?: TickEvent[];
  /**
   * THR-1556 (duels) — the opponent's synthesized roll for this step, rolled by
   * `resolveUncontestedStep` right after the fighter's. Absent on a duel step
   * (a caller that did not carry it) ⇒ the handler rolls it itself, on the same
   * seeded stream, so the band is identical either way.
   */
  readonly opponentRoll?: OpponentFightRoll;
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
  state: GameState,
  action: UnifiedAction,
  step: ActionStep,
  outcome: StepOutcome,
  tick: number,
  events: { readonly reach: ReachDomain; readonly rng: () => number; readonly complicationClock?: number },
): UnifiedAction {
  const role = fightRoleOf(step);
  if (!role) return action;
  const graph = state.graph;
  const fighterId = action.actorId;

  let fight: FightState;
  if (!action.fightState) {
    // The block's first fight step: read the card (lazy recovery included) and
    // clear a mailbox an earlier fight left behind, before this fight's raises.
    const { opponentId, status } = resolveFightOpponent(state, action, step);
    const boundId = status === 'bound' ? opponentId : null;
    const card = boundId ? readOpponentCard(graph, boundId, tick) : defaultOpponentCard(null);
    if (boundId && !card.persistent) clearStaleFightClockMailbox(graph, boundId, tick, action.actionId);
    // FB7 (plan doc §11): the advantages, read once — the same pure read the
    // forecast made — and the favour spent now, exactly once per fight.
    fight = {
      ...createFightState(card),
      advantages: spendFavourAtFightStart(
        state, fighterId, readFightAdvantages(state, fighterId, boundId), tick, action.actionId,
      ),
    };
    // THR-1541 (plan doc §9) — the handler's first run: the fight has started, for
    // both sides, before this step's outcome is raised. A reactive on it (a roar)
    // therefore moves the first clash, never the nerve roll it follows.
    raiseFightStarted(state, fighterId, fight.opponentId, events.rng);
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
    raiseFightStepOutcome(state, fighterId, fight.opponentId, events.reach, outcome, events.rng);
    // A complication's clock write lands on the nerve step too; no clock-full check runs here.
    if (events.complicationClock) {
      fight = writeComplicationClock(graph, fight, events.complicationClock, tick, action.actionId);
    }
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
    raiseFightStepOutcome(state, fighterId, fight.opponentId, events.reach, outcome, events.rng);
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
  // (2) the step's effect events (THR-1541, plan doc §9): the fighter's outcome,
  // then — if the clash landed — `attacked` and `damaged`. Their reactives and
  // items may write the clock; a per-fight write lands in the mailbox drained next.
  // THR-1542 (FB6) — a persistent clock is written directly, so what the events
  // did to it is read as the difference across them.
  const persistentBeforeEvents = fight.persistent && fight.opponentId
    ? readOpponentCard(graph, fight.opponentId, tick).clockFilled
    : 0;
  raiseFightStepOutcome(state, fighterId, fight.opponentId, events.reach, outcome, events.rng);
  raiseFightClashLanded(state, fighterId, fight.opponentId, outcome, delta, events.rng);
  // (3) the mailbox drain: this step's own effect-path writes count as a blow.
  if (!fight.persistent && fight.opponentId) {
    const drained = drainFightClockMailbox(graph, fight.opponentId);
    if (drained !== 0) {
      fight = applyPerFightClockDelta(fight, drained, 'mailbox', tick, action.actionId).fightState;
      if (drained > 0) blowLanded = true;
    }
  }
  // (4) the complication's `fight_clock` (FB7, plan doc §12). A per-fight clock is
  // written on `fightState` directly — through the mailbox it would arrive after
  // the drain and miss the re-read. A positive write is a blow landed this step.
  if (events.complicationClock) {
    fight = writeComplicationClock(graph, fight, events.complicationClock, tick, action.actionId);
    if (events.complicationClock > 0) blowLanded = true;
  }
  // (5) the re-read.
  if (fight.persistent && fight.opponentId) {
    const afterEvents = readOpponentCard(graph, fight.opponentId, tick).clockFilled;
    // A net-positive effect-path write this step (an item's `fight_clock +1`)
    // is a blow landed this step, as the mailbox drain's is for a mortal (§5).
    if (afterEvents > persistentBeforeEvents) blowLanded = true;
    fight = { ...fight, clockNow: afterEvents };
  }
  if (blowLanded) fight = { ...fight, blowsLanded: fight.blowsLanded + 1 };

  const opponentAlive = fight.opponentId === null || !isAgentGone(graph.getNode(fight.opponentId));
  if (fight.clockNow >= fight.clockSize && opponentAlive && blowLanded) {
    fight = { ...fight, result: 'overcome' };
    // THR-1541 — the win: stack `on_kill` on the fighter.
    raiseFightOvercome(state, fighterId, fight.opponentId, events.rng);
  }
  return { ...action, fightState: fight };
}

/** A complication's `fight_clock` write, through the fight's one clock writer for its card. */
function writeComplicationClock(
  graph: WorldGraph,
  fight: FightState,
  delta: number,
  tick: number,
  actionId: string,
): FightState {
  if (fight.persistent && fight.opponentId) {
    advanceFightClock(graph, fight.opponentId, delta, 'complication', tick, actionId);
    return { ...fight, clockNow: readOpponentCard(graph, fight.opponentId, tick).clockFilled };
  }
  return applyPerFightClockDelta(fight, delta, 'complication', tick, actionId).fightState;
}

// ─── Duels: the opposed exchange (THR-1556, duels plan doc §1–4) ─────────────

/**
 * A per-fight clock write on the **fighter's** clock (the opponent's blow). The
 * fight's one per-fight writer, pointed at the fighter's side through the mirror,
 * so the write is traced against the fighter exactly as the opponent's is.
 */
function applyFighterClockDelta(
  fight: FightState,
  fighterId: string,
  delta: number,
  cause: string,
  tick: number,
  actionId: string,
): FightState {
  const mirrored = applyPerFightClockDelta(mirrorFightState(fight, fighterId), delta, cause, tick, actionId).fightState;
  return { ...fight, fighterClockNow: mirrored.clockNow };
}

/**
 * A fresh duel state: both cards derived, both clocks per-fight and empty, both
 * sides' advantages read once — and each side's favour spent now, exactly once
 * (plan doc §1–2).
 */
function createDuelState(
  state: GameState,
  fighterId: string,
  opponentId: string,
  tick: number,
  actionId: string,
): FightState {
  const card = readOpponentCard(state.graph, opponentId, tick);
  return {
    ...createFightState(card),
    // A mortal's clock is per-fight: it starts empty whatever the card says.
    clockAtStart: 0,
    clockNow: 0,
    persistent: false,
    advantages: spendFavourAtFightStart(
      state, fighterId, readFightAdvantages(state, fighterId, opponentId), tick, actionId,
    ),
    fightMode: 'agent',
    fighterClockSize: FIGHT_MORTAL_CLOCK,
    fighterClockNow: 0,
    opponentBands: [],
    opponentMomentum: 0,
    opponentAdvantages: spendFavourAtFightStart(
      state, opponentId, readFightAdvantages(state, opponentId, fighterId), tick, actionId,
    ),
    opponentWounds: 0,
    opponentBlowsLanded: 0,
    opponentHarmTaken: 0,
  };
}

/**
 * The duel handler (plan doc §3's matrix, read from the fighter's side). Both
 * bands are known: the fighter's `outcome` and the opponent's synthesized roll.
 *
 *  - **Nerve:** a critical failure is a rout. Both → `routed` (`opponentLoss`
 *    `'routed'`); the opponent alone → `overcome` / `'routed'`.
 *  - **Clash:** the rolls come first. A critical failure strikes that side down;
 *    both → `struck_down` / `'struck_down'`. Otherwise each band advances the
 *    *other* side's clock through `FIGHT_CLOCK_BY_BAND`; both clocks full in one
 *    exchange is a double knockout (`struck_down` / `'struck_down'`); the
 *    opponent's alone → `overcome` / `'clock'`; the fighter's alone → `struck_down`.
 *  - Each side's own band harms itself (harm, band condition, momentum).
 *  - Then the concession forks, for each side its own band wounded; both yield →
 *    `broke_off` / `'yielded'`. A fight still undecided at its last clash ends
 *    `broke_off`.
 *
 * Temper is an NPC-mode fork (a monster's card); a duel has none.
 */
function applyDuelStepResult(
  state: GameState,
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'steps'> & Partial<Pick<UnifiedActionTemplate, 'sphereAffinity'>>,
  step: ActionStep,
  role: FightRole,
  outcome: StepOutcome,
  tick: number,
  opts: FightStepResultOptions,
): UnifiedAction {
  const graph = state.graph;
  const fighterId = action.actorId;
  const rng = opts.rng ?? standFirmCoin;
  const effects = opts.complicationEffects ?? [];
  // The opponent's roll, as the resolver drew it — or drawn here on the same
  // stream when the caller did not carry it (a direct call, a test).
  const roll = opts.opponentRoll ?? rollOpponentSide(state, action, template, step);

  let fight: FightState;
  const opponentId = duelOpponentId(state, action, step)!;
  if (!action.fightState) {
    clearStaleFightClockMailbox(graph, opponentId, tick, action.actionId);
    clearStaleFightClockMailbox(graph, fighterId, tick, action.actionId);
    fight = createDuelState(state, fighterId, opponentId, tick, action.actionId);
    raiseFightStarted(state, fighterId, opponentId, rng);
  } else {
    fight = action.fightState;
    // Writes between steps count toward each clock but are not this step's blow.
    const between = drainFightClockMailbox(graph, opponentId);
    if (between !== 0) fight = applyPerFightClockDelta(fight, between, 'mailbox', tick, action.actionId).fightState;
    const betweenFighter = drainFightClockMailbox(graph, fighterId);
    if (betweenFighter !== 0) {
      fight = applyFighterClockDelta(fight, fighterId, betweenFighter, 'mailbox', tick, action.actionId);
    }
  }
  if (!roll) return { ...action, fightState: fight };
  const oppBand = roll.band;
  // The opponent's effect-event raises draw from its own sibling stream.
  const oppRng = opponentStream(state, action.actionId, opponentId, action.currentStep, 'events');
  const secretApplied = role === 'clash' ? secretAppliesToClash(action.fightState) : undefined;
  const oppSecretApplied = role === 'clash' && action.fightState
    ? secretAppliesToClash(mirrorFightState(action.fightState, fighterId))
    : undefined;
  fight = { ...fight, opponentBands: [...(fight.opponentBands ?? []), oppBand] };

  if (role === 'nerve') {
    raiseFightStepOutcome(state, fighterId, opponentId, opts.reach ?? step.reach, outcome, rng);
    raiseFightStepOutcome(state, opponentId, fighterId, roll.reach, oppBand, oppRng);
    const complicationClock = effects.reduce((sum, e) => sum + (e.type === 'fight_clock' ? e.delta : 0), 0);
    if (complicationClock) {
      fight = applyPerFightClockDelta(fight, complicationClock, 'complication', tick, action.actionId).fightState;
    }
    const fighterRouts = outcome === 'critical_failure';
    const opponentRouts = oppBand === 'critical_failure';
    if (fighterRouts && opponentRouts) fight = { ...fight, result: 'routed', opponentLoss: 'routed' };
    else if (fighterRouts) fight = { ...fight, result: 'routed' };
    else if (opponentRouts) fight = { ...fight, result: 'overcome', opponentLoss: 'routed' };
  } else {
    fight = {
      ...fight,
      exchanges: fight.exchanges + 1,
      wounds: fight.wounds + (FIGHT_WOUNDING_BANDS.includes(outcome) ? 1 : 0),
      opponentWounds: (fight.opponentWounds ?? 0) + (FIGHT_WOUNDING_BANDS.includes(oppBand) ? 1 : 0),
    };
    const fighterDown = outcome === 'critical_failure';
    const opponentDown = oppBand === 'critical_failure';
    raiseFightStepOutcome(state, fighterId, opponentId, opts.reach ?? step.reach, outcome, rng);
    raiseFightStepOutcome(state, opponentId, fighterId, roll.reach, oppBand, oppRng);
    if (fighterDown || opponentDown) {
      // The rolls come first: a critical failure ends the exchange before any clock.
      if (fighterDown && opponentDown) fight = { ...fight, result: 'struck_down', opponentLoss: 'struck_down' };
      else if (fighterDown) fight = { ...fight, result: 'struck_down' };
      else fight = { ...fight, result: 'overcome', opponentLoss: 'struck_down' };
    } else {
      let fighterBlow = false;
      let opponentBlow = false;
      // (1) each band's landing write, on the other side's clock.
      const fighterDelta = FIGHT_CLOCK_BY_BAND[outcome] ?? 0;
      const opponentDelta = FIGHT_CLOCK_BY_BAND[oppBand] ?? 0;
      if (fighterDelta > 0) {
        fighterBlow = true;
        fight = applyPerFightClockDelta(fight, fighterDelta, 'clash', tick, action.actionId).fightState;
      }
      if (opponentDelta > 0) {
        opponentBlow = true;
        fight = applyFighterClockDelta(fight, fighterId, opponentDelta, 'clash', tick, action.actionId);
      }
      // (2) the effect events — each side's blow on the other; items and powers
      // write the clocks through the node mailboxes, drained next.
      raiseFightClashLanded(state, fighterId, opponentId, outcome, fighterDelta, rng);
      raiseFightClashLanded(state, opponentId, fighterId, oppBand, opponentDelta, oppRng);
      // (3) the mailbox drains: this step's effect-path writes count as blows.
      const drained = drainFightClockMailbox(graph, opponentId);
      if (drained !== 0) {
        fight = applyPerFightClockDelta(fight, drained, 'mailbox', tick, action.actionId).fightState;
        if (drained > 0) fighterBlow = true;
      }
      const drainedFighter = drainFightClockMailbox(graph, fighterId);
      if (drainedFighter !== 0) {
        fight = applyFighterClockDelta(fight, fighterId, drainedFighter, 'mailbox', tick, action.actionId);
        if (drainedFighter > 0) opponentBlow = true;
      }
      // (4) the complication's `fight_clock` lands on the opponent, as in NPC mode.
      const complicationClock = effects.reduce((sum, e) => sum + (e.type === 'fight_clock' ? e.delta : 0), 0);
      if (complicationClock) {
        fight = applyPerFightClockDelta(fight, complicationClock, 'complication', tick, action.actionId).fightState;
        if (complicationClock > 0) fighterBlow = true;
      }
      if (fighterBlow) fight = { ...fight, blowsLanded: fight.blowsLanded + 1 };
      if (opponentBlow) fight = { ...fight, opponentBlowsLanded: (fight.opponentBlowsLanded ?? 0) + 1 };
      // (5) both clocks read.
      const opponentBeaten = fighterBlow && fight.clockNow >= fight.clockSize;
      const fighterBeaten = opponentBlow
        && (fight.fighterClockNow ?? 0) >= (fight.fighterClockSize ?? FIGHT_MORTAL_CLOCK);
      if (opponentBeaten && fighterBeaten) {
        fight = { ...fight, result: 'struck_down', opponentLoss: 'struck_down' };
      } else if (opponentBeaten) {
        fight = { ...fight, result: 'overcome', opponentLoss: 'clock' };
        raiseFightOvercome(state, fighterId, opponentId, rng);
      } else if (fighterBeaten) {
        fight = { ...fight, result: 'struck_down' };
        raiseFightOvercome(state, opponentId, fighterId, oppRng);
      }
    }
  }

  // Each side's secret is spent after the clash it applied to (FB7, both sides).
  if (secretApplied) {
    const spent = spendSecretAfterClash(state, fighterId, opponentId, fight.advantages, secretApplied);
    fight = { ...fight, advantages: spent.advantages };
    opts.events?.push(...spent.events);
  }
  if (oppSecretApplied) {
    const spent = spendSecretAfterClash(state, opponentId, fighterId, fight.opponentAdvantages ?? [], oppSecretApplied);
    fight = { ...fight, opponentAdvantages: spent.advantages };
    opts.events?.push(...spent.events);
  }

  // Each side's own band harms itself: harm, the band condition, the momentum.
  const attended = action.effectiveTier === 'story_beat';
  const harm = queueFightHarm(state, fighterId, {
    role, band: outcome, attended, difficulty: opts.difficulty ?? step.difficulty,
  }, tick);
  const opponentHarm = queueFightHarm(state, opponentId, {
    role, band: oppBand, attended, difficulty: roll.difficulty,
  }, tick);
  const condition = applyFightBandCondition(state, fighterId, role, outcome, tick, action.actionId, action.currentStep);
  applyFightBandCondition(state, opponentId, role, oppBand, tick, action.actionId, action.currentStep);
  const conditionsApplied = new Set(fight.conditionsApplied);
  if (condition) conditionsApplied.add(condition);
  for (const effect of effects) {
    if (effect.type !== 'fight_condition') continue;
    const targetId = effect.side === 'fighter' ? fighterId : opponentId;
    const applied = applyConditionToActor(state, targetId, effect.conditionTraitId, {
      tick,
      intensity: FIGHT_CONDITION_INTENSITY,
      durationTicks: CONDITION_DURATIONS[effect.conditionTraitId] ?? 0,
      edgeId: `has_trait_${targetId}_${effect.conditionTraitId}_${tick}_fightcomp_${action.actionId}_${action.currentStep}`,
      edgeProperties: { sourceActionId: action.actionId, source: 'fight_complication' },
    });
    if (applied.applied && effect.side === 'fighter') conditionsApplied.add(effect.conditionTraitId);
  }
  const complicationMomentum = effects.reduce(
    (sum, e) => sum + (e.type === 'fight_momentum' ? e.delta : 0), 0,
  );
  fight = {
    ...fight,
    harmTaken: fight.harmTaken + harm,
    opponentHarmTaken: (fight.opponentHarmTaken ?? 0) + opponentHarm,
    conditionsApplied: [...conditionsApplied],
    momentum: fightMomentumAfter(role, outcome) + complicationMomentum,
    opponentMomentum: fightMomentumAfter(role, oppBand),
  };

  // The forks, on the step rng after both rolls: both sides' concession, then a
  // quarter offer; none once a result is set.
  const isLast = isLastFightStep(template, action.currentStep);
  const forkCtx = {
    state,
    action: { ...action, fightState: fight },
    templateId: action.templateId,
    stepIndex: action.currentStep,
    outcome,
    isLast,
    rng,
    tick,
    handNudges: opts.handNudges,
  };
  if (role === 'clash') {
    fight = runDuelForks(forkCtx, oppBand) ?? fight;
    if (!fight.result && effects.some((e) => e.type === 'fight_offer_quarter')) {
      fight = resolveDuelQuarterOffer({ ...forkCtx, action: { ...action, fightState: fight } }) ?? fight;
    }
    if (isLast && !fight.result) fight = { ...fight, result: 'broke_off' };
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
