import { describe, it, expect, beforeAll } from 'vitest';
import { computeSettlementReaches } from '../settlementGenome/runGenome';
import { computeVitality } from '../settlementGenome/vitality';
import { WorldGraph } from '../graph';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const WARMUP_TICKS = 3;

describe('computeSettlementReaches', () => {
  it('returns non-zero gold reach when merchant faction is present via located_at', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_merchant',
      type: 'actor',
      name: 'Merchant Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { gold: 0.9, iron: 0.1 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'faction_merchant', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(reaches.gold).toBeGreaterThan(0);
  });

  // THR-1311. This assertion used to run the other way — it built a `member_of` edge from a
  // faction to a location and asserted a non-zero reach, which passed for the whole life of
  // the dead term it was covering. That is the fixture-invents-both-sides shape: the test
  // wrote an edge `EDGE_SCHEMA.member_of` forbids (it is `actor → actor`), then asserted the
  // reader consumed it, so a green test certified a path no conforming world could produce.
  // Inverted, it now pins the deletion instead of the fiction.
  it('ignores a schema-illegal member_of edge targeting a location', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_merchant',
      type: 'actor',
      name: 'Merchant Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { gold: 0.9, iron: 0.1 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'member_of', source: 'faction_merchant', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(Object.keys(reaches)).toHaveLength(0);
  });

  it('returns empty object when no factions are present', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(Object.keys(reaches)).toHaveLength(0);
  });

  it('normalizes reach values to 0-1 range', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_a',
      type: 'actor',
      name: 'Iron Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { iron: 5.0, gold: 2.0 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'faction_a', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    for (const val of Object.values(reaches)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('ignores non-faction actors', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Some Hero',
      properties: {
        actorType: 'agent',
        reachWeights: { gold: 0.9 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'agent_1', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(Object.keys(reaches)).toHaveLength(0);
  });
});

/**
 * THR-1311 — the surviving term, measured against a generated world rather than a fixture.
 *
 * Every assertion above builds its own graph, and that is precisely how the deleted
 * `member_of` loop stayed green for its whole life: a fixture that hands the reader its
 * edge can never answer the question that matters, which is whether anything in a real
 * world still *produces* the shape being read. These two run `initializeGameState` →
 * `runTick` and ask it of the live `located_at` term.
 */
describe('computeSettlementReaches — against a generated world (THR-1311)', () => {
  let state: GameState;

  beforeAll(() => {
    const runtime = createSimulationRuntime();
    const archetype = generateArchetypes(4, SEED)[0];
    const preset = MAP_SIZE_PRESETS.small ?? MAP_SIZE_PRESETS.medium;
    const { state: initState } = initializeGameState(
      archetype, 'GenomeProbe', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    );
    state = initState;
    for (let t = 0; t < WARMUP_TICKS; t++) state = runTick(state, [], runtime);
  });

  // THR-1323 — inverted from the characterization it replaced. This assertion stood as
  // `expect(withReach).toEqual([])` while `factionSeeding.ts` derived `domainCapabilities`
  // from `definition.reachWeights` and discarded the weights, so the reader's
  // `if (!weights) continue` fired on all 49 factions of a seeded world. The seeder now
  // stores the source weights and this runs in the liveness direction.
  //
  // It must stay on the generated world. Five fixture tests above assert the same function
  // and every one of them passed for the entire life of the defect, because each hands the
  // reader a `reachWeights` bag the real seeder never wrote — the shape that hid this.
  it('the reach profile is live world-wide (THR-1323)', () => {
    const locations = state.graph.getNodesByType('location');
    expect(locations.length).toBeGreaterThan(0); // guards against a vacuous pass on an empty world

    // Load-bearing: proves the harness built a real world, so a non-empty result below is
    // the property arriving and not an accident of an unusually dense graph.
    const factionEdges = locations.reduce(
      (n, loc) =>
        n +
        state.graph.getIncomingEdges(loc.id, 'located_at').filter(e => {
          const actor = state.graph.getNode(e.source);
          return !!actor && actor.properties.actorType === 'faction';
        }).length,
      0,
    );
    expect(factionEdges).toBeGreaterThan(0);

    // The seeder writes the weights the reader looks for…
    const factionsWithWeights = state.graph
      .getNodesByType('actor')
      .filter(a => a.properties.actorType === 'faction' && a.properties.reachWeights);
    expect(factionsWithWeights.length).toBeGreaterThan(0);

    // …and settlements now draw reaches from them. Measured on this harness (seed 42, small,
    // 3 ticks): 0 before the fix. Asserted as a floor, not a count — the number moves with
    // worldgen and a pinned count would rot (THR-688 rule A).
    const withReach = locations.filter(loc =>
      Object.values(computeSettlementReaches(state.graph, loc.id)).some(v => (v ?? 0) > 0),
    );
    expect(withReach.length).toBeGreaterThan(0);
  });

  // CHARACTERIZATION, NOT AN ENDORSEMENT — this asserts a defect on purpose (THR-1344).
  //
  // Storing the weights makes the *reader* live, which is all THR-1323 scoped. It does not
  // make the genome's Reach pass live at worldgen, because of an ordering the fix cannot
  // reach from `factionSeeding.ts`: `worldSeed.ts` runs the settlement genome at :1198 and
  // seeds definition factions at :1648, so at genome time no faction node exists and
  // `computeSettlementReaches` is still `{}` for every settlement being built. Re-running
  // the genome after seeding (what `phaseSettlementReassessment` does) yields 230
  // reach-sourced sublocations and 264 NPC roles on seed 42/medium — authored
  // REACH_SUBLOCATION_MENU content that no *initial* world has ever contained.
  //
  // Pinned so the gap is visible and so closing THR-1344 turns this red rather than landing
  // silently. It is also the proof that THR-1323 moved no worldgen output: zero reach-sourced
  // sublocations before the fix, zero after.
  it('characterization: the genome Reach pass is still dead at worldgen (THR-1344)', () => {
    const sublocations = state.graph
      .getNodesByType('location')
      .filter(n => n.properties.parentLocationId);
    expect(sublocations.length).toBeGreaterThan(0); // 0 of 0 is not a pass

    const reachSourced = sublocations.filter(
      s => s.properties.genomeSourcePass === 'reach',
    );
    expect(reachSourced).toEqual([]); // THR-1344 flips this to .length toBeGreaterThan(0)
  });

  it('no writer produces a location-targeted member_of edge', () => {
    const locations = state.graph.getNodesByType('location');
    expect(locations.length).toBeGreaterThan(0); // same vacuity guard — 0 of 0 is not a pass

    const offenders = locations
      .filter(loc => state.graph.getIncomingEdges(loc.id, 'member_of').length > 0)
      .map(loc => loc.id);
    expect(offenders).toEqual([]);
  });
});

describe('computeVitality', () => {
  it('returns value between 0 and 1', () => {
    const vitality = computeVitality({
      prosperity: 50,
      factionHealth: 0.8,
      threatPressure: 0.1,
      tradeActivity: 0.5,
      currentVitality: 0.5,
    });
    expect(vitality).toBeGreaterThanOrEqual(0);
    expect(vitality).toBeLessThanOrEqual(1);
  });

  it('high prosperity drives vitality up', () => {
    const low = computeVitality({
      prosperity: 20, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const high = computeVitality({
      prosperity: 90, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('threat pressure drives vitality down', () => {
    const safe = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const threatened = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0.8, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(threatened).toBeLessThan(safe);
  });

  it('clamps output to 0 when inputs push below zero', () => {
    const vitality = computeVitality({
      prosperity: 0,
      factionHealth: 0,
      threatPressure: 1,
      tradeActivity: 0,
      currentVitality: 0,
    });
    expect(vitality).toBeGreaterThanOrEqual(0);
  });

  it('clamps output to 1 when inputs push above one', () => {
    const vitality = computeVitality({
      prosperity: 100,
      factionHealth: 1,
      threatPressure: 0,
      tradeActivity: 1,
      currentVitality: 1,
    });
    expect(vitality).toBeLessThanOrEqual(1);
  });
});
