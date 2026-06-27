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
  | 'imbue_item';     // THR-508: append a sphere-flavored power to a target artifact node

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
