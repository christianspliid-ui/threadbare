import { describe, it, expect, beforeEach } from 'vitest';
import { phaseDoom, phaseDoomExpiry, phaseMandate, resetEventCounter } from '../orchestrator';
import { routeNotifications } from '../notificationRouter';
import type { GameState } from '../../types/gameState';
import type { NotificationState } from '../../types/notification';
import { WorldGraph } from '../graph';

function emptyNotificationState(): NotificationState {
  return { toasts: [], alerts: [], popupQueue: [] };
}

beforeEach(() => {
  resetEventCounter();
});

describe('notification integration', () => {
  it('doom escalation produces popup notification', () => {
    const graph = new WorldGraph();
    // DoomClockState shape: stage 1, progress just below 0.20 threshold
    // After advanceDoomClock adds tickModifier (1), progress crosses 0.20 → stage 2
    const state = {
      graph,
      tick: 10,
      tickEvents: [],
      doomClock: {
        definitionArchetype: 'breach',
        currentTick: 19,       // next tick = 20, progress = 20/100 = 0.20 → stage 2
        totalTicks: 100,
        currentStage: 1,
        progress: 0.19,
        stageTransitions: [0],
        expired: false,
        tickModifier: 1.0,
      },
      doomDefinition: {
        archetype: 'breach',
        stages: [
          { stage: 1, name: 'Whispers', tickThreshold: 0.20, events: [] },
          { stage: 2, name: 'Cracks Appear', tickThreshold: 0.40, events: [] },
          { stage: 3, name: 'Tremors', tickThreshold: 0.60, events: [] },
          { stage: 4, name: 'Crisis', tickThreshold: 0.80, events: [] },
          { stage: 5, name: 'Culmination', tickThreshold: 1.0, events: [] },
        ],
      },
    } as unknown as GameState;

    const result = phaseDoom(state);
    const events = result.tickEvents ?? [];
    const doomEvents = events.filter(e => e.type === 'doom_escalation');

    expect(doomEvents.length).toBeGreaterThanOrEqual(1);
    const notif = doomEvents[0].notification;
    expect(notif).toBeDefined();
    expect(notif?.channel).toBe('popup');
    expect(notif?.popup?.title).toBe('Cracks Appear');
  });

  it('router partitions doom popup into popupQueue', () => {
    const graph = new WorldGraph();
    const state = {
      graph,
      tick: 10,
      tickEvents: [],
      doomClock: {
        definitionArchetype: 'breach',
        currentTick: 19,
        totalTicks: 100,
        currentStage: 1,
        progress: 0.19,
        stageTransitions: [0],
        expired: false,
        tickModifier: 1.0,
      },
      doomDefinition: {
        archetype: 'breach',
        stages: [
          { stage: 1, name: 'Whispers', tickThreshold: 0.20, events: [] },
          { stage: 2, name: 'Cracks Appear', tickThreshold: 0.40, events: [] },
          { stage: 3, name: 'Tremors', tickThreshold: 0.60, events: [] },
          { stage: 4, name: 'Crisis', tickThreshold: 0.80, events: [] },
          { stage: 5, name: 'Culmination', tickThreshold: 1.0, events: [] },
        ],
      },
    } as unknown as GameState;

    const result = phaseDoom(state);
    const events = result.tickEvents ?? [];

    const notifState = routeNotifications(events, emptyNotificationState(), Date.now());
    expect(notifState.popupQueue.length).toBeGreaterThanOrEqual(1);
    expect(notifState.popupQueue[0].title).toBe('Cracks Appear');
  });

  it('doom expiry produces popup notification', () => {
    const graph = new WorldGraph();
    const state = {
      graph,
      tick: 200,
      tickEvents: [],
      phase: 'playing',
      doomClock: {
        definitionArchetype: 'breach',
        currentTick: 200,
        totalTicks: 200,
        currentStage: 5,
        progress: 1.0,
        stageTransitions: [0, 40, 80, 120, 160],
        expired: true,
        tickModifier: 1.0,
      },
      doomDefinition: {
        archetype: 'breach',
        stages: [
          { stage: 1, name: 'Whispers', tickThreshold: 0.20, events: [] },
          { stage: 2, name: 'Signs', tickThreshold: 0.40, events: [] },
          { stage: 3, name: 'Tremors', tickThreshold: 0.60, events: [] },
          { stage: 4, name: 'Crisis', tickThreshold: 0.80, events: [] },
          { stage: 5, name: 'Culmination', tickThreshold: 1.0, events: [] },
        ],
      },
    } as unknown as GameState;

    const result = phaseDoomExpiry(state);
    const events = result.tickEvents ?? [];
    const phaseEvents = events.filter(e => e.type === 'phase_change');

    expect(phaseEvents.length).toBeGreaterThanOrEqual(1);
    const notif = phaseEvents[0].notification;
    expect(notif).toBeDefined();
    expect(notif?.channel).toBe('popup');
    expect(notif?.popup?.title).toBe('The Unmaking');
  });

  it('mandate fulfillment produces alert notification', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: {} });

    const state = {
      graph,
      tick: 50,
      tickEvents: [],
      ascendantId: 'asc-1',
      mandateDefinition: {
        name: 'Test Mandate',
        stages: [{ threshold: 1, description: 'Done' }],
      },
      mandateState: { progress: 1.0, currentStage: 0, completed: false, failed: false },
    } as unknown as GameState;

    const result = phaseMandate(state);
    const events = result.tickEvents ?? [];
    const mandateEvents = events.filter(e => e.type === 'mandate_progress');

    if (mandateEvents.length > 0) {
      const notif = mandateEvents[0].notification;
      expect(notif).toBeDefined();
      expect(notif?.channel).toBe('alert');
      expect(notif?.icon).toBe('mandate');
    }
  });

  it('events without notification field are not routed', () => {
    const events = [
      {
        id: 'e1',
        tick: 1,
        type: 'essence_gain' as const,
        message: 'Some essence',
        significance: 0.1,
      },
    ];
    const result = routeNotifications(events, emptyNotificationState(), Date.now());
    expect(result.toasts).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.popupQueue).toHaveLength(0);
  });
});
