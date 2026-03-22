/**
 * FollowMode.ts — Camera follow mode state management.
 *
 * Simple mutable state stored in a useRef. No React state — follow mode changes
 * do not trigger re-renders. The camera animates via animateCameraTo whenever
 * the followed agent changes hex.
 *
 * NFP #1: All follow mode state is in this module — one place to tune.
 * NFP #2: State is transparent — read agentId and lastHexKey to trace.
 * NFP #4: All methods are no-ops when agentId is null — never throw.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Mutable follow mode state stored in a useRef inside HexMapV2.
 * Not React state — mutations do not trigger re-renders.
 */
export interface FollowModeState {
  /** Whether follow mode is currently active */
  active: boolean;
  /** ID of the agent being followed, or null if not following */
  agentId: string | null;
  /** "col,row" key of the agent's last known hex position, or null if not yet set */
  lastHexKey: string | null;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a new FollowModeState with follow mode disabled.
 */
export function createFollowMode(): FollowModeState {
  return { active: false, agentId: null, lastHexKey: null };
}

// ── Mutators ──────────────────────────────────────────────────────────────────

/**
 * Enables or disables follow mode for a given agent.
 *
 * - agentId !== null → follow mode active, camera will track this agent
 * - agentId === null → follow mode disabled, camera is free
 *
 * Resets lastHexKey so the next agent position update triggers an immediate
 * camera pan to the new agent location.
 *
 * @param state    - The FollowModeState to mutate (stored in useRef)
 * @param agentId  - Agent ID to follow, or null to stop following
 */
export function updateFollowTarget(
  state: FollowModeState,
  agentId: string | null,
): void {
  state.active = agentId !== null;
  state.agentId = agentId;
  state.lastHexKey = null; // Reset so next position update triggers a camera pan
}
