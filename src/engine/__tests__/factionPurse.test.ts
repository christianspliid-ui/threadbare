/**
 * The faction purse — THR-1931.
 *
 * Fixture-level proofs of the plan's Done-when predicates that do not need a 600-tick
 * world: one tax holder per town (nothing pays twice), upkeep in id order with no
 * partial pay, the Means ladder, losing the last town bankrupts within 25 days, the
 * opening purse pays every worldgen army, the raise charge, the purse's underfunded
 * predicate, the schism strain, and the sheet's words. Each guard is falsified, not
 * just exercised: the twin-controller arm asserts the *second* controller gets nothing.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { RealmProjection } from '../realmProjection';
import {
  runFactionPurse,
  seedOpeningPurse,
  readPurseDay,
  readMeansBand,
  isFactionInAttention,
  recordPurseDesertion,
  PURSE_DESERTIONS_PROP,
} from '../factionPurse';
import { taxHolderOf, computePurseIncome, townTaxOf, landRentOf, isPurseFaction } from '../factionPurse/income';
import { settleUpkeep, armiesOf } from '../factionPurse/upkeep';
import { meansBand } from '../factionPurse/means';
import { incomeSentence, spendingSentence, holdingClause, PURSE_BROKE_LINE, durationWords } from '../factionPurse/purseSentences';
import { checkUnderfunded } from '../armyAttrition';
import { canAffordArmy } from '../armySpawning';
import { computePurseStrain } from '../factionTopology';
import { applyTreasuryDelta } from '../wealth';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import {
  PURSE_CYCLE_TICKS,
  TOWN_TAX_BASE,
  ARMY_UPKEEP_PER_DAY,
  FACTION_STARTING_PURSE,
  FACTION_STARTING_UPKEEP_DAYS,
  FACTION_TREASURY_CAP,
  LANDHOLDER_TAX_RATE,
  HEX_RENT,
  PURSE_SCHISM_GRACE_DAYS,
} from '../../data/faction-purse-constants';
import { ARMY_CREATION_GOLD_COST } from '../../types/army';

const REALM = 'faction_0';
const RIVAL = 'faction_9';
const GUILD = 'guild_0';
const TOWN = 'loc_town';
const TOWN_B = 'loc_town_b';
const MINE = 'loc_mine';
const ARMY = 'army_faction_0_0';

function addArmy(graph: WorldGraph, id: string, factionId: string, size: 'warband' | 'regiment' | 'host', paidThroughTick?: number) {
  graph.addNode({
    id, type: 'actor', name: `${id} host`,
    properties: {
      actorType: 'group', groupKind: 'army',
      armyState: { size, headcount: 100, objective: null, cohesion: 60, cohesionMax: 60, raisedTick: 0, maintenanceCost: 5, thresholdsFired: [], paidThroughTick },
    },
  });
  graph.addEdge({ id: `e_mo_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army' } });
}

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: REALM, name: 'House Ashfold', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 0 } });
  g.addNode({ id: RIVAL, name: 'Saltmarch Hold', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 0 } });
  g.addNode({ id: GUILD, name: 'Millbrook Miners', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'miners', homeLocationId: TOWN, wealth: 0 } });
  g.addNode({ id: TOWN, name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 1, hexRow: 1, resources: { ore: { quantity: 100, stockTier: 'adequate' } } } });
  g.addNode({ id: TOWN_B, name: 'Harrow', type: 'location', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 3, hexRow: 1 } });
  g.addNode({ id: MINE, name: 'The Deep Cut', type: 'location', properties: { sublocationTypeId: 'sublocation-type.mine', parentLocationId: TOWN, resources: { salt: { quantity: 100, stockTier: 'adequate' } } } });
  g.addEdge({ id: 'e_contains_mine', source: TOWN, target: MINE, type: 'contains', properties: {} });
  g.addEdge({ id: 'e_ctl_town', source: REALM, target: TOWN, type: 'controls', properties: { role: 'seat', influence: 0.5 } });
  g.addEdge({ id: 'e_ctl_town_b', source: REALM, target: TOWN_B, type: 'controls', properties: { influence: 0.5 } });
  g.addEdge({ id: 'e_guild_home', source: GUILD, target: TOWN, type: 'located_at', properties: { role: 'guild_hall' } });
  return g;
}

/** A projection stub: the realm holds hexes 1,1 and 3,1 plus two farmland hexes. */
function projection(holder = REALM): () => RealmProjection {
  const hexes = [{ col: 1, row: 1 }, { col: 3, row: 1 }, { col: 2, row: 1 }, { col: 2, row: 2 }];
  return () => ({
    realms: [{ id: holder, name: holder, seatHex: hexes[0], seatLocationId: TOWN, heldLocationIds: [TOWN, TOWN_B], hexes }],
    hexRealmId: new Map(hexes.map(h => [`${h.col},${h.row}`, holder])),
    unclaimedHexes: 0,
  });
}

const TILES = [
  { coord: { col: 1, row: 1 }, terrain: 'grassland' },
  { coord: { col: 3, row: 1 }, terrain: 'grassland' },
  { coord: { col: 2, row: 1 }, terrain: 'farmland' },
  { coord: { col: 2, row: 2 }, terrain: 'ocean' },
];

function stateAt(graph: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return { graph, tick, seed: 42, chronicleEntries: [], tiles: TILES, ascendantId: 'asc', ...extra } as unknown as GameState;
}

function ctxFor(getProjection: () => RealmProjection) {
  const p = getProjection();
  return {
    hexRealmId: p.hexRealmId,
    realmHexes: new Map(p.realms.map(r => [r.id, r.hexes])),
    tileTerrain: new Map(TILES.map(t => [`${t.coord.col},${t.coord.row}`, t.terrain])),
  };
}

describe('the tax holder of a town', () => {
  it('is the realm whose border holds the town when it controls it, whatever the influence', () => {
    const g = world();
    g.addEdge({ id: 'e_rival_ctl', source: RIVAL, target: TOWN, type: 'controls', properties: { influence: 0.9 } });
    expect(taxHolderOf(g, TOWN, projection(REALM)().hexRealmId)).toBe(REALM);
  });

  it('falls back to the highest influence, then the earliest establishedTick, then the id', () => {
    const g = world();
    g.addEdge({ id: 'e_rival_ctl', source: RIVAL, target: TOWN, type: 'controls', properties: { influence: 0.9 } });
    expect(taxHolderOf(g, TOWN, new Map())).toBe(RIVAL);
    g.getAllEdges().find(e => e.id === 'e_rival_ctl')!.properties.influence = 0.5;
    g.getAllEdges().find(e => e.id === 'e_ctl_town')!.properties.establishedTick = 5;
    g.getAllEdges().find(e => e.id === 'e_rival_ctl')!.properties.establishedTick = 3;
    expect(taxHolderOf(g, TOWN, new Map())).toBe(RIVAL);
  });

  it('nothing pays twice: two controllers, one town tax', () => {
    const g = world();
    g.addEdge({ id: 'e_rival_ctl', source: RIVAL, target: TOWN, type: 'controls', properties: { influence: 0.9 } });
    const factions = [REALM, RIVAL, GUILD].map(id => g.getNode(id)!);
    const out = computePurseIncome(g, factions, ctxFor(projection()));
    const collectors = [...out].filter(([, d]) => d.taxHolderOf.includes(TOWN)).map(([id]) => id);
    expect(collectors).toEqual([REALM]);
    expect(out.get(RIVAL)!.income.townTax).toBe(0);
  });
});

describe('income', () => {
  it('pays town tax at the pivot, rent per border hex, yield from a held place, and a guild cut to the holder', () => {
    const g = world();
    g.addEdge({ id: 'e_ctl_mine', source: REALM, target: MINE, type: 'controls', properties: {} });
    const factions = [REALM, RIVAL, GUILD].map(id => g.getNode(id)!);
    const out = computePurseIncome(g, factions, ctxFor(projection()));
    const realm = out.get(REALM)!;
    expect(realm.income.townTax).toBeCloseTo(2 * TOWN_TAX_BASE);
    expect(realm.income.landRent).toBeCloseTo(3 * HEX_RENT.staple);
    expect(realm.income.placeYield).toBeGreaterThan(0);
    const guild = out.get(GUILD)!;
    // Miners: ore at the town (100) + one mine Place (50 units).
    const gross = 150 / 100;
    expect(guild.income.guildWork).toBeCloseTo(gross * (1 - LANDHOLDER_TAX_RATE));
    expect(realm.income.guildTaxIn).toBeCloseTo(gross * LANDHOLDER_TAX_RATE);
    expect(guild.guildTaxPaidTo.get(REALM)).toBeCloseTo(gross * LANDHOLDER_TAX_RATE);
  });

  it('a ruin pays no tax; a town without prosperity pays the base', () => {
    expect(townTaxOf({ id: 'r', type: 'location', properties: { locationSubtype: 'town', prosperity: 0.05 } } as never)).toBe(0);
    expect(townTaxOf({ id: 't', type: 'location', properties: { locationSubtype: 'town' } } as never)).toBeCloseTo(TOWN_TAX_BASE);
  });

  it('unknown terrain rents nothing', () => {
    expect(landRentOf([{ col: 0, row: 0 }], new Map([['0,0', 'lava_sea']]))).toBe(0);
  });

  it('monster factions are outside the purse', () => {
    expect(isPurseFaction({ id: 'm', type: 'actor', properties: { actorType: 'faction', factionType: 'monster' } } as never)).toBe(false);
  });
});

describe('upkeep and Means', () => {
  it('pays armies in id order, whole armies only, never into debt', () => {
    const armies = [{ id: 'a', size: 'host' as const, upkeep: 3.5 }, { id: 'b', size: 'warband' as const, upkeep: 1.5 }];
    const s = settleUpkeep(4, armies);
    expect(s.paid).toEqual(['a']);
    expect(s.unpaid).toEqual(['b']);
    expect(s.wealthAfter).toBeCloseTo(0.5);
    const none = settleUpkeep(1, armies);
    expect(none.paid).toEqual([]);
    expect(none.unpaid).toEqual(['a', 'b']);
    expect(none.wealthAfter).toBe(1);
  });

  it('bands by days of upkeep with armies, by coin without, and any unpaid army is Destitute', () => {
    expect(meansBand(2.4, 2.5, false)).toBe('Destitute');
    expect(meansBand(10, 2.5, false)).toBe('Getting by');
    expect(meansBand(30, 2.5, false)).toBe('Comfortable');
    expect(meansBand(60, 2.5, false)).toBe('Wealthy');
    expect(meansBand(200, 2.5, false)).toBe('Magnate');
    expect(meansBand(500, 2.5, true)).toBe('Destitute');
    expect(meansBand(10, 0, false)).toBe('Getting by');
    expect(meansBand(300, 0, false)).toBe('Magnate');
  });

  it('the treasury clamps to 0–FACTION_TREASURY_CAP, not to a mortal 0–100', () => {
    expect(applyTreasuryDelta(400, -50)).toBe(350);
    expect(applyTreasuryDelta(990, 50)).toBe(FACTION_TREASURY_CAP);
    expect(applyTreasuryDelta(10, -50)).toBe(0);
  });
});

describe('the pay day', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });

  it('runs only on the daily boundary', () => {
    const g = world();
    const r = runFactionPurse(stateAt(g, PURSE_CYCLE_TICKS + 1), projection());
    expect(r.days.size).toBe(0);
    expect(g.getNode(REALM)!.properties.wealth).toBe(0);
  });

  it('pays income, then upkeep, stamps paidThroughTick, writes meansBand and purseLastDay, and traces the day', () => {
    const g = world();
    addArmy(g, ARMY, REALM, 'regiment', 0);
    g.getNode(REALM)!.properties.wealth = 20;
    runFactionPurse(stateAt(g, PURSE_CYCLE_TICKS), projection());
    const realm = g.getNode(REALM)!;
    const day = readPurseDay(realm)!;
    expect(day.armiesPaid).toEqual([ARMY]);
    expect(day.upkeepPaid).toBeCloseTo(ARMY_UPKEEP_PER_DAY.regiment);
    expect((g.getNode(ARMY)!.properties.armyState as { paidThroughTick: number }).paidThroughTick).toBe(PURSE_CYCLE_TICKS);
    expect(readMeansBand(realm)).not.toBeNull();
    expect(day.topSources.length).toBeGreaterThan(0);
    const traces = getTraces().filter(t => t.category === 'economy.purse.day');
    expect(traces.some(t => (t as unknown as { factionId: string }).factionId === REALM)).toBe(true);
  });

  it('losing its last town leaves a realm that keeps its army Destitute within 25 days', () => {
    const g = world();
    addArmy(g, ARMY, REALM, 'regiment', 0);
    seedOpeningPurse(g);
    for (const id of ['e_ctl_town', 'e_ctl_town_b']) g.removeEdge(id);
    const landless = () => ({ realms: [], hexRealmId: new Map<string, string>(), unclaimedHexes: 4 });
    let brokeDay: number | null = null;
    for (let day = 1; day <= 25; day++) {
      runFactionPurse(stateAt(g, day * PURSE_CYCLE_TICKS), landless);
      if (readMeansBand(g.getNode(REALM)) === 'Destitute') { brokeDay = day; break; }
    }
    expect(brokeDay).not.toBeNull();
    expect(brokeDay!).toBeLessThanOrEqual(25);
    // Under a day of upkeep in hand reads Destitute; the next pay day leaves the army unpaid.
    runFactionPurse(stateAt(g, (brokeDay! + 1) * PURSE_CYCLE_TICKS), landless);
    expect(readPurseDay(g.getNode(REALM))!.armiesUnpaid).toEqual([ARMY]);
  });

  it('a two-town realm keeps a host paid every day it holds both', () => {
    const g = world();
    addArmy(g, ARMY, REALM, 'host', 0);
    seedOpeningPurse(g);
    for (let day = 1; day <= 50; day++) {
      runFactionPurse(stateAt(g, day * PURSE_CYCLE_TICKS), projection());
      expect(readPurseDay(g.getNode(REALM))!.armiesUnpaid).toEqual([]);
    }
  });
});

describe('worldgen and the raise', () => {
  it('the opening purse covers FACTION_STARTING_UPKEEP_DAYS of fielded upkeep and pays every army through tick 0', () => {
    const g = world();
    addArmy(g, ARMY, REALM, 'regiment');
    seedOpeningPurse(g);
    expect(g.getNode(REALM)!.properties.wealth).toBeCloseTo(FACTION_STARTING_PURSE + FACTION_STARTING_UPKEEP_DAYS * ARMY_UPKEEP_PER_DAY.regiment);
    expect(g.getNode(GUILD)!.properties.wealth).toBe(FACTION_STARTING_PURSE);
    expect((g.getNode(ARMY)!.properties.armyState as { paidThroughTick: number }).paidThroughTick).toBe(0);
    expect(readMeansBand(g.getNode(REALM))).not.toBe('Destitute');
    // No day-one desertion: the army is not underfunded on day 1.
    expect(checkUnderfunded(stateAt(g, PURSE_CYCLE_TICKS), REALM, 5, armiesOf(g, REALM).length ? (g.getNode(ARMY)!.properties.armyState as never) : undefined)).toBe(false);
  });

  it('a faction can afford an army only with the raise cost and a first day in hand', () => {
    const g = world();
    g.getNode(REALM)!.properties.wealth = ARMY_CREATION_GOLD_COST + ARMY_UPKEEP_PER_DAY.host - 0.01;
    expect(canAffordArmy(g, REALM, 'host')).toBe(false);
    g.getNode(REALM)!.properties.wealth = ARMY_CREATION_GOLD_COST + ARMY_UPKEEP_PER_DAY.host;
    expect(canAffordArmy(g, REALM, 'host')).toBe(true);
  });
});

describe('desertion, schism and attention', () => {
  it('an army unpaid past one pay day is underfunded; paid today it is not', () => {
    const g = world();
    const s = stateAt(g, 5 * PURSE_CYCLE_TICKS);
    expect(checkUnderfunded(s, REALM, 5, { raisedTick: 0, paidThroughTick: 5 * PURSE_CYCLE_TICKS })).toBe(false);
    expect(checkUnderfunded(s, REALM, 5, { raisedTick: 0, paidThroughTick: 3 * PURSE_CYCLE_TICKS })).toBe(true);
    // An old save's army reads as paid through its raise.
    expect(checkUnderfunded(stateAt(g, 4), REALM, 5, { raisedTick: 0 })).toBe(false);
  });

  it('the schism strain counts only after PURSE_SCHISM_GRACE_DAYS Destitute', () => {
    const g = world();
    const realm = g.getNode(REALM)!;
    realm.properties.meansBand = 'Destitute';
    realm.properties.purseLastDay = { tick: 120, brokeSinceTick: 120 };
    expect(computePurseStrain(stateAt(g, 120 + (PURSE_SCHISM_GRACE_DAYS - 1) * PURSE_CYCLE_TICKS), REALM)).toBe(0);
    expect(computePurseStrain(stateAt(g, 120 + PURSE_SCHISM_GRACE_DAYS * PURSE_CYCLE_TICKS), REALM)).toBe(1);
    realm.properties.meansBand = 'Comfortable';
    expect(computePurseStrain(stateAt(g, 1000), REALM), 'a solvent faction feels no strain').toBe(0);
  });

  it('chronicles a desertion only for a faction inside the player’s attention', () => {
    const g = world();
    g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'mortal', type: 'actor', name: 'Ilse', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e_mo_m', source: 'mortal', target: REALM, type: 'member_of', properties: {} });
    expect(isFactionInAttention(stateAt(g, 12), REALM)).toBe(false);

    recordPurseDesertion(g, REALM, 'The Ashfold Host', 10);
    const silent = runFactionPurse(stateAt(g, 12), projection());
    expect(silent.chronicleEntries).toEqual([]);
    expect(g.getNode(REALM)!.properties[PURSE_DESERTIONS_PROP]).toBeUndefined();

    g.addEdge({ id: 'e_thread', source: 'asc', target: 'mortal', type: 'thread', properties: {} });
    expect(isFactionInAttention(stateAt(g, 24), REALM)).toBe(true);
    recordPurseDesertion(g, REALM, 'The Ashfold Host', 22);
    const told = runFactionPurse(stateAt(g, 24), projection());
    expect(told.chronicleEntries).toHaveLength(1);
    expect(told.chronicleEntries[0].prose).toContain('The Ashfold Host');
    expect(told.chronicleEntries[0].prose).not.toMatch(/\d/);
  });
});

describe('the purse chronicle crossings (review-gate round 1)', () => {
  it('a purse that runs down says "could not pay" on the first unpaid day, and "again" once it is back to Comfortable', () => {
    const g = world();
    g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'mortal', type: 'actor', name: 'Ilse', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e_mo_m', source: 'mortal', target: REALM, type: 'member_of', properties: {} });
    g.addEdge({ id: 'e_thread', source: 'asc', target: 'mortal', type: 'thread', properties: {} });
    addArmy(g, ARMY, REALM, 'warband', 0);
    g.getNode(REALM)!.properties.wealth = 6;
    g.getNode(REALM)!.properties.meansBand = 'Getting by';
    // Two poor towns: income below a warband's 1.5 a day, so the purse runs down day by day.
    for (const id of [TOWN, TOWN_B]) g.getNode(id)!.properties.prosperity = 20;
    g.getNode(TOWN)!.properties.resources = {};
    g.getNode(MINE)!.properties.resources = {};

    const lines: { day: number; title: string }[] = [];
    let day = 1;
    for (; day <= 30 && !lines.some(l => l.title === 'The Pay Stops'); day++) {
      for (const e of runFactionPurse(stateAt(g, day * PURSE_CYCLE_TICKS), projection()).chronicleEntries) lines.push({ day, title: e.title });
    }
    expect(lines.map(l => l.title)).toContain('The Pay Stops');

    // The land pays again: rich towns, well past the cooldown.
    for (const id of [TOWN, TOWN_B]) g.getNode(id)!.properties.prosperity = 100;
    for (; day <= 80 && !lines.some(l => l.title === 'Coin Returns'); day++) {
      for (const e of runFactionPurse(stateAt(g, day * PURSE_CYCLE_TICKS), projection()).chronicleEntries) lines.push({ day, title: e.title });
    }
    expect(lines.map(l => l.title)).toContain('Coin Returns');
    // One spell of being broke is one line, however often the purse limps between paying and not.
    expect(lines.filter(l => l.title === 'The Pay Stops')).toHaveLength(1);
    expect(readMeansBand(g.getNode(REALM))).not.toBe('Destitute');
  });
});

describe('the purse chronicle and its cooldown (review-gate round 2)', () => {
  function attended(): WorldGraph {
    const g = world();
    g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'mortal', type: 'actor', name: 'Ilse', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'e_mo_m', source: 'mortal', target: REALM, type: 'member_of', properties: {} });
    g.addEdge({ id: 'e_thread', source: 'asc', target: 'mortal', type: 'thread', properties: {} });
    return g;
  }

  it('a desertion a few days after the broke line is still told', () => {
    const g = attended();
    addArmy(g, ARMY, REALM, 'host', 0);
    for (const id of ['e_ctl_town', 'e_ctl_town_b']) g.removeEdge(id);
    const landless = () => ({ realms: [], hexRealmId: new Map<string, string>(), unclaimedHexes: 4 });
    const first = runFactionPurse(stateAt(g, PURSE_CYCLE_TICKS), landless);
    expect(first.chronicleEntries.map(e => e.title)).toEqual(['The Pay Stops']);
    g.removeNode(ARMY);
    recordPurseDesertion(g, REALM, 'The Ashfold Host', 2 * PURSE_CYCLE_TICKS + 5);
    const later = runFactionPurse(stateAt(g, 3 * PURSE_CYCLE_TICKS), landless);
    expect(later.chronicleEntries.map(e => e.title)).toEqual(['An Army Melts Away']);
  });

  it('a broke crossing silenced by the cooldown does not latch, so no recovery is told without its fall', () => {
    const g = attended();
    addArmy(g, ARMY, REALM, 'host', 0);
    for (const id of ['e_ctl_town', 'e_ctl_town_b']) g.removeEdge(id);
    const landless = () => ({ realms: [], hexRealmId: new Map<string, string>(), unclaimedHexes: 4 });
    g.getNode(REALM)!.properties.purseChronicledTick = PURSE_CYCLE_TICKS - 1; // a line was just told
    const r = runFactionPurse(stateAt(g, PURSE_CYCLE_TICKS), landless);
    expect(r.chronicleEntries).toEqual([]);
    expect(g.getNode(REALM)!.properties.purseWasBroke).toBeUndefined();
  });
});

describe('the Purse panel words', () => {
  it('names the two largest sources, the share, and never a number', () => {
    const g = world();
    g.addEdge({ id: 'e_ctl_mine', source: REALM, target: MINE, type: 'controls', properties: {} });
    seedOpeningPurse(g);
    runFactionPurse(stateAt(g, PURSE_CYCLE_TICKS), projection());
    const text = incomeSentence(g, readPurseDay(g.getNode(REALM))).map(p => (typeof p === 'string' ? p : p.text)).join('');
    expect(text).toMatch(/^Most of its coin comes from /);
    expect(text).not.toMatch(/\d/);
    const guildText = incomeSentence(g, readPurseDay(g.getNode(GUILD))).map(p => (typeof p === 'string' ? p : p.text)).join('');
    expect(guildText).toContain('A share goes to House Ashfold.');
    expect(holdingClause(g, TOWN, readPurseDay(g.getNode(REALM)))).toBe('pays tax');
    expect(holdingClause(g, MINE, readPurseDay(g.getNode(REALM)))).toBe('yields salt');
  });

  it('spending: no soldiers, a paid army with its runway, and the broke line', () => {
    const g = world();
    expect(spendingSentence(g, null, 0)).toBe('It keeps no soldiers.');
    addArmy(g, ARMY, REALM, 'warband', 0);
    const paid = { topSources: [], paysTo: null, armiesPaid: [ARMY], armiesUnpaid: [] };
    expect(spendingSentence(g, paid, 45)).toBe('It pays for one warband, and has coin to spare for a month of it.');
    expect(spendingSentence(g, { ...paid, armiesPaid: [], armiesUnpaid: [ARMY] }, 0)).toBe(PURSE_BROKE_LINE);
    expect(durationWords(4)).toBe('a few days');
    expect(durationWords(100)).toBe('a season and more');
  });
});
