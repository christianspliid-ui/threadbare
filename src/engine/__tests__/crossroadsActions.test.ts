/**
 * THR-1926 — placing and lifting a Crossroads lean.
 *
 * `placeCrossroadsLean` refuses (writing and spending nothing) for each of: unthreaded,
 * unreadable, no reading, stale option, already held, away on a non-leader,
 * unaffordable. On success it writes the lean and does NOT spend — the spend is the
 * caller's (THR-1783). `liftCrossroadsLean` clears it with no refund.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const readable = vi.hoisted(() => ({ value: true }));
vi.mock('../intentionReading', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, canReadIntention: () => ({ readable: readable.value, secret: false }) };
});

import { WorldGraph } from '../graph';
import { placeCrossroadsLean, liftCrossroadsLean } from '../crossroadsActions';
import type { GameState } from '../../types/gameState';
import type { CrossroadsSnapshot } from '../crossroads';
import { CROSSROADS_LEAN_COST_BASE, CROSSROADS_LEAN_COST_PER_RANK } from '../../data/premonition-constants';
import { CROSSROADS_ANSWER, CROSSROADS_ANSWER_DEFAULT, LEAN_FORECAST, OUTCOME_TOAST, SETTLEDNESS_LINE } from '../../data/crossroads-content';

const GOD = 'god';
const KAEL = 'ind_kael';

const SNAPSHOT: CrossroadsSnapshot = {
  tick: 9,
  options: [
    { family: 'encounter', templateId: 'duel', targetId: 'greyford', score: 1, reach: 'iron' },
    { family: 'encounter', templateId: 'feast', targetId: 'greyford', score: 0.9, reach: 'gold' },
    { family: 'strategic_action', templateId: 'survey', targetId: 'ruin_1', score: 0.5, reach: 'eye' },
  ],
};

function makeState(opts: { threaded?: boolean; snapshot?: CrossroadsSnapshot | null; pool?: number } = {}): GameState {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  g.addNode({
    id: KAEL, type: 'actor', name: 'Kael',
    properties: { actorType: 'individual', ...(opts.snapshot === null ? {} : { crossroads: opts.snapshot ?? SNAPSHOT }) },
  });
  if (opts.threaded !== false) {
    g.addEdge({ id: 'thr', source: GOD, target: KAEL, type: 'thread', properties: { bondReception: 'devotion' } });
  }
  const pool = opts.pool ?? 10;
  return {
    tick: 10,
    graph: g,
    ascendantId: GOD,
    essencePool: { force: pool, life: pool, energy: pool, matter: pool, mind: pool, spirit: pool, time: pool, entropy: pool },
  } as unknown as GameState;
}

beforeEach(() => { readable.value = true; });

describe('placeCrossroadsLean refuses, writing and spending nothing (THR-1926)', () => {
  const road = SNAPSHOT.options[1];
  it.each([
    ['unthreaded', () => makeState({ threaded: false })],
    ['no_reading', () => makeState({ snapshot: null })],
    ['unaffordable', () => makeState({ pool: 0 })],
  ] as const)('%s', (reason, build) => {
    const state = build();
    const before = { ...state.essencePool };
    const r = placeCrossroadsLean(state, KAEL, road, 'toward');
    expect(r.success).toBe(false);
    expect(r.reason).toBe(reason);
    expect(state.graph.getNode(KAEL)?.properties.crossroadsLean).toBeUndefined();
    expect(state.essencePool).toEqual(before);
  });

  it('unreadable', () => {
    readable.value = false;
    const r = placeCrossroadsLean(makeState(), KAEL, road, 'toward');
    expect(r.reason).toBe('unreadable');
  });

  it('stale option (a road no longer in the reading)', () => {
    const r = placeCrossroadsLean(makeState(), KAEL, { family: 'encounter', templateId: 'feast', targetId: 'ashby' }, 'toward');
    expect(r.reason).toBe('stale_option');
  });

  it('held (one lean at a time)', () => {
    const state = makeState();
    expect(placeCrossroadsLean(state, KAEL, road, 'toward').success).toBe(true);
    const again = placeCrossroadsLean(state, KAEL, SNAPSHOT.options[0], 'toward');
    expect(again.reason).toBe('held');
  });

  it('away on a non-leader', () => {
    expect(placeCrossroadsLean(makeState(), KAEL, road, 'away').reason).toBe('away_not_leader');
  });

  it('THR-2189: away on a work (the leader is an undertaking) → away_on_a_work, in plain words', () => {
    const workFirst: CrossroadsSnapshot = { tick: 9, options: [SNAPSHOT.options[2], SNAPSHOT.options[0]] };
    const state = makeState({ snapshot: workFirst });
    const before = { ...state.essencePool };
    const r = placeCrossroadsLean(state, KAEL, workFirst.options[0], 'away');
    expect(r.reason).toBe('away_on_a_work');
    expect(r.message).toBe('Kael is not choosing that work; it runs on its own.');
    expect(state.graph.getNode(KAEL)?.properties.crossroadsLean).toBeUndefined();
    expect(state.essencePool).toEqual(before);
    // toward on the same work is still offered
    expect(placeCrossroadsLean(state, KAEL, workFirst.options[0], 'toward').success).toBe(true);
  });
});

describe('placeCrossroadsLean succeeds (THR-1926)', () => {
  it('writes the lean, prices it by rank in the road sphere, and does not spend', () => {
    const state = makeState();
    const before = { ...state.essencePool };
    const r = placeCrossroadsLean(state, KAEL, SNAPSHOT.options[1], 'toward');
    expect(r.success).toBe(true);
    expect(r.sphere).toBe('life'); // gold → life
    expect(r.essenceCost).toBe(CROSSROADS_LEAN_COST_BASE + CROSSROADS_LEAN_COST_PER_RANK); // par (Dominion prices off)
    expect(r.forecast).toBe('likely'); // 0.9 × 2 vs 1
    expect(r.lean).toMatchObject({ templateId: 'feast', targetId: 'greyford', direction: 'toward', tick: 10, rankWhenPlaced: 1, forecastAtPlacement: 'likely' });
    expect(state.graph.getNode(KAEL)?.properties.crossroadsLean).toEqual(r.lean);
    expect(state.essencePool).toEqual(before);
    expect(r.message).toMatch(/^Your hand rests on Kael, toward .+\. It waits until Kael next faces that road\.$/);
    expect(r.message).not.toMatch(/feast/); // a name, never the template id
  });

  it('THR-2189: an away lean on the leader forecasts likely and says it waits for the reach', () => {
    const r = placeCrossroadsLean(makeState(), KAEL, SNAPSHOT.options[0], 'away');
    expect(r.success).toBe(true);
    expect(r.forecast).toBe('likely');
    expect(r.message).toMatch(/^Your hand rests on Kael, away from .+. It waits until Kael reaches for that road again.$/);
    expect(LEAN_FORECAST.away.likely).toBe('If {name} reaches for it again, your hand will likely turn them from it.');
  });

  it('liftCrossroadsLean clears it with no refund', () => {
    const state = makeState();
    placeCrossroadsLean(state, KAEL, SNAPSHOT.options[0], 'away');
    const lift = liftCrossroadsLean(state, KAEL);
    expect(lift.success).toBe(true);
    expect(lift.message).toBe('You lift your hand from Kael.');
    expect(state.graph.getNode(KAEL)?.properties.crossroadsLean).toBeUndefined();
    expect(liftCrossroadsLean(state, KAEL).success).toBe(false);
  });
});

describe('crossroads content (THR-1926)', () => {
  const lines: string[] = [
    ...Object.values(SETTLEDNESS_LINE),
    ...Object.values(LEAN_FORECAST).flatMap(v => Object.values(v)),
    ...Object.values(CROSSROADS_ANSWER).flatMap(v => Object.values(v)),
    ...Object.values(CROSSROADS_ANSWER_DEFAULT),
    OUTCOME_TOAST.followed.toward, OUTCOME_TOAST.followed.away, OUTCOME_TOAST.resisted.toward,
    OUTCOME_TOAST.resisted.away, OUTCOME_TOAST.resisted_idle, OUTCOME_TOAST.lapsed_expired.toward, OUTCOME_TOAST.lapsed_expired.away, OUTCOME_TOAST.lapsed_unavailable,
  ];
  it('names the mortal by {name} and never guesses a gendered pronoun', () => {
    for (const line of lines) {
      expect(line).not.toMatch(/\b(he|she|him|her|his|hers|himself|herself)\b/i);
    }
  });
  it('covers all five bond receptions, both outcomes', () => {
    expect(Object.keys(CROSSROADS_ANSWER).sort()).toEqual(['awe', 'bargain', 'defiance', 'devotion', 'doubt']);
  });
});
