import { describe, it, expect } from 'vitest';
import {
  buildIntelligenceDisplay,
  INTEL_CATEGORY_LABELS,
  INTEL_PANEL_MAX_RECORDS,
  INTEL_PANEL_FOG_MIN_TIER,
  RELIABILITY_RANK_RELIABLE,
  RELIABILITY_RANK_UNCERTAIN,
  RELIABILITY_RANK_DUBIOUS,
} from '../intelligence';
import type { IntelligenceRecord, IntelligenceCategory } from '../../types/unifiedAction';
import type { WorldGraph } from '../graph';

// ─── Fixtures ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<IntelligenceRecord> = {}): IntelligenceRecord {
  return {
    recordId: 'rec-1',
    agentId: 'agent-a',
    category: 'shrine_location',
    label: 'A hidden shrine',
    detail: 'A shrine concealed in the eastern woods.',
    reliability: 0.8,
    acquiredTick: 10,
    sourceEncounterId: 'enc-1',
    ...overrides,
  };
}

function makeGraph(nodes: Record<string, { name: string; type: string }>): WorldGraph {
  return {
    getNode: (id: string) => {
      const n = nodes[id];
      if (!n) return undefined;
      return { id, name: n.name, type: n.type, properties: {} } as ReturnType<WorldGraph['getNode']>;
    },
  } as unknown as WorldGraph;
}

// ─── Constants coverage ───────────────────────────────────────────

describe('INTEL_CATEGORY_LABELS', () => {
  it('covers all IntelligenceCategory values', () => {
    const categories: IntelligenceCategory[] = [
      'shrine_location',
      'agent_network',
      'trade_route',
      'military_position',
      'political_secret',
      'cultural_knowledge',
    ];
    for (const cat of categories) {
      expect(INTEL_CATEGORY_LABELS[cat]).toBeTypeOf('string');
      expect(INTEL_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });
});

describe('constants', () => {
  it('exports expected default values', () => {
    expect(INTEL_PANEL_MAX_RECORDS).toBe(24);
    expect(INTEL_PANEL_FOG_MIN_TIER).toBe(1);
    expect(RELIABILITY_RANK_RELIABLE).toBe(0);
    expect(RELIABILITY_RANK_UNCERTAIN).toBe(1);
    expect(RELIABILITY_RANK_DUBIOUS).toBe(2);
  });
});

// ─── buildIntelligenceDisplay ─────────────────────────────────────

describe('buildIntelligenceDisplay', () => {
  it('returns [] when records is undefined', () => {
    const result = buildIntelligenceDisplay(undefined, 'agent-a', undefined, 20);
    expect(result).toEqual([]);
  });

  it('returns [] when records is empty', () => {
    const result = buildIntelligenceDisplay([], 'agent-a', undefined, 20);
    expect(result).toEqual([]);
  });

  it('returns [] when no records belong to the given agent', () => {
    const records = [makeRecord({ agentId: 'other-agent' })];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result).toEqual([]);
  });

  it('filters to only the given agent', () => {
    const records = [
      makeRecord({ recordId: 'rec-a', agentId: 'agent-a' }),
      makeRecord({ recordId: 'rec-b', agentId: 'other-agent' }),
    ];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result).toHaveLength(1);
    expect(result[0].recordId).toBe('rec-a');
  });

  it('sorts reliable before uncertain before dubious', () => {
    const records = [
      makeRecord({ recordId: 'dubious', reliability: 0.1, acquiredTick: 10 }),
      makeRecord({ recordId: 'reliable', reliability: 0.9, acquiredTick: 10 }),
      makeRecord({ recordId: 'uncertain', reliability: 0.5, acquiredTick: 10 }),
    ];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result[0].recordId).toBe('reliable');
    expect(result[1].recordId).toBe('uncertain');
    expect(result[2].recordId).toBe('dubious');
  });

  it('within same reliability tier, sorts most recent first', () => {
    const records = [
      makeRecord({ recordId: 'old', reliability: 0.9, acquiredTick: 5 }),
      makeRecord({ recordId: 'new', reliability: 0.9, acquiredTick: 15 }),
      makeRecord({ recordId: 'mid', reliability: 0.9, acquiredTick: 10 }),
    ];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result[0].recordId).toBe('new');
    expect(result[1].recordId).toBe('mid');
    expect(result[2].recordId).toBe('old');
  });

  describe('acquiredLabel formatting', () => {
    it('returns "today" when delta is 0', () => {
      const result = buildIntelligenceDisplay([makeRecord({ acquiredTick: 20 })], 'agent-a', undefined, 20);
      expect(result[0].acquiredLabel).toBe('today');
      expect(result[0].acquiredDaysAgo).toBe(0);
    });

    it('returns "1 day ago" when delta is 1', () => {
      const result = buildIntelligenceDisplay([makeRecord({ acquiredTick: 19 })], 'agent-a', undefined, 20);
      expect(result[0].acquiredLabel).toBe('1 day ago');
    });

    it('returns "N days ago" for larger deltas', () => {
      const result = buildIntelligenceDisplay([makeRecord({ acquiredTick: 15 })], 'agent-a', undefined, 20);
      expect(result[0].acquiredLabel).toBe('5 days ago');
    });

    it('clamps negative delta to "today"', () => {
      const result = buildIntelligenceDisplay([makeRecord({ acquiredTick: 25 })], 'agent-a', undefined, 20);
      expect(result[0].acquiredLabel).toBe('today');
      expect(result[0].acquiredDaysAgo).toBe(0);
    });

    it('uses acquiredTick as fallback when currentTick is undefined', () => {
      const result = buildIntelligenceDisplay([makeRecord({ acquiredTick: 10 })], 'agent-a', undefined, undefined);
      expect(result[0].acquiredLabel).toBe('today');
      expect(result[0].acquiredDaysAgo).toBe(0);
    });
  });

  describe('graph resolution', () => {
    it('resolves actor node to agent kind', () => {
      const graph = makeGraph({ 'actor-1': { name: 'Serafina', type: 'actor' } });
      const records = [makeRecord({ targetEntityId: 'actor-1' })];
      const result = buildIntelligenceDisplay(records, 'agent-a', graph, 20);
      expect(result[0].targetDisplayName).toBe('Serafina');
      expect(result[0].targetKind).toBe('agent');
    });

    it('resolves location node to location kind', () => {
      const graph = makeGraph({ 'loc-1': { name: 'Thornwall', type: 'location' } });
      const records = [makeRecord({ targetEntityId: 'loc-1' })];
      const result = buildIntelligenceDisplay(records, 'agent-a', graph, 20);
      expect(result[0].targetDisplayName).toBe('Thornwall');
      expect(result[0].targetKind).toBe('location');
    });

    it('resolves missing node to unknown kind with null displayName', () => {
      const graph = makeGraph({});
      const records = [makeRecord({ targetEntityId: 'missing-node' })];
      const result = buildIntelligenceDisplay(records, 'agent-a', graph, 20);
      expect(result[0].targetDisplayName).toBeNull();
      expect(result[0].targetKind).toBe('unknown');
    });

    it('resolves targetRegion when no entityId is set', () => {
      const records = [makeRecord({ targetEntityId: undefined, targetRegion: 'eastern-wastes' })];
      const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
      expect(result[0].targetDisplayName).toBe('eastern-wastes');
      expect(result[0].targetKind).toBe('region');
    });

    it('produces unknown kind when neither entityId nor targetRegion is set', () => {
      const records = [makeRecord({ targetEntityId: undefined, targetRegion: undefined })];
      const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
      expect(result[0].targetDisplayName).toBeNull();
      expect(result[0].targetKind).toBe('unknown');
    });

    it('uses record label when graph is undefined', () => {
      const records = [makeRecord({ targetEntityId: 'some-id' })];
      const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
      expect(result[0].targetDisplayName).toBeNull();
      expect(result[0].label).toBe('A hidden shrine');
    });
  });

  it('treats NaN reliability as dubious', () => {
    const records = [makeRecord({ reliability: NaN })];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result[0].reliabilityDescriptor).toBe('dubious');
    expect(result[0].reliabilityRank).toBe(RELIABILITY_RANK_DUBIOUS);
  });

  it('includes categoryLabel from INTEL_CATEGORY_LABELS', () => {
    const records = [makeRecord({ category: 'trade_route' })];
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 20);
    expect(result[0].categoryLabel).toBe('Trade Route');
  });

  it('returns full unsorted list (truncation is caller responsibility)', () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      makeRecord({ recordId: `rec-${i}`, acquiredTick: i }),
    );
    const result = buildIntelligenceDisplay(records, 'agent-a', undefined, 50);
    expect(result).toHaveLength(30);
  });
});
