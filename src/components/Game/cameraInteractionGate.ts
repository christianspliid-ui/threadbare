/**
 * cameraInteractionGate.ts — pure predicate for interaction-gated camera centering.
 *
 * THR-463: Only center the camera on a moving agent when there is something
 * meaningful for the player to engage with — a pending encounter/aftermath,
 * or the agent arriving at a populated location (≥1 other agent present).
 *
 * NFP #1: All thresholds are named constants.
 * NFP #4: Fail-soft — errors return { center: false, reason: 'suppressed' }.
 */
import type { WorldGraph } from '../../engine/graph';
import type { EncounterNotification } from '../../types/encounterVisibility';
import type { EncounterProgress } from '../../types/encounter';

// ── Tunable constants ─────────────────────────────────────────────────────────

/** Master gate switch. When false, camera always centers (legacy behaviour). */
export const CENTER_ON_INTERACTION_ONLY = true;

/** Gate condition A: center when the agent has a pending encounter/notification. */
export const CENTER_ON_PENDING_ENCOUNTER = true;

/** Gate condition B: center when the agent arrives at a populated location. */
export const CENTER_ON_POPULATED_ARRIVAL = true;

/**
 * Minimum number of OTHER agents that must be co-located for the arrival to
 * be considered "populated" and warrant a camera pan.
 */
export const MIN_COLOCATED_FOR_CENTER = 1;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CameraGateInputs {
  graph: WorldGraph;
  encounterNotifications: EncounterNotification[] | undefined;
  encounterProgress: EncounterProgress[];
  tick: number;
}

export type CameraCenterReason =
  | 'pending_encounter'
  | 'populated_arrival'
  | 'suppressed';

export interface CameraCenterDecision {
  center: boolean;
  reason: CameraCenterReason;
}

// ── Predicate ─────────────────────────────────────────────────────────────────

/**
 * Decide whether the camera should center on `agentId` after a hex move.
 *
 * Condition A — Pending encounter or aftermath:
 *   An unresolved EncounterNotification for this agent, OR an EncounterProgress
 *   with status 'awaiting_choice'.
 *
 * Condition B — Populated arrival:
 *   Resolve the agent's location via the three-tier model (located_at edge)
 *   and count other actors at the same location. Center when count ≥ MIN_COLOCATED_FOR_CENTER.
 */
export function shouldCenterOnAgentMove(
  agentId: string,
  inputs: CameraGateInputs,
): CameraCenterDecision {
  try {
    if (!CENTER_ON_INTERACTION_ONLY) {
      return { center: true, reason: 'pending_encounter' };
    }

    // ── Condition A: pending encounter / aftermath ────────────────────────────
    if (CENTER_ON_PENDING_ENCOUNTER) {
      const notifications = inputs.encounterNotifications ?? [];
      const hasPendingNotification = notifications.some(
        (n) => n.agentId === agentId && !n.resolved,
      );
      if (hasPendingNotification) {
        return { center: true, reason: 'pending_encounter' };
      }

      const hasPendingAftermath = inputs.encounterProgress.some(
        (ep) => ep.actorId === agentId && ep.status === 'awaiting_choice',
      );
      if (hasPendingAftermath) {
        return { center: true, reason: 'pending_encounter' };
      }
    }

    // ── Condition B: populated arrival ───────────────────────────────────────
    if (CENTER_ON_POPULATED_ARRIVAL) {
      const locatedAtEdges = inputs.graph.getOutgoingEdges(agentId, 'located_at');
      if (locatedAtEdges.length > 0) {
        const locationId = locatedAtEdges[0].target;
        const coResidents = inputs.graph.getIncomingEdges(locationId, 'located_at');
        const otherActorCount = coResidents.filter((e) => e.source !== agentId).length;
        if (otherActorCount >= MIN_COLOCATED_FOR_CENTER) {
          return { center: true, reason: 'populated_arrival' };
        }
      }
    }

    return { center: false, reason: 'suppressed' };
  } catch {
    // Fail-soft: if graph traversal throws (missing node, etc.), hold the camera.
    return { center: false, reason: 'suppressed' };
  }
}
