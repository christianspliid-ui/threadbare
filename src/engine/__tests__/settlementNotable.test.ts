/**
 * settlementNotable (THR-1655) — the settlement page's notable line, read from state.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getSettlementNotable } from '../settlementNotable';
import { resolveTooltip } from '../tooltipResolver';
import { bondBasisWord } from '../../data/bond-basis';
import { FAMILIARITY_THRESHOLDS } from '../../types/familiarity';

function actor(graph: WorldGraph, id: string, name: string, extra: Record<string, unknown> = {}) {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', ...extra } });
}

function edge(graph: WorldGraph, type: string, source: string, target: string, properties: Record<string, unknown> = {}) {
  graph.addEdge({ id: `${type}_${source}_${target}`, type: type as never, source, target, properties });
}

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'loc.yard', type: 'location', name: "Tanner's Yard", properties: { parentLocationId: 'loc.town' } });
  actor(graph, 'a.notable', 'Maren Dusk', { spotlightTier: 'notable', notableOrigin: 'worldgen' });
  actor(graph, 'a.hero', 'Kael Thornweaver', { spotlightTier: 'spotlight' });
  actor(graph, 'a.other', 'Ysolde Vane', { spotlightTier: 'spotlight' });
  actor(graph, 'a.debtor', 'Oren Pike', { spotlightTier: 'spotlight' });
  edge(graph, 'located_at', 'a.notable', 'loc.yard');
  edge(graph, 'owns', 'a.notable', 'loc.yard');
  edge(graph, 'hostile_to', 'a.notable', 'a.hero', { cause: 'old_quarrel' });
  edge(graph, 'knows_secret_of', 'a.notable', 'a.other', { revealed: false });
  edge(graph, 'owes_favor', 'a.debtor', 'a.notable', { redeemed: false, broken: false });
  return graph;
}

describe('getSettlementNotable', () => {
  it('finds the resident notable in a Place and builds every clause in sentence order', () => {
    const result = getSettlementNotable(buildWorld(), 'loc.town');
    expect(result?.notableId).toBe('a.notable');
    expect(result?.clauses.map(c => [c.kind, c.targetId, c.targetKind])).toEqual([
      ['holds', 'loc.yard', 'sublocation'],
      ['at_odds_with', 'a.hero', 'agent'],
      ['knows_secret_of', 'a.other', 'agent'],
      ['is_owed_by', 'a.debtor', 'agent'],
    ]);
    expect(result?.secretWithheld).toBe(false);
  });

  it('withholds the secret clause below `known`, and shows it at `known`', () => {
    const graph = buildWorld();
    const stranger = getSettlementNotable(graph, 'loc.town', { familiarityMap: new Map() });
    expect(stranger?.clauses.some(c => c.kind === 'knows_secret_of')).toBe(false);
    expect(stranger?.secretWithheld).toBe(true);
    const known = getSettlementNotable(graph, 'loc.town', {
      familiarityMap: new Map([['a.notable', FAMILIARITY_THRESHOLDS.known]]),
    });
    expect(known?.clauses.some(c => c.kind === 'knows_secret_of')).toBe(true);
  });

  it('drops a clause whose edge is spent or whose other end is dead', () => {
    const graph = buildWorld();
    graph.updateNode('a.hero', { properties: { alive: false } });
    const spent = graph.getOutgoingEdges('a.debtor', 'owes_favor')[0];
    graph.updateEdge(spent.id, { properties: { ...spent.properties, redeemed: true } });
    const kinds = getSettlementNotable(graph, 'loc.town')?.clauses.map(c => c.kind);
    expect(kinds).toEqual(['holds', 'knows_secret_of']);
  });

  it('ignores a grudge that is not the old quarrel', () => {
    const graph = buildWorld();
    edge(graph, 'hostile_to', 'a.notable', 'a.other', { cause: 'murder' });
    const odds = getSettlementNotable(graph, 'loc.town')?.clauses.filter(c => c.kind === 'at_odds_with');
    expect(odds?.map(c => c.targetId)).toEqual(['a.hero']);
  });

  it('returns null with no living resident notable', () => {
    const graph = buildWorld();
    expect(getSettlementNotable(graph, 'loc.elsewhere')).toBeNull();
    graph.updateNode('a.notable', { properties: { alive: false } });
    expect(getSettlementNotable(graph, 'loc.town')).toBeNull();
  });
});

describe('bond and notable words (THR-1655)', () => {
  it('resolves the concept tooltips with no context', () => {
    for (const id of ['agent.bond.kin', 'agent.bond.friendship', 'agent.bond.rivalry', 'agent.notable']) {
      const tip = resolveTooltip(id);
      expect(tip?.label).toBeTruthy();
      expect(tip?.desc).toBeTruthy();
      expect(tip?.desc?.length ?? 0).toBeLessThanOrEqual(200);
    }
  });

  it('words a basis through its alias and renders none for an unknown basis', () => {
    expect(bondBasisWord('kin')).toBe('kin');
    expect(bondBasisWord('friendship')).toBe('friend');
    expect(bondBasisWord('unknown')).toBeNull();
    expect(bondBasisWord(undefined)).toBeNull();
  });
});
