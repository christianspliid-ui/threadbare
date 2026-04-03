/**
 * Unified Action Resolution — progress, collect, resolve, and execute
 * unified actions during the tick pipeline.
 *
 * These functions implement Phases 1-6 of the unified action pipeline:
 *   Phase 1: Progress all active actions (+1 stepProgress)
 *   Phase 2: Collect actions whose current step completed this tick
 *   Phase 3: Contestation detection and resolution (Sprint 4)
 *   Phase 4+5: Resolve and execute GraphOps
 *   Phase 6: Advance completed steps or mark action resolved
 *
 * Phase 7 (idle selection) is in a separate module (Sprint 3E).
 *
 * All functions are pure or take explicit state — no hidden globals.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import type {
  UnifiedAction,
  UnifiedActionTemplate,
  StepOutcome,
} from '../types/unifiedAction';
import type { ActionStepOutcomeMetadata } from '../types/unifiedAction';
import type { GraphOp } from '../types/graphOp';
import {
  progressUnifiedAction,
  isStepComplete,
  advanceStep,
  sortByPriority,
} from './unifiedActionLifecycle';
import { isStepSuccess, isStepFailure } from '../types/unifiedAction';
import { computeCapability } from './domainCapability';
import { resolveAction as resolveActionLegacy } from './resolution';
import { resolveAction as resolveActionShared, isSuccessOutcome } from './resolutionService';
import type { OutcomeType } from '../types/resolution';
import type { ResolutionInput } from '../types/resolution';
import { executeGraphOps } from './graphOpExecutor';
import { emitTrace } from './traceBuffer';
import {
  detectContestations,
  resolveContestationPair,
} from './contestation';
import { resolveHexActionFull, isHexTargetId, parseHexTargetId } from './hexActionBridge';
import { buildDiscoveryTickEvent } from './revelationResolver';
import { computeElderEssenceReward } from './elderEssenceReward';
import { consumeTreasureMapsAtHex } from './treasureMapConsumption';
import { appendEvent } from './encounterTimeline';
import type { HexMutation } from '../types/hexMutation';
import type { RevelationMutation } from './revelationResolver';
import { applyRevelationMutations } from './revelationResolver';
import { applyEncounterGrowth } from './capabilityGrowth';
import { handleTierPromotion } from './tierPromotion';
import type { ControlEffect } from '../types/controlEffect';
import { spawnControlEffect } from './controlEffectSpawn';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { ACTION_PRESSURE_SUCCESS, ACTION_PRESSURE_FAILURE } from '../types/sphereAffinity';
import { resolveRevelationAction } from './revelationEmitter';
import { accumulateImportance, getImportanceDelta, getRarityTier } from './rarity';
import type { TraceEntry } from '../types/trace';
import type { SimulationRuntime } from './simulationRuntime';
import type { BalanceEvent } from '../types/balanceEval';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { recordBalanceEvent } from './balanceTelemetry';
import { computeOutcomeConsequence } from './outcomeConsequences';
import { processFactionEncounterReputation } from './factionReputation';
import { processReputationTally } from './phaseReputationTraits';
import {
  canSpendQuintessence,
  getPushModifier,
  spendQuintessence,
  canResistOutcome,
  applyResistOutcome,
  RESIST_DOWNGRADE_CHANCE,
} from './quintessenceActions';
import { isProvingSliceTemplate } from './outcomeConsequences';
import {
  assembleRewardPool,
  BAD_OUTCOME_CATEGORY_WEIGHTS,
  drawFromPool,
  instantiateReward,
  resolveRewardRecipe,
} from './rewardPool';
import { recordReward } from './rewardHistory';
import { mulberry32 } from '../lib/prng';
import { buildPredicateContext, collectTestShapers } from './effectResolver';

// ─── Phase 1: Progress ──────────────────────────────────────────

/**
 * Increment stepProgress by 1 for all active (unresolved) unified actions.
 * Returns a new array — no mutation.
 */
export function progressAllActions(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return actions.map((a) => progressUnifiedAction(a));
}

// ─── Phase 2: Collect Completions ───────────────────────────────

/**
 * Find all actions whose current step completed this tick
 * (stepProgress >= stepDuration after progression).
 */
export function collectCompletions(
  actions: readonly UnifiedAction[],
): UnifiedAction[] {
  return actions.filter((a) => !a.resolved && isStepComplete(a));
}

// ─── Phase 4+5: Resolve and Execute ─────────────────────────────

/**
 * Resolve a single uncontested action step.
 *
 * Uses the existing resolution system: computes domain capability
 * for the step's reach, then resolves via sigmoid → d100.
 *
 * Returns the step outcome and which GraphOps to execute.
 */
export interface StepResolutionResult {
  outcome: StepOutcome;
  /** Phase 3: The raw outcome from the shared resolver, before any mapping. */
  rawOutcome: OutcomeType;
  opsToExecute: readonly GraphOp[];
  capability: number;
  probability: number;
  roll: number;
  /** Phase 3: Whether a push was attempted and the Q cost */
  pushAttempted: boolean;
  pushCost: number;
  /** Phase 3: Whether a resist was attempted, succeeded, and the Q cost */
  resistAttempted: boolean;
  resistSucceeded: boolean;
  resistCost: number;
  /** Phase 3: The outcome before resist downgrade, if resist happened */
  preResistOutcome?: StepOutcome;
}

/**
 * Phase 3: Map the shared resolver's OutcomeType to a StepOutcome.
 * Preserves the full outcome ladder instead of collapsing to binary.
 *
 * `success_at_cost` is generated when a roll succeeds but lands in the
 * near-miss zone (margin <= NEAR_MISS_MARGIN). This represents scraping
 * through with complications — the step proceeds but carries a cost.
 */
export function mapResolverOutcomeToStep(resolverOutcome: OutcomeType, nearMiss: boolean): StepOutcome {
  switch (resolverOutcome) {
    case 'critical_success': return 'critical_success';
    case 'success':
      // Near-miss success → success_at_cost (barely made it, complications follow)
      return nearMiss ? 'success_at_cost' : 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'failure': return 'failure';
    case 'critical_failure': return 'critical_failure';
  }
}

export function resolveUncontestedStep(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  state: GameState,
  rng: () => number,
): StepResolutionResult {
  const step = template.steps[action.currentStep];
  const noPushResist = { pushAttempted: false, pushCost: 0, resistAttempted: false, resistSucceeded: false, resistCost: 0 };

  if (!step) {
    return { outcome: 'failure', rawOutcome: 'failure', opsToExecute: [], capability: 0, probability: 0, roll: 0, ...noPushResist };
  }

  // Divine actions (difficulty 0) always succeed
  if (step.difficulty === 0) {
    return { outcome: 'success', rawOutcome: 'success', opsToExecute: step.onSuccess, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  // Ascendant (player) actions always succeed — their only gate is essence cost,
  // which is already paid at dispatch time. Capability rolls apply to NPC agents only.
  if (action.source === 'player') {
    return { outcome: 'success', rawOutcome: 'success', opsToExecute: step.onSuccess, capability: 1, probability: 1, roll: 0, ...noPushResist };
  }

  // Compute actor's domain capability for this step's reach
  const capability = computeCapability(state.graph, action.actorId, step.reach);

  // Sphere factor: small bonus if actor's location has sphere influence
  // (simplified — full implementation would check location sphere influence)
  const sphereFactor = 0;
  const predicateContext = buildPredicateContext(state.graph, action.actorId, step.reach);
  const testShapers = collectTestShapers(
    state.graph,
    action.actorId,
    step.reach,
    predicateContext,
    state.effectStates,
  );

  // Phase 3: Push — risky actions attempt to spend quintessence for better odds.
  // The actor node must be resolvable and the template must be push-eligible.
  let pushModifier = 0;
  let pushEvent: import('../types/quintessence').QuintessenceEvent | null = null;
  if (isPushEligible(action.templateId) && step.difficulty >= 0.3) {
    const actorNode = state.graph.getNode(action.actorId);
    if (actorNode && canSpendQuintessence(actorNode, 'push')) {
      pushModifier = getPushModifier(actorNode);
      pushEvent = spendQuintessence(actorNode, 'push', `action_push_${action.templateId}`, state.tick);
    }
  }

  // Phase 2: Use shared resolution service.
  // Unified action difficulty is already normalized (0..1) — pass through directly.
  const resolutionInput: ResolutionInput = {
    actorId: action.actorId,
    domain: step.reach,
    capability,
    difficulty: step.difficulty,
    sphereFactor,
    actionModifiers: pushModifier,
    testShapers,
  };

  const result = resolveActionShared(resolutionInput, rng, undefined, 'unified_action');

  // Phase 3: If push was attempted, queue the spend event
  if (pushEvent && state.pendingQuintessenceEvents) {
    state.pendingQuintessenceEvents.push(pushEvent);
  }

  // Phase 3: Preserve the full outcome ladder
  const nearMiss = result.rollBreakdown?.nearMiss ?? false;
  let outcome = mapResolverOutcomeToStep(result.outcome, nearMiss);

  // Phase 3: Resist — social/influence actions attempt to downgrade negative outcomes.
  // After a failure or critical_failure, the actor can spend Q for a chance to soften it.
  let resistEvent: import('../types/quintessence').QuintessenceEvent | null = null;
  if (isStepFailure(outcome) && isResistEligible(action.templateId)) {
    const actorNode = state.graph.getNode(action.actorId);
    if (actorNode && canResistOutcome(actorNode)) {
      resistEvent = applyResistOutcome(actorNode, `action_resist_${action.templateId}`, state.tick);
      if (resistEvent) {
        // Deterministic resist check using seeded PRNG
        const resistRoll = rng();
        if (resistRoll < RESIST_DOWNGRADE_CHANCE) {
          // Downgrade: critical_failure → failure, failure → success_at_cost
          if (outcome === 'critical_failure') {
            outcome = 'failure';
          } else if (outcome === 'failure') {
            outcome = 'success_at_cost';
          }
        }
        if (state.pendingQuintessenceEvents) {
          state.pendingQuintessenceEvents.push(resistEvent);
        }
      }
    }
  }

  const ops = isStepSuccess(outcome) ? step.onSuccess : step.onFailure;

  return {
    outcome,
    rawOutcome: result.outcome,
    opsToExecute: ops,
    capability,
    probability: result.probability,
    roll: result.roll,
    pushAttempted: pushEvent !== null,
    pushCost: pushEvent ? Math.abs(pushEvent.delta) : 0,
    resistAttempted: resistEvent !== null,
    resistSucceeded: resistEvent !== null && outcome !== mapResolverOutcomeToStep(result.outcome, nearMiss),
    resistCost: resistEvent ? Math.abs(resistEvent.delta) : 0,
    preResistOutcome: resistEvent ? mapResolverOutcomeToStep(result.outcome, nearMiss) : undefined,
  };
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

function getStepOutcomeMetadata(
  step: UnifiedActionTemplate['steps'][number] | undefined,
  outcome: StepOutcome,
): ActionStepOutcomeMetadata | undefined {
  if (!step) return undefined;
  return isStepSuccess(outcome) ? step.successMetadata : step.failureMetadata;
}

function applyOutcomeReputationDelta(
  state: GameState,
  actorId: string,
  metadata: ActionStepOutcomeMetadata | undefined,
): number {
  const delta = metadata?.reputationDelta ?? 0;
  if (delta === 0) return 0;

  const actorNode = state.graph.getNode(actorId);
  if (!actorNode) return 0;

  const current = (actorNode.properties?.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;
  actorNode.properties.reputationScore = Math.max(0, Math.min(1, current + delta));
  return delta;
}

function summarizeMetadataConsequences(
  metadata: ActionStepOutcomeMetadata | undefined,
  success: boolean,
  rewardName?: string,
): string {
  const parts: string[] = [];
  if (metadata?.reputationDelta && metadata.reputationDelta !== 0) {
    parts.push(metadata.reputationDelta > 0 ? 'gained reputation' : 'lost reputation');
  }
  if (rewardName) {
    parts.push(success ? `earned ${rewardName}` : `suffered ${rewardName}`);
  } else if (metadata?.rewardPool) {
    parts.push(success ? 'earned a reward' : 'lost equipment');
  }
  if (success && metadata?.tierPromotionEligible) {
    parts.push('eligible for promotion');
  }
  return parts.length > 0 ? ` — ${parts.join(', ')}` : '';
}

function mapStepOutcomeToRewardOutcome(outcome: StepOutcome): OutcomeType {
  switch (outcome) {
    case 'critical_success':
      return 'critical_success';
    case 'critical_failure':
      return 'critical_failure';
    case 'failure':
      return 'failure';
    case 'success':
    case 'success_at_cost':
      return 'success';
  }
}

function resolveUnifiedReward(
  action: UnifiedAction,
  outcome: StepOutcome,
  metadata: ActionStepOutcomeMetadata | undefined,
  state: GameState,
  tick: number,
  runtime?: SimulationRuntime,
): string | undefined {
  if (!metadata?.rewardPool) return undefined;

  const rng = mulberry32(
    state.seed + tick * 41 + hashString(action.actorId) + hashString(action.templateId),
  );
  const resolved = resolveRewardRecipe(
    metadata.rewardPool,
    mapStepOutcomeToRewardOutcome(outcome),
  );

  const badRoll = rng();
  const isBadOutcome = badRoll < resolved.badOutcomeChance;
  const effectiveRecipe = isBadOutcome
    ? { ...resolved, categoryWeights: BAD_OUTCOME_CATEGORY_WEIGHTS, tagFilters: undefined }
    : resolved;
  const pool = assembleRewardPool(state.graph, effectiveRecipe);
  const actorName = state.graph.getNode(action.actorId)?.name ?? '?';

  if (pool.length === 0) {
    recordReward({
      tick,
      agentId: action.actorId,
      agentName: actorName,
      encounterId: action.templateId,
      templateId: null,
      templateName: null,
      instanceId: null,
      category: null,
      tier: null,
      isBadOutcome,
      poolSize: 0,
      roll: null,
    });

    if (runtime) {
      recordBalanceEvent(runtime, {
        tick,
        kind: 'reward_granted',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        encounterId: action.templateId,
        rewardTemplateId: null,
        isBadOutcome,
        rewardPoolSize: 0,
      });
    }
    return undefined;
  }

  const drawRoll = rng();
  const templateId = drawFromPool(pool, drawRoll);
  if (!templateId) return undefined;

  const instantiation = instantiateReward(state.graph, templateId, action.actorId, tick);
  if (!instantiation) return undefined;

  const templateNode = state.graph.getNode(templateId);
  const tier = (templateNode?.properties?.tier as number) ?? 1;

  recordReward({
    tick,
    agentId: action.actorId,
    agentName: actorName,
    encounterId: action.templateId,
    templateId,
    templateName: templateNode?.name ?? '?',
    instanceId: instantiation.instanceId,
    category: instantiation.category,
    tier,
    isBadOutcome,
    poolSize: pool.length,
    roll: drawRoll,
  });

  if (runtime) {
    recordBalanceEvent(runtime, {
      tick,
      kind: 'reward_granted',
      agentId: action.actorId,
      sourceSystem: 'unified_action',
      encounterId: action.templateId,
      rewardTemplateId: templateId,
      rewardCategory: instantiation.category,
      rewardTier: tier,
      isBadOutcome,
      rewardPoolSize: pool.length,
    });
  }

  return instantiation.displayName;
}

/**
 * Execute the resolution result for a completed step:
 * 1. Execute the step's GraphOps
 * 2. Advance the action to the next step or mark resolved
 * 3. Generate tick events and traces
 *
 * Returns the updated action and any events generated.
 */
export function executeStepResult(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  outcome: StepOutcome,
  ops: readonly GraphOp[],
  state: GameState,
  rng: () => number,
  tick: number,
  resolutionStats?: { capability: number; probability: number; roll: number },
  runtime?: SimulationRuntime,
): { updatedAction: UnifiedAction; events: TickEvent[] } {
  const events: TickEvent[] = [];

  // Execute GraphOps (fail-soft)
  if (ops.length > 0) {
    const ctx = {
      actorId: action.actorId,
      targetId: action.targetId,
      locationId: action.targetId, // default — caller can override
      tick,
    };

    try {
      executeGraphOps(state.graph, [...ops], ctx);
    } catch {
      // Fail-soft: log but don't crash
    }
  }

  // Phase 3: Compute differentiated consequences for the proving slice
  const consequence = computeOutcomeConsequence(
    action.templateId, outcome, action.actorId, tick,
  );

  // Phase 3: Queue quintessence effect from outcome consequence
  if (consequence.quintessenceEvent && state.pendingQuintessenceEvents) {
    state.pendingQuintessenceEvents.push(consequence.quintessenceEvent);
  }

  // Apply capability growth from step resolution
  const step = template.steps[action.currentStep];
  const stepMetadata = getStepOutcomeMetadata(step, outcome);
  applyOutcomeReputationDelta(state, action.actorId, stepMetadata);
  if (step) {
    // Unified action difficulty is 0-1; scale to 0-100 for growth computation
    const difficultyScaled = step.difficulty * 100;
    const isSuccess = isStepSuccess(outcome);
    const tierPromotionEligible = Boolean(isSuccess && stepMetadata?.tierPromotionEligible);
    const growthResult = applyEncounterGrowth(
      state.graph,
      action.actorId,
      step.reach,
      difficultyScaled,
      isSuccess,
      tierPromotionEligible,
      consequence.growthMultiplier, // Phase 3: outcome-differentiated growth (1.5 crit, 0.5 at-cost)
    );

    // Handle tier promotion if crossed
    if (growthResult.tierCrossed) {
      const promotion = handleTierPromotion(
        state.graph,
        action.actorId,
        step.reach,
        growthResult.newTier,
      );

      const actorNode = state.graph.getNode(action.actorId);
      const agentName = actorNode?.name ?? 'An agent';
      if (promotion.traitGranted) {
        events.push({
          id: `ua_${action.actionId}_promotion`,
          tick,
          type: 'tier_promotion',
          message: `${agentName} reached ${step.reach} tier ${growthResult.newTier}: "${promotion.traitGranted}"`,
          significance: 0.8,
          actorId: action.actorId,
        });
      }

      // Balance telemetry: growth_applied
      if (runtime) {
        recordBalanceEvent(runtime, {
          tick,
          kind: 'growth_applied',
          agentId: action.actorId,
          sourceSystem: 'unified_action',
          templateId: action.templateId,
          reach: step.reach,
          growthReach: step.reach,
          growthDelta: growthResult.delta,
          newTier: growthResult.newTier,
        });
      }
    }
  }

  // Advance step or complete action
  const updatedAction = advanceStep(action, outcome, template, rng);
  const rewardName = updatedAction.resolved
    ? resolveUnifiedReward(action, outcome, stepMetadata, state, tick, runtime)
    : undefined;

  // Phase 5: migrated encounter templates should carry forward the real
  // faction reputation and reputation-tally progression they already had in
  // the legacy runtime. Non-encounter unified actions naturally no-op here.
  if (isStepSuccess(outcome)) {
    const encounterCompleted = updatedAction.resolved && isActionSuccess(updatedAction.outcome);
    processFactionEncounterReputation(
      state.graph,
      action.actorId,
      action.templateId,
      true,
      encounterCompleted,
      tick,
    );
    processReputationTally(
      state.graph,
      action.actorId,
      action.templateId,
      true,
      encounterCompleted,
      tick,
    );
  }

  // Emit trace
  emitTrace({
    id: 0,
    category: 'action_execution',
    tick,
    timestamp: tick,
    summary: `${template.name} step ${action.currentStep} ${outcome}`,
    agentId: action.actorId,
    templateId: action.templateId,
    actorId: action.actorId,
    outcome,
    opsApplied: outcome === 'success' ? ops.length : 0,
    opsFailed: outcome === 'failure' ? ops.length : 0,
    duration: action.stepDuration,
  } as any);

  // Timeline: ACTION_STEP event
  if (step && resolutionStats) {
    // Phase 3: map rich step outcome to timeline result label
    const timelineResult = isStepSuccess(outcome) ? 'PASS' : 'FAIL';
    const costSuffix = outcome === 'success_at_cost' ? '_COST' : '';
    const critPrefix = outcome === 'critical_success' ? 'CRIT_' : outcome === 'critical_failure' ? 'CRIT_' : '';
    appendEvent(action.actorId, {
      phase: 'ACTION_STEP',
      tick,
      template: template.name,
      step: `${action.currentStep + 1}/${template.steps.length}`,
      reach: step.reach,
      diff: step.difficulty,
      cap: resolutionStats.capability,
      prob: resolutionStats.probability,
      roll: resolutionStats.roll,
      result: `${critPrefix}${timelineResult}${costSuffix}`,
    });

    // Balance telemetry: step_resolved — Phase 3: preserves rich outcome type
    if (runtime) {
      recordBalanceEvent(runtime, {
        tick,
        kind: 'step_resolved',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        templateId: action.templateId,
        stepIndex: action.currentStep,
        reach: step.reach,
        difficulty: step.difficulty,
        capability: resolutionStats.capability,
        probability: resolutionStats.probability,
        roll: resolutionStats.roll,
        result: outcome as BalanceEvent['result'],
      });
    }
  }

  // Timeline: ACTION_END event when action fully resolves
  if (updatedAction.resolved) {
    appendEvent(action.actorId, {
      phase: 'ACTION_END',
      tick,
      template: template.name,
      status: updatedAction.outcome ?? 'unknown',
      stepResults: updatedAction.stepOutcomes.map(o => o === 'success' ? 'P' : 'F').join(''),
    });

    // Balance telemetry: action_resolved — Phase 3: rich outcome type
    if (runtime) {
      const actionResult = mapActionOutcomeToBalanceResult(updatedAction.outcome);
      const actionFinalStatus = isActionSuccess(updatedAction.outcome) ? 'completed' : 'abandoned';
      recordBalanceEvent(runtime, {
        tick,
        kind: 'action_resolved',
        agentId: action.actorId,
        sourceSystem: 'unified_action',
        templateId: action.templateId,
        result: actionResult,
        finalStatus: actionFinalStatus,
      });
    }
  }

  // Generate tick event
  const actorNode = state.graph.getNode(action.actorId);
  const actorName = actorNode?.name ?? 'An agent';

  if (updatedAction.resolved) {
    // Phase 3: outcome-differentiated event messages
    const outcomeMsg = describeActionOutcome(updatedAction.outcome);
    const baseSignificance = isActionSuccess(updatedAction.outcome) ? 0.6 : 0.4;
    // Phase 3: critical_success gets hardcoded 0.8; other tiers get base + consequence boost
    const significance = updatedAction.outcome === 'critical_success'
      ? 0.8
      : baseSignificance + consequence.significanceBoost;
    const metadataSuffix = summarizeMetadataConsequences(
      stepMetadata,
      isActionSuccess(updatedAction.outcome),
      rewardName,
    );
    events.push({
      id: `ua_${action.actionId}_resolved`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${outcomeMsg} ${template.name}${metadataSuffix}.`,
      significance,
      actorId: action.actorId,
    });
  } else {
    // Multi-step: report step progression with rich outcome
    const stepNum = action.currentStep + 1;
    const totalSteps = template.steps.length;
    const stepVerb = describeStepOutcome(outcome);
    // Phase 3: critical_success gets 0.7; other tiers get base 0.5 + consequence boost
    const stepSignificance = outcome === 'critical_success' ? 0.7 : 0.5 + consequence.significanceBoost;
    const metadataSuffix = summarizeMetadataConsequences(stepMetadata, isStepSuccess(outcome), rewardName);
    events.push({
      id: `ua_${action.actionId}_step${stepNum}`,
      tick,
      type: 'agent_action_resolved',
      message: `${actorName} ${stepVerb} in ${template.name} (step ${stepNum}/${totalSteps})${metadataSuffix}.`,
      significance: stepSignificance,
      actorId: action.actorId,
    });
  }

  return { updatedAction, events };
}

// ─── Phase 3: Push/Resist Template Sets ────────────────────────

/**
 * Risky/coercive actions where agents will attempt to push (spend Q for better odds).
 * Phase 3 proving slice: narrow seam, not all actions.
 */
const PUSH_ELIGIBLE_PREFIXES = [
  'action.shadow.assassinate',
  'action.iron.conquer',
  'action.gold.commission-assassination',
];

/**
 * Social/influence actions where agents will attempt to resist negative outcomes.
 * Phase 3 proving slice: narrow seam, not all actions.
 */
const RESIST_ELIGIBLE_PREFIXES = [
  'action.heart.',
  'action.shadow.recruit',
];

function isPushEligible(templateId: string): boolean {
  return PUSH_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

function isResistEligible(templateId: string): boolean {
  return RESIST_ELIGIBLE_PREFIXES.some(p => templateId.startsWith(p));
}

// ─── Phase 3: Outcome Helpers ──────────────────────────────────

/** Check if an action outcome is any form of success (including success_at_cost). */
function isActionSuccess(outcome?: UnifiedActionOutcome): boolean {
  return outcome === 'success' || outcome === 'critical_success' || outcome === 'success_at_cost' || outcome === 'contested_won';
}

/** Map UnifiedActionOutcome to BalanceEvent result field. */
function mapActionOutcomeToBalanceResult(outcome?: UnifiedActionOutcome): BalanceEvent['result'] {
  switch (outcome) {
    case 'critical_success': return 'critical_success';
    case 'success': return 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'critical_failure': return 'critical_failure';
    case 'contested_won': return 'success';
    case 'contested_lost': return 'failure';
    default: return 'failure';
  }
}

/** Human-readable verb for action-level outcomes. */
function describeActionOutcome(outcome?: UnifiedActionOutcome): string {
  switch (outcome) {
    case 'critical_success': return 'masterfully completed';
    case 'success': return 'completed';
    case 'success_at_cost': return 'completed at great cost';
    case 'contested_won': return 'won contested';
    case 'contested_lost': return 'lost contested';
    case 'critical_failure': return 'catastrophically failed';
    default: return 'failed';
  }
}

/** Human-readable verb for step-level outcomes. */
function describeStepOutcome(outcome: StepOutcome): string {
  switch (outcome) {
    case 'critical_success': return 'excels';
    case 'success': return 'progresses';
    case 'success_at_cost': return 'pushes through at cost';
    case 'failure': return 'stumbles';
    case 'critical_failure': return 'falters badly';
  }
}

// ─── Orchestrator Phase: Unified Action Progress ────────────────

/**
 * Combined orchestrator phase that replaces phaseActionProgress and
 * phaseEncounterProgression for actions in state.unifiedActions.
 *
 * Executes Phases 1-6 of the unified pipeline:
 * 1. Progress all active actions
 * 2. Collect completing actions
 * 3. Sort by priority (scale → FIFO)
 * 4-5. Resolve and execute each
 * 6. Advance or complete
 *
 * Returns partial GameState with updated unifiedActions and tickEvents.
 */
export function phaseUnifiedActionProgress(
  state: GameState,
  templates: readonly UnifiedActionTemplate[],
  rng: () => number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const events: TickEvent[] = [];
  const hexMutations: HexMutation[] = [];
  const revelationMutations: RevelationMutation[] = [];
  const spawnedEffects: ControlEffect[] = [];
  const spherePressures: SpherePressureEvent[] = [];

  // Phase 1: Progress all (defensive: state may not have unifiedActions yet)
  let actions = progressAllActions(state.unifiedActions ?? []);

  // Phase 2: Collect completions
  const completing = collectCompletions(actions);

  // Phase 3: Contestation detection and resolution
  const contestPairs = detectContestations(completing, templates);
  const contestedIds = new Set<string>();

  for (const pair of contestPairs) {
    const attacker = actions.find((a) => a.actionId === pair.attackerActionId);
    const defender = actions.find((a) => a.actionId === pair.defenderActionId);
    if (!attacker || !defender) continue;

    const atkTemplate = templates.find((t) => t.id === attacker.templateId);
    const defTemplate = templates.find((t) => t.id === defender.templateId);
    if (!atkTemplate || !defTemplate) continue;

    const contestResult = resolveContestationPair(
      attacker, defender, atkTemplate, defTemplate, state, rng,
    );

    // Apply attacker outcome
    const atkOps = contestResult.attackerOutcome === 'success'
      ? (atkTemplate.steps[attacker.currentStep]?.onSuccess ?? [])
      : (atkTemplate.steps[attacker.currentStep]?.onFailure ?? []);
    const { updatedAction: updAtk, events: atkEvents } = executeStepResult(
      attacker, atkTemplate, contestResult.attackerOutcome, atkOps, state, rng, state.tick,
      undefined, runtime,
    );

    // Apply defender outcome
    const defOps = contestResult.defenderOutcome === 'success'
      ? (defTemplate.steps[defender.currentStep]?.onSuccess ?? [])
      : (defTemplate.steps[defender.currentStep]?.onFailure ?? []);
    const { updatedAction: updDef, events: defEvents } = executeStepResult(
      defender, defTemplate, contestResult.defenderOutcome, defOps, state, rng, state.tick,
      undefined, runtime,
    );

    // Replace in actions array
    actions = actions.map((a) => {
      if (a.actionId === updAtk.actionId) return updAtk;
      if (a.actionId === updDef.actionId) return updDef;
      return a;
    });

    // Spawn ControlEffect for contested winners (TB-044)
    if (updAtk.resolved && isActionSuccess(updAtk.outcome) && atkTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(updAtk, atkTemplate, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }
    if (updDef.resolved && isActionSuccess(updDef.outcome) && defTemplate.durationMode === 'sustained') {
      const spawnResult = spawnControlEffect(updDef, defTemplate, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Sphere pressure: contested action resolutions also push pressure
    if (updAtk.resolved && atkTemplate.sphereAffinity && attacker.targetId) {
      spherePressures.push({
        targetEntityId: attacker.targetId,
        sphere: atkTemplate.sphereAffinity,
        magnitude: isActionSuccess(updAtk.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: attacker.actionId,
      });
    }
    if (updDef.resolved && defTemplate.sphereAffinity && defender.targetId) {
      spherePressures.push({
        targetEntityId: defender.targetId,
        sphere: defTemplate.sphereAffinity,
        magnitude: isActionSuccess(updDef.outcome) ? ACTION_PRESSURE_SUCCESS : ACTION_PRESSURE_FAILURE,
        source: 'divine_action',
        sourceId: defender.actionId,
      });
    }

    events.push(...atkEvents, ...defEvents);
    contestedIds.add(pair.attackerActionId);
    contestedIds.add(pair.defenderActionId);
  }

  // Phase 3b: Sort remaining (uncontested) completions by priority
  const uncontested = completing.filter((a) => !contestedIds.has(a.actionId));
  const sorted = sortByPriority(uncontested);

  // Phase 4-6: Resolve and execute uncontested actions
  for (const completing_action of sorted) {
    const template = templates.find((t) => t.id === completing_action.templateId);
    if (!template) continue; // fail-soft: skip unknown template

    // Resolve step
    const stepResult = resolveUncontestedStep(
      completing_action, template, state, rng,
    );
    const { outcome, opsToExecute, capability, probability, roll } = stepResult;

    // Phase 3: Emit push/resist telemetry
    if (runtime && stepResult.pushAttempted) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_push',
        agentId: completing_action.actorId,
        sourceSystem: 'unified_action',
        templateId: completing_action.templateId,
        spendKind: 'push',
        quintessenceDelta: -stepResult.pushCost,
      });
    }
    if (runtime && stepResult.resistAttempted) {
      recordBalanceEvent(runtime, {
        tick: state.tick,
        kind: 'quintessence_resist',
        agentId: completing_action.actorId,
        sourceSystem: 'unified_action',
        templateId: completing_action.templateId,
        spendKind: 'resist',
        resistSucceeded: stepResult.resistSucceeded,
        preResistOutcome: stepResult.preResistOutcome,
        postResistOutcome: stepResult.outcome,
        quintessenceDelta: -stepResult.resistCost,
      });
    }

    // Execute and advance
    const { updatedAction, events: stepEvents } = executeStepResult(
      completing_action, template, outcome, opsToExecute, state, rng, state.tick,
      { capability, probability, roll }, runtime,
    );

    // If this action targets a hex, route through hexActionBridge to get mutations
    if (
      completing_action.targetId &&
      isHexTargetId(completing_action.targetId) &&
      updatedAction.resolved
    ) {
      const coords = parseHexTargetId(completing_action.targetId);
      if (coords) {
        const finalOutcome = isActionSuccess(updatedAction.outcome) ? 'success' : 'failure';
        const result = resolveHexActionFull(
          completing_action.templateId,
          coords.col,
          coords.row,
          finalOutcome,
          state.tick,
          state.graph,
        );
        hexMutations.push(...result.hexMutations);
        revelationMutations.push(...result.revelationMutations);
        // Execute graph ops for hex actions that produce graph mutations (e.g., forge artifacts, spawn agents)
        if (result.graphOps.length > 0) {
          executeGraphOps(state.graph, result.graphOps, {
            actorId: state.ascendantId,
            targetId: completing_action.targetId,
            locationId: completing_action.targetId,
            tick: state.tick,
          }, { tick: state.tick, emitTrace: true });
        }
        // Emit discovery TickEvents and essence rewards for hidden site reveals
        if (result.hiddenSiteReveals.length > 0) {
          for (const reveal of result.hiddenSiteReveals) {
            events.push(buildDiscoveryTickEvent(reveal, state.tick));
            // Grant essence reward for discovery
            const reward = computeElderEssenceReward(reveal, state.tick);
            if (state.essencePool) {
              for (const [sphere, delta] of Object.entries(reward.deltas)) {
                const s = sphere as SphereName;
                if (state.essencePool[s] !== undefined) {
                  state.essencePool[s] += delta;
                }
              }
              events.push({
                id: `evt_essence_discovery_${reveal.sublocationId}_${state.tick}`,
                tick: state.tick,
                type: 'essence_gain',
                message: `Gained ${reward.totalReward.toFixed(1)} essence from ${reveal.sublocationName}`,
                significance: reveal.hasElderMagic ? 0.7 : 0.4,
                sphere: reveal.hasElderMagic ? 'spirit' : undefined,
                hexCoords: { col: reveal.hexCol, row: reveal.hexRow },
              });
            }
          }
          // Consume treasure maps held by agents at this hex
          const mapEvents = consumeTreasureMapsAtHex(
            state.graph, coords.col, coords.row, state.tick, 'hidden_site_discovered',
          );
          events.push(...mapEvents);
        }
      }
    }

    // PHASE-D (Fix 4): Player action importance accumulation.
    // When the ascendant fires an action that resolves successfully against an individual actor
    // target, accumulate importance on that target node.
    // Fail-soft: missing targetId, hex targets, missing node, non-individual nodes → skip silently.
    if (
      updatedAction.resolved &&
      isActionSuccess(updatedAction.outcome) &&
      completing_action.actorId === state.ascendantId &&
      completing_action.targetId &&
      !isHexTargetId(completing_action.targetId)
    ) {
      const targetNodeForRarity = state.graph.getNode(completing_action.targetId);
      if (targetNodeForRarity && targetNodeForRarity.properties?.actorType === 'individual') {
        const playerActionDelta = getImportanceDelta('player_action');
        const playerActionNewImportance = accumulateImportance(targetNodeForRarity, playerActionDelta);
        emitTrace({
          category: 'rarity_importance',
          tick: state.tick,
          nodeId: targetNodeForRarity.id,
          nodeName: targetNodeForRarity.name ?? targetNodeForRarity.id,
          source: 'player_action',
          delta: playerActionDelta,
          newImportance: playerActionNewImportance,
          currentTier: getRarityTier(targetNodeForRarity),
          summary: `importance +${playerActionDelta} for ${targetNodeForRarity.name ?? targetNodeForRarity.id} (now ${playerActionNewImportance})`,
          agentId: targetNodeForRarity.id,
        } as import('../types/trace').RarityImportanceTrace);
      }
    }

    // Spawn ControlEffect for successful sustained actions (TB-044)
    if (updatedAction.resolved && isActionSuccess(updatedAction.outcome)) {
      const spawnResult = spawnControlEffect(updatedAction, template, state.tick);
      if (spawnResult) {
        spawnedEffects.push(spawnResult.effect);
        events.push(spawnResult.event);
      }
    }

    // Revelation actions: if template has revelationAction metadata, dispatch
    // to resolveRevelationAction on successful resolution. Fail-soft wrapped.
    if (updatedAction.resolved && isActionSuccess(updatedAction.outcome) && template.revelationAction) {
      try {
        resolveRevelationAction(template.revelationAction, state, completing_action.targetId);
      } catch (revelationErr) {
        console.warn('[unifiedActionResolution] revelation action error:', revelationErr);
      }
    }

    // Sphere pressure: push pressure on action's target entity on resolution.
    // Fail-soft: skip if template has no sphereAffinity or action has no targetId.
    if (updatedAction.resolved && template.sphereAffinity && completing_action.targetId) {
      const magnitude = isActionSuccess(updatedAction.outcome)
        ? ACTION_PRESSURE_SUCCESS
        : ACTION_PRESSURE_FAILURE;
      spherePressures.push({
        targetEntityId: completing_action.targetId,
        sphere: template.sphereAffinity,
        magnitude,
        source: 'divine_action',
        sourceId: completing_action.actionId,
      });
    }

    // Replace action in array
    actions = actions.map((a) =>
      a.actionId === updatedAction.actionId ? updatedAction : a,
    );

    events.push(...stepEvents);
  }

  return {
    unifiedActions: actions,
    tickEvents: [...state.tickEvents, ...events],
    pendingHexMutations: [
      ...(state.pendingHexMutations ?? []),
      ...hexMutations,
    ],
    ...(revelationMutations.length > 0
      ? { hexRevelation: applyRevelationMutations(state.hexRevelation, revelationMutations) }
      : {}),
    // TB-044: Append spawned control effects from successful sustained actions
    ...(spawnedEffects.length > 0
      ? { controlEffects: [...(state.controlEffects ?? []), ...spawnedEffects] }
      : {}),
    // Sphere pressure: accumulate events for phaseSpherePressure to consume
    ...(spherePressures.length > 0
      ? { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...spherePressures] }
      : {}),
  };
}
