import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeRivalEscalationTier,
  selectRivalScheme,
  buildRivalScheme,
  worldHasResourceStocks,
} from '../rival';
import { phaseRivalActions } from '../orchestrator';
import { phaseComposition } from '../phaseComposition';
import {
  eligibleSchemeFamilies,
  getRivalSchemeFamily,
  RIVAL_SCHEME_FAMILIES,
  CORRUPTIVE_FAMILY,
  ECONOMIC_FAMILY,
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

  // Was "only ships corruptive + territorial (economic split to THR-619)" —
  // THR-619 landed the economic family, so the registry is now three.
  it('ships corruptive + territorial + economic', () => {
    expect(RIVAL_SCHEME_FAMILIES.map((f) => f.id).sort()).toEqual([
      'corruptive',
      'economic',
      'territorial',
    ]);
    expect(getRivalSchemeFamily('economic')).toBeDefined();
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
    const moves = new Set(advances.map((t) => (t as unknown as Record<string, unknown>).move as string));
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
    expect(countered.some((t) => (t as unknown as Record<string, unknown>).outcome === 'stalled')).toBe(true);
    expect(countered.some((t) => (t as unknown as Record<string, unknown>).outcome === 'failed')).toBe(true);

    const comp = state.activeCompositions?.find((c) => c.sponsorRivalId === 'actor_rival_1');
    // Either the failed comp is still retained (pre-GC) as 'failed', or it has been GC'd.
    if (comp) expect(comp.status).toBe('failed');

    // A cool-failure chronicle beat was pushed.
    expect(state.chronicleEntries.some((e) => e.title.includes('unravels'))).toBe(true);
  });
});

// ─── Economic family (THR-619) ─────────────────────────────────────

/** A location carrying THR-615 resource stocks. */
function addStockedLocation(
  graph: WorldGraph,
  id: string,
  col: number,
  row: number,
  resources: Record<string, { quantity: number }>,
  region?: string,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: id,
    properties: {
      hexCol: col,
      hexRow: row,
      name: id,
      ...(region ? { region } : {}),
      resources: Object.fromEntries(
        Object.entries(resources).map(([k, v]) => [
          k,
          { quantity: v.quantity, renewable: true, renewalRate: 0.1 },
        ]),
      ),
    },
  } as GraphNode);
}

describe('economic family — eligibility gates on the stock substrate', () => {
  it('is absent from eligible families when the world has no stocks', () => {
    const families = eligibleSchemeFamilies('subtle', 3, false);
    expect(families.map((f) => f.id)).not.toContain('economic');
  });

  it('appears once stocks exist', () => {
    const families = eligibleSchemeFamilies('subtle', 3, true);
    expect(families.map((f) => f.id)).toContain('economic');
  });

  it('defaults to ineligible when the caller does not measure the world', () => {
    // The default parameter must be the safe one — a caller that has not proven
    // stocks exist must not be able to launch a substrate-dependent family.
    expect(eligibleSchemeFamilies('aggressive', 3).map((f) => f.id)).not.toContain('economic');
  });

  it('is eligible for every rival behavior (starvation suits all temperaments)', () => {
    for (const behavior of ['aggressive', 'subtle', 'territorial', 'expansionist'] as const) {
      expect(eligibleSchemeFamilies(behavior, 0, true).map((f) => f.id)).toContain('economic');
    }
  });

  it('worldHasResourceStocks detects stocks and fail-softs on a bare world', () => {
    const bare = makeState();
    expect(worldHasResourceStocks(bare)).toBe(false);

    const stocked = makeState();
    addStockedLocation(stocked.graph, 'loc-mine', 1, 1, { iron_ore: { quantity: 60 } });
    expect(worldHasResourceStocks(stocked)).toBe(true);
  });

  it('selectRivalScheme never picks economic without stocks, and can with them', () => {
    const rival = makeRival('actor_rival_1', 'aggressive');
    const rs = makeRivalState('actor_rival_1');
    // Sweep the rng so every branch of the family pick is exercised.
    const picksWithout: string[] = [];
    const picksWith: string[] = [];
    for (let i = 0; i < 40; i++) {
      const r = () => (i + 0.5) / 40;
      const a = selectRivalScheme(rival, rs, 3, 100, r, false);
      if (a.family) picksWithout.push(a.family.id);
      const b = selectRivalScheme(rival, rs, 3, 100, r, true);
      if (b.family) picksWith.push(b.family.id);
    }
    expect(picksWithout).not.toContain('economic');
    expect(picksWith).toContain('economic');
  });
});

describe('economic family — content shape', () => {
  it('has the four named beats in arc order with distinct moves', () => {
    expect(ECONOMIC_FAMILY.beats.map((b) => b.phaseId)).toEqual([
      'sour-mines',
      'corner-grain',
      'break-guild',
      'starve-faithful',
    ]);
    expect(ECONOMIC_FAMILY.beats.map((b) => b.move)).toEqual([
      'drain_stock',
      'materialize',
      'sever_route',
      'crack',
    ]);
  });

  it('carries >=3 attributed prose variants per beat with placeholders preserved', () => {
    for (const beat of ECONOMIC_FAMILY.beats) {
      expect(beat.proseVariants.length).toBeGreaterThanOrEqual(3);
      for (const variant of beat.proseVariants) {
        expect(variant).toContain('{rival}');
        expect(variant).toContain('{location}');
      }
      // No duplicate variants — three ways of saying it, not one said thrice.
      expect(new Set(beat.proseVariants).size).toBe(beat.proseVariants.length);
    }
  });

  it('declares its substrate dependency', () => {
    expect(ECONOMIC_FAMILY.requiresStocks).toBe(true);
    expect(ECONOMIC_FAMILY.requiresTarget).toBe(true);
  });
});

describe('economic family — moves bite the world', () => {
  /** Launch an economic scheme against a stocked target and drive it to completion. */
  function runEconomicScheme(opts: {
    resources?: Record<string, { quantity: number }>;
    region?: string;
    routes?: string[];
    intel?: Array<{ recordId: string; targetRegion?: string; reliability: number }>;
  }) {
    const rival = makeRival('actor_rival_1', 'aggressive');
    const rs = makeRivalState('actor_rival_1');
    const state = makeState({
      rivalDefinitions: [rival],
      rivalStates: [rs],
      doomClock: makeDoomClock(1),
      ...(opts.intel
        ? {
            intelligenceRecords: opts.intel.map((r) => ({
              recordId: r.recordId,
              // Route intel is what a severed conduit blinds; 'threat' is not an
              // IntelligenceCategory member and never was.
              category: 'trade_route' as const,
              label: 'l',
              detail: 'd',
              sourceEncounterId: 'enc',
              agentId: 'hero',
              acquiredTick: 0,
              reliability: r.reliability,
              ...(r.targetRegion ? { targetRegion: r.targetRegion } : {}),
            })),
          }
        : {}),
    });
    addActor(state.graph, 'actor_rival_1');
    addStockedLocation(
      state.graph,
      'loc-1',
      3,
      3,
      opts.resources ?? { iron_ore: { quantity: 80 }, grain: { quantity: 40 } },
      opts.region,
    );
    for (const partner of opts.routes ?? []) {
      addLocation(state.graph, partner, 5, 5);
      state.graph.addEdge({
        id: `e-trade-${partner}`,
        source: 'loc-1',
        target: partner,
        type: 'trades_with',
        properties: { volume: 3 },
      });
    }

    const plan = buildRivalScheme(
      rival, rs, ECONOMIC_FAMILY, 0, state.tick, 'loc-1', 'loc-1', () => 0.5,
    );
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];

    for (let i = 0; i < 80; i++) runTick(state);
    return state;
  }

  it('drain_stock sours the richest resource without exhausting it', () => {
    const state = runEconomicScheme({
      resources: { iron_ore: { quantity: 80 }, grain: { quantity: 40 } },
    });
    const props = state.graph.getNode('loc-1')!.properties as Record<string, unknown>;
    const resources = props.resources as Record<string, { quantity: number }>;

    // The richest (iron_ore) was drained; the lesser stock was left alone.
    expect(resources.iron_ore.quantity).toBeLessThan(80);
    expect(resources.iron_ore.quantity).toBeGreaterThan(0);
    expect(resources.grain.quantity).toBe(40);

    const drained = getTraces().filter((t) => t.category === 'rival.scheme_stock_drained');
    expect(drained.length).toBeGreaterThan(0);
    expect((drained[0] as unknown as Record<string, unknown>).resourceId).toBe('iron_ore');
  });

  it('sever_route cuts trade conduits at the target', () => {
    const state = runEconomicScheme({ routes: ['loc-partner-a', 'loc-partner-b'] });
    const remaining = state.graph.getOutgoingEdges('loc-1', 'trades_with');
    expect(remaining.length).toBe(0);

    const severed = getTraces().filter((t) => t.category === 'rival.scheme_route_severed');
    expect(severed.length).toBeGreaterThan(0);
    expect((severed[0] as unknown as Record<string, unknown>).severedPartnerIds).toEqual(
      expect.arrayContaining(['loc-partner-a', 'loc-partner-b']),
    );
  });

  it('a route cut blinds the region — the nervous-system coupling', () => {
    const state = runEconomicScheme({
      region: 'the-marches',
      routes: ['loc-partner-a'],
      intel: [
        { recordId: 'r-here', targetRegion: 'the-marches', reliability: 0.9 },
        { recordId: 'r-elsewhere', targetRegion: 'far-coast', reliability: 0.9 },
      ],
    });

    const here = state.intelligenceRecords!.find((r) => r.recordId === 'r-here')!;
    const elsewhere = state.intelligenceRecords!.find((r) => r.recordId === 'r-elsewhere')!;

    // The severed region went dark; an unrelated region did not.
    expect(here.reliability).toBeLessThan(0.9);
    expect(elsewhere.reliability).toBe(0.9);

    const severed = getTraces().filter((t) => t.category === 'rival.scheme_route_severed');
    expect((severed[0] as unknown as Record<string, unknown>).region).toBe('the-marches');
    expect((severed[0] as unknown as Record<string, unknown>).intelRecordsDegraded).toBe(1);
  });

  it('fail-softs on a target with no stocks, no routes, and no region', () => {
    const rival = makeRival('actor_rival_1', 'aggressive');
    const rs = makeRivalState('actor_rival_1');
    const state = makeState({
      rivalDefinitions: [rival],
      rivalStates: [rs],
      doomClock: makeDoomClock(1),
    });
    addActor(state.graph, 'actor_rival_1');
    addLocation(state.graph, 'loc-bare', 3, 3); // no resources, no routes, no region

    const plan = buildRivalScheme(
      rival, rs, ECONOMIC_FAMILY, 0, state.tick, 'loc-bare', 'loc-bare', () => 0.5,
    );
    state.activeCompositions = [plan.composition];
    state.worldFlags = { ...state.worldFlags, ...plan.worldFlagUpdates };
    state.rivalStates = [plan.updatedRivalState];

    // The arc still runs to completion — the moves just find nothing to bite.
    expect(() => {
      for (let i = 0; i < 80; i++) runTick(state);
    }).not.toThrow();
    const advanced = getTraces().filter((t) => t.category === 'rival.scheme_phase_advanced');
    expect(advanced.length).toBeGreaterThan(0);
  });

  it('advances all four phases in arc order', () => {
    const state = runEconomicScheme({ routes: ['loc-partner-a'] });
    // Scope to the scheme this test launched — over 80 ticks the rival is free to
    // start a second one once the first completes, and its beats interleave.
    const firstCompId = `rival-scheme-actor_rival_1-economic-t${10}`;
    const order = getTraces()
      .filter(
        (t) =>
          t.category === 'rival.scheme_phase_advanced' &&
          (t as unknown as Record<string, unknown>).compositionId === firstCompId,
      )
      .map((t) => (t as unknown as Record<string, unknown>).phaseId as string);
    expect(order).toEqual(['sour-mines', 'corner-grain', 'break-guild', 'starve-faithful']);

    // And the scheme reached 'completed' rather than stalling out.
    const comp = state.activeCompositions?.find((c) => c.compositionId === firstCompId);
    if (comp) expect(comp.status).toBe('completed');
  });
});
