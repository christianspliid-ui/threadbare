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
  ActionStep,
  StepOutcome,
  ActionScale,
} from '../types/unifiedAction';
import type { EncounterSupportBinding, EncounterChoiceMemory } from '../types/encounter';
import { SCALE_PRIORITY, isStepSuccess, isStepFailure, isActionStepBranch } from '../types/unifiedAction';

// ─── Counter for deterministic IDs ──────────────────────────────

let actionCounter = 0;

/** Reset counter for testing. */
export function resetUnifiedActionCounter(): void {
  actionCounter = 0;
}

// ─── Step Resolution ───────────────────────────────────────────

/**
 * Resolve a step definition from a template, handling branch points.
 * If the step at `stepIndex` is a branch, looks up the choice made at
 * the branch's `branchOnStep` in the choice history and returns the
 * matching variant (or fallback).
 * If it's a plain ActionStep, returns it directly.
 */
export function resolveStepDefinition(
  template: UnifiedActionTemplate,
  stepIndex: number,
  choiceHistory?: readonly EncounterChoiceMemory[],
): ActionStep {
  const step = template.steps[stepIndex];
  if (!isActionStepBranch(step)) return step;

  // Find the choice at the branch point step
  const branchChoice = choiceHistory?.find(c => c.stepIndex === step.branchOnStep);
  if (!branchChoice) return step.fallback;

  return step.variants[branchChoice.choiceId] ?? step.fallback;
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
  readonly supportBindings?: readonly EncounterSupportBinding[];
  readonly clearanceGateIds?: readonly string[];
  /** Rarity tier after Focus buff was applied (THR-416). Omit if no buff was active. */
  readonly effectiveRarityTier?: import('../types/rarity').RarityTier;
}

/**
 * Create a new unified action from a template.
 * Computes initial stepDuration from the first step's duration range using rng.
 */
export function createUnifiedAction(params: CreateUnifiedActionParams): UnifiedAction {
  const {
    actorId, templateId, targetId, scale, source, tick, template, rng,
    essencePaid, supportBindings, clearanceGateIds, effectiveRarityTier,
  } = params;
  const firstStep = resolveStepDefinition(template, 0);
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
    supportBindings,
    clearanceGateIds,
    ...(effectiveRarityTier !== undefined && { effectiveRarityTier }),
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
  const currentStepDef = resolveStepDefinition(template, action.currentStep, action.choiceHistory);
  const newStepOutcomes = [...action.stepOutcomes, outcome];

  // Hard failure with fail_action → entire action fails
  // critical_failure always triggers fail_action regardless of template setting
  if (isStepFailure(outcome) && (
    currentStepDef.failBehavior === 'fail_action' || outcome === 'critical_failure'
  )) {
    const actionOutcome: UnifiedActionOutcome = outcome === 'critical_failure' ? 'critical_failure' : 'failure';
    return {
      ...action,
      resolved: true,
      outcome: actionOutcome,
      stepOutcomes: newStepOutcomes,
    };
  }

  // Check if this was the final step
  const nextStepIndex = action.currentStep + 1;
  if (nextStepIndex >= template.steps.length) {
    // Final step — determine overall outcome from the step history
    const finalOutcome = computeFinalActionOutcome(newStepOutcomes);
    return {
      ...action,
      resolved: true,
      outcome: finalOutcome,
      stepOutcomes: newStepOutcomes,
    };
  }

  // Advance to next step
  const nextStep = resolveStepDefinition(template, nextStepIndex, action.choiceHistory);
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
 * Zero-duration beats are allowed so an encounter step can resolve on the next tick
 * without waiting extra in-world time.
 */
function computeStepDuration(
  range: { readonly min: number; readonly max: number },
  rng: () => number,
): number {
  const { min, max } = range;
  if (min === max) return Math.max(0, min);
  return Math.max(0, min + Math.floor(rng() * (max - min + 1)));
}

/**
 * Phase 3: Determine the overall action outcome from the full step outcome history.
 *
 * Rules:
 * - All steps critical_success → critical_success
 * - Any step failure/critical_failure with continue_weakened → success_at_cost
 * - Any success_at_cost step → success_at_cost (costs propagate)
 * - Mix of successes only → success
 * - Critical success on final step upgrades success → critical_success
 *   (only if no failures/costs earlier)
 */
function computeFinalActionOutcome(stepOutcomes: readonly StepOutcome[]): UnifiedActionOutcome {
  if (stepOutcomes.length === 0) return 'failure';

  const hasAnyFailure = stepOutcomes.some(isStepFailure);
  const hasAnyCost = stepOutcomes.includes('success_at_cost') || stepOutcomes.includes('near_miss');
  const allCritSuccess = stepOutcomes.every(o => o === 'critical_success');
  const lastOutcome = stepOutcomes[stepOutcomes.length - 1];

  // If any step was a failure that continued (continue_weakened), the action
  // succeeded but at cost — the agent pushed through damaged
  if (hasAnyFailure) return 'success_at_cost';

  // Any step was success_at_cost → whole action is success_at_cost
  if (hasAnyCost) return 'success_at_cost';

  // All crits → critical_success
  if (allCritSuccess) return 'critical_success';

  // Final step crit with clean run → critical_success
  if (lastOutcome === 'critical_success') return 'critical_success';

  return 'success';
}
