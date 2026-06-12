import { describe, it, expect, vi } from 'vitest';
import {
  selectBeats,
  resolveCurrentTension,
  composeThreadStory,
  seededPickFromPool,
} from '../threadDigest';
import type { DigestEntry } from '../../types/attention';
import type { WorldGraph } from '../graph';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEntry(agentId: string, tick: number, overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId,
    agentName: 'Test Agent',
    encounterId: `enc_${agentId}_${tick}`,
    encounterName: 'Test Encounter',
    encounterType: 'explore',
    reachPrimary: 'iron',
    tick,
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

function makeGraph(overrides: Partial<WorldGraph> = {}): WorldGraph {
  return {
    getNode: (id: string) => id === 'agent-1' ? { id: 'agent-1', type: 'actor', name: 'Test Agent', properties: {} } as any : null,
    getOutgoingEdges: (_id: string, _type: string) => [],
    getNodesByType: (_type: string) => [],
    getIncomingEdges: (_id: string, _type?: string) => [],
    ...overrides,
  } as unknown as WorldGraph;
}

// ── seededPickFromPool ────────────────────────────────────────────────────────

describe('seededPickFromPool', () => {
  it('returns a value from the pool', () => {
    const pool = ['a', 'b', 'c'];
    const result = seededPickFromPool(pool, 'agent-1', 42);
    expect(pool).toContain(result);
  });

  it('is deterministic for the same seeds', () => {
    const pool = ['x', 'y', 'z'];
    const a = seededPickFromPool(pool, 'agent-1', 10);
    const b = seededPickFromPool(pool, 'agent-1', 10);
    expect(a).toBe(b);
  });

  it('produces different results for different seeds', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const results = new Set(['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']
      .map(seed => seededPickFromPool(pool, seed, 0)));
    // At least 2 different picks from 5 different agent seeds
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
});

// ── selectBeats ───────────────────────────────────────────────────────────────

describe('selectBeats', () => {
  it('returns empty array for no entries', () => {
    const beats = selectBeats('agent-1', [], 100);
    expect(beats).toHaveLength(0);
  });

  it('returns empty for entries outside lookback window', () => {
    const buffer = [makeEntry('agent-1', 1)]; // tick 1, lookback from 100 = ticks 64+
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats).toHaveLength(0);
  });

  it('returns beats within the lookback window', () => {
    const buffer = [
      makeEntry('agent-1', 80),
      makeEntry('agent-1', 90),
      makeEntry('agent-1', 95),
    ];
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats.length).toBeGreaterThan(0);
    expect(beats.every(b => b.entry.tick >= 64)).toBe(true);
  });

  it('only returns entries for the queried agent', () => {
    const buffer = [
      makeEntry('agent-1', 90),
      makeEntry('agent-2', 90), // different agent
    ];
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats.every(b => b.entry.agentId === 'agent-1')).toBe(true);
  });

  it('assigns opener role to first beat', () => {
    const buffer = [
      makeEntry('agent-1', 80),
      makeEntry('agent-1', 90),
      makeEntry('agent-1', 95),
    ];
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats[0].role).toBe('opener');
  });

  it('assigns closer role to last beat', () => {
    const buffer = [
      makeEntry('agent-1', 80),
      makeEntry('agent-1', 90),
      makeEntry('agent-1', 95),
    ];
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats[beats.length - 1].role).toBe('closer');
  });

  it('notable entries score higher', () => {
    const regular = makeEntry('agent-1', 80);
    const notable = makeEntry('agent-1', 81, { isNotable: true });
    const beats = selectBeats('agent-1', [regular, notable], 100, 36);
    const notableBeat = beats.find(b => b.entry.tick === 81);
    const regularBeat = beats.find(b => b.entry.tick === 80);
    if (notableBeat && regularBeat) {
      expect(notableBeat.significance).toBeGreaterThan(regularBeat.significance);
    }
  });

  it('respects STORY_DIGEST_MAX_BEATS cap', () => {
    const buffer = Array.from({ length: 20 }, (_, i) => makeEntry('agent-1', 80 + i));
    const beats = selectBeats('agent-1', buffer, 100, 36);
    expect(beats.length).toBeLessThanOrEqual(5); // default max
  });
});

// ── resolveCurrentTension ─────────────────────────────────────────────────────

describe('resolveCurrentTension', () => {
  it('returns idle when no tension signals detected', () => {
    const graph = makeGraph();
    const tension = resolveCurrentTension(graph, 'agent-1', 100);
    expect(tension.kind).toBe('idle');
  });

  it('returns idle for unknown agent', () => {
    const graph = makeGraph({ getNode: () => null });
    const tension = resolveCurrentTension(graph, 'unknown-agent', 100);
    expect(tension.kind).toBe('idle');
  });

  it('detects open_wound from has_trait edge with category=condition', () => {
    const graph = makeGraph({
      getNode: (id: string) => {
        if (id === 'agent-1') return { id: 'agent-1', type: 'actor', name: 'Test Agent', properties: {} } as any;
        if (id === 'trait-1') return { id: 'trait-1', type: 'trait', name: 'Cursed Mark', properties: { category: 'condition' } } as any;
        return null;
      },
      getOutgoingEdges: (_id: string, type: string) => {
        if (type === 'has_trait') return [{ source: 'agent-1', target: 'trait-1', type: 'has_trait', properties: {} }] as any;
        return [];
      },
    });
    const tension = resolveCurrentTension(graph, 'agent-1', 100);
    expect(tension.kind).toBe('open_wound');
    expect(tension.attachmentLabel).toBe('Cursed Mark');
  });

  it('detects faction_debt from aged owes_favor edge', () => {
    const graph = makeGraph({
      getNode: (id: string) => {
        if (id === 'agent-1') return { id: 'agent-1', type: 'actor', name: 'Test Agent', properties: {} } as any;
        if (id === 'faction-1') return { id: 'faction-1', type: 'faction', name: 'The Guild', properties: {} } as any;
        return null;
      },
      getOutgoingEdges: (_id: string, type: string) => {
        if (type === 'has_trait') return [];
        if (type === 'owes_favor') return [
          { source: 'agent-1', target: 'faction-1', type: 'owes_favor', properties: { grantedTick: 50 } },
        ] as any;
        return [];
      },
    });
    // currentTick 100, grantedTick 50, TENSION_DEBT_AGE_TICKS 24 → 50+24=74 < 100 → is debt
    const tension = resolveCurrentTension(graph, 'agent-1', 100);
    expect(tension.kind).toBe('faction_debt');
    expect(tension.factionName).toBe('The Guild');
  });

  it('does not flag recent owes_favor as faction_debt', () => {
    const graph = makeGraph({
      getNode: (id: string) => {
        if (id === 'agent-1') return { id: 'agent-1', type: 'actor', name: 'Test Agent', properties: {} } as any;
        if (id === 'faction-1') return { id: 'faction-1', type: 'faction', name: 'The Guild', properties: {} } as any;
        return null;
      },
      getOutgoingEdges: (_id: string, type: string) => {
        if (type === 'has_trait') return [];
        if (type === 'owes_favor') return [
          { source: 'agent-1', target: 'faction-1', type: 'owes_favor', properties: { grantedTick: 85 } },
        ] as any;
        return [];
      },
    });
    // currentTick 100, grantedTick 85, TENSION_DEBT_AGE_TICKS 24 → 85+24=109 > 100 → not debt yet
    const tension = resolveCurrentTension(graph, 'agent-1', 100);
    expect(tension.kind).toBe('idle');
  });
});

// ── composeThreadStory ────────────────────────────────────────────────────────

describe('composeThreadStory', () => {
  it('returns isEmpty=true when not enough beats', () => {
    const graph = makeGraph();
    const result = composeThreadStory(graph, 'agent-1', [], 100);
    expect(result.isEmpty).toBe(true);
    expect(result.beatLines).toHaveLength(1); // empty state line
  });

  it('returns composition with agentName from graph', () => {
    const graph = makeGraph();
    const result = composeThreadStory(graph, 'agent-1', [], 100);
    expect(result.agentName).toBe('Test Agent');
  });

  it('returns non-empty composition with enough beats', () => {
    const graph = makeGraph();
    const buffer = [
      makeEntry('agent-1', 75),
      makeEntry('agent-1', 85),
      makeEntry('agent-1', 95),
    ];
    const result = composeThreadStory(graph, 'agent-1', buffer, 100);
    expect(result.isEmpty).toBe(false);
    expect(result.beatLines.length).toBeGreaterThanOrEqual(2);
  });

  it('includes a tension line', () => {
    const graph = makeGraph();
    const result = composeThreadStory(graph, 'agent-1', [], 100);
    expect(typeof result.tensionLine).toBe('string');
    expect(result.tensionLine.length).toBeGreaterThan(0);
  });

  it('sets currentTickWhenComposed', () => {
    const graph = makeGraph();
    const result = composeThreadStory(graph, 'agent-1', [], 55);
    expect(result.currentTickWhenComposed).toBe(55);
  });
});
