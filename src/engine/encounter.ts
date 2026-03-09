/**
 * Encounter Engine — generation, initiation, resolution, and progression.
 *
 * Encounters are linear step sequences where agents undergo narrative growth.
 * Each step uses sigmoid → d100 resolution based on domain capability.
 * Success advances to the next step; failure abandons the encounter.
 */

import type { GameState } from '../types/gameState';
import type { EncounterProgress, EncounterTemplate, EncounterOutcome } from '../types/encounter';
import type { EncounterResolutionTrace } from '../types/trace';
import {
  ENCOUNTER_ABANDON_COOLDOWN,
} from '../types/encounter';
import {
  ENCOUNTER_TEMPLATES,
  getEncountersByLocationType,
  getEncounterById,
} from '../data/encounter-content';
import { computeCapability } from './domainCapability';
import { computeProbability, resolveAction } from './resolution';
import { emitTrace } from './traceBuffer';

// ────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────

/** Sphere factor for encounter resolution (accounts for cosmic bias) */
const ENCOUNTER_SPHERE_FACTOR = 0.1;

/** Difficulty modifier for encounters (standard 0.5) */
const ENCOUNTER_DIFFICULTY_MODIFIER = 0.5;

// ────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────

/**
 * Get all encounters available to an actor at their current location.
 * Filters by location type, excludes active/abandoned (within cooldown) encounters.
 */
export function getAvailableEncounters(state: GameState, actorId: string): EncounterTemplate[] {
  // Find actor's current location
  const locEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return [];

  const locationId = locEdges[0].target;
  const locationNode = state.graph.getNode(locationId);
  if (!locationNode) return [];

  // Use locationSubtype if available (real values), fall back to locationType
  const locationType = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;
  if (!locationType) return [];

  // Get encounters for this location type
  const candidateEncounters = getEncountersByLocationType(locationType);

  // Filter out encounters the actor has active or recently abandoned
  return candidateEncounters.filter(encounter => {
    const progress = state.encounterProgress.find(
      p => p.actorId === actorId && p.encounterId === encounter.id
    );

    if (!progress) return true; // No progress yet, available

    if (progress.status === 'active') return false; // Active, not available

    if (progress.status === 'abandoned') {
      // Check cooldown
      const ticksSinceAbandoned = state.tick - progress.startedTick;
      return ticksSinceAbandoned > ENCOUNTER_ABANDON_COOLDOWN;
    }

    // Completed encounters can be retaken
    if (progress.status === 'completed') return true;

    return true;
  });
}

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
  const encounter = getEncounterById(encounterId);
  const progress: EncounterProgress = {
    encounterId,
    actorId,
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: tick,
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
): { success: boolean; outcome: EncounterOutcome } {
  const encounter = getEncounterById(progress.encounterId);
  if (!encounter) {
    // Graceful fallback: failed encounter with placeholder outcome
    return {
      success: false,
      outcome: { narrative: 'The encounter dissolves into shadow.' },
    };
  }

  const step = encounter.steps[progress.currentEncounterIndex];
  if (!step) {
    return {
      success: false,
      outcome: { narrative: 'No further trial awaits.' },
    };
  }

  // Compute actor's capability in the step's reach domain
  const capability = computeCapability(state.graph, progress.actorId, step.reach);

  // Compute final probability
  const difficulty = step.difficulty / 100; // Normalize to 0-1 range
  const probability = computeProbability(
    capability,
    ENCOUNTER_SPHERE_FACTOR,
    difficulty,
    ENCOUNTER_DIFFICULTY_MODIFIER,
  );

  // Roll and resolve
  const resolution = resolveAction(probability, deterministicRoll);
  const success =
    resolution.outcome === 'success' || resolution.outcome === 'critical_success';

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
    probability,
    roll: resolution.roll,
    success,
    status: 'active',
    traitChanges: outcome.traitChanges ?? [],
    summary: `${step.id}: ${resolution.outcome} (roll ${resolution.roll.toFixed(2)})`,
  };

  emitTrace(trace);

  return { success, outcome };
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
): void {
  const encounter = getEncounterById(progress.encounterId);
  if (!encounter) return;

  const step = encounter.steps[progress.currentEncounterIndex];
  if (!step) return;

  // Record in history
  progress.history.push({
    encounterId: step.id,
    success,
    tick,
  });

  if (success) {
    // Check if there are more steps
    if (progress.currentEncounterIndex < encounter.steps.length - 1) {
      // Move to next step
      progress.currentEncounterIndex++;
    } else {
      // Final step succeeded: completed
      progress.status = 'completed';
    }
  } else {
    // Failure: abandon the encounter
    progress.status = 'abandoned';
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
}

/**
 * Abandon an encounter.
 * Sets status to 'abandoned' without affecting history.
 * Used when player manually abandons or as a consequence of failure (via advanceEncounter).
 */
export function abandonEncounter(progress: EncounterProgress): void {
  progress.status = 'abandoned';
}

/**
 * Generate all encounters available at a specific location.
 * Gets location type from graph, filters ENCOUNTER_TEMPLATES, optionally filters by sphere affinity.
 */
export function generateEncountersForLocation(state: GameState, locationId: string): EncounterTemplate[] {
  const locationNode = state.graph.getNode(locationId);
  if (!locationNode) return [];

  const locationType = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;
  if (!locationType) return [];

  // Filter encounters by location type match
  return ENCOUNTER_TEMPLATES.filter(encounter =>
    encounter.locationTypes.includes(locationType)
  );
}
