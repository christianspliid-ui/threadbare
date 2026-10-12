/**
 * THR-1748 — Dominion core: the read, its consumers, the writers and the chronicle.
 *
 * Plan: Docs/plans/2026-10-11-thr-1748-dominion-core.md § Done when. Prices and odds
 * with the flag ON live in `dominion.prices-live.test.ts` (module mock); this file
 * runs with the shipped default (`DOMINION_PRICES_LIVE = false`).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { SPHERE_NAMES, type SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { ControlEffect } from '../../types/controlEffect';
import type { SphereAffinity, SpherePressureEvent } from '../../types/sphereAffinity';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { buildHexTargetContext } from '../targetContextBuilders';
import { getTargetActionSlots } from '../targetActions';
import { hexKey } from '../../lib/hexKey';
import {
  bearsBestowedGift,
  bandFromMatch,
  bandOfValue,
  buildTendingIndex,
  computeThreadYield,
  dominionBandOfHex,
  dominionOf,
  dominionPower,
  dominionScaledCost,
  dominionScaledEssenceCost,
  dominionSphereFactor,
  getAttunementMarksCrossed,
  isTended,
  matchOfScores,
  shiftBreakSphere,
  sourceIncomeMultiplier,
} from '../dominion';
import {
  afterSpherePressure,
  composeDominionChronicle,
  phaseDominion,
  raidAllowanceLeft,
  recordRaidLanding,
  recordSeededScores,
  relaxTowardSeed,
  splitByPoints,
} from '../phaseDominion';
import { phaseSpherePressure, absorbTendedRaid } from '../phaseSpherePressure';
import { dominionAttunementPressures, attunementThresholdsCrossed } from '../essenceEarned';
import { opposingSpheresOfBuy, generateRivals } from '../rival';
import { computeFactionSphereAggregates } from '../sphereAffinity';
import { SPHERE_ATTUNEMENT_THRESHOLDS } from '../../data/nudge-constants';
import {
  DOMINION_BREAK_PRESSURE,
  DOMINION_CLAIM_TEMPLATE_ID,
  DOMINION_PRICES_LIVE,
  DOMINION_TENDED_RAID_ABSORB,
  ESSENCE_PER_THREAD_BY_TIER,
  DOMINION_THREAD_YIELD_MULTIPLIER,
} from '../../data/dominion-content';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';

const GOD = 'asc.test';
/** The god bought mind 3 / spirit 2 — opposites force (0.6) and energy (0.4). */
const POINTS = { mind: 3, spirit: 2 };

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: GOD, type: 'actor', name: 'The Test',
    properties: {
      actorType: 'ascendant',
      spherePoints: POINTS,
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  return g;
}

function addPlace(g: WorldGraph, id: string, scores: Partial<Record<SphereName, number>>, extra: Record<string, unknown> = {}) {
  g.addNode({ id, type: 'location', name: id, properties: { hexCol: 1, hexRow: 1, sphereAffinity: bag(scores), ...extra } });
}

function stateOf(g: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 1, seed: 42, graph: g, tiles: [], ascendantId: GOD,
    tickEvents: [], recentEvents: [], controlEffects: [], pendingSpherePressures: [],
    ...overrides,
  } as unknown as GameState;
}

function claimOn(placeId: string): ControlEffect {
  return {
    effectId: 'ctrl_claim', templateId: DOMINION_CLAIM_TEMPLATE_ID, ownerId: GOD,
    targetHexCol: 1, targetHexRow: 1, targetNodeId: placeId,
    establishedTick: 0, ritualEssenceInvested: 5, perTickCost: { mind: 0.3 },
    perTickMutations: [], perTickGraphOps: [], active: true, ticksActive: 0,
  } as unknown as ControlEffect;
}

/** One tick of the Dominion loop: phaseDominion → sphere pressure → after-pressure. */
function step(state: GameState): GameState {
  let s = { ...state, ...phaseDominion(state) } as GameState;
  s = { ...s, ...phaseSpherePressure(s), pendingSpherePressures: [] } as GameState;
  s = { ...s, ...afterSpherePressure(s) } as GameState;
  return { ...s, tick: s.tick + 1, tickEvents: [] } as GameState;
}

describe('THR-1748 Dominion — the read', () => {
  it('cuts bands at −1.5 / 0.5 / 1.5 / 3.0', () => {
    expect(bandOfValue(-2)).toBe('hostile');
    expect(bandOfValue(-1.5)).toBe('foreign');
    expect(bandOfValue(0.49)).toBe('foreign');
    expect(bandOfValue(0.5)).toBe('touched');
    expect(bandOfValue(1.5)).toBe('held');
    expect(bandOfValue(3)).toBe('sovereign');
    expect(bandOfValue(Number.NaN)).toBe('foreign');
  });

  it('weights the opposite pole by its pair strength and averages by points', () => {
    const scores = bag({ mind: 2, force: 5 }).scores;
    // (3 × (2 − 0.6×5) + 2 × 0) / 5 = −0.6
    expect(matchOfScores(POINTS, scores)).toBeCloseTo(-0.6, 10);
  });

  it('power widens friendly ground only', () => {
    expect(bandFromMatch(1.2, 2)).toBe('held');
    expect(bandFromMatch(-1.0, 2)).toBe('foreign');
  });

  it('reads a place on the god\'s spheres Sovereign and one on their opposites Hostile', () => {
    const g = makeGraph();
    addPlace(g, 'loc.home', { mind: 5, spirit: 5 });
    addPlace(g, 'loc.foe', { force: 5, energy: 5 });
    addPlace(g, 'loc.plain', {});
    expect(dominionOf(g, GOD, 'loc.home').band).toBe('sovereign');
    expect(dominionOf(g, GOD, 'loc.foe').band).toBe('hostile');
    expect(dominionOf(g, GOD, 'loc.plain').band).toBe('foreign');
  });

  it('reads power 1.0 at the recorded baseline, rises with bought scores, caps at 2.0', () => {
    const g = makeGraph();
    expect(dominionPower(g, GOD)).toBeCloseTo(1, 10);
    g.updateNode(GOD, { properties: { sphereAffinity: bag({ mind: 3, spirit: 1 }) } });
    expect(dominionPower(g, GOD)).toBeCloseTo(4 / 3, 10);
    g.updateNode(GOD, { properties: { sphereAffinity: bag({ mind: 9, spirit: 9 }) } });
    expect(dominionPower(g, GOD)).toBe(2);
  });

  it('is fail-soft: missing god, missing object, no bag → Foreign', () => {
    const g = makeGraph();
    expect(dominionOf(g, 'nobody', 'loc.x').band).toBe('foreign');
    expect(dominionOf(g, GOD, 'missing').band).toBe('foreign');
    g.addNode({ id: 'loc.bare', type: 'location', name: 'bare', properties: {} });
    expect(dominionOf(g, GOD, 'loc.bare').band).toBe('foreign');
  });

  it('reads a sublocation, a mortal, an artifact through its bearer, an army through its faction', () => {
    const g = makeGraph();
    addPlace(g, 'loc.home', { mind: 5, spirit: 5 });
    g.addNode({ id: 'sub.shrine', type: 'location', name: 'shrine', properties: { parentLocationId: 'loc.home', sphereAffinity: bag({ mind: 4 }) } });
    g.addNode({ id: 'm1', type: 'actor', name: 'm1', properties: { actorType: 'individual', sphereAffinity: bag({ mind: 6, spirit: 3 }) } });
    g.addNode({ id: 'art1', type: 'artifact', name: 'art1', properties: {} });
    g.addEdge({ id: 'e-pos', source: 'm1', target: 'art1', type: 'possesses', properties: {} });
    g.addNode({ id: 'art2', type: 'artifact', name: 'art2', properties: {} });
    g.addNode({ id: 'f1', type: 'actor', name: 'f1', properties: { actorType: 'faction' } });
    g.addEdge({ id: 'e-mem', source: 'm1', target: 'f1', type: 'member_of', properties: {} });
    computeFactionSphereAggregates(g, 0);
    g.addNode({ id: 'army1', type: 'actor', name: 'army1', properties: { actorType: 'group', groupKind: 'army' } });
    g.addEdge({ id: 'e-arm', source: 'army1', target: 'f1', type: 'member_of', properties: {} });

    expect(dominionOf(g, GOD, 'sub.shrine').reason.kind).toBe('sublocation');
    expect(dominionOf(g, GOD, 'm1').band).toBe('sovereign');
    expect(dominionOf(g, GOD, 'art1').reason.readThrough).toBe('bearer');
    expect(dominionOf(g, GOD, 'art1').band).toBe('sovereign');
    expect(dominionOf(g, GOD, 'art2').band).toBe('foreign');
    expect(dominionOf(g, GOD, 'f1').band).toBe('sovereign');
    const army = dominionOf(g, GOD, 'army1');
    if (army.reason.kind === 'army') expect(army.reason.readThrough).toBe('faction-of-army');
  });

  it('writes the unrounded faction mean beside the rounded one (THR-1764 finding 1)', () => {
    const g = makeGraph();
    g.addNode({ id: 'f1', type: 'actor', name: 'f1', properties: { actorType: 'faction' } });
    for (const [i, mind] of [[1, 1], [2, 0]] as const) {
      g.addNode({ id: `m${i}`, type: 'actor', name: `m${i}`, properties: { actorType: 'individual', sphereAffinity: bag({ mind }) } });
      g.addEdge({ id: `e${i}`, source: `m${i}`, target: 'f1', type: 'member_of', properties: {} });
    }
    computeFactionSphereAggregates(g, 0);
    const f = g.getNode('f1')!;
    expect((f.properties.sphereAggregateExact as Record<string, number>).mind).toBeCloseTo(0.5, 10);
    expect((f.properties.sphereAggregate as { scores: Record<string, number> }).scores.mind).toBe(1);
    // 3 × 0.5 / 5 = 0.3 → Foreign, read from the exact mean (not the rounded 1 → Touched).
    expect(dominionOf(g, GOD, 'f1').reason.match).toBeCloseTo(0.3, 10);
  });

  it('answers for a hex by its terrain without writing anything', () => {
    const g = makeGraph();
    expect(['hostile', 'foreign', 'touched', 'held', 'sovereign']).toContain(dominionBandOfHex(g, GOD, 'sacred_grove'));
    expect(dominionBandOfHex(g, 'nobody', 'sacred_grove')).toBe('foreign');
  });
});

describe('THR-1748 Dominion — consumers (shipped flag off)', () => {
  it('ships with DOMINION_PRICES_LIVE = false', () => {
    expect(DOMINION_PRICES_LIVE).toBe(false);
  });

  it('with the flag off, the same card costs and rolls the same on every band', () => {
    for (const band of ['hostile', 'foreign', 'touched', 'held', 'sovereign'] as const) {
      expect(dominionScaledCost(8, band)).toBe(8);
      expect(dominionSphereFactor(band, 'player')).toBe(0);
    }
  });

  it('with the flag on, Sovereign costs less than Hostile, floored at half and never below 1', () => {
    expect(dominionScaledCost(8, 'sovereign', true)).toBe(6);
    expect(dominionScaledCost(8, 'hostile', true)).toBe(12);
    expect(dominionScaledCost(8, 'foreign', true)).toBe(8);
    expect(dominionScaledCost(1, 'sovereign', true)).toBe(1);
    expect(dominionScaledCost(0, 'hostile', true)).toBe(0);
  });

  it('pins sphereFactor to 0 for every non-player source', () => {
    for (const source of ['agent', 'mortal', 'encounter', undefined]) {
      expect(dominionSphereFactor('sovereign', source, true)).toBe(0);
    }
    expect(dominionSphereFactor('sovereign', 'player', true)).toBeCloseTo(0.10, 10);
    expect(dominionSphereFactor('hostile', 'player', true)).toBeCloseTo(-0.10, 10);
  });

  it('the shared cost helper prices on the target\'s band (preview pieces = charge)', () => {
    const g = makeGraph();
    addPlace(g, 'loc.home', { mind: 5, spirit: 5 });
    const priced = dominionScaledEssenceCost(g, GOD, { essenceCost: 8 }, 'loc.home', true);
    expect(priced.band).toBe('sovereign');
    expect(priced.cost).toBe(dominionScaledCost(priced.base, priced.band, true));
    expect(dominionScaledEssenceCost(g, GOD, { essenceCost: 8 }, undefined, true).band).toBe('foreign');
  });

  it('thread yield pays by tier × band; tier 0 keeps today\'s 0.1 on Foreign ground', () => {
    const g = makeGraph();
    addPlace(g, 'loc.plain', {});
    g.addNode({ id: 'm.home', type: 'actor', name: 'a', properties: { actorType: 'individual', sphereAffinity: bag({ mind: 5, spirit: 5 }) } });
    g.addNode({ id: 'm.plain', type: 'actor', name: 'b', properties: { actorType: 'individual', sphereAffinity: bag({}) } });
    g.addEdge({ id: 't1', source: GOD, target: 'm.home', type: 'thread', properties: { tier: 2 } });
    g.addEdge({ id: 't2', source: GOD, target: 'm.plain', type: 'thread', properties: { tier: 0 } });
    const { total, lines } = computeThreadYield(g, GOD);
    const home = lines.find(l => l.targetId === 'm.home')!;
    const plain = lines.find(l => l.targetId === 'm.plain')!;
    expect(home.band).toBe('sovereign');
    expect(home.yield).toBeCloseTo(ESSENCE_PER_THREAD_BY_TIER[2] * DOMINION_THREAD_YIELD_MULTIPLIER.sovereign, 10);
    expect(plain.yield).toBeCloseTo(0.1, 10);
    expect(total).toBeCloseTo(home.yield + plain.yield, 10);
  });

  it('a held-or-better mortal yields more than a Foreign one at the same tier', () => {
    const g = makeGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'a', properties: { actorType: 'individual', sphereAffinity: bag({ mind: 3, spirit: 2 }) } });
    g.addNode({ id: 'b', type: 'actor', name: 'b', properties: { actorType: 'individual', sphereAffinity: bag({}) } });
    g.addEdge({ id: 't1', source: GOD, target: 'a', type: 'thread', properties: { tier: 3 } });
    g.addEdge({ id: 't2', source: GOD, target: 'b', type: 'thread', properties: { tier: 3 } });
    const { lines } = computeThreadYield(g, GOD);
    expect(lines[0].yield).toBeGreaterThan(lines[1].yield);
  });

  it('source income scales by host band; a Hostile host yields nothing', () => {
    const g = makeGraph();
    addPlace(g, 'loc.foe', { force: 5, energy: 5 });
    addPlace(g, 'loc.home', { mind: 5, spirit: 5 });
    expect(sourceIncomeMultiplier(g, GOD, 'loc.foe')).toBe(0);
    expect(sourceIncomeMultiplier(g, GOD, 'loc.home')).toBe(1.5);
  });

  it('the debug band, the cost band and the thread-yield band agree for one location in one tick', () => {
    const g = makeGraph();
    addPlace(g, 'loc.a', { mind: 2, spirit: 1 });
    g.addEdge({ id: 't-loc', source: GOD, target: 'loc.a', type: 'thread', properties: { tier: 1 } });
    const debugBand = dominionOf(g, GOD, 'loc.a').band;
    const costBand = dominionScaledEssenceCost(g, GOD, { essenceCost: 4 }, 'loc.a').band;
    const yieldBand = computeThreadYield(g, GOD).lines[0].band;
    expect(costBand).toBe(debugBand);
    expect(yieldBand).toBe(debugBand);
  });
});

describe('THR-1748 Dominion — writers', () => {
  it('splits a push across the bought vector by points', () => {
    const split = splitByPoints(0.03, POINTS);
    expect(split.mind).toBeCloseTo(0.018, 10);
    expect(split.spirit).toBeCloseTo(0.012, 10);
  });

  it('a sustained Claim on an unopposed Foreign place reaches Touched by 6 days and Held by 16', () => {
    const g = makeGraph();
    addPlace(g, 'loc.a', {});
    recordSeededScores(g);
    let s = stateOf(g, { controlEffects: [claimOn('loc.a')] });
    let touchedAt = -1;
    let heldAt = -1;
    for (let t = 0; t < 16 * TICKS_PER_DAY + 1 && heldAt < 0; t++) {
      s = step(s);
      const band = dominionOf(g, GOD, 'loc.a').band;
      if (touchedAt < 0 && band === 'touched') touchedAt = t;
      if (heldAt < 0 && band === 'held') heldAt = t;
    }
    expect(touchedAt).toBeGreaterThan(0);
    expect(touchedAt).toBeLessThanOrEqual(6 * TICKS_PER_DAY);
    expect(heldAt).toBeGreaterThan(0);
    expect(heldAt).toBeLessThanOrEqual(16 * TICKS_PER_DAY);
  });

  it('an untended Held place loses a band within 30 days; with a Claim it keeps it', () => {
    for (const claimed of [false, true]) {
      const g = makeGraph();
      addPlace(g, 'loc.a', {});
      recordSeededScores(g); // seeded at zero
      g.updateNode('loc.a', { properties: { sphereAffinity: bag({ mind: 2, spirit: 1 }) } });
      expect(dominionOf(g, GOD, 'loc.a').band).toBe('held');
      let s = stateOf(g, { controlEffects: claimed ? [claimOn('loc.a')] : [] });
      let droppedAt = -1;
      for (let t = 0; t < 30 * TICKS_PER_DAY && droppedAt < 0; t++) {
        s = step(s);
        if (dominionOf(g, GOD, 'loc.a').band !== 'held' && dominionOf(g, GOD, 'loc.a').band !== 'sovereign') droppedAt = t;
      }
      if (claimed) expect(droppedAt).toBe(-1);
      else {
        expect(droppedAt).toBeGreaterThan(TICKS_PER_DAY); // not on its first untended tick
        expect(droppedAt).toBeLessThan(30 * TICKS_PER_DAY);
      }
    }
  });

  it('neglect never falls below the seed and never touches an opposing pole', () => {
    const r = relaxTowardSeed(bag({ mind: 1, force: 3 }), { mind: 1 }, ['mind', 'spirit'], 5);
    expect(r.updated.scores.mind).toBe(1);
    expect(r.updated.scores.force).toBe(3);
    expect(r.dropped).toEqual([]);
  });

  it('tending: Claim, seat and a tier ≥ 1 thread tend; an Unaware thread does not', () => {
    const g = makeGraph();
    addPlace(g, 'loc.claim', {});
    addPlace(g, 'loc.seat', {});
    addPlace(g, 'loc.carry', {});
    addPlace(g, 'loc.unaware', {});
    g.updateNode(GOD, { properties: { homeSeatLocationId: 'loc.seat' } });
    for (const [id, loc, tier] of [['m1', 'loc.carry', 2], ['m2', 'loc.unaware', 0]] as const) {
      g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
      g.addEdge({ id: `l-${id}`, source: id, target: loc, type: 'located_at', properties: {} });
      g.addEdge({ id: `t-${id}`, source: GOD, target: id, type: 'thread', properties: { tier } });
    }
    const index = buildTendingIndex(g, GOD, [claimOn('loc.claim')], () => 'foreign');
    expect(isTended(index, 'loc.claim')).toEqual(['claim']);
    expect(isTended(index, 'loc.seat')).toEqual(['seat']);
    expect(isTended(index, 'loc.carry')).toEqual(['carry']);
    expect(isTended(index, 'loc.unaware')).toBeNull();
  });

  it('the Bestow Power card\'s Divine Gift counts as a bestowed gift (review gate)', () => {
    const g = makeGraph();
    g.addNode({ id: 'm1', type: 'actor', name: 'm1', properties: { actorType: 'individual' } });
    expect(bearsBestowedGift(g, 'm1')).toBe(false);
    g.addNode({ id: 'gift', type: 'artifact', name: 'Divine Gift', properties: { source: 'bestow_power' } });
    g.addEdge({ id: 'e-gift', source: 'm1', target: 'gift', type: 'possesses', properties: {} });
    expect(bearsBestowedGift(g, 'm1')).toBe(true);
  });

  it('Claim and Shift Dominion never reach a bare hex drawer (review gate)', () => {
    const g = makeGraph();
    const hex = buildHexTargetContext({ col: 3, row: 5, terrain: 'grassland', graph: g });
    addPlace(g, 'loc.a', {});
    const loc = {
      nodeId: 'loc.a', nodeType: 'location' as const, displayName: 'loc.a', displayLabel: '',
      subtype: null, traitIds: [], sphereAffinity: null, position: null, properties: g.getNode('loc.a')!.properties,
    };
    const templates = [getUnifiedTemplateById('hex.claim_dominion')!, getUnifiedTemplateById('hex.shift_dominion')!];
    const ids = (target: typeof loc | typeof hex) => getTargetActionSlots({
      target, templates, pool: Object.fromEntries(SPHERE_NAMES.map(s => [s, 99])) as never,
      primarySphere: 'mind', accessibleSpheres: SPHERE_NAMES, unlockedActionIds: templates.map(t => t.id),
      // Both layers revealed on the hex, so only the node-type gate can drop the cards there.
      hexRevelation: { [hexKey(3, 5)]: { land: true, soul: true } } as never,
    }).map(s => s.id);
    expect(ids(hex)).toEqual([]);
    expect(ids(loc).length).toBe(2);
  });

  it('the Claim card\'s upkeep label names the god\'s primary sphere, the one it charges (review gate)', () => {
    const g = makeGraph();
    addPlace(g, 'loc.a', {});
    const claim = getUnifiedTemplateById('hex.claim_dominion')!;
    const [slot] = getTargetActionSlots({
      target: {
        nodeId: 'loc.a', nodeType: 'location', displayName: 'loc.a', displayLabel: '',
        subtype: null, traitIds: [], sphereAffinity: null, position: null, properties: g.getNode('loc.a')!.properties,
      },
      templates: [claim], pool: Object.fromEntries(SPHERE_NAMES.map(s => [s, 99])) as never,
      primarySphere: 'mind', accessibleSpheres: SPHERE_NAMES, unlockedActionIds: [claim.id],
      hexRevelation: {} as never, graph: g, controlOwnerId: GOD,
    });
    expect(slot.perTickCostLabel).toBe('0.3 mind/tick');
  });

  it('a tended place absorbs one raid burst as a rule', () => {
    const raid: SpherePressureEvent = { targetEntityId: 'x', sphere: 'force', magnitude: 4, source: 'rival', sourceId: 'r1' };
    const cast: SpherePressureEvent = { targetEntityId: 'x', sphere: 'mind', magnitude: 3, source: 'divine_action', sourceId: 'a1' };
    expect(absorbTendedRaid([raid, cast], DOMINION_TENDED_RAID_ABSORB)).toEqual([cast]);
    expect(absorbTendedRaid([{ ...raid, magnitude: 6 }], DOMINION_TENDED_RAID_ABSORB)[0].magnitude).toBe(2);
  });

  it('Shift breaks the bought sphere whose opposing pole weighs most there', () => {
    const g = makeGraph();
    addPlace(g, 'loc.force', { force: 2 });
    addPlace(g, 'loc.energy', { energy: 5 });
    addPlace(g, 'loc.plain', {});
    // mind: 3 × 0.6 × 2 = 3.6 vs spirit: 0 → mind.
    expect(shiftBreakSphere(g, GOD, 'loc.force')).toBe('mind');
    // spirit: 2 × 0.4 × 5 = 4 → spirit.
    expect(shiftBreakSphere(g, GOD, 'loc.energy')).toBe('spirit');
    // Nothing opposing → the primary simply builds.
    expect(shiftBreakSphere(g, GOD, 'loc.plain')).toBe('mind');
    expect(DOMINION_BREAK_PRESSURE).toBe(6);
  });

  it('Claim and Shift target places now, ids unchanged; Claim upkeep comes from the primary', () => {
    const claim = getUnifiedTemplateById('hex.claim_dominion')!;
    const shift = getUnifiedTemplateById('hex.shift_dominion')!;
    expect(claim.targetCategories).toEqual(['location']);
    expect(shift.targetCategories).toEqual(['location']);
    expect(claim.controlSpec?.perTickCostFromPrimary).toBeCloseTo(0.3, 10);
    expect(claim.controlSpec?.perTickMutations).toEqual([]);
  });

  it('the seat never reads below Touched (the clamp restores it)', () => {
    const g = makeGraph();
    addPlace(g, 'loc.seat', { force: 5, energy: 5 });
    g.updateNode(GOD, { properties: { homeSeatLocationId: 'loc.seat' } });
    recordSeededScores(g);
    let s = stateOf(g);
    s = step(s);
    expect(['touched', 'held', 'sovereign']).toContain(dominionOf(g, GOD, 'loc.seat').band);
  });
});

describe('THR-1748 Dominion — the opposing dominion', () => {
  it('rivals draw their sphere from the opposites of the buy', () => {
    expect(opposingSpheresOfBuy(POINTS).map(e => e.sphere).sort()).toEqual(['energy', 'force']);
    const profile = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1 / 12])) as never;
    for (let seed = 1; seed <= 20; seed++) {
      for (const r of generateRivals(profile, seed, POINTS)) {
        expect(['force', 'energy']).toContain(r.primarySphere);
      }
    }
  });

  it('throttles raids to one landing a day per 10 places of turf', () => {
    const g = makeGraph();
    expect(raidAllowanceLeft(g, GOD, 0, 9)).toBe(0);
    expect(raidAllowanceLeft(g, GOD, 0, 25)).toBe(2);
    recordRaidLanding(g, GOD, 0);
    expect(raidAllowanceLeft(g, GOD, 1, 25)).toBe(1);
    expect(raidAllowanceLeft(g, GOD, TICKS_PER_DAY, 25)).toBe(2);
  });
});

describe('THR-1748 Dominion — the god\'s attunement', () => {
  it('a bought sphere crossing 150 earned pushes progress into the god\'s score', () => {
    const g = makeGraph();
    const s = stateOf(g, { tick: 5 });
    const pushes = dominionAttunementPressures(s, { mind: 140 }, { mind: 155 });
    expect(pushes).toHaveLength(1);
    expect(pushes[0]).toMatchObject({ targetEntityId: GOD, sphere: 'mind', source: 'attunement', magnitude: 1 });
    expect(dominionAttunementPressures(s, { force: 140 }, { force: 155 })).toEqual([]);
  });

  it('three marks (20, 60, 150) lift the god from 2 to 3 in that sphere — power rises', () => {
    const g = makeGraph();
    let s = stateOf(g, { tick: 5 });
    const pushes = dominionAttunementPressures(s, { mind: 0 }, { mind: 150 });
    expect(pushes).toHaveLength(3);
    s = { ...s, pendingSpherePressures: pushes } as GameState;
    phaseSpherePressure(s);
    const scores = (g.getNode(GOD)!.properties.sphereAffinity as SphereAffinity).scores;
    expect(scores.mind).toBe(3);
    expect(dominionPower(g, GOD)).toBeGreaterThan(1);
  });

  it('getAttunementMarksCrossed counts marks for bought spheres only', () => {
    const g = makeGraph();
    expect(getAttunementMarksCrossed({ graph: g, ascendantId: GOD, essenceEarnedBySphere: { mind: 160 } }, 'mind')).toBe(3);
    expect(getAttunementMarksCrossed({ graph: g, ascendantId: GOD, essenceEarnedBySphere: { force: 160 } }, 'force')).toBe(0);
  });

  it('SPHERE_ATTUNEMENT_THRESHOLDS still grants the card marks exactly as before', () => {
    expect(SPHERE_ATTUNEMENT_THRESHOLDS).toEqual([20, 60]);
    expect(attunementThresholdsCrossed({ mind: 0 }, { mind: 150 })).toEqual([
      { sphere: 'mind', threshold: 20 }, { sphere: 'mind', threshold: 60 },
    ]);
  });
});

describe('THR-1748 Dominion — chronicle', () => {
  const name = (id: string) => ({ a: 'Hollowmere', b: 'Fenwick Ford', c: 'Thornwall', r: 'The Pale Weaver' } as Record<string, string>)[id] ?? id;

  it('one untended drop reads as the untended line', () => {
    expect(composeDominionChronicle({ dayDrops: [{ placeId: 'a', from: 'held', to: 'touched', cause: 'neglect' }], dayRises: {}, daySpheres: [] }, name))
      .toEqual(['Hollowmere has slipped from Held to Touched. No one tends it.']);
  });

  it('one raid drop names the rival', () => {
    expect(composeDominionChronicle({ dayDrops: [{ placeId: 'a', from: 'held', to: 'touched', cause: 'rival', rivalId: 'r' }], dayRises: {}, daySpheres: [] }, name))
      .toEqual(["The Pale Weaver's hand has pressed on Hollowmere. It is Touched now."]);
  });

  it('several drops coalesce into one line a day', () => {
    const lines = composeDominionChronicle({
      dayDrops: [
        { placeId: 'a', from: 'held', to: 'touched', cause: 'neglect' },
        { placeId: 'b', from: 'touched', to: 'foreign', cause: 'rival', rivalId: 'r' },
      ], dayRises: {}, daySpheres: [],
    }, name);
    expect(lines).toEqual(['2 of your places slipped today: Hollowmere and Fenwick Ford.']);
  });

  it('rises speak for Held and Sovereign only; power lines use sphere words', () => {
    const lines = composeDominionChronicle({ dayDrops: [], dayRises: { c: 'held', a: 'touched' }, daySpheres: ['life'] }, name);
    expect(lines).toEqual(['Thornwall is Held now.', 'Your hold on the green deepens.']);
  });
});
