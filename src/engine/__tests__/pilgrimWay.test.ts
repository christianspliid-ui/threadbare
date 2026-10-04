/**
 * Consecrate a pilgrim way (THR-1660) — the `create × pilgrim_way` cell, end to end:
 * the board offers it at a town on its people's congregation's ground, completion writes
 * one `sacred_route` congregation → town through `createRelationEdge`, the town's pool
 * is invalidated, and the real encounter cache then pools the pilgrimage there.
 *
 * The literal 'encounter.pilgrimage_trial' is deliberate (the encounterCache test's
 * reason): asserting against the production constant would pass on an empty list.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import { executeStrategicAction } from '../strategicActionLifecycle';
import { EncounterCacheManager } from '../encounterCache';
import { describeDeed } from '../undertakingDeed';
import { congregationOfSite, selectPilgrimWays } from '../pilgrimWays';
import { pilgrimWaySiteEligibility } from '../../data/undertaking-objects';
import { getCellTemplate } from '../../data/undertaking-cells';
import { PILGRIM_WAY_REACH_PROFILE } from '../../data/strategic-action-constants';
import { TEMPLE_OF_SPHERES_DEF_ID } from '../../data/world-scenario';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type { StrategicActionCandidate } from '../../types/strategicAction';

const CELL = 'cell.create.pilgrim_way';
const ZEALOT = 'actor_zealot';

function addCulture(g: WorldGraph, id: string, name: string): void {
  g.addNode({ id, type: 'actor', name, properties: { actorType: 'culture' } });
}

function addCongregation(g: WorldGraph, id: string, cultureId: string): void {
  g.addNode({
    id, type: 'actor', name: `The Temple of the ${id}`,
    properties: { actorType: 'faction', factionDefId: TEMPLE_OF_SPHERES_DEF_ID, veneratedSphere: 'spirit' },
  });
  g.addEdge({ id: `bt_${id}_${cultureId}`, source: id, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 0.8 } });
}

function addSettlement(g: WorldGraph, id: string, name: string, subtype: string, col: number, cultureId?: string): void {
  g.addNode({ id, type: 'location', name, properties: { locationSubtype: subtype, hexCol: col, hexRow: 5 } });
  if (cultureId) {
    g.addEdge({ id: `bt_${id}_${cultureId}`, source: id, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 1, cultureLayer: 'current' } });
  }
}

/**
 * A zealot (in no congregation — the measured case) stands in Ashford. Ashford, Brindle
 * and the shrine sit on the Ashen Folk's ground, which keeps a congregation; Cold Harbour
 * belongs to the Reed People, who keep none.
 */
function world(): WorldGraph {
  const g = new WorldGraph();
  addCulture(g, 'culture_ash', 'the Ashen Folk');
  addCulture(g, 'culture_reed', 'the Reed People');
  addCongregation(g, 'fac_temple_ash', 'culture_ash');
  addSettlement(g, 'loc_ashford', 'Ashford', 'town', 5, 'culture_ash');
  addSettlement(g, 'loc_brindle', 'Brindle', 'city', 7, 'culture_ash');
  addSettlement(g, 'loc_shrine', 'The Weeping Stone', 'shrine', 6, 'culture_ash');
  addSettlement(g, 'loc_cold', 'Cold Harbour', 'town', 9, 'culture_reed');
  g.addNode({
    id: ZEALOT, type: 'actor', name: 'Sister Maren',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      domainCapabilities: { star: 24, heart: 16, eye: 8, gold: 4, iron: 4, stone: 8, shadow: 4, veil: 8 },
    },
  });
  g.addEdge({ id: 'located_zealot', source: ZEALOT, target: 'loc_ashford', type: 'located_at', properties: {} });
  g.addNode({ id: 'ambition_node', name: 'Spread the Faith', type: 'event', properties: { templateId: 'ambition_spread_faith' } });
  g.addEdge({ id: 'pursues_zealot', source: ZEALOT, target: 'ambition_node', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });
  return g;
}

function board(g: WorldGraph) {
  return generateStrategicCandidates(
    g, ZEALOT, ['ambition_spread_faith'], undefined, 10, mulberry32(42),
    { templateId: CELL, bypass: new Set(), preferOwnedTarget: false }, 'cells',
  );
}

const minimalState = (g: WorldGraph) => ({
  tick: 10, graph: g, tiles: [], tickEvents: [], encounterProgress: [], unifiedActions: [],
  premonitionQueue: [], clearanceGateStates: {}, pendingEncounterSeeds: [],
}) as unknown as GameState;

function boardCandidateAt(g: WorldGraph, siteId: string): StrategicActionCandidate {
  const c = board(g).candidates.find(x => x.templateId === CELL && x.targetNodeId === siteId);
  expect(c, `the board offers no consecration at ${siteId}`).toBeDefined();
  return { ...c!, executionMode: 'instant' };
}

function pooledAt(g: WorldGraph, siteId: string): string[] {
  const cache = new EncounterCacheManager();
  cache.buildFullCache(g);
  return cache.getEntriesForLocation(siteId).map(e => e.templateId);
}

describe('the cell (THR-1660 D1)', () => {
  it('is synthesised as a class-of-Route create cell with the Star lean and its own words', () => {
    const cell = getCellTemplate(CELL);
    expect(cell).toBeDefined();
    expect(cell!.objectTypeId).toBe('pilgrim_way');
    expect(cell!.displayName).toBe('Consecrate a pilgrim way');
    expect(cell!.behaviorFamily).toBe('zealot-mission');
    expect(cell!.reachProfile).toEqual(PILGRIM_WAY_REACH_PROFILE);
    expect(cell!.targetRule).toEqual({ type: 'location_subtype', subtypes: ['town', 'city', 'capital'] });
  });
});

describe('the board (THR-1617 hook)', () => {
  it('offers a non-member zealot the town it stands in, and a city on the same ground', () => {
    const targets = board(world()).candidates.filter(c => c.templateId === CELL).map(c => c.targetNodeId);
    expect(targets).toContain('loc_ashford');
    expect(targets).toContain('loc_brindle');
  });

  it('never offers a shrine — the pilgrimage is already there', () => {
    const targets = board(world()).candidates.filter(c => c.templateId === CELL).map(c => c.targetNodeId);
    expect(targets).not.toContain('loc_shrine');
  });

  it('refuses a town whose people keep no congregation, by name', () => {
    const g = world();
    // The board stops at its per-cell candidate cap, so the two nearer consecratable
    // towns are made destinations already; Cold Harbour is then reached and refused.
    for (const site of ['loc_ashford', 'loc_brindle']) {
      g.addEdge({ id: `way_${site}`, source: 'fac_temple_ash', target: site, type: 'sacred_route', properties: { establishedTick: 0, origin: 'worldgen' } });
    }
    const result = board(g);
    expect(result.candidates.filter(c => c.templateId === CELL).map(c => c.targetNodeId)).not.toContain('loc_cold');
    expect(result.rejections.map(r => r.reason)).toContain('ineligible:no_congregation_here:loc_cold');
  });

  it('refuses a town that is already a pilgrim destination, by name', () => {
    const g = world();
    g.addEdge({ id: 'seeded_way', source: 'fac_temple_ash', target: 'loc_brindle', type: 'sacred_route', properties: { establishedTick: 0, origin: 'worldgen' } });
    const result = board(g);
    expect(result.candidates.filter(c => c.templateId === CELL).map(c => c.targetNodeId)).not.toContain('loc_brindle');
    expect(result.rejections.map(r => r.reason)).toContain('ineligible:already_a_pilgrim_destination:loc_brindle');
  });
});

describe('completion (THR-1660 D2)', () => {
  it('writes one way from the site\'s congregation, invalidates the town, and the cache pools the pilgrimage', () => {
    const g = world();
    expect(pooledAt(g, 'loc_ashford')).not.toContain('encounter.pilgrimage_trial');

    const candidate = boardCandidateAt(g, 'loc_ashford');
    const result = executeStrategicAction(minimalState(g), g, candidate, 12, mulberry32(7));

    expect(result.graphOps.some(o => o.op === 'create_relation_edge' && o.success)).toBe(true);
    const ways = g.getIncomingEdges('loc_ashford', 'sacred_route');
    expect(ways).toHaveLength(1);
    expect(ways[0].source).toBe('fac_temple_ash');
    expect(ways[0].properties).toMatchObject({ origin: 'undertaking', establishedTick: 12, projectId: candidate.candidateId });
    // Never the mortal's edge: the way belongs to the congregation.
    expect(g.getOutgoingEdges(ZEALOT, 'sacred_route')).toHaveLength(0);
    expect(result.poolInvalidatedLocationIds).toContain('loc_ashford');
    expect(pooledAt(g, 'loc_ashford')).toContain('encounter.pilgrimage_trial');

    expect(selectPilgrimWays(g)).toEqual([expect.objectContaining({
      congregationId: 'fac_temple_ash', siteId: 'loc_ashford', origin: 'undertaking', projectId: candidate.candidateId,
    })]);
  });

  it('re-checks at completion: a way consecrated first refuses the second, with no write', () => {
    const g = world();
    const candidate = boardCandidateAt(g, 'loc_brindle');
    g.addEdge({ id: 'first_way', source: 'fac_temple_ash', target: 'loc_brindle', type: 'sacred_route', properties: { establishedTick: 11 } });
    const result = executeStrategicAction(minimalState(g), g, candidate, 12, mulberry32(7));
    expect(result.graphOps.some(o => o.error === 'already_a_pilgrim_destination')).toBe(true);
    expect(g.getIncomingEdges('loc_brindle', 'sacred_route')).toHaveLength(1);
  });

  it('re-checks at completion: a congregation dissolved mid-work refuses, with no write', () => {
    const g = world();
    const candidate = boardCandidateAt(g, 'loc_brindle');
    g.updateNode('fac_temple_ash', { properties: { dissolved: true } });
    const result = executeStrategicAction(minimalState(g), g, candidate, 12, mulberry32(7));
    expect(result.graphOps.some(o => o.error === 'no_congregation_here')).toBe(true);
    expect(g.getIncomingEdges('loc_brindle', 'sacred_route')).toHaveLength(0);
  });

  it('names the deed by the site even though the made thing is an edge', () => {
    const g = world();
    const candidate = boardCandidateAt(g, 'loc_brindle');
    const result = executeStrategicAction(minimalState(g), g, candidate, 12, mulberry32(7));
    const createdId = result.graphOps.find(o => o.success && o.createdId)?.createdId;
    expect(createdId && g.getEdge(createdId)).toBeTruthy();
    const deed = describeDeed(g, candidate, undefined, createdId);
    expect(deed).toMatchObject({ word: 'Consecrated', phrase: 'Consecrated the way to Brindle' });
    expect(deed!.objectRef).toEqual({ kind: 'location', id: 'loc_brindle', name: 'Brindle' });
  });
});

describe('the faith-ground readers', () => {
  it('reads the congregation from the site\'s culture, lowest id on a tie, never a dissolved one', () => {
    const g = world();
    expect(congregationOfSite(g, 'loc_ashford')).toBe('fac_temple_ash');
    expect(congregationOfSite(g, 'loc_cold')).toBeNull();
    addCongregation(g, 'fac_temple_aaa', 'culture_ash');
    expect(congregationOfSite(g, 'loc_ashford')).toBe('fac_temple_aaa');
    g.updateNode('fac_temple_aaa', { properties: { dissolved: true } });
    expect(congregationOfSite(g, 'loc_ashford')).toBe('fac_temple_ash');
  });

  it('refuses a gone consecrator and a site that is no longer a settlement', () => {
    const g = world();
    g.updateNode(ZEALOT, { properties: { deceased: true } });
    expect(pilgrimWaySiteEligibility(g, ZEALOT, { kind: 'node', nodeId: 'loc_ashford' })).toBe('consecrator_gone');
    const h = world();
    h.updateNode('loc_ashford', { properties: { locationSubtype: 'ruins' } });
    expect(pilgrimWaySiteEligibility(h, ZEALOT, { kind: 'node', nodeId: 'loc_ashford' })).toBe('site_gone');
  });

  it('skips a way whose end is gone', () => {
    const g = world();
    g.addEdge({ id: 'way_x', source: 'fac_temple_ash', target: 'loc_brindle', type: 'sacred_route', properties: { establishedTick: 0, origin: 'worldgen' } });
    expect(selectPilgrimWays(g)).toHaveLength(1);
    g.removeNode('fac_temple_ash');
    expect(selectPilgrimWays(g)).toHaveLength(0);
  });
});
