/**
 * Core Disposition Engine — game-theoretic cooperation modeling.
 *
 * Implements four groups of functions:
 * 1. assignCooperationStrategy — select a cooperation strategy based on archetype and profile
 * 2. evaluateStrategy — converts a CooperationStrategy + history into a disposition (+1/-1)
 * 3. applyDispositionModifier — adjusts action candidate scores based on disposition + reputation
 * 4. logInteraction, updateReputation, decayReputation — social memory and relationship evolution
 *
 * All functions are pure and deterministic for testability and replay.
 */

import type {
  CooperationStrategy,
  InteractionRecord,
  DilemmaOutcome,
  DilemmaEvent,
} from '../types/disposition';
import {
  DISPOSITION_COOPERATE_BONUS,
  DISPOSITION_DEFECT_BONUS,
  REPUTATION_UPDATE_COOPERATE,
  REPUTATION_UPDATE_DEFECT,
  REPUTATION_DECAY_PER_TICK,
  INTERACTION_LOG_CAP,
  DILEMMA_STAKES_THRESHOLD,
  DEFAULT_REPUTATION,
  COOPERATION_STRATEGIES,
  STAKES_DOMAIN_GOLD,
  STAKES_DOMAIN_IRON,
  STAKES_EXTREME_SENTIMENT,
  STAKES_FACTION_LEADER,
  STAKES_TERRITORY_CONTROL,
  STAKES_BASE,
  DILEMMA_MUTUAL_TRUST_SENTIMENT,
  DILEMMA_MUTUAL_TRUST_STRENGTH,
  DILEMMA_BETRAYAL_SENTIMENT,
  DILEMMA_MUTUAL_DISTRUST_SENTIMENT,
} from '../types/disposition';
import type { ActionCandidate, AxiologicalProfile } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import type { WorldGraph } from './graph';
import { getStrategyWeights } from '../data/game-theory-content';
import { emitTrace } from './traceBuffer';
import { applyTrustChange } from './trustMechanics';

// ─── GROUP 1: assignCooperationStrategy ───────────────────────────────────

/**
 * Assign a cooperation strategy to an agent based on archetype and axiological profile.
 *
 * Process:
 * 1. Get base strategy weights from archetype
 * 2. Apply axiological nudges:
 *    - loyalty_ambition < -0.3: always-defect ×1.5, always-cooperate ×0.5
 *    - mercy_ruthlessness < -0.3: grudger ×1.3
 *    - honesty_cunning < -0.3: tit-for-tat ×0.7, always-defect ×1.2
 * 3. Normalize weights to sum to 1.0
 * 4. Weighted random selection using seeded RNG
 *
 * @param archetypeId - Narrative archetype (e.g. 'tragic_hero')
 * @param profile - Axiological profile (values from -1 to 1)
 * @param rng - Seeded random number generator
 * @returns A cooperation strategy for this agent
 */
export function assignCooperationStrategy(
  archetypeId: string,
  profile: AxiologicalProfile,
  rng: () => number,
): CooperationStrategy {
  // Get base weights from archetype
  const baseWeights = getStrategyWeights(archetypeId);
  const weights = { ...baseWeights };

  // Apply axiological nudges (< -0.3 = toward the flaw pole)
  if (profile.loyalty_ambition < -0.3) {
    weights['always-defect'] *= 1.5;
    weights['always-cooperate'] *= 0.5;
  }

  if (profile.mercy_ruthlessness < -0.3) {
    weights.grudger *= 1.3;
  }

  if (profile.honesty_cunning < -0.3) {
    weights['tit-for-tat'] *= 0.7;
    weights['always-defect'] *= 1.2;
  }

  // Normalize weights to sum to 1.0
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) {
    // Fallback: uniform distribution (shouldn't happen)
    return COOPERATION_STRATEGIES[Math.floor(rng() * COOPERATION_STRATEGIES.length)];
  }

  const normalized = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / total])
  ) as Record<CooperationStrategy, number>;

  // Weighted random selection
  let rand = rng();
  let cumulative = 0;

  for (const strategy of COOPERATION_STRATEGIES) {
    cumulative += normalized[strategy];
    if (rand <= cumulative) {
      return strategy;
    }
  }

  // Fallback (shouldn't happen)
  return COOPERATION_STRATEGIES[COOPERATION_STRATEGIES.length - 1];
}

// ─── GROUP 2: evaluateStrategy ────────────────────────────────────────────

/**
 * Evaluate the next move based on a cooperation strategy and interaction history.
 * Returns +1 (cooperate) or -1 (defect).
 *
 * On empty history, all strategies cooperate except 'always-defect'.
 */
export function evaluateStrategy(
  strategy: CooperationStrategy,
  history: InteractionRecord[],
): number {
  // On first interaction, most strategies cooperate (grim trigger initialization)
  if (history.length === 0) {
    return initialMove(strategy);
  }

  // Look at the most recent interaction
  const last = history[history.length - 1];

  switch (strategy) {
    case 'tit-for-tat':
      // Mirror the target's last move
      return last.targetMove === 'cooperate' ? 1 : -1;

    case 'grudger':
      // Cooperate unless target ever defected
      return history.some((h) => h.targetMove === 'defect') ? -1 : 1;

    case 'pavlov':
      // Repeat if outcomes matched, switch if they diverged
      // When matched, repeat the actor's last move; when diverged, switch it
      if (last.actorMove === last.targetMove) {
        // Same outcome: repeat the actor's move
        return last.actorMove === 'cooperate' ? 1 : -1;
      } else {
        // Different outcome: switch from the actor's move
        return last.actorMove === 'cooperate' ? -1 : 1;
      }

    case 'always-cooperate':
      // Unconditional cooperation
      return 1;

    case 'always-defect':
      // Unconditional defection
      return -1;
  }
}

/**
 * Determine the first move for a strategy (on empty history).
 */
function initialMove(strategy: CooperationStrategy): number {
  return strategy === 'always-defect' ? -1 : 1;
}

// ─── GROUP 3: applyDispositionModifier ────────────────────────────────────

/**
 * Modify action candidate scores based on disposition and target reputation.
 *
 * - No-op if no candidates have a social orientation (cooperative/defective)
 * - Boosts cooperative candidates when disposition is positive
 * - Boosts defective candidates when disposition is negative
 * - Factors target reputation into the final disposition value
 * - Leaves neutral-oriented candidates unchanged
 */
export function applyDispositionModifier(
  candidates: ActionCandidate[],
  strategy: CooperationStrategy,
  history: InteractionRecord[],
  targetReputation: number,
): ActionCandidate[] {
  // Early exit: if no social candidates exist, return unchanged
  const hasSocial = candidates.some(
    (c) =>
      c.socialOrientation === 'cooperative' ||
      c.socialOrientation === 'defective',
  );
  if (!hasSocial) {
    return candidates;
  }

  // Evaluate strategy to get base disposition
  const disposition = evaluateStrategy(strategy, history);

  // Factor in target reputation: shift disposition toward or away from cooperation
  // reputation [0, 1] → reputationFactor [-0.2, +0.2]
  const reputationFactor = (targetReputation - 0.5) * 0.4;
  const finalDisposition = Math.max(
    -1,
    Math.min(1, disposition + reputationFactor),
  );

  // Apply modifier to each candidate
  return candidates.map((c) => {
    if (c.socialOrientation === 'cooperative') {
      // Boost cooperative actions when disposition is positive
      return {
        ...c,
        score: c.score + finalDisposition * DISPOSITION_COOPERATE_BONUS,
      };
    }

    if (c.socialOrientation === 'defective') {
      // Boost defective actions when disposition is negative (i.e., penalize when positive)
      return {
        ...c,
        score: c.score - finalDisposition * DISPOSITION_DEFECT_BONUS,
      };
    }

    // Neutral candidates pass through unchanged
    return c;
  });
}

// ─── GROUP 4: Interaction Logging & Reputation ────────────────────────────

/**
 * Log a new interaction in an agent's social memory.
 * Caps log at INTERACTION_LOG_CAP, removing oldest entries if needed.
 * Marks stakes as 'high' if stakes >= DILEMMA_STAKES_THRESHOLD.
 */
export function logInteraction(
  log: InteractionRecord[],
  tick: number,
  actorMove: 'cooperate' | 'defect',
  targetMove: 'cooperate' | 'defect',
  context: string,
  stakes: number,
): InteractionRecord[] {
  const record: InteractionRecord = {
    tick,
    actorMove,
    targetMove,
    context,
    stakes: stakes >= DILEMMA_STAKES_THRESHOLD ? 'high' : 'low',
  };

  const newLog = [...log, record];

  // Cap at INTERACTION_LOG_CAP, removing oldest entries
  if (newLog.length > INTERACTION_LOG_CAP) {
    return newLog.slice(newLog.length - INTERACTION_LOG_CAP);
  }

  return newLog;
}

/**
 * Update reputation based on a move (cooperate or defect).
 * - Cooperate: +REPUTATION_UPDATE_COOPERATE
 * - Defect: +REPUTATION_UPDATE_DEFECT (negative value = penalty)
 * Clamps result to [0, 1].
 *
 * Note: REPUTATION_UPDATE_DEFECT is more negative than REPUTATION_UPDATE_COOPERATE
 * is positive (asymmetric), modeling how betrayal damages trust more than cooperation builds it.
 */
export function updateReputation(
  current: number,
  move: 'cooperate' | 'defect',
): number {
  const delta =
    move === 'cooperate'
      ? REPUTATION_UPDATE_COOPERATE
      : REPUTATION_UPDATE_DEFECT;

  return Math.max(0, Math.min(1, current + delta));
}

/**
 * Decay reputation per tick toward DEFAULT_REPUTATION (0.5).
 * - Above 0.5: decays downward by REPUTATION_DECAY_PER_TICK
 * - Below 0.5: decays upward by REPUTATION_DECAY_PER_TICK
 * - At 0.5: no change
 *
 * Models agents gradually forgetting or moving past old grudges/alliances.
 */
export function decayReputation(current: number): number {
  if (current > DEFAULT_REPUTATION) {
    // Decay downward toward default
    return Math.max(DEFAULT_REPUTATION, current - REPUTATION_DECAY_PER_TICK);
  }

  if (current < DEFAULT_REPUTATION) {
    // Decay upward toward default
    return Math.min(DEFAULT_REPUTATION, current + REPUTATION_DECAY_PER_TICK);
  }

  // At default, no change
  return current;
}

// ─── GROUP 5: Dilemma Engine ──────────────────────────────────────────────

/**
 * Compute the stakes of an interaction (0.0–1.0 scale).
 *
 * Stakes are accumulated from:
 * - Domain: gold (+0.3) or iron (+0.4)
 * - Extreme sentiment: |sentiment| > 0.7 (+0.2)
 * - Faction leadership (+0.3)
 * - Territory control (+0.3)
 *
 * Result is clamped to [0, 1].
 */
export function computeStakes(
  domain: ReachDomain,
  sentiment: number,
  isFactionLeader: boolean,
  isTerritory: boolean,
): number {
  let stakes = STAKES_BASE; // Base floor — every interaction has minimum stakes

  if (domain === 'gold') stakes += STAKES_DOMAIN_GOLD;
  if (domain === 'iron') stakes += STAKES_DOMAIN_IRON;
  if (Math.abs(sentiment) > 0.7) stakes += STAKES_EXTREME_SENTIMENT;
  if (isFactionLeader) stakes += STAKES_FACTION_LEADER;
  if (isTerritory) stakes += STAKES_TERRITORY_CONTROL;

  return Math.max(0, Math.min(1, stakes));
}

/**
 * Resolve a dilemma between two actors by evaluating their strategies.
 *
 * Process:
 * 1. Evaluate each actor's strategy based on their interaction history
 * 2. Determine each actor's move (cooperate if disposition > 0, defect otherwise)
 * 3. Classify the outcome into one of four outcomes:
 *    - mutual_trust: both cooperate
 *    - betrayed: actor cooperates, target defects
 *    - exploitation: actor defects, target cooperates
 *    - mutual_distrust: both defect
 *
 * @returns A DilemmaEvent with outcome classification and context
 */
export function resolveDilemma(
  actorId: string,
  targetId: string,
  actorStrategy: CooperationStrategy,
  targetStrategy: CooperationStrategy,
  actorHistory: InteractionRecord[],
  targetHistory: InteractionRecord[],
  tick: number,
  context: string,
  stakes: number,
  graph?: WorldGraph,
): DilemmaEvent {
  // Evaluate strategies to get disposition values
  const actorDisposition = evaluateStrategy(actorStrategy, actorHistory);
  const targetDisposition = evaluateStrategy(targetStrategy, targetHistory);

  // Convert dispositions to moves
  const actorMove = actorDisposition > 0 ? 'cooperate' : 'defect';
  const targetMove = targetDisposition > 0 ? 'cooperate' : 'defect';

  // Classify outcome
  let outcome: DilemmaOutcome;
  if (actorMove === 'cooperate' && targetMove === 'cooperate') {
    outcome = 'mutual_trust';
  } else if (actorMove === 'cooperate' && targetMove === 'defect') {
    outcome = 'betrayed';
  } else if (actorMove === 'defect' && targetMove === 'cooperate') {
    outcome = 'exploitation';
  } else {
    outcome = 'mutual_distrust';
  }

  const dilemmaEvent: DilemmaEvent = {
    tick,
    actorId,
    targetId,
    actorMove,
    targetMove,
    outcome,
    stakes,
    context,
  };

  // ─── Trace instrumentation ──────────────────────────────────────────

  const effects = applyDilemmaEffects(outcome);

  // ─── Trust update (Phase 4: Social Fabric) ────────────────────────
  // Update trust on relates_to edges based on cooperation/defection.
  // Graph parameter is optional for backward compatibility.
  if (graph) {
    applyTrustChange(graph, actorId, targetId, actorMove === 'cooperate');
    applyTrustChange(graph, targetId, actorId, targetMove === 'cooperate');
  }

  emitTrace({
    tick,
    category: 'dilemma_resolution',
    agentId: actorId,
    targetId,
    summary: `Dilemma: ${actorId} (${actorStrategy}) vs ${targetId} (${targetStrategy}) → ${outcome}`,
    actorStrategy,
    targetStrategy,
    actorMove,
    targetMove,
    outcome,
    stakes,
    sentimentDelta: effects.sentimentDelta,
    reputationDeltas: {
      actor: effects.actorRepDelta,
      target: effects.targetRepDelta,
    },
  });

  return dilemmaEvent;
}

/**
 * Effects of a dilemma outcome.
 * Applied to sentiment, bond strength, and reputation values.
 */
export interface DilemmaEffects {
  sentimentDelta: number;
  strengthDelta: number;
  actorRepDelta: number;
  targetRepDelta: number;
}

/**
 * Apply a dilemma outcome to get sentiment, strength, and reputation deltas.
 *
 * Outcomes vary symmetrically:
 * - mutual_trust: both gain trust (+0.15 sentiment, +0.1 strength, +0.05 rep each)
 * - betrayed: actor loses ground (+0.025 rep), target gains (+DEFECT rep)
 * - exploitation: actor gains (+DEFECT rep), target loses (+0.025 rep)
 * - mutual_distrust: both penalized (-0.1 sentiment, -0.04 rep each)
 */
export function applyDilemmaEffects(outcome: DilemmaOutcome): DilemmaEffects {
  switch (outcome) {
    case 'mutual_trust':
      return {
        sentimentDelta: DILEMMA_MUTUAL_TRUST_SENTIMENT,
        strengthDelta: DILEMMA_MUTUAL_TRUST_STRENGTH,
        actorRepDelta: REPUTATION_UPDATE_COOPERATE,
        targetRepDelta: REPUTATION_UPDATE_COOPERATE,
      };

    case 'betrayed':
      // Actor cooperated, target defected
      return {
        sentimentDelta: DILEMMA_BETRAYAL_SENTIMENT,
        strengthDelta: 0,
        actorRepDelta: REPUTATION_UPDATE_COOPERATE * 0.5,
        targetRepDelta: REPUTATION_UPDATE_DEFECT,
      };

    case 'exploitation':
      // Actor defected, target cooperated
      return {
        sentimentDelta: DILEMMA_BETRAYAL_SENTIMENT,
        strengthDelta: 0,
        actorRepDelta: REPUTATION_UPDATE_DEFECT,
        targetRepDelta: REPUTATION_UPDATE_COOPERATE * 0.5,
      };

    case 'mutual_distrust':
      return {
        sentimentDelta: DILEMMA_MUTUAL_DISTRUST_SENTIMENT,
        strengthDelta: 0,
        actorRepDelta: REPUTATION_UPDATE_DEFECT * 0.5,
        targetRepDelta: REPUTATION_UPDATE_DEFECT * 0.5,
      };
  }
}
