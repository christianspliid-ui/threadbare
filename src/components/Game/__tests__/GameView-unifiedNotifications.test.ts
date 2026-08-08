// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  isEncounterAutoOpenSuppressed,
  isStepNotificationSupersededByAftermath,
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

describe('auto-open suppression vs a stopped clock (THR-1017)', () => {
  /**
   * The stacked-modal case, which every THR-1005 pass missed by testing a
   * cleared screen. `interruptSuppressedUntilTick` is armed as `tick + 1` when a
   * veil closes, and clears only when `tick` reaches it — but closing a veil
   * while another interrupt surface is stacked (the opening action-card beat
   * modal) leaves `useInterruptAutoPause` holding the sim paused, so the tick
   * never arrives and the window never expires.
   *
   * Modelled as the predicate the scan consults, with `simRunning` standing in
   * for the clock: `running === false` is exactly "no tick is coming".
   */
  const armedWindow = true;   // interruptSuppressedUntilTick === tick + 1
  const noWindow = false;

  it('does not suppress while the sim is paused — the tick that would clear the window can never arrive', () => {
    // The regression. Before THR-1017 the scan read `interruptsSuppressed`
    // alone, returned early, and starved the queued aftermath for as long as
    // the player left the opening modal stacked.
    expect(isEncounterAutoOpenSuppressed(armedWindow, false)).toBe(false);
  });

  it('still suppresses while the sim runs, so the one-tick debounce is unchanged on a cleared screen', () => {
    expect(isEncounterAutoOpenSuppressed(armedWindow, true)).toBe(true);
  });

  it('never suppresses when no window is armed, paused or running', () => {
    expect(isEncounterAutoOpenSuppressed(noWindow, true)).toBe(false);
    expect(isEncounterAutoOpenSuppressed(noWindow, false)).toBe(false);
  });

  it('lets the scan reach a queued aftermath behind a stacked modal with the clock frozen', () => {
    // End-to-end shape of the live repro: sim paused by the stacked beat modal,
    // suppression armed by the step veil the player just closed, aftermath
    // queued behind two spent steps. The scan must run and reach it.
    const queue = [
      { id: 'n_step1', kind: 'encounter', stepIndex: 0, resolved: false, autoResolveTick: null },
      { id: 'n_step2', kind: 'encounter', stepIndex: 1, resolved: false, autoResolveTick: null },
      { id: 'n_aftermath', kind: 'aftermath', stepIndex: 2, resolved: false, autoResolveTick: null },
    ] as any[];

    const simRunning = false;                     // paused by the stacked modal
    expect(isEncounterAutoOpenSuppressed(armedWindow, simRunning)).toBe(false);

    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(queue, null, (notif: any) => {
      attempts.push(notif.id);
      return notif.kind === 'aftermath';
    });

    expect(opened).toBe('n_aftermath');
    expect(attempts).toEqual(['n_step1', 'n_step2', 'n_aftermath']);
  });

  it('keeps the just-closed record held back by id, not by the clock', () => {
    // Why dropping the tick window is safe: the precise half of the guard is
    // `suppressedEncounterNotificationId`, which is keyed on the notification
    // id and is therefore unaffected by a stopped clock.
    const queue = [
      { id: 'n_justClosed', kind: 'encounter', stepIndex: 0, resolved: false, autoResolveTick: null },
      { id: 'n_aftermath', kind: 'aftermath', stepIndex: 1, resolved: false, autoResolveTick: null },
    ] as any[];

    const attempts: string[] = [];
    const opened = runEncounterAutoOpenScan(queue, 'n_justClosed', (notif: any) => {
      attempts.push(notif.id);
      return true;
    });

    expect(opened).toBe('n_aftermath');
    expect(attempts).toEqual(['n_aftermath']);
  });
});

describe('spent final-step notification vs its own aftermath (THR-1005)', () => {
  /**
   * The state measured live at `?view=game&seeded&size=medium&spawn=tg.senior.jewel_heist`
   * after driving the encounter to resolution with `__DEBUG.tick`: the action is
   * resolved, `currentStep` has frozen at 2, and the queue holds three step
   * notifications plus the aftermath appended last.
   *
   * Steps 0 and 1 decline on the THR-664 stepIndex mismatch. **Step 2 does not** —
   * its `stepIndex` still equals the frozen `currentStep`. That is the record
   * that ate the auto-interrupt slot and kept the aftermath behind a badge click.
   */
  const resolvedAction = { actionId: 'ua_1', resolved: true } as any;
  const liveQueueAtResolution = () => [
    { id: 'n_step0', kind: 'encounter', actionId: 'ua_1', stepIndex: 0, resolved: false, autoResolveTick: null },
    { id: 'n_step1', kind: 'encounter', actionId: 'ua_1', stepIndex: 1, resolved: false, autoResolveTick: null },
    { id: 'n_step2', kind: 'encounter', actionId: 'ua_1', stepIndex: 2, resolved: false, autoResolveTick: null },
    { id: 'n_aftermath', kind: 'aftermath', actionId: 'ua_1', stepIndex: 2, resolved: false, autoResolveTick: null },
  ] as any[];

  it('supersedes the final step notification once its own aftermath is pending', () => {
    const queue = liveQueueAtResolution();
    expect(isStepNotificationSupersededByAftermath(queue[2], resolvedAction, queue)).toBe(true);
  });

  it('never supersedes the aftermath itself — that is the beat we are routing to', () => {
    const queue = liveQueueAtResolution();
    expect(isStepNotificationSupersededByAftermath(queue[3], resolvedAction, queue)).toBe(false);
  });

  it('leaves a live encounter alone — an unresolved action still owns its steps', () => {
    const queue = liveQueueAtResolution();
    const liveAction = { actionId: 'ua_1', resolved: false } as any;
    expect(isStepNotificationSupersededByAftermath(queue[2], liveAction, queue)).toBe(false);
  });

  it('cannot strand a beat: a resolved action with no pending aftermath keeps its step', () => {
    const queue = liveQueueAtResolution().slice(0, 3); // aftermath absent (digest tier)
    expect(isStepNotificationSupersededByAftermath(queue[2], resolvedAction, queue)).toBe(false);

    const acknowledged = liveQueueAtResolution();
    acknowledged[3].resolved = true; // player already acknowledged the aftermath
    expect(isStepNotificationSupersededByAftermath(acknowledged[2], resolvedAction, acknowledged)).toBe(false);
  });

  it('does not cross-talk between encounters — another action\u2019s aftermath is not this step\u2019s', () => {
    const queue = [
      { id: 'n_step2', kind: 'encounter', actionId: 'ua_1', stepIndex: 2, resolved: false, autoResolveTick: null },
      { id: 'n_other', kind: 'aftermath', actionId: 'ua_9', stepIndex: 0, resolved: false, autoResolveTick: null },
    ] as any[];
    expect(isStepNotificationSupersededByAftermath(queue[0], resolvedAction, queue)).toBe(false);
  });

  it('legacy encounters are untouched — no unified action means no supersession', () => {
    const queue = liveQueueAtResolution();
    expect(isStepNotificationSupersededByAftermath(queue[2], undefined, queue)).toBe(false);
  });

  it('the scan now reaches the aftermath through the real opener predicate', () => {
    const queue = liveQueueAtResolution();
    const attempts: string[] = [];
    // `currentStep` freezes at the final index when the action resolves — this is
    // the value that makes n_step2 pass THR-664's check while n_step0/1 fail it.
    const frozenCurrentStep = 2;
    // The opener as it actually behaves: THR-664 stepIndex decline, then the
    // THR-1005 supersession check. No stub that assumes steps decline.
    const realOpener = (notif: any) => {
      attempts.push(notif.id);
      if (notif.stepIndex !== undefined && notif.stepIndex !== frozenCurrentStep) return false;
      if (isStepNotificationSupersededByAftermath(notif, resolvedAction, queue)) return false;
      return true;
    };
    const opened = runEncounterAutoOpenScan(queue, null, realOpener);

    expect(opened).toBe('n_aftermath');
    expect(attempts).toEqual(['n_step0', 'n_step1', 'n_step2', 'n_aftermath']);
  });
});
