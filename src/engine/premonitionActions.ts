/**
 * Premonition Actions — processes player choices from premonition modals.
 *
 * Whisper choices create DivineInfluenceEntry entries with scoring biases.
 * Compulsion choices create a strong score boost for the chosen encounter.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { GameState } from '../types/gameState';
import type { WhisperNudge, CompulsionCandidate, PremonitionTrace } from '../types/premonition';
import type { DivineInfluenceEntry, InterventionType } from '../types/dream';
import type { EssencePool } from '../types/influence';
import type { SphereName } from '../types';
import { addDivineInfluence } from './interventionEffects';
import { emitTrace } from './traceBuffer';
import {
  WHISPER_INFLUENCE_STRENGTH,
  WHISPER_INFLUENCE_DURATION,
  WHISPER_INFLUENCE_DECAY_RATE,
  COMPULSION_SCORE_BOOST,
  AMBITION_DRIFT_PROBABILITY,
} from '../data/premonition-constants';

// ─── Influence Counter ──────────────────────────────────────────

let influenceCounter = 0;

export function resetPremonitionCounter(): void {
  influenceCounter = 0;
}

function nextInfluenceId(tick: number): string {
  return `di_premonition_${tick}_${influenceCounter++}`;
}

// ─── Apply Whisper Choice ───────────────────────────────────────

export interface WhisperResult {
  success: boolean;
  influenceId: string | null;
  essenceSpent: number;
  message: string;
}

export function applyWhisperChoice(
  state: GameState,
  agentId: string,
  agentName: string,
  nudge: WhisperNudge,
): WhisperResult {
  const { graph, essencePool, tick } = state;

  // Check essence
  if (essencePool[nudge.sphere] < nudge.essenceCost) {
    return { success: false, influenceId: null, essenceSpent: 0, message: 'Not enough essence' };
  }

  // Deduct essence
  essencePool[nudge.sphere] -= nudge.essenceCost;

  // Determine intervention type for the influence entry
  const interventionType: InterventionType = nudge.category === 'ambition_drift'
    ? 'dream' : 'omen';

  const influenceId = nextInfluenceId(tick);

  // Build DivineInfluenceEntry based on nudge category
  const influence: DivineInfluenceEntry = {
    id: influenceId,
    interventionType,
    sphere: nudge.sphere,
    tickApplied: tick,
    initialStrength: WHISPER_INFLUENCE_STRENGTH,
    decayRate: WHISPER_INFLUENCE_DECAY_RATE,
    minimumStrength: 0,
    maxDuration: WHISPER_INFLUENCE_DURATION,
  };

  // Set category-specific effects
  switch (nudge.category) {
    case 'reach_bias':
      if (nudge.targetReach) {
        influence.reachBoost = { reach: nudge.targetReach, bonus: WHISPER_INFLUENCE_STRENGTH };
      }
      influence.behaviorTag = `whisper_reach_${nudge.targetReach}`;
      break;

    case 'sphere_bias':
      // Sphere bias affects the axiological profile toward the sphere's value pair
      influence.behaviorTag = `whisper_sphere_${nudge.targetSphere}`;
      break;

    case 'ambition_drift':
      influence.behaviorTag = 'whisper_ambition_drift';
      // Mark the agent for ambition re-evaluation (consumed by ambitionTick)
      const agentNode = graph.getNode(agentId);
      if (agentNode) {
        graph.updateNode(agentId, {
          properties: {
            ...agentNode.properties,
            ambitionDriftPending: true,
            ambitionDriftProbability: AMBITION_DRIFT_PROBABILITY,
          },
        });
      }
      break;

    case 'gather_strength':
      influence.behaviorTag = 'whisper_gather_strength';
      // Bias toward low-threat, restorative encounters
      influence.reachBoost = { reach: 'gold', bonus: WHISPER_INFLUENCE_STRENGTH * 0.5 };
      break;

    case 'gather_courage':
      influence.behaviorTag = 'whisper_gather_courage';
      // Bias toward higher-threat encounters (handled by scoring reading the tag)
      break;
  }

  addDivineInfluence(graph, agentId, influence);

  // Emit trace
  const trace: PremonitionTrace = {
    category: 'divine_premonition',
    subtype: 'whisper',
    agentId,
    agentName,
    tick,
    options: [nudge.category],
    playerChoice: nudge.category,
    essenceCost: nudge.essenceCost,
    sphereUsed: nudge.sphere,
    influenceId,
    summary: `Whisper: ${agentName} nudged toward ${nudge.prose}`,
  };
  emitTrace(trace as unknown as import('../types/trace').TraceEntry);

  return {
    success: true,
    influenceId,
    essenceSpent: nudge.essenceCost,
    message: `${agentName} is subtly drawn toward ${nudge.prose}`,
  };
}

// ─── Apply Compulsion Choice ────────────────────────────────────

export interface CompulsionResult {
  success: boolean;
  influenceId: string | null;
  essenceSpent: number;
  message: string;
}

export function applyCompulsionChoice(
  state: GameState,
  agentId: string,
  agentName: string,
  candidate: CompulsionCandidate,
): CompulsionResult {
  const { graph, essencePool, tick } = state;

  // Check essence
  if (essencePool[candidate.sphere] < candidate.essenceCost) {
    return { success: false, influenceId: null, essenceSpent: 0, message: 'Not enough essence' };
  }

  // Deduct essence
  essencePool[candidate.sphere] -= candidate.essenceCost;

  const influenceId = nextInfluenceId(tick);

  // Create a strong, short-lived influence that boosts the specific encounter
  const influence: DivineInfluenceEntry = {
    id: influenceId,
    interventionType: 'intimidate', // Compulsion = forceful
    sphere: candidate.sphere,
    tickApplied: tick,
    initialStrength: COMPULSION_SCORE_BOOST,
    decayRate: 1.0, // Decays very fast — only needs to last for the decision
    minimumStrength: 0,
    maxDuration: 3, // Only lasts a few ticks
    behaviorTag: `compulsion_target_${candidate.templateId}`,
  };

  // Also set a reach boost for the encounter's primary reach
  influence.reachBoost = { reach: candidate.reach, bonus: COMPULSION_SCORE_BOOST };

  addDivineInfluence(graph, agentId, influence);

  // Mark agent for forced encounter selection
  const agentNode = graph.getNode(agentId);
  if (agentNode) {
    graph.updateNode(agentId, {
      properties: {
        ...agentNode.properties,
        compulsionTargetTemplateId: candidate.templateId,
        compulsionTick: tick,
      },
    });
  }

  // Emit trace
  const trace: PremonitionTrace = {
    category: 'divine_premonition',
    subtype: 'compulsion',
    agentId,
    agentName,
    tick,
    options: [candidate.templateId],
    playerChoice: candidate.templateId,
    essenceCost: candidate.essenceCost,
    sphereUsed: candidate.sphere,
    influenceId,
    summary: `Compulsion: ${agentName} directed toward ${candidate.encounterName}`,
  };
  emitTrace(trace as unknown as import('../types/trace').TraceEntry);

  return {
    success: true,
    influenceId,
    essenceSpent: candidate.essenceCost,
    message: `${agentName} is compelled toward ${candidate.encounterName}`,
  };
}

// ─── Dismiss Premonition (no-op, just trace) ────────────────────

export function dismissPremonition(
  premonitionId: string,
  agentId: string,
  agentName: string,
  type: 'whisper' | 'compulsion',
  tick: number,
): void {
  const trace: PremonitionTrace = {
    category: 'divine_premonition',
    subtype: type,
    agentId,
    agentName,
    tick,
    options: [],
    playerChoice: null,
    essenceCost: 0,
    sphereUsed: null,
    influenceId: null,
    summary: `${type === 'whisper' ? 'Whisper' : 'Compulsion'} dismissed for ${agentName}`,
  };
  emitTrace(trace as unknown as import('../types/trace').TraceEntry);
}
