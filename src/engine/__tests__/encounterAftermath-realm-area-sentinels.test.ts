/**
 * THR-1155 slice 3 — `$realm` and `$area` in the aftermath binder.
 *
 * Slice 2 gave the world a political map that moves and surfaces that report it. What
 * authored content still could not do was *name* the nation: a Realm's faction node is
 * minted per world and its definition id is `realm.<cultureId>` over a generated
 * culture, so neither a literal id nor `$faction:<defId>` can reach it. Every realm
 * encounter the Factory will write — a court summons, a border levy, a tithe demanded —
 * needs to say *the realm that holds this town* without knowing either string.
 *
 * The property under test is **not** "the binder writes a field", which is the binder
 * restating itself. It is that `$realm` and the border agree: the sentinel is resolved
 * from `realmProjection.hexRealmId` — the same map `BorderMesh` draws — so the nation an
 * effect lands on is the nation the player can see holding that ground.
 *
 * Two arms are falsifiers rather than confirmations, per the standing rule that a gate
 * never shown failing on the shape it exists to catch is not evidence:
 *
 *  - **the guild falsifier** — the same town, held by a guild instead of a Realm, leaves
 *    `$realm` unbound. Without it every assertion here would pass on a binder that
 *    resolved *whoever holds this town*, which is the one thing § D forbids;
 *  - **the kind falsifier** — `$realm` on an agent field binds nothing, so the faction
 *    gate is doing work rather than being implied by the fixture only ever offering
 *    faction fields.
 *
 * `$area` has no confirmation arm because it has no binding case: no field in the
 * `EncounterAftermathReactionEffect` union takes an Area. It is registered so the binder
 * *consumes* the literal rather than passing `'$area'` downstream as a node id, and the
 * arms below hold exactly that — unbound, left in place, and reported in the trace.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  bindAftermathSceneTargets,
  AFTERMATH_REALM_SENTINEL,
  AFTERMATH_AREA_SENTINEL,
} from '../encounterAftermath';
import { buildRealmProjection } from '../realmProjection';
import { getLocationHolder } from '../realmHolder';
import { sentinelBindingRefusal, isSceneSentinel } from '../sceneSentinels';
import { enableTracing, clearTraces, getTraces, disableTracing } from '../traceBuffer';
import { REALM_FILL_RADIUS, REALM_FACTION_CLASS } from '../../data/realm-content';
import type { RealmProjection } from '../realmProjection';
import type { HexTile } from '../../types';
import type {
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const ACTOR_ID = 'actor-wanderer';
const LOCATION_ID = 'loc_0';
const PLACE_ID = 'sub-tavern';
const REALM_ID = 'faction_realm';
const GUILD_ID = 'faction_guild';
const SEAT_COL = REALM_FILL_RADIUS + 1;

/**
 * One town on one row, held by either a Realm or a guild, with the acting agent standing
 * at a Place *inside* it — the three-tier shape, so `$realm` is shown inheriting
 * `resolveSceneHere`'s walk up to the Location rather than needing the agent parked on
 * the settlement node itself.
 */
function buildWorld(opts: { holder: 'realm' | 'guild' | 'none' }): {
  graph: WorldGraph;
  tiles: HexTile[];
} {
  const graph = new WorldGraph();
  const tiles: HexTile[] = [];
  for (let col = 0; col < SEAT_COL + REALM_FILL_RADIUS + 2; col++) {
    tiles.push({
      coord: { col, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    });
  }

  graph.addNode({
    id: ACTOR_ID, type: 'actor', name: 'Wren',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: LOCATION_ID, type: 'location', name: 'Ashford',
    properties: { locationSubtype: 'town', hexCol: SEAT_COL, hexRow: 0 },
  });
  graph.addNode({
    id: PLACE_ID, type: 'location', name: 'The Kettle',
    properties: { parentLocationId: LOCATION_ID },
  });
  graph.addEdge({
    id: 'edge.located_at.actor', source: ACTOR_ID, target: PLACE_ID,
    type: 'located_at', properties: {},
  });

  if (opts.holder !== 'none') {
    const isRealm = opts.holder === 'realm';
    const id = isRealm ? REALM_ID : GUILD_ID;
    graph.addNode({
      id, type: 'actor', name: isRealm ? 'Witness Skyfield' : 'The Kettlewrights',
      properties: {
        actorType: 'faction',
        // The discriminator the projection filters on — a guild whose definition
        // happens to say `political` is still a guild (slice 2's FactionSheet finding).
        factionClass: isRealm ? REALM_FACTION_CLASS : 'guild',
        factionDefId: isRealm ? 'realm.c0' : 'builders_fellowship',
      },
    });
    graph.addEdge({
      id: 'edge_controls_0', source: id, target: LOCATION_ID,
      type: 'controls', properties: { influence: 0.5, role: 'seat' },
    });
  }

  return { graph, tiles };
}

function actionAt(actorId: string): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'encounter.test',
    targetId: actorId, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

const TRACE_CTX = {
  tick: 12, actionId: 'ua_test', actorAgentId: ACTOR_ID,
  encounterId: 'encounter.test', reactionId: 'reaction-test', effectIndex: 0,
};

/** The lazy projection the dispatcher hands the binder, built from the fixture's world. */
function projectionThunk(graph: WorldGraph, tiles: HexTile[]): () => RealmProjection {
  return () => buildRealmProjection(graph, tiles);
}

const boundTraces = () =>
  getTraces().filter(t => t.category === 'aftermath_sentinel_bound') as unknown as
    Record<string, unknown>[];

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); });

// ─── Binder: $realm ────────────────────────────────────────────────────────────

describe('bindAftermathSceneTargets — $realm (THR-1155)', () => {
  it('binds the Realm the political map says holds this ground', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });

    // Non-vacuity: the projection must actually claim the actor's hex, or "bound"
    // below would be measuring a fixture that could not have failed differently.
    const projection = buildRealmProjection(graph, tiles);
    expect(projection.hexRealmId.get(`${SEAT_COL},0`)).toBe(REALM_ID);

    const effect = {
      kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1,
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    ) as unknown as { factionId: string };

    expect(bound.factionId).toBe(REALM_ID);
  });

  it('binds on targetFactionId too — the field table governs, not a per-field arm', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });
    const effect = {
      kind: 'reputation_with', targetFactionId: AFTERMATH_REALM_SENTINEL, delta: 0.1,
    } as unknown as EncounterAftermathReactionEffect;

    const bound = bindAftermathSceneTargets(
      effect, actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    ) as unknown as { targetFactionId: string };

    expect(bound.targetFactionId).toBe(REALM_ID);
  });

  it('reports the bound Realm in the trace, so a surface can be traced to its cause', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });
    bindAftermathSceneTargets(
      { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    );

    const traced = boundTraces().find(t => t.sentinel === AFTERMATH_REALM_SENTINEL);
    expect(traced).toBeDefined();
    expect(traced!.resolvedNodeId).toBe(REALM_ID);
    expect(traced!.field).toBe('factionId');
  });

  // ── Falsifier: the guild ────────────────────────────────────────────────────
  it('leaves the sentinel unbound when a guild holds the town, never binding the guild', () => {
    const { graph, tiles } = buildWorld({ holder: 'guild' });

    // The guild really does hold it — the point reader says so. If this were null the
    // arm would pass because the town is unheld, which is a different case entirely.
    expect(getLocationHolder(graph, LOCATION_ID)?.id).toBe(GUILD_ID);
    expect(getLocationHolder(graph, LOCATION_ID)?.isRealm).toBe(false);

    const bound = bindAftermathSceneTargets(
      { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    ) as unknown as { factionId: string };

    expect(bound.factionId).toBe(AFTERMATH_REALM_SENTINEL);
    expect(boundTraces().find(t => t.sentinel === AFTERMATH_REALM_SENTINEL)!.resolvedNodeId)
      .toBeNull();
  });

  // ── Falsifier: the kind gate ────────────────────────────────────────────────
  it('binds nothing on an agent field — a Realm is not a person', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });
    const bound = bindAftermathSceneTargets(
      { kind: 'reputation_score', targetAgentId: AFTERMATH_REALM_SENTINEL, delta: 1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    ) as unknown as { targetAgentId: string };

    expect(bound.targetAgentId).toBe(AFTERMATH_REALM_SENTINEL);
  });

  it('is unbound on ground no Realm claims', () => {
    const { graph, tiles } = buildWorld({ holder: 'none' });
    const bound = bindAftermathSceneTargets(
      { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    ) as unknown as { factionId: string };

    expect(bound.factionId).toBe(AFTERMATH_REALM_SENTINEL);
  });

  it('is unbound when the caller hands no projection — no second way to ask', () => {
    const { graph } = buildWorld({ holder: 'realm' });
    const bound = bindAftermathSceneTargets(
      { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX, {},
    ) as unknown as { factionId: string };

    expect(bound.factionId).toBe(AFTERMATH_REALM_SENTINEL);
  });

  it('fails soft when the projection throws — a sentinel never breaks a tick', () => {
    const { graph } = buildWorld({ holder: 'realm' });
    const exploding = () => { throw new Error('projection build failed'); };

    expect(() => bindAftermathSceneTargets(
      { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: exploding as unknown as () => RealmProjection },
    )).not.toThrow();
  });
});

// ─── Binder: $area ─────────────────────────────────────────────────────────────

describe('bindAftermathSceneTargets — $area is consumed, never bound (THR-1155)', () => {
  it('leaves the field in place on every sentinel-bearing field kind', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });
    const fields: readonly [string, string][] = [
      ['targetAgentId', 'reputation_score'],
      ['factionId', 'faction_reputation_gain'],
      ['targetLocationId', 'location_condition'],
    ];

    for (const [field, kind] of fields) {
      const bound = bindAftermathSceneTargets(
        { kind, [field]: AFTERMATH_AREA_SENTINEL } as unknown as EncounterAftermathReactionEffect,
        actionAt(ACTOR_ID), graph, TRACE_CTX,
        { realmProjection: projectionThunk(graph, tiles) },
      ) as unknown as Record<string, string>;

      expect(bound[field], `${field} should keep the unbound sentinel`)
        .toBe(AFTERMATH_AREA_SENTINEL);
    }
  });

  it('is consumed by the binder — the trace names it UNRESOLVED rather than ignoring it', () => {
    const { graph, tiles } = buildWorld({ holder: 'realm' });
    bindAftermathSceneTargets(
      { kind: 'location_condition', targetLocationId: AFTERMATH_AREA_SENTINEL } as
        unknown as EncounterAftermathReactionEffect,
      actionAt(ACTOR_ID), graph, TRACE_CTX,
      { realmProjection: projectionThunk(graph, tiles) },
    );

    // The distinction this arm holds: an *unregistered* string emits no trace at all,
    // because the binder skips it before the trace. One trace means consumed.
    const traced = boundTraces().filter(t => t.sentinel === AFTERMATH_AREA_SENTINEL);
    expect(traced).toHaveLength(1);
    expect(traced[0].resolvedNodeId).toBeNull();
  });
});

// ─── The vocabulary and the authoring gate ─────────────────────────────────────

describe('sceneSentinels — the two new members (THR-1155)', () => {
  it('recognises both as sentinels, so neither passes through as a literal id', () => {
    expect(isSceneSentinel(AFTERMATH_REALM_SENTINEL)).toBe(true);
    expect(isSceneSentinel(AFTERMATH_AREA_SENTINEL)).toBe(true);
    // The control: a literal id is still not a sentinel.
    expect(isSceneSentinel('faction_def_builders_fellowship')).toBe(false);
  });

  it('accepts $realm on a faction field and refuses it elsewhere, naming the reason', () => {
    expect(sentinelBindingRefusal('factionId', AFTERMATH_REALM_SENTINEL)).toBeNull();
    expect(sentinelBindingRefusal('targetFactionId', AFTERMATH_REALM_SENTINEL)).toBeNull();

    const onAgent = sentinelBindingRefusal('targetAgentId', AFTERMATH_REALM_SENTINEL);
    expect(onAgent).toContain('not a agent');

    // On a place field the refusal points at the sentinel that *does* answer there.
    expect(sentinelBindingRefusal('targetLocationId', AFTERMATH_REALM_SENTINEL))
      .toContain("'$here'");
  });

  it('refuses $area everywhere and redirects to the chip anchor', () => {
    for (const field of ['factionId', 'targetAgentId', 'targetLocationId'] as const) {
      const refusal = sentinelBindingRefusal(field, AFTERMATH_AREA_SENTINEL);
      expect(refusal, `${field} must refuse $area`).not.toBeNull();
      expect(refusal).toContain('chip anchor');
    }
  });
});

// ─── The agreement: a generated world ──────────────────────────────────────────

describe('$realm agrees with the map on a generated world (THR-1155)', () => {
  it('binds, for every Realm-held town, the Realm the border draws over it', async () => {
    const { initializeGameState, MAP_SIZE_PRESETS } = await import('../gameInit');
    const { generateArchetypes } = await import('../ascendant');
    const { createBalancedCosmology } = await import('../cosmology');

    const preset = MAP_SIZE_PRESETS.medium;
    const { state, tiles } = initializeGameState(
      generateArchetypes(4, 42)[0], 'realm-sentinel', createBalancedCosmology(),
      42, preset.cols, preset.rows,
    );
    const graph = state.graph;
    const projection = buildRealmProjection(graph, tiles);

    // The towns a Realm holds, from the projection itself — the population under test.
    const heldByRealm = projection.realms.flatMap(r =>
      r.heldLocationIds.map(locId => ({ realmId: r.id, locId })),
    );
    expect(heldByRealm.length, 'no Realm holds a town — the arm cannot falsify')
      .toBeGreaterThan(0);

    let checked = 0;
    const disagreements: string[] = [];

    for (const { realmId, locId } of heldByRealm) {
      const holder = getLocationHolder(graph, locId);
      // The projection and the point reader were shown to agree in slice 2; this arm is
      // about the *third* reader — the sentinel — joining them.
      if (holder?.id !== realmId) continue;

      // Stand a probe agent at the town and ask the binder what `$realm` is here.
      const probeId = `probe_${checked}`;
      graph.addNode({
        id: probeId, type: 'actor', name: 'Probe',
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: `edge.located_at.${probeId}`, source: probeId, target: locId,
        type: 'located_at', properties: {},
      });

      const bound = bindAftermathSceneTargets(
        { kind: 'faction_reputation_gain', factionId: AFTERMATH_REALM_SENTINEL, delta: 0.1 } as
          unknown as EncounterAftermathReactionEffect,
        actionAt(probeId), graph, undefined,
        { realmProjection: () => projection },
      ) as unknown as { factionId: string };

      if (bound.factionId !== realmId) {
        disagreements.push(`${locId}: sentinel ${bound.factionId} vs map ${realmId}`);
      }
      checked++;
    }

    // Measured 33 of 33 on seed 42 / medium — the same population slice 2's
    // projection-vs-point-reader arm walks. The floor is set below the measurement so
    // ordinary worldgen movement does not flake it, and far enough above zero that a
    // world which stopped minting Realms fails here instead of passing vacuously.
    expect(checked, 'no Realm-held town survived the holder check')
      .toBeGreaterThanOrEqual(20);
    expect(disagreements, `sentinel/map disagreements over ${checked} towns`).toEqual([]);
  });
});
