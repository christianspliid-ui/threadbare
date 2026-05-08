/**
 * detailPageGenerator — unit tests covering all 5 page kinds + fail-soft + cache.
 *
 * Strategy: build a small `WorldGraph` per test, exercise `generateDetailPage`,
 * assert sections, mandatory floor, click-through refs, fail-soft stub.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  clearDetailPageCache,
  generateDetailPage,
} from '../detailPageGenerator';
import type { GraphNode, GraphEdge } from '../../types/graph';

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type' | 'name'>): GraphNode {
  return { properties: {}, ...partial };
}

function edge(
  id: string,
  source: string,
  target: string,
  type: GraphEdge['type'],
  properties: Record<string, unknown> = {},
): GraphEdge {
  return { id, source, target, type, properties };
}

function fixtureGraph() {
  const g = new WorldGraph();
  g.addNode(
    node({
      id: 'protag',
      type: 'actor',
      name: 'Avatar of Witness',
      properties: { actorType: 'individual', isPortfolioPinned: true },
    }),
  );
  g.addNode(
    node({
      id: 'veiren',
      type: 'actor',
      name: 'Captain Veiren',
      properties: {
        actorType: 'individual',
        narrativeArchetype: 'guardian',
        sphereInfluence: { spirit: 0.7, force: 0.3 },
        reaches: { command: 0.82, weapons: 0.65, lore: 0.4 },
      },
    }),
  );
  g.addNode(
    node({
      id: 'iron-market',
      type: 'location',
      name: 'The Iron Market',
      properties: { locationSubtype: 'market', sphereInfluence: { matter: 0.6 } },
    }),
  );
  g.addNode(
    node({
      id: 'iron-guard',
      type: 'actor',
      name: 'The Iron Guard',
      properties: {
        actorType: 'faction',
        factionType: 'guard',
        sphereInfluence: { force: 0.7 },
        reputations: {
          protag: { phrase: 'they call you a stranger but watch closely', sentiment: 0 },
        },
      },
    }),
  );
  g.addNode(
    node({
      id: 'shadow-cabal',
      type: 'actor',
      name: 'The Shadow Cabal',
      properties: { actorType: 'faction' },
    }),
  );
  g.addNode(
    node({
      id: 'token',
      type: 'artifact',
      name: 'Veirens Token',
      properties: { category: 'token', sphereInfluence: { spirit: 0.8 } },
    }),
  );
  g.addNode(
    node({
      id: 'evt-1',
      type: 'event',
      name: 'A meeting in the market',
      properties: {
        eventType: 'encounter_outcome',
        tick: 5,
        locationId: 'iron-market',
        participantIds: ['protag', 'veiren'],
        summary: 'You met under the iron arch and traded a single name.',
        outcome: 'success',
      },
    }),
  );

  // Edges (with required schema properties to keep dev validation quiet)
  g.addEdge(
    edge('e1', 'veiren', 'iron-guard', 'member_of', {
      rank: 'captain',
      role: 'captain',
      joinedTick: 0,
    }),
  );
  g.addEdge(
    edge('e2', 'veiren', 'protag', 'relates_to', {
      basis: 'a debt unspoken',
      sentiment: 0.4,
    }),
  );
  g.addEdge(edge('e3', 'iron-guard', 'shadow-cabal', 'hostile_to'));
  g.addEdge(edge('e4', 'protag', 'token', 'possesses'));
  g.addEdge(
    edge('e5', 'veiren', 'evt-1', 'participated_in', {
      role: 'protagonist',
      outcome: 'success',
      tick: 5,
    }),
  );
  g.addEdge(
    edge('e6', 'protag', 'evt-1', 'participated_in', {
      role: 'witness',
      outcome: 'success',
      tick: 5,
    }),
  );
  g.addEdge(edge('e7', 'evt-1', 'iron-market', 'occurred_at', { tick: 5 }));

  return g;
}

beforeEach(() => clearDetailPageCache());

describe('generateDetailPage — Actor', () => {
  it('renders mandatory portrait + at least one optional section', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });

    expect(page.kind).toBe('actor');
    expect(page.kindLabel).toBe('ACTOR');
    expect(page.displayName).toBe('Captain Veiren');
    expect(page.sections.length).toBeGreaterThanOrEqual(2);

    const portrait = page.sections.find((s) => s.typeId === 'portrait_with_disposition');
    expect(portrait).toBeDefined();
    expect(portrait!.kind).toBe('portrait');
    expect(portrait!.gold).toBe(true);

    const allegiances = page.sections.find((s) => s.typeId === 'faction_allegiances');
    expect(allegiances?.kind).toBe('chips');
  });

  it('marks page hasFullSheet only when actor is the protagonist or pinned', () => {
    const graph = fixtureGraph();
    const veirenPage = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    expect(veirenPage.hasFullSheet).toBe(false);

    const protagPage = generateDetailPage({
      nodeId: 'protag',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    expect(protagPage.hasFullSheet).toBe(true);
  });

  it('threads_between_them carries clickRef descriptors', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const threads = page.sections.find((s) => s.typeId === 'threads_between_them');
    expect(threads).toBeDefined();
    if (threads?.kind === 'chips') {
      const protagChip = threads.chips.find((c) => c.label === 'Avatar of Witness');
      expect(protagChip?.clickRef?.pageKind).toBe('actor');
      expect(protagChip?.sentiment).toBe('positive');
    }
  });
});

describe('generateDetailPage — Item', () => {
  it('renders mandatory icon + acquisition prose from possesses edge', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'token',
      pageKind: 'item',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    expect(page.kindLabel).toBe('ITEM');
    expect(page.sections[0].typeId).toBe('icon_with_meaning');
    const acquisition = page.sections.find((s) => s.typeId === 'who_gave_it');
    expect(acquisition?.kind).toBe('prose');
    if (acquisition?.kind === 'prose') {
      expect(acquisition.prose).toMatch(/Avatar of Witness/);
    }
  });
});

describe('generateDetailPage — Faction', () => {
  it('always renders mandatory how_they_hold_her + reputations panel', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'iron-guard',
      pageKind: 'faction',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const holds = page.sections.find((s) => s.typeId === 'how_they_hold_her');
    const reps = page.sections.find((s) => s.typeId === 'reputations_they_hold');
    expect(holds).toBeDefined();
    expect(holds?.kind).toBe('prose');
    if (holds?.kind === 'prose') expect(holds.gold).toBe(true);
    expect(reps).toBeDefined();
    expect(reps?.kind).toBe('panel');
  });

  it('opposed section surfaces hostile_to chips with negative sentiment', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'iron-guard',
      pageKind: 'faction',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const opposed = page.sections.find((s) => s.typeId === 'opposed');
    expect(opposed).toBeDefined();
    if (opposed?.kind === 'chips') {
      expect(opposed.chips[0].label).toBe('The Shadow Cabal');
      expect(opposed.chips[0].sentiment).toBe('negative');
    }
  });
});

describe('generateDetailPage — Place', () => {
  it('renders mandatory painting + wants prose', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'iron-market',
      pageKind: 'place',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const painting = page.sections.find((s) => s.typeId === 'place_painting');
    const wants = page.sections.find((s) => s.typeId === 'what_this_place_wants');
    expect(painting?.kind).toBe('portrait');
    expect(wants?.kind).toBe('prose');
    if (wants?.kind === 'prose') {
      expect(wants.gold).toBe(true);
      expect(wants.prose.length).toBeGreaterThan(0);
    }
  });

  it('memory section surfaces recent occurred_at events', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'iron-market',
      pageKind: 'place',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const memory = page.sections.find((s) => s.typeId === 'memory');
    expect(memory?.kind).toBe('prose');
    if (memory?.kind === 'prose') {
      expect(memory.prose).toMatch(/iron arch/);
    }
  });
});

describe('generateDetailPage — Event', () => {
  it('renders mandatory what_happened + participants chips', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'evt-1',
      pageKind: 'event',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const happened = page.sections.find((s) => s.typeId === 'what_happened');
    const who = page.sections.find((s) => s.typeId === 'who_was_there');
    expect(happened?.kind).toBe('prose');
    if (happened?.kind === 'prose') expect(happened.gold).toBe(true);
    expect(who?.kind).toBe('chips');
    if (who?.kind === 'chips') {
      const labels = who.chips.map((c) => c.label).sort();
      expect(labels).toContain('Captain Veiren');
      expect(labels).toContain('Avatar of Witness');
    }
  });
});

describe('generateDetailPage — fail-soft', () => {
  it('returns unknown-entity stub when nodeId is missing', () => {
    const graph = new WorldGraph();
    const page = generateDetailPage({
      nodeId: 'no-such-node',
      pageKind: 'actor',
      graph,
      tick: 0,
      seed: 0,
    });
    expect(page.displayName).toBe('Unknown');
    expect(page.subtitle).toMatch(/no longer/);
    expect(page.sections[0].typeId).toBe('unknown_stub');
  });

  it('returns unknown-entity stub when node type mismatches pageKind', () => {
    const graph = fixtureGraph();
    const page = generateDetailPage({
      nodeId: 'iron-market', // location, not actor
      pageKind: 'actor',
      graph,
      tick: 0,
      seed: 0,
    });
    expect(page.displayName).toBe('Unknown');
  });
});

describe('generateDetailPage — caching', () => {
  it('returns the same page reference for repeated same-tick calls', () => {
    const graph = fixtureGraph();
    const a = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const b = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    expect(a).toBe(b);
  });

  it('evicts cache when tick advances', () => {
    const graph = fixtureGraph();
    const a = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 6,
      seed: 42,
      protagonistId: 'protag',
    });
    const b = generateDetailPage({
      nodeId: 'veiren',
      pageKind: 'actor',
      graph,
      tick: 7,
      seed: 42,
      protagonistId: 'protag',
    });
    expect(a).not.toBe(b);
  });
});
