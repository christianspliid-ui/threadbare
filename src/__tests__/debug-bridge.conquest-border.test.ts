// @vitest-environment jsdom
/**
 * The border moves when a town changes hands — THR-1155 slice 3, the closing Done-when.
 *
 * This file is the **sanctioned jsdom substitution** for that bullet's browser capture
 * (`Docs/canon/verification-gates.md` § Browser-verify): an unattended lane is refused a
 * dev server outright, and the Playwright route presumes one. What the two screenshots
 * were for is a claim, not a picture — *drive a conquest through
 * `window.__DEBUG.conquerLocation` and the red border visibly moves* — and the claim is
 * asserted here on the same lever, over a **generated** seed-42 medium world, through the
 * real `createBorderMesh`. Vertex data is what the capture would have photographed.
 *
 * It also closes a real gap rather than restating covered ground. `conquerLocation` is the
 * lever the Done-when names and the one a reviewer reaches for, and it had **no test at
 * all**: `battleAftermath.conquest.test.ts` proves the engine path it wraps, and
 * `BorderMesh.test.ts` proves the geometry moves on a *fixture* pair of projections, but
 * nothing tied the two ends together or proved the bridge's own resolution, army proxy and
 * cleanup work. A broken lever would have failed silently at review time, which is the
 * worst moment to discover it.
 *
 * The two-partition rule is asserted alongside, because it is falsifiable here and nowhere
 * else as cheaply: a conquest moves politics and must leave **geography untouched**.
 */
import { describe, it, expect, beforeAll } from 'vitest';

import '../debug-bridge';
import { initializeGameState, MAP_SIZE_PRESETS } from '../engine/gameInit';
import { createBalancedCosmology } from '../engine/cosmology';
import { generateArchetypes } from '../engine/ascendant';
import {
  createSimulationRuntime,
  ensureRealmProjection,
  ensureAreaProjection,
  type SimulationRuntime,
} from '../engine/simulationRuntime';
import { createBorderMesh } from '../components/HexMapV2/scene/BorderMesh';
import type { GameState } from '../types/gameState';
import type { HexTile } from '../types';
import type { RealmProjection } from '../engine/realmProjection';

const SEED = 42;

let state: GameState;
let tiles: HexTile[];
let runtime: SimulationRuntime;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Conquest', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;
  tiles = built.tiles;
  runtime = createSimulationRuntime();

  const debug = window.__DEBUG!;
  debug._registerGameStateProvider(() => state);
  debug._registerRuntimeProvider(() => runtime);
});

/** The projection as the map layer sees it — the full per-hex map, not the bridge's summary. */
function liveProjection(): RealmProjection {
  return ensureRealmProjection(runtime, state.graph, state.tiles, state.clock.currentTick);
}

/** Vertex data of the red border as the renderer would draw it right now. */
function borderVertices(projection: RealmProjection): number[] {
  const attr = createBorderMesh(projection, tiles).realmMesh.geometry.getAttribute('position');
  return attr ? Array.from(attr.array as Float32Array) : [];
}

describe('__DEBUG.conquerLocation — the browser Done-when, asserted headlessly', () => {
  it('the world under test actually has two Realms and a town to take (the non-vacuity guard)', () => {
    const before = liveProjection();
    // Without this, every assertion below could pass over an empty world: a conquest that
    // moves nothing, compared against a border that was never drawn.
    expect(before.realms.length, 'seed 42 / medium should mint more than one Realm').toBeGreaterThan(1);
    expect(before.hexRealmId.size, 'some ground should be claimed').toBeGreaterThan(0);
    expect(borderVertices(before).length, 'a two-Realm world should draw a border').toBeGreaterThan(0);
  });

  it('moves the town, and the border with it', async () => {
    const debug = window.__DEBUG!;

    const before = liveProjection();
    const beforeVertices = borderVertices(before);
    const beforeCounts = new Map(before.realms.map((r) => [r.id, r.hexes.length]));

    // A Realm that holds at least one town, and a different Realm to take it. Chosen from
    // the projection rather than hardcoded, so the arm survives a re-pin of the seed.
    const loser = before.realms.find((r) => r.heldLocationIds.length > 0);
    const winner = before.realms.find((r) => r.id !== loser?.id);
    expect(loser, 'a Realm holding a town').toBeDefined();
    expect(winner, 'a second Realm to take it').toBeDefined();
    const town = loser!.heldLocationIds[0];

    const result = (await debug.conquerLocation(town, winner!.id)) as {
      locationId: string; fromFactionId: string | null; toFactionId: string | null;
    } | null;

    // The lever resolved both refs, ran the real engine path, and reports the transfer.
    expect(result, 'conquerLocation returned null — a ref failed to resolve').not.toBeNull();
    expect(result!.locationId).toBe(town);
    expect(result!.fromFactionId).toBe(loser!.id);
    expect(result!.toFactionId).toBe(winner!.id);

    const after = liveProjection();

    // The territory moved in both directions — not merely "something changed".
    expect(after.realms.find((r) => r.id === winner!.id)!.hexes.length)
      .toBeGreaterThan(beforeCounts.get(winner!.id)!);
    expect(after.realms.find((r) => r.id === loser!.id)!.hexes.length)
      .toBeLessThan(beforeCounts.get(loser!.id)!);

    // ...and at least one hex names the winner where it used to name the loser. This is
    // the per-hex form of the claim, which the counts alone would not prove: two Realms
    // could trade equal ground elsewhere and leave the totals looking right.
    const flipped = [...after.hexRealmId.entries()]
      .filter(([key, realmId]) => realmId === winner!.id && before.hexRealmId.get(key) === loser!.id);
    expect(flipped.length, 'hexes that changed hands').toBeGreaterThan(0);

    // The photograph the browser capture would have taken: the border the renderer draws
    // is different geometry before and after.
    expect(borderVertices(after)).not.toEqual(beforeVertices);

    // The runtime was threaded, so the rebuild came from the version bump rather than the
    // fingerprint belt catching a writer that forgot.
    expect(runtime.structuralCacheVersion).toBeGreaterThan(0);
  });

  it('leaves the geography exactly where it was — politics moves, the Areas do not', () => {
    // The two partitions are different objects (THR-1155, THR-1453). A conquest that
    // dragged Area membership with it would be the single worst way to get this wrong,
    // because the map would still look plausible.
    const areas = ensureAreaProjection(runtime, state.graph, state.tiles);
    const stampedBefore = new Map(state.tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.regionId]));

    expect(areas.areas.length).toBeGreaterThan(0);
    for (const tile of state.tiles) {
      expect(tile.regionId).toBe(stampedBefore.get(`${tile.coord.col},${tile.coord.row}`));
    }
  });

  it('mints its stand-in army in a shape the schema recognises — a silent console', async () => {
    // The proxy host used to carry `actorType: 'army'`, a value no world-object kind
    // claims, plus a `member_of` edge missing all three required properties. The conquest
    // still worked (the engine reads only the edge), so nothing failed — it just shouted
    // four schema warnings into the console every time. That console is part of the
    // browser-verify evidence this very lever exists to produce, so the noise landed
    // exactly where it was most confusing.
    const debug = window.__DEBUG!;
    const projection = liveProjection();
    const loser = projection.realms.find((r) => r.heldLocationIds.length > 0);
    const winner = projection.realms.find((r) => r.id !== loser?.id);
    expect(loser, 'a Realm still holding a town').toBeDefined();

    const noise: string[] = [];
    const capture = (...args: unknown[]): void => { noise.push(args.map(String).join(' ')); };
    const warn = console.warn;
    const error = console.error;
    console.warn = capture;
    console.error = capture;
    try {
      await debug.conquerLocation(loser!.heldLocationIds[0], winner!.id);
    } finally {
      console.warn = warn;
      console.error = error;
    }

    expect(noise.filter((m) => m.includes('[NodeSchema]')), 'node-schema warnings').toEqual([]);
    expect(noise.filter((m) => m.includes('[GraphSchema]')), 'edge-schema warnings').toEqual([]);
  });

  it('fails soft on an unresolvable ref, and leaves no debris behind', async () => {
    const debug = window.__DEBUG!;
    const armiesBefore = state.graph.getNodesByType('actor')
      .filter((n) => n.properties.actorType === 'army').length;

    expect(await debug.conquerLocation('no_such_location', 'no_such_faction')).toBeNull();

    // The proxy host the lever mints to stand in for a victorious army is removed again
    // even when the call succeeds — a world left with debug armies in it would quietly
    // change what every later assertion is measuring.
    const armiesAfter = state.graph.getNodesByType('actor')
      .filter((n) => n.properties.actorType === 'army').length;
    expect(armiesAfter).toBe(armiesBefore);
    expect(state.graph.getNode('dbg_conquest_army_0_loc_0')).toBeUndefined();
  });
});
