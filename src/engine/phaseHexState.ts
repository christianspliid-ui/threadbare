/**
 * Phase Hex State — tick decay and terrain transformation for hex mutable state.
 *
 * Runs once per tick. For each hex tile:
 *   1. Apply any pending HexMutations accumulated this tick
 *   2. Decay divineInfluence by HEX_DIVINE_INFLUENCE_DECAY_RATE
 *   3. Decay corruption by HEX_CORRUPTION_DECAY_RATE
 *   4. Check if corruption crosses HEX_CORRUPTION_TRANSFORM_THRESHOLD → terrain degrade
 *   5. Check if divineInfluence crosses HEX_DIVINE_TRANSFORM_THRESHOLD → terrain restore
 *   6. Respect HEX_TRANSFORM_COOLDOWN_TICKS between transformations
 *   7. Emit HexStateTickTrace per modified hex
 *
 * Returns { tiles: updatedTiles } — pure, no mutation of input.
 *
 * NFP compliance:
 *   #1 Tunability: all thresholds/rates are named constants exported here
 *   #2 Inspectability: HexStateTickTrace emitted per changed hex
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: missing fields default to 0; missing terrain in table → no-op
 */
import type { GameState } from '../types/gameState';
import type { HexTile, TerrainType } from '../types/index';
import type { HexMutation } from '../types/hexMutation';
import { getTerrainTransformation } from '../data/terrain-transformation-content';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HEX_DIVINE_INFLUENCE_DECAY_RATE = 0.02;
export const HEX_CORRUPTION_DECAY_RATE = 0.01;
export const HEX_CORRUPTION_TRANSFORM_THRESHOLD = 0.7;
export const HEX_DIVINE_TRANSFORM_THRESHOLD = 0.8;
export const HEX_TRANSFORM_COOLDOWN_TICKS = 10;
export const HEX_INFLUENCE_VISIBILITY_THRESHOLD = 0.3;

// ─── Phase function ───────────────────────────────────────────────────────────

/**
 * Apply pending hex mutations and tick hex state (decay + transformation).
 *
 * @param state Current game state
 * @param pendingMutations Mutations from resolved hex target_actions this tick
 */
export function phaseHexState(
  state: GameState,
  pendingMutations: readonly HexMutation[] = [],
): Partial<GameState> {
  const tick = state.tick;
  const updatedTiles: HexTile[] = state.tiles.map(tile => {
    const col = tile.coord.col;
    const row = tile.coord.row;

    // Step 1: Apply any pending mutations for this hex
    let divineInfluence = tile.divineInfluence ?? 0;
    let corruption = tile.corruption ?? 0;

    for (const mutation of pendingMutations) {
      if (mutation.col === col && mutation.row === row) {
        if (mutation.field === 'divineInfluence') {
          divineInfluence = clamp01(divineInfluence + mutation.delta);
        } else if (mutation.field === 'corruption') {
          corruption = clamp01(corruption + mutation.delta);
        }
      }
    }

    // Step 2: Decay divineInfluence
    const prevDivineInfluence = divineInfluence;
    divineInfluence = clamp01(divineInfluence - HEX_DIVINE_INFLUENCE_DECAY_RATE);

    // Step 3: Decay corruption
    const prevCorruption = corruption;
    corruption = clamp01(corruption - HEX_CORRUPTION_DECAY_RATE);

    // If both are zero and were zero before, skip terrain check and trace
    if (
      prevDivineInfluence === 0 && divineInfluence === 0 &&
      prevCorruption === 0 && corruption === 0 &&
      pendingMutations.every(m => m.col !== col || m.row !== row)
    ) {
      return tile;
    }

    // Step 4+5: Terrain transformation check
    let terrain = tile.terrain;
    let baseTerrain = tile.baseTerrain;
    let terrainTransformedTick = tile.terrainTransformedTick;
    let terrainChanged = false;
    let prevTerrain: string | undefined;

    const cooldownOk =
      terrainTransformedTick === undefined ||
      tick - terrainTransformedTick >= HEX_TRANSFORM_COOLDOWN_TICKS;

    if (cooldownOk) {
      // Check corruption threshold (degradation)
      if (corruption >= HEX_CORRUPTION_TRANSFORM_THRESHOLD) {
        const degraded = getTerrainTransformation('corruption', terrain);
        if (degraded !== null) {
          prevTerrain = terrain;
          baseTerrain = baseTerrain ?? terrain; // preserve original if not yet set
          terrain = degraded;
          terrainTransformedTick = tick;
          terrainChanged = true;
        }
      }

      // Check divineInfluence threshold (restoration) — only if not also degrading
      if (!terrainChanged && divineInfluence >= HEX_DIVINE_TRANSFORM_THRESHOLD) {
        const restored = getTerrainTransformation('divineInfluence', terrain);
        if (restored !== null) {
          prevTerrain = terrain;
          baseTerrain = baseTerrain ?? terrain;
          terrain = restored;
          terrainTransformedTick = tick;
          terrainChanged = true;
        }
      }
    }

    // Step 7: Emit trace for any hex that changed meaningfully
    const significantChange =
      terrainChanged ||
      Math.abs(divineInfluence - prevDivineInfluence) > 0.001 ||
      Math.abs(corruption - prevCorruption) > 0.001;

    if (significantChange) {
      emitTrace({
        tick,
        category: 'hex_state',
        summary: terrainChanged
          ? `Hex (${col},${row}) terrain changed: ${prevTerrain} → ${terrain}`
          : `Hex (${col},${row}) state decayed: inf=${divineInfluence.toFixed(2)}, cor=${corruption.toFixed(2)}`,
        col,
        row,
        prevDivineInfluence,
        newDivineInfluence: divineInfluence,
        prevCorruption,
        newCorruption: corruption,
        terrainChanged,
        prevTerrain,
        newTerrain: terrainChanged ? terrain : undefined,
      } as any);
    }

    return {
      ...tile,
      terrain,
      divineInfluence,
      corruption,
      baseTerrain,
      terrainTransformedTick,
    };
  });

  return { tiles: updatedTiles };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
