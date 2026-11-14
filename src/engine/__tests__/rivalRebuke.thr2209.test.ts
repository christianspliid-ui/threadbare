/**
 * THR-2209 — Rebuke: a god card that answers a rival on the place it just pressed.
 *
 * Plan: Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md § Done when, "Slice 3".
 *  - A landing on untended turf, then Rebuke on that place, absorbs the next landing
 *    there (absorbed toast, `rival.rebuked` trace) and raises the rival's temper by 0.08
 *    with the cause shown in the panel.
 *  - Rebuke is not offered on a place no rival pressed in the window (target filter).
 *  - The toast line matches the god's holdings (`landed` / `landedNoCard`).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { GameState, TickEvent } from '../../types/gameState';
import type { RivalDefinition, RivalState } from '../../types/rival';
import type { SphereAffinity } from '../../types/sphereAffinity';
import type { SpherePressureEvent } from '../../types/sphereAffinity';
import type { TargetContext } from '../../types/influence';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { landRivalProbe, rivalProbeMove, rivalLandingLine } from '../orchestrator';
import { createRivalState } from '../rival';
import { rebukablePlaceIds, rebukeTargetFor, resolveRebuke } from '../rivalRebuke';
import { buildTendingIndex, dominionOf, isTended, rebukeTendingOf } from '../dominion';
import { dominionTendLine } from '../dominionViewModels';
import { getTargetActionSlots } from '../targetActions';
import { rivalCauseSegments, segmentsText } from '../views/rivalEntry';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  RIVAL_HOSTILITY_START,
  RIVAL_REBUKE_HOLD_DAYS,
  RIVAL_REBUKE_PUSH,
  RIVAL_REBUKE_TEMPER_RISE,
  RIVAL_REBUKE_WINDOW_DAYS,
} from '../../data/rival-scheme-config';
import { RIVAL_REBUKE_TEMPLATE_ID, rivalRebukeReply } from '../../data/rival-rebuke-content';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { ASCENDANT_MILESTONE_BEATS } from '../../data/ascendant-milestone-beats';
import { MILESTONE_FIRST_REBUKE_BEAT_ID } from '../../data/player-progression';

const GOD = 'asc.test';
const DAY = TICKS_PER_DAY;

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

/** A god with `towns` places of its own ground (Touched or better). */
function makeWorld(towns: number): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: GOD, type: 'actor', name: 'The Shepherd',
    properties: {
      actorType: 'ascendant',
      spherePoints: { mind: 3, spirit: 2 },
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  for (let i = 0; i < towns; i++) {
    g.addNode({
      id: `t${i}`, type: 'location', name: `Town ${i}`,
      properties: { locationSubtype: 'town', hexCol: i, hexRow: 3, sphereAffinity: bag({ mind: 3, spirit: 2 }) },
    });
  }
  return g;
}

const RIVAL = {
  id: 'actor_rival_1', name: 'The Hollow Warden', primarySphere: 'death' as SphereName, behavior: 'aggressive',
} as unknown as RivalDefinition;

function makeState(g: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return {
    graph: g, ascendantId: GOD, tick, tickEvents: [], controlEffects: [],
    rivalDefinitions: [RIVAL],
    rivalStates: [],
    ...extra,
  } as unknown as GameState;
}

function pressed(placeId: string, tick: number, absorbed = false): RivalState {
  return { ...createRivalState(RIVAL.id), lastPressed: { placeId, tick, ...(absorbed ? { absorbed: true } : {}) } };
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('the target filter: Rebuke only where a rival just pressed', () => {
  it('a fresh unabsorbed landing is rebukable; an absorbed one, a stale one, or none is not', () => {
    const g = makeWorld(3);
    const now = DAY * 10;
    expect(rebukablePlaceIds(makeState(g, now, { rivalStates: [] })).size).toBe(0);
    expect(rebukeTargetFor(makeState(g, now, { rivalStates: [pressed('t0', now - DAY)] }), 't0'))
      .toEqual({ rivalId: RIVAL.id, pressedAt: now - DAY });
    expect(rebukeTargetFor(makeState(g, now, { rivalStates: [pressed('t0', now - DAY, true)] }), 't0')).toBeNull();
    const stale = now - RIVAL_REBUKE_WINDOW_DAYS * DAY - 1;
    expect(rebukeTargetFor(makeState(g, now, { rivalStates: [pressed('t0', stale)] }), 't0')).toBeNull();
    expect(rebukeTargetFor(makeState(g, now, { rivalStates: [pressed('t0', now - DAY)] }), 't1')).toBeNull();
    expect([...rebukablePlaceIds(makeState(g, now, { rivalStates: [pressed('t1', now)] }))]).toEqual(['t1']);
  });

  it('getTargetActionSlots offers Rebuke only on a place in the rebuke set (fail-closed without one)', () => {
    const rebuke = UNIFIED_ACTION_TEMPLATES.find(t => t.id === RIVAL_REBUKE_TEMPLATE_ID)!;
    expect(rebuke).toBeDefined();
    const target = (nodeId: string): TargetContext => ({
      nodeId, nodeType: 'location', displayName: nodeId, displayLabel: 'town', subtype: 'town',
      traitIds: [], sphereAffinity: null, position: null, properties: {},
    } as TargetContext);
    const base = {
      templates: [rebuke], pool: { mind: 20, spirit: 20 } as never, primarySphere: 'mind' as SphereName,
      accessibleSpheres: ['mind', 'spirit'] as SphereName[], unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID],
    };
    const ids = (nodeId: string, set?: Set<string>) =>
      getTargetActionSlots({ ...base, target: target(nodeId), ...(set ? { rebukeTargets: set } : {}) }).map(s => s.id);
    expect(ids('t0')).toHaveLength(0);
    expect(ids('t0', new Set(['t1']))).toHaveLength(0);
    expect(ids('t1', new Set(['t1']))).toHaveLength(1);
  });

  it('the card is a generic milestone gift, and the first-rebuke milestone grants it', () => {
    const rebuke = UNIFIED_ACTION_TEMPLATES.find(t => t.id === RIVAL_REBUKE_TEMPLATE_ID)!;
    expect(rebuke.progression).toEqual({ tier: 1, offer: 'gift', giftBy: 'milestone', generic: true });
    expect(rebuke.targetCategories).toEqual(['location']);
    const beat = ASCENDANT_MILESTONE_BEATS.find(b => b.beatId === MILESTONE_FIRST_REBUKE_BEAT_ID);
    expect(beat?.grantsActionIds).toEqual([RIVAL_REBUKE_TEMPLATE_ID]);
  });
});

describe('a rebuke holds the place: the next landing there is absorbed (Done-when 1)', () => {
  it('landing on untended turf → Rebuke → the next landing there is absorbed, temper +0.08, cause shown', () => {
    const g = makeWorld(10);
    // 1. The rival lands on untended t0 (rng 0 draws the first untended place).
    const events: TickEvent[] = [];
    const first = rivalProbeMove(makeState(g, DAY * 3), RIVAL, createRivalState(RIVAL.id), () => 0, events, []);
    expect(first.lastPressed).toEqual({ placeId: 't0', tick: DAY * 3 });
    expect(rebukablePlaceIds(makeState(g, DAY * 3, { rivalStates: [first] }))).toEqual(new Set(['t0']));

    // 2. The god rebukes t0 on a clean landing.
    const castTick = DAY * 3 + 4;
    const before = first.hostilityToPlayer;
    const res = resolveRebuke(
      makeState(g, castTick, { rivalStates: [first] }),
      { actorId: GOD, targetId: 't0', outcome: 'success', actionId: 'a1' },
    )!;
    expect(res).not.toBeNull();
    expect(res.rebukedPlaces).toEqual({ t0: castTick + RIVAL_REBUKE_HOLD_DAYS * DAY });
    expect(res.pressure).toMatchObject({
      targetEntityId: 't0', sphere: 'mind', magnitude: RIVAL_REBUKE_PUSH, source: 'divine_action', causedBy: GOD,
    });
    const rebuked = res.rivalStates![0];
    expect(rebuked.hostilityToPlayer).toBeCloseTo(before + RIVAL_REBUKE_TEMPER_RISE, 10);
    expect(rebuked.hostilityCause).toEqual({ kind: 'rebuked', placeId: 't0', tick: castTick });
    expect(res.change.detail).toBe("You turned The Hollow Warden's hand from Town 0. The place holds against it for a few days.");
    const trace = getTraces().find(t => t.category === 'rival.rebuked') as unknown as Record<string, unknown>;
    expect(trace).toMatchObject({ rivalId: RIVAL.id, placeId: 't0', band: 'success', pushed: RIVAL_REBUKE_PUSH });
    expect(trace.temperAfter).toBeCloseTo(before + RIVAL_REBUKE_TEMPER_RISE, 10);

    // The panel says why its temper rose, with the place.
    const cause = segmentsText(rivalCauseSegments(rebuked, castTick, id => (id === 't0' ? 'Town 0' : undefined)));
    expect(cause).toBe('. You rebuked it at Town 0.');
    const noPlace = segmentsText(rivalCauseSegments(rebuked, castTick, () => undefined));
    expect(noPlace).toBe('. You rebuked it.');

    // 3. The rebuke tends t0, so the next landing there is absorbed.
    const nextTick = DAY * 5;
    const later = makeState(g, nextTick, { rivalStates: [rebuked], rebukedPlaces: res.rebukedPlaces });
    const index = buildTendingIndex(g, GOD, [], id => dominionOf(g, GOD, id).band, rebukeTendingOf(later));
    expect(isTended(index, 't0')).toEqual(['rebuke']);
    expect(dominionTendLine(g, GOD, 't0', 'touched', [], rebukeTendingOf(later))).toBe('Held against rivals by your rebuke.');
    const pressures: SpherePressureEvent[] = [];
    // The tended slice of the roll comes last, so 0.9999 draws the one tended place, t0.
    const landing = landRivalProbe(later, RIVAL, () => 0.9999, pressures)!;
    expect(landing.placeId).toBe('t0');
    expect(landing.tendedBy).toEqual(['rebuke']);
    expect(rivalLandingLine(RIVAL.name, landing, true)).toBe('The Hollow Warden pressed on Town 0, but your rebuke held it.');
    const raid = getTraces().filter(t => t.category === 'dominion.raid').pop() as unknown as Record<string, unknown>;
    expect(raid.absorbed).toBe(true);

    // An absorbed landing is recorded as such, so it is not rebukable again.
    const toast: TickEvent[] = [];
    const again = rivalProbeMove(makeState(g, DAY * 6, { rivalStates: [rebuked], rebukedPlaces: res.rebukedPlaces }),
      RIVAL, rebuked, () => 0.9999, toast, []);
    expect(again.lastPressed).toEqual({ placeId: 't0', tick: DAY * 6, absorbed: true });
    expect(rebukablePlaceIds(makeState(g, DAY * 6, { rivalStates: [again] })).size).toBe(0);
  });

  it('the rebuke lapses after its hold, and lapsed entries are pruned on the next write', () => {
    const g = makeWorld(3);
    const until = DAY * 4;
    const index = (tick: number) => buildTendingIndex(g, GOD, [], () => 'touched',
      rebukeTendingOf({ rebukedPlaces: { t0: until }, tick }));
    expect(isTended(index(until - 1), 't0')).toEqual(['rebuke']);
    expect(isTended(index(until), 't0')).toBeNull();
    const res = resolveRebuke(
      makeState(g, DAY * 10, { rivalStates: [pressed('t1', DAY * 9)], rebukedPlaces: { t0: until } }),
      { actorId: GOD, targetId: 't1', outcome: 'success', actionId: 'a2' },
    )!;
    expect(Object.keys(res.rebukedPlaces)).toEqual(['t1']);
  });

  it('a crooked landing tends without the push, and the reply says what stays taken', () => {
    const g = makeWorld(3);
    const res = resolveRebuke(
      makeState(g, DAY * 2, { rivalStates: [pressed('t0', DAY)] }),
      { actorId: GOD, targetId: 't0', outcome: 'success_at_cost', actionId: 'a3' },
    )!;
    expect(res.rebukedPlaces.t0).toBe(DAY * 2 + RIVAL_REBUKE_HOLD_DAYS * DAY);
    expect(res.pressure).toBeUndefined();
    expect(res.rivalStates?.[0].hostilityCause?.kind).toBe('rebuked');
    expect(res.change.detail).toBe('The place holds against The Hollow Warden for a few days, but what it took stays taken.');
  });

  it('fail-soft: a place no longer a rival landing still tends, with no push and no temper write', () => {
    const g = makeWorld(3);
    const res = resolveRebuke(
      makeState(g, DAY * 9, { rivalStates: [pressed('t0', DAY)] }),
      { actorId: GOD, targetId: 't0', outcome: 'success', actionId: 'a4' },
    )!;
    expect(res.rebukedPlaces.t0).toBeGreaterThan(DAY * 9);
    expect(res.pressure).toBeUndefined();
    expect(res.rivalStates).toBeUndefined();
    expect(resolveRebuke(makeState(g, DAY, {}), { actorId: GOD, targetId: 'nowhere', outcome: 'success', actionId: 'a5' })).toBeNull();
  });

  it('a missing rival temper rises from the start', () => {
    const g = makeWorld(2);
    const rs = { ...pressed('t0', DAY), hostilityToPlayer: Number.NaN };
    const res = resolveRebuke(makeState(g, DAY, { rivalStates: [rs] }),
      { actorId: GOD, targetId: 't0', outcome: 'success', actionId: 'a6' })!;
    expect(res.rivalStates![0].hostilityToPlayer).toBeCloseTo(RIVAL_HOSTILITY_START + RIVAL_REBUKE_TEMPER_RISE, 10);
  });
});

describe('the toast promises only what the world does (Done-when 3)', () => {
  const base = { placeId: 'p', placeName: 'Battlefield Ruin', sphere: 'force' as SphereName, tendedBy: null };
  it('names Rebuke only when the god holds it', () => {
    expect(rivalLandingLine('The Blighted Weaver', base, true))
      .toBe('The Blighted Weaver pressed Force on Battlefield Ruin. Rebuke it there, or tend the place, and its next blow is turned.');
    expect(rivalLandingLine('The Blighted Weaver', base, false))
      .toBe('The Blighted Weaver pressed Force on Battlefield Ruin. A place you tend turns its next blow.');
    expect(rivalLandingLine('The Blighted Weaver', { ...base, placeName: '' }, true))
      .toBe('The Blighted Weaver pressed Force on a place of yours. Rebuke it there, or tend the place, and its next blow is turned.');
  });

  it('rivalProbeMove picks the line from unlockedActionIds', () => {
    const g = makeWorld(10);
    const held: TickEvent[] = [];
    rivalProbeMove(makeState(g, DAY * 3, { unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID] }),
      RIVAL, createRivalState(RIVAL.id), () => 0, held, []);
    expect(held[0].message).toBe('The Hollow Warden pressed Death on Town 0. Rebuke it there, or tend the place, and its next blow is turned.');
  });

  it('the cast reply fills empty slots (PC-3)', () => {
    expect(rivalRebukeReply('landed', undefined, undefined))
      .toBe("You turned a rival god's hand from the place. The place holds against it for a few days.");
    expect(rivalRebukeReply('crooked', '', 'Ashford'))
      .toBe('The place holds against a rival god for a few days, but what it took stays taken.');
  });
});
