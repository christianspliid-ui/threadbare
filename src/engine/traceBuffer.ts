import type { TraceEntry } from '../types/trace';

const BUFFER_SIZE = 500;

let buffer: TraceEntry[] = [];
let nextId = 0;
let enabled = false;

/**
 * Emit a trace entry to the buffer.
 * No-op if tracing is disabled.
 * Automatically evicts oldest entry if buffer exceeds BUFFER_SIZE.
 */
export function emitTrace(
  entry: Omit<TraceEntry, 'id' | 'timestamp'>
): void {
  if (!enabled) return;

  buffer.push({
    ...entry,
    id: nextId++,
    timestamp: Date.now(),
  } as TraceEntry);

  if (buffer.length > BUFFER_SIZE) {
    buffer.shift();
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
