/**
 * The post-fight dispatcher (THR-1538, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §6, "The post-fight dispatcher").
 *
 * `onFightEnded` is **the single place** a fight's result turns into world writes.
 * FB2 shipped it with no branches; plan doc 1 adds the defeat faces and victory yields,
 * plan doc 3 the monster and lair writes, plan doc 5 a duel's other side — each as
 * one entry in `FIGHT_END_BRANCHES`, so no later slice invents its own hook.
 *
 * A branch returns a **patch** (`ending`, `opponentEnding`, `lairOutcome`) because
 * `FightState` is readonly; the dispatcher merges the patches in branch order into
 * the `fightState` it returns, and the call site writes that onto the resolved
 * action before the aftermath is built. That is what makes plan doc 4's chips
 * state-backed (Law 56): the record of what a branch wrote lives on the action.
 *
 * `finalizeFightEnd` is the call site both routes share — the rolled step (after
 * `advanceStep`) and the no-roll end. It writes the result memory, runs the
 * dispatcher, and emits exactly one `fight.end`. A fight cannot reach it twice: a
 * set result resolves the action in the same step.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { FightState } from '../../types/fight';
import type { FightEndTrace } from '../../types/traces/fight-traces';
import type { SimulationRuntime } from '../simulationRuntime';
import type { RuleOverrideContext } from '../effects/ruleOverrideConsumers';
import { emitTrace } from '../traceBuffer';
import { withFightResultMemory } from './fightState';
import { monsterLairBranch } from '../monsters/monsterFelling';
import { fighterEndingBranch } from './fightEnding';

/** What a dispatcher branch is handed (plan doc §6). */
export interface FightEndContext {
  readonly tick: number;
  /** The step's seeded resolution rng (NFP #3). */
  readonly rng: () => number;
  /** For `touchWorld` / `touchStructure` after world writes. */
  readonly runtime?: SimulationRuntime;
  /** For `markMortalDead`'s `death_prevented` ward. */
  readonly overrideCtx: RuleOverrideContext;
}

/** The records a branch may write onto the resolved fight (FB2 declares them all). */
export type FightEndPatch = Partial<Pick<FightState, 'ending' | 'opponentEnding' | 'lairOutcome'>>;

/** One consequence of a fight's end. Returns its patch and any tick events. */
export type FightEndBranch = (
  state: GameState,
  action: UnifiedAction,
  ctx: FightEndContext,
) => { patch?: FightEndPatch; events?: readonly TickEvent[] } | void;

/** What `onFightEnded` hands back to its call site. */
export interface FightEndedResult {
  readonly events: TickEvent[];
  readonly fightState: FightState;
}

/**
 * The branches that ship with the engine, in run order. Plan docs 1, 3 and 5 add
 * theirs here (THR-1548, THR-1546, THR-1557 and siblings).
 *
 * - `fighterEndingBranch` (THR-1548): what the ending leaves on the fighter — the
 *   defeat faces, the death gate, Scarred, the grudge, humiliation. First, so the
 *   fighter's record is written before any opponent-side branch reads the action.
 * - `monsterLairBranch` (THR-1546): felling or driving off a lair's monster.
 */
export const DEFAULT_FIGHT_END_BRANCHES: readonly FightEndBranch[] = [fighterEndingBranch, monsterLairBranch];

/** The live branch list `onFightEnded` runs by default. Tests may push onto it. */
export const FIGHT_END_BRANCHES: FightEndBranch[] = [...DEFAULT_FIGHT_END_BRANCHES];

/** Restore `FIGHT_END_BRANCHES` to the shipped defaults (test hygiene). */
export function resetFightEndBranches(): void {
  FIGHT_END_BRANCHES.splice(0, FIGHT_END_BRANCHES.length, ...DEFAULT_FIGHT_END_BRANCHES);
}

/**
 * Turn a fight's result into world writes. Runs every branch in order and merges
 * each branch's patch into the returned `fightState`. A branch that throws stops
 * the dispatch (no partial retry) and rethrows, so the call site can trace the
 * error on `fight.end` while the action stays resolved.
 */
export function onFightEnded(
  state: GameState,
  action: UnifiedAction,
  ctx: FightEndContext,
  branches: readonly FightEndBranch[] = FIGHT_END_BRANCHES,
): FightEndedResult {
  const events: TickEvent[] = [];
  let fightState = action.fightState as FightState;
  for (const branch of branches) {
    const out = branch(state, { ...action, fightState }, ctx);
    if (!out) continue;
    if (out.patch) fightState = { ...fightState, ...out.patch };
    if (out.events) events.push(...out.events);
  }
  return { events, fightState };
}

function emitFightEnd(
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'id'>,
  fight: FightState,
  tick: number,
  rolled: boolean,
  dispatchError?: string,
): void {
  emitTrace({
    category: 'fight.end',
    tick,
    agentId: action.actorId,
    actionId: action.actionId,
    templateId: template.id,
    fighterId: action.actorId,
    opponentId: fight.opponentId,
    result: fight.result!,
    ...(fight.endReason ? { endReason: fight.endReason } : {}),
    rolled,
    exchanges: fight.exchanges,
    clockAtStart: fight.clockAtStart,
    clockNow: fight.clockNow,
    harmTaken: fight.harmTaken,
    advantages: fight.advantages.map((a) => a.key),
    ...(dispatchError ? { dispatchError } : {}),
    // THR-1556 (duels) — the opponent side, on a duel only.
    ...(fight.fightMode === 'agent' ? {
      fightMode: 'agent' as const,
      fighterClockNow: fight.fighterClockNow ?? 0,
      ...(fight.opponentLoss ? { opponentLoss: fight.opponentLoss } : {}),
    } : {}),
    summary: `fight.end: ${template.id} ${action.actorId} vs ${fight.opponentId ?? 'none'} → ${fight.result}`
      + `${fight.endReason ? ` (${fight.endReason})` : ''}${rolled ? '' : ' [no roll]'}`
      + ` clock ${fight.clockNow}/${fight.clockSize}`
      + (fight.fightMode === 'agent'
        ? ` vs ${fight.fighterClockNow ?? 0}/${fight.fighterClockSize ?? 0}${fight.opponentLoss ? ` (opponent ${fight.opponentLoss})` : ''}`
        : '')
      + `${dispatchError ? ` [dispatch error: ${dispatchError}]` : ''}`,
  } as FightEndTrace);
}

/**
 * The call site both routes share (plan doc §6). Given a resolved action whose
 * `fightState.result` is set: writes the result memory at `fightResultIndex`,
 * runs `onFightEnded`, writes its `fightState` onto the action, and emits one
 * `fight.end`. A dispatcher that throws is caught here (fail-soft table): the
 * action stays resolved and `fight.end` carries `dispatchError`.
 *
 * No-op for an action without a fight result.
 */
export function finalizeFightEnd(
  state: GameState,
  action: UnifiedAction,
  template: Pick<UnifiedActionTemplate, 'id' | 'steps'>,
  ctx: FightEndContext,
  rolled: boolean,
): { action: UnifiedAction; events: TickEvent[] } {
  if (!action.fightState?.result) return { action, events: [] };
  const withMemory = withFightResultMemory(action, template, ctx.tick);
  try {
    const out = onFightEnded(state, withMemory, ctx);
    const finished = { ...withMemory, fightState: out.fightState };
    emitFightEnd(finished, template, out.fightState, ctx.tick, rolled);
    return { action: finished, events: out.events };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitFightEnd(withMemory, template, withMemory.fightState!, ctx.tick, rolled, message);
    return { action: withMemory, events: [] };
  }
}
