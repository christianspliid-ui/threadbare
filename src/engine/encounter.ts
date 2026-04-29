/**
 * Encounter Engine — initiation, resolution, and progression.
 *
 * Encounters are linear step sequences where agents undergo narrative growth.
 * Each step uses sigmoid → d100 resolution based on domain capability.
 * Success advances to the next step; failure abandons the encounter.
 */

import type { GameState } from '../types/gameState';
import type {
  EncounterProgress,
  EncounterOutcome,
  EncounterResolutionSnapshot,
  LeverageHistoryEntry,
} from '../types/encounter';
import {
  LEVERAGE_STEP_SUCCESS,
  LEVERAGE_STEP_FAILURE,
  LEVERAGE_DIFFICULTY_SCALE,
} from '../types/encounter';
import type { EncounterResolutionTrace } from '../types/trace';
import {
  getAnyEncounterById,
} from '../data/encounter-content';
import { computeCapability } from './domainCapability';
import { resolveAction as resolveActionShared, normalizeLegacyDifficulty, isSuccessOutcome, isFailureOutcome } from './resolutionService';
import type { ResolutionInput, OutcomeType, ResolutionResult } from '../types/resolution';
import { computeResolutionModifiers } from './resolutionModifiers';
import { createEncounterFailureErosion } from './quintessenceActions';
import { QUINTESSENCE_ENCOUNTER_FAILURE_EROSION } from '../types/quintessence';
import { emitTrace } from './traceBuffer';
import { applyEncounterGrowth } from './capabilityGrowth';
import { handleTierPromotion } from './tierPromotion';
import type { GrowthResult } from './capabilityGrowth';
import type { PromotionResult } from './tierPromotion';
import { appendEvent } from './encounterTimeline';
import { computeInitialLeverage, isSocialSceneTemplate } from './socialLeverage';
import { selectCounterArgument, applyCounterModifier } from './socialCounterArgument';
import type { ReachDomain } from '../types/traits';
import type { ActionStep, ActionStepOrBranch } from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';

// ─── Group Scene Constants ────────────────────────────────────────────────

/** Leverage bonus per supporting participant in a group scene (best_member mode). */
export const LEVERAGE_GROUP_SUPPORT_BONUS = 0.03;

/** Minimum agents for a group scene (actor + target + participants). */
export const GROUP_SCENE_MIN_PARTICIPANTS = 3;

/** Maximum agents for a group scene. */
export const GROUP_SCENE_MAX_PARTICIPANTS = 6;

// ─── ActionStep Compatibility ─────────────────────────────────────────────────
// getAnyEncounterById returns UnifiedActionTemplate (steps: ActionStepOrBranch[]).
// These helpers bridge the gap while encounter.ts still uses EncounterStep-style logic.

function toConcreteStep(stepOrBranch: ActionStepOrBranch): ActionStep {
  return (isActionStepBranch(stepOrBranch) ? stepOrBranch.fallback : stepOrBranch) as ActionStep;
}

function makeStepId(encounterId: string, stepIndex: number): string {
  return `${encounterId}.step${stepIndex}`;
}

function makeStepName(step: ActionStep, stepIndex: number): string {
  return step.narrativeTemplate?.slice(0, 50) ?? `Step ${stepIndex + 1}`;
}

function getStepDuration(stepOrBranch: ActionStepOrBranch): number {
  const s = toConcreteStep(stepOrBranch);
  const dur = s.duration as unknown;
  // ActionStep: { min, max } object. Legacy EncounterStep mocks: number or absent.
  if (dur !== null && typeof dur === 'object') {
    return (dur as { min: number }).min;
  }
  return (dur as number | undefined) ?? 1;
}

function buildOutcomeCompat(step: ActionStep, success: boolean): EncounterOutcome {
  // Legacy EncounterStep mocks have onSuccess/onFailure as EncounterOutcome objects.
  // UAT ActionStep has onSuccess/onFailure as readonly GraphOp[] (arrays).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyOn = success ? (step as any).onSuccess : (step as any).onFailure;
  if (!Array.isArray(legacyOn) && typeof legacyOn === 'object' && legacyOn !== null && 'narrative' in legacyOn) {
    return legacyOn as EncounterOutcome;
  }
  const meta = success ? step.successMetadata : step.failureMetadata;
  return {
    narrative: (success ? step.successAfterimage : step.failureAfterimage) ?? '',
    reputationDelta: meta?.reputationDelta,
    tierPromotionEligible: meta?.tierPromotionEligible,
    rewardPool: meta?.rewardPool,
    appliesWound: false,
  };
}

// ────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ────────────────────────────────────────────────────────────────────────

/**
 * Check whether a step's conditional gate is satisfied by the current progress.
 * Returns true if the condition is met (step should fire).
 * Returns false if the condition is NOT met (step should be skipped).
 */
function isConditionMet(
  conditional: NonNullable<import('../types/encounter').EncounterStep['conditional']>,
  progress: import('../types/encounter').EncounterProgress,
): boolean {
  const leverage = progress.leverage ?? 0;
  const margin = progress.lastStepMargin ?? 0;

  switch (conditional.type) {
    case 'leverage_range': {
      const min = conditional.leverageMin ?? 0;
      const max = conditional.leverageMax ?? 1;
      return leverage >= min && leverage <= max;
    }
    case 'partial_success': {
      const min = conditional.marginMin ?? -Infinity;
      const max = conditional.marginMax ?? Infinity;
      return margin >= min && margin <= max;
    }
    default:
      return true; // Unknown condition type — don't skip
  }
}

/**
 * Find the participant with the highest capability in a given reach domain.
 * Used by best_member group resolution mode.
 * Fail-soft: returns first participant if none have measurable capability.
 */
function findBestCapabilityParticipant(
  state: import('../types/gameState').GameState,
  participantIds: string[],
  reach: ReachDomain,
): string {
  let bestId = participantIds[0];
  let bestCap = -1;
  for (const id of participantIds) {
    const cap = computeCapability(state.graph, id, reach);
    if (cap > bestCap) {
      bestCap = cap;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * Apply group participant support bonuses to leverage.
 * In best_member mode: each non-resolving supporter adds LEVERAGE_GROUP_SUPPORT_BONUS.
 * Modifies progress.leverage in place.
 */
export function applyGroupSupportLeverage(
  progress: EncounterProgress,
  resolvingAgentId: string,
): void {
  if (!progress.participantIds || progress.leverage === undefined) return;

  const supporters = progress.participantIds.filter(id => id !== resolvingAgentId);
  if (supporters.length === 0) return;

  const bonus = supporters.length * LEVERAGE_GROUP_SUPPORT_BONUS;
  const leverageBefore = progress.leverage;
  progress.leverage = Math.min(1.0, progress.leverage + bonus);

  const delta = progress.leverage - leverageBefore;
  if (delta > 0) {
    if (!progress.leverageHistory) progress.leverageHistory = [];
    // Record group support as anonymous — no specific source
    progress.leverageHistory.push({
      stepIndex: progress.currentEncounterIndex,
      delta,
      source: 'step_success',
    });
  }
}

/**
 * Resolve a group scene step using best_member mode:
 * - Find the participant with the best capability in the step's reach
 * - Resolve as if that participant is the actor
 * - Apply group support leverage bonus
 *
 * For consensus/majority modes, caller should resolve each participant
 * individually and aggregate results — not yet implemented here.
 *
 * Returns the ID of the resolving participant (the best member).
 */
export function selectGroupStepResolver(
  state: import('../types/gameState').GameState,
  progress: EncounterProgress,
  stepReach: ReachDomain,
): string {
  if (!progress.participantIds || progress.participantIds.length === 0) {
    return progress.actorId;
  }

  const allParticipants = [
    progress.actorId,
    ...(progress.participantIds ?? []),
  ];

  return findBestCapabilityParticipant(state, allParticipants, stepReach);
}

// ────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────

/**
 * Initiate an encounter for an actor.
 * Creates a new EncounterProgress record, adds to state, emits trace.
 */
export function initiateEncounter(
  state: GameState,
  actorId: string,
  encounterId: string,
  tick: number,
  targetAgentId?: string,
): EncounterProgress {
  const encounter = getAnyEncounterById(encounterId);
  const firstStepDuration = encounter?.steps[0] ? getStepDuration(encounter.steps[0]) : 1;

  // Compute initial leverage for social scene templates
  let initialLeverage: number | undefined;
  let initialLeverageHistory: import('../types/encounter').LeverageHistoryEntry[] | undefined;
  if (encounter && isSocialSceneTemplate(encounter.steps as ReadonlyArray<{ leverageOnSuccess?: number }>) && targetAgentId) {
    const leverageResult = computeInitialLeverage(state.graph, actorId, targetAgentId);
    initialLeverage = leverageResult.leverage;
    initialLeverageHistory = leverageResult.history;
  }

  const progress: EncounterProgress = {
    encounterId,
    actorId,
    targetAgentId,
    currentEncounterIndex: 0,
    history: [],
    resolutionHistory: [],
    status: 'active',
    startedTick: tick,
    occupiedUntilTick: tick + firstStepDuration,
    ...(initialLeverage !== undefined ? {
      leverage: initialLeverage,
      leverageHistory: initialLeverageHistory ?? [],
    } : {}),
  };

  state.encounterProgress.push(progress);

  const firstStepRaw = encounter?.steps[0];
  const firstStep = firstStepRaw ? toConcreteStep(firstStepRaw) : undefined;
  const trace: Omit<EncounterResolutionTrace, 'id' | 'timestamp'> = {
    tick,
    category: 'encounter_resolution',
    agentId: actorId,
    encounterId,
    actorId,
    stepId: firstStep ? makeStepId(encounterId, 0) : 'unknown',
    stepName: firstStep ? makeStepName(firstStep, 0) : 'Unknown Step',
    difficulty: firstStep?.difficulty ?? 0,
    capability: 0,
    probability: 0,
    roll: 0,
    success: false,
    status: 'initiated',
    traitChanges: [],
    summary: `Encounter initiated: ${encounterId}`,
  };

  emitTrace(trace);

  // Timeline: ENCOUNTER_START
  appendEvent(actorId, {
    phase: 'ENCOUNTER_START',
    tick,
    encounter: encounterId,
    steps: encounter?.steps.length ?? 0,
    threat: firstStep?.difficulty ?? 0,
    reach: firstStep?.reach ?? 'unknown',
  });

  return progress;
}

/**
 * Resolve a single step within an encounter.
 * Uses sigmoid → d100 resolution on the step's primary reach domain.
 * Returns success flag and the appropriate EncounterOutcome.
 */
export function resolveEncounter(
  state: GameState,
  progress: EncounterProgress,
  deterministicRoll?: number,
): {
  success: boolean;
  outcome: EncounterOutcome;
  outcomeType: OutcomeType;
  resolution: ResolutionResult;
  resolutionSnapshot: EncounterResolutionSnapshot;
  growth?: GrowthResult;
  promotion?: PromotionResult;
  /** True when the selected outcome has appliesWound: true. Drives mid-encounter promotion. */
  woundApplied: boolean;
} {
  const buildFailSoftResolution = (
    stepId: string,
    stepName: string,
    reach: ResolutionInput['domain'],
    difficulty: number,
  ): { resolution: ResolutionResult; resolutionSnapshot: EncounterResolutionSnapshot } => {
    const probability = 0;
    const roll = deterministicRoll ?? 100;
    const resolution: ResolutionResult = {
      outcome: 'failure',
      roll,
      probability,
      margin: roll,
      forecast: {
        probability,
        forecastTier: 'doomed',
        topContributors: [],
      },
      sourceSystem: 'encounter',
    };
    return {
      resolution,
      resolutionSnapshot: {
        stepIndex: progress.currentEncounterIndex,
        stepId,
        stepName,
        reach,
        difficulty,
        normalizedDifficulty: 0,
        capability: 0,
        modifierTotal: 0,
        probability,
        threshold: 0,
        roll,
        success: false,
        outcomeType: 'failure',
        tick: state.tick,
      },
    };
  };

  const encounter = getAnyEncounterById(progress.encounterId);
  if (!encounter) {
    // Graceful fallback: failed encounter with placeholder outcome
    const { resolution, resolutionSnapshot } = buildFailSoftResolution(
      'unknown',
      'Unknown Step',
      'iron',
      0,
    );
    return {
      success: false,
      outcomeType: 'failure',
      outcome: { narrative: 'The encounter dissolves into shadow.' },
      resolution,
      resolutionSnapshot,
      woundApplied: false,
    };
  }

  const stepRaw = encounter.steps[progress.currentEncounterIndex];
  const step = stepRaw ? toConcreteStep(stepRaw) : undefined;
  if (!step) {
    const { resolution, resolutionSnapshot } = buildFailSoftResolution(
      'unknown',
      'Unknown Step',
      encounter.reach,
      0,
    );
    return {
      success: false,
      outcomeType: 'failure',
      outcome: { narrative: 'No further trial awaits.' },
      resolution,
      resolutionSnapshot,
      woundApplied: false,
    };
  }

  // Compute actor's capability in the step's reach domain
  const capability = computeCapability(state.graph, progress.actorId, step.reach);

  // Resolve actor's location for terrain modifiers
  const locEdges = state.graph.getOutgoingEdges(progress.actorId, 'located_at');
  const locationId = locEdges.length > 0 ? locEdges[0].target : '';

  // Compute resolution modifiers from full pipeline
  const modifiers = computeResolutionModifiers(
    state.graph,
    progress.actorId,
    locationId,
    step.reach,
    encounter.sphereAffinity,
    state.effectStates,
  );

  // ─── Divine effects: Tip the Scales ─────────────────────────────────────
  // If the player used 'Tip the Scales' on this agent, consume the leverage
  // shift before computing effective difficulty.
  const actorNode = state.graph.getNode(progress.actorId);
  const leverageShift = (actorNode?.properties.socialLeverageShift as number | undefined) ?? 0;
  if (leverageShift > 0 && progress.leverage !== undefined) {
    progress.leverage = Math.min(1.0, (progress.leverage ?? 0) + leverageShift);
    if (!progress.leverageHistory) progress.leverageHistory = [];
    progress.leverageHistory.push({
      stepIndex: progress.currentEncounterIndex,
      delta: leverageShift,
      source: 'divine_tip_scales',
    });
    // Consume the one-shot effect
    delete (actorNode!.properties as Record<string, unknown>).socialLeverageShift;
  }

  // ─── Divine effects: Embolden ─────────────────────────────────────────────
  // If the player used 'Embolden' on this agent, the target's counter-argument
  // is suppressed for this step. Consume the one-shot flag so it doesn't persist.
  const counterResistanceActive = (actorNode?.properties.counterResistanceActive as boolean | undefined) ?? false;
  if (counterResistanceActive) {
    delete (actorNode!.properties as Record<string, unknown>).counterResistanceActive;
  }

  // ─── Leverage: modify effective difficulty ──────────────────────────────
  // Social scene steps with leverageModifiesDifficulty=true get easier as
  // leverage accumulates. Formula: effective = base × (1 - leverage × scale).
  const currentLeverage = progress.leverage ?? 0;
  let effectiveDifficulty = step.difficulty;
  if (step.leverageModifiesDifficulty && currentLeverage > 0) {
    effectiveDifficulty = step.difficulty * (1.0 - currentLeverage * LEVERAGE_DIFFICULTY_SCALE);
    effectiveDifficulty = Math.max(1, effectiveDifficulty); // floor at 1
  }

  // ─── Counter-argument difficulty modifier ────────────────────────────────
  // Social scene counter steps (conditional: leverage_range) apply a personality-
  // driven difficulty modifier from the target's axiological profile.
  // Embolden (counterResistanceActive, consumed above) suppresses this entirely.
  if (
    step.conditional?.type === 'leverage_range' &&
    progress.targetAgentId &&
    !counterResistanceActive
  ) {
    const counter = selectCounterArgument(
      state.graph,
      progress.targetAgentId,
      step.reach,
      currentLeverage,
    );
    effectiveDifficulty = applyCounterModifier(effectiveDifficulty, counter);
  }

  // UAT ActionStep.duration is {min,max}; legacy EncounterStep.duration is number/absent.
  // Apply normalizeLegacyDifficulty (÷100) only for legacy-style difficulty (0-100 scale).
  const isUATStep = step.duration !== null && typeof step.duration === 'object';
  const normalizedDifficulty = isUATStep ? effectiveDifficulty : normalizeLegacyDifficulty(effectiveDifficulty);

  const resolutionInput: ResolutionInput = {
    actorId: progress.actorId,
    domain: step.reach,
    capability,
    difficulty: normalizedDifficulty,
    sphereFactor: 0,
    actionModifiers: modifiers.totalModifier,
    testShapers: modifiers.testShapers,
  };

  // The orchestrator always provides deterministicRoll (pre-computed from seeded RNG).
  // The rng fallback is for test callers that omit the roll — Math.random is acceptable
  // since NFP #3 determinism is enforced at the orchestrator level, not here.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const resolution = resolveActionShared(
    resolutionInput,
    Math.random,
    deterministicRoll,
    'encounter',
  );
  const success = isSuccessOutcome(resolution.outcome);
  const resolutionSnapshot: EncounterResolutionSnapshot = {
    stepIndex: progress.currentEncounterIndex,
    stepId: makeStepId(progress.encounterId, progress.currentEncounterIndex),
    stepName: makeStepName(step, progress.currentEncounterIndex),
    reach: step.reach,
    difficulty: effectiveDifficulty,
    normalizedDifficulty,
    capability,
    modifierTotal: modifiers.totalModifier,
    probability: resolution.probability,
    threshold: resolution.rollBreakdown?.threshold ?? Math.floor(resolution.probability * 100),
    roll: resolution.roll,
    success,
    outcomeType: resolution.outcome,
    rollBreakdown: resolution.rollBreakdown,
    tick: state.tick,
  };

  // ─── Leverage: accumulate after resolution ───────────────────────────────
  if (progress.leverage !== undefined) {
    const rawDelta = success
      ? (step.leverageOnSuccess ?? LEVERAGE_STEP_SUCCESS)
      : (step.leverageOnFailure ?? LEVERAGE_STEP_FAILURE);

    // Only accumulate if the step has leverage config defined
    if (step.leverageOnSuccess !== undefined || step.leverageOnFailure !== undefined) {
      const leverageBefore = progress.leverage;
      progress.leverage = Math.max(0.0, Math.min(1.0, progress.leverage + rawDelta));

      const entry: LeverageHistoryEntry = {
        stepIndex: progress.currentEncounterIndex,
        delta: progress.leverage - leverageBefore,
        source: success ? 'step_success' : 'step_failure',
      };
      if (!progress.leverageHistory) progress.leverageHistory = [];
      progress.leverageHistory.push(entry);
    }
  }

  // Build EncounterOutcome from ActionStep metadata
  const outcome = buildOutcomeCompat(step, success);

  const _syntheticStepId = makeStepId(progress.encounterId, progress.currentEncounterIndex);
  const trace: Omit<EncounterResolutionTrace, 'id' | 'timestamp'> = {
    tick: state.tick,
    category: 'encounter_resolution',
    agentId: progress.actorId,
    encounterId: progress.encounterId,
    actorId: progress.actorId,
    stepId: _syntheticStepId,
    stepName: makeStepName(step, progress.currentEncounterIndex),
    difficulty: step.difficulty,
    capability,
    probability: resolution.probability,
    roll: resolution.roll,
    success,
    status: 'active',
    traitChanges: outcome.traitChanges ?? [],
    summary: `${_syntheticStepId}: ${resolution.outcome} (roll ${resolution.roll.toFixed(2)})`,
  };

  emitTrace(trace);

  // Timeline: ENCOUNTER_STEP
  appendEvent(progress.actorId, {
    phase: 'ENCOUNTER_STEP',
    tick: state.tick,
    step: `${progress.currentEncounterIndex + 1}/${encounter!.steps.length}`,
    reach: step.reach,
    diff: step.difficulty,
    cap: Math.round(capability * 100),
    prob: resolution.probability,
    roll: resolution.roll,
    result: success ? 'PASS' : 'FAIL',
  });

  // Phase 2: Emit quintessence erosion on encounter failure.
  // This is the live non-player quintessence pressure seam.
  if (isFailureOutcome(resolution.outcome)) {
    const erosionEvent = createEncounterFailureErosion(
      progress.actorId,
      QUINTESSENCE_ENCOUNTER_FAILURE_EROSION,
      state.tick,
    );
    // Append to pending events — phaseQuintessence will process them
    if (!state.pendingQuintessenceEvents) {
      state.pendingQuintessenceEvents = [];
    }
    state.pendingQuintessenceEvents.push(erosionEvent);
  }

  // Apply capability growth from encounter step resolution
  const tierPromotionEligible = (success && outcome.tierPromotionEligible) ?? false;
  const growth = applyEncounterGrowth(
    state.graph,
    progress.actorId,
    step.reach,
    step.difficulty,
    success,
    tierPromotionEligible,
  );

  // Handle tier promotion if crossed
  let promotion: PromotionResult | undefined;
  if (growth.tierCrossed) {
    promotion = handleTierPromotion(
      state.graph,
      progress.actorId,
      step.reach,
      growth.newTier,
    );
  }

  // Store margin for conditional step evaluation in advanceEncounter()
  progress.lastStepMargin = resolution.roll - (resolution.rollBreakdown?.threshold ?? (resolution.probability * 100));

  return {
    success,
    outcome,
    outcomeType: resolution.outcome,
    resolution,
    resolutionSnapshot,
    growth,
    promotion,
    woundApplied: outcome.appliesWound === true,
  };
}

/**
 * Advance encounter progress after resolving a step.
 * - Success + more steps: increment currentEncounterIndex
 * - Success + final step: set status to completed
 * - Failure: set status to abandoned (failure = abandon)
 * Records history entry and emits trace.
 */
export function advanceEncounter(
  state: GameState,
  progress: EncounterProgress,
  success: boolean,
  tick: number,
  resolutionSnapshot?: EncounterResolutionSnapshot,
): void {
  const encounter = getAnyEncounterById(progress.encounterId);
  if (!encounter) return;

  const stepRaw = encounter.steps[progress.currentEncounterIndex];
  if (!stepRaw) return;
  const step = toConcreteStep(stepRaw);

  // Record in history
  progress.history.push({
    encounterId: makeStepId(progress.encounterId, progress.currentEncounterIndex),
    success,
    tick,
  });
  if (resolutionSnapshot) {
    progress.resolutionHistory = [...(progress.resolutionHistory ?? []), resolutionSnapshot];
  }

  if (success) {
    // Check if there are more steps
    if (progress.currentEncounterIndex < encounter.steps.length - 1) {
      // Advance to next ELIGIBLE step, skipping conditional ones whose condition isn't met
      let nextIndex = progress.currentEncounterIndex + 1;
      while (nextIndex < encounter.steps.length) {
        const candidate = encounter.steps[nextIndex];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conditional = (candidate as any).conditional as import('../types/encounter').EncounterStep['conditional'] | undefined;
        if (!conditional || isConditionMet(conditional, progress)) {
          break;
        }
        // Condition not met — skip this step
        nextIndex++;
      }

      if (nextIndex < encounter.steps.length) {
        progress.currentEncounterIndex = nextIndex;
        const nextStep = encounter.steps[nextIndex];
        const nextDuration = nextStep ? getStepDuration(nextStep) : 1;
        progress.occupiedUntilTick = tick + nextDuration;
      } else {
        // All remaining steps were conditional and skipped — encounter complete
        progress.status = 'completed';
        progress.occupiedUntilTick = undefined;
      }
    } else {
      // Final step succeeded: completed
      progress.status = 'completed';
      progress.occupiedUntilTick = undefined;
    }
  } else {
    // Failure: abandon the encounter
    progress.status = 'abandoned';
    progress.occupiedUntilTick = undefined;
  }

  const trace: Omit<EncounterResolutionTrace, 'id' | 'timestamp'> = {
    tick,
    category: 'encounter_resolution',
    agentId: progress.actorId,
    encounterId: progress.encounterId,
    actorId: progress.actorId,
    stepId: makeStepId(progress.encounterId, progress.currentEncounterIndex),
    stepName: makeStepName(step, progress.currentEncounterIndex),
    difficulty: step.difficulty,
    capability: 0,
    probability: 0,
    roll: 0,
    success,
    status: progress.status,
    traitChanges: [],
    summary: `Advanced encounter: ${success ? 'success' : 'abandoned'}`,
  };

  emitTrace(trace);
  // Note: ENCOUNTER_END timeline event is appended by the orchestrator after the
  // reward pipeline runs, so the reward name can be included in the same event.
}

/**
 * Check if an encounter's current step is still in progress (agent is occupied).
 * Fail-soft: if occupiedUntilTick is undefined, treat as immediately resolvable.
 */
export function isEncounterOccupied(progress: EncounterProgress, currentTick: number): boolean {
  if (progress.occupiedUntilTick === undefined) return false;
  return progress.occupiedUntilTick > currentTick;
}

/**
 * Abandon an encounter.
 * Sets status to 'abandoned' without affecting history.
 * Used when player manually abandons or as a consequence of failure (via advanceEncounter).
 */
export function abandonEncounter(progress: EncounterProgress): void {
  progress.status = 'abandoned';
  progress.occupiedUntilTick = undefined;
}
