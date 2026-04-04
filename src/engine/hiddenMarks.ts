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

/** Remove a specific mark by ID (after it has been revealed). */
export function removeHiddenMark(state: GameState, markId: string): GameState {
  return {
    ...state,
    hiddenMarks: (state.hiddenMarks ?? []).filter(m => m.markId !== markId),
  };
}
