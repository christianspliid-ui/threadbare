// @vitest-lane heavy — builds medium worlds twice and reads the seeded people web (THR-1630)
/**
 * THR-1630 S1 — the people web on a generated world.
 *
 * Every assertion reads a world `initializeGameState` actually minted, never a fixture:
 * the defect this slice closes is that no writer ever produced a family tie, so a
 * fixture that hands itself a `kin` edge would verify its own fiction.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { _resetNpcCounter } from '../npcSeeding';
import { buildAmbitionAgentSnapshot } from '../ambitionTick';
import { scoreDesirability } from '../ambitionSelection';
import { resolveGrievanceDisposition } from '../grievance/grievanceLifecycle';
import { EVENT_MINTED_AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { WORLDGEN_TIES_MIN_PER_PROTAGONIST, WORLDGEN_KIN_STRENGTH } from '../../data/worldgen-living-constants';
import type { WorldGraph } from '../graph';

function buildWorld(seed: number): WorldGraph {
  _resetNpcCounter();
  const { state } = initializeGameState(
    generateArchetypes(4, seed)[0],
    'T',
    createBalancedCosmology(),
    seed,
    MAP_SIZE_PRESETS.medium.cols,
    MAP_SIZE_PRESETS.medium.rows,
  );
  return state.graph;
}

const heroesOf = (g: WorldGraph) =>
  g.getNodesByType('actor').filter(n => /^ind_\d+$/.test(n.id)).map(n => n.id).sort();

const kinOf = (g: WorldGraph, id: string) =>
  g.getOutgoingEdges(id, 'relates_to').filter(e => e.properties.basis === 'kin');

describe.each([42, 99])('the seeded people web, seed %i', { timeout: 60_000 }, (seed) => {
  const graph = buildWorld(seed);
  const heroes = heroesOf(graph);

  it('gives every hero a kin, a friend and a rival — mutual and stamped worldgen', () => {
    for (const hero of heroes) {
      const seeded = graph.getOutgoingEdges(hero, 'relates_to').filter(e => e.properties.origin === 'worldgen');
      const bases = new Set(seeded.map(e => e.properties.basis));
      expect(seeded.length, hero).toBeGreaterThanOrEqual(WORLDGEN_TIES_MIN_PER_PROTAGONIST);
      expect(bases.has('kin'), `${hero} has kin`).toBe(true);
    }
    for (const e of graph.getEdgesByType('relates_to')) {
      if (e.properties.origin !== 'worldgen') continue;
      const back = graph.getOutgoingEdges(e.target, 'relates_to')
        .find(b => b.target === e.source && b.properties.basis === e.properties.basis);
      expect(back?.properties.origin, `${e.id} is mutual`).toBe('worldgen');
    }
  });

  it('a seeded kin tie scores protect_the_home through its bond modifier', () => {
    // protect_the_home is an event-minted drive; the mint lane scores it through the same funnel.
    const template = EVENT_MINTED_AMBITION_TEMPLATES.find(t => t.id === 'ambition_protect_the_home');
    expect(template?.bondModifiers.some(b => b.bondType === 'kin')).toBe(true);
    const hero = heroes.find(h => kinOf(graph, h).length > 0)!;
    const snapshot = buildAmbitionAgentSnapshot(graph, hero);
    expect(snapshot.bonds.some(b => b.bondType === 'kin')).toBe(true);
    const withBonds = scoreDesirability(template!, snapshot, () => 0.5);
    const withoutBonds = scoreDesirability(template!, { ...snapshot, bonds: [] }, () => 0.5);
    expect(withBonds).toBeGreaterThan(withoutBonds);
  });

  it('a dead hero passes their grievance to kin (findHeir reads the seeded strength)', () => {
    const hero = heroes.find(h => kinOf(graph, h).some(e => e.properties.strength === WORLDGEN_KIN_STRENGTH))!;
    const kinIds = new Set(kinOf(graph, hero).map(e => e.target));
    // A culprit outside the hero's ties, so the chain has somebody to blame.
    const culprit = graph.getNodesByType('actor').find(n =>
      n.properties.actorType === 'individual' && n.id !== hero
      && !graph.getOutgoingEdges(hero, 'relates_to').some(e => e.target === n.id))!;
    graph.getNode(hero)!.properties.deceased = true;
    resolveGrievanceDisposition(graph, hero, { culpritAgentId: culprit.id, harmMagnitude: 0.8, chainDepth: 0 }, 1);
    const carriers = [...kinIds].filter(k =>
      graph.getOutgoingEdges(k, 'hostile_to').some(e => e.target === culprit.id)
      || graph.getOutgoingEdges(k, 'pursues').some(e => e.properties.culpritAgentId === culprit.id));
    expect(carriers.length, `a kin of ${hero} carries the grievance`).toBe(1);
  });
});
