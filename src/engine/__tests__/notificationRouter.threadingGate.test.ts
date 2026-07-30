/**
 * THR-666/THR-667 — the threading gate as the router sees it.
 *
 * Sibling of `notificationThreadingGate.test.ts`, which tests the decision in
 * isolation. This file asserts what the decision *does* to notification state:
 * an unthreaded agent produces nothing, a threaded entity produces a row notice
 * instead of a toast, and world events are untouched.
 */

import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { NotificationState } from '../../types/notification';
import { routeNotifications } from '../notificationRouter';
import {
  ROUTE_GLOBAL, ROUTE_SUPPRESS,
  type ThreadingGate, type NotificationRouting,
} from '../notificationThreadingGate';

const EMPTY_STATE: NotificationState = { toasts: [], alerts: [], popupQueue: [], entityNotices: [] };
const NOW = 1_000_000;

/**
 * Gate driven by a fixed actor→routing table, so no graph is needed.
 *
 * A bare `'entity'` in the table is expanded to an agent anchor on that actor —
 * the THR-666 shape — so the pre-existing cases below still read as they did.
 */
function gateFor(table: Record<string, NotificationRouting | 'entity'>): ThreadingGate {
  return {
    resolveEventRouting: (event) => {
      if (!event.actorId) return ROUTE_GLOBAL;
      const entry = table[event.actorId];
      if (entry === undefined) return ROUTE_GLOBAL;
      if (entry === 'entity') {
        return { kind: 'entity', anchorId: event.actorId, anchorKind: 'agent' };
      }
      return entry;
    },
  };
}

function event(overrides: Partial<TickEvent> = {}): TickEvent {
  return {
    id: 'evt_1',
    tick: 12,
    type: 'personality_trait_emerged',
    message: 'Ziven has become Guiding',
    significance: 0.4,
    notification: { channel: 'toast' },
    ...overrides,
  } as TickEvent;
}

describe('routeNotifications — threading gate', () => {
  it('drops an unthreaded agent\'s toast entirely', () => {
    const result = routeNotifications(
      [event({ id: 'e1', actorId: 'stranger' })],
      EMPTY_STATE, NOW, undefined,
      gateFor({ stranger: ROUTE_SUPPRESS }),
    );
    expect(result.toasts).toHaveLength(0);
    expect(result.entityNotices).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
  });

  it('diverts a threaded agent\'s toast to their row', () => {
    const result = routeNotifications(
      [event({ id: 'e1', actorId: 'kael' })],
      EMPTY_STATE, NOW, undefined,
      gateFor({ kael: 'entity' }),
    );
    expect(result.toasts).toHaveLength(0);
    expect(result.entityNotices).toHaveLength(1);
    expect(result.entityNotices?.[0]).toMatchObject({
      id: 'e1',
      anchorId: 'kael',
      anchorKind: 'agent',
      message: 'Ziven has become Guiding',
      tick: 12,
      category: 'lifecycle',
    });
  });

  it('diverts a faction-anchored toast to the faction\'s row, not the member\'s (THR-667)', () => {
    // The gate names the anchor; the router must use it verbatim rather than
    // falling back to event.actorId, which is the member who got promoted.
    const result = routeNotifications(
      [event({
        id: 'e1',
        type: 'faction_rank_changed',
        message: 'Kael has been promoted to Journeyman in the Iron Guard.',
        actorId: 'kael',
        factionId: 'faction_iron_guard',
      })],
      EMPTY_STATE, NOW, undefined,
      gateFor({
        kael: { kind: 'entity', anchorId: 'faction_iron_guard', anchorKind: 'faction' },
      }),
    );
    expect(result.toasts).toHaveLength(0);
    expect(result.entityNotices).toHaveLength(1);
    expect(result.entityNotices?.[0]).toMatchObject({
      id: 'e1',
      anchorId: 'faction_iron_guard',
      anchorKind: 'faction',
      category: 'social',
    });
    // And the click still resolves to the faction sheet.
    expect(result.entityNotices?.[0].navigationTarget)
      .toEqual({ kind: 'faction', factionId: 'faction_iron_guard' });
  });

  it('leaves an actorless world event toasting globally', () => {
    const result = routeNotifications(
      [event({ id: 'e1', actorId: undefined, type: 'doom_escalation', message: 'The doom deepens' })],
      EMPTY_STATE, NOW, undefined,
      gateFor({}),
    );
    expect(result.toasts).toHaveLength(1);
    expect(result.entityNotices).toHaveLength(0);
  });

  it('lets a threaded agent\'s alert escalate globally — only toasts divert', () => {
    // A threaded agent's death is meant to interrupt; the badge is for news.
    const result = routeNotifications(
      [event({ id: 'e1', actorId: 'kael', notification: { channel: 'alert', icon: 'death' } })],
      EMPTY_STATE, NOW, undefined,
      gateFor({ kael: 'entity' }),
    );
    expect(result.alerts).toHaveLength(1);
    expect(result.entityNotices).toHaveLength(0);
  });

  it('routes everything globally when no gate is supplied (pre-gate behaviour)', () => {
    const result = routeNotifications(
      [event({ id: 'e1', actorId: 'stranger' })],
      EMPTY_STATE, NOW,
    );
    expect(result.toasts).toHaveLength(1);
    expect(result.entityNotices).toHaveLength(0);
  });

  it('accumulates notices across ticks and keeps prior ones', () => {
    const first = routeNotifications(
      [event({ id: 'e1', actorId: 'kael' })],
      EMPTY_STATE, NOW, undefined, gateFor({ kael: 'entity' }),
    );
    const second = routeNotifications(
      [event({ id: 'e2', actorId: 'kael', tick: 13, message: 'Kael has become Wary' })],
      first, NOW, undefined, gateFor({ kael: 'entity' }),
    );
    expect(second.entityNotices?.map(n => n.id)).toEqual(['e1', 'e2']);
  });

  it('still honours a disabled category ahead of the gate', () => {
    const result = routeNotifications(
      [event({ id: 'e1', actorId: 'kael' })],
      EMPTY_STATE, NOW,
      {
        encounters: { enabled: true, mode: 'temporary' },
        movement: { enabled: true, mode: 'temporary' },
        actions: { enabled: true, mode: 'temporary' },
        social: { enabled: true, mode: 'temporary' },
        lifecycle: { enabled: false, mode: 'temporary' },
        economy: { enabled: true, mode: 'temporary' },
        doom: { enabled: true, mode: 'temporary' },
        journeys: { enabled: true, mode: 'temporary' },
        ambitions: { enabled: true, mode: 'temporary' },
        divine: { enabled: true, mode: 'temporary' },
        discovery: { enabled: true, mode: 'temporary' },
      },
      gateFor({ kael: 'entity' }),
    );
    expect(result.entityNotices).toHaveLength(0);
    expect(result.toasts).toHaveLength(0);
  });
});
