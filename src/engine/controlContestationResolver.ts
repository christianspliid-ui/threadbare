/**
 * Control Effect Contestation — detection and resolution of challenges
 * against active sustained divine effects.
 *
 * When an agent is on a hex with active control effects owned by a rival,
 * they may contest those effects if they meet the prerequisite requirements.
 * Contestation outcomes are usurp (transfer ownership) or destroy (remove).
 *
 * TB-045: Control Effect Contestation & Persistent Encounter Nodes
 *
 * NFP compliance:
 *   #1 Tunability: difficulty scaling constants named and exported
 *   #2 Inspectability: ControlContestationTrace emitted per resolution
 *   #3 Determinism: requires explicit RNG function (seeded PRNG)
 *   #4 Fail-soft: missing effects/agents → no-op, never crash
 */

import type { ControlEffect, ActorPrerequisites } from '../types/controlEffect';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';
import type { TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import { computeCapability } from './domainCapability';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Base difficulty for contesting a control effect (0-1 scale). */
export const CONTESTATION_BASE_DIFFICULTY = 0.5;

/** Per-tick difficulty increase (older effects are harder to contest). */
export const CONTESTATION_TICKS_ACTIVE_SCALING = 0.01;

/** Maximum difficulty from age scaling (cap). */
export const CONTESTATION_MAX_DIFFICULTY = 0.85;

/** Chance the original owner detects the usurp attempt (0-1). */
export const USURP_DETECTION_RISK = 0.8;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContestationType = 'usurp' | 'destroy';

export interface ContestationCandidate {
  readonly effect: ControlEffect;
  readonly availableTypes: readonly ContestationType[];
}

export interface ContestationOutcome {
  readonly effectId: string;
  readonly contestType: ContestationType;
  readonly success: boolean;
  readonly newOwnerId?: string;     // Only on successful usurp
  readonly difficulty: number;
  readonly roll: number;
  readonly probability: number;
}

// ─── Detection ────────────────────────────────────────────────────────────────

/**
 * Find all control effects at a given hex that an agent can contest.
 *
 * An effect is contestable when:
 * 1. It's active and owned by someone other than the agent
 * 2. The agent meets at least one set of contest prerequisites (usurp or destroy)
 *
 * @param hexCol Target hex column
 * @param hexRow Target hex row
 * @param agentId The agent attempting to contest
 * @param graph WorldGraph for capability lookups
 * @param controlEffects All active control effects
 * @returns Array of contestable effects with available contest types
 */
export function findContestableEffects(
  hexCol: number,
  hexRow: number,
  agentId: string,
  graph: WorldGraph,
  controlEffects: readonly ControlEffect[],
): ContestationCandidate[] {
  const candidates: ContestationCandidate[] = [];

  for (const effect of controlEffects) {
    // Must be active and on this hex
    if (!effect.active) continue;
    if (effect.targetHexCol !== hexCol || effect.targetHexRow !== hexRow) continue;

    // Can't contest your own effects
    if (effect.ownerId === agentId) continue;

    // Check prerequisites
    const availableTypes: ContestationType[] = [];

    if (effect.contestPrerequisites?.usurp) {
      if (meetsPrerequisites(agentId, effect.contestPrerequisites.usurp, graph)) {
        availableTypes.push('usurp');
      }
    }

    if (effect.contestPrerequisites?.destroy) {
      if (meetsPrerequisites(agentId, effect.contestPrerequisites.destroy, graph)) {
        availableTypes.push('destroy');
      }
    }

    // If no prerequisites defined at all, effect is not contestable
    if (availableTypes.length > 0) {
      candidates.push({ effect, availableTypes });
    }
  }

  return candidates;
}

/**
 * Check if an agent meets the prerequisite requirements for a contestation path.
 */
export function meetsPrerequisites(
  agentId: string,
  prereqs: ActorPrerequisites,
  graph: WorldGraph,
): boolean {
  // Check reach requirement
  if (prereqs.reach) {
    const capability = computeCapability(graph, agentId, prereqs.reach.domain);
    const tier = capabilityToTier(capability);
    if (tier < prereqs.reach.minTier) return false;
  }

  // Check sphere requirement
  if (prereqs.sphere) {
    const node = graph.getNode(agentId);
    if (!node) return false;

    const sphereAlignment = node.properties?.sphereAlignment as
      | { primary?: SphereName; secondary?: SphereName }
      | undefined;

    if (!sphereAlignment) return false;

    if (prereqs.sphere.relation === 'aligned') {
      // Agent must be aligned to the required sphere
      if (sphereAlignment.primary !== prereqs.sphere.name &&
          sphereAlignment.secondary !== prereqs.sphere.name) {
        return false;
      }
    } else if (prereqs.sphere.relation === 'opposing') {
      // Agent must NOT be aligned to the required sphere (they oppose it)
      if (sphereAlignment.primary === prereqs.sphere.name ||
          sphereAlignment.secondary === prereqs.sphere.name) {
        return false;
      }
    }
  }

  return true;
}

// ─── Resolution ───────────────────────────────────────────────────────────────

/**
 * Compute the difficulty of contesting a control effect.
 * Difficulty increases with the effect's age (ticks active).
 */
export function computeContestationDifficulty(effect: ControlEffect): number {
  const ageDifficulty = effect.ticksActive * CONTESTATION_TICKS_ACTIVE_SCALING;
  return Math.min(CONTESTATION_MAX_DIFFICULTY, CONTESTATION_BASE_DIFFICULTY + ageDifficulty);
}

/**
 * Resolve a contestation attempt against a control effect.
 *
 * @param effect The control effect being contested
 * @param contestType Whether this is an usurp or destroy attempt
 * @param contestantId The agent attempting the contestation
 * @param graph WorldGraph for capability lookups
 * @param tick Current game tick
 * @param rng Seeded random number generator (returns 0-1)
 * @returns Contestation outcome
 */
export function resolveContestation(
  effect: ControlEffect,
  contestType: ContestationType,
  contestantId: string,
  graph: WorldGraph,
  tick: number,
  rng: () => number,
): ContestationOutcome {
  const difficulty = computeContestationDifficulty(effect);

  // Contestant's capability in the relevant reach (from prerequisites)
  const reach = getContestReach(effect, contestType);
  const capability = reach ? computeCapability(graph, contestantId, reach) : 0.5;

  // Probability: capability - difficulty, clamped [0.05, 0.95]
  const probability = Math.max(0.05, Math.min(0.95, capability - difficulty));

  // Roll
  const roll = rng();
  const success = roll < probability;

  const outcome: ContestationOutcome = {
    effectId: effect.effectId,
    contestType,
    success,
    newOwnerId: success && contestType === 'usurp' ? contestantId : undefined,
    difficulty,
    roll,
    probability,
  };

  // Emit trace
  emitTrace({
    tick,
    category: 'control_effect',
    type: 'control_contestation',
    summary: `${contestType} attempt on ${effect.templateId} at (${effect.targetHexCol},${effect.targetHexRow}): ${success ? 'success' : 'failure'}`,
    effectId: effect.effectId,
    contestantId,
    contestType,
    outcome: success ? 'success' : 'failure',
    newOwnerId: outcome.newOwnerId,
    difficulty,
    roll,
    probability,
  } as any);

  return outcome;
}

/**
 * Apply a contestation outcome to a control effect.
 * Returns the updated effect and any tick events.
 */
export function applyContestationOutcome(
  effect: ControlEffect,
  outcome: ContestationOutcome,
  tick: number,
): { updatedEffect: ControlEffect; events: TickEvent[] } {
  const events: TickEvent[] = [];

  if (!outcome.success) {
    // Failed contestation — effect unchanged
    events.push({
      id: `contest_failed_${effect.effectId}_${tick}`,
      tick,
      type: 'control_contestation_failed',
      message: `A rival's attempt to ${outcome.contestType} your ${effect.templateId} has failed.`,
      significance: 0.5,
    });

    return { updatedEffect: effect, events };
  }

  if (outcome.contestType === 'usurp') {
    // Usurp: transfer ownership, inherit investment
    const updatedEffect: ControlEffect = {
      ...effect,
      ownerId: outcome.newOwnerId!,
      // Inherits everything — sunk cost, sustain, mutations
    };

    events.push({
      id: `contest_usurped_${effect.effectId}_${tick}`,
      tick,
      type: 'control_effect_usurped',
      message: effect.narrativeTemplates.usurped
        ?? `Your ${effect.templateId} at hex (${effect.targetHexCol},${effect.targetHexRow}) has been seized by a rival.`,
      significance: 0.8,
    });

    return { updatedEffect, events };
  }

  // Destroy: permanently deactivate
  const updatedEffect: ControlEffect = {
    ...effect,
    active: false,
    lapseReason: 'destroyed',
  };

  events.push({
    id: `contest_destroyed_${effect.effectId}_${tick}`,
    tick,
    type: 'control_effect_destroyed',
    message: effect.narrativeTemplates.destroyed
      ?? `Your ${effect.templateId} at hex (${effect.targetHexCol},${effect.targetHexRow}) has been destroyed.`,
    significance: 0.8,
  });

  return { updatedEffect, events };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert raw capability value to tier (0-4).
 * Matches the tier thresholds used in domainCapability.
 */
function capabilityToTier(capability: number): number {
  if (capability >= 0.8) return 4;
  if (capability >= 0.6) return 3;
  if (capability >= 0.4) return 2;
  if (capability >= 0.2) return 1;
  return 0;
}

/**
 * Get the relevant reach domain for a contestation type from the effect's prerequisites.
 */
function getContestReach(effect: ControlEffect, contestType: ContestationType): ReachDomain | undefined {
  const prereqs = contestType === 'usurp'
    ? effect.contestPrerequisites?.usurp
    : effect.contestPrerequisites?.destroy;
  return prereqs?.reach?.domain;
}
