/**
 * Incident flight recorder (THR-1134) — the prod-safe accumulator behind the
 * incident snapshot.
 *
 * Two head-indexed circular rings, appended once per tick from the tick-end site
 * beside `validateTickOutput`:
 *
 * - **events** — the tick events the orchestrator produced, kept far past
 *   `recentEvents`' own hundred. A hundred entries is three to five ticks; by the
 *   time a world looks wrong the cause has usually rolled off.
 * - **metrics** — one census row per tick. This is what answers *why did it
 *   drift*: a graph that grew by four hundred nodes in ten ticks is visible as a
 *   line, not a guess from one sample.
 *
 * **Ownership.** The recorder is created by `createSimulationRuntime` and held as
 * `runtime.incidentRecorder`, per the load-bearing decision *engine caches must be
 * owned per session, not stored at module scope*. `tickHealthMonitor` and
 * `encounterTimeline` are module-scope precedents this file deliberately does not
 * follow: a module singleton would carry one playthrough's events into the next
 * bundle, misleading exactly the cold agent the feature serves. A fresh runtime
 * per playthrough is the reset, so there is no reset call and no `gameInit` hook.
 *
 * **Cost.** Both appends are O(1) writes into a pre-sized array — never `shift()`,
 * which is what makes `traceBuffer` expensive on a saturated tick. The call site
 * guards, and `record` guards again, so a throwing census can never touch the tick.
 */

import {
  INCIDENT_EVENT_RING_SIZE,
  INCIDENT_METRICS_RING_SIZE,
} from '../data/incident-snapshot-constants';
import type { GameState, TickEvent } from '../types/gameState';

// ─── Types ────────────────────────────────────────────────────────

/**
 * One tick's census — the same counts `exportDiagnostics`'s `stateMetrics`
 * computes, sampled every tick so growth is a curve rather than a single reading.
 */
export interface IncidentMetricsRow {
  tick: number;
  nodeCount: number;
  edgeCount: number;
  unifiedActions: number;
  encounterNotifications: number;
  controlEffects: number;
  chronicleEntries: number;
  recentEvents: number;
  /** Wall-clock for the tick, when the caller has it. Absent off the profiling path. */
  tickMs?: number;
}

/** A head-indexed circular buffer. `head` is the next write slot. */
interface Ring<T> {
  items: (T | undefined)[];
  head: number;
  /** Total appends ever, including those since overwritten. */
  written: number;
}

export interface IncidentRecorderStats {
  /** Events currently retained (≤ `INCIDENT_EVENT_RING_SIZE`). */
  events: number;
  /** Census rows currently retained (≤ `INCIDENT_METRICS_RING_SIZE`). */
  metrics: number;
  /** Total events ever appended, including evicted ones. */
  eventsWritten: number;
  /** Total census rows ever appended, including evicted ones. */
  metricsWritten: number;
  /** Appends that threw and were swallowed. Non-zero is itself a finding. */
  misses: number;
}

export interface IncidentRecorder {
  events: Ring<TickEvent>;
  metrics: Ring<IncidentMetricsRow>;
  /** Appends that threw. Reported in the bundle rather than silently zero. */
  misses: number;
}

// ─── Ring primitives ──────────────────────────────────────────────

function createRing<T>(size: number): Ring<T> {
  return { items: new Array<T | undefined>(size), head: 0, written: 0 };
}

/** O(1) append. Overwrites the oldest slot once the ring is full. */
function push<T>(ring: Ring<T>, item: T): void {
  ring.items[ring.head] = item;
  ring.head = (ring.head + 1) % ring.items.length;
  ring.written++;
}

/**
 * Read the ring back in append order, oldest first.
 *
 * Before the first wrap the live entries sit at `[0, head)`; after it they start
 * at `head` and wrap. Reading from `head` in both cases is correct because the
 * pre-wrap tail is `undefined` and filtered out.
 */
export function drainRing<T>(ring: Ring<T>): T[] {
  const out: T[] = [];
  const n = ring.items.length;
  for (let i = 0; i < n; i++) {
    const item = ring.items[(ring.head + i) % n];
    if (item !== undefined) out.push(item);
  }
  return out;
}

// ─── Factory ──────────────────────────────────────────────────────

export function createIncidentRecorder(): IncidentRecorder {
  return {
    events: createRing<TickEvent>(INCIDENT_EVENT_RING_SIZE),
    metrics: createRing<IncidentMetricsRow>(INCIDENT_METRICS_RING_SIZE),
    misses: 0,
  };
}

// ─── Recording ────────────────────────────────────────────────────

/**
 * Append this tick's events and census row.
 *
 * Never throws (NFP #4). A throwing getter on a half-built state increments
 * `misses` and returns; the tick proceeds untouched, and the bundle reports the
 * miss count rather than presenting a gapped ring as complete.
 */
export function recordTick(
  recorder: IncidentRecorder,
  state: GameState,
  tickMs?: number,
): void {
  try {
    for (const evt of state.tickEvents ?? []) {
      push(recorder.events, evt);
    }
    const stats = state.graph?.getStats();
    const row: IncidentMetricsRow = {
      tick: state.tick,
      nodeCount: stats?.nodeCount ?? 0,
      edgeCount: stats?.edgeCount ?? 0,
      unifiedActions: state.unifiedActions?.length ?? 0,
      encounterNotifications: state.encounterNotifications?.length ?? 0,
      controlEffects: state.controlEffects?.length ?? 0,
      chronicleEntries: state.chronicleEntries?.length ?? 0,
      recentEvents: state.recentEvents?.length ?? 0,
    };
    if (tickMs !== undefined) row.tickMs = tickMs;
    push(recorder.metrics, row);
  } catch {
    // Fail-soft: the recorder exists to observe the tick, never to endanger it.
    recorder.misses++;
  }
}

// ─── Accessors ────────────────────────────────────────────────────

export function getRecordedEvents(recorder: IncidentRecorder): TickEvent[] {
  return drainRing(recorder.events);
}

export function getRecordedMetrics(recorder: IncidentRecorder): IncidentMetricsRow[] {
  return drainRing(recorder.metrics);
}

export function getIncidentRecorderStats(recorder: IncidentRecorder): IncidentRecorderStats {
  return {
    events: drainRing(recorder.events).length,
    metrics: drainRing(recorder.metrics).length,
    eventsWritten: recorder.events.written,
    metricsWritten: recorder.metrics.written,
    misses: recorder.misses,
  };
}
