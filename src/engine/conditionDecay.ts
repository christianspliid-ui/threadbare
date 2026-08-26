/**
 * Condition Decay — tick-based removal of transient conditions.
 *
 * Called once per tick. Decrements ticksRemaining on all has_trait edges
 * that have a numeric ticksRemaining. Removes edges that reach 0.
 *
 * Pure function over graph state. Returns removed conditions for tracing.
 *
 * ─── Carrier-agnostic by construction (THR-1143) ─────────────────
 * The loop walks `has_trait` **by edge type**, never by source node kind, so a
 * condition on a place expires through exactly this path and no second one — the
 * THR-761 invariant that there is one tick-driven expiry path. THR-1143 planned
 * a "widening" here and found none was needed; what it did change is the shape of
 * the result, which called every carrier `agentId` and so misreported a closed
 * pass as an agent. `carrierId` is the honest name and `agentId` is kept as a
 * deprecated alias so the existing readers are untouched.
 */

import type { WorldGraph } from './graph';
import { readMultiplierOverride, type RuleOverrideContext } from './effects/ruleOverrideConsumers';
import { HEALING_MULTIPLIER_MIN_DECAY_TICKS } from '../data/effect-constants';

export interface RemovedCondition {
  edgeId: string;
  /**
   * The node the condition sat on — an agent, or (THR-1143) a location, faction
   * or sublocation. Prefer this over `agentId`.
   */
  carrierId: string;
  /** @deprecated Misnomer once places could carry conditions. Same value as `carrierId`. */
  agentId: string;
  traitId: string;
  traitName: string;
  tick: number;
}

/**
 * Decay all condition trait edges by one tick.
 * Returns list of conditions that expired and were removed.
 *
 * ─── `healing_multiplier` owning site (THR-1241) ─────────────────
 * There is no per-agent health pool in this game — a wound is a condition with a
 * countdown, and recovering from it *is* that countdown reaching zero. So the
 * honest reading of "healing is 3x faster" is that a carrier's conditions count
 * down three ticks at a time, and this loop is the only place that count happens
 * (THR-761: one tick-driven expiry path). A shipped artifact promising
 * `healing_multiplier: 3.0` did nothing at all before this.
 *
 * The multiplier accelerates decay only — it never *adds* ticks. A value below 1
 * would slow recovery, which is a coherent curse, so it is honoured; it is
 * floored at `HEALING_MULTIPLIER_MIN_DECAY_TICKS` so a condition can never stall
 * forever and become a permanent state nothing can lift (NFP #4).
 *
 * @param overrideCtx — optional; without it every carrier decays at one tick per
 *   tick, which is exactly the pre-THR-1241 behaviour.
 */
export function decayConditions(
  graph: WorldGraph,
  tick: number,
  overrideCtx?: RuleOverrideContext,
): RemovedCondition[] {
  const removed: RemovedCondition[] = [];
  const traitEdges = graph.getEdgesByType('has_trait');

  for (const edge of traitEdges) {
    const remaining = edge.properties.ticksRemaining;

    // Skip edges without tick-based decay
    if (remaining === undefined || remaining === null) continue;
    if (typeof remaining !== 'number') continue;

    // Healing accelerates the countdown; the carrier is the node the condition
    // sits on, which since THR-1143 may be a place as well as an agent — a place
    // simply never bears a healing override, so it reads neutral and decays at 1.
    //
    // THR-1242: `duration_decay_multiplier` — the consolidation target for the
    // retired `freeze_duration` — is the second dial on this same step, and the
    // two compose multiplicatively rather than one winning. Healing accelerates
    // recovery; a freeze resists it; an agent carrying both gets the product,
    // which is the only reading where a ward and a curse can argue. The floor is
    // applied after both, so no combination can stall a condition forever.
    const decayStep = overrideCtx !== undefined
      ? Math.max(
        HEALING_MULTIPLIER_MIN_DECAY_TICKS,
        readMultiplierOverride(overrideCtx, edge.source, 'healing_multiplier', 'conditionDecay')
        * readMultiplierOverride(overrideCtx, edge.source, 'duration_decay_multiplier', 'conditionDecay'),
      )
      : 1;

    const newRemaining = remaining - decayStep;

    if (newRemaining <= 0) {
      const traitNode = graph.getNode(edge.target);
      removed.push({
        edgeId: edge.id,
        carrierId: edge.source,
        agentId: edge.source,
        traitId: edge.target,
        traitName: traitNode?.name ?? edge.target,
        tick,
      });
      graph.removeEdge(edge.id);
    } else {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, ticksRemaining: newRemaining },
      });
    }
  }

  return removed;
}
