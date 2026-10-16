// src/engine/__tests__/foundedPlaceCulture.test.ts
//
// THR-1839 — places founded during play take their people. A hamlet founded at tick 200
// gets the nearest heartland's culture as a fringe by the same draw-free rule the worldgen
// pass applies, and a worked mine (`mining`) is a fringe subtype.
//
// Runs on a generated world (small preset), never a fixture: the heartland is whatever
// worldgen wrote, and the founded hamlet is minted by the real runtime writer.

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { createLocation } from '../strategicGraphOps';
import { runTick } from '../orchestrator';
import {
  assignFringeCultureToFoundedPlaces,
  collectHeartlandPlaces,
  pickNearestHeartland,
} from '../cultureGenerator';
import { getLocationNodes } from '../sublocationShape';
import { selectWorldScenarioCensus } from '../worldScenarioCensus';
import {
  CULTURE_FRINGE_STRENGTH,
  CULTURE_FRINGE_SUBTYPES,
  DEFAULT_WORLD_SCENARIO,
  WORLD_SCENARIO_TODAY,
  type WorldScenario,
} from '../../data/world-scenario';
import type { WorldGraph } from '../graph';
import type { HexTile } from '../../types';

function buildSmallWorld(scenario?: Partial<WorldScenario>) {
  _resetNpcCounter();
  return initializeGameState(
    generateArchetypes(4, 42)[0],
    'T',
    createBalancedCosmology(),
    42,
    MAP_SIZE_PRESETS.small.cols,
    MAP_SIZE_PRESETS.small.rows,
    undefined,
    scenario,
  ).state;
}

/**
 * A hex holding no place-tier Location, within `maxDist` of a heartland and outside every
 * living province (THR-1849: a province hex founds a heartland, not a fringe) —
 * deterministic scan order.
 */
function emptyHexNearHeartland(graph: WorldGraph, maxDist: number, tiles: readonly HexTile[]): { col: number; row: number } {
  const taken = new Set(getLocationNodes(graph).map(n => `${n.properties.hexCol},${n.properties.hexRow}`));
  for (const t of tiles) if (t.provinceCultureId) taken.add(`${t.coord.col},${t.coord.row}`);
  const heartland = collectHeartlandPlaces(graph);
  for (const h of heartland) {
    for (let dc = -maxDist; dc <= maxDist; dc++) {
      for (let dr = -maxDist; dr <= maxDist; dr++) {
        const hex = { col: h.col + dc, row: h.row + dr };
        if (hex.col < 0 || hex.row < 0) continue;
        if (taken.has(`${hex.col},${hex.row}`)) continue;
        const best = pickNearestHeartland(hex, heartland);
        if (best && best.dist >= 1 && best.dist <= maxDist) return hex;
      }
    }
  }
  throw new Error('no empty hex near a heartland');
}

function cultureEdges(graph: WorldGraph, id: string) {
  return graph.getOutgoingEdges(id, 'belongs_to').filter(e => e.properties.cultureLayer !== undefined);
}

describe('places founded during play take their people (THR-1839)', () => {
  it('a hamlet founded during play takes the nearest heartland culture as a fringe', () => {
    const state = buildSmallWorld();
    const g = state.graph;
    const hex = emptyHexNearHeartland(g, 3, state.tiles);
    const expected = pickNearestHeartland(hex, collectHeartlandPlaces(g))!;
    const r = createLocation(g, hex, 'founder', 'Newfold', 'hamlet', 200);
    expect(r.success).toBe(true);
    const id = r.createdId!;
    expect(cultureEdges(g, id)).toHaveLength(0);

    const linked = assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes);
    expect(linked).toEqual([{ locationId: id, cultureId: expected.cultureId, dist: expected.dist, kind: 'fringe' }]);

    const edges = cultureEdges(g, id);
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(expected.cultureId);
    expect(edges[0].properties.cultureLayer).toBe('current');
    expect(edges[0].properties.fringe).toBe(true);
    expect(edges[0].properties.culturalStrength).toBe(CULTURE_FRINGE_STRENGTH);
    expect(selectWorldScenarioCensus(g).fringeOnNonSettlements).toBe(0);

    // Idempotent: a second pass writes nothing.
    expect(assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes)).toEqual([]);
  });

  it('runs inside the tick: a hamlet founded mid-play carries a culture after the next tick', () => {
    let state = buildSmallWorld();
    const hex = emptyHexNearHeartland(state.graph, 3, state.tiles);
    const r = createLocation(state.graph, hex, 'founder', 'Newfold', 'hamlet', state.tick);
    const id = r.createdId!;
    state = runTick(state);
    expect(cultureEdges(state.graph, id).some(e => e.properties.fringe === true)).toBe(true);
  });

  it('a worked mine is a fringe subtype; unworked deposits are not', () => {
    expect(CULTURE_FRINGE_SUBTYPES.has('mining')).toBe(true);
    for (const deposit of ['gem_deposit', 'iron_seep', 'fossil_bed', 'pearl_shoal']) {
      expect(CULTURE_FRINGE_SUBTYPES.has(deposit)).toBe(false);
    }
    const state = buildSmallWorld();
    const g = state.graph;
    const hex = emptyHexNearHeartland(g, 3, state.tiles);
    const id = createLocation(g, hex, 'founder', 'Deepcut', 'mining', 200).createdId!;
    assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes);
    expect(cultureEdges(g, id)).toHaveLength(1);
  });

  it('leaves the god\'s starting shrine and non-settlements cultureless', () => {
    const state = buildSmallWorld();
    const g = state.graph;
    const hex = emptyHexNearHeartland(g, 3, state.tiles);
    const lair = createLocation(g, hex, 'founder', 'Den', 'lair', 200).createdId!;
    const before = g.getNode('loc.start') ? cultureEdges(g, 'loc.start').length : 0;
    assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes);
    expect(cultureEdges(g, lair)).toHaveLength(0);
    if (g.getNode('loc.start')) expect(cultureEdges(g, 'loc.start')).toHaveLength(before);
  });

  it('does nothing when the scenario keeps the fringe off (today\'s world)', () => {
    const state = buildSmallWorld(WORLD_SCENARIO_TODAY);
    const g = state.graph;
    const hex = emptyHexNearHeartland(g, 3, state.tiles);
    const id = createLocation(g, hex, 'founder', 'Newfold', 'hamlet', 200).createdId!;
    expect(assignFringeCultureToFoundedPlaces(g, WORLD_SCENARIO_TODAY.cultureFringeMaxHexes)).toEqual([]);
    expect(cultureEdges(g, id)).toHaveLength(0);
  });
});

/** An empty hex inside a living culture's province — deterministic scan order. */
function emptyProvinceHex(graph: WorldGraph, tiles: readonly HexTile[]): { col: number; row: number; cultureId: string } {
  const taken = new Set(getLocationNodes(graph).map(n => `${n.properties.hexCol},${n.properties.hexRow}`));
  for (const t of tiles) {
    if (!t.provinceCultureId || taken.has(`${t.coord.col},${t.coord.row}`)) continue;
    return { col: t.coord.col, row: t.coord.row, cultureId: t.provinceCultureId };
  }
  throw new Error('no empty province hex');
}

describe('a place founded inside a people\'s own lands takes their heartland (THR-1849)', () => {
  it('worldgen stamps each living province hex with its culture, matching the seeded heartland', () => {
    const state = buildSmallWorld();
    const g = state.graph;
    const stamped = state.tiles.filter(t => t.provinceCultureId);
    expect(stamped.length).toBeGreaterThan(0);
    const byHex = new Map(stamped.map(t => [`${t.coord.col},${t.coord.row}`, t.provinceCultureId]));
    // Every seeded heartland place sits on a hex stamped with its own culture.
    for (const h of collectHeartlandPlaces(g)) {
      expect(byHex.get(`${h.col},${h.row}`)).toBe(h.cultureId);
    }
    // Every stamp names a registered culture.
    for (const t of stamped) expect(g.getNode(t.provinceCultureId!)?.properties.actorType).toBe('culture');
  });

  it('a hamlet founded on a province hex takes that culture as a heartland — both layers, full strength', () => {
    const state = buildSmallWorld();
    const g = state.graph;
    const hex = emptyProvinceHex(g, state.tiles);
    const id = createLocation(g, hex, 'founder', 'Hearthold', 'hamlet', 200).createdId!;

    const linked = assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes, state.tiles);
    expect(linked).toEqual([{ locationId: id, cultureId: hex.cultureId, dist: 0, kind: 'heartland' }]);

    const edges = cultureEdges(g, id);
    expect(edges.map(e => e.properties.cultureLayer).sort()).toEqual(['current', 'historical']);
    for (const e of edges) {
      expect(e.target).toBe(hex.cultureId);
      expect(e.properties.fringe).toBeUndefined();
      expect(e.properties.culturalStrength).toBe(1.0);
    }
    // The heartland readers now count it.
    expect(collectHeartlandPlaces(g).some(h => h.id === id && h.cultureId === hex.cultureId)).toBe(true);
    // Idempotent.
    expect(assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes, state.tiles)).toEqual([]);
  });

  it('outside every province the fringe rule still applies with the stamp in hand', () => {
    const state = buildSmallWorld();
    const g = state.graph;
    const hex = emptyHexNearHeartland(g, 3, state.tiles);
    const id = createLocation(g, hex, 'founder', 'Newfold', 'hamlet', 200).createdId!;
    const linked = assignFringeCultureToFoundedPlaces(g, DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes, state.tiles);
    expect(linked).toHaveLength(1);
    expect(linked[0].kind).toBe('fringe');
    expect(cultureEdges(g, id)[0].properties.fringe).toBe(true);
  });

  it('takes the heartland even when the scenario keeps the fringe off, as worldgen does', () => {
    const state = buildSmallWorld(WORLD_SCENARIO_TODAY);
    const g = state.graph;
    const hex = emptyProvinceHex(g, state.tiles);
    const id = createLocation(g, hex, 'founder', 'Hearthold', 'hamlet', 200).createdId!;
    const linked = assignFringeCultureToFoundedPlaces(g, WORLD_SCENARIO_TODAY.cultureFringeMaxHexes, state.tiles);
    expect(linked.map(l => l.kind)).toEqual(['heartland']);
    expect(cultureEdges(g, id)).toHaveLength(2);
  });

  it('runs inside the tick: a hamlet founded mid-play in a province carries its heartland after the next tick', () => {
    let state = buildSmallWorld();
    const hex = emptyProvinceHex(state.graph, state.tiles);
    const id = createLocation(state.graph, hex, 'founder', 'Hearthold', 'hamlet', state.tick).createdId!;
    state = runTick(state);
    const edges = cultureEdges(state.graph, id);
    expect(edges.some(e => e.properties.cultureLayer === 'historical' && e.target === hex.cultureId)).toBe(true);
    expect(edges.every(e => e.properties.fringe !== true)).toBe(true);
  });
});
