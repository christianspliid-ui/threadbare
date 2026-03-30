import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  scoreByGoalAlignment,
  selectTopN,
  probabilisticSelect,
  runSelectionPipeline,
} from '../agentSelection';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';

describe('Agent Action Selection', () => {
  let graph: WorldGraph;

  const defaultProfile: AxiologicalProfile = {
    mercy_ruthlessness: -0.5,
    asceticism_extravagance: -0.4,
    honesty_cunning: 0.1,
    tradition_novelty: 0.0,
    loyalty_ambition: 0.7,
    revelation_discretion: 0,
    preservation_transformation: 0.4,
    sacrifice_survival: -0.2,
    sacrifice_survival: 0,
    courage_prudence: 0.3,
  };

  const mockCandidates: ActionCandidate[] = [
    { templateId: 'march', targetId: 'fort', domain: 'iron', score: 0, motivations: ['loyalty_ambition', 'courage_prudence'] },
    { templateId: 'trade', targetId: 'market', domain: 'gold', score: 0, motivations: ['asceticism_extravagance'] },
    { templateId: 'spy', targetId: 'rival', domain: 'shadow', score: 0, motivations: ['honesty_cunning'] },
    { templateId: 'pray', targetId: 'shrine', domain: 'star', score: 0, motivations: ['sacrifice_survival'] },
    { templateId: 'build', targetId: 'wall', domain: 'stone', score: 0, motivations: ['tradition_novelty'] },
  ];

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: 'actor.thorin', type: 'actor', name: 'Thorin',
      properties: {
        actorType: 'individual',
        axiologicalProfile: defaultProfile,
      },
    });
  });

  describe('scoreByGoalAlignment', () => {
    it('scores candidates based on axiological alignment', () => {
      const scored = scoreByGoalAlignment(mockCandidates, defaultProfile);
      // March uses ambition (0.7) + courage (0.3) → high alignment
      const march = scored.find(c => c.templateId === 'march')!;
      expect(march.score).toBeGreaterThan(0);
    });

    it('gives higher scores to actions matching dominant values', () => {
      const scored = scoreByGoalAlignment(mockCandidates, defaultProfile);
      const march = scored.find(c => c.templateId === 'march')!;
      const pray = scored.find(c => c.templateId === 'pray')!;
      // Ambition 0.7 > devotion -0.2 (independence), so march should score higher
      expect(march.score).toBeGreaterThan(pray.score);
    });
  });

  describe('selectTopN', () => {
    it('keeps only top N candidates by score', () => {
      const scored = mockCandidates.map((c, i) => ({ ...c, score: 5 - i }));
      const top = selectTopN(scored, 3);
      expect(top).toHaveLength(3);
      expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
    });
  });

  describe('probabilisticSelect', () => {
    it('selects from candidates with assigned probabilities', () => {
      const candidates: ActionCandidate[] = [
        { ...mockCandidates[0], score: 10, probability: 0.6 },
        { ...mockCandidates[1], score: 5, probability: 0.3 },
        { ...mockCandidates[2], score: 2, probability: 0.1 },
      ];
      const selected = probabilisticSelect(candidates, 0.5); // deterministic: 0.5 → first (0-0.6)
      expect(selected.templateId).toBe('march');
    });

    it('deterministic roll 0.9 selects the third candidate', () => {
      const candidates: ActionCandidate[] = [
        { ...mockCandidates[0], score: 10, probability: 0.5 },
        { ...mockCandidates[1], score: 5, probability: 0.3 },
        { ...mockCandidates[2], score: 2, probability: 0.2 },
      ];
      const selected = probabilisticSelect(candidates, 0.9); // 0.9 → third (0.8-1.0)
      expect(selected.templateId).toBe('spy');
    });
  });

  describe('runSelectionPipeline', () => {
    it('returns a selected action and candidate list', () => {
      const result = runSelectionPipeline(graph, 'actor.thorin', mockCandidates, { topN: 3, survivalThreshold: 0.8 });
      expect(result.selected).toBeDefined();
      expect(result.candidates.length).toBeLessThanOrEqual(3);
      expect(result.wasSurvivalOverride).toBe(false);
    });
  });
});
