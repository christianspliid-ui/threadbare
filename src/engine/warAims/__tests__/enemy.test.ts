/**
 * THR-1922 — armies march on and besiege only enemies, never a town their own faction
 * keeps a hall or home in.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { isEnemyFaction, factionKeepsHallAt, mayBesiege } from '../enemy';
import { selectArmyObjective } from '../../armySpawning';
import { phaseBattleDetection } from '../../battleResolution';
import type { ArmyState } from '../../../types/army';
import type { GameState } from '../../../types/gameState';

function makeState(graph: WorldGraph): GameState {
  return { tick: 1, seed: 42, graph } as unknown as GameState;
}

function addFaction(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'faction', ...props } });
}

function addTown(graph: WorldGraph, id: string, holder?: string): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationSubtype: 'town' } });
  if (holder) {
    graph.addEdge({ id: `e_ctl_${holder}_${id}`, source: holder, target: id, type: 'controls', properties: {} });
  }
}

function link(graph: WorldGraph, a: string, b: string): void {
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
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'group', armyState } });
  graph.addEdge({ id: `e_mem_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army' } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

function sieges(graph: WorldGraph): string[] {
  return graph.getNodesByType('actor')
    .map(n => n.properties.battleState as { battleType?: string; settlementId?: string } | undefined)
    .filter(bs => bs?.battleType === 'siege')
    .map(bs => bs!.settlementId!);
}

describe('isEnemyFaction', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    addFaction(graph, 'a');
    addFaction(graph, 'b');
  });

  it('is false with no relation, for the same faction, and for missing ids', () => {
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(false);
    expect(isEnemyFaction(graph, 'a', 'a')).toBe(false);
    expect(isEnemyFaction(graph, undefined, 'b')).toBe(false);
  });

  it('reads hostile_to either way', () => {
    graph.addEdge({ id: 'h', source: 'b', target: 'a', type: 'hostile_to', properties: {} });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(true);
  });

  it('reads rivalry, war, and sentiment below the rivalry threshold, either way', () => {
    relate(graph, 'b', 'a', { isRival: true });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(true);
  });

  it('reads basis war', () => {
    relate(graph, 'a', 'b', { basis: 'war' });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(true);
  });

  it('counts sentiment below -0.3 and not a mild dislike', () => {
    relate(graph, 'a', 'b', { sentiment: -0.2 });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(false);
    graph.removeEdge('e_rel_a_b');
    relate(graph, 'a', 'b', { sentiment: -0.5 });
    expect(isEnemyFaction(graph, 'a', 'b')).toBe(true);
  });
});

describe('factionKeepsHallAt', () => {
  it('finds the home, a located_at hall edge, and a faction-hall sublocation', () => {
    const graph = new WorldGraph();
    addTown(graph, 't1');
    addTown(graph, 't2');
    addTown(graph, 't3');
    addTown(graph, 't4');
    addFaction(graph, 'guild', { homeLocationId: 't1' });
    graph.addEdge({ id: 'e_hall', source: 'guild', target: 't2', type: 'located_at', properties: { role: 'guild_hall' } });
    graph.addNode({
      id: 'sub', type: 'location', name: 'Hall',
      properties: { sublocationTypeId: 'sublocation-type.faction-hall', parentLocationId: 't3', factionId: 'guild' },
    });
    graph.addEdge({ id: 'e_contains', source: 't3', target: 'sub', type: 'contains', properties: {} });

    expect(factionKeepsHallAt(graph, 'guild', 't1')).toBe(true);
    expect(factionKeepsHallAt(graph, 'guild', 't2')).toBe(true);
    expect(factionKeepsHallAt(graph, 'guild', 't3')).toBe(true);
    expect(factionKeepsHallAt(graph, 'guild', 't4')).toBe(false);
  });
});

describe('selectArmyObjective — THR-1922 enemy guard', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    addFaction(graph, 'guard', { homeLocationId: 'home' });
    addFaction(graph, 'realm');
    addFaction(graph, 'foe');
    addTown(graph, 'home', 'realm'); // the guard's own hall town, held by a realm
    addTown(graph, 'near', 'realm'); // no quarrel
    addTown(graph, 'far', 'foe');
    link(graph, 'home', 'near');
    link(graph, 'near', 'far');
    addArmy(graph, 'army', 'guard', 'home');
  });

  it('skips its own hall town and a holder it has no quarrel with, and marches on the enemy', () => {
    relate(graph, 'guard', 'foe', { isRival: true });
    const objective = selectArmyObjective(makeState(graph), 'army', 'guard');
    expect(objective?.targetNodeId).toBe('far');
  });

  it('holds at its muster point when no enemy town exists', () => {
    expect(selectArmyObjective(makeState(graph), 'army', 'guard')).toBeNull();
  });

  it('never targets its own hall town even when its holder is an enemy', () => {
    relate(graph, 'guard', 'realm', { isRival: true });
    const objective = selectArmyObjective(makeState(graph), 'army', 'guard');
    expect(objective?.targetNodeId).toBe('near');
  });
});

describe('siege start — THR-1922 enemy guard', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    addFaction(graph, 'guard', { homeLocationId: 'home' });
    addFaction(graph, 'realm');
    addTown(graph, 'home', 'realm');
    addTown(graph, 'other', 'realm');
  });

  it('does not besiege its own hall town, even held by an enemy', () => {
    relate(graph, 'guard', 'realm', { isRival: true });
    addArmy(graph, 'army', 'guard', 'home', 'home');
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual([]);
  });

  it('does not besiege a town whose holder it has no quarrel with', () => {
    addArmy(graph, 'army', 'guard', 'other');
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual([]);
  });

  it('besieges an enemy town', () => {
    relate(graph, 'guard', 'realm', { basis: 'war' });
    addArmy(graph, 'army', 'guard', 'other');
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual(['other']);
  });

  it('besieges the town a notable campaign declared, and not a plain objective town', () => {
    addArmy(graph, 'army', 'guard', 'other', 'other');
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual([]);

    graph.addNode({ id: 'amb', type: 'ambition', name: 'campaign', properties: { compositionId: 'c1', targetNodeId: 'other' } });
    graph.addEdge({ id: 'e_pursues', source: 'army', target: 'amb', type: 'pursues', properties: {} });
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual(['other']);
    expect(mayBesiege(graph, 'guard', 'realm', 'other')).toBe(false);
  });

  it('may besiege its own hall town to win it back from the enemy who took it', () => {
    relate(graph, 'guard', 'realm', { isRival: true });
    graph.updateEdge('e_ctl_realm_home', { properties: { via: 'conquest', takenFrom: 'guard' } });
    addArmy(graph, 'army', 'guard', 'home');
    phaseBattleDetection(makeState(graph));
    expect(sieges(graph)).toEqual(['home']);
  });
});
