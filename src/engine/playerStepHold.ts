/**
 * Minimised-step hold (THR-1730) — a pause-tier encounter step the player set
 * down (Escape, or "Show on map") waits for them, however long the world runs.
 *
 * The UI writes the hold on minimise (`setPlayerHold`) and clears it on a
 * commit or a dismiss (`releasePlayerHold`). Phase 1 of the unified-action
 * pipeline (`phaseUnifiedActionProgress`) reads it through
 * `progressActionsWithPlayerHolds`: a live hold is passed through
 * un-progressed; a dead one is released (with a trace naming why) and
 * progressed normally the same tick. Every hold therefore has an engine-side
 * release, so a hold can never strand an action.
 *
 * Plan: Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | PLAYER_HOLD_ENABLED    | true     | kill switch: false restores play-out |
 * | PLAYER_HOLD_MAX_TICKS  | Infinity | no cap, by decision                  |
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Actor has no thread edge     | not live → `thread_not_pause` release |
 * | Hold on an earlier step      | not live → `step_changed` release     |
 * | Action resolved              | not live → `resolved` release         |
 * | Old save without the field   | absent ⇒ unchanged behaviour          |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None.
 */

import type { WorldGraph } from './graph';
import type { UnifiedAction } from '../types/unifiedAction';
import type { ThreadEdgeProperties } from '../types/influence';
import type {
  PlayerHoldReleaseReason,
  PlayerHoldReleasedTrace,
  PlayerHoldSetTrace,
} from '../types/trace';
import { resolveAttentionMode } from './attentionCadence';
import { getThreadTo } from './graphQueries';
import { progressUnifiedAction, withoutPlayerHold } from './unifiedActionLifecycle';
import { emitTrace } from './traceBuffer';

export type { PlayerHoldReleaseReason } from '../types/trace';

/** Kill switch. `false` makes every hold release (reason `disabled`): today's play-out. */
export const PLAYER_HOLD_ENABLED = true;

/** Ticks a hold may stand before it releases (`max_ticks`). `Infinity` = no cap, by decision. */
export const PLAYER_HOLD_MAX_TICKS = Infinity;

/**
 * Hold the action's current step for the player. Idempotent per step: an
 * existing hold on the same step keeps its `sinceTick`.
 */
export function setPlayerHold(action: UnifiedAction, tick: number): UnifiedAction {
  if (action.playerHold && action.playerHold.stepIndex === action.currentStep) return action;
  return { ...action, playerHold: { stepIndex: action.currentStep, sinceTick: tick } };
}

/** Drop the hold. Returns the same object when there is none. */
export function releasePlayerHold(action: UnifiedAction): UnifiedAction {
  return withoutPlayerHold(action);
}

/** Is the actor's thread a pause-mode (and not dormant) thread? Missing thread → false. */
function actorThreadIsPause(graph: WorldGraph, actorId: string): boolean {
  try {
    const thread = getThreadTo(graph, actorId);
    if (!thread) return false;
    const props = thread.properties as unknown as ThreadEdgeProperties;
    if (props.courtPosition === 'dormant') return false;
    return resolveAttentionMode(props) === 'pause';
  } catch {
    return false;
  }
}

/**
 * Why the action's hold is not live, or `null` while it is (or when there is
 * no hold at all — check `action.playerHold` to tell the two apart).
 */
export function playerHoldReleaseReason(
  action: UnifiedAction,
  graph: WorldGraph,
  tick: number,
): PlayerHoldReleaseReason | null {
  const hold = action.playerHold;
  if (!hold) return null;
  if (!PLAYER_HOLD_ENABLED) return 'disabled';
  if (action.resolved) return 'resolved';
  if (hold.stepIndex !== action.currentStep) return 'step_changed';
  if (!actorThreadIsPause(graph, action.actorId)) return 'thread_not_pause';
  if (tick - hold.sinceTick >= PLAYER_HOLD_MAX_TICKS) return 'max_ticks';
  return null;
}

/** Does this action carry a hold that Phase 1 must honour this tick? */
export function isPlayerHoldLive(action: UnifiedAction, graph: WorldGraph, tick: number): boolean {
  return action.playerHold !== undefined && playerHoldReleaseReason(action, graph, tick) === null;
}

/** Emit `encounter.player_hold_set`. */
export function tracePlayerHoldSet(action: UnifiedAction, tick: number, actorName?: string): void {
  const trace: Omit<PlayerHoldSetTrace, 'id' | 'timestamp'> = {
    category: 'encounter.player_hold_set',
    tick,
    agentId: action.actorId,
    actionId: action.actionId,
    templateId: action.templateId,
    stepIndex: action.currentStep,
    summary: `${actorName ?? action.actorId}'s ${action.templateId} step ${action.currentStep + 1} waits for the player`,
  };
  emitTrace(trace);
}

/** Emit `encounter.player_hold_released` for an action that carried a hold. */
export function tracePlayerHoldReleased(
  action: UnifiedAction,
  tick: number,
  reason: PlayerHoldReleaseReason,
): void {
  const hold = action.playerHold;
  if (!hold) return;
  const trace: Omit<PlayerHoldReleasedTrace, 'id' | 'timestamp'> = {
    category: 'encounter.player_hold_released',
    tick,
    agentId: action.actorId,
    actionId: action.actionId,
    stepIndex: hold.stepIndex,
    heldTicks: Math.max(0, tick - hold.sinceTick),
    reason,
    summary: `${action.templateId} step ${hold.stepIndex + 1} hold released (${reason}) after ${Math.max(0, tick - hold.sinceTick)} ticks`,
  };
  emitTrace(trace);
}

/**
 * Phase 1 with holds honoured. Actions without a hold progress exactly as
 * `progressUnifiedAction` would. A live hold passes through un-progressed; a
 * dead one is released, traced, and progressed this same tick.
 */
export function progressActionsWithPlayerHolds(
  actions: readonly UnifiedAction[],
  graph: WorldGraph,
  tick: number,
): UnifiedAction[] {
  return actions.map((action) => {
    if (action.playerHold === undefined) return progressUnifiedAction(action);
    const reason = playerHoldReleaseReason(action, graph, tick);
    if (reason === null) return action;
    tracePlayerHoldReleased(action, tick, reason);
    return progressUnifiedAction(releasePlayerHold(action));
  });
}
