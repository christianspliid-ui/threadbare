/**
 * THR-1580 — the anomaly discovery pull reads the reach share.
 *
 * `computeAnomalyDiscoveryBonus` gates on Eye ≥ ANOMALY_EYE_THRESHOLD and then pulls
 * BASE + Eye × EYE_SCALING × 10 + Veil × VEIL_SCALING × 10. On the pre-refit curve
 * (midpoint 10, k 0.4) the pull saturated by raw ~18, so a raw-18 dabbler pulled as
 * hard as a raw-40 seer. On the share (raw / 40) the gate stays at raw 6 and the pull
 * is graded across the whole population.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { computeAnomalyDiscoveryBonus } from '../encounterScoring';
import {
  ANOMALY_DISCOVERY_BASE_BONUS,
  ANOMALY_EYE_SCALING,
  ANOMALY_VEIL_SCALING,
} from '../../data/agent-behavior-constants';

function world(eye: number, veil: number, discovered = false): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_cavern',
    name: 'Cavern',
    type: 'location',
    properties: { isAnomalyLocation: true, discoveredByExploration: discovered, locationSubtype: 'crystal_cavern' },
  });
  graph.addNode({
    id: 'seer',
    name: 'seer',
    type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: { gold: 0, eye, heart: 0, shadow: 0, iron: 0, stone: 0, star: 0, veil, flesh: 0 },
    },
  });
  return graph;
}

const bonus = (eye: number, veil = 0, discovered = false) =>
  computeAnomalyDiscoveryBonus(world(eye, veil, discovered), 'loc_cavern', 'seer');

describe('THR-1580 — anomaly discovery reads the reach share', () => {
  it('keeps the gate at raw 6', () => {
    expect(bonus(5)).toBe(0);
    expect(bonus(6)).toBeGreaterThan(0);
  });

  it('pulls on the share: raw 20 Eye is half a raw-40 Eye', () => {
    expect(bonus(20)).toBeCloseTo(ANOMALY_DISCOVERY_BASE_BONUS + 0.5 * ANOMALY_EYE_SCALING * 10, 6);
    expect(bonus(40)).toBeCloseTo(ANOMALY_DISCOVERY_BASE_BONUS + ANOMALY_EYE_SCALING * 10, 6);
  });

  it('a raw-18 dabbler (pre-refit saturated) pulls well short of a raw-40 seer', () => {
    expect(bonus(40) - bonus(18)).toBeGreaterThan(0.5);
  });

  it('adds Veil on the share', () => {
    expect(bonus(20, 40) - bonus(20, 0)).toBeCloseTo(ANOMALY_VEIL_SCALING * 10, 6);
  });

  it('is 0 once the anomaly is discovered', () => {
    expect(bonus(40, 40, true)).toBe(0);
  });
});
