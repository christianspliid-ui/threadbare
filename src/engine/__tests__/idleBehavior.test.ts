import { describe, it, expect } from 'vitest';
import {
  resolveIdleBehavior,
  deriveAmbitionTarget,
  AMBITION_DRIFT_THRESHOLD,
  IDLE_TRIVIAL_PREFERENCE,
} from '../idleBehavior';
import { WorldGraph } from '../graph';
import { buildDistanceMatrix } from '../distanceMatrix';
import type { EncounterCacheEntry } from '../encounterCache';

// ─── Helpers ────────────────────────────────────────────────────

/** Simple deterministic PRNG mock cycling through given values. */
function mockRng(values: number[]): () => number {
  let callCount = 0;
  return () => values[callCount++ % values.length];
}

/** Build a minimal axiological profile with a specific loyalty_ambition. */
function makeProfile(loyaltyAmbition: number): Record<string, number> {
  return {
    mercy_ruthlessness: 0,
    asceticism_extravagance: 0,
    honesty_cunning: 0,
    tradition_novelty: 0,
    loyalty_ambition: loyaltyAmbition,
    frankness_propriety: 0,
    humility_pride: 0,
    sacrifice_survival: 0,
    stoicism_passion: 0,
    courage_prudence: 0,
  };
}

/** Build a trivial-threat encounter cache entry stub. */
function makeTrivialEntry(
  templateId: string,
  locationId: string,
): EncounterCacheEntry {
  return {
    templateId,
    locationId,
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    threatRating: 'trivial',
    encounterType: 'social',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1,
    totalTickCost: 1,
    successRewardEstimate: 0.5,
    stepCount: 1,
    stepDifficulties: [1],
    stepReaches: ['heart'],
  } as EncounterCacheEntry;
}

/**
 * Build a test graph with:
 * - One agent at locA
 * - Three locations (locA ↔ locB ↔ locC) in a chain
 * - Optional ambition node connected via pursues edge
 */
function buildTestGraph(opts: {
  loyaltyAmbition?: number;
  hasProfile?: boolean;
  hasAmbition?: boolean;
  hasAdjacentLocations?: boolean;
}) {
  const graph = new WorldGraph();

  const agentProps: Record<string, unknown> = { actorType: 'individual' };
  if (opts.hasProfile !== false && opts.loyaltyAmbition !== undefined) {
    agentProps.axiologicalProfile = makeProfile(opts.loyaltyAmbition);
  }

  graph.addNode({
    id: 'agent.1',
    type: 'actor',
    name: 'Test Agent',
    properties: agentProps,
  });

  graph.addNode({
    id: 'locA',
    type: 'location',
    name: 'Location A',
    properties: { locationType: 'settlement' },
  });

  if (opts.hasAdjacentLocations !== false) {
    graph.addNode({
      id: 'locB',
      type: 'location',
      name: 'Location B',
      properties: { locationType: 'settlement' },
    });

    graph.addNode({
      id: 'locC',
      type: 'location',
      name: 'Location C',
      properties: { locationType: 'wilderness' },
    });

    graph.addEdge({
      id: 'e.adj.ab',
      source: 'locA',
      target: 'locB',
      type: 'adjacent',
      properties: {},
    });

    graph.addEdge({
      id: 'e.adj.bc',
      source: 'locB',
      target: 'locC',
      type: 'adjacent',
      properties: {},
    });
  }

  graph.addEdge({
    id: 'e.located',
    source: 'agent.1',
    target: 'locA',
    type: 'located_at',
    properties: {},
  });

  if (opts.hasAmbition) {
    graph.addNode({
      id: 'amb.1',
      type: 'ambition',
      name: 'Test Ambition',
      properties: {},
    });

    graph.addEdge({
      id: 'e.pursues',
      source: 'agent.1',
      target: 'amb.1',
      type: 'pursues',
      properties: { status: 'active' },
    });
  }

  return graph;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('resolveIdleBehavior', () => {
  it('ambitious agent drifts toward ambition target', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAmbition: true,
    });
    const dm = buildDistanceMatrix(graph);
    const rng = mockRng([0.5]);

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('drift');
    // Should pick locB as nearest non-current location
    expect(decision.targetLocationId).toBe('locB');
  });

  it('content agent with local trivial encounters does trivial_local when rng < threshold', () => {
    const graph = buildTestGraph({ loyaltyAmbition: 0.5 });
    const dm = buildDistanceMatrix(graph);
    // rng returns 0.1, which is < IDLE_TRIVIAL_PREFERENCE (0.8)
    const rng = mockRng([0.1]);

    const entries = [
      makeTrivialEntry('tmpl.tavern', 'locA'),
    ];

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      entries,
      rng,
    );

    expect(decision.action).toBe('trivial_local');
    expect(decision.templateId).toBe('tmpl.tavern');
  });

  it('content agent stays when rng exceeds trivial preference', () => {
    const graph = buildTestGraph({ loyaltyAmbition: 0.5 });
    const dm = buildDistanceMatrix(graph);
    // rng returns 0.9, which is > IDLE_TRIVIAL_PREFERENCE (0.8)
    const rng = mockRng([0.9]);

    const entries = [
      makeTrivialEntry('tmpl.tavern', 'locA'),
    ];

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      entries,
      rng,
    );

    expect(decision.action).toBe('stay');
    expect(decision.templateId).toBeUndefined();
  });

  it('neutral agent (loyalty_ambition = 0.0) stays when no trivial entries', () => {
    const graph = buildTestGraph({ loyaltyAmbition: 0.0 });
    const dm = buildDistanceMatrix(graph);
    const rng = mockRng([0.1]);

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('stay');
  });

  it('ambitious agent with no adjacent locations stays', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAdjacentLocations: false,
      hasAmbition: false,
    });
    const dm = buildDistanceMatrix(graph);
    const rng = mockRng([0.5]);

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('stay');
  });

  it('ambitious agent with no ambitions drifts to random adjacent', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAmbition: false,
    });
    const dm = buildDistanceMatrix(graph);
    // rng = 0.0 → picks first adjacent (locB)
    const rng = mockRng([0.0]);

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('drift');
    expect(decision.targetLocationId).toBe('locB');
  });

  it('missing axiological profile → stays', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.8,
      hasProfile: false,
    });
    // Manually remove the profile to simulate missing data
    const agentNode = graph.getNode('agent.1')!;
    delete (agentNode.properties as Record<string, unknown>).axiologicalProfile;

    const dm = buildDistanceMatrix(graph);
    const rng = mockRng([0.5]);

    const decision = resolveIdleBehavior(
      'agent.1',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('stay');
  });

  it('missing agent node → stays', () => {
    const graph = buildTestGraph({ loyaltyAmbition: 0.0 });
    const dm = buildDistanceMatrix(graph);
    const rng = mockRng([0.5]);

    const decision = resolveIdleBehavior(
      'nonexistent.agent',
      'locA',
      graph,
      dm,
      [],
      rng,
    );

    expect(decision.action).toBe('stay');
  });
});

describe('deriveAmbitionTarget', () => {
  it('returns nearest non-current location when agent has ambitions', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAmbition: true,
    });
    const dm = buildDistanceMatrix(graph);

    const target = deriveAmbitionTarget('agent.1', 'locA', graph, dm);

    // locB is 1 hop away, locC is 2 hops away — should pick locB
    expect(target).toBe('locB');
  });

  it('returns null when agent has no ambitions', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAmbition: false,
    });
    const dm = buildDistanceMatrix(graph);

    const target = deriveAmbitionTarget('agent.1', 'locA', graph, dm);

    expect(target).toBeNull();
  });

  it('returns null when distance matrix has no row for agent location', () => {
    const graph = buildTestGraph({
      loyaltyAmbition: -0.5,
      hasAmbition: true,
    });
    // Build an empty distance matrix
    const dm = { distances: new Map(), builtAtTick: 0, locationCount: 0 };

    const target = deriveAmbitionTarget('agent.1', 'locA', graph, dm);

    expect(target).toBeNull();
  });
});
