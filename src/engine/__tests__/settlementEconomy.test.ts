/**
 * THR-1923 — the settlement economy on a hand-built world: the data tables are complete,
 * a seat that pulls nothing never passes town, a capital that loses its realm seat drops,
 * a surplus route is born, carries and ends, the four god verbs lay a land shock the
 * receipt names, and the unrest and stock-tier phases read what the economy writes.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { HexTile, TerrainType } from '../../types';
import type { GameState } from '../../types/gameState';
import { runSettlementEconomyDay } from '../phases/settlementEconomy';
import { phaseSettlementPromotion } from '../phaseSettlementPromotion';
import { executeGraphOps } from '../graphOpExecutor';
import { snapshotCastEconomy, diffCastEconomy } from '../castEconomyReceipt';
import { computeUnrestInputs } from '../unrestPressure/inputs';
import { readSurplusRoutes } from '../settlementEconomy/surplusRoutes';
import { readLandShocks } from '../settlementEconomy/shocks';
import { readBuildings } from '../settlementEconomy/building';
import { sizeLine, livelihoodParts, buildingFact } from '../settlementEconomy/describe';
import { TERRAIN_YIELDS } from '../../data/terrain-yields';
import { SETTLEMENT_BUILDINGS } from '../../data/settlement-buildings';
import { SUBLOCATION_TYPE_CATEGORY, normalizeSublocationTypeId } from '../../data/sublocation-category-art';
import { LOCATION_TRAIT_IDS, ECONOMIC_LOCATION_TRAIT_KEYS } from '../../data/location-trait-constants';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { resolveTooltip } from '../tooltipResolver';
import {
  TOWN_MAX_POP,
  ROUTE_DIE_DAYS,
  CAPITAL_POP,
  SHOCK_BLIGHT_FACTOR,
} from '../../data/settlement-economy-constants';
import { SETTLEMENT_PROMOTION_SUSTAIN_TICKS } from '../phaseProsperity';
import { TICKS_PER_DAY } from '../../data/attention-constants';

const ALL_TERRAIN_TYPES: TerrainType[] = [
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
  'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
  'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
  'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
  'swamp', 'marsh', 'moor_bog',
  'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
  'forested_hills',
  'great_home_trees', 'broken_lands', 'oasis',
  'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
  'arctic', 'snow_fields',
];

// ─── Fixture ─────────────────────────────────────────────────────────────────

function tilesOf(cols: number, rows: number, terrainAt: (col: number, row: number) => TerrainType): HexTile[] {
  const out: HexTile[] = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      out.push({ coord: { col, row }, terrain: terrainAt(col, row), geoParams: {} } as unknown as HexTile);
    }
  }
  return out;
}

function addSettlement(graph: WorldGraph, id: string, col: number, row: number, subtype: string, extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'location', name: id.replace('loc.', '').replace(/^\w/, c => c.toUpperCase()), properties: { locationSubtype: subtype, hexCol: col, hexRow: row, ...extra } });
}

function addFaction(graph: WorldGraph, id: string, props: Record<string, unknown>): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'faction', ...props } });
}

function control(graph: WorldGraph, factionId: string, locationId: string, props: Record<string, unknown> = {}): void {
  graph.addEdge({ id: `ctl_${factionId}_${locationId}`, type: 'controls', source: factionId, target: locationId, properties: { influence: 1, ...props } });
}

function runDays(graph: WorldGraph, tiles: HexTile[], from: number, days: number, seed = 7): number {
  let day = from;
  for (let i = 0; i < days; i++, day++) {
    runSettlementEconomyDay({ graph, tiles, tick: day * TICKS_PER_DAY, seed, hexRealmId: new Map() });
  }
  return day;
}

const p = (graph: WorldGraph, id: string) => graph.getNode(id)!.properties;

// ─── Data tables ─────────────────────────────────────────────────────────────

describe('settlement economy data tables (one entry per kind, Law 58)', () => {
  it('every TerrainType has a yield row of three non-negative numbers', () => {
    for (const t of ALL_TERRAIN_TYPES) {
      const y = TERRAIN_YIELDS[t];
      expect(y, t).toBeDefined();
      expect(y).toHaveLength(3);
      for (const v of y) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('every building has category art for its Place type, and a plain tooltip ≤ 200 characters with no numerals', () => {
    for (const b of SETTLEMENT_BUILDINGS) {
      expect(SUBLOCATION_TYPE_CATEGORY[normalizeSublocationTypeId(b.sublocationTypeId)], b.id).toBeDefined();
      expect(b.tooltip.length, b.id).toBeGreaterThan(0);
      expect(b.tooltip.length, b.id).toBeLessThanOrEqual(200);
      expect(b.tooltip, b.id).not.toMatch(/\d/);
      expect(resolveTooltip(`location.building.${b.id}`)?.desc).toBe(b.tooltip);
    }
  });

  it('every economic trait is a seeded location condition with a description tooltip', () => {
    const defs = new Map(CONDITION_TRAIT_DEFINITIONS.map(d => [d.id, d]));
    for (const key of ECONOMIC_LOCATION_TRAIT_KEYS) {
      const def = defs.get(LOCATION_TRAIT_IDS[key]);
      expect(def, key).toBeDefined();
      const desc = String(def!.properties.description ?? '');
      expect(desc.length, key).toBeGreaterThan(0);
      expect(desc.length, key).toBeLessThanOrEqual(200);
    }
    for (const b of SETTLEMENT_BUILDINGS) if (b.trait) expect(defs.has(b.trait), b.id).toBe(true);
  });
});

// ─── Rules ───────────────────────────────────────────────────────────────────

describe('a seat that pulls nothing is a town (plan rule 3)', () => {
  it('a guild seated on rich land with no holdings and no incoming routes never passes TOWN_MAX_POP', () => {
    const graph = new WorldGraph();
    const tiles = tilesOf(12, 12, () => 'floodplain');
    addSettlement(graph, 'loc.rich', 5, 5, 'town');
    addFaction(graph, 'faction_guild', { factionClass: 'guild', homeLocationId: 'loc.rich' });
    control(graph, 'faction_guild', 'loc.rich');
    runDays(graph, tiles, 1, 200);
    expect(p(graph, 'loc.rich').population).toBeLessThanOrEqual(TOWN_MAX_POP);
    expect(['hamlet', 'town']).toContain(p(graph, 'loc.rich').targetTier);
    expect(p(graph, 'loc.rich').economyPulls).toBe(false);
  });
});

describe('a capital that loses its realm seat drops a tier (plan rule 5)', () => {
  it('targets capital while seated and holding, and steps down within the sustain window once the seat goes', () => {
    const graph = new WorldGraph();
    const tiles = tilesOf(20, 12, () => 'floodplain');
    addSettlement(graph, 'loc.crown', 4, 5, 'capital');
    addSettlement(graph, 'loc.held', 14, 5, 'town');
    addFaction(graph, 'faction_realm', { factionClass: 'realm' });
    control(graph, 'faction_realm', 'loc.crown', { role: 'seat' });
    control(graph, 'faction_realm', 'loc.held');
    runDays(graph, tiles, 1, 150);
    expect(p(graph, 'loc.crown').population).toBeGreaterThanOrEqual(CAPITAL_POP);
    expect(p(graph, 'loc.crown').targetTier).toBe('capital');

    // The court moves: the seat edge loses its role, and the realm lets the other town go.
    graph.removeEdge('ctl_faction_realm_loc.held');
    graph.getEdge('ctl_faction_realm_loc.crown')!.properties.role = undefined;
    const day = runDays(graph, tiles, 151, 1);
    expect(p(graph, 'loc.crown').targetTier).not.toBe('capital');

    const state = { graph, tick: day * TICKS_PER_DAY, seed: 7, tickEvents: [], chronicleEntries: [] } as unknown as GameState;
    for (let t = 0; t < SETTLEMENT_PROMOTION_SUSTAIN_TICKS; t++) phaseSettlementPromotion({ ...state, tick: state.tick + t } as GameState);
    expect(p(graph, 'loc.crown').locationSubtype).toBe('city');
  });
});

describe('surplus routes (plan rule 6)', () => {
  it('a town with lasting food surplus opens a route to a seat, carries daily, and the route ends ROUTE_DIE_DAYS after the surplus stops', () => {
    const graph = new WorldGraph();
    let terrain: TerrainType = 'floodplain';
    const tiles = tilesOf(16, 10, (col) => (col < 8 ? terrain : 'tundra'));
    addSettlement(graph, 'loc.farm', 3, 5, 'town');
    addSettlement(graph, 'loc.seat', 10, 5, 'town');
    addFaction(graph, 'faction_order', { factionClass: 'order', homeLocationId: 'loc.seat' });
    control(graph, 'faction_order', 'loc.seat');
    let day = runDays(graph, tiles, 1, 120);
    const routes = readSurplusRoutes(graph).filter(r => r.source === 'loc.farm');
    expect(routes.length).toBeGreaterThan(0);
    const route = routes.find(r => r.properties.carries === 'food')!;
    expect(route.target).toBe('loc.seat');
    day = runDays(graph, tiles, day, 1);
    expect(route.properties.lastTraded).toBe((day - 1) * TICKS_PER_DAY);
    expect(route.properties.carriedPerDay as number).toBeGreaterThan(0);

    // The fields fail: the surplus stops, and the route ends after ROUTE_DIE_DAYS dry days.
    terrain = 'tundra';
    for (const t of tiles) if (t.coord.col < 8) t.terrain = 'tundra';
    day = runDays(graph, tiles, day, ROUTE_DIE_DAYS - 1);
    expect(graph.getEdge(route.id)).toBeDefined();
    runDays(graph, tiles, day, 2);
    expect(graph.getEdge(route.id)).toBeUndefined();
  });
});

describe('a cursed road carries nothing (review gate)', () => {
  it('while the seller\'s roads are cursed the route stops carrying, and ends after ROUTE_DIE_DAYS', () => {
    const graph = new WorldGraph();
    const tiles = tilesOf(16, 10, (col) => (col < 8 ? 'floodplain' : 'tundra'));
    addSettlement(graph, 'loc.farm', 3, 5, 'town');
    addSettlement(graph, 'loc.seat', 10, 5, 'town');
    addFaction(graph, 'faction_order', { factionClass: 'order', homeLocationId: 'loc.seat' });
    control(graph, 'faction_order', 'loc.seat');
    let day = runDays(graph, tiles, 1, 120);
    const route = readSurplusRoutes(graph).find(r => r.source === 'loc.farm')!;
    expect(route).toBeDefined();
    p(graph, 'loc.farm').routesCursedUntilTick = 10_000 * TICKS_PER_DAY;
    day = runDays(graph, tiles, day, 1);
    expect(route.properties.carriedPerDay).toBe(0);
    runDays(graph, tiles, day, ROUTE_DIE_DAYS);
    expect(graph.getEdge(route.id)).toBeUndefined();
  });
});

describe('buildings and the place page', () => {
  it('a settlement raises buildings into its slots, its building Places say "built by the town", and the size line has no numerals', () => {
    const graph = new WorldGraph();
    // Few fields, much stone: the people it can feed work the slopes, and the stone builds.
    const tiles = tilesOf(12, 12, (col, row) => (row === 5 && col >= 4 && col <= 6 ? 'floodplain' : 'mountains'));
    addSettlement(graph, 'loc.mill', 5, 5, 'town');
    runDays(graph, tiles, 1, 120);
    const buildings = readBuildings(graph, 'loc.mill');
    expect(buildings.length).toBeGreaterThan(0);
    expect(buildingFact(buildings[0].node)).toBe('built by the town');
    const size = sizeLine(graph.getNode('loc.mill'), 120 * TICKS_PER_DAY);
    expect(size?.text).toMatch(/^A (hamlet|town|city|capital), /);
    expect(size?.text).not.toMatch(/\d/);
    const parts = livelihoodParts(graph, graph.getNode('loc.mill'), 120 * TICKS_PER_DAY)!;
    const text = parts.map(x => (typeof x === 'string' ? x : x.text)).join('');
    expect(text).toContain("Mill's fields");
    expect(text).not.toMatch(/\d/);
  });
});

// ─── The four god verbs ──────────────────────────────────────────────────────

describe('god verbs lay a land shock the receipt names (plan rule 7)', () => {
  const VERBS = [
    { op: 'blight_harvest', source: 'blight', title: 'Fields wither', channel: 0 },
    { op: 'bless_harvest', source: 'bless_harvest', title: 'Fields swell', channel: 0 },
    { op: 'sour_mine', source: 'sour_mine', title: 'The quarry fails', channel: 2 },
    { op: 'reveal_vein', source: 'reveal_vein', title: 'A seam opens', channel: 2 },
  ] as const;

  for (const verb of VERBS) {
    it(`${verb.op}: one landShocks record on the best hex, and the receipt's land line in the same diff`, () => {
      const graph = new WorldGraph();
      const tiles = tilesOf(12, 12, (col) => (col >= 6 ? 'mountains' : 'floodplain'));
      addSettlement(graph, 'loc.town', 5, 5, 'town', { resources: { stone: { resourceId: 'stone', quantity: 30 } } });
      const day = runDays(graph, tiles, 1, 10);
      const before = snapshotCastEconomy(graph, 'loc.town');
      const tick = day * TICKS_PER_DAY;
      executeGraphOps(graph, [{ op: verb.op, nodeId: '$target' } as never], { actorId: 'god', targetId: 'loc.town', locationId: 'loc.town', tick });
      const shocks = readLandShocks(graph.getNode('loc.town'));
      expect(shocks).toHaveLength(1);
      expect(shocks[0].source).toBe(verb.source);
      expect(shocks[0].channel).toBe(verb.channel);
      expect(shocks[0].hexKey).not.toBeNull();
      const after = snapshotCastEconomy(graph, 'loc.town');
      const rows = diffCastEconomy(before, after, { idStem: 'cast:step:0', targetId: 'loc.town', targetName: 'Town' });
      const land = rows.find(r => r.economyQuantity === 'land');
      expect(land?.title).toBe(verb.title);
      expect(land?.detail).toContain('Town');
      expect(land?.detail).not.toMatch(/\d/);
    });
  }

  it('Blight bites on land of equal fields — the people do not walk to the next field over (review gate)', () => {
    const graph = new WorldGraph();
    const tiles = tilesOf(12, 12, () => 'grassland');
    addSettlement(graph, 'loc.flat', 5, 5, 'hamlet');
    let day = runDays(graph, tiles, 1, 30);
    const before = p(graph, 'loc.flat').landFood as number;
    executeGraphOps(graph, [{ op: 'blight_harvest', nodeId: '$target' } as never], { actorId: 'god', targetId: 'loc.flat', locationId: 'loc.flat', tick: day * TICKS_PER_DAY });
    day = runDays(graph, tiles, day, 1);
    expect(p(graph, 'loc.flat').landFood as number).toBeLessThan(before);
  });

  it('Blight lowers the best food hex the next day, and the livelihood line says so', () => {
    const graph = new WorldGraph();
    const tiles = tilesOf(12, 12, () => 'grassland');
    tiles.find(t => t.coord.col === 6 && t.coord.row === 5)!.terrain = 'floodplain';
    addSettlement(graph, 'loc.town', 5, 5, 'town');
    let day = runDays(graph, tiles, 1, 30);
    const foodBefore = p(graph, 'loc.town').landFood as number;
    executeGraphOps(graph, [{ op: 'blight_harvest', nodeId: '$target' } as never], { actorId: 'god', targetId: 'loc.town', locationId: 'loc.town', tick: day * TICKS_PER_DAY });
    day = runDays(graph, tiles, day, 1);
    const worked = p(graph, 'loc.town').workedHexList as { key: string; food: number }[];
    const blighted = worked.find(w => w.key === readLandShocks(graph.getNode('loc.town'))[0].hexKey);
    if (blighted) expect(blighted.food).toBeLessThan(4 * (SHOCK_BLIGHT_FACTOR + 0.1));
    expect(p(graph, 'loc.town').landFood as number).toBeLessThan(foodBefore + 1e-9);
    const text = livelihoodParts(graph, graph.getNode('loc.town'), day * TICKS_PER_DAY)!.map(x => (typeof x === 'string' ? x : x.text)).join('');
    expect(text).toContain('blighted');
  });
});

// ─── Readers of what the economy writes ──────────────────────────────────────

describe('the unrest target reads the economy (THR-1934 switch)', () => {
  it('contentment is the economy term when present, else the prosperity relief', () => {
    const graph = new WorldGraph();
    addSettlement(graph, 'loc.a', 0, 0, 'town', { prosperity: 80, economyContentment: 8 });
    addSettlement(graph, 'loc.b', 2, 0, 'town', { prosperity: 80 });
    expect(computeUnrestInputs(graph.getNode('loc.a')!, 0, false, 0).contentment).toBe(8);
    expect(computeUnrestInputs(graph.getNode('loc.b')!, 0, false, 0).contentment).toBeLessThan(0);
  });
});

describe('determinism', () => {
  it('the same world and seed give the same populations and buildings', () => {
    const build = () => {
      const graph = new WorldGraph();
      const tiles = tilesOf(14, 14, (col, row) => (['grassland', 'temperate_forest', 'hills', 'floodplain'] as TerrainType[])[(col + row) % 4]);
      addSettlement(graph, 'loc.a', 3, 3, 'town');
      addSettlement(graph, 'loc.b', 10, 10, 'hamlet');
      runDays(graph, tiles, 1, 80, 42);
      return ['loc.a', 'loc.b'].map(id => [p(graph, id).population, readBuildings(graph, id).map(b => b.def.id).join(',')]);
    };
    expect(build()).toEqual(build());
  });
});
