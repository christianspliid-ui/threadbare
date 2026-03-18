import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { probabilisticSelect } from '../agentSelection';
import {
  computeAlignmentFactor,
  computeInterventionCost,
  applyDreamManipulations,
  validateManipulation,
  executeIntervention,
} from '../dream';
import { createEmptyEssencePool } from '../influence';
import type { ActionCandidate, AxiologicalProfile } from '../../types/agent';
import type { DreamManipulation } from '../../types/dream';
import type { InfluenceTier } from '../../types/influence';

describe('Dream Interface + Agent Selection integration', () => {
  function buildScenario() {
    const graph = new WorldGraph();

    graph.addNode({
      id: 'actor_ascendant_1',
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { force: 0.05, matter: 0.05, energy: 0.10, life: 0.35, mind: 0.10, spirit: 0.25, time: 0.05, entropy: 0.05 },
      },
    });

    const profile: AxiologicalProfile = {
      loyalty_ambition: 0.7,
      courage_prudence: 0.6,
      mercy_ruthlessness: -0.3,
      honesty_cunning: 0.1,
      sacrifice_survival: 0.4,
      loyalty_ambition: 0.5,
      tradition_novelty: -0.2,
      humility_pride: 0.5,
      mercy_ruthlessness: 0.2,
      asceticism_extravagance: -0.1,
    };

    graph.addNode({
      id: 'actor_volkar',
      type: 'actor',
      name: 'Thane Volkar',
      properties: {
        actorType: 'individual',
        axiologicalProfile: profile,
      },
    });

    graph.addEdge({
      id: 'edge_worship_1',
      source: 'actor_volkar',
      target: 'actor_ascendant_1',
      type: 'worships',
      properties: {
        tier: 2,
        influence: 50,
        since: 0,
      },
    });

    return { profile };
  }

  it('full flow: validate → cost → manipulate → select', () => {
    const { profile } = buildScenario();

    const candidates: ActionCandidate[] = [
      { templateId: 'march_fortress', targetId: 'loc_1', domain: 'iron', score: 10,
        motivations: ['loyalty_ambition', 'courage_prudence'], probability: 0.60 },
      { templateId: 'strengthen_alliance', targetId: 'actor_2', domain: 'heart', score: 5,
        motivations: ['loyalty_ambition', 'tradition_novelty'], probability: 0.25 },
      { templateId: 'train_recruits', targetId: 'loc_1', domain: 'iron', score: 3,
        motivations: ['tradition_novelty'], probability: 0.15 },
    ];

    // 1. Validate: can we use "inspire" at tier 2?
    const validation = validateManipulation('inspire', 2 as InfluenceTier);
    expect(validation.valid).toBe(true);

    // 2. Compute alignment cost for boosting "strengthen_alliance"
    const alignment = computeAlignmentFactor(
      profile,
      ['loyalty_ambition', 'tradition_novelty'],
    );
    // avg = (0.5 + (-0.2)) / 2 = 0.15 → below 0.3 threshold → neutral
    expect(alignment.label).toBe('neutral');

    // 3. Compute full cost
    const pool = { ...createEmptyEssencePool(), spirit: 20 };
    const cost = computeInterventionCost({
      baseCost: 2,
      sphere: 'spirit',
      alignmentFactor: alignment.value,
      actorType: 'individual',
      pool,
    });
    // 2 * 2.0 * 1.0 = 4.0
    expect(cost.finalCost).toBeCloseTo(4.0);
    expect(cost.affordable).toBe(true);

    // 4. Apply dream manipulation: inspire "strengthen_alliance"
    const manipulation: DreamManipulation = {
      type: 'inspire',
      targetCandidateIndex: 1,
      sphereCost: 'spirit',
    };
    const adjusted = applyDreamManipulations(candidates, [manipulation]);

    expect(adjusted[1].probability!).toBeGreaterThan(0.25);
    const total = adjusted.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);

    // 5. Probabilistic select with deterministic roll
    const selectedWithBoost = probabilisticSelect(adjusted, 0.65);
    expect(selectedWithBoost).toBeDefined();
  });

  it('intervention execution: spend essence and check detection', () => {
    const pool = { ...createEmptyEssencePool(), spirit: 20 };

    const result = executeIntervention({
      interventionType: 'dream',
      sphere: 'spirit',
      baseCost: 1,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      priorInterventions: 0,
      detectionRoll: 0.99,
    });

    expect(result.success).toBe(true);
    expect(result.essenceSpent.spirit).toBeCloseTo(1.0);
    expect(result.detected).toBe(false);
    expect(result.narrativeHook).toContain('dream');
  });

  it('command overrides selection to force a specific action', () => {
    const candidates: ActionCandidate[] = [
      { templateId: 'march', targetId: 'loc_1', domain: 'iron', score: 10, motivations: ['loyalty_ambition'], probability: 0.70 },
      { templateId: 'retreat', targetId: 'loc_2', domain: 'iron', score: 2, motivations: ['courage_prudence'], probability: 0.20 },
      { templateId: 'pray', targetId: 'loc_1', domain: 'veil', score: 1, motivations: ['sacrifice_survival'], probability: 0.10 },
    ];

    const commandManip: DreamManipulation = {
      type: 'command',
      targetCandidateIndex: 1,
      sphereCost: 'force',
    };

    const adjusted = applyDreamManipulations(candidates, [commandManip]);
    expect(adjusted[1].probability).toBeCloseTo(1.0);

    const selected = probabilisticSelect(adjusted, 0.5);
    expect(selected.templateId).toBe('retreat');
  });
});
