// @vitest-environment jsdom
/**
 * THR-1812 — a chapter step committed on a paused clock answers on screen.
 *
 * The hook is driven together with the real `useInterruptAutoPause`, with the
 * veil standing in as the one interrupt, so the clock assertions are about the
 * composed behaviour the player sees: the run turns the clock, the answer's
 * veil opens, and on closing it the clock is paused again — the state the
 * player left it in (rulebook §3).
 */

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { useInterruptAutoPause } from '../useInterruptAutoPause';
import {
  useChapterAnswerRun,
  stepChapterAnswer,
  CHAPTER_ANSWER_OPEN_GRACE_TICKS,
  type ChapterAnswerTarget,
} from '../useChapterAnswerRun';
import {
  CHAPTER_ANSWER_RUN_MAX_TICKS,
  chapterAnswerChoiceLine,
  chapterAnswerText,
  CHAPTER_ANSWER_DROPPED_TOAST,
} from '../../../../data/nudge-stage-content';
import type { UnifiedAction } from '../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../types/encounterVisibility';

const ACTION_ID = 'ua_kael_oath';

function action(currentStep: number, resolved = false): UnifiedAction {
  return { actionId: ACTION_ID, currentStep, resolved } as unknown as UnifiedAction;
}

function notif(id: string, extra: Partial<EncounterNotification> = {}): EncounterNotification {
  // Pause-tier beats carry `autoResolveTick: null` — the auto-open scan's predicate.
  return { id, actionId: ACTION_ID, resolved: false, autoResolveTick: null, ...extra } as unknown as EncounterNotification;
}

const TARGET: ChapterAnswerTarget = {
  actionId: ACTION_ID,
  stepIndex: 0,
  notificationId: 'n_step0',
  chapterName: "The Healer's Oath",
  choiceLine: 'Stayed silent.',
};

interface HarnessProps {
  actions: UnifiedAction[];
  notifications: EncounterNotification[];
  tick: number;
  veilOpen: boolean;
}

function setup(initial: Partial<HarnessProps> = {}) {
  const pushToast = vi.fn();
  const view = renderHook((props: HarnessProps) => {
    // The clock starts paused: the case this ticket is about.
    const [running, setRunning] = useState(false);
    const hold = useInterruptAutoPause({ interruptOpen: props.veilOpen, running, setRunning });
    const answer = useChapterAnswerRun({
      unifiedActions: props.actions,
      encounterNotifications: props.notifications,
      tick: props.tick,
      running,
      veilOpen: props.veilOpen,
      heldRunning: hold.heldRunning,
      hold,
      setRunning,
      pushToast,
    });
    return { running, setRunning, hold, answer };
  }, {
    initialProps: {
      actions: [action(0)],
      notifications: [notif('n_step0')],
      tick: 100,
      veilOpen: true,
      ...initial,
    },
  });
  return { ...view, pushToast };
}

/** Commit on a paused clock, then press *Let the world turn* (the veil closes). */
function commitAndRun(view: ReturnType<typeof setup>, props: HarnessProps) {
  act(() => view.result.current.answer.showCard(TARGET));
  expect(view.result.current.answer.getDebugState().state).toBe('answering_card');
  act(() => view.result.current.answer.letWorldTurn());
  view.rerender({ ...props, veilOpen: false });
}

const START: HarnessProps = { actions: [action(0)], notifications: [notif('n_step0')], tick: 100, veilOpen: true };

describe('THR-1812 — useChapterAnswerRun', () => {
  it('Let the world turn runs the clock, then the answer veil opens and the clock returns to paused', () => {
    const view = setup();
    commitAndRun(view, START);

    expect(view.result.current.running).toBe(true);
    expect(view.result.current.answer.getDebugState().state).toBe('running');
    expect(view.result.current.answer.answerStatus).toBe("turning · until The Healer's Oath answers");

    // Tick 101: step 0 answers; step 1's beat is pending; the scan opens it.
    view.rerender({ actions: [action(1)], notifications: [notif('n_step0', { resolved: true }), notif('n_step1', { stepIndex: 1 })], tick: 101, veilOpen: false });
    expect(view.result.current.answer.getDebugState().state).toBe('running');
    view.rerender({ actions: [action(1)], notifications: [notif('n_step0', { resolved: true }), notif('n_step1', { stepIndex: 1 })], tick: 101, veilOpen: true });

    expect(view.result.current.answer.getDebugState().state).toBe('none');
    expect(view.result.current.running).toBe(false);
    expect(view.result.current.hold.getWasRunningBeforeInterrupt()).toBe(false);

    // The player reads step 1 and closes it: the clock stays paused.
    view.rerender({ actions: [action(1)], notifications: [notif('n_step1', { stepIndex: 1, resolved: true })], tick: 101, veilOpen: false });
    expect(view.result.current.running).toBe(false);
    expect(view.pushToast).not.toHaveBeenCalled();
  });

  it('ends on `resolved` — the aftermath opens and the clock returns to paused', () => {
    const view = setup();
    commitAndRun(view, START);
    const aftermath = notif('n_after', { kind: 'aftermath' });
    view.rerender({ actions: [action(0, true)], notifications: [aftermath], tick: 104, veilOpen: true });

    expect(view.result.current.answer.getDebugState().state).toBe('none');
    expect(view.result.current.hold.getWasRunningBeforeInterrupt()).toBe(false);
  });

  it('action removed mid-run with no beat to open: the clock stops and the dropped toast names the chapter', () => {
    const view = setup();
    commitAndRun(view, START);
    view.rerender({ actions: [], notifications: [], tick: 103, veilOpen: false });

    expect(view.result.current.running).toBe(false);
    expect(view.result.current.answer.getDebugState().state).toBe('none');
    expect(view.pushToast).toHaveBeenCalledWith(
      "The Healer's Oath ended without an answer on screen. Its record is in the Chapter Ledger.",
    );
  });

  it('the tick cap stops the clock and pushes the timeout toast', () => {
    const view = setup();
    commitAndRun(view, START);
    view.rerender({ ...START, veilOpen: false, tick: 100 + CHAPTER_ANSWER_RUN_MAX_TICKS - 1 });
    expect(view.result.current.running).toBe(true);
    view.rerender({ ...START, veilOpen: false, tick: 100 + CHAPTER_ANSWER_RUN_MAX_TICKS });

    expect(view.result.current.running).toBe(false);
    expect(view.pushToast).toHaveBeenCalledWith(
      "The Healer's Oath did not answer in time. Its record is in the Chapter Ledger.",
    );
  });

  it('a player pause mid-run turns the run into a waiting answer, and the readout says so', () => {
    const view = setup();
    commitAndRun(view, START);
    act(() => view.result.current.setRunning(false));

    expect(view.result.current.answer.getDebugState().state).toBe('waiting');
    expect(view.result.current.answer.answerStatus).toBe("paused · The Healer's Oath answers when time runs");
    expect(view.pushToast).not.toHaveBeenCalled();
  });

  it('Back to the map waits on a paused clock; Play lets the answer open itself with no toast', () => {
    const view = setup();
    act(() => view.result.current.answer.showCard(TARGET));
    act(() => view.result.current.answer.backToMap());
    view.rerender({ ...START, veilOpen: false });

    expect(view.result.current.running).toBe(false);
    expect(view.result.current.answer.answerStatus).toBe("paused · The Healer's Oath answers when time runs");

    act(() => view.result.current.setRunning(true));
    expect(view.result.current.answer.answerStatus).toBeUndefined();
    view.rerender({ actions: [action(1)], notifications: [notif('n_step1', { stepIndex: 1 })], tick: 101, veilOpen: true });

    expect(view.result.current.answer.getDebugState().state).toBe('none');
    expect(view.pushToast).not.toHaveBeenCalled();
  });

  it('action removed while waiting pushes the dropped toast', () => {
    const view = setup();
    act(() => view.result.current.answer.showCard(TARGET));
    act(() => view.result.current.answer.backToMap());
    view.rerender({ ...START, veilOpen: false });
    view.rerender({ actions: [], notifications: [], tick: 100, veilOpen: false });

    expect(view.pushToast).toHaveBeenCalledTimes(1);
    expect(view.result.current.answer.getDebugState().state).toBe('none');
  });

  it('a veil closed by another route turns the card into a waiting answer', () => {
    const view = setup();
    act(() => view.result.current.answer.showCard(TARGET));
    view.rerender({ ...START, veilOpen: false });
    expect(view.result.current.answer.getDebugState().state).toBe('waiting');
  });

  it('an unresolved chapter name renders "this chapter", never an id', () => {
    const view = setup();
    act(() => view.result.current.answer.showCard({ ...TARGET, chapterName: null }));
    act(() => view.result.current.answer.letWorldTurn());
    view.rerender({ ...START, veilOpen: false });

    expect(view.result.current.answer.answerStatus).toBe('turning · until this chapter answers');
    view.rerender({ actions: [], notifications: [], tick: 102, veilOpen: false });
    expect(view.pushToast).toHaveBeenCalledWith(
      'This chapter ended without an answer on screen. Its record is in the Chapter Ledger.',
    );
  });

  it('getDebugState counts ticks run', () => {
    const view = setup();
    commitAndRun(view, START);
    view.rerender({ ...START, veilOpen: false, tick: 103 });
    expect(view.result.current.answer.getDebugState()).toEqual({
      state: 'running', actionId: ACTION_ID, stepIndex: 0, chapterName: "The Healer's Oath", ticksRun: 3,
    });
  });
});

describe('THR-1812 — stepChapterAnswer (pure)', () => {
  const running = { ...TARGET, phase: 'running' as const, startedAtTick: 100, sawRunning: true };
  const answeredInputs = {
    unifiedActions: [action(1)],
    encounterNotifications: [notif('n_step1', { stepIndex: 1 })],
    running: true,
    veilOpen: false,
    heldRunning: null,
  };

  it('an answered step whose beat has not opened stops the clock after the grace window, with no toast', () => {
    const first = stepChapterAnswer(running, { ...answeredInputs, tick: 101 }, null);
    expect(first.record).not.toBeNull();
    expect(first.answeredAtTick).toBe(101);
    const late = stepChapterAnswer(running, { ...answeredInputs, tick: 101 + CHAPTER_ANSWER_OPEN_GRACE_TICKS }, 101);
    expect(late.record).toBeNull();
    expect(late.effects).toEqual([{ kind: 'stop_clock' }]);
  });

  it('another interrupt holding the clock when the step answers re-points its hold to paused', () => {
    const step = stepChapterAnswer(running, { ...answeredInputs, heldRunning: true, running: false, tick: 101 }, null);
    expect(step.effects).toEqual([{ kind: 'pause_if_held' }]);
  });

  it('a Lives on beat (autoResolveTick set) never auto-opens, so the run ends with the dropped toast, not a silent stop', () => {
    const step = stepChapterAnswer(
      running,
      { ...answeredInputs, encounterNotifications: [notif('n_step1', { stepIndex: 1, autoResolveTick: 130 })], tick: 101 },
      null,
    );
    expect(step.record).toBeNull();
    expect(step.effects).toEqual([
      { kind: 'stop_clock' },
      { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_DROPPED_TOAST, TARGET.chapterName) },
    ]);
  });

  it('an earlier step\'s spent notification (never marked resolved) is not an answer: action gone → dropped toast', () => {
    const step1 = { ...running, stepIndex: 1, notificationId: 'n_step1' };
    const step = stepChapterAnswer(
      step1,
      { ...answeredInputs, unifiedActions: [], encounterNotifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })], tick: 101 },
      null,
    );
    expect(step.effects).toEqual([
      { kind: 'stop_clock' },
      { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_DROPPED_TOAST, TARGET.chapterName) },
    ]);
  });

  it('the committed beat itself never counts as the answer', () => {
    const step = stepChapterAnswer(
      running,
      { ...answeredInputs, unifiedActions: [], encounterNotifications: [notif('n_step0')], tick: 101 },
      null,
    );
    expect(step.effects).toEqual([
      { kind: 'stop_clock' },
      { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_DROPPED_TOAST, TARGET.chapterName) },
    ]);
  });
});

describe('THR-1812 — the choice line', () => {
  it('names the played cards, drops unresolved names, and reads silence when none resolve', () => {
    expect(chapterAnswerChoiceLine(['Steady Hand', 'Old Debts'])).toBe('Played: Steady Hand, Old Debts.');
    expect(chapterAnswerChoiceLine(['Steady Hand', undefined, ''])).toBe('Played: Steady Hand.');
    expect(chapterAnswerChoiceLine([])).toBe('Stayed silent.');
    // THR-1976 — a sentence-shaped authored choice label keeps one full stop.
    expect(chapterAnswerChoiceLine(['Stay your hand. Let the truth surface.'])).toBe('Played: Stay your hand. Let the truth surface.');
    expect(chapterAnswerChoiceLine([undefined, null])).toBe('Stayed silent.');
  });
});
