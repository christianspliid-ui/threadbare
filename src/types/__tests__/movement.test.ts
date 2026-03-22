import { describe, it, expect } from 'vitest';
import {
  BASE_EDGE_TRAVERSAL_COST,
  DECISION_REEVALUATION_TICKS,
  TRAIL_HISTORY_TICKS,
  type MovementState,
  type MovementEdgeCost,
} from '../movement';

describe('movement types', () => {
  it('exports BASE_EDGE_TRAVERSAL_COST as 1', () => {
    expect(BASE_EDGE_TRAVERSAL_COST).toBe(1);
  });
  it('exports DECISION_REEVALUATION_TICKS as 4', () => {
    expect(DECISION_REEVALUATION_TICKS).toBe(4);
  });
  it('exports TRAIL_HISTORY_TICKS as 6', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(6);
  });
  it('MovementState shape is assignable', () => {
    const state: MovementState = {
      destinationId: 'loc_market',
      movementQueue: ['hex_a_center', 'hex_a_b_border', 'hex_b_center'],
      ticksAccumulated: 0,
      currentEdgeCost: 2,
      lastDecisionTick: 10,
      movementHistory: [],
    };
    expect(state.movementQueue).toHaveLength(3);
  });
  it('MovementEdgeCost shape is assignable', () => {
    const cost: MovementEdgeCost = {
      baseCost: 1,
      terrainTax: 0.5,
      locationTax: 0,
      speedModifier: 0,
      totalCost: 1.5,
    };
    expect(cost.totalCost).toBe(1.5);
  });
});
