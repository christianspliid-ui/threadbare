/**
 * THR-2255 — the Doom feeds at a place: ground you tend starves it, Rebuke answers it
 * where it fed, and the last stage raises a daily alert.
 *
 * Plan: Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md § "Tests for slice 1":
 *  - a failure on tended ground pushes nothing and traces `doom.feed_absorbed`;
 *  - a feeding on an untended place makes it rebukable for exactly DOOM_REBUKE_WINDOW_DAYS;
 *  - a Rebuke there tends it and raises no temper;
 *  - a place both pressed and fed reads as the rival target;
 *  - the alert fires at most once a day, and only from the last stage.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { ComplicationContext } from '../../types/complication';
import type { RivalDefinition, RivalState } from '../../types/rival';
import type { SphereAffinity } from '../../types/sphereAffinity';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { applyComplicationEffects, type ComplicationEffectsOutcome } from '../complicationEffects';
import { doomFeedProse } from '../doomFeedProse';
import { latestAnswerableFeeding, pruneDoomFeedings } from '../doomFeedings';
import { rebukablePlaceIds, rebukeAnswerFor, resolveRebuke, rivalRebukablePlaceIds } from '../rivalRebuke';
import { doomFeedAlert, phaseDoom } from '../phaseDoom';
import { createRivalState } from '../rival';
import { createDoomClockState } from '../doomClock';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import {
  DOOM_FEED_ALERT_EVERY_DAYS,
  DOOM_FEED_ALERT_FROM_STAGE,
  DOOM_REBUKE_WINDOW_DAYS,
} from '../../data/game-config';
import { RIVAL_HOSTILITY_START, RIVAL_REBUKE_HOLD_DAYS, RIVAL_REBUKE_PUSH, RIVAL_REBUKE_TEMPER_RISE } from '../../data/rival-scheme-config';
import { DOOM_REBUKE_REPLY, RIVAL_REBUKE_TEMPLATE_ID } from '../../data/rival-rebuke-content';
import { DOOM_FEED_ALERT_LINE, DOOM_FEED_LAST_STAGE_LINE } from '../../data/doom-feed-content';
import { COMPLICATION_TEMPLATES } from '../../data/complication-templates';

const GOD = 'asc.test';
const MORTAL = 'agent.mira';
const DAY = TICKS_PER_DAY;
const WINDOW = DOOM_REBUKE_WINDOW_DAYS * DAY;

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

/** A god seated at t0 (tended: `seat`); t1 and t2 are untended; Mira stands at `at`. */
function makeWorld(at = 't1'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: GOD, type: 'actor', name: 'The Shepherd',
    properties: {
      actorType: 'ascendant', homeSeatLocationId: 't0',
      spherePoints: { mind: 3, spirit: 2 },
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
    },
  });
  for (let i = 0; i < 3; i++) {
    g.addNode({
      id: `t${i}`, type: 'location', name: ['Riverford', 'Ashmoor', 'Dunhallow'][i],
      properties: { locationSubtype: 'town', hexCol: i * 4, hexRow: 3, sphereAffinity: bag({ mind: 3, spirit: 2 }) },
    });
  }
  g.addNode({ id: MORTAL, type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'loc_mira', source: MORTAL, target: at, type: 'located_at', properties: {} });
  return g;
}

const RIVAL = { id: 'actor_rival_1', name: 'The Hollow Warden', primarySphere: 'death' as SphereName, behavior: 'aggressive' } as unknown as RivalDefinition;

function makeState(g: WorldGraph, tick: number, extra: Partial<GameState> = {}): GameState {
  return {
    graph: g, ascendantId: GOD, tick, tickEvents: [], controlEffects: [],
    rivalDefinitions: [RIVAL], rivalStates: [],
    doomClock: { currentTick: 100, currentStage: 1 },
    ...extra,
  } as unknown as GameState;
}

function ctxAt(locationId: string): ComplicationContext {
  return {
    action: { actorId: MORTAL, actionId: 'act1', templateId: 'encounter.test' },
    locationId, presentAgentIds: [], factionIds: [], rng: () => 0, doomStage: 2,
  } as unknown as ComplicationContext;
}

const NOTICING = COMPLICATION_TEMPLATES.find(t => t.id === 'complication.worsening_convergence.doom_echo')!;

function feed(state: GameState, at: string, tick: number): ComplicationEffectsOutcome {
  const out: ComplicationEffectsOutcome = {};
  applyComplicationEffects([{ type: 'doom_micro_tick', magnitude: 0.3 }], ctxAt(at), state, tick, NOTICING.name, out, NOTICING.id);
  return out;
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('the Doom feeds at a place; tended ground starves it', () => {
  it('a failure on tended ground pushes nothing and traces doom.feed_absorbed', () => {
    const g = makeWorld('t0');
    const state = makeState(g, DAY * 5);
    const out = feed(state, 't0', DAY * 5);
    expect(state.doomClock.currentTick).toBe(100);
    expect(state.doomFeedings).toBeUndefined();
    expect(out.doomFeed).toEqual({ kind: 'held', placeId: 't0', placeName: 'Riverford' });
    const tr = getTraces().find(t => t.category === 'doom.feed_absorbed') as unknown as Record<string, unknown>;
    expect(tr).toMatchObject({ placeId: 't0', actorId: MORTAL, tendedBy: ['seat'] });
    expect(tr.magnitude).toBeCloseTo(0.3, 10);
    expect(getTraces().some(t => t.category === 'doom.fed')).toBe(false);
  });

  it('a failure on untended ground pushes as before, records the place and traces doom.fed', () => {
    const g = makeWorld('t1');
    const state = makeState(g, DAY * 5);
    const out = feed(state, 't1', DAY * 5);
    expect(state.doomClock.currentTick).toBeCloseTo(100.3, 10);
    expect(state.doomFeedings).toEqual({ t1: { lastTick: DAY * 5, lastActorId: MORTAL, recentTicks: [DAY * 5] } });
    expect(out.doomFeed).toEqual({ kind: 'fed', placeId: 't1', placeName: 'Ashmoor' });
    expect(getTraces().find(t => t.category === 'doom.fed')).toMatchObject({ placeId: 't1', complicationId: NOTICING.id });
  });

  it('a sublocation feeds its parent place; no place at all pushes with no record (fail-soft)', () => {
    const g = makeWorld('t1');
    g.addNode({ id: 't1.inn', type: 'location', name: 'The Inn', properties: { parentLocationId: 't1', locationSubtype: 'tavern' } });
    const state = makeState(g, DAY * 5);
    feed(state, 't1.inn', DAY * 5);
    expect(Object.keys(state.doomFeedings ?? {})).toEqual(['t1']);
    const bare = makeState(g, DAY * 5);
    const out: ComplicationEffectsOutcome = {};
    applyComplicationEffects([{ type: 'doom_micro_tick', magnitude: 0.3 }],
      { ...ctxAt('t1'), locationId: null } as ComplicationContext, bare, DAY * 5, NOTICING.name, out);
    expect(bare.doomClock.currentTick).toBeCloseTo(100.3, 10);
    expect(bare.doomFeedings).toBeUndefined();
    expect(out.doomFeed).toBeUndefined();
  });

  it('the held line replaces the fed line, and a held Rebuke adds its answer to the fed line', () => {
    const held = doomFeedProse({ prose: 'fed line.', heldProse: NOTICING.heldProse }, { doomFeed: { kind: 'held', placeId: 't0', placeName: 'Riverford' } }, {}, 0, 'Mira');
    expect(held).toBe('Mira failed at Riverford, but the ground is yours. The doom found nothing to feed on.');
    const fedNoCard = doomFeedProse({ prose: 'fed line.' }, { doomFeed: { kind: 'fed', placeId: 't1', placeName: 'Ashmoor' } }, {}, 0, 'Mira');
    expect(fedNoCard).toBe('fed line.');
    const fedCard = doomFeedProse({ prose: 'fed line.' }, { doomFeed: { kind: 'fed', placeId: 't1', placeName: 'Ashmoor' } },
      { unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID] }, 0, 'Mira');
    expect(fedCard).toBe('fed line. Rebuke it at Ashmoor and the doom finds nothing there.');
  });
});

describe('Rebuke answers the Doom where it fed', () => {
  it('a fed untended place is rebukable for exactly DOOM_REBUKE_WINDOW_DAYS', () => {
    const g = makeWorld('t1');
    const fedAt = DAY * 5;
    const state = makeState(g, fedAt);
    feed(state, 't1', fedAt);
    const at = (tick: number) => rebukablePlaceIds(makeState(g, tick, { doomFeedings: state.doomFeedings }));
    expect(at(fedAt)).toEqual(new Set(['t1']));
    expect(at(fedAt + WINDOW)).toEqual(new Set(['t1']));
    expect(at(fedAt + WINDOW + 1).size).toBe(0);
    // A doom feeding never opens the first-rebuke gift, which is about a rival's hand.
    expect(rivalRebukablePlaceIds(makeState(g, fedAt, { doomFeedings: state.doomFeedings })).size).toBe(0);
    expect(rebukeAnswerFor(makeState(g, fedAt + 1, { doomFeedings: state.doomFeedings }), 't1')).toEqual({ kind: 'doom', fedAt });
    // Pruned once outside the window.
    expect(pruneDoomFeedings(state.doomFeedings, fedAt + WINDOW + 1)).toEqual({});
  });

  it('a doom Rebuke tends the place, pushes back on a clean landing, raises no temper, and is answered once', () => {
    const g = makeWorld('t1');
    const fedAt = DAY * 5;
    const fed = makeState(g, fedAt);
    feed(fed, 't1', fedAt);
    const castTick = fedAt + 6;
    const rival = createRivalState(RIVAL.id);
    const res = resolveRebuke(
      makeState(g, castTick, { doomFeedings: fed.doomFeedings, rivalStates: [rival] }),
      { actorId: GOD, targetId: 't1', outcome: 'success', actionId: 'r1' },
    )!;
    const heldUntil = castTick + RIVAL_REBUKE_HOLD_DAYS * DAY;
    expect(res.rebukedPlaces).toEqual({ t1: heldUntil });
    expect(res.rivalStates).toBeUndefined(); // no temper rises
    expect(res.pressure).toMatchObject({ targetEntityId: 't1', sphere: 'mind', magnitude: RIVAL_REBUKE_PUSH, causedBy: GOD });
    expect(res.doomFeedings?.t1.heldUntil).toBe(heldUntil);
    expect(res.change.detail).toBe(DOOM_REBUKE_REPLY.landed.replace('{place}', 'Ashmoor'));
    const tr = getTraces().find(t => t.category === 'rival.rebuked') as unknown as Record<string, unknown>;
    expect(tr).toMatchObject({ rivalId: null, placeId: 't1', targetKind: 'doom', pushed: RIVAL_REBUKE_PUSH });
    expect(tr.temperBefore).toBeUndefined();

    // Tended now: the next failure there feeds nothing, and the place leaves the set.
    const after = makeState(g, castTick + 1, { doomFeedings: res.doomFeedings, rebukedPlaces: res.rebukedPlaces });
    expect(rebukablePlaceIds(after).size).toBe(0);
    feed(after, 't1', castTick + 1);
    expect(after.doomClock.currentTick).toBe(100);
    // After the hold, the old feeding is not offered again; a new one is.
    const lapsed = makeState(g, heldUntil + 1, { doomFeedings: res.doomFeedings, rebukedPlaces: res.rebukedPlaces });
    expect(latestAnswerableFeeding(lapsed, 't1')).toBeNull();
    feed(lapsed, 't1', heldUntil + 1);
    expect(rebukablePlaceIds(lapsed)).toEqual(new Set(['t1']));
  });

  it('a crooked doom Rebuke tends without the push, and says so', () => {
    const g = makeWorld('t1');
    const fed = makeState(g, DAY * 5);
    feed(fed, 't1', DAY * 5);
    const res = resolveRebuke(makeState(g, DAY * 5 + 2, { doomFeedings: fed.doomFeedings }),
      { actorId: GOD, targetId: 't1', outcome: 'success_at_cost', actionId: 'r2' })!;
    expect(res.pressure).toBeUndefined();
    expect(Object.keys(res.rebukedPlaces)).toEqual(['t1']);
    expect(res.change.detail).toBe(DOOM_REBUKE_REPLY.crooked.replace('{place}', 'Ashmoor'));
  });

  it('a place both pressed and fed reads as the rival target, and the rival behaviour is unchanged', () => {
    const g = makeWorld('t1');
    const now = DAY * 6;
    const fed = makeState(g, now - 2);
    feed(fed, 't1', now - 2);
    const pressed: RivalState = { ...createRivalState(RIVAL.id), lastPressed: { placeId: 't1', tick: now - 1 } };
    const state = makeState(g, now, { doomFeedings: fed.doomFeedings, rivalStates: [pressed] });
    expect(rebukeAnswerFor(state, 't1')).toEqual({ kind: 'rival', rivalId: RIVAL.id, pressedAt: now - 1 });
    const res = resolveRebuke(state, { actorId: GOD, targetId: 't1', outcome: 'success', actionId: 'r3' })!;
    expect(res.doomFeedings).toBeUndefined();
    expect(res.rivalStates![0].hostilityToPlayer).toBeCloseTo(RIVAL_HOSTILITY_START + RIVAL_REBUKE_TEMPER_RISE, 10);
    expect(getTraces().find(t => t.category === 'rival.rebuked')).toMatchObject({ rivalId: RIVAL.id, targetKind: 'rival' });
  });
});

describe('the last stage raises a daily alert', () => {
  const ready = (g: WorldGraph, tick: number, extra: Partial<GameState> = {}) => {
    const fed = makeState(g, tick - 3);
    feed(fed, 't1', tick - 3);
    return makeState(g, tick, {
      doomFeedings: fed.doomFeedings, unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID],
      essencePool: { mind: 50 } as never, ...extra,
    });
  };

  it('fires only from the last stage, only while Rebuke is held and affordable, at most once a day', () => {
    const g = makeWorld('t1');
    const tick = DAY * 20;
    expect(doomFeedAlert(ready(g, tick), DOOM_FEED_ALERT_FROM_STAGE - 1)).toBeNull();
    expect(doomFeedAlert(ready(g, tick), DOOM_FEED_ALERT_FROM_STAGE)).toEqual({ placeId: 't1', placeName: 'Ashmoor' });
    expect(doomFeedAlert(ready(g, tick, { unlockedActionIds: [] }), DOOM_FEED_ALERT_FROM_STAGE)).toBeNull();
    expect(doomFeedAlert(ready(g, tick, { essencePool: { mind: 0 } as never }), DOOM_FEED_ALERT_FROM_STAGE)).toBeNull();
    const every = DOOM_FEED_ALERT_EVERY_DAYS * DAY;
    expect(doomFeedAlert(ready(g, tick, { doomFeedAlertTick: tick - every + 1 }), DOOM_FEED_ALERT_FROM_STAGE)).toBeNull();
    expect(doomFeedAlert(ready(g, tick, { doomFeedAlertTick: tick - every }), DOOM_FEED_ALERT_FROM_STAGE)).not.toBeNull();
    // A stamp from a past Age (later than now, since a new Age restarts the tick) never blocks.
    expect(doomFeedAlert(ready(g, tick, { doomFeedAlertTick: tick + DAY * 30 }), DOOM_FEED_ALERT_FROM_STAGE)).not.toBeNull();
    // A Rebuke already in flight there answers it: no alert.
    expect(doomFeedAlert(ready(g, tick, {
      unifiedActions: [{ templateId: RIVAL_REBUKE_TEMPLATE_ID, targetId: 't1', resolved: false }] as never,
    }), DOOM_FEED_ALERT_FROM_STAGE)).toBeNull();
  });

  it('phaseDoom raises one non-pausing doom alert naming the place, and records the tick', () => {
    const g = makeWorld('t1');
    const tick = DAY * 20;
    const base = ready(g, tick);
    const stages = Array.from({ length: DOOM_FEED_ALERT_FROM_STAGE }, (_, i) => ({ name: `Stage ${i + 1}`, events: [] }));
    const state = {
      ...base,
      doomDefinition: { archetype: 'breach', stages },
      // Already in the last stage (no escalation this tick), woken, far from expiry.
      doomClock: {
        ...createDoomClockState('breach', 10_000),
        currentTick: 9_000, progress: 0.9, wokeAtTick: 0,
        currentStage: DOOM_FEED_ALERT_FROM_STAGE, stageTransitions: [0, 1, 2, 3, 4],
      },
      effectStates: new Map(),
    } as unknown as GameState;
    const out = phaseDoom(state);
    const alerts = (out.tickEvents ?? []).filter(e => e.type === 'doom_feeding');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toBe(DOOM_FEED_ALERT_LINE.replace('{place}', 'Ashmoor'));
    expect(alerts[0].notification).toEqual({ channel: 'alert', icon: 'doom' });
    expect(alerts[0].refs).toEqual([{ kind: 'location', id: 't1', name: 'Ashmoor' }]);
    expect(out.doomFeedAlertTick).toBe(tick);
    expect(getTraces().find(t => t.category === 'doom.feed_alert')).toMatchObject({ placeId: 't1', stage: DOOM_FEED_ALERT_FROM_STAGE });
    // The next tick, same day: nothing.
    const next = phaseDoom({ ...state, tick: tick + 1, doomFeedAlertTick: tick, tickEvents: [] } as GameState);
    expect((next.tickEvents ?? []).filter(e => e.type === 'doom_feeding')).toHaveLength(0);
  });

  it('the last-stage line is the stand, in words only', () => {
    expect(DOOM_FEED_LAST_STAGE_LINE).toBe('From here a failure can feed the doom. Ground you tend starves it.');
    expect(DOOM_FEED_LAST_STAGE_LINE).not.toMatch(/\d/);
  });
});
