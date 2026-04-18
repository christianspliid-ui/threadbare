/**
 * omen-templates-content.test.ts — Acceptance tests for THR-80 doom_echo content.
 *
 * Verifies that getDoomEchoTemplates returns > 0 templates for all 4 new archetypes
 * at stage 0, and that the new templates are structurally valid.
 */

import { describe, it, expect } from 'vitest';
import { getDoomEchoTemplates, OMEN_TEMPLATES } from '../omenTemplates';

const NEW_ARCHETYPES = ['changing', 'sundering', 'failing', 'ascension'] as const;

describe('doom_echo templates — THR-80 (new archetypes)', () => {
  it.each(NEW_ARCHETYPES)(
    'getDoomEchoTemplates("%s", 0) returns at least 1 template',
    (archetype) => {
      const templates = getDoomEchoTemplates(archetype, 0);
      expect(templates.length).toBeGreaterThan(0);
    },
  );

  it.each(NEW_ARCHETYPES)(
    '"%s" has 4 templates covering stages 0-3',
    (archetype) => {
      const all = OMEN_TEMPLATES.filter(
        t => t.category === 'doom_echo' && t.doomArchetypes?.includes(archetype),
      );
      expect(all.length).toBe(4);
      // Every stage 0-3 is covered by at least one template
      for (let stage = 0; stage <= 3; stage++) {
        const atStage = getDoomEchoTemplates(archetype, stage);
        expect(atStage.length).toBeGreaterThan(0);
      }
    },
  );

  it.each(NEW_ARCHETYPES)(
    '"%s" templates have required fields and valid prose',
    (archetype) => {
      const templates = OMEN_TEMPLATES.filter(
        t => t.category === 'doom_echo' && t.doomArchetypes?.includes(archetype),
      );
      for (const t of templates) {
        expect(t.id).toMatch(/^omen\./);
        expect(t.name.length).toBeGreaterThan(0);
        expect(t.category).toBe('doom_echo');
        expect(t.doomArchetypes).toContain(archetype);
        expect(t.doomStageRange).toHaveLength(2);
        expect(t.durationRange).toHaveLength(2);
        expect(t.beats.length).toBeGreaterThan(0);
        // Each beat has at least 1 prose entry with {location} placeholder
        for (const beat of t.beats) {
          expect(beat.prose.length).toBeGreaterThan(0);
          for (const p of beat.prose) {
            expect(p).toContain('{location}');
          }
        }
        expect(t.vocabulary.adjectives.length).toBeGreaterThan(0);
        expect(t.vocabulary.verbs.length).toBeGreaterThan(0);
        expect(t.vocabulary.nouns.length).toBeGreaterThan(0);
        expect(t.vocabulary.atmosphere.length).toBeGreaterThan(0);
      }
    },
  );

  it('existing breach/convergence/reckoning templates are unaffected', () => {
    expect(getDoomEchoTemplates('breach', 0).length).toBeGreaterThan(0);
    expect(getDoomEchoTemplates('convergence', 0).length).toBeGreaterThan(0);
    expect(getDoomEchoTemplates('reckoning', 0).length).toBeGreaterThan(0);
  });
});
