/**
 * Magic Power — Sphere Fluency Calculation
 *
 * Magic is not a separate system. Power emerges directly from sphere affinity:
 * the caster's sphere score, the location's sphere score, and the location's
 * opposition sphere score together determine effective magical power.
 *
 * Drawing more power than your score can handle causes overchannel damage —
 * applied as opposite-sphere pressure through the standard pressure pipeline.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 * Plan: 10-05 (Magic as Sphere Fluency)
 *
 * NOTE: computeEffectivePower and resolveOverchannel are pure functions.
 * Wiring into phaseUnifiedActionProgress is deferred to a future phase.
 */

import type { SphereAffinity, SpherePressureEvent } from '../types/sphereAffinity';
import type { SphereName } from '../types';
import { SPHERE_OPPOSITES } from './cosmology';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────

/** Ratio applied to (locationContribution - casterScore) to compute self-pressure magnitude */
export const OVERCHANNEL_SELF_PRESSURE_RATIO = 1.0;

/**
 * Whether overchannel pressure overflows into wound damage when the pressure
 * pipeline would push score below 0. Currently true — overflow is tracked
 * for future wound system integration.
 */
export const OVERCHANNEL_OVERFLOW_TO_WOUND = true;

/**
 * Minimum caster sphere score required to cast in a given sphere.
 * A score of 0 means no affinity — cannot draw on that sphere at all.
 */
export const MAGIC_MINIMUM_CASTER_SCORE = 1;

/** Default AI overchannel willingness — cautious behavior (10% chance) */
export const OVERCHANNEL_AI_WILLINGNESS_DEFAULT = 0.1;

/** Desperate AI overchannel willingness — used when agent has urgent goals (50% chance) */
export const OVERCHANNEL_AI_WILLINGNESS_DESPERATE = 0.5;

// ─── Core Functions ───────────────────────────────────────────────

/**
 * Compute effective magic power for a caster acting in a sphere at a location.
 *
 * Formula: power = max(0, casterScore + locationScore - locationOppositionScore)
 * Overchannel cost = max(0, locationScore - casterScore) * OVERCHANNEL_SELF_PRESSURE_RATIO
 *
 * If caster score < MAGIC_MINIMUM_CASTER_SCORE (i.e. 0), returns {power: 0, overchannelCost: 0}.
 * The location amplifies or opposes power; when the location's opposite sphere is strong,
 * it suppresses the caster's ability to draw on their sphere here.
 *
 * @param caster - The entity performing the action
 * @param location - The hex/location where the action takes place
 * @param sphere - Which creation sphere the action draws on
 * @returns Effective power value and overchannel cost (both >= 0)
 */
export function computeEffectivePower(
  caster: SphereAffinity,
  location: SphereAffinity,
  sphere: SphereName,
): { power: number; overchannelCost: number } {
  const casterScore = caster.scores[sphere] ?? 0;

  // Fail-soft: no affinity at all = cannot channel this sphere
  if (casterScore < MAGIC_MINIMUM_CASTER_SCORE) {
    return { power: 0, overchannelCost: 0 };
  }

  const locationContribution = location.scores[sphere] ?? 0;
  const opposite = SPHERE_OPPOSITES[sphere];
  const locationOpposition = opposite ? (location.scores[opposite] ?? 0) : 0;

  const rawPower = casterScore + locationContribution - locationOpposition;
  const power = Math.max(0, rawPower);

  // Overchannel occurs when the location is contributing more than the caster can naturally handle
  const overchannelAmount = Math.max(0, locationContribution - casterScore);
  const overchannelCost = overchannelAmount * OVERCHANNEL_SELF_PRESSURE_RATIO;

  return { power, overchannelCost };
}

/**
 * Resolve overchannel damage for an agent who drew beyond their capacity.
 *
 * Overchannel damages the caster through the opposite sphere — drawing too much
 * Force burns through the caster's Energy reserves, too much Life invites Entropy, etc.
 * Returns a SpherePressureEvent that feeds into the standard pressure resolution pipeline.
 *
 * Returns null if overchannelCost is <= 0 (no overchannel occurred).
 * Returns null if the sphere has no defined opposite (fail-soft).
 *
 * @param agentId - ID of the agent taking overchannel damage
 * @param sphere - The sphere that was overchanneled
 * @param overchannelCost - Raw cost from computeEffectivePower
 */
export function resolveOverchannel(
  agentId: string,
  sphere: SphereName,
  overchannelCost: number,
): SpherePressureEvent | null {
  if (overchannelCost <= 0) return null;

  // Overchannel damages the caster via the opposite sphere
  const opposite = SPHERE_OPPOSITES[sphere];
  if (!opposite) return null;

  return {
    targetEntityId: agentId,
    sphere: opposite,
    magnitude: overchannelCost,
    source: 'overchannel',
    sourceId: `overchannel-${agentId}-${sphere}`,
  };
}

/**
 * Agent AI decision: should this agent accept overchannel risk for their next action?
 *
 * Uses a seeded PRNG roll against willingness threshold (NFP #3: Determinism).
 * Willingness 0 = never overchannel. Willingness 1 = always overchannel.
 * Default willingness is conservative (OVERCHANNEL_AI_WILLINGNESS_DEFAULT = 0.1).
 *
 * Caller is responsible for providing appropriate willingness based on agent personality,
 * desperation level, or situational urgency (e.g., OVERCHANNEL_AI_WILLINGNESS_DESPERATE
 * for agents in crisis).
 *
 * @param rng - Seeded PRNG next-float function (returns 0..1)
 * @param willingness - Probability threshold (0..1), defaults to OVERCHANNEL_AI_WILLINGNESS_DEFAULT
 */
export function shouldAgentOverchannel(
  rng: () => number,
  willingness: number = OVERCHANNEL_AI_WILLINGNESS_DEFAULT,
): boolean {
  if (willingness <= 0) return false;
  if (willingness >= 1) return true;
  return rng() < willingness;
}
