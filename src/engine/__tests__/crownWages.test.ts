/**
 * The crown — wages: a liege pays, feeds and commands its vassal's soldiers (THR-1974).
 *
 * Plan `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md` § Done when. Fixture
 * proofs: the price is never free (rule 1), the liege pays the soldiers its vassal cannot,
 * keeping its reserve (rule 2), the paid army eats from the liege's towns (rule 3) and
 * fights the liege's enemies — never its paymaster, never its own halls (rule 4); a vassal
 * that pays its own army keeps its own wars; a hired host lasts 30 days on an empty purse;
 * the Means term, the chronicle de-duplication and the sheet's words. The seed-level
 * predicates are measured by `npm run measure:crown-wages`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { RealmProjection } from '../realmProjection';
import type { ArmyState } from '../../types/army';
import { runCrownPhase, swearOathForDebug } from '../crown';
import { buildCrownWorld, oathValueOf } from '../crown/eligibility';
import { affordableGift, giftCost } from '../crown/offer';
import { readOath, oathOf } from '../crown/crownView';
import { payingLiegeOf } from '../crown/wages';
import { vassalWagesLine, wagesPurseSentence, fealtyView } from '../crown/fealtySentences';
import { commanderFactionOf, mayBesiege } from '../warAims/enemy';
import { supplyFactionsOf, resolveSupplyLine, isSupplyHost } from '../armySupply';
import { armyAimView } from '../warAims/sheetView';
import { runFactionPurse, readPurseDay, PURSE_LAST_DAY_PROP, MEANS_BAND_PROP } from '../factionPurse';
import { upkeepOf } from '../factionPurse/upkeep';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import { LIEGE_WAGE_RESERVE_DAYS, LIEGE_COMMAND_WINDOW_TICKS, OATH_GIFT_DAYS, WAGES_CHRONICLE_MIN_GAP_DAYS } from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS, ARMY_UPKEEP_PER_DAY } from '../../data/faction-purse-constants';
import { FEALTY_WAGE_LINES } from '../../data/army-words';

const R = 'faction_0';        // the liege realm
const ENEMY = 'faction_1';    // the liege's enemy realm
const CO = 'faction_co';      // a free company
const GUILD = 'guild_0';      // an armyless guild
const TOWN = 'loc_town';      // R's town
const TOWN_E = 'loc_town_e';  // the enemy's town
const CAMP = 'loc_camp';      // the company's hall town, held by nobody

function setDay(g: WorldGraph, id: string, tick: number, income: number, armiesUnpaid: string[] = []) {
  const n = g.getNode(id)!;
  n.properties[PURSE_LAST_DAY_PROP] = {
    tick,
    income: { townTax: income, placeYield: 0, landRent: 0, tolls: 0, guildWork: 0, guildTaxIn: 0, guildTaxOut: 0 },
    topSources: [], paysTo: null, upkeepOwed: 0, upkeepPaid: 0, armiesPaid: [], armiesUnpaid,
    brokeSinceTick: null, taxHolderOf: [], paidBy: [],
  };
  n.properties[MEANS_BAND_PROP] = 'Comfortable';
}

function addArmy(g: WorldGraph, id: string, factionId: string, at: string, size: ArmyState['size'] = 'host') {
  g.addNode({
    id, type: 'actor', name: `${id} host`,
    properties: {
      actorType: 'group', groupKind: 'army',
      armyState: { size, headcount: 300, objective: null, cohesion: 60, cohesionMax: 60, raisedTick: 0, maintenanceCost: 5, thresholdsFired: [], paidThroughTick: 0 },
    },
  });
  g.addEdge({ id: `e_mo_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'army' } });
  g.addEdge({ id: `e_at_${id}`, source: id, target: at, type: 'located_at', properties: {} });
}

function world(liegeWealth = 1000): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: R, name: 'Hold of Witness Skyfield', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: liegeWealth } });
  g.addNode({ id: ENEMY, name: 'March of Shadow-Kept Dawn', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 100 } });
  g.addNode({ id: CO, name: 'Scarlet Company', type: 'actor', properties: { actorType: 'faction', factionClass: 'mercenary', factionDefId: 'mercenary_company', homeLocationId: CAMP, wealth: 0 } });
  g.addNode({ id: GUILD, name: 'Silverborough Mining Consortium', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'miners', homeLocationId: TOWN, wealth: 50 } });
  for (const [id, name, col] of [[TOWN, 'Millbrook', 1], [TOWN_E, 'Harrow', 3], [CAMP, 'Ashford', 2]] as const) {
    g.addNode({ id, name, type: 'location', properties: { locationSubtype: 'town', hexCol: col, hexRow: 1, resourceBalance: 10 } });
  }
  g.addEdge({ id: 'e_ctl_town', source: R, target: TOWN, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_ctl_town_e', source: ENEMY, target: TOWN_E, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_road_1', source: CAMP, target: TOWN, type: 'road', properties: {} });
  g.addEdge({ id: 'e_road_2', source: CAMP, target: TOWN_E, type: 'road', properties: {} });
  g.addEdge({ id: 'e_hostile', source: R, target: ENEMY, type: 'hostile_to', properties: {} });
  addArmy(g, 'army_co', CO, CAMP);
  return g;
}

function stateAt(graph: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return { graph, tick, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc', ...extra } as unknown as GameState;
}

function projection(): RealmProjection {
  return {
    realms: [
      { id: R, name: R, seatHex: { col: 1, row: 1 }, seatLocationId: TOWN, heldLocationIds: [TOWN], hexes: [{ col: 1, row: 1 }] },
      { id: ENEMY, name: ENEMY, seatHex: { col: 3, row: 1 }, seatLocationId: TOWN_E, heldLocationIds: [TOWN_E], hexes: [{ col: 3, row: 1 }] },
    ],
    hexRealmId: new Map([['1,1', R], ['3,1', ENEMY]]),
    unclaimedHexes: 0,
  };
}

/** Swear the company to R and give both a purse day at `tick` with the company's host unpaid. */
function hired(tick = 24, liegeWealth = 1000): { g: WorldGraph; s: GameState } {
  const g = world(liegeWealth);
  const s = stateAt(g, tick);
  expect(swearOathForDebug(s, CO, R, 'bought')).toBe(true);
  setDay(g, CO, tick, 0.4, ['army_co']);
  setDay(g, R, tick, 10);
  return { g, s };
}

const army = (g: WorldGraph, id = 'army_co') => g.getNode(id)!.properties.armyState as ArmyState;

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('rule 1 — the price is what a faction costs to keep', () => {
  it('a free company fielding nothing is priced on the host it would raise, never free', () => {
    const g = world();
    g.removeNode('army_co');
    const value = oathValueOf(g, CO, 0.1);
    expect(value).toBeGreaterThan(0);
    // No Gold tier in the fixture: the spawn's own rule picks a warband.
    expect(value).toBe(upkeepOf('warband'));
  });

  it('a faction fielding an army is priced on its upkeep when that exceeds its income', () => {
    const g = world();
    expect(oathValueOf(g, CO, 0.4)).toBe(ARMY_UPKEEP_PER_DAY.host);
    expect(oathValueOf(g, CO, 9)).toBe(9);
  });

  it('an armyless guild is still priced on its income', () => {
    const g = world();
    expect(oathValueOf(g, GUILD, 1.2)).toBe(1.2);
  });

  it('the gift reads the value: a full gift is OATH_GIFT_DAYS × the upkeep', () => {
    const g = world();
    setDay(g, CO, 12, 0.4);
    setDay(g, R, 12, 10);
    const w = buildCrownWorld(g, 24, projection());
    expect(w.oathValue.get(CO)).toBe(ARMY_UPKEEP_PER_DAY.host);
    expect(giftCost(w, CO, 1)).toBeCloseTo(OATH_GIFT_DAYS * ARMY_UPKEEP_PER_DAY.host);
    expect(affordableGift(w, CO, R)).toBeGreaterThan(0);
  });
});

describe('rule 2 — the liege pays the soldiers', () => {
  it('covers the unpaid host, stamps it, and writes the wage beside the purse verdict', () => {
    const { g, s } = hired();
    const result = runCrownPhase(s);
    const cost = upkeepOf('host');
    expect(result.wagesPaid).toBeCloseTo(cost);
    expect(army(g).paidThroughTick).toBe(24);
    expect(army(g).liegePaidTick).toBe(24);
    expect(g.getNode(R)!.properties.wealth).toBeCloseTo(1000 - cost + (readOath(oathOf(g, CO)!).taxPaidToday ?? 0));
    const coDay = readPurseDay(g.getNode(CO))!;
    expect(coDay.armiesUnpaid).toEqual(['army_co']); // the purse's own verdict, never rewritten
    expect(coDay.armiesPaidByLiege).toEqual(['army_co']);
    expect(coDay.wagesFromLiege).toBeCloseTo(cost);
    expect(readPurseDay(g.getNode(R))!.wagesToVassals).toBeCloseTo(cost);
    const t = getTraces().find(x => x.category === 'oath_wages') as unknown as { started: boolean; armiesCovered: string[] };
    expect(t.started).toBe(true);
    expect(t.armiesCovered).toEqual(['army_co']);
  });

  it('never takes the liege below its reserve of its own soldiers\' pay', () => {
    // The liege fields a host of its own: reserve = 2 days × 3.5 = 7. With 9 coin it has
    // 2 spare, short of the company host's 3.5 — so it pays nothing.
    const { g, s } = hired(24, 9);
    addArmy(g, 'army_r', R, TOWN);
    runCrownPhase(s);
    expect(army(g).liegePaidTick).toBeUndefined();
    expect(g.getNode(R)!.properties.wealth).toBeGreaterThanOrEqual(LIEGE_WAGE_RESERVE_DAYS * upkeepOf('host'));
    expect(readPurseDay(g.getNode(CO))!.wagesFromLiege).toBeUndefined();
  });

  it('pays whole armies in id order; the first it cannot cover and all after stay unpaid', () => {
    const { g, s } = hired(24, 5);
    addArmy(g, 'army_co2', CO, CAMP);
    setDay(g, CO, 24, 0.4, ['army_co', 'army_co2']);
    runCrownPhase(s);
    expect(army(g).liegePaidTick).toBe(24);
    expect(army(g, 'army_co2').liegePaidTick).toBeUndefined();
    expect(vassalWagesLine(readPurseDay(g.getNode(CO)))).toBe(FEALTY_WAGE_LINES.partial);
  });

  it('a vassal with no purse day today gets no wage', () => {
    const { g, s } = hired();
    setDay(g, CO, 12, 0.4, ['army_co']);
    runCrownPhase(s);
    expect(army(g).liegePaidTick).toBeUndefined();
  });
});

describe('rules 3 and 4 — the liege feeds and commands the army it paid', () => {
  it('commands for one pay day, then the army fights under its own banner again', () => {
    const { g, s } = hired();
    expect(commanderFactionOf(g, 'army_co', 24)).toBe(CO);
    runCrownPhase(s);
    expect(commanderFactionOf(g, 'army_co', 24)).toBe(R);
    expect(commanderFactionOf(g, 'army_co', 24 + LIEGE_COMMAND_WINDOW_TICKS)).toBe(R);
    expect(commanderFactionOf(g, 'army_co', 24 + LIEGE_COMMAND_WINDOW_TICKS + 1)).toBe(CO);
  });

  it('a broken oath ends the command at once (the liege is read from the live edge)', () => {
    const { g, s } = hired();
    runCrownPhase(s);
    g.removeEdge(oathOf(g, CO)!.id);
    expect(payingLiegeOf(g, 'army_co', 25)).toBeUndefined();
    expect(commanderFactionOf(g, 'army_co', 25)).toBe(CO);
  });

  it('own wars kept: a realm vassal that pays its own army commands it every tick', () => {
    const g = world();
    const s = stateAt(g, 24);
    g.removeEdge('e_hostile');
    expect(swearOathForDebug(s, ENEMY, R, 'persuaded')).toBe(true);
    addArmy(g, 'army_e', ENEMY, TOWN_E);
    setDay(g, ENEMY, 24, 10, []);
    setDay(g, R, 24, 10);
    for (let t = 24; t <= 24 + 3 * PURSE_CYCLE_TICKS; t += PURSE_CYCLE_TICKS) {
      setDay(g, ENEMY, t, 10, []);
      setDay(g, R, t, 10);
      runCrownPhase(stateAt(g, t));
      for (let k = 0; k < PURSE_CYCLE_TICKS; k++) expect(commanderFactionOf(g, 'army_e', t + k)).toBe(ENEMY);
    }
  });

  it('eats from its own and the liege\'s towns while paid', () => {
    const { g, s } = hired();
    expect(supplyFactionsOf(g, 'army_co', 24)).toEqual([CO]);
    expect(resolveSupplyLine(s, CAMP, supplyFactionsOf(g, 'army_co', 24)).hostId).toBeNull();
    runCrownPhase(s);
    const feeders = supplyFactionsOf(g, 'army_co', 24);
    expect(feeders).toEqual([CO, R]);
    expect(isSupplyHost(s, TOWN, feeders)).toBe(true);
    expect(resolveSupplyLine(s, CAMP, feeders).hostId).toBe(TOWN);
  });

  it('no march on the paymaster: never besieges the liege, nor its own hall town', () => {
    const { g, s } = hired();
    runCrownPhase(s);
    const commander = commanderFactionOf(g, 'army_co', 24)!;
    expect(mayBesiege(g, commander, ENEMY, TOWN_E, undefined, CO)).toBe(true);
    expect(mayBesiege(g, commander, R, TOWN, undefined, CO)).toBe(false);
    // The company's own hall town, even if an enemy of the liege takes it.
    g.addEdge({ id: 'e_ctl_camp', source: ENEMY, target: CAMP, type: 'controls', properties: {} });
    expect(mayBesiege(g, commander, ENEMY, CAMP, undefined, CO)).toBe(false);
  });
});

describe('a hired host lasts', () => {
  it('a company with an empty purse keeps its host for 30 days, fed and paid by its liege', () => {
    const g = world();
    const s0 = stateAt(g, 12);
    expect(swearOathForDebug(s0, CO, R, 'bought')).toBe(true);
    const getProjection = () => projection();
    for (let day = 1; day <= 30; day++) {
      const s = stateAt(g, day * PURSE_CYCLE_TICKS);
      runFactionPurse(s, getProjection);
      runCrownPhase(s, { getProjection });
      expect(army(g).paidThroughTick).toBe(s.tick); // never underfunded, so never deserts
    }
    expect(g.getNode('army_co')).toBeDefined();
    expect(commanderFactionOf(g, 'army_co', 30 * PURSE_CYCLE_TICKS)).toBe(R);
    expect(supplyFactionsOf(g, 'army_co', 30 * PURSE_CYCLE_TICKS)).toContain(R);
  });

  it('the liege\'s Means counts yesterday\'s wages', () => {
    const g = world();
    expect(swearOathForDebug(stateAt(g, 12), CO, R, 'bought')).toBe(true);
    const getProjection = () => projection();
    for (const tick of [12, 24]) {
      const s = stateAt(g, tick);
      runFactionPurse(s, getProjection);
      runCrownPhase(s, { getProjection });
    }
    const trace = getTraces().filter(t => t.category === 'economy.purse.day' && (t as unknown as { factionId: string }).factionId === R).pop() as unknown as { wagesToVassals?: number };
    expect(trace.wagesToVassals).toBeCloseTo(upkeepOf('host'));
  });
});

describe('the words', () => {
  it('the army sheet names the liege that pays its soldiers, only while the stamp is fresh', () => {
    const { g, s } = hired();
    g.updateNode('army_co', { properties: { armyState: { ...army(g), objective: { type: 'conquer', targetNodeId: TOWN_E, estimatedAttrition: 0, reason: 'richest', source: 'war_aim' } } } });
    expect(armyAimView(g, 'army_co', 24)?.slots.liege ?? null).toBeNull();
    runCrownPhase(s);
    const view = armyAimView(g, 'army_co', 24)!;
    expect(view.template).toBe('Marching to take {town} for {liege}, which pays its soldiers.');
    expect(view.slots.liege).toEqual({ id: R, name: 'Hold of Witness Skyfield', kind: 'faction' });
    expect(armyAimView(g, 'army_co', 24 + LIEGE_COMMAND_WINDOW_TICKS + 1)?.slots.liege ?? null).toBeNull();
  });

  it('the fealty clause and the liege\'s purse sentence', () => {
    const { g, s } = hired();
    expect(fealtyView(g, CO).vassal?.wages).toBeNull();
    runCrownPhase(s);
    expect(fealtyView(g, CO).vassal?.wages).toBe(FEALTY_WAGE_LINES.all);
    const sentence = wagesPurseSentence(g, R)!;
    expect(sentence[0]).toBe(FEALTY_WAGE_LINES.purseLead);
    expect(sentence[1]).toEqual({ text: 'Scarlet Company', ref: { kind: 'faction', id: CO } });
    expect(sentence[2]).toBe('.');
    expect(wagesPurseSentence(g, ENEMY)).toBeNull();
  });

  it('no banned word on any wage surface', () => {
    const words = [...Object.values(FEALTY_WAGE_LINES), 'Marching to take {town} for {liege}, which pays its soldiers.'];
    for (const w of words) expect(w).not.toMatch(/mercenar|contract|hire|king|queen|sworn/i);
  });
});

describe('the chronicle', () => {
  it('tells pay taken up inside attention, then waits WAGES_CHRONICLE_MIN_GAP_DAYS before the stop', () => {
    const { g } = hired();
    g.addNode({ id: 'asc', name: 'The god', type: 'actor', properties: { actorType: 'ascendant' } });
    g.addEdge({ id: 'e_asc_ctl', source: 'asc', target: TOWN, type: 'controls', properties: {} });
    const first = runCrownPhase(stateAt(g, 24));
    expect(first.chronicleEntries.some(e => /pays the soldiers of Scarlet Company|keeps the soldiers of Scarlet Company|into its pay/.test(e.prose))).toBe(true);
    // The next day the liege is broke: the pay stops, but inside the gap no line is told.
    g.getNode(R)!.properties.wealth = 0;
    setDay(g, CO, 36, 0.4, ['army_co']);
    setDay(g, R, 36, 10);
    const second = runCrownPhase(stateAt(g, 36));
    expect(second.chronicleEntries.filter(e => /soldiers of Scarlet Company/.test(e.prose))).toHaveLength(0);
    const stop = getTraces().filter(t => t.category === 'oath_wages').pop() as unknown as { stopped: boolean };
    expect(stop.stopped).toBe(true);
    expect(WAGES_CHRONICLE_MIN_GAP_DAYS).toBeGreaterThan(1);
  });
});
