/**
 * Unified Action Lifecycle — create, progress, advance, complete, and query unified actions.
 *
 * Pure functions operating on UnifiedAction instances. No mutation — all
 * functions return new instances. Mirrors the pattern of actionLifecycle.ts
 * but supports multi-step actions with per-step fail behaviors and
 * scale-based priority sorting.
 *
 * Design doc: Docs/plans/2026-03-12-unified-action-system-design.md
 */

import type {
  UnifiedAction,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
  StepOutcome,
  ActionScale,
} from '../types/unifiedAction';
import { SCALE_PRIORITY } from '../types/unifiedAction';

// ─── Counter for deterministic IDs ──────────────────────────────

let actionCounter = 0;

/** Reset counter for testing. */
export function resetUnifiedActionCounter(): void {
  actionCounter = 0;
}

// ─── Creation ───────────────────────────────────────────────────

export interface CreateUnifiedActionParams {
  readonly actorId: string;
  readonly templateId: string;
  readonly targetId: string;
  readonly scale: ActionScale;
  readonly source: 'agent' | 'player' | 'system';
  readonly tick: number;
  readonly template: UnifiedActionTemplate;
  readonly rng: () => number;
  readonly essencePaid?: number;
}

/**
 * Create a new unified action from a template.
 * Computes initial stepDuration from the first step's duration range using rng.
 */
export function createUnifiedAction(params: CreateUnifiedActionParams): UnifiedAction {
  const { actorId, templateId, targetId, scale, source, tick, template, rng, essencePaid } = params;
  const firstStep = template.steps[0];
  const stepDuration = computeStepDuration(firstStep.duration, rng);

  return {
    actionId: `ua_${++actionCounter}`,
    actorId,
    templateId,
    targetId,
    scale,
    source,
    startTick: tick,
    currentStep: 0,
    stepProgress: 0,
    stepDuration,
    essencePaid,
    resolved: false,
    stepOutcomes: [],
  };
}

// ─── Progression ────────────────────────────────────────────────

/**
 * Advance an action's step progress by 1 tick.
 * Returns a new instance — no mutation.
 */
export function progressUnifiedAction(action: UnifiedAction): UnifiedAction {
  if (action.resolved) return action;
  return {
    ...action,
    stepProgress: action.stepProgress + 1,
  };
}

/**
 * Check if the current step has completed (progress >= duration).
 */
export function isStepComplete(action: UnifiedAction): boolean {
  return action.stepProgress >= action.stepDuration;
}

// ─── Step Advancement ───────────────────────────────────────────

/**
 * Advance to the next step or mark the action resolved.
 *
 * Behavior depends on the step outcome and the step's failBehavior:
 * - success on non-final step → advance to next step
 * - success on final step → mark resolved with 'success'
 * - failure with 'fail_action' → mark resolved with 'failure'
 * - failure with 'continue_weakened' → advance to next step anyway
 *
 * @param action Current action state
 * @param outcome The outcome of the just-completed step
 * @param template The action's template (needed for step definitions)
 * @param rng Random number generator for computing next step duration
 * @returns Updated action
 */
export function advanceStep(
  action: UnifiedAction,
  outcome: StepOutcome,
  template: UnifiedActionTemplate,
  rng: () => number,
): UnifiedAction {
  const currentStepDef = template.steps[action.currentStep];
  const newStepOutcomes = [...action.stepOutcomes, outcome];

  // Failure with fail_action → entire action fails
  if (outcome === 'failure' && currentStepDef.failBehavior === 'fail_action') {
    return {
      ...action,
      resolved: true,
      outcome: 'failure',
      stepOutcomes: newStepOutcomes,
    };
  }

  // Check if this was the final step
  const nextStepIndex = action.currentStep + 1;
  if (nextStepIndex >= template.steps.length) {
    // Final step — determine overall outcome
    const hasAnyFailure = newStepOutcomes.includes('failure');
    const finalOutcome: UnifiedActionOutcome = hasAnyFailure ? 'failure' : 'success';
    return {
      ...action,
      resolved: true,
      outcome: finalOutcome,
      stepOutcomes: newStepOutcomes,
    };
  }

  // Advance to next step
  const nextStep = template.steps[nextStepIndex];
  const nextDuration = computeStepDuration(nextStep.duration, rng);

  return {
    ...action,
    currentStep: nextStepIndex,
    stepProgress: 0,
    stepDuration: nextDuration,
    stepOutcomes: newStepOutcomes,
  };
}

// ─── Completion ─────────────────────────────────────────────────

/**
 * Mark an action as resolved with a specific outcome.
 * Used for external resolution (e.g., contestation outcomes).
 */
export function completeUnifiedAction(
  action: UnifiedAction,
  outcome: UnifiedActionOutcome,
): UnifiedAction {
  return {
    ...action,
    resolved: true,
    outcome,
  };
}

// ─── Queries ────────────────────────────────────────────────────

/**
 * Check if an agent has no active (unresolved) unified actions.
 */
export function isUnifiedAgentIdle(
  actions: readonly UnifiedAction[],
  agentId: string,
): boolean {
  return !actions.some((a) => a.actorId === agentId && !a.resolved);
}

/**
 * Get only the unresolved actions from a list.
 */
export function getActiveUnifiedActions(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return actions.filter((a) => !a.resolved);
}

/**
 * Sort actions by priority: scale band first (cosmic → personal),
 * then FIFO by startTick within the same band.
 *
 * Returns a new sorted array — no mutation.
 */
export function sortByPriority(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return [...actions].sort((a, b) => {
    const scaleDiff = SCALE_PRIORITY[a.scale] - SCALE_PRIORITY[b.scale];
    if (scaleDiff !== 0) return scaleDiff;
    return a.startTick - b.startTick;
  });
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Compute step duration from a range using the provided RNG.
 * Always returns at least 1 (minimum 1 tick rule).
 */
function computeStepDuration(
  range: { readonly min: number; readonly max: number },
  rng: () => number,
): number {
  const { min, max } = range;
  if (min === max) return Math.max(1, min);
  return Math.max(1, min + Math.floor(rng() * (max - min + 1)));
}
