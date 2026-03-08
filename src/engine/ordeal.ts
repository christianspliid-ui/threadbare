/**
 * Ordeal Engine — generation, initiation, resolution, and progression.
 *
 * Ordeals are linear encounter sequences where agents undergo narrative growth.
 * Each encounter uses sigmoid → d100 resolution based on domain capability.
 * Success advances to the next encounter; failure abandons the ordeal.
 */

import type { GameState } from '../types/gameState';
import type { OrdealProgress, OrdealDefinition, EncounterOutcome } from '../types/ordeal';
import {
  ORDEAL_ABANDON_COOLDOWN,
} from '../types/ordeal';
import {
  ORDEAL_TEMPLATES,
  getOrdealsByLocationType,
  getOrdealById,
} from '../data/ordeal-content';
import { computeCapability } from './domainCapability';
import { computeProbability, resolveAction } from './resolution';
import { emitTrace } from './traceBuffer';

// ────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────

/** Sphere factor for ordeal resolution (accounts for cosmic bias) */
const ORDEAL_SPHERE_FACTOR = 0.1;

/** Difficulty modifier for ordeals (standard 0.5) */
const ORDEAL_DIFFICULTY_MODIFIER = 0.5;

// ────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────

/**
 * Get all ordeals available to an actor at their current location.
 * Filters by location type, excludes active/abandoned (within cooldown) ordeals.
 */
export function getAvailableOrdeals(state: GameState, actorId: string): OrdealDefinition[] {
  // Find actor's current location
  const locEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return [];

  const locationId = locEdges[0].target;
  const locationNode = state.graph.getNode(locationId);
  if (!locationNode) return [];

  const locationType = locationNode.properties.locationType as string | undefined;
  if (!locationType) return [];

  // Get ordeals for this location type
  const candidateOrdeals = getOrdealsByLocationType(locationType);

  // Filter out ordeals the actor has active or recently abandoned
  return candidateOrdeals.filter(ordeal => {
    const progress = state.ordealProgress.find(
      p => p.actorId === actorId && p.ordealId === ordeal.id
    );

    if (!progress) return true; // No progress yet, available

    if (progress.status === 'active') return false; // Active, not available

    if (progress.status === 'abandoned') {
      // Check cooldown
      const ticksSinceAbandoned = state.tick - progress.startedTick;
      return ticksSinceAbandoned > ORDEAL_ABANDON_COOLDOWN;
    }

    // Completed ordeals can be retaken
    if (progress.status === 'completed') return true;

    return true;
  });
}

/**
 * Initiate an ordeal for an actor.
 * Creates a new OrdealProgress record, adds to state, emits trace.
 */
export function initiateOrdeal(
  state: GameState,
  actorId: string,
  ordealId: string,
  tick: number,
): OrdealProgress {
  const progress: OrdealProgress = {
    ordealId,
    actorId,
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: tick,
  };

  state.ordealProgress.push(progress);

  // TODO: Task 6 will add ordeal_resolution to the trace union
  // For now, emit as a narrative_generation trace as a workaround
  if (typeof emitTrace === 'function') {
    (emitTrace as any)({
      category: 'ordeal_resolution',
      agentId: actorId,
      tick,
      summary: `Ordeal initiated: ${ordealId}`,
    } as any);
  }

  return progress;
}

/**
 * Resolve a single encounter within an ordeal.
 * Uses sigmoid → d100 resolution on the encounter's primary reach domain.
 * Returns success flag and the appropriate EncounterOutcome.
 */
export function resolveEncounter(
  state: GameState,
  progress: OrdealProgress,
  deterministicRoll?: number,
): { success: boolean; outcome: EncounterOutcome } {
  const ordeal = getOrdealById(progress.ordealId);
  if (!ordeal) {
    // Graceful fallback: failed encounter with placeholder outcome
    return {
      success: false,
      outcome: { narrative: 'The ordeal dissolves into shadow.' },
    };
  }

  const encounter = ordeal.encounters[progress.currentEncounterIndex];
  if (!encounter) {
    return {
      success: false,
      outcome: { narrative: 'No further trial awaits.' },
    };
  }

  // Compute actor's capability in the encounter's reach domain
  const capability = computeCapability(state.graph, progress.actorId, encounter.reach);

  // Compute final probability
  const difficulty = encounter.difficulty / 100; // Normalize to 0-1 range
  const probability = computeProbability(
    capability,
    ORDEAL_SPHERE_FACTOR,
    difficulty,
    ORDEAL_DIFFICULTY_MODIFIER,
  );

  // Roll and resolve
  const resolution = resolveAction(probability, deterministicRoll);
  const success =
    resolution.outcome === 'success' || resolution.outcome === 'critical_success';

  // Select the appropriate outcome
  const outcome = success ? encounter.onSuccess : encounter.onFailure;

  // TODO: Task 6 will add ordeal_resolution to the trace union
  if (typeof emitTrace === 'function') {
    (emitTrace as any)({
      category: 'ordeal_resolution',
      agentId: progress.actorId,
      tick: state.tick,
      summary: `${encounter.id}: ${resolution.outcome} (roll ${resolution.roll})`,
    } as any);
  }

  return { success, outcome };
}

/**
 * Advance ordeal progress after resolving an encounter.
 * - Success + more encounters: increment currentEncounterIndex
 * - Success + final encounter: set status to completed
 * - Failure: set status to abandoned (failure = abandon)
 * Records history entry and emits trace.
 */
export function advanceOrdeal(
  state: GameState,
  progress: OrdealProgress,
  success: boolean,
  tick: number,
): void {
  const ordeal = getOrdealById(progress.ordealId);
  if (!ordeal) return;

  const encounter = ordeal.encounters[progress.currentEncounterIndex];
  if (!encounter) return;

  // Record in history
  progress.history.push({
    encounterId: encounter.id,
    success,
    tick,
  });

  if (success) {
    // Check if there are more encounters
    if (progress.currentEncounterIndex < ordeal.encounters.length - 1) {
      // Move to next encounter
      progress.currentEncounterIndex++;
    } else {
      // Final encounter succeeded: completed
      progress.status = 'completed';
    }
  } else {
    // Failure: abandon the ordeal
    progress.status = 'abandoned';
  }

  // TODO: Task 6 will add ordeal_resolution to the trace union
  if (typeof emitTrace === 'function') {
    (emitTrace as any)({
      category: 'ordeal_resolution',
      agentId: progress.actorId,
      tick,
      summary: `Advanced ordeal: ${success ? 'success' : 'abandoned'}`,
    } as any);
  }
}

/**
 * Abandon an ordeal.
 * Sets status to 'abandoned' without affecting history.
 * Used when player manually abandons or as a consequence of failure (via advanceOrdeal).
 */
export function abandonOrdeal(progress: OrdealProgress): void {
  progress.status = 'abandoned';
}

/**
 * Generate all ordeals available at a specific location.
 * Gets location type from graph, filters ORDEAL_TEMPLATES, optionally filters by sphere affinity.
 */
export function generateOrdealsForLocation(state: GameState, locationId: string): OrdealDefinition[] {
  const locationNode = state.graph.getNode(locationId);
  if (!locationNode) return [];

  const locationType = locationNode.properties.locationType as string | undefined;
  if (!locationType) return [];

  // Filter ordeals by location type match
  return ORDEAL_TEMPLATES.filter(ordeal =>
    ordeal.locationTypes.includes(locationType)
  );
}
