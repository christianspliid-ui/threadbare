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
import type { RevelationMutation, HiddenSiteRevealResult } from './revelationResolver';
import { resolveRevelation, resolveHiddenSiteReveals } from './revelationResolver';
import { emitTrace } from './traceBuffer';
import type { WorldGraph } from './graph';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HEX_BLESS_INFLUENCE_DELTA = 0.3;
export const HEX_CORRUPT_CORRUPTION_DELTA = 0.25;
export const HEX_SEED_INFLUENCE_DELTA = 0.5;
export const HEX_SURVEY_VISIBILITY_RADIUS = 1;

// TB-046: Land & Soul one-shot deltas
export const HEX_RAISE_LANDMARK_INFLUENCE_DELTA = 0.4;
export const HEX_SHIFT_SEASON_INFLUENCE_DELTA = 0.15;
export const HEX_SCORCH_EARTH_CORRUPTION_DELTA = 0.4;
export const HEX_REND_EARTH_CORRUPTION_DELTA = 0.6;
export const HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA = 0.35;
export const HEX_SEVER_FLOW_CORRUPTION_DELTA = 0.3;
export const HEX_DISPEL_WILD_INFLUENCE_DELTA = 0.2;

// TB-047: People & Ruins one-shot deltas
export const HEX_SCATTER_CORRUPTION_DELTA = 0.15;
export const HEX_SMITE_CORRUPTION_DELTA = 0.1;
export const HEX_CONSECRATE_PAST_INFLUENCE_DELTA = 0.3;
export const HEX_BURY_PAST_CORRUPTION_DELTA = 0.2;
export const HEX_DESECRATE_CORRUPTION_DELTA = 0.35;

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

  // TB-046: Land one-shots
  'hex.raise_landmark': {
    field: 'divineInfluence',
    successDelta: HEX_RAISE_LANDMARK_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  'hex.shift_season': {
    field: 'divineInfluence',
    successDelta: HEX_SHIFT_SEASON_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  'hex.scorch_earth': {
    field: 'corruption',
    successDelta: HEX_SCORCH_EARTH_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  'hex.rend_earth': {
    field: 'corruption',
    successDelta: HEX_REND_EARTH_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  // hex.dowse_resources — no mutation (observation only, like survey)
  // hex.sense_leylines — no mutation (observation only)

  // TB-046: Soul one-shots
  'hex.attune_leyline': {
    field: 'divineInfluence',
    successDelta: HEX_ATTUNE_LEYLINE_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  'hex.sever_flow': {
    field: 'corruption',
    successDelta: HEX_SEVER_FLOW_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  'hex.dispel_wild': {
    field: 'divineInfluence',
    successDelta: HEX_DISPEL_WILD_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  // hex.forge_seer_token — no hex mutation (creates artifact, deferred)
  // hex.read_currents — no mutation (observation only)
  // hex.shift_dominion — no mutation (sphere rebalancing, needs sphere influence system)
  // hex.amplify_flow — no mutation (magicalSaturation boost on locations, not hex tiles)

  // TB-047: People one-shots
  'hex.scatter': {
    field: 'corruption',
    successDelta: HEX_SCATTER_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  'hex.smite': {
    field: 'corruption',
    successDelta: HEX_SMITE_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  // hex.send_herald — no hex mutation (spawns agent via GraphOp, deferred)
  // hex.forge_instrument — no hex mutation (creates artifact, deferred)
  // hex.spark_encounter — no hex mutation (creates encounter node, deferred)
  // hex.divine_populace — no mutation (observation only)
  // hex.scry_factions — no mutation (observation only)
  // hex.stir_people — no hex mutation (shifts faction disposition, deferred)
  // hex.summon_congregation — no hex mutation (agent movement, deferred)
  // hex.bestow_vision — no hex mutation (agent ambition, deferred)
  // hex.incite_exodus — no hex mutation (agent departure + prosperity, deferred)

  // TB-047: Ruins one-shots
  'hex.consecrate_past': {
    field: 'divineInfluence',
    successDelta: HEX_CONSECRATE_PAST_INFLUENCE_DELTA,
    failureDelta: 0,
  },
  'hex.bury_past': {
    field: 'corruption',
    successDelta: HEX_BURY_PAST_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  'hex.desecrate': {
    field: 'corruption',
    successDelta: HEX_DESECRATE_CORRUPTION_DELTA,
    failureDelta: 0,
  },
  // hex.mark_ground — no hex mutation (exploration hook, deferred)
  // hex.plant_dream — no hex mutation (agent ambition, deferred)
  // hex.read_stones — no mutation (observation only)
  // hex.whisper_intuition — no mutation (observation only)
  // hex.restore_fragment — no hex mutation (sublocation creation, deferred)
  // hex.rewrite_history — no hex mutation (cultural legacy, deferred)
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
  hiddenSiteReveals: HiddenSiteRevealResult[];
}

/**
 * Resolve a hex action into hex mutations, revelation mutations, and hidden site reveals.
 * This is the preferred entry point — produces all side effects of a hex action.
 *
 * @param graph WorldGraph — needed for hidden site discovery (TB-043). Optional for backward compat.
 */
export function resolveHexActionFull(
  templateId: string,
  col: number,
  row: number,
  outcome: 'success' | 'failure',
  tick: number,
  graph?: WorldGraph,
): HexActionResult {
  const hiddenSiteReveals = (outcome === 'success' && graph)
    ? resolveHiddenSiteReveals(graph, templateId, col, row, tick)
    : [];

  return {
    hexMutations: resolveHexAction(templateId, col, row, outcome, tick),
    revelationMutations: resolveRevelation(templateId, col, row, outcome, tick),
    hiddenSiteReveals,
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
