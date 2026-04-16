/**
 * Hidden Marks — query and mutation helpers for the delayed-reveal hidden mark primitive.
 *
 * Hidden marks are concealed consequences placed on agents by encounter aftermath
 * effects. They persist on GameState (not on graph nodes) and are queryable by
 * future encounters to trigger investigation reveals.
 *
 * v1: Storage + query only. No automatic reveal system — encounter authors use
 * checkMarkReveals() to test if marks should surface during their encounter.
 */

import type { GameState } from '../types/gameState';
import type { HiddenMark } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';

/** Get all hidden marks on a specific agent. */
export function getAgentHiddenMarks(state: GameState, agentId: string): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m => m.targetAgentId === agentId);
}

/** Get hidden marks by category across all agents. */
export function getHiddenMarksByCategory(state: GameState, category: HiddenMark['category']): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m => m.category === category);
}

/** Check if an agent has any hidden mark in a given category. */
export function hasHiddenMark(state: GameState, agentId: string, category: HiddenMark['category']): boolean {
  return (state.hiddenMarks ?? []).some(m => m.targetAgentId === agentId && m.category === category);
}

/**
 * Check if any hidden marks would be revealed by an encounter from a given family.
 * Returns marks whose revealFamilies include the given family prefix.
 */
export function checkMarkReveals(
  state: GameState,
  agentId: string,
  encounterFamily: string,
): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m =>
    m.targetAgentId === agentId &&
    m.revealFamilies?.some(f => encounterFamily.startsWith(f)),
  );
}

/** Remove a specific mark by ID (after it has been revealed). Does NOT emit a trace. */
export function removeHiddenMark(state: GameState, markId: string): GameState {
  return {
    ...state,
    hiddenMarks: (state.hiddenMarks ?? []).filter(m => m.markId !== markId),
  };
}

/**
 * Reveal a hidden mark — remove it from state and emit a `hidden_mark_revealed` trace.
 * Use this instead of `removeHiddenMark` when a mark is consumed by a matching encounter
 * or action (i.e. a revealFamilies predicate matched).
 *
 * If the markId is not found, state is returned unchanged and no trace is emitted.
 */
export function revealHiddenMark(
  state: GameState,
  markId: string,
  tick: number,
  revealedBy: string,
): GameState {
  const mark = (state.hiddenMarks ?? []).find(m => m.markId === markId);
  if (!mark) return state;
  emitTrace({
    tick,
    category: 'hidden_mark_revealed',
    agentId: mark.targetAgentId,
    markId,
    actorId: mark.targetAgentId,
    revealedBy,
    ticksSincePlacement: tick - mark.placedTick,
    summary: `Hidden mark revealed: "${mark.label}" on ${mark.targetAgentId} by ${revealedBy}`,
  });
  return removeHiddenMark(state, markId);
}
