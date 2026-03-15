import { describe, it, expect } from 'vitest';
import { generateMovementCandidates, scoreMovementCandidate } from '../movementCandidates';
import { WorldGraph } from '../graph';
import type { AxiologicalProfile } from '../../types/agent';

// Minimal profile: all zeros except ambition=0.8
function testProfile(): AxiologicalProfile {
  return {
    ambition_contentment: 0.8,
    courage_prudence: 0.5,
    cruelty_compassion: 0,
    cunning_honesty: 0,
    devotion_independence: 0,
    loyalty_treachery: 0,
    tradition_innovation: 0,
    dominance_humility: 0,
    wrath_patience: 0,
    greed_generosity: 0,
  };
}

function buildTestGraph(): WorldGraph {
  const g = new WorldGraph();
  // Two hexes, each with a location
  g.addNode({
    id: 'hex_a',
    type: 'location',
    name: 'Hex A',
    properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 0, hexRow: 0 },
  });
  g.addNode({
    id: 'hex_b',
    type: 'location',
    name: 'Hex B',
    properties: { terrain: 'grassland', locationType: 'hex_center', hexCol: 1, hexRow: 0 },
  });
  g.addEdge({ id: 'adj_ab', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
  g.addEdge({ id: 'adj_ba', source: 'hex_b', target: 'hex_a', type: 'adjacent', properties: {} });

  // Location with encounters at hex B
  g.addNode({
    id: 'loc_b',
    type: 'location',
    name: 'Town B',
    properties: { locationSubtype: 'town', locationType: 'location' },
  });
  g.addEdge({ id: 'contains_b', source: 'hex_b', target: 'loc_b', type: 'contains', properties: {} });

  // Agent at hex_a
  g.addNode({
    id: 'agent_1',
    type: 'actor',
    name: 'Agent',
    properties: { actorType: 'individual', archetypeId: 'warlord' },
  });
  g.addEdge({ id: 'loc_agent', source: 'agent_1', target: 'hex_a', type: 'located_at', properties: {} });

  return g;
}

describe('scoreMovementCandidate', () => {
  it('applies distance decay to motivation score', () => {
    const score = scoreMovementCandidate(0.8, 2); // motivationPull=0.8, tickDistance=2
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.8); // decay reduces it
  });

  it('nearby destination scores higher than distant', () => {
    const near = scoreMovementCandidate(0.8, 1);
    const far = scoreMovementCandidate(0.8, 10);
    expect(near).toBeGreaterThan(far);
  });

  it('high motivation overcomes distance', () => {
    const highMotivation = scoreMovementCandidate(5.0, 10); // quest priority inflated
    const lowMotivationNear = scoreMovementCandidate(0.5, 1);
    expect(highMotivation).toBeGreaterThan(lowMotivationNear);
  });
});

describe('generateMovementCandidates', () => {
  it('returns empty array when no reachable locations exist', () => {
    const g = new WorldGraph();
    g.addNode({
      id: 'hex_isolated',
      type: 'location',
      name: 'Isolated',
      properties: { terrain: 'grassland', locationType: 'hex_center' },
    });
    g.addNode({ id: 'agent', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'loc', source: 'agent', target: 'hex_isolated', type: 'located_at', properties: {} });

    const candidates = generateMovementCandidates(g, 'agent', 'hex_isolated', testProfile());
    expect(candidates).toEqual([]);
  });

  it('generates candidates for adjacent hex locations', () => {
    const g = buildTestGraph();
    const candidates = generateMovementCandidates(g, 'agent_1', 'hex_a', testProfile());
    // Should find hex_b as destination
    expect(candidates.length).toBeGreaterThan(0);
    const destIds = candidates.map((c) => c.destinationId);
    expect(destIds).toContain('hex_b');
  });

  it('candidates have path and tickDistance', () => {
    const g = buildTestGraph();
    const candidates = generateMovementCandidates(g, 'agent_1', 'hex_a', testProfile());
    for (const c of candidates) {
      expect(c.path.length).toBeGreaterThan(0);
      expect(c.tickDistance).toBeGreaterThan(0);
      expect(c.score).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('quest priority integration', () => {
  it('questPriority multiplies motivationPull', () => {
    const normalScore = scoreMovementCandidate(0.5, 10);
    const questScore = scoreMovementCandidate(0.5 * 5.0, 10); // questPriority = 5.0
    expect(questScore).toBeGreaterThan(normalScore);
    expect(questScore / normalScore).toBeCloseTo(5.0, 1);
  });
});
