import { describe, it, expect, beforeEach } from 'vitest';
import { phaseNarrative, resetEventCounter } from '../orchestrator';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

let testState: GameState;

beforeEach(() => {
  resetEventCounter();
  testState = buildMinimalState();
});

function buildMinimalState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc-1',
    type: 'location',
    name: 'Test Loc',
    properties: { terrain: 'plains' },
  });
  graph.addNode({
    id: 'act-1',
    type: 'actor',
    name: 'Hero',
    properties: { actorType: 'individual', narrativeArchetype: 'tragic_hero' },
  });
  graph.addEdge({
    id: 'at-1',
    source: 'act-1',
    target: 'loc-1',
    type: 'located_at',
    properties: {},
  });
  graph.addNode({
    id: 'art-1',
    type: 'artifact',
    name: 'Sword',
    properties: {},
  });
  graph.addEdge({
    id: 'poss-1',
    source: 'act-1',
    target: 'art-1',
    type: 'possesses',
    properties: {},
  });

  return {
    graph,
    tickEvents: [],
    chronicleEntries: [],
    tick: 1,
  } as unknown as GameState;
}

describe('phaseNarrative with context builder', () => {
  it('creates chronicle entry for high-significance events', () => {
    testState.tickEvents = [
      {
        id: 'te-1',
        tick: 1,
        type: 'agent_action_resolved',
        message: 'Hero strikes with great force',
        significance: 0.85,
        sphere: 'force',
      },
    ];
    const result = phaseNarrative(testState);
    expect(result.chronicleEntries!.length).toBe(1);
  });

  it('populates promptContext mood from opposition summary', () => {
    testState.tickEvents = [
      {
        id: 'te-2',
        tick: 2,
        type: 'agent_action_resolved',
        message: 'Hero found something',
        significance: 0.9,
      },
    ];
    const result = phaseNarrative(testState);
    const entry = result.chronicleEntries![0];
    // mood should be a string (either a tension type or 'dramatic')
    expect(typeof entry.promptContext.mood).toBe('string');
  });

  it('skips context enrichment for low-significance events', () => {
    testState.tickEvents = [
      {
        id: 'te-3',
        tick: 3,
        type: 'agent_action_resolved',
        message: 'Minor thing',
        significance: 0.2,
      },
    ];
    const result = phaseNarrative(testState);
    expect(result.chronicleEntries!.length).toBe(0);
  });

  it('filters context objects to extract actor names', () => {
    testState.tickEvents = [
      {
        id: 'te-4',
        tick: 4,
        type: 'agent_action_resolved',
        message: 'Hero meets another',
        significance: 0.85,
      },
    ];
    const result = phaseNarrative(testState);
    const entry = result.chronicleEntries![0];
    expect(Array.isArray(entry.promptContext.actors)).toBe(true);
  });

  it('extracts location from context objects', () => {
    testState.tickEvents = [
      {
        id: 'te-5',
        tick: 5,
        type: 'agent_action_resolved',
        message: 'Something happens',
        significance: 0.85,
        sphere: 'shadow',
      },
    ];
    const result = phaseNarrative(testState);
    const entry = result.chronicleEntries![0];
    expect(typeof entry.promptContext.location).toBe('string');
  });

  it('maps TickEvent types correctly to NarrativeEventTypes', () => {
    const testCases = [
      { tickType: 'agent_action_resolved', expectValid: true },
      { tickType: 'doom_escalation', expectValid: true },
      { tickType: 'rival_action', expectValid: true },
      { tickType: 'mandate_progress', expectValid: true },
      { tickType: 'dilemma_resolved', expectValid: true },
    ];

    for (const testCase of testCases) {
      testState.tickEvents = [
        {
          id: `te-${testCase.tickType}`,
          tick: 6,
          type: testCase.tickType as any,
          message: 'Test event',
          significance: 0.85,
        },
      ];
      const result = phaseNarrative(testState);
      if (testCase.expectValid) {
        expect(result.chronicleEntries!.length).toBe(1);
      }
    }
  });

  it('preserves previous chronicle entries', () => {
    testState.chronicleEntries = [
      {
        id: 'old-1',
        tier: 'chronicle',
        title: 'Old Event',
        prose: 'An old event occurred',
        promptContext: {
          actors: [],
          location: '',
          sphere: 'force',
          mood: 'somber',
        },
        tick: 0,
      },
    ];

    testState.tickEvents = [
      {
        id: 'te-6',
        tick: 6,
        type: 'agent_action_resolved',
        message: 'New event',
        significance: 0.85,
      },
    ];

    const result = phaseNarrative(testState);
    expect(result.chronicleEntries!.length).toBe(2);
    expect(result.chronicleEntries![0].id).toBe('old-1');
    expect(result.chronicleEntries![1].id).toBe('te-6');
  });

  it('handles multiple high-significance events', () => {
    testState.tickEvents = [
      {
        id: 'te-7a',
        tick: 7,
        type: 'agent_action_resolved',
        message: 'First major event',
        significance: 0.85,
      },
      {
        id: 'te-7b',
        tick: 7,
        type: 'doom_escalation',
        message: 'Doom increases',
        significance: 0.9,
      },
    ];

    const result = phaseNarrative(testState);
    expect(result.chronicleEntries!.length).toBe(2);
  });

  it('includes previousEvents in promptContext', () => {
    testState.tickEvents = [
      {
        id: 'te-8',
        tick: 8,
        type: 'agent_action_resolved',
        message: 'Epic moment',
        significance: 0.85,
      },
    ];

    const result = phaseNarrative(testState);
    const entry = result.chronicleEntries![0];
    expect(Array.isArray(entry.promptContext.previousEvents)).toBe(true);
  });

  it('handles events with no sphere gracefully', () => {
    testState.tickEvents = [
      {
        id: 'te-9',
        tick: 9,
        type: 'agent_action_resolved',
        message: 'Uncolored event',
        significance: 0.85,
        // no sphere
      },
    ];

    const result = phaseNarrative(testState);
    const entry = result.chronicleEntries![0];
    expect(entry.promptContext.sphere).toBe('force'); // fallback
  });
});
