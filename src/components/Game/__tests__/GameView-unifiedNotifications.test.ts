// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  selectEncounterRuntimeForNotification,
  shouldAutoOpenEncounterNotification,
} from '../encounterNotificationRuntime';

describe('GameView unified encounter notification runtime selection', () => {
  it('prefers unified progress for unified notifications even when legacy progress is stale', () => {
    const notification = {
      agentId: 'ind_10',
      agentName: 'Oracle',
      encounterId: 'cg.quest.gate_duty',
      actionId: 'ua_gate_duty',
      sourceSystem: 'unified_action',
      stepIndex: 1,
    } as any;

    const legacyProgresses = [
      {
        actorId: 'ind_10',
        encounterId: 'cg.quest.gate_duty',
        status: 'active',
        currentEncounterIndex: 0,
      },
    ] as any;

    const unifiedActions = [
      {
        actionId: 'ua_gate_duty',
        actorId: 'ind_10',
        templateId: 'cg.quest.gate_duty',
        resolved: false,
        currentStep: 1,
        stepDuration: 2,
        stepProgress: 0,
        completedAtTick: null,
        stepOutcomes: ['success'],
      },
    ] as any;

    const { encounter, activeAction } = selectEncounterRuntimeForNotification(
      notification,
      legacyProgresses,
      unifiedActions,
      42,
    );

    expect(activeAction?.actionId).toBe('ua_gate_duty');
    expect(encounter?.sourceSystem).toBe('unified_action');
    expect(encounter?.currentStepIndex).toBe(1);
    expect(encounter?.history).toEqual([
      { encounterId: 'step-1', success: true, tick: 42 },
    ]);
  });

  it('continues to prefer legacy progress for legacy notifications', () => {
    const notification = {
      agentId: 'ind_10',
      agentName: 'Oracle',
      encounterId: 'cg.quest.gate_duty',
      sourceSystem: 'legacy_encounter',
      stepIndex: 0,
    } as any;

    const legacyProgresses = [
      {
        actorId: 'ind_10',
        encounterId: 'cg.quest.gate_duty',
        status: 'active',
        currentEncounterIndex: 0,
        history: [{ encounterId: 'cg.quest.gate_duty', success: true, tick: 10 }],
      },
    ] as any;

    const unifiedActions = [
      {
        actionId: 'ua_gate_duty',
        actorId: 'ind_10',
        templateId: 'cg.quest.gate_duty',
        resolved: false,
        currentStep: 1,
        stepDuration: 2,
        stepProgress: 0,
        completedAtTick: null,
        stepOutcomes: [],
      },
    ] as any;

    const { encounter } = selectEncounterRuntimeForNotification(
      notification,
      legacyProgresses,
      unifiedActions,
      42,
    );

    expect(encounter?.sourceSystem).toBe('legacy_encounter');
    expect(encounter?.currentStepIndex).toBe(0);
    expect(encounter?.history).toEqual([
      { encounterId: 'cg.quest.gate_duty', success: true, tick: 10 },
    ]);
  });

  it('only auto-opens pause-mode encounter notifications', () => {
    expect(shouldAutoOpenEncounterNotification({
      resolved: false,
      autoResolveTick: null,
    })).toBe(true);

    expect(shouldAutoOpenEncounterNotification({
      resolved: false,
      autoResolveTick: 24,
    })).toBe(false);

    expect(shouldAutoOpenEncounterNotification({
      resolved: true,
      autoResolveTick: null,
    })).toBe(false);
  });
});
