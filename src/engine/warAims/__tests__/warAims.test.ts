/**
 * THR-1933 (war aims S1) — enemies only, defence first, the richest enemy town in reach,
 * the daily re-aim, ambition targets. Fixtures: a row of hexes on one map row, towns
 * joined by roads (the supply walk), factions with `relates_to` quarrels.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { enemyArm, isEnemyFaction } from '../enemy';
import { buildWarAimContext } from '../context';
import { pickWarAim } from '../score';
import { townValueFor } from '../townValue';
import { findThreatToDefend } from '../defence';
import { aimNewArmy, reaimArmies, grievanceFactionOf, readWarAims } from '../../warAims';
import { phaseBattleDetection } from '../../battleResolution';
import type { ArmyState } from '../../../types/army';
import type { GameState } from '../../../types/gameState';
import { WAR_AIM_REAIM_INTERVAL_TICKS } from '../../../data/war-aims-constants';
import { armyAimTemplate, scarceClauseOf, ARMY_HOLD_COPY } from '../../../data/army-words';

const NO_REALMS = new Map<string, string>();
const noProjection = () => ({ hexRealmId: NO_REALMS }) as never;

function makeState(graph: WorldGraph, tick = WAR_AIM_REAIM_INTERVAL_TICKS): GameState {
  return { tick, seed: 42, graph, tiles: [] } as unknown as GameState;
}

function addFaction(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'actor', name: id.toUpperCase(), properties: { actorType: 'faction', ...props } });
}

function addTown(graph: WorldGraph, id: string, col: number, holder: string | null, prosperity = 50, extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'location', name: `Town ${id}`, properties: { locationSubtype: 'town', hexCol: col, hexRow: 0, prosperity, ...extra } });
  if (holder) graph.addEdge({ id: `e_ctl_${holder}_${id}`, source: holder, target: id, type: 'controls', properties: {} });
}

function road(graph: WorldGraph, a: string, b: string): void {
  graph.addEdge({ id: `e_road_${a}_${b}`, source: a, target: b, type: 'road', properties: {} });
  graph.addEdge({ id: `e_adj_${a}_${b}`, source: a, target: b, type: 'adjacent', properties: { distance: 1 } });
  graph.addEdge({ id: `e_adj_${b}_${a}`, source: b, target: a, type: 'adjacent', properties: { distance: 1 } });
}

function relate(graph: WorldGraph, a: string, b: string, props: Record<string, unknown>): void {
  graph.addEdge({ id: `e_rel_${a}_${b}`, source: a, target: b, type: 'relates_to', properties: props });
}

function addArmy(graph: WorldGraph, id: string, factionId: string, locationId: string, objectiveTarget?: string): void {
  const armyState: ArmyState = {
    size: 'warband',
    headcount: 100,
    objective: objectiveTarget ? { type: 'conquer', targetNodeId: objectiveTarget, estimatedAttrition: 0 } : null,
    cohesion: 30,
    cohesionMax: 30,
    raisedTick: 0,
    maintenanceCost: 2,
    thresholdsFired: [],
  };
  graph.addNode({ id, type: 'actor', name: `${factionId} host`, properties: { actorType: 'group', armyState } });
  graph.addEdge({ id: `e_mem_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army' } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function armyState(graph: WorldGraph, id: string): ArmyState {
  return graph.getNode(id)!.properties.armyState as ArmyState;
}

describe('the enemy rule (§ Engine 1)', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    addFaction(graph, 'a');
    addFaction(graph, 'b');
  });

  it('a monster faction is everyone\'s enemy', () => {
    addFaction(graph, 'm', { factionType: 'monster' });
    expect(enemyArm(graph, 'a', 'm')).toBe('monster');
    expect(isEnemyFaction(graph, 'm', 'b')).toBe(true);
  });

  it('an alliance silences the sentiment arm only', () => {
    relate(graph, 'a', 'b', { sentiment: -0.6, isAlliance: true });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(false);
    relate(graph, 'b', 'a', { basis: 'war' });
    expect(enemyArm(graph, 'a', 'b')).toBe('war');
  });
});

describe('peace holds (battle start reads the enemy rule)', () => {
  it('two non-enemy armies on one hex do not fight; a declared war makes them', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'a');
    addFaction(graph, 'b');
    addTown(graph, 'field', 0, null);
    addArmy(graph, 'army_a', 'a', 'field');
    addArmy(graph, 'army_b', 'b', 'field');
    const state = makeState(graph, 1);
    const battles = () => graph.getNodesByType('actor').filter(n => n.properties.battleState != null).length;

    phaseBattleDetection(state);
    expect(battles()).toBe(0);

    relate(graph, 'a', 'b', { basis: 'war' });
    phaseBattleDetection(state);
    expect(battles()).toBe(1);
  });
});

/** a holds t0 and t1 (home), b holds t3 (poor, near) and t6 (rich, far); roads join them all. */
function warWorld(): WorldGraph {
  const graph = new WorldGraph();
  addFaction(graph, 'a');
  addFaction(graph, 'b');
  addFaction(graph, 'c');
  relate(graph, 'a', 'b', { isRival: true });
  addTown(graph, 't0', 0, 'a');
  addTown(graph, 't1', 1, 'a');
  addTown(graph, 't3', 3, 'b', 20);
  addTown(graph, 't4', 4, 'c', 90); // c is no enemy: never a target
  addTown(graph, 't6', 4, 'b', 95);
  road(graph, 't0', 't1');
  road(graph, 't1', 't3');
  road(graph, 't1', 't4');
  road(graph, 't1', 't6');
  return graph;
}

describe('the richest enemy town in reach (§ Engine 3)', () => {
  it('prices a town with the purse\'s helpers: more prosperity, more value', () => {
    const graph = warWorld();
    const ctx = buildWarAimContext(graph, NO_REALMS);
    expect(townValueFor(ctx, 't6')).toBeGreaterThan(townValueFor(ctx, 't3'));
  });

  it('picks the richer enemy town over the nearer poor one, and never a non-enemy\'s', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0');
    const state = makeState(graph);
    const ctx = buildWarAimContext(graph, NO_REALMS);
    const pick = pickWarAim(state, ctx, 'a', { col: 0, row: 0 });
    expect(pick.objective).toMatchObject({ type: 'conquer', targetNodeId: 't6', reason: 'richest', source: 'war_aim' });
    expect(pick.scored.map(s => s.townId).sort()).toEqual(['t3', 't6']);
    expect(pick.nearestEnemyTownId).toBe('t3');
  });

  it('leaves out a town no supply line reaches, and holds when nothing is left', () => {
    const graph = new WorldGraph();
    addFaction(graph, 'a');
    addFaction(graph, 'b');
    relate(graph, 'a', 'b', { isRival: true });
    addTown(graph, 't0', 0, 'a');
    addTown(graph, 't3', 3, 'b'); // no road: out of reach
    addArmy(graph, 'army_a', 'a', 't0');
    const state = makeState(graph);
    aimNewArmy(state, 'army_a', noProjection);
    expect(armyState(graph, 'army_a').objective).toBeNull();
    expect(armyState(graph, 'army_a').holdReason).toBe('no_enemy_in_reach');
  });

  it('a town bearing a staple the attacker\'s towns are short of carries the staple reason', () => {
    const graph = warWorld();
    graph.getNode('t0')!.properties.resources = { grain: { quantity: 40, stockTier: 'scarce' } };
    graph.getNode('t3')!.properties.resources = { grain: { quantity: 80, stockTier: 'surplus' } };
    graph.getNode('t3')!.properties.prosperity = 95;
    addArmy(graph, 'army_a', 'a', 't0');
    const ctx = buildWarAimContext(graph, NO_REALMS);
    const pick = pickWarAim(makeState(graph), ctx, 'a', { col: 0, row: 0 });
    expect(pick.objective).toMatchObject({ targetNodeId: 't3', reason: 'feeds_staple', reasonResourceId: 'grain' });
  });
});

describe('defence first (§ Engine 2)', () => {
  it('an enemy army marching on a holding within reach turns the army to defend it', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0');
    addArmy(graph, 'army_b', 'b', 't6', 't1');
    const d = findThreatToDefend(graph, 'army_a', 'a', { col: 0, row: 0 });
    expect(d?.objective).toMatchObject({ type: 'defend', targetNodeId: 't1', reason: 'defence', againstArmyId: 'army_b' });
    expect(d?.sworn).toBe(false);
  });

  it('defends a sworn vassal\'s town too', () => {
    const graph = warWorld();
    addFaction(graph, 'v');
    graph.removeEdge('e_ctl_a_t1');
    graph.addEdge({ id: 'e_ctl_v_t1', source: 'v', target: 't1', type: 'controls', properties: {} });
    graph.addEdge({ id: 'e_oath', source: 'v', target: 'a', type: 'sworn_to', properties: { kind: 'persuaded', sinceTick: 0 } });
    addArmy(graph, 'army_a', 'a', 't0');
    addArmy(graph, 'army_b', 'b', 't6', 't1');
    const d = findThreatToDefend(graph, 'army_a', 'a', { col: 0, row: 0 });
    expect(d?.objective.targetNodeId).toBe('t1');
    expect(d?.sworn).toBe(true);
  });
});

describe('the daily re-aim (§ Engine 4)', () => {
  it('turns a marching army to defence, then back to value once the threat is gone', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0', 't6');
    addArmy(graph, 'army_b', 'b', 't6', 't1');
    const state = makeState(graph);
    reaimArmies(state, noProjection);
    expect(armyState(graph, 'army_a').objective).toMatchObject({ type: 'defend', targetNodeId: 't1' });

    graph.removeNode('army_b');
    reaimArmies(state, noProjection);
    expect(armyState(graph, 'army_a').objective).toMatchObject({ type: 'conquer', targetNodeId: 't6' });
  });

  it('keeps a still-valid conquer target (no churn) and leaves a campaign army alone', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0', 't3');
    addArmy(graph, 'army_c', 'a', 't0');
    armyState(graph, 'army_c').objective = { type: 'conquer', targetNodeId: 't4', estimatedAttrition: 0, source: 'agenda' };
    reaimArmies(makeState(graph), noProjection);
    expect(armyState(graph, 'army_a').objective?.targetNodeId).toBe('t3');
    expect(armyState(graph, 'army_c').objective?.targetNodeId).toBe('t4');
  });

  it('drops a target whose holder is no longer an enemy', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0', 't4'); // c is not an enemy
    reaimArmies(makeState(graph), noProjection);
    expect(armyState(graph, 'army_a').objective?.targetNodeId).toBe('t6');
    expect(readWarAims(makeState(graph), 'army_a')?.candidates.length).toBeGreaterThan(0);
  });

  it('runs only on the daily gate', () => {
    const graph = warWorld();
    addArmy(graph, 'army_a', 'a', 't0');
    reaimArmies(makeState(graph, WAR_AIM_REAIM_INTERVAL_TICKS + 1), noProjection);
    expect(armyState(graph, 'army_a').objective).toBeNull();
    expect(armyState(graph, 'army_a').holdReason).toBeUndefined();
  });
});

describe('ambitions take their target (§ Engine 5)', () => {
  it('writes the conquer target onto a territorial ambition', () => {
    const graph = warWorld();
    graph.addNode({ id: 'amb', type: 'ambition', name: 'amb', properties: { ambitionType: 'territorial_expansion', targetNodeId: null } });
    addArmy(graph, 'army_a', 'a', 't0');
    graph.addEdge({ id: 'e_p', source: 'army_a', target: 'amb', type: 'pursues', properties: {} });
    aimNewArmy(makeState(graph), 'army_a', noProjection);
    expect(graph.getNode('amb')!.properties.targetNodeId).toBe('t6');
  });

  it('revenge aims at the enemy this faction hates most', () => {
    const graph = warWorld();
    relate(graph, 'a', 'c', { sentiment: -0.9 });
    graph.updateEdge('e_rel_a_b', { properties: { sentiment: -0.4, isRival: true } });
    expect(grievanceFactionOf(graph, 'a')).toBe('c');
    expect(grievanceFactionOf(graph, 'a', { grievanceAgainstFactionId: 'b' })).toBe('b');
  });
});

describe('the army sheet words (§ Player-facing text)', () => {
  it('says why, with town and enemy slots', () => {
    expect(armyAimTemplate({ objectiveType: 'conquer', reason: 'richest' }))
      .toBe('Marching to take {town}, the richest enemy town within reach.');
    expect(armyAimTemplate({
      objectiveType: 'conquer', reason: 'feeds_staple', resourceName: 'grain',
      scarceClause: scarceClauseOf('grain', 'The grain stores are low. Bread is dear.'), attackerFactionName: 'Ashfold',
    })).toBe('Marching to take {town} for its grain: the stores are low in Ashfold\'s towns.');
    expect(armyAimTemplate({ objectiveType: 'defend', reason: 'defence', hasNamedEnemy: true }))
      .toBe('Holding {town} against the {enemy} host.');
    expect(armyAimTemplate({ objectiveType: 'defend', reason: 'defence', hasNamedEnemy: false }))
      .toBe('Holding {town} against an enemy host.');
    expect(armyAimTemplate({ objectiveType: 'conquer' })).toBeNull();
    expect(scarceClauseOf('fish', 'The nets come up light. The fishers talk.')).toBe('the nets come up light');
    expect(ARMY_HOLD_COPY.home).toBe('Mustered at home: no enemy within reach.');
  });
});
