/**
 * THR-1286 — control claim→decay→re-claim churn.
 *
 * Before this fix a collapsed control stance was re-proposed every tick forever:
 * the dead record stayed in `strategicState.controls` pinning `controlPressure` at its
 * maximum, `claim_control` wrote no history so the recent-duplicate variety guard never
 * saw it, and the stale `controls` edge made every re-claim fail `already_controls`.
 * Measured on seed 42 / medium at tick 150: 811 of 2053 spotlight decisions (39.5%)
 * were `strategic_control`, and they produced 17 successful claims — the rest were
 * decisions spent on a guaranteed no-op.
 *
 * These tests pin the three behaviours that close the loop: collapse retires the record
 * and its edge into history, a retired target is refused for the cooldown window, and a
 * target the actor still holds is never re-proposed.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { advanceStrategicProjects } from '../strategicActionLifecycle';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import { releaseControl } from '../strategicGraphOps';
import { STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS } from '../../data/strategic-action-constants';
import type { GameState } from '../../types/gameState';
import type { StrategicControlState, StrategicRuntimeState } from '../../types/strategicAction';
import { mulberry32 } from '../../lib/prng';

const CONTROL_TEMPLATE = 'strategic_maintain_monopoly';

function buildMerchantWorld() {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'merchant_a',
    name: 'Sera Goldvein',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      // Tuned so the control template is reachable at all. `strategic_maintain_monopoly`
      // is the 6th of `ambition_dominate_trade`'s 6 templateIds, and generation stops at
      // STRATEGIC_MAX_CANDIDATES_PER_AMBITION (5) — so with every earlier template
      // eligible it is never reached. These reaches clear the control template's own
      // floor (gold 0.5) while failing the eye/stone/heart floors of survey_market,
      // build_warehouse and found_guild_chapter, leaving cap room for it. That is also
      // how it is reached in a live world: earlier templates get rejected first.
      domainCapabilities: { gold: 0.55, eye: 0.1, heart: 0.1, shadow: 0.15, iron: 0.2, stone: 0.1, star: 0.1, veil: 0.1 },
    },
  });

  // THR-1394: no Location carries `market`, `port` or `trading_post` — the world-object
  // registry rejects them at write time and the packs no longer target them. The
  // fixture uses subtypes the world mints (a capital is the market town).
  graph.addNode({ id: 'loc_market_central', name: 'Central Market', type: 'location', properties: { locationSubtype: 'capital', hexCol: 5, hexRow: 5 } });
  graph.addNode({ id: 'loc_town_east', name: 'Eastwatch', type: 'location', properties: { locationSubtype: 'town', hexCol: 8, hexRow: 5 } });
  graph.addNode({ id: 'loc_city_south', name: 'Southgate', type: 'location', properties: { locationSubtype: 'city', hexCol: 5, hexRow: 9 } });
  graph.addNode({ id: 'loc_port_west', name: 'Harborside', type: 'location', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 5 } });
  graph.addNode({ id: 'loc_trading_post', name: 'Crossroads Post', type: 'location', properties: { locationSubtype: 'city', hexCol: 5, hexRow: 3 } });

  graph.addEdge({ id: 'loc_merchant_a', source: 'merchant_a', target: 'loc_market_central', type: 'located_at', properties: {} });

  graph.addNode({ id: 'amb_trade_node', name: 'Dominate Regional Trade', type: 'event', properties: { templateId: 'ambition_dominate_trade' } });
  graph.addEdge({ id: 'pursues_merchant_a', source: 'merchant_a', target: 'amb_trade_node', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });

  return graph;
}

function buildMinimalState(graph: WorldGraph, tick = 10): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as any, tiles: [],
    clock: { currentTick: tick } as any,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: {} as any, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
    // Present so this fixture satisfies GameState outright. The sibling strategic
    // fixtures this one is modelled on omit them and carry a type error apiece; copying
    // that would have imported the error along with the shape.
    doomIdentityMatrix: null, archetypeDrift: [],
    regionalDetectionPressure: [], regionDetection: [],
  };
}

function makeControl(overrides: Partial<StrategicControlState> = {}): StrategicControlState {
  return {
    controlId: 'ctrl_test',
    actorId: 'merchant_a',
    templateId: CONTROL_TEMPLATE,
    ambitionId: 'ambition_dominate_trade',
    targetNodeId: 'loc_market_central',
    verb: 'control',
    behaviorFamily: 'merchant-expansion',
    establishedTick: 1,
    neglectTicks: 11, // past the grace period of 10
    active: true,
    degradation: 0.99, // one degradation step from collapse
    ...overrides,
  };
}

function addStrategicControlEdge(graph: WorldGraph, actorId: string, targetId: string, tick = 1) {
  graph.addEdge({
    id: `controls_${actorId}_${targetId}_${tick}`,
    source: actorId,
    target: targetId,
    type: 'controls',
    properties: { establishedTick: tick, controlType: 'strategic' },
  });
}

function strategicControlEdges(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'controls')
    .filter(e => e.properties?.controlType === 'strategic');
}

function stateWith(controls: StrategicControlState[], history: StrategicRuntimeState['history'] = []): StrategicRuntimeState {
  return { projects: [], controls, history };
}

describe('THR-1286 — control stance retirement', () => {
  it('retires the record and its edge on collapse, writing the collapse to history', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl()]);

    // Guard: the stance and its edge exist before the tick that collapses it, so a
    // later "zero records" assertion cannot pass vacuously.
    expect(state.strategicState.controls).toHaveLength(1);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(1);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(0);

    const collapse = result.strategicState.history.filter(h => h.verb === 'control');
    expect(collapse).toHaveLength(1);
    expect(collapse[0]).toMatchObject({
      tick: 50,
      actorId: 'merchant_a',
      targetNodeId: 'loc_market_central',
      outcome: 'failed',
    });
  });

  it('does not collapse a stance that is still inside its grace period', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl({ neglectTicks: 2, degradation: 0 })]);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(1);
    expect(result.strategicState.controls[0].active).toBe(true);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(1);
    expect(result.strategicState.history.filter(h => h.verb === 'control')).toHaveLength(0);
  });

  it('drains a dead record carried by a world saved before this fix', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl({ active: false, degradation: 1, neglectTicks: 40 })]);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(0);
  });

  it('retires a stance whose target node was deleted, without waiting out neglect', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_town_east');
    const state = buildMinimalState(graph, 50);
    // Healthy stance — nowhere near collapse on neglect alone.
    state.strategicState = stateWith([makeControl({
      targetNodeId: 'loc_town_east', neglectTicks: 0, degradation: 0,
    })]);

    graph.removeNode('loc_town_east');

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(result.strategicState.history.filter(h => h.verb === 'control')).toHaveLength(1);
  });

  it('releaseControl leaves worldgen controls edges alone', () => {
    const graph = buildMerchantWorld();
    // Worldgen mints `controls` edges carrying `influence` and no `controlType` —
    // standing political control, not this pack's business.
    graph.addEdge({
      id: 'edge_controls_worldgen',
      source: 'merchant_a',
      target: 'loc_market_central',
      type: 'controls',
      properties: { influence: 0.7 },
    });
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');

    expect(graph.getOutgoingEdges('merchant_a', 'controls')).toHaveLength(2);

    const result = releaseControl(graph, 'merchant_a', 'loc_market_central');

    expect(result.success).toBe(true);
    const remaining = graph.getOutgoingEdges('merchant_a', 'controls');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('edge_controls_worldgen');
  });

  it('releaseControl is fail-soft when no strategic edge exists', () => {
    const graph = buildMerchantWorld();
    const result = releaseControl(graph, 'merchant_a', 'loc_market_central');
    expect(result.success).toBe(true);
    expect(result.createdId).toBeUndefined();
  });
});

describe('THR-1286 — control claim gating', () => {
  function controlCandidates(strategicState: StrategicRuntimeState | undefined, tick: number) {
    const graph = buildMerchantWorld();
    const result = generateStrategicCandidates(
      graph, 'merchant_a', ['ambition_dominate_trade'], strategicState, tick, mulberry32(42),
    );
    return {
      control: result.candidates.filter(c => c.templateId === CONTROL_TEMPLATE),
      rejections: result.rejections,
    };
  }

  // Falsifier for every "no control candidate" assertion below: with a clean slate the
  // control template DOES generate, so a zero count later is the gate, not an empty
  // population.
  it('generates control candidates when nothing gates them', () => {
    const { control } = controlCandidates(undefined, 100);
    expect(control.length).toBeGreaterThan(0);
  });

  it('refuses a re-claim inside the cooldown after the actor let the stance collapse', () => {
    const collapseTick = 100;
    const history = [{
      tick: collapseTick,
      actorId: 'merchant_a',
      templateId: CONTROL_TEMPLATE,
      ambitionId: 'ambition_dominate_trade',
      verb: 'control' as const,
      behaviorFamily: 'merchant-expansion' as const,
      displayName: 'Maintain Monopoly',
      targetNodeId: 'loc_market_central',
      outcome: 'failed' as const,
      graphOps: ['release_control'],
      catalystSeeded: false,
    }];

    const inside = controlCandidates(
      stateWith([], history),
      collapseTick + STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS - 1,
    );
    expect(inside.control.some(c => c.targetNodeId === 'loc_market_central')).toBe(false);
    expect(inside.rejections.some(r => r.reason.startsWith('control_reclaim_cooldown'))).toBe(true);

    const after = controlCandidates(
      stateWith([], history),
      collapseTick + STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS,
    );
    expect(after.control.some(c => c.targetNodeId === 'loc_market_central')).toBe(true);
  });

  it('does not re-propose a target the actor still actively controls', () => {
    const held = makeControl({ neglectTicks: 5, degradation: 0 });
    const { control, rejections } = controlCandidates(stateWith([held]), 100);

    expect(control.some(c => c.targetNodeId === 'loc_market_central')).toBe(false);
    expect(rejections.some(r => r.reason.startsWith('control_already_held'))).toBe(true);
  });

  it('leaves other targets claimable while one is held', () => {
    const held = makeControl({ neglectTicks: 5, degradation: 0 });
    const { control } = controlCandidates(stateWith([held]), 100);

    // The gate is per-target: holding the market must not silence the whole verb.
    expect(control.length).toBeGreaterThan(0);
    expect(control.every(c => c.targetNodeId !== 'loc_market_central')).toBe(true);
  });
});
