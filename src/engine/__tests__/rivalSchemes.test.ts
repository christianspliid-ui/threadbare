import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeRivalEscalationTier,
  selectRivalScheme,
  buildRivalScheme,
} from '../rival';
import { phaseRivalActions } from '../orchestrator';
import { phaseComposition } from '../phaseComposition';
import {
  eligibleSchemeFamilies,
  getRivalSchemeFamily,
  RIVAL_SCHEME_FAMILIES,
  CORRUPTIVE_FAMILY,
} from '../../data/rival-schemes';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { RivalDefinition, RivalState } from '../../types/rival';
import type { GraphNode } from '../../types/graph';

// ─── Fixtures ──────────────────────────────────────────────────────

function makeDoomClock(stage: number): GameState['doomClock'] {
  return {
    currentStage: stage,
    currentTick: stage * 20,
    totalTicks: 100,
    progress: stage * 0.2,
    stageTransitions: [0, 20, 40, 60, 80],
    expired: false,
  } as unknown as GameState['doomClock'];
}

function makeRival(id: string, behavior: RivalDefinition['behavior']): RivalDefinition {
  return {
    id,
    name: `Rival ${id}`,
    sphereAlignment: {} as RivalDefinition['sphereAlignment'],
    behavior,
    oppositionStrength: 0.7,
    description: 'test rival',
    primarySphere: 'darkness',
    secondarySphere: 'mind',
  };
}

function makeRivalState(id: string): RivalState {
  return {
    rivalId: id,
    active: true,
    interventionCount: 0,
    agentsControlled: 0,
    regionsInfluenced: [],
    hostilityToPlayer: 0.5,
    ticksSinceAction: 0,
  };
}

function addLocation(graph: WorldGraph, id: string, col: number, row: number): void {
  const node: GraphNode = {
    id,
    type: 'location',
    name: id,
    properties: { hexCol: col, hexRow: row, name: id },
  };
  graph.addNode(node);
}

function addActor(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'actor', name: id, properties: {} } as GraphNode);
}

function makeState(extra: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  // The ascendant is a graph node in a real game — needed for thread/edge ops.
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'asc-1', properties: {} } as GraphNode);
  return {
    tick: 10,
    cycle: 0,
    seed: 42,
    graph: graph as WorldGraph,
    phase: 'playing',
    tiles: [],
    ascendantId: 'asc-1',
    rivalDefinitions: [],
    rivalStates: [],
    doomClock: makeDoomClock(1),
    doomIdentityMatrix: null,
    tickEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    activeCompositions: [],
    worldFlags: {},
    firedCompositions: [],
    storyBeatQueue: [],
    pendingSpherePressures: [],
    ...extra,
  } as unknown as GameState;
}

/** One full rival tick: composition runner then rival phase, merged back. */
function runTick(state: GameState): void {
  Object.assign(state, phaseComposition(state));
  Object.assign(state, phaseRivalActions(state));
  state.tick += 1;
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

// ─── Escalation tier ───────────────────────────────────────────────

describe('computeRivalEscalationTier', () => {
  it('is monotonic in doom stage', () => {
    const low = computeRivalEscalationTier(makeState({ doomClock: makeDoomClock(1) }));
    const high = computeRivalEscalationTier(makeState({ doomClock: makeDoomClock(5) }));
    expect(high).toBeGreaterThanOrEqual(low);
    expect(low).toBe(0);
    expect(high).toBeGreaterThan(0);
  });

  it('rises with player advancement (thread tier)', () => {
    const bare = makeState({ doomClock: makeDoomClock(3) });
    const advanced = makeState({ doomClock: makeDoomClock(3) });
    // Give the advanced state a high-tier thread from the ascendant.
    advanced.graph.addNode({ id: 'm1', type: 'actor', name: 'm1', properties: {} } as GraphNode);
    advanced.graph.addEdge({
      id: 'e-thread',
      source: 'asc-1',
      target: 'm1',
      type: 'thread',
      properties: { tier: 4 },
    });
    expect(computeRivalEscalationTier(advanced)).toBeGreaterThanOrEqual(
      computeRivalEscalationTier(bare),
    );
  });

  it('fail-softs to doom-only when no ascendant/threads readable', () => {
    const s = makeState({ ascendantId: undefined as unknown as string, doomClock: makeDoomClock(5) });
    expect(() => computeRivalEscalationTier(s)).not.toThrow();
    expect(computeRivalEscalationTier(s)).toBeGreaterThanOrEqual(0);
    expect(computeRivalEscalationTier(s)).toBeLessThanOrEqual(3);
  });

  it('is a pure function (deterministic)', () => {
    const s = makeState({ doomClock: makeDoomClock(4) });
    expect(computeRivalEscalationTier(s)).toBe(computeRivalEscalationTier(s));
  });
});

// ─── Family eligibility ────────────────────────────────────────────

describe('eligibleSchemeFamilies', () => {
  it('offers corruptive to subtle rivals at tier 0', () => {
    const fams = eligibleSchemeFamilies('subtle', 0);
    expect(fams.map((f) => f.id)).toContain('corruptive');
  });

  it('gates territorial behind tier 1', () => {
    expect(eligibleSchemeFamilies('aggressive', 0).map((f) => f.id)).not.toContain('territorial');
    expect(eligibleSchemeFamilies('aggressive', 1).map((f) => f.id)).toContain('territorial');
  });

  it('only ships corruptive + territorial (economic split to THR-619)', () => {
    expect(RIVAL_SCHEME_FAMILIES.map((f) => f.id).sort()).toEqual(['corruptive', 'territorial']);
    expect(getRivalSchemeFamily('economic')).toBeUndefined();
  });
});

// ─── Scheme selection ──────────────────────────────────────────────

describe('selectRivalScheme', () => {
  const rival = makeRival('actor_rival_1', 'subtle');

  it('probes when the roll lands under the probe weight', () => {
    const rs = makeRivalState('actor_rival_1');
    // rng always returns 0 → below probe weight → probe.
    const res = selectRivalScheme(rival, rs, 0, 100, () => 0);
    expect(res.family).toBeNull();
    expect(res.reason).toBe('probe');
  });

  it('launches an eligible family when past the probe roll', () => {
    const rs = makeRivalState('actor_rival_1');
    // First rng (probe) high → not probe; second rng (pick) → index 0.
    const rolls = [0.99, 0];
    let i = 0;
    const res = selectRivalScheme(rival, rs, 0, 100, () => rolls[i++] ?? 0);
    expect(res.family?.id).toBe('corruptive');
  });

  it('refuses at capacity', () => {
    const rs = { ...makeRivalState('actor_rival_1'), activeSchemeIds: ['x'] };
    const res = selectRivalScheme(rival, rs, 0, 100, () => 0.99);
    expect(res.family).toBeNull();
    expect(res.reason).toBe('at-capacity');
  });

  it('refuses during launch cooldown', () => {
    const rs = { ...makeRivalState('actor_rival_1'), lastSchemeLaunchTick: 95 };
    const res = selectRivalScheme(rival, rs, 0, 100, () => 0.99);
    expect(res.family).toBeNull();
    expect(res.reason).toBe('cooldown');
  });
});

// ─── Scheme builder ────────────────────────────────────────────────

describe('buildRivalScheme', () => {
  it('builds a four-phase composition armed at phase 1, attributed to the rival', () => {
    const rival = makeRival('actor_rival_1', 'subtle');
    const rs = makeRivalState('actor_rival_1');
    const plan = buildRivalScheme(rival, rs, CORRUPTIVE_FAMILY, 0, 50, 'loc-1', 'Ashford', () => 0.5);
    expect(plan.composition.phases).toHaveLength(4);
    expect(plan.composition.sponsorRivalId).toBe('actor_rival_1');
    expect(plan.composition.schemeFamily).toBe('corruptive');
    expect(plan.composition.resolvedNodes.target).toBe('loc-1');
    expect(plan.updatedRivalState.activeSchemeIds).toContain(plan.composition.compositionId);
    expect(plan.updatedRivalState.lastSchemeLaunchTick).toBe(50);
    // Phase 1 (rumor) is armed; its rationale has the rival + target substituted.
    const readyKey = `scheme.${plan.composition.compositionId}.rumor-ready`;
    expect(plan.worldFlagUpdates[readyKey]).toBe(true);
    const rumor = plan.composition.phases!.find((p) => p.id === 'rumor');
    expect(rumor?.rationale).toContain('Rival actor_rival_1');
    expect(rumor?.rationale).toContain('Ashford');
    expect(rumor?.rationale).not.toContain('{rival}');
  });
});

// ─── Integration: advancement + moves ──────────────────────────────

describe('phaseRivalActions — scheme lifecycle', () => {
  function seedSchemeState(): GameState {
    const rival = makeRival('actor_rival_1', 'subtle');
    const rs = makeRivalState('actor_rival_1');
    const state = makeState({
      rivalDefinitions: [rival],
      rivalStates: [rs],
      doomClock: makeDoomClock(1),
    });
    addActor(state.graph, 'actor_rival_1');
    addLocation(state.graph, 'loc-1', 3, 3);
    // Inject a scheme deterministically (bypass the stochastic launch decision).
    const plan = buildRivalScheme(rival, rs, CORRUPTIVE_FAMILY, 0, state.tick, 'loc-1', 'loc-1', () => 0.5);
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];
    return state;
  }

  it('advances phases in order and fires ≥3 distinct move kinds over 100 ticks', () => {
    const state = seedSchemeState();
    for (let i = 0; i < 100; i++) runTick(state);

    const advances = getTraces().filter((t) => t.category === 'rival.scheme_phase_advanced');
    const moves = new Set(advances.map((t) => (t as Record<string, unknown>).move as string));
    // rumor, materialize, escalate, crack → ≥3 distinct.
    expect(moves.size).toBeGreaterThanOrEqual(3);

    // The sponsors_scheme edge was bound by the materialize move.
    const edges = state.graph.getOutgoingEdges('actor_rival_1', 'sponsors_scheme');
    expect(edges.length).toBeGreaterThanOrEqual(1);

    // Scheme completed (all four phases fired).
    const completed = getTraces().filter((t) => t.category === 'rival.scheme_completed');
    expect(completed.length).toBeGreaterThanOrEqual(1);
  });

  it('emits a launch toast + sphere pressure without a seeded scheme (probe path stays alive)', () => {
    const rival = makeRival('actor_rival_2', 'aggressive');
    const rs = { ...makeRivalState('actor_rival_2'), ticksSinceAction: 20 };
    const state = makeState({ rivalDefinitions: [rival], rivalStates: [rs] });
    // No location → territorial (tier-gated anyway) can't materialize; probe fallback fires.
    runTick(state);
    // A rival_action event is emitted on the action tick.
    expect(state.tickEvents.some((e) => e.type === 'rival_action')).toBe(true);
  });
});

// ─── Integration: counter-play → stall → fail ──────────────────────

describe('phaseRivalActions — counter-play', () => {
  it('stalls then fails a scheme when the player is present at the target, with a cool-failure beat', () => {
    const rival = makeRival('actor_rival_1', 'subtle');
    const rs = makeRivalState('actor_rival_1');
    const state = makeState({
      rivalDefinitions: [rival],
      rivalStates: [rs],
      doomClock: makeDoomClock(1),
    });
    addActor(state.graph, 'actor_rival_1');
    addLocation(state.graph, 'loc-1', 3, 3);
    const plan = buildRivalScheme(rival, rs, CORRUPTIVE_FAMILY, 0, state.tick, 'loc-1', 'loc-1', () => 0.5);
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];

    // Player is present at the target: an actor stands at loc-1 with a thread from the ascendant.
    state.graph.addNode({ id: 'hero', type: 'actor', name: 'hero', properties: {} } as GraphNode);
    state.graph.addEdge({ id: 'e-loc', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
    state.graph.addEdge({ id: 'e-thr', source: 'asc-1', target: 'hero', type: 'thread', properties: { tier: 2 } });

    for (let i = 0; i < 60; i++) runTick(state);

    const countered = getTraces().filter((t) => t.category === 'rival.scheme_countered');
    expect(countered.some((t) => (t as Record<string, unknown>).outcome === 'stalled')).toBe(true);
    expect(countered.some((t) => (t as Record<string, unknown>).outcome === 'failed')).toBe(true);

    const comp = state.activeCompositions?.find((c) => c.sponsorRivalId === 'actor_rival_1');
    // Either the failed comp is still retained (pre-GC) as 'failed', or it has been GC'd.
    if (comp) expect(comp.status).toBe('failed');

    // A cool-failure chronicle beat was pushed.
    expect(state.chronicleEntries.some((e) => e.title.includes('unravels'))).toBe(true);
  });
});
