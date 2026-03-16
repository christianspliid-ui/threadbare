import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentAttachments } from '../agentAttachments';

function setupBaseGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.1', type: 'actor', name: 'Kael',
    properties: { actorType: 'individual' },
  });
  return graph;
}

describe('getAgentAttachments', () => {
  it('returns empty arrays for agent with no attachments', () => {
    const graph = setupBaseGraph();
    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.possessions).toEqual([]);
    expect(result.conditions).toEqual([]);
    expect(result.powers).toEqual([]);
    expect(result.agreements).toEqual([]);
  });

  it('gathers possessions from possesses edges', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'item.1', type: 'artifact', name: "Ashenmane's Fang",
      properties: {
        subcategory: 'arms',
        tier: 2,
        mechanicalSummary: '+Iron in open terrain',
        tags: ['weapon', 'iron'],
        lossCondition: 'breakable',
        flavorText: 'Still bites strangers.',
      },
    });
    graph.addEdge({
      id: 'e-possess-1',
      source: 'agent.1', target: 'item.1', type: 'possesses',
      properties: { modifiers: { iron: 2 }, grants: ['cavalry_charge'], tags: [] },
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.possessions).toHaveLength(1);
    expect(result.possessions[0].name).toBe("Ashenmane's Fang");
    expect(result.possessions[0].subcategory).toBe('arms');
    expect(result.possessions[0].tier).toBe(2);
    expect(result.possessions[0].lossCondition).toBe('breakable');
  });

  it('gathers legendary possessions from bonded_to edges', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'legendary.1', type: 'artifact_legendary', name: 'Starforged Blade',
      properties: {
        subcategory: 'arms',
        tier: 4,
        mechanicalSummary: '+Star, +Iron',
        tags: ['weapon', 'star'],
        lossCondition: 'permanent',
      },
    });
    graph.addEdge({
      id: 'e-bond-1',
      source: 'agent.1', target: 'legendary.1', type: 'bonded_to',
      properties: {},
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.possessions).toHaveLength(1);
    expect(result.possessions[0].tier).toBe(4);
  });

  it('gathers conditions from has_trait edges with condition category', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.wound.1', type: 'trait', name: 'Bruised Ribs',
      properties: {
        category: 'condition',
        subcategory: 'wound',
        tier: 1,
        mechanicalSummary: '-Iron (minor)',
        tags: ['wound'],
        ticksRemaining: 8,
        totalTicks: 20,
      },
    });
    graph.addEdge({
      id: 'e-trait-wound-1',
      source: 'agent.1', target: 'trait.wound.1', type: 'has_trait',
      properties: {},
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].name).toBe('Bruised Ribs');
    expect(result.conditions[0].ticksRemaining).toBe(8);
    expect(result.conditions[0].totalTicks).toBe(20);
  });

  it('gathers blessings and curses as conditions', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.bless.1', type: 'trait', name: 'Sun-Touched',
      properties: {
        category: 'blessing',
        tier: 1,
        mechanicalSummary: '+Star (minor)',
        tags: ['blessing'],
        ticksRemaining: 6,
        totalTicks: 10,
      },
    });
    graph.addEdge({
      id: 'e-trait-bless-1',
      source: 'agent.1', target: 'trait.bless.1', type: 'has_trait',
      properties: {},
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].subcategory).toBe('blessing');
  });

  it('gathers bestowed powers from has_trait edges', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.power.1', type: 'trait', name: 'Turn Undead',
      properties: {
        category: 'bestowed',
        tier: 2,
        mechanicalSummary: '+Star, sense undead',
        tags: ['divine', 'spirit'],
        grantedBy: 'Solhaven',
      },
    });
    graph.addEdge({
      id: 'e-trait-power-1',
      source: 'agent.1', target: 'trait.power.1', type: 'has_trait',
      properties: {},
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.powers).toHaveLength(1);
    expect(result.powers[0].name).toBe('Turn Undead');
    expect(result.powers[0].grantedBy).toBe('Solhaven');
  });

  it('gathers agreements from relates_to edges with agreement property', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'agent.2', type: 'actor', name: 'Ixaroth',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'e-relates-1',
      source: 'agent.1', target: 'agent.2', type: 'relates_to',
      properties: {
        agreementName: 'The Seven-Task Bargain',
        agreement: {
          type: 'bargain',
          tier: 3,
          tags: ['dark_pact'],
          terms: '+Veil, -Star',
          fulfillmentCondition: 'Complete 7 tasks',
          ticksRemaining: null,
        },
      },
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.agreements).toHaveLength(1);
    expect(result.agreements[0].name).toBe('The Seven-Task Bargain');
    expect(result.agreements[0].grantedBy).toBe('Ixaroth');
    expect(result.agreements[0].tier).toBe(3);
  });

  it('sorts by tier descending then name ascending', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'item.a', type: 'artifact', name: 'Zephyr Cloak',
      properties: { subcategory: 'vestments', tier: 1, mechanicalSummary: '+Shadow', tags: [] },
    });
    graph.addNode({
      id: 'item.b', type: 'artifact', name: 'Ashblade',
      properties: { subcategory: 'arms', tier: 3, mechanicalSummary: '+Iron', tags: [] },
    });
    graph.addNode({
      id: 'item.c', type: 'artifact', name: 'Bronze Shield',
      properties: { subcategory: 'arms', tier: 3, mechanicalSummary: '+Stone', tags: [] },
    });
    graph.addEdge({ id: 'e-p-a', source: 'agent.1', target: 'item.a', type: 'possesses', properties: {} });
    graph.addEdge({ id: 'e-p-b', source: 'agent.1', target: 'item.b', type: 'possesses', properties: {} });
    graph.addEdge({ id: 'e-p-c', source: 'agent.1', target: 'item.c', type: 'possesses', properties: {} });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.possessions[0].name).toBe('Ashblade');   // tier 3, A
    expect(result.possessions[1].name).toBe('Bronze Shield'); // tier 3, B
    expect(result.possessions[2].name).toBe('Zephyr Cloak'); // tier 1
  });

  it('excludes non-attachment traits from conditions/powers', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.innate.1', type: 'trait', name: 'Resilient',
      properties: { category: 'innate', tags: [] },
    });
    graph.addEdge({
      id: 'e-trait-innate-1',
      source: 'agent.1', target: 'trait.innate.1', type: 'has_trait',
      properties: {},
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.conditions).toHaveLength(0);
    expect(result.powers).toHaveLength(0);
  });
});
