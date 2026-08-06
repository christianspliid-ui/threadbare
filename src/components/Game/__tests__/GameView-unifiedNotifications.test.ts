// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  runEncounterAutoOpenScan,
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

describe('encounter auto-open scan (THR-1005)', () => {
  /**
   * A pause-tier queue at the moment an encounter finishes. Steps 1 and 2 have
   * been walked past but nothing marks a spent step notification `resolved`, so
   * both remain *eligible* while being unopenable. The aftermath is appended
   * last by `encounterVisibility.ts`, which is what put it behind them.
   */
  const pauseTierQueueAtResolution = () => [
    { id: 'n_step1', kind: 'encounter', stepIndex: 0, resolved: false, autoResolveTick: null },
    { id: 'n_step2', kind: 'encounter', stepIndex: 1, resolved: false, autoResolveTick: null },
    { id: 'n_aftermath', kind: 'aftermath', stepIndex: 2, resolved: false, autoResolveTick: null },
  ] as any[];

  /** Opens only the aftermath — every walked-past step declines, as THR-664 specifies. */
  const opensOnlyAftermath = (attempts: string[]) => (notif: any) => {
    attempts.push(notif.id);
    return notif.kind === 'aftermath';
  };

  it('opens the aftermath even though stale step notifications sit ahead of it', () => {
    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(
      pauseTierQueueAtResolution(),
      null,
      opensOnlyAftermath(attempts),
    );

    // The defect: breaking on the first *attempt* stopped at 'n_step1', which
    // opened nothing, and the aftermath never popped on this or any later tick.
    expect(opened).toBe('n_aftermath');
    expect(attempts).toEqual(['n_step1', 'n_step2', 'n_aftermath']);
  });

  it('stops at the first notification that actually opens, so only one beat interrupts', () => {
    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(
      pauseTierQueueAtResolution(),
      null,
      (notif: any) => {
        attempts.push(notif.id);
        return true;
      },
    );

    expect(opened).toBe('n_step1');
    expect(attempts).toEqual(['n_step1']);
  });

  it('never re-opens the notification the player just committed', () => {
    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(
      pauseTierQueueAtResolution(),
      'n_step2',
      opensOnlyAftermath(attempts),
    );

    expect(opened).toBe('n_aftermath');
    expect(attempts).not.toContain('n_step2');
  });

  it('leaves an auto_resolve-tier aftermath to its badge — a non-null tick is never an interrupt', () => {
    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(
      [
        { id: 'n_step1', kind: 'encounter', stepIndex: 0, resolved: false, autoResolveTick: 24 },
        { id: 'n_aftermath', kind: 'aftermath', stepIndex: 1, resolved: false, autoResolveTick: 24 },
      ] as any[],
      null,
      opensOnlyAftermath(attempts),
    );

    expect(opened).toBeNull();
    expect(attempts).toEqual([]);
  });

  it('reports no open when every eligible notification declines', () => {
    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(
      pauseTierQueueAtResolution(),
      null,
      (notif: any) => {
        attempts.push(notif.id);
        return false;
      },
    );

    expect(opened).toBeNull();
    expect(attempts).toHaveLength(3);
  });
});
