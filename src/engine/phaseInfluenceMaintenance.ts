/**
 * Phase Influence Maintenance (THR-1652) — thread upkeep.
 *
 * Runs immediately AFTER phaseEssence. Charges every thread's
 * `TIER_MAINTENANCE[tier]` against the ascendant's primary sphere in
 * `GameState.essencePool` — the one store the essence bar reads (THR-1645) —
 * via `processInfluenceMaintenance`. A thread whose upkeep is paid advances its
 * `ticksAtCurrentTier` (what `phaseInfluenceTierPromotion` promotes on); one the
 * pool cannot cover is marked `maintenanceCurrent: false` and stalls.
 *
 * Before this phase, `computeEssenceIncome` (the income readout) subtracted
 * upkeep that the tick loop never took, so the readout promised a lower net
 * income than the pool actually received.
 *
 * Why its own phase rather than a call inside phaseEssence: `essenceEarned.ts`
 * banks each phase's *net* pool movement as lifetime essence earned (the
 * attunement counter). Charging upkeep inside phaseEssence would let upkeep eat
 * the income before it is counted; as a separate phase the debit is a spend,
 * which the counter ignores by design.
 *
 * NFP compliance:
 *   #1 Tunability: costs are TIER_MAINTENANCE in data/influence-content.ts
 *   #2 Inspectability: ONE aggregate trace, only on ticks where a thread's
 *      paid/unpaid status flips (never one-per-thread, never every tick)
 *   #3 Determinism: arithmetic only, edges iterated in graph order, no PRNG
 *   #4 Fail-soft: missing ascendant / alignment / pool → no-op, never throws
 */

import type { GameState } from '../types/gameState';
import type { SphereAlignment } from '../types/influence';
import { processInfluenceMaintenance } from './influence';
import { emitTrace } from './traceBuffer';

/** Aggregate trace for a tick on which some thread's upkeep status changed. */
export interface InfluenceMaintenanceTrace {
  category: 'influence_maintenance';
  tick: number;
  /** Threads whose upkeep was paid this tick. */
  paidCount: number;
  /** Threads the primary sphere could not cover this tick. */
  failedCount: number;
  /** Threads that went from paid to unpaid this tick. */
  lapsedIds: string[];
  /** Threads that went from unpaid back to paid this tick. */
  restoredIds: string[];
  /** Essence taken from the primary sphere this tick. */
  essenceSpent: number;
  summary: string;
}

export function phaseInfluenceMaintenance(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode || !state.essencePool) return {};
  const alignment = ascNode.properties.sphereAlignment as SphereAlignment | undefined;
  if (!alignment?.primary) return {};

  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  if (threadEdges.length === 0) return {};

  const wasCurrent = new Map<string, boolean>();
  for (const edge of threadEdges) {
    wasCurrent.set(edge.target, edge.properties.maintenanceCurrent !== false);
  }

  const pool = { ...state.essencePool };
  const result = processInfluenceMaintenance(state.graph, state.ascendantId, state.tick, pool);

  const lapsedIds = result.maintenanceFailed.filter(id => wasCurrent.get(id) === true);
  const restoredIds = result.maintenancePaid.filter(id => wasCurrent.get(id) === false);
  if (lapsedIds.length > 0 || restoredIds.length > 0) {
    const trace: InfluenceMaintenanceTrace = {
      category: 'influence_maintenance',
      tick: state.tick,
      paidCount: result.maintenancePaid.length,
      failedCount: result.maintenanceFailed.length,
      lapsedIds,
      restoredIds,
      essenceSpent: result.totalEssenceSpent,
      summary:
        `thread upkeep: ${result.maintenancePaid.length} paid, ${result.maintenanceFailed.length} unpaid` +
        (lapsedIds.length > 0 ? `, ${lapsedIds.length} lapsed` : '') +
        (restoredIds.length > 0 ? `, ${restoredIds.length} restored` : '') +
        ` (${alignment.primary} −${result.totalEssenceSpent.toFixed(2)})`,
    };
    emitTrace(trace as unknown as Parameters<typeof emitTrace>[0]);
  }

  if (result.totalEssenceSpent === 0) return {};
  return { essencePool: pool };
}
