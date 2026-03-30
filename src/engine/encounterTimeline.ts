/**
 * Encounter Timeline Accumulator
 *
 * Separate from the trace ring buffer (traceBuffer.ts, 500-entry cap).
 * This is append-only, agent-keyed, and retains all encounter-lifecycle events
 * for the full game session so they can be exported as a tuning log.
 *
 * Memory budget: ~200 bytes/event × 4,000 events (10 agents × 200 ticks) ≈ 800 KB.
 */

// ─── Constants ──────────────────────────────────────────────────

/** Safety cap per agent — evict oldest if exceeded (unlikely in normal play) */
export const MAX_EVENTS_PER_AGENT = 5000;

// ─── Types ──────────────────────────────────────────────────────

/** A single line in the encounter timeline */
export type TimelineEvent =
  | { phase: 'DECIDE'; tick: number; targetEncounter: string; targetLocation: string; targetHex: [number, number]; score: number; travelCost: number; completionProb: number; desireMultiplier?: number }
  | { phase: 'IDLE'; tick: number; reason: string; idleAction: string; driftTarget?: string; pipeline?: string }
  | { phase: 'MOVE'; tick: number; fromHex: [number, number]; toHex: [number, number]; cost: string; road?: string }
  | { phase: 'ARRIVE'; tick: number; location: string; hex: [number, number] }
  | { phase: 'ENCOUNTER_START'; tick: number; encounter: string; steps: number; threat: number; reach: string }
  | { phase: 'ENCOUNTER_STEP'; tick: number; step: string; reach: string; diff: number; cap: number; prob: number; roll: number; result: 'PASS' | 'FAIL' }
  | { phase: 'ENCOUNTER_END'; tick: number; encounter: string; status: string; reward?: string }
  | { phase: 'REROUTE'; tick: number; oldTarget: string; newTarget: string; reason: string };

// ─── Storage ────────────────────────────────────────────────────

const timelines = new Map<string, TimelineEvent[]>();

// ─── API ────────────────────────────────────────────────────────

/** Append a timeline event for the given agent. Auto-creates the array if new. */
export function appendEvent(agentId: string, event: TimelineEvent): void {
  let list = timelines.get(agentId);
  if (!list) {
    list = [];
    timelines.set(agentId, list);
  }
  list.push(event);
  if (list.length > MAX_EVENTS_PER_AGENT) {
    list.shift(); // FIFO eviction
  }
}

/** Get the full timeline for an agent (empty array if none recorded). */
export function getTimeline(agentId: string): readonly TimelineEvent[] {
  return timelines.get(agentId) ?? [];
}

/** Get all agent IDs that have at least one recorded event. */
export function getTrackedAgentIds(): string[] {
  return Array.from(timelines.keys());
}

/** Clear all timelines. Called on game reset / new game. */
export function clearTimelines(): void {
  timelines.clear();
}
