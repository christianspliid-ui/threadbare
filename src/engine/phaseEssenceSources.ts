/**
 * Phase Essence Sources (THR-611 — Divine Economy).
 *
 * Runs immediately BEFORE phaseEssence so derived tiers are fresh when income is
 * computed. Per tick it: (1) forward-migrates any newly-controlled legacy place
 * of power into the source model (idempotent, income-neutral), (2) recomputes the
 * derived tier for every controlled source and applies the contested-sanctity
 * drain, and (3) emits ONE aggregate trace (never one-per-source — a per-source
 * burst would flood the 2000-entry ring buffer).
 *
 * NFP compliance:
 *   #1 Tunability: constants from data/essence-sources.ts
 *   #2 Inspectability: single EssenceSourcePhaseTrace per tick with counts
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: missing ascendant / source bag → no-op, never throws
 *   #7 Performance: O(controlled hosts); sources are few and player-owned
 */

import type { GameState } from '../types/gameState';
import type { EssenceSourcePhaseTrace } from '../types/essenceSource';
import { emitTrace } from './traceBuffer';
import {
  migrateControlledPlacesOfPower,
  recomputeControlledSourceTiers,
} from './essenceSources';

export function phaseEssenceSources(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const migratedThisTick = migrateControlledPlacesOfPower(
    state.graph,
    state.ascendantId,
    state.tick,
  );
  const { sourceCount, tierChanges, contestedCount } = recomputeControlledSourceTiers(
    state.graph,
    state.ascendantId,
  );

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
      summary:
        `essence sources: ${sourceCount} held` +
        (migratedThisTick > 0 ? `, +${migratedThisTick} migrated` : '') +
        (tierChanges > 0 ? `, ${tierChanges} tier change(s)` : '') +
        (contestedCount > 0 ? `, ${contestedCount} contested` : ''),
    };
    emitTrace(trace as unknown as Parameters<typeof emitTrace>[0]);
  }

  // Graph is mutated in place; no GameState field changes in this slice.
  return {};
}
