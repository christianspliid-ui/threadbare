/**
 * THR-1955 — regional monopolies and embargo (war aims S2, plan
 * `Docs/plans/2026-10-15-thr-1933-war-aims.md` § Engine 6–10).
 *
 * Fixtures only; the seeded-world predicates (≥ 2 monopolies by day 10, every embargo
 * leaves a chronicle line and a stock change) are measured by `npm run measure:monopolies`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { PhaseContext } from '../phaseRegistry';
import { phaseEconomicPower } from '../phases/economicPower';
import {
  buildBearingIndex,
  computeRegionalMonopolies,
  readRegionalMonopolies,
  readActiveEmbargo,
  embargoedTownsOf,
  embargoedLanesOf,
  embargoCutsByLocation,
  scarcityRentFor,
} from '../regionalMonopoly';
import { planEmbargo, executeEmbargo } from '../embargo';
import { placeYieldOf } from '../factionPurse/income';
import { deriveLocationStockTiers } from '../resourceEconomy';
import { buildWarAimContext } from '../warAims/context';
import { monopolyAimFor } from '../warAims/townValue';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { ECON_POWER_SCAN_INTERVAL_TICKS } from '../../data/economic-power-config';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  MONOPOLY_REGION_RADIUS_HEXES,
  MONOPOLY_SCARCITY_RENT,
  MONOPOLY_MIN_HOLD_DAYS,
  EMBARGO_BALANCE_CUT,
  EMBARGO_DAYS,
  WAR_AIM_BONUS_BREAKS_MONOPOLY,
  WAR_AIM_BONUS_COMPLETES_MONOPOLY,
} from '../../data/regional-monopoly-constants';

const SCAN = ECON_POWER_SCAN_INTERVAL_TICKS;
const ctx = {} as PhaseContext;
const grain = (q = 60) => ({ grain: { resourceId: 'grain', quantity: q } });

function makeState(tick: number, graph: WorldGraph): GameState {
  return {
    tick, seed: 42, graph, tickEvents: [], chronicleEntries: [], pendingSpherePressures: [], pendingEncounterSeeds: [],
  } as unknown as GameState;
}

function addFaction(g: WorldGraph, id: string, name: string): void {
  g.addNode({ id, type: 'actor', name, properties: { actorType: 'faction' } });
}

function addTown(g: WorldGraph, id: string, col: number, props: Record<string, unknown> = {}): void {
  g.addNode({
    id, type: 'location', name: `Town ${id}`,
    properties: { locationSubtype: 'town', terrain: 'plains', hexCol: col, hexRow: 0, prosperity: 50, ...props },
  });
}

function control(g: WorldGraph, factionId: string, locId: string): void {
  g.addEdge({ id: `c_${factionId}_${locId}`, source: factionId, target: locId, type: 'controls', properties: {} });
}

function rivals(g: WorldGraph, a: string, b: string): void {
  g.addEdge({ id: `r_${a}_${b}`, source: a, target: b, type: 'relates_to', properties: { isRival: true } });
}

/**
 * Holder H holds three grain towns of four in one region (0.75); enemy E holds the fourth
 * and a grain town of its own far away (its own region, alone, too small to count).
 */
function region(): WorldGraph {
  const g = new WorldGraph();
  addFaction(g, 'H', 'House Varr');
  addFaction(g, 'E', 'Ashfold');
  for (const [id, col] of [['h1', 0], ['h2', 1], ['h3', 2], ['e1', 3]] as const) addTown(g, id, col, { resources: grain() });
  addTown(g, 'far', 40, { resources: grain() });
  control(g, 'H', 'h1'); control(g, 'H', 'h2'); control(g, 'H', 'h3');
  control(g, 'E', 'e1'); control(g, 'E', 'far');
  rivals(g, 'H', 'E');
  g.addEdge({
    id: 'lane_h1_e1', source: 'h1', target: 'e1', type: 'trades_with',
    properties: { volume: 3, manifest: { goods: ['grain'], totalValue: 2, carriesStaple: true } },
  });
  return g;
}

describe('regional monopolies (THR-1955 § 6)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('holds a region at ≥ 60% of ≥ 3 bearing places within the radius, anchored on the most-held place', () => {
    const g = region();
    const out = computeRegionalMonopolies(buildBearingIndex(g), 12);
    const h = out.get('H') ?? [];
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ resourceId: 'grain', share: 0.75, placeIds: ['h1', 'h2', 'h3'] });
    expect(out.has('E')).toBe(false); // e1 is 1 of 4 here; "far" stands alone (< 3 places)
  });

  it('a place beyond the radius is another market', () => {
    const g = region();
    addTown(g, 'h4', MONOPOLY_REGION_RADIUS_HEXES + 30, { resources: grain() });
    control(g, 'H', 'h4');
    const h = computeRegionalMonopolies(buildBearingIndex(g), 12).get('H') ?? [];
    expect(h.map(m => m.placeIds)).toEqual([['h1', 'h2', 'h3']]);
  });

  it('the phase stores the record, keeps `monopolies`, chronicles "holds most of", and the chip clears the day the share drops', () => {
    const g = region();
    const r1 = phaseEconomicPower(makeState(SCAN, g), ctx);
    expect(readRegionalMonopolies(g.getNode('H')!.properties)).toHaveLength(1);
    expect(g.getNode('H')!.properties.monopolies).toEqual(['grain']);
    expect(r1.chronicleEntries?.[0]?.prose).toMatch(/most of the grain|grain .* around|around .* grain/i);

    // E takes h3: H drops to 2 of 4 (0.5) — the record (the chip's only source) is gone that day.
    g.removeEdge('c_H_h3');
    control(g, 'E', 'h3');
    phaseEconomicPower(makeState(SCAN * 2, g), ctx);
    expect(readRegionalMonopolies(g.getNode('H')!.properties)).toEqual([]);
    expect(g.getNode('H')!.properties.monopolies).toEqual([]);
  });

  it('a monopoly lost inside MONOPOLY_MIN_HOLD_DAYS is traced but not chronicled; one held longer is', () => {
    const g = region();
    phaseEconomicPower(makeState(SCAN, g), ctx);
    g.removeEdge('c_H_h3');
    const quick = phaseEconomicPower(makeState(SCAN * 2, g), ctx);
    expect(quick.chronicleEntries ?? []).toHaveLength(0);
    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    expect(traces.some(t => t.category === 'monopoly_transition' && t.transition === 'broken' && t.chronicled === false)).toBe(true);

    const g2 = region();
    phaseEconomicPower(makeState(SCAN, g2), ctx);
    g2.removeEdge('c_H_h3');
    const late = phaseEconomicPower(makeState(SCAN + MONOPOLY_MIN_HOLD_DAYS * TICKS_PER_DAY, g2), ctx);
    expect(late.chronicleEntries?.some(c => /broken|no longer holds|slips|grip|more than one master|escapes/i.test(c.prose))).toBe(true);
  });

  it('scarcity rent multiplies the monopolised good in the holder\'s purse', () => {
    const g = region();
    phaseEconomicPower(makeState(SCAN, g), ctx);
    const h1 = g.getNode('h1')!;
    const rent = scarcityRentFor(g, 'H', h1);
    expect(rent).toBeDefined();
    expect(placeYieldOf(h1, rent)).toBeCloseTo(placeYieldOf(h1) * MONOPOLY_SCARCITY_RENT);
    expect(scarcityRentFor(g, 'E', g.getNode('e1')!)).toBeUndefined();
  });
});

describe('embargo (THR-1955 § 9)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  it('plans against the enemy whose towns in the region carry the good, stores one record, derives towns and lanes', () => {
    const g = region();
    const state = makeState(SCAN, g);
    phaseEconomicPower(state, ctx);
    const plan = planEmbargo(state, 'H');
    expect(plan).toMatchObject({ targetFactionId: 'E', resourceId: 'grain', untilTick: SCAN + EMBARGO_DAYS * TICKS_PER_DAY });

    const result = executeEmbargo(state, g.getNode('H')!);
    expect(result?.record.actionType).toBe('embargo');
    expect(result?.chronicle[0]?.title).toBe('An Embargo');
    const rec = readActiveEmbargo(g.getNode('H')!.properties)!;
    expect(embargoedTownsOf(g, rec).map(t => t.id)).toEqual(['e1']); // "far" lies outside the region
    expect(embargoedLanesOf(g, rec).map(e => e.id)).toEqual(['lane_h1_e1']);
    // Nothing is written on the town or the lane.
    expect(g.getNode('e1')!.properties.embargoed).toBeUndefined();
    expect(planEmbargo(state, 'H')).toBeNull(); // one at a time
  });

  it('cuts the embargoed town\'s balance on the good by EMBARGO_BALANCE_CUT (the stock pass term)', () => {
    const g = region();
    const state = makeState(SCAN, g);
    phaseEconomicPower(state, ctx);
    executeEmbargo(state, g.getNode('H')!);
    const cuts = embargoCutsByLocation(g);
    expect([...(cuts.get('e1') ?? [])]).toEqual(['grain']);
    const props = g.getNode('e1')!.properties;
    const uncut = deriveLocationStockTiers(props, 0).perResource.grain.balance;
    const cut = deriveLocationStockTiers(props, 0, new Map([['grain', EMBARGO_BALANCE_CUT]])).perResource.grain.balance;
    expect(uncut - cut).toBeCloseTo(EMBARGO_BALANCE_CUT);
  });

  it('is lifted with a chronicle line when its term ends, or early when the monopoly is lost', () => {
    const g = region();
    const state = makeState(SCAN, g);
    phaseEconomicPower(state, ctx);
    executeEmbargo(state, g.getNode('H')!);
    const until = readActiveEmbargo(g.getNode('H')!.properties)!.untilTick;
    const lifted = phaseEconomicPower(makeState(until, g), ctx);
    expect(readActiveEmbargo(g.getNode('H')!.properties)).toBeNull();
    expect(lifted.chronicleEntries?.some(c => c.title === 'The Roads Open')).toBe(true);

    const g2 = region();
    const s2 = makeState(SCAN, g2);
    phaseEconomicPower(s2, ctx);
    executeEmbargo(s2, g2.getNode('H')!);
    g2.removeEdge('c_H_h3');
    control(g2, 'E', 'h3');
    phaseEconomicPower(makeState(SCAN * 2, g2), ctx);
    expect(readActiveEmbargo(g2.getNode('H')!.properties)).toBeNull();
    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    expect(traces.some(t => t.category === 'faction.embargo.lifted' && t.why === 'monopoly_lost')).toBe(true);
  });

  it('no enemy in the region → no plan', () => {
    const g = region();
    g.removeEdge('r_H_E');
    const state = makeState(SCAN, g);
    phaseEconomicPower(state, ctx);
    expect(planEmbargo(state, 'H')).toBeNull();
  });
});

describe('monopoly war-aim bonuses (THR-1955 § 8)', () => {
  beforeEach(() => { clearTraces(); });

  it('taking an enemy monopoly town that drops it below the share earns the break bonus', () => {
    const g = region();
    phaseEconomicPower(makeState(SCAN, g), ctx);
    const wctx = buildWarAimContext(g, new Map());
    const aim = monopolyAimFor(wctx, 'E', 'h1');
    expect(aim.reason).toBe('breaks_monopoly');
    expect(aim.holderId).toBe('H');
    expect(aim.bonus).toBe(WAR_AIM_BONUS_BREAKS_MONOPOLY);
  });

  it('taking a town that lifts the attacker to the share earns the complete bonus', () => {
    const g = new WorldGraph();
    addFaction(g, 'A', 'Attacker');
    addFaction(g, 'B', 'Defender');
    rivals(g, 'A', 'B');
    for (const [id, col] of [['a1', 0], ['a2', 1], ['b1', 2], ['b2', 3], ['n1', 4]] as const) addTown(g, id, col, { resources: grain() });
    control(g, 'A', 'a1'); control(g, 'A', 'a2'); control(g, 'B', 'b1'); control(g, 'B', 'b2');
    const wctx = buildWarAimContext(g, new Map());
    // 2 of 5 today; with b1, 3 of 5 = 0.6.
    const aim = monopolyAimFor(wctx, 'A', 'b1');
    expect(aim.reason).toBe('completes_monopoly');
    expect(aim.bonus).toBeGreaterThanOrEqual(WAR_AIM_BONUS_COMPLETES_MONOPOLY);
  });
});
