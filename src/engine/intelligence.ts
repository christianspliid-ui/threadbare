/**
 * Structured Intelligence — query helpers for the intelligence record primitive.
 *
 * Intelligence records are queryable knowledge objects held by agents, gained
 * through encounter aftermath effects. They persist on GameState (not on graph
 * nodes) and are queryable by future encounters to gate content or adjust
 * difficulty.
 *
 * v1: Storage + query only. Encounter authors use these helpers to check
 * whether an agent (or any agent) has intelligence matching their needs.
 */

import type { GameState } from '../types/gameState';
import type { IntelligenceRecord, IntelligenceCategory } from '../types/unifiedAction';

/** Get all intelligence held by a specific agent. */
export function getAgentIntelligence(state: GameState, agentId: string): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.agentId === agentId);
}

/** Get intelligence by category across all agents. */
export function getIntelligenceByCategory(state: GameState, category: IntelligenceCategory): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.category === category);
}

/** Check if an agent has intelligence about a specific entity. */
export function hasIntelligenceAbout(state: GameState, agentId: string, targetEntityId: string): boolean {
  return (state.intelligenceRecords ?? []).some(r => r.agentId === agentId && r.targetEntityId === targetEntityId);
}

/** Get intelligence relevant to a region. */
export function getRegionIntelligence(state: GameState, region: string): readonly IntelligenceRecord[] {
  return (state.intelligenceRecords ?? []).filter(r => r.targetRegion === region);
}

/** Check if any agent has intelligence matching a category and region. */
export function hasRegionIntelligence(state: GameState, category: IntelligenceCategory, region: string): boolean {
  return (state.intelligenceRecords ?? []).some(r => r.category === category && r.targetRegion === region);
}
