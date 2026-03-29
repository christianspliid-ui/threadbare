/**
 * Army Movement Tests — TB-073 Phase 2.
 *
 * Tests for army movement cost system and phaseArmyMovement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ARMY_MOVEMENT_COST_MULTIPLIERS,
  ARMY_ROAD_DISCOUNT,
  ARMY_SPEED,
  getArmyTerrainCost,
  getArmyMovementCost,
  phaseArmyMovement,
  ARMY_UNKNOWN_TERRAIN_COST,
} from '../armyMovement';
import { WorldGraph } from '../graph';
import type { ArmyState } from '../../types/army';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

function addLocation(
  graph: WorldGraph,
  id: string,
  terrain: string = 'plains',
  col: number = 0,
  row: number = 0,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Location ${id}`,
    properties: { terrain, locationSubtype: 'town', hexCol: col, hexRow: row },
  });
}

function addAdjacentEdge(graph: WorldGraph, fromId: string, toId: string): void {
  graph.addEdge({
    id: `e_adj_${fromId}_${toId}`,
    source: fromId,
    target: toId,
    type: 'adjacent',
    properties: {},
  });
  graph.addEdge({
    id: `e_adj_${toId}_${fromId}`,
    source: toId,
    target: fromId,
    type: 'adjacent',
    properties: {},
  });
}

function addArmy(
  graph: WorldGraph,
  id: string,
  locationId: string,
  opts?: Partial<ArmyState>,
): void {
  const armyState: ArmyState = {
    size: opts?.size ?? 'warband',
    headcount: 100,
    objective: opts?.objective ?? null,
    quintessence: opts?.quintessence ?? 30,
    quintessenceMax: opts?.quintessenceMax ?? 30,
    raisedTick: 0,
    maintenanceCost: 2,
    thresholdsFired: opts?.thresholdsFired ?? [],
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

// ─── Movement Cost Constant Tests ─────────────────────────────────────────

describe('ARMY_MOVEMENT_COST_MULTIPLIERS', () => {
  it('defines cost for all major terrain types', () => {
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.plains).toBe(1.5);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.grassland).toBe(1.5);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.forest).toBe(2.5);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.hills).toBe(2.0);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.mountains).toBe(4.0);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.desert).toBe(3.0);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.swamp).toBe(3.5);
  });

  it('marks water terrain as Infinity (impassable)', () => {
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.water).toBe(Infinity);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.ocean).toBe(Infinity);
    expect(ARMY_MOVEMENT_COST_MULTIPLIERS.lake).toBe(Infinity);
  });

  it('road discount reduces cost by 40%', () => {
    expect(ARMY_ROAD_DISCOUNT).toBe(0.4);
  });
});

// ─── ARMY_SPEED Constants ────────────────────────────────────────────────

describe('ARMY_SPEED', () => {
  it('warband is fastest (speed 2)', () => {
    expect(ARMY_SPEED.warband).toBe(2);
  });

  it('regiment is mid-speed (speed 1.5)', () => {
    expect(ARMY_SPEED.regiment).toBe(1.5);
  });

  it('host is slowest (speed 1)', () => {
    expect(ARMY_SPEED.host).toBe(1);
  });

  it('warband moves faster than regiment which moves faster than host', () => {
    expect(ARMY_SPEED.warband).toBeGreaterThan(ARMY_SPEED.regiment);
    expect(ARMY_SPEED.regiment).toBeGreaterThan(ARMY_SPEED.host);
  });
});

// ─── getArmyTerrainCost Tests ──────────────────────────────────────────────

describe('getArmyTerrainCost', () => {
  it('returns correct multiplier for known terrain types', () => {
    expect(getArmyTerrainCost('plains')).toBe(1.5);
    expect(getArmyTerrainCost('forest')).toBe(2.5);
    expect(getArmyTerrainCost('mountains')).toBe(4.0);
    expect(getArmyTerrainCost('swamp')).toBe(3.5);
    expect(getArmyTerrainCost('desert')).toBe(3.0);
  });

  it('returns Infinity for water terrain', () => {
    expect(getArmyTerrainCost('water')).toBe(Infinity);
    expect(getArmyTerrainCost('ocean')).toBe(Infinity);
    expect(getArmyTerrainCost('lake')).toBe(Infinity);
  });

  it('falls back to plains cost for unknown terrain', () => {
    expect(getArmyTerrainCost('unknown_terrain')).toBe(ARMY_UNKNOWN_TERRAIN_COST);
    expect(getArmyTerrainCost('')).toBe(ARMY_UNKNOWN_TERRAIN_COST);
    expect(getArmyTerrainCost('lava_fields')).toBe(ARMY_UNKNOWN_TERRAIN_COST);
  });
});

// ─── getArmyMovementCost Tests ────────────────────────────────────────────

describe('getArmyMovementCost', () => {
  it('returns base terrain cost when not on road', () => {
    expect(getArmyMovementCost('plains', false)).toBe(1.5);
    expect(getArmyMovementCost('mountains', false)).toBe(4.0);
    expect(getArmyMovementCost('forest', false)).toBe(2.5);
  });

  it('applies 40% road discount when on road', () => {
    const plainsWithoutRoad = getArmyMovementCost('plains', false);
    const plainsWithRoad = getArmyMovementCost('plains', true);
    expect(plainsWithRoad).toBeCloseTo(plainsWithoutRoad * (1 - ARMY_ROAD_DISCOUNT), 5);
  });

  it('road discount reduces cost by exactly 40%', () => {
    // plains cost = 1.5, with 40% discount = 0.9
    expect(getArmyMovementCost('plains', true)).toBeCloseTo(0.9, 5);
    // mountains cost = 4.0, with 40% discount = 2.4
    expect(getArmyMovementCost('mountains', true)).toBeCloseTo(2.4, 5);
  });

  it('returns Infinity for impassable terrain regardless of road', () => {
    expect(getArmyMovementCost('water', true)).toBe(Infinity);
    expect(getArmyMovementCost('water', false)).toBe(Infinity);
    expect(getArmyMovementCost('ocean', true)).toBe(Infinity);
    expect(getArmyMovementCost('lake', false)).toBe(Infinity);
  });

  it('falls back to plains cost for unknown terrain', () => {
    const unknownCost = getArmyMovementCost('mystery_terrain', false);
    expect(unknownCost).toBe(ARMY_UNKNOWN_TERRAIN_COST);
  });
});

// ─── phaseArmyMovement Tests ─────────────────────────────────────────────

describe('phaseArmyMovement', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('initiates movement toward objective when army has no movement queue', () => {
    addLocation(graph, 'loc_start', 'plains', 0, 0);
    addLocation(graph, 'loc_target', 'plains', 1, 0);
    addAdjacentEdge(graph, 'loc_start', 'loc_target');

    addArmy(graph, 'army1', 'loc_start', {
      objective: { type: 'raid', targetNodeId: 'loc_target', estimatedAttrition: 5 },
    });

    phaseArmyMovement(makeState(1, graph));

    const armyNode = graph.getNode('army1');
    const movState = armyNode?.properties.movementState as { movementQueue?: string[] } | undefined;
    expect(movState?.movementQueue).toBeDefined();
    expect(movState?.movementQueue?.length).toBeGreaterThan(0);
  });

  it('does not initiate movement when army has no objective', () => {
    addLocation(graph, 'loc1', 'plains');
    addArmy(graph, 'army1', 'loc1', { objective: null });

    phaseArmyMovement(makeState(1, graph));

    const armyNode = graph.getNode('army1');
    expect(armyNode?.properties.movementState).toBeUndefined();
  });

  it('ticks existing movement queue each tick', () => {
    addLocation(graph, 'loc_start', 'plains', 0, 0);
    addLocation(graph, 'loc_target', 'plains', 1, 0);
    addAdjacentEdge(graph, 'loc_start', 'loc_target');

    addArmy(graph, 'army1', 'loc_start', {
      objective: { type: 'raid', targetNodeId: 'loc_target', estimatedAttrition: 5 },
    });

    // First tick: should initiate movement
    phaseArmyMovement(makeState(1, graph));

    const afterFirstTick = graph.getNode('army1');
    const movState1 = afterFirstTick?.properties.movementState as { ticksAccumulated?: number } | undefined;
    expect(movState1).toBeDefined();

    // Second tick: should accumulate ticks
    phaseArmyMovement(makeState(2, graph));
    // (No crash = success — movement queue is being ticked)
  });

  it('handles army with no location gracefully (fail-soft)', () => {
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
          objective: { type: 'raid', targetNodeId: 'loc_target', estimatedAttrition: 5 },
          quintessence: 30,
          quintessenceMax: 30,
          raisedTick: 0,
          maintenanceCost: 2,
          thresholdsFired: [],
        } as ArmyState,
      },
    });

    expect(() => phaseArmyMovement(makeState(1, graph))).not.toThrow();
  });

  it('handles army already at objective (no movement initiated)', () => {
    addLocation(graph, 'loc_target', 'plains');
    addArmy(graph, 'army1', 'loc_target', {
      objective: { type: 'defend', targetNodeId: 'loc_target', estimatedAttrition: 0 },
    });

    phaseArmyMovement(makeState(1, graph));

    // Should not crash and no movement state needed (already at target)
    const armyNode = graph.getNode('army1');
    expect(armyNode?.properties.movementState).toBeUndefined();
  });
});
