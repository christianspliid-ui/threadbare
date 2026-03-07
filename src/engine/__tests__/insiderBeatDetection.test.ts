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
});
