// src/engine/ambitionLifecycle.ts
// Pure evaluators for ambition milestone completion, abandonment detection,
// and overall progress assessment. No side effects — reads graph state, returns results.

import type { AmbitionTemplate, ActiveAmbition, AmbitionStatus } from '../types/ambition';
import type { ConditionGraph, ConditionContext } from './graphConditions';
import { evaluateGraphCondition } from './graphConditions';

// ─── Result type ─────────────────────────────────────────────────

export interface AmbitionProgressResult {
  status: AmbitionStatus;
  newMilestones: string[];
  allCompletedMilestones: string[];
}

// ─── Milestone checking ──────────────────────────────────────────

/**
 * Evaluate each milestone in the template that hasn't already been completed.
 * Returns an array of newly completed milestone IDs.
 */
export function checkMilestones(
  template: AmbitionTemplate,
  graph: ConditionGraph,
  agentId: string,
  alreadyCompleted: readonly string[],
  context?: ConditionContext,
): string[] {
  const completedSet = new Set(alreadyCompleted);
  const newlyCompleted: string[] = [];

  for (const milestone of template.milestones) {
    if (completedSet.has(milestone.id)) continue;
    if (evaluateGraphCondition(milestone.condition, graph, agentId, context)) {
      newlyCompleted.push(milestone.id);
    }
  }

  return newlyCompleted;
}

// ─── Abandonment checking ────────────────────────────────────────

/**
 * Evaluate each abandonment trigger in the template.
 * Returns true if ANY trigger fires.
 */
export function checkAbandonment(
  template: AmbitionTemplate,
  graph: ConditionGraph,
  agentId: string,
  context?: ConditionContext,
): boolean {
  for (const trigger of template.abandonmentTriggers) {
    if (evaluateGraphCondition(trigger.condition, graph, agentId, context)) {
      return true;
    }
  }
  return false;
}

// ─── Overall progress evaluation ─────────────────────────────────

/**
 * Evaluate an active ambition's progress: check abandonment first (takes priority),
 * then milestones, then completion threshold.
 *
 * `currentTick` is optional and only durational conditions consult it (THR-822). When
 * supplied, the ambition's own `assignedTick` becomes the measurement window, so a
 * settledness trigger measures time *under this ambition* rather than the agent's whole
 * stationary history — the guarantee that keeps such a trigger from firing on tick one.
 * Omit it and those conditions fail soft to `false`, leaving pre-THR-822 behaviour.
 *
 * `pursuesProperties` is the property bag of the `pursues` edge this ambition is held
 * by (THR-1298 slice 6). Edge-reading conditions — today only
 * `grievance_culprit_eliminated` — need it, because a minted drive's culprit lives on
 * the edge and not on the shared ambition node. Omit it and those conditions fail soft
 * to `false`, which is why an ambition evaluated outside an edge walk simply never
 * satisfies them rather than erroring.
 *
 * Note the context is now built whenever *either* input is present, not only when
 * there is a clock: an edge-reading condition must still work in a caller that passes
 * no tick.
 */
export function evaluateAmbitionProgress(
  template: AmbitionTemplate,
  active: ActiveAmbition,
  graph: ConditionGraph,
  agentId: string,
  currentTick?: number,
  pursuesProperties?: Record<string, unknown>,
): AmbitionProgressResult {
  const context: ConditionContext | undefined =
    currentTick === undefined && pursuesProperties === undefined
      ? undefined
      : {
          ...(currentTick !== undefined && {
            currentTick,
            windowStartTick: active.assignedTick,
          }),
          ...(pursuesProperties !== undefined && { pursuesProperties }),
        };

  // Abandonment takes priority
  if (checkAbandonment(template, graph, agentId, context)) {
    return {
      status: 'abandoned',
      newMilestones: [],
      allCompletedMilestones: [...active.completedMilestones],
    };
  }

  // Check for new milestones
  const newMilestones = checkMilestones(template, graph, agentId, active.completedMilestones, context);
  const allCompletedMilestones = [...active.completedMilestones, ...newMilestones];

  // Check completion threshold
  if (allCompletedMilestones.length >= template.completion.requires) {
    return {
      status: 'completed',
      newMilestones,
      allCompletedMilestones,
    };
  }

  return {
    status: 'active',
    newMilestones,
    allCompletedMilestones,
  };
}
