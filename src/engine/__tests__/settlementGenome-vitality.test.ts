import { describe, it, expect, beforeAll } from 'vitest';
import { computeSettlementReaches } from '../settlementGenome/runGenome';
import { computeVitality } from '../settlementGenome/vitality';
import { SUBLOCATION_BUDGET } from '../settlementGenome/constants';
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

  // THR-1344 — inverted from the characterization it replaced, which read
  // `expect(reachSourced).toEqual([])` and was green for the entire life of the defect.
  //
  // THR-1323 made the *reader* live; it could not make the Reach pass live, because the
  // cause was an ordering no edit in `factionSeeding.ts` can reach. `worldSeed.ts` ran the
  // settlement genome upstream of both culture assignment and faction seeding, so Passes 2
  // and 4 evaluated against a graph holding neither, and contributed nothing to any world
  // this seeder ever built. THR-1344 adds a second genome pass at the tail of the seeder,
  // where those inputs finally exist.
  //
  // This has to read *materialized nodes*, never a return value. Calling
  // `runSettlementGenome` by hand after seeding is exactly the condition worldgen did not
  // meet, so a green assertion on its return would prove nothing about a generated world —
  // the second-order form of the fixture trap that hid THR-1323 for its whole life.
  it('the genome Reach pass contributes to generated worlds (THR-1344)', () => {
    const sublocations = state.graph
      .getNodesByType('location')
      .filter(n => n.properties.parentLocationId);
    expect(sublocations.length).toBeGreaterThan(0); // 0 of 0 is not a pass

    const reachSourced = sublocations.filter(
      s => s.properties.genomeSourcePass === 'reach',
    );
    // Floor, not a count — the number moves with worldgen and a pinned count rots
    // (THR-688 rule A). Measured 0 before this fix on every seed tried; 127 here.
    expect(reachSourced.length).toBeGreaterThan(0);
  });

  // The same ordering starved Pass 2, which the THR-1344 ticket did not name because the
  // measurement that found it was reading `genomeSourcePass === 'reach'`. Culture
  // assignment runs ~35 lines *after* the eager genome pass, so `cultureId` was null for
  // every settlement and CULTURE_BASELINE_MAP's substitutions and additions never applied.
  // Pinned here so the second pass cannot be narrowed back to Reach alone without a red test.
  it('the genome Culture pass contributes to generated worlds (THR-1344)', () => {
    const sublocations = state.graph
      .getNodesByType('location')
      .filter(n => n.properties.parentLocationId);
    expect(sublocations.length).toBeGreaterThan(0);

    const cultureSourced = sublocations.filter(
      s => s.properties.genomeSourcePass === 'culture',
    );
    expect(cultureSourced.length).toBeGreaterThan(0); // measured 0 before, 29 here
  });

  // `settlementReachProfile` is the field THR-1323 called dead. It was written on every
  // genome result all along — always as `{}`, because Pass 4 computed it from a graph with
  // no factions in it. Asserting the stored property rather than a fresh call is the point:
  // this is what `proseResolvers` and any future reader actually see.
  it('a generated world stores a non-empty settlementReachProfile (THR-1344)', () => {
    const settlements = state.graph
      .getNodesByType('location')
      .filter(n => !n.properties.parentLocationId && n.properties.genomeResult);
    expect(settlements.length).toBeGreaterThan(0);

    const withProfile = settlements.filter(s => {
      const result = s.properties.genomeResult as { settlementReachProfile?: object };
      return Object.keys(result.settlementReachProfile ?? {}).length > 0;
    });
    expect(withProfile.length).toBeGreaterThan(0); // measured 0 before, 14 here
  });

  // THR-1344 — the volume gate. Passes 2–4 are additive by construction and nothing
  // subtracted, which was invisible while two of the three were dead. Uncapped on
  // seed 42 / medium the day the Reach pass went live: capitals at 38 sublocations.
  //
  // Two arms, because the bound alone would pass vacuously if enforcement were deleted and
  // no settlement ever reached the cap. The second arm proves the trim branch actually
  // executes on this world.
  it('no settlement exceeds its tier sublocation budget, and the budget binds (THR-1344)', () => {
    const settlements = state.graph
      .getNodesByType('location')
      .filter(n => !n.properties.parentLocationId && n.properties.genomeResult);
    expect(settlements.length).toBeGreaterThan(0);

    const rows = settlements.map(s => {
      const tier = s.properties.locationSubtype as string;
      const result = s.properties.genomeResult as {
        sublocations: { sourcePass: string }[];
      };
      // Archetype capstones are added after enforcement and sit above the cap by design —
      // a capstone is the settlement's identity, not a contribution competing for room.
      const discretionary = result.sublocations.filter(x => x.sourcePass !== 'archetype').length;
      return { tier, discretionary, cap: SUBLOCATION_BUDGET[tier] ?? SUBLOCATION_BUDGET.hamlet };
    });

    // Spans more than one tier, so a single-tier world cannot pass this by accident.
    expect(new Set(rows.map(r => r.tier)).size).toBeGreaterThan(1);

    expect(rows.filter(r => r.discretionary > r.cap)).toEqual([]);
    // …and at least one settlement sits exactly at its cap, which only a settlement that
    // was actually trimmed can do. Delete the enforcement block and this goes red even
    // though the bound above would still hold.
    expect(rows.some(r => r.discretionary === r.cap)).toBe(true);
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
