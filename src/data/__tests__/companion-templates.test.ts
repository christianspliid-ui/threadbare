import { describe, it, expect } from 'vitest';
import {
  COMPANION_TEMPLATES,
  COMPANION_CONTRIBUTION_RANGE,
  COMPANION_MAX,
  getCompanionTemplate,
  filterCompanionTemplates,
} from '../companion-templates';
import { REACH_DOMAINS } from '../../types/traits';

describe('companion template library', () => {
  it('ships the designed roster — 8 professions plus at least one unique', () => {
    const professions = COMPANION_TEMPLATES.filter(t => !t.unique);
    const uniques = COMPANION_TEMPLATES.filter(t => t.unique);
    expect(professions).toHaveLength(8);
    expect(uniques.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps every contribution inside COMPANION_CONTRIBUTION_RANGE', () => {
    // The authoring guardrail: companions nudge a roll, they do not decide it.
    // The agent-scale band starts at 4; every value here must sit below it.
    for (const template of COMPANION_TEMPLATES) {
      const values = Object.values(template.domainContributions);
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) {
        expect(value).toBeGreaterThanOrEqual(COMPANION_CONTRIBUTION_RANGE.min);
        expect(value).toBeLessThanOrEqual(COMPANION_CONTRIBUTION_RANGE.max);
      }
    }
  });

  it('only contributes to real reaches', () => {
    for (const template of COMPANION_TEMPLATES) {
      for (const reach of Object.keys(template.domainContributions)) {
        expect(REACH_DOMAINS).toContain(reach);
      }
    }
  });

  it('gives every template a cause→change sentence pair with a name slot', () => {
    for (const template of COMPANION_TEMPLATES) {
      expect(template.joinSentence.trim().length).toBeGreaterThan(0);
      expect(template.departSentence.trim().length).toBeGreaterThan(0);
      // A unique carries its own fixed name in the prose; a profession needs the slot.
      if (!template.unique) {
        expect(template.joinSentence).toContain('{name}');
        expect(template.departSentence).toContain('{name}');
      }
    }
  });

  it('gives every template a goodFor line the player can read', () => {
    for (const template of COMPANION_TEMPLATES) {
      expect(template.goodFor.trim().length).toBeGreaterThan(0);
      expect(template.profession.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses unique template ids', () => {
    const ids = COMPANION_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every unique a fixed name, and no profession one', () => {
    for (const template of COMPANION_TEMPLATES) {
      if (template.unique) expect(template.fixedName).toBeTruthy();
      else expect(template.fixedName).toBeUndefined();
    }
  });

  it('keeps the cap a positive tunable', () => {
    expect(COMPANION_MAX).toBeGreaterThan(0);
  });
});

describe('companion template lookup', () => {
  it('finds a template by id', () => {
    expect(getCompanionTemplate('companion.wayfarer')?.profession).toBe('Wayfarer');
  });

  it('returns null for an unknown id rather than throwing', () => {
    expect(getCompanionTemplate('companion.nope')).toBeNull();
  });

  it('excludes uniques from pool candidates — they are authored grants only', () => {
    const pool = filterCompanionTemplates();
    expect(pool.every(t => !t.unique)).toBe(true);
    expect(pool).toHaveLength(8);
  });

  it('narrows pool candidates by tag', () => {
    const road = filterCompanionTemplates(['road']);
    expect(road.length).toBeGreaterThan(0);
    expect(road.every(t => t.tags.includes('road'))).toBe(true);
    expect(road.length).toBeLessThan(COMPANION_TEMPLATES.length);
  });

  it('returns nothing for a tag no template carries', () => {
    expect(filterCompanionTemplates(['not-a-real-tag'])).toHaveLength(0);
  });
});
