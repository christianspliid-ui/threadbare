/**
 * Social Counter-Argument Engine — personality-driven target responses.
 *
 * When a social scene reaches the Counter step, the target agent's dominant
 * axiological axis determines how they push back. The selected counter-argument
 * modifies the NEXT step's difficulty:
 *
 * - Actor's reach is in `vulnerableTo`  → COUNTER_VULNERABLE_BONUS applied
 * - Actor's reach is in `resistantTo`   → COUNTER_RESISTANT_PENALTY applied
 * - Neither                             → no modification
 *
 * ─── Constants ────────────────────────────────────────────────────
 * See counter-argument-content.ts for COUNTER_VULNERABLE_BONUS, COUNTER_RESISTANT_PENALTY,
 * and COUNTER_ARGUMENT_LEVERAGE_THRESHOLD.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure case                             | Fallback                           |
 * |------------------------------------------|------------------------------------|
 * | Target has no axiological profile        | Return null (no counter-argument)  |
 * | Axis not found in library                | Return null (no counter-argument)  |
 * | Leverage exceeds suppression threshold   | Return null (target overwhelmed)   |
 * | All axis values are equal                | Use first axis with non-zero value |
 *
 * ─── PRNG ─────────────────────────────────────────────────────────
 * None — counter selection is deterministic from the target's profile.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { ValuePair, AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';
import {
  COUNTER_ARGUMENT_LIBRARY,
  COUNTER_VULNERABLE_BONUS,
  COUNTER_RESISTANT_PENALTY,
  COUNTER_ARGUMENT_LEVERAGE_THRESHOLD,
} from '../data/counter-argument-content';
import type { CounterNarrative } from '../data/counter-argument-content';

// ─── Result Types ──────────────────────────────────────────────────────────

export interface CounterArgumentResult {
  /** Prose narrative for the counter-argument. */
  narrative: string;
  /** Axis that drove this counter. */
  axis: ValuePair;
  /** Which pole (positive = virtue end, negative = flaw end). */
  pole: 'positive' | 'negative';
  /** Reach domains that work against this counter. */
  vulnerableTo: ReachDomain[];
  /** Reach domains that bounce off this counter. */
  resistantTo: ReachDomain[];
  /**
   * Difficulty modifier to apply when actor's reach matches vulnerability/resistance.
   * 0 if actor's reach is neutral.
   */
  difficultyModifier: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Find the target's dominant axiological axis — the pair with the highest
 * absolute value (strongest personality signal).
 * Returns the first non-zero pair if all are equal, or null if profile is empty.
 */
export function findDominantAxis(
  profile: AxiologicalProfile,
): { axis: ValuePair; value: number } | null {
  let best: { axis: ValuePair; value: number } | null = null;
  let bestAbs = -1;

  for (const axis of VALUE_PAIRS) {
    const val = profile[axis] ?? 0;
    const abs = Math.abs(val);
    if (abs > bestAbs) {
      bestAbs = abs;
      best = { axis, value: val };
    }
  }

  return best;
}

// ─── Main API ──────────────────────────────────────────────────────────────

/**
 * Select the counter-argument for a social scene's Counter step.
 *
 * Called when a social scene encounters the Counter step (step 4 in the arc).
 * Returns null if:
 * - Target has no axiological profile
 * - The dominant axis isn't in the library
 * - Leverage is so high the target can't argue back
 *
 * @param graph       World graph
 * @param targetId    The agent being influenced (will choose their counter)
 * @param actorReach  The actor's reach for the current Counter step
 * @param leverage    Current leverage (high leverage suppresses the counter)
 */
export function selectCounterArgument(
  graph: WorldGraph,
  targetId: string,
  actorReach: ReachDomain,
  leverage: number,
): CounterArgumentResult | null {
  // If leverage is overwhelming, target has no good counter
  if (leverage >= COUNTER_ARGUMENT_LEVERAGE_THRESHOLD) {
    return null;
  }

  const targetNode = graph.getNode(targetId);
  if (!targetNode) return null;

  const profile = targetNode.properties.axiologicalProfile as AxiologicalProfile | undefined;
  if (!profile) return null;

  const dominant = findDominantAxis(profile);
  if (!dominant || dominant.value === 0) return null;

  const poles = COUNTER_ARGUMENT_LIBRARY[dominant.axis];
  if (!poles) return null;

  const pole: 'positive' | 'negative' = dominant.value >= 0 ? 'positive' : 'negative';
  const counter: CounterNarrative = poles[pole];

  // Compute difficulty modifier based on actor's approach
  let difficultyModifier = 0;
  if (counter.vulnerableTo.includes(actorReach)) {
    difficultyModifier = COUNTER_VULNERABLE_BONUS;
  } else if (counter.resistantTo.includes(actorReach)) {
    difficultyModifier = COUNTER_RESISTANT_PENALTY;
  }

  return {
    narrative: counter.narrative,
    axis: dominant.axis,
    pole,
    vulnerableTo: counter.vulnerableTo,
    resistantTo: counter.resistantTo,
    difficultyModifier,
  };
}

/**
 * Apply a counter-argument result to a step's difficulty.
 * Adds the difficultyModifier to the raw (0-100 scale) difficulty.
 * Clamps result to [1, 100].
 */
export function applyCounterModifier(baseDifficulty: number, counter: CounterArgumentResult | null): number {
  if (!counter || counter.difficultyModifier === 0) return baseDifficulty;
  return Math.max(1, Math.min(100, baseDifficulty + counter.difficultyModifier));
}
