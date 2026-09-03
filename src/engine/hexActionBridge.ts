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
import { isLocationNode } from './sublocationShape';

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
/** Lifespan of the temporary `ruin_seeker` trait `hex.plant_dream` grants, in ticks. */
export const PLANT_DREAM_TRAIT_DURATION_TICKS = 25;
export const SUMMON_CONGREGATION_STRENGTH = 0.4;

// THR-1193: `hex.restore_fragment` — what a Restored Fragment *is*.
/**
 * Display name of the sublocation `hex.restore_fragment` mints.
 * Passed as the op's `nodeName`, not only as a `properties.name`: `executeAddNode`
 * falls back to the generated id for the node's top-level `name`, so a properties-only
 * name leaves the fragment reading as `gen_location_7` everywhere `node.name` is shown.
 */
export const RESTORE_FRAGMENT_NAME = 'Restored Fragment';
/**
 * The sublocation type a restored fragment registers as.
 *
 * `sublocation-type.ruins` rather than a bespoke `restored_ruin` type, because
 * `sublocationTypeId` is what encounter gating matches against (`locationSubtypes` in
 * `encounter-content`), and an unregistered type gates *no* encounters — the fragment
 * would be inert scenery rather than the "functional sublocation" the action's own
 * description promises. The restored-ness is carried by {@link RESTORE_FRAGMENT_SUBTYPE}
 * for prose and art, which no gate reads.
 */
export const RESTORE_FRAGMENT_SUBLOCATION_TYPE_ID = 'sublocation-type.ruins';
/** Descriptive flavour subtype, preserved from the pre-THR-1193 recipe. */
export const RESTORE_FRAGMENT_SUBTYPE = 'restored_ruin';

// THR-1194: the three hex actions that mint a node need their display names for the
// op's `nodeName`, for the same reason RESTORE_FRAGMENT_NAME exists — `executeAddNode`
// reads the node's top-level `name` from `op.nodeName` and falls back to the generated
// id, so a `properties.name` alone leaves the thing reading as `gen_artifact_7`.
/** Display name of the artifact `hex.forge_seer_token` mints. */
export const FORGE_SEER_TOKEN_NAME = "Seer's Token";
/** Display name of the artifact `hex.forge_instrument` mints. */
export const FORGE_INSTRUMENT_NAME = 'Divine Instrument';
/** Display name of the actor `hex.send_herald` mints. */
export const SEND_HERALD_NAME = 'Divine Herald';

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
  // hex.restore_fragment — no hex mutation; dynamic GraphOp generator mints a sublocation (THR-1193)
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
  // THR-1194: `possesses`, actor → artifact.
  //
  // These two recipes spelled `possessed_by`, artifact → actor — wrong in both the name
  // and the direction. `possessed_by` is not a registered edge type and never was: it
  // appears nowhere in the codebase but here, so `executeAddEdge`'s schema chokepoint
  // refused the op and each cast minted a `storied` artifact that reached nobody. The
  // failure was invisible because a per-op flag inside a fail-soft batch has no consumer
  // (impediment #699), and invisible *twice* until THR-1193, whose `$created_N` fix is
  // what let the batch get far enough to be refused here rather than one layer earlier.
  //
  // Registering `possessed_by` was the alternative and is strictly worse: `possesses`
  // already carries this exact relationship (schema row `actor` → `artifact`), and every
  // consumer reads it in that direction — `agentAttachments` sweeps
  // `getOutgoingEdges(agentId, 'possesses')`, and `ascendantBeatSeeding` writes the same
  // shape for the Divine Gift. A second spelling would mint artifacts no possession
  // reader can see, which is the orphan this ticket exists to stop.
  'hex.forge_seer_token': [
    {
      op: 'add_node',
      nodeType: 'artifact',
      nodeName: FORGE_SEER_TOKEN_NAME,
      properties: { name: FORGE_SEER_TOKEN_NAME, subtype: 'divination_focus', tier: 'storied' },
    },
    {
      op: 'add_edge',
      edgeType: 'possesses',
      source: '$actor',
      target: '$created_0',
    },
  ],
  // THR-1194: `hex.send_herald` moved to HEX_ACTION_GRAPH_OP_GENERATORS. Its
  // `located_at` edge needs a *runtime* location id, which a static recipe cannot name
  // — the same reason `hex.restore_fragment` moved under THR-1193. See the generator.
  // THR-1194 — see the note on `hex.forge_seer_token` for why this is `possesses`,
  // actor → artifact, and not a newly registered `possessed_by`.
  'hex.forge_instrument': [
    {
      op: 'add_node',
      nodeType: 'artifact',
      nodeName: FORGE_INSTRUMENT_NAME,
      properties: { name: FORGE_INSTRUMENT_NAME, subtype: 'ritual_focus', tier: 'storied' },
    },
    {
      op: 'add_edge',
      edgeType: 'possesses',
      source: '$actor',
      target: '$created_0',
    },
  ],
  // THR-1193: `hex.restore_fragment` moved to HEX_ACTION_GRAPH_OP_GENERATORS. A
  // Restored Fragment is a sublocation, and a sublocation needs a *runtime* parent —
  // which a static recipe cannot name, because a hex action's `$location` is the hex
  // target id (`hex_31_5`), not a graph node. See the generator for the full story.
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

  /**
   * THR-1193 — restore a ruin fragment into a real sublocation.
   *
   * **What a Restored Fragment is.** A sublocation. That is not a new decision: the
   * template's own description says the fragment "becomes a functional sublocation",
   * its success prose says "a blended sublocation bridging past and present", and the
   * 2026-03-26 hex-actions design doc row reads "Partially rebuild ruin → create
   * functional blended sublocation". THR-1193 asked for the decision to be *recorded*;
   * the design had already made it, and the node shape had drifted away from it.
   *
   * **What it was doing instead.** It minted `type: 'sublocation'` — the shape THR-1183
   * retired — with no `parentLocationId`, then tried to attach it with `located_at` to
   * `$location`. Two independent reasons that could never work: `$location` for a hex
   * action resolves to the hex target id (`hex_31_5`), and hexes are not graph nodes
   * (a seeded medium world has zero); and `$created_0` resolved to nothing at all, so
   * the edge failed on its *source* before the dangling target mattered. Net effect:
   * every successful cast left an orphan node with no parent, no edges, and the name
   * `gen_sublocation_N`, invisible to every sweep. The action reported success because
   * a failed op inside a fail-soft batch is a per-op flag nobody read.
   *
   * **Why a generator and not a static recipe.** A sublocation's parent is a runtime
   * value; a static recipe can only name context sentinels, and no sentinel here names
   * a location node. THR-1193 anticipated fixing this by teaching `executeAddNode` to
   * substitute `$`-refs inside `properties` — but that would resolve `parentLocationId:
   * '$location'` to `hex_31_5` and write a *dangling* parent, satisfying the letter of
   * the fix and none of its point. A generator queries the graph and emits literal ids,
   * which needs no new executor capability and no behaviour change to the ~40 other
   * `add_node` recipes that a properties-wide `$` scan would newly reach (NFP #6).
   *
   * Fail-soft (NFP #4): a hex with no place-tier location yields no ops. The action
   * still resolves and narrates; it simply has nothing to restore the fragment onto.
   */
  'hex.restore_fragment': (graph, col, row, tick) => {
    // Place-tier only. `getLocationsInHex` returns BOTH tiers (it sweeps a bare
    // `getNodesByType('location')`, the THR-1183 trap), so an unfiltered pick could
    // parent a sublocation to a sublocation.
    const places = getLocationsInHex(graph, col, row).filter(isLocationNode);
    if (places.length === 0) return [];

    // Prefer ruins — this is a *restoration*, and the template's `narrativeLayer` is
    // 'ruins'. Falls back to any place on the hex rather than refusing: the fragment
    // has to land somewhere, and refusing would make a successful cast a silent no-op.
    const parent =
      places.find(p => String(p.properties?.locationSubtype ?? '').includes('ruin')) ?? places[0];

    return [
      {
        op: 'add_node',
        nodeType: 'location',
        nodeName: RESTORE_FRAGMENT_NAME,
        properties: {
          // The canonical sublocation shape, matching `strategicGraphOps.createSublocation`.
          sublocationTypeId: RESTORE_FRAGMENT_SUBLOCATION_TYPE_ID,
          parentLocationId: parent.id,
          // `persistence` is required by `SublocationProperties`, and omitting it is what
          // crashed `checkDissolutions` under THR-1183. A rebuilt ruin is permanent.
          persistence: { type: 'permanent' },
          hexCol: col,
          hexRow: row,
          subtype: RESTORE_FRAGMENT_SUBTYPE,
          hidden: false,
          createdTick: tick,
        },
      },
      {
        // `contains`, parent → fragment: the attachment convention every other
        // sublocation uses. The old `located_at` edge made this a third convention.
        op: 'add_edge',
        edgeType: 'contains',
        source: parent.id,
        target: '$created_0',
      },
    ];
  },

  /**
   * THR-1194 — send a herald who actually arrives somewhere.
   *
   * **Found in passing while fixing the two forge recipes**, and the same failure their
   * ticket is named for: the herald reached the graph as an orphan. The static recipe
   * attached it with `located_at` to `$location`, and a hex action's `$location`
   * resolves to the hex *target* id (`hex_3_5`) — hexes are not graph nodes, so the op
   * failed `Target node not found` on every cast. THR-1193 fixed the `$created_0` half
   * of this recipe and left the `$location` half, because it was out of that scope;
   * measured here, the herald still landed with a thread and no location, invisible to
   * every location sweep. Same cause, same shape, one line from the ops being edited.
   *
   * **Why a generator.** Identical to `hex.restore_fragment`: the target is a runtime
   * value and no context sentinel names a location node on the hex, so the recipe has
   * to query the graph and emit a literal id.
   *
   * **Place-tier only**, for the THR-1183 reason — `getLocationsInHex` sweeps a bare
   * `getNodesByType('location')` and so returns sublocations too; a herald posted to a
   * sublocation would be legal under the schema but is not what "arrives at the hex"
   * means. Fail-soft (NFP #4): a hex with no place-tier location yields no ops. Minting
   * a located-nowhere herald is the very orphan this fixes, so refusing beats shipping.
   */
  'hex.send_herald': (graph, col, row) => {
    const places = getLocationsInHex(graph, col, row).filter(isLocationNode);
    if (places.length === 0) return [];
    const destination = places[0];

    return [
      {
        op: 'add_node',
        nodeType: 'actor',
        nodeName: SEND_HERALD_NAME,
        properties: {
          name: SEND_HERALD_NAME,
          archetype: 'herald',
          isHerald: true,
        },
      },
      {
        op: 'add_edge',
        edgeType: 'located_at',
        source: '$created_0',
        target: destination.id,
      },
      {
        op: 'add_edge',
        edgeType: 'thread',
        source: '$actor',
        target: '$created_0',
        properties: { tier: 1, attentionMode: 'auto_resolve' },
      },
    ];
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
        // THR-1196: `occurred_at` lists `tick` in its schema row's requiredProperties.
        // The edge landed anyway — the schema warns rather than refusing — so consumers
        // reading `edge.properties.tick` on a divine spark got `undefined`, and the
        // warning went to a console nobody reads.
        properties: { tick },
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
            ticksRemaining: PLANT_DREAM_TRAIT_DURATION_TICKS,
            // THR-784: authored total kept as provenance and as the duration
            // progress-bar denominator (THR-761 contract). `ticksRemaining` is
            // the live counter decayConditions decrements; this one does not move.
            durationTicks: PLANT_DREAM_TRAIT_DURATION_TICKS,
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
 * All hex-action template ids this bridge implements — the union of the three
 * id-keyed effect maps (tile mutations, static GraphOps, dynamic GraphOp
 * generators). Exported additively (THR-604) so engineEffectRegistry has a
 * single place to ask "does the hex bridge wire this id?". Derived from the
 * module's own maps so it can never drift from them.
 */
export const HEX_BRIDGE_TEMPLATE_IDS: ReadonlySet<string> = new Set<string>([
  ...Object.keys(HEX_ACTION_MUTATIONS),
  ...Object.keys(HEX_ACTION_GRAPH_OPS),
  ...Object.keys(HEX_ACTION_GRAPH_OP_GENERATORS),
]);

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
