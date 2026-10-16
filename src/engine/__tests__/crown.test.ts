/**
 * The crown — THR-1932.
 *
 * Fixture-level proofs of the plan's Done-when predicates that do not need a 1080-tick
 * world: coercion by siege and by conquest, persuasion and purchase (and the gift's coin),
 * the fealty tax after the vassal's own soldiers with no debt, loyalty and the break
 * (a grudge, a cooldown, a chronicle line naming the reason), rebellion, the one-layer
 * rule, the Crown being derived, the projection's `crownOf` and the sheet's words.
 * The 90-day predicates (a crown forms, oaths pay 15–35%, force breaks first, a quarter
 * stays free, the courtship rate) are measured by `npm run measure:crown`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { RealmProjection } from '../realmProjection';
import { buildRealmProjection, fingerprintFactionControls } from '../realmProjection';
import { executeSeekFealty, runCrownPhase, coercePool, canCourt, loyaltyDeltas, swearOathForDebug } from '../crown';
import { buildCrownWorld, maySwear, mayCourt, isSwearableKind } from '../crown/eligibility';
import { offerScore, affordableGift } from '../crown/offer';
import { isCrown, vassalsOf, liegeOf, protectedHoldingsOf, crownHexes, readOath, buildCrownOf } from '../crown/crownView';
import { fealtyView, fealtyPurseSentence, standingWord } from '../crown/fealtySentences';
import { PURSE_LAST_DAY_PROP, MEANS_BAND_PROP } from '../factionPurse';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import {
  FEALTY_TAX_SHARE,
  LOYALTY_START,
  OATH_GIFT_DAYS,
  OATH_GIFT_RESERVE,
  OATH_BREAK_SENTIMENT_DELTA,
  OATH_COERCE_MIN_SIEGE_TICKS,
  OATH_REFUSAL_SENTIMENT_FLOOR,
  LOYALTY_FALL_DESTITUTE,
} from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS } from '../../data/faction-purse-constants';

const R = 'faction_0';      // the courting realm
const R2 = 'faction_1';     // a neighbouring realm
const GUILD = 'guild_0';    // a guild with a hall in R's town
const THIEVES = 'guild_9';  // never swears
const TOWN = 'loc_town';
const TOWN_B = 'loc_town_b';
const TOWN_C = 'loc_town_c';

function setDay(g: WorldGraph, id: string, income: number, band = 'Comfortable') {
  const n = g.getNode(id)!;
  n.properties[PURSE_LAST_DAY_PROP] = {
    tick: 12,
    income: { townTax: income, placeYield: 0, landRent: 0, tolls: 0, guildWork: 0, guildTaxIn: 0, guildTaxOut: 0 },
    topSources: [], paysTo: null, upkeepOwed: 0, upkeepPaid: 0, armiesPaid: [], armiesUnpaid: [],
    brokeSinceTick: null, taxHolderOf: [], paidBy: [],
  };
  n.properties[MEANS_BAND_PROP] = band;
}

function addArmy(g: WorldGraph, id: string, factionId: string, at: string, headcount = 100) {
  g.addNode({
    id, type: 'actor', name: `${id} host`,
    properties: {
      actorType: 'group', groupKind: 'army',
      armyState: { size: 'warband', headcount, objective: null, cohesion: 60, cohesionMax: 60, raisedTick: 0, maintenanceCost: 5, thresholdsFired: [] },
    },
  });
  g.addEdge({ id: `e_mo_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army' } });
  g.addEdge({ id: `e_at_${id}`, source: id, target: at, type: 'located_at', properties: {} });
}

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: R, name: 'Hold of Witness Skyfield', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 1000 } });
  g.addNode({ id: R2, name: 'March of Shadow-Kept Dawn', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 100 } });
  g.addNode({ id: GUILD, name: 'Silverborough Mining Consortium', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'miners', homeLocationId: TOWN, wealth: 50 } });
  g.addNode({ id: THIEVES, name: 'Night Hands', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'thieves', homeLocationId: TOWN, wealth: 50 } });
  g.addNode({ id: TOWN, name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 } });
  g.addNode({ id: TOWN_B, name: 'Harrow', type: 'location', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 1 } });
  g.addNode({ id: TOWN_C, name: 'Thornhaven', type: 'location', properties: { locationSubtype: 'town', hexCol: 9, hexRow: 9 } });
  g.addEdge({ id: 'e_ctl_town', source: R, target: TOWN, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_ctl_town_b', source: R2, target: TOWN_B, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_guild_hall', source: GUILD, target: TOWN, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_thief_hall', source: THIEVES, target: TOWN, type: 'located_at', properties: {} });
  setDay(g, R, 10, 'Magnate');
  setDay(g, R2, 4, 'Comfortable');
  setDay(g, GUILD, 1, 'Comfortable');
  setDay(g, THIEVES, 1, 'Comfortable');
  return g;
}

function projection(): RealmProjection {
  const mine = [{ col: 1, row: 1 }];
  const theirs = [{ col: 2, row: 1 }];
  return {
    realms: [
      { id: R, name: R, seatHex: mine[0], seatLocationId: TOWN, heldLocationIds: [TOWN], hexes: mine },
      { id: R2, name: R2, seatHex: theirs[0], seatLocationId: TOWN_B, heldLocationIds: [TOWN_B], hexes: theirs },
    ],
    hexRealmId: new Map([['1,1', R], ['2,1', R2]]),
    unclaimedHexes: 0,
  };
}

function stateAt(graph: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return { graph, tick, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc', ...extra } as unknown as GameState;
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('who may swear and who may court', () => {
  it('thieves never swear; a realm holding a town with no liege courts', () => {
    const g = world();
    expect(isSwearableKind(g.getNode(THIEVES))).toBe(false);
    expect(maySwear(g, g.getNode(GUILD))).toBe(true);
    expect(mayCourt(g, g.getNode(R))).toBe(true);
    expect(mayCourt(g, g.getNode(GUILD))).toBe(false);
  });

  it('finds the guild with a hall in its town and the neighbouring realm, never the thieves', () => {
    const g = world();
    const w = buildCrownWorld(g, 24, projection());
    expect(w.candidates.get(R)).toEqual([R2, GUILD].sort());
    expect(canCourt(w, R)).toBe(true);
  });

  it('one layer: a liege cannot swear, and a vassal cannot court', () => {
    const g = world();
    const s = stateAt(g, 24);
    expect(swearOathForDebug(s, R2, R, 'persuaded')).toBe(true);
    expect(mayCourt(g, g.getNode(R2))).toBe(false);
    expect(maySwear(g, g.getNode(R))).toBe(false);
    // R2 is sworn; a second oath for it is refused, and R (a liege) cannot swear to R2.
    expect(swearOathForDebug(s, R2, R, 'bought')).toBe(false);
    expect(swearOathForDebug(s, R, R2, 'persuaded')).toBe(false);
  });
});

describe('winning an oath', () => {
  it('buys the richest acceptor with a gift from the purse, moving the coin', () => {
    const g = world();
    // Make R2 refuse: an enemy of R, and too proud (it out-earns R).
    g.addEdge({ id: 'e_hostile', source: R2, target: R, type: 'hostile_to', properties: {} });
    setDay(g, R2, 20, 'Comfortable');
    const s = stateAt(g, 24);
    const w = buildCrownWorld(g, 24, projection());
    expect(offerScore(w, R2, R, affordableGift(w, R2, R)).score).toBeLessThan(0.85);
    const plain = offerScore(w, GUILD, R, 0);
    expect(plain.protection).toBe(0.5);         // nothing threatens the guild
    expect(plain.score).toBeLessThan(0.85);     // not persuaded on protection alone
    const gift = affordableGift(w, GUILD, R);
    expect(gift).toBe(1);                       // 1000 − 150 covers 30 days of 1

    const res = executeSeekFealty(s, g.getNode(R)!, w);
    expect(res?.record.outcome).toBe('success');
    expect(liegeOf(g, GUILD)).toBe(R);
    const oath = readOath(g.getOutgoingEdges(GUILD, 'sworn_to')[0]);
    expect(oath.kind).toBe('bought');
    expect(oath.loyalty).toBe(LOYALTY_START.bought);
    expect(oath.giftPaid).toBeCloseTo(OATH_GIFT_DAYS * 1);
    expect(g.getNode(R)!.properties.wealth).toBeCloseTo(1000 - OATH_GIFT_DAYS);
    expect(g.getNode(GUILD)!.properties.wealth).toBeCloseTo(50 + OATH_GIFT_DAYS);
    expect(getTraces().some(t => t.category === 'oath_sworn')).toBe(true);
  });

  it('refuses when the gift is unaffordable, cooling feeling but never past the floor', () => {
    const g = world();
    g.getNode(R)!.properties.wealth = OATH_GIFT_RESERVE; // nothing to spare
    g.addEdge({ id: 'e_hostile', source: R2, target: R, type: 'hostile_to', properties: {} });
    const s = stateAt(g, 24);
    let res = null;
    for (let i = 0; i < 30; i++) res = executeSeekFealty(s, g.getNode(R)!, buildCrownWorld(g, 24, projection()));
    expect(res?.record.outcome).toBe('failed');
    expect(g.getOutgoingEdges(GUILD, 'sworn_to')).toHaveLength(0);
    const rel = g.getOutgoingEdges(GUILD, 'relates_to').find(e => e.target === R);
    expect(rel?.properties.sentiment).toBe(OATH_REFUSAL_SENTIMENT_FLOOR);
    expect(rel?.properties.isRival).toBeUndefined();
  });

  it('coerces a faction whose town its army has besieged for three days', () => {
    const g = world();
    g.addEdge({ id: 'e_ctl_c', source: R2, target: TOWN_C, type: 'controls', properties: {} });
    addArmy(g, 'army_r', R, TOWN_C);
    g.addNode({
      id: 'siege_1', type: 'actor', name: 'Siege of Thornhaven',
      properties: { actorType: 'group', battleState: { battleType: 'siege', startedTick: 0, settlementId: TOWN_C, attackerArmyId: 'army_r', defenderArmyId: TOWN_C, momentum: 0, backgroundProse: '', spotlightHistory: [], ticksSinceLastSpotlight: 0, initialMomentumOffset: 0, thresholdsFired: [] } },
    });
    const early = buildCrownWorld(g, OATH_COERCE_MIN_SIEGE_TICKS - 1, projection());
    expect(coercePool(early, R)).toHaveLength(0);
    const s = stateAt(g, OATH_COERCE_MIN_SIEGE_TICKS);
    const res = executeSeekFealty(s, g.getNode(R)!, buildCrownWorld(g, s.tick, projection()));
    expect(res?.record.details?.kind).toBe('coerced');
    const oath = readOath(g.getOutgoingEdges(R2, 'sworn_to')[0]);
    expect(oath.kind).toBe('coerced');
    expect(oath.forcedBy).toBe('siege');
    expect(oath.loyalty).toBe(LOYALTY_START.coerced);
  });

  it('coerces a faction it took a town from within five days, and not after', () => {
    const g = world();
    g.addEdge({ id: 'e_taken', source: R, target: TOWN_C, type: 'controls', properties: { via: 'conquest', takenFrom: R2, establishedTick: 100 } });
    expect(coercePool(buildCrownWorld(g, 100 + 5 * PURSE_CYCLE_TICKS, projection()), R).map(c => c.id)).toEqual([R2]);
    expect(coercePool(buildCrownWorld(g, 100 + 5 * PURSE_CYCLE_TICKS + 1, projection()), R)).toHaveLength(0);
  });
});

describe('the crown phase — loyalty, breaks and the tax', () => {
  it('takes the fealty share after the vassal\'s day, never into debt, and writes both purse days', () => {
    const g = world();
    const s = stateAt(g, 24);
    swearOathForDebug(s, GUILD, R, 'persuaded');
    g.getNode(GUILD)!.properties.wealth = 0.1; // less than the share due
    g.getNode(R)!.properties.wealth = 500;     // below the treasury cap
    const before = g.getNode(R)!.properties.wealth as number;
    runCrownPhase(stateAt(g, 36), { getProjection: projection });
    expect(g.getNode(GUILD)!.properties.wealth).toBe(0);
    expect(g.getNode(R)!.properties.wealth).toBeCloseTo(before + 0.1);
    expect((g.getNode(GUILD)!.properties[PURSE_LAST_DAY_PROP] as { fealtyOut: number }).fealtyOut).toBeCloseTo(0.1);
    expect((g.getNode(R)!.properties[PURSE_LAST_DAY_PROP] as { fealtyIn: number }).fealtyIn).toBeCloseTo(0.1);

    g.getNode(GUILD)!.properties.wealth = 50;
    runCrownPhase(stateAt(g, 48), { getProjection: projection });
    expect(g.getNode(GUILD)!.properties.wealth).toBeCloseTo(50 - FEALTY_TAX_SHARE * 1);
  });

  it('a destitute liege loses loyalty; at Distrusted the oath breaks with a grudge, a cooldown and its reason', () => {
    const g = world();
    // Inside attention: the god holds the guild's town... no — the vassal's own town.
    g.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
    g.addEdge({ id: 'e_ctl_g', source: GUILD, target: TOWN_C, type: 'controls', properties: {} });
    g.addEdge({ id: 'e_asc_ctl', source: 'asc', target: TOWN_C, type: 'controls', properties: {} });
    const s = stateAt(g, 24);
    swearOathForDebug(s, GUILD, R, 'coerced');
    setDay(g, R, 10, 'Destitute');
    const edge = g.getOutgoingEdges(GUILD, 'sworn_to')[0];
    const w = buildCrownWorld(g, 36, projection());
    expect(loyaltyDeltas(w, GUILD, R, 24).find(d => d.reason === 'liege_destitute')?.amount).toBe(-LOYALTY_FALL_DESTITUTE);
    g.updateEdge(edge.id, { properties: { loyalty: 0.205 } });

    const res = runCrownPhase(stateAt(g, 36), { getProjection: projection });
    expect(res.broken).toBe(1);
    expect(g.getOutgoingEdges(GUILD, 'sworn_to')).toHaveLength(0);
    const rel = g.getOutgoingEdges(GUILD, 'relates_to').find(e => e.target === R)!;
    expect(rel.properties.oathBrokenTick).toBe(36);
    expect(rel.properties.oathBrokenReason).toBe('liege_destitute');
    expect(rel.properties.sentiment).toBeCloseTo(OATH_BREAK_SENTIMENT_DELTA);
    const line = res.chronicleEntries.find(e => e.title === 'An Oath Broken');
    expect(line?.prose).toMatch(/Silverborough Mining Consortium/);
    expect(line?.prose).not.toMatch(/sworn/i);
    // The pair may not swear again inside the cooldown.
    expect(swearOathForDebug(stateAt(g, 48), GUILD, R, 'persuaded')).toBe(true); // the debug lever ignores cooldown…
    g.removeEdge(g.getOutgoingEdges(GUILD, 'sworn_to')[0].id);
    const w2 = buildCrownWorld(g, 48, projection());
    expect(coercePool(w2, R).map(c => c.id)).not.toContain(GUILD);
  });

  it('a big realm vassal breaking away rebels: hostile both ways', () => {
    const g = world();
    setDay(g, R2, 8, 'Comfortable');
    const s = stateAt(g, 24);
    swearOathForDebug(s, R2, R, 'coerced');
    g.updateEdge(g.getOutgoingEdges(R2, 'sworn_to')[0].id, { properties: { loyalty: 0.1 } });
    runCrownPhase(stateAt(g, 36), { getProjection: projection });
    expect(g.getOutgoingEdges(R2, 'hostile_to').some(e => e.target === R && e.properties.reason === 'rebellion')).toBe(true);
    expect(g.getOutgoingEdges(R, 'hostile_to').some(e => e.target === R2)).toBe(true);
    expect(getTraces().some(t => t.category === 'rebellion')).toBe(true);
  });

  it('removes an oath whose liege has itself sworn (one-layer drift)', () => {
    const g = world();
    const s = stateAt(g, 24);
    swearOathForDebug(s, GUILD, R, 'persuaded');
    g.addEdge({ id: 'e_bad', source: R, target: R2, type: 'sworn_to', properties: { kind: 'persuaded', taxShare: 0.3, loyalty: 0.7, swornTick: 24 } });
    runCrownPhase(stateAt(g, 36), { getProjection: projection });
    expect(g.getOutgoingEdges(GUILD, 'sworn_to')).toHaveLength(0);
  });
});

describe('the Crown is derived', () => {
  it('two oaths make a Crown; protected holdings and the outline hexes follow the oaths', () => {
    const g = world();
    const s = stateAt(g, 24);
    swearOathForDebug(s, GUILD, R, 'persuaded');
    expect(isCrown(g, R)).toBe(false);
    swearOathForDebug(s, R2, R, 'persuaded');
    expect(isCrown(g, R)).toBe(true);
    expect(vassalsOf(g, R)).toEqual([R2, GUILD].sort());
    expect(protectedHoldingsOf(g, R)).toEqual([TOWN, TOWN_B].sort());
    expect([...buildCrownOf(g)]).toEqual([[R2, R]]); // only the sworn *realm* draws
    const p: RealmProjection = { ...projection(), crownOf: buildCrownOf(g) };
    expect(crownHexes(p, R).map(h => `${h.col},${h.row}`).sort()).toEqual(['1,1', '2,1']);
  });

  it('the projection carries crownOf, and the fingerprint moves with an oath', () => {
    const g = world();
    const tiles = [{ coord: { col: 1, row: 1 }, terrain: 'grassland' }, { coord: { col: 2, row: 1 }, terrain: 'grassland' }] as never;
    const fp0 = fingerprintFactionControls(g);
    swearOathForDebug(stateAt(g, 24), R2, R, 'persuaded');
    expect(fingerprintFactionControls(g)).not.toBe(fp0);
    expect(buildRealmProjection(g, tiles).crownOf?.get(R2)).toBe(R);
  });
});

describe('the sheet\'s words', () => {
  it('a vassal reads its liege, how the oath was won, and its standing — never a number', () => {
    const g = world();
    swearOathForDebug(stateAt(g, 24), GUILD, R, 'coerced');
    const edge = g.getOutgoingEdges(GUILD, 'sworn_to')[0];
    g.updateEdge(edge.id, { properties: { loyalty: 0.3, lastLoyaltyDay: { tick: 36, deltas: [{ reason: 'liege_destitute', amount: -0.01 }] } } });
    const v = fealtyView(g, GUILD).vassal!;
    const text = v.oath.map(p => (typeof p === 'string' ? p : p.text)).join('');
    expect(text).toBe('Owes fealty to Hold of Witness Skyfield for a few days, forced by siege.');
    expect(v.standing.word).toBe('Unknown');
    expect(v.standing.oneStepFromBreaking).toBe(true);
    expect(v.standing.rest).toBe('it swore under siege, and its loyalty is falling because its liege cannot pay its soldiers.');
    expect(standingWord(0.65)).toEqual({ word: 'Respected', oneStepFromBreaking: false });
    for (const s of [text, v.standing.rest]) expect(s).not.toMatch(/\d|sworn|king|queen/i);
  });

  it('a Crown reads its count in words; a faction with neither oath renders nothing', () => {
    const g = world();
    const s = stateAt(g, 24);
    swearOathForDebug(s, GUILD, R, 'persuaded');
    swearOathForDebug(s, R2, R, 'persuaded');
    const view = fealtyView(g, R);
    expect(view.crown?.count).toBe('two factions owe it fealty.');
    expect(view.liege?.vassals).toHaveLength(2);
    expect(view.liege?.moreWords).toBeNull();
    expect(fealtyView(g, THIEVES)).toEqual({ crown: null, vassal: null, liege: null });
  });

  it('the Purse sentence names the liege only when fealty was paid today', () => {
    const g = world();
    expect(fealtyPurseSentence(g, { fealtyOut: 0, fealtyTo: R })).toBeNull();
    const parts = fealtyPurseSentence(g, { fealtyOut: 0.3, fealtyTo: R })!;
    expect(parts.map(p => (typeof p === 'string' ? p : p.text)).join('')).toBe('It pays a share of all it earns to Hold of Witness Skyfield.');
  });
});
