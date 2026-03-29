import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseArmyAttrition,
  ARMY_BASE_ATTRITION,
  TERRAIN_ATTRITION_FACTOR,
  OFF_ROAD_ATTRITION_PENALTY,
  UNDERFUNDED_ATTRITION_PENALTY,
  QUINTESSENCE_THRESHOLDS,
} from '../armyAttrition';
import { getArmyTerrainCost, getArmyMovementCost, ARMY_ROAD_DISCOUNT } from '../armyMovement';
import type { ArmyState } from '../../types/army';
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
    quintessence: opts?.quintessence ?? 30,
    quintessenceMax: opts?.quintessenceMax ?? 30,
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

function addFaction(graph: WorldGraph, id: string, armyId: string, prosperity: number = 0.5): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: { actorType: 'faction', prosperity },
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
    addArmy(graph, 'army1', 'loc1', { quintessence: 30, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5); // well-funded

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // base (0.5) + terrain (1.5 * 0.3 = 0.45) + offRoad (0 — on road) + underfunded (0)
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR);
    expect(state.quintessence).toBeCloseTo(expected, 5);
  });

  it('adds terrain attrition for difficult terrain', () => {
    addLocation(graph, 'loc1', 'mountains', true);
    addArmy(graph, 'army1', 'loc1', { quintessence: 30, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // mountains cost = 4.0, terrain attrition = 4.0 * 0.3 = 1.2
    const expected = 30 - (ARMY_BASE_ATTRITION + 4.0 * TERRAIN_ATTRITION_FACTOR);
    expect(state.quintessence).toBeCloseTo(expected, 5);
  });

  it('adds off-road penalty when not on road', () => {
    addLocation(graph, 'loc1', 'plains', false); // no road
    addArmy(graph, 'army1', 'loc1', { quintessence: 30, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR + OFF_ROAD_ATTRITION_PENALTY);
    expect(state.quintessence).toBeCloseTo(expected, 5);
  });

  it('adds underfunded penalty when faction prosperity too low', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', { quintessence: 30, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.1); // low prosperity = underfunded

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    const expected = 30 - (ARMY_BASE_ATTRITION + 1.5 * TERRAIN_ATTRITION_FACTOR + UNDERFUNDED_ATTRITION_PENALTY);
    expect(state.quintessence).toBeCloseTo(expected, 5);
  });

  it('clamps quintessence to 0 (never negative)', () => {
    addLocation(graph, 'loc1', 'mountains', false);
    addArmy(graph, 'army1', 'loc1', { quintessence: 1, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.1);

    phaseArmyAttrition(makeState(1, graph));

    // Army should be disbanded (removed from graph)
    expect(graph.getNode('army1')).toBeUndefined();
  });

  it('fires threshold encounter at 70% crossing', () => {
    addLocation(graph, 'loc1', 'plains', true);
    // Set quintessence just above 70% threshold: 30 * 0.70 = 21
    // Attrition = 0.5 + 0.45 = 0.95, so start at 21.5 → crosses to ~20.55
    addArmy(graph, 'army1', 'loc1', { quintessence: 21.5, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    expect(state.thresholdsFired).toContain('strained');
  });

  it('fires each threshold only once', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', {
      quintessence: 21.5,
      quintessenceMax: 30,
      thresholdsFired: ['strained'], // already fired
    });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    const state = getArmyState(graph, 'army1');
    // Should not have 'strained' duplicated
    expect(state.thresholdsFired.filter(t => t === 'strained')).toHaveLength(1);
  });

  it('disbands army at quintessence 0', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', { quintessence: 0.5, quintessenceMax: 30 });
    addFaction(graph, 'f1', 'army1', 0.5);

    phaseArmyAttrition(makeState(1, graph));

    // Army should be removed
    expect(graph.getNode('army1')).toBeUndefined();
  });

  it('commander survives army disbandment', () => {
    addLocation(graph, 'loc1', 'plains', true);
    addArmy(graph, 'army1', 'loc1', { quintessence: 0.5, quintessenceMax: 30 });
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
          quintessence: 30,
          quintessenceMax: 30,
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
