/**
 * THR-1944 — a mortal brokers an oath (spec: the design-lane comment on THR-1944,
 * 2026-10-18b). The Warlord's Tribute demand swears the warlord's company, coerced; the
 * Faction Unification swears the best-standing faction present, persuaded. Every crown
 * rule holds, and a refusal writes nothing and names its reason.
 *
 * Falsification: dropping `brokeredBy` from `writeOath`'s props fails "demand at
 * success …"; deleting the `liegeOf(...) ??` chain in `brokerLiegeOf` fails "a mortal
 * whose realm is sworn …"; removing the `isEnemy` filter fails "never an enemy".
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { brokerOath, brokerLiegeOf, presentVassalFor, servedRealmOf } from '../crown/brokeredOath';
import { swearOathForDebug } from '../crown';
import { readOath } from '../crown/crownView';
import { fealtyView } from '../crown/fealtySentences';
import { PURSE_LAST_DAY_PROP, MEANS_BAND_PROP } from '../factionPurse';
import { LOYALTY_START, OATH_RESWEAR_COOLDOWN_DAYS } from '../../data/crown-constants';
import { PURSE_CYCLE_TICKS } from '../../data/faction-purse-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';

const R = 'faction_0';        // the mortal's realm, holds Millbrook
const R2 = 'faction_1';       // a second realm
const GUILD = 'guild_0';      // miners with a hall in Millbrook
const GUILD_B = 'guild_1';    // smiths with a hall in Millbrook, richer
const THIEVES = 'guild_9';    // never swears
const MERC = 'faction_merc';  // the warlord's company
const HERO = 'actor-hero';
const WARLORD = 'npc-warlord';
const TOWN = 'loc_town';
const TOWN_B = 'loc_town_b';

function setDay(g: WorldGraph, id: string, income: number) {
  const n = g.getNode(id)!;
  n.properties[PURSE_LAST_DAY_PROP] = {
    tick: 12,
    income: { townTax: income, placeYield: 0, landRent: 0, tolls: 0, guildWork: 0, guildTaxIn: 0, guildTaxOut: 0 },
    topSources: [], paysTo: null, upkeepOwed: 0, upkeepPaid: 0, armiesPaid: [], armiesUnpaid: [],
    brokeSinceTick: null, taxHolderOf: [], paidBy: [],
  };
  n.properties[MEANS_BAND_PROP] = 'Comfortable';
}

function buildState(tick = 120): GameState {
  const g = new WorldGraph();
  g.addNode({ id: R, name: 'Hold of Witness Skyfield', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 500 } });
  g.addNode({ id: R2, name: 'March of Shadow-Kept Dawn', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 500 } });
  g.addNode({ id: GUILD, name: 'Silverborough Mining Consortium', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'miners', homeLocationId: TOWN, wealth: 50 } });
  g.addNode({ id: GUILD_B, name: 'Anvil Brotherhood', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'smiths', homeLocationId: TOWN, wealth: 50 } });
  g.addNode({ id: THIEVES, name: 'Night Hands', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'thieves', homeLocationId: TOWN, wealth: 50 } });
  g.addNode({ id: MERC, name: 'Scarlet Company', type: 'actor', properties: { actorType: 'faction', factionClass: 'mercenary', wealth: 80 } });
  g.addNode({ id: TOWN, name: 'Millbrook', type: 'location', properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 } });
  g.addNode({ id: TOWN_B, name: 'Harrow', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 1 } });
  g.addNode({ id: HERO, name: 'Maret', type: 'actor', properties: { actorType: 'individual' } });
  g.addNode({ id: WARLORD, name: 'Ulric the Red', type: 'actor', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'e_ctl_town', source: R, target: TOWN, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_ctl_town_b', source: R2, target: TOWN_B, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_guild_hall', source: GUILD, target: TOWN, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_guildb_hall', source: GUILD_B, target: TOWN, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_thief_hall', source: THIEVES, target: TOWN, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_hero_at', source: HERO, target: TOWN, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_hero_r', source: HERO, target: R, type: 'member_of', properties: { rank: 0.5 } });
  g.addEdge({ id: 'e_warlord_merc', source: WARLORD, target: MERC, type: 'member_of', properties: { rank: 1 } });
  setDay(g, R, 10);
  setDay(g, R2, 4);
  setDay(g, GUILD, 1);
  setDay(g, GUILD_B, 3);
  setDay(g, THIEVES, 5);
  setDay(g, MERC, 2);
  return {
    graph: g, tick, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc',
    tickEvents: [], recentEvents: [], unifiedActions: [], actionsInProgress: [],
  } as unknown as GameState;
}

function oathOf(state: GameState, vassalId: string) {
  const e = state.graph.getOutgoingEdges(vassalId, 'sworn_to')[0];
  return e ? { liegeId: e.target, ...readOath(e) } : null;
}

function action(): UnifiedAction {
  return {
    actionId: 'ua_tribute', actorId: HERO, templateId: 'reputation.iron.warlords_tribute',
    targetId: HERO, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: [{ key: 'warlord', nodeId: WARLORD }],
  } as unknown as UnifiedAction;
}

function applyEffects(state: GameState, effects: EncounterAftermathReactionEffect[], runtime: SimulationRuntime) {
  const reaction = { id: 'rx-outcome', label: 'Outcome', effects } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, action(), reaction, state.tick, runtime);
}

const DEMAND: EncounterAftermathReactionEffect = {
  kind: 'faction_broker_fealty', brokerAgentId: '$actor', vassalAgentId: '$cast:warlord', oathKind: 'coerced', forcedBy: 'demand',
};
const UNIFY: EncounterAftermathReactionEffect = { kind: 'faction_broker_fealty', brokerAgentId: '$actor', oathKind: 'persuaded' };

function effectTraces() {
  return getTraces().filter(t => t.category === 'encounter_aftermath_effect'
    && (t as unknown as { effectKind?: string }).effectKind === 'faction_broker_fealty') as unknown as
    { success: boolean; failReason?: string }[];
}

let runtime: SimulationRuntime;
beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('who the liege is', () => {
  it('the realm the mortal serves, highest rank, ties to the lower id', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'e_hero_r2', source: HERO, target: R2, type: 'member_of', properties: { rank: 0.5 } });
    expect(servedRealmOf(state.graph, HERO)).toBe(R);
    state.graph.updateEdge('e_hero_r2', { properties: { rank: 0.9 } });
    expect(servedRealmOf(state.graph, HERO)).toBe(R2);
  });

  it('a mortal whose realm is sworn brokers for that realm\'s liege', () => {
    const state = buildState();
    expect(swearOathForDebug(state, R, R2, 'persuaded')).toBe(true);
    expect(brokerLiegeOf(state.graph, HERO)).toBe(R2);
    const result = brokerOath(state, { brokerId: HERO, vassalAgentId: WARLORD, kind: 'coerced', forcedBy: 'demand' });
    expect(result.sworn).toBe(true);
    expect(oathOf(state, MERC)?.liegeId).toBe(R2);
  });
});

describe('the Warlord\'s Tribute — a demanded oath', () => {
  it('demand at success swears the warlord\'s company to the mortal\'s realm, coerced, forced by a demand', () => {
    const state = buildState();
    const { state: next } = applyEffects(state, [DEMAND], runtime);
    const oath = oathOf(next, MERC);
    expect(oath).not.toBeNull();
    expect(oath!.liegeId).toBe(R);
    expect(oath!.kind).toBe('coerced');
    expect(oath!.forcedBy).toBe('demand');
    expect(oath!.brokeredBy).toBe(HERO);
    expect(oath!.loyalty).toBe(LOYALTY_START.coerced);
    expect(oath!.giftPaid).toBe(0);
    const sworn = getTraces().find(t => t.category === 'oath_sworn') as unknown as { brokeredBy?: string };
    expect(sworn.brokeredBy).toBe(HERO);
    expect(effectTraces()).toEqual([expect.objectContaining({ success: true })]);
    expect(next.tickEvents.some(e => e.message.includes('Scarlet Company swore fealty to Hold of Witness Skyfield'))).toBe(true);
  });

  it('a mortal in no realm writes nothing and traces no_realm', () => {
    const state = buildState();
    state.graph.removeEdge('e_hero_r');
    const { state: next } = applyEffects(state, [DEMAND], runtime);
    expect(oathOf(next, MERC)).toBeNull();
    expect(effectTraces()).toEqual([expect.objectContaining({ success: false, failReason: 'no_realm' })]);
  });

  it('an already-sworn company writes nothing', () => {
    const state = buildState();
    expect(swearOathForDebug(state, MERC, R2, 'persuaded')).toBe(true);
    const { state: next } = applyEffects(state, [DEMAND], runtime);
    expect(next.graph.getOutgoingEdges(MERC, 'sworn_to').map(e => e.target)).toEqual([R2]);
    expect(effectTraces()).toEqual([expect.objectContaining({ success: false, failReason: 'may_not_swear' })]);
  });

  it('a pair on the re-swear cooldown writes nothing', () => {
    const state = buildState();
    state.graph.addEdge({
      id: 'e_rel_merc_r', source: MERC, target: R, type: 'relates_to',
      properties: { sentiment: -0.2, oathBrokenTick: state.tick - (OATH_RESWEAR_COOLDOWN_DAYS * PURSE_CYCLE_TICKS - 1) },
    });
    const { state: next } = applyEffects(state, [DEMAND], runtime);
    expect(oathOf(next, MERC)).toBeNull();
    expect(effectTraces()).toEqual([expect.objectContaining({ success: false, failReason: 'cooldown' })]);
  });

  it('the shipped tribute swears only on the demand path\'s winning bands', () => {
    const template = getUnifiedTemplateById('reputation.iron.warlords_tribute');
    const variants = template?.aftermathConfig?.variants ?? {};
    const demand = variants.demand_the_oath?.outcomeEffects ?? {};
    for (const band of ['critical_success', 'success', 'success_at_cost'] as const) {
      expect(demand[band]?.some(e => e.kind === 'faction_broker_fealty')).toBe(true);
    }
    expect(demand.failure).toBeUndefined();
    expect(demand.critical_failure).toBeUndefined();
    for (const key of ['accept_the_tribute', 'withdraw_your_hand']) {
      const table = variants[key]?.outcomeEffects ?? {};
      expect(Object.values(table).flat().some(e => e?.kind === 'faction_broker_fealty')).toBe(false);
    }
  });
});

describe('the Faction Unification — a persuaded oath', () => {
  it('picks the present faction with the best standing toward the liege, never an enemy', () => {
    const state = buildState();
    // The smiths earn more, but are the realm's rivals; the miners are allied.
    state.graph.addEdge({ id: 'e_rival', source: GUILD_B, target: R, type: 'relates_to', properties: { sentiment: -0.5, isRival: true } });
    expect(presentVassalFor(state, HERO, R)).toBe(GUILD);
    state.graph.removeEdge('e_rival');
    // With no standing on either side, the higher day income wins.
    expect(presentVassalFor(state, HERO, R)).toBe(GUILD_B);
    state.graph.addEdge({ id: 'e_ally', source: GUILD, target: R, type: 'relates_to', properties: { sentiment: 0.6, isAlliance: true } });
    expect(presentVassalFor(state, HERO, R)).toBe(GUILD);
  });

  it('a win swears it persuaded, and the sheet names the broker', () => {
    const state = buildState();
    const { state: next } = applyEffects(state, [UNIFY], runtime);
    const oath = oathOf(next, GUILD_B);
    expect(oath?.liegeId).toBe(R);
    expect(oath?.kind).toBe('persuaded');
    expect(oath?.brokeredBy).toBe(HERO);
    expect(next.graph.getOutgoingEdges(THIEVES, 'sworn_to')).toHaveLength(0);
    const v = fealtyView(next.graph, GUILD_B).vassal!;
    expect(v.oath).toContainEqual({ text: 'Maret', ref: { kind: 'agent', id: HERO } });
    expect(v.oath.map(p => (typeof p === 'string' ? p : p.text)).join('')).toMatch(/won by Maret's word\.$/);
  });

  it('only one faction swears per win', () => {
    const state = buildState();
    const { state: next } = applyEffects(state, [UNIFY], runtime);
    expect(next.graph.getEdgesByType('sworn_to')).toHaveLength(1);
  });

  it('the shipped unification swears on its three winning bands only', () => {
    const table = getUnifiedTemplateById('encounter.faction_unification')?.outcomeEffects ?? {};
    for (const band of ['critical_success', 'success', 'success_at_cost'] as const) {
      expect(table[band]).toEqual([{ kind: 'faction_broker_fealty', brokerAgentId: '$actor', oathKind: 'persuaded' }]);
    }
    expect(table.failure).toBeUndefined();
  });
});

describe('the sheet\'s words for a demanded oath', () => {
  it('reads "forced by <broker>\'s demand" with the broker linked', () => {
    const state = buildState();
    const { state: next } = applyEffects(state, [DEMAND], runtime);
    const v = fealtyView(next.graph, MERC).vassal!;
    expect(v.oath.map(p => (typeof p === 'string' ? p : p.text)).join('')).toMatch(/forced by Maret's demand\.$/);
    expect(v.standing.rest.startsWith('it swore because it was made to')).toBe(true);
  });
});
