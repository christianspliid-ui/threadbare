/**
 * THR-1584 — mastery is permanent, and a graduate's mastery is worth something.
 *
 * Before: the only minter (`resolveMentorship` → `grantMasteryTrait`) wrote no
 * `lastReinforcedTick`, so decay never fired by accident; and each level added
 * +0.10 raw on a reach scored 10–86 — invisible on the dice curve. Now decay is
 * retired by switch (`MASTERY_DECAY_ENABLED`) and each level adds
 * `MASTERY_RAW_PER_LEVEL` raw.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveMentorship } from '../mentorshipOutcomes';
import { processTraitDecay, assignTrait, getTraitsForNode } from '../traits';
import { computeRawScore, computeCapability } from '../domainCapability';
import { seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import {
  MASTERY_DECAY_ENABLED,
  MASTERY_RAW_PER_LEVEL,
  MASTERY_TRAIT_BY_REACH,
  MASTERY_TRAIT_DEFINITIONS,
} from '../../data/mastery-trait-content';
import { GRADUATION_TRAIT_LEVEL } from '../../data/mentorship-constants';
import type { TraitDefinitionProperties } from '../../types/traits';

const APPRENTICE_HEART_RAW = 30; // the dice curve's midpoint — capability 0.50
const GRADUATION_TICK = 100;

function makeActor(graph: WorldGraph, id: string, heart: number): void {
  graph.addNode({
    id,
    name: id,
    type: 'actor',
    properties: {
      actorType: 'individual',
      domainCapabilities: {
        gold: 0, eye: 0, heart, shadow: 0,
        iron: 0, stone: 0, star: 0, veil: 0, flesh: 0,
      },
    },
  });
}

function graduateWorld(): WorldGraph {
  const graph = new WorldGraph();
  seedEncounterTraitDefinitions(graph);
  makeActor(graph, 'actor.mentor', 80);
  makeActor(graph, 'actor.apprentice', APPRENTICE_HEART_RAW);
  graph.addEdge({
    id: 'edge.mentors',
    source: 'actor.mentor',
    target: 'actor.apprentice',
    type: 'mentors',
    properties: {
      domain: 'heart', bondQuality: 1, progress: 1,
      phase: 'active', startedTick: 0, lessonsCompleted: 5,
    },
  });
  return graph;
}

function masteryLevel(graph: WorldGraph, actorId: string, traitId: string): number | undefined {
  const edge = getTraitsForNode(graph, actorId).find(e => e.target === traitId);
  return edge?.properties.level as number | undefined;
}

describe('THR-1584 — mastery is permanent', () => {
  it('the decay switch is off and no reach-mastery definition carries a decay period', () => {
    expect(MASTERY_DECAY_ENABLED).toBe(false);
    for (const def of MASTERY_TRAIT_DEFINITIONS) {
      expect((def.properties as TraitDefinitionProperties).decayPeriod, def.id).toBeUndefined();
    }
  });

  it("a graduate's mastery level is unchanged after 200 ticks without use", () => {
    const graph = graduateWorld();
    const edge = graph.getEdge('edge.mentors')!;
    resolveMentorship(graph, edge, 'completed', GRADUATION_TICK);

    const traitId = MASTERY_TRAIT_BY_REACH.heart;
    expect(masteryLevel(graph, 'actor.apprentice', traitId)).toBe(GRADUATION_TRAIT_LEVEL);

    for (let tick = GRADUATION_TICK + 1; tick <= GRADUATION_TICK + 200; tick++) {
      processTraitDecay(graph, 'actor.apprentice', tick);
    }
    expect(masteryLevel(graph, 'actor.apprentice', traitId)).toBe(GRADUATION_TRAIT_LEVEL);
  });

  it('stays permanent even when the grant carries a reinforcement timestamp', () => {
    // Guards the retirement against a later "fix" that stamps lastReinforcedTick.
    const graph = graduateWorld();
    const traitId = MASTERY_TRAIT_BY_REACH.iron;
    assignTrait(graph, 'actor.apprentice', traitId, { tick: 0, source: 'mentorship' });
    processTraitDecay(graph, 'actor.apprentice', 1000);
    expect(masteryLevel(graph, 'actor.apprentice', traitId)).toBe(1);
  });
});

describe('THR-1584 — graduation is worth something on the dice curve', () => {
  it("raises the graduate's raw score by GRADUATION_TRAIT_LEVEL × MASTERY_RAW_PER_LEVEL", () => {
    const graph = graduateWorld();
    const rawBefore = computeRawScore(graph, 'actor.apprentice', 'heart');
    const capBefore = computeCapability(graph, 'actor.apprentice', 'heart');

    resolveMentorship(graph, graph.getEdge('edge.mentors')!, 'completed', GRADUATION_TICK);

    const rawAfter = computeRawScore(graph, 'actor.apprentice', 'heart');
    const capAfter = computeCapability(graph, 'actor.apprentice', 'heart');

    expect(rawAfter - rawBefore).toBeCloseTo(GRADUATION_TRAIT_LEVEL * MASTERY_RAW_PER_LEVEL, 6);
    // Recorded delta (midpoint graduate): 0.50 → 0.69 on the THR-1581 curve.
    expect(capBefore).toBeCloseTo(0.5, 2);
    expect(capAfter - capBefore).toBeGreaterThanOrEqual(0.15);
  });
});
