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
