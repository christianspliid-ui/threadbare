import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createEncounterEventNode,
  createUnifiedActionEventNode,
  getLocationEncounterHistory,
  getAgentEncounterHistory,
  EVENT_NODE_ID_PREFIX,
} from '../encounterEventNode';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { EncounterProgress } from '../../types/encounter';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Helpers ──────────────────────────────────────────────────────────

function buildTestGraph(): {
  graph: WorldGraph;
  actorId: string;
  targetId: string;
  locationId: string;
} {
  const graph = new WorldGraph();
  const actorId = 'actor.1';
  const targetId = 'actor.2';
  const locationId = 'loc.cave';

  graph.addNode({
    id: actorId,
    type: 'actor',
    name: 'Kael',
    properties: { actorType: 'individual', gender: 'male' },
  });

  graph.addNode({
    id: targetId,
    type: 'actor',
    name: 'Mira',
    properties: { actorType: 'individual', gender: 'female' },
  });

  graph.addNode({
    id: locationId,
    type: 'location',
    name: 'Deep Descent',
    properties: { hexCol: 3, hexRow: 5, locationSubtype: 'cave' },
  });

  graph.addEdge({
    id: `${actorId}_located_at_${locationId}`,
    source: actorId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });

  return { graph, actorId, targetId, locationId };
}

function buildTemplate(overrides?: Partial<UnifiedActionTemplate>): UnifiedActionTemplate {
  return {
    id: 'enc.deep_descent',
    name: 'The Deep Descent',
    intrinsicTier: 'background',
    rarityTier: 2,
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: [],
    sphereAffinity: 'force',
    locationSubtypes: ['cave'],
    steps: [
      {
        reach: 'iron',
        duration: { min: 1, max: 2 },
        difficulty: 0.4,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
      },
      {
        reach: 'shadow',
        duration: { min: 1, max: 2 },
        difficulty: 0.6,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'continue_weakened',
      },
    ],
    narrativeTemplates: {
      initiation: 'test',
      success: 'ok',
      failure: 'bad',
    },
    ...overrides,
  };
}

function buildProgress(actorId: string, overrides?: Partial<EncounterProgress>): EncounterProgress {
  return {
    encounterId: 'enc.deep_descent',
    actorId,
    currentEncounterIndex: 0,
    history: [],
    status: 'active',
    startedTick: 1,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('createEncounterEventNode', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });
  afterEach(() => disableTracing());

  it('creates an event node with correct properties', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 10,
      tierPromotionOccurred: false,
    });

    expect(eventNodeId).toBeDefined();
    expect(eventNodeId).toMatch(new RegExp(`^${EVENT_NODE_ID_PREFIX}`));

    const node = graph.getNode(eventNodeId!);
    expect(node).toBeDefined();
    expect(node!.type).toBe('event');
    expect(node!.properties.eventType).toBe('encounter_outcome');
    expect(node!.properties.templateId).toBe('enc.deep_descent');
    expect(node!.properties.encounterType).toBe('explore');
    expect(node!.properties.stepIndex).toBe(0);
    expect(node!.properties.stepName).toBe('Step 1');
    expect(node!.properties.outcome).toBe('success');
    expect(node!.properties.reachTested).toBe('iron');
    expect(node!.properties.threatRating).toBe('moderate');
    expect(node!.properties.sphereAffinity).toBe('force');
    expect(node!.properties.tick).toBe(10);
    expect(node!.properties.tierPromotionOccurred).toBe(false);
  });

  it('creates participated_in edge from actor to event', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 10,
      tierPromotionOccurred: false,
    });

    const edges = graph.getOutgoingEdges(actorId, 'participated_in');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(eventNodeId);
    expect(edges[0].properties.role).toBe('primary');
    expect(edges[0].properties.outcome).toBe('success');
    expect(edges[0].properties.tick).toBe(10);
  });

  it('creates occurred_at edge from event to location', () => {
    const { graph, actorId, locationId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'failure',
      tick: 15,
      tierPromotionOccurred: false,
    });

    const edges = graph.getOutgoingEdges(eventNodeId!, 'occurred_at');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(locationId);
    expect(edges[0].properties.tick).toBe(15);
  });

  it('creates participated_in edges for both actors in social encounters', () => {
    const { graph, actorId, targetId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId, { targetAgentId: targetId });

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 20,
      tierPromotionOccurred: false,
    });

    // Primary actor edge
    const primaryEdges = graph.getOutgoingEdges(actorId, 'participated_in');
    expect(primaryEdges).toHaveLength(1);
    expect(primaryEdges[0].properties.role).toBe('primary');

    // Target actor edge
    const targetEdges = graph.getOutgoingEdges(targetId, 'participated_in');
    expect(targetEdges).toHaveLength(1);
    expect(targetEdges[0].properties.role).toBe('target');
    expect(targetEdges[0].target).toBe(eventNodeId);
  });

  it('includes rewardGranted and tierPromotionOccurred when present', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 1,
      outcomeType: 'critical_success',
      tick: 30,
      rewardInstanceId: 'reward.blade_of_iron',
      tierPromotionOccurred: true,
    });

    const node = graph.getNode(eventNodeId!);
    expect(node!.properties.rewardGranted).toBe('reward.blade_of_iron');
    expect(node!.properties.tierPromotionOccurred).toBe(true);
    expect(node!.properties.outcome).toBe('critical_success');
  });

  it('emits a trace on event node creation', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 5,
      tierPromotionOccurred: false,
    });

    const traces = getTraces();
    const eventTrace = traces.find(
      t => t.category === 'encounter_resolution' && (t as Record<string, unknown>).event === 'event_node_created',
    );
    expect(eventTrace).toBeDefined();
  });

  it('returns undefined and does not throw on duplicate node ID', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();
    const progress = buildProgress(actorId);

    // Create first event
    const first = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 10,
      tierPromotionOccurred: false,
    });
    expect(first).toBeDefined();

    // Same params → duplicate node ID → fail-soft
    const second = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 10,
      tierPromotionOccurred: false,
    });
    expect(second).toBeUndefined();
  });

  it('handles missing location gracefully (no occurred_at edge)', () => {
    const graph = new WorldGraph();
    const actorId = 'actor.orphan';
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Orphan',
      properties: { actorType: 'individual' },
    });
    // No located_at edge

    const template = buildTemplate();
    const progress = buildProgress(actorId);

    const eventNodeId = createEncounterEventNode({
      graph,
      progress,
      template,
      stepIndex: 0,
      outcomeType: 'failure',
      tick: 5,
      tierPromotionOccurred: false,
    });

    expect(eventNodeId).toBeDefined();

    // Event node exists but no occurred_at edge
    const node = graph.getNode(eventNodeId!);
    expect(node).toBeDefined();
    const occurredEdges = graph.getOutgoingEdges(eventNodeId!, 'occurred_at');
    expect(occurredEdges).toHaveLength(0);
  });
});

// ─── createUnifiedActionEventNode (THR-143) ──────────────────────────

describe('createUnifiedActionEventNode', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => disableTracing());

  it('creates an event node with correct properties', () => {
    const { graph, actorId } = buildTestGraph();

    const eventNodeId = createUnifiedActionEventNode({
      graph,
      actorId,
      templateId: 'broker.quest.test',
      templateName: 'Broker Quest Test',
      stepIndex: 0,
      stepReach: 'shadow',
      outcome: 'success',
      tick: 12,
      tierPromotionOccurred: false,
    });

    expect(eventNodeId).toBeDefined();
    expect(eventNodeId).toMatch(new RegExp(`^${EVENT_NODE_ID_PREFIX}`));

    const node = graph.getNode(eventNodeId!);
    expect(node).toBeDefined();
    expect(node!.type).toBe('event');
    expect(node!.properties.eventType).toBe('encounter_outcome');
    expect(node!.properties.templateId).toBe('broker.quest.test');
    expect(node!.properties.templateName).toBe('Broker Quest Test');
    expect(node!.properties.stepIndex).toBe(0);
    expect(node!.properties.reachTested).toBe('shadow');
    expect(node!.properties.outcome).toBe('success');
    expect(node!.properties.tick).toBe(12);
    expect(node!.properties.tierPromotionOccurred).toBe(false);
  });

  it('creates participated_in and occurred_at edges', () => {
    const { graph, actorId, locationId } = buildTestGraph();

    const eventNodeId = createUnifiedActionEventNode({
      graph,
      actorId,
      templateId: 'test.template',
      templateName: 'Test Template',
      stepIndex: 1,
      outcome: 'failure',
      tick: 8,
    });

    const actorEdges = graph.getOutgoingEdges(actorId, 'participated_in');
    expect(actorEdges).toHaveLength(1);
    expect(actorEdges[0].target).toBe(eventNodeId);
    expect(actorEdges[0].properties.role).toBe('primary');

    const locEdges = graph.getOutgoingEdges(eventNodeId!, 'occurred_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe(locationId);
  });

  it('creates participated_in edge for target agent when different from actor', () => {
    const { graph, actorId, targetId } = buildTestGraph();

    const eventNodeId = createUnifiedActionEventNode({
      graph,
      actorId,
      targetAgentId: targetId,
      templateId: 'test.social',
      templateName: 'Social Test',
      stepIndex: 0,
      outcome: 'success',
      tick: 5,
    });

    const targetEdges = graph.getOutgoingEdges(targetId, 'participated_in');
    expect(targetEdges).toHaveLength(1);
    expect(targetEdges[0].target).toBe(eventNodeId);
    expect(targetEdges[0].properties.role).toBe('target');
  });

  it('returns undefined and does not throw on duplicate node ID', () => {
    const { graph, actorId } = buildTestGraph();
    const params = {
      graph,
      actorId,
      templateId: 'test.dup',
      templateName: 'Dup Test',
      stepIndex: 0,
      outcome: 'success',
      tick: 10,
    };

    const first = createUnifiedActionEventNode(params);
    expect(first).toBeDefined();

    const second = createUnifiedActionEventNode(params);
    expect(second).toBeUndefined();
  });
});

describe('getLocationEncounterHistory', () => {
  it('returns events sorted by tick descending', () => {
    const { graph, actorId, locationId } = buildTestGraph();
    const template = buildTemplate();

    // Create 3 events at different ticks
    for (const tick of [5, 15, 10]) {
      const progress = buildProgress(actorId);
      createEncounterEventNode({
        graph,
        progress,
        template,
        stepIndex: 0,
        outcomeType: 'success',
        tick,
        tierPromotionOccurred: false,
      });
    }

    const history = getLocationEncounterHistory(graph, locationId);
    expect(history).toHaveLength(3);
    expect(history[0].properties.tick).toBe(15);
    expect(history[1].properties.tick).toBe(10);
    expect(history[2].properties.tick).toBe(5);
  });

  it('respects maxResults limit', () => {
    const { graph, actorId, locationId } = buildTestGraph();
    const template = buildTemplate();

    for (let tick = 1; tick <= 10; tick++) {
      createEncounterEventNode({
        graph,
        progress: buildProgress(actorId),
        template,
        stepIndex: 0,
        outcomeType: 'success',
        tick,
        tierPromotionOccurred: false,
      });
    }

    const history = getLocationEncounterHistory(graph, locationId, 3);
    expect(history).toHaveLength(3);
    expect(history[0].properties.tick).toBe(10); // most recent
  });

  it('returns empty array for location with no events', () => {
    const { graph, locationId } = buildTestGraph();
    const history = getLocationEncounterHistory(graph, locationId);
    expect(history).toEqual([]);
  });
});

describe('getAgentEncounterHistory', () => {
  it('returns agent encounter events sorted by tick descending', () => {
    const { graph, actorId } = buildTestGraph();
    const template = buildTemplate();

    for (const tick of [3, 9, 6]) {
      createEncounterEventNode({
        graph,
        progress: buildProgress(actorId),
        template,
        stepIndex: 0,
        outcomeType: tick === 9 ? 'failure' : 'success',
        tick,
        tierPromotionOccurred: false,
      });
    }

    const history = getAgentEncounterHistory(graph, actorId);
    expect(history).toHaveLength(3);
    expect(history[0].properties.tick).toBe(9);
    expect(history[0].properties.outcome).toBe('failure');
    expect(history[1].properties.tick).toBe(6);
    expect(history[2].properties.tick).toBe(3);
  });

  it('returns empty array for agent with no encounters', () => {
    const { graph, actorId } = buildTestGraph();
    const history = getAgentEncounterHistory(graph, actorId);
    expect(history).toEqual([]);
  });

  it('includes events where agent was target (social encounters)', () => {
    const { graph, actorId, targetId, locationId } = buildTestGraph();
    const template = buildTemplate();

    // Also need target to be located somewhere for the occurred_at edge
    graph.addEdge({
      id: `${targetId}_located_at_${locationId}`,
      source: targetId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    createEncounterEventNode({
      graph,
      progress: buildProgress(actorId, { targetAgentId: targetId }),
      template,
      stepIndex: 0,
      outcomeType: 'success',
      tick: 7,
      tierPromotionOccurred: false,
    });

    // Target should see the event in their history
    const targetHistory = getAgentEncounterHistory(graph, targetId);
    expect(targetHistory).toHaveLength(1);
    expect(targetHistory[0].properties.templateName).toBe('The Deep Descent');
  });
});
