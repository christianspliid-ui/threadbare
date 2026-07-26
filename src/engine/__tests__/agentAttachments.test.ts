import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentAttachments } from '../agentAttachments';
import { decayConditions } from '../conditionDecay';
import { PLANT_DREAM_TRAIT_DURATION_TICKS } from '../hexActionBridge';

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
      properties: { modifiers: { iron: 2 }, tags: [] },
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
        subcategory: 'condition',
        tier: 1,
        mechanicalSummary: '-Iron (minor)',
        tags: ['wound'],
      },
    });
    graph.addEdge({
      id: 'e-trait-wound-1',
      source: 'agent.1', target: 'trait.wound.1', type: 'has_trait',
      // THR-784: duration is EDGE state. These assertions used to read the same
      // pair off the node, which is the shared catalog template — repointed to
      // the side decayConditions actually writes (dead-side test rule).
      properties: { ticksRemaining: 8, durationTicks: 20 },
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].name).toBe('Bruised Ribs');
    expect(result.conditions[0].ticksRemaining).toBe(8);
    expect(result.conditions[0].totalTicks).toBe(20);
  });

  it('ignores node-level duration fields — only the edge is live state (THR-784)', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.wound.stale', type: 'trait', name: 'Stale Template',
      properties: {
        subcategory: 'condition',
        tier: 1,
        mechanicalSummary: '-Iron (minor)',
        tags: ['wound'],
        // The pre-THR-784 shape: template-level values that never move.
        ticksRemaining: 99,
        totalTicks: 99,
      },
    });
    graph.addEdge({
      id: 'e-trait-wound-stale',
      source: 'agent.1', target: 'trait.wound.stale', type: 'has_trait',
      properties: { ticksRemaining: 3, durationTicks: 12 },
    });

    const result = getAgentAttachments(graph, 'agent.1');
    expect(result.conditions[0].ticksRemaining).toBe(3);
    expect(result.conditions[0].totalTicks).toBe(12);
  });

  it('gathers blessings and curses as conditions', () => {
    const graph = setupBaseGraph();
    graph.addNode({
      id: 'trait.bless.1', type: 'trait', name: 'Sun-Touched',
      properties: {
        subcategory: 'condition',
        tier: 1,
        mechanicalSummary: '+Star (minor)',
        tags: ['#blessing'],
      },
    });
    graph.addEdge({
      id: 'e-trait-bless-1',
      source: 'agent.1', target: 'trait.bless.1', type: 'has_trait',
      properties: { ticksRemaining: 6, durationTicks: 10 },
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
        subcategory: 'bestowed',
        tier: 2,
        mechanicalSummary: '+Star, sense undead',
        tags: ['#divine', '#spirit'],
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

/**
 * THR-784 — the displayed countdown must track the live edge counter.
 *
 * These drive the real `decayConditions` rather than hand-editing the edge, so
 * they bind the display to the same authority the tick loop uses. Against the
 * pre-THR-784 build every assertion here is red: the reads hit the shared trait
 * node, so the number was frozen and identical for every carrier.
 */
describe('condition duration is per-carrier live state (THR-784)', () => {
  /** Two agents, one shared condition template — the shape the node read collapsed. */
  function setupTwoCarriers(): WorldGraph {
    const graph = new WorldGraph();
    for (const id of ['agent.1', 'agent.2']) {
      graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
    }
    graph.addNode({
      id: 'trait.fever', type: 'trait', name: 'Marsh Fever',
      properties: { subcategory: 'condition', tier: 1, mechanicalSummary: '-Iron', tags: ['#disease'] },
    });
    return graph;
  }

  const conditionOf = (graph: WorldGraph, agentId: string) =>
    getAgentAttachments(graph, agentId).conditions[0];

  it('counts the displayed remaining time down as ticks pass', () => {
    const graph = setupTwoCarriers();
    graph.addEdge({
      id: 'e.fever.1', source: 'agent.1', target: 'trait.fever', type: 'has_trait',
      properties: { ticksRemaining: 10, durationTicks: 10 },
    });

    expect(conditionOf(graph, 'agent.1').ticksRemaining).toBe(10);

    decayConditions(graph, 1);
    expect(conditionOf(graph, 'agent.1').ticksRemaining).toBe(9);

    for (let tick = 2; tick <= 5; tick++) decayConditions(graph, tick);
    expect(conditionOf(graph, 'agent.1').ticksRemaining).toBe(5);

    // The denominator is authored provenance and must NOT move with the counter.
    expect(conditionOf(graph, 'agent.1').totalTicks).toBe(10);
  });

  it('shows different remaining times for two agents who caught it at different ticks', () => {
    const graph = setupTwoCarriers();
    // agent.1 caught it 6 ticks ago; agent.2 caught it this tick.
    graph.addEdge({
      id: 'e.fever.1', source: 'agent.1', target: 'trait.fever', type: 'has_trait',
      properties: { ticksRemaining: 4, durationTicks: 10 },
    });
    graph.addEdge({
      id: 'e.fever.2', source: 'agent.2', target: 'trait.fever', type: 'has_trait',
      properties: { ticksRemaining: 10, durationTicks: 10 },
    });

    expect(conditionOf(graph, 'agent.1').ticksRemaining).toBe(4);
    expect(conditionOf(graph, 'agent.2').ticksRemaining).toBe(10);

    decayConditions(graph, 1);
    expect(conditionOf(graph, 'agent.1').ticksRemaining).toBe(3);
    expect(conditionOf(graph, 'agent.2').ticksRemaining).toBe(9);
    // Same template, same denominator, different live numerators.
    expect(conditionOf(graph, 'agent.1').name).toBe(conditionOf(graph, 'agent.2').name);
  });

  it("labels 'until dispelled' only when the edge carries no countdown", () => {
    const graph = setupTwoCarriers();
    graph.addEdge({
      id: 'e.fever.1', source: 'agent.1', target: 'trait.fever', type: 'has_trait',
      properties: { ticksRemaining: 3, durationTicks: 3 },
    });
    graph.addEdge({
      // Indefinite: the `0 = indefinite` contract omits both fields (THR-761).
      id: 'e.fever.2', source: 'agent.2', target: 'trait.fever', type: 'has_trait',
      properties: {},
    });

    expect(conditionOf(graph, 'agent.1').durationLabel).toBeUndefined();
    expect(conditionOf(graph, 'agent.2').durationLabel).toBe('until dispelled');

    // Run past the expiry: the ticking one is gone, the indefinite one survives.
    for (let tick = 1; tick <= 4; tick++) decayConditions(graph, tick);
    expect(getAgentAttachments(graph, 'agent.1').conditions).toHaveLength(0);
    expect(conditionOf(graph, 'agent.2').durationLabel).toBe('until dispelled');
  });

  it('surfaces the countdown on a temporary bestowed power too', () => {
    const graph = setupTwoCarriers();
    graph.addNode({
      id: 'trait.dream', type: 'trait', name: 'Dream of Buried Places',
      properties: { subcategory: 'bestowed', tier: 1, mechanicalSummary: '+Eye', tags: [] },
    });
    graph.addNode({
      id: 'trait.permanent', type: 'trait', name: 'Turn Undead',
      properties: { subcategory: 'bestowed', tier: 2, mechanicalSummary: '+Star', tags: [] },
    });
    graph.addEdge({
      id: 'e.dream', source: 'agent.1', target: 'trait.dream', type: 'has_trait',
      properties: { ticksRemaining: PLANT_DREAM_TRAIT_DURATION_TICKS, durationTicks: PLANT_DREAM_TRAIT_DURATION_TICKS },
    });
    graph.addEdge({
      id: 'e.perm', source: 'agent.1', target: 'trait.permanent', type: 'has_trait',
      properties: {},
    });

    decayConditions(graph, 1);
    const powers = getAgentAttachments(graph, 'agent.1').powers;
    const dream = powers.find(p => p.name === 'Dream of Buried Places')!;
    const permanent = powers.find(p => p.name === 'Turn Undead')!;

    expect(dream.ticksRemaining).toBe(PLANT_DREAM_TRAIT_DURATION_TICKS - 1);
    expect(dream.totalTicks).toBe(PLANT_DREAM_TRAIT_DURATION_TICKS);
    // Permanent grants are untouched by the new read.
    expect(permanent.ticksRemaining).toBeNull();
    expect(permanent.totalTicks).toBeUndefined();
  });
});
