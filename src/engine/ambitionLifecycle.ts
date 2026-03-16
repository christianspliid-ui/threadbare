// src/engine/ambitionLifecycle.ts
// Pure evaluators for ambition milestone completion, abandonment detection,
// and overall progress assessment. No side effects — reads graph state, returns results.

import type { AmbitionTemplate, ActiveAmbition, AmbitionStatus } from '../types/ambition';
import type { ConditionGraph } from './graphConditions';
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
): string[] {
  const completedSet = new Set(alreadyCompleted);
  const newlyCompleted: string[] = [];

  for (const milestone of template.milestones) {
    if (completedSet.has(milestone.id)) continue;
    if (evaluateGraphCondition(milestone.condition, graph, agentId)) {
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
): boolean {
  for (const trigger of template.abandonmentTriggers) {
    if (evaluateGraphCondition(trigger.condition, graph, agentId)) {
      return true;
    }
  }
  return false;
}

// ─── Overall progress evaluation ─────────────────────────────────

/**
 * Evaluate an active ambition's progress: check abandonment first (takes priority),
 * then milestones, then completion threshold.
 */
export function evaluateAmbitionProgress(
  template: AmbitionTemplate,
  active: ActiveAmbition,
  graph: ConditionGraph,
  agentId: string,
): AmbitionProgressResult {
  // Abandonment takes priority
  if (checkAbandonment(template, graph, agentId)) {
    return {
      status: 'abandoned',
      newMilestones: [],
      allCompletedMilestones: [...active.completedMilestones],
    };
  }

  // Check for new milestones
  const newMilestones = checkMilestones(template, graph, agentId, active.completedMilestones);
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
