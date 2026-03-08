import { describe, it, expect } from 'vitest';
import {
  AGENDA_TEMPLATES,
  type AgendaTemplate,
} from '../agenda-content';
import type { InterventionType } from '../../types/dream';
import type { ValuePair } from '../../types/agent';

const ALL_INTERVENTION_TYPES: InterventionType[] = [
  'dream', 'persuade', 'deceive', 'intimidate',
  'inspire_intervention', 'coincidence', 'omen', 'afflict_bless',
];

describe('AGENDA_TEMPLATES', () => {
  it('has templates for all 8 intervention types', () => {
    for (const type of ALL_INTERVENTION_TYPES) {
      expect(AGENDA_TEMPLATES[type]).toBeDefined();
      expect(AGENDA_TEMPLATES[type].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('has at least 40 total templates', () => {
    let total = 0;
    for (const type of ALL_INTERVENTION_TYPES) {
      total += AGENDA_TEMPLATES[type].length;
    }
    expect(total).toBeGreaterThanOrEqual(40);
  });

  it('each template has required fields', () => {
    for (const type of ALL_INTERVENTION_TYPES) {
      for (const tpl of AGENDA_TEMPLATES[type]) {
        expect(tpl.id).toBeTruthy();
        expect(tpl.name).toBeTruthy();
        expect(tpl.valuePair).toBeTruthy();
        expect(tpl.valueDirection).toMatch(/^(left|right)$/);
        expect(tpl.narrativeHook).toBeTruthy();
        expect(tpl.behaviorTag).toBeTruthy();
        expect(tpl.reachBoost).toBeDefined();
        expect(tpl.reachBoost.reach).toBeTruthy();
        expect(typeof tpl.reachBoost.bonus).toBe('number');
        expect(tpl.archetypeAffinities.length).toBeGreaterThan(0);
      }
    }
  });

  it('has unique IDs across all templates', () => {
    const allIds = new Set<string>();
    for (const type of ALL_INTERVENTION_TYPES) {
      for (const tpl of AGENDA_TEMPLATES[type]) {
        expect(allIds.has(tpl.id)).toBe(false);
        allIds.add(tpl.id);
      }
    }
  });
});
