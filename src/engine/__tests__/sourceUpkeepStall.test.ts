/**
 * THR-1747 — an unpaid source stalls: it gets none of the land's upward drift on the
 * tick after it went unpaid, and gets it again once paid. The land is pinned to a
 * nurturing drift so the guard in `recomputeControlledSourceTiers` is what decides —
 * delete or invert it and this file fails (review-gate round 2).
 */
import { describe, it, expect, vi } from 'vitest';

const NURTURE = 0.05;
vi.mock('../essenceEconomyBridge', () => ({
  computeSanctitySustenance: () => ({
    drift: NURTURE,
    affinityScore: 1,
    polarity: 'nurturing',
    matchedResourceIds: ['grain'],
  }),
}));

import { WorldGraph } from '../graph';
import { phaseEssenceSources } from '../phaseEssenceSources';
import { createEmptyEssencePool } from '../influence';
import { SOURCE_CONTROL_SUSTAIN } from '../../data/essence-sources';
import { SPHERE_NAMES } from '../../types/index';
import type { GameState } from '../../types/gameState';
import type { EssenceSource } from '../../types/essenceSource';
import type { SphereAlignment } from '../../types/influence';

const ASC = 'asc-1';
const SRC = 'loc.src';

function state(primaryAmount: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASC,
    type: 'actor',
    name: 'The God',
    properties: { actorType: 'ascendant', sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment },
  });
  const src: EssenceSource = { kind: 'shrine', sphereAffinity: 'life', sanctity: 0.2, tier: 'dormant' };
  graph.addNode({ id: SRC, type: 'location', name: 'Spring', properties: { locationType: 'location', essenceSource: src } });
  graph.addEdge({ id: 'e.c', source: ASC, target: SRC, type: 'controls', properties: {} });
  const pool = createEmptyEssencePool();
  for (const s of SPHERE_NAMES) pool[s] = 10;
  pool.life = primaryAmount;
  return { tick: 1, ascendantId: ASC, graph, essencePool: pool, tickEvents: [] } as unknown as GameState;
}

const sanctity = (s: GameState) => (s.graph.getNode(SRC)!.properties.essenceSource as EssenceSource).sanctity;

describe('source upkeep stall (THR-1747)', () => {
  it('a paid source takes the land\'s nurture every tick', () => {
    const s = state(10);
    phaseEssenceSources(s);
    phaseEssenceSources(s);
    expect(sanctity(s)).toBeCloseTo(0.2 + 2 * NURTURE, 10);
  });

  it('an unpaid source misses the nurture on the tick after it went unpaid', () => {
    const s = state(SOURCE_CONTROL_SUSTAIN / 2);
    phaseEssenceSources(s); // drift lands (flag was absent → paid), then marked unpaid
    expect(sanctity(s)).toBeCloseTo(0.2 + NURTURE, 10);
    phaseEssenceSources(s); // still unpaid: the recompute reads false and skips the nurture
    expect(sanctity(s)).toBeCloseTo(0.2 + NURTURE, 10);
  });

  it('once paid again, the nurture resumes', () => {
    const s = state(SOURCE_CONTROL_SUSTAIN / 2);
    phaseEssenceSources(s);
    s.essencePool.life = 10;
    phaseEssenceSources(s); // reads last tick's unpaid flag: stalled, then pays
    expect(sanctity(s)).toBeCloseTo(0.2 + NURTURE, 10);
    phaseEssenceSources(s); // paid last tick: nurture lands
    expect(sanctity(s)).toBeCloseTo(0.2 + 2 * NURTURE, 10);
  });
});
