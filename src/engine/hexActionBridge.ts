/**
 * Hex Action Bridge — converts resolved hex target_actions into HexMutation[].
 *
 * When a player's target_action resolves against a hex target (nodeId starts
 * with 'hex_'), the resolution pipeline can't produce GraphOps (hexes aren't
 * graph nodes). Instead, it calls this bridge to get HexMutation[] that
 * phaseHexState will apply to the tile array.
 *
 * NFP compliance:
 *   #1 Tunability: all delta values are named constants
 *   #2 Inspectability: HexActionResolvedTrace emitted per call
 *   #3 Determinism: pure lookup, no randomness
 *   #4 Fail-soft: unknown template ID returns empty array, no crash
 */
import type { HexMutation } from '../types/hexMutation';
import type { RevelationMutation } from './revelationResolver';
import { resolveRevelation } from './revelationResolver';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HEX_BLESS_INFLUENCE_DELTA = 0.3;
export const HEX_CORRUPT_CORRUPTION_DELTA = 0.25;
export const HEX_SEED_INFLUENCE_DELTA = 0.5;
export const HEX_SURVEY_VISIBILITY_RADIUS = 1;

// ─── Mutation Definitions ─────────────────────────────────────────────────────

interface HexActionMutationDef {
  readonly field: 'divineInfluence' | 'corruption';
  readonly successDelta: number;
  readonly failureDelta: number;
}

const HEX_ACTION_MUTATIONS: Readonly<Record<string, HexActionMutationDef>> = {
  'hex.bless_land': {
    field: 'divineInfluence',
    successDelta: HEX_BLESS_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  'hex.corrupt_land': {
    field: 'corruption',
    successDelta: HEX_CORRUPT_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  'hex.seed_life': {
    field: 'divineInfluence',
    successDelta: HEX_SEED_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  // hex.survey has no mutation — it's an observation action (visibility effect)
};

// ─── Bridge Function ──────────────────────────────────────────────────────────

/**
 * Convert a resolved hex target_action into HexMutation[].
 *
 * @param templateId The template ID of the resolved action
 * @param col Hex column coordinate
 * @param row Hex row coordinate
 * @param outcome Whether the action succeeded or failed
 * @param tick Current tick for tracing
 * @returns Array of mutations to apply (empty if no mutation defined or on failure with failureDelta=0)
 */
export function resolveHexAction(
  templateId: string,
  col: number,
  row: number,
  outcome: 'success' | 'failure',
  tick: number,
): HexMutation[] {
  const def = HEX_ACTION_MUTATIONS[templateId];

  if (!def) {
    // No mutation defined for this template (e.g., hex.survey) — not an error
    return [];
  }

  const delta = outcome === 'success' ? def.successDelta : def.failureDelta;

  const mutations: HexMutation[] = delta !== 0
    ? [{
        col,
        row,
        field: def.field,
        delta,
        source: templateId,
      }]
    : [];

  emitTrace({
    tick,
    category: 'action',
    summary: `Hex action resolved: ${templateId} at (${col},${row}) → ${outcome}, mutations: ${mutations.length}`,
    type: 'hex_action_resolved',
    templateId,
    col,
    row,
    outcome,
    mutations,
  } as any);

  return mutations;
}

// ─── Combined Resolution ─────────────────────────────────────────────────────

export interface HexActionResult {
  hexMutations: HexMutation[];
  revelationMutations: RevelationMutation[];
}

/**
 * Resolve a hex action into both hex mutations and revelation mutations.
 * This is the preferred entry point — produces all side effects of a hex action.
 */
export function resolveHexActionFull(
  templateId: string,
  col: number,
  row: number,
  outcome: 'success' | 'failure',
  tick: number,
): HexActionResult {
  return {
    hexMutations: resolveHexAction(templateId, col, row, outcome, tick),
    revelationMutations: resolveRevelation(templateId, col, row, outcome, tick),
  };
}

/**
 * Determine if a UnifiedAction target ID represents a hex.
 * Hex target IDs use the format 'hex_COL_ROW'.
 */
export function isHexTargetId(targetId: string): boolean {
  return /^hex_\d+_\d+$/.test(targetId);
}

/**
 * Parse hex coordinates from a hex target ID.
 * Returns null if the ID doesn't match the expected format.
 */
export function parseHexTargetId(targetId: string): { col: number; row: number } | null {
  const match = targetId.match(/^hex_(\d+)_(\d+)$/);
  if (!match) return null;
  return { col: parseInt(match[1], 10), row: parseInt(match[2], 10) };
}
