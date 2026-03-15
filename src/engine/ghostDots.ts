/**
 * Ghost Dot State Management
 *
 * Tracks agents that have left the player's line of sight.
 * Ghost dots fade linearly over GHOST_DOT_DECAY_TICKS.
 */

import { GHOST_DOT_DECAY_TICKS, GHOST_DOT_INITIAL_OPACITY } from '../data/agent-visual-content';

export interface GhostDotEntry {
  agentId: string;
  agentName: string;
  hexCol: number;
  hexRow: number;
  createdTick: number;
}

/**
 * Compute ghost dot opacity based on age.
 * Returns 0 if fully decayed.
 */
export function ghostDotOpacity(createdTick: number, currentTick: number): number {
  const age = currentTick - createdTick;
  if (age >= GHOST_DOT_DECAY_TICKS) return 0;
  return GHOST_DOT_INITIAL_OPACITY * (1 - age / GHOST_DOT_DECAY_TICKS);
}

/**
 * Update ghost dot state based on visibility changes.
 *
 * - Agents that were visible but are no longer → create ghost dot
 * - Agents that are visible again → remove their ghost dot
 * - Ghost dots older than GHOST_DOT_DECAY_TICKS → remove
 */
export function updateGhostDots(
  existing: GhostDotEntry[],
  previousAgentLocations: Map<string, { hexCol: number; hexRow: number; agentName?: string }>,
  currentVisibleAgentIds: Set<string>,
  currentTick: number,
): GhostDotEntry[] {
  const result: GhostDotEntry[] = [];

  // Keep non-decayed existing ghosts that aren't visible again
  for (const ghost of existing) {
    if (currentVisibleAgentIds.has(ghost.agentId)) continue; // now visible
    if (currentTick - ghost.createdTick >= GHOST_DOT_DECAY_TICKS) continue; // decayed
    result.push(ghost);
  }

  // Add new ghosts for agents that left visibility
  for (const [agentId, loc] of previousAgentLocations) {
    if (currentVisibleAgentIds.has(agentId)) continue; // still visible
    if (result.some(g => g.agentId === agentId)) continue; // already a ghost
    result.push({
      agentId,
      agentName: loc.agentName ?? agentId,
      hexCol: loc.hexCol,
      hexRow: loc.hexRow,
      createdTick: currentTick,
    });
  }

  return result;
}
