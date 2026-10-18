import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseArmyAttrition,
  ARMY_BASE_ATTRITION,
  TERRAIN_ATTRITION_FACTOR,
  OFF_ROAD_ATTRITION_PENALTY,
  UNDERFUNDED_ATTRITION_PENALTY,
  COHESION_THRESHOLDS,
  MONSTER_TERRITORY_ATTRITION,
  isGarrisoned,
} from '../armyAttrition';
import { getArmyTerrainCost, getArmyMovementCost, ARMY_ROAD_DISCOUNT } from '../armyMovement';
import type { ArmyState } from '../../types/army';
import { ARMY_GARRISON_RECOVERY } from '../../types/army';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

function addArmy(
  graph: WorldGraph,
  id: string,
  locationId: string,
  opts?: Partial<ArmyState>,
): void {
  const armyState: ArmyState = {
    size: 'warband',
    headcount: 100,
    objective: null,
    cohesion: opts?.cohesion ?? 30,
    cohesionMax: opts?.cohesionMax ?? 30,
    raisedTick: 0,
    maintenanceCost: 2,
    thresholdsFired: opts?.thresholdsFired ?? [],
    ...opts,
  };

  graph.addNode({
    id,
    type: 'actor',
    name: `Army ${id}`,
    properties: { actorType: 'group', armyState },
  });

  graph.addEdge({
    id: `e_loc_${id}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function addLocation(
  graph: WorldGraph,
  id: string,
  terrain: string = 'plains',
  hasRoad: boolean = false,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { terrain, locationSubtype: 'town' },
  });

  if (hasRoad) {
    // Add a road edge to simulate being on a road
    graph.addNode({
      id: `${id}_dest`,
      type: 'location',
      name: 'Road Destination',
      properties: { terrain: 'plains' },
    });
    graph.addEdge({
      id: `e_road_${id}`,
      source: id,
      target: `${id}_dest`,
      type: 'road',
      properties: { roadType: 'major' },
    });
  }
}

/**
 * `prosperity` is the faction's derived (0–1, summed-holdings/100) prosperity: the
 * faction gets one controlled holding at `prosperity × 100` (THR-1862 — faction
 * prosperity is derived on read from holdings, never stored on the faction node).
 */
function addFaction(graph: WorldGraph, id: string, armyId: string, prosperity: number = 0.5): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    id: `holding_${id}`,
    type: 'location',
    name: `Holding of ${id}`,
    properties: { locationSubtype: 'town', prosperity: prosperity * 100 },
  });
  graph.addEdge({
    id: `e_controls_${id}`,
    source: id,
    target: `holding_${id}`,
    type: 'controls',
    properties: {},
  });
  graph.addEdge({
    id: `e_member_${armyId}_${id}`,
    source: armyId,
    target: id,
    type: 'member_of',
    properties: { role: 'army', rank: 'army', joinedTick: 0 },
  });
}

function getArmyState(graph: WorldGraph, armyId: string): ArmyState {
  return graph.getNode(armyId)!.properties.armyState as ArmyState;
}

/**
 * Add a lair node located at the given hex location.
 * subtype controls whether it's active ('lair') or cleared ('cleared_lair').
 */
function addLair(
  graph: WorldGraph,
  lairId: string,
  locationId: string,
  subtype: 'lair' | 'cleared_lair' = 'lair',
): void {
  graph.addNode({
    id: lairId,
    type: 'location',
    name: `Lair ${lairId}`,
    properties: { locationSubtype: subtype },
  });
  graph.addEdge({
    id: `e_lair_${lairId}`,
    source: lairId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

// ─── Movement Cost Tests ───────────────────────────────────────────────────

describe('getArmyTerrainCost', () => {
  it('returns correct cost for known terrain types', () => {
    expect(getArmyTerrainCost('plains')).toBe(1.5);
    expect(getArmyTerrainCost('mountains')).toBe(4.0);
    expect(getArmyTerrainCost('forest')).toBe(2.5);
    expect(getArmyTerrainCost('water')).toBe(Infinity);
  });

  it('returns fallback cost for unknown terrain', () => {
    expect(getArmyTerrainCost('lava_fields')).toBe(1.5);
  });
});

describe('getArmyMovementCost', () => {
  it('applies road discount', () => {
    const withoutRoad = getArmyMovementCost('plains', false);
    const withRoad = getArmyMovementCost('plains', true);
    expect(withRoad).toBe(withoutRoad * (1 - ARMY_ROAD_DISCOUNT));
  });

  it('returns Infinity for impassable terrain regardless of road', () => {
    expect(getArmyMovementCost('water', true)).toBe(Infinity);
    expect(getArmyMovementCost('water', false)).toBe(Infinity);
  });
});

// ─── Attrition Phase Tests ─────────────────────────────────────────────────

describe('phaseArmyAttrition', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('applies base attrition each tick', () => {
    addLocation(graph, 'loc1', 'plains', true); // on road
    addArmy(graph, 'army1', 'loc1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5); // well-funded

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // base (0.5) + terrain (1.5 * 0.3 = 0.45) + offRoad (0 — on road) + underfunded (0)
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR);
    expect(state.cohesion).toBeCloseTo(expected, 5);
  });

  it('adds terrain attrition for difficult terrain', () => {
    addLocation(graph, 'loc1', 'mountains', true);
    addArmy(graph, 'army1', 'loc1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // mountains cost = 4.0, terrain attrition = 4.0 * 0.3 = 1.2
    const expected = 30 - (ARMY_BASE_ATTRITION + 4.0 * TERRAIN_ATTRITION_FACTOR);
    expect(state.cohesion).toBeCloseTo(expected, 5);
  });

  it('adds off-road penalty when not on road', () => {
    addLocation(graph, 'loc1', 'plains', false); // no road
    addArmy(graph, 'army1', 'loc1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR + OFF_ROAD_ATTRITION_PENALTY);
    expect(state.cohesion).toBeCloseTo(expected, 5);
  });

  it('adds underfunded penalty when the faction purse has not paid the army (THR-1931)', () => {
    addLocation(graph, 'loc1', 'plains', true);
    // Last paid on tick 0; at tick 30 that is more than one pay day ago.
    addArmy(graph, 'army1', 'loc1', { cohesion: 30, cohesionMax: 30, paidThroughTick: 0 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(30, graph));

    const state = getArmyState(graph, 'army1');
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR + UNDERFUNDED_ATTRITION_PENALTY);
    expect(state.cohesion).toBeCloseTo(expected, 5);
  });

  it('clamps cohesion to 0 (never negative)', () => {
    addLocation(graph, 'loc1', 'mountains', false);
    addArmy(graph, 'army1', 'loc1', { cohesion: 1, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.1);

    phaseArmyAttrition(makeState(1, graph));

    // Army should be disbanded (removed from graph)
    expect(graph.getNode('army1')).toBeUndefined();
  });

  it('fires threshold encounter at 70% crossing', () => {
    addLocation(graph, 'loc1', 'plains', true);
    // Set cohesion just above 70% threshold: 30 * 0.70 = 21
    // Attrition = 0.5 + 0.45 = 0.95, so start at 21.5 → crosses to ~20.55
    addArmy(graph, 'army1', 'loc1', { cohesion: 21.5, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    expect(state.thresholdsFired).toContain('strained');
  });

  it('fires each threshold only once', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', {
      cohesion: 21.5,
      cohesionMax: 30,
      thresholdsFired: ['strained'], // already fired
    });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // Should not have 'strained' duplicated
    expect(state.thresholdsFired.filter(t => t === 'strained')).toHaveLength(1);
  });

  it('disbands army at cohesion 0', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', { cohesion: 0.5, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    // Army should be removed
    expect(graph.getNode('army1')).toBeUndefined();
  });

  it('commander survives army disbandment', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', { cohesion: 0.5, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    // Add commander
    graph.addNode({
      id: 'commander1',
      type: 'actor',
      name: 'Commander',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'e_commanded_by_army1',
      source: 'army1',
      target: 'commander1',
      type: 'commanded_by',
      properties: {},
    });

    phaseArmyAttrition(makeState(1, graph));

    // Army removed but commander still exists
    expect(graph.getNode('army1')).toBeUndefined();
    expect(graph.getNode('commander1')).toBeDefined();
  });

  it('handles army with no location gracefully', () => {
    // Army without located_at edge
    graph.addNode({
      id: 'army_orphan',
      type: 'actor',
      name: 'Orphan Army',
      properties: {
        actorType: 'group',
        armyState: {
          size: 'warband',
          headcount: 100,
          objective: null,
          cohesion: 30,
          cohesionMax: 30,
          raisedTick: 0,
          maintenanceCost: 2,
          thresholdsFired: [],
        },
      },
    });

    // Should not crash
    expect(() => phaseArmyAttrition(makeState(1, graph))).not.toThrow();
    // Army still exists (just uses plains default)
    expect(graph.getNode('army_orphan')).toBeDefined();
  });
});

// ─── Monster Territory Attrition Tests ────────────────────────────────────────

describe('monster territory attrition', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('army at hex with no lair receives standard attrition only (no monster bonus)', () => {
    addLocation(graph, 'hex1', 'plains', true); // on road, no lair
    addArmy(graph, 'army1', 'hex1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // Standard: base + terrain (no off-road, no underfunded, no monster)
    const expectedStandard = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR);
    expect(state.cohesion).toBeCloseTo(expectedStandard, 5);
  });

  it('army at hex with active lair receives standard attrition + MONSTER_TERRITORY_ATTRITION bonus', () => {
    addLocation(graph, 'hex1', 'plains', true);
    addLair(graph, 'lair1', 'hex1', 'lair'); // active lair at same hex
    addArmy(graph, 'army1', 'hex1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // Should be MORE loss than standard (monster bonus applied)
    const expectedStandard = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR);
    const expectedWithMonster = expectedStandard - MONSTER_TERRITORY_ATTRITION;
    expect(state.cohesion).toBeCloseTo(expectedWithMonster, 5);
  });

  it('army at hex with cleared_lair receives NO monster attrition', () => {
    addLocation(graph, 'hex1', 'plains', true);
    addLair(graph, 'lair1', 'hex1', 'cleared_lair'); // cleared lair — no monster attrition
    addArmy(graph, 'army1', 'hex1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // Should match standard attrition only (no monster bonus)
    const expectedStandard = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR);
    expect(state.cohesion).toBeCloseTo(expectedStandard, 5);
  });

  it('monster attrition is additive (added to existing attrition, not replacing it)', () => {
    addLocation(graph, 'hex1', 'plains', false); // no road = off-road penalty
    addLair(graph, 'lair1', 'hex1', 'lair'); // active lair
    addArmy(graph, 'army1', 'hex1', { cohesion: 30, cohesionMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // All penalties stack: base + terrain + off-road + monster
    const expected = 30 - (
      ARMY_BASE_ATTRITION +
      1.5 * TERRAIN_ATTRITION_FACTOR +
      OFF_ROAD_ATTRITION_PENALTY +
      MONSTER_TERRITORY_ATTRITION
    );
    expect(state.cohesion).toBeCloseTo(expected, 5);
  });
});

// ─── THR-1973: a garrisoned army holds ──────────────────────────────────────

describe('garrison recovery (THR-1973)', () => {
  /** A faction holding `town`, its army standing in it, paid through `paidThroughTick`. */
  function garrisonWorld(cohesion: number, cohesionMax: number = 100): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({ id: 'town', type: 'location', name: 'Town', properties: { terrain: 'hills', locationSubtype: 'town', prosperity: 60 } });
    graph.addNode({ id: 'f1', type: 'actor', name: 'Realm', properties: { actorType: 'faction', factionClass: 'realm' } });
    graph.addEdge({ id: 'e_controls', source: 'f1', target: 'town', type: 'controls', properties: {} });
    addArmy(graph, 'army1', 'town', { size: 'host', cohesion, cohesionMax, paidThroughTick: 0 });
    graph.addEdge({ id: 'e_member', source: 'army1', target: 'f1', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });
    return graph;
  }

  it('a paid, supplied army at rest in its own town does not disband within 30 days', () => {
    const graph = garrisonWorld(100);
    for (let tick = 1; tick <= 30 * 12; tick++) {
      // Paid every day: the purse writes paidThroughTick on each pay day.
      if (tick % 12 === 0) {
        const n = graph.getNode('army1')!;
        n.properties.armyState = { ...(n.properties.armyState as ArmyState), paidThroughTick: tick };
      }
      phaseArmyAttrition(makeState(tick, graph));
    }
    const army = graph.getNode('army1');
    expect(army).toBeDefined();
    expect((army!.properties.armyState as ArmyState).cohesion).toBe(100);
  });

  it('a worn garrison heals toward cohesionMax and never past it', () => {
    const graph = garrisonWorld(40);
    phaseArmyAttrition(makeState(1, graph));
    expect(getArmyState(graph, 'army1').cohesion).toBeCloseTo(40 + ARMY_GARRISON_RECOVERY, 5);
    const full = garrisonWorld(100 - ARMY_GARRISON_RECOVERY / 2);
    phaseArmyAttrition(makeState(1, full));
    expect(getArmyState(full, 'army1').cohesion).toBe(100);
  });

  it('an unpaid garrison still wears down (the purse desertion path is kept)', () => {
    const graph = garrisonWorld(100);
    // Unpaid past one pay day.
    phaseArmyAttrition(makeState(100, graph));
    expect(getArmyState(graph, 'army1').cohesion).toBeLessThan(100);
  });

  it('a starving garrison still wears down', () => {
    const graph = garrisonWorld(100);
    const n = graph.getNode('army1')!;
    n.properties.armyState = { ...(n.properties.armyState as ArmyState), supply: 0, supplyMax: 100 };
    phaseArmyAttrition(makeState(1, graph));
    expect(getArmyState(graph, 'army1').cohesion).toBeLessThan(100);
  });

  it('an army in a town another faction holds pays attrition', () => {
    const graph = garrisonWorld(100);
    graph.addNode({ id: 'f2', type: 'actor', name: 'Other', properties: { actorType: 'faction' } });
    graph.removeEdge('e_controls');
    graph.addEdge({ id: 'e_controls2', source: 'f2', target: 'town', type: 'controls', properties: {} });
    expect(isGarrisoned(makeState(1, graph), 'army1', 'town', 'f1')).toBe(false);
    phaseArmyAttrition(makeState(1, graph));
    expect(getArmyState(graph, 'army1').cohesion).toBeLessThan(100);
  });
});
