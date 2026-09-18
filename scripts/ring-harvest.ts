/**
 * A polling harvester for the trace ring (THR-1514).
 *
 * The ring holds `getTraceBufferSize()` entries and renumbers their ids contiguous
 * after every eviction, so the pattern both proofs used — keep the last id seen and
 * take everything above it — collects nothing after the ring first fills: every later
 * entry's id is below the high-water mark it set. The census's per-tick harvest read
 * *fewer* `step_reward_pool` hits than a single read at tick 200 for that reason.
 *
 * This harvester keys on `getTraceEmitCount()` instead, which is monotonic. Each call
 * takes exactly the entries emitted since the previous call, and counts — rather than
 * ignores — the ones that arrived and were evicted between calls. A caller can then
 * say "N traces fired unseen" instead of pretending the ring is complete.
 *
 * Call `harvest()` after every `runTick`. Create it after `clearTraces()`, which also
 * resets the emit counter.
 */
import { getTraceBufferSize, getTraceEmitCount, getTraces } from '../src/engine/traceBuffer';
import type { TraceEntry } from '../src/types/trace';

export interface RingHarvester {
  /** Pull every entry emitted since the last call into `traces`. Returns how many were new. */
  harvest(): number;
  /** Everything harvested so far, in emission order. */
  readonly traces: readonly TraceEntry[];
  /** Entries emitted between two calls that the ring had already evicted at the second. */
  readonly evictedUnseen: number;
}

export function createRingHarvester(): RingHarvester {
  const traces: TraceEntry[] = [];
  let seen = getTraceEmitCount();
  let evictedUnseen = 0;
  return {
    traces,
    get evictedUnseen() { return evictedUnseen; },
    harvest(): number {
      const total = getTraceEmitCount();
      const fresh = total - seen;
      if (fresh <= 0) { seen = total; return 0; }
      const ring = getTraces();
      const take = Math.min(fresh, ring.length, getTraceBufferSize());
      evictedUnseen += fresh - take;
      for (const t of ring.slice(ring.length - take)) traces.push(t);
      seen = total;
      return fresh;
    },
  };
}
