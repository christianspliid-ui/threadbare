/**
 * THR-2094 — town cards reach the Mandate.
 *
 * Decision 1: the god's sphere push at a town lands in the town's Place holding least of
 * that sphere (ties by id); a town with no Places keeps it; every other push passes through.
 * The town keeps an unscaled copy (`townEcho`) that moves its scores but credits no Mandate.
 * Decision 2: a god card's push scales by its price, capped at GOD_PUSH_ESSENCE_CAP
 * (a 1-essence look pushes 3, a 2- or 8-essence working pushes 6); mortal casts push 3.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  TOWN_ECHO_BANK_KEY,
  readTownEchoBank,
  resolveTownPressureTargets,
  townEchoBankAfter,
} from '../townPressureTarget';
import { isGodCausedPush } from '../mandateLedger';
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
    expect(pressures).toEqual([
      { ...push, targetEntityId: 'p_b' },
      { ...push, townEcho: true },
    ]);
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

  it('leaves a keepOnTarget push (Shift Dominion\'s break) on the town', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const push = godPush('town', 'force', { keepOnTarget: true });
    const { pressures, traces } = resolveTownPressureTargets(graph, [push], ASC, 1);
    expect(pressures).toEqual([push]);
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

  it('leaves the town an unscaled copy that is never the god\'s for the Mandate', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const push = godPush('town', 'force', { magnitude: ACTION_PRESSURE_SUCCESS * 2, pushScale: 2 });
    const { pressures } = resolveTownPressureTargets(graph, [push], ASC, 1);
    expect(pressures[0]).toMatchObject({ targetEntityId: 'p_a', magnitude: 6, pushScale: 2 });
    const echo = pressures[1];
    expect(echo).toMatchObject({ targetEntityId: 'town', magnitude: ACTION_PRESSURE_SUCCESS, townEcho: true });
    expect(echo.pushScale).toBeUndefined();
    expect(isGodCausedPush(pressures[0], graph, ASC)).toBe(true);
    expect(isGodCausedPush(echo, graph, ASC)).toBe(false);
  });

  it('moves the whole push to the Place when the echo switch is off', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const push = godPush('town');
    const { pressures } = resolveTownPressureTargets(graph, [push], ASC, 1, { keepEcho: false });
    expect(pressures).toEqual([{ ...push, targetEntityId: 'p_a' }]);
  });

  it('never lands on a Place that reads its host\'s scores (an echo monument)', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_b', 'town', 'force', 2);
    graph.addNode({
      id: 'echo_monument_a', type: 'location', name: 'monument',
      properties: { parentLocationId: 'town', dominionReadsParent: true },
    } as never);
    const { pressures } = resolveTownPressureTargets(graph, [godPush('town')], ASC, 1);
    expect(pressures[0].targetEntityId).toBe('p_b');
  });

  it('keeps the push on a town whose only Place is an echo monument', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    graph.addNode({
      id: 'echo_monument_a', type: 'location', name: 'monument',
      properties: { parentLocationId: 'town', dominionReadsParent: true },
    } as never);
    const push = godPush('town');
    const { pressures } = resolveTownPressureTargets(graph, [push], ASC, 1);
    expect(pressures).toEqual([push]);
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
    expect(pressures.map(p => p.targetEntityId)).toEqual(['p_1', 'town_1', 'p_2', 'town_2', 'town_3']);
    expect(traces.map(t => t.sublocationId)).toEqual(['p_1', 'p_2']);
  });
});

describe('phaseSpherePressure re-aims the god\'s town push (THR-2094)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  it('moves the Place\'s progress and the town\'s own, and emits the trace', () => {
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
    // The town feels the push as before the re-aim, so its Dominion reads still move.
    expect(read('town')).toBeGreaterThan(0);
    expect(read('p_b')).toBeGreaterThan(0);
    expect(read('p_a')).toBe(2000);
    expect(getTraces().some(t => t.category === 'sphere_pressure.town_resolved')).toBe(true);
  });

  it('credits the Mandate on the Place only, not on the town\'s copy', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town', 'force', 0);
    const lift = (id: string) => {
      const aff = graph.getNode(id)!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
      aff.progress.force = 0.99;
    };
    lift('town');
    lift('p_a');
    const state = {
      tick: 4, graph, tiles: [], ascendantId: ASC,
      pendingSpherePressures: [godPush('town', 'force', { magnitude: 6, pushScale: 2 })],
      mandateDefinition: { runtimeKind: 'sphere_growth', primarySphere: 'force', secondarySphere: 'matter' },
      mandateState: { completed: false },
    } as unknown as GameState;
    const result = phaseSpherePressure(state);
    const scoreOf = (id: string) =>
      (graph.getNode(id)!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>).scores.force;
    expect(scoreOf('town')).toBeGreaterThan(0);
    expect(scoreOf('p_a')).toBeGreaterThan(0);
    const credited = (result.pendingMandateCredits ?? []).map(c => c.entityId);
    expect(credited).toContain('p_a');
    expect(credited).not.toContain('town');
  });

  // The town is credited as if its copy were absent: a seat push beside it earns what it
  // would have alone — no less (dilution) and no more (the copy's level-up).
  function seatBesideCard(townProgress: number, withCard = true) {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const aff = graph.getNode('town')!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
    aff.progress.force = townProgress;
    const seat: SpherePressureEvent = {
      targetEntityId: 'town', sphere: 'force', magnitude: 0.25, source: 'seat', sourceId: 'seat_1',
    };
    const state = {
      tick: 4, graph, tiles: [], ascendantId: ASC,
      pendingSpherePressures: withCard ? [seat, godPush('town')] : [seat],
      mandateDefinition: { runtimeKind: 'sphere_growth', primarySphere: 'force', secondarySphere: 'matter' },
      mandateState: { completed: false },
    } as unknown as GameState;
    const result = phaseSpherePressure(state);
    return {
      townScore: (graph.getNode('town')!.properties!.sphereAffinity as typeof aff).scores.force,
      townCredit: (result.pendingMandateCredits ?? []).filter(c => c.entityId === 'town'),
    };
  }

  it('credits a seat push on the town in full when it would have levelled the town alone', () => {
    const { townScore, townCredit } = seatBesideCard(0.8);
    expect(townScore).toBe(1);
    expect(townCredit).toHaveLength(1);
    expect(townCredit).toEqual(seatBesideCard(0.8, false).townCredit);
  });

  it('credits nothing on the town when only the copy levelled it', () => {
    const { townScore, townCredit } = seatBesideCard(0.5);
    expect(townScore).toBe(1);
    expect(townCredit).toEqual([]);
  });

  // The copy's progress short of a level stays banked: a later seat push that tips the town
  // over earns only what it would have from the copy-free town (cycle 4 finding).
  function seatAfterCard(withCard: boolean) {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const aff = graph.getNode('town')!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
    aff.scores.force = 3;
    aff.progress.force = 0.8;
    const mandate = {
      mandateDefinition: { runtimeKind: 'sphere_growth', primarySphere: 'force', secondarySphere: 'matter' },
      mandateState: { completed: false },
    };
    const seat: SpherePressureEvent = {
      targetEntityId: 'town', sphere: 'force', magnitude: 0.25, source: 'seat', sourceId: 'seat_1',
    };
    if (withCard) {
      phaseSpherePressure({
        tick: 4, graph, tiles: [], ascendantId: ASC, pendingSpherePressures: [godPush('town')], ...mandate,
      } as unknown as GameState);
    }
    const bank = graph.getNode('town')!.properties!.townEchoBank;
    const result = phaseSpherePressure({
      tick: 5, graph, tiles: [], ascendantId: ASC, pendingSpherePressures: [seat], ...mandate,
    } as unknown as GameState);
    const after = graph.getNode('town')!.properties!.sphereAffinity as typeof aff;
    return {
      bank,
      townScore: after.scores.force,
      townCredit: (result.pendingMandateCredits ?? []).filter(c => c.entityId === 'town'),
    };
  }

  it('does not credit a later seat push for the level the copy filled', () => {
    const { bank, townScore, townCredit } = seatAfterCard(true);
    expect((bank as { force: number }).force).toBeCloseTo(ACTION_PRESSURE_SUCCESS);
    expect(townScore).toBe(4);
    expect(townCredit).toEqual([]);
    expect(seatAfterCard(false).townCredit).toEqual([]);
  });

  it('caps the bank at the progress the town still holds', () => {
    const real = affinityWith('force', 3);
    real.progress.force = 1;
    expect(readTownEchoBank({ [TOWN_ECHO_BANK_KEY]: { force: 5 } }, real)).toEqual({ force: 1 });
    expect(readTownEchoBank({ [TOWN_ECHO_BANK_KEY]: null }, real)).toBeNull();
    const copyFree = affinityWith('force', 3);
    expect(townEchoBankAfter(real, copyFree)).toEqual({ force: 1 });
    expect(townEchoBankAfter(copyFree, copyFree)).toBeNull();
  });

  // A rival push the copy cancelled wore nothing, so it debits nothing (cycle 3 finding).
  function rivalBesideCard(withCard: boolean) {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    addPlace(graph, 'p_a', 'town');
    const aff = graph.getNode('town')!.properties!.sphereAffinity as ReturnType<typeof createDefaultSphereAffinity>;
    aff.scores.force = 2;
    const rival: SpherePressureEvent = {
      targetEntityId: 'town', sphere: 'mind', magnitude: 5, source: 'rival', sourceId: 'rival_1',
    };
    const state = {
      tick: 4, graph, tiles: [], ascendantId: ASC,
      pendingSpherePressures: withCard ? [rival, godPush('town')] : [rival],
      mandateDefinition: { runtimeKind: 'sphere_growth', primarySphere: 'force', secondarySphere: 'matter' },
      mandateState: { completed: false },
    } as unknown as GameState;
    const result = phaseSpherePressure(state);
    return {
      townForce: (graph.getNode('town')!.properties!.sphereAffinity as typeof aff).scores.force,
      townDebits: (result.pendingMandateCredits ?? []).filter(c => c.entityId === 'town' && c.points < 0),
    };
  }

  it('debits the town for wear only when it really wore', () => {
    const alone = rivalBesideCard(false);
    expect(alone.townForce).toBeLessThan(2);
    expect(alone.townDebits.length).toBeGreaterThan(0);
    const withCard = rivalBesideCard(true);
    expect(withCard.townForce).toBe(2);
    expect(withCard.townDebits).toEqual([]);
  });

  it('carries a scaled push\'s pushScale onto the sphere_pressure trace', () => {
    const graph = new WorldGraph();
    addTown(graph, 'town');
    const state = {
      tick: 4, graph, tiles: [], ascendantId: ASC,
      pendingSpherePressures: [godPush('town', 'force', { magnitude: 6, pushScale: 2 })],
    } as unknown as GameState;
    phaseSpherePressure(state);
    const trace = getTraces().find(t => t.category === 'sphere_pressure') as { pushScales?: number[] } | undefined;
    expect(trace?.pushScales).toEqual([2]);
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
