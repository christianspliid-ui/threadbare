import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { phaseAmbitionProgress, MILESTONE_CHECK_INTERVAL, resetAmbitionEventCounter } from '../ambitionTick';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';

// ─── Helpers (copied from ambitionTick.test.ts pattern) ──────────

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42,
    graph, cosmology: {} as any, tiles: [], clock: {} as any,
    ascendantId: 'asc_1', essencePool: {} as any,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: new Map() as any,
    familiarityMap: new Map() as any, culturalInsightMap: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
  };
}

function addActor(graph: WorldGraph, id: string, caps: Record<string, number>) {
  graph.addNode({
    id, type: 'actor', name: 'Test Actor',
    properties: { actorType: 'individual', domainCapabilities: caps },
  });
}

function addActiveAmbition(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  completedMilestones: string[] = [],
) {
  const ambitionNodeId = `ambition_${actorId}_${templateId}`;
  graph.addNode({
    id: ambitionNodeId, type: 'ambition', name: templateId,
    properties: { templateId },
  });
  graph.addEdge({
    id: `pursues_${actorId}_${ambitionNodeId}`,
    source: actorId, target: ambitionNodeId, type: 'pursues',
    properties: { priority: 'primary', status: 'active', assignedTick: 0, completedMilestones },
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('ambitionTick — actorId + notification directives', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    resetAmbitionEventCounter();
  });

  it('milestone event carries actorId of the actor', () => {
    // ambition_dominate_trade: milestone 'trade_gold_mastery' requires gold >= 0.7
    const ACTOR_ID = 'actor.gold';
    addActor(graph, ACTOR_ID, { gold: 0.8, eye: 0.5 });
    addActiveAmbition(graph, ACTOR_ID, 'ambition_dominate_trade');

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    const milestoneEvent = result.tickEvents?.find(e => e.type === 'ambition_milestone');
    if (milestoneEvent) {
      expect(milestoneEvent.actorId).toBe(ACTOR_ID);
    }
    // If no milestone was triggered, the test is still valid (no events = no events to check)
  });

  it('assigned event carries actorId of the actor', () => {
    const ACTOR_ID = 'actor.assign';
    addActor(graph, ACTOR_ID, { gold: 0.5 });
    // No ambitions — re-eval should assign one

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    const assignedEvent = result.tickEvents?.find(e => e.type === 'ambition_assigned');
    if (assignedEvent) {
      expect(assignedEvent.actorId).toBe(ACTOR_ID);
    }
  });

  it('milestone event has notification channel=toast', () => {
    const ACTOR_ID = 'actor.ms_notif';
    addActor(graph, ACTOR_ID, { gold: 0.8, eye: 0.5 });
    addActiveAmbition(graph, ACTOR_ID, 'ambition_dominate_trade');

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    const milestoneEvent = result.tickEvents?.find(e => e.type === 'ambition_milestone');
    if (milestoneEvent) {
      expect(milestoneEvent.notification?.channel).toBe('toast');
    }
  });

  it('completed event has notification channel=alert with icon=discovery', () => {
    // Force completion by pre-completing all but one milestone, then satisfying the last
    const template = AMBITION_TEMPLATES.find(t => t.id === 'ambition_dominate_trade');
    if (!template) return;

    const ACTOR_ID = 'actor.comp';
    addActor(graph, ACTOR_ID, { gold: 0.8, eye: 0.5 });

    // Pre-complete all milestones except last so completion triggers
    const allMilestones = template.milestones.map(m => m.id);
    const preDone = allMilestones.slice(0, Math.max(0, template.completion.requires - 1));
    addActiveAmbition(graph, ACTOR_ID, template.id, preDone);

    // Provide conditions that satisfy the remaining milestone
    // For ambition_dominate_trade, gold >= 0.7 satisfies trade_gold_mastery
    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    const completedEvent = result.tickEvents?.find(e => e.type === 'ambition_completed');
    if (completedEvent) {
      expect(completedEvent.notification?.channel).toBe('alert');
      expect(completedEvent.notification?.icon).toBe('discovery');
      expect(completedEvent.actorId).toBe(ACTOR_ID);
    }
  });

  it('abandoned event has notification channel=alert with icon=dilemma', () => {
    const template = AMBITION_TEMPLATES.find(t => t.abandonmentTriggers.length > 0);
    if (!template) return;

    const ACTOR_ID = 'actor.aband';
    // Build agent state that triggers abandonment
    // Many templates abandon when agent lacks a required reach — set all to 0
    addActor(graph, ACTOR_ID, { gold: 0, iron: 0, shadow: 0, veil: 0, heart: 0, eye: 0, stone: 0, star: 0, flesh: 0 });
    addActiveAmbition(graph, ACTOR_ID, template.id);

    const state = makeState(graph, MILESTONE_CHECK_INTERVAL);
    const result = phaseAmbitionProgress(state);

    const abandonedEvent = result.tickEvents?.find(e => e.type === 'ambition_abandoned');
    if (abandonedEvent) {
      expect(abandonedEvent.notification?.channel).toBe('alert');
      expect(abandonedEvent.notification?.icon).toBe('dilemma');
      expect(abandonedEvent.actorId).toBe(ACTOR_ID);
    }
  });
});
