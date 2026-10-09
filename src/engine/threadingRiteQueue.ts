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
import type { GameState, TickEvent } from '../types/gameState';
import type { BondOutcome, BondTest, DilemmaInstance, FormativeOutcome, FormativeTest } from '../types/meetingEncounter';
import type { ReachDomain } from '../types/traits';
import { REACH_VALUE_PAIR } from '../types/agent';
import type { BondReception } from '../data/meeting-nudge-constants';
import { resolveBondTest, selectDilemmasScored } from './meetingEncounter';
import { MEETING_BOND_TEST } from '../data/meeting-bond-test';
import { ENRICHED_DILEMMA_LIBRARY } from '../data/meeting-dilemma-library';
import {
  RITE_BOND_ONLY_HAND_SIZE,
  RITE_EXISTING_MORTAL_SHIFT_SCALE,
  RITE_FULL_TEST_COUNT_CARD_ROUTE,
  RITE_QUEUE_MAX,
  RITE_SHORT_TEST_COUNT,
  RITE_SURFACE_ENABLED,
} from '../data/threading-rite-constants';
import {
  RITE_BOND_GOD_VOICE,
  firstClaimedMessage,
  riteChronicleLine,
  riteChronicleMissingLine,
  riteChronicleNoHandLine,
  riteChronicleOverflowLine,
} from '../data/threading-rite-prose';
import {
  applyThreadingRite,
  candidateFromAgent,
  threadsBoundCount,
  type RiteShape,
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
export function drainThreadingRites(
  state: GameState,
  // A rite waits only where a surface can open it: the switch is on AND this
  // session mounted one. The CLI and headless runs resolve at once, no hand.
  surfaceEnabled = RITE_SURFACE_ENABLED && state.riteSurfaceMounted === true,
): GameState {
  const rites = collectPendingRites(state.graph, state.ascendantId);
  if (rites.length === 0) return state;
  let next: GameState = state;
  const events: TickEvent[] = [];
  for (const rite of rites) {
    const pending = next.pendingThreadingRite ?? null;
    const queued = next.pendingThreadingRiteQueue ?? [];
    // Mirrors `queueThreadingRite`'s branches: these two resolve on the spot,
    // so the chronicle has to say so — the player never saw a rite for them.
    const resolvedNow = !surfaceEnabled || (pending !== null && queued.length >= RITE_QUEUE_MAX);
    next = { ...next, ...queueThreadingRite(next, rite, surfaceEnabled) };
    const name = agentName(next.graph, rite.agentId);
    // D3 — the card route names a First: the meeting's own event, word for word.
    if (rite.shape === 'full_no_sensing') {
      events.push(riteChronicleEvent(rite, firstClaimedMessage(name), 'first', 1.0));
    }
    if (resolvedNow) {
      const reception = receptionOf(next.graph, next.ascendantId, rite.agentId);
      if (reception) {
        const message = surfaceEnabled
          ? riteChronicleOverflowLine(name, reception)
          : riteChronicleNoHandLine(name, reception);
        events.push(riteChronicleEvent(rite, message, 'auto'));
      }
    }
  }
  if (events.length === 0) return next;
  return { ...next, recentEvents: [...(next.recentEvents ?? []).slice(-(100 - events.length)), ...events] };
}

// ─── Closing a rite (S2 — THR-1754) ───────────────────────────────

/** How the open rite ended. */
export type RiteClose =
  | {
      /** The player played it through: tests (maybe none), then the bond hand. */
      readonly kind: 'played';
      readonly formativeOutcomes: readonly FormativeOutcome[];
      readonly bondOutcome: BondOutcome;
      /** The spark the player chose — a card-route First's rite only. */
      readonly spark?: { readonly reach: ReachDomain; readonly amount: number };
      /** The shape actually played, when the plan degraded it (`planThreadingRite`). */
      readonly shape?: RiteShape;
      /**
       * `false` when the player reached the bond and chose *Bond without a hand*:
       * the tests and spark stand, but the bond rolled with no cards (D6), so the
       * trace and chronicle must say no hand was played. Absent = played.
       */
      readonly handPlayed?: boolean;
    }
  | {
      /** *Bond without a hand* / Escape (`dismissed`), or the mortal is gone (`agent_missing`). */
      readonly kind: 'no_hand';
      readonly reason: 'dismissed' | 'agent_missing';
    };

export interface RiteCloseResult extends Pick<GameState, 'pendingThreadingRite' | 'pendingThreadingRiteQueue'> {
  /** What the one writer did; `null` when nothing was pending. */
  readonly result: ApplyRiteResult | null;
  /** The rite's one chronicle line (PC-5: one fact told once); `null` when nothing was pending. */
  readonly event: TickEvent | null;
}

/**
 * Close the open rite and promote the next queued one. Every path lands through
 * the one writer (D1): a played rite with the hand's outcomes at
 * `RITE_EXISTING_MORTAL_SHIFT_SCALE`, a waved-through one with the seeded no-hand
 * bond. A no-op when nothing is pending.
 */
export function closeThreadingRite(
  state: Pick<GameState, 'graph' | 'seed' | 'pendingThreadingRite' | 'pendingThreadingRiteQueue'>,
  close: RiteClose,
): RiteCloseResult {
  const pending = state.pendingThreadingRite ?? null;
  const queue = state.pendingThreadingRiteQueue ?? [];
  if (pending === null) {
    return { pendingThreadingRite: null, pendingThreadingRiteQueue: [...queue], result: null, event: null };
  }

  const name = agentName(state.graph, pending.agentId);
  let result: ApplyRiteResult;
  let message: string;
  if (close.kind === 'played') {
    const handPlayed = close.handPlayed !== false;
    result = applyThreadingRite(state.graph, {
      agentId: pending.agentId,
      ascendantId: pending.ascendantId,
      tick: pending.tick,
      shape: close.shape ?? pending.shape,
      ordinal: pending.ordinal,
      viaMeeting: false,
      formativeOutcomes: close.formativeOutcomes,
      bondOutcome: close.bondOutcome,
      ...(close.spark ? { spark: close.spark, markReach: close.spark.reach } : {}),
      shiftScale: RITE_EXISTING_MORTAL_SHIFT_SCALE,
      handPlayed,
      ...(handPlayed ? {} : { fallbackReason: 'dismissed' as const }),
    });
    message = !result.applied
      ? riteChronicleMissingLine(name)
      : handPlayed
        ? riteChronicleLine(name, close.bondOutcome.reception)
        : riteChronicleNoHandLine(name, close.bondOutcome.reception);
  } else {
    result = resolveRiteWithoutHand(state.graph, pending, close.reason, state.seed);
    message = result.applied && result.reception
      ? riteChronicleNoHandLine(name, result.reception)
      : riteChronicleMissingLine(name);
  }

  const [nextUp = null, ...rest] = queue;
  return {
    pendingThreadingRite: nextUp,
    pendingThreadingRiteQueue: rest,
    result,
    event: riteChronicleEvent(pending, message, 'close'),
  };
}

/**
 * Dismiss the open rite (D6 — the player waved it through, or the surface
 * closed): resolve it without a hand and promote the next queued rite.
 * A no-op when nothing is pending. `closeThreadingRite` is the same path with
 * the chronicle line attached.
 */
export function dismissThreadingRite(state: GameState): Pick<GameState, 'pendingThreadingRite' | 'pendingThreadingRiteQueue'> {
  const { pendingThreadingRite, pendingThreadingRiteQueue } = closeThreadingRite(state, { kind: 'no_hand', reason: 'dismissed' });
  return { pendingThreadingRite, pendingThreadingRiteQueue };
}

/** True when the pending rite's mortal is dead or gone — the surface resolves it as `agent_missing`. */
export function isRiteAgentMissing(graph: WorldGraph, rite: PendingThreadingRite): boolean {
  const props = graph.getNode(rite.agentId)?.properties;
  return !props || props.deceased === true || props.status === 'dead';
}

// ─── Planning the rite on screen (S2) ─────────────────────────────

/** A converted meeting test the rite plays, in the shape `FormativeTestBeat` takes. */
export interface RiteTestPick {
  readonly instance: DilemmaInstance;
  readonly test: FormativeTest;
}

export interface RitePlan {
  /** The shape the surface plays — `short` degrades to `bond_only` when no test fits. */
  readonly shape: RiteShape;
  readonly tests: readonly RiteTestPick[];
  /** True when the short rite found no test for the mortal's primary reach. */
  readonly degraded: boolean;
  /** Base seed for the rite's rolls: tests `seed + i`, the bond `seed + RITE_BOND_SEED_OFFSET`. */
  readonly seed: number;
}

/** The bond's offset from the rite seed — past any test index. */
export const RITE_BOND_SEED_OFFSET = 16;

/**
 * Plan what the rite plays (D2, plan § Resolution logic). Deterministic: the
 * draw runs on the rite's own seed, so a reload replays the same tests.
 *
 * - `short`: one converted test drawn with the meeting's slot-1 predicate (the
 *   mortal's primary reach's value pair). None → degrades to `bond_only`, traced.
 * - `full_no_sensing`: up to `RITE_FULL_TEST_COUNT_CARD_ROUTE` converted tests.
 * - `bond_only` / `full_meeting`: no tests here.
 */
export function planThreadingRite(graph: WorldGraph, rite: PendingThreadingRite, worldSeed: number): RitePlan {
  const seed = riteSeed(worldSeed, rite.agentId, rite.tick);
  if (rite.shape !== 'short' && rite.shape !== 'full_no_sensing') {
    return { shape: rite.shape, tests: [], degraded: false, seed };
  }
  const candidate = candidateFromAgent(graph, rite.agentId);
  let converted: RiteTestPick[] = [];
  if (candidate) {
    const locationId = graph.getOutgoingEdges(rite.agentId, 'located_at')[0]?.target;
    const subtype = (locationId ? graph.getNode(locationId)?.properties.locationSubtype : undefined) as string | undefined;
    try {
      const { dilemmas } = selectDilemmasScored(
        [...ENRICHED_DILEMMA_LIBRARY],
        candidate.primaryReach,
        candidate.secondaryReach,
        candidate.sphere,
        candidate.archetypeId,
        subtype ?? 'village',
        seed + 1,
      );
      converted = dilemmas
        .filter((d): d is DilemmaInstance & { test: FormativeTest } => d.test != null)
        .map(instance => ({ instance, test: instance.test }));
    } catch {
      converted = []; // fail-soft: the rite degrades, it never blocks the bond
    }
  }

  if (rite.shape === 'full_no_sensing') {
    return { shape: rite.shape, tests: converted.slice(0, RITE_FULL_TEST_COUNT_CARD_ROUTE), degraded: false, seed };
  }

  const pair = candidate ? REACH_VALUE_PAIR[candidate.primaryReach] : undefined;
  const slotOne = converted.filter(c => c.instance.category === 'axiological' && c.test.valuePair === pair);
  if (slotOne.length === 0) {
    emitTrace({
      category: 'rite.degraded',
      tick: rite.tick,
      agentId: rite.agentId,
      summary: `rite short for ${rite.agentId} degraded to bond_only — no converted test for ${candidate?.primaryReach ?? 'an unknown reach'}`,
      from: 'short',
      to: 'bond_only',
      primaryReach: candidate?.primaryReach ?? null,
    });
    return { shape: 'bond_only', tests: [], degraded: true, seed };
  }
  return { shape: 'short', tests: slotOne.slice(0, RITE_SHORT_TEST_COUNT), degraded: false, seed };
}

/**
 * The bond-only rite's bond test: the meeting's own bond test, word for word
 * (bar the god voice), with its hand cut to the first `RITE_BOND_ONLY_HAND_SIZE` cards ("Still the
 * room", "Say their name").
 */
export const RITE_BOND_ONLY_TEST: BondTest = {
  ...MEETING_BOND_TEST,
  godVoiceByHunger: {},
  godVoiceFallback: RITE_BOND_GOD_VOICE,
  nudges: MEETING_BOND_TEST.nudges.slice(0, RITE_BOND_ONLY_HAND_SIZE),
};

/**
 * The short and full rites' bond test: the meeting's, word for word, with the
 * rite's own god voice (the meeting's per-Hunger lines speak of a first soul).
 */
export const RITE_BOND_TEST: BondTest = {
  ...MEETING_BOND_TEST,
  godVoiceByHunger: {},
  godVoiceFallback: RITE_BOND_GOD_VOICE,
};

// ─── Helpers ──────────────────────────────────────────────────────

function agentName(graph: WorldGraph, agentId: string): string {
  return graph.getNode(agentId)?.name ?? agentId;
}

function receptionOf(graph: WorldGraph, ascendantId: string, agentId: string): BondReception | undefined {
  const edge = graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId);
  return edge?.properties.bondReception as BondReception | undefined;
}

function riteChronicleEvent(rite: PendingThreadingRite, message: string, kind: string, significance = 0.7): TickEvent {
  return {
    id: `evt_rite_${kind}_${rite.agentId}_${rite.tick}`,
    tick: rite.tick,
    type: 'narrative',
    message,
    significance,
    actorId: rite.agentId,
  };
}

/** One thread row for inspection — the DebugPanel's thread fields, through the bridge. */
export interface RiteThreadRow {
  readonly agentId: string;
  readonly name: string;
  readonly courtPosition: string | null;
  readonly riteShape: RiteShape | null;
  readonly bondReception: BondReception | null;
}

/** What `window.__DEBUG.getThreadingRite()` returns. */
export interface ThreadingRiteSnapshot {
  readonly pending: PendingThreadingRite | null;
  readonly queue: readonly PendingThreadingRite[];
  readonly threadsBoundCount: number;
  readonly lastRite: LastRiteRecord | null;
  /** Every thread from the god, with its rite shape and bond reception (S2). */
  readonly threads: readonly RiteThreadRow[];
}

/** Inspect the rite state. Absent GameState fields read as "no pending rite". */
export function getThreadingRiteSnapshot(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'pendingThreadingRite' | 'pendingThreadingRiteQueue'>,
): ThreadingRiteSnapshot {
  const lastRite = state.graph.getNode(state.ascendantId)?.properties.lastRite as LastRiteRecord | undefined;
  const threads: RiteThreadRow[] = state.graph.getOutgoingEdges(state.ascendantId, 'thread').map(e => ({
    agentId: e.target,
    name: agentName(state.graph, e.target),
    courtPosition: (e.properties.courtPosition as string | undefined) ?? null,
    riteShape: (e.properties.riteShape as RiteShape | undefined) ?? null,
    bondReception: (e.properties.bondReception as BondReception | undefined) ?? null,
  }));
  return {
    pending: state.pendingThreadingRite ?? null,
    queue: [...(state.pendingThreadingRiteQueue ?? [])],
    threadsBoundCount: threadsBoundCount(state.graph, state.ascendantId),
    lastRite: lastRite ?? null,
    threads,
  };
}
