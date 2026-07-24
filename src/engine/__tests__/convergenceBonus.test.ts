/**
 * computeConvergenceBonus tests (THR-74 — Draw Together's encounter-scoring read-site).
 *
 * The bonus is the live consumer of the `convergePull*` window the `draw_together` op
 * writes. It mirrors the `hex.mark_ground` attraction term: a hex-proximity boost, keyed
 * per-agent, that decays with distance from the convergence hex and is capped at
 * DRAW_TOGETHER_PULL_WEIGHT (at the convergence hex itself). Zero when there is no open
 * window, when it has expired, or when either hex is missing (fail-soft).
 */

import { describe, it, expect } from 'vitest';
import { computeConvergenceBonus } from '../encounterScoring';
import type { GraphNode } from '../../types/graph';
import { DRAW_TOGETHER_PULL_WEIGHT } from '../../data/group-constants';

function pulledNode(untilTick: number, col = 10, row = 10): GraphNode {
  return {
    id: 'a.pulled',
    type: 'actor',
    name: 'Pulled',
    properties: {
      actorType: 'individual',
      convergePullHexCol: col,
      convergePullHexRow: row,
      convergePullUntilTick: untilTick,
    },
  };
}

describe('computeConvergenceBonus', () => {
  it('returns the full pull weight at the convergence hex (distance 0)', () => {
    const bonus = computeConvergenceBonus(pulledNode(50), 10, 10, 10);
    expect(bonus).toBeCloseTo(DRAW_TOGETHER_PULL_WEIGHT, 6);
  });

  it('decays with hex distance from the convergence hex', () => {
    const near = computeConvergenceBonus(pulledNode(50), 11, 10, 10); // distance 1
    const far = computeConvergenceBonus(pulledNode(50), 10, 25, 10); // distance 15
    expect(near).toBeGreaterThan(far);
    expect(near).toBeCloseTo(DRAW_TOGETHER_PULL_WEIGHT / 2, 6); // weight / (1 + 1)
  });

  it('is zero once the window has expired (tick >= until)', () => {
    expect(computeConvergenceBonus(pulledNode(50), 10, 10, 50)).toBe(0);
    expect(computeConvergenceBonus(pulledNode(50), 10, 10, 80)).toBe(0);
  });

  it('is zero for an agent with no convergence window', () => {
    const plain: GraphNode = { id: 'a.plain', type: 'actor', name: 'Plain', properties: { actorType: 'individual' } };
    expect(computeConvergenceBonus(plain, 10, 10, 10)).toBe(0);
  });

  it('is zero when the candidate hex is missing (fail-soft)', () => {
    expect(computeConvergenceBonus(pulledNode(50), undefined, undefined, 10)).toBe(0);
  });

  it('is zero for an undefined node (fail-soft)', () => {
    expect(computeConvergenceBonus(undefined, 10, 10, 10)).toBe(0);
  });
});
