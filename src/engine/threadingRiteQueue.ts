/**
 * The pending threading rite — queue, drain and the no-hand fallback (THR-1644 S1).
 *
 * The card's thread write (`graphOpExecutor`) holds no `GameState`, so it leaves
 * a `ritePending` marker on the edge it wrote. The orchestrator's rite drain
 * (`drainThreadingRites`, phase 2a.15, right after the action phase that wrote
 * the thread) collects those markers the same tick and either:
 *
 * - queues the rite on `GameState.pendingThreadingRite` /
 *   `pendingThreadingRiteQueue` for the rite surface to open (S2), or
 * - resolves it at once as *Bond without a hand* (D6): the bond rolls on its
 *   seeded stream with no cards, and `applyThreadingRite` lands the reception.
 *   That happens while no surface exists (`RITE_SURFACE_ENABLED`, S1), when the
 *   queue is full (`RITE_QUEUE_MAX`), and when a rite is dismissed.
 *
 * The thread itself is already written before any of this runs, so no rite
 * failure can lose a thread — at worst it loses the rite's colour (NFP #4).
 * Lives apart from `threadingRite.ts` because it rolls the bond through
 * `meetingEncounter.ts`, which `graphOpExecutor`'s import path must not reach.
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import { resolveBondTest } from './meetingEncounter';
import { MEETING_BOND_TEST } from '../data/meeting-bond-test';
import { RITE_QUEUE_MAX, RITE_SURFACE_ENABLED } from '../data/threading-rite-constants';
import {
  applyThreadingRite,
  threadsBoundCount,
  type ApplyRiteResult,
  type LastRiteRecord,
  type PendingThreadingRite,
  type RiteFallbackReason,
  type RitePendingMarker,
} from './threadingRite';
import { emitTrace } from './traceBuffer';

/**
 * The rite's seed: world seed × agent × the tick the thread was written
 * (FNV-1a over the three). A reloaded game replays the same rite (NFP #3).
 */
export function riteSeed(worldSeed: number, agentId: string, tick: number): number {
  let h = 0x811c9dc5;
  const input = `${worldSeed}|${agentId}|${tick}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Collect and clear every `ritePending` marker on the god's thread edges, in
 * ordinal order. Clearing is what makes the drain run once per thread.
 */
export function collectPendingRites(graph: WorldGraph, ascendantId: string): PendingThreadingRite[] {
  const out: PendingThreadingRite[] = [];
  for (const edge of graph.getOutgoingEdges(ascendantId, 'thread')) {
    const marker = edge.properties.ritePending as RitePendingMarker | undefined;
    if (!marker || typeof marker !== 'object') continue;
    delete edge.properties.ritePending;
    out.push({ agentId: edge.target, ascendantId, ordinal: marker.ordinal, shape: marker.shape, tick: marker.tick });
  }
  return out.sort((a, b) => a.ordinal - b.ordinal || (a.agentId < b.agentId ? -1 : a.agentId > b.agentId ? 1 : 0));
}

/**
 * D6 — resolve a pending rite with no hand: the bond rolls on the rite's seed
 * with no cards played, then the one writer lands the reception. A mortal who
 * died or vanished first gets no writes; the seeded reception is still traced
 * (`agent_missing`) so the roll is inspectable.
 */
export function resolveRiteWithoutHand(
  graph: WorldGraph,
  rite: PendingThreadingRite,
  reason: RiteFallbackReason,
  worldSeed: number,
): ApplyRiteResult {
  const bondOutcome = resolveBondTest(MEETING_BOND_TEST, [], riteSeed(worldSeed, rite.agentId, rite.tick));
  return applyThreadingRite(graph, {
    agentId: rite.agentId,
    ascendantId: rite.ascendantId,
    tick: rite.tick,
    shape: rite.shape,
    ordinal: rite.ordinal,
    viaMeeting: false,
    formativeOutcomes: [],
    bondOutcome,
    handPlayed: false,
    fallbackReason: reason,
  });
}

type RiteQueueState = Pick<GameState, 'graph' | 'seed' | 'pendingThreadingRite' | 'pendingThreadingRiteQueue'>;

/**
 * Queue (or resolve) one rite. Pure over the queue fields: returns the next
 * `pendingThreadingRite` / `pendingThreadingRiteQueue`; graph writes happen only
 * on the immediate-resolution paths.
 */
export function queueThreadingRite(
  state: RiteQueueState,
  rite: PendingThreadingRite,
  surfaceEnabled = RITE_SURFACE_ENABLED,
): Pick<GameState, 'pendingThreadingRite' | 'pendingThreadingRiteQueue'> {
  const pending = state.pendingThreadingRite ?? null;
  const queue = state.pendingThreadingRiteQueue ?? [];

  const trace = (queuedBehind: number, overflowed: boolean) => emitTrace({
    category: 'rite.queued',
    tick: rite.tick,
    agentId: rite.agentId,
    summary: `rite ${rite.shape} queued for ${rite.agentId} (thread #${rite.ordinal})`
      + `${overflowed ? ' — queue full, resolved without a hand' : queuedBehind > 0 ? `, behind ${queuedBehind}` : ''}`,
    ordinal: rite.ordinal,
    shape: rite.shape,
    queuedBehind,
    overflowed,
  });

  if (!surfaceEnabled) {
    trace(0, false);
    resolveRiteWithoutHand(state.graph, rite, 'no_surface', state.seed);
    return { pendingThreadingRite: pending, pendingThreadingRiteQueue: queue };
  }
  if (pending === null) {
    trace(0, false);
    return { pendingThreadingRite: rite, pendingThreadingRiteQueue: queue };
  }
  if (queue.length < RITE_QUEUE_MAX) {
    trace(queue.length + 1, false);
    return { pendingThreadingRite: pending, pendingThreadingRiteQueue: [...queue, rite] };
  }
  trace(queue.length + 1, true);
  resolveRiteWithoutHand(state.graph, rite, 'queue_overflow', state.seed);
  return { pendingThreadingRite: pending, pendingThreadingRiteQueue: queue };
}

/**
 * Orchestrator phase 2a.15 — drain the markers the tick's thread writes left.
 * Returns the state unchanged (same reference) when nothing was pending.
 */
export function drainThreadingRites(state: GameState, surfaceEnabled = RITE_SURFACE_ENABLED): GameState {
  const rites = collectPendingRites(state.graph, state.ascendantId);
  if (rites.length === 0) return state;
  let next: GameState = state;
  for (const rite of rites) {
    next = { ...next, ...queueThreadingRite(next, rite, surfaceEnabled) };
  }
  return next;
}

/**
 * Dismiss the open rite (D6 — the player waved it through, or the surface
 * closed): resolve it without a hand and promote the next queued rite.
 * A no-op when nothing is pending.
 */
export function dismissThreadingRite(state: GameState): Pick<GameState, 'pendingThreadingRite' | 'pendingThreadingRiteQueue'> {
  const pending = state.pendingThreadingRite ?? null;
  const queue = state.pendingThreadingRiteQueue ?? [];
  if (pending === null) return { pendingThreadingRite: null, pendingThreadingRiteQueue: queue };
  resolveRiteWithoutHand(state.graph, pending, 'dismissed', state.seed);
  const [nextUp = null, ...rest] = queue;
  return { pendingThreadingRite: nextUp, pendingThreadingRiteQueue: rest };
}

/** What `window.__DEBUG.getThreadingRite()` returns. */
export interface ThreadingRiteSnapshot {
  readonly pending: PendingThreadingRite | null;
  readonly queue: readonly PendingThreadingRite[];
  readonly threadsBoundCount: number;
  readonly lastRite: LastRiteRecord | null;
}

/** Inspect the rite state. Absent GameState fields read as "no pending rite". */
export function getThreadingRiteSnapshot(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'pendingThreadingRite' | 'pendingThreadingRiteQueue'>,
): ThreadingRiteSnapshot {
  const lastRite = state.graph.getNode(state.ascendantId)?.properties.lastRite as LastRiteRecord | undefined;
  return {
    pending: state.pendingThreadingRite ?? null,
    queue: [...(state.pendingThreadingRiteQueue ?? [])],
    threadsBoundCount: threadsBoundCount(state.graph, state.ascendantId),
    lastRite: lastRite ?? null,
  };
}
