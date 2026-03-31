/**
 * Spell Activation — cost payment, prerequisite validation, backlash resolution.
 *
 * Handles the full lifecycle of casting a spell:
 * 1. Prerequisite validation (can this agent cast?)
 * 2. Cooldown check (is it ready?)
 * 3. Cost validation (can the agent afford it?)
 * 4. Cost payment (atomic — all or nothing)
 * 5. Effect resolution (apply spell effects)
 * 6. Backlash evaluation (on failure)
 * 7. Trace emission
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                        | Default | Purpose                       |
 * |-----------------------------|---------|-------------------------------|
 * | SPELL_COST_REACH_DRAIN_CAP  | 0.20    | Max reach drain per cast      |
 * | DOOM_COST_CAP_PER_CAST      | 30      | Max doom increase per cast    |
 * | BACKLASH_PROBABILITY_FLOOR  | 0.05    | Min backlash chance           |
 * | COOLDOWN_MINIMUM_TICKS      | 5       | Floor for cooldown values     |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * Backlash probability check uses seeded roll.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type {
  SpellTemplate,
  SpellCost,
  BacklashEffect,
  AttachmentEffect,
  EffectActivationTrace,
  EffectRuntimeState,
} from '../types/effects';
import {
  SPELL_COST_REACH_DRAIN_CAP,
  DOOM_COST_CAP_PER_CAST,
  BACKLASH_PROBABILITY_FLOOR,
  COOLDOWN_MINIMUM_TICKS,
} from '../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Activation Result
// ═══════════════════════════════════════════════════════════════════

export type ActivationOutcome =
  | 'success'
  | 'blocked_prerequisite'
  | 'blocked_cooldown'
  | 'blocked_cost'
  | 'backlash';

export interface ActivationResult {
  outcome: ActivationOutcome;
  /** Effects that should be applied (empty on block/backlash) */
  appliedEffects: AttachmentEffect[];
  /** Backlash effect if it fired */
  backlashEffect?: AttachmentEffect;
  /** Costs that were paid (empty if blocked) */
  paidCosts: SpellCost[];
  /** Narrative text for the backlash (if any) */
  backlashNarrative?: string;
  /** Trace for inspectability */
  trace: EffectActivationTrace;
}

// ═══════════════════════════════════════════════════════════════════
// Prerequisite Validation
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an agent meets the prerequisites to cast a spell.
 */
export function checkPrerequisites(
  graph: WorldGraph,
  agentId: string,
  spell: SpellTemplate,
): { met: boolean; reason?: string } {
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return { met: false, reason: 'Agent not found' };

  const prereqs = spell.prerequisites;

  // Check minimum reach requirements
  if (prereqs.minReach) {
    const domainCapability = agentNode.properties.domainCapability as
      Partial<Record<ReachDomain, number>> | undefined;
    for (const [reach, minVal] of Object.entries(prereqs.minReach)) {
      const agentVal = domainCapability?.[reach as ReachDomain] ?? 0;
      if (agentVal < minVal) {
        return { met: false, reason: `${reach} too low: ${agentVal} < ${minVal}` };
      }
    }
  }

  // Check required traits
  if (prereqs.requiredTraits) {
    const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
    const traitNames = new Set<string>();
    for (const edge of traitEdges) {
      const traitNode = graph.getNode(edge.target);
      if (traitNode) {
        traitNames.add(traitNode.properties.name as string ?? '');
        const tags = traitNode.properties.tags as string[] | undefined;
        if (tags) tags.forEach(t => traitNames.add(t));
      }
    }
    for (const req of prereqs.requiredTraits) {
      if (!traitNames.has(req)) {
        return { met: false, reason: `Missing required trait: ${req}` };
      }
    }
  }

  // Check required attachment
  if (prereqs.requiredAttachment) {
    const possEdges = [
      ...graph.getOutgoingEdges(agentId, 'possesses'),
      ...graph.getOutgoingEdges(agentId, 'bonded_to'),
    ];
    const hasTags = possEdges.some(e => {
      const node = graph.getNode(e.target);
      if (!node) return false;
      const tags = node.properties.tags as string[] | undefined;
      return tags?.includes(prereqs.requiredAttachment!) ?? false;
    });
    if (!hasTags) {
      return { met: false, reason: `Missing required attachment: ${prereqs.requiredAttachment}` };
    }
  }

  return { met: true };
}

// ═══════════════════════════════════════════════════════════════════
// Cost Validation & Payment
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an agent can pay all costs for a spell.
 * Does NOT actually pay — this is a validation pass.
 */
export function canPayCosts(
  graph: WorldGraph,
  agentId: string,
  costs: SpellCost | SpellCost[],
): { canPay: boolean; reason?: string } {
  const costArray = Array.isArray(costs) ? costs : [costs];

  for (const cost of costArray) {
    switch (cost.type) {
      case 'reach_drain': {
        const agentNode = graph.getNode(agentId);
        const dc = agentNode?.properties.domainCapability as
          Partial<Record<ReachDomain, number>> | undefined;
        const current = dc?.[cost.reach] ?? 0;
        if (current < cost.amount) {
          return { canPay: false, reason: `Insufficient ${cost.reach}: ${current} < ${cost.amount}` };
        }
        break;
      }
      case 'attachment_consume': {
        const possEdges = [
          ...graph.getOutgoingEdges(agentId, 'possesses'),
          ...graph.getOutgoingEdges(agentId, 'bonded_to'),
        ];
        const hasTag = possEdges.some(e => {
          const node = graph.getNode(e.target);
          const tags = node?.properties.tags as string[] | undefined;
          return tags?.includes(cost.tag) ?? false;
        });
        if (!hasTag) {
          return { canPay: false, reason: `No attachment with tag: ${cost.tag}` };
        }
        break;
      }
      case 'multi': {
        const innerResult = canPayCosts(graph, agentId, cost.costs);
        if (!innerResult.canPay) return innerResult;
        break;
      }
      // Other cost types always payable (doom, condition, relationship, exhaust, health)
      default:
        break;
    }
  }

  return { canPay: true };
}

/**
 * Pay spell costs. Call only after canPayCosts returns true.
 * Mutates graph state.
 */
export function payCosts(
  graph: WorldGraph,
  agentId: string,
  costs: SpellCost | SpellCost[],
): void {
  const costArray = Array.isArray(costs) ? costs : [costs];

  for (const cost of costArray) {
    switch (cost.type) {
      case 'reach_drain': {
        const agentNode = graph.getNode(agentId);
        if (!agentNode) break;
        const dc = (agentNode.properties.domainCapability ?? {}) as Record<ReachDomain, number>;
        const capped = Math.min(cost.amount, SPELL_COST_REACH_DRAIN_CAP);
        dc[cost.reach] = Math.max(0, (dc[cost.reach] ?? 0) - capped);
        agentNode.properties.domainCapability = dc;
        break;
      }
      case 'doom_increase': {
        const agentNode = graph.getNode(agentId);
        if (!agentNode) break;
        const capped = Math.min(cost.amount, DOOM_COST_CAP_PER_CAST);
        agentNode.properties.doom = ((agentNode.properties.doom as number) ?? 0) + capped;
        break;
      }
      case 'attachment_consume': {
        const possEdges = [
          ...graph.getOutgoingEdges(agentId, 'possesses'),
          ...graph.getOutgoingEdges(agentId, 'bonded_to'),
        ];
        for (const e of possEdges) {
          const node = graph.getNode(e.target);
          const tags = node?.properties.tags as string[] | undefined;
          if (tags?.includes(cost.tag)) {
            try { graph.removeEdge(e.id); } catch { /* ok */ }
            try { graph.removeNode(e.target); } catch { /* ok */ }
            break; // Only consume one
          }
        }
        break;
      }
      case 'condition_inflict': {
        // Create a condition trait on the agent
        const condId = `cond_${agentId}_${cost.template}_${Date.now()}`;
        graph.addNode({
          id: condId,
          type: 'trait',
          name: cost.template,
          properties: { subcategory: 'condition', tags: [cost.template] },
        });
        graph.addEdge({
          id: `e_${condId}`,
          type: 'has_trait',
          source: agentId,
          target: condId,
          properties: {},
        });
        break;
      }
      case 'tick_exhaust': {
        const agentNode = graph.getNode(agentId);
        if (!agentNode) break;
        agentNode.properties.exhaustedUntilTick =
          ((agentNode.properties.currentTick as number) ?? 0) + cost.ticks;
        break;
      }
      case 'health_sacrifice': {
        const agentNode = graph.getNode(agentId);
        if (!agentNode) break;
        agentNode.properties.doom =
          ((agentNode.properties.doom as number) ?? 0) + cost.amount;
        break;
      }
      case 'relationship_damage': {
        // Simplified: reduce sentiment on nearest relationship
        break;
      }
      case 'multi': {
        payCosts(graph, agentId, cost.costs);
        break;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Backlash Resolution
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluate whether backlash fires on a spell activation.
 *
 * @param backlash - Backlash definition
 * @param outcome - What happened (success, failure, critical_failure)
 * @param roll - Seeded PRNG roll (0.0–1.0)
 */
export function evaluateBacklash(
  backlash: BacklashEffect | undefined,
  outcome: 'success' | 'failure' | 'critical_failure',
  roll: number,
): { fires: boolean; effect?: AttachmentEffect; narrative?: string } {
  if (!backlash) return { fires: false };

  // Check trigger condition
  if (backlash.trigger === 'always') {
    // Always fires (for catastrophic effects)
  } else if (backlash.trigger === 'failure' && outcome !== 'failure' && outcome !== 'critical_failure') {
    return { fires: false };
  } else if (backlash.trigger === 'critical_failure' && outcome !== 'critical_failure') {
    return { fires: false };
  }

  // Check probability (with floor)
  const prob = Math.max(backlash.probability, BACKLASH_PROBABILITY_FLOOR);
  if (roll >= prob) return { fires: false };

  return {
    fires: true,
    effect: backlash.effect,
    narrative: backlash.narrativeTemplate,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Main Activation Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Activate a spell — full pipeline from prerequisite check through effect application.
 *
 * @param graph - World graph
 * @param agentId - Caster
 * @param spell - Spell template to cast
 * @param targetId - Target entity (agent, hex, location)
 * @param tick - Current tick
 * @param roll - Seeded PRNG roll (0.0–1.0) for backlash evaluation
 * @param effectStates - Runtime states for cooldown tracking
 */
export function activateSpell(
  graph: WorldGraph,
  agentId: string,
  spell: SpellTemplate,
  targetId: string | undefined,
  tick: number,
  roll: number,
  effectStates?: Map<string, EffectRuntimeState>,
): ActivationResult {
  const baseTrace: EffectActivationTrace = {
    type: 'effect_activation',
    tick,
    agentId,
    attachmentId: spell.id,
    effectType: 'spell',
    effectDetails: { spellName: spell.name, tier: spell.tier },
    result: 'applied',
  };

  // 1. Prerequisites
  const prereqCheck = checkPrerequisites(graph, agentId, spell);
  if (!prereqCheck.met) {
    return {
      outcome: 'blocked_prerequisite',
      appliedEffects: [],
      paidCosts: [],
      trace: { ...baseTrace, result: 'blocked_prerequisite', effectDetails: { ...baseTrace.effectDetails, reason: prereqCheck.reason } },
    };
  }

  // 2. Cooldown check
  const spellState = effectStates?.get(spell.id);
  if (spellState?.spellLastCastTick !== undefined) {
    const elapsed = tick - spellState.spellLastCastTick;
    const cd = Math.max(spell.cooldownTicks, COOLDOWN_MINIMUM_TICKS);
    if (elapsed < cd) {
      return {
        outcome: 'blocked_cooldown',
        appliedEffects: [],
        paidCosts: [],
        trace: { ...baseTrace, result: 'blocked_cooldown', effectDetails: { ...baseTrace.effectDetails, remaining: cd - elapsed } },
      };
    }
  }

  // 3. Cost validation
  const costCheck = canPayCosts(graph, agentId, spell.cost);
  if (!costCheck.canPay) {
    return {
      outcome: 'blocked_cost',
      appliedEffects: [],
      paidCosts: [],
      trace: { ...baseTrace, result: 'blocked_prerequisite', effectDetails: { ...baseTrace.effectDetails, costReason: costCheck.reason } },
    };
  }

  // 4. Cost payment (atomic)
  const costArray = Array.isArray(spell.cost) ? spell.cost : [spell.cost];
  payCosts(graph, agentId, spell.cost);

  // 5. Update cooldown state
  if (effectStates) {
    const current = effectStates.get(spell.id) ?? {};
    effectStates.set(spell.id, { ...current, spellLastCastTick: tick });
  }

  // 6. Backlash check (for now: spells always "succeed" — future phases add failure mechanics)
  // Use roll to determine if backlash fires (treating low rolls as failure for backlash purposes)
  const isFailure = roll < 0.15; // ~15% base failure rate
  const isCriticalFailure = roll < 0.05; // ~5% critical failure rate
  const outcomeType = isCriticalFailure ? 'critical_failure' : isFailure ? 'failure' : 'success';

  if (isFailure && spell.backlash) {
    const backlashResult = evaluateBacklash(spell.backlash, outcomeType, roll * 7 % 1); // Derive secondary roll
    if (backlashResult.fires) {
      return {
        outcome: 'backlash',
        appliedEffects: [],
        backlashEffect: backlashResult.effect,
        backlashNarrative: backlashResult.narrative,
        paidCosts: costArray,
        trace: {
          ...baseTrace,
          result: 'backlash',
          costsPaid: costArray,
          backlashFired: true,
        },
      };
    }
  }

  // 7. Success — return effects for the caller to apply
  return {
    outcome: 'success',
    appliedEffects: spell.effects,
    paidCosts: costArray,
    trace: {
      ...baseTrace,
      result: 'applied',
      costsPaid: costArray,
    },
  };
}
