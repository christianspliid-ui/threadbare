/**
 * Phase Essence Sources (THR-611 — Divine Economy).
 *
 * Runs immediately BEFORE phaseEssence so derived tiers are fresh when income is
 * computed. Per tick it: (1) forward-migrates any newly-controlled legacy place
 * of power into the source model (idempotent, income-neutral), (2) recomputes the
 * derived tier for every controlled source, applying both the essence bridge's
 * economic sanctity drift (THR-618 — the land nurtures or withers what stands on
 * it) and the contested-sanctity drain, and (3) emits ONE aggregate trace (never
 * one-per-source — a per-source burst would flood the 2000-entry ring buffer).
 *
 * NFP compliance:
 *   #1 Tunability: constants from data/essence-sources.ts
 *   #2 Inspectability: single EssenceSourcePhaseTrace per tick with counts
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: missing ascendant / source bag → no-op, never throws
 *   #7 Performance: O(controlled hosts); sources are few and player-owned
 */

import type { GameState } from '../types/gameState';
import type { EssenceSourcePhaseTrace, SourceUpkeepTrace } from '../types/essenceSource';
import type { SphereAlignment } from '../types/influence';
import { emitTrace } from './traceBuffer';
import {
  migrateControlledPlacesOfPower,
  recomputeControlledSourceTiers,
  chargeSourceUpkeep,
} from './essenceSources';

export function phaseEssenceSources(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const migratedThisTick = migrateControlledPlacesOfPower(
    state.graph,
    state.ascendantId,
    state.tick,
  );
  const { sourceCount, tierChanges, contestedCount, econNurtured, econWithered } =
    recomputeControlledSourceTiers(state.graph, state.ascendantId);

  // Only emit when there is something to say — keeps the buffer lean on the
  // common no-source path (most early-game ticks).
  if (sourceCount > 0 || migratedThisTick > 0) {
    const trace: EssenceSourcePhaseTrace = {
      category: 'essence_source_phase',
      tick: state.tick,
      sourceCount,
      migratedThisTick,
      tierChanges,
      contestedCount,
      econNurtured,
      econWithered,
      summary:
        `essence sources: ${sourceCount} held` +
        (migratedThisTick > 0 ? `, +${migratedThisTick} migrated` : '') +
        (tierChanges > 0 ? `, ${tierChanges} tier change(s)` : '') +
        (contestedCount > 0 ? `, ${contestedCount} contested` : '') +
        (econNurtured > 0 ? `, ${econNurtured} nurtured by the land` : '') +
        (econWithered > 0 ? `, ${econWithered} withering` : ''),
    };
    emitTrace(trace as unknown as Parameters<typeof emitTrace>[0]);
  }

  // THR-1747: source upkeep. Charged after the recompute, so the nurture step above
  // read the *previous* tick's `upkeepCurrent` — an unpaid source misses exactly one
  // tick of upward drift per unpaid tick. Runs before phaseEssence, so the debit is a
  // spend the essence-earned counter ignores (essenceEarned.ts banks net positive
  // movement per phase only).
  const alignment = ascNode.properties.sphereAlignment as SphereAlignment | undefined;
  const primary = alignment?.primary;
  if (sourceCount === 0 || !primary || !state.essencePool) return {};
  const pool = { ...state.essencePool };
  const upkeep = chargeSourceUpkeep(state.graph, state.ascendantId, primary, pool);
  if (upkeep.lapsedIds.length > 0 || upkeep.restoredIds.length > 0) {
    const trace: SourceUpkeepTrace = {
      category: 'source_upkeep',
      tick: state.tick,
      sources: upkeep.sources,
      paidCount: upkeep.paid,
      unpaidCount: upkeep.unpaid,
      lapsedIds: upkeep.lapsedIds,
      restoredIds: upkeep.restoredIds,
      essenceSpent: upkeep.charged,
      sphere: primary,
      summary:
        `source upkeep: ${upkeep.paid} paid, ${upkeep.unpaid} unpaid` +
        (upkeep.lapsedIds.length > 0 ? `, ${upkeep.lapsedIds.length} stalled` : '') +
        (upkeep.restoredIds.length > 0 ? `, ${upkeep.restoredIds.length} restored` : '') +
        ` (${primary} −${upkeep.charged.toFixed(2)})`,
    };
    emitTrace(trace as unknown as Parameters<typeof emitTrace>[0]);
  }
  if (upkeep.charged <= 0) return {};
  return { essencePool: pool };
}
