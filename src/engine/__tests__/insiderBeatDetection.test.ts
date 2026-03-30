import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAvailableInsiderBeats } from '../insiderBeatDetection';
import type { CultureIdentity } from '../../types/culture';

function makeCultureIdentity(overrides: Partial<CultureIdentity> = {}): CultureIdentity {
  return {
    foundationBias: 'chaos',
    veneratedSpheres: ['force'],
    primaryBiome: 'desert',
    socialStructure: 'warrior bands',
    accountability: 'trial by combat',
    behavioralKeywords: ['fierce', 'honor'],
    materialVocabulary: ['bone', 'iron'],
    metaphorPalette: ['storm', 'blood'],
    formativeTraitSeedIds: [],
    behavioralTraitSeedIds: [],
    reachPreferences: {
      iron: 0.5, gold: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1,
      eye: 0.1, stone: 0.1, star: 0.1, flesh: 0.1,
    },
    ...overrides,
  };
}

describe('insiderBeatDetection', () => {
  it('returns beats matching actor culture tags above min strength', () => {
    const graph = new WorldGraph();

    // Culture with force sphere
    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Desert Warriors',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({ veneratedSpheres: ['force'] }),
      },
    });

    // Actor with that culture at strength 0.6 (above typical 0.5 threshold)
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Warrior', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    expect(beats.length).toBeGreaterThan(0);
    // Should match blood_oath_challenge which requires 'force' tag at minStrength 0.5
    expect(beats.some(b => b.id === 'blood_oath_challenge')).toBe(true);
  });

  it('returns empty for cultureless actors', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Wanderer', properties: { actorType: 'individual' } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    expect(beats.length).toBe(0);
  });

  it('respects minimum strength threshold', () => {
    const graph = new WorldGraph();

    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Weak Culture',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({ veneratedSpheres: ['force'] }),
      },
    });

    // Actor with low cultural strength (0.3 — below most beat thresholds)
    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Fading', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.3 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    // All returned beats should have minStrength <= 0.3
    for (const beat of beats) {
      expect(beat.minStrength).toBeLessThanOrEqual(0.3);
    }
  });

  it('deduplicates beats when actor has multiple cultures with overlapping tags', () => {
    const graph = new WorldGraph();

    // Two cultures, both with force
    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Desert Warriors',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({ veneratedSpheres: ['force'] }),
      },
    });
    graph.addNode({
      id: 'culture_1', type: 'actor', name: 'Mountain Raiders',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({ veneratedSpheres: ['force', 'matter'] }),
      },
    });

    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Dual', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });
    graph.addEdge({ id: 'e_a1_c1', source: 'actor_1', target: 'culture_1', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    const ids = beats.map(b => b.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size); // no duplicates
  });

  it('returns beat with reachRequirements when culture meets threshold', () => {
    const graph = new WorldGraph();

    // Culture with high iron reach (blood_oath_challenge has iron >= 0.3 requirement)
    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Iron Warriors',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({
          veneratedSpheres: ['force'],
          reachPreferences: {
            iron: 0.5, gold: 0.1, shadow: 0.1, veil: 0.1, heart: 0.1,
            eye: 0.1, stone: 0.1, star: 0.1, flesh: 0.1,
          },
        }),
      },
    });

    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Warrior', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    // blood_oath_challenge requires force tag, minStrength 0.5, AND iron >= 0.3
    expect(beats.some(b => b.id === 'blood_oath_challenge')).toBe(true);
  });

  it('filters out beat with reachRequirements when culture is below threshold', () => {
    const graph = new WorldGraph();

    // Culture with force sphere but ZERO iron reach
    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Weak Iron Culture',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({
          veneratedSpheres: ['force'],
          reachPreferences: {
            iron: 0.0, gold: 0.5, shadow: 0.1, veil: 0.1, heart: 0.1,
            eye: 0.1, stone: 0.1, star: 0.1, flesh: 0.1,
          },
        }),
      },
    });

    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Non-Iron', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    // blood_oath_challenge requires iron >= 0.3, should be filtered out
    expect(beats.some(b => b.id === 'blood_oath_challenge')).toBe(false);
  });

  it('returns beats without reachRequirements regardless of culture reaches (backward compat)', () => {
    const graph = new WorldGraph();

    // Culture with force sphere, any reaches
    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Basic Culture',
      properties: {
        actorType: 'culture',
        cultureIdentity: makeCultureIdentity({
          veneratedSpheres: ['force'],
          reachPreferences: {
            iron: 0.0, gold: 0.0, shadow: 0.0, veil: 0.0, heart: 0.0,
            eye: 0.0, stone: 0.0, star: 0.0, flesh: 0.0,
          },
        }),
      },
    });

    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Basic', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    // Beats without reachRequirements should still be available (those that match tags + strength)
    // name_day_tournament requires ['force', 'order'], minStrength 0.4, no reachRequirements
    // We have 'force' tag so beats requiring only 'force' without reach gates should appear
    const beatsWithoutReachReqs = beats.filter(b => !b.reachRequirements);
    expect(beatsWithoutReachReqs.length).toBeGreaterThan(0);
  });

  it('fails soft when reachPreferences is missing from identity', () => {
    const graph = new WorldGraph();

    // Culture identity without reachPreferences (simulating legacy/corrupt data)
    const identityWithoutReach = makeCultureIdentity({ veneratedSpheres: ['force'] });
    // Deliberately remove reachPreferences to simulate missing data
    const corruptIdentity = { ...identityWithoutReach } as any;
    delete corruptIdentity.reachPreferences;

    graph.addNode({
      id: 'culture_0', type: 'actor', name: 'Corrupt Culture',
      properties: {
        actorType: 'culture',
        cultureIdentity: corruptIdentity,
      },
    });

    graph.addNode({ id: 'actor_1', type: 'actor', name: 'Actor', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_a1_c0', source: 'actor_1', target: 'culture_0', type: 'belongs_to', properties: { culturalStrength: 0.6 } });

    // Should not throw, and beats with reachRequirements should be filtered out (fail-soft: missing = 0)
    const beats = getAvailableInsiderBeats(graph, 'actor_1');
    // blood_oath_challenge has reachRequirements.iron >= 0.3, missing reach = 0 => filtered out
    expect(beats.some(b => b.id === 'blood_oath_challenge')).toBe(false);
    // Beats without reachRequirements should still work
    const beatsWithoutReachReqs = beats.filter(b => !b.reachRequirements);
    expect(beatsWithoutReachReqs.length).toBeGreaterThan(0);
  });
});
