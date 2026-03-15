/**
 * Contestation — detection and resolution of opposing actions.
 *
 * Phase 3 of the unified pipeline: when two active actions target
 * the same node and their templates declare contestsWith each other,
 * they resolve as a contested pair via dual independent rolls.
 *
 * Design principles:
 * - Defender wins ties (stability bias)
 * - Both sides roll independently using existing resolution system
 * - Contestation is per-step, not per-action
 *
 * Sprint 4 — Task 4.1
 */

import type {
  UnifiedAction,
  UnifiedActionTemplate,
  StepOutcome,
} from '../types/unifiedAction';
import type { GameState } from '../types/gameState';
import { computeCapability } from './domainCapability';
import { resolveContestedAction } from './resolution';

// ─── Types ──────────────────────────────────────────────────────

export interface ContestationPair {
  readonly attackerActionId: string;
  readonly defenderActionId: string;
  readonly targetId: string;
}

export interface ContestationResult {
  readonly attackerOutcome: StepOutcome;
  readonly defenderOutcome: StepOutcome;
}

// ─── Detection ──────────────────────────────────────────────────

/**
 * Detect contestation pairs among completing actions.
 *
 * Two actions contest when:
 * 1. Both are completing on the same tick (in the `completing` set)
 * 2. They target the same node
 * 3. One template's `contestsWith` includes the other's template ID
 *
 * The "attacker" is the action whose template declares contestsWith
 * the other. If both declare it, the one with higher scale priority
 * (cosmic > regional > local > personal) is the attacker. On tie,
 * the one created first (lower startTick or actionId) attacks.
 *
 * Each action appears in at most one pair per tick. If multiple
 * possible pairs exist, the highest-priority pair is chosen.
 */
export function detectContestations(
  completing: readonly UnifiedAction[],
  templates: readonly UnifiedActionTemplate[],
): ContestationPair[] {
  const pairs: ContestationPair[] = [];
  const claimed = new Set<string>(); // actionIds already in a pair

  const templateMap = new Map<string, UnifiedActionTemplate>();
  for (const t of templates) {
    templateMap.set(t.id, t);
  }

  // Group completing actions by target
  const byTarget = new Map<string, UnifiedAction[]>();
  for (const action of completing) {
    const group = byTarget.get(action.targetId) ?? [];
    group.push(action);
    byTarget.set(action.targetId, group);
  }

  for (const [targetId, actions] of byTarget) {
    if (actions.length < 2) continue;

    // Check all pairs at this target
    for (let i = 0; i < actions.length; i++) {
      if (claimed.has(actions[i].actionId)) continue;

      for (let j = i + 1; j < actions.length; j++) {
        if (claimed.has(actions[j].actionId)) continue;

        const a = actions[i];
        const b = actions[j];
        const tA = templateMap.get(a.templateId);
        const tB = templateMap.get(b.templateId);
        if (!tA || !tB) continue;

        const aContestsB = tA.contestsWith?.includes(b.templateId) ?? false;
        const bContestsA = tB.contestsWith?.includes(a.templateId) ?? false;

        if (!aContestsB && !bContestsA) continue;

        // Determine attacker/defender
        let attacker: UnifiedAction;
        let defender: UnifiedAction;

        if (aContestsB && !bContestsA) {
          attacker = a;
          defender = b;
        } else if (bContestsA && !aContestsB) {
          attacker = b;
          defender = a;
        } else {
          // Both contest each other — higher scale attacks, FIFO tiebreak
          const scaleA = { cosmic: 0, regional: 1, local: 2, personal: 3 }[a.scale];
          const scaleB = { cosmic: 0, regional: 1, local: 2, personal: 3 }[b.scale];
          if (scaleA < scaleB) {
            attacker = a; defender = b;
          } else if (scaleB < scaleA) {
            attacker = b; defender = a;
          } else {
            // Same scale — earlier startTick attacks, then actionId tiebreak
            attacker = a.startTick <= b.startTick ? a : b;
            defender = attacker === a ? b : a;
          }
        }

        pairs.push({
          attackerActionId: attacker.actionId,
          defenderActionId: defender.actionId,
          targetId,
        });

        claimed.add(attacker.actionId);
        claimed.add(defender.actionId);
        break; // action[i] is now claimed, move to next i
      }
    }
  }

  return pairs;
}

// ─── Resolution ─────────────────────────────────────────────────

/**
 * Resolve a contested pair using dual independent rolls.
 *
 * Both sides compute capability in their step's reach domain,
 * then resolve via resolveContestedAction. The contest outcome
 * maps to step outcomes for each side.
 *
 * Stability bias: defender wins stalemates (both succeed).
 */
export function resolveContestationPair(
  attacker: UnifiedAction,
  defender: UnifiedAction,
  attackerTemplate: UnifiedActionTemplate,
  defenderTemplate: UnifiedActionTemplate,
  state: GameState,
  rng: () => number,
): ContestationResult {
  const attackerStep = attackerTemplate.steps[attacker.currentStep];
  const defenderStep = defenderTemplate.steps[defender.currentStep];

  if (!attackerStep || !defenderStep) {
    // Defensive fallback — shouldn't happen with valid templates
    return { attackerOutcome: 'failure', defenderOutcome: 'success' };
  }

  // Compute capabilities
  const attackerCap = computeCapability(state.graph, attacker.actorId, attackerStep.reach);
  const defenderCap = computeCapability(state.graph, defender.actorId, defenderStep.reach);

  // Compute probabilities (clamped 0.05-0.95)
  const attackerProb = Math.min(0.95, Math.max(0.05,
    attackerCap - attackerStep.difficulty,
  ));
  const defenderProb = Math.min(0.95, Math.max(0.05,
    defenderCap - defenderStep.difficulty,
  ));

  // Dual independent rolls
  const attackerRoll = Math.floor(rng() * 100) + 1;
  const defenderRoll = Math.floor(rng() * 100) + 1;

  const result = resolveContestedAction(
    attackerProb, attackerRoll,
    defenderProb, defenderRoll,
  );

  // Map contest outcome to step outcomes
  switch (result.contestOutcome) {
    case 'attacker_wins':
      return { attackerOutcome: 'success', defenderOutcome: 'failure' };
    case 'defender_wins':
      return { attackerOutcome: 'failure', defenderOutcome: 'success' };
    case 'stalemate':
      // Stability bias: defender wins ties
      return { attackerOutcome: 'failure', defenderOutcome: 'success' };
    case 'mutual_failure':
      return { attackerOutcome: 'failure', defenderOutcome: 'failure' };
    default:
      return { attackerOutcome: 'failure', defenderOutcome: 'success' };
  }
}
