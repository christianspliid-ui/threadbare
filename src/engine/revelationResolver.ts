/**
 * Revelation Resolver — applies layer revelation mutations from Find actions.
 *
 * When a hex-targeting Find action resolves successfully, this module updates
 * the hexRevelation map to mark the appropriate layer as revealed.
 *
 * NFP compliance:
 *   #1 Tunability: revelation mapping is data-driven (TEMPLATE_REVELATION_MAP)
 *   #2 Inspectability: LayerRevealedTrace emitted per reveal
 *   #3 Determinism: pure lookup, no randomness
 *   #4 Fail-soft: unknown template → no reveal (not an error); missing hex → creates entry
 */
import type { NarrativeLayer, HexRevelation } from '../types/unifiedAction';
import { createDefaultHexRevelation } from '../types/unifiedAction';
import { hexKey } from '../lib/hexKey';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Maps template IDs to the narrative layer they reveal on success.
 * Templates not in this map produce no revelation effect.
 */
export const TEMPLATE_REVELATION_MAP: Readonly<Record<string, NarrativeLayer>> = {
  // Land layer
  'hex.survey': 'land',

  // Soul layer
  'hex.sense_threads': 'soul',
};

// ─── Revelation Mutation ──────────────────────────────────────────────────────

export interface RevelationMutation {
  readonly col: number;
  readonly row: number;
  readonly layer: NarrativeLayer;
  readonly source: string; // template ID that caused the reveal
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Determine what layer (if any) a resolved hex action should reveal.
 *
 * @param templateId The template ID of the resolved action
 * @param col Hex column coordinate
 * @param row Hex row coordinate
 * @param outcome Whether the action succeeded or failed
 * @param tick Current tick for tracing
 * @returns Array of revelation mutations (0 or 1 items)
 */
export function resolveRevelation(
  templateId: string,
  col: number,
  row: number,
  outcome: 'success' | 'failure',
  tick: number,
): RevelationMutation[] {
  // Only successful actions reveal layers
  if (outcome !== 'success') return [];

  const layer = TEMPLATE_REVELATION_MAP[templateId];
  if (!layer) return [];

  emitTrace({
    tick,
    category: 'revelation',
    type: 'layer_revealed',
    summary: `Layer '${layer}' revealed at hex (${col},${row}) by ${templateId}`,
    hexCol: col,
    hexRow: row,
    layer,
    revealedBy: templateId,
  } as any);

  return [{ col, row, layer, source: templateId }];
}

// ─── Apply Mutations ──────────────────────────────────────────────────────────

/**
 * Apply revelation mutations to the hexRevelation map.
 * Returns a new map (does not mutate input). Idempotent — revealing an
 * already-revealed layer is a no-op.
 *
 * @param current Current hexRevelation map (may be undefined)
 * @param mutations Mutations to apply
 * @returns Updated hexRevelation map
 */
export function applyRevelationMutations(
  current: Record<string, HexRevelation> | undefined,
  mutations: readonly RevelationMutation[],
): Record<string, HexRevelation> {
  if (mutations.length === 0) return current ?? {};

  const result = { ...(current ?? {}) };

  for (const mutation of mutations) {
    const key = hexKey(mutation.col, mutation.row);
    const existing = result[key] ?? createDefaultHexRevelation();

    if (!existing[mutation.layer]) {
      result[key] = { ...existing, [mutation.layer]: true };
    }
  }

  return result;
}

/**
 * Reveal a specific layer on a hex. Convenience wrapper for single reveals
 * (e.g., auto-revealing land when fog of war lifts).
 */
export function revealLayer(
  current: Record<string, HexRevelation> | undefined,
  col: number,
  row: number,
  layer: NarrativeLayer,
): Record<string, HexRevelation> {
  return applyRevelationMutations(current, [{ col, row, layer, source: 'auto' }]);
}
