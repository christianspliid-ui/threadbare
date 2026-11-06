/**
 * THR-2185 — a rival's move has a place and an answer (slice 1 of THR-2172).
 *
 * Plan: Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md § Done when.
 * The probe toast fires only when the rival's hand lands, names the place, says whether
 * the god's tending held, and opens the place; the seeded stream is unchanged (the old
 * flavour draw is kept and discarded); temper starts at "hostile", rises with a cause
 * and cools on a quiet day; the Chronicle and the drop badge name the rival, never its id.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { GameState, TickEvent } from '../../types/gameState';
import type { RivalDefinition, RivalState } from '../../types/rival';
import type { SphereAffinity } from '../../types/sphereAffinity';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { landRivalProbe, rivalProbeMove, rivalLandingLine } from '../orchestrator';
import { createRivalState, coolRivalHostility } from '../rival';
import { deriveNavigationTarget } from '../notificationRouter';
import { diffDominionDrops } from '../dominionProjection';
import { rivalNameLookup } from '../phaseDominion';
import {
  RIVAL_HOSTILITY_START,
  RIVAL_HOSTILITY_COOL_PER_DAY,
  RIVAL_HOSTILITY_CAUSE_STALE_DAYS,
} from '../../data/rival-scheme-config';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { hostilityLabel } from '../../data/uiColorPalette';
import {
  rivalCauseSegments,
  rivalLastPressedSegments,
  rivalWhenWords,
  segmentsText,
} from '../views/rivalEntry';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';

const GOD = 'asc.test';
const DAY = TICKS_PER_DAY;
const OWN_GROUND = { mind: 3, spirit: 2 };

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

/** A god with `towns` places of its own ground (Touched or better); the first may be its seat. */
function makeWorld(towns: number, opts: { seatFirst?: boolean } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: GOD, type: 'actor', name: 'The Shepherd',
    properties: {
      actorType: 'ascendant',
      spherePoints: { mind: 3, spirit: 2 },
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      sphereAffinity: bag({ mind: 2, spirit: 1 }),
      dominionPowerBaseline: 3,
      ...(opts.seatFirst ? { homeSeatLocationId: 't0' } : {}),
    },
  });
  for (let i = 0; i < towns; i++) {
    g.addNode({
      id: `t${i}`, type: 'location', name: `Town ${i}`,
      properties: { locationSubtype: 'town', hexCol: i, hexRow: 3, sphereAffinity: bag(OWN_GROUND) },
    });
  }
  return g;
}

function makeState(g: WorldGraph, tick: number): GameState {
  return {
    graph: g, ascendantId: GOD, tick, tickEvents: [], controlEffects: [],
    rivalDefinitions: [{ id: 'actor_rival_1', name: 'The Hollow Warden' }],
  } as unknown as GameState;
}

const RIVAL = { id: 'actor_rival_1', name: 'The Hollow Warden', primarySphere: 'death' as SphereName, behavior: 'aggressive' } as unknown as RivalDefinition;

/** An rng that counts its draws and hands out a fixed value. */
function countingRng(value = 0) {
  const rng = () => { rng.draws++; return value; };
  rng.draws = 0;
  return rng;
}

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('the probe toast fires only when the hand lands (E1, E2)', () => {
  it('no turf → no toast, no lastPressed', () => {
    const g = makeWorld(0);
    const events: TickEvent[] = [];
    const rs = createRivalState(RIVAL.id);
    const out = rivalProbeMove(makeState(g, DAY), RIVAL, rs, countingRng(), events, []);
    expect(events.filter(e => e.type === 'rival_action')).toHaveLength(0);
    expect(out.lastPressed).toBeUndefined();
  });

  it('throttled (today\'s landing spent) → landRivalProbe returns null and no toast', () => {
    const g = makeWorld(10);
    const state = makeState(g, DAY * 2);
    expect(landRivalProbe(state, RIVAL, () => 0, [])).not.toBeNull();
    const events: TickEvent[] = [];
    rivalProbeMove(state, RIVAL, createRivalState(RIVAL.id), () => 0, events, []);
    expect(events).toHaveLength(0);
  });

  it('a landing on an untended place → one toast naming place and sphere, with a location ref', () => {
    const g = makeWorld(10);
    const events: TickEvent[] = [];
    const pressures: unknown[] = [];
    const out = rivalProbeMove(makeState(g, DAY * 3), RIVAL, createRivalState(RIVAL.id), () => 0, events, pressures as never);
    expect(pressures).toHaveLength(1);
    expect(events).toHaveLength(1);
    const toast = events[0];
    expect(toast.type).toBe('rival_action');
    expect(toast.refs).toEqual([{ kind: 'location', id: 't0' }]);
    expect(toast.message).toBe('The Hollow Warden pressed Death on Town 0. Tend it and the next blow breaks.');
    expect(out.lastPressed).toEqual({ placeId: 't0', tick: DAY * 3 });
  });

  it('a landing on a tended place names the tender word', () => {
    const g = makeWorld(10, { seatFirst: true });
    // Draw the tended seat: untended weigh DOMINION_RAID_UNTENDED_WEIGHT each, so the
    // last slice of the roll is the tended one.
    const events: TickEvent[] = [];
    rivalProbeMove(makeState(g, DAY * 4), RIVAL, createRivalState(RIVAL.id), () => 0.9999, events, []);
    expect(events).toHaveLength(1);
    expect(events[0].refs).toEqual([{ kind: 'location', id: 't0' }]);
    expect(events[0].message).toBe('The Hollow Warden pressed on Town 0, but your seat held it.');
  });

  it('the held-toast words cover every tender', () => {
    const base = { placeId: 'p', placeName: 'Ashford', sphere: 'death' as SphereName };
    expect(rivalLandingLine('R', { ...base, tendedBy: ['carry'] })).toBe('R pressed on Ashford, but your thread held it.');
    expect(rivalLandingLine('R', { ...base, tendedBy: ['anointed'] })).toBe('R pressed on Ashford, but your anointed faction held it.');
    expect(rivalLandingLine('R', { ...base, tendedBy: ['claim'] })).toBe('R pressed on Ashford, but your claim held it.');
    expect(rivalLandingLine('R', { ...base, placeName: '', tendedBy: null })).toBe('R pressed Death on a place of yours. Tend it and the next blow breaks.');
  });
});

describe('the seeded stream is unchanged (NFP 3)', () => {
  // On main the probe drew: the action pick, the flavour line, then the landing's turf pick.
  it('a landing consumes exactly three draws, as before', () => {
    const rng = countingRng(0);
    rivalProbeMove(makeState(makeWorld(10), DAY * 5), RIVAL, createRivalState(RIVAL.id), rng, [], []);
    expect(rng.draws).toBe(3);
  });

  it('a probe that lands nothing consumes exactly two, as before', () => {
    const rng = countingRng(0);
    rivalProbeMove(makeState(makeWorld(0), DAY * 5), RIVAL, createRivalState(RIVAL.id), rng, [], []);
    expect(rng.draws).toBe(2);
  });
});

describe('temper (E3)', () => {
  it('a new rival starts at 0.3, which reads "hostile"', () => {
    const rs = createRivalState('x');
    expect(rs.hostilityToPlayer).toBe(0.3);
    expect(RIVAL_HOSTILITY_START).toBe(0.3);
    expect(hostilityLabel(rs.hostilityToPlayer)).toBe('hostile');
  });

  it('cools by 0.02 on a quiet day and never below the start', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityToPlayer: 0.5, hostilityCause: { kind: 'scheme', tick: 0 } };
    const cooled = coolRivalHostility(rs, DAY * 2);
    expect(cooled.hostilityToPlayer).toBeCloseTo(0.5 - RIVAL_HOSTILITY_COOL_PER_DAY);
    let s = cooled;
    for (let d = 3; d < 40; d++) s = coolRivalHostility(s, DAY * d);
    expect(s.hostilityToPlayer).toBe(RIVAL_HOSTILITY_START);
  });

  it('does not cool on a day with a rise', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityToPlayer: 0.5, hostilityCause: { kind: 'countered', tick: DAY * 2 - 1 } };
    expect(coolRivalHostility(rs, DAY * 2)).toBe(rs);
  });

  it('never raises an old save sitting below the floor', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityToPlayer: 0.1 };
    expect(coolRivalHostility(rs, DAY * 2)).toBe(rs);
  });
});

describe('the rival entry\'s lines (decision 5)', () => {
  const names = (id: string) => ({ ash: 'Ashford', iron: 'Iron Glade' } as Record<string, string>)[id];
  const tick = DAY * 10;

  it('no cause yet → "as rival gods are"', () => {
    expect(segmentsText(rivalCauseSegments(createRivalState('x'), tick, names))).toBe(', as rival gods are.');
  });

  it('a scheme cause names its place as a link', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityCause: { kind: 'scheme', placeId: 'ash', tick: tick - 1 } };
    const segs = rivalCauseSegments(rs, tick, names);
    expect(segmentsText(segs)).toBe('. Its scheme against Ashford is under way.');
    expect(segs).toContainEqual({ placeId: 'ash', name: 'Ashford' });
  });

  it('a counter cause says you broke it', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityCause: { kind: 'countered', placeId: 'iron', tick } };
    expect(segmentsText(rivalCauseSegments(rs, tick, names))).toBe('. You broke its scheme against Iron Glade.');
  });

  it('a place that no longer resolves drops the place clause', () => {
    const rs: RivalState = { ...createRivalState('x'), hostilityCause: { kind: 'scheme', placeId: 'gone', tick } };
    expect(segmentsText(rivalCauseSegments(rs, tick, names))).toBe('. Its scheme is under way.');
  });

  it('a stale cause reads "and cooling" while above the floor, and "as rival gods are" once back at it', () => {
    const stale = { kind: 'scheme' as const, placeId: 'ash', tick: tick - RIVAL_HOSTILITY_CAUSE_STALE_DAYS * DAY };
    const warm: RivalState = { ...createRivalState('x'), hostilityToPlayer: 0.6, hostilityCause: stale };
    expect(segmentsText(rivalCauseSegments(warm, tick, names))).toBe(', and cooling.');
    const cooled: RivalState = { ...createRivalState('x'), hostilityToPlayer: RIVAL_HOSTILITY_START, hostilityCause: stale };
    expect(segmentsText(rivalCauseSegments(cooled, tick, names))).toBe(', as rival gods are.');
  });

  it('last pressed reads in words, and hides when the place is gone', () => {
    const rs: RivalState = { ...createRivalState('x'), lastPressed: { placeId: 'iron', tick: tick - 2 * DAY } };
    expect(segmentsText(rivalLastPressedSegments(rs, tick, names)!)).toBe('Last pressed Iron Glade, two days ago.');
    expect(rivalLastPressedSegments({ ...rs, lastPressed: { placeId: 'gone', tick } }, tick, names)).toBeNull();
    expect(rivalLastPressedSegments(createRivalState('x'), tick, names)).toBeNull();
    expect(rivalWhenWords(0)).toBe('today');
    expect(rivalWhenWords(DAY)).toBe('yesterday');
  });
});

describe('toast routing (U1)', () => {
  it('a rival_action with a location ref opens that place', () => {
    expect(deriveNavigationTarget({
      id: 'e', tick: 1, type: 'rival_action', message: 'm', significance: 0.7, refs: [{ kind: 'location', id: 't3' }],
    } as TickEvent)).toEqual({ kind: 'location', locationNodeId: 't3' });
  });

  it('a rival_action without a ref still routes nowhere', () => {
    expect(deriveNavigationTarget({ id: 'e', tick: 1, type: 'rival_action', message: 'm', significance: 0.7 } as TickEvent)).toBeUndefined();
  });
});

describe('rival names (E4)', () => {
  it('rivalNameLookup reads rivalDefinitions, not the graph', () => {
    const lookup = rivalNameLookup(makeState(makeWorld(0), 1));
    expect(lookup('actor_rival_1')).toBe('The Hollow Warden');
    expect(lookup('actor_rival_9')).toBeUndefined();
  });

  it('the hex drop line names the rival from its definition', () => {
    const g = makeWorld(1);
    const badges = diffDominionDrops(
      g,
      { t0: 'held' },
      { bands: { t0: 'touched' }, dayDrops: [{ placeId: 't0', from: 'held', to: 'touched', cause: 'rival', rivalId: 'actor_rival_1' }], lastDayDrops: [] },
      5,
      [],
      (id) => (id === 'actor_rival_1' ? 'The Hollow Warden' : undefined),
    );
    expect(badges).toHaveLength(1);
    expect(badges[0].line).toContain('The Hollow Warden');
    expect(badges[0].line).not.toContain('actor_rival_');
    expect(badges[0].line).not.toContain('No one tends it');
  });
});

describe('the pure cooling helper', () => {
  it('emits no trace itself (the orchestrator traces the change)', () => {
    coolRivalHostility({ ...createRivalState('x'), hostilityToPlayer: 0.6 }, DAY * 2);
    expect(getTraces().filter(t => t.category === 'rival.hostility_changed')).toHaveLength(0);
  });
});
