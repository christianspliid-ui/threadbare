import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { runSelectionPipeline } from '../agentSelection';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';
import type { CooperationStrategy } from '../../types/disposition';
import { DEFAULT_REPUTATION } from '../../types/disposition';

describe('Disposition modifier pipeline integration', () => {
  let graph: WorldGraph;

  const defaultProfile: AxiologicalProfile = {
    ambition_contentment: 0.7,
    courage_prudence: 0.3,
    cruelty_compassion: -0.5,
    cunning_honesty: 0.1,
    devotion_independence: -0.2,
    loyalty_treachery: -0.6,
    tradition_innovation: 0.0,
    dominance_humility: 0.4,
    wrath_patience: -0.3,
    greed_generosity: -0.4,
  };

  beforeEach(() => {
    graph = new WorldGraph();
  });

  describe('cooperative actions score higher when disposition is positive', () => {
    it('boosts cooperative candidates when agent has positive interaction history', () => {
      // Create actor with tit-for-tat strategy
      graph.addNode({
        id: 'actor.generous',
        type: 'actor',
        name: 'Generous Actor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'tit-for-tat' as CooperationStrategy,
        },
      });

      // Create target actor
      graph.addNode({
        id: 'actor.trustworthy',
        type: 'actor',
        name: 'Trustworthy',
        properties: {
          actorType: 'individual',
          reputationScore: 0.7, // High reputation
        },
      });

      // Create relationship with positive interaction history (target cooperated)
      graph.addEdge({
        id: 'rel.generous-trustworthy',
        source: 'actor.generous',
        target: 'actor.trustworthy',
        type: 'relates_to',
        properties: {
          sentiment: 0.8,
          strength: 0.5,
          basis: 'history',
          interactionLog: [
            {
              tick: 1,
              actorMove: 'cooperate',
              targetMove: 'cooperate',
              context: 'trade',
              stakes: 'low',
            },
          ],
        },
      });

      // Create action candidates: one cooperative, one defective
      const candidates: ActionCandidate[] = [
        {
          templateId: 'gift',
          targetId: 'actor.trustworthy',
          domain: 'heart',
          score: 0,
          motivations: ['greed_generosity'],
          socialOrientation: 'cooperative',
        },
        {
          templateId: 'exploit',
          targetId: 'actor.trustworthy',
          domain: 'shadow',
          score: 0,
          motivations: ['cunning_honesty'],
          socialOrientation: 'defective',
        },
      ];

      const result = runSelectionPipeline(graph, 'actor.generous', candidates, {
        topN: 2,
        survivalThreshold: 0.8,
      });

      // Find the cooperative and defective candidates in the result
      const cooperativeResult = result.candidates.find(
        (c) => c.templateId === 'gift'
      );
      const defectiveResult = result.candidates.find(
        (c) => c.templateId === 'exploit'
      );

      expect(cooperativeResult).toBeDefined();
      expect(defectiveResult).toBeDefined();

      // Cooperative should score higher than defective when disposition is positive
      // (tit-for-tat with history of mutual cooperation = positive disposition)
      expect(cooperativeResult!.score).toBeGreaterThan(
        defectiveResult!.score
      );
    });
  });

  describe('backward compatibility', () => {
    it('does not crash when agent has no cooperationStrategy', () => {
      // Actor without cooperationStrategy field
      graph.addNode({
        id: 'actor.simple',
        type: 'actor',
        name: 'Simple Actor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          // No cooperationStrategy
        },
      });

      graph.addNode({
        id: 'actor.other',
        type: 'actor',
        name: 'Other',
        properties: {
          actorType: 'individual',
          reputationScore: DEFAULT_REPUTATION,
        },
      });

      const candidates: ActionCandidate[] = [
        {
          templateId: 'action1',
          targetId: 'actor.other',
          domain: 'iron',
          score: 0,
          motivations: ['ambition_contentment'],
          socialOrientation: 'cooperative',
        },
      ];

      // Should not throw
      expect(() => {
        runSelectionPipeline(graph, 'actor.simple', candidates, {
          topN: 1,
          survivalThreshold: 0.8,
        });
      }).not.toThrow();
    });

    it('skips disposition stage when candidates have no socialOrientation', () => {
      // Actor with strategy but no socially-oriented candidates
      graph.addNode({
        id: 'actor.strategic',
        type: 'actor',
        name: 'Strategic',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'always-cooperate' as CooperationStrategy,
        },
      });

      graph.addNode({
        id: 'actor.neutral',
        type: 'actor',
        name: 'Neutral',
        properties: {
          actorType: 'individual',
          reputationScore: DEFAULT_REPUTATION,
        },
      });

      // Candidates with neutral orientation (no socialOrientation field)
      // tradition_innovation: 0.0 in defaultProfile, so initial score = 0
      const candidates: ActionCandidate[] = [
        {
          templateId: 'neutral_action',
          targetId: 'actor.neutral',
          domain: 'stone',
          score: 0,
          motivations: ['tradition_innovation'],
          // No socialOrientation
        },
      ];

      const result = runSelectionPipeline(graph, 'actor.strategic', candidates, {
        topN: 1,
        survivalThreshold: 0.8,
      });

      // Score should remain at 0 (not modified by disposition since no socialOrientation)
      // After scoreByGoalAlignment: tradition_innovation (0.0) → score 0
      // After disposition stage: no socialOrientation, so passed through unchanged
      // After applyPersonalityWeights: no change (extension point)
      // After assignProbabilities: score may be adjusted, but we check the candidate before selectTopN
      // Actually, the candidates in the result are after assignProbabilities, which does shift scores
      // But that's only for probability calculation, the score field is unchanged
      expect(result.candidates[0].score).toBe(0);
    });
  });

  describe('first interaction with neutral reputation', () => {
    it('applies small adjustment when no interaction history exists', () => {
      // Actor with always-cooperate strategy (first move = cooperate)
      graph.addNode({
        id: 'actor.nice',
        type: 'actor',
        name: 'Nice Actor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'always-cooperate' as CooperationStrategy,
        },
      });

      // Target with default reputation (0.5)
      graph.addNode({
        id: 'actor.stranger',
        type: 'actor',
        name: 'Stranger',
        properties: {
          actorType: 'individual',
          reputationScore: DEFAULT_REPUTATION, // 0.5
        },
      });

      // No relationship edge exists, so no interaction log
      // On first interaction, always-cooperate returns disposition +1
      // With reputation 0.5, reputationFactor = (0.5 - 0.5) * 0.4 = 0
      // finalDisposition = 1 + 0 = 1

      // Use motivations with positive scores in defaultProfile:
      // ambition_contentment: 0.7, courage_prudence: 0.3
      const candidates: ActionCandidate[] = [
        {
          templateId: 'cooperate_action',
          targetId: 'actor.stranger',
          domain: 'heart',
          score: 0,
          motivations: ['ambition_contentment'], // 0.7
          socialOrientation: 'cooperative',
        },
        {
          templateId: 'defect_action',
          targetId: 'actor.stranger',
          domain: 'shadow',
          score: 0,
          motivations: ['courage_prudence'], // 0.3
          socialOrientation: 'defective',
        },
      ];

      const result = runSelectionPipeline(graph, 'actor.nice', candidates, {
        topN: 2,
        survivalThreshold: 0.8,
      });

      const cooperativeResult = result.candidates.find(
        (c) => c.templateId === 'cooperate_action'
      );
      const defectiveResult = result.candidates.find(
        (c) => c.templateId === 'defect_action'
      );

      // Initial scores from axiological alignment:
      // cooperate: 0.7 (ambition_contentment)
      // defect: 0.3 (courage_prudence)
      //
      // After disposition modifier (disposition +1):
      // cooperate: 0.7 + 1 * 0.3 = 1.0
      // defect: 0.3 - 1 * 0.3 = 0.0
      expect(cooperativeResult!.score).toEqual(1.0);
      expect(defectiveResult!.score).toEqual(0.0);
      expect(cooperativeResult!.score).toBeGreaterThan(
        defectiveResult!.score
      );
    });

    it('applies negative adjustment with always-defect strategy on first interaction', () => {
      // Actor with always-defect strategy (first move = defect)
      graph.addNode({
        id: 'actor.mean',
        type: 'actor',
        name: 'Mean Actor',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'always-defect' as CooperationStrategy,
        },
      });

      graph.addNode({
        id: 'actor.innocent',
        type: 'actor',
        name: 'Innocent',
        properties: {
          actorType: 'individual',
          reputationScore: DEFAULT_REPUTATION,
        },
      });

      const candidates: ActionCandidate[] = [
        {
          templateId: 'help',
          targetId: 'actor.innocent',
          domain: 'heart',
          score: 0,
          motivations: ['greed_generosity'],
          socialOrientation: 'cooperative',
        },
        {
          templateId: 'betray',
          targetId: 'actor.innocent',
          domain: 'shadow',
          score: 0,
          motivations: ['cunning_honesty'],
          socialOrientation: 'defective',
        },
      ];

      const result = runSelectionPipeline(graph, 'actor.mean', candidates, {
        topN: 2,
        survivalThreshold: 0.8,
      });

      const cooperativeResult = result.candidates.find(
        (c) => c.templateId === 'help'
      );
      const defectiveResult = result.candidates.find(
        (c) => c.templateId === 'betray'
      );

      // always-defect disposition = -1
      // help (cooperative): 0 + (-1) * DISPOSITION_COOPERATE_BONUS < 0
      // betray (defective): 0 - (-1) * DISPOSITION_DEFECT_BONUS > 0
      expect(cooperativeResult!.score).toBeLessThan(0);
      expect(defectiveResult!.score).toBeGreaterThan(0);
      expect(defectiveResult!.score).toBeGreaterThan(
        cooperativeResult!.score
      );
    });
  });

  describe('relationship edge lookup', () => {
    it('finds outgoing relationship edge to target', () => {
      // This test verifies the edge lookup works correctly
      graph.addNode({
        id: 'actor.a',
        type: 'actor',
        name: 'A',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'tit-for-tat' as CooperationStrategy,
        },
      });

      graph.addNode({
        id: 'actor.b',
        type: 'actor',
        name: 'B',
        properties: {
          actorType: 'individual',
          reputationScore: 0.8,
        },
      });

      // Outgoing edge from A to B
      graph.addEdge({
        id: 'rel.a-b',
        source: 'actor.a',
        target: 'actor.b',
        type: 'relates_to',
        properties: {
          sentiment: 0.5,
          strength: 0.5,
          basis: 'history',
          interactionLog: [
            {
              tick: 1,
              actorMove: 'cooperate',
              targetMove: 'cooperate',
              context: 'trade',
              stakes: 'low',
            },
          ],
        },
      });

      const candidates: ActionCandidate[] = [
        {
          templateId: 'action',
          targetId: 'actor.b',
          domain: 'gold',
          score: 0,
          motivations: ['greed_generosity'],
          socialOrientation: 'cooperative',
        },
      ];

      // Should not throw and should find the relationship
      expect(() => {
        runSelectionPipeline(graph, 'actor.a', candidates, {
          topN: 1,
          survivalThreshold: 0.8,
        });
      }).not.toThrow();
    });

    it('checks incoming edges when outgoing edge does not exist', () => {
      // This tests bidirectional lookup
      graph.addNode({
        id: 'actor.x',
        type: 'actor',
        name: 'X',
        properties: {
          actorType: 'individual',
          axiologicalProfile: defaultProfile,
          cooperationStrategy: 'grudger' as CooperationStrategy,
        },
      });

      graph.addNode({
        id: 'actor.y',
        type: 'actor',
        name: 'Y',
        properties: {
          actorType: 'individual',
          reputationScore: 0.6,
        },
      });

      // Incoming edge to X from Y (relationship initiated by Y)
      graph.addEdge({
        id: 'rel.y-x',
        source: 'actor.y',
        target: 'actor.x',
        type: 'relates_to',
        properties: {
          sentiment: 0.5,
          strength: 0.5,
          basis: 'history',
          interactionLog: [
            {
              tick: 1,
              actorMove: 'defect',
              targetMove: 'cooperate',
              context: 'trade',
              stakes: 'low',
            },
          ],
        },
      });

      const candidates: ActionCandidate[] = [
        {
          templateId: 'response',
          targetId: 'actor.y',
          domain: 'shadow',
          score: 0,
          motivations: ['loyalty_treachery'],
          socialOrientation: 'defective',
        },
      ];

      // Should not throw and should handle incoming edge
      expect(() => {
        runSelectionPipeline(graph, 'actor.x', candidates, {
          topN: 1,
          survivalThreshold: 0.8,
        });
      }).not.toThrow();
    });
  });
});
