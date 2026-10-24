/**
 * The crown — wages (THR-1974). Who pays an army's soldiers, read off the graph.
 *
 * Plan: `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md`. Decision: THR-1939
 * (a hire is the crown's bought oath; no new edge, no contract system).
 *
 * The `crown` phase's wage step (`crown.ts`) is the only writer of
 * `armyState.liegePaidTick`. Everything here is a pure read: an army whose stamp is
 * fresh (within LIEGE_COMMAND_WINDOW_TICKS) and whose faction still has a live
 * `sworn_to` edge is paid by that edge's target. The liege is never stored on the army
 * (relationships are edges): an oath that breaks inside the window ends the command at
 * once, because the edge is gone.
 *
 * NFP #4: a missing army, faction or edge answers "no liege"; nothing throws.
 */

import type { WorldGraph } from '../graph';
import type { ArmyState } from '../../types/army';
import { CROWN_ENABLED, CROWN_WAGES_ENABLED, LIEGE_COMMAND_WINDOW_TICKS } from '../../data/crown-constants';
import { FACTION_PURSE_ENABLED } from '../../data/faction-purse-constants';

let warnedOff = false;

/** The wage rules run only with the crown and the purse (plan § Fail-soft). */
export function crownWagesActive(): boolean {
  if (!CROWN_WAGES_ENABLED) return false;
  if (!CROWN_ENABLED || !FACTION_PURSE_ENABLED) {
    if (!warnedOff) {
      warnedOff = true;
      console.warn('[crown] the crown or the faction purse is off; liege wages are disabled');
    }
    return false;
  }
  return true;
}

/** The faction an army belongs to (`member_of`). */
export function ownFactionOf(graph: WorldGraph, armyId: string): string | undefined {
  return graph.getOutgoingEdges(armyId, 'member_of')[0]?.target;
}

/** Whether a `liegePaidTick` stamp still holds at `tick`. */
export function isWageFresh(liegePaidTick: unknown, tick: number): boolean {
  return typeof liegePaidTick === 'number'
    && Number.isFinite(liegePaidTick)
    && tick - liegePaidTick >= 0
    && tick - liegePaidTick <= LIEGE_COMMAND_WINDOW_TICKS;
}

/**
 * The liege paying this army's soldiers at `tick`: the target of its faction's live
 * `sworn_to` edge while the army's wage stamp is fresh. Undefined otherwise, and always
 * undefined with the wage rules off (stamps already on armies are ignored).
 */
export function payingLiegeOf(graph: WorldGraph, armyId: string, tick: number): string | undefined {
  if (!crownWagesActive()) return undefined;
  const as = graph.getNode(armyId)?.properties.armyState as ArmyState | undefined;
  if (!as || !isWageFresh(as.liegePaidTick, tick)) return undefined;
  const own = ownFactionOf(graph, armyId);
  if (!own) return undefined;
  const liege = graph.getOutgoingEdges(own, 'sworn_to')[0]?.target;
  return liege && liege !== own && graph.getNode(liege) ? liege : undefined;
}
