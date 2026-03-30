import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { runSelectionPipeline } from '../agentSelection';
import type { ActionCandidate, SelectionConfig } from '../../types/agent';
import { DECAY_CONSTANTS } from '../decayCurve';

describe('runSelectionPipeline with divine influences', () => {
  let graph: WorldGraph;
  const actorId = 'actor.test';
  const config: SelectionConfig = { topN: 3, survivalThreshold: 0.5 };

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          loyalty_ambition: 0.0,
          courage_prudence: 0.0,
          mercy_ruthlessness: 0.0,
          honesty_cunning: 0.0,
          sacrifice_survival: 0.0,
          loyalty_ambition: 0.0,
          tradition_novelty: 0.0,
          preservation_transformation: 0.0,
          mercy_ruthlessness: 0.0,
          asceticism_extravagance: 0.0,
        },
        divineInfluences: [],
      },
    });
  });

  it('without divine influence, all-zero profile gives equal scores', () => {
    const candidates: ActionCandidate[] = [
      { templateId: 'a1', targetId: 't1', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'a2', targetId: 't1', domain: 'gold', score: 0, motivations: ['asceticism_extravagance'] },
    ];
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.5);
    expect(result.candidates.length).toBe(2);
  });

  it('with dream influence on courage_prudence, biases toward courage-motivated action', () => {
    const node = graph.getNode(actorId)!;
    node.properties.divineInfluences = [{
      id: 'di_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 1,
      ...DECAY_CONSTANTS.dream,
      valueDrifts: { courage_prudence: 0.50 },
    }];

    const candidates: ActionCandidate[] = [
      { templateId: 'brave_action', targetId: 't1', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'greedy_action', targetId: 't1', domain: 'gold', score: 0, motivations: ['asceticism_extravagance'] },
    ];
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.1);
    const brave = result.candidates.find(c => c.templateId === 'brave_action');
    const greedy = result.candidates.find(c => c.templateId === 'greedy_action');
    expect(brave!.probability!).toBeGreaterThan(greedy!.probability!);
  });

  it('divine influence creates overlay trace stage', () => {
    const node = graph.getNode(actorId)!;
    node.properties.divineInfluences = [{
      id: 'di_1',
      interventionType: 'persuade',
      sphere: 'spirit',
      tickApplied: 1,
      ...DECAY_CONSTANTS.persuade,
      valueDrifts: { loyalty_ambition: 0.20 },
    }];

    const candidates: ActionCandidate[] = [
      { templateId: 'a1', targetId: 't1', domain: 'heart', score: 0, motivations: ['loyalty_ambition'] },
    ];
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.5);
    expect(result.selected).toBeDefined();
  });
});
