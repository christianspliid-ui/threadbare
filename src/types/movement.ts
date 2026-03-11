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
