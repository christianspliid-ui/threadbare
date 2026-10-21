/**
 * THR-1937 S1 — undertakings in the economy: a founded town has a ruler and a founder's
 * freehold on free ground, a founded lane is tolled by its founder, a founded guild has
 * a calling and earns guild work. Plan § Done when S1.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../data/undertaking-objects';
import {
  pickFoundedTownRuler,
  readFoundingRecord,
  readLaneHolders,
  foundedGuildType,
  foundedGuildReachProfile,
  foundedLaneChronicleWords,
  leadingReaches,
} from '../undertakingEconomy';
import { findUnclaimedSite } from '../foundingSite';
import { collectHoldingPayments } from '../holdingIncome';
import { computePurseIncome, isSettlement } from '../factionPurse/income';
import { foundedLanesThisTick, phaseEconomicChronicle } from '../phaseEconomicChronicle';
import { cellCompletionProse } from '../undertakingProse';
import { REALM_FACTION_CLASS } from '../../data/realm-content';
import { FOUNDED_GUILD_TYPE_BY_REACH, FOUNDED_TOWN_RULER_INFLUENCE } from '../../data/undertaking-economy-constants';
import { REACH_DOMAINS } from '../../types/traits';
import { GUILD_PLACE_AFFINITY } from '../../data/faction-purse-constants';
import { GUILD_IDENTITY_PROSE } from '../../data/prose-layer-content';
import type { GameState } from '../../types/gameState';
import type { GraphOpResult } from '../strategicGraphOps';
import { PLACE_ROW_RESOLVERS } from '../views/subjects/placeRows';
import type { SectionResolverContext } from '../detailPageResolvers';
import { createSimulationRuntime } from '../simulationRuntime';

const FOUNDER = 'kael';
const SITE = 'loc_ashford';

function asState(graph: WorldGraph, tick = 10): GameState {
  return {
    tick, seed: 42, graph, tickEvents: [], chronicleEntries: [],
    dynamicFactionDefinitions: {},
  } as unknown as GameState;
}

function town(graph: WorldGraph, id: string, name: string, col: number, row: number, subtype = 'town'): void {
  graph.addNode({ id, type: 'location', name, properties: { locationSubtype: subtype, locationType: subtype, hexCol: col, hexRow: row, prosperity: 40 } });
}

function faction(graph: WorldGraph, id: string, opts: { realm?: boolean; holds?: string } = {}): void {
  graph.addNode({
    id, type: 'actor', name: id,
    properties: { actorType: 'faction', ...(opts.realm ? { factionClass: REALM_FACTION_CLASS } : {}) },
  });
  if (opts.holds) graph.addEdge({ id: `ctl_${id}_${opts.holds}`, source: id, target: opts.holds, type: 'controls', properties: { role: 'strategic' } });
}

function member(graph: WorldGraph, factionId: string, rank: number): void {
  graph.addEdge({ id: `mem_${FOUNDER}_${factionId}`, source: FOUNDER, target: factionId, type: 'member_of', properties: { rank, role: 'member', joinedTick: 0 } });
}

function world(): WorldGraph {
  const graph = new WorldGraph();
  town(graph, SITE, 'Ashford', 10, 10);
  town(graph, 'loc_wolfton', 'Wolfton', 14, 10);
  graph.addNode({
    id: FOUNDER, type: 'actor', name: 'Kael Thornweaver',
    properties: { actorType: 'individual', domainCapabilities: { gold: 60, stone: 40, iron: 10 } },
  });
  graph.addEdge({ id: `loc_${FOUNDER}`, source: FOUNDER, target: SITE, type: 'located_at', properties: {} });
  return graph;
}

function runCell(graph: WorldGraph, objectType: string, extra: Partial<ObjectVerbContext> = {}): GraphOpResult {
  const semantic = getUndertakingObjectType(objectType as never)!.verbs.create as ObjectVerbSemantic;
  const ctx = {
    state: asState(graph), graph, actorId: FOUNDER, tick: 10, projectId: 'proj_1',
    targetNodeId: SITE, handle: { kind: 'node', nodeId: SITE },
    ...extra,
  } as unknown as ObjectVerbContext;
  return semantic(ctx) as GraphOpResult;
}

// ─── Found a town ────────────────────────────────────────────────────────────

describe('THR-1937 — a founded town stands on free ground', () => {
  it('never shares a hex with the settlement it was founded from', () => {
    const graph = world();
    const result = runCell(graph, 'location');
    expect(result.success).toBe(true);
    const founded = graph.getNode(result.createdId!)!;
    expect(`${founded.properties.hexCol},${founded.properties.hexRow}`).not.toBe('10,10');
    // No two place-tier settlements on one hex.
    const hexes = graph.getNodesByType('location').filter(isSettlement).map(n => `${n.properties.hexCol},${n.properties.hexRow}`);
    expect(new Set(hexes).size).toBe(hexes.length);
  });

  it('founds nothing, and says why, when the whole neighbourhood is built up', () => {
    const graph = world();
    for (let c = 5; c <= 15; c++) for (let r = 5; r <= 15; r++) {
      if (!graph.getNode(`fill_${c}_${r}`) && !(c === 10 && r === 10)) town(graph, `fill_${c}_${r}`, `F${c}${r}`, c, r, 'hamlet');
    }
    expect(findUnclaimedSite(graph, { col: 10, row: 10 })).toBeNull();
    const before = graph.getNodesByType('location').length;
    const result = runCell(graph, 'location');
    expect(result.success).toBe(false);
    expect(result.completionLine).toBe('no_ground');
    expect(graph.getNodesByType('location').length).toBe(before);
  });
});

describe('THR-1937 — who rules a founded town', () => {
  it('goes to the town-holding faction where the founder ranks highest', () => {
    const graph = world();
    faction(graph, 'f_low', { holds: 'loc_wolfton' });
    faction(graph, 'f_high', { holds: SITE });
    member(graph, 'f_low', 0.2);
    member(graph, 'f_high', 0.8);
    expect(pickFoundedTownRuler(graph, FOUNDER)).toMatchObject({ rulerId: 'f_high', reason: 'faction_rank' });
  });

  it('skips a faction that holds no town', () => {
    const graph = world();
    faction(graph, 'f_landless');
    faction(graph, 'f_holder', { holds: SITE });
    member(graph, 'f_landless', 1);
    member(graph, 'f_holder', 0.1);
    expect(pickFoundedTownRuler(graph, FOUNDER).rulerId).toBe('f_holder');
  });

  it('gives a tie to the realm', () => {
    const graph = world();
    faction(graph, 'f_a_guild', { holds: SITE });
    faction(graph, 'f_z_realm', { realm: true, holds: 'loc_wolfton' });
    member(graph, 'f_a_guild', 0.5);
    member(graph, 'f_z_realm', 0.5);
    expect(pickFoundedTownRuler(graph, FOUNDER)).toMatchObject({ rulerId: 'f_z_realm', reason: 'realm_tie' });
  });

  it('breaks a tie with no realm on the lower id', () => {
    const graph = world();
    faction(graph, 'f_b', { holds: SITE });
    faction(graph, 'f_a', { holds: 'loc_wolfton' });
    member(graph, 'f_b', 0.5);
    member(graph, 'f_a', 0.5);
    expect(pickFoundedTownRuler(graph, FOUNDER)).toMatchObject({ rulerId: 'f_a', reason: 'id_tie' });
  });

  it('leaves a founder with no town-holding faction to rule alone', () => {
    const graph = world();
    expect(pickFoundedTownRuler(graph, FOUNDER)).toMatchObject({ rulerId: FOUNDER, reason: 'founder' });
  });

  it('writes the ruler\'s controls and the founder\'s freehold, and the purse taxes it', () => {
    const graph = world();
    faction(graph, 'f_saltmarch', { holds: 'loc_wolfton' });
    member(graph, 'f_saltmarch', 0.6);
    const result = runCell(graph, 'location');
    const townId = result.createdId!;
    expect(result.completionLine).toBe('ruled');
    expect(result.proseOwnerId).toBe('f_saltmarch');

    const controls = graph.getIncomingEdges(townId, 'controls');
    expect(controls).toHaveLength(1);
    expect(controls[0]).toMatchObject({ source: 'f_saltmarch', properties: { role: 'strategic', influence: FOUNDED_TOWN_RULER_INFLUENCE, via: 'founded' } });
    expect(graph.getOutgoingEdges(FOUNDER, 'owns').some(e => e.target === townId)).toBe(true);
    expect(readFoundingRecord(graph, townId)).toEqual({ founderId: FOUNDER, rulerId: 'f_saltmarch', rulerReason: 'faction_rank' });

    // The purse's town tax reaches it (the founded hamlet is a settlement the ruler holds).
    const factions = [graph.getNode('f_saltmarch')!];
    const day = computePurseIncome(graph, factions, { hexRealmId: new Map(), realmHexes: new Map(), tileTerrain: new Map() });
    expect(day.get('f_saltmarch')!.taxHolderOf).toContain(townId);
  });

  it('gives a lone founder both edges and keeps the cell\'s own line', () => {
    const graph = world();
    const result = runCell(graph, 'location');
    const townId = result.createdId!;
    expect(result.completionLine).toBeUndefined();
    expect(graph.getIncomingEdges(townId, 'controls').map(e => e.source)).toEqual([FOUNDER]);
    expect(graph.getOutgoingEdges(FOUNDER, 'owns').some(e => e.target === townId)).toBe(true);
    expect(readFoundingRecord(graph, townId)?.rulerReason).toBe('founder');
  });
});

describe('THR-1937 — the founding\'s completion line', () => {
  const project = (objectHandle = { kind: 'node' as const, nodeId: SITE }) => ({
    projectId: 'proj_1', actorId: FOUNDER, objectHandle, objectTypeId: 'location' as const, targetNodeId: SITE, victimAgentId: undefined,
  });

  it('raises the ruler\'s banner over the town it founded', () => {
    const graph = world();
    faction(graph, 'f_saltmarch', { holds: 'loc_wolfton' });
    graph.updateNode('f_saltmarch', { name: 'the Saltmarch Guild' });
    member(graph, 'f_saltmarch', 0.6);
    const op = runCell(graph, 'location', { params: { name: 'Newholm' } });
    const text = cellCompletionProse(graph, project(), 'create', { line: op.completionLine, objectId: op.proseObjectId, ownerId: op.proseOwnerId }).text;
    expect(text).toBe('Kael Thornweaver founds Newholm, and raises the banner of the Saltmarch Guild over it.');
  });

  it('says there was no ground', () => {
    const graph = world();
    const text = cellCompletionProse(graph, project(), 'create', { line: 'no_ground' }).text;
    expect(text).toBe('Kael Thornweaver finds no open ground near Ashford to found a town.');
  });

  it('drops to the cell\'s own line when the ruler does not resolve (Law 14)', () => {
    const graph = world();
    const text = cellCompletionProse(graph, project(), 'create', { line: 'ruled', objectId: SITE, ownerId: 'gone' }).text;
    expect(text).not.toContain('banner');
    expect(text.length).toBeGreaterThan(0);
  });
});

// ─── Open a lane ─────────────────────────────────────────────────────────────

describe('THR-1937 — whoever opens a lane tolls it', () => {
  const openLane = () => {
    const graph = world();
    const result = runCell(graph, 'route', {
      targetNodeId: 'loc_wolfton', handle: { kind: 'node', nodeId: 'loc_wolfton' }, originLocationId: SITE,
    } as Partial<ObjectVerbContext>);
    expect(result.success).toBe(true);
    const edge = graph.getEdgesByType('trades_with')[0];
    return { graph, edge, identityId: result.createdId! };
  };

  it('stamps the founder as toll holder and the identity node\'s constructed_by', () => {
    const { graph, edge, identityId } = openLane();
    expect(edge.properties).toMatchObject({ controlledBy: FOUNDER, taxRate: 0.1 });
    expect(graph.getOutgoingEdges(identityId, 'constructed_by').map(e => e.target)).toEqual([FOUNDER]);
    expect(readLaneHolders(graph, edge.id)).toEqual({ controlledBy: FOUNDER, founderId: FOUNDER });
  });

  it('pays the founder\'s toll on the next pay day the lane carries', () => {
    const { graph } = openLane();
    const toll = collectHoldingPayments(graph).filter(p => p.reason === 'route_control');
    expect(toll).toHaveLength(1);
    expect(toll[0].holderId).toBe(FOUNDER);
    expect(toll[0].amount).toBeGreaterThan(0);
  });

  it('fires trade_route_established with both town names', () => {
    const { graph } = openLane();
    const lanes = foundedLanesThisTick({ graph, tick: 10 });
    expect(lanes).toHaveLength(1);
    expect(lanes[0]).toMatchObject({ from: 'Ashford', to: 'Wolfton', goodsType: 'goods', founderId: FOUNDER });
    const out = phaseEconomicChronicle(asState(graph, 10));
    const prose = (out.chronicleEntries ?? []).map(e => e.prose).join(' ');
    expect(prose).toContain('Ashford');
    expect(prose).toContain('Wolfton');
    expect(prose).not.toMatch(/\{[a-zA-Z]+\}/);
  });

  it('drops the chronicle line when either end is unnamed', () => {
    const { graph, edge } = openLane();
    graph.updateNode('loc_wolfton', { name: '' });
    expect(foundedLaneChronicleWords(graph, edge.id)).toBeNull();
    graph.updateNode('loc_wolfton', { name: 'Wolfton' });
    graph.updateNode(SITE, { name: '' });
    expect(foundedLaneChronicleWords(graph, edge.id)).toBeNull();
  });

  it('does not chronicle a lane on a later tick', () => {
    const { graph } = openLane();
    expect(foundedLanesThisTick({ graph, tick: 11 })).toHaveLength(0);
  });
});

// ─── Found a guild ───────────────────────────────────────────────────────────

describe('THR-1937 — a founded guild has a calling', () => {
  it('every Reach has a row, and every calling is a purse affinity (Law 58)', () => {
    for (const reach of REACH_DOMAINS) {
      expect(reach in FOUNDED_GUILD_TYPE_BY_REACH).toBe(true);
      const type = FOUNDED_GUILD_TYPE_BY_REACH[reach];
      if (type !== null) expect(GUILD_PLACE_AFFINITY[type]).toBeDefined();
      // Its identity prose too — a calling without a row reads as merchants (review gate).
      if (type !== null) expect(GUILD_IDENTITY_PROSE[type]?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('reads the founder\'s two leading Reaches; falls to the second when the first has no calling', () => {
    const graph = world();
    const founder = graph.getNode(FOUNDER)!;
    expect(leadingReaches(founder)).toEqual(['gold', 'stone']);
    expect(foundedGuildReachProfile(founder)).toEqual({ gold: 0.6, stone: 0.4 });
    expect(foundedGuildType(founder)).toBe('merchants');
    graph.updateNode(FOUNDER, { properties: { ...founder.properties, domainCapabilities: { iron: 70, heart: 30 } } });
    expect(foundedGuildType(graph.getNode(FOUNDER))).toBe('artisans');
    graph.updateNode(FOUNDER, { properties: { ...founder.properties, domainCapabilities: {} } });
    expect(foundedGuildType(graph.getNode(FOUNDER))).toBeNull();
  });

  it('a gold-led founder\'s guild is merchants, opens at 0 and earns guild work in a market town', () => {
    const graph = world();
    graph.addNode({
      id: 'pl_market', type: 'location', name: 'Ashford Market',
      properties: { sublocationTypeId: 'sublocation-type.market-district', parentLocationId: SITE, hexCol: 10, hexRow: 10 },
    });
    graph.addEdge({ id: 'c_market', source: SITE, target: 'pl_market', type: 'contains', properties: {} });
    const result = runCell(graph, 'faction');
    expect(result.success).toBe(true);
    const guild = graph.getNode(result.createdId!)!;
    expect(guild.properties.guildType).toBe('merchants');
    expect(guild.properties.wealth ?? 0).toBe(0);
    const day = computePurseIncome(graph, [guild], { hexRealmId: new Map(), realmHexes: new Map(), tileTerrain: new Map() });
    expect(day.get(guild.id)!.income.guildWork).toBeGreaterThan(0);
  });
});

// ─── The place page ──────────────────────────────────────────────────────────

describe('THR-1937 — the place page names who founded the town', () => {
  const row = (graph: WorldGraph, nodeId: string) => PLACE_ROW_RESOLVERS.founded_by({
    nodeId, pageKind: 'place', graph, seed: 42, tick: 10, state: asState(graph),
  } as SectionResolverContext);

  it('reads "Founded by {founder}." with the founder linked and the tooltip on the label', () => {
    const graph = world();
    const townId = runCell(graph, 'location').createdId!;
    const section = row(graph, townId);
    expect(section).not.toBeNull();
    expect(section).toMatchObject({ kind: 'prose', typeId: 'founded_by', labelTooltipId: 'ui.place.founded' });
    const prose = (section as { prose: string }).prose;
    expect(prose).toContain('Founded by');
    expect(prose).toContain('Kael Thornweaver');
    expect(Object.values((section as { termRefs?: Record<string, { nodeId: string }> }).termRefs ?? {}).map(r => r.nodeId)).toContain(FOUNDER);
  });

  it('is omitted for a town nobody founded (Law 14)', () => {
    const graph = world();
    expect(row(graph, SITE)).toBeNull();
  });
});

describe('THR-1937 — a faction-ruled founding moves the realm projection', () => {
  it('bumps the structural cache when a faction rules, not when the founder does', () => {
    const ruled = world();
    faction(ruled, 'f_saltmarch', { realm: true, holds: 'loc_wolfton' });
    member(ruled, 'f_saltmarch', 0.6);
    const runtime = createSimulationRuntime();
    const before = runtime.structuralCacheVersion;
    runCell(ruled, 'location', { runtime } as Partial<ObjectVerbContext>);
    expect(runtime.structuralCacheVersion).toBe(before + 1);

    const alone = world();
    const runtime2 = createSimulationRuntime();
    const before2 = runtime2.structuralCacheVersion;
    runCell(alone, 'location', { runtime: runtime2 } as Partial<ObjectVerbContext>);
    expect(runtime2.structuralCacheVersion).toBe(before2);
  });
});

describe('THR-1937 — a founder who rules alone tithes once the town grows (review gate)', () => {
  it('the founding controls edge carries the key the mortal tithe reads', () => {
    const graph = world();
    const townId = runCell(graph, 'location').createdId!;
    expect(collectHoldingPayments(graph).some(p => p.reason === 'location_tithe' && p.sourceId === townId)).toBe(false);
    const town = graph.getNode(townId)!;
    graph.updateNode(townId, { properties: { ...town.properties, prosperity: 60 } });
    const tithe = collectHoldingPayments(graph).filter(p => p.reason === 'location_tithe' && p.sourceId === townId);
    expect(tithe).toHaveLength(1);
    expect(tithe[0].holderId).toBe(FOUNDER);
  });
});

describe('THR-1937 — a founded town stands on land, on the map (review gate round 2)', () => {
  const tile = (col: number, row: number, terrain: string) => ({ coord: { col, row }, terrain, geoParams: {} });
  const tilesAround = (water: (c: number, r: number) => boolean) => {
    const out = [];
    for (let c = 0; c <= 14; c++) for (let r = 0; r <= 14; r++) out.push(tile(c, r, water(c, r) ? 'ocean' : 'grassland'));
    return out;
  };
  const runWithTiles = (graph: WorldGraph, tiles: unknown[]) => runCell(graph, 'location', {
    state: { ...asState(graph), tiles } as unknown as GameState,
  } as Partial<ObjectVerbContext>);

  it('skips water: a coastal site with sea to the west founds inland', () => {
    const graph = world();
    const result = runWithTiles(graph, tilesAround(c => c < 10));
    const town = graph.getNode(result.createdId!)!;
    expect(town.properties.hexCol as number).toBeGreaterThanOrEqual(10);
  });

  it('skips hexes off the map: a site on the edge founds inside it', () => {
    const graph = new WorldGraph();
    town(graph, SITE, 'Ashford', 0, 0);
    graph.addNode({ id: FOUNDER, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
    const result = runWithTiles(graph, tilesAround(() => false));
    const t = graph.getNode(result.createdId!)!;
    expect(t.properties.hexCol as number).toBeGreaterThanOrEqual(0);
    expect(t.properties.hexRow as number).toBeGreaterThanOrEqual(0);
  });

  it('founds nothing when every nearby hex is water', () => {
    const graph = world();
    const result = runWithTiles(graph, tilesAround((c, r) => !(c === 10 && r === 10)));
    expect(result.success).toBe(false);
    expect(result.completionLine).toBe('no_ground');
  });
});
