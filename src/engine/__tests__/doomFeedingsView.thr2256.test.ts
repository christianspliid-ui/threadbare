/**
 * THR-2256 — the Doom panel shows where it feeds (slice 2 of
 * Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md): the pure view model behind
 * the panel's Where it feeds list, the Doom bar's hover line, the place page's doom lead,
 * and the doom alert's route to the place.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { DoomFeeding, GameState, TickEvent } from '../../types/gameState';
import type { RivalDefinition, RivalState } from '../../types/rival';
import type { SphereAffinity } from '../../types/sphereAffinity';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { createRivalState } from '../rival';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { DOOM_FEED_LIST_MAX, DOOM_FEED_OFTEN_COUNT, DOOM_REBUKE_WINDOW_DAYS } from '../../data/game-config';
import { RIVAL_REBUKE_TEMPLATE_ID } from '../../data/rival-rebuke-content';
import { DOOM_FEED_WORDS, doomFedLead, doomFeedHoverLine, selectDoomFeedings } from '../views/doomFeedings';
import { deriveNavigationTarget } from '../notificationRouter';
import { PLACE_ROW_RESOLVERS } from '../views/subjects/placeRows';

const GOD = 'asc.test';
const DAY = TICKS_PER_DAY;
const WINDOW = DOOM_REBUKE_WINDOW_DAYS * DAY;
const NOW = 10 * DAY;

function bag(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const a = createDefaultSphereAffinity();
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

const NAMES = ['Riverford', 'Ashmoor', 'Dunhallow', 'Kelmarsh', 'Thornby'];

/** t0 is the god's seat (tended); t1..t4 are untended. */
function makeWorld(): WorldGraph {
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
  NAMES.forEach((name, i) => g.addNode({
    id: `t${i}`, type: 'location', name,
    properties: { locationSubtype: 'town', hexCol: i * 4, hexRow: 3, sphereAffinity: bag({ mind: 3, spirit: 2 }) },
  }));
  g.addNode({ id: 'agent.mira', type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
  return g;
}

const RIVAL = { id: 'actor_rival_1', name: 'The Hollow Warden', primarySphere: 'death' as SphereName } as unknown as RivalDefinition;

function makeState(feedings: Record<string, DoomFeeding>, extra: Partial<GameState> = {}): GameState {
  return {
    graph: makeWorld(), ascendantId: GOD, tick: NOW, tickEvents: [], controlEffects: [],
    rivalDefinitions: [RIVAL], rivalStates: [],
    unlockedActionIds: [RIVAL_REBUKE_TEMPLATE_ID],
    doomFeedings: feedings,
    ...extra,
  } as unknown as GameState;
}

const fed = (ticks: number[], actor = 'agent.mira', heldUntil?: number): DoomFeeding => ({
  lastTick: Math.max(...ticks), lastActorId: actor, recentTicks: ticks, ...(heldUntil !== undefined ? { heldUntil } : {}),
});

describe('THR-2256 — selectDoomFeedings (the Where it feeds list)', () => {
  it('lists fed places newest first, at most DOOM_FEED_LIST_MAX, with "once" / "often"', () => {
    const often = Array.from({ length: DOOM_FEED_OFTEN_COUNT }, (_, i) => NOW - 20 + i);
    const view = selectDoomFeedings(makeState({
      t1: fed([NOW - 5]),
      t2: fed(often),
      t3: fed([NOW - 30]),
      t4: fed([NOW - 33]),
    }));
    expect(view.rows).toHaveLength(DOOM_FEED_LIST_MAX);
    expect(view.total).toBe(4);
    expect(view.rows.map(r => r.placeName)).toEqual(['Ashmoor', 'Dunhallow', 'Kelmarsh']);
    expect(view.rows[0].word).toBe(DOOM_FEED_WORDS.once);
    expect(view.rows[1].word).toBe(DOOM_FEED_WORDS.often);
    expect(view.rows.every(r => r.rebukable)).toBe(true);
  });

  it('a tended place reads "held", and offers no Rebuke', () => {
    const view = selectDoomFeedings(makeState({ t1: fed([NOW - 5]) }, { rebukedPlaces: { t1: NOW + 4 * DAY } }));
    expect(view.rows[0]).toMatchObject({ placeId: 't1', status: 'held', word: DOOM_FEED_WORDS.held, rebukable: false });
  });

  it('a hold that ended inside the window reads "no longer held"; once past the window the row leaves', () => {
    const heldUntil = NOW - DAY;
    const view = selectDoomFeedings(makeState({ t1: fed([NOW - 3 * DAY], 'agent.mira', heldUntil) }));
    expect(view.rows[0]).toMatchObject({ status: 'no_longer_held', word: DOOM_FEED_WORDS.noLongerHeld, rebukable: false });
    const later = selectDoomFeedings(makeState({ t1: fed([NOW - WINDOW - 2 * DAY], 'agent.mira', NOW - WINDOW - DAY) }));
    expect(later.rows).toHaveLength(0);
  });

  it('a feeding older than the window is not listed (one window: the record, the offer, the panel)', () => {
    const view = selectDoomFeedings(makeState({ t1: fed([NOW - WINDOW - 1]) }));
    expect(view.rows).toHaveLength(0);
  });

  it('without the Rebuke card the rows still list, with no Rebuke (UI Law 25)', () => {
    const view = selectDoomFeedings(makeState({ t1: fed([NOW - 5]) }, { unlockedActionIds: [] }));
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0].rebukable).toBe(false);
    expect(view.holdsRebuke).toBe(false);
  });

  it('is empty and fail-soft on an old save (no record) and on a missing graph', () => {
    expect(selectDoomFeedings(makeState({}, { doomFeedings: undefined })).rows).toEqual([]);
    expect(selectDoomFeedings({ tick: NOW, doomFeedings: { t1: fed([NOW - 5]) } }).rows).toEqual([]);
  });
});

describe('THR-2256 — the Doom bar hover line', () => {
  it('names the newest fed place and counts the others in words', () => {
    expect(doomFeedHoverLine(selectDoomFeedings(makeState({ t1: fed([NOW - 5]) }))))
      .toBe('It feeds on failures at Ashmoor.');
    expect(doomFeedHoverLine(selectDoomFeedings(makeState({ t1: fed([NOW - 5]), t2: fed([NOW - 9]), t3: fed([NOW - 12]) }))))
      .toBe('It feeds on failures at Ashmoor and two other places.');
    expect(doomFeedHoverLine(selectDoomFeedings(makeState({ t1: fed([NOW - 5]), t2: fed([NOW - 9]) }))))
      .toBe('It feeds on failures at Ashmoor and one other place.');
  });

  it('is null when the Doom is feeding nowhere (held places do not count)', () => {
    expect(doomFeedHoverLine(selectDoomFeedings(makeState({})))).toBeNull();
    expect(doomFeedHoverLine(selectDoomFeedings(makeState({ t1: fed([NOW - 5]) }, { rebukedPlaces: { t1: NOW + DAY } })))).toBeNull();
  });
});

describe('THR-2256 — the place page doom lead', () => {
  it('reads the Rebuke answer while the card is held, the tending answer otherwise', () => {
    expect(doomFedLead(makeState({ t1: fed([NOW - 5]) }), 't1')).toEqual({
      headline: 'The doom fed here when Mira failed.',
      answer: 'Rebuke it here, or tend it.',
    });
    expect(doomFedLead(makeState({ t1: fed([NOW - 5]) }, { unlockedActionIds: [] }), 't1')).toEqual({
      headline: 'The doom fed here when Mira failed.',
      answer: 'Ground you tend here starves it.',
    });
  });

  it('is absent on tended ground, past the window, and where a rival\'s landing is the Rebuke target', () => {
    expect(doomFedLead(makeState({ t1: fed([NOW - 5]) }, { rebukedPlaces: { t1: NOW + DAY } }), 't1')).toBeNull();
    expect(doomFedLead(makeState({ t1: fed([NOW - WINDOW - 1]) }), 't1')).toBeNull();
    const pressed: RivalState = { ...createRivalState(RIVAL.id), lastPressed: { placeId: 't1', tick: NOW - 1 } };
    expect(doomFedLead(makeState({ t1: fed([NOW - 5]) }, { rivalStates: [pressed] }), 't1')).toBeNull();
  });

  it('the place row resolver leads the page with the headline', () => {
    const state = makeState({ t1: fed([NOW - 5]) });
    const node = state.graph.getNode('t1')!;
    const section = PLACE_ROW_RESOLVERS.doom_fed({ state, graph: state.graph, nodeId: node.id } as never);
    expect(section).not.toBeNull();
    expect(JSON.stringify(section)).toContain('The doom fed here when Mira failed.');
    expect(JSON.stringify(section)).toContain('Rebuke it here, or tend it.');
  });
});

describe('THR-2256 — the doom alert opens the place', () => {
  it('routes a doom_feeding event to its location ref', () => {
    const ev = { id: 'e', tick: NOW, type: 'doom_feeding', message: 'The doom fed at Ashmoor. Rebuke it there.', refs: [{ kind: 'location', id: 't1', name: 'Riverford' }] } as unknown as TickEvent;
    expect(deriveNavigationTarget(ev)).toEqual({ kind: 'location', locationNodeId: 't1' });
  });
});
