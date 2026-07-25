/**
 * NPC band spawner (THR-731).
 *
 * The band spawner's job is to give companies opposition at their own scale by
 * fielding a faction's own people as an ordinary `faction_band` company. These
 * tests lock the three things that decide whether it is alive or dormant:
 * eligibility (who counts as musterable), the reserve floor (a faction may not
 * empty itself), and the band-vs-company distinction downstream systems key on.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { spawnBandForFaction, spawnFactionBands } from '../bandSpawner';
import { getAllGroups, isBandNode, isCompanyNode, getGroupMembers } from '../groupQueries';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import {
  BAND_SPAWN_INTERVAL,
  BAND_SIZE_MIN,
  BAND_FACTION_MEMBER_RESERVE,
  MAX_ACTIVE_BANDS_PER_FACTION,
  BAND_COHESION_START,
} from '../../../data/group-constants';

function makeState(graph: WorldGraph, tick = BAND_SPAWN_INTERVAL): GameState {
  return { graph, tick, seed: 42, tickEvents: [] } as unknown as GameState;
}

/** A faction with `memberCount` colocated individual members. */
function seedFaction(
  graph: WorldGraph,
  factionId: string,
  memberCount: number,
  opts: { spotlightTier?: string; locationId?: string } = {},
): void {
  const locId = opts.locationId ?? 'loc.hall';
  if (!graph.getNode(locId)) {
    graph.addNode({ id: locId, type: 'location', name: 'The Hall', properties: { locationType: 'settlement', hexCol: 3, hexRow: 3 } });
  }
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: `Guild ${factionId}`,
    properties: { actorType: 'faction', factionType: 'guild' },
  });
  for (let i = 0; i < memberCount; i++) {
    const id = `${factionId}.m${i}`;
    graph.addNode({
      id,
      type: 'actor',
      name: `Member ${i}`,
      properties: {
        actorType: 'individual',
        ...(opts.spotlightTier ? { spotlightTier: opts.spotlightTier } : {}),
      },
    });
    graph.addEdge({ id: `at.${id}`, source: id, target: locId, type: 'located_at', properties: {} });
    graph.addEdge({
      id: `mem.${id}`, source: id, target: factionId, type: 'member_of',
      properties: { role: 'member', rank: 0, joinedTick: 0 },
    });
  }
}

/** rng that always returns 0 — every roll passes, every pick is the first. */
const alwaysRoll = () => 0;

describe('spawnBandForFaction', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => disableTracing());

  it('fields a band from a faction with members to spare', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.knives', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    const result = spawnBandForFaction(state, graph.getNode('f.knives')!, alwaysRoll);

    expect(result).toBeDefined();
    expect(result!.memberIds.length).toBe(BAND_SIZE_MIN);
    const band = graph.getNode(result!.groupId)!;
    expect(isBandNode(band)).toBe(true);
    expect(band.properties.bandRole).toBe('defender');
    expect(band.properties.bandFactionId).toBe('f.knives');
    expect(band.properties.cohesion).toBe(BAND_COHESION_START);
  });

  it('refuses to draw the faction below its member reserve', () => {
    const graph = new WorldGraph();
    // One member short of min + reserve.
    seedFaction(graph, 'f.thin', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE - 1);
    const state = makeState(graph);

    expect(spawnBandForFaction(state, graph.getNode('f.thin')!, alwaysRoll)).toBeUndefined();
    expect(getAllGroups(graph)).toHaveLength(0);
  });

  it('musters background-tier members — the spotlight gate is a company rule, not a faction one', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.wolves', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE, { spotlightTier: 'background' });
    const state = makeState(graph);

    // `isGroupEligibleAgent` would reject every one of these; the band predicate
    // must not, or big factions (whose rosters are mostly background) can never
    // field opposition. This is the assertion that keeps the spawner from going
    // dormant the way THR-614's war system did.
    expect(spawnBandForFaction(state, graph.getNode('f.wolves')!, alwaysRoll)).toBeDefined();
  });

  it('attaches the band to its faction so faction-objective movement can read it', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.pact', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    const result = spawnBandForFaction(state, graph.getNode('f.pact')!, alwaysRoll)!;
    const toFaction = graph.getOutgoingEdges(result.groupId, 'member_of');
    expect(toFaction.map(e => e.target)).toContain('f.pact');
  });

  it('caps concurrent bands per faction', () => {
    const graph = new WorldGraph();
    // Enough members for more bands than the cap allows.
    seedFaction(graph, 'f.big', (BAND_SIZE_MIN * (MAX_ACTIVE_BANDS_PER_FACTION + 1)) + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    for (let i = 0; i < MAX_ACTIVE_BANDS_PER_FACTION + 2; i++) {
      spawnBandForFaction(state, graph.getNode('f.big')!, alwaysRoll);
    }
    const bands = getAllGroups(graph).filter(isBandNode);
    expect(bands.length).toBe(MAX_ACTIVE_BANDS_PER_FACTION);
  });

  it('will not muster members who are scattered across locations', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.scattered', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    // Disperse every member to their own location — no cluster reaches BAND_SIZE_MIN.
    let i = 0;
    for (const edge of graph.getIncomingEdges('f.scattered', 'member_of')) {
      const memberId = edge.source;
      const locId = `loc.away${i++}`;
      graph.addNode({ id: locId, type: 'location', name: locId, properties: { locationType: 'settlement', hexCol: i, hexRow: i } });
      for (const at of graph.getOutgoingEdges(memberId, 'located_at')) graph.removeEdge(at.id);
      graph.addEdge({ id: `at2.${memberId}`, source: memberId, target: locId, type: 'located_at', properties: {} });
    }
    const state = makeState(graph);

    expect(spawnBandForFaction(state, graph.getNode('f.scattered')!, alwaysRoll)).toBeUndefined();
  });

  it('emits a band_spawned trace naming the faction and the role', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.trace', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    spawnBandForFaction(state, graph.getNode('f.trace')!, alwaysRoll);

    const trace = getTraces().find(t => t.category === 'band_spawned');
    expect(trace).toBeDefined();
    expect(trace).toMatchObject({ factionId: 'f.trace', bandRole: 'defender' });
  });

  it('does not take members who already belong to a company', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.taken', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);
    // First band claims its members; the remainder is below the reserve floor.
    expect(spawnBandForFaction(state, graph.getNode('f.taken')!, alwaysRoll)).toBeDefined();
    const remaining = spawnBandForFaction(state, graph.getNode('f.taken')!, alwaysRoll);
    expect(remaining).toBeUndefined();
  });
});

describe('band nodes are ordinary companies', () => {
  it('a band satisfies isCompanyNode, so phaseGroups frays and dissolves it like any other', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.ordinary', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    const state = makeState(graph);

    const result = spawnBandForFaction(state, graph.getNode('f.ordinary')!, alwaysRoll)!;
    const band = graph.getNode(result.groupId);

    expect(isCompanyNode(band)).toBe(true);
    expect(getAllGroups(graph).map(g => g.id)).toContain(result.groupId);
    expect(getGroupMembers(graph, result.groupId).length).toBe(BAND_SIZE_MIN);
  });

  it('isBandNode distinguishes a band from a plain company', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'g.company', type: 'actor', name: 'The Quiet Wardens',
      properties: { actorType: 'group', groupType: 'party', cohesion: 0.5, groupStatus: 'active' },
    });
    expect(isBandNode(graph.getNode('g.company'))).toBe(false);
    expect(isCompanyNode(graph.getNode('g.company'))).toBe(true);
  });
});

describe('spawnFactionBands sweep', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => disableTracing());

  it('only sweeps on its interval', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.sweep', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);

    expect(spawnFactionBands(makeState(graph, BAND_SPAWN_INTERVAL + 1), alwaysRoll)).toBe(0);
    expect(spawnFactionBands(makeState(graph, BAND_SPAWN_INTERVAL), alwaysRoll)).toBe(1);
  });

  it('never sweeps on tick 0', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.zero', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    expect(spawnFactionBands(makeState(graph, 0), alwaysRoll)).toBe(0);
  });

  it('skips monster factions, which hold no roster to muster from', () => {
    const graph = new WorldGraph();
    seedFaction(graph, 'f.monster', BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE);
    graph.updateNode('f.monster', {
      properties: { ...graph.getNode('f.monster')!.properties, isMonsterFaction: true },
    });

    expect(spawnFactionBands(makeState(graph), alwaysRoll)).toBe(0);
  });

  it('is deterministic for a given seed', () => {
    const run = (): string[] => {
      const graph = new WorldGraph();
      seedFaction(graph, 'f.a', 8);
      seedFaction(graph, 'f.b', 8, { locationId: 'loc.other' });
      let i = 0;
      // A fixed pseudo-sequence stands in for the seeded stream.
      const rng = () => ((i = (i * 1103515245 + 12345) % 2147483648), (i % 1000) / 1000);
      spawnFactionBands(makeState(graph), rng);
      return getAllGroups(graph).map(g => `${g.id}:${g.properties.roster}`).sort();
    };
    expect(run()).toEqual(run());
  });
});
