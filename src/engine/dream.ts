/**
 * Dream Interface & Divine Toolkit — cost calculation and probability manipulation.
 */
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { ActorType } from '../types/graph';
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type { AlignmentFactor, InterventionCost } from '../types/dream';
import { TIER_MODIFIERS } from '../types/dream';

// ─── Alignment Cost Calculator ───────────────────────────────────

/**
 * Compute how well a set of action motivations aligns with an actor's
 * axiological profile. Returns an alignment factor used as a cost multiplier.
 *
 * Logic:
 * - For each motivation ValuePair, the action implicitly pushes toward the
 *   LEFT pole (positive direction). The actor's profile value tells us their
 *   stance: positive = aligned with left pole, negative = opposed.
 * - Average the profile values for the given motivations.
 * - Map average to alignment factor:
 *     avg >= 0.3  → aligned (1.0)
 *     avg >= -0.2 → neutral (2.0)
 *     avg < -0.2  → against (3.0 to 5.0, scaled by magnitude)
 */
export function computeAlignmentFactor(
  profile: AxiologicalProfile,
  motivations: ValuePair[],
): AlignmentFactor {
  if (motivations.length === 0) {
    return { value: 2.0, label: 'neutral' };
  }

  const sum = motivations.reduce((s, m) => s + (profile[m] ?? 0), 0);
  const avg = sum / motivations.length;

  if (avg >= 0.3) {
    return { value: 1.0, label: 'aligned' };
  }
  if (avg >= -0.2) {
    return { value: 2.0, label: 'neutral' };
  }
  // Against: scale from 3.0 (avg = -0.2) to 5.0 (avg = -1.0)
  const magnitude = Math.abs(avg);
  const factor = 3.0 + (magnitude - 0.2) * 2.5;
  return { value: Math.min(5.0, factor), label: 'against' };
}

/**
 * Compute the full cost of an intervention or manipulation.
 * finalCost = baseCost × alignmentFactor × tierModifier
 */
export function computeInterventionCost(params: {
  baseCost: number;
  sphere: SphereName;
  alignmentFactor: number;
  actorType: Exclude<ActorType, 'ascendant'>;
  pool: EssencePool;
}): InterventionCost {
  const tierMod = TIER_MODIFIERS[params.actorType] ?? 1.0;
  const finalCost = params.baseCost * params.alignmentFactor * tierMod;

  return {
    baseCost: params.baseCost,
    alignmentFactor: params.alignmentFactor,
    tierModifier: tierMod,
    finalCost,
    sphere: params.sphere,
    affordable: params.pool[params.sphere] >= finalCost,
  };
}
