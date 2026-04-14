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
): EncounterProgress {
  const encounter = getAnyEncounterById(encounterId);
  const firstStepDuration = encounter?.steps[0]?.duration ?? 1;
  const progress: EncounterProgress = {
    encounterId,
    actorId,
    currentEncounterIndex: 0,
    history: [],
    resolutionHistory: [],
    status: 'active',
    startedTick: tick,
    occupiedUntilTick: tick + firstStepDuration,
  };

  state.encounterProgress.push(progress);

  const firstStep = encounter?.steps[0];
  const trace: Omit<EncounterResolutionTrace, 'id' | 'timestamp'> = {
    tick,
    category: 'encounter_resolution',
    agentId: actorId,
    encounterId,
    actorId,
    stepId: firstStep?.id ?? 'unknown',
    stepName: firstStep?.name ?? 'Unknown Step',
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
    threat: (firstStep?.difficulty ?? 0) / 100,
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

  const step = encounter.steps[progress.currentEncounterIndex];
  if (!step) {
    const { resolution, resolutionSnapshot } = buildFailSoftResolution(
      'unknown',
      'Unknown Step',
      encounter.reachPrimary,
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

  // Phase 2: Use shared resolution service with difficulty normalization.
  // Legacy encounter difficulty is integer-like (e.g. 12, 25, 30) — normalize to 0..1
  // at this boundary before calling the shared resolver.
  const normalizedDifficulty = normalizeLegacyDifficulty(step.difficulty);

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
    stepId: step.id,
    stepName: step.name,
    reach: step.reach,
    difficulty: step.difficulty,
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

  // Select the appropriate outcome
  const outcome = success ? step.onSuccess : step.onFailure;

  const trace: Omit<EncounterResolutionTrace, 'id' | 'timestamp'> = {
    tick: state.tick,
    category: 'encounter_resolution',
    agentId: progress.actorId,
    encounterId: progress.encounterId,
    actorId: progress.actorId,
    stepId: step.id,
    stepName: step.name,
    difficulty: step.difficulty,
    capability,
    probability: resolution.probability,
    roll: resolution.roll,
    success,
    status: 'active',
    traitChanges: outcome.traitChanges ?? [],
    summary: `${step.id}: ${resolution.outcome} (roll ${resolution.roll.toFixed(2)})`,
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

  const step = encounter.steps[progress.currentEncounterIndex];
  if (!step) return;

  // Record in history
  progress.history.push({
    encounterId: step.id,
    success,
    tick,
  });
  if (resolutionSnapshot) {
    progress.resolutionHistory = [...(progress.resolutionHistory ?? []), resolutionSnapshot];
  }

  if (success) {
    // Check if there are more steps
    if (progress.currentEncounterIndex < encounter.steps.length - 1) {
      // Move to next step
      progress.currentEncounterIndex++;
      // Set occupiedUntilTick for the new step
      const nextStep = encounter.steps[progress.currentEncounterIndex];
      const nextDuration = nextStep?.duration ?? 1;
      progress.occupiedUntilTick = tick + nextDuration;
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
    stepId: step.id,
    stepName: step.name,
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
