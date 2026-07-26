/**
 * GraphOp: Structured graph operation types for CRUD action templates.
 *
 * GraphOp provides a typed, reusable system for defining graph mutations
 * (add/remove/update nodes and edges) as composable templates. They use
 * symbolic references ($actor, $target, $location) that get resolved at
 * execution time, allowing the same template to apply to different agents.
 */

import type { NodeType, EdgeType } from './graph';

// ─── Symbolic References ─────────────────────────────────────────

/**
 * Symbolic references that get resolved to actual node IDs at execution time.
 * This allows graph operation templates to stay generic and reusable.
 */
export const SYMBOLIC_REFS = ['$actor', '$target', '$location'] as const;

/**
 * Type guard for symbolic references.
 */
export type SymbolicRef = typeof SYMBOLIC_REFS[number];

/**
 * Check if a string is a symbolic reference.
 */
export function isSymbolicRef(ref: string): ref is SymbolicRef {
  return (SYMBOLIC_REFS as readonly string[]).includes(ref);
}

/**
 * Execution context for GraphOp operations.
 * Maps symbolic references to actual node IDs at runtime.
 */
export interface GraphOpContext {
  /** The primary actor performing the action */
  actorId: string;
  /** The target of the action (location, other actor, etc.) */
  targetId: string;
  /** The location where the action takes place */
  locationId: string;
  /** Current tick, used by apply_influence for tickApplied timestamp */
  tick?: number;
  /** Extra named references for complex templates */
  extras?: Record<string, string>;
}

/**
 * Resolve a reference string using execution context.
 * Symbolic refs are replaced with actual IDs; non-symbolic strings pass through.
 */
export function resolveRef(ref: string, ctx: GraphOpContext): string {
  if (ref === '$actor') return ctx.actorId;
  if (ref === '$target') return ctx.targetId;
  if (ref === '$location') return ctx.locationId;
  if (ctx.extras && ref in ctx.extras) return ctx.extras[ref];
  return ref; // literal ID passthrough
}

// ─── GraphOp Type ───────────────────────────────────────────────

/**
 * Operation type for graph mutations.
 * Maps to mutations in the world graph: node creation/deletion/update,
 * edge creation/deletion/update.
 */
export type GraphOpType =
  | 'add_node'
  | 'remove_node'
  | 'update_node'
  | 'add_edge'
  | 'remove_edge'
  | 'update_edge'
  | 'apply_influence'
  | 'set_thread_courtposition'
  | 'reveal_secret'    // THR-30: marks actor's best knows_secret_of→target as revealed
  | 'call_in_favor'   // THR-30: marks target's best owes_favor→actor as redeemed
  | 'plant_secret'    // THR-30: creates a fabricated knows_secret_of edge actor→target
  | 'faction_verb'    // THR-400/433: dispatch a faction governance verb (stir_dissent, whisper_leader, recover_doctrine, surface_doubter, kindle_a_calling)
  | 'plant_schism'    // THR-430: mark a faction as having a pending schism resolution
  | 'anoint_successor' // THR-432: anoint the target agent as their faction's next heir (creates will_succeed edge)
  | 'imbue_item'     // THR-508: append a sphere-flavored power to a target artifact node
  | 'bestow_power'   // THR-512: grant a threaded agent a divine-gift artifact (reach bonus + quintessence regen)
  | 'anoint_faction' // THR-513: flag a target faction as the ascendant's chosen — grants a domain-keyed chosen power (consumed by phaseChosenFactionPowers)
  | 'consecrate_source' // THR-611: turn the target host into a typed essence source (Build/Create leg) + ensure a controls edge
  | 'sanctify_source' // THR-611: raise a typed source's sanctity toward flowering (Build leg)
  | 'defend_source'  // THR-611: clear contestation / desecration and restore a source's sanctity (Defend leg)
  | 'find_source'    // THR-611 Slice 4: reveal latent (undiscovered) essence sources within range of the target (Find leg)
  | 'claim_source'   // THR-611 Slice 4: establish a controls edge to a discovered, uncontrolled source (Claim leg)
  | 'fortify_location' // THR-605 Slice 1: raise a location's fortificationMultiplier (capped), consumed by siegeResolution
  | 'attune_artifact'  // THR-605 Slice 2: append the ascendant's-sphere positive effect to an artifact + stamp attunedSphere (consumed by the effect walker)
  | 'curse_artifact'   // THR-605 Slice 2: append a concealed per-tick quintessence drain to an artifact + set cursed flags (consumed by the effect walker)
  | 'nullify_artifact' // THR-605 Slice 2: strip an artifact's effects + attune/curse flags back to inert (inverse of imbue/attune/curse)
  | 'scry_sublocation' // THR-605 Slice 3: reveal concealed knows_secret_of secrets on agents at the target sublocation's hex (consumed by agentDetail + secret-decay protection)
  | 'plant_trap' // THR-605 Slice 4: plant a concealed snare in a sublocation — seeds the encounter.trap.sprung beat against a co-located victim (consumed by evaluateEncounterSeeds → spawns a real trap encounter)
  | 'bless_harvest'  // THR-616 P2: raise every staple resource's quantity at the target location (stock tier re-derives next tick via phaseResourceStockTiers)
  | 'blight_harvest' // THR-616 P2: lower every staple resource's quantity at the target location (inverse of bless_harvest)
  | 'reveal_vein'    // THR-618 P4: surface/boost a terrain-appropriate non-staple deposit at the target location
  | 'guide_caravan'  // THR-618 P4: boost + protect every trade route touching the target settlement
  | 'sour_mine'      // THR-618 P4: drain every non-staple deposit at the target location (inverse of reveal_vein)
  | 'bless_company'  // THR-74 (Bless this Company): boost a company's cohesion and open a dispute-suppression window (consumed by groupCohesion/groupDissolution/groupMovement via isGroupBlessed)
  | 'draw_together' // THR-74 (Draw Together): stamp a convergence pull on the anchor + nearby scattered threaded mortals so their own movement bends toward gathering (consumed by encounterScoring.computeConvergenceBonus + groupFormation cause detection)
  | 'reunite_company' // THR-732 (Reunite): open a reunion window on a *disbanded* company and stamp Draw Together's convergence pull on its scattered former members (consumed by encounterScoring.computeConvergenceBonus + groupFormation's reunite cause/compat bonus)
  | 'sunder_company' // THR-732 (Sunder): crack an *active* company's cohesion and open an amplification window (consumed by groupCohesion/groupDissolution/phaseGroups via isGroupSundered)
  | 'quintessence_restore'; // THR-773 (Rekindle the Thread): raise a worn mortal's quintessence to REKINDLE_RESTORE_TO_RATIO and clear the broken stamp (consumed by brokenState.isBrokenMortal + the candidacy/drift gate)

/**
 * Payload for the apply_influence GraphOp.
 * Adds a decaying divine influence entry to an actor node.
 * This replaces the hardcoded intervention effect handlers.
 */
export interface InfluencePayload {
  readonly interventionType: string;
  readonly sphere: string;
  readonly initialStrength: number;
  readonly decayRate: number;
  readonly minimumStrength: number;
  readonly maxDuration: number;
  readonly valueDrifts?: Record<string, number>;
  readonly reachBoost?: { readonly reach: string; readonly bonus: number };
  readonly behaviorTag?: string;
  readonly traitId?: string;
  readonly personalityBoost?: number;
  readonly strategyOverride?: string;
  readonly agendaId?: string;
}

/**
 * A single graph operation: a structured mutation that can be applied
 * to the world graph with symbolic references resolved at runtime.
 *
 * Design note: Fields are optional where they're not needed for a given
 * operation type (e.g., nodeType is irrelevant for remove_edge).
 */
export interface GraphOp {
  /** Operation type */
  op: GraphOpType;

  // ─ Node operation fields ─

  /** Node type for add_node operations */
  nodeType?: NodeType;

  /** Node name for add_node operations */
  nodeName?: string;

  // ─ Edge operation fields ─

  /** Edge type for add_edge / update_edge operations */
  edgeType?: EdgeType;

  /** Source node ID (can be symbolic or literal) */
  source?: string;

  /** Target node ID (can be symbolic or literal) */
  target?: string;

  // ─ Reference fields ─

  /** Node ID for update_node / remove_node (can be symbolic or literal) */
  nodeId?: string;

  /** Edge ID for remove_edge / update_edge (literal ID only) */
  edgeId?: string;

  // ─ Payload fields ─

  /** Properties to set on new nodes/edges */
  properties?: Record<string, unknown>;

  /** Changes to apply for update operations */
  changes?: Record<string, unknown>;

  /** Influence payload for apply_influence operations */
  influence?: InfluencePayload;

  // ─ THR-400 faction governance verbs ─

  /**
   * For `op: 'faction_verb'`: which verb to dispatch.
   * Accepted values: 'stir_dissent' | 'whisper_leader' | 'recover_doctrine' | 'surface_doubter'
   * (typed as string here to avoid a circular import from the engine module that
   * declares the runtime FactionGovernanceVerbKind union).
   */
  factionVerbKind?: string;
  /** For `op: 'faction_verb'` with kind 'whisper_leader': the chosen pole. */
  factionVerbPreferredPole?: string;

  // ─ THR-430 schism plant ─

  /** For `op: 'plant_schism'`: ticks until the pending crisis resolves. */
  schismResolutionDelay?: number;

  // ─ THR-611 essence-source ops ─

  /**
   * For `op: 'consecrate_source'`: the essence-source kind to create.
   * Typed as string here to avoid a circular import of `SourceKind` from the
   * types barrel; the executor narrows/defaults it (unknown → 'shrine').
   */
  sourceKind?: string;
  /**
   * For `op: 'consecrate_source'`: which sphere the new source's income feeds.
   * Omit → defaults to the acting ascendant's PRIMARY sphere (read at runtime).
   * Typed as string here for the same circular-import reason as `sourceKind`.
   */
  sourceSphere?: string;
  /**
   * For `op: 'find_source'`: hex range within which latent sources are revealed,
   * centered on the resolved target location. Omit → the tunable
   * `SOURCE_DISCOVERY_RANGE_HOPS` default (read at runtime).
   */
  discoveryRangeHops?: number;
}

// ─── Result Types ───────────────────────────────────────────────

/**
 * Result of executing a single GraphOp.
 * Supports fail-soft: individual operations can fail without crashing
 * the entire mutation batch.
 */
export interface GraphOpResult {
  /** The operation that was executed */
  op: GraphOp;

  /** Whether the operation succeeded */
  success: boolean;

  /** ID of created node/edge (if successful and applicable) */
  createdId?: string;

  /** Error message if failed */
  error?: string;
}

/**
 * Result of executing a batch of GraphOps.
 * Tracks all individual results plus a createdIds map for chaining.
 */
export interface GraphOpBatchResult {
  /** Results for each operation in the batch */
  results: GraphOpResult[];

  /** True if all operations succeeded */
  allSucceeded: boolean;

  /** Map of symbolic names to created IDs, for chaining operations */
  createdIds: Record<string, string>;
}
