/**
 * The duel's opposed roll (THR-1556, duels plan doc
 * `Docs/plans/2026-09-23-mortal-duels.md` §1–2).
 *
 * In an agent-mode fight — a **duel** — both sides are mortals and both roll. The
 * fighter rolls through the ordinary road (`resolveUncontestedStep`); this module
 * synthesizes the **opponent's** roll for the same step:
 *
 *  - a transient step whose actor is the opponent, priced from the *fighter's*
 *    derived card, through the same `resolveFightStepInputs` the fighter's roll
 *    uses — so the opponent's own standing modifiers (an `in_combat` charm), its
 *    courage on the nerve step, its momentum and its advantages all count;
 *  - resolved by `resolveStepCore` with `variancePolicy: 'agent'` and
 *    `quintessencePolicy: 'none'`;
 *  - on **its own stream**, `mulberry32((seed + tick × DUEL_OPPONENT_STREAM_SALT +
 *    hash(actionId + opponentId + step)) >>> 0)`, so the fighter's step stream is
 *    never drawn by it. The step index is in the key because a calibration run (or
 *    a debug lever) can resolve several steps of one fight inside one tick, where
 *    the plan's `hash(actionId + opponentId)` alone would repeat the same d100.
 *
 * Like `synthesizeBandCounter`, the synthesized action is **never** stored in
 * `state.unifiedActions`: only the band survives, on `fightState.opponentBands`
 * and on the `fight.step` trace.
 *
 * Pure with respect to the world: it reads, draws its own stream, and writes
 * nothing (the opponent has no hand, so no nudge is dispatched and no push spent).
 */

import type { GameState } from '../../types/gameState';
import type { ActionStep, UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FightState, OpponentFightRoll } from '../../types/fight';
import { DUEL_OPPONENT_STREAM_SALT, FIGHT_ENCOUNTER_TYPE, FIGHT_MORTAL_CLOCK } from '../../data/fight-constants';
import { mulberry32 } from '../../lib/prng';
import { computeCapability } from '../domainCapability';
import { buildPredicateContext, collectTestShapers } from '../effectResolver';
import { resolveStepCore, type StepCoreInput } from '../stepResolutionCore';
import { fightRoleOf, resolveFightOpponent, resolveFightStepInputs } from './fightStepInputs';

/** Whether this step belongs to an agent-mode (duel) fight block. */
export function isAgentModeStep(step: Pick<ActionStep, 'fightMode' | 'fightRole' | 'difficultyContext'> | undefined): boolean {
  return !!step && step.fightMode === 'agent' && fightRoleOf(step) !== undefined;
}

/**
 * The duel's opponent for this step, or null when the step is not a duel step or
 * its opponent is not a living mortal other than the fighter. A monster (a node
 * carrying `monsterState`) never duels: an agent-mode step against one fights in
 * NPC mode, against its card, so a persistent clock is never split in two.
 */
export function duelOpponentId(
  state: Pick<GameState, 'graph'>,
  action: Pick<UnifiedAction, 'actorId' | 'targetId' | 'supportBindings' | 'fightState'>,
  step: ActionStep | undefined,
): string | null {
  if (!isAgentModeStep(step)) return null;
  if (action.fightState) {
    return action.fightState.fightMode === 'agent' ? action.fightState.opponentId : null;
  }
  const { opponentId, status } = resolveFightOpponent(state, action, step!);
  if (status !== 'bound' || !opponentId) return null;
  const bag = state.graph.getNode(opponentId)?.properties.monsterState;
  return bag && typeof bag === 'object' ? null : opponentId;
}

/** The same 32-bit string hash the step stream's callers use. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * The opponent's own stream for one duel step. `purpose` separates the d100 from
 * the opponent's effect-event raises, which draw from a sibling stream so that
 * neither ever touches the fighter's step stream.
 */
export function opponentStream(
  state: Pick<GameState, 'seed' | 'tick'>,
  actionId: string,
  opponentId: string,
  stepIndex: number,
  purpose: 'roll' | 'events' = 'roll',
): () => number {
  const key = `${actionId}${opponentId}:${stepIndex}${purpose === 'roll' ? '' : `:${purpose}`}`;
  return mulberry32(((state.seed ?? 0) + state.tick * DUEL_OPPONENT_STREAM_SALT + hashString(key)) >>> 0);
}

/**
 * The fight state as the opponent sees it: the opponent's running state in the
 * fighter's fields, so `resolveFightStepInputs` and the advantage reads work for
 * the opponent unchanged. Never written back.
 */
export function mirrorFightState(fight: FightState, fighterId: string): FightState {
  return {
    ...fight,
    opponentId: fighterId,
    clockSize: fight.fighterClockSize ?? FIGHT_MORTAL_CLOCK,
    clockAtStart: 0,
    clockNow: fight.fighterClockNow ?? 0,
    persistent: false,
    momentum: fight.opponentMomentum ?? 0,
    advantages: fight.opponentAdvantages ?? [],
    wounds: fight.opponentWounds ?? 0,
    blowsLanded: fight.opponentBlowsLanded ?? 0,
    harmTaken: fight.opponentHarmTaken ?? 0,
    berserk: false,
  };
}

/**
 * The synthesized opponent-side action: the opponent as actor, the fighter as the
 * target (a duel step carries no `opponentRef`), no hand, and the mirrored fight
 * state. Transient — never pushed into `state.unifiedActions`.
 */
export function opponentSideAction(action: UnifiedAction, opponentId: string): UnifiedAction {
  return {
    ...action,
    actorId: opponentId,
    targetId: action.actorId,
    supportBindings: undefined,
    activeNudges: undefined,
    fightState: action.fightState ? mirrorFightState(action.fightState, action.actorId) : undefined,
  };
}

/**
 * Roll the opponent's side of one duel step. Undefined when the step is not a
 * duel step or has no mortal opponent (the fighter's roll then stands alone).
 */
export function rollOpponentSide(
  state: GameState,
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'sphereAffinity'>,
  step: ActionStep,
): OpponentFightRoll | undefined {
  const opponentId = duelOpponentId(state, action, step);
  if (!opponentId) return undefined;
  const synthAction = opponentSideAction(action, opponentId);
  const synthStep: ActionStep = { ...step, opponentRef: undefined, nudges: undefined };
  const inputs = resolveFightStepInputs(state, synthAction, synthStep, template);
  if (!inputs) return undefined;

  const graph = state.graph;
  const capability = computeCapability(graph, opponentId, inputs.reach);
  // `collectTestShapers` returns the effect layer's shaper shape, which the core
  // reads structurally — the fighter's road passes it the same way.
  const testShapers = collectTestShapers(
    graph,
    opponentId,
    inputs.reach,
    buildPredicateContext(graph, opponentId, inputs.reach, FIGHT_ENCOUNTER_TYPE),
    state.effectStates,
  ) as unknown as StepCoreInput['testShapers'];
  const core = resolveStepCore({
    actorId: opponentId,
    reach: inputs.reach,
    capability,
    difficulty: inputs.difficulty,
    scale: inputs.scale,
    actionModifiers: inputs.modifierTotal,
    testShapers,
    sphereFactor: 0,
    variancePolicy: 'agent',
    quintessencePolicy: 'none',
    tick: state.tick,
    sourceLabel: 'unified_action',
  }, opponentStream(state, action.actionId, opponentId, action.currentStep));

  return {
    opponentId,
    band: core.outcome,
    probability: core.probability,
    roll: core.roll,
    reach: inputs.reach,
    difficulty: inputs.difficulty,
    modifiers: inputs.modifiers,
  };
}
