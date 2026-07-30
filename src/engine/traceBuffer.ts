import type {
  TraceEntry,
  TickPhaseProfileTrace,
  TickProfileTrace,
  DistanceMatrixRebuildTrace,
} from '../types/trace';
import type {
  ChoiceResolvedTrace,
  ForecastComputedTrace,
  HandFilteredTrace,
  DriftThresholdCrossedTrace,
  DetectionThresholdCrossedTrace,
  ItemConsumedByChoiceTrace,
  SpotlightChangedTrace,
  BranchDecidedTrace,
} from '../types/traces/encounter-traces';
import type { MentorshipTraceEntry } from '../types/traces/mentorship-traces';
import { MENTORSHIP_TRACE_CATEGORIES } from '../types/traces/mentorship-traces';

const BUFFER_SIZE = 2000;
const FALLBACK_TRACE_CATEGORY = 'engine_warning';
const FALLBACK_TRACE_SUMMARY_PREFIX = 'trace';

export const TRACE_CATEGORIES = [
  'choice_resolved',
  'forecast_computed',
  'hand_filtered',
  'drift_threshold_crossed',
  'detection_threshold_crossed',
  'item_consumed_by_choice',
  'spotlight_changed',
  'consequence_applied',
  'branch_decided',
  ...MENTORSHIP_TRACE_CATEGORIES,
] as const;

export type EncounterTraceCategory = typeof TRACE_CATEGORIES[number];

export type EncounterTraceEntry =
  | ChoiceResolvedTrace
  | ForecastComputedTrace
  | HandFilteredTrace
  | DriftThresholdCrossedTrace
  | DetectionThresholdCrossedTrace
  | ItemConsumedByChoiceTrace
  | SpotlightChangedTrace
  | BranchDecidedTrace
  | MentorshipTraceEntry;

let buffer: TraceEntry[] = [];
let nextId = 0;
let enabled = false;

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeTraceEntry(
  entry: Omit<TraceEntry, 'id' | 'timestamp'>
): Omit<TraceEntry, 'id' | 'timestamp'> {
  const raw = entry as Record<string, unknown>;
  const legacyType = asNonEmptyString(raw.type);
  const legacyAction = asNonEmptyString(raw.action);

  const normalizedCategory =
    asNonEmptyString(raw.category) ?? legacyType ?? FALLBACK_TRACE_CATEGORY;
  const normalizedSummary =
    asNonEmptyString(raw.summary) ??
    asNonEmptyString(raw.message) ??
    (legacyType && legacyAction ? `${legacyType}:${legacyAction}` : null) ??
    (legacyType ? `${legacyType}` : null) ??
    `${FALLBACK_TRACE_SUMMARY_PREFIX}:${normalizedCategory}`;

  return {
    ...(entry as TraceEntry),
    category: normalizedCategory,
    summary: normalizedSummary,
  };
}

/**
 * Emit a trace entry to the buffer.
 * No-op if tracing is disabled.
 * Automatically evicts oldest entry if buffer exceeds BUFFER_SIZE.
 */
export function emitTrace(
  entry: Omit<TraceEntry, 'id' | 'timestamp'>
): void {
  if (!enabled) return;
  const normalizedEntry = normalizeTraceEntry(entry);

  buffer.push({
    ...normalizedEntry,
    id: nextId++,
    timestamp: Date.now(),
  } as TraceEntry);

  if (buffer.length > BUFFER_SIZE) {
    buffer.shift();
    // Keep IDs contiguous within the ring buffer so consumers relying on
    // local ordering don't observe gaps after eviction.
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = { ...buffer[i], id: i };
    }
    nextId = buffer.length;
  }
}

/**
 * Get all trace entries in the buffer.
 * Returns a read-only view to prevent accidental mutation.
 */
export function getTraces(): ReadonlyArray<TraceEntry> {
  return buffer;
}

/**
 * Get all trace entries for a specific agent.
 * Filters by agentId field.
 */
export function getTracesForAgent(agentId: string): ReadonlyArray<TraceEntry> {
  return buffer.filter((t) => t.agentId === agentId);
}

/**
 * Clear the buffer and reset the ID counter.
 * Used for test cleanup and session resets.
 */
export function clearTraces(): void {
  buffer = [];
  nextId = 0;
}

/**
 * Enable tracing. Subsequent emitTrace calls will be recorded.
 */
export function enableTracing(): void {
  enabled = true;
}

/**
 * Disable tracing. Subsequent emitTrace calls will be no-ops.
 */
export function disableTracing(): void {
  enabled = false;
}

/**
 * Check if tracing is currently enabled.
 */
export function isTracingEnabled(): boolean {
  return enabled;
}

// ═══════════════════════════════════════════════════════════════════
// Timing ring (THR-580) — dedicated buffer for tick-loop observability
// ═══════════════════════════════════════════════════════════════════
//
// High-volume phase-timing traces (~65/tick when profiling) live in their own
// ring so they never evict semantic traces from the main buffer, and vice-versa.
// The profiling stream is toggled independently of `enableTracing()`, and is OFF
// by default (zero hot-loop cost — one boolean check per phase — NFP #7).

/** Dedicated timing-ring capacity (~60 ticks at ~65 phase profiles/tick). THR-580 */
const TIMING_BUFFER_SIZE = 4000;
/** Default aggregation window (ticks) when the caller doesn't specify one. THR-580 */
export const PROFILE_DEFAULT_WINDOW_TICKS = 30;

/** Categories routed to the timing ring rather than the shared trace buffer. */
const TIMING_CATEGORIES: ReadonlySet<string> = new Set([
  'tick_phase_profile',
  'tick_profile',
  'distance_matrix_rebuild',
]);

let timingBuffer: TraceEntry[] = [];
let timingNextId = 0;
let profilingEnabled = false;

/** Enable the profiling/timing stream. Independent of `enableTracing()`. */
export function enableProfiling(): void {
  profilingEnabled = true;
}

/** Disable the profiling/timing stream. Subsequent timing emits are no-ops. */
export function disableProfiling(): void {
  profilingEnabled = false;
}

/** Whether the profiling/timing stream is currently collecting. */
export function isProfilingEnabled(): boolean {
  return profilingEnabled;
}

/** Clear the timing ring (test cleanup, session reset, or a fresh `profile` run). */
export function clearTimingTraces(): void {
  timingBuffer = [];
  timingNextId = 0;
}

/** Read-only view of the timing ring. */
export function getTimingTraces(): ReadonlyArray<TraceEntry> {
  return timingBuffer;
}

/**
 * Accepted timing-ring inputs. Distributing `Omit` per-interface (rather than
 * `Omit<TraceEntry, …>`, which collapses the union to its common keys) preserves
 * discrimination so member-specific fields like `locationCount`/`durationMs` type-check.
 */
type TimingTraceInput =
  | Omit<TickPhaseProfileTrace, 'id' | 'timestamp'>
  | Omit<TickProfileTrace, 'id' | 'timestamp'>
  | Omit<DistanceMatrixRebuildTrace, 'id' | 'timestamp'>;

/**
 * Emit a timing/rebuild trace to the dedicated timing ring.
 * No-op unless profiling is enabled and the category is a timing category.
 * Ring-evicts oldest entries past TIMING_BUFFER_SIZE (same pattern as the main buffer).
 */
export function emitTiming(entry: TimingTraceInput): void {
  if (!profilingEnabled) return;
  const normalized = normalizeTraceEntry(entry);
  if (!TIMING_CATEGORIES.has(normalized.category)) return;

  timingBuffer.push({
    ...normalized,
    id: timingNextId++,
    timestamp: Date.now(),
  } as TraceEntry);

  if (timingBuffer.length > TIMING_BUFFER_SIZE) {
    timingBuffer.shift();
    for (let i = 0; i < timingBuffer.length; i++) {
      timingBuffer[i] = { ...timingBuffer[i], id: i } as TraceEntry;
    }
    timingNextId = timingBuffer.length;
  }
}

/**
 * Convenience emitter for per-phase timing (`tick_phase_profile`). Used by both
 * `runRegisteredPhases` and the orchestrator's inline-phase helper so registered
 * and inline phases land in the same timing ring.
 */
export function emitPhaseTiming(
  entry: Omit<TickPhaseProfileTrace, 'id' | 'timestamp' | 'category'>,
): void {
  emitTiming({ ...entry, category: 'tick_phase_profile' });
}

/** Per-phase aggregate over a window of timing traces. THR-580 */
export interface PhaseTimingAggregate {
  phase: string;
  lastMs: number;
  avgMs: number;
  maxMs: number;
  p95Ms: number;
  samples: number;
  lastEventDelta: number;
  /** True if a `tick_crash` for this phase appears in the passed traces. */
  crashed: boolean;
}

/**
 * Aggregate per-phase timings over the most recent `windowTicks` of `tick_phase_profile`
 * traces. Pure — consumed by both the CLI `profile` command and the DebugPanel Phases tab
 * (no duplicate derivation). Returns phases sorted slowest-avg-first.
 *
 * Fail-soft (NFP #4): entries missing a numeric `durationMs` are skipped; never throws.
 */
export function aggregatePhaseTimings(
  traces: readonly TraceEntry[],
  windowTicks: number = PROFILE_DEFAULT_WINDOW_TICKS,
): PhaseTimingAggregate[] {
  const profiles = traces.filter(
    (t): t is TickPhaseProfileTrace =>
      t.category === 'tick_phase_profile' &&
      typeof (t as TickPhaseProfileTrace).durationMs === 'number',
  );
  if (profiles.length === 0) return [];

  const maxTick = profiles.reduce((m, t) => Math.max(m, t.tick), 0);
  const minTick = maxTick - windowTicks + 1;
  const inWindow = profiles.filter((t) => t.tick >= minTick);

  const byPhase = new Map<string, TickPhaseProfileTrace[]>();
  for (const t of inWindow) {
    const list = byPhase.get(t.phase);
    if (list) list.push(t);
    else byPhase.set(t.phase, [t]);
  }

  const result: PhaseTimingAggregate[] = [];
  for (const [phase, entries] of byPhase) {
    const durs = entries.map((e) => e.durationMs as number);
    const sorted = [...durs].sort((a, b) => a - b);
    const sum = durs.reduce((acc, d) => acc + d, 0);
    const last = entries[entries.length - 1];
    const p95Idx = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
    const crashed = traces.some(
      // `tick_crash` is emitted with a cast and isn't in the TraceEntry union; widen to string.
      (t) => (t.category as string) === 'tick_crash' && typeof t.summary === 'string' && t.summary.includes(`"${phase}"`),
    );
    result.push({
      phase,
      lastMs: last.durationMs as number,
      avgMs: sum / durs.length,
      maxMs: sorted[sorted.length - 1],
      p95Ms: sorted[p95Idx],
      samples: durs.length,
      lastEventDelta: last.eventDelta ?? 0,
      crashed,
    });
  }
  return result.sort((a, b) => b.avgMs - a.avgMs);
}
