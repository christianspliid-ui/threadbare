/**
 * THR-2051 — an oath from tribute (plan: Docs/plans/2026-10-26-thr-2051-oath-from-tribute.md).
 * A won Tribute Exchange swears the actor's own house to the crown the hall's town answers
 * to: the realm that holds it, or the realm its temple order / company / guild holder is
 * sworn to. The brokered oath's every crown rule holds; a refusal writes nothing and names
 * its reason.
 *
 * Falsification: deleting the non-realm branch of `townLiegeOf` fails "a town a sworn
 * temple order holds …"; dropping `liegeFrom` from the aftermath case's `brokerOath` call
 * fails the same test (the guild swears to the hero's own realm R2, not R); removing
 * `TRIBUTE_OATH` from a success band fails the content test.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { brokerOath, townLiegeOf } from '../crown/brokeredOath';
import { swearOathForDebug } from '../crown';
import { readOath } from '../crown/crownView';
import { fealtyView } from '../crown/fealtySentences';
import { PURSE_LAST_DAY_PROP, MEANS_BAND_PROP } from '../factionPurse';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { TRIBUTE_OATH } from '../../data/encounter-content';
import { MEANS_STEP, MEANS_STEP_BIG } from '../../data/mortal-means-constants';

const R = 'faction_0';          // a realm, seat at Millbrook; the temple order of Ashford swears to it
const R2 = 'faction_1';         // the hero's own realm, seat at Harrow
const ORDER = 'faction_order';  // a temple order holding Ashford
const MERC = 'faction_merc';    // a free company holding Stonegate, sworn to nobody
const GUILD = 'guild_0';        // the hero's guild — their house
const HERO = 'actor-hero';
const TOWN = 'loc_town';        // Millbrook — R's seat
const TOWN_B = 'loc_town_b';    // Harrow — R2's seat
const TEMPLE_TOWN = 'loc_ashford';
const COMPANY_TOWN = 'loc_stonegate';
const OPEN_TOWN = 'loc_nowhere';

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

/** The hero stands in `at`, serves R2 and belongs to the miners' guild. The order is sworn to R. */
function buildState(at: string, opts: { guild?: boolean } = {}): GameState {
  const g = new WorldGraph();
  g.addNode({ id: R, name: 'Valen', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 500 } });
  g.addNode({ id: R2, name: 'March of Harrow', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 500 } });
  g.addNode({ id: ORDER, name: 'Temple Court of Ashford', type: 'actor', properties: { actorType: 'faction', factionClass: 'religious', wealth: 80 } });
  g.addNode({ id: MERC, name: 'Scarlet Company', type: 'actor', properties: { actorType: 'faction', factionClass: 'mercenary', wealth: 80 } });
  g.addNode({ id: GUILD, name: 'Ironwrights', type: 'actor', properties: { actorType: 'faction', factionClass: 'guild', guildType: 'smiths', homeLocationId: TOWN, wealth: 50 } });
  for (const [id, name, col] of [[TOWN, 'Millbrook', 1], [TOWN_B, 'Harrow', 5], [TEMPLE_TOWN, 'Ashford', 9], [COMPANY_TOWN, 'Stonegate', 13], [OPEN_TOWN, 'Nowhere', 17]] as const) {
    g.addNode({ id, name, type: 'location', properties: { locationSubtype: 'town', hexCol: col, hexRow: 1 } });
  }
  g.addNode({ id: HERO, name: 'Wren Callow', type: 'actor', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'e_ctl_town', source: R, target: TOWN, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_ctl_town_b', source: R2, target: TOWN_B, type: 'controls', properties: { role: 'seat' } });
  g.addEdge({ id: 'e_ctl_temple', source: ORDER, target: TEMPLE_TOWN, type: 'controls', properties: {} });
  g.addEdge({ id: 'e_ctl_company', source: MERC, target: COMPANY_TOWN, type: 'controls', properties: {} });
  g.addEdge({ id: 'e_hero_at', source: HERO, target: at, type: 'located_at', properties: {} });
  g.addEdge({ id: 'e_hero_r2', source: HERO, target: R2, type: 'member_of', properties: { rank: 0.5 } });
  if (opts.guild !== false) g.addEdge({ id: 'e_hero_guild', source: HERO, target: GUILD, type: 'member_of', properties: { rank: 0.5 } });
  for (const [id, income] of [[R, 10], [R2, 4], [ORDER, 3], [MERC, 2], [GUILD, 1]] as const) setDay(g, id, income);
  const state = {
    graph: g, tick: 120, seed: 42, chronicleEntries: [], tiles: [], ascendantId: 'asc',
    tickEvents: [], recentEvents: [], unifiedActions: [], actionsInProgress: [],
  } as unknown as GameState;
  expect(swearOathForDebug(state, ORDER, R, 'persuaded')).toBe(true);
  return state;
}

function oathOf(state: GameState, vassalId: string) {
  const e = state.graph.getOutgoingEdges(vassalId, 'sworn_to')[0];
  return e ? { liegeId: e.target, ...readOath(e) } : null;
}

function applyTribute(state: GameState, runtime: SimulationRuntime, effects: EncounterAftermathReactionEffect[] = [TRIBUTE_OATH]) {
  const action = {
    actionId: 'ua_tribute', actorId: HERO, templateId: 'encounter.tribute_exchange',
    targetId: HERO, scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
  const reaction = { id: 'rx-outcome', label: 'Outcome', effects } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, action, reaction, state.tick, runtime);
}

function effectTraces() {
  return getTraces().filter(t => t.category === 'encounter_aftermath_effect'
    && (t as unknown as { effectKind?: string }).effectKind === 'faction_broker_fealty') as unknown as
    { success: boolean; failReason?: string; effectDetail: { liegeFrom?: string } }[];
}

let runtime: SimulationRuntime;
beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('the crown the hall\'s town answers to', () => {
  it('a town a sworn temple order holds answers to that order\'s realm', () => {
    expect(townLiegeOf(buildState(TEMPLE_TOWN), HERO)).toBe(R);
  });

  it('a town a realm holds answers to that realm, or its own liege one layer up', () => {
    const state = buildState(TOWN_B);
    expect(townLiegeOf(state, HERO)).toBe(R2);
    expect(swearOathForDebug(state, R2, R, 'persuaded')).toBe(true);
    expect(townLiegeOf(state, HERO)).toBe(R);
  });

  it('a town held by nobody, or by an unsworn company, answers to no crown', () => {
    expect(townLiegeOf(buildState(OPEN_TOWN), HERO)).toBeNull();
    expect(townLiegeOf(buildState(COMPANY_TOWN), HERO)).toBeNull();
  });
});

describe('the tribute oath', () => {
  it('a town a sworn temple order holds: the actor\'s guild swears to that order\'s realm, persuaded, by their word', () => {
    const { state: next } = applyTribute(buildState(TEMPLE_TOWN), runtime);
    const oath = oathOf(next, GUILD);
    expect(oath?.liegeId).toBe(R);
    expect(oath?.kind).toBe('persuaded');
    expect(oath?.brokeredBy).toBe(HERO);
    expect(next.graph.getEdgesByType('sworn_to')).toHaveLength(2); // the order's and the guild's
    const v = fealtyView(next.graph, GUILD).vassal!;
    expect(v.oath.map(p => (typeof p === 'string' ? p : p.text)).join('')).toMatch(/won by Wren Callow's word\.$/);
    expect(effectTraces()).toEqual([expect.objectContaining({ success: true, effectDetail: expect.objectContaining({ liegeFrom: 'scene_town' }) })]);
  });

  it('a town a realm holds directly: the guild swears to that realm', () => {
    const { state: next } = applyTribute(buildState(TOWN), runtime);
    expect(oathOf(next, GUILD)?.liegeId).toBe(R);
  });

  it('a town held by nobody or by an unsworn company swears nothing and traces no_realm', () => {
    for (const at of [OPEN_TOWN, COMPANY_TOWN]) {
      clearTraces();
      const { state: next } = applyTribute(buildState(at), runtime);
      expect(oathOf(next, GUILD)).toBeNull();
      expect(effectTraces()).toEqual([expect.objectContaining({ success: false, failReason: 'no_realm' })]);
    }
  });

  it('an actor with only a realm membership swears nothing and traces no_vassal', () => {
    const { state: next } = applyTribute(buildState(TEMPLE_TOWN, { guild: false }), runtime);
    expect(oathOf(next, R2)).toBeNull();
    expect(next.graph.getEdgesByType('sworn_to')).toHaveLength(1);
    expect(effectTraces()).toEqual([expect.objectContaining({ success: false, failReason: 'no_vassal' })]);
  });

  it('without liegeFrom the brokered oath still goes to the broker\'s own realm (THR-1944 unchanged)', () => {
    const state = buildState(TEMPLE_TOWN);
    const result = brokerOath(state, { brokerId: HERO, vassalAgentId: HERO, kind: 'persuaded' });
    expect(result).toEqual(expect.objectContaining({ sworn: true, vassalId: GUILD, liegeId: R2 }));
  });

  it('the default source is recorded on the trace', () => {
    applyTribute(buildState(TEMPLE_TOWN), runtime, [{ kind: 'faction_broker_fealty', brokerAgentId: '$actor', vassalAgentId: '$actor', oathKind: 'persuaded' }]);
    expect(effectTraces()).toEqual([expect.objectContaining({ effectDetail: expect.objectContaining({ liegeFrom: 'broker_realm' }) })]);
  });
});

describe('the shipped Tribute Exchange', () => {
  it('swears on its three winning bands only, and its Means rows are unchanged', () => {
    const table = getUnifiedTemplateById('encounter.tribute_exchange')?.outcomeEffects ?? {};
    expect(table.critical_success).toEqual([{ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP }, TRIBUTE_OATH]);
    for (const band of ['success', 'success_at_cost'] as const) {
      expect(table[band]).toEqual([{ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP_BIG }, TRIBUTE_OATH]);
    }
    for (const band of ['failure', 'critical_failure'] as const) {
      expect(table[band]).toEqual([{ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP_BIG }]);
    }
  });
});
