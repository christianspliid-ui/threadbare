import { describe, it, expect, vi } from 'vitest';
import { phaseComposition } from '../phaseComposition';
import type { GameState, ActiveComposition } from '../../types/gameState';
import type { FilterQuery, Phase, WorldPredicate } from '../../composition-dsl/schema';
import { WorldGraph } from '../graph';
import type { EdgeType, GraphEdge, GraphNode } from '../../types/graph';

// ─── Minimal GameState factory ─────────────────────────────────────

function makeDoomClock(stage: number) {
  return {
    currentStage: stage,
    currentTick: stage * 20,
    totalTicks: 100,
    progress: stage * 0.2,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
  } as unknown as GameState['doomClock'];
}

function makeState(
  compositions: (ActiveComposition & { phases?: Phase[] })[],
  extra: Partial<GameState> = {}
): GameState {
  return {
    tick: 10,
    cycle: 0,
    seed: 42,
    graph: new WorldGraph() as WorldGraph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc-1',
    essencePool: new Map(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: makeDoomClock(5),
    doomIdentityMatrix: null,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
    activeCompositions: compositions as ActiveComposition[],
    worldFlags: {},
    firedCompositions: [],
    storyBeatQueue: [],
    ...extra,
  } as unknown as GameState;
}

function makeActiveComposition(
  id: string,
  phases: Phase[]
): ActiveComposition & { phases: Phase[] } {
  return {
    compositionId: id,
    firedAtTick: 1,
    activatedPhaseIds: [],
    phaseActivationTicks: {},
    resolvedNodes: {},
    status: 'active',
    lastEvaluationTick: 1,
    phases,
  };
}

function makePhase(id: string, predicate: WorldPredicate): Phase {
  return { id, activatesAt: predicate, activates: [] };
}

function addActorNode(graph: WorldGraph, id: string, actorType: string, archetypeField: string, archetype: string): void {
  const node: GraphNode = {
    id,
    type: 'actor',
    name: id,
    properties: { actorType, [archetypeField]: archetype },
  };
  graph.addNode(node);
}

// ─── world-flag tests ──────────────────────────────────────────────

describe('evaluatePhasePredicateV1 — world-flag', () => {
  it('passes when flag matches expected value (true)', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'world-flag', key: 'test.flag', value: true }),
    ]);
    const state = makeState([comp], { worldFlags: { 'test.flag': true } });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('fails when flag is set to false but predicate expects true', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'world-flag', key: 'test.flag', value: true }),
    ]);
    const state = makeState([comp], { worldFlags: { 'test.flag': false } });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('passes when flag is explicitly undefined and predicate expects undefined', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'world-flag', key: 'missing.flag', value: undefined }),
    ]);
    const state = makeState([comp], { worldFlags: {} });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('fails when flag is missing and predicate expects true', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'world-flag', key: 'missing.flag', value: true }),
    ]);
    const state = makeState([comp], { worldFlags: {} });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('treats undefined worldFlags as empty object — presence checks fail', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'world-flag', key: 'any.flag', value: true }),
    ]);
    const state = makeState([comp]);
    // worldFlags defaults to {} in makeState; test that missing flag returns false
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });
});

// ─── has-faction-of-archetype tests ───────────────────────────────

describe('evaluatePhasePredicateV1 — has-faction-of-archetype', () => {
  it('fails with empty graph — presence semantics (≥1) not met', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order' }),
    ]);
    const state = makeState([comp]);
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('passes with one matching faction and no count bounds (presence semantics)', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order' }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('passes when count.gte is satisfied', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { gte: 2 } }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_order');
    addActorNode(state.graph as WorldGraph, 'f2', 'faction', 'factionDefId', 'divine_order');
    addActorNode(state.graph as WorldGraph, 'f3', 'faction', 'factionDefId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('fails when count.gte is not satisfied', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { gte: 2 } }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('count.lte: 0 means absence — fails when one exists', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { lte: 0 } }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('count.lte: 0 passes when none exist', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { lte: 0 } }),
    ]);
    const state = makeState([comp]);
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('does not count factions with a different factionDefId', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order' }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'other_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('does not count individual actors as factions even if same archetype string', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-faction-of-archetype', archetype: 'divine_order' }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'a1', 'individual', 'archetypeId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });
});

// ─── has-agent-of-archetype tests ─────────────────────────────────

describe('evaluatePhasePredicateV1 — has-agent-of-archetype', () => {
  it('fails with empty graph', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-agent-of-archetype', archetype: 'plague_herald' }),
    ]);
    const state = makeState([comp]);
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('passes with one matching individual agent', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-agent-of-archetype', archetype: 'plague_herald' }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'a1', 'individual', 'archetypeId', 'plague_herald');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('does not count ascendant actors — v1 documented narrowing (individual only)', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-agent-of-archetype', archetype: 'witness' }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'asc1', 'ascendant', 'archetypeId', 'witness');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('respects count bounds for agents', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', { op: 'has-agent-of-archetype', archetype: 'plague_herald', count: { gte: 2 } }),
    ]);
    const state = makeState([comp]);
    addActorNode(state.graph as WorldGraph, 'a1', 'individual', 'archetypeId', 'plague_herald');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });
});

// ─── Composition in phase predicates ──────────────────────────────

describe('evaluatePhasePredicateV1 — and/or/not wrapping new ops', () => {
  it('and: passes when all terms pass', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', {
        op: 'and',
        terms: [
          { op: 'world-flag', key: 'flag.a', value: true },
          { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { gte: 1 } },
        ],
      }),
    ]);
    const state = makeState([comp], { worldFlags: { 'flag.a': true } });
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('and: fails when one term fails', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', {
        op: 'and',
        terms: [
          { op: 'world-flag', key: 'flag.a', value: true },
          { op: 'has-faction-of-archetype', archetype: 'divine_order', count: { gte: 1 } },
        ],
      }),
    ]);
    // flag passes, but no faction
    const state = makeState([comp], { worldFlags: { 'flag.a': true } });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).not.toContain('p1');
  });

  it('or: passes when at least one term passes', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', {
        op: 'or',
        terms: [
          { op: 'world-flag', key: 'flag.a', value: true },
          { op: 'has-agent-of-archetype', archetype: 'plague_herald' },
        ],
      }),
    ]);
    // only flag passes
    const state = makeState([comp], { worldFlags: { 'flag.a': true } });
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('not: inverts world-flag result', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p1', {
        op: 'not',
        term: { op: 'world-flag', key: 'plague.active', value: true },
      }),
    ]);
    // flag is NOT set — not(false) = true
    const state = makeState([comp]);
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p1');
  });

  it('three-term and mirrors chain-weakens phase-5-reckoning fixture', () => {
    const comp = makeActiveComposition('comp-1', [
      makePhase('p5', {
        op: 'and',
        terms: [
          { op: 'doom-clock', comparator: 'gte', tier: 4 },
          { op: 'world-flag', key: 'chain-weakens.plague-materialized', value: true },
          { op: 'has-faction-of-archetype', archetype: 'divine_champion_order', count: { gte: 1 } },
        ],
      }),
    ]);
    const state = makeState(
      [comp],
      { worldFlags: { 'chain-weakens.plague-materialized': true } }
    );
    // doom-clock stage=5 ≥ 4 ✓, flag set ✓, faction present ✓
    addActorNode(state.graph as WorldGraph, 'f1', 'faction', 'factionDefId', 'divine_champion_order');
    const result = phaseComposition(state);
    const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-1');
    expect(updated?.activatedPhaseIds).toContain('p5');
  });
});

// ─── edge-exists tests ─────────────────────────────────────────────

function addNode(
  graph: WorldGraph,
  id: string,
  type: GraphNode['type'],
  properties: Record<string, unknown>
): void {
  graph.addNode({
    id,
    type,
    name: id,
    properties,
  });
}

function addEdge(
  graph: WorldGraph,
  id: string,
  source: string,
  target: string,
  type: EdgeType
): void {
  const edge: GraphEdge = {
    id,
    source,
    target,
    type,
    properties: {},
  };
  graph.addEdge(edge);
}

function runEdgeExistsPredicate(
  predicate: WorldPredicate,
  setupGraph: (graph: WorldGraph) => void
): { activated: boolean } {
  const comp = makeActiveComposition('comp-edge', [makePhase('p-edge', predicate)]);
  const state = makeState([comp]);
  setupGraph(state.graph as WorldGraph);
  const result = phaseComposition(state);
  const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-edge');
  return { activated: Boolean(updated?.activatedPhaseIds.includes('p-edge')) };
}

describe('evaluatePhasePredicateV1 — edge-exists predicate', () => {
  it('passes when a from-node has the configured edge and toFilter is omitted', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source' });
        addNode(graph, 'b', 'actor', { role: 'target' });
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('fails when no node matches fromFilter', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'other' });
        addNode(graph, 'b', 'actor', { role: 'target' });
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(false);
  });

  it('fails when from-node matches but does not have the requested edge type', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source' });
        addNode(graph, 'b', 'location', { role: 'target' });
        addEdge(graph, 'e1', 'a', 'b', 'located_at');
      }
    );
    expect(result.activated).toBe(false);
  });

  it('passes when toFilter is provided and an edge target matches it', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
        toFilter: { op: 'prop-equals', prop: 'factionDefId', value: 'divine_order' },
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source' });
        addNode(graph, 'b', 'actor', { actorType: 'faction', factionDefId: 'divine_order' });
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('fails when toFilter is provided and no edge target matches it', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
        toFilter: { op: 'prop-equals', prop: 'factionDefId', value: 'divine_order' },
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source' });
        addNode(graph, 'b', 'actor', { actorType: 'faction', factionDefId: 'other_order' });
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(false);
  });

  it('passes when any matching from-node satisfies the edge condition', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'relates_to',
        toFilter: { op: 'prop-equals', prop: 'status', value: 'chosen' },
      },
      (graph) => {
        addNode(graph, 's1', 'actor', { role: 'source' });
        addNode(graph, 's2', 'actor', { role: 'source' });
        addNode(graph, 't1', 'actor', { status: 'other' });
        addNode(graph, 't2', 'actor', { status: 'chosen' });
        addEdge(graph, 'e1', 's1', 't1', 'relates_to');
        addEdge(graph, 'e2', 's2', 't2', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('supports and in fromFilter', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: {
          op: 'and',
          terms: [
            { op: 'prop-equals', prop: 'role', value: 'source' },
            { op: 'prop-equals', prop: 'tier', value: 2 },
          ],
        },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source', tier: 2 });
        addNode(graph, 'b', 'actor', {});
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('supports or in fromFilter', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: {
          op: 'or',
          terms: [
            { op: 'prop-equals', prop: 'role', value: 'missing' },
            { op: 'prop-equals', prop: 'role', value: 'source' },
          ],
        },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { role: 'source' });
        addNode(graph, 'b', 'actor', {});
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('supports not in fromFilter', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: {
          op: 'not',
          term: { op: 'prop-equals', prop: 'blocked', value: true },
        },
        edgeType: 'relates_to',
      },
      (graph) => {
        addNode(graph, 'a', 'actor', { blocked: false });
        addNode(graph, 'b', 'actor', {});
        addEdge(graph, 'e1', 'a', 'b', 'relates_to');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('supports has-edge inside toFilter', () => {
    const result = runEdgeExistsPredicate(
      {
        op: 'edge-exists',
        fromFilter: { op: 'prop-equals', prop: 'role', value: 'source' },
        edgeType: 'located_at',
        toFilter: {
          op: 'has-edge',
          edgeType: 'contains',
          toFilter: { op: 'prop-equals', prop: 'marker', value: 'anchor' },
        },
      },
      (graph) => {
        addNode(graph, 'source', 'actor', { role: 'source' });
        addNode(graph, 'target', 'location', {});
        addNode(graph, 'anchor', 'location', { marker: 'anchor' });
        addEdge(graph, 'e1', 'source', 'target', 'located_at');
        addEdge(graph, 'e2', 'target', 'anchor', 'contains');
      }
    );
    expect(result.activated).toBe(true);
  });

  it('warns and fails for unsupported has-tag in fromFilter', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = runEdgeExistsPredicate(
        {
          op: 'edge-exists',
          fromFilter: { op: 'has-tag', axis: 'archetype', value: 'witness' },
          edgeType: 'relates_to',
        },
        (graph) => {
          addNode(graph, 'a', 'actor', { tags: ['witness'] });
          addNode(graph, 'b', 'actor', {});
          addEdge(graph, 'e1', 'a', 'b', 'relates_to');
        }
      );
      expect(result.activated).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('FilterQuery op "has-tag"'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns and fails for unsupported has-any-tag in fromFilter', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = runEdgeExistsPredicate(
        {
          op: 'edge-exists',
          fromFilter: { op: 'has-any-tag', axis: 'reach', values: ['mind'] },
          edgeType: 'relates_to',
        },
        (graph) => {
          addNode(graph, 'a', 'actor', { tags: ['mind'] });
          addNode(graph, 'b', 'actor', {});
          addEdge(graph, 'e1', 'a', 'b', 'relates_to');
        }
      );
      expect(result.activated).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('FilterQuery op "has-any-tag"'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns and fails for unsupported node-class in fromFilter', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = runEdgeExistsPredicate(
        {
          op: 'edge-exists',
          fromFilter: { op: 'node-class', class: 'generic' },
          edgeType: 'relates_to',
        },
        (graph) => {
          addNode(graph, 'a', 'actor', {});
          addNode(graph, 'b', 'actor', {});
          addEdge(graph, 'e1', 'a', 'b', 'relates_to');
        }
      );
      expect(result.activated).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('FilterQuery op "node-class"'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns and fails for unknown FilterQuery op in fromFilter', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = runEdgeExistsPredicate(
        {
          op: 'edge-exists',
          fromFilter: {
            op: 'unknown-filter-op',
          } as unknown as FilterQuery,
          edgeType: 'relates_to',
        },
        (graph) => {
          addNode(graph, 'a', 'actor', {});
          addNode(graph, 'b', 'actor', {});
          addEdge(graph, 'e1', 'a', 'b', 'relates_to');
        }
      );
      expect(result.activated).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown FilterQuery op "unknown-filter-op"'));
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('preserves unknown WorldPredicate warning behavior', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const comp = makeActiveComposition('comp-unknown', [
        makePhase('p1', { op: 'unknown-world-op' } as unknown as WorldPredicate),
      ]);
      const state = makeState([comp]);
      const result = phaseComposition(state);
      const updated = result.activeCompositions?.find((c) => c.compositionId === 'comp-unknown');
      expect(updated?.activatedPhaseIds).not.toContain('p1');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[phaseComposition] Unknown predicate op "unknown-world-op"')
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});
