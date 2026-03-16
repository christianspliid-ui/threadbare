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
import { applyDispositionModifier } from './disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { emitTrace } from './traceBuffer';
import { getDivineInfluences, buildValueOverlay } from './interventionEffects';
import type { DivineInfluenceEntry } from '../types/dream';
import { applyAmbitionBoost, type ActiveAmbitionForScoring } from './ambitionBoost';
import type { ReachDomain } from '../types/traits';

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
  ambitions: readonly ActiveAmbitionForScoring[] = [],
  _traitBiases?: Record<string, number>,
): ActionCandidate[] {
  // Apply ambition boost
  let result = applyAmbitionBoost(candidates, ambitions);
  // Future: walk trait biases and adjust scores
  return result;
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
 * Extract active ambitions from the graph for scoring purposes.
 * Looks for 'pursues' edges from the actor to ambition nodes.
 */
function getActiveAmbitionsForScoring(
  graph: WorldGraph,
  actorId: string,
): ActiveAmbitionForScoring[] {
  const pursuesEdges = graph.getOutgoingEdges(actorId, 'pursues');
  const ambitions: ActiveAmbitionForScoring[] = [];

  for (const edge of pursuesEdges) {
    if (edge.properties?.status !== 'active') continue;
    const ambitionNode = graph.getNode(edge.target);
    if (!ambitionNode) continue;

    ambitions.push({
      reachAffinity: (ambitionNode.properties.reachAffinity ?? {}) as Partial<Record<ReachDomain, number>>,
      priority: (edge.properties.priority as 'primary' | 'secondary') ?? 'secondary',
    });
  }

  return ambitions;
}

/**
 * Run the full selection pipeline:
 * 1. Score by axiological alignment
 * 2. Apply disposition modifier (game theory)
 * 3. Apply personality weights (extension point)
 * 4. Select top-N
 * 5. Normalize to probabilities
 * 6. Probabilistic select
 */
export function runSelectionPipeline(
  graph: WorldGraph,
  actorId: string,
  candidates: ActionCandidate[],
  config: SelectionConfig,
  tick: number = 0,
  deterministicRoll?: number,
): SelectionResult {
  const actorNode = graph.getNode(actorId);
  if (!actorNode) throw new Error(`Actor not found: ${actorId}`);

  const profile = actorNode.properties.axiologicalProfile as AxiologicalProfile;
  if (!profile) throw new Error(`Actor ${actorId} has no axiological profile`);

  // Track stages for tracing
  const stages = [];

  // Step 1: Score by goal alignment
  let scored = scoreByGoalAlignment(candidates, profile);
  stages.push({
    stageName: 'goal_alignment',
    candidateIds: scored.map((c) => c.templateId),
    scores: scored.map((c) => c.score),
  });

  // Step 1.5: Apply Divine Influence Overlay
  const divineInfluences = getDivineInfluences(graph, actorId);
  if (divineInfluences.length > 0) {
    const overlayProfile = buildValueOverlay(profile, divineInfluences, tick);
    // Re-score with overlaid profile
    scored = scoreByGoalAlignment(scored, overlayProfile);
    stages.push({
      stageName: 'divine_influence_overlay',
      candidateIds: scored.map((c) => c.templateId),
      scores: scored.map((c) => c.score),
      notes: `${divineInfluences.length} active influence(s)`,
    });
  }

  // Step 2: Apply disposition modifier (game theory)
  // Group candidates by target and apply modifier per target
  const cooperationStrategy = actorNode.properties.cooperationStrategy;
  if (cooperationStrategy && scored.length > 0) {
    // Get unique targets from candidates
    const uniqueTargets = [...new Set(scored.map((c) => c.targetId))];

    // For each target, apply disposition modifier to its candidates
    for (const targetId of uniqueTargets) {
      const targetCandidates = scored.filter((c) => c.targetId === targetId);
      if (targetCandidates.length === 0) continue;

      const targetNode = graph.getNode(targetId);
      if (!targetNode) continue;

      // Find relationship between actor and target (check both directions)
      let relationship = graph
        .getOutgoingEdges(actorId, 'relates_to')
        .find((e) => e.target === targetId);

      if (!relationship) {
        relationship = graph
          .getIncomingEdges(actorId, 'relates_to')
          .find((e) => e.source === targetId);
      }

      const history = relationship?.properties?.interactionLog ?? [];
      const targetReputation =
        (targetNode.properties?.reputationScore as number) ?? DEFAULT_REPUTATION;

      // Apply modifier to these candidates
      const modified = applyDispositionModifier(
        targetCandidates,
        cooperationStrategy,
        history,
        targetReputation
      );

      // Replace the candidates in the scored list with modified versions
      scored = scored.map((c) => {
        const modifiedCandidate = modified.find((m) => m.templateId === c.templateId);
        return modifiedCandidate ?? c;
      });
    }
  }

  stages.push({
    stageName: 'disposition_modifier',
    candidateIds: scored.map((c) => c.templateId),
    scores: scored.map((c) => c.score),
    notes: cooperationStrategy ? `applied ${cooperationStrategy}` : 'no cooperation strategy',
  });

  // Step 3: Apply personality weights (extension point)
  const activeAmbitions = getActiveAmbitionsForScoring(graph, actorId);
  scored = applyPersonalityWeights(scored, activeAmbitions);

  stages.push({
    stageName: 'personality_weights',
    candidateIds: scored.map((c) => c.templateId),
    scores: scored.map((c) => c.score),
    notes: activeAmbitions.length > 0 ? `${activeAmbitions.length} active ambition(s)` : undefined,
  });

  // Step 4: Select top-N
  const topN = selectTopN(scored, config.topN);

  stages.push({
    stageName: 'top_n_selection',
    candidateIds: topN.map((c) => c.templateId),
    scores: topN.map((c) => c.score),
    notes: `kept top ${Math.min(config.topN, topN.length)} of ${scored.length}`,
  });

  // Step 5: Assign probabilities
  const withProbabilities = assignProbabilities(topN);

  stages.push({
    stageName: 'probability_assignment',
    candidateIds: withProbabilities.map((c) => c.templateId),
    scores: withProbabilities.map((c) => c.probability ?? 0),
  });

  // Step 6: Probabilistic select
  const roll = deterministicRoll ?? Math.random();
  const selected = probabilisticSelect(withProbabilities, roll);

  // Get actor and target names for human-readable summary
  const actorName = (actorNode.name || actorNode.id).split('.').pop() || actorNode.id;
  const targetNode = graph.getNode(selected.targetId);
  const targetName = (targetNode?.name || selected.targetId).split('.').pop() || selected.targetId;

  // Emit trace
  emitTrace({
    tick,
    category: 'action_selection',
    agentId: actorId,
    summary: `${actorName} chose ${selected.templateId} targeting ${targetName} (score: ${selected.score.toFixed(2)}, prob: ${((selected.probability ?? 0) * 100).toFixed(0)}%)`,
    stages,
    finalPick: {
      actionId: selected.templateId,
      actionName: selected.templateId,
      targetId: selected.targetId,
      targetName,
      score: selected.score,
      probability: selected.probability ?? 0,
      roll,
    },
  });

  return {
    selected,
    candidates: withProbabilities,
    wasSurvivalOverride: false,
  };
}
