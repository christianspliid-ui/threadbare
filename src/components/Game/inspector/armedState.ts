/**
 * The armed card's state (THR-1914, Inspector plan § D9 way 3): which card is armed from
 * the hand, the target chosen for it (a map click or a drop — choosing never casts), and the
 * one-shot line the banner answers a click with.
 *
 * Plain data and pure transitions, so the `armed` slice of `GameScreenState` stays a value
 * and every rule here is Node-tested. The hand reads `armed.actionId` to draw that card
 * selected; only the arming hook writes it.
 */
import type { WorldRef } from '../../../types/worldRef';
import type { UiCardArmOrigin } from '../../../types/traces/ui-traces';

export interface ArmedCard {
  /** The card's template id (the hand row's id). */
  actionId: string;
  /** Where it was armed from. */
  origin: Extract<UiCardArmOrigin, 'hand' | 'drag' | 'find'>;
  /** The chosen target, or null while the card waits for one. */
  target: WorldRef | null;
  /** The answer to the last click — a locked reason, or the not-a-target line — or null. */
  note: string | null;
}

export type ArmedSlice = ArmedCard | null;

/** A press on a hand card: arm it; a second press on the armed card puts it down. */
export function pressHandCard(prev: ArmedSlice, actionId: string, origin: ArmedCard['origin'] = 'hand'): ArmedSlice {
  if (prev && prev.actionId === actionId && origin === 'hand') return null;
  return { actionId, origin, target: null, note: null };
}

/**
 * A card picked in Find arms (THR-1915, `origin: 'find'`). Never toggles off: a search is a
 * deliberate ask, so finding the armed card again keeps it armed.
 */
export function armFromFind(prev: ArmedSlice, actionId: string): ArmedSlice {
  if (prev && prev.actionId === actionId) return prev;
  return { actionId, origin: 'find', target: null, note: null };
}

/** A drag from the hand arms the card it carries (never toggles it off). */
export function armForDrag(prev: ArmedSlice, actionId: string): ArmedSlice {
  if (prev && prev.actionId === actionId) return prev.origin === 'drag' ? prev : { ...prev, origin: 'drag' };
  return { actionId, origin: 'drag', target: null, note: null };
}

/** Choose a target: the banner turns into the commit line. Nothing is cast. */
export function stageTarget(prev: ArmedSlice, target: WorldRef): ArmedSlice {
  if (!prev) return prev;
  return { ...prev, target, note: null };
}

/** Answer a click with a line (a reason, or "cannot touch that"); the arm stays. */
export function noteArmed(prev: ArmedSlice, note: string): ArmedSlice {
  if (!prev || prev.note === note) return prev;
  return { ...prev, note };
}

/** Whether a ref is the staged target. */
export function isStaged(armed: ArmedSlice, ref: Pick<WorldRef, 'kind' | 'id'>): boolean {
  return !!armed?.target && armed.target.kind === ref.kind && armed.target.id === ref.id;
}
