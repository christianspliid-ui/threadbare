import { describe, it, expect } from 'vitest';
import type { EncounterTemplate } from '../encounter';

describe('quest encounter fields', () => {
  it('accepts visibleTo as an array of strings', () => {
    const template: EncounterTemplate = {
      id: 'quest_test',
      name: 'Test Quest',
      locationTypes: ['hamlet'],
      steps: [],
      reachPrimary: 'iron',
      reachSecondary: 'heart',
      encounterType: 'explore',
      threatRating: 'moderate',
      motivations: ['ambition_contentment'],
      visibleTo: ['faction:ironPact', 'agent:shadow_thief_42'],
      questPriority: 5.0,
    } as EncounterTemplate;

    expect(template.visibleTo).toEqual(['faction:ironPact', 'agent:shadow_thief_42']);
    expect(template.questPriority).toBe(5.0);
  });

  it('defaults questPriority to undefined (treated as 1.0 by engine)', () => {
    const template: Partial<EncounterTemplate> = {
      id: 'normal_encounter',
      name: 'Normal',
    };
    expect(template.questPriority).toBeUndefined();
  });

  it('defaults visibleTo to undefined (treated as "all" by engine)', () => {
    const template: Partial<EncounterTemplate> = {
      id: 'open_encounter',
      name: 'Open',
    };
    expect(template.visibleTo).toBeUndefined();
  });
});
