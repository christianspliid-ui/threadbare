/**
 * The political map as a projection — THR-1155 slice 2, step 2.
 *
 * Before this, the red border came from `RegionData.hexDomainId`: a per-hex stamp
 * written once at worldgen. It could not move, because nothing in the simulation could
 * move it. These tests hold the two properties that replace it — that the border is
 * *derived* from the `controls` edges a Realm holds, and that when those edges change
 * the border follows.
 *
 * On a **generated world** wherever the property is one of real worldgen (that Realms
 * exist, that towns fall inside cultures, that most ground is near a town), and on a
 * built graph only where the case under test is one worldgen does not produce — a
 * contested hex exactly equidistant from two Realms, a Realm that holds nothing.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { WorldGraph } from '../graph';
import { buildRealmProjection, fingerprintFactionControls } from '../realmProjection';
import { stampRealmSeat } from '../realmSeat';
import {
  createSimulationRuntime,
  ensureRealmProjection,
  touchStructure,
} from '../simulationRuntime';
import { enableTracing, clearTraces, getTraces, disableTracing } from '../traceBuffer';
import { REALM_FILL_RADIUS } from '../../data/realm-content';
import { hexKey } from '../../lib/hexKey';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';

const SEED = 42;

let state: GameState;
let tiles: HexTile[];

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Projection', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;
  tiles = built.tiles;
});

/**
 * A two-Realm world with one town each, `separation` columns apart on row 0, over a
 * grid wide enough for both claims plus unclaimed ground at the ends.
 */
function buildTwoRealmWorld(separation: number): { graph: WorldGraph; tiles: HexTile[] } {
  const graph = new WorldGraph();
  const cols = separation + 2 * REALM_FILL_RADIUS + 4;
  const built: HexTile[] = [];
  for (let col = 0; col < cols; col++) {
    built.push({
      coord: { col, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    });
  }

  const seats = [REALM_FILL_RADIUS + 1, REALM_FILL_RADIUS + 1 + separation];
  seats.forEach((seatCol, i) => {
    const realmId = `faction_${i}`;
    const locId = `loc_${i}`;
    graph.addNode({
      id: realmId,
      type: 'actor',
      name: `Realm ${i}`,
      properties: { actorType: 'faction', factionClass: 'realm', factionDefId: `realm.c${i}` },
    });
    graph.addNode({
      id: locId,
      type: 'location',
      name: `Town ${i}`,
      properties: { locationSubtype: 'town', hexCol: seatCol, hexRow: 0 },
    });
    graph.addEdge({
      id: `edge_controls_${i}`,
      source: realmId,
      target: locId,
      type: 'controls',
      properties: { influence: 0.5, role: 'seat' },
    });
  });

  return { graph, tiles: built };
}

describe('buildRealmProjection — the border is the ground held (THR-1155)', () => {
  it('projects every minted Realm that holds a town, on a generated world', () => {
    const realmNodes = state.graph.getNodesByType('actor')
      .filter(n => n.properties.factionClass === 'realm');
    // Non-vacuity: a medium world seats 2–4 cultures, so an empty set would make every
    // assertion below true for the wrong reason.
    expect(realmNodes.length).toBeGreaterThanOrEqual(2);

    const projection = buildRealmProjection(state.graph, tiles);
    expect(projection.realms.length).toBe(realmNodes.length);
    expect(projection.hexRealmId.size).toBeGreaterThan(0);
  });

  it('every claimed hex is within REALM_FILL_RADIUS of a town its Realm holds', () => {
    const projection = buildRealmProjection(state.graph, tiles);

    // Resolve each Realm's held hexes once, so the check below is over real ground.
    const heldHexesByRealm = new Map<string, { col: number; row: number }[]>();
    for (const realm of projection.realms) {
      const hexes: { col: number; row: number }[] = [];
      for (const locId of realm.heldLocationIds) {
        const node = state.graph.getNode(locId);
        const col = node?.properties.hexCol;
        const row = node?.properties.hexRow;
        if (typeof col === 'number' && typeof row === 'number') hexes.push({ col, row });
      }
      heldHexesByRealm.set(realm.id, hexes);
    }

    let checked = 0;
    for (const realm of projection.realms) {
      const held = heldHexesByRealm.get(realm.id)!;
      for (const hex of realm.hexes) {
        const nearest = Math.min(...held.map(h => hexDistanceOffset(hex, h)));
        expect(nearest).toBeLessThanOrEqual(REALM_FILL_RADIUS);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('leaves ground beyond every Realm\'s reach unclaimed — wilderness is real', () => {
    const projection = buildRealmProjection(state.graph, tiles);
    // The claim is that *some* of a medium world is wilderness, which is the design
    // decision this projection encodes. A projection that claimed everything would be
    // the old domain stamp wearing a new name.
    expect(projection.unclaimedHexes).toBeGreaterThan(0);
    expect(projection.hexRealmId.size + projection.unclaimedHexes).toBe(tiles.length);
  });

  it('a guild, order or cult that holds a town is not projected as a nation', () => {
    const { graph, tiles: built } = buildTwoRealmWorld(10);
    // A guild on ground of its own, well outside either Realm's reach.
    graph.addNode({
      id: 'faction_guild',
      type: 'actor',
      name: 'The Hammer',
      properties: { actorType: 'faction', factionClass: 'guild', factionDefId: 'guild.smiths' },
    });
    graph.addNode({
      id: 'loc_guild',
      type: 'location',
      name: 'Hall',
      properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 },
    });
    graph.addEdge({
      id: 'edge_controls_guild', source: 'faction_guild', target: 'loc_guild',
      type: 'controls', properties: { influence: 0.5 },
    });

    const projection = buildRealmProjection(graph, built);
    expect(projection.realms.map(r => r.id)).toEqual(['faction_0', 'faction_1']);
    expect(projection.hexRealmId.get(hexKey(0, 0))).toBeUndefined();
  });

  it('a Realm that holds nothing has no territory and is not on the map', () => {
    const { graph, tiles: built } = buildTwoRealmWorld(10);
    graph.addNode({
      id: 'faction_9',
      type: 'actor',
      name: 'The Exiled Crown',
      properties: { actorType: 'faction', factionClass: 'realm', factionDefId: 'realm.c9' },
    });

    const projection = buildRealmProjection(graph, built);
    expect(projection.realms.map(r => r.id)).not.toContain('faction_9');
    // Its node survives — it may reclaim.
    expect(graph.getNode('faction_9')).toBeDefined();
  });

  it('breaks an equidistant tie by held-town count, then by the lower faction id', () => {
    // Two towns 2*REALM_FILL_RADIUS apart put exactly one hex at equal distance from
    // both — the case worldgen will not reliably produce and the tiebreak exists for.
    const { graph, tiles: built } = buildTwoRealmWorld(2 * REALM_FILL_RADIUS);
    const midCol = REALM_FILL_RADIUS + 1 + REALM_FILL_RADIUS;

    // With one town each it is a true tie, so the lower faction id takes it.
    expect(buildRealmProjection(graph, built).hexRealmId.get(hexKey(midCol, 0)))
      .toBe('faction_0');

    // Give faction_1 a second town — still equidistant, but it now holds more, so the
    // larger nation absorbs the contested march.
    graph.addNode({
      id: 'loc_1b', type: 'location', name: 'Second Town',
      properties: { locationSubtype: 'town', hexCol: built.length - 1, hexRow: 0 },
    });
    graph.addEdge({
      id: 'edge_controls_1b', source: 'faction_1', target: 'loc_1b',
      type: 'controls', properties: { influence: 0.5 },
    });

    expect(buildRealmProjection(graph, built).hexRealmId.get(hexKey(midCol, 0)))
      .toBe('faction_1');
  });

  it('is deterministic — the same graph and tiles give the same projection', () => {
    const a = buildRealmProjection(state.graph, tiles);
    const b = buildRealmProjection(state.graph, tiles);
    expect(a.realms.map(r => r.id)).toEqual(b.realms.map(r => r.id));
    expect([...a.hexRealmId.entries()]).toEqual([...b.hexRealmId.entries()]);
  });

  it('reads the seat from the `role: \'seat\'` edge, not from a node property', () => {
    const { graph, tiles: built } = buildTwoRealmWorld(10);
    const projection = buildRealmProjection(graph, built);
    const realm = projection.realms.find(r => r.id === 'faction_0')!;
    expect(realm.seatLocationId).toBe('loc_0');
    expect(realm.seatHex).toEqual({ col: REALM_FILL_RADIUS + 1, row: 0 });

    // Drop the role and the seat is gone — a Realm whose court has no hall (the
    // fail-soft case) rather than a stale hex read from somewhere else.
    //
    // Cleared in place, not through `updateEdge`: that method merges properties, so a
    // copy-minus-role handed to it comes back with the role intact. This is the trap
    // `stampRealmSeat` itself fell into (fixed in the same commit) — a re-seated Realm
    // kept both seats, and which one the projection reported depended on edge order.
    const edge = graph.getOutgoingEdges('faction_0', 'controls')[0];
    delete edge.properties.role;
    const reseated = buildRealmProjection(graph, built).realms
      .find(r => r.id === 'faction_0')!;
    expect(reseated.seatLocationId).toBeNull();
    expect(reseated.seatHex).toBeUndefined();
  });

  it('a re-seated Realm reports exactly one seat — stampRealmSeat clears the old role', () => {
    // The defect this pins: `stampRealmSeat` cleared the old seat through
    // `graph.updateEdge`, which merges the incoming properties over the existing ones, so
    // `delete properties.role` was undone on the way in. A Realm that changed seats then
    // carried `role: 'seat'` on two `controls` edges, and the projection reported whichever
    // the edge order happened to visit last.
    const { graph, tiles: built } = buildTwoRealmWorld(10);

    // A second, more town-like holding for faction_0 — a city outranks a town, so the
    // re-stamp must move the seat onto it.
    graph.addNode({
      id: 'loc_0_city', type: 'location', name: 'Big City',
      properties: { locationSubtype: 'city', hexCol: REALM_FILL_RADIUS + 2, hexRow: 0 },
    });
    graph.addEdge({
      id: 'edge_controls_0_city', source: 'faction_0', target: 'loc_0_city',
      type: 'controls', properties: { influence: 0.5 },
    });

    const seated = stampRealmSeat(graph, 'faction_0');
    expect(seated).toBe('loc_0_city');

    const seatEdges = graph.getOutgoingEdges('faction_0', 'controls')
      .filter(e => e.properties.role === 'seat');
    expect(seatEdges).toHaveLength(1);
    expect(seatEdges[0].target).toBe('loc_0_city');

    const realm = buildRealmProjection(graph, built).realms
      .find(r => r.id === 'faction_0')!;
    expect(realm.seatLocationId).toBe('loc_0_city');
  });
});

describe('ensureRealmProjection — one owner, and a belt (THR-1155)', () => {
  it('rebuilds on a structural bump and traces reason: version', () => {
    const { graph, tiles: built } = buildTwoRealmWorld(10);
    const runtime = createSimulationRuntime();

    enableTracing();
    clearTraces();
    try {
      const first = ensureRealmProjection(runtime, graph, built, 0);
      expect(first.realms).toHaveLength(2);

      // A second read with nothing changed must not rebuild — that is what the version
      // counter is for, and a projection that rebuilt every read would be the cost this
      // design avoided.
      const cached = ensureRealmProjection(runtime, graph, built, 0);
      expect(cached).toBe(first);

      // Move a town from faction_1 to faction_0 and bump, as a conquest will.
      const edge = graph.getOutgoingEdges('faction_1', 'controls')[0];
      graph.retargetEdgeSource(edge.id, 'faction_0');
      touchStructure(runtime);

      const after = ensureRealmProjection(runtime, graph, built, 5);
      expect(after).not.toBe(first);
      expect(after.realms.map(r => r.id)).toEqual(['faction_0']);

      const rebuilds = getTraces()
        .filter(t => t.category === 'realm_projection_rebuilt');
      expect(rebuilds).toHaveLength(2);
      expect(rebuilds.every(t => (t as { reason: string }).reason === 'version')).toBe(true);
    } finally {
      disableTracing();
    }
  });

  it('the belt rebuilds and traces reason: fingerprint when a writer skips the bump', () => {
    const { graph, tiles: built } = buildTwoRealmWorld(10);
    const runtime = createSimulationRuntime();

    enableTracing();
    clearTraces();
    try {
      const first = ensureRealmProjection(runtime, graph, built, 0);
      expect(first.hexRealmId.size).toBeGreaterThan(0);

      // The defect this belt exists for: a `controls` edge moves and nobody calls
      // `touchStructure`, so the version check would hand back a stale border forever.
      const edge = graph.getOutgoingEdges('faction_1', 'controls')[0];
      graph.retargetEdgeSource(edge.id, 'faction_0');

      const after = ensureRealmProjection(runtime, graph, built, 7);
      expect(after).not.toBe(first);
      expect(after.realms.map(r => r.id)).toEqual(['faction_0']);

      const belt = getTraces()
        .filter(t => t.category === 'realm_projection_rebuilt')
        .map(t => (t as { reason: string }).reason);
      expect(belt).toEqual(['version', 'fingerprint']);
    } finally {
      disableTracing();
    }
  });

  it('a mortal\'s strategic hold does not move the fingerprint, so it does not rebuild', () => {
    // THR-1448 owns what a mortal's hold means inside a Realm; it is not the political
    // map, and a border that rebuilt on every stance taken would spend the belt's budget
    // on something it does not watch.
    // Tiles unused here: the fingerprint is over edges, not ground.
    const { graph } = buildTwoRealmWorld(10);
    graph.addNode({
      id: 'mortal_1', type: 'actor', name: 'Someone',
      // A Mortal is `actorType: 'individual'` in the world-object registry (THR-1394);
      // 'mortal' is the game word, not the stored value, and the write guard says so.
      properties: { actorType: 'individual' },
    });

    const before = fingerprintFactionControls(graph);
    graph.addEdge({
      id: 'edge_controls_mortal', source: 'mortal_1', target: 'loc_0',
      type: 'controls', properties: { controlType: 'strategic' },
    });
    expect(fingerprintFactionControls(graph)).toBe(before);

    // And the faction-sourced change that *is* the political map does move it.
    const edge = graph.getOutgoingEdges('faction_1', 'controls')[0];
    graph.retargetEdgeSource(edge.id, 'faction_0');
    expect(fingerprintFactionControls(graph)).not.toBe(before);
  });
});

/** Hex distance over offset coordinates — the same measure the projection uses. */
function hexDistanceOffset(
  a: { col: number; row: number },
  b: { col: number; row: number },
): number {
  const toCube = (h: { col: number; row: number }): [number, number, number] => {
    const x = h.col;
    const z = h.row - (h.col - (h.col & 1)) / 2;
    return [x, -x - z, z];
  };
  const [ax, ay, az] = toCube(a);
  const [bx, by, bz] = toCube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}
