/**
 * THR-1797 — a Tier-2 detail card never shows a stored key under the name, and
 * "Threads between them" shows each (person, kind) pair once.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateDetailPage, subtitleForNode } from '../detailPageGenerator';
import type { GraphPageKind } from '../../types/detailPage';
import type { GraphNode, GraphEdge } from '../../types/graph';

const SNAKE_KEY = /_|\b[a-z]+_[a-z]+\b/;

function n(properties: Record<string, unknown>) {
  return { name: 'Someone', properties };
}

describe('subtitleForNode — every page kind words its key (THR-1797)', () => {
  const cases: Array<[GraphPageKind, Record<string, unknown>, string]> = [
    ['actor', { narrativeArchetype: 'true_believer' }, 'True Believer'],
    ['actor', { narrativeArchetype: 'not_an_archetype' }, 'not an archetype'],
    ['actor', { role: 'high_priest', narrativeArchetype: 'true_believer' }, 'high priest'],
    ['actor', {}, 'figure of the world'],
    ['item', { category: 'sacred_relic' }, 'sacred relic'],
    ['item', {}, 'artifact'],
    ['faction', { factionType: 'trade_guild' }, 'trade guild'],
    ['faction', {}, 'faction'],
    ['place', { locationSubtype: 'river_ford' }, 'river ford'],
    ['place', { terrain: 'deep_forest' }, 'deep forest'],
    ['place', {}, 'place'],
    ['event', { eventType: 'encounter_outcome' }, 'encounter outcome'],
    ['event', {}, 'event'],
    ['group', { groupKind: 'war_band' }, 'war band'],
    ['group', {}, 'company'],
  ];

  for (const [kind, props, expected] of cases) {
    it(`${kind} ${JSON.stringify(props)} → "${expected}"`, () => {
      const subtitle = subtitleForNode(n(props), kind);
      expect(subtitle).toBe(expected);
      expect(subtitle).not.toMatch(SNAKE_KEY);
    });
  }

  it('an empty or non-string key falls through to the default word', () => {
    expect(subtitleForNode(n({ role: '', narrativeArchetype: 'oathkeeper' }), 'actor')).not.toMatch(SNAKE_KEY);
    expect(subtitleForNode(n({ category: 42 }), 'item')).toBe('artifact');
    expect(subtitleForNode(n({ factionType: '__' }), 'faction')).toBe('faction');
  });
});

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type' | 'name'>): GraphNode {
  return { properties: {}, ...partial };
}

function edge(id: string, source: string, target: string, properties: Record<string, unknown>): GraphEdge {
  return { id, source, target, type: 'relates_to', properties };
}

describe('threads_between_them — one chip per (person, kind) (THR-1797)', () => {
  it('A→B and B→A of the same kind render one chip; a second kind keeps its own', () => {
    const g = new WorldGraph();
    g.addNode(node({ id: 'protag', type: 'actor', name: 'The First', properties: { actorType: 'individual' } }));
    g.addNode(node({ id: 'scorvin', type: 'actor', name: 'Scorvin', properties: { actorType: 'individual', narrativeArchetype: 'true_believer' } }));
    g.addNode(node({ id: 'perrin', type: 'actor', name: 'Perrin', properties: { actorType: 'individual' } }));
    g.addEdge(edge('a', 'scorvin', 'perrin', { basis: 'friendship', sentiment: 0.5 }));
    g.addEdge(edge('b', 'perrin', 'scorvin', { basis: 'friendship', sentiment: 0.5 }));
    g.addEdge(edge('c', 'scorvin', 'perrin', { basis: 'rivalry', sentiment: -0.5 }));

    const page = generateDetailPage({
      nodeId: 'scorvin',
      pageKind: 'actor',
      graph: g,
      tick: 1,
      seed: 42,
      protagonistId: 'protag',
    });

    expect(page.subtitle).toBe('True Believer');
    const threads = page.sections.find((s) => s.typeId === 'threads_between_them');
    expect(threads?.kind).toBe('chips');
    if (threads?.kind !== 'chips') return;
    const pairs = threads.chips.map((c) => `${c.label}/${c.flavour}`);
    expect(pairs).toEqual(['Perrin/friendship', 'Perrin/rivalry']);
  });
});
