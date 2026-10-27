/**
 * THR-2046 — a road's encounters write to that road.
 *
 * Binds the plan's engine Done-when (Docs/plans/2026-10-25-thr-2046-encounter-lane-writes.md):
 * a bound lane is written over the busiest one; a moved actor anchors on the lane's source
 * end; `lane_threat` marks and clears and never clears a blockade; `lane_toll` gives the
 * town's faction the toll, falls back to the mortal actor, and never strips a mortal
 * holder; a route-event seed's action carries its lane and a deleted lane drops it; an
 * ambush won on a threatened road gives a *Roads clear* receipt row, and a struck toll a
 * *A toll is set* row naming its holder.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { applyWorldEconomyShiftDetailed, resolveLaneAnchor } from '../economyShift';
import { evaluateEncounterSeeds, resolveSeedLane } from '../encounterSeeding';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { ROUTE_THREATENED_CLEAR_TICKS } from '../../data/route-event-config';
import { ENCOUNTER_THREAT_CLEAR_TICKS, W_LANE } from '../../data/economy-shift-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  PendingEncounterSeed,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const TICK = 100;
const fixedRng = () => 0.5;

/**
 * Ashford (town-1) trades on a busy lane to Brennock and a quiet one to Carrow; a far
 * lane joins Brennock and Carrow and does not touch Ashford.
 */
function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual', wealth: 30 } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', prosperity: 50, unrest: 10 } });
  graph.addNode({ id: 'square-1', type: 'location', name: 'Ashford Market', properties: { parentLocationId: 'town-1' } });
  graph.addNode({ id: 'town-2', type: 'location', name: 'Brennock', properties: { locationSubtype: 'town', prosperity: 40 } });
  graph.addNode({ id: 'town-3', type: 'location', name: 'Carrow', properties: { locationSubtype: 'town', prosperity: 40 } });
  graph.addEdge({ id: 'lane-busy', source: 'town-1', target: 'town-2', type: 'trades_with', properties: { volume: 5, lastTraded: 0 } });
  graph.addEdge({ id: 'lane-quiet', source: 'town-3', target: 'town-1', type: 'trades_with', properties: { volume: 3, lastTraded: 0 } });
  graph.addEdge({ id: 'lane-far', source: 'town-2', target: 'town-3', type: 'trades_with', properties: { volume: 4, lastTraded: 0 } });
  graph.addNode({ id: 'faction-1', type: 'actor', name: 'The Iron Compact', properties: { actorType: 'faction', wealth: 20 } });
  graph.addEdge({ id: 'at-1', source: 'actor-1', target: 'square-1', type: 'located_at', properties: {} });
  return graph;
}

function buildState(): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph: buildGraph(),
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(templateId: string, laneEdgeId?: string): UnifiedAction {
  return {
    actionId: 'ua_lane', actorId: 'actor-1', templateId, targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...(laneEdgeId ? { laneEdgeId } : {}),
  } as unknown as UnifiedAction;
}

const lane = (g: WorldGraph, id: string) => g.getEdge(id)!.properties as Record<string, unknown>;

describe('THR-2046 — the lane anchor', () => {
  it('writes the bound lane over the town\'s busiest, and falls back without one', () => {
    const g = buildGraph();
    const bound = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_volume', amount: -W_LANE.small, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK);
    expect(bound).toMatchObject({ nodeId: 'lane-quiet', laneSource: 'seed' });
    expect(lane(g, 'lane-quiet').volume).toBe(3 - W_LANE.small);
    expect(lane(g, 'lane-busy').volume).toBe(5);
    const fallback = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_volume', amount: -W_LANE.small, settlementId: 'square-1' }, TICK);
    expect(fallback).toMatchObject({ nodeId: 'lane-busy', laneSource: 'fallback' });
  });

  it('anchors a moved actor on the bound lane\'s source end', () => {
    const g = buildGraph();
    expect(resolveLaneAnchor(g, 'lane-far', 'square-1')).toMatchObject({ settlementId: 'town-2', source: 'seed' });
    expect(resolveLaneAnchor(g, 'lane-quiet', 'square-1')).toMatchObject({ settlementId: 'town-1', source: 'seed' });
    // A lane removed since the seed, or a non-lane id, falls back to the actor's town.
    expect(resolveLaneAnchor(g, 'lane-gone', 'square-1')).toMatchObject({ settlementId: 'town-1', source: 'fallback' });
    expect(resolveLaneAnchor(g, 'at-1', 'square-1').lane).toBeUndefined();
  });
});

describe('THR-2046 — lane_threat', () => {
  it('marks the lane threatened so the route-event sweep clears it on time, then clears it', () => {
    const g = buildGraph();
    const mark = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK);
    expect(mark).toMatchObject({ quantity: 'lane_threat', nodeId: 'lane-quiet', before: 0, after: 1 });
    expect(lane(g, 'lane-quiet').threatened).toBe(true);
    // The sweep clears at `threatenedSinceTick + ROUTE_THREATENED_CLEAR_TICKS`; the
    // back-date makes that TICK + ENCOUNTER_THREAT_CLEAR_TICKS.
    expect((lane(g, 'lane-quiet').threatenedSinceTick as number) + ROUTE_THREATENED_CLEAR_TICKS).toBe(TICK + ENCOUNTER_THREAT_CLEAR_TICKS);
    // Already threatened: no move (Law 56).
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK)).toBe('no_move');
    const clear = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: -1, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK);
    expect(clear).toMatchObject({ amount: -1, after: 0 });
    expect(lane(g, 'lane-quiet').threatened).toBe(false);
    expect(lane(g, 'lane-quiet').threatenedSinceTick).toBeUndefined();
  });

  it('with no bound lane, marks the busiest and clears the lowest-id threatened lane', () => {
    const g = buildGraph();
    g.updateEdge('lane-quiet', { properties: { ...lane(g, 'lane-quiet'), threatened: true, threatenedSinceTick: TICK } });
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: 1, settlementId: 'square-1' }, TICK))
      .toMatchObject({ nodeId: 'lane-busy', laneSource: 'fallback' });
    // lane-busy < lane-quiet by id: the clear frees lane-busy first.
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: -1, settlementId: 'square-1' }, TICK))
      .toMatchObject({ nodeId: 'lane-busy' });
    expect(lane(g, 'lane-quiet').threatened).toBe(true);
  });

  it('never clears a blockaded lane', () => {
    const g = buildGraph();
    g.updateEdge('lane-quiet', { properties: { ...lane(g, 'lane-quiet'), threatened: true, threatenedSinceTick: TICK, blockadedBy: 'faction-1' } });
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: -1, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK)).toBe('blockaded');
    expect(lane(g, 'lane-quiet').threatened).toBe(true);
  });
});

describe('THR-2046 — lane_toll', () => {
  it('gives the toll to the faction that controls the town', () => {
    const g = buildGraph();
    g.addEdge({ id: 'ctl-1', source: 'faction-1', target: 'town-1', type: 'controls', properties: {} });
    const r = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet', actorId: 'actor-1' }, TICK);
    expect(r).toMatchObject({ quantity: 'lane_toll', nodeId: 'lane-quiet', holderId: 'faction-1', laneSource: 'seed' });
    expect(lane(g, 'lane-quiet').controlledBy).toBe('faction-1');
    // Already the holder's: no move.
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet', actorId: 'actor-1' }, TICK)).toBe('no_move');
  });

  it('falls back to the acting mortal where no faction holds the town, and to nobody without one', () => {
    const g = buildGraph();
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet' }, TICK)).toBe('no_holder');
    const r = applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet', actorId: 'actor-1' }, TICK);
    expect(r).toMatchObject({ holderId: 'actor-1' });
    expect(lane(g, 'lane-quiet').controlledBy).toBe('actor-1');
  });

  it('never strips a mortal holder, and a negative toll writes nothing', () => {
    const g = buildGraph();
    g.addNode({ id: 'actor-2', type: 'actor', name: 'Old Wren', properties: { actorType: 'individual' } });
    g.updateEdge('lane-quiet', { properties: { ...lane(g, 'lane-quiet'), controlledBy: 'actor-2' } });
    g.addEdge({ id: 'ctl-1', source: 'faction-1', target: 'town-1', type: 'controls', properties: {} });
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'square-1', laneEdgeId: 'lane-quiet', actorId: 'actor-1' }, TICK)).toBe('no_move');
    expect(lane(g, 'lane-quiet').controlledBy).toBe('actor-2');
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: -1, settlementId: 'square-1', laneEdgeId: 'lane-busy', actorId: 'actor-1' }, TICK)).toBe('no_move');
    expect(lane(g, 'lane-busy').controlledBy).toBeUndefined();
  });
});

describe('THR-2046 — the seed carries its lane', () => {
  beforeEach(() => resetUnifiedActionCounter());

  function laneSeed(laneEdgeId: string): PendingEncounterSeed {
    return {
      seedId: `route_event_${laneEdgeId}_10`,
      sourceEncounterId: 'route_event_phase',
      sourceReactionId: 'ambush',
      templateId: 'encounter_route_ambush',
      targetAgentId: 'actor-1',
      eligibleAfterTick: 20,
      priority: 1,
      seedLabel: 'Rich cargo draws an ambush',
      plantedTick: 10,
      laneEdgeId,
    };
  }

  it('puts a route-event seed\'s lane on its action, and drops a deleted lane', () => {
    const state = buildState();
    expect(resolveSeedLane(laneSeed('lane-quiet'), state.graph)).toBe('lane-quiet');
    expect(resolveSeedLane(laneSeed('lane-gone'), state.graph)).toBeUndefined();

    const fired = evaluateEncounterSeeds({ ...state, pendingEncounterSeeds: [laneSeed('lane-quiet')] }, 25, fixedRng);
    const action = fired.unifiedActions[fired.unifiedActions.length - 1];
    expect(action.templateId).toBe('encounter_route_ambush');
    expect(action.laneEdgeId).toBe('lane-quiet');

    resetUnifiedActionCounter();
    const gone = evaluateEncounterSeeds({ ...buildState(), pendingEncounterSeeds: [laneSeed('lane-gone')] }, 25, fixedRng);
    const orphan = gone.unifiedActions[gone.unifiedActions.length - 1];
    expect(orphan.templateId).toBe('encounter_route_ambush');
    expect(orphan.laneEdgeId).toBeUndefined();
  });
});

describe('THR-2046 — the rows through the executor and the receipt', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  /** A one-step template carrying a shipped template's outcome table, so one roll resolves it. */
  function oneStep(id: string): UnifiedActionTemplate {
    const shipped = getUnifiedTemplateById(id)!;
    expect(shipped, id).toBeDefined();
    return {
      id, rarityTier: 1, intrinsicTier: 'background', name: shipped.name,
      reach: 'gold', crudType: 'read', encounterType: shipped.encounterType ?? 'trade', scale: 'personal',
      steps: [{ reach: 'gold', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      apCost: 1, actorAffinities: ['individual'], motivations: ['courage_prudence'],
      narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
      outcomeEffects: shipped.outcomeEffects,
    } as unknown as UnifiedActionTemplate;
  }

  it('an aftermath lane row writes the action\'s own lane and traces laneSource', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'r1', label: 'r', effects: [{ kind: 'economy_shift', quantity: 'lane_threat', amount: 1 }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction('encounter.x', 'lane-quiet'), reaction, TICK, runtime);
    expect(lane(next.graph, 'lane-quiet').threatened).toBe(true);
    expect(lane(next.graph, 'lane-busy').threatened).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'economy.world.shift') as unknown as { laneSource: string; quantity: string };
    expect(trace).toMatchObject({ quantity: 'lane_threat', laneSource: 'seed' });
  });

  it('a won ambush on its threatened road gives a Roads clear row', () => {
    const state = buildState();
    state.graph.updateEdge('lane-quiet', { properties: { ...lane(state.graph, 'lane-quiet'), threatened: true, threatenedSinceTick: TICK } });
    const template = oneStep('encounter_route_ambush');
    const { updatedAction } = executeStepResult(makeAction(template.id, 'lane-quiet'), template, 'success', [], state, fixedRng, TICK, undefined, runtime);
    expect(lane(state.graph, 'lane-quiet').threatened).toBe(false);
    const roads = (updatedAction.aftermathSummary?.changes ?? []).filter(c => c.kind === 'economy' && c.economyQuantity === 'lane');
    expect(roads.map(c => c.title)).toEqual(['Roads clear']);
    expect(roads[0].detail).toBe('The road from Ashford is no longer threatened.');
  });

  it('a toll struck at the bridge gives an A toll is set row naming the holder, linked', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'ctl-1', source: 'faction-1', target: 'town-1', type: 'controls', properties: {} });
    const template = oneStep('encounter.toll_bridge');
    const { updatedAction } = executeStepResult(makeAction(template.id), template, 'success', [], state, fixedRng, TICK, undefined, runtime);
    // No bound lane (an organic draw): the busiest lane at the town takes the toll.
    expect(lane(state.graph, 'lane-busy').controlledBy).toBe('faction-1');
    const toll = (updatedAction.aftermathSummary?.changes ?? []).filter(c => c.kind === 'economy' && c.title === 'A toll is set');
    expect(toll).toHaveLength(1);
    expect(toll[0].detail).toBe('The road from Ashford is tolled by The Iron Compact.');
    expect(toll[0].concepts).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: 'faction-1', visualKind: 'faction' }),
      expect.objectContaining({ entityId: 'town-1', visualKind: 'location' }),
    ]));
  });
});
