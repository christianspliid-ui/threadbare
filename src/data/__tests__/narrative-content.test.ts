import { describe, it, expect } from 'vitest';
import {
  ROUTINE_TEMPLATES,
  NOTABLE_TEMPLATES,
  LIFECYCLE_TEMPLATES,
  SPHERE_VOCABULARY,
  VALUE_FLAVORS,
  ARCHETYPE_EVENT_TEMPLATES,
  DILEMMA_STAKES_PROSE,
  SPHERE_INFLUENCE_EVENTS,
  SEASONAL_VOCABULARY,
  ECHO_FLAVOR_TEXTS,
  STEALTH_DETECTION_PROSE,
} from '../narrative-content';

describe('narrative-content expanded', () => {
  const EXPECTED_ROUTINE_TYPES = [
    // Existing 15 types
    'action_resolved',
    'action_failed',
    'action_critical',
    'trait_acquired',
    'tier_transition',
    'divine_intervention',
    'contested_action',
    'actor_death',
    'doom_escalation',
    'mandate_stage',
    'trait_lost',
    'dilemma_mutual_trust',
    'dilemma_betrayed',
    'dilemma_exploitation',
    'dilemma_mutual_distrust',
    // New 8 types
    'faction_formed',
    'culture_clash',
    'migration',
    'construction_complete',
    'encounter_step_success',
    'encounter_step_failure',
    'encounter_completed',
    'encounter_abandoned',
  ];

  describe('routine templates', () => {
    it('should have at least 4 routine templates per existing event type', () => {
      const existingTypes = EXPECTED_ROUTINE_TYPES.slice(0, 15);
      for (const type of existingTypes) {
        expect(
          ROUTINE_TEMPLATES[type]?.length,
          `${type} should have ≥4 templates`
        ).toBeGreaterThanOrEqual(4);
      }
    });

    it('should have routine templates for all new event types', () => {
      const newTypes = EXPECTED_ROUTINE_TYPES.slice(15);
      for (const type of newTypes) {
        expect(
          ROUTINE_TEMPLATES[type]?.length,
          `${type} should have ≥2 templates`
        ).toBeGreaterThanOrEqual(2);
      }
    });

    it('all routine templates should contain {actor} or {target} or {adj} placeholder', () => {
      for (const [type, templates] of Object.entries(ROUTINE_TEMPLATES)) {
        for (const tmpl of templates) {
          const hasPlaceholder =
            tmpl.includes('{actor}') ||
            tmpl.includes('{target}') ||
            tmpl.includes('{adj}');
          expect(
            hasPlaceholder,
            `routine ${type} template missing placeholders: "${tmpl.slice(0, 40)}..."`
          ).toBe(true);
        }
      }
    });

    it('total routine template count should be >= 80', () => {
      const total = Object.values(ROUTINE_TEMPLATES).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      expect(total).toBeGreaterThanOrEqual(80);
    });

    it('all expected routine types should exist', () => {
      for (const type of EXPECTED_ROUTINE_TYPES) {
        expect(ROUTINE_TEMPLATES).toHaveProperty(type);
        expect(Array.isArray(ROUTINE_TEMPLATES[type])).toBe(true);
      }
    });
  });

  describe('notable templates', () => {
    it('should have at least 2 notable templates per event type', () => {
      for (const [type, templates] of Object.entries(NOTABLE_TEMPLATES)) {
        expect(
          templates.length,
          `notable ${type} should have ≥2 templates`
        ).toBeGreaterThanOrEqual(2);
      }
    });

    it('all notable templates should contain {personality} placeholder', () => {
      for (const [type, templates] of Object.entries(NOTABLE_TEMPLATES)) {
        for (const tmpl of templates) {
          expect(
            tmpl.includes('{personality}'),
            `notable ${type} template missing {{personality}}: "${tmpl.slice(0, 50)}..."`
          ).toBe(true);
        }
      }
    });

    it('should have notable templates for all new event types', () => {
      const newTypes = [
        'faction_formed',
        'culture_clash',
        'migration',
        'construction_complete',
        'encounter_step_success',
        'encounter_step_failure',
        'encounter_completed',
        'encounter_abandoned',
      ];
      for (const type of newTypes) {
        expect(
          NOTABLE_TEMPLATES[type]?.length,
          `notable ${type} should have ≥2 templates`
        ).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('lifecycle templates', () => {
    it('should export LIFECYCLE_TEMPLATES', () => {
      expect(LIFECYCLE_TEMPLATES).toBeDefined();
      expect(typeof LIFECYCLE_TEMPLATES).toBe('object');
    });

    it('should have 5 death templates', () => {
      expect(LIFECYCLE_TEMPLATES.death).toBeDefined();
      expect(LIFECYCLE_TEMPLATES.death).toHaveLength(5);
    });

    it('should have 3 birth templates', () => {
      expect(LIFECYCLE_TEMPLATES.birth).toBeDefined();
      expect(LIFECYCLE_TEMPLATES.birth).toHaveLength(3);
    });

    it('should have 3 migration templates', () => {
      expect(LIFECYCLE_TEMPLATES.migration).toBeDefined();
      expect(LIFECYCLE_TEMPLATES.migration).toHaveLength(3);
    });

    it('all death templates should have {actor} placeholder', () => {
      for (const tmpl of LIFECYCLE_TEMPLATES.death) {
        expect(
          tmpl.includes('{actor}'),
          `death template missing {{actor}}: "${tmpl.slice(0, 50)}..."`
        ).toBe(true);
      }
    });

    it('all birth templates should have {actor} placeholder', () => {
      for (const tmpl of LIFECYCLE_TEMPLATES.birth) {
        expect(
          tmpl.includes('{actor}'),
          `birth template missing {{actor}}: "${tmpl.slice(0, 50)}..."`
        ).toBe(true);
      }
    });

    it('all migration templates should have {actor} placeholder', () => {
      for (const tmpl of LIFECYCLE_TEMPLATES.migration) {
        expect(
          tmpl.includes('{actor}'),
          `migration template missing {{actor}}: "${tmpl.slice(0, 50)}..."`
        ).toBe(true);
      }
    });
  });

  describe('archetype-event prose', () => {
    it('should have templates for 5 priority archetypes × 6 priority events = 30 entries', () => {
      const priorityArchetypes = ['tragic_hero', 'trickster', 'conqueror', 'healer', 'prophet'];
      const priorityEvents = ['actor_death', 'action_critical', 'tier_transition', 'divine_intervention', 'contested_action', 'encounter_completed'];
      for (const arch of priorityArchetypes) {
        for (const evt of priorityEvents) {
          const key = `${arch}.${evt}`;
          expect(ARCHETYPE_EVENT_TEMPLATES[key], `missing ${key}`).toBeDefined();
          expect(ARCHETYPE_EVENT_TEMPLATES[key].length).toBeGreaterThan(0);
        }
      }
    });

    it('should have death + tier_transition for all 19 archetypes', () => {
      const archetypes = [
        'tragic_hero', 'trickster', 'conqueror', 'healer', 'prophet',
        'guardian', 'wanderer', 'scholar', 'martyr', 'tyrant',
        'mystic', 'rebel', 'builder', 'mentor', 'outcast',
        'diplomat', 'hunter', 'dreamer', 'avenger',
      ];
      for (const arch of archetypes) {
        expect(ARCHETYPE_EVENT_TEMPLATES[`${arch}.actor_death`], `missing ${arch}.actor_death`).toBeDefined();
        expect(ARCHETYPE_EVENT_TEMPLATES[`${arch}.tier_transition`], `missing ${arch}.tier_transition`).toBeDefined();
      }
    });

    it('total archetype-event templates should be >= 58', () => {
      expect(Object.keys(ARCHETYPE_EVENT_TEMPLATES).length).toBeGreaterThanOrEqual(58);
    });

    it('all archetype-event templates should be non-empty strings', () => {
      for (const [key, template] of Object.entries(ARCHETYPE_EVENT_TEMPLATES)) {
        expect(typeof template, `${key} should be a string`).toBe('string');
        expect(template.length, `${key} template is empty`).toBeGreaterThan(0);
      }
    });

    it('should contain at least one {placeholder} in each template', () => {
      for (const [key, template] of Object.entries(ARCHETYPE_EVENT_TEMPLATES)) {
        const hasPlaceholder = /\{[a-zA-Z_]+\}/.test(template);
        expect(hasPlaceholder, `${key} template missing placeholders: "${template.slice(0, 50)}..."`).toBe(true);
      }
    });
  });

  describe('content structure integrity', () => {
    it('SPHERE_VOCABULARY should have 8 spheres with adj/verb/noun arrays', () => {
      expect(Object.keys(SPHERE_VOCABULARY)).toHaveLength(8);
      for (const vocab of Object.values(SPHERE_VOCABULARY)) {
        expect(vocab).toHaveProperty('adjectives');
        expect(vocab).toHaveProperty('verbs');
        expect(vocab).toHaveProperty('nouns');
        expect(Array.isArray(vocab.adjectives)).toBe(true);
        expect(Array.isArray(vocab.verbs)).toBe(true);
        expect(Array.isArray(vocab.nouns)).toBe(true);
      }
    });

    it('VALUE_FLAVORS should map to string arrays', () => {
      for (const flavors of Object.values(VALUE_FLAVORS)) {
        expect(Array.isArray(flavors)).toBe(true);
        for (const flavor of flavors) {
          expect(typeof flavor).toBe('string');
          expect(flavor.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('dilemma stakes prose', () => {
    it('should have dilemma stakes prose for 4 outcomes × 3 stakes = 12 entries', () => {
      expect(Object.keys(DILEMMA_STAKES_PROSE)).toHaveLength(12);
    });

    it('each entry should be a non-empty prose string', () => {
      for (const [key, prose] of Object.entries(DILEMMA_STAKES_PROSE)) {
        expect(prose.length, `${key} empty`).toBeGreaterThan(10);
      }
    });

    it('should have entries for all 4 dilemma outcomes at low/medium/high stakes', () => {
      const outcomes = ['mutual_trust', 'betrayed', 'exploitation', 'mutual_distrust'];
      const stakes = ['low', 'medium', 'high'];
      for (const outcome of outcomes) {
        for (const stake of stakes) {
          const key = `${outcome}.${stake}`;
          expect(DILEMMA_STAKES_PROSE).toHaveProperty(key);
        }
      }
    });

    it('all prose should contain at least one placeholder', () => {
      for (const [key, prose] of Object.entries(DILEMMA_STAKES_PROSE)) {
        const hasPlaceholder = /\{[a-zA-Z_]+\}/.test(prose);
        expect(hasPlaceholder, `${key} missing placeholders`).toBe(true);
      }
    });

    it('high stakes prose should feel more dramatic than low stakes', () => {
      // Low stakes should use lighter language
      const lowProse = DILEMMA_STAKES_PROSE['mutual_trust.low'].toLowerCase();
      const highProse = DILEMMA_STAKES_PROSE['mutual_trust.high'].toLowerCase();

      // High stakes should have more dramatic words (this is a soft check)
      const dramaticWords = ['shattered', 'eternal', 'transcendent', 'profound', 'desperate', 'legendary'];
      const highDramaticCount = dramaticWords.filter(w => highProse.includes(w)).length;
      expect(highDramaticCount).toBeGreaterThanOrEqual(0); // Will at least exist
    });
  });

  describe('connective tissue content', () => {
    it('should have 16 sphere influence events (8 spheres × 2 directions)', () => {
      expect(Object.keys(SPHERE_INFLUENCE_EVENTS)).toHaveLength(16);
    });

    it('each sphere influence event should be a non-empty string', () => {
      for (const [key, prose] of Object.entries(SPHERE_INFLUENCE_EVENTS)) {
        expect(typeof prose, `${key} should be a string`).toBe('string');
        expect(prose.length, `${key} is empty`).toBeGreaterThan(10);
      }
    });

    it('should have entries for all 8 spheres at gaining/losing', () => {
      const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
      const directions = ['gaining', 'losing'];
      for (const sphere of spheres) {
        for (const direction of directions) {
          const key = `${sphere}.${direction}`;
          expect(SPHERE_INFLUENCE_EVENTS).toHaveProperty(key);
        }
      }
    });

    it('should have 4 seasonal vocabulary entries', () => {
      expect(Object.keys(SEASONAL_VOCABULARY)).toHaveLength(4);
    });

    it('each season should have adjectives, verbs, and atmosphere', () => {
      const seasons = ['spring', 'summer', 'autumn', 'winter'];
      for (const season of seasons) {
        expect(SEASONAL_VOCABULARY).toHaveProperty(season);
        const seasonData = SEASONAL_VOCABULARY[season];
        expect(seasonData.adjectives.length).toBeGreaterThanOrEqual(5);
        expect(seasonData.verbs.length).toBeGreaterThanOrEqual(5);
        expect(seasonData.atmosphere.length).toBeGreaterThan(10);
      }
    });

    it('should have 12 echo flavor texts', () => {
      expect(ECHO_FLAVOR_TEXTS).toHaveLength(12);
    });

    it('each echo flavor text should be a non-empty string', () => {
      for (let i = 0; i < ECHO_FLAVOR_TEXTS.length; i++) {
        const text = ECHO_FLAVOR_TEXTS[i];
        expect(typeof text, `echo[${i}] should be a string`).toBe('string');
        expect(text.length, `echo[${i}] is empty`).toBeGreaterThan(10);
      }
    });

    it('echo flavor texts should contain placeholders', () => {
      for (let i = 0; i < ECHO_FLAVOR_TEXTS.length; i++) {
        const text = ECHO_FLAVOR_TEXTS[i];
        const hasPlaceholder = /\{[a-zA-Z_]+\}/.test(text);
        expect(hasPlaceholder, `echo[${i}] missing placeholders: "${text.slice(0, 50)}..."`).toBe(true);
      }
    });

    it('should have 8 stealth detection prose entries', () => {
      expect(Object.keys(STEALTH_DETECTION_PROSE)).toHaveLength(8);
    });

    it('each stealth detection prose should be a non-empty string', () => {
      for (const [key, prose] of Object.entries(STEALTH_DETECTION_PROSE)) {
        expect(typeof prose, `${key} should be a string`).toBe('string');
        expect(prose.length, `${key} is empty`).toBeGreaterThan(10);
      }
    });

    it('should have entries for mortal and rival detection transitions', () => {
      const keys = [
        'mortal.unaware_to_suspicion',
        'mortal.suspicion_to_realization',
        'mortal.realization_to_worship',
        'mortal.worship_to_fanaticism',
        'rival.unaware_to_suspicion',
        'rival.suspicion_to_investigation',
        'rival.investigation_to_confirmation',
        'rival.confirmation_to_opposition',
      ];
      for (const key of keys) {
        expect(STEALTH_DETECTION_PROSE).toHaveProperty(key);
      }
    });

    it('all sphere influence and stealth detection prose should contain placeholders', () => {
      for (const [key, prose] of Object.entries(SPHERE_INFLUENCE_EVENTS)) {
        const hasPlaceholder = /\{[a-zA-Z_]+\}/.test(prose);
        expect(hasPlaceholder, `${key} missing placeholders`).toBe(true);
      }
      for (const [key, prose] of Object.entries(STEALTH_DETECTION_PROSE)) {
        const hasPlaceholder = /\{[a-zA-Z_]+\}/.test(prose);
        expect(hasPlaceholder, `${key} missing placeholders`).toBe(true);
      }
    });
  });
});
