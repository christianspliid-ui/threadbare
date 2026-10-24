/**
 * THR-1969 — the god's stake in the economy, S3: the market cards and the two promises.
 *
 * Binds the plan's S3 Done-when predicates
 * (Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md § Done when, S3):
 * Fortune's Favour and Ruin move a mortal exactly one Means band (45 → 60, 45 → 39);
 * Bless the Holding raises a held town's tax term by half in the next
 * `economy.purse.day` trace and ends at `untilTick`; Claim Resource pays 0.75 Life a
 * tick on surplus grain and 0.25 on scarce; and Open the Markets' stamp boosts a
 * Shadow-led resident's `create × faction` while the town holds prosperity 75.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeStepResult } from '../unifiedActionResolution';
import { executeGraphOps } from '../graphOpExecutor';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { meansBandStepAmount } from '../mortalMeans';
import {
  blessHolding,
  claimedGoodAt,
  claimedGoodIncome,
  holdingBlessingEdgeId,
  holdingBlessingMult,
  holdingBlessingReceipt,
  sweepExpiredHoldingBlessings,
  thievesGuildOfferOpen,
  thievesGuildOfferWant,
} from '../godsStake';
import { runFactionPurse } from '../factionPurse';
import { collectHoldingPayments } from '../holdingIncome';
import { spawnControlEffect } from '../controlEffectSpawn';
import { phaseControlEffects } from '../phaseControlEffects';
import { scoreUnifiedBoard } from '../decisionBoard';
import { getStrategicTemplate } from '../strategicActionCandidates';
import { cellTemplateId } from '../../data/undertaking-cells';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { priceOf } from '../godProgression';
import {
  BLESS_HOLDING_DAYS,
  BLESS_HOLDING_YIELD_MULT,
  MARKETS_OPENED_TICK_PROP,
  THIEVES_GUILD_OFFER_CELL_ID,
  THIEVES_GUILD_OFFER_DAYS,
  THIEVES_GUILD_OFFER_WANT,
} from '../../data/prayer-constants';
import {
  LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS,
  LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD,
} from '../../data/location-action-constants';
import { PURSE_CYCLE_TICKS, TOWN_TAX_BASE } from '../../data/faction-purse-constants';
import { WEALTH_SUBLOCATION_INCOME } from '../wealth';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import type { GameState } from '../../types/gameState';
import type { ActionStep, UnifiedAction } from '../../types/unifiedAction';
import type { RealmProjection } from '../realmProjection';
import type { ScoredStrategicCandidate } from '../strategicActionScoring';

const GOD = 'asc-1';
const MORTAL = 'actor-1';
const REALM = 'faction_0';
const TOWN = 'loc_town';
const TOWN_B = 'loc_town_b';

// ─── Fortune's Favour / Ruin ─────────────────────────────────────────────────

function meansState(wealth: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: MORTAL, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual', wealth } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({ id: 'at', source: MORTAL, target: 'loc-1', type: 'located_at', properties: {} });
  return {
    tick: 10, seed: 42, graph, ascendantId: GOD, tickEvents: [], recentEvents: [], chronicleEntries: [],
    encounterNotifications: [], unifiedActions: [], actionsInProgress: [], encounterProgress: [],
  } as unknown as GameState;
}

function castOn(templateId: string, targetId: string): UnifiedAction {
  return {
    actionId: `ua_${templateId}`, actorId: GOD, templateId, targetId,
    scale: 'personal', source: 'player',
    startTick: 9, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

describe("THR-1969 — Fortune's Favour and Ruin move one Means band", () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('computes one band up to the next floor and one band down below the current floor', () => {
    expect(45 + meansBandStepAmount(45, 1)).toBe(60);
    expect(45 + meansBandStepAmount(45, -1)).toBe(39);
    expect(20 + meansBandStepAmount(20, -1)).toBe(19);
    expect(19 + meansBandStepAmount(19, 1)).toBe(20);
    // Clamped: a Magnate's favour lands on 100, a Destitute mortal's ruin on 0.
    expect(90 + meansBandStepAmount(90, 1)).toBe(100);
    expect(5 + meansBandStepAmount(5, -1)).toBe(0);
    expect(meansBandStepAmount(100, 1)).toBe(0);
    expect(meansBandStepAmount(0, -1)).toBe(0);
  });

  for (const [templateId, after, word] of [
    ['action.means.fortunes_favour', 60, 'Wealthy'],
    ['action.means.ruin', 39, 'Getting by'],
  ] as const) {
    it(`${templateId} on a mortal at Means 45 leaves them at ${after} (${word}), with the band named on the receipt`, () => {
      const state = meansState(45);
      const template = getUnifiedTemplateById(templateId)!;
      expect(template).toBeDefined();
      const { updatedAction } = executeStepResult(
        castOn(templateId, MORTAL), template, 'success', [], state, () => 0.5, 10, undefined, runtime,
      );
      expect(updatedAction.outcome).toBe('success');
      expect(state.graph.getNode(MORTAL)!.properties.wealth).toBe(after);
      // The god's own purse is untouched: the shift lands on the target.
      expect(state.graph.getNode(GOD)!.properties.wealth).toBeUndefined();
      const economy = (updatedAction.aftermathSummary?.changes ?? []).filter(c => c.kind === 'economy');
      expect(economy).toHaveLength(1);
      expect(economy[0].crossed).toBe(true);
      expect(economy[0].detail).toBe(`Kael Thornweaver is now ${word}.`);
    });
  }

  it('a failed cast moves nothing', () => {
    const state = meansState(45);
    const template = getUnifiedTemplateById('action.means.ruin')!;
    executeStepResult(castOn('action.means.ruin', MORTAL), template, 'failure', [], state, () => 0.5, 10, undefined, runtime);
    expect(state.graph.getNode(MORTAL)!.properties.wealth).toBe(45);
  });
});

// ─── Bless the Holding ───────────────────────────────────────────────────────

function heldWorld(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  g.addNode({ id: REALM, name: 'House Ashfold', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', wealth: 0 } });
  g.addNode({ id: TOWN, name: 'Ferris', type: 'location', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 1, hexRow: 1 } });
  g.addNode({ id: TOWN_B, name: 'Harrow', type: 'location', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 3, hexRow: 1 } });
  g.addNode({ id: 'loc_wild', name: 'Wildmoor', type: 'location', properties: { locationSubtype: 'town', prosperity: 50, hexCol: 5, hexRow: 1 } });
  g.addEdge({ id: 'e_ctl_town', source: REALM, target: TOWN, type: 'controls', properties: { influence: 0.5 } });
  g.addEdge({ id: 'e_ctl_town_b', source: REALM, target: TOWN_B, type: 'controls', properties: { influence: 0.5 } });
  return g;
}

function projection(): RealmProjection {
  const hexes = [{ col: 1, row: 1 }, { col: 3, row: 1 }];
  return {
    realms: [{ id: REALM, name: REALM, seatHex: hexes[0], seatLocationId: TOWN, heldLocationIds: [TOWN, TOWN_B], hexes }],
    hexRealmId: new Map(hexes.map(h => [`${h.col},${h.row}`, REALM])),
    unclaimedHexes: 0,
  };
}

const TILES = [
  { coord: { col: 1, row: 1 }, terrain: 'ocean' },
  { coord: { col: 3, row: 1 }, terrain: 'ocean' },
];

function purseDayTax(graph: WorldGraph, tick: number): number {
  clearTraces();
  runFactionPurse({ graph, tick, seed: 42, chronicleEntries: [], tiles: TILES, ascendantId: GOD } as unknown as GameState, () => projection());
  const day = getTraces().find(t => t.category === 'economy.purse.day' && (t as { factionId?: string }).factionId === REALM) as
    { income: { townTax: number } } | undefined;
  expect(day).toBeDefined();
  return day!.income.townTax;
}

describe('THR-1969 — Bless the Holding', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it("raises a faction-held town's tax term by half in the next purse day and ends at untilTick", () => {
    const g = heldWorld();
    const day1 = PURSE_CYCLE_TICKS * 2;
    expect(purseDayTax(g, day1)).toBeCloseTo(2 * TOWN_TAX_BASE);

    const castTick = day1 + 1;
    const result = blessHolding(g, GOD, TOWN, castTick);
    expect('untilTick' in result && result.untilTick).toBe(castTick + BLESS_HOLDING_DAYS * TICKS_PER_DAY);

    const nextDay = day1 + PURSE_CYCLE_TICKS;
    expect(purseDayTax(g, nextDay)).toBeCloseTo(TOWN_TAX_BASE * BLESS_HOLDING_YIELD_MULT + TOWN_TAX_BASE);

    // The year runs out: the first pay day at or past untilTick pays as before, and the
    // edge is swept.
    const until = castTick + BLESS_HOLDING_DAYS * TICKS_PER_DAY;
    const firstDayAfter = Math.ceil(until / PURSE_CYCLE_TICKS) * PURSE_CYCLE_TICKS;
    expect(purseDayTax(g, firstDayAfter)).toBeCloseTo(2 * TOWN_TAX_BASE);
    expect(g.getEdge(holdingBlessingEdgeId(GOD, TOWN))).toBeUndefined();
  });

  it('a recast extends the year and never stacks', () => {
    const g = heldWorld();
    blessHolding(g, GOD, TOWN, 100);
    blessHolding(g, GOD, TOWN, 200);
    expect(g.getIncomingEdges(TOWN, 'blessed')).toHaveLength(1);
    expect(holdingBlessingMult(g, TOWN, 210)).toBe(BLESS_HOLDING_YIELD_MULT);
    expect(g.getEdge(holdingBlessingEdgeId(GOD, TOWN))!.properties.untilTick).toBe(200 + BLESS_HOLDING_DAYS * TICKS_PER_DAY);
    expect(holdingBlessingMult(g, TOWN, undefined)).toBe(1);
  });

  it('a place no one holds is refused and nothing is written', () => {
    const g = heldWorld();
    expect(blessHolding(g, GOD, 'loc_wild', 10)).toEqual({ refused: 'not_held' });
    expect(g.getIncomingEdges('loc_wild', 'blessed')).toHaveLength(0);
    expect(holdingBlessingReceipt(g, GOD, 'loc_wild', 10, 'ua')).toBeNull();
  });

  it('the card op writes the blessing and the receipt names the holder and the year', () => {
    const g = heldWorld();
    const template = getUnifiedTemplateById('loc.bless_holding')!;
    const results = executeGraphOps(g, (template.steps[0] as ActionStep).onSuccess, { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: 40 });
    expect(results.allSucceeded).toBe(true);
    const receipt = holdingBlessingReceipt(g, GOD, TOWN, 40, 'ua_bless');
    expect(receipt?.detail).toBe("House Ashfold's yield from Ferris swells this year. The blessing fades at the year's end.");
    expect(receipt?.concepts?.map(c => c.entityId)).toEqual([REALM, TOWN]);
    // Read the next tick, it is not this cast's receipt.
    expect(holdingBlessingReceipt(g, GOD, TOWN, 41, 'ua_bless')).toBeNull();
  });

  it("multiplies a mortal's freehold and only while the blessing lives", () => {
    const g = heldWorld();
    g.addNode({ id: 'holder', type: 'actor', name: 'Ada', properties: { actorType: 'individual', wealth: 30 } });
    g.addNode({ id: 'mill', type: 'location', name: 'The Mill', properties: { parentLocationId: TOWN, sublocationTypeId: 'sublocation-type.mine' } });
    g.addEdge({ id: 'own', source: 'holder', target: 'mill', type: 'owns', properties: { acquiredTick: 1, via: 'claim' } });
    blessHolding(g, GOD, 'mill', 10);
    const blessed = collectHoldingPayments(g, 20).find(p => p.reason === 'sublocation_income')!;
    expect(blessed.amount).toBeCloseTo(WEALTH_SUBLOCATION_INCOME * BLESS_HOLDING_YIELD_MULT);
    const after = collectHoldingPayments(g, 10 + BLESS_HOLDING_DAYS * TICKS_PER_DAY).find(p => p.reason === 'sublocation_income')!;
    expect(after.amount).toBeCloseTo(WEALTH_SUBLOCATION_INCOME);
    expect(sweepExpiredHoldingBlessings(g, 10 + BLESS_HOLDING_DAYS * TICKS_PER_DAY)).toBe(1);
  });
});

// ─── Claim Resource ──────────────────────────────────────────────────────────

function claimWorld(tier: 'scarce' | 'adequate' | 'surplus', resourceId = 'grain'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'loc_farm', name: 'Brookfield', type: 'location', properties: {
    locationSubtype: 'hamlet', hexCol: 4, hexRow: 2,
    resources: { [resourceId]: { quantity: 60, renewable: true, renewalRate: 0.1, stockTier: tier }, ore: { quantity: 20, renewable: false, renewalRate: 0 } },
  } });
  return g;
}

describe('THR-1969 — Claim Resource pays in the good it claims', () => {
  it('binds the most abundant deposit on the hex at establishment', () => {
    expect(claimedGoodAt(claimWorld('surplus'), 4, 2, undefined)).toEqual({ resourceId: 'grain', locationId: 'loc_farm' });
    expect(claimedGoodAt(claimWorld('surplus'), 9, 9, undefined)).toBeNull();
  });

  it('pays 0.75 Life a tick on surplus grain and 0.25 on scarce, through the control-effects phase', () => {
    for (const [tier, expected] of [['surplus', 0.75], ['adequate', 0.5], ['scarce', 0.25]] as const) {
      const graph = claimWorld(tier);
      const template = getUnifiedTemplateById('hex.claim_resource')!;
      const action = { ...castOn('hex.claim_resource', 'hex_4_2'), essencePaid: 3 } as UnifiedAction;
      const spawned = spawnControlEffect(action, template, 10, graph)!;
      expect(spawned.effect.claimedGoodId).toBe('grain');
      expect(claimedGoodIncome(graph, spawned.effect)).toEqual({ life: expected });

      const state = {
        tick: 11, graph, ascendantId: GOD, controlEffects: [spawned.effect],
        essencePool: { matter: 10 }, pendingSpherePressures: [], tickEvents: [],
      } as unknown as GameState;
      const next = phaseControlEffects(state);
      expect((next.essencePool as Record<string, number>).life).toBeCloseTo(expected);
      expect(next.controlEffects![0].perTickIncome).toEqual({ life: expected });
    }
  });

  it('a good with no class pays the static fallback, today\'s 0.5 Matter', () => {
    const graph = claimWorld('surplus', 'starlight_unknown');
    const template = getUnifiedTemplateById('hex.claim_resource')!;
    const spawned = spawnControlEffect(castOn('hex.claim_resource', 'hex_4_2'), template, 10, graph)!;
    expect(claimedGoodIncome(graph, spawned.effect)).toEqual({ matter: 0.5 });
  });
});

// ─── Open the Markets' thieves' guild ────────────────────────────────────────

const THIEF = 'actor_thief';
const HONEST = 'actor_honest';

function marketWorld(prosperity: number): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant' } });
  g.addNode({ id: TOWN, name: 'Ferris', type: 'location', properties: { locationSubtype: 'town', prosperity, hexCol: 1, hexRow: 1 } });
  g.addNode({ id: 'loc_alley', name: 'Back Alley', type: 'location', properties: { parentLocationId: TOWN, sublocationTypeId: 'sublocation-type.mine' } });
  g.addNode({ id: THIEF, name: 'Vess', type: 'actor', properties: {
    actorType: 'individual', spotlightTier: 'spotlight', wealth: 90,
    domainCapabilities: { iron: 40, gold: 40, shadow: 60, veil: 40, heart: 40, eye: 40, stone: 40, star: 40 },
  } });
  g.addNode({ id: HONEST, name: 'Tam', type: 'actor', properties: {
    actorType: 'individual', spotlightTier: 'spotlight', wealth: 90,
    domainCapabilities: { iron: 40, gold: 60, shadow: 40, veil: 40, heart: 40, eye: 40, stone: 40, star: 40 },
  } });
  g.addEdge({ id: 'at_thief', source: THIEF, target: 'loc_alley', type: 'located_at', properties: {} });
  g.addEdge({ id: 'at_honest', source: HONEST, target: TOWN, type: 'located_at', properties: {} });
  return g;
}

function foundGuild(actorId: string, index: number): ScoredStrategicCandidate {
  const templateId = cellTemplateId('create', 'faction');
  return {
    candidateId: `cand_${index}`, templateId, ambitionId: 'ambition_none', actorId,
    verb: getStrategicTemplate(templateId)!.verb, executionMode: 'project', behaviorFamily: 'merchant-expansion',
    displayName: 'found a guild', targetNodeId: TOWN, objectTypeId: 'faction',
    objectHandle: { kind: 'node', nodeId: TOWN },
    scoreComponents: { ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0, catalystValue: 0, roleFit: 0, travelPenalty: 0, varietyPenalty: 0 },
    finalScore: 1, generationReason: 'ambition_progression',
  } as unknown as ScoredStrategicCandidate;
}

describe("THR-1969 — Open the Markets' thieves' guild comes true", () => {
  const OPENED = 100;
  const OPEN_FROM = OPENED + LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS;
  const OPEN_UNTIL = OPEN_FROM + THIEVES_GUILD_OFFER_DAYS * TICKS_PER_DAY;

  it('the boosted cell is the founded-guild cell', () => {
    expect(cellTemplateId('create', 'faction')).toBe(THIEVES_GUILD_OFFER_CELL_ID);
  });

  it('the card stamps the tick it opened the town', () => {
    const g = marketWorld(80);
    const template = getUnifiedTemplateById('loc.open_markets')!;
    const results = executeGraphOps(g, (template.steps[0] as ActionStep).onSuccess, { actorId: GOD, targetId: TOWN, locationId: TOWN, tick: OPENED });
    expect(results.allSucceeded).toBe(true);
    expect(g.getNode(TOWN)!.properties[MARKETS_OPENED_TICK_PROP]).toBe(OPENED);
  });

  it('opens after the delay, for the offer days, while prosperity holds at the threshold', () => {
    const g = marketWorld(LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD);
    g.getNode(TOWN)!.properties[MARKETS_OPENED_TICK_PROP] = OPENED;
    const town = g.getNode(TOWN);
    expect(thievesGuildOfferOpen(town, OPEN_FROM - 1)).toBe(false);
    expect(thievesGuildOfferOpen(town, OPEN_FROM)).toBe(true);
    expect(thievesGuildOfferOpen(town, OPEN_UNTIL - 1)).toBe(true);
    expect(thievesGuildOfferOpen(town, OPEN_UNTIL)).toBe(false);
    g.getNode(TOWN)!.properties.prosperity = LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD - 1;
    expect(thievesGuildOfferOpen(g.getNode(TOWN), OPEN_FROM)).toBe(false);
  });

  it("boosts only a Shadow-led resident's create × faction, and the board entry records it", () => {
    const g = marketWorld(80);
    g.getNode(TOWN)!.properties[MARKETS_OPENED_TICK_PROP] = OPENED;
    expect(thievesGuildOfferWant(g, THIEF, OPEN_FROM)).toBe(THIEVES_GUILD_OFFER_WANT);
    expect(thievesGuildOfferWant(g, HONEST, OPEN_FROM)).toBe(1);

    const boosted = scoreUnifiedBoard({ graph: g, agentId: THIEF, tick: OPEN_FROM, encounterCandidates: [], strategicCandidates: [foundGuild(THIEF, 0)] });
    const plain = scoreUnifiedBoard({ graph: g, agentId: THIEF, tick: OPEN_UNTIL, encounterCandidates: [], strategicCandidates: [foundGuild(THIEF, 0)] });
    expect(boosted.entries[0].thievesGuildOffer).toBe(THIEVES_GUILD_OFFER_WANT);
    expect(plain.entries[0].thievesGuildOffer).toBeUndefined();
    expect(boosted.entries[0].temperamentWeight).toBeCloseTo(plain.entries[0].temperamentWeight * THIEVES_GUILD_OFFER_WANT, 10);
  });

  it('a town Open the Markets never touched offers nothing', () => {
    const g = marketWorld(90);
    expect(thievesGuildOfferWant(g, THIEF, OPEN_FROM)).toBe(1);
  });
});

// ─── The market rows ─────────────────────────────────────────────────────────

describe('THR-1969 — the three market rows', () => {
  it('are tier 2 in the omen market and resolve a price', () => {
    for (const id of ['action.means.fortunes_favour', 'action.means.ruin', 'loc.bless_holding']) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.progression).toMatchObject({ tier: 2, offer: 'market', generic: false });
      expect(priceOf(t, { graph: new WorldGraph(), ascendantId: GOD } as unknown as GameState)).toBeGreaterThan(0);
    }
  });
});
