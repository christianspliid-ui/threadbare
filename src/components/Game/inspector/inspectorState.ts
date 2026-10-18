/**
 * The Inspector's state (THR-1911, plan § D1–D3): which subject is open, the history the
 * back and forward buttons walk, the size, and the pin.
 *
 * Plain data and pure transitions, so the reducer slice in `GameScreenState` stays a value
 * and every rule here is Node-tested. Focus (the invoker to return to) is not here: it is
 * a DOM element and lives in a ref in the host.
 */
import type { InspectorSubject } from '../../../engine/views/subjects/subjectPage';
import { subjectKeyOf } from '../../../engine/views/subjects/subjectPage';

export type InspectorSize = 'docked' | 'wide' | 'full';

/** The sizes the router opens at; Full is only ever on request (THR-1827 call 10). */
export type InspectorOpenSize = 'docked' | 'wide';

export interface InspectorEntry {
  subject: InspectorSubject;
  key: string;
  /** The subject's name for the trail, filled in by the host once the page is built. */
  name: string;
}

export interface InspectorState {
  history: InspectorEntry[];
  /** -1 = closed: nothing open, no panel. */
  index: number;
  size: InspectorSize;
  /** The size Full returns to on Esc. */
  sizeBeforeFull: InspectorOpenSize | null;
  pinned: boolean;
}

/** How many subjects back and forward remember; the oldest falls off. */
export const INSPECTOR_HISTORY_MAX = 30;
/** How many steps the toolbar's trail shows before a leading "…". */
export const INSPECTOR_TRAIL_CRUMBS = 3;

export const INITIAL_INSPECTOR_STATE: InspectorState = {
  history: [],
  index: -1,
  size: 'docked',
  sizeBeforeFull: null,
  pinned: false,
};

const RANK: Record<InspectorSize, number> = { docked: 0, wide: 1, full: 2 };

export function isInspectorOpen(state: InspectorState): boolean {
  return state.index >= 0 && state.index < state.history.length;
}

export function currentEntry(state: InspectorState): InspectorEntry | null {
  return isInspectorOpen(state) ? state.history[state.index] : null;
}

/**
 * Open a subject. Opening while not at the end of history drops the forward entries
 * (browser rule). Opening never narrows a wider current size (Law 57: the Inspector
 * never picks a smaller size than the player has); opening the subject already shown
 * only widens to the asked size.
 */
export function openSubject(state: InspectorState, subject: InspectorSubject, size: InspectorOpenSize): InspectorState {
  const key = subjectKeyOf(subject);
  const open = isInspectorOpen(state);
  const nextSize: InspectorSize = open && RANK[state.size] >= RANK[size] ? state.size : size;
  const current = currentEntry(state);
  if (current && current.key === key) {
    return nextSize === state.size ? state : { ...state, size: nextSize };
  }
  const kept = open ? state.history.slice(0, state.index + 1) : [];
  const history = [...kept, { subject, key, name: '' }].slice(-INSPECTOR_HISTORY_MAX);
  return { ...state, history, index: history.length - 1, size: nextSize, sizeBeforeFull: nextSize === 'full' ? state.sizeBeforeFull : null };
}

/** A map click while pinned does not replace the subject (§ D3). */
export function openFromMap(state: InspectorState, subject: InspectorSubject, size: InspectorOpenSize): InspectorState {
  return state.pinned && isInspectorOpen(state) ? state : openSubject(state, subject, size);
}

export function goBack(state: InspectorState): InspectorState {
  return isInspectorOpen(state) && state.index > 0 ? { ...state, index: state.index - 1 } : state;
}

export function goForward(state: InspectorState): InspectorState {
  return isInspectorOpen(state) && state.index < state.history.length - 1 ? { ...state, index: state.index + 1 } : state;
}

/** Jump to one step of the trail. */
export function goTo(state: InspectorState, index: number): InspectorState {
  return index >= 0 && index < state.history.length && index !== state.index ? { ...state, index } : state;
}

/** Closing keeps the history (Alt+← after a close is not offered: the panel is gone). */
export function closeInspector(state: InspectorState): InspectorState {
  return isInspectorOpen(state) ? { ...INITIAL_INSPECTOR_STATE } : state;
}

/** `W` and the widen button: docked → wide → full → docked. */
export function cycleSize(state: InspectorState): InspectorState {
  if (!isInspectorOpen(state)) return state;
  if (state.size === 'docked') return { ...state, size: 'wide' };
  if (state.size === 'wide') return { ...state, size: 'full', sizeBeforeFull: 'wide' };
  return { ...state, size: 'docked', sizeBeforeFull: null };
}

/** Widen one step, never past Full (the "More when widened" button). */
export function widen(state: InspectorState): InspectorState {
  if (!isInspectorOpen(state) || state.size === 'full') return state;
  return state.size === 'docked' ? { ...state, size: 'wide' } : { ...state, size: 'full', sizeBeforeFull: 'wide' };
}

/** Esc steps one down: full → the size before it, wide → docked, docked → closed. */
export function escapeStep(state: InspectorState): InspectorState {
  if (!isInspectorOpen(state)) return state;
  if (state.size === 'full') return { ...state, size: state.sizeBeforeFull ?? 'docked', sizeBeforeFull: null };
  if (state.size === 'wide') return { ...state, size: 'docked' };
  return closeInspector(state);
}

/** A pause-tier interrupt closes Full: the same subject, docked (§ D2). */
export function stepFullToDocked(state: InspectorState): InspectorState {
  return isInspectorOpen(state) && state.size === 'full' ? { ...state, size: 'docked', sizeBeforeFull: null } : state;
}

export function togglePin(state: InspectorState): InspectorState {
  return isInspectorOpen(state) ? { ...state, pinned: !state.pinned } : state;
}

/** The host records the built page's name onto the entry, for the trail. */
export function nameEntry(state: InspectorState, key: string, name: string): InspectorState {
  const entry = currentEntry(state);
  if (!entry || entry.key !== key || entry.name === name) return state;
  const history = state.history.slice();
  history[state.index] = { ...entry, name };
  return { ...state, history };
}

/**
 * The trail's steps: the last `INSPECTOR_TRAIL_CRUMBS` up to and including the current
 * one, and whether older steps are hidden behind a leading "…".
 */
export function trailSteps(state: InspectorState): { steps: { index: number; name: string; current: boolean }[]; more: boolean } {
  if (!isInspectorOpen(state)) return { steps: [], more: false };
  const from = Math.max(0, state.index - (INSPECTOR_TRAIL_CRUMBS - 1));
  const steps = state.history.slice(from, state.index + 1).map((e, i) => ({ index: from + i, name: e.name, current: from + i === state.index }));
  return { steps, more: from > 0 };
}
