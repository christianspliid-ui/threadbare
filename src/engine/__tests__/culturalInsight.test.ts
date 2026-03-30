import { describe, it, expect } from 'vitest';
import {
  getCulturalInsight,
  addCulturalInsight,
  getCulturalKnowledgeLevel,
  CULTURAL_INSIGHT_GAINS,
} from '../culturalInsight';

describe('culturalInsight', () => {
  it('getCulturalInsight returns 0 for unknown cultures', () => {
    const map = new Map<string, number>();
    expect(getCulturalInsight(map, 'culture-1')).toBe(0);
  });

  it('addCulturalInsight returns new map with increased value', () => {
    const map = new Map<string, number>();
    const newMap = addCulturalInsight(map, 'culture-1', 0.1);
    expect(newMap.get('culture-1')).toBeCloseTo(0.1);
    expect(map.get('culture-1')).toBeUndefined(); // immutable
  });

  it('addCulturalInsight clamps at 1.0', () => {
    const map = new Map<string, number>([['c1', 0.95]]);
    const newMap = addCulturalInsight(map, 'c1', 0.2);
    expect(newMap.get('c1')).toBe(1.0);
  });

  it('getCulturalKnowledgeLevel maps score to tier', () => {
    expect(getCulturalKnowledgeLevel(0)).toBe('stranger');
    expect(getCulturalKnowledgeLevel(0.1)).toBe('stranger');
    expect(getCulturalKnowledgeLevel(0.2)).toBe('recognised');
    expect(getCulturalKnowledgeLevel(0.4)).toBe('known');
    expect(getCulturalKnowledgeLevel(0.6)).toBe('intimate');
    expect(getCulturalKnowledgeLevel(0.8)).toBe('transparent');
  });

  it('CULTURAL_INSIGHT_GAINS has all 5 sources', () => {
    expect(CULTURAL_INSIGHT_GAINS.territory_visit).toBe(0.02);
    expect(CULTURAL_INSIGHT_GAINS.member_familiarity_factor).toBe(0.1);
    expect(CULTURAL_INSIGHT_GAINS.scry_on_member).toBe(0.15);
    expect(CULTURAL_INSIGHT_GAINS.intervention_in_territory).toBe(0.10);
    expect(CULTURAL_INSIGHT_GAINS.worshipper_per_tick).toBe(0.05);
  });
});
