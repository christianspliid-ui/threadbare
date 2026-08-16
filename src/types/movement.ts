// Tunable constants re-exported from content data for backward compatibility.
// Canonical definitions live in src/data/movement-content.ts.
export { BASE_EDGE_TRAVERSAL_COST, DECISION_REEVALUATION_TICKS, TRAIL_HISTORY_TICKS } from '../data/movement-content';

// --- Types ---

/** Breakdown of tick cost to traverse one movement edge */
export interface MovementEdgeCost {
  baseCost: number;
  terrainTax: number;
  locationTax: number;
  speedModifier: number;
  /** baseCost + terrainTax + locationTax + speedModifier, floored at 0.5 */
  totalCost: number;
}

/** Per-agent movement state stored on the agent's graph node properties */
export interface MovementState {
  destinationId: string;
  movementQueue: string[];
  ticksAccumulated: number;
  currentEdgeCost: number;
  lastDecisionTick: number;
  movementHistory: MovementHistoryEntry[];
  /** Original motivation pull for the current destination path (used in mid-path re-evaluation) */
  motivationPull?: number;
  /** Sublocation to enter on arrival at destination (set by encounter-level cache decision) */
  targetSublocationId?: string;
  /** Encounter template the agent intends to attempt on arrival */
  targetEncounterId?: string;

  // --- Road traversal fields (all optional, backward-compatible) ---

  /** Current hex position during road traversal.
   *  For non-road movement: matches the hex of the current graph node.
   *  For road movement: advances through the road's hexPath. */
  currentHexPosition?: { col: number; row: number };

  /** When traversing a road segment, the remaining hex path to follow.
   *  Consumed one hex at a time as ticks accumulate.
   *  undefined/empty = not on a road (normal adjacent hop). */
  roadHexQueue?: { col: number; row: number }[];

  /** Per-hex cost for the current road segment.
   *  Pre-computed when entering a road: discountedCost / hexPath.length.
   *  Used by tickMovement to advance hex-by-hex instead of node-by-node. */
  roadHexCost?: number;

  /** Road type being traversed (for animation speed and trail rendering). */
  currentRoadType?: 'major' | 'trail';

  /** Full road segment info for the path, used to populate roadHexQueue on leg transitions. */
  roadSegments?: Array<{
    fromId: string;
    toId: string;
    roadType: 'major' | 'trail';
    hexPath: { col: number; row: number }[];
    discountedCost: number;
  }>;
}

/**
 * Where an `agent_relocation` aftermath effect is sending someone (THR-1142).
 *
 * Authored on the effect; resolved to a concrete hex at apply time and stored
 * on the intent, so a destination whose location node later dissolves still
 * reads as a place on the map rather than a dangling id.
 */
export type RelocationDestination =
  | { readonly kind: 'location'; readonly locationId: string }
  | { readonly kind: 'hex'; readonly col: number; readonly row: number }
  /** Nearest settlement to the agent's current hex, resolved at apply time. */
  | { readonly kind: 'nearest_settlement' }
  /** Any location at least `minHexDistance` hexes away; seeded pick. */
  | { readonly kind: 'away'; readonly minHexDistance: number };

/**
 * A live travel intent on an agent node (THR-1142) — "this person is trying to
 * get somewhere", written by an encounter ending and read by the decision phase.
 *
 * Deliberately **not** a movement path. The intent only tilts the existing
 * movement-target scoring toward its destination hex (`computeRelocationIntentBonus`,
 * the same additive channel Draw Together's convergence pull uses). Nothing here
 * moves anyone: the agent walks there through the ordinary movement system, so the
 * journey stays watchable on the map. There is no second movement path by design.
 */
export interface RelocationIntent {
  /** Resolved destination hex — what the scoring read actually compares against. */
  readonly destinationHex: { readonly col: number; readonly row: number };
  /** Destination location node id when the destination named one; absent for a bare hex. */
  readonly destinationNodeId?: string;
  /** Tick at which an unfulfilled intent is abandoned. Agents never get stuck walking. */
  readonly expiresAtTick: number;
  /** Tick the intent was written — arrival traces report the journey's length. */
  readonly setAtTick: number;
  /** What wrote it. Only `aftermath` today; named so a later writer is distinguishable. */
  readonly source: 'aftermath';
  /** Template whose ending sent them, for attribution in traces. */
  readonly templateId?: string;
  /** On arrival, stamp the observed-residence property (THR-822 shape). */
  readonly stampResidenceOnArrival?: boolean;
}

/** One entry in the movement trail history */
export interface MovementHistoryEntry {
  nodeId: string;
  tick: number;
  hexCol?: number;
  hexRow?: number;
}

/** A scored movement candidate that competes in the selection pipeline */
export interface MovementCandidate {
  destinationId: string;
  bestTemplateId: string;
  motivationPull: number;
  distanceDecay: number;
  score: number;
  tickDistance: number;
  path: string[];
}
