/**
 * The Crossroads — player actions (THR-1926). Sibling of `premonitionActions.ts`.
 *
 * Called by the UI (and the debug bridge), never by the tick. **Neither function
 * touches the essence pool**: the caller spends through `spendPremonitionEssence`
 * inside its own `setGameState(prev => …)` and records the movement with
 * `withEssenceSpend(prev, pool, 'crossroads')`, as THR-1783 requires. Both write a
 * node property in place, so the caller also bumps `worldVersion` (no change detection
 * on graph identity).
 *
 * @see Docs/plans/2026-10-14-thr-1926-the-crossroads.md § Systems design
 */

import type { GameState } from '../types/gameState';
import type { CreationSphereName } from '../types';
import type { DominionBand } from '../data/dominion-content';
import { emitTrace } from './traceBuffer';
import { canReadIntention } from './intentionReading';
import { castTargetBand, dominionScaledCost } from './dominion';
import { REACH_TO_SPHERE, CROSSROADS_ENABLED } from '../data/premonition-constants';
import {
  forecastLean,
  leanBaseCost,
  readCrossroadsLean,
  readCrossroadsSnapshot,
  sameRoad,
  type CrossroadsIdentity,
  type CrossroadsLean,
  type LeanDirection,
  type LeanForecast,
} from './crossroads';
import { LEAN_PLACED_MESSAGE, LEAN_REFUSAL, LIFT_TOAST, fillCrossroadsLine } from '../data/crossroads-content';
import { crossroadsRoadName } from './crossroadsNames';

export type LeanRefusal =
  | 'disabled'
  | 'no_agent'
  | 'unthreaded'
  | 'unreadable'
  | 'no_reading'
  | 'stale_option'
  | 'held'
  | 'away_not_leader'
  /** THR-2189: away is not offered on a work — a work runs; the mortal does not reach for it. */
  | 'away_on_a_work'
  | 'unaffordable';

export interface PlaceLeanResult {
  success: boolean;
  reason?: LeanRefusal;
  lean: CrossroadsLean | null;
  /** The price after Dominion — what the caller spends. 0 on a refusal before pricing. */
  essenceCost: number;
  baseCost: number;
  sphere: CreationSphereName | null;
  dominionBand: DominionBand | null;
  forecast: LeanForecast | null;
  message: string;
}

/** Does the god hold a thread to this mortal? */
export function godThreadsMortal(state: GameState, agentId: string): boolean {
  if (!state.ascendantId) return false;
  return state.graph.getOutgoingEdges(state.ascendantId, 'thread').some(e => e.target === agentId);
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Place a lean on one road of the mortal's current reading. Refuses — writing and
 * spending nothing (Law 19) — when the Crossroads is off, the mortal is unthreaded or
 * unreadable, there is no reading, the road is not in the current reading, a lean is
 * already held, `away` names a non-leader or a work (THR-2189), or the pool cannot cover the price.
 */
export function placeCrossroadsLean(
  state: GameState,
  agentId: string,
  road: CrossroadsIdentity,
  direction: LeanDirection,
): PlaceLeanResult {
  const node = state.graph.getNode(agentId);
  const name = node?.name ?? 'them';
  const refuse = (reason: LeanRefusal, extra: Partial<PlaceLeanResult> = {}): PlaceLeanResult => ({
    success: false, reason, lean: null, essenceCost: 0, baseCost: 0, sphere: null, dominionBand: null, forecast: null,
    message: fillCrossroadsLine(LEAN_REFUSAL[reason] ?? '', { name, sphere: extra.sphere ? capitalize(extra.sphere) : '' }),
    ...extra,
  });

  if (!CROSSROADS_ENABLED) return refuse('disabled');
  if (!node) return refuse('no_agent');
  if (!godThreadsMortal(state, agentId)) return refuse('unthreaded');
  if (!canReadIntention(state, state.ascendantId, agentId).readable) return refuse('unreadable');
  const snapshot = readCrossroadsSnapshot(node.properties.crossroads);
  if (!snapshot || snapshot.options.length === 0) return refuse('no_reading');
  const rank = snapshot.options.findIndex(o => sameRoad(o, road));
  if (rank < 0) return refuse('stale_option');
  if (readCrossroadsLean(node.properties.crossroadsLean)) return refuse('held');
  if (direction === 'away' && rank !== 0) return refuse('away_not_leader');
  if (direction === 'away' && snapshot.options[rank].family === 'strategic_action') return refuse('away_on_a_work');

  const option = snapshot.options[rank];
  const sphere = REACH_TO_SPHERE[option.reach];
  const baseCost = leanBaseCost(rank, direction);
  const dominionBand = castTargetBand(state.graph, state.ascendantId, agentId);
  const essenceCost = dominionScaledCost(baseCost, dominionBand);
  const forecast = forecastLean(snapshot, { ...road, direction });
  if ((state.essencePool[sphere] ?? 0) < essenceCost) {
    return refuse('unaffordable', { essenceCost, baseCost, sphere, dominionBand, forecast });
  }

  const lean: CrossroadsLean = {
    family: option.family,
    templateId: option.templateId,
    targetId: option.targetId,
    direction,
    tick: state.tick,
    sphere,
    essencePaid: essenceCost,
    rankWhenPlaced: rank,
    forecastAtPlacement: forecast,
  };
  // Direct property write — updateNode replaces the handle (THR-1781's stale-snapshot note).
  node.properties.crossroadsLean = lean;

  const roadName = crossroadsRoadName(option);
  emitTrace({
    category: 'crossroads_lean_placed',
    tick: state.tick,
    agentId,
    family: option.family,
    templateId: option.templateId,
    targetId: option.targetId,
    direction,
    rankWhenPlaced: rank,
    forecast,
    essenceCost,
    baseCost,
    dominionBand,
    sphere,
    summary: `Crossroads: leaned ${node.name} ${direction} ${roadName} (rank ${rank}, ${forecast}, ${essenceCost} ${sphere})`,
  });

  return {
    success: true, lean, essenceCost, baseCost, sphere, dominionBand, forecast,
    message: fillCrossroadsLine(LEAN_PLACED_MESSAGE[direction], { name: node.name, road: roadName }),
  };
}

export interface LiftLeanResult {
  success: boolean;
  message: string;
}

/** Lift a held lean. No refund; the trace says `lifted`. */
export function liftCrossroadsLean(state: GameState, agentId: string): LiftLeanResult {
  const node = state.graph.getNode(agentId);
  const name = node?.name ?? 'them';
  const lean = readCrossroadsLean(node?.properties.crossroadsLean);
  if (!node || !lean) {
    return { success: false, message: fillCrossroadsLine(LEAN_REFUSAL.nothing_held, { name }) };
  }
  node.properties.crossroadsLean = undefined;
  emitTrace({
    category: 'crossroads_lean_lifted',
    tick: state.tick,
    agentId,
    templateId: lean.templateId,
    heldTicks: state.tick - lean.tick,
    summary: `Crossroads: lifted the lean on ${node.name} (${lean.templateId}), no refund`,
  });
  return { success: true, message: fillCrossroadsLine(LIFT_TOAST, { name: node.name }) };
}
