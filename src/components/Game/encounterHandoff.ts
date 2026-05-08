/**
 * encounterHandoff.ts — World view → encounter screen handoff orchestration (THR-340 / Phase F2).
 *
 * Implements the design plan §5.8 contract:
 * - Set `gameState.spotlightedAgent` so AgentPulseOverlay knows which hex to flare.
 * - Emit a `spotlight_changed` trace (NFP #2 — Inspectability).
 * - Surface a fade-up transition duration constant for the encounter screen entry.
 * - Provide a silent audio-cue hook that post-v1 H1 (THR-346) will fill in. The hook
 *   stays decoupled from component logic so sound work doesn't reach back into UI files.
 *
 * NFP #1 (tunability): the transition duration is the named constant
 *   `ENCOUNTER_HANDOFF_TRANSITION_MS` re-exported from `encounter-experience-constants`.
 * NFP #4 (fail-soft): missing trace category or null target id is logged and ignored;
 *   the handoff still returns timing data so the UI can still complete its transition.
 *
 * Note: world-freeze (turn-based contract) is already enforced by the existing
 * `encounterModalOpen` effect in GameView, which calls `setRunning(false)` whenever
 * the encounter modal mounts. This module does not duplicate that behavior — it
 * only sets spotlight + emits trace + surfaces timing.
 */

import { emitTrace } from '../../engine/traceBuffer';
import type { SpotlightChangedTrace, SpotlightTrigger } from '../../types/traces/encounter-traces';
import { ENCOUNTER_HANDOFF_TRANSITION_MS } from '../../data/encounter-experience-constants';

export { ENCOUNTER_HANDOFF_TRANSITION_MS };

/** Audio-cue contract for the encounter handoff transition.
 *  Silent in v1; consumed by H1 (THR-346) when the post-v1 sound design lands. */
export interface EncounterHandoffAudioHook {
  /** Fired when the transition begins — world ambience shifts toward scene queue murmur. */
  onTransitionStart?: () => void;
  /** Fired when the transition completes — encounter screen ambient is in full force. */
  onTransitionEnd?: () => void;
}

export interface PrepareEncounterHandoffArgs {
  /** Previously-spotlighted agent id, if any. Null on first handoff of a session. */
  fromAgentId?: string | null;
  /** Agent the spotlight is moving to. Required. */
  toAgentId: string;
  /** What caused the spotlight to change. Drives downstream debug filtering. */
  trigger: SpotlightTrigger;
  /** Current game tick for trace timestamp parity with the engine. */
  tick: number;
  /** Optional audio-cue hook. Silent in v1; H1 wires sound through this contract. */
  audio?: EncounterHandoffAudioHook;
}

export interface PrepareEncounterHandoffResult {
  /** The agent id the caller should write to `gameState.spotlightedAgent`. */
  spotlightedAgent: string;
  /** Fade-up duration in milliseconds; the caller mounts/swaps the encounter screen after this. */
  transitionMs: number;
}

/**
 * Prepare a world view → encounter screen handoff.
 *
 * Side effects:
 * - Emits a `spotlight_changed` trace (no-op when tracing is disabled).
 * - Invokes `audio.onTransitionStart` if provided.
 *
 * Returns the data the caller needs to commit:
 * - The next spotlighted agent id (caller updates GameState).
 * - The transition duration (caller schedules the screen swap).
 *
 * The caller owns:
 * - Updating `gameState.spotlightedAgent` (so it stays a single setGameState boundary).
 * - Scheduling the encounter screen mount after `transitionMs`.
 * - Calling `completeEncounterHandoff` on the audio hook when the screen lands.
 */
export function prepareEncounterHandoff(
  args: PrepareEncounterHandoffArgs,
): PrepareEncounterHandoffResult {
  const { fromAgentId, toAgentId, trigger, tick, audio } = args;

  const trace: SpotlightChangedTrace = {
    category: 'spotlight_changed',
    tick,
    toAgentId,
    trigger,
    ...(fromAgentId ? { fromAgentId } : {}),
  };
  emitTrace({
    ...trace,
    summary: `spotlight → ${toAgentId} (${trigger})`,
  });

  audio?.onTransitionStart?.();

  return {
    spotlightedAgent: toAgentId,
    transitionMs: ENCOUNTER_HANDOFF_TRANSITION_MS,
  };
}

/** Companion to `prepareEncounterHandoff` — call when the encounter screen has fully mounted. */
export function completeEncounterHandoff(audio?: EncounterHandoffAudioHook): void {
  audio?.onTransitionEnd?.();
}
