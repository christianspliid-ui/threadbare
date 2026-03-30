/**
 * Gap-fill tests: Siege regional encounter generation.
 *
 * Plan 13-03: generateRegionalEncounters spawns encounters for actors
 * within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes of the siege (call_for_aid,
 * smuggle_supplies, negotiate_terms).
 *
 * Tests document the contract for generateRegionalEncounters in siegeResolution.ts.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRegionalEncounters } from '../siegeResolution';
import type { SiegeRegionalEncounter } from '../siegeResolution';
import type { BattleState } from '../../types/battle';
import { SIEGE_REGIONAL_ENCOUNTER_RANGE } from '../../types/battle';
import type { GameState } from '../../types/gameState';
import type { SphereAffinity } from '../../types/sphereAffinity';

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(graph: WorldGraph): GameState {
  return { tick: 1, seed: 42, graph } as unknown as GameState;
}

/**
 * Add a settlement (location) node with hexCol/hexRow stored directly on properties.
 * Location nodes store their position as direct properties, not via located_at edges.
 */
function addSettlement(
  graph: WorldGraph,
  id: string,
  col: number,
  row: number,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Settlement ${id}`,
    properties: { locationSubtype: 'town', hexCol: col, hexRow: row },
  });
}

/**
 * Add a hex location node at (col, row). Used as actor position targets.
 */
function addHex(graph: WorldGraph, id: string, col: number, row: number): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Hex ${id}`,
    properties: { hexCol: col, hexRow: row, terrain: 'plains' },
  });
}

/**
 * Add a faction node.
 */
function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Faction ${id}`,
    properties: { actorType: 'faction' },
  });
}

/**
 * Add an actor (individual agent) node at the given hex, optionally with a faction.
 */
function addActor(
  graph: WorldGraph,
  id: string,
  hexId: string,
  opts: {
    factionId?: string;
    sphereAffinity?: SphereAffinity;
    battleState?: BattleState;
  } = {},
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Actor ${id}`,
    properties: {
      actorType: 'individual',
      ...(opts.sphereAffinity ? { sphereAffinity: opts.sphereAffinity } : {}),
      ...(opts.battleState ? { battleState: opts.battleState } : {}),
    },
  });
  graph.addEdge({
    id: `e_loc_${id}`,
    source: id,
    target: hexId,
    type: 'located_at',
    properties: {},
  });
  if (opts.factionId) {
    graph.addEdge({
      id: `e_member_${id}`,
      source: id,
      target: opts.factionId,
      type: 'member_of',
      properties: { role: 'agent', rank: 'member', joinedTick: 0 },
    });
  }
}

/**
 * Build a minimal SphereAffinity with all scores zero except the given overrides.
 */
function makeSphereAffinity(overrides: Partial<Record<string, number>> = {}): SphereAffinity {
  const SPHERE_NAMES = [
    'Force', 'Life', 'Mind', 'Soul',
    'Fire', 'Water', 'Stone', 'Wind',
    'Shadow', 'Heart', 'Gold', 'Eye',
  ] as const;
  const scores = Object.fromEntries(SPHERE_NAMES.map(s => [s, overrides[s] ?? 0])) as Record<string, number>;
  const progress = Object.fromEntries(SPHERE_NAMES.map(s => [s, 0])) as Record<string, number>;
  return { scores, progress } as SphereAffinity;
}

/**
 * Build a minimal siege BattleState.
 * settlementId defaults to 'settlement1', defenderArmyId to 'settlement1'.
 */
function makeSiegeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    battleType: 'siege',
    momentum: 0,
    backgroundProse: '',
    spotlightHistory: [],
    ticksSinceLastSpotlight: 0,
    startedTick: 0,
    settlementId: 'settlement1',
    initialMomentumOffset: 0,
    attackerArmyId: 'army_attacker',
    defenderArmyId: 'faction_defender',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateRegionalEncounters — siege pull mechanics', () => {
  it('finds no eligible actors when no actors are within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes', () => {
    const graph = new WorldGraph();
    // Settlement at (10, 10) — hexCol/hexRow stored directly on location node
    addSettlement(graph, 'settlement1', 10, 10);

    // Actor at (10 + RANGE + 5, 10) — well out of range
    const farCol = 10 + SIEGE_REGIONAL_ENCOUNTER_RANGE + 5;
    addHex(graph, 'hex_far', farCol, 10);
    addActor(graph, 'actor_far', 'hex_far');

    // Attacker army node (no member_of needed for this test)
    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    const siegeState = makeSiegeState();
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    expect(result).toHaveLength(0);
  });

  it('spawns siege.regional.call_for_aid for allied faction actors within range', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'settlement1', 10, 10);
    addFaction(graph, 'faction_defender');

    // Defender army with member_of edge to faction_defender
    graph.addNode({ id: 'army_defender', type: 'actor', name: 'Defender Army', properties: { actorType: 'group', armyState: {} } });
    graph.addEdge({ id: 'e_defender_faction', source: 'army_defender', target: 'faction_defender', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });

    // Actor within range and member of defender faction
    addHex(graph, 'hex_ally', 11, 10); // distance 1 — well within range
    addActor(graph, 'actor_ally', 'hex_ally', { factionId: 'faction_defender' });

    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    const siegeState = makeSiegeState({ defenderArmyId: 'army_defender' });
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    expect(result).toHaveLength(1);
    const enc = result[0] as SiegeRegionalEncounter;
    expect(enc.encounterType).toBe('siege.regional.call_for_aid');
    expect(enc.actorId).toBe('actor_ally');
    expect(enc.siegeSettlementId).toBe('settlement1');
  });

  it('spawns siege.regional.smuggle_supplies for Shadow-capable agents within range', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'settlement1', 10, 10);
    addFaction(graph, 'faction_defender');
    addFaction(graph, 'faction_neutral');

    // Actor within range, different faction, Shadow > 0
    addHex(graph, 'hex_shadow', 12, 10); // distance 2
    addActor(graph, 'actor_shadow', 'hex_shadow', {
      factionId: 'faction_neutral',
      sphereAffinity: makeSphereAffinity({ Shadow: 3 }),
    });

    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    const siegeState = makeSiegeState({ defenderArmyId: 'faction_defender' });
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    expect(result).toHaveLength(1);
    const enc = result[0] as SiegeRegionalEncounter;
    expect(enc.encounterType).toBe('siege.regional.smuggle_supplies');
    expect(enc.actorId).toBe('actor_shadow');
  });

  it('spawns siege.regional.negotiate_terms for Heart-capable agents within range', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'settlement1', 10, 10);
    addFaction(graph, 'faction_defender');
    addFaction(graph, 'faction_neutral');

    // Actor within range, different faction, Shadow=0, Heart > 0
    addHex(graph, 'hex_heart', 13, 10); // distance 3
    addActor(graph, 'actor_heart', 'hex_heart', {
      factionId: 'faction_neutral',
      sphereAffinity: makeSphereAffinity({ Shadow: 0, Heart: 2 }),
    });

    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    const siegeState = makeSiegeState({ defenderArmyId: 'faction_defender' });
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    expect(result).toHaveLength(1);
    const enc = result[0] as SiegeRegionalEncounter;
    expect(enc.encounterType).toBe('siege.regional.negotiate_terms');
    expect(enc.actorId).toBe('actor_heart');
  });

  it('does not spawn duplicate regional encounters for the same actor in the same siege', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'settlement1', 10, 10);
    addFaction(graph, 'faction_defender');

    // Actor within range and allied to defender
    addHex(graph, 'hex_ally', 11, 10);
    addActor(graph, 'actor_ally', 'hex_ally', { factionId: 'faction_defender' });

    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    // actor_ally is already in spotlightHistory — should be skipped
    const siegeState = makeSiegeState({
      defenderArmyId: 'faction_defender',
      spotlightHistory: ['actor_ally'],
    });
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    expect(result).toHaveLength(0);
  });

  it('does not spawn encounters for actors already participating in a battle', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'settlement1', 10, 10);
    addFaction(graph, 'faction_defender');

    // Defender army with member_of edge to faction_defender
    graph.addNode({ id: 'army_defender', type: 'actor', name: 'Defender Army', properties: { actorType: 'group', armyState: {} } });
    graph.addEdge({ id: 'e_defender_faction', source: 'army_defender', target: 'faction_defender', type: 'member_of', properties: { role: 'army', rank: 'army', joinedTick: 0 } });

    // Actor within range but already in a battle
    const battlingBattleState: BattleState = {
      battleType: 'field_battle',
      momentum: 0,
      backgroundProse: '',
      spotlightHistory: [],
      ticksSinceLastSpotlight: 0,
      startedTick: 0,
      initialMomentumOffset: 0,
      attackerArmyId: 'other_army',
      defenderArmyId: 'another_army',
    };
    addHex(graph, 'hex_battling', 11, 10);
    addActor(graph, 'actor_battling', 'hex_battling', {
      factionId: 'faction_defender',
      battleState: battlingBattleState,
    });

    // Another actor within range and NOT in a battle
    addHex(graph, 'hex_free', 12, 10);
    addActor(graph, 'actor_free', 'hex_free', { factionId: 'faction_defender' });

    graph.addNode({ id: 'army_attacker', type: 'actor', name: 'Attacker', properties: { actorType: 'group', armyState: {} } });

    const state = makeState(graph);
    const siegeState = makeSiegeState({ defenderArmyId: 'army_defender' });
    const rng = mulberry32(42);

    const result = generateRegionalEncounters(state, siegeState, rng);
    // actor_battling should be excluded; actor_free should be included
    expect(result.find(r => r.actorId === 'actor_battling')).toBeUndefined();
    expect(result.find(r => r.actorId === 'actor_free')).toBeDefined();
  });
});
