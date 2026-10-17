/**
 * THR-1935 S1 — prayers and the faithful.
 *
 * Plan: Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md § Done when, S1.
 * Fixture: a god that bought mind 3 / spirit 2; towns whose sphere bags read Touched
 * (or better) or Foreign for it; Restless chips and unrest inputs written by hand, as
 * the hunger-and-unrest phase writes them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { SphereAffinity } from '../../types/sphereAffinity';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { dominionOf, bandAtLeast } from '../dominion';
import {
  phasePrayers,
  openPrayer,
  resolvePrayerCast,
  activePrayerOf,
  listPrayers,
  listFaithful,
  pickSlightedTown,
  starveFaithful,
  placePrayerView,
  PRAYER_SLIGHTED_UNTIL_PROP,
  LAST_PRAYER_TICK_PROP,
} from '../prayers';
import { computeSanctitySustenance } from '../essenceEconomyBridge';
import { recomputeControlledSourceTiers, readEssenceSource, selectLocationSustenanceVoice } from '../essenceSources';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  ANSWERED_PRAYER_DOMINION_PRESSURE,
  UNBIDDEN_AID_DOMINION_PRESSURE,
  PRAYER_COOLDOWN_DAYS,
  PRAYER_ANSWER_WINDOW_DAYS,
  FAITHFUL_COMMUNITY_MAX,
  FAITHFUL_INITIAL_SANCTITY,
  STARVE_FAITHFUL_SANCTITY_DRAIN,
  PRAYER_MAX_OPEN,
  PRAYER_GOD_GAP_DAYS,
} from '../../data/prayer-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { selectCovenantRows } from '../../components/Game/ascendant-bar/selectors';
import { landRivalProbe } from '../orchestrator';
import { raidAllowanceLeft } from '../phaseDominion';

const GOD = 'asc.test';
const POINTS = { mind: 3, spirit: 2 };
const DAY = TICKS_PER_DAY;

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

/** Scores that read Touched or better for the god (mind/spirit), and Foreign (their opposites). */
const OWN_GROUND = { mind: 3, spirit: 2 };
const FOREIGN_GROUND = { force: 3, energy: 2 };

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: GOD, type: 'actor', name: 'The Shepherd',
    properties: {
      actorType: 'ascendant',
      spherePoints: POINTS,
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  g.addNode({ id: LOCATION_TRAIT_IDS.restless, type: 'trait', name: 'Restless', properties: {} });
  return g;
}

const STAPLES_ADEQUATE = {
  grain: { quantity: 50, stockTier: 'adequate' },
  fish: { quantity: 50, stockTier: 'adequate' },
};
const STAPLES_SCARCE = {
  grain: { quantity: 2, stockTier: 'scarce' },
  fish: { quantity: 2, stockTier: 'scarce' },
};

function addTown(
  g: WorldGraph,
  id: string,
  ground: Partial<Record<SphereName, number>>,
  opts: { restless?: boolean; hunger?: number; poverty?: number } = {},
): void {
  g.addNode({
    id, type: 'location', name: id[0].toUpperCase() + id.slice(1),
    properties: {
      locationSubtype: 'town', hexCol: 2, hexRow: 3,
      sphereAffinity: bag(ground),
      unrest: 40,
      unrestInputs: { hunger: opts.hunger ?? 30, poverty: opts.poverty ?? 5, siege: 0, sickness: 0, deathSite: 0, contentment: 0 },
      resources: STAPLES_ADEQUATE,
    },
  });
  if (opts.restless ?? true) setRestless(g, id, true);
}

function setRestless(g: WorldGraph, id: string, on: boolean): void {
  const existing = g.getOutgoingEdges(id, 'has_trait').find(e => e.target === LOCATION_TRAIT_IDS.restless);
  if (on && !existing) {
    g.addEdge({ id: `trait_${id}_restless`, source: id, target: LOCATION_TRAIT_IDS.restless, type: 'has_trait', properties: {} });
  } else if (!on && existing) {
    g.removeEdge(existing.id);
  }
}

function makeState(g: WorldGraph, tick: number): GameState {
  return {
    graph: g, ascendantId: GOD, tick, tickEvents: [], rivalDefinitions: [{ id: 'rival_a', name: 'The Ember King' }],
  } as unknown as GameState;
}

const BLESS = getUnifiedTemplateById('loc.bless_harvest');

function cast(g: WorldGraph, tick: number, targetId: string, success = true) {
  return resolvePrayerCast(makeState(g, tick), {
    templateId: 'loc.bless_harvest', actionId: `act_${targetId}_${tick}`, targetId, success, isPlayerCast: true,
  }, BLESS);
}

function sum(pressures: { magnitude: number }[]): number {
  return pressures.reduce((s, p) => s + p.magnitude, 0);
}

let g: WorldGraph;
beforeEach(() => { g = makeGraph(); });

describe('fixture sanity', () => {
  it('own ground reads Touched or better; foreign ground does not', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    addTown(g, 'ferris', FOREIGN_GROUND);
    expect(bandAtLeast(dominionOf(g, GOD, 'millbrook').band, 'touched')).toBe(true);
    expect(bandAtLeast(dominionOf(g, GOD, 'ferris').band, 'touched')).toBe(false);
  });
});

describe('a hungry town on your ground prays', () => {
  it('opens one prayer with occurred_at → the town, and none again inside the cooldown', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    const r = phasePrayers(makeState(g, DAY));
    const prayers = listPrayers(g);
    expect(prayers).toHaveLength(1);
    expect(prayers[0].townId).toBe('millbrook');
    expect(prayers[0].status).toBe('open');
    expect(g.getOutgoingEdges(prayers[0].eventId, 'occurred_at').map(e => e.target)).toEqual(['millbrook']);
    expect(r.tickEvents?.[0]?.message).toBe('Millbrook prays to The Shepherd for bread.');
    expect(r.tickEvents?.[0]?.notification?.channel).toBe('alert');

    // The window closes unanswered; the cooldown still holds the next prayer back.
    const closes = prayers[0].closesTick;
    phasePrayers(makeState(g, closes));
    expect(listPrayers(g)[0].status).toBe('unanswered');
    phasePrayers(makeState(g, closes + DAY));
    expect(listPrayers(g)).toHaveLength(1);
    // After the cooldown it may pray again.
    phasePrayers(makeState(g, DAY + PRAYER_COOLDOWN_DAYS * DAY));
    expect(listPrayers(g)).toHaveLength(2);
  });

  it('one at a time: of two towns passing the gate the same day only the hungrier prays; the other waits a season', () => {
    addTown(g, 'ashby', OWN_GROUND, { hunger: 20 });
    addTown(g, 'millbrook', OWN_GROUND, { hunger: 30 });
    phasePrayers(makeState(g, DAY));
    expect(listPrayers(g).map(p => p.townId)).toEqual(['millbrook']);
    expect(g.getNode('ashby')?.properties?.[LAST_PRAYER_TICK_PROP]).toBeUndefined();

    // The first prayer's window closes, but the god's season gap still holds the next one back.
    const gap = Math.round(PRAYER_GOD_GAP_DAYS * DAY);
    const lastBeforeGap = Math.floor((DAY + gap - 1) / DAY) * DAY;
    for (let t = 2 * DAY; t <= lastBeforeGap; t += DAY) phasePrayers(makeState(g, t));
    expect(listPrayers(g)).toHaveLength(1);

    // A season after that opening, the other town — still hungry — prays.
    const nextDay = Math.ceil((DAY + gap) / DAY) * DAY;
    phasePrayers(makeState(g, nextDay));
    expect(listPrayers(g).map(p => p.townId).sort()).toEqual(['ashby', 'millbrook']);
  });

  it('equal hunger goes to the lower id, with no draw', () => {
    addTown(g, 'zell', OWN_GROUND, { hunger: 30 });
    addTown(g, 'ashby', OWN_GROUND, { hunger: 30 });
    phasePrayers(makeState(g, DAY));
    expect(listPrayers(g).map(p => p.townId)).toEqual(['ashby']);
  });

  it(`never more than ${PRAYER_MAX_OPEN} open at once`, () => {
    for (const id of ['a1', 'a2', 'a3', 'a4']) addTown(g, id, OWN_GROUND);
    for (let t = DAY; t <= 30 * DAY; t += DAY) {
      phasePrayers(makeState(g, t));
      expect(listPrayers(g).filter(p => p.status === 'open').length).toBeLessThanOrEqual(PRAYER_MAX_OPEN);
    }
  });

  it('a Foreign town in the same state opens none', () => {
    addTown(g, 'ferris', FOREIGN_GROUND);
    phasePrayers(makeState(g, DAY));
    expect(listPrayers(g)).toHaveLength(0);
  });

  it('a town whose largest unrest input is not hunger opens none', () => {
    addTown(g, 'millbrook', OWN_GROUND, { hunger: 5, poverty: 20 });
    phasePrayers(makeState(g, DAY));
    expect(listPrayers(g)).toHaveLength(0);
  });

  it('a town that is not Restless opens none', () => {
    addTown(g, 'millbrook', OWN_GROUND, { restless: false });
    phasePrayers(makeState(g, DAY));
    expect(listPrayers(g)).toHaveLength(0);
  });
});

describe('answering', () => {
  it('a successful Bless the Harvest answers: participated_in god → prayer, pushes summing to 2 split by bought points', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    const res = cast(g, DAY + 5, 'millbrook');
    const prayer = listPrayers(g)[0];
    expect(prayer.status).toBe('answered');
    expect(g.getOutgoingEdges(GOD, 'participated_in').some(e => e.target === prayer.eventId)).toBe(true);
    expect(sum(res.pressures)).toBeCloseTo(ANSWERED_PRAYER_DOMINION_PRESSURE);
    expect(res.pressures.every(p => p.source === 'prayer_answered' && p.targetEntityId === 'millbrook')).toBe(true);
    const bySphere = Object.fromEntries(res.pressures.map(p => [p.sphere, p.magnitude]));
    expect(bySphere.mind).toBeCloseTo(ANSWERED_PRAYER_DOMINION_PRESSURE * 0.6);
    expect(bySphere.spirit).toBeCloseTo(ANSWERED_PRAYER_DOMINION_PRESSURE * 0.4);
    expect(res.change?.detail).toMatch(/Millbrook/);
    expect(res.change?.polarity).toBe('info');

    // A second answering cast does nothing more.
    expect(cast(g, DAY + 6, 'millbrook').pressures).toHaveLength(0);
  });

  it('a failed cast answers nothing and the window stays open', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    const res = cast(g, DAY + 5, 'millbrook', false);
    expect(res.pressures).toHaveLength(0);
    expect(listPrayers(g)[0].status).toBe('open');
    expect(g.getOutgoingEdges(GOD, 'participated_in')).toHaveLength(0);
  });

  it('a card without the flag answers nothing', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    const res = resolvePrayerCast(makeState(g, DAY + 5), {
      templateId: 'loc.sanctify_square', actionId: 'a1', targetId: 'millbrook', success: true, isPlayerCast: true,
    }, getUnifiedTemplateById('loc.sanctify_square'));
    expect(res.pressures).toHaveLength(0);
    expect(listPrayers(g)[0].status).toBe('open');
  });
});

describe('unbidden aid', () => {
  it('a hungry Foreign town pushes 1, forms nothing, and a second cast in the cooldown pushes nothing', () => {
    addTown(g, 'ferris', FOREIGN_GROUND);
    const first = cast(g, DAY, 'ferris');
    expect(sum(first.pressures)).toBeCloseTo(UNBIDDEN_AID_DOMINION_PRESSURE);
    expect(first.pressures.every(p => p.source === 'unbidden_aid')).toBe(true);
    expect(first.change?.detail).toMatch(/will remember who fed it/);
    expect(listPrayers(g)).toHaveLength(0);
    expect(g.getNode('ferris')?.properties[LAST_PRAYER_TICK_PROP]).toBe(DAY);
    expect(cast(g, DAY * 2, 'ferris').pressures).toHaveLength(0);
  });

  it('a fed town off your ground gives no Dominion', () => {
    addTown(g, 'ferris', FOREIGN_GROUND, { restless: false });
    expect(cast(g, DAY, 'ferris').pressures).toHaveLength(0);
  });
});

describe('faith forms', () => {
  function answerAndRecover(id: string, tick: number): void {
    phasePrayers(makeState(g, tick));
    cast(g, tick + 1, id);
    setRestless(g, id, false);
    phasePrayers(makeState(g, tick + DAY));
  }

  it('an answered town that loses Restless within 30 days hosts a faithful source of the god\'s primary at 0.5, and Covenants shows it', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    answerAndRecover('millbrook', DAY);
    const src = readEssenceSource(g.getNode('millbrook')?.properties);
    expect(src?.kind).toBe('faithfulCommunity');
    expect(src?.sphereAffinity).toBe('mind');
    expect(src?.sanctity).toBe(FAITHFUL_INITIAL_SANCTITY);
    expect(g.getOutgoingEdges(GOD, 'controls').some(e => e.target === 'millbrook')).toBe(true);
    expect(listPrayers(g)[0].status).toBe('recovered');

    const rows = selectCovenantRows({ graph: g, ascendantId: GOD, controlEffects: [], pendingControlReleases: [] } as unknown as GameState);
    expect(rows.find(r => r.effectId === 'source-millbrook')?.title).toBe('Millbrook keeps faith with you.');
    expect(placePrayerView(g, GOD, 'millbrook', DAY * 3)?.line).toBe('Millbrook keeps faith with you.');
  });

  it(`a town past the cap (${FAITHFUL_COMMUNITY_MAX}) forms no source and gives thanks only`, () => {
    const ids = ['a1', 'a2', 'a3', 'a4', 'a5'];
    for (const id of ids) addTown(g, id, OWN_GROUND);
    // The god hears one prayer a season, so stage five with the forced lever.
    for (const id of ids) openPrayer(makeState(g, DAY), id, [], true);
    for (const id of ids) cast(g, DAY + 1, id);
    for (const id of ids) setRestless(g, id, false);
    const r = phasePrayers(makeState(g, DAY * 2));
    expect(listFaithful(g, GOD)).toHaveLength(FAITHFUL_COMMUNITY_MAX);
    expect(readEssenceSource(g.getNode('a5')?.properties)).toBeUndefined();
    expect(r.tickEvents?.some(e => e.message === 'A5 gives thanks to The Shepherd.' || /^.*A5.*gives thanks to The Shepherd\.$/.test(e.message))).toBe(true);
  });

  it('a faithful town speaks no sphere Livelihood sentence — its faith line covers its bread', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    answerAndRecover('millbrook', DAY);
    expect(readEssenceSource(g.getNode('millbrook')?.properties)?.kind).toBe('faithfulCommunity');
    g.updateNode('millbrook', { properties: { resources: STAPLES_SCARCE } });
    expect(selectLocationSustenanceVoice(g, 'millbrook')).toBeUndefined();
  });

  it('the god\'s home seat recovers and gives thanks only — no faithful source on the seat', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    g.updateNode(GOD, { properties: { homeSeatLocationId: 'millbrook' } });
    g.addEdge({ id: 'seat_controls', source: GOD, target: 'millbrook', type: 'controls', properties: {} });
    answerAndRecover('millbrook', DAY);
    expect(readEssenceSource(g.getNode('millbrook')?.properties)).toBeUndefined();
    expect(listPrayers(g)[0].status).toBe('recovered');
  });

  it('answered but not recovered in 30 days closes unrecovered, with no source', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    cast(g, DAY + 1, 'millbrook');
    phasePrayers(makeState(g, DAY * 33)); // a day boundary past the 30-day window
    expect(listPrayers(g)[0].status).toBe('unrecovered');
    expect(readEssenceSource(g.getNode('millbrook')?.properties)).toBeUndefined();
  });
});

describe('faith rides the bread', () => {
  function faithfulTown(): void {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    cast(g, DAY + 1, 'millbrook');
    setRestless(g, 'millbrook', false);
    phasePrayers(makeState(g, DAY * 2));
  }

  it('scarce staples drain the faith each tick; adequate staples hold it', () => {
    faithfulTown();
    const src = readEssenceSource(g.getNode('millbrook')?.properties)!;
    expect(computeSanctitySustenance(g, 'millbrook', src).drift).toBe(0);
    g.updateNode('millbrook', { properties: { resources: STAPLES_SCARCE } });
    expect(computeSanctitySustenance(g, 'millbrook', src).drift).toBeLessThan(0);
  });

  it('at zero the source and its controls edge are gone and the lapse line fires', () => {
    faithfulTown();
    g.updateNode('millbrook', { properties: { resources: STAPLES_SCARCE } });
    let lapseLine: string | undefined;
    for (let t = DAY * 2 + 1; t < DAY * 2 + 200; t++) {
      recomputeControlledSourceTiers(g, GOD);
      const r = phasePrayers(makeState(g, t));
      const line = r.tickEvents?.find(e => /turned away/.test(e.message));
      if (line) { lapseLine = line.message; break; }
    }
    expect(lapseLine).toMatch(/Millbrook.*turned away/);
    expect(readEssenceSource(g.getNode('millbrook')?.properties)).toBeUndefined();
    expect(g.getOutgoingEdges(GOD, 'controls').some(e => e.target === 'millbrook')).toBe(false);
  });
});

describe('the rival answers', () => {
  it('an unanswered town is slighted and is the pick ahead of the others (no draw)', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    addTown(g, 'aalborg', OWN_GROUND, { restless: false });
    phasePrayers(makeState(g, DAY));
    const closes = listPrayers(g)[0].closesTick;
    const r = phasePrayers(makeState(g, closes));
    expect(r.tickEvents?.some(e => e.message.includes('The Ember King'))).toBe(true);
    const until = g.getNode('millbrook')?.properties[PRAYER_SLIGHTED_UNTIL_PROP] as number;
    expect(until).toBeGreaterThan(closes);
    const pick = pickSlightedTown([g.getNode('aalborg')!, g.getNode('millbrook')!], closes + 1);
    expect(pick?.id).toBe('millbrook');
    expect(pickSlightedTown([g.getNode('aalborg')!, g.getNode('millbrook')!], until)).toBeUndefined();
  });
});

describe('the rival lands first on the slighted town (landRivalProbe)', () => {
  it('lands on the slighted town with no draw, inside the throttle, and clears the slight', () => {
    // Ten towns on the god's turf: one landing a day is allowed (DOMINION_RAID_PLACES_PER_DAILY_BURST).
    for (let i = 0; i < 10; i++) addTown(g, `t${i}`, OWN_GROUND, { restless: false });
    const tick = DAY * 5;
    g.updateNode('t7', { properties: { [PRAYER_SLIGHTED_UNTIL_PROP]: tick + DAY } });
    const state = { ...makeState(g, tick), controlEffects: [] } as unknown as GameState;
    const pressures: { targetEntityId: string; magnitude: number }[] = [];
    const rng = () => { throw new Error('the slighted pick must consume no draw'); };
    landRivalProbe(state, { id: 'rival_a', name: 'The Ember King', primarySphere: 'force' } as never, rng, pressures as never);
    expect(pressures).toHaveLength(1);
    expect(pressures[0].targetEntityId).toBe('t7');
    expect(g.getNode('t7')?.properties[PRAYER_SLIGHTED_UNTIL_PROP]).toBeUndefined();
    // The throttle is untouched: today's one landing is spent, so a second probe lands nothing.
    expect(raidAllowanceLeft(g, GOD, tick, 10)).toBe(0);
    const again: unknown[] = [];
    landRivalProbe(state, { id: 'rival_a', name: 'The Ember King', primarySphere: 'force' } as never, () => 0, again as never);
    expect(again).toHaveLength(0);
  });
});

describe('starve the faithful', () => {
  it('the crack drops a faithful town\'s faith by 0.25', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    phasePrayers(makeState(g, DAY));
    cast(g, DAY + 1, 'millbrook');
    setRestless(g, 'millbrook', false);
    phasePrayers(makeState(g, DAY * 2));
    const before = readEssenceSource(g.getNode('millbrook')?.properties)!.sanctity;
    const ev = starveFaithful(makeState(g, DAY * 3), 'millbrook', { id: 'rival_a', name: 'The Ember King' });
    expect(readEssenceSource(g.getNode('millbrook')?.properties)!.sanctity).toBeCloseTo(before - STARVE_FAITHFUL_SANCTITY_DRAIN);
    expect(ev?.message).toMatch(/The Ember King/);
  });

  it('does nothing to a town without faith', () => {
    addTown(g, 'millbrook', OWN_GROUND);
    expect(starveFaithful(makeState(g, DAY), 'millbrook', { id: 'rival_a', name: 'X' })).toBeNull();
  });
});

describe('the review lever and the place page', () => {
  it('forced prayer shows its line, the answer hint and the days left in words', () => {
    addTown(g, 'millbrook', OWN_GROUND, { restless: false });
    const events: never[] = [];
    const id = openPrayer(makeState(g, DAY), 'millbrook', events, true);
    expect(id).toBeTruthy();
    expect(activePrayerOf(g, 'millbrook')?.status).toBe('open');
    const view = placePrayerView(g, GOD, 'millbrook', DAY + 1);
    expect(view?.line).toBe('Millbrook prays to The Shepherd for bread.');
    expect(view?.hint).toMatch(/Answer it with a card that feeds it or calms it\. Five days left\./);
    expect(view?.hint).not.toMatch(/\d/);
    expect(PRAYER_ANSWER_WINDOW_DAYS).toBe(6);
  });
});
