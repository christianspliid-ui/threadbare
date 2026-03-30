import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { validateAgentIntegrity, validateAllAgents, CANONICAL_VALUE_PAIRS, CANONICAL_REACHES } from '../agentValidation';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';

// ─── Helpers ──────────────────────────────────────────────────────

function makeProfile(overrides: Partial<Record<ValuePair, number>> = {}): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  for (const pair of CANONICAL_VALUE_PAIRS) {
    profile[pair] = overrides[pair] ?? 0.1;
  }
  return profile;
}

function makeDomainCaps(overrides: Partial<Record<ReachDomain, number>> = {}): Record<ReachDomain, number> {
  const caps = {} as Record<ReachDomain, number>;
  for (const reach of CANONICAL_REACHES) {
    caps[reach] = overrides[reach] ?? 25;
  }
  return caps;
}

function buildValidIndividual(graph: WorldGraph, id = 'agent.1', locId = 'loc.1') {
  graph.addNode({
    id,
    type: 'actor',
    name: 'Kael',
    properties: {
      actorType: 'individual',
      axiologicalProfile: makeProfile(),
      domainCapabilities: makeDomainCaps(),
      locationId: locId,
      narrativeArchetype: 'tragic_hero',
      cooperationStrategy: 'tit-for-tat',
      reputationScore: 0.5,
    },
  });
  if (!graph.getNode(locId)) {
    graph.addNode({ id: locId, type: 'location', name: 'Settlement', properties: {} });
  }
  graph.addEdge({
    id: `${id}_located_at_${locId}`,
    source: id,
    target: locId,
    type: 'located_at',
    properties: {},
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('validateAgentIntegrity', () => {
  it('passes for a fully valid individual', () => {
    const graph = new WorldGraph();
    buildValidIndividual(graph);

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.checks.nodeIntegrity).toBe(true);
    expect(result.checks.axiologicalProfile).toBe(true);
    expect(result.checks.domainCapabilities).toBe(true);
    expect(result.checks.locationBinding).toBe(true);
    expect(result.checks.locationConsistency).toBe(true);
  });

  it('fails for non-existent node', () => {
    const graph = new WorldGraph();
    const result = validateAgentIntegrity(graph, 'ghost');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Node ghost does not exist in graph');
  });

  it('fails for node with wrong type', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place', properties: {} });
    const result = validateAgentIntegrity(graph, 'loc.1');
    expect(result.valid).toBe(false);
    expect(result.checks.nodeIntegrity).toBe(false);
  });

  it('fails for empty axiological profile', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Empty',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {},
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
        narrativeArchetype: 'trickster',
        cooperationStrategy: 'grudger',
        reputationScore: 0.5,
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place', properties: {} });
    graph.addEdge({ id: 'loc_e', source: 'agent.1', target: 'loc.1', type: 'located_at', properties: {} });

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.valid).toBe(false);
    expect(result.checks.axiologicalProfile).toBe(false);
    expect(result.errors.some(e => e.includes('missing or empty'))).toBe(true);
  });

  it('fails for missing domain capabilities', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'NoCaps',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: {},
        locationId: 'loc.1',
        narrativeArchetype: 'wanderer',
        cooperationStrategy: 'pavlov',
        reputationScore: 0.5,
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place', properties: {} });
    graph.addEdge({ id: 'loc_e', source: 'agent.1', target: 'loc.1', type: 'located_at', properties: {} });

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.valid).toBe(false);
    expect(result.checks.domainCapabilities).toBe(false);
  });

  it('fails for individual with no located_at edge', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Lost',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        narrativeArchetype: 'wanderer',
        cooperationStrategy: 'pavlov',
        reputationScore: 0.5,
      },
    });

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.valid).toBe(false);
    expect(result.checks.locationBinding).toBe(false);
    expect(result.errors.some(e => e.includes('no located_at edge'))).toBe(true);
  });

  it('warns when properties.locationId disagrees with located_at edge', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Place A', properties: {} });
    graph.addNode({ id: 'loc.2', type: 'location', name: 'Place B', properties: {} });
    graph.addNode({
      id: 'agent.1',
      type: 'actor',
      name: 'Confused',
      properties: {
        actorType: 'individual',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.2',  // disagrees with edge
        narrativeArchetype: 'wanderer',
        cooperationStrategy: 'pavlov',
        reputationScore: 0.5,
      },
    });
    graph.addEdge({ id: 'loc_e', source: 'agent.1', target: 'loc.1', type: 'located_at', properties: {} });

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.checks.locationConsistency).toBe(false);
    expect(result.warnings.some(w => w.includes('disagrees'))).toBe(true);
  });

  it('validates a faction (no location binding required)', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'fac.1',
      type: 'actor',
      name: 'Iron Covenant',
      properties: {
        actorType: 'faction',
        axiologicalProfile: makeProfile(),
        domainCapabilities: makeDomainCaps(),
      },
    });

    const result = validateAgentIntegrity(graph, 'fac.1');
    expect(result.valid).toBe(true);
    expect(result.checks.locationBinding).toBe(true); // not checked for factions
  });

  it('checks edge relationship targets have correct type', () => {
    const graph = new WorldGraph();
    buildValidIndividual(graph);
    // Add a member_of edge pointing to a location (wrong type — should be actor)
    graph.addEdge({ id: 'bad_member', source: 'agent.1', target: 'loc.1', type: 'member_of', properties: {} });

    const result = validateAgentIntegrity(graph, 'agent.1');
    expect(result.checks.edgeRelationships).toBe(false);
    expect(result.warnings.some(w => w.includes('member_of') && w.includes('location'))).toBe(true);
  });

  it('born agent with all 9 axiological pairs passes profile check', () => {
    const graph = new WorldGraph();
    const profile = makeProfile();
    // Verify all 9 pairs are present (Flesh reach removed in TB-075)
    expect(Object.keys(profile)).toHaveLength(9);

    graph.addNode({
      id: 'born.1',
      type: 'actor',
      name: 'Newborn',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
        domainCapabilities: makeDomainCaps(),
        locationId: 'loc.1',
        narrativeArchetype: 'coming_of_age',
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.5,
        bornTick: 5,
      },
    });
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Village', properties: {} });
    graph.addEdge({ id: 'loc_e', source: 'born.1', target: 'loc.1', type: 'located_at', properties: {} });

    const result = validateAgentIntegrity(graph, 'born.1');
    expect(result.valid).toBe(true);
    expect(result.checks.axiologicalProfile).toBe(true);
  });
});

describe('validateAllAgents', () => {
  it('returns results for all actors in graph', () => {
    const graph = new WorldGraph();
    buildValidIndividual(graph, 'agent.1', 'loc.1');
    buildValidIndividual(graph, 'agent.2', 'loc.1');

    const results = validateAllAgents(graph);
    expect(results).toHaveLength(2);
    expect(results.every(r => r.valid)).toBe(true);
  });
});
