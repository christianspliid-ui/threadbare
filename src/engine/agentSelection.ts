/**
 * Agent Action Selection — Maslow-inspired pipeline.
 *
 * When an actor's action completes (AP frees up), this pipeline selects
 * their next action. Scores candidates by axiological alignment,
 * selects top-N, then does weighted random selection.
 */
import type { WorldGraph } from './graph';
import type {
  ActionCandidate,
  AxiologicalProfile,
  SelectionConfig,
  SelectionResult,
} from '../types/agent';

/**
 * Score candidates based on alignment with the actor's axiological profile.
 * For each candidate, sums the profile values for its motivation pairs.
 * Higher positive values = stronger alignment with the left pole.
 */
export function scoreByGoalAlignment(
  candidates: ActionCandidate[],
  profile: AxiologicalProfile,
): ActionCandidate[] {
  return candidates.map((candidate) => {
    let score = 0;
    for (const motivation of candidate.motivations) {
      // Use absolute value to capture strength of conviction in either direction
      // But the sign matters for alignment — positive profile value means
      // the actor is driven by the left pole of that pair
      score += profile[motivation] ?? 0;
    }
    return { ...candidate, score };
  });
}

/**
 * Apply personality/trait-based weight adjustments.
 * Extension point for future trait-based biases.
 */
export function applyPersonalityWeights(
  candidates: ActionCandidate[],
  _traitBiases?: Record<string, number>,
): ActionCandidate[] {
  // Future: walk trait biases and adjust scores
  return candidates;
}

/**
 * Select the top N candidates by score (descending).
 */
export function selectTopN(
  candidates: ActionCandidate[],
  n: number,
): ActionCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return sorted.slice(0, n);
}

/**
 * Normalize scores to probabilities and assign to candidates.
 * Uses softmax-like normalization: shift scores to be positive, then normalize.
 */
function assignProbabilities(candidates: ActionCandidate[]): ActionCandidate[] {
  if (candidates.length === 0) return [];

  // Shift all scores to be positive (min becomes 0, add small epsilon)
  const minScore = Math.min(...candidates.map((c) => c.score));
  const shifted = candidates.map((c) => ({
    ...c,
    _adjustedScore: c.score - minScore + 0.1, // epsilon to avoid zero
  }));

  const totalScore = shifted.reduce((sum, c) => sum + c._adjustedScore, 0);

  return shifted.map((c) => {
    const { _adjustedScore, ...rest } = c;
    return {
      ...rest,
      probability: _adjustedScore / totalScore,
    };
  });
}

/**
 * Probabilistic selection from candidates with assigned probabilities.
 * Uses cumulative distribution — roll a random number and walk through.
 * @param deterministicRoll - Optional fixed roll [0, 1) for testing
 */
export function probabilisticSelect(
  candidates: ActionCandidate[],
  deterministicRoll?: number,
): ActionCandidate {
  if (candidates.length === 0) throw new Error('No candidates to select from');
  if (candidates.length === 1) return candidates[0];

  const roll = deterministicRoll ?? Math.random();
  let cumulative = 0;

  for (const candidate of candidates) {
    cumulative += candidate.probability ?? 0;
    if (roll < cumulative) {
      return candidate;
    }
  }

  // Fallback to last candidate (floating point edge case)
  return candidates[candidates.length - 1];
}

/**
 * Run the full selection pipeline:
 * 1. Score by axiological alignment
 * 2. Apply personality weights (extension point)
 * 3. Select top-N
 * 4. Normalize to probabilities
 * 5. Probabilistic select
 */
export function runSelectionPipeline(
  graph: WorldGraph,
  actorId: string,
  candidates: ActionCandidate[],
  config: SelectionConfig,
): SelectionResult {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) throw new Error(`Actor not found: ${actorId}`);

  const profile = actorNode.properties.axiologicalProfile as AxiologicalProfile;
  if (!profile) throw new Error(`Actor ${actorId} has no axiological profile`);

  // Step 1: Score by goal alignment
  let scored = scoreByGoalAlignment(candidates, profile);

  // Step 2: Apply personality weights (extension point)
  scored = applyPersonalityWeights(scored);

  // Step 3: Select top-N
  const topN = selectTopN(scored, config.topN);

  // Step 4: Assign probabilities
  const withProbabilities = assignProbabilities(topN);

  // Step 5: Probabilistic select
  const selected = probabilisticSelect(withProbabilities);

  return {
    selected,
    candidates: withProbabilities,
    wasSurvivalOverride: false,
  };
}
