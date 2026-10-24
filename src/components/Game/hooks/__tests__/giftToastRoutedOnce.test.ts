// @vitest-environment jsdom
/**
 * THR-2013 — the "Thing Left Behind" gift toast showed twice on one turn.
 *
 * The settle path raises the card line once. The doubling was in routing:
 * `useNotifications` routed every event in each new `tickEvents` array, and a write
 * between ticks (the next gift resolving) appends to the current array, so the gift's
 * event was routed — and toasted — again under the same id (a React duplicate-key
 * error). These arms pin both halves: one event per gift, one toast per event.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState, TickEvent } from '../../../../types/gameState';
import type { PendingBeat } from '../../../../types/ascendantBeat';
import { resolvePendingBeat } from '../../../../engine/ascendantBeat';
import { routeNotifications, selectUnroutedEvents } from '../../../../engine/notificationRouter';
import { useNotifications } from '../useNotifications';
import { ASCENDANT_MILESTONE_BEATS } from '../../../../data/ascendant-milestone-beats';

const GIFT = 'beat.spine.thing_left_behind';
const NEXT_GIFT = 'beat.rung.2.action.bestow';

function makeState(pending: PendingBeat): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc-1', type: 'actor', name: 'God',
    properties: {
      actorType: 'ascendant',
      domainAffinities: { heart: 4, stone: 3, star: 2 },
      sphereAlignment: { primary: 'life', secondary: 'spirit' },
      milestoneBeatsFired: ASCENDANT_MILESTONE_BEATS.map(b => b.beatId),
    },
  });
  return {
    graph,
    ascendantId: 'asc-1',
    tick: 80,
    ascendantBeats: { spineCursor: 1, pending, history: [], lastBeatTurn: 0 },
    unlockedActionIds: [],
    essenceEarnedBySphere: {},
    chronicleEntries: [],
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

function pendingOf(beatId: string, kind: PendingBeat['kind']): PendingBeat {
  return { beatId, kind, offeredTurn: 80, boundNodeIds: ['asc-1'], trigger: { kind: 'turn', minTurn: 80 } } as PendingBeat;
}

const cardEvents = (events: readonly TickEvent[]) => events.filter(e => e.id.startsWith('beat_cards_'));

/** The Thing Left Behind resolves, then a second gift resolves before the next tick. */
function giftThenSecondGift() {
  const first = resolvePendingBeat(makeState(pendingOf(GIFT, 'spine')));
  const between = {
    ...first.state,
    ascendantBeats: { ...first.state.ascendantBeats!, pending: pendingOf(NEXT_GIFT, 'rung_gift') },
  };
  const second = resolvePendingBeat(between);
  return { first: first.state, second: second.state };
}

describe('THR-2013 — one gift, one card event, one toast', () => {
  it('receiving the Thing Left Behind raises exactly one beat_cards event', () => {
    const { first, second } = giftThenSecondGift();
    expect(cardEvents(first.tickEvents)).toHaveLength(1);
    expect(cardEvents(first.tickEvents)[0].id).toBe(`beat_cards_${GIFT}_80`);
    // The second gift adds its own line; the first is carried, not raised again.
    const ids = cardEvents(second.tickEvents).map(e => e.id);
    expect(ids.filter(id => id === `beat_cards_${GIFT}_80`)).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a between-tick append re-routes nothing already routed', () => {
    const { first, second } = giftThenSecondGift();
    const unrouted = selectUnroutedEvents(first.tickEvents, second.tickEvents);
    expect(unrouted.some(e => e.id === `beat_cards_${GIFT}_80`)).toBe(false);
    expect(cardEvents(unrouted)).toHaveLength(1);

    const empty = { toasts: [], alerts: [], popupQueue: [], entityNotices: [] };
    const afterFirst = routeNotifications(first.tickEvents, empty, 0);
    const afterSecond = routeNotifications(unrouted, afterFirst, 0);
    const toastIds = afterSecond.toasts.map(t => t.id);
    expect(new Set(toastIds).size).toBe(toastIds.length);
    expect(toastIds.filter(id => id === `beat_cards_${GIFT}_80`)).toHaveLength(1);
  });

  it('a fresh tick routes its events even when an id repeats', () => {
    const event: TickEvent = { id: 'repeat', tick: 1, type: 'narrative', message: 'm' } as TickEvent;
    const nextTick: TickEvent = { ...event, tick: 2 };
    expect(selectUnroutedEvents([event], [nextTick])).toEqual([nextTick]);
    expect(selectUnroutedEvents([], [event])).toEqual([event]);
  });

  it('the hook toasts the gift once across the between-tick re-render', () => {
    const { first, second } = giftThenSecondGift();
    const { result, rerender } = renderHook(
      ({ tickEvents }) => useNotifications({ tickEvents, running: false, visibilityMap: new Map() }),
      { initialProps: { tickEvents: first.tickEvents } },
    );
    rerender({ tickEvents: second.tickEvents });
    const toastIds = result.current.notificationState.toasts.map(t => t.id);
    expect(toastIds.filter(id => id === `beat_cards_${GIFT}_80`)).toHaveLength(1);
    expect(new Set(toastIds).size).toBe(toastIds.length);
  });
});
