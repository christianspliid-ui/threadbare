import { describe, it, expect } from 'vitest';
import { computeHexThreatRating } from '../threatRating';
import { WorldGraph } from '../graph';

describe('threatRating', () => {
  function makeGraph(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'hex1', type: 'location', name: 'Contested Hex', properties: {
      locationType: 'hex_center',
    }});
    // Rival-controlled hex
    g.addNode({ id: 'rival1', type: 'rival', name: 'Dark Lord', properties: {
      hostilityToPlayer: 0.8,
    }});
    g.addEdge({ id: 'e_ctrl', source: 'rival1', target: 'hex1', type: 'controls', properties: {} });
    return g;
  }

  it('returns 0 for a hex with no threats', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'safe_hex', type: 'location', name: 'Safe', properties: { locationType: 'hex_center' } });
    const threat = computeHexThreatRating(g, 'safe_hex');
    expect(threat).toBe(0);
  });

  it('factors in faction hostility', () => {
    const g = makeGraph();
    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThan(0);
    expect(threat).toBeLessThanOrEqual(1);
  });

  it('clamps threat to [0, 1] range', () => {
    const g = makeGraph();
    const threat = computeHexThreatRating(g, 'hex1');
    expect(threat).toBeGreaterThanOrEqual(0);
    expect(threat).toBeLessThanOrEqual(1);
  });

  it('increases with hostile agents at location', () => {
    const g = makeGraph();
    // Add a hostile agent
    g.addNode({ id: 'hostile_agent', type: 'actor', name: 'Enemy', properties: {
      actorType: 'individual',
      cooperationStrategy: 'always_defect',
    }});
    g.addEdge({ id: 'e_loc', source: 'hostile_agent', target: 'hex1', type: 'located_at', properties: {} });
    g.addEdge({ id: 'e_fac', source: 'hostile_agent', target: 'rival1', type: 'member_of', properties: {} });

    const withHostile = computeHexThreatRating(g, 'hex1');
    // Remove hostile agent and compare
    g.removeEdge('e_loc');
    g.removeEdge('e_fac');
    g.removeNode('hostile_agent');
    const withoutHostile = computeHexThreatRating(g, 'hex1');
    expect(withHostile).toBeGreaterThan(withoutHostile);
  });
});
