/**
 * The ring harvester (THR-1514) against the real trace buffer.
 *
 * The defect it replaces: the ring renumbers ids contiguous after every eviction, so a
 * harvester keyed on `id > lastSeen` collects nothing once the ring has filled. These
 * tests emit past the ring's capacity and assert the harvester keeps collecting — and
 * that it *counts* what it provably missed rather than pretending completeness.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearTraces,
  emitTrace,
  enableTracing,
  getTraceBufferSize,
  getTraceEmitCount,
  getTraces,
} from '../../src/engine/traceBuffer';
import { createRingHarvester } from '../ring-harvest.js';

const emitN = (n: number, tag: string) => {
  for (let i = 0; i < n; i++) emitTrace({ category: 'engine_warning', tick: 0, summary: `${tag}:${i}` } as never);
};

describe('createRingHarvester', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('takes exactly the entries emitted since the previous call, across the ring filling', () => {
    const size = getTraceBufferSize();
    const h = createRingHarvester();

    emitN(10, 'a');
    expect(h.harvest()).toBe(10);
    expect(h.traces).toHaveLength(10);

    // Push the ring past capacity: ids are renumbered from 0, so an id-keyed harvest
    // would now see nothing new. The emit counter still says exactly how many arrived.
    emitN(size, 'b');
    expect(getTraces()[0].id).toBe(0);
    expect(h.harvest()).toBe(size);
    expect(h.traces).toHaveLength(10 + size);
    expect(h.evictedUnseen).toBe(0);

    emitN(3, 'c');
    expect(h.harvest()).toBe(3);
    expect(h.traces.slice(-3).map(t => t.summary)).toEqual(['c:0', 'c:1', 'c:2']);
    expect(h.evictedUnseen).toBe(0);
  });

  it('counts entries that were emitted and evicted between two calls instead of ignoring them', () => {
    const size = getTraceBufferSize();
    const h = createRingHarvester();

    // More than one ring's worth between harvests: the excess is gone before we look.
    emitN(size + 25, 'burst');
    expect(h.harvest()).toBe(size + 25);
    expect(h.traces).toHaveLength(size);
    expect(h.evictedUnseen).toBe(25);
    // What survived is the tail, in order — the oldest 25 are the ones that fell out.
    expect(h.traces[0].summary).toBe('burst:25');
    expect(h.traces[h.traces.length - 1].summary).toBe(`burst:${size + 24}`);
  });

  it('starts from the emit count at creation, so traces emitted before it exist are not re-harvested', () => {
    emitN(7, 'before');
    const h = createRingHarvester();
    expect(h.harvest()).toBe(0);
    expect(h.traces).toHaveLength(0);
    emitN(2, 'after');
    expect(h.harvest()).toBe(2);
    expect(h.traces.map(t => t.summary)).toEqual(['after:0', 'after:1']);
  });

  it('the emit counter is monotonic across eviction and resets only on clearTraces', () => {
    const size = getTraceBufferSize();
    emitN(size + 5, 'x');
    expect(getTraceEmitCount()).toBe(size + 5);
    expect(getTraces()).toHaveLength(size);
    clearTraces();
    expect(getTraceEmitCount()).toBe(0);
  });
});
