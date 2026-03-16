/**
 * Ambition Boost — scores action candidates higher when they align
 * with the actor's active ambitions' reach affinities.
 */
import type { ActionCandidate } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { AmbitionPriority } from '../types/ambition';

export const PRIMARY_AMBITION_WEIGHT = 0.6;
export const SECONDARY_AMBITION_WEIGHT = 0.2;

export interface ActiveAmbitionForScoring {
  reachAffinity: Partial<Record<ReachDomain, number>>;
  priority: AmbitionPriority;
}

/**
 * Compute the total ambition boost for a single candidate.
 * Sums weight * affinityForDomain across all active ambitions.
 */
export function computeAmbitionBoost(
  candidate: ActionCandidate,
  ambitions: readonly ActiveAmbitionForScoring[],
): number {
  if (ambitions.length === 0) return 0;

  let boost = 0;
  for (const ambition of ambitions) {
    const weight =
      ambition.priority === 'primary'
        ? PRIMARY_AMBITION_WEIGHT
        : SECONDARY_AMBITION_WEIGHT;
    const affinityForDomain = ambition.reachAffinity[candidate.domain] ?? 0;
    boost += weight * affinityForDomain;
  }
  return boost;
}

/**
 * Apply ambition boost to all candidates, returning a new array
 * with adjusted scores.
 */
export function applyAmbitionBoost(
  candidates: ActionCandidate[],
  ambitions: readonly ActiveAmbitionForScoring[],
): ActionCandidate[] {
  if (ambitions.length === 0) return candidates;

  return candidates.map((candidate) => ({
    ...candidate,
    score: candidate.score + computeAmbitionBoost(candidate, ambitions),
  }));
}
