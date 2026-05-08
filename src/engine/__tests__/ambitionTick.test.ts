import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import {
  phaseAmbitionProgress,
  MILESTONE_CHECK_INTERVAL,
  AMBITION_REEVAL_INTERVAL,
  resetAmbitionEventCounter,
} from '../ambitionTick';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';

// ─── Helpers ─────────────────────────────────────────────────────

/** Build a minimal GameState with the given graph and tick */
function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    cycle: 1,
    tick,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc_1',
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any,
    familiarityMap: new Map() as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

/** Create an actor node with domain capabilities */
function addActor(graph: WorldGraph, id: string, name: string, caps: Record<string, number>) {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      domainCapabilities: caps,
    },
  });
}

/** Create an ambition node and pursues edge */
function addActiveAmbition(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  opts: { completedMilestones?: string[]; assignedTick?: number } = {},
) {
  const ambitionNodeId = `ambition_${actorId}_${templateId}`;
  graph.addNode({
    id: ambitionNodeId,
    type: 'ambition',
    name: templateId,
    properties: { templateId },
  });
  graph.addEdge({
    id: `pursues_${actorId}_${ambitionNodeId}`,
    source: actorId,
    target: ambitionNodeId,
    type: 'pursues',
    properties: {
      priority: 'primary',
      status: 'active',
      assignedTick: opts.assignedTick ?? 0,
      completedMilestones: opts.completedMilestones ?? [],
    },
  });
}

// ─── Tests ───────────────────────────────────────────────────────

describe('phaseAmbitionProgress', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    resetAmbitionEventCounter();
  });

  it('skips non-interval ticks', () => {
    addActor(graph, 'actor_1', 'Kael', { gold: 0.8, eye: 0.5 });
    addActiveAmbition(graph, 'actor_1', 'ambition_dominate_trade');

    // Tick 7 is not a multiple of MILESTONE_CHECK_INTERVAL (15)
    const state = makeState(graph, 7);
    const result = phaseAmbitionProgress(state);

    // Should return empty — no changes
    expect(result.tickEvents).toBeUndefined();
  });

  it('detects milestone completion when agent meets reach threshold', () => {
    // ambition_dominate_trade milestone 'trade_gold_mastery' requires gold >= 0.7
    addActor(graph, 'actor_1', 'Kael', { gold: 0.8, eye: 0.5 });
    addActiveAmbition(graph, 'actor_1', 'ambition_dominate_trade');

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    // Should have a milestone event
    expect(result.tickEvents).toBeDefined();
    expect(result.tickEvents!.length).toBeGreaterThan(0);

    // The pursues edge should now have the milestone recorded
    const edges = graph.getOutgoingEdges('actor_1', 'pursues');
    const pursuesEdge = edges[0];
    const milestones = pursuesEdge.properties.completedMilestones as string[];
    expect(milestones).toContain('trade_gold_mastery');
  });

  it('detects ambition completion when enough milestones are met', () => {
    // ambition_dominate_trade requires 2 of 3 milestones
    // Give the agent gold >= 0.7 (trade_gold_mastery) and pre-complete trade_bonds
    addActor(graph, 'actor_1', 'Kael', { gold: 0.8, eye: 0.5 });
    addActiveAmbition(graph, 'actor_1', 'ambition_dominate_trade', {
      completedMilestones: ['trade_bonds'], // already completed one
    });

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    // Should have completion event
    expect(result.tickEvents).toBeDefined();
    const completionEvents = result.tickEvents!.filter(
      e => e.type === ('ambition_completed' as any),
    );
    expect(completionEvents.length).toBe(1);

    // Edge should be marked completed
    const edges = graph.getOutgoingEdges('actor_1', 'pursues');
    const pursuesEdge = edges[0];
    expect(pursuesEdge.properties.status).toBe('completed');
    expect(pursuesEdge.properties.resolvedTick).toBe(MILESTONE_CHECK_INTERVAL);
  });

  it('detects ambition abandonment when trigger condition met', () => {
    // ambition_dominate_trade abandons when gold <= 0.2
    addActor(graph, 'actor_1', 'Kael', { gold: 0.1, eye: 0.5 });
    addActiveAmbition(graph, 'actor_1', 'ambition_dominate_trade');

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    // Should have abandonment event
    expect(result.tickEvents).toBeDefined();
    const abandonEvents = result.tickEvents!.filter(
      e => e.type === ('ambition_abandoned' as any),
    );
    expect(abandonEvents.length).toBe(1);

    // Edge should be marked abandoned
    const edges = graph.getOutgoingEdges('actor_1', 'pursues');
    const pursuesEdge = edges[0];
    expect(pursuesEdge.properties.status).toBe('abandoned');
    expect(pursuesEdge.properties.resolvedTick).toBe(MILESTONE_CHECK_INTERVAL);
  });

  it('re-evaluates empty ambition slots on AMBITION_REEVAL_INTERVAL ticks', () => {
    // Use a tick that is a multiple of both intervals
    const lcmTick = lcm(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL);

    // Actor with no ambitions and capabilities that match at least one template
    addActor(graph, 'actor_1', 'Kael', {
      gold: 0.6,
      eye: 0.5,
      iron: 0.5,
      shadow: 0.3,
      veil: 0.3,
      heart: 0.3,
      stone: 0.3,
      star: 0.3,
    });

    // Add a location node so the actor can be located somewhere
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addEdge({
      id: 'loc_actor_1',
      source: 'actor_1',
      target: 'loc_1',
      type: 'located_at',
      properties: {},
    });

    const state = makeState(graph, lcmTick);
    const result = phaseAmbitionProgress(state);

    // Should have assigned new ambitions
    const pursuesEdges = graph.getOutgoingEdges('actor_1', 'pursues');
    expect(pursuesEdges.length).toBeGreaterThan(0);
    expect(pursuesEdges[0].properties.status).toBe('active');

    // Should have assignment events
    expect(result.tickEvents).toBeDefined();
    const assignEvents = result.tickEvents!.filter(
      e => e.type === ('ambition_assigned' as any),
    );
    expect(assignEvents.length).toBeGreaterThan(0);
  });

  it('does not re-evaluate when actor already has 2 active ambitions', () => {
    const lcmTick = lcm(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL);

    // Actor with high capabilities so milestones don't auto-complete
    addActor(graph, 'actor_1', 'Kael', { gold: 0.5, eye: 0.4 });

    // Give them 2 active ambitions
    addActiveAmbition(graph, 'actor_1', 'ambition_dominate_trade');
    addActiveAmbition(graph, 'actor_1', 'ambition_uncover_secrets');

    // Fix duplicate edge ID by using unique names
    // Actually the helper already uses templateId to make unique IDs

    const state = makeState(graph, lcmTick);
    phaseAmbitionProgress(state);

    // Should still have exactly 2 pursues edges (no new ones added)
    const pursuesEdges = graph.getOutgoingEdges('actor_1', 'pursues');
    // Could be 2 or fewer depending on whether any completed/abandoned,
    // but no new assignment edges should have been created
    const activeEdges = pursuesEdges.filter(e => e.properties.status === 'active');
    expect(activeEdges.length).toBeLessThanOrEqual(2);
  });
});

// ─── Utility ─────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}
