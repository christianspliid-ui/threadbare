/**
 * Core Disposition Engine — game-theoretic cooperation modeling.
 *
 * Implements three groups of functions:
 * 1. evaluateStrategy — converts a CooperationStrategy + history into a disposition (+1/-1)
 * 2. applyDispositionModifier — adjusts action candidate scores based on disposition + reputation
 * 3. logInteraction, updateReputation, decayReputation — social memory and relationship evolution
 *
 * All functions are pure and deterministic for testability and replay.
 */

import type {
  CooperationStrategy,
  InteractionRecord,
  SocialOrientation,
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
} from '../types/disposition';
import type { ActionCandidate } from '../types/agent';

// ─── GROUP 1: evaluateStrategy ────────────────────────────────────────────

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

// ─── GROUP 2: applyDispositionModifier ────────────────────────────────────

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

// ─── GROUP 3: Interaction Logging & Reputation ────────────────────────────

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
