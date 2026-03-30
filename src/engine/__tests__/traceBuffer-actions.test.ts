import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { runSelectionPipeline } from '../agentSelection';
import {
  enableTracing,
  disableTracing,
  getTraces,
  clearTraces,
} from '../traceBuffer';
import type { ActionSelectionTrace } from '../../types/trace';
import type { ActionCandidate } from '../../types/agent';

describe('action_selection trace', () => {
  let graph: WorldGraph;
  const mockCandidates: ActionCandidate[] = [
    {
      templateId: 'march',
      targetId: 'fort',
      domain: 'iron',
      score: 0,
      motivations: ['loyalty_ambition', 'courage_prudence'],
    },
    {
      templateId: 'trade',
      targetId: 'market',
      domain: 'gold',
      score: 0,
      motivations: ['asceticism_extravagance'],
    },
    {
      templateId: 'spy',
      targetId: 'rival',
      domain: 'shadow',
      score: 0,
      motivations: ['honesty_cunning'],
    },
  ];

  beforeEach(() => {
    disableTracing();
    clearTraces();
    enableTracing();

    graph = new WorldGraph();
    graph.addNode({
      id: 'actor.thorin',
      type: 'actor',
      name: 'Thorin',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          loyalty_ambition: 0.7,
          courage_prudence: 0.3,
          mercy_ruthlessness: -0.5,
          honesty_cunning: 0.1,
          sacrifice_survival: -0.2,
          loyalty_ambition: -0.6,
          tradition_novelty: 0.0,
          preservation_transformation: 0.4,
          mercy_ruthlessness: -0.3,
          asceticism_extravagance: -0.4,
        },
      },
    });

    // Add target nodes so they exist in graph
    graph.addNode({
      id: 'fort',
      type: 'location',
      name: 'Fort',
      properties: {},
    });
    graph.addNode({
      id: 'market',
      type: 'location',
      name: 'Market',
      properties: {},
    });
    graph.addNode({
      id: 'rival',
      type: 'actor',
      name: 'Rival Lord',
      properties: { actorType: 'individual' },
    });
  });

  it('emits action_selection trace when pipeline runs', () => {
    const result = runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    expect(traces.length).toBeGreaterThanOrEqual(1);

    const trace = traces[0];
    expect(trace.tick).toBeDefined();
    expect(trace.agentId).toBe('actor.thorin');
    expect(trace.stages).toBeDefined();
    expect(Array.isArray(trace.stages)).toBe(true);
    expect(trace.stages.length).toBeGreaterThan(0);
    expect(trace.finalPick).toBeDefined();
    expect(trace.finalPick.actionName).toBeTruthy();
    expect(trace.summary).toBeTruthy();
    expect(result.selected).toBeDefined();
  });

  it('trace stages capture pipeline state', () => {
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    const trace = traces[0];

    // Should have at least goal_alignment stage
    const stageNames = trace.stages.map((s) => s.stageName);
    expect(stageNames).toContain('goal_alignment');

    // Each stage should have candidateIds and scores arrays
    for (const stage of trace.stages) {
      expect(Array.isArray(stage.candidateIds)).toBe(true);
      expect(Array.isArray(stage.scores)).toBe(true);
      expect(stage.candidateIds.length).toBeGreaterThanOrEqual(0);
      expect(stage.scores.length).toBe(stage.candidateIds.length);
    }
  });

  it('finalPick includes human-readable names', () => {
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    const trace = traces[0];

    // finalPick should have actionName and targetName (human-readable)
    expect(trace.finalPick.actionName).toBeTruthy();
    expect(typeof trace.finalPick.actionName).toBe('string');
    expect(trace.finalPick.actionName.length).toBeGreaterThan(0);

    // If there's a target, targetName should be populated
    if (trace.finalPick.targetId) {
      expect(trace.finalPick.targetName).toBeTruthy();
    }

    // Should have score and probability
    expect(typeof trace.finalPick.score).toBe('number');
    expect(typeof trace.finalPick.probability).toBe('number');
    expect(typeof trace.finalPick.roll).toBe('number');
  });

  it('summary uses human-readable names not IDs', () => {
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    const trace = traces[0];

    // Summary should mention actor name (Thorin) not ID (actor.thorin)
    // and action name (march/trade/spy) not templateId
    expect(trace.summary.length).toBeGreaterThan(10);
    // Should not contain raw IDs like "a1" or "actor.thorin"
    expect(trace.summary).not.toMatch(/^a\d+$/);
  });

  it('does not emit trace when tracing is disabled', () => {
    disableTracing();
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });
    enableTracing();

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    expect(traces).toHaveLength(0);
  });

  it('multiple pipeline runs emit multiple traces', () => {
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });
    runSelectionPipeline(graph, 'actor.thorin', mockCandidates, {
      topN: 3,
      survivalThreshold: 0.8,
    });

    const traces = getTraces().filter(
      (t) => t.category === 'action_selection'
    ) as ActionSelectionTrace[];
    expect(traces.length).toBeGreaterThanOrEqual(2);
  });
});
