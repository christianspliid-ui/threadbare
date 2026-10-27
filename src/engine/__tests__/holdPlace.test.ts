/**
 * THR-2048 — a place held after success. Binds the plan's Done-when
 * (Docs/plans/2026-10-26-thr-2048-place-held-after-success.md): `hold_place` raises a
 * Place when none stands, takes up an unheld one (and makes it permanent), does nothing
 * when the actor already holds it, pays for the work when someone else holds it, and
 * writes nothing with no site. The three content tables carry the rows.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { checkDissolutions } from '../sublocation';
import { grantHolding } from '../holdings';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { MEANS_STEP, MEANS_STEP_SMALL } from '../../data/mortal-means-constants';
import { W_PROSPERITY } from '../../data/economy-shift-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const TICK = 10;
const FORGE = 'sublocation-type.forge';
const MINE = 'sublocation-type.mine';

const HOLD_FORGE: EncounterAftermathReactionEffect = {
  kind: 'hold_place', placeTypeId: FORGE, nameNoun: 'forge', heldElsewhereMeans: MEANS_STEP,
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Wren Callow', properties: { actorType: 'individual', wealth: 30 } });
  graph.addNode({ id: 'actor-2', type: 'actor', name: 'Odo Marsh', properties: { actorType: 'individual', wealth: 30 } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'square-1', type: 'location', name: 'Ashford Market', properties: { parentLocationId: 'town-1', sublocationTypeId: 'sublocation-type.market', persistence: { type: 'permanent' } } });
  graph.addEdge({ id: 'contains-square', source: 'town-1', target: 'square-1', type: 'contains', properties: {} });
  graph.addEdge({ id: 'at-1', source: 'actor-1', target: 'square-1', type: 'located_at', properties: {} });
  return graph;
}

function buildState(graph = buildGraph()): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_hold', actorId: 'actor-1', templateId: 'encounter.forge_construction', targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function run(state: GameState, runtime: SimulationRuntime, effect: EncounterAftermathReactionEffect, tick = TICK): GameState {
  const reaction: EncounterAftermathReaction = { id: 'r-hold', label: 'Outcome', effects: [effect] };
  return applyEncounterAftermathReaction(state, makeAction(), reaction, tick, runtime, { outcomeBand: 'success' }).state;
}

function placesOfType(graph: WorldGraph, siteId: string, typeId: string) {
  return graph.getOutgoingEdges(siteId, 'contains')
    .map(e => graph.getNode(e.target))
    .filter(n => n?.properties.sublocationTypeId === typeId);
}

function heldTraces() {
  return getTraces().filter(t => t.category === 'encounter.place.held') as unknown as { result: string; placeId: string | null; meansPaid?: number }[];
}

describe('THR-2048 — hold_place', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('raises one forge in a town with none, held by its builder as a permanent freehold', () => {
    const state = run(buildState(), runtime, HOLD_FORGE);
    const forges = placesOfType(state.graph, 'town-1', FORGE);
    expect(forges).toHaveLength(1);
    const forge = forges[0]!;
    expect(forge.name).toBe("Wren Callow's forge");
    expect(forge.properties.persistence).toEqual({ type: 'permanent' });
    expect(state.graph.getOutgoingEdges(forge.id, 'constructed_by')[0]?.target).toBe('actor-1');
    const owns = state.graph.getIncomingEdges(forge.id, 'owns');
    expect(owns).toHaveLength(1);
    expect(owns[0]).toMatchObject({ source: 'actor-1', properties: { via: 'creation' } });
    expect(heldTraces().map(t => t.result)).toEqual(['raised']);
  });

  it('a second run leaves one forge and one owns edge (already_theirs)', () => {
    let state = run(buildState(), runtime, HOLD_FORGE);
    state = run(state, runtime, HOLD_FORGE, TICK + 5);
    const forges = placesOfType(state.graph, 'town-1', FORGE);
    expect(forges).toHaveLength(1);
    expect(state.graph.getIncomingEdges(forges[0]!.id, 'owns')).toHaveLength(1);
    expect(heldTraces().map(t => t.result)).toEqual(['raised', 'already_theirs']);
  });

  it('a forge held by another raises nothing and pays the actor one Means step (held_elsewhere)', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'forge-odo', type: 'location', name: "Odo Marsh's forge", properties: { parentLocationId: 'town-1', sublocationTypeId: FORGE, persistence: { type: 'permanent' } } });
    graph.addEdge({ id: 'contains-forge', source: 'town-1', target: 'forge-odo', type: 'contains', properties: {} });
    grantHolding(graph, 'actor-2', 'forge-odo', { tick: 1 }, 'creation');
    const state = run(buildState(graph), runtime, HOLD_FORGE);
    expect(placesOfType(state.graph, 'town-1', FORGE)).toHaveLength(1);
    expect(state.graph.getIncomingEdges('forge-odo', 'owns').map(e => e.source)).toEqual(['actor-2']);
    expect(state.graph.getNode('actor-1')?.properties.wealth).toBe(30 + MEANS_STEP);
    const [t] = heldTraces();
    expect(t).toMatchObject({ result: 'held_elsewhere', placeId: 'forge-odo', meansPaid: MEANS_STEP });
  });

  it('an unheld forge is taken up with via grant', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'forge-old', type: 'location', name: 'The Old Forge', properties: { parentLocationId: 'town-1', sublocationTypeId: FORGE, persistence: { type: 'permanent' } } });
    graph.addEdge({ id: 'contains-forge', source: 'town-1', target: 'forge-old', type: 'contains', properties: {} });
    const state = run(buildState(graph), runtime, HOLD_FORGE);
    expect(placesOfType(state.graph, 'town-1', FORGE)).toHaveLength(1);
    expect(state.graph.getIncomingEdges('forge-old', 'owns')[0]).toMatchObject({ source: 'actor-1', properties: { via: 'grant' } });
    expect(heldTraces().map(t => t.result)).toEqual(['taken_up']);
  });

  it('with no resolvable site, writes nothing and traces aftermath_target_invalid', () => {
    const graph = buildGraph();
    graph.removeEdge('at-1');
    const before = graph.getNodesByType('location').length;
    const state = run(buildState(graph), runtime, HOLD_FORGE);
    expect(state.graph.getNodesByType('location')).toHaveLength(before);
    expect(heldTraces()).toHaveLength(0);
    expect(getTraces().some(t => t.category === 'aftermath_target_invalid'
      && (t as unknown as { effectKind: string }).effectKind === 'hold_place')).toBe(true);
  });

  it('a conditional mine taken up is made permanent and survives its ore running out', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'mine-1', type: 'location', name: 'The Ashford Mine',
      properties: { parentLocationId: 'town-1', sublocationTypeId: MINE, persistence: { type: 'conditional', predicate: 'has_resource:ore||has_resource:stone' } },
    });
    graph.addEdge({ id: 'contains-mine', source: 'town-1', target: 'mine-1', type: 'contains', properties: {} });
    const state = run(buildState(graph), runtime, { kind: 'hold_place', placeTypeId: MINE, nameNoun: 'claim', heldElsewhereMeans: 0 });
    expect(state.graph.getNode('mine-1')?.properties.persistence).toEqual({ type: 'permanent' });
    // Ashford has no ore and no stone: an unheld conditional mine would dissolve here.
    checkDissolutions(state.graph, TICK + 1);
    expect(state.graph.getNode('mine-1')).toBeDefined();
    expect(state.graph.getIncomingEdges('mine-1', 'owns')).toHaveLength(1);
  });
});

describe('THR-2048 — the place-holding outcome tables', () => {
  const ROWS: Record<string, string> = {
    'encounter.forge_construction': FORGE,
    'encounter.prospecting_expedition': MINE,
    'encounter.prospect_the_seam': MINE,
  };

  it.each(Object.entries(ROWS))('%s holds its place on every success band and never on a failure', (id, typeId) => {
    const template = getUnifiedTemplateById(id);
    const table = template?.outcomeEffects;
    expect(table).toBeDefined();
    for (const band of ['critical_success', 'success', 'success_at_cost'] as const) {
      const hold = (table?.[band] ?? []).find(e => e.kind === 'hold_place');
      expect(hold, `${id} ${band}`).toMatchObject({ kind: 'hold_place', placeTypeId: typeId });
    }
    for (const band of ['failure', 'critical_failure'] as const) {
      expect((table?.[band] ?? []).some(e => e.kind === 'hold_place')).toBe(false);
    }
  });

  it('every amount on the three tables is a named step', () => {
    for (const id of Object.keys(ROWS)) {
      const table = getUnifiedTemplateById(id)?.outcomeEffects ?? {};
      for (const effects of Object.values(table)) {
        for (const e of effects ?? []) {
          if (e.kind === 'economy_shift') expect([MEANS_STEP, -MEANS_STEP, -MEANS_STEP_SMALL, W_PROSPERITY.small, W_PROSPERITY.step]).toContain(e.amount);
          if (e.kind === 'hold_place') expect([MEANS_STEP, 0]).toContain(e.heldElsewhereMeans);
        }
      }
    }
  });
});
