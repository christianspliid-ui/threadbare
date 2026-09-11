/**
 * Conquest — THR-1155 slice 2, step 3: the one runtime producer of a faction's
 * `controls` edge.
 *
 * Before this, a won siege at total severity ran a power vacuum: the defender's edges
 * were deleted and the town was left nobody's. The projection built in step 2 could
 * therefore only ever *shrink* a Realm's border, and *{Realm} takes {Location}* was a
 * chronicle line with no producer anywhere in the engine.
 *
 * The property these tests hold is not "the function writes an edge" — that is the
 * function restating itself. It is that **the political map moves**: the same
 * `buildRealmProjection` the red border renders from is asked before and after, and the
 * hexes are in different hands. That is why the projection is the assertion surface
 * here rather than a screenshot, and it is what makes the constructed-siege Done-when
 * reachable at all.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyConquestOrVacuum } from '../battleAftermath';
import { buildRealmProjection } from '../realmProjection';
import { createSimulationRuntime } from '../simulationRuntime';
import { enableTracing, clearTraces, getTraces, disableTracing } from '../traceBuffer';
import { phaseArmyNotifications } from '../armyNotifications';
import { REALM_FILL_RADIUS, REALM_TERRITORY_EVENT_SIGNIFICANCE } from '../../data/realm-content';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';

const TICK = 40;

/**
 * Two Realms, one town each, far enough apart that every claimed hex belongs to exactly
 * one of them — so a hex changing hands is unambiguous rather than a tie-break artifact.
 * Each Realm fields one army. Built rather than generated because the case under test is
 * a *contested* conquest between two named Realms, which worldgen does not stage.
 */
function buildWar(): { state: GameState; tiles: HexTile[] } {
  const graph = new WorldGraph();
  const separation = 2 * REALM_FILL_RADIUS + 2;
  const cols = separation + 2 * REALM_FILL_RADIUS + 4;
  const tiles: HexTile[] = [];
  for (let col = 0; col < cols; col++) {
    tiles.push({
      coord: { col, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    });
  }

  const seats = [REALM_FILL_RADIUS + 1, REALM_FILL_RADIUS + 1 + separation];
  seats.forEach((seatCol, i) => {
    graph.addNode({
      id: `faction_${i}`,
      type: 'actor',
      name: `Realm ${i}`,
      properties: { actorType: 'faction', factionClass: 'realm', factionDefId: `realm.c${i}` },
    });
    graph.addNode({
      id: `loc_${i}`,
      type: 'location',
      name: `Town ${i}`,
      properties: { locationSubtype: 'town', hexCol: seatCol, hexRow: 0 },
    });
    graph.addEdge({
      id: `edge_controls_${i}`,
      source: `faction_${i}`,
      target: `loc_${i}`,
      type: 'controls',
      properties: { influence: 0.5, role: 'seat' },
    });
    graph.addNode({
      id: `army_${i}`,
      type: 'actor',
      name: `Host ${i}`,
      properties: { actorType: 'group', groupKind: 'army' },
    });
    graph.addEdge({
      id: `edge_member_${i}`,
      source: `army_${i}`,
      target: `faction_${i}`,
      type: 'member_of',
      properties: { role: 'host', rank: 0.5, joinedTick: 0 },
    });
  });

  return { state: { graph, tick: TICK } as unknown as GameState, tiles };
}

const factionHolderOf = (graph: WorldGraph, locId: string): string | null =>
  graph.getIncomingEdges(locId, 'controls')
    .find(e => graph.getNode(e.source)?.properties.actorType === 'faction')?.source ?? null;

const territoryTraces = () =>
  getTraces().filter(t => t.category === 'realm_territory_change') as unknown as
    Record<string, unknown>[];

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); });

describe('applyConquestOrVacuum — the political map moves (THR-1155)', () => {
  it('hands the sacked town to the victor\'s Realm, and the border follows it', () => {
    const { state, tiles } = buildWar();
    const graph = state.graph;

    const before = buildRealmProjection(graph, tiles);
    const beforeHexes = new Map(before.hexRealmId);
    // Non-vacuity: if Realm 1 held no ground to lose, every assertion below would pass
    // for the wrong reason.
    const lostGround = before.realms.find(r => r.id === 'faction_1');
    expect(lostGround?.hexes.length).toBeGreaterThan(0);

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    expect(factionHolderOf(graph, 'loc_1')).toBe('faction_0');

    const after = buildRealmProjection(graph, tiles);
    // The map, not the edge: the hexes Realm 1 held are Realm 0's now.
    const moved = [...beforeHexes.entries()]
      .filter(([hex, realmId]) => realmId === 'faction_1' && after.hexRealmId.get(hex) === 'faction_0');
    expect(moved.length).toBe(lostGround!.hexes.length);
    expect(after.realms.find(r => r.id === 'faction_1')).toBeUndefined();
  });

  it('retargets the existing edge rather than deleting and re-adding it', () => {
    const { state } = buildWar();
    const graph = state.graph;

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    // The edge id is the audit trail — a delete-and-add would lose it, and with it any
    // chance of asking later how this town came to be held.
    const edge = graph.getIncomingEdges('loc_1', 'controls')[0];
    expect(edge.id).toBe('edge_controls_1');
    expect(edge.source).toBe('faction_0');
    expect(edge.properties.via).toBe('conquest');
    expect(edge.properties.establishedTick).toBe(TICK);
    // Merged, not replaced: what the holding was worth survives the change of hands.
    expect(edge.properties.influence).toBe(0.5);
  });

  it('re-seats both courts, so a conquest never moves a capital by accident', () => {
    const { state } = buildWar();
    const graph = state.graph;

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    // `role: 'seat'` rides on the edge, so the naive retarget hands the loser's court to
    // the victor: Realm 0 would hold two seats and Realm 1 none. Both are re-stamped.
    const seatsOfVictor = graph.getOutgoingEdges('faction_0', 'controls')
      .filter(e => e.properties.role === 'seat');
    expect(seatsOfVictor).toHaveLength(1);
    expect(seatsOfVictor[0].target).toBe('loc_0');

    // The dispossessed Realm holds nothing, so it has no seat — a fact, not a throw.
    expect(graph.getOutgoingEdges('faction_1', 'controls')).toHaveLength(0);
    expect(territoryTraces()[0].seatMoved).toBe(true);
  });

  it('claims ground nobody held — the rule is *takes it*, not *takes it from someone*', () => {
    const { state } = buildWar();
    const graph = state.graph;
    graph.removeEdge('edge_controls_1');

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    expect(factionHolderOf(graph, 'loc_1')).toBe('faction_0');
    const trace = territoryTraces()[0];
    expect(trace.outcome).toBe('claimed');
    expect(trace.fromFactionId).toBeNull();
  });

  it('writes nothing when the victor already holds the town', () => {
    const { state } = buildWar();
    const graph = state.graph;
    const before = graph.getIncomingEdges('loc_0', 'controls')[0].properties.establishedTick;

    applyConquestOrVacuum(state, 'loc_0', 'army_0');

    expect(graph.getIncomingEdges('loc_0', 'controls')[0].properties.establishedTick).toBe(before);
    expect(territoryTraces()[0].outcome).toBe('retained');
  });

  it('falls into the vacuum when the victor army belongs to no faction', () => {
    const { state } = buildWar();
    const graph = state.graph;
    graph.addNode({ id: 'horde', type: 'actor', name: 'Horde', properties: { actorType: 'group', groupKind: 'army' } });

    applyConquestOrVacuum(state, 'loc_1', 'horde');

    // Unchanged behaviour, deliberately: a monster horde sacks a town, it does not rule it.
    expect(factionHolderOf(graph, 'loc_1')).toBeNull();
    const trace = territoryTraces()[0];
    expect(trace.outcome).toBe('vacated');
    expect(trace.toFactionId).toBeNull();
  });

  it('leaves a mortal\'s strategic hold alone (THR-1448 owns that question)', () => {
    const { state } = buildWar();
    const graph = state.graph;
    graph.addNode({ id: 'mortal_1', type: 'actor', name: 'Holder', properties: { actorType: 'individual' } });
    graph.addEdge({
      id: 'edge_hold', source: 'mortal_1', target: 'loc_1',
      type: 'controls', properties: { controlType: 'strategic' },
    });

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    // The hold is a commitment to the town, not to the faction that holds it — so it
    // survives the town changing hands untouched.
    const hold = graph.getOutgoingEdges('mortal_1', 'controls');
    expect(hold).toHaveLength(1);
    expect(hold[0].properties.controlType).toBe('strategic');
    expect(hold[0].properties.via).toBeUndefined();
  });

  it('bumps structuralCacheVersion, so the projection rebuilds on the version and not the belt', () => {
    const { state } = buildWar();
    const runtime = createSimulationRuntime();
    const versionBefore = runtime.structuralCacheVersion;

    applyConquestOrVacuum(state, 'loc_1', 'army_0', runtime);

    expect(runtime.structuralCacheVersion).toBeGreaterThan(versionBefore);
  });

  it('does not bump when nothing was written', () => {
    const { state } = buildWar();
    const runtime = createSimulationRuntime();
    const versionBefore = runtime.structuralCacheVersion;

    // Falsification arm for the bump above: if `touchStructure` fired unconditionally,
    // the assertion that it fires on a conquest would prove nothing at all.
    applyConquestOrVacuum(state, 'loc_0', 'army_0', runtime);

    expect(runtime.structuralCacheVersion).toBe(versionBefore);
  });

  it('emits exactly one line, naming both Realms and the town', () => {
    const { state } = buildWar();

    applyConquestOrVacuum(state, 'loc_1', 'army_0');

    const traces = territoryTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].summary).toBe('Realm 0 takes Town 1 from Realm 1');
    expect(traces[0].locationId).toBe('loc_1');
    expect(traces[0].fromFactionId).toBe('faction_1');
    expect(traces[0].toFactionId).toBe('faction_0');
    expect(traces[0].victorArmyId).toBe('army_0');
  });
});

describe('the chronicle line — *takes* / *loses* reaches the feed (THR-1155)', () => {
  /**
   * `phaseArmyNotifications` is the phase that already runs right after `battle_tick`
   * and already turns war traces into readable lines, so the territory line is read
   * there rather than in a phase of its own. These assertions drive the real conquest
   * and the real phase — nothing is hand-fed a trace.
   */
  const runNotifications = (state: GameState) => {
    let n = 0;
    return phaseArmyNotifications(state, () => `ev_${n++}`);
  };

  it('names the line after the conquest that produced it, with both Realms as refs', () => {
    const { state } = buildWar();
    (state as unknown as { tickEvents: unknown[] }).tickEvents = [];

    applyConquestOrVacuum(state, 'loc_1', 'army_0');
    const update = runNotifications(state);

    const events = (update.tickEvents ?? []).filter(e => e.type === 'realm_territory_change');
    expect(events).toHaveLength(1);
    expect(events[0].message).toBe('Realm 0 takes Town 1 from Realm 1');
    expect(events[0].significance).toBe(REALM_TERRITORY_EVENT_SIGNIFICANCE);

    // Law 2 — the producer declares. A chronicle surface links these; none parses the
    // sentence to find out what the line is about.
    const refs = events[0].refs ?? [];
    expect(refs.map(r => r.id).sort()).toEqual(['faction_0', 'faction_1', 'loc_1']);
    expect(refs.find(r => r.id === 'loc_1')?.kind).toBe('location');
    expect(refs.find(r => r.id === 'faction_0')?.kind).toBe('faction');
  });

  it('says nothing when the victor already held the town', () => {
    const { state } = buildWar();
    (state as unknown as { tickEvents: unknown[] }).tickEvents = [];

    // Falsification arm for the line above: a producer that emitted on every aftermath
    // would fill the feed with non-news on every double resolution, and the assertion
    // that a conquest produces a line would prove nothing about conquest.
    applyConquestOrVacuum(state, 'loc_0', 'army_0');
    const update = runNotifications(state);

    expect((update.tickEvents ?? []).filter(e => e.type === 'realm_territory_change')).toHaveLength(0);
  });
});

describe('the runtime reaches the war path (THR-1155)', () => {
  /**
   * The unit arms above pass the runtime to `applyConquestOrVacuum` directly, which
   * proves the function bumps but *not* that anything ever hands it a runtime. That is
   * the half that actually failed on `main`: the war phases were called as
   * `phaseBattleTick(s)` with no runtime at all, so a conquest would have moved an edge
   * and left the projection stale behind it — right only by the fingerprint belt, one
   * read late, with a `reason: 'fingerprint'` line saying a writer forgot.
   *
   * So this arm enters at the phase, the way the orchestrator does, and asserts the
   * rebuild reason as well as the border: `'version'` is the healthy path, and a
   * `'fingerprint'` here would mean the threading is decorative.
   */
  it('bumps and rebuilds on the version when entered at phaseBattleTick', async () => {
    const { state, tiles } = buildWar();
    const graph = state.graph;
    const runtime = createSimulationRuntime();
    (state as unknown as { tiles: HexTile[] }).tiles = tiles;

    // A battle the attacker has already won: the defender army node is gone, which is
    // the branch `tickBattle` resolves immediately. Momentum and the absent loser put
    // the severity at `total` — the sack threshold.
    graph.addNode({
      id: 'battle_1',
      type: 'actor',
      name: 'The Fall of Town 1',
      properties: {
        actorType: 'group',
        groupKind: 'battle',
        battleState: {
          battleType: 'field_battle',
          momentum: 10,
          backgroundProse: '',
          spotlightHistory: [],
          ticksSinceLastSpotlight: 0,
          startedTick: 0,
          initialMomentumOffset: 0,
          attackerArmyId: 'army_0',
          defenderArmyId: 'army_gone',
          settlementId: 'loc_1',
        },
      },
    });

    const { ensureRealmProjection } = await import('../simulationRuntime');
    const before = ensureRealmProjection(runtime, graph, tiles, TICK);
    expect(before.realms.find(r => r.id === 'faction_1')?.hexes.length).toBeGreaterThan(0);
    clearTraces();

    const { phaseBattleTick } = await import('../battleResolution');
    phaseBattleTick(state, runtime);

    expect(factionHolderOf(graph, 'loc_1')).toBe('faction_0');

    const after = ensureRealmProjection(runtime, graph, tiles, TICK);
    expect(after.realms.find(r => r.id === 'faction_1')).toBeUndefined();

    const rebuilds = getTraces()
      .filter(t => t.category === 'realm_projection_rebuilt') as unknown as Record<string, unknown>[];
    expect(rebuilds).toHaveLength(1);
    expect(rebuilds[0].reason).toBe('version');
  });
});
