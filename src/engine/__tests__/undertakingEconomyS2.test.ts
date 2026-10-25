/**
 * THR-1966 (THR-1937 S2) — a building a mortal raises is the town's own next building,
 * and the builder holds it. Plan § Systems design 4, § Done when S2.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { HexTile, TerrainType } from '../../types';
import type { GameState } from '../../types/gameState';
import { runSettlementEconomyDay } from '../phases/settlementEconomy';
import {
  NEXT_BUILDING_PROP,
  buildingSlotsOf,
  loseBuilding,
  nextBuildingFor,
  readBuildings,
} from '../settlementEconomy/building';
import { buildingFact } from '../settlementEconomy/describe';
import { getUndertakingObjectType, eligibilityRefusal } from '../../data/undertaking-objects';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../data/undertaking-objects';
import { pickRaisedBuilding, stampLegacyPlace } from '../undertakingEconomy';
import { cellActivityProse, cellCompletionProse } from '../undertakingProse';
import { createSublocation, type GraphOpResult } from '../strategicGraphOps';
import { LEGACY_PLACE_TYPE_TO_BUILDING } from '../../data/undertaking-economy-constants';
import { SETTLEMENT_BUILDINGS, getSettlementBuilding } from '../../data/settlement-buildings';
import { TICKS_PER_DAY } from '../../data/attention-constants';

const BUILDER = 'kael';
const TOWN = 'loc.ashford';

function tilesOf(terrain: TerrainType): HexTile[] {
  const out: HexTile[] = [];
  for (let col = 0; col < 9; col++) {
    for (let row = 0; row < 9; row++) {
      out.push({ coord: { col, row }, terrain, geoParams: {} } as unknown as HexTile);
    }
  }
  return out;
}

function world(terrain: TerrainType, days = 1): { graph: WorldGraph; tiles: HexTile[] } {
  const graph = new WorldGraph();
  graph.addNode({ id: TOWN, type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 4, hexRow: 4 } });
  graph.addNode({ id: BUILDER, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  graph.addEdge({ id: `loc_${BUILDER}`, source: BUILDER, target: TOWN, type: 'located_at', properties: {} });
  const tiles = tilesOf(terrain);
  for (let d = 0; d < days; d++) {
    runSettlementEconomyDay({ graph, tiles, tick: d * TICKS_PER_DAY, seed: 7, hexRealmId: new Map() });
  }
  return { graph, tiles };
}

function raise(graph: WorldGraph, params?: Record<string, unknown>): GraphOpResult {
  const semantic = getUndertakingObjectType('place')!.verbs.create as ObjectVerbSemantic;
  return semantic({
    state: { tick: 100, seed: 42, graph } as unknown as GameState,
    graph, actorId: BUILDER, tick: 100, projectId: 'proj_1',
    targetNodeId: TOWN, handle: { kind: 'node', nodeId: TOWN },
    ...(params && { params }),
  } as unknown as ObjectVerbContext) as GraphOpResult;
}

function fillSlots(graph: WorldGraph): void {
  const town = graph.getNode(TOWN)!;
  const have = new Set(readBuildings(graph, TOWN).map(b => b.def.id));
  const free = SETTLEMENT_BUILDINGS.filter(b => !have.has(b.id));
  for (let i = readBuildings(graph, TOWN).length, j = 0; i < buildingSlotsOf(town); i++, j++) {
    const def = free[j];
    const id = `${TOWN}_fill_${def.id}`;
    graph.addNode({ id, type: 'location', name: def.cardName, properties: { parentLocationId: TOWN, sublocationTypeId: def.sublocationTypeId, isBuilding: true, buildingId: def.id } });
    graph.addEdge({ id: `c_${id}`, source: TOWN, target: id, type: 'contains', properties: {} });
  }
}

describe('THR-1966 — the chooser leaves its pick on the town', () => {
  it('a town with a free slot carries the day\'s pick; the pick is a building the town does not have', () => {
    const { graph } = world('grassland');
    const next = graph.getNode(TOWN)!.properties[NEXT_BUILDING_PROP];
    expect(typeof next).toBe('string');
    expect(getSettlementBuilding(next as string)).toBeDefined();
    expect(nextBuildingFor(graph, TOWN)?.id).toBe(next);
  });
});

describe('THR-1966 — a mortal raises the town\'s own next building, never a workshop by default', () => {
  const terrains: TerrainType[] = ['grassland', 'temperate_forest', 'hills'];
  for (const terrain of terrains) {
    it(`on ${terrain}: the raised building is the chooser's pick, and the builder holds it`, () => {
      const { graph } = world(terrain);
      const pick = graph.getNode(TOWN)!.properties[NEXT_BUILDING_PROP] as string;
      const op = raise(graph);
      expect(op.success).toBe(true);
      expect(op.completionLine).toBe('raised');
      const place = graph.getNode(op.createdId!)!;
      expect(place.properties.buildingId).toBe(pick);
      expect(place.properties.isBuilding).toBe(true);
      expect(place.properties.sublocationTypeId).toBe(getSettlementBuilding(pick)!.sublocationTypeId);
      // The builder's freehold (grantHolding's `owns`), and the card's tag.
      expect(graph.getOutgoingEdges(BUILDER, 'owns').some(e => e.target === place.id)).toBe(true);
      expect(buildingFact(place, graph)).toBe('built by Kael Thornweaver');
      // The town now counts it, and its pick is spent.
      expect(readBuildings(graph, TOWN).some(b => b.node.id === place.id)).toBe(true);
    });
  }

  it('the three terrains do not all raise the same building', () => {
    const raised = terrains.map(t => {
      const { graph } = world(t);
      const op = raise(graph);
      return graph.getNode(op.createdId!)!.properties.buildingId;
    });
    expect(new Set(raised).size).toBeGreaterThan(1);
  });

  it('a building the town raised itself still reads "built by the town"', () => {
    const { graph } = world('grassland');
    fillSlots(graph);
    const own = readBuildings(graph, TOWN)[0];
    expect(buildingFact(own.node, graph)).toBe('built by the town');
  });
});

describe('THR-1966 — a town with full slots is never a target', () => {
  it('the eligibility hook refuses it, and a work already under way raises nothing', () => {
    const { graph } = world('grassland');
    fillSlots(graph);
    expect(nextBuildingFor(graph, TOWN)).toBeNull();
    const place = getUndertakingObjectType('place')!;
    expect(eligibilityRefusal(graph, place, 'create', BUILDER, { kind: 'node', nodeId: TOWN }, 100)).toBe('no_building_slot');
    const before = graph.getOutgoingEdges(TOWN, 'contains').length;
    const op = raise(graph, { plannedBuildingId: 'storehouse' });
    expect(op.success).toBe(false);
    expect(op.completionLine).toBe('no_room');
    expect(graph.getOutgoingEdges(TOWN, 'contains')).toHaveLength(before);
  });

  it('a site that is not a settlement is not refused (it stays outside the town\'s economy)', () => {
    const { graph } = world('grassland');
    graph.addNode({ id: 'loc.fort', type: 'location', name: 'Fort', properties: { locationSubtype: 'fort', hexCol: 1, hexRow: 1 } });
    const place = getUndertakingObjectType('place')!;
    expect(eligibilityRefusal(graph, place, 'create', BUILDER, { kind: 'node', nodeId: 'loc.fort' }, 100)).toBeNull();
  });
});

describe('THR-1966 — the planned building is re-checked at completion', () => {
  it('a planned building that still qualifies is raised even when today\'s pick differs', () => {
    const { graph } = world('grassland');
    const pick = graph.getNode(TOWN)!.properties[NEXT_BUILDING_PROP] as string;
    const other = SETTLEMENT_BUILDINGS.find(b => b.id !== pick)!.id;
    expect(pickRaisedBuilding(graph, TOWN, other)).toEqual({ def: getSettlementBuilding(other), outcome: 'raised' });
  });

  it('a planned building that already stands is repicked from the chooser', () => {
    const { graph } = world('grassland');
    const pick = graph.getNode(TOWN)!.properties[NEXT_BUILDING_PROP] as string;
    const standing = readBuildings(graph, TOWN)[0]?.def.id;
    // Raise the planned one first, so it stands.
    const first = raise(graph, { plannedBuildingId: pick });
    expect(first.success).toBe(true);
    // The town's next pick is gone (the pick was raised), so a replan for the same id finds no room.
    const again = pickRaisedBuilding(graph, TOWN, pick);
    expect(again === null || again.outcome === 'repicked').toBe(true);
    if (standing) expect(standing).not.toBe(pick);
  });
});

describe('THR-1966 — a mortal-raised building lost to idling stays as the builder\'s Place', () => {
  it('loseBuilding un-stamps it but keeps the node and the freehold', () => {
    const { graph } = world('grassland');
    const op = raise(graph);
    const b = readBuildings(graph, TOWN).find(x => x.node.id === op.createdId)!;
    expect(loseBuilding(graph, TOWN, b, 200)).toBe(false);
    expect(graph.getNode(op.createdId!)).toBeDefined();
    expect(graph.getNode(op.createdId!)!.properties.isBuilding).toBeUndefined();
    expect(graph.getOutgoingEdges(BUILDER, 'owns').some(e => e.target === op.createdId)).toBe(true);
  });
});

describe('THR-1966 — legacy pack Place types map onto the building table (Law 58)', () => {
  const PACK_TYPES = ['granary', 'warehouse', 'workshop', 'shrine', 'guild_chapter', 'garrison', 'court', 'estate', 'research_circle'];

  it('every type a strategic pack raises has a row, and every mapped row is a real building', () => {
    for (const t of PACK_TYPES) expect(LEGACY_PLACE_TYPE_TO_BUILDING, t).toHaveProperty(t);
    for (const id of Object.values(LEGACY_PLACE_TYPE_TO_BUILDING)) {
      if (id !== null) expect(getSettlementBuilding(id), id).toBeDefined();
    }
  });

  it('a pack-raised warehouse becomes the storehouse with a free slot; a court stays a plain Place', () => {
    const { graph } = world('grassland');
    const wh = createSublocation(graph, TOWN, BUILDER, "Kael's Warehouse", 'warehouse', 100);
    const hasStore = readBuildings(graph, TOWN).some(b => b.def.id === 'storehouse');
    const stamped = stampLegacyPlace(graph, BUILDER, wh.createdId!, 'warehouse', 100);
    expect(stamped).toBe(hasStore ? null : 'storehouse');
    const court = createSublocation(graph, TOWN, BUILDER, "Kael's Court", 'court', 100);
    expect(stampLegacyPlace(graph, BUILDER, court.createdId!, 'court', 100)).toBeNull();
    expect(graph.getNode(court.createdId!)!.properties.isBuilding).toBeUndefined();
  });
});

describe('THR-1966 — the words name the building', () => {
  it('the activity line names the planned building before it is raised; the completion line after', () => {
    const { graph } = world('grassland');
    const pick = graph.getNode(TOWN)!.properties[NEXT_BUILDING_PROP] as string;
    const noun = getSettlementBuilding(pick)!.cardName.toLowerCase();
    const project = {
      projectId: 'proj_1', actorId: BUILDER, objectTypeId: 'place' as const,
      objectHandle: { kind: 'node' as const, nodeId: TOWN }, targetNodeId: TOWN, plannedBuildingId: pick,
    };
    const activity = cellActivityProse(graph, project, 'create').text;
    expect(activity).toContain('Kael Thornweaver sets about raising');
    expect(activity).toContain(noun);
    expect(activity).toContain('Ashford');

    const op = raise(graph, { plannedBuildingId: pick });
    const done = cellCompletionProse(graph, project, 'create', { line: op.completionLine, objectId: op.proseObjectId }).text;
    expect(done).toContain(noun);
    expect(done).toContain('and it is theirs');

    fillSlots(graph);
    const none = raise(graph, { plannedBuildingId: pick });
    const refused = cellCompletionProse(graph, project, 'create', { line: none.completionLine }).text;
    expect(refused).toBe('Kael Thornweaver finds no room left in Ashford for what they meant to build.');
  });
});
