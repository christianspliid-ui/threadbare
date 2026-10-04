// @vitest-lane heavy — builds a medium world (THR-1658: descent writer/reader agreement and the old-banner refill path)
/**
 * THR-1658 on a world worldgen actually mints, never a fixture.
 *
 * DW2 (agreement): for every mortal worldgen gave descent, the play-time reader's
 * answer about their home region — `historicalCultureOfRegion` of the region the graph
 * places them in — is their descent culture. Writer and reader share one predicate;
 * this proves they also agree on *which* region.
 *
 * DW3 (path): no one holds the drive at t0; a deciding heir whose slots are freed
 * takes it up at the next re-evaluation, on an edge with no grievance and a
 * provenance label naming the empire; no mortal without descent, and no non-decider,
 * ever holds it.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { _resetNpcCounter } from '../npcSeeding';
import { isAutonomousDecisionActor } from '../decisionTier';
import { resolveRegionId } from '../graphConditions';
import { getDescentCultureIds, historicalCultureOfRegion } from '../descent';
import { phaseAmbitionProgress, AMBITION_REEVAL_INTERVAL, MILESTONE_CHECK_INTERVAL } from '../ambitionTick';
import { OLD_BANNER_TEMPLATE_ID, OLD_BANNER_LABEL_STEM } from '../../data/descent-constants';
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';

const SEED = 7;
const TIMEOUT_MS = 240_000;

function buildWorld(): GameState {
  _resetNpcCounter();
  resetEventCounter();
  resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS.medium;
  return initializeGameState(
    generateArchetypes(4, SEED)[0], 'T', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  ).state;
}

const individuals = (g: WorldGraph) =>
  g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true);

const bannerEdges = (g: WorldGraph, actorId: string) =>
  g.getOutgoingEdges(actorId, 'pursues')
    .filter(e => g.getNode(e.target)?.properties.templateId === OLD_BANNER_TEMPLATE_ID);

describe('descent on a generated world (THR-1658)', () => {
  it('DW2 + DW3: writer and reader agree; a freed deciding heir raises the old banner', { timeout: TIMEOUT_MS }, () => {
    const state = buildWorld();
    const g = state.graph;

    // ── DW2: agreement ──
    const descended = individuals(g).filter(n => getDescentCultureIds(n).length > 0);
    expect(descended.length).toBeGreaterThan(20); // not vacuous
    const disagree: string[] = [];
    for (const m of descended) {
      const region = resolveRegionId(g, g.getOutgoingEdges(m.id, 'located_at')[0]?.target);
      const empire = region ? historicalCultureOfRegion(g, region) : undefined;
      if (!empire || !getDescentCultureIds(m).includes(empire)) disagree.push(`${m.id}: region ${region} empire ${empire} vs ${getDescentCultureIds(m)}`);
    }
    expect(disagree.slice(0, 5)).toEqual([]);

    // ── DW3: no t0 holder ──
    expect(individuals(g).filter(n => bannerEdges(g, n.id).length > 0).map(n => n.id)).toEqual([]);

    // Free every deciding heir's slots, then run the re-evaluation on the next tick
    // that is both a milestone and a re-evaluation tick.
    const heirs = descended.filter(isAutonomousDecisionActor);
    expect(heirs.length).toBeGreaterThan(0);
    for (const heir of heirs) {
      for (const e of g.getOutgoingEdges(heir.id, 'pursues')) {
        if (e.properties.status === 'active') g.updateEdge(e.id, { properties: { ...e.properties, status: 'abandoned', resolvedTick: 0 } });
      }
    }
    const lcm = (a: number, b: number): number => { const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x); return (a * b) / gcd(a, b); };
    const tick = lcm(AMBITION_REEVAL_INTERVAL, MILESTONE_CHECK_INTERVAL);
    phaseAmbitionProgress({ ...state, tick });

    const takers = heirs.filter(h => bannerEdges(g, h.id).some(e => e.properties.status === 'active'));
    expect(takers.length).toBeGreaterThan(0);
    for (const h of takers) {
      const edge = bannerEdges(g, h.id)[0];
      expect(edge.properties.grievance).toBeUndefined();
      expect(edge.properties.culpritAgentId).toBeUndefined();
      expect(edge.properties.assignedTick).toBe(tick);
      const label = edge.properties.mintedByLabel as string;
      expect(label.startsWith(`${OLD_BANNER_LABEL_STEM} `)).toBe(true);
      expect(label).not.toContain('a people long gone'); // the empire resolved to a name
    }

    // Never to the wrong mortal.
    for (const n of individuals(g)) {
      if (bannerEdges(g, n.id).length === 0) continue;
      expect(getDescentCultureIds(n).length).toBeGreaterThan(0);
      expect(heirs.map(h => h.id)).toContain(n.id);
    }
  });
});
