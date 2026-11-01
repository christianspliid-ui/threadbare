/**
 * THR-2094 — town cards reach the Mandate.
 *
 * Decision 1: the god's sphere push at a town lands in the town's Place holding least of
 * that sphere (ties by id); a town with no Places keeps it; every other push passes through.
 * Decision 2: a god card's push scales by its price, capped at GOD_PUSH_ESSENCE_CAP
 * (a 1-essence look pushes 3, a 2- or 8-essence working pushes 6); mortal casts push 3.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveTownPressureTargets } from '../townPressureTarget';
import { phaseSpherePressure } from '../phaseSpherePressure';
import { godPushScale, phaseUnifiedActionProgress } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { resetOpCounter } from '../graphOpExecutor';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  ACTION_PRESSURE_SUCCESS,
  GOD_PUSH_ESSENCE_CAP,
  createDefaultSphereAffinity,
} from '../../types/sphereAffinity';
import type { SpherePressureEvent } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

const ASC = 'asc';

function affinityWith(sphere?: SphereName, score = 0) {
  const aff = createDefaultSphereAffinity();
  if (sphere) aff.scores[sphere] = score;
  return aff;
}

function addTown(graph: WorldGraph, id: string, subtype = 'town'): void {
  graph.addNode({
    id, type: 'location', name: id,
    properties: { locationType: subtype, locationSubtype: subtype, sphereAffinity: createDefaultSphereAffinity() },
  } as never);
}

function addPlace(graph: WorldGraph, id: string, parent: string, sphere?: SphereName, score = 0): void {
  graph.addNode({
    id, type: 'location', name: id,
    properties: { parentLocationId: parent, sphereAffinity: affinityWith(sphere, score) },
  } as never);
}

function godPush(targetId: string, sphere: SphereName = 'force', over: Partial<SpherePressureEvent> = {}): SpherePressureEvent {
  return {
    targetEntityId: targetId, sphere, magnitude: ACTION_PRESSURE_SUCCESS,
    source: 'divine_action', sourceId: 'act_1', causedBy: ASC, ...over,
  };
}

describe('resolveTownPressureTargets (THR-2094)', () => {
  it('lands the god\'s town push on the Place with the lowest score in the sphere', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town', 'force', 3);
    addPlace(graph, 'p_b', 'town', 'force', 1);
    addPlace(graph, 'p_c', 'town', 'force', 2);
    const push = godPush('town');
    const { pressures, traces } = resolveTownPressureTargets(graph, [push], ASC, 9);
    expect(pressures).toEqual([{ ...push, targetEntityId: 'p_b', aimedAtId: 'town' }]);
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      category: 'sphere_pressure.town_resolved', townId: 'town', sublocationId: 'p_b',
      sphere: 'force', sublocationScore: 1, tick: 9,
    });
  });

  it('breaks a score tie by id, and reads a missing affinity as 0', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town', 'hamlet');
    addPlace(graph, 'p_z', 'town');
    addPlace(graph, 'p_y', 'town');
    graph.addNode({ id: 'p_x', type: 'location', name: 'p_x', properties: { parentLocationId: 'town' } } as never);
    const { pressures } = resolveTownPressureTargets(graph, [godPush('town', 'time')], ASC, 1);
    expect(pressures[0].targetEntityId).toBe('p_x');
  });

  it('keeps the push on a town with no Places, with no trace', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    const push = godPush('town');
    const { pressures, traces } = resolveTownPressureTargets(graph, [push], ASC, 1);
    expect(pressures).toEqual([push]);
    expect(traces).toEqual([]);
  });

  it('passes through a non-town target, a mortal\'s push and a rival\'s push', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    addTown(graph, 'ruin', 'ruins');
    addPlace(graph, 'p_r', 'ruin');
    const nonTown = godPush('ruin');
    const mortal = godPush('town', 'force', { causedBy: 'agent_1' });
    const rival = godPush('town', 'force', { source: 'rival', causedBy: ASC });
    const { pressures, traces } = resolveTownPressureTargets(graph, [nonTown, mortal, rival], ASC, 1);
    expect(pressures).toEqual([nonTown, mortal, rival]);
    expect(traces).toEqual([]);
  });

  it('passes every push through when the switch is off', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const push = godPush('town');
    const { pressures, traces } = resolveTownPressureTargets(graph, [push], ASC, 1, { enabled: false });
    expect(pressures).toEqual([push]);
    expect(traces).toEqual([]);
  });

  it('emits one trace per re-aimed push', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town_1');
    addTown(graph, 'town_2', 'city');
    addTown(graph, 'town_3');
    addPlace(graph, 'p_1', 'town_1');
    addPlace(graph, 'p_2', 'town_2');
    const { pressures, traces } = resolveTownPressureTargets(
      graph, [godPush('town_1'), godPush('town_2', 'matter'), godPush('town_3')], ASC, 1,
    );
    expect(pressures.map(p => p.targetEntityId)).toEqual(['p_1', 'p_2', 'town_3']);
    expect(traces.map(t => t.sublocationId)).toEqual(['p_1', 'p_2']);
  });
});

describe('phaseSpherePressure re-aims the god\'s town push (THR-2094)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  it('moves the Place\'s progress, not the town\'s, and emits the trace', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town', 'force', 2);
    addPlace(graph, 'p_b', 'town');
    const state = {
      tick: 4, graph, tiles: [], ascendantId: ASC, pendingSpherePressures: [godPush('town')],
    } as unknown as GameState;
    phaseSpherePressure(state);
    const read = (id: string) => {
      const aff = graph.getNode(id)!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
      return aff.scores.force * 1000 + aff.progress.force;
    };
    expect(read('town')).toBe(0);
    expect(read('p_b')).toBeGreaterThan(0);
    expect(read('p_a')).toBe(2000);
    expect(getTraces().some(t => t.category === 'sphere_pressure.town_resolved')).toBe(true);
  });
});

describe('god push strength by price (THR-2094 Decision 2)', () => {
  it('scales the god\'s push by price, capped; mortal and missing prices are 1', () => {
    expect(GOD_PUSH_ESSENCE_CAP).toBe(2);
    expect(godPushScale(true, 1)).toBe(1);
    expect(godPushScale(true, 2)).toBe(2);
    expect(godPushScale(true, 8)).toBe(2);
    expect(godPushScale(true, undefined)).toBe(1);
    expect(godPushScale(true, 0)).toBe(1);
    expect(godPushScale(false, 8)).toBe(1);
    expect(godPushScale(true, 8, 1)).toBe(1);
  });

  function stateWithCast(actorId: string, essenceCost: number): { state: GameState; templates: UnifiedActionTemplate[] } {
    const graph = new WorldGraph();
    graph.addNode({ id: ASC, type: 'actor', name: 'God', properties: { actorType: 'ascendant', domainAffinities: { iron: 0.8 } } });
    graph.addNode({ id: 'agent-1', type: 'actor', name: 'Alice', properties: { actorType: 'individual', divineInfluences: [] } });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Village', properties: { locationType: 'town', locationSubtype: 'town' } });
    graph.addEdge({ id: 'e-1', source: 'agent-1', target: 'loc-1', type: 'located_at', properties: {} });
    const base = getUnifiedTemplateById('divine.dream')!;
    const template = { ...base, id: `test.push_${essenceCost}`, essenceCost, sphereAffinity: 'mind' } as UnifiedActionTemplate;
    const action = createUnifiedAction({
      actorId, templateId: template.id, targetId: 'agent-1', scale: 'cosmic',
      source: actorId === ASC ? 'player' : 'agent', tick: 10, template, rng: () => 0.5,
    });
    const state = {
      tick: 11, seed: 42, graph, tiles: [], ascendantId: ASC, essencePool: {}, tickEvents: [],
      recentEvents: [], unifiedActions: [action], pendingSpherePressures: [],
      mandateDefinition: null, mandateState: null, rivalDefinitions: [], rivalStates: [],
    } as unknown as GameState;
    return { state, templates: [template] };
  }

  function pushOf(actorId: string, essenceCost: number): number | undefined {
    const { state, templates } = stateWithCast(actorId, essenceCost);
    const result = phaseUnifiedActionProgress(state, templates, () => 0.5);
    const push = (result.pendingSpherePressures ?? []).find(p => p.sourceId === state.unifiedActions[0].actionId);
    return push?.magnitude;
  }

  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
    clearTraces();
  });

  it('the god\'s 1-, 2- and 8-essence casts push 3 / 6 / 6; a mortal\'s pushes 3', () => {
    expect(pushOf(ASC, 1)).toBe(ACTION_PRESSURE_SUCCESS);
    expect(pushOf(ASC, 2)).toBe(ACTION_PRESSURE_SUCCESS * 2);
    expect(pushOf(ASC, 8)).toBe(ACTION_PRESSURE_SUCCESS * 2);
    expect(pushOf('agent-1', 8)).toBe(ACTION_PRESSURE_SUCCESS);
  });
});
