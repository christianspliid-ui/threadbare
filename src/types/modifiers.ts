import type { TraceBase } from './trace';
import type { EdgeType } from './graph';

/** A single modifier contribution from one edge */
export interface ModifierSource {
  edgeId: string;
  edgeType: EdgeType | string;
  sourceName: string;
  delta: number;
}

/** Per-attribute minimum values to prevent degenerate states */
export const ATTRIBUTE_FLOORS: Record<string, number> = {
  los_range: 0,         // always see own hex
  action_cost: 1,       // minimum 1 essence
  domain_capability: 0, // can't go negative
};

/** Default floor for attributes not in ATTRIBUTE_FLOORS */
export const DEFAULT_FLOOR = -Infinity;

/** Trace: modifier resolution breakdown */
export interface ModifierResolutionTrace extends TraceBase {
  category: 'modifier_resolution';
  nodeId: string;
  attribute: string;
  baseValue: number;
  modifiers: ModifierSource[];
  finalValue: number;
}
