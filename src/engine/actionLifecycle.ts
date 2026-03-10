/**
 * ActionInProgress Lifecycle — create, progress, and resolve CRUD actions.
 *
 * This module manages the complete lifecycle of in-progress actions:
 * - createAction: spawn a new action with a performing edge
 * - progressAction: increment progress by 1 tick
 * - isActionComplete: check if action has reached duration
 * - completeAction: mark as resolved and remove performing edge
 * - isAgentIdle: check if agent has no active actions
 * - getActiveActions: filter to only unresolved actions
 */

import type { WorldGraph } from './graph';
import type { ActionInProgress } from '../types/temporal';
import { emitTrace } from './traceBuffer';

let actionCounter = 0;

/** Reset counter for testing */
export function resetActionCounter(): void {
  actionCounter = 0;
}

export interface CreateActionParams {
  actorId: string;
  templateId: string;
  targetId: string;
  domain: string;
  duration: number;
  tick: number;
  encounterId?: string;
}

/**
 * Create a new action in progress.
 * Adds a performing edge to the graph.
 * @param graph The world graph
 * @param params Action creation parameters
 * @returns The new ActionInProgress
 */
export function createAction(
  graph: WorldGraph,
  params: CreateActionParams,
): ActionInProgress {
  const actionId = `action_${++actionCounter}`;
  const action: ActionInProgress = {
    actionId,
    actorId: params.actorId,
    templateId: params.templateId,
    targetId: params.targetId,
    domain: params.domain,
    startTick: params.tick,
    duration: params.duration,
    progress: 0,
  };

  if (params.encounterId) {
    action.encounterId = params.encounterId;
  }

  // Add performing edge to graph to track active actions
  graph.addEdge({
    id: `perf_${actionId}`,
    source: params.actorId,
    target: params.templateId,
    type: 'performing',
    properties: {
      actionId,
      startTick: params.tick,
    },
  });

  return action;
}

/**
 * Advance action progress by 1 tick.
 * @param action The action to progress
 * @returns New ActionInProgress with incremented progress
 */
export function progressAction(
  action: ActionInProgress,
): ActionInProgress {
  return { ...action, progress: action.progress + 1 };
}

/**
 * Check if an action has completed.
 * @param action The action to check
 * @returns True if progress >= duration
 */
export function isActionComplete(action: ActionInProgress): boolean {
  return action.progress >= action.duration;
}

/**
 * Check if an agent has any active (unresolved) actions.
 * @param activeActions List of all actions
 * @param agentId The agent to check
 * @returns True if agent has no active actions
 */
export function isAgentIdle(
  activeActions: ActionInProgress[],
  agentId: string,
): boolean {
  return !activeActions.some(
    (a) => a.actorId === agentId && !a.resolved,
  );
}

/**
 * Get only the unresolved actions from a list.
 * @param actions List of all actions
 * @returns Array of actions that are not yet resolved
 */
export function getActiveActions(
  actions: ActionInProgress[],
): ActionInProgress[] {
  return actions.filter((a) => !a.resolved);
}

/**
 * Mark an action as resolved and remove its performing edge.
 * @param graph The world graph
 * @param action The action to complete
 * @param outcome The resolution outcome (e.g., 'success', 'failure')
 * @returns New ActionInProgress marked as resolved
 */
export function completeAction(
  graph: WorldGraph,
  action: ActionInProgress,
  outcome: string,
): ActionInProgress {
  // Find and remove the performing edge
  const edges = graph.getOutgoingEdges(action.actorId, 'performing');
  const perfEdge = edges.find(
    (e) => e.properties?.actionId === action.actionId,
  );
  if (perfEdge) {
    graph.removeEdge(perfEdge.id);
  }

  return { ...action, resolved: true, outcome };
}
