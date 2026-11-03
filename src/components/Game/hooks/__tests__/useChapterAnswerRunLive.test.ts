// @vitest-environment jsdom
/**
 * THR-2151 — on a running clock a committed chapter step stays on the Stage as the
 * live answering card, and its answer opens in place.
 *
 * The pure step function carries the decisions (open the answer, drop, time out,
 * back to the map); the hook test checks the effects reach GameView's two callbacks
 * and that the debug record names the phase and a deferred premonition.
 */

import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useChapterAnswerRun,
  stepChapterAnswer,
  chapterAnswerStatus,
  type ChapterAnswerInputs,
  type ChapterAnswerRecord,
  type ChapterAnswerTarget,
} from '../useChapterAnswerRun';
import {
  CHAPTER_ANSWER_DROPPED_TOAST,
  CHAPTER_ANSWER_PAUSED_STATUS,
  CHAPTER_ANSWER_RUN_MAX_TICKS,
  CHAPTER_ANSWER_TIMEOUT_TOAST,
  CHAPTER_ANSWER_TURNING_STATUS,
  chapterAnswerText,
} from '../../../../data/nudge-stage-content';
import type { UnifiedAction } from '../../../../types/unifiedAction';
import type { EncounterNotification } from '../../../../types/encounterVisibility';

const ACTION_ID = 'ua_ward_inspection';
const CHAPTER = 'Ward Inspection';

function action(currentStep: number, resolved = false): UnifiedAction {
  return { actionId: ACTION_ID, currentStep, resolved } as unknown as UnifiedAction;
}

function notif(id: string, extra: Partial<EncounterNotification> = {}): EncounterNotification {
  return { id, actionId: ACTION_ID, resolved: false, autoResolveTick: null, ...extra } as unknown as EncounterNotification;
}

const TARGET: ChapterAnswerTarget = {
  actionId: ACTION_ID,
  stepIndex: 0,
  notificationId: 'n_step0',
  chapterName: CHAPTER,
  choiceLine: 'Played: Boost.',
};

const LIVE: ChapterAnswerRecord = { ...TARGET, phase: 'answering_live', startedAtTick: 100, sawRunning: true };

function inputs(extra: Partial<ChapterAnswerInputs> = {}): ChapterAnswerInputs {
  return {
    unifiedActions: [action(0)],
    encounterNotifications: [notif('n_step0')],
    tick: 101,
    running: true,
    veilOpen: true,
    heldRunning: null,
    ...extra,
  };
}

describe('stepChapterAnswer — answering_live (THR-2151)', () => {
  it('keeps the card up while the step has not answered', () => {
    const step = stepChapterAnswer(LIVE, inputs(), null);
    expect(step.record).toBe(LIVE);
    expect(step.effects).toEqual([]);
  });

  it('answered with a pending next beat: opens it in place (D2)', () => {
    const step = stepChapterAnswer(LIVE, inputs({
      unifiedActions: [action(1)],
      encounterNotifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })],
    }), null);
    expect(step.record).toBeNull();
    expect(step.effects).toEqual([{ kind: 'open_answer', notificationId: 'n_step1' }]);
  });

  it('answered at the chapter end: opens the Aftermath in place', () => {
    const step = stepChapterAnswer(LIVE, inputs({
      unifiedActions: [action(0, true)],
      encounterNotifications: [notif('n_step0', { stepIndex: 0 }), notif('n_after', { kind: 'aftermath' })],
    }), null);
    expect(step.effects).toEqual([{ kind: 'open_answer', notificationId: 'n_after' }]);
  });

  it('answered with no beat to open: closes the card with the dropped toast', () => {
    const step = stepChapterAnswer(LIVE, inputs({ unifiedActions: [action(0, true)] }), null);
    expect(step.record).toBeNull();
    expect(step.effects).toEqual([
      { kind: 'close_card' },
      { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_DROPPED_TOAST, CHAPTER) },
    ]);
  });

  it('a moveless step playing out keeps the card up (THR-2140)', () => {
    const step = stepChapterAnswer(LIVE, inputs({
      unifiedActions: [action(1)],
      encounterNotifications: [notif('n_step0'), notif('n_step1', { stepIndex: 1, noPlayerMove: true })],
    }), null);
    expect(step.record).toBe(LIVE);
    expect(step.effects).toEqual([]);
  });

  it(`gives up after CHAPTER_ANSWER_RUN_MAX_TICKS (${CHAPTER_ANSWER_RUN_MAX_TICKS}) with the timeout toast`, () => {
    const before = stepChapterAnswer(LIVE, inputs({ tick: 100 + CHAPTER_ANSWER_RUN_MAX_TICKS - 1 }), null);
    expect(before.record).toBe(LIVE);
    const step = stepChapterAnswer(LIVE, inputs({ tick: 100 + CHAPTER_ANSWER_RUN_MAX_TICKS }), null);
    expect(step.record).toBeNull();
    expect(step.effects).toEqual([
      { kind: 'close_card' },
      { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_TIMEOUT_TOAST, CHAPTER) },
    ]);
  });

  it('veil closed (Back to the map): the answer waits as an ordinary beat (D4)', () => {
    const step = stepChapterAnswer(LIVE, inputs({ veilOpen: false }), null);
    expect(step.record?.phase).toBe('waiting');
    expect(step.record?.startedAtTick).toBeNull();
    expect(step.effects).toEqual([]);
  });

  it('another surface holding the clock: the card yields and the answer waits as an ordinary beat', () => {
    const step = stepChapterAnswer(LIVE, inputs({ heldElsewhere: true }), null);
    expect(step.record?.phase).toBe('waiting');
    expect(step.record?.startedAtTick).toBeNull();
    expect(step.effects).toEqual([{ kind: 'close_card' }]);
  });

  it('an answer that is ready opens first, even while something else wants the screen (D3)', () => {
    const step = stepChapterAnswer(LIVE, inputs({
      heldElsewhere: true,
      unifiedActions: [action(1)],
      encounterNotifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })],
    }), null);
    expect(step.effects).toEqual([{ kind: 'open_answer', notificationId: 'n_step1' }]);
  });

  it('a player pause leaves the card up; the TIME readout says it answers when time runs', () => {
    const step = stepChapterAnswer(LIVE, inputs({ running: false }), null);
    expect(step.record).toBe(LIVE);
    expect(chapterAnswerStatus(LIVE, false)).toBe(chapterAnswerText(CHAPTER_ANSWER_PAUSED_STATUS, CHAPTER));
    expect(chapterAnswerStatus(LIVE, true)).toBe(chapterAnswerText(CHAPTER_ANSWER_TURNING_STATUS, CHAPTER));
  });
});

interface HarnessProps {
  actions: UnifiedAction[];
  notifications: EncounterNotification[];
  tick: number;
  veilOpen: boolean;
  premonitionReady: boolean;
}

function setup(openAnswerResult = true) {
  const pushToast = vi.fn();
  const openAnswer = vi.fn(() => openAnswerResult);
  const closeVeil = vi.fn();
  const setRunning = vi.fn();
  const hold = { pauseIfHeld: vi.fn(() => false), runIfHeld: vi.fn(() => false) };
  const view = renderHook((props: HarnessProps) => useChapterAnswerRun({
    unifiedActions: props.actions,
    encounterNotifications: props.notifications,
    tick: props.tick,
    running: true,
    veilOpen: props.veilOpen,
    heldRunning: null,
    hold,
    setRunning,
    pushToast,
    openAnswer,
    closeVeil,
    premonitionReady: props.premonitionReady,
  }), {
    initialProps: {
      actions: [action(0)],
      notifications: [notif('n_step0', { stepIndex: 0 })],
      tick: 100,
      veilOpen: true,
      premonitionReady: false,
    },
  });
  return { view, pushToast, openAnswer, closeVeil, setRunning, hold };
}

describe('useChapterAnswerRun — the live card (THR-2151)', () => {
  it('shows the live card without touching the clock, and reports it on the debug record', () => {
    const { view, setRunning, hold } = setup();
    act(() => view.result.current.showLiveCard(TARGET));
    expect(view.result.current.answering).toEqual({ choiceLine: 'Played: Boost.', live: true });
    const debug = view.result.current.getDebugState();
    expect(debug.state).toBe('answering_live');
    expect(debug.premonitionDeferred).toBe(false);
    expect(setRunning).not.toHaveBeenCalled();
    expect(hold.pauseIfHeld).not.toHaveBeenCalled();
    expect(view.result.current.answerStatus).toBe(chapterAnswerText(CHAPTER_ANSWER_TURNING_STATUS, CHAPTER));
  });

  it('names a ready premonition while the live card is up', () => {
    const { view } = setup();
    act(() => view.result.current.showLiveCard(TARGET));
    view.rerender({
      actions: [action(0)], notifications: [notif('n_step0', { stepIndex: 0 })], tick: 101, veilOpen: true, premonitionReady: true,
    });
    expect(view.result.current.getDebugState().premonitionDeferred).toBe(true);
  });

  it('opens the answer through openAnswer and ends the record', () => {
    const { view, openAnswer, closeVeil } = setup();
    act(() => view.result.current.showLiveCard(TARGET));
    view.rerender({
      actions: [action(1)],
      notifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })],
      tick: 104,
      veilOpen: true,
      premonitionReady: false,
    });
    expect(openAnswer).toHaveBeenCalledWith('n_step1');
    expect(closeVeil).not.toHaveBeenCalled();
    expect(view.result.current.getDebugState().state).toBe('none');
  });

  it('a declined open closes the card, so the spent step never stays on screen', () => {
    const { view, openAnswer, closeVeil } = setup(false);
    act(() => view.result.current.showLiveCard(TARGET));
    view.rerender({
      actions: [action(1)],
      notifications: [notif('n_step0', { stepIndex: 0 }), notif('n_step1', { stepIndex: 1 })],
      tick: 104,
      veilOpen: true,
      premonitionReady: false,
    });
    expect(openAnswer).toHaveBeenCalledWith('n_step1');
    expect(closeVeil).toHaveBeenCalledTimes(1);
  });
});
