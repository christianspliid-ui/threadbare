/**
 * Activity Summary — derives UI-friendly activity data from UnifiedAction state.
 *
 * Sprint 5 — Task 5.2
 *
 * TODO(THR-1502): no production caller. The header used to read "Used by AgentDetailPanel
 * and tooltips"; that panel had no mount and THR-1492 deleted it, and no tooltip path
 * reaches this function. Either wire a reader or delete this module with its test — a
 * tested function nobody calls is green coverage over dead code.
 */

import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';
import type { WorldGraph } from './graph';

/**
 * Activity summary for unified action display.
 *
 * Declared here, alongside the only thing that builds one, since THR-1492. It used to
 * live in `components/Game/AgentDetailPanel.tsx` — a renderer with no production mount —
 * which made an engine module import a type out of a dead component. The producer owns
 * the shape; the panel was only ever one reader of it.
 */
export interface ActivitySummary {
  actionName: string;
  stepLabel: string; // e.g. "Step 2/3" or "3/5 ticks"
  progressFraction: number; // 0-1 for progress bar
  isContested: boolean;
  opponentName?: string;
}

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
