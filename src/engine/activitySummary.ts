/**
 * Activity Summary — derives UI-friendly activity data from UnifiedAction state.
 *
 * Used by AgentDetailPanel and tooltips to show an actor's current action.
 *
 * Sprint 5 — Task 5.2
 */

import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';
import type { WorldGraph } from './graph';
import type { ActivitySummary } from '../components/Game/AgentDetailPanel';

/**
 * Build an ActivitySummary for the given actor, or null if idle.
 *
 * Looks up their active (unresolved) UnifiedAction and derives
 * display-friendly data: name, progress, step label, contestation.
 */
export function getActivitySummary(
  actorId: string,
  unifiedActions: readonly UnifiedAction[],
  templates: readonly UnifiedActionTemplate[],
  graph: WorldGraph,
): ActivitySummary | null {
  const action = unifiedActions.find(a => a.actorId === actorId && !a.resolved);
  if (!action) return null;

  const template = templates.find(t => t.id === action.templateId);
  const actionName = template?.name ?? action.templateId;

  const totalSteps = template?.steps.length ?? 1;
  const isMultiStep = totalSteps > 1;

  let stepLabel: string;
  let progressFraction: number;

  if (isMultiStep) {
    stepLabel = `Step ${action.currentStep + 1}/${totalSteps}`;
    // Overall progress: completed steps + current step fraction
    const completedStepFraction = action.currentStep / totalSteps;
    const currentStepFraction = action.stepDuration > 0
      ? (action.stepProgress / action.stepDuration) / totalSteps
      : 0;
    progressFraction = Math.min(1, completedStepFraction + currentStepFraction);
  } else {
    stepLabel = `${action.stepProgress}/${action.stepDuration} ticks`;
    progressFraction = action.stepDuration > 0
      ? Math.min(1, action.stepProgress / action.stepDuration)
      : 0;
  }

  let opponentName: string | undefined;
  if (action.contestedWith) {
    const opponent = unifiedActions.find(a => a.actionId === action.contestedWith);
    if (opponent) {
      const opponentNode = graph.getNode(opponent.actorId);
      opponentName = opponentNode?.name ?? 'unknown';
    }
  }

  return {
    actionName,
    stepLabel,
    progressFraction,
    isContested: !!action.contestedWith,
    opponentName,
  };
}
