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
import { tierScaledDuration } from './targetTierScaling';

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
  /**
   * Properties of the target node, for steps whose duration is target-derived
   * (THR-1100). Only read when the step carries
   * `difficultyContext: 'target_tier_scaled'`; every other template ignores it.
   *
   * This is the whole reason THR-1073 could not scale duration: the draw happens
   * here, and this constructor had a target *id* but nothing to resolve it
   * against. Passing the properties — not a `WorldGraph` — keeps the lifecycle
   * free of graph traversal, and every caller that needs it already holds the
   * node (`graph.getNode(targetId)?.properties`). Omitting it is fail-soft: the
   * ramp clamps to its first entry, which is the pre-THR-1100 behaviour.
   */
  readonly targetProperties?: Readonly<Record<string, unknown>>;
}

/**
 * Create a new unified action from a template.
 * Computes initial stepDuration from the first step's duration range using rng,
 * scaled by the target's attachment tier when the step opts in (THR-1100).
 */
export function createUnifiedAction(params: CreateUnifiedActionParams): UnifiedAction {
  const {
    actorId, templateId, targetId, scale, source, tick, template, rng,
    essencePaid, supportBindings, clearanceGateIds, effectiveRarityTier,
    targetProperties,
  } = params;
  const firstStep = resolveStepDefinition(template, 0);
  const stepDuration = computeStepDuration(tierScaledDuration(firstStep, targetProperties), rng);

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
 * @param targetProperties Target node properties, for a next step whose duration
 *   is target-derived (THR-1100). Same contract as
 *   {@link CreateUnifiedActionParams.targetProperties}: read only under
 *   `difficultyContext: 'target_tier_scaled'`, fail-soft when omitted. Threaded
 *   here as well as at creation so the scaling is a property of the *step*, not
 *   of being step 0 — no tier-scaled template is multi-step today, and a later
 *   one must not silently draw the tier-1 range from step 1 onward.
 * @returns Updated action
 */
export function advanceStep(
  action: UnifiedAction,
  outcome: StepOutcome,
  template: UnifiedActionTemplate,
  rng: () => number,
  targetProperties?: Readonly<Record<string, unknown>>,
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
      hadCriticalStep: computeHadCriticalStep(newStepOutcomes),
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
      hadCriticalStep: computeHadCriticalStep(newStepOutcomes),
    };
  }

  // Advance to next step
  const nextStep = resolveStepDefinition(template, nextStepIndex, action.choiceHistory);
  const nextDuration = computeStepDuration(tierScaledDuration(nextStep, targetProperties), rng);

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
 * - Any step failure/critical_failure with continue_weakened → success_at_cost
 * - Any success_at_cost step → success_at_cost (costs propagate)
 * - Any critical_success step on an otherwise clean run → critical_success
 *   (THR-571: relaxed from "all-crit OR final-step-crit" so a single fluke of
 *   brilliance is not aggregated away when it lands mid-action)
 * - Mix of plain successes only → success
 */
function computeFinalActionOutcome(stepOutcomes: readonly StepOutcome[]): UnifiedActionOutcome {
  if (stepOutcomes.length === 0) return 'failure';

  const hasAnyFailure = stepOutcomes.some(isStepFailure);
  const hasAnyCost = stepOutcomes.includes('success_at_cost') || stepOutcomes.includes('near_miss');

  // If any step was a failure that continued (continue_weakened), the action
  // succeeded but at cost — the agent pushed through damaged
  if (hasAnyFailure) return 'success_at_cost';

  // Any step was success_at_cost → whole action is success_at_cost
  if (hasAnyCost) return 'success_at_cost';

  // THR-571: any critical-success step on a clean run (no failures/costs, guaranteed
  // by the early returns above) → critical_success. Previously required all-crit or a
  // final-step crit, which made surviving crits nearly unreachable at aggregation.
  if (stepOutcomes.some(o => o === 'critical_success')) return 'critical_success';

  return 'success';
}

/**
 * THR-571: Reduce a step-outcome history to the polarity of any mid-action critical
 * step, preserved on the resolved action so prose/aftermath can reference it even when
 * the final outcome collapses to success_at_cost. A disaster survived ('failure') wins
 * over a fluke of brilliance ('success') when both occurred; null when neither did.
 */
export function computeHadCriticalStep(
  stepOutcomes: readonly StepOutcome[],
): 'success' | 'failure' | null {
  if (stepOutcomes.some(o => o === 'critical_failure')) return 'failure';
  if (stepOutcomes.some(o => o === 'critical_success')) return 'success';
  return null;
}
