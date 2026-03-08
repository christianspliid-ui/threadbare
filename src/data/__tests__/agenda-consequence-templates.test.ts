/**
 * Test suite for agenda-consequence-templates.ts
 * Validates template coverage, placeholder resolution, and decay hints.
 */

import { describe, it, expect } from 'vitest';
import {
  getAgendaConsequenceMessage,
  AGENDA_CONSEQUENCE_TEMPLATES,
  DECAY_HINTS,
  type AgendaConsequenceCategory,
} from '../agenda-consequence-templates';

describe('AGENDA_CONSEQUENCE_TEMPLATES', () => {
  it('has templates for all 8 intervention types', () => {
    const interventionTypes = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'] as const;
    for (const type of interventionTypes) {
      expect(AGENDA_CONSEQUENCE_TEMPLATES).toHaveProperty(type);
      expect(Object.keys(AGENDA_CONSEQUENCE_TEMPLATES[type]).length).toBeGreaterThan(0);
    }
  });

  it('has at least 2 templates per agenda category for each type', () => {
    for (const [type, categories] of Object.entries(AGENDA_CONSEQUENCE_TEMPLATES)) {
      for (const [cat, templates] of Object.entries(categories)) {
        expect(templates.length, `${type}.${cat}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('covers at least 10 distinct agenda categories across types', () => {
    const allCategories = new Set<string>();
    for (const categories of Object.values(AGENDA_CONSEQUENCE_TEMPLATES)) {
      for (const cat of Object.keys(categories)) {
        allCategories.add(cat);
      }
    }
    expect(allCategories.size).toBeGreaterThanOrEqual(10);
  });

  it('has templates with all required placeholders', () => {
    const placeholderPattern = /{[a-z_]+}/g;
    for (const [type, categories] of Object.entries(AGENDA_CONSEQUENCE_TEMPLATES)) {
      for (const [cat, templates] of Object.entries(categories)) {
        for (const template of templates) {
          const placeholders = template.match(placeholderPattern) ?? [];
          expect(placeholders.length, `${type}.${cat} template has placeholders`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has decay hints array with at least 4 entries', () => {
    expect(DECAY_HINTS).toHaveLength(6);
    for (const hint of DECAY_HINTS) {
      expect(typeof hint).toBe('string');
      expect(hint.length).toBeGreaterThan(5);
    }
  });
});

describe('getAgendaConsequenceMessage', () => {
  const testContext = {
    agentName: 'Kael',
    archetype: 'conqueror',
    sphereAdj: 'thunderous',
    agendaHook: 'glory',
    decayHint: 'for now',
  };

  it('resolves all placeholders and returns non-empty string', () => {
    const msg = getAgendaConsequenceMessage('dream', 'ambition', testContext, 42);
    expect(msg).toBeTruthy();
    expect(msg.length).toBeGreaterThan(10);
    expect(msg).not.toContain('{');
    expect(msg).not.toContain('}');
  });

  it('includes agent name in resolved message', () => {
    const msg = getAgendaConsequenceMessage('persuade', 'ambition', testContext, 42);
    expect(msg).toContain('Kael');
  });

  it('includes archetype adjective in resolved message', () => {
    const msg = getAgendaConsequenceMessage('persuade', 'ambition', testContext, 42);
    expect(msg).toContain('conqueror');
  });

  it('includes agenda hook in resolved message', () => {
    const msg = getAgendaConsequenceMessage('omen', 'ambition', testContext, 43);
    expect(msg).toContain('glory');
  });

  it('includes sphere adjective in resolved message', () => {
    const msg = getAgendaConsequenceMessage('intimidate', 'dominance', testContext, 42);
    expect(msg).toContain('thunderous');
  });

  it('includes decay hint in resolved message', () => {
    const msg = getAgendaConsequenceMessage('afflict_bless', 'courage', testContext, 42);
    expect(msg).toContain('for now');
  });

  it('uses seeded template selection deterministically', () => {
    const msg1 = getAgendaConsequenceMessage('dream', 'ambition', testContext, 42);
    const msg2 = getAgendaConsequenceMessage('dream', 'ambition', testContext, 42);
    expect(msg1).toBe(msg2);
  });

  it('selects different templates for different seeds', () => {
    const msg1 = getAgendaConsequenceMessage('dream', 'ambition', testContext, 42);
    const msg2 = getAgendaConsequenceMessage('dream', 'ambition', testContext, 43);
    // Seeds that select different templates should produce different results
    // 42 % 3 = 0, 43 % 3 = 1, so they select different templates
    expect(msg1).not.toBe(msg2);
  });

  it('handles all 8 intervention types', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'] as const;
    for (const type of types) {
      const msg = getAgendaConsequenceMessage(type, 'ambition', testContext, 42);
      expect(msg).toBeTruthy();
      expect(msg.length).toBeGreaterThan(10);
    }
  });

  it('works with all agenda categories', () => {
    const categories: AgendaConsequenceCategory[] = [
      'ambition', 'courage', 'compassion', 'cunning', 'devotion',
      'loyalty', 'tradition', 'dominance', 'wrath', 'greed'
    ];
    for (const cat of categories) {
      const msg = getAgendaConsequenceMessage('dream', cat, testContext, 42);
      expect(msg).toBeTruthy();
      expect(msg.length).toBeGreaterThan(5);
    }
  });

  it('handles missing optional placeholders gracefully', () => {
    const minimalContext = {
      agentName: 'Kael',
    };
    const msg = getAgendaConsequenceMessage(
      'dream',
      'ambition',
      minimalContext as any,
      42
    );
    // Should still produce output, possibly with undefined/empty values
    expect(typeof msg).toBe('string');
  });
});
