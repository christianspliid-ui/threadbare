import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseSublocations,
  SUBLOC_MARKET_SPAWN_PROSPERITY,
  SUBLOC_MARKET_DISSOLVE_PROSPERITY,
  SUBLOC_SMUGGLER_SPAWN_PROSPERITY,
  SUBLOC_MARKET_TRADE_BONUS,
  SUBLOC_MARKET_VOLUME_BONUS,
  MINE_PRODUCTION_PER_TICK,
  GUILD_WAREHOUSE_THRESHOLD,
  GUILD_COUNTING_HOUSE_THRESHOLD,
} from '../phaseSublocations';
import { evaluateConditionalPredicate } from '../sublocation';
import type { GameState } from '../../types/gameState';
import type { SublocationProperties } from '../../types/sublocation';

// ─── Minimal GameState factory ─────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 1): GameState {
  return {
    tick,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getSublocationsAtLocation(graph: WorldGraph, locationId: string): Array<{ sublocationTypeId: string }> {
  const containsEdges = graph.getOutgoingEdges(locationId, 'contains');
  const result: Array<{ sublocationTypeId: string }> = [];
  for (const edge of containsEdges) {
    const child = graph.getNode(edge.target);
    if (!child) continue;
    const props = child.properties as Partial<SublocationProperties>;
    if (props.sublocationTypeId) {
      result.push({ sublocationTypeId: props.sublocationTypeId });
    }
  }
  return result;
}

// ─── evaluateConditionalPredicate ──────────────────────────────────────────

describe('evaluateConditionalPredicate', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('returns false for unknown location', () => {
    expect(evaluateConditionalPredicate('prosperity >= 40', 'nonexistent', graph)).toBe(false);
  });

  it('evaluates "prosperity >= N" correctly', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: { prosperity: 50 } });
    expect(evaluateConditionalPredicate('prosperity >= 40', 'loc.1', graph)).toBe(true);
    expect(evaluateConditionalPredicate('prosperity >= 60', 'loc.1', graph)).toBe(false);
  });

  it('evaluates "prosperity < N" correctly', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: { prosperity: 25 } });
    expect(evaluateConditionalPredicate('prosperity < 30', 'loc.1', graph)).toBe(true);
    expect(evaluateConditionalPredicate('prosperity < 20', 'loc.1', graph)).toBe(false);
  });

  it('treats missing prosperity as 0 for threshold checks', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    expect(evaluateConditionalPredicate('prosperity >= 40', 'loc.1', graph)).toBe(false);
    expect(evaluateConditionalPredicate('prosperity < 30', 'loc.1', graph)).toBe(true);
  });

  it('evaluates "has_resource:ore" when ore resource is present', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Mine',
      properties: { resources: { ore: { quantity: 20, renewalRate: 0.1, renewable: true } } },
    });
    expect(evaluateConditionalPredicate('has_resource:ore', 'loc.1', graph)).toBe(true);
    expect(evaluateConditionalPredicate('has_resource:stone', 'loc.1', graph)).toBe(false);
  });

  it('returns false for has_resource when quantity is 0', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Exhausted',
      properties: { resources: { ore: { quantity: 0, renewalRate: 0, renewable: false } } },
    });
    expect(evaluateConditionalPredicate('has_resource:ore', 'loc.1', graph)).toBe(false);
  });

  it('evaluates "is_coastal" correctly', () => {
    graph.addNode({ id: 'loc.coastal', type: 'location', name: 'Port', properties: { coastal: true } });
    graph.addNode({ id: 'loc.inland', type: 'location', name: 'Inland', properties: {} });
    expect(evaluateConditionalPredicate('is_coastal', 'loc.coastal', graph)).toBe(true);
    expect(evaluateConditionalPredicate('is_coastal', 'loc.inland', graph)).toBe(false);
  });

  it('evaluates "guild_wealth >= N" via actors at location', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({ id: 'actor.guild', type: 'actor', name: 'Guild', properties: { guildType: 'merchants', wealth: 35 } });
    graph.addEdge({ id: 'e1', source: 'actor.guild', target: 'loc.1', type: 'located_at', properties: {} });

    expect(evaluateConditionalPredicate('guild_wealth >= 30', 'loc.1', graph)).toBe(true);
    expect(evaluateConditionalPredicate('guild_wealth >= 50', 'loc.1', graph)).toBe(false);
  });

  it('"guild_wealth >= N" ignores non-guild actors', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({ id: 'actor.rich', type: 'actor', name: 'Rich Person', properties: { wealth: 80 } }); // no guildType
    graph.addEdge({ id: 'e1', source: 'actor.rich', target: 'loc.1', type: 'located_at', properties: {} });

    expect(evaluateConditionalPredicate('guild_wealth >= 30', 'loc.1', graph)).toBe(false);
  });

  it('evaluates "trade_route_present" when actor at location has trades_with edge', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 3 } });

    expect(evaluateConditionalPredicate('trade_route_present', 'loc.1', graph)).toBe(true);
  });

  it('"trade_route_present" returns false when no trade routes', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });

    expect(evaluateConditionalPredicate('trade_route_present', 'loc.1', graph)).toBe(false);
  });

  it('supports OR clauses with ||', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Mine',
      properties: { resources: { stone: { quantity: 10, renewalRate: 0.1, renewable: true } } },
    });
    // ore is absent, stone is present
    expect(evaluateConditionalPredicate('has_resource:ore||has_resource:stone', 'loc.1', graph)).toBe(true);
    expect(evaluateConditionalPredicate('has_resource:ore||has_resource:timber', 'loc.1', graph)).toBe(false);
  });

  it('returns false for unknown predicate (fail-soft)', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: {} });
    expect(evaluateConditionalPredicate('unknown_predicate', 'loc.1', graph)).toBe(false);
  });
});

// ─── phaseSublocations spawn logic ────────────────────────────────────────

describe('phaseSublocations', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  it('skips non-settlement locations', () => {
    graph.addNode({ id: 'loc.wild', type: 'location', name: 'Wilderness', properties: { locationSubtype: 'wilderness' } });
    phaseSublocations(makeState(graph));
    expect(getSublocationsAtLocation(graph, 'loc.wild')).toHaveLength(0);
  });

  it('spawns Market District when prosperity >= SUBLOC_MARKET_SPAWN_PROSPERITY', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'town', prosperity: SUBLOC_MARKET_SPAWN_PROSPERITY },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const market = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.market-district');
    expect(market).toBeDefined();
  });

  it('does NOT spawn Market District when prosperity < SUBLOC_MARKET_SPAWN_PROSPERITY', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'town', prosperity: SUBLOC_MARKET_SPAWN_PROSPERITY - 1 },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const market = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.market-district');
    expect(market).toBeUndefined();
  });

  it('spawns Mine when location has ore resource', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Hamlet',
      properties: {
        locationSubtype: 'hamlet',
        resources: { ore: { quantity: 15, renewalRate: 0.1, renewable: true } },
      },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const mine = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.mine');
    expect(mine).toBeDefined();
  });

  it('spawns Mine when location has stone resource', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Mining Settlement',
      properties: {
        locationSubtype: 'mining',
        resources: { stone: { quantity: 20, renewalRate: 0.1, renewable: true } },
      },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const mine = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.mine');
    expect(mine).toBeDefined();
  });

  it('does NOT spawn Mine when location has no ore or stone', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: {
        locationSubtype: 'town',
        resources: { timber: { quantity: 20, renewalRate: 0.1, renewable: true } },
      },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const mine = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.mine');
    expect(mine).toBeUndefined();
  });

  it('spawns Harbor at coastal location', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Port Town',
      properties: { locationSubtype: 'town', coastal: true },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const harbor = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.harbor');
    expect(harbor).toBeDefined();
  });

  it('does NOT spawn Harbor at non-coastal location', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Inland Town',
      properties: { locationSubtype: 'town' },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const harbor = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.harbor');
    expect(harbor).toBeUndefined();
  });

  it('spawns Warehouse when a guild at location has wealth >= GUILD_WAREHOUSE_THRESHOLD', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: { locationSubtype: 'town' } });
    graph.addNode({
      id: 'actor.guild', type: 'actor', name: 'Guild',
      properties: { guildType: 'merchants', wealth: GUILD_WAREHOUSE_THRESHOLD },
    });
    graph.addEdge({ id: 'e1', source: 'actor.guild', target: 'loc.1', type: 'located_at', properties: {} });

    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const warehouse = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.warehouse');
    expect(warehouse).toBeDefined();
  });

  it('spawns Smuggler\'s Den when prosperity < SUBLOC_SMUGGLER_SPAWN_PROSPERITY', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Hamlet',
      properties: { locationSubtype: 'hamlet', prosperity: SUBLOC_SMUGGLER_SPAWN_PROSPERITY - 1 },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const den = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.smugglers-den');
    expect(den).toBeDefined();
  });

  it('does NOT spawn Smuggler\'s Den when prosperity >= SUBLOC_SMUGGLER_SPAWN_PROSPERITY', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'town', prosperity: SUBLOC_SMUGGLER_SPAWN_PROSPERITY },
    });
    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const den = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.smugglers-den');
    expect(den).toBeUndefined();
  });

  it('spawns Caravan Rest when a trade route is present at location', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: { locationSubtype: 'town' } });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 3 } });

    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const caravan = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.caravan-rest');
    expect(caravan).toBeDefined();
  });

  it('is idempotent — calling twice does not duplicate sublocations', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'town', prosperity: SUBLOC_MARKET_SPAWN_PROSPERITY + 5 },
    });

    phaseSublocations(makeState(graph));
    const countAfterFirst = getSublocationsAtLocation(graph, 'loc.1').length;

    phaseSublocations(makeState(graph));
    const countAfterSecond = getSublocationsAtLocation(graph, 'loc.1').length;

    expect(countAfterFirst).toBe(countAfterSecond);
    expect(countAfterFirst).toBeGreaterThan(0);
  });

  it('conditional sublocation dissolves when predicate no longer holds', () => {
    // Start with prosperity above market spawn threshold
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'town', prosperity: SUBLOC_MARKET_SPAWN_PROSPERITY + 10 },
    });

    phaseSublocations(makeState(graph));
    const sublocs = getSublocationsAtLocation(graph, 'loc.1');
    const market = sublocs.find(s => s.sublocationTypeId === 'sublocation-type.market-district');
    expect(market).toBeDefined();

    // Drop prosperity well below dissolution threshold
    graph.getNode('loc.1')!.properties.prosperity = SUBLOC_MARKET_DISSOLVE_PROSPERITY - 5;

    phaseSublocations(makeState(graph, 2));

    const sublocsAfter = getSublocationsAtLocation(graph, 'loc.1');
    const marketAfter = sublocsAfter.find(s => s.sublocationTypeId === 'sublocation-type.market-district');
    expect(marketAfter).toBeUndefined();
  });
});

// ─── Constants contract ────────────────────────────────────────────────────

describe('phaseSublocations constants', () => {
  it('SUBLOC_MARKET_SPAWN_PROSPERITY is positive', () => {
    expect(SUBLOC_MARKET_SPAWN_PROSPERITY).toBeGreaterThan(0);
  });

  it('SUBLOC_MARKET_DISSOLVE_PROSPERITY is less than SUBLOC_MARKET_SPAWN_PROSPERITY (hysteresis)', () => {
    expect(SUBLOC_MARKET_DISSOLVE_PROSPERITY).toBeLessThan(SUBLOC_MARKET_SPAWN_PROSPERITY);
  });

  it('SUBLOC_SMUGGLER_SPAWN_PROSPERITY is between 0 and SUBLOC_MARKET_SPAWN_PROSPERITY', () => {
    expect(SUBLOC_SMUGGLER_SPAWN_PROSPERITY).toBeGreaterThan(0);
    expect(SUBLOC_SMUGGLER_SPAWN_PROSPERITY).toBeLessThan(SUBLOC_MARKET_SPAWN_PROSPERITY);
  });

  it('SUBLOC_MARKET_TRADE_BONUS is a positive fraction', () => {
    expect(SUBLOC_MARKET_TRADE_BONUS).toBeGreaterThan(0);
    expect(SUBLOC_MARKET_TRADE_BONUS).toBeLessThan(1);
  });

  it('SUBLOC_MARKET_VOLUME_BONUS is a positive fraction', () => {
    expect(SUBLOC_MARKET_VOLUME_BONUS).toBeGreaterThan(0);
    expect(SUBLOC_MARKET_VOLUME_BONUS).toBeLessThan(1);
  });

  it('MINE_PRODUCTION_PER_TICK is a positive integer', () => {
    expect(MINE_PRODUCTION_PER_TICK).toBeGreaterThan(0);
    expect(Number.isInteger(MINE_PRODUCTION_PER_TICK)).toBe(true);
  });

  it('GUILD_WAREHOUSE_THRESHOLD < GUILD_COUNTING_HOUSE_THRESHOLD', () => {
    expect(GUILD_WAREHOUSE_THRESHOLD).toBeLessThan(GUILD_COUNTING_HOUSE_THRESHOLD);
  });
});
