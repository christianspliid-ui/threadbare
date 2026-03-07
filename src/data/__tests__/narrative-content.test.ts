import { describe, it, expect } from 'vitest';
import { SPHERE_VOCABULARY, ROUTINE_TEMPLATES, NOTABLE_TEMPLATES, VALUE_FLAVORS } from '../narrative-content';

describe('narrative-content', () => {
  it('exports sphere vocabulary for all 8 spheres', () => {
    const spheres = Object.keys(SPHERE_VOCABULARY);
    expect(spheres).toHaveLength(8);
    for (const sphere of spheres) {
      const vocab = SPHERE_VOCABULARY[sphere as keyof typeof SPHERE_VOCABULARY];
      expect(vocab.adjectives.length).toBeGreaterThanOrEqual(3);
      expect(vocab.verbs.length).toBeGreaterThanOrEqual(3);
      expect(vocab.nouns.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('exports routine templates for all 15 event types', () => {
    const eventTypes = Object.keys(ROUTINE_TEMPLATES);
    expect(eventTypes).toHaveLength(15);
    for (const templates of Object.values(ROUTINE_TEMPLATES)) {
      expect(templates.length).toBeGreaterThanOrEqual(1);
      for (const t of templates) {
        expect(typeof t).toBe('string');
        expect(t.length).toBeGreaterThan(10);
      }
    }
  });

  it('exports notable templates for 9 event types', () => {
    const eventTypes = Object.keys(NOTABLE_TEMPLATES);
    expect(eventTypes).toHaveLength(9);
  });

  it('exports value flavors for 10 value pairs', () => {
    const pairs = Object.keys(VALUE_FLAVORS);
    expect(pairs).toHaveLength(10);
    for (const flavors of Object.values(VALUE_FLAVORS)) {
      expect(flavors!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('routine templates contain placeholder tokens', () => {
    for (const templates of Object.values(ROUTINE_TEMPLATES)) {
      for (const t of templates) {
        expect(t).toMatch(/\{(actor|target|adj|verb|noun)\}/);
      }
    }
  });

  it('notable templates have at least one with personality placeholder per event type', () => {
    for (const templates of Object.values(NOTABLE_TEMPLATES)) {
      const hasPersonality = templates.some(t => t.includes('{personality}'));
      expect(hasPersonality).toBe(true);
    }
  });

  it('includes all 4 dilemma event types in routine templates', () => {
    const dilemmaTypes = [
      'dilemma_mutual_trust',
      'dilemma_betrayed',
      'dilemma_exploitation',
      'dilemma_mutual_distrust',
    ];
    for (const eventType of dilemmaTypes) {
      expect(ROUTINE_TEMPLATES[eventType]).toBeDefined();
      expect(ROUTINE_TEMPLATES[eventType]!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('includes all 4 dilemma event types in notable templates', () => {
    const dilemmaTypes = [
      'dilemma_mutual_trust',
      'dilemma_betrayed',
      'dilemma_exploitation',
      'dilemma_mutual_distrust',
    ];
    for (const eventType of dilemmaTypes) {
      expect(NOTABLE_TEMPLATES[eventType]).toBeDefined();
      expect(NOTABLE_TEMPLATES[eventType]!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('dilemma templates contain actor and target placeholders', () => {
    const dilemmaTypes = [
      'dilemma_mutual_trust',
      'dilemma_betrayed',
      'dilemma_exploitation',
      'dilemma_mutual_distrust',
    ];
    for (const eventType of dilemmaTypes) {
      const routineTemplates = ROUTINE_TEMPLATES[eventType];
      for (const t of routineTemplates!) {
        expect(t).toMatch(/\{actor\}/);
        expect(t).toMatch(/\{target\}/);
      }
      const notableTemplates = NOTABLE_TEMPLATES[eventType];
      for (const t of notableTemplates!) {
        expect(t).toMatch(/\{actor\}/);
        expect(t).toMatch(/\{target\}/);
      }
    }
  });

  it('dilemma notable templates contain personality placeholder', () => {
    const dilemmaTypes = [
      'dilemma_mutual_trust',
      'dilemma_betrayed',
      'dilemma_exploitation',
      'dilemma_mutual_distrust',
    ];
    for (const eventType of dilemmaTypes) {
      const templates = NOTABLE_TEMPLATES[eventType];
      const hasPersonality = templates!.some(t => t.includes('{personality}'));
      expect(hasPersonality).toBe(true);
    }
  });
});
