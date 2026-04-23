import { describe, it, expect } from 'vitest';
import { phaseComposition } from '../phaseComposition';
import type { GameState, ActiveComposition } from '../../types/gameState';
import type { Phase, WorldPredicate } from '../../composition-dsl/schema';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';

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
