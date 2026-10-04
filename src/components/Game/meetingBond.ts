/**
 * THR-1704 — the bond that ends Meet The First must be visible the moment it lands.
 *
 * `createAgentFromMeeting` writes The First's node, its `located_at` edge and the
 * ascendant's `the_first` thread into the live graph **in place**. The graph object
 * keeps its identity, so every memo that keys on `gameState.graph` — the Threads
 * panel, the retinue, the Agent Thread prompt — goes on serving the pre-bond
 * (empty) result. The clock comes back paused after the beat, so no tick bumps
 * `worldVersion` for them either: the player bonds a mortal and is told "No
 * Threads" until they press Play.
 *
 * CLAUDE.md's load-bearing rule names the fix: every meaningful mutation of the
 * in-place graph participates in the touch API. A new node and new edges are a
 * structural change, so this calls `touchStructure` (which implies `touchWorld`)
 * — the encounter cache and foreshadowing cache must also learn the new mortal.
 *
 * Lives outside GameView so the one call the host makes is the one the test makes.
 */

import type { WorldGraph } from '../../engine/graph';
import { createAgentFromMeeting } from '../../engine/meetingEncounter';
import { touchStructure, type SimulationRuntime } from '../../engine/simulationRuntime';
import type { MeetingEncounterResult } from '../../types/meetingEncounter';

/**
 * Bond The First from a resolved meeting and mark the world changed.
 *
 * Returns the new agent's id. `runtime` is optional only so a host without a
 * session (none today) degrades to the old behavior rather than throwing.
 */
export function bondFirstFromMeeting(
  graph: WorldGraph,
  result: MeetingEncounterResult,
  ascendantId: string,
  tick: number,
  runtime: SimulationRuntime | null | undefined,
): string {
  const agentId = createAgentFromMeeting(graph, result, ascendantId, tick);
  if (runtime) touchStructure(runtime);
  return agentId;
}
