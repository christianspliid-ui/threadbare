// src/engine/__tests__/cultureFringe.test.ts
//
// THR-1839 — places founded during play take the nearest people as their fringe, by the
// same draw-free rule the worldgen pass applies (THR-1632 S1d). The rule is unit-tested
// on a small hand-built graph; the founding path and the mining decision are asserted
// on a generated world, because what they close is a property of what play writes.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  collectHeartlands,
  fringeReachOf,
  pickNearestHeartland,
  takeFringeCulture,
} from '../cultureFringe';
import { assignCultureToLocation } from '../cultureGenerator';
import { createLocation } from '../strategicGraphOps';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { getLocationNodes } from '../sublocationShape';
import { hexDistance } from '../../lib/hexMath';
import {
  CULTURE_FRINGE_STRENGTH,
  CULTURE_FRINGE_SUBTYPES,
  DEFAULT_WORLD_SCENARIO,
  WORLD_SCENARIO_TODAY,
} from '../../data/world-scenario';

function addPlace(g: WorldGraph, id: string, subtype: string, col: number, row: number) {
  g.addNode({
    id, name: id, type: 'location',
    properties: { locationType: subtype, locationSubtype: subtype, hexCol: col, hexRow: row },
  });
}

function addCulture(g: WorldGraph, id: string) {
  g.addNode({ id, name: id, type: 'actor', properties: { actorType: 'culture' } });
}

function currentCultures(g: WorldGraph, locId: string) {
  return g.getOutgoingEdges(locId, 'belongs_to').filter(e => e.properties.cultureLayer === 'current');
}

/** Two heartlands: culture_b at (0,0), culture_a at (10,0). */
function twoHeartlands(): WorldGraph {
  const g = new WorldGraph();
  addCulture(g, 'culture_a');
  addCulture(g, 'culture_b');
  addPlace(g, 'loc_b', 'town', 0, 0);
  addPlace(g, 'loc_a', 'town', 10, 0);
  assignCultureToLocation(g, 'loc_b', 'culture_b', 'current');
  assignCultureToLocation(g, 'loc_a', 'culture_a', 'current');
  return g;
}

describe('the fringe rule (THR-1839)', () => {
  it('takes the nearest heartland\'s culture as a fringe: current layer, half strength, flagged', () => {
    const g = twoHeartlands();
    addPlace(g, 'loc_new', 'hamlet', 2, 0);
    expect(takeFringeCulture(g, 'loc_new', 24)).toBe('culture_b');
    const links = g.getOutgoingEdges('loc_new', 'belongs_to');
    expect(links).toHaveLength(1);
    expect(links[0].properties).toEqual({ culturalStrength: CULTURE_FRINGE_STRENGTH, cultureLayer: 'current', fringe: true });
  });

  it('breaks a distance tie by culture id, never by insertion order', () => {
    const g = twoHeartlands();
    const mid = { col: 5, row: 0 };
    expect(hexDistance(mid, { col: 0, row: 0 })).toBe(hexDistance(mid, { col: 10, row: 0 }));
    addPlace(g, 'loc_mid', 'hamlet', mid.col, mid.row);
    expect(takeFringeCulture(g, 'loc_mid', 24)).toBe('culture_a');
  });

  it('takes nothing beyond the reach, with the reach off, or on a subtype outside the set', () => {
    const g = twoHeartlands();
    addPlace(g, 'loc_far', 'hamlet', 40, 0);
    addPlace(g, 'loc_near', 'hamlet', 1, 0);
    addPlace(g, 'loc_ruin', 'ruins', 1, 1);
    expect(takeFringeCulture(g, 'loc_far', 24)).toBeNull();
    expect(takeFringeCulture(g, 'loc_near', 0)).toBeNull();
    expect(takeFringeCulture(g, 'loc_ruin', 24)).toBeNull();
    expect(CULTURE_FRINGE_SUBTYPES.has('ruins')).toBe(false);
    for (const id of ['loc_far', 'loc_near', 'loc_ruin']) expect(currentCultures(g, id)).toHaveLength(0);
  });

  it('leaves a place that already belongs to a people alone', () => {
    const g = twoHeartlands();
    addPlace(g, 'loc_new', 'hamlet', 9, 0);
    assignCultureToLocation(g, 'loc_new', 'culture_b', 'current');
    expect(takeFringeCulture(g, 'loc_new', 24)).toBeNull();
    expect(currentCultures(g, 'loc_new').map(e => e.target)).toEqual(['culture_b']);
  });

  it('never anchors on a fringe town, so a fringe cannot chain outward', () => {
    const g = twoHeartlands();
    addPlace(g, 'loc_f1', 'hamlet', -20, 0);
    expect(takeFringeCulture(g, 'loc_f1', 24)).toBe('culture_b');
    expect(collectHeartlands(g).map(h => h.id).sort()).toEqual(['loc_a', 'loc_b']);
    // 20 hexes past loc_f1, 40 from the nearest heartland: out of reach.
    addPlace(g, 'loc_f2', 'hamlet', -40, 0);
    expect(takeFringeCulture(g, 'loc_f2', 24)).toBeNull();
  });

  it('skips a sublocation — the fringe is a place-tier link', () => {
    const g = twoHeartlands();
    g.addNode({
      id: 'subloc_x', name: 'x', type: 'location',
      properties: { locationSubtype: 'hamlet', parentLocationId: 'loc_b', hexCol: 0, hexRow: 0 },
    });
    expect(takeFringeCulture(g, 'subloc_x', 24)).toBeNull();
  });

  it('pickNearestHeartland reports null on an empty heartland list', () => {
    expect(pickNearestHeartland({ col: 0, row: 0 }, [], 24)).toBeNull();
  });
});

describe('the reach a founded place reads (THR-1839)', () => {
  it('is the world\'s own scenario, and the default when a state carries none', () => {
    expect(fringeReachOf({ worldScenario: WORLD_SCENARIO_TODAY })).toBe(0);
    expect(fringeReachOf({ worldScenario: undefined })).toBe(DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes);
  });
});

describe('on a generated world (THR-1839)', () => {
  _resetNpcCounter();
  const state = initializeGameState(
    generateArchetypes(4, 42)[0], 'T', createBalancedCosmology(), 42,
    MAP_SIZE_PRESETS.small.cols, MAP_SIZE_PRESETS.small.rows,
  ).state;
  const g = state.graph;

  it('a hamlet founded during play next to a heartland takes that people as its fringe', () => {
    const heartlands = collectHeartlands(g);
    expect(heartlands.length).toBeGreaterThan(0);
    const anchor = heartlands[0];
    const founder = g.getNodesByType('actor').find(n => n.properties.actorType === 'individual');
    const res = createLocation(g, { col: anchor.col, row: anchor.row }, founder?.id ?? 'worldgen', 'New Hamlet', 'hamlet', 200);
    expect(res.success).toBe(true);
    const picked = takeFringeCulture(g, res.createdId!, fringeReachOf(state));
    expect(picked).toBe(pickNearestHeartland({ col: anchor.col, row: anchor.row }, heartlands, 24)!.cultureId);
    const links = currentCultures(g, res.createdId!);
    expect(links).toHaveLength(1);
    expect(links[0].properties.fringe).toBe(true);
  });

  it('a worked mine within reach of a heartland belongs to a people', () => {
    const reach = fringeReachOf(state);
    const heartlands = collectHeartlands(g);
    const mines = getLocationNodes(g).filter(n => n.properties.locationSubtype === 'mining');
    for (const mine of mines) {
      const here = { col: mine.properties.hexCol as number, row: mine.properties.hexRow as number };
      if (!pickNearestHeartland(here, heartlands, reach)) continue;
      expect(currentCultures(g, mine.id).length, mine.id).toBeGreaterThan(0);
    }
  });
});
