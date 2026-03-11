// --- Tunable constants (P0 defaults, will move to content data in P1) ---

/** Base tick cost per graph edge traversal */
export const BASE_EDGE_TRAVERSAL_COST = 1;

/** Ticks between agent destination re-evaluation (~1 in-game day) */
export const DECISION_REEVALUATION_TICKS = 4;

/** Number of recent ticks shown as movement trail */
export const TRAIL_HISTORY_TICKS = 12;

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
