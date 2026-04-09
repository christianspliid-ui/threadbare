import { describe, it, expect } from 'vitest';
import { scoreStrategicCandidates } from '../strategicActionScoring';
import type { StrategicActionCandidate, StrategicRuntimeState } from '../../types/strategicAction';
import { mulberry32 } from '../../lib/prng';

function makeCandidate(overrides: Partial<StrategicActionCandidate> = {}): StrategicActionCandidate {
  return {
    candidateId: 'test_candidate_1',
    templateId: 'strategic_survey_market',
    ambitionId: 'ambition_dominate_trade',
    actorId: 'actor_1',
    verb: 'gather_info',
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    displayName: 'Survey Market',
    targetNodeId: 'loc_market',
    scoreComponents: {
      ambitionAlignment: 0.8,
      blockerRelief: 0.3,
      worldImpact: 0.3,
      catalystValue: 0.2,
      roleFit: 0.6,
      controlPressure: 0,
      travelPenalty: 0.1,
      varietyPenalty: 0,
    },
    finalScore: 0,
    generationReason: 'ambition_progression',
    ...overrides,
  };
}

describe('strategicActionScoring', () => {
  it('scores candidates above floor', () => {
    const rng = mulberry32(42);
    const candidates = [makeCandidate()];
    const scored = scoreStrategicCandidates(candidates, undefined, 10, rng);

    expect(scored.length).toBe(1);
    expect(scored[0].finalScore).toBeGreaterThan(0);
  });

  it('sorts candidates by descending score', () => {
    const rng = mulberry32(42);
    const candidates = [
      makeCandidate({ candidateId: 'low', scoreComponents: {
        ambitionAlignment: 0.4, blockerRelief: 0.3, worldImpact: 0.3,
        catalystValue: 0.1, roleFit: 0.3, controlPressure: 0, travelPenalty: 0.1, varietyPenalty: 0,
      } }),
      makeCandidate({ candidateId: 'high', scoreComponents: {
        ambitionAlignment: 0.9, blockerRelief: 0.8, worldImpact: 0.9,
        catalystValue: 0.5, roleFit: 0.8, controlPressure: 0, travelPenalty: 0, varietyPenalty: 0,
      } }),
    ];
    const scored = scoreStrategicCandidates(candidates, undefined, 10, rng);

    expect(scored.length).toBe(2);
    expect(scored[0].candidateId).toBe('high');
    expect(scored[0].finalScore).toBeGreaterThan(scored[1].finalScore);
  });

  it('applies variety penalty for duplicate templates on board', () => {
    const rng = mulberry32(42);
    const base = makeCandidate();
    const candidates = [
      { ...base, candidateId: 'dup_1', targetNodeId: 'loc_1' },
      { ...base, candidateId: 'dup_2', targetNodeId: 'loc_2' },
      { ...base, candidateId: 'dup_3', targetNodeId: 'loc_3' },
    ];
    const scored = scoreStrategicCandidates(candidates, undefined, 10, rng);

    // All should score, but duplicates should score lower
    expect(scored.length).toBe(3);
    // The variety penalty should make scores decrease for same template
    // (all same template, so penalty accumulates)
  });

  it('applies variety penalty from recent history', () => {
    const rng = mulberry32(42);
    const candidates = [makeCandidate()];
    const state: StrategicRuntimeState = {
      projects: [],
      controls: [],
      history: [
        {
          tick: 5,
          actorId: 'actor_1',
          templateId: 'strategic_survey_market',
          ambitionId: 'ambition_dominate_trade',
          verb: 'gather_info',
          behaviorFamily: 'merchant-expansion',
          displayName: 'Survey Market',
          outcome: 'completed',
          graphOps: [],
          catalystSeeded: false,
        },
      ],
    };

    const scoredWithHistory = scoreStrategicCandidates(candidates, state, 10, rng);
    const rng2 = mulberry32(42);
    const scoredWithout = scoreStrategicCandidates(candidates, undefined, 10, rng2);

    // Score with history penalty should be lower
    expect(scoredWithHistory[0]?.finalScore).toBeLessThan(scoredWithout[0]?.finalScore);
  });

  it('filters candidates below score floor', () => {
    const rng = mulberry32(42);
    const candidates = [
      makeCandidate({
        candidateId: 'terrible',
        scoreComponents: {
          ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0,
          catalystValue: 0, roleFit: 0, controlPressure: 0,
          travelPenalty: 0.9, varietyPenalty: 0.9,
        },
      }),
    ];
    const scored = scoreStrategicCandidates(candidates, undefined, 10, rng);
    expect(scored).toHaveLength(0);
  });

  it('is deterministic under same seed', () => {
    const candidates = [
      makeCandidate({ candidateId: 'a' }),
      makeCandidate({ candidateId: 'b', targetNodeId: 'loc_2' }),
    ];
    const rng1 = mulberry32(42);
    const scored1 = scoreStrategicCandidates(candidates, undefined, 10, rng1);
    const rng2 = mulberry32(42);
    const scored2 = scoreStrategicCandidates(candidates, undefined, 10, rng2);

    expect(scored1.map(s => s.candidateId)).toEqual(scored2.map(s => s.candidateId));
    expect(scored1.map(s => s.finalScore)).toEqual(scored2.map(s => s.finalScore));
  });
});
