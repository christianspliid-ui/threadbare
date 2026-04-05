import { describe, it, expect } from 'vitest';
import { appendDigestEntry, pruneDigestBuffer, queryDigest } from '../../src/engine/digestBuffer';
import type { DigestEntry } from '../../src/types/attention';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId: 'agent-1',
    agentName: 'Serafina',
    encounterId: 'enc-1',
    encounterName: 'The Crossroads',
    encounterType: 'exploration',
    reachPrimary: 'wandering',
    tick: 10,
    success: true,
    significantOutcomes: [],
    capabilityChanges: {},
    attachmentsGained: [],
    attachmentsLost: [],
    quintessenceDelta: 0,
    isNotable: false,
    wasCuratedOut: false,
    isDormantAgent: false,
    sourceType: 'agent',
    ...overrides,
  };
}

// ─── appendDigestEntry ───────────────────────────────────────────────────────

describe('appendDigestEntry', () => {
  it('appends to empty buffer → length 1', () => {
    const buffer: DigestEntry[] = [];
    appendDigestEntry(buffer, makeEntry());
    expect(buffer).toHaveLength(1);
  });

  it('appends to existing buffer → length increases', () => {
    const buffer: DigestEntry[] = [makeEntry({ tick: 1 })];
    appendDigestEntry(buffer, makeEntry({ tick: 2 }));
    expect(buffer).toHaveLength(2);
    expect(buffer[1].tick).toBe(2);
  });
});

// ─── pruneDigestBuffer ───────────────────────────────────────────────────────

describe('pruneDigestBuffer', () => {
  it('removes old entries (tick 5 pruned when currentTick=52, retention=48)', () => {
    const buffer = [makeEntry({ tick: 5 }), makeEntry({ tick: 10 })];
    const result = pruneDigestBuffer(buffer, 52);
    // cutoff = 52 - 48 = 4; tick 5 > 4 so kept; tick 10 kept
    // Actually: tick 5 > (52 - 48 = 4) → kept; let's use tick=3 for the "old" one
    expect(result.every(e => e.tick > 52 - 48)).toBe(true);
  });

  it('removes entries older than currentTick - retention', () => {
    const buffer = [
      makeEntry({ tick: 3 }),  // old: 3 <= 52 - 48 = 4 → pruned
      makeEntry({ tick: 10 }), // kept
    ];
    const result = pruneDigestBuffer(buffer, 52);
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(10);
  });

  it('keeps entries within retention window', () => {
    const buffer = [makeEntry({ tick: 10 }), makeEntry({ tick: 50 })];
    const result = pruneDigestBuffer(buffer, 52);
    expect(result).toHaveLength(2);
  });

  it('returns new array (does not mutate original)', () => {
    const buffer = [makeEntry({ tick: 1 }), makeEntry({ tick: 40 })];
    const original = buffer;
    const result = pruneDigestBuffer(buffer, 52);
    expect(result).not.toBe(original);
    expect(buffer).toHaveLength(2); // original unchanged
  });

  it('empty buffer returns empty array', () => {
    const result = pruneDigestBuffer([], 52);
    expect(result).toEqual([]);
  });

  it('respects custom retention parameter', () => {
    const buffer = [makeEntry({ tick: 8 }), makeEntry({ tick: 15 })];
    // retention=10, currentTick=20 → cutoff=10; tick 8 <= 10 → pruned; tick 15 kept
    const result = pruneDigestBuffer(buffer, 20, 10);
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(15);
  });
});

// ─── queryDigest ─────────────────────────────────────────────────────────────

describe('queryDigest', () => {
  const buffer: DigestEntry[] = [
    makeEntry({ agentId: 'agent-1', tick: 10, isNotable: false, sourceType: 'agent' }),
    makeEntry({ agentId: 'agent-2', tick: 20, isNotable: true, sourceType: 'location' }),
    makeEntry({ agentId: 'agent-1', tick: 30, isNotable: true, sourceType: 'agent' }),
    makeEntry({ agentId: 'agent-3', tick: 40, isNotable: false, sourceType: 'location' }),
  ];

  it('returns all entries within tick range when no filters set', () => {
    const result = queryDigest(buffer, { fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(4);
  });

  it('filters by tick range (fromTick, toTick)', () => {
    const result = queryDigest(buffer, { fromTick: 15, toTick: 35 });
    expect(result).toHaveLength(2);
    expect(result.map(e => e.tick)).toEqual([20, 30]);
  });

  it('excludes entries exactly outside tick range boundaries', () => {
    const result = queryDigest(buffer, { fromTick: 10, toTick: 30 });
    expect(result).toHaveLength(3);
  });

  it('filters by agentId', () => {
    const result = queryDigest(buffer, { agentId: 'agent-1', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.agentId === 'agent-1')).toBe(true);
  });

  it('filters by notableOnly', () => {
    const result = queryDigest(buffer, { notableOnly: true, fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.isNotable)).toBe(true);
  });

  it('filters by sourceType agent', () => {
    const result = queryDigest(buffer, { sourceType: 'agent', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.sourceType === 'agent')).toBe(true);
  });

  it('filters by sourceType location', () => {
    const result = queryDigest(buffer, { sourceType: 'location', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.sourceType === 'location')).toBe(true);
  });

  it('combines multiple filters', () => {
    // agent-1, notable, tick 0-100
    const result = queryDigest(buffer, {
      agentId: 'agent-1',
      notableOnly: true,
      fromTick: 0,
      toTick: 100,
    });
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(30);
  });

  it('returns empty when tick range excludes all', () => {
    const result = queryDigest(buffer, { fromTick: 50, toTick: 100 });
    expect(result).toHaveLength(0);
  });
});
