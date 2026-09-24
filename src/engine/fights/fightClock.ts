/**
 * The fight clock (THR-1538, plan doc `Docs/plans/2026-09-23-fight-block.md` §5).
 *
 * *Clock (fight)* (UL): an opponent's wear, in segments. Filled by landing blows,
 * and by spells and items through the same writer; when it is full and a blow
 * lands, the fight is won. Not the doom clock.
 *
 * Two stores:
 *  - **persistent** — a monster's clock lives on its node, in `monsterState`, so
 *    several mortals' blows add up on one beast across fights. Written here,
 *    directly.
 *  - **per-fight** — a mortal opponent's clock lives on the action, in
 *    `fightState.clockNow`, and dies with the fight. The fight handler holds the
 *    action and writes band deltas there itself (`applyPerFightClockDelta`). An
 *    effect executor holds no action, so its writes land in a **mailbox** on the
 *    opponent node, which the handler drains (`drainFightClockMailbox`).
 *
 * Recovery is lazy: `readOpponentCard` subtracts the segments recovered since the
 * last write, and this writer applies that same recovery *before* its own delta,
 * because it stamps `clockUpdatedTick` and would otherwise erase it.
 */

import type { WorldGraph } from '../graph';
import type { FightState } from '../../types/fight';
import type { FightClockTrace } from '../../types/traces/fight-traces';
import { emitTrace } from '../traceBuffer';
import { FIGHT_CLOCK_MAILBOX_PROP, FIGHT_DEFAULT_CARD } from '../../data/fight-constants';
import { recoveredSegments } from './opponentCard';

/** What one clock write did. */
export interface FightClockWrite {
  readonly before: number;
  readonly after: number;
  /** True when this write took the clock from below full to full. Traced; no ending reads it. */
  readonly filledByThisWrite: boolean;
  readonly store: FightClockTrace['store'];
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, size: number): number {
  return Math.max(0, Math.min(size, value));
}

function traceClockWrite(
  tick: number,
  opponentId: string,
  delta: number,
  write: FightClockWrite,
  cause: string,
  actionId?: string,
): void {
  emitTrace({
    category: 'fight.clock',
    tick,
    agentId: opponentId,
    opponentId,
    delta,
    before: write.before,
    after: write.after,
    filledByThisWrite: write.filledByThisWrite,
    cause,
    store: write.store,
    ...(actionId ? { actionId } : {}),
    summary: `fight.clock: ${opponentId} ${write.before}→${write.after} (${delta >= 0 ? '+' : ''}${delta}, ${cause}, ${write.store})`
      + (write.filledByThisWrite ? ' [full]' : ''),
  } as FightClockTrace);
}

/**
 * **The one clock writer** (plan doc §5). A persistent clock (the opponent carries
 * `monsterState`) is written on the node, recovery first, clamped to
 * `[0, clockSize]`, and stamped. A per-fight clock is written to the node's
 * mailbox for the fight handler to drain.
 *
 * Returns undefined for a missing node (fail-soft). Never throws.
 */
export function advanceFightClock(
  graph: WorldGraph,
  opponentId: string,
  delta: number,
  cause: string,
  tick: number,
  actionId?: string,
): FightClockWrite | undefined {
  const node = graph.getNode(opponentId);
  if (!node || !Number.isFinite(delta)) return undefined;

  const bag = node.properties.monsterState;
  if (bag && typeof bag === 'object') {
    const card = bag as Record<string, unknown>;
    const size = Math.max(1, Math.floor(finiteOr(card.clockSize, FIGHT_DEFAULT_CARD.clockSize)));
    const recovered = recoveredSegments(
      tick,
      typeof card.clockUpdatedTick === 'number' ? card.clockUpdatedTick : undefined,
    );
    const before = clamp(finiteOr(card.clockFilled, 0) - recovered, size);
    const after = clamp(before + delta, size);
    node.properties.monsterState = { ...card, clockFilled: after, clockUpdatedTick: tick };
    const write: FightClockWrite = {
      before, after, filledByThisWrite: before < size && after >= size, store: 'monsterState',
    };
    traceClockWrite(tick, opponentId, delta, write, cause, actionId);
    return write;
  }

  const pending = finiteOr(node.properties[FIGHT_CLOCK_MAILBOX_PROP], 0);
  node.properties[FIGHT_CLOCK_MAILBOX_PROP] = pending + delta;
  const write: FightClockWrite = {
    before: pending, after: pending + delta, filledByThisWrite: false, store: 'mailbox',
  };
  traceClockWrite(tick, opponentId, delta, write, cause, actionId);
  return write;
}

/**
 * A per-fight clock's band delta, applied by the handler that holds the action.
 * Returns the fight state with the new `clockNow`, and traces the write.
 */
export function applyPerFightClockDelta(
  fightState: FightState,
  delta: number,
  cause: string,
  tick: number,
  actionId: string,
): { fightState: FightState; write: FightClockWrite } {
  const before = fightState.clockNow;
  const after = clamp(before + delta, fightState.clockSize);
  const write: FightClockWrite = {
    before, after, filledByThisWrite: before < fightState.clockSize && after >= fightState.clockSize, store: 'fightState',
  };
  if (fightState.opponentId) traceClockWrite(tick, fightState.opponentId, delta, write, cause, actionId);
  return { fightState: { ...fightState, clockNow: after }, write };
}

/**
 * Drain a per-fight opponent's mailbox: return the pending delta and delete the
 * property. Zero when nothing is waiting.
 */
export function drainFightClockMailbox(graph: WorldGraph, opponentId: string): number {
  const node = graph.getNode(opponentId);
  if (!node || !(FIGHT_CLOCK_MAILBOX_PROP in node.properties)) return 0;
  const pending = finiteOr(node.properties[FIGHT_CLOCK_MAILBOX_PROP], 0);
  delete node.properties[FIGHT_CLOCK_MAILBOX_PROP];
  return pending;
}

/**
 * Clear a mailbox left over from an earlier fight (fail-soft table), at a new
 * fight's start and before its nerve step's raises, so a write made during this
 * fight is never wiped as stale. Traced with cause `stale_cleared`.
 */
export function clearStaleFightClockMailbox(
  graph: WorldGraph,
  opponentId: string,
  tick: number,
  actionId: string,
): void {
  const node = graph.getNode(opponentId);
  if (!node || !(FIGHT_CLOCK_MAILBOX_PROP in node.properties)) return;
  const stale = finiteOr(node.properties[FIGHT_CLOCK_MAILBOX_PROP], 0);
  delete node.properties[FIGHT_CLOCK_MAILBOX_PROP];
  traceClockWrite(tick, opponentId, -stale, {
    before: stale, after: 0, filledByThisWrite: false, store: 'mailbox',
  }, 'stale_cleared', actionId);
}
