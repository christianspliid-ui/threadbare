/**
 * Dream Interface & Divine Toolkit — cost calculation and probability manipulation.
 */
import type { AxiologicalProfile, ValuePair, ActionCandidate } from '../types/agent';
import type { ActorType } from '../types/graph';
import type { SphereName } from '../types/index';
import type { EssencePool, InfluenceTier } from '../types/influence';
import type { AlignmentFactor, InterventionCost, ManipulationType, DreamManipulation, InterventionType, InterventionResult } from '../types/dream';
import { TIER_MODIFIERS, MANIPULATION_DEFINITIONS, INTERVENTION_DEFINITIONS } from '../types/dream';

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

// ─── Manipulation Validation ─────────────────────────────────────

export function validateManipulation(
  type: ManipulationType,
  actorTier: InfluenceTier,
): { valid: boolean; reason?: string } {
  const def = MANIPULATION_DEFINITIONS[type];
  if (actorTier < def.minTier) {
    return {
      valid: false,
      reason: `${type} requires influence tier ${def.minTier}, actor is at tier ${actorTier}`,
    };
  }
  return { valid: true };
}

// ─── Probability Manipulation ────────────────────────────────────

/**
 * Apply dream manipulations to a set of candidates with assigned probabilities.
 * Returns a new array with adjusted probabilities that sum to 1.0.
 *
 * Manipulation effects:
 * - whisper: +0.12 to target (midpoint of 0.10-0.15)
 * - inspire: +0.275 to target (midpoint of 0.25-0.30)
 * - suppress: -0.20 from target
 * - reshape: replace target candidate with variant, keep probability
 * - implant: inject new candidate at 0.30, compress others
 * - command: set target to 1.0, zero others
 */
export function applyDreamManipulations(
  candidates: ActionCandidate[],
  manipulations: DreamManipulation[],
): ActionCandidate[] {
  let result = candidates.map(c => ({ ...c }));

  for (const manip of manipulations) {
    switch (manip.type) {
      case 'whisper': {
        const boost = 0.12;
        result = applyBoost(result, manip.targetCandidateIndex, boost);
        break;
      }
      case 'inspire': {
        const boost = 0.275;
        result = applyBoost(result, manip.targetCandidateIndex, boost);
        break;
      }
      case 'suppress': {
        const reduction = -0.20;
        result = applyBoost(result, manip.targetCandidateIndex, reduction);
        break;
      }
      case 'reshape': {
        if (manip.reshapeTo && manip.targetCandidateIndex >= 0 && manip.targetCandidateIndex < result.length) {
          const oldProb = result[manip.targetCandidateIndex].probability ?? 0;
          result[manip.targetCandidateIndex] = { ...manip.reshapeTo, probability: oldProb };
        }
        break;
      }
      case 'implant': {
        if (manip.implantCandidate) {
          const injectedProb = 0.30;
          const compressionFactor = 1.0 - injectedProb;
          result = result.map(c => ({
            ...c,
            probability: (c.probability ?? 0) * compressionFactor,
          }));
          result.push({ ...manip.implantCandidate, probability: injectedProb });
        }
        break;
      }
      case 'command': {
        result = result.map((c, i) => ({
          ...c,
          probability: i === manip.targetCandidateIndex ? 1.0 : 0.0,
        }));
        break;
      }
    }
  }

  return result;
}

/**
 * Apply a probability boost/reduction to a specific candidate
 * and renormalize so all probabilities sum to 1.0.
 */
function applyBoost(
  candidates: ActionCandidate[],
  targetIndex: number,
  delta: number,
): ActionCandidate[] {
  if (targetIndex < 0 || targetIndex >= candidates.length) return candidates;

  const result = candidates.map((c, i) => {
    if (i === targetIndex) {
      const newProb = Math.max(0, (c.probability ?? 0) + delta);
      return { ...c, probability: newProb };
    }
    return { ...c };
  });

  // Renormalize
  const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
  if (total === 0) {
    const equal = 1.0 / result.length;
    return result.map(c => ({ ...c, probability: equal }));
  }

  return result.map(c => ({
    ...c,
    probability: (c.probability ?? 0) / total,
  }));
}

// ─── Detection System ────────────────────────────────────────────

/**
 * Compute whether an intervention was detected.
 *
 * detectionRisk = min(0.95, baseRisk + frequencyBonus)
 * frequencyBonus = priorInterventionsInRegion * 0.05
 */
export function computeDetection(
  interventionType: InterventionType,
  priorInterventions: number,
  roll: number,
): { detected: boolean; detectedBy: 'mortal' | 'rival' | 'both' | 'none' } {
  const def = INTERVENTION_DEFINITIONS[interventionType];
  const frequencyBonus = priorInterventions * 0.05;
  const adjustedRisk = Math.min(0.95, def.detectionRisk + frequencyBonus);

  if (roll >= adjustedRisk) {
    return { detected: false, detectedBy: 'none' };
  }

  return { detected: true, detectedBy: 'mortal' };
}

// ─── Intervention Execution ──────────────────────────────────────

/**
 * Execute a divine intervention: compute cost, spend essence, check detection.
 */
export function executeIntervention(params: {
  interventionType: InterventionType;
  sphere: SphereName;
  baseCost: number;
  alignmentFactor: number;
  actorType: Exclude<ActorType, 'ascendant'>;
  pool: EssencePool;
  priorInterventions?: number;
  detectionRoll?: number;
}): InterventionResult {
  const cost = computeInterventionCost({
    baseCost: params.baseCost,
    sphere: params.sphere,
    alignmentFactor: params.alignmentFactor,
    actorType: params.actorType,
    pool: params.pool,
  });

  const essenceSpent: Record<SphereName, number> = {
    force: 0, matter: 0, energy: 0, life: 0,
    mind: 0, spirit: 0, time: 0, entropy: 0,
  };

  if (!cost.affordable) {
    return {
      success: false,
      essenceSpent,
      detected: false,
      detectedBy: 'none',
    };
  }

  essenceSpent[params.sphere] = cost.finalCost;

  const roll = params.detectionRoll ?? Math.random();
  const detection = computeDetection(
    params.interventionType,
    params.priorInterventions ?? 0,
    roll,
  );

  const narrativeHook = `intervention_${params.interventionType}_${params.sphere}`;

  return {
    success: true,
    essenceSpent,
    detected: detection.detected,
    detectedBy: detection.detectedBy,
    narrativeHook,
  };
}
