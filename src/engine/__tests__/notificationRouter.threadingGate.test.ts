/**
 * THR-666 — the threading gate as the router sees it.
 *
 * Sibling of `notificationThreadingGate.test.ts`, which tests the decision in
 * isolation. This file asserts what the decision *does* to notification state:
 * an unthreaded agent produces nothing, a threaded agent produces a row notice
 * instead of a toast, and world events are untouched.
 */

import { describe, it, expect } from 'vitest';
import type { TickEvent } from '../../types/gameState';
import type { NotificationState } from '../../types/notification';
import { routeNotifications } from '../notificationRouter';
import type { ThreadingGate, ActorRouting } from '../notificationThreadingGate';

const EMPTY_STATE: NotificationState = { toasts: [], alerts: [], popupQueue: [], entityNotices: [] };
const NOW = 1_000_000;

/** Gate driven by a fixed actor→routing table, so no graph is needed. */
function gateFor(table: Record<string, ActorRouting>): ThreadingGate {
  return {
    resolveEventRouting: (event) => (event.actorId ? table[event.actorId] ?? 'global' : 'global'),
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
      gateFor({ stranger: 'suppress' }),
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
      agentId: 'kael',
      message: 'Ziven has become Guiding',
      tick: 12,
      category: 'lifecycle',
    });
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
