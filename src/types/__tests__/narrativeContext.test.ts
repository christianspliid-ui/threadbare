import { describe, it, expect } from 'vitest';
import type {
  NarrativeContext,
  ContextObject,
  ContextCategory,
  OppositionSummary,
  OpposingPair,
} from '../narrative';

describe('NarrativeContext types', () => {
  it('NarrativeContext can be constructed with minimal fields', () => {
    const ctx: NarrativeContext = {
      event: {
        id: 'evt-1', tier: 'notable', eventType: 'action_resolved',
        description: 'test', tick: 1,
      },
      contextObjects: [],
      historicalFragments: [],
      oppositionSummary: { tensionScore: 0, opposingPairs: [] },
      culturalStrength: 0,
    };
    expect(ctx.event.id).toBe('evt-1');
    expect(ctx.archetype).toBeUndefined();
    expect(ctx.culturalTension).toBeUndefined();
  });

  it('ContextObject has required fields', () => {
    const obj: ContextObject = {
      nodeId: 'n-1', name: 'Ancient Blade', category: 'artifact',
      relevanceScore: 8.5, briefDescription: 'A rusted sword.',
    };
    expect(obj.category).toBe('artifact');
    expect(obj.tensionType).toBeUndefined();
  });

  it('ContextCategory covers all 5 categories', () => {
    const categories: ContextCategory[] = ['artifact', 'faction', 'character', 'location', 'event'];
    expect(categories).toHaveLength(5);
  });

  it('OppositionSummary tracks tension pairs', () => {
    const pair: OpposingPair = {
      sourceId: 'a-1', targetId: 'a-2',
      tensionType: 'foundation_sphere', score: 5,
    };
    const summary: OppositionSummary = {
      dominantTension: 'foundation_sphere',
      tensionScore: 5,
      opposingPairs: [pair],
    };
    expect(summary.opposingPairs).toHaveLength(1);
  });
});
