import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { InterruptAutoPauseHandle } from './useInterruptAutoPause';
import {
  CHAPTER_ANSWER_DROPPED_TOAST,
  CHAPTER_ANSWER_PAUSED_STATUS,
  CHAPTER_ANSWER_RUN_MAX_TICKS,
  CHAPTER_ANSWER_TIMEOUT_TOAST,
  CHAPTER_ANSWER_TURNING_STATUS,
  chapterAnswerText,
} from '../../../data/nudge-stage-content';

/**
 * THR-1812 — a chapter step committed on a paused clock answers on screen.
 *
 * A step resolves only when world time passes, so a commit made while the
 * player had paused used to close the veil onto a silent, paused map. This hook
 * holds the one piece of state that fixes it, in four phases:
 *
 * - `answering_card` — the veil stays up after the commit and says the answer
 *   waits on world time (GameView renders it; the veil still holds the clock).
 * - `running` — *Let the world turn*: the clock runs through the ordinary run
 *   loop until this step answers. When the answer's veil opens the hold's saved
 *   state is set to paused (`pauseIfHeld`), so the god who paused stays paused.
 * - `waiting` — *Back to the map*, or the player paused mid-run: the clock
 *   stays where the player put it and the TIME readout names what is pending.
 * - `none`.
 *
 * No forced resume (rulebook §3, 2026-09-27): the run starts through the hold's
 * existing `runIfHeld()` (THR-1716) or a plain `setRunning(true)`, and ends
 * through `pauseIfHeld()` (THR-1711) or `setRunning(false)`.
 */

export type ChapterAnswerPhase = 'none' | 'answering_card' | 'running' | 'waiting';

/** What the player committed and where its answer will come from. */
export interface ChapterAnswerTarget {
  actionId: string;
  stepIndex: number;
  /** The committed step's notification — the answer is any *other* pending one for the action. */
  notificationId: string;
  /** The chapter's display name (veil title); `null` renders "this chapter". */
  chapterName: string | null;
  /** "Played: …." / "Stayed silent." */
  choiceLine: string;
}

export interface ChapterAnswerRecord extends ChapterAnswerTarget {
  phase: Exclude<ChapterAnswerPhase, 'none'>;
  /** Tick *Let the world turn* was pressed; `null` outside a run. */
  startedAtTick: number | null;
  /** The clock was seen moving during this run — a later stop is the player's. */
  sawRunning: boolean;
}

/** `__DEBUG.getChapterAnswer()` — mirrors `DebugChapterAnswer` in debug-bridge.d.ts. */
export interface DebugChapterAnswer {
  state: ChapterAnswerPhase;
  actionId: string | null;
  stepIndex: number | null;
  chapterName: string | null;
  ticksRun: number;
}

/**
 * Ticks an answered step may wait, clock running, for its pending beat to open
 * before the run gives up and stops the clock. The auto-open scan opens it
 * within one tick of the suppression window; anything longer means another
 * surface is in the way, and the thread badge is the recovery route (Law 39).
 */
export const CHAPTER_ANSWER_OPEN_GRACE_TICKS = 2;

export interface ChapterAnswerInputs {
  unifiedActions: readonly UnifiedAction[];
  encounterNotifications: readonly EncounterNotification[];
  tick: number;
  running: boolean;
  /** A tiered encounter veil is on screen. */
  veilOpen: boolean;
  /** The interrupt hold's saved state (`heldRunning`); `null` while nothing holds the clock. */
  heldRunning: boolean | null;
}

export type ChapterAnswerEffect =
  | { kind: 'pause_if_held' }
  | { kind: 'stop_clock' }
  | { kind: 'toast'; message: string };

export interface ChapterAnswerStep {
  record: ChapterAnswerRecord | null;
  effects: ChapterAnswerEffect[];
  /** Tick the step was first seen answered during a run (grace bookkeeping). */
  answeredAtTick: number | null;
}

/** The committed step has moved on: next step, resolved, or the action is gone. */
export function isChapterStepAnswered(
  actions: readonly UnifiedAction[],
  target: Pick<ChapterAnswerTarget, 'actionId' | 'stepIndex'>,
): boolean {
  const action = actions.find(a => a.actionId === target.actionId);
  return !action || action.resolved || action.currentStep !== target.stepIndex;
}

/** A beat for this action other than the committed one is waiting to open. */
export function hasPendingAnswerBeat(
  notifications: readonly EncounterNotification[],
  target: Pick<ChapterAnswerTarget, 'actionId' | 'notificationId'>,
): boolean {
  return notifications.some(n =>
    !n.resolved && n.actionId === target.actionId && n.id !== target.notificationId,
  );
}

/**
 * One pure step of the state machine — the hook's whole decision, so it can be
 * read and tested without React. Effects are applied by the hook in order.
 */
export function stepChapterAnswer(
  record: ChapterAnswerRecord | null,
  inputs: ChapterAnswerInputs,
  answeredAtTick: number | null,
): ChapterAnswerStep {
  const none = (effects: ChapterAnswerEffect[]): ChapterAnswerStep => ({ record: null, effects, answeredAtTick: null });
  const keep = (next: ChapterAnswerRecord, at: number | null = answeredAtTick): ChapterAnswerStep => ({ record: next, effects: [], answeredAtTick: at });
  if (!record) return { record: null, effects: [], answeredAtTick: null };

  const dropped: ChapterAnswerEffect = {
    kind: 'toast',
    message: chapterAnswerText(CHAPTER_ANSWER_DROPPED_TOAST, record.chapterName),
  };

  switch (record.phase) {
    case 'answering_card':
      // The card is the veil. Closed by any route other than its own two
      // controls, the answer is still pending — say so on the readout.
      return inputs.veilOpen ? keep(record) : keep({ ...record, phase: 'waiting' });

    case 'waiting': {
      if (!isChapterStepAnswered(inputs.unifiedActions, record)) return keep(record);
      // The answer opened (or will open) by itself; a veil records the paused
      // clock as its return state, so nothing more to do.
      if (inputs.veilOpen || hasPendingAnswerBeat(inputs.encounterNotifications, record)) return none([]);
      return none([dropped]);
    }

    case 'running': {
      const sawRunning = record.sawRunning || inputs.running || inputs.heldRunning === true;
      const current = sawRunning === record.sawRunning ? record : { ...record, sawRunning };

      if (isChapterStepAnswered(inputs.unifiedActions, record)) {
        // The answer's veil is up: its hold saved "running" — make it paused.
        if (inputs.veilOpen) return none([{ kind: 'pause_if_held' }]);
        // Some other interrupt holds the clock: stop it there; the beat opens
        // when that surface closes, as today.
        if (inputs.heldRunning !== null) return none([{ kind: 'pause_if_held' }]);
        if (hasPendingAnswerBeat(inputs.encounterNotifications, record)) {
          const at = answeredAtTick ?? inputs.tick;
          if (inputs.tick - at >= CHAPTER_ANSWER_OPEN_GRACE_TICKS) return none([{ kind: 'stop_clock' }]);
          return keep(current, at);
        }
        return none([{ kind: 'stop_clock' }, dropped]);
      }

      // The player took the clock back: Pause on the map, or a pause pressed
      // inside another interrupt's hold. The run becomes a waiting answer.
      if (sawRunning && ((!inputs.running && inputs.heldRunning === null) || inputs.heldRunning === false)) {
        return keep({ ...current, phase: 'waiting', startedAtTick: null });
      }

      const ticksRun = record.startedAtTick === null ? 0 : inputs.tick - record.startedAtTick;
      if (ticksRun >= CHAPTER_ANSWER_RUN_MAX_TICKS) {
        return none([
          { kind: 'stop_clock' },
          { kind: 'toast', message: chapterAnswerText(CHAPTER_ANSWER_TIMEOUT_TOAST, record.chapterName) },
        ]);
      }
      return keep(current);
    }
  }
}

/** The TIME readout's status text for this record, or `undefined` for the usual one. */
export function chapterAnswerStatus(record: ChapterAnswerRecord | null, running: boolean): string | undefined {
  if (!record) return undefined;
  if (record.phase === 'running' && running) return chapterAnswerText(CHAPTER_ANSWER_TURNING_STATUS, record.chapterName);
  if (record.phase === 'waiting' && !running) return chapterAnswerText(CHAPTER_ANSWER_PAUSED_STATUS, record.chapterName);
  return undefined;
}

export interface UseChapterAnswerRunParams extends ChapterAnswerInputs {
  hold: Pick<InterruptAutoPauseHandle, 'pauseIfHeld' | 'runIfHeld'>;
  setRunning: (running: boolean) => void;
  pushToast: (message: string) => void;
}

export interface ChapterAnswerRunHandle {
  /** The current record; `null` when nothing is pending. */
  record: ChapterAnswerRecord | null;
  /** The answering card's model while the card is up. */
  answering: { choiceLine: string } | null;
  /** A commit on a paused clock: keep the veil up as the answering card. */
  showCard: (target: ChapterAnswerTarget) => void;
  /** *Let the world turn* — call while the veil still holds the clock, then close it. */
  letWorldTurn: () => void;
  /** *Back to the map* — the answer waits; close the veil. */
  backToMap: () => void;
  /** TIME readout override, or `undefined`. */
  answerStatus: string | undefined;
  getDebugState: () => DebugChapterAnswer;
}

export function useChapterAnswerRun(params: UseChapterAnswerRunParams): ChapterAnswerRunHandle {
  const { unifiedActions, encounterNotifications, tick, running, veilOpen, heldRunning, hold, setRunning, pushToast } = params;
  const [record, setRecord] = useState<ChapterAnswerRecord | null>(null);
  const answeredAtRef = useRef<number | null>(null);
  const tickRef = useRef(tick);
  tickRef.current = tick;

  const showCard = useCallback((target: ChapterAnswerTarget) => {
    answeredAtRef.current = null;
    setRecord({ ...target, phase: 'answering_card', startedAtTick: null, sawRunning: false });
  }, []);

  const letWorldTurn = useCallback(() => {
    // While the veil holds the clock, set the state it returns to; closing the
    // veil then runs it. With no hold (never expected here), just run.
    if (!hold.runIfHeld()) setRunning(true);
    answeredAtRef.current = null;
    setRecord(prev => prev && { ...prev, phase: 'running', startedAtTick: tickRef.current, sawRunning: false });
  }, [hold, setRunning]);

  const backToMap = useCallback(() => {
    setRecord(prev => prev && { ...prev, phase: 'waiting', startedAtTick: null });
  }, []);

  useEffect(() => {
    if (!record) return;
    const step = stepChapterAnswer(
      record,
      { unifiedActions, encounterNotifications, tick, running, veilOpen, heldRunning },
      answeredAtRef.current,
    );
    answeredAtRef.current = step.answeredAtTick;
    for (const effect of step.effects) {
      if (effect.kind === 'pause_if_held') {
        if (!hold.pauseIfHeld()) setRunning(false);
      } else if (effect.kind === 'stop_clock') {
        if (!hold.pauseIfHeld()) setRunning(false);
      } else {
        pushToast(effect.message);
      }
    }
    if (step.record !== record) setRecord(step.record);
  }, [record, unifiedActions, encounterNotifications, tick, running, veilOpen, heldRunning, hold, setRunning, pushToast]);

  const phase: ChapterAnswerPhase = record?.phase ?? 'none';
  const loggedPhaseRef = useRef<ChapterAnswerPhase>('none');
  useEffect(() => {
    if (!import.meta.env.DEV || loggedPhaseRef.current === phase) return;
    loggedPhaseRef.current = phase;
    console.debug('[chapter-answer]', phase, record?.actionId ?? null, record?.stepIndex ?? null);
    // Logged on phase changes only; the ids ride along for context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const getDebugState = useCallback((): DebugChapterAnswer => ({
    state: record?.phase ?? 'none',
    actionId: record?.actionId ?? null,
    stepIndex: record?.stepIndex ?? null,
    chapterName: record?.chapterName ?? null,
    ticksRun: record?.phase === 'running' && record.startedAtTick !== null
      ? Math.max(0, tickRef.current - record.startedAtTick)
      : 0,
  }), [record]);

  const answering = useMemo(
    () => (record?.phase === 'answering_card' ? { choiceLine: record.choiceLine } : null),
    [record],
  );

  return {
    record,
    answering,
    showCard,
    letWorldTurn,
    backToMap,
    answerStatus: chapterAnswerStatus(record, running),
    getDebugState,
  };
}
