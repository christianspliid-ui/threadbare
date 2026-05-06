import type { TraceEntry } from '../types/trace';
import type {
  ChoiceResolvedTrace,
  ForecastComputedTrace,
  HandFilteredTrace,
  DriftThresholdCrossedTrace,
  DetectionThresholdCrossedTrace,
  ItemConsumedByChoiceTrace,
  SpotlightChangedTrace,
} from '../types/traces/encounter-traces';

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
] as const;

export type EncounterTraceCategory = typeof TRACE_CATEGORIES[number];

export type EncounterTraceEntry =
  | ChoiceResolvedTrace
  | ForecastComputedTrace
  | HandFilteredTrace
  | DriftThresholdCrossedTrace
  | DetectionThresholdCrossedTrace
  | ItemConsumedByChoiceTrace
  | SpotlightChangedTrace;

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
