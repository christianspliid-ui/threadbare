/**
 * What felling a monster does to its lair (THR-1546, plan doc
 * `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 5, slice M3).
 *
 * The monster branch of the post-fight dispatcher (`fights/fightOutcome.ts`). It runs
 * for every fight whose opponent satisfies `isMonster`, and does nothing otherwise.
 *
 * | Result      | Writes |
 * |-------------|--------|
 * | `overcome`  | The death funnel (`cause: 'fight'`, retained). **Only on `died`**, the lair: at major `clearLair` credited to the victor's faction, then `touchStructure`; at legendary `clearingProgress += MONSTER_FELLED_CLEARING_PRESSURE × LAIR_CLEARING_RESISTANCE.legendary`, the monster faction stays and `namedEliteId` is cleared |
 * | `overcome`, funnel `warded` / `echo` / `not_a_mortal` | Nothing to the lair — no second clearing credit |
 * | `driven_off`| `clearingProgress += MONSTER_DRIVEN_OFF_CLEARING_PROGRESS` |
 * | anything else | Nothing |
 *
 * Every monster result that reaches a write records it as `fightState.lairOutcome`, so
 * plan doc 4's "felled" / "lair cleared" chips read state, never the trace buffer (Law 56).
 * What happens to the *fighter* is plan doc 1's.
 *
 * `clearLair` is THR-1319's writer; this module never writes `cleared_lair` itself.
 * `clearLair` does not bump `structuralCacheVersion`, and the escalation phase that
 * usually does is not running here, so the `touchStructure` after it is this branch's.
 *
 * A lair counts only while it is an active `lair` whose `namedEliteId` still names this
 * monster: a den already cleared by a presence press, or reinfested under a new elite,
 * takes no credit from the old beast's death.
 *
 * NFP #1: both amounts are named constants in `data/monster-families.ts`.
 * NFP #2: `monster.felled` / `monster.driven_off` traces; `lairOutcome` on the action.
 * NFP #3: no randomness.
 * NFP #4: a missing monster, lair or tier skips the lair write; a throwing `clearLair`
 * is caught, credits nothing, and is traced.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { LairTier } from '../../types/monster';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { FightLairOutcome } from '../../types/fight';
import type { MonsterDrivenOffTrace, MonsterFelledTrace } from '../../types/traces/monster-traces';
import type { FightEndBranch, FightEndContext } from '../fights/fightOutcome';
import {
  MONSTER_DRIVEN_OFF_CLEARING_PROGRESS,
  MONSTER_FELLED_CLEARING_PRESSURE,
} from '../../data/monster-families';
import { markMortalDead } from '../agentLifecycle';
import { clearLair, clearingCreditFactionOf, LAIR_CLEARING_RESISTANCE } from '../lairClearing';
import { touchStructure, touchWorld } from '../simulationRuntime';
import { emitTrace } from '../traceBuffer';
import { isMonster } from './isMonster';

/**
 * The monster's lair, when it is still the active den this monster holds. Resolved from
 * the `lairId` `createNamedElite` writes on the elite. Undefined otherwise (fail-soft).
 */
export function resolveHeldLair(state: GameState, monster: GraphNode): GraphNode | undefined {
  const lairId = monster.properties.lairId as string | undefined;
  if (!lairId) return undefined;
  const lair = state.graph.getNode(lairId);
  if (!lair || lair.properties.locationSubtype !== 'lair') return undefined;
  if (lair.properties.namedEliteId !== monster.id) return undefined;
  return lair;
}

function progressOf(lair: GraphNode): number {
  return (lair.properties.clearingProgress as number | undefined) ?? 0;
}

/** Add clearing progress to a still-standing lair and return the new total. */
function addClearingProgress(
  state: GameState,
  lair: GraphNode,
  amount: number,
  extra: Record<string, unknown>,
  ctx: FightEndContext,
): number {
  const after = progressOf(lair) + amount;
  state.graph.updateNode(lair.id, { properties: { clearingProgress: after, ...extra } });
  if (ctx.runtime) touchWorld(ctx.runtime);
  return after;
}

function fell(
  state: GameState,
  action: UnifiedAction,
  monster: GraphNode,
  ctx: FightEndContext,
): FightLairOutcome {
  const fighterId = action.actorId;
  // Resolved before the funnel runs: the death writes nothing to the lair, but the
  // held-lair test must see the monster as it stood when the fight ended.
  const lair = resolveHeldLair(state, monster);
  const lairTier: LairTier | 'none' = (lair?.properties.lairTier as LairTier | undefined) ?? 'none';

  const death = markMortalDead(
    state.graph,
    monster.id,
    ctx.tick,
    { cause: 'fight', byActorId: fighterId, mode: 'retain' },
    ctx.runtime,
    ctx.overrideCtx,
  );

  let lairCleared = false;
  let clearError: string | undefined;
  let progressAfter = lair ? progressOf(lair) : 0;

  if (death.outcome === 'died' && lair) {
    if (lairTier === 'legendary') {
      // The den outlives its beast; the faction remains. The empty throne is recorded.
      progressAfter = addClearingProgress(
        state,
        lair,
        MONSTER_FELLED_CLEARING_PRESSURE * LAIR_CLEARING_RESISTANCE.legendary,
        { namedEliteId: undefined },
        ctx,
      );
    } else {
      try {
        clearLair(state, lair, clearingCreditFactionOf(state.graph, fighterId));
        lairCleared = true;
        progressAfter = 0;
        // The subtype moved outside the escalation phase that normally bumps this.
        if (ctx.runtime) touchStructure(ctx.runtime);
      } catch (err) {
        clearError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  const felled = death.outcome === 'died';
  const lairId = lair?.id ?? ((monster.properties.lairId as string | undefined) ?? '');
  emitTrace({
    category: 'monster.felled',
    tick: ctx.tick,
    agentId: fighterId,
    monsterId: monster.id,
    lairId,
    byActorId: fighterId,
    lairTier,
    funnel: death.outcome,
    lairCleared,
    clearingProgressAfter: progressAfter,
    ...(clearError ? { clearError } : {}),
    summary: `monster.felled: ${monster.id} by ${fighterId} — funnel ${death.outcome}`
      + (lair
        ? `, lair ${lair.id} (${lairTier}) ${lairCleared ? 'cleared' : `progress ${progressAfter}`}`
        : ', no held lair')
      + (clearError ? ` [clear error: ${clearError}]` : ''),
  } as MonsterFelledTrace);

  return {
    lairId,
    felled,
    lairCleared,
    ...(lair && felled && !clearError ? { clearingProgressAfter: progressAfter } : {}),
  };
}

function driveOff(
  state: GameState,
  action: UnifiedAction,
  monster: GraphNode,
  ctx: FightEndContext,
): FightLairOutcome | undefined {
  const lair = resolveHeldLair(state, monster);
  if (!lair) return undefined;
  const after = addClearingProgress(state, lair, MONSTER_DRIVEN_OFF_CLEARING_PROGRESS, {}, ctx);
  emitTrace({
    category: 'monster.driven_off',
    tick: ctx.tick,
    agentId: action.actorId,
    monsterId: monster.id,
    lairId: lair.id,
    byActorId: action.actorId,
    clearingProgressAfter: after,
    summary: `monster.driven_off: ${monster.id} by ${action.actorId} — lair ${lair.id} progress ${after}`,
  } as MonsterDrivenOffTrace);
  return { lairId: lair.id, felled: false, lairCleared: false, clearingProgressAfter: after };
}

/** The dispatcher branch (registered in `FIGHT_END_BRANCHES`). */
export const monsterLairBranch: FightEndBranch = (state, action, ctx) => {
  const fight = action.fightState;
  if (!fight?.opponentId) return;
  const monster = state.graph.getNode(fight.opponentId);
  if (!isMonster(monster)) return;

  let lairOutcome: FightLairOutcome | undefined;
  if (fight.result === 'overcome') lairOutcome = fell(state, action, monster!, ctx);
  else if (fight.result === 'driven_off') lairOutcome = driveOff(state, action, monster!, ctx);
  return lairOutcome ? { patch: { lairOutcome } } : undefined;
};
