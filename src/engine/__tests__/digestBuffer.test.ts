import { describe, it, expect } from 'vitest';
import {
  appendDigestEntry,
  pruneDigestBuffer,
  queryDigest,
} from '../digestBuffer';
import type { DigestEntry } from '../../types/attention';
import { DIGEST_BUFFER_RETENTION } from '../../data/attention-constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(agentId: string, tick: number, overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId,
    agentName:           'Test Agent',
    encounterId:         `enc_${agentId}_${tick}`,
    encounterName:       'Test Encounter',
    encounterType:       'explore',
    reachPrimary:        'iron',
    tick,
    success:             true,
    significantOutcomes: [],
    capabilityChanges:   {},
    attachmentsGained:   [],
    attachmentsLost:     [],
    quintessenceDelta:   0,
    isNotable:           false,
    wasCuratedOut:       false,
    isDormantAgent:      false,
    sourceType:          'agent',
    ...overrides,
  };
}

// ── appendDigestEntry ─────────────────────────────────────────────────────────

describe('appendDigestEntry', () => {
  it('appends an entry to the buffer', () => {
    const buffer: DigestEntry[] = [];
    const entry = makeEntry('agent1', 10);
    appendDigestEntry(buffer, entry);
    expect(buffer).toHaveLength(1);
    expect(buffer[0]).toBe(entry);
  });

  it('appends to a non-empty buffer', () => {
    const buffer: DigestEntry[] = [makeEntry('agent1', 5)];
    appendDigestEntry(buffer, makeEntry('agent2', 10));
    expect(buffer).toHaveLength(2);
    expect(buffer[1].agentId).toBe('agent2');
  });

  it('mutates the buffer in place (no copy)', () => {
    const buffer: DigestEntry[] = [];
    const ref = buffer;
    appendDigestEntry(buffer, makeEntry('a', 1));
    expect(ref).toBe(buffer);
    expect(ref).toHaveLength(1);
  });
});

// ── pruneDigestBuffer ─────────────────────────────────────────────────────────

describe('pruneDigestBuffer', () => {
  it('removes entries older than the retention window', () => {
    const buffer = [
      makeEntry('a', 1),
      makeEntry('b', 10),
      makeEntry('c', 50),
    ];
    // At tick 60, retention = 48 → cutoff = 12 → entries at tick 1, 10 pruned
    const result = pruneDigestBuffer(buffer, 60, 48);
    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('c');
  });

  it('keeps entries within the retention window', () => {
    const buffer = [makeEntry('a', 10), makeEntry('b', 20)];
    const result = pruneDigestBuffer(buffer, 30, 48);
    // cutoff = 30 - 48 = -18, both kept
    expect(result).toHaveLength(2);
  });

  it('returns an empty array if all entries are pruned', () => {
    const buffer = [makeEntry('a', 1), makeEntry('b', 2)];
    const result = pruneDigestBuffer(buffer, 100, 10);
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original buffer', () => {
    const buffer = [makeEntry('a', 1)];
    pruneDigestBuffer(buffer, 100, 10);
    expect(buffer).toHaveLength(1);
  });

  it('uses DIGEST_BUFFER_RETENTION constant as default', () => {
    const buffer = [makeEntry('a', 1)];
    // At tick 1000, entry at tick 1 is beyond the 48-tick window
    const result = pruneDigestBuffer(buffer, 1000);
    expect(result).toHaveLength(0);
  });

  it('boundary: entry exactly at cutoff is pruned (not kept)', () => {
    // cutoff = 60 - 48 = 12; entry at tick 12 → tick NOT > cutoff → pruned
    const buffer = [makeEntry('a', 12)];
    const result = pruneDigestBuffer(buffer, 60, 48);
    expect(result).toHaveLength(0);
  });

  it('boundary: entry one tick after cutoff is kept', () => {
    // cutoff = 61 - 48 = 13; entry at tick 14 → 14 > 13 = true → kept
    const buffer = [makeEntry('a', 14)];
    const result = pruneDigestBuffer(buffer, 61, 48);
    expect(result).toHaveLength(1);
  });
});

// ── queryDigest ───────────────────────────────────────────────────────────────

describe('queryDigest', () => {
  const buffer: DigestEntry[] = [
    makeEntry('alice',  10, { reachPrimary: 'iron', isNotable: true, sourceType: 'agent' }),
    makeEntry('bob',    20, { reachPrimary: 'heart', isNotable: false, sourceType: 'agent' }),
    makeEntry('alice',  30, { reachPrimary: 'eye', isNotable: false, sourceType: 'location' }),
    makeEntry('carol',  40, { reachPrimary: 'star', isNotable: true, sourceType: 'agent' }),
  ];

  it('returns all entries within tick range', () => {
    const result = queryDigest(buffer, { fromTick: 1, toTick: 100 });
    expect(result).toHaveLength(4);
  });

  it('filters by tick range (exclusive)', () => {
    const result = queryDigest(buffer, { fromTick: 15, toTick: 35 });
    expect(result.map(e => e.agentId)).toEqual(['bob', 'alice']);
  });

  it('filters by agentId', () => {
    const result = queryDigest(buffer, { agentId: 'alice', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.agentId === 'alice')).toBe(true);
  });

  it('filters by notableOnly', () => {
    const result = queryDigest(buffer, { notableOnly: true, fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(2);
    expect(result.every(e => e.isNotable)).toBe(true);
  });

  it('filters by sourceType', () => {
    const result = queryDigest(buffer, { sourceType: 'location', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('alice');
  });

  it('combines agentId + notableOnly filters (AND)', () => {
    const result = queryDigest(buffer, {
      agentId: 'alice',
      notableOnly: true,
      fromTick: 0,
      toTick: 100,
    });
    // alice has two entries: tick 10 (notable) and tick 30 (not notable)
    expect(result).toHaveLength(1);
    expect(result[0].tick).toBe(10);
  });

  it('returns empty array when no entries match', () => {
    const result = queryDigest(buffer, { agentId: 'nobody', fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(0);
  });

  it('returns empty array on empty buffer', () => {
    const result = queryDigest([], { fromTick: 0, toTick: 100 });
    expect(result).toHaveLength(0);
  });
});
