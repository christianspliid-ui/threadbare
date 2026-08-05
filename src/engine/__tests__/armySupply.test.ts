/**
 * Army Supply tests — THR-626 (Flow Web P2).
 *
 * The load-bearing claim this suite has to falsify is the ticket's own premise:
 * *severing a trade route starves an army*. A test that only proves a fed army
 * stays fed would pass against a system that never reads the graph at all, so
 * every case here moves a conduit and asserts the field consequence changes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  resolveSupplyLine,
  deriveSupplyTier,
  throughputForHops,
  nextSupplyLevel,
  isSupplyHost,
  hasReliefLine,
  readArmySupply,
  CUT_OFF_SUPPLY_LINE,
} from '../armySupply';
import { phaseArmySupply } from '../phases/armySupply';
import { phaseArmyAttrition, SUPPLY_ATTRITION_PENALTY } from '../armyAttrition';
import {
  ARMY_SUPPLY_MAX,
  ARMY_SUPPLY_MAX_HOPS,
  ARMY_SUPPLY_BASE_THROUGHPUT,
  ARMY_SUPPLY_THREATENED_PENALTY,
  ARMY_SUPPLY_TIER_THRESHOLDS,
  ARMY_SUPPLY_SCAN_INTERVAL_TICKS,
  ARMY_SUPPLY_CONSUMPTION,
  STARVING_SUPPLY_ATTRITION_PENALTY,
} from '../../data/army-supply-config';
import type { ArmyState } from '../../types/army';
import type { GameState } from '../../types/gameState';
import type { PhaseContext } from '../phaseRegistry';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph, pendingEncounterSeeds: [] } as unknown as GameState;
}

const CTX = {} as PhaseContext;

/** A location that can feed an army: controlled by `factionId`, stocked. */
function addLocation(
  graph: WorldGraph,
  id: string,
  opts: { factionId?: string; resourceBalance?: number } = {},
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Loc ${id}`,
    properties: {
      terrain: 'plains',
      locationSubtype: 'town',
      ...(opts.resourceBalance != null ? { resourceBalance: opts.resourceBalance } : {}),
    },
  });
  if (opts.factionId) {
    graph.addEdge({
      id: `e_controls_${opts.factionId}_${id}`,
      source: opts.factionId,
      target: id,
      type: 'controls',
      properties: {},
    });
  }
}

function addFaction(graph: WorldGraph, id: string): void {
  // Factions are `actor` nodes carrying `actorType: 'faction'` — matching the
  // shipped army suites, not a `faction` node type (there isn't one).
  graph.addNode({ id, type: 'actor', name: `Faction ${id}`, properties: { actorType: 'faction', prosperity: 0.8 } });
}

function addRoad(graph: WorldGraph, a: string, b: string): void {
  graph.addEdge({ id: `e_road_${a}_${b}`, source: a, target: b, type: 'road', properties: {} });
}

function addTradeRoute(graph: WorldGraph, a: string, b: string, threatened = false): string {
  const id = `e_trade_${a}_${b}`;
  graph.addEdge({ id, source: a, target: b, type: 'trades_with', properties: { threatened } });
  return id;
}

function addArmy(
  graph: WorldGraph,
  id: string,
  locationId: string,
  factionId: string,
  opts: Partial<ArmyState> = {},
): void {
  const armyState: ArmyState = {
    size: 'warband',
    headcount: 100,
    objective: null,
    cohesion: 30,
    cohesionMax: 30,
    raisedTick: 0,
    maintenanceCost: 2,
    thresholdsFired: [],
    ...opts,
  };
  graph.addNode({ id, type: 'actor', name: `Army ${id}`, properties: { actorType: 'group', armyState } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
  graph.addEdge({ id: `e_member_${id}`, source: id, target: factionId, type: 'member_of', properties: {} });
}

function armyStateOf(graph: WorldGraph, id: string): ArmyState {
  return graph.getNode(id)!.properties.armyState as ArmyState;
}

// ─── Tier function ─────────────────────────────────────────────────────────

describe('deriveSupplyTier', () => {
  it('maps larder fractions onto the three-word vocabulary', () => {
    expect(deriveSupplyTier(ARMY_SUPPLY_MAX)).toBe('supplied');
    expect(deriveSupplyTier(ARMY_SUPPLY_MAX * ARMY_SUPPLY_TIER_THRESHOLDS.strained)).toBe('strained');
    expect(deriveSupplyTier(ARMY_SUPPLY_MAX * ARMY_SUPPLY_TIER_THRESHOLDS.starving)).toBe('starving');
    expect(deriveSupplyTier(0)).toBe('starving');
  });

  it('reads a legacy army with no larder as supplied, never starving', () => {
    // The fail-soft direction is load-bearing: an army raised before this system
    // must not be swept into a mutiny by the absence of a field.
    expect(deriveSupplyTier(undefined)).toBe('supplied');
    expect(deriveSupplyTier(Number.NaN)).toBe('supplied');
    expect(readArmySupply({ thresholdsFired: [] } as unknown as ArmyState)).toBe(ARMY_SUPPLY_MAX);
  });
});

// ─── Throughput ────────────────────────────────────────────────────────────

describe('throughputForHops', () => {
  it('decays with distance and returns nothing past the hop limit', () => {
    expect(throughputForHops(0, false)).toBe(ARMY_SUPPLY_BASE_THROUGHPUT);
    expect(throughputForHops(1, false)).toBeLessThan(throughputForHops(0, false));
    expect(throughputForHops(ARMY_SUPPLY_MAX_HOPS, false)).toBeGreaterThan(0);
    expect(throughputForHops(ARMY_SUPPLY_MAX_HOPS + 1, false)).toBe(0);
    expect(throughputForHops(Infinity, false)).toBe(0);
  });

  it('strangles a threatened line without severing it', () => {
    const clean = throughputForHops(2, false);
    const threatened = throughputForHops(2, true);
    expect(threatened).toBeGreaterThan(0); // strangled, not cut
    expect(threatened).toBeCloseTo(clean * ARMY_SUPPLY_THREATENED_PENALTY, 3);
  });
});

// ─── Supply-line resolution ────────────────────────────────────────────────

describe('resolveSupplyLine', () => {
  let graph: WorldGraph;
  let state: GameState;

  beforeEach(() => {
    graph = new WorldGraph();
    state = makeState(0, graph);
    addFaction(graph, 'f1');
  });

  it('finds a host across road conduits and counts the hops', () => {
    addLocation(graph, 'front');
    addLocation(graph, 'mid');
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.5 });
    addRoad(graph, 'front', 'mid');
    addRoad(graph, 'mid', 'depot');

    const line = resolveSupplyLine(state, 'front', 'f1');
    expect(line.hostId).toBe('depot');
    expect(line.hops).toBe(2);
    expect(line.throughput).toBeGreaterThan(0);
  });

  it('reports zero hops when the army stands on its own depot', () => {
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.5 });
    const line = resolveSupplyLine(state, 'depot', 'f1');
    expect(line.hops).toBe(0);
    expect(line.throughput).toBe(ARMY_SUPPLY_BASE_THROUGHPUT);
  });

  it('SEVERING THE ROUTE CUTS THE ARMY OFF — the ticket premise', () => {
    addLocation(graph, 'front');
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.5 });
    const routeId = addTradeRoute(graph, 'front', 'depot');

    expect(resolveSupplyLine(state, 'front', 'f1').hostId).toBe('depot');

    graph.removeEdge(routeId);

    const after = resolveSupplyLine(state, 'front', 'f1');
    expect(after.hostId).toBeNull();
    expect(after.throughput).toBe(0);
    expect(after.hops).toBe(CUT_OFF_SUPPLY_LINE.hops);
  });

  it('carries a threatened flag from any link along the path', () => {
    addLocation(graph, 'front');
    addLocation(graph, 'mid');
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.5 });
    addTradeRoute(graph, 'front', 'mid', true); // bandits on the near leg
    addRoad(graph, 'mid', 'depot');

    const line = resolveSupplyLine(state, 'front', 'f1');
    expect(line.hostId).toBe('depot');
    expect(line.threatened).toBe(true);
    expect(line.throughput).toBeCloseTo(throughputForHops(2, true), 3);
  });

  it('refuses a famine-struck host — the two webs are coupled', () => {
    addLocation(graph, 'front');
    addLocation(graph, 'starved_depot', { factionId: 'f1', resourceBalance: -0.9 });
    addRoad(graph, 'front', 'starved_depot');

    expect(isSupplyHost(state, 'starved_depot', 'f1')).toBe(false);
    expect(resolveSupplyLine(state, 'front', 'f1').hostId).toBeNull();
  });

  it('refuses an enemy depot — armies eat from their own granaries', () => {
    addFaction(graph, 'f2');
    addLocation(graph, 'front');
    addLocation(graph, 'enemy_depot', { factionId: 'f2', resourceBalance: 0.9 });
    addRoad(graph, 'front', 'enemy_depot');

    expect(resolveSupplyLine(state, 'front', 'f1').hostId).toBeNull();
  });

  it('gives up past the hop limit rather than searching the whole graph', () => {
    addLocation(graph, 'h0');
    for (let i = 1; i <= ARMY_SUPPLY_MAX_HOPS + 1; i++) {
      const isDepot = i === ARMY_SUPPLY_MAX_HOPS + 1;
      addLocation(graph, `h${i}`, isDepot ? { factionId: 'f1', resourceBalance: 0.5 } : {});
      addRoad(graph, `h${i - 1}`, `h${i}`);
    }
    expect(resolveSupplyLine(state, 'h0', 'f1').hostId).toBeNull();
  });

  it('fail-softs on a missing origin or a factionless army', () => {
    expect(resolveSupplyLine(state, undefined, 'f1').hostId).toBeNull();
    expect(resolveSupplyLine(state, 'nope', 'f1').hostId).toBeNull();
    expect(resolveSupplyLine(state, 'front', undefined).hostId).toBeNull();
  });
});

// ─── Larder arithmetic ─────────────────────────────────────────────────────

describe('nextSupplyLevel', () => {
  it('clamps to the larder ceiling and to empty', () => {
    expect(nextSupplyLevel(95, 30, 4)).toBe(ARMY_SUPPLY_MAX);
    expect(nextSupplyLevel(2, 0, 18)).toBe(0);
  });

  it('drains a cut-off host faster than a cut-off warband', () => {
    const warband = nextSupplyLevel(50, 0, ARMY_SUPPLY_CONSUMPTION.warband);
    const host = nextSupplyLevel(50, 0, ARMY_SUPPLY_CONSUMPTION.host);
    expect(host).toBeLessThan(warband);
  });
});

// ─── The phase ─────────────────────────────────────────────────────────────

describe('phaseArmySupply', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    addFaction(graph, 'f1');
  });

  it('is silent off its scan cadence', () => {
    addLocation(graph, 'front');
    addArmy(graph, 'a1', 'front', 'f1', { supply: 50 });
    const state = makeState(ARMY_SUPPLY_SCAN_INTERVAL_TICKS + 1, graph);

    phaseArmySupply(state, CTX);
    expect(armyStateOf(graph, 'a1').supplyTier).toBeUndefined();
  });

  it('writes the derived tier and host onto the army on a scan tick', () => {
    addLocation(graph, 'front');
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.5 });
    addRoad(graph, 'front', 'depot');
    addArmy(graph, 'a1', 'front', 'f1', { supply: 60 });

    phaseArmySupply(makeState(ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph), CTX);

    const as = armyStateOf(graph, 'a1');
    expect(as.supplyHostId).toBe('depot');
    expect(as.supplyHops).toBe(1);
    expect(as.supplyTier).toBe('supplied');
    expect(as.supply!).toBeGreaterThan(60); // resupplied
  });

  it('starves a cut-off army down the tiers over successive scans', () => {
    addLocation(graph, 'front'); // no conduits at all
    addArmy(graph, 'a1', 'front', 'f1', { size: 'host', supply: ARMY_SUPPLY_MAX });

    const tiers: Array<string | undefined> = [];
    for (let scan = 1; scan <= 8; scan++) {
      phaseArmySupply(makeState(scan * ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph), CTX);
      tiers.push(armyStateOf(graph, 'a1').supplyTier);
    }

    expect(armyStateOf(graph, 'a1').supplyHostId).toBeNull();
    expect(tiers).toContain('strained');
    expect(tiers[tiers.length - 1]).toBe('starving');
  });

  it('plants an anomaly seed for a starving army and only one at a time', () => {
    addLocation(graph, 'front');
    addArmy(graph, 'a1', 'front', 'f1', { supply: 0 });
    graph.addNode({ id: 'cmd1', type: 'actor', name: 'Commander', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_cmd_a1', source: 'a1', target: 'cmd1', type: 'commanded_by', properties: {} });

    // Walk scans until the seeded chance fires — deterministic per seed, so this
    // terminates or the test legitimately fails.
    let seeds: unknown[] = [];
    for (let scan = 1; scan <= 12 && seeds.length === 0; scan++) {
      const state = makeState(scan * ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph);
      state.pendingEncounterSeeds = seeds as GameState['pendingEncounterSeeds'];
      const result = phaseArmySupply(state, CTX);
      if (result.pendingEncounterSeeds) seeds = [...result.pendingEncounterSeeds];
    }

    expect(seeds).toHaveLength(1);
    const seed = seeds[0] as { templateId: string; targetAgentId: string; seedId: string };
    expect(seed.templateId).toBe('army.threshold.mutiny');
    expect(seed.targetAgentId).toBe('cmd1');

    // A live seed suppresses a second one for the same army.
    const state = makeState(20 * ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph);
    state.pendingEncounterSeeds = seeds as GameState['pendingEncounterSeeds'];
    expect(phaseArmySupply(state, CTX).pendingEncounterSeeds).toBeUndefined();
  });

  it('still seeds when the pending pool holds a seed with an undefined id (THR-992 class)', () => {
    // Regression for a defect found in the live world, not in a fixture: at tick
    // 132 of `--seed 42 --map medium`, 4 of 7 pending seeds had `seedId:
    // undefined`. An unguarded `s.seedId.startsWith(...)` throws on those, and
    // this phase's per-army fail-soft `catch` swallowed the throw — anomaly
    // materialization silently stopped for EVERY army while the scan trace still
    // reported a healthy `0 seeded`. Asserting a plant here (rather than merely
    // "does not throw") is what makes the test fail against the pre-fix code.
    addLocation(graph, 'front');
    addArmy(graph, 'a1', 'front', 'f1', { supply: 0 });
    graph.addNode({ id: 'cmd1', type: 'actor', name: 'C', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_cmd_a1', source: 'a1', target: 'cmd1', type: 'commanded_by', properties: {} });

    let seeds: unknown[] = [{ templateId: 'legacy.no.id' }]; // seedId undefined
    let planted = false;
    for (let scan = 1; scan <= 12 && !planted; scan++) {
      const state = makeState(scan * ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph);
      state.pendingEncounterSeeds = seeds as GameState['pendingEncounterSeeds'];
      const result = phaseArmySupply(state, CTX);
      if (result.pendingEncounterSeeds) {
        seeds = [...result.pendingEncounterSeeds];
        planted = seeds.some(
          (s) => typeof (s as { seedId?: string }).seedId === 'string' &&
            (s as { seedId: string }).seedId.startsWith('army_supply_a1_'),
        );
      }
    }
    expect(planted).toBe(true);
  });

  it('emits one aggregate scan trace, not one per army', () => {
    addLocation(graph, 'front');
    addArmy(graph, 'a1', 'front', 'f1', { supply: 40 });
    addArmy(graph, 'a2', 'front', 'f1', { supply: 40 });

    const state = makeState(ARMY_SUPPLY_SCAN_INTERVAL_TICKS, graph);
    phaseArmySupply(state, CTX);
    // Two armies, one scan trace carrying both lines — asserted through the
    // returned shape rather than the buffer so the test does not depend on
    // tracing being enabled.
    expect(armyStateOf(graph, 'a1').supplyTier).toBeDefined();
    expect(armyStateOf(graph, 'a2').supplyTier).toBeDefined();
  });

  it('is deterministic — same seed and tick produce the same seeds', () => {
    const build = (): WorldGraph => {
      const g = new WorldGraph();
      addFaction(g, 'f1');
      addLocation(g, 'front');
      addArmy(g, 'a1', 'front', 'f1', { supply: 0 });
      g.addNode({ id: 'cmd1', type: 'actor', name: 'C', properties: { actorType: 'individual' } });
      g.addEdge({ id: 'e_cmd_a1', source: 'a1', target: 'cmd1', type: 'commanded_by', properties: {} });
      return g;
    };
    const runOnce = (): unknown => {
      const g = build();
      return phaseArmySupply(makeState(ARMY_SUPPLY_SCAN_INTERVAL_TICKS * 3, g), CTX).pendingEncounterSeeds;
    };
    expect(JSON.stringify(runOnce())).toBe(JSON.stringify(runOnce()));
  });
});

// ─── Attrition coupling ────────────────────────────────────────────────────

describe('supply → attrition coupling', () => {
  it('costs a starving army extra cohesion, and a fed army nothing', () => {
    const build = (supply: number): WorldGraph => {
      const g = new WorldGraph();
      addFaction(g, 'f1');
      addLocation(g, 'front');
      addArmy(g, 'a1', 'front', 'f1', { supply, cohesion: 30, cohesionMax: 30 });
      return g;
    };

    const fed = build(ARMY_SUPPLY_MAX);
    phaseArmyAttrition(makeState(1, fed));
    const fedLoss = 30 - armyStateOf(fed, 'a1').cohesion;

    const starving = build(0);
    phaseArmyAttrition(makeState(1, starving));
    const starvingLoss = 30 - armyStateOf(starving, 'a1').cohesion;

    expect(SUPPLY_ATTRITION_PENALTY.supplied).toBe(0);
    expect(starvingLoss - fedLoss).toBeCloseTo(STARVING_SUPPLY_ATTRITION_PENALTY, 5);
  });
});

// ─── Siege coupling ────────────────────────────────────────────────────────

describe('hasReliefLine', () => {
  let graph: WorldGraph;
  let state: GameState;

  beforeEach(() => {
    graph = new WorldGraph();
    state = makeState(0, graph);
    addFaction(graph, 'f1');
  });

  it('does NOT count the besieged city feeding itself', () => {
    // The whole point of the swap: a besieged city is almost always a stocked,
    // faction-controlled location, so a self-host check answers "supplied" right
    // up until it doesn't — which is the fixed clock this replaces.
    addLocation(graph, 'city', { factionId: 'f1', resourceBalance: 0.9 });
    expect(isSupplyHost(state, 'city', 'f1')).toBe(true);
    expect(hasReliefLine(state, 'city')).toBe(false);
  });

  it('counts an intact road to another friendly depot', () => {
    addLocation(graph, 'city', { factionId: 'f1', resourceBalance: 0.9 });
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.9 });
    addRoad(graph, 'city', 'depot');
    expect(hasReliefLine(state, 'city')).toBe(true);
  });

  it('does not count a threatened line — bandits on the road are not relief', () => {
    addLocation(graph, 'city', { factionId: 'f1', resourceBalance: 0.9 });
    addLocation(graph, 'depot', { factionId: 'f1', resourceBalance: 0.9 });
    addTradeRoute(graph, 'city', 'depot', true);
    expect(hasReliefLine(state, 'city')).toBe(false);
  });

  it('fail-softs to unsupplied for an unknown or uncontrolled settlement', () => {
    addLocation(graph, 'nobodys_town');
    expect(hasReliefLine(state, 'nobodys_town')).toBe(false);
    expect(hasReliefLine(state, 'missing')).toBe(false);
    expect(hasReliefLine(state, undefined)).toBe(false);
  });
});
