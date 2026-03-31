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
import type { GraphOp } from '../types/graphOp';
import { getLocationsInHex } from './hexZoom';
import { getAgentsAtLocation } from './graphQueries';

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

// TB-081: Dynamic graph op effect constants
export const AMPLIFY_FLOW_SATURATION_BOOST = 0.20;
export const SHIFT_DOMINION_BOOST = 0.15;
export const SHIFT_DOMINION_REDUCTION = 0.10;
export const SPARK_ENCOUNTER_INFLUENCE_DELTA = 0.10;
export const STIR_PEOPLE_DRIFT_STRENGTH = 0.08;
export const BESTOW_VISION_STRENGTH = 0.6;
export const INCITE_EXODUS_STRENGTH = 0.5;
export const PLANT_DREAM_STRENGTH = 0.5;
export const SUMMON_CONGREGATION_STRENGTH = 0.4;

// Ruins exploration constants (re-exported from central tuning file)
import {
  MARK_GROUND_ATTRACTION_STRENGTH,
  WHISPER_INTUITION_HUNCH_STRENGTH,
  WHISPER_INTUITION_DURATION_TICKS,
} from '../data/agent-behavior-constants';

// TB-047: People & Ruins one-shot deltas
export const HEX_SCATTER_CORRUPTION_DELTA = 0.15;
export const HEX_SMITE_CORRUPTION_DELTA = 0.1;
export const HEX_CONSECRATE_PAST_INFLUENCE_DELTA = 0.3;
export const HEX_BURY_PAST_CORRUPTION_DELTA = 0.2;
export const HEX_DESECRATE_CORRUPTION_DELTA = 0.35;

// ─── Mutation Definitions ─────────────────────────────────────────────────────

interface HexActionMutationDef {
  readonly field: 'divineInfluence' | 'corruption' | 'explorationAttraction';
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
  // hex.forge_seer_token — no hex mutation; GraphOp creates artifact (see HEX_ACTION_GRAPH_OPS)
  // hex.read_currents — no mutation (observation only)
  // hex.shift_dominion — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.amplify_flow — no hex mutation; dynamic GraphOp generator (TB-081)

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
  // hex.send_herald — no hex mutation; GraphOp spawns agent (see HEX_ACTION_GRAPH_OPS)
  // hex.forge_instrument — no hex mutation; GraphOp creates artifact (see HEX_ACTION_GRAPH_OPS)
  // hex.spark_encounter — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.divine_populace — no mutation (observation only)
  // hex.scry_factions — no mutation (observation only)
  // hex.stir_people — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.summon_congregation — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.bestow_vision — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.incite_exodus — no hex mutation; dynamic GraphOp generator (TB-081)

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
  'hex.mark_ground': {
    field: 'explorationAttraction',
    successDelta: MARK_GROUND_ATTRACTION_STRENGTH,
    failureDelta: 0,
  },
  // hex.plant_dream — no hex mutation; dynamic GraphOp generator (TB-081)
  // hex.read_stones — no mutation (observation only)
  // hex.whisper_intuition — no hex mutation; dynamic GraphOp generator
  // hex.restore_fragment — no hex mutation; GraphOp creates sublocation (see HEX_ACTION_GRAPH_OPS)
  // hex.rewrite_history — no hex mutation; GraphOp updates location (see HEX_ACTION_GRAPH_OPS)
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
  graphOps: GraphOp[];
}

// ─── GraphOp Definitions for Deferred Hex Actions ───────────────────────────

/**
 * Maps hex action template IDs to GraphOps executed on success.
 * These are actions whose effects are graph mutations rather than hex tile changes.
 */
const HEX_ACTION_GRAPH_OPS: Readonly<Record<string, GraphOp[]>> = {
  'hex.forge_seer_token': [
    {
      op: 'add_node',
      nodeType: 'artifact',
      properties: { name: "Seer's Token", subtype: 'divination_focus', tier: 'storied' },
    },
    {
      op: 'add_edge',
      edgeType: 'possessed_by',
      source: '$created_0',
      target: '$actor',
    },
  ],
  'hex.send_herald': [
    {
      op: 'add_node',
      nodeType: 'actor',
      properties: { name: 'Divine Herald', archetype: 'herald', isHerald: true },
    },
    {
      op: 'add_edge',
      edgeType: 'located_at',
      source: '$created_0',
      target: '$location',
    },
    {
      op: 'add_edge',
      edgeType: 'thread',
      source: '$actor',
      target: '$created_0',
      properties: { tier: 1, attentionMode: 'auto_resolve' },
    },
  ],
  'hex.forge_instrument': [
    {
      op: 'add_node',
      nodeType: 'artifact',
      properties: { name: 'Divine Instrument', subtype: 'ritual_focus', tier: 'storied' },
    },
    {
      op: 'add_edge',
      edgeType: 'possessed_by',
      source: '$created_0',
      target: '$actor',
    },
  ],
  'hex.restore_fragment': [
    {
      op: 'add_node',
      nodeType: 'sublocation',
      properties: { name: 'Restored Fragment', subtype: 'restored_ruin', hidden: false },
    },
    {
      op: 'add_edge',
      edgeType: 'located_at',
      source: '$created_0',
      target: '$location',
    },
  ],
  'hex.rewrite_history': [
    {
      op: 'update_node',
      nodeId: '$location',
      properties: { culturalLegacy: 'rewritten', lastRewriteTick: '$tick' },
    },
  ],
};

// ─── Dynamic GraphOp Generators (TB-081) ────────────────────────────────────

/**
 * Dynamic GraphOp generators for hex actions that need to query the graph
 * at resolution time (e.g., iterating locations on a hex, finding agents).
 * These complement the static HEX_ACTION_GRAPH_OPS for actions whose ops
 * can't be determined without runtime graph queries.
 */
type GraphOpGenerator = (graph: WorldGraph, col: number, row: number, tick: number) => GraphOp[];

/** Helper: collect all individual agent node IDs across all locations on a hex. */
function getAgentIdsAtHex(graph: WorldGraph, col: number, row: number): string[] {
  const locations = getLocationsInHex(graph, col, row);
  const agentIds: string[] = [];
  for (const loc of locations) {
    // getAgentsAtLocation already filters for actorType === 'individual'
    const agents = getAgentsAtLocation(graph, loc.id);
    for (const a of agents) {
      agentIds.push(a.id);
    }
  }
  return agentIds;
}

const HEX_ACTION_GRAPH_OP_GENERATORS: Readonly<Record<string, GraphOpGenerator>> = {
  // ─── Tier 1: Full infrastructure ──────────────────────────────

  'hex.amplify_flow': (graph, col, row) => {
    const locations = getLocationsInHex(graph, col, row);
    return locations.map((loc) => ({
      op: 'update_node' as const,
      nodeId: loc.id,
      changes: { magicalSaturation: `+${AMPLIFY_FLOW_SATURATION_BOOST}` },
    }));
  },

  'hex.shift_dominion': (graph, col, row) => {
    const locations = getLocationsInHex(graph, col, row);
    const ops: GraphOp[] = [];
    for (const loc of locations) {
      const sphereInfluence = (loc.properties?.sphereInfluence as Record<string, number>) ?? {};
      // Find the highest sphere to reduce
      let highestSphere: string | undefined;
      let highestValue = -Infinity;
      for (const [sphere, value] of Object.entries(sphereInfluence)) {
        if (value > highestValue) {
          highestValue = value;
          highestSphere = sphere;
        }
      }
      // Build updated sphereInfluence: boost 'resonance' (default divine sphere), reduce dominant
      const updated = { ...sphereInfluence };
      updated['resonance'] = (updated['resonance'] ?? 0) + SHIFT_DOMINION_BOOST;
      if (highestSphere && highestSphere !== 'resonance') {
        updated[highestSphere] = Math.max(0, (updated[highestSphere] ?? 0) - SHIFT_DOMINION_REDUCTION);
      }
      ops.push({
        op: 'update_node',
        nodeId: loc.id,
        properties: { sphereInfluence: updated },
      });
    }
    return ops;
  },

  'hex.spark_encounter': (graph, col, row, tick) => {
    const locations = getLocationsInHex(graph, col, row);
    if (locations.length === 0) return [];
    // Create event node at the first location on this hex
    return [
      {
        op: 'add_node',
        nodeType: 'event',
        properties: {
          eventType: 'divine_spark',
          hexCol: col,
          hexRow: row,
          locationId: locations[0].id,
          tick,
        },
      },
      {
        op: 'add_edge',
        edgeType: 'occurred_at',
        source: '$created_0',
        target: locations[0].id,
      },
    ];
  },

  // ─── Tier 2: Lightweight agent-motivation effects ─────────────

  'hex.stir_people': (graph, col, row) => {
    const agentIds = getAgentIdsAtHex(graph, col, row);
    return agentIds.map((id) => ({
      op: 'apply_influence' as const,
      target: id,
      influence: {
        interventionType: 'stir_people',
        sphere: 'spirit',
        initialStrength: STIR_PEOPLE_DRIFT_STRENGTH,
        decayRate: 0.01,
        minimumStrength: 0,
        maxDuration: 20,
        valueDrifts: { tradition_novelty: 0.05, mercy_ruthlessness: -0.03 },
        behaviorTag: 'stirred',
      },
    }));
  },

  'hex.summon_congregation': (graph, col, row) => {
    const agentIds = getAgentIdsAtHex(graph, col, row);
    return agentIds.map((id) => ({
      op: 'apply_influence' as const,
      target: id,
      influence: {
        interventionType: 'summon_congregation',
        sphere: 'spirit',
        initialStrength: SUMMON_CONGREGATION_STRENGTH,
        decayRate: 0.05,
        minimumStrength: 0,
        maxDuration: 10,
        behaviorTag: 'summoned',
      },
    }));
  },

  'hex.bestow_vision': (graph, col, row) => {
    // Personal-scale: affects first agent found on this hex
    const agentIds = getAgentIdsAtHex(graph, col, row);
    if (agentIds.length === 0) return [];
    return [{
      op: 'apply_influence' as const,
      target: agentIds[0],
      influence: {
        interventionType: 'bestow_vision',
        sphere: 'mind',
        initialStrength: BESTOW_VISION_STRENGTH,
        decayRate: 0.03,
        minimumStrength: 0,
        maxDuration: 30,
        valueDrifts: { courage_prudence: 0.08, mercy_ruthlessness: -0.04 },
        behaviorTag: 'visionary',
      },
    }];
  },

  'hex.incite_exodus': (graph, col, row) => {
    const agentIds = getAgentIdsAtHex(graph, col, row);
    return agentIds.map((id) => ({
      op: 'apply_influence' as const,
      target: id,
      influence: {
        interventionType: 'incite_exodus',
        sphere: 'entropy',
        initialStrength: INCITE_EXODUS_STRENGTH,
        decayRate: 0.04,
        minimumStrength: 0,
        maxDuration: 15,
        valueDrifts: { sacrifice_survival: -0.10, loyalty_ambition: 0.08 },
        behaviorTag: 'exodus_urge',
      },
    }));
  },

  'hex.plant_dream': (graph, col, row, tick) => {
    // Personal-scale: affects first agent found on this hex
    const agentIds = getAgentIdsAtHex(graph, col, row);
    if (agentIds.length === 0) return [];
    const targetAgent = agentIds[0];

    const ops: GraphOp[] = [
      // Existing: axiological drift toward novelty/courage
      {
        op: 'apply_influence' as const,
        target: targetAgent,
        influence: {
          interventionType: 'plant_dream',
          sphere: 'mind',
          initialStrength: PLANT_DREAM_STRENGTH,
          decayRate: 0.03,
          minimumStrength: 0,
          maxDuration: 25,
          valueDrifts: { tradition_novelty: 0.10, courage_prudence: 0.06 },
          behaviorTag: 'dreamer',
        },
      },
      // New: grant temporary ruin_seeker trait (expires after 25 ticks)
      {
        op: 'add_node' as const,
        node: {
          id: `trait_ruin_seeker_dream_${targetAgent}_${tick}`,
          type: 'trait',
          name: 'Dream of Buried Places',
          properties: {
            subcategory: 'bestowed',
            description: 'A divine dream of ancient stone and hidden chambers.',
            importance: 0.4,
            maxLevel: 1,
            visibility: 'divine_only',
            domainContributions: { eye: 0.02 },
            tags: ['ruin_seeker', 'divine_dream'],
            flavorText: 'In the dream, stairs descend into warm darkness. Something waits below.',
          },
        },
      },
      {
        op: 'add_edge' as const,
        edge: {
          id: `has_trait_ruin_seeker_dream_${targetAgent}_${tick}`,
          type: 'has_trait',
          source: targetAgent,
          target: `trait_ruin_seeker_dream_${targetAgent}_${tick}`,
          properties: {
            level: 1,
            acquiredTick: tick ?? 0,
            lastReinforcedTick: tick ?? 0,
            source: 'divine_dream',
            visibility: 'divine_only',
            ticksRemaining: 25,
          },
        },
      },
    ];

    return ops;
  },

  'hex.whisper_intuition': (graph, col, row, tick) => {
    // Personal-scale: writes divineHunch to first agent's thread edge
    const agentIds = getAgentIdsAtHex(graph, col, row);
    if (agentIds.length === 0) return [];
    const targetAgent = agentIds[0];

    // Find thread edge from ascendant to this agent
    const threadEdges = graph.getIncomingEdges(targetAgent, 'thread');
    if (threadEdges.length === 0) return [];

    return [{
      op: 'update_edge' as const,
      edgeId: threadEdges[0].id,
      changes: {
        divineHunch: {
          strength: WHISPER_INTUITION_HUNCH_STRENGTH,
          expiresAtTick: (tick ?? 0) + WHISPER_INTUITION_DURATION_TICKS,
        },
      },
    }];
  },
};

// Exported for tests
export { getAgentIdsAtHex };
export type { GraphOpGenerator };

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

  // Static GraphOps (existing pattern)
  const graphOps = (outcome === 'success' && HEX_ACTION_GRAPH_OPS[templateId])
    ? [...HEX_ACTION_GRAPH_OPS[templateId]]
    : [];

  // Dynamic GraphOps from generators (TB-081)
  if (outcome === 'success' && graph && HEX_ACTION_GRAPH_OP_GENERATORS[templateId]) {
    try {
      const dynamicOps = HEX_ACTION_GRAPH_OP_GENERATORS[templateId](graph, col, row, tick);
      graphOps.push(...dynamicOps);
    } catch (err) {
      // Fail-soft: generator errors don't crash the pipeline
      console.warn(`[hexActionBridge] generator error for ${templateId}:`, err);
    }
  }

  return {
    hexMutations: resolveHexAction(templateId, col, row, outcome, tick),
    revelationMutations: resolveRevelation(templateId, col, row, outcome, tick),
    hiddenSiteReveals,
    graphOps,
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
