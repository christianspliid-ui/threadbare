import { describe, it, expect } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  migrateActionTemplate,
  migrateEncounterTemplate,
  getUnifiedTemplateById,
} from '../unified-action-templates';
import { ACTION_TEMPLATES } from '../action-template-content';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Migration helpers ────────────────────────────────────────────

describe('migrateActionTemplate', () => {
  it('produces exactly 1 step per action template', () => {
    for (const old of ACTION_TEMPLATES) {
      const unified = migrateActionTemplate(old);
      expect(unified.steps).toHaveLength(1);
    }
  });

  it('preserves id, name, reach, crudType', () => {
    const old = ACTION_TEMPLATES[0];
    const unified = migrateActionTemplate(old);
    expect(unified.id).toBe(old.id);
    expect(unified.name).toBe(old.name);
    expect(unified.reach).toBe(old.reach);
    expect(unified.crudType).toBe(old.crudType);
  });

  it('maps faction affinity to regional scale', () => {
    const factionTemplate = {
      ...ACTION_TEMPLATES[0],
      id: 'test.faction',
      actorAffinities: ['faction' as const],
    };
    const unified = migrateActionTemplate(factionTemplate);
    expect(unified.scale).toBe('regional');
  });

  it('maps individual-only affinity to personal scale', () => {
    // Create a synthetic individual-only template for the test
    const individualTemplate = {
      ...ACTION_TEMPLATES[0],
      id: 'test.individual',
      actorAffinities: ['individual' as const],
    };
    const unified = migrateActionTemplate(individualTemplate);
    expect(unified.scale).toBe('personal');
  });

  it('defaults to regional scale when no affinity set', () => {
    const noAffinityTemplate = { ...ACTION_TEMPLATES[0], id: 'test.noaffinity', actorAffinities: undefined };
    const unified = migrateActionTemplate(noAffinityTemplate);
    expect(unified.scale).toBe('regional');
  });

  it('preserves step difficulty, duration, and GraphOps', () => {
    const old = ACTION_TEMPLATES[0];
    const unified = migrateActionTemplate(old);
    const step = unified.steps[0];
    expect(step.difficulty).toBe(old.difficulty);
    expect(step.duration.min).toBe(old.durationRange.min);
    expect(step.duration.max).toBe(old.durationRange.max);
    expect(step.onSuccess).toEqual(old.onSuccess);
    expect(step.onFailure).toEqual(old.onFailure);
  });

  it('apCost is 1', () => {
    const unified = migrateActionTemplate(ACTION_TEMPLATES[0]);
    expect(unified.apCost).toBe(1);
  });
});

describe('migrateEncounterTemplate', () => {
  it('converts each encounter step to an ActionStep with difficulty 0-1', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      const unified = migrateEncounterTemplate(enc);
      for (const step of unified.steps) {
        expect(step.difficulty).toBeGreaterThanOrEqual(0);
        expect(step.difficulty).toBeLessThanOrEqual(1);
      }
    }
  });

  it('step count matches original encounter step count', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      const unified = migrateEncounterTemplate(enc);
      expect(unified.steps).toHaveLength(enc.steps.length);
    }
  });

  it('scale is always local', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      const unified = migrateEncounterTemplate(enc);
      expect(unified.scale).toBe('local');
    }
  });

  it('reach is reachPrimary from the encounter', () => {
    const enc = ENCOUNTER_TEMPLATES[0];
    const unified = migrateEncounterTemplate(enc);
    expect(unified.reach).toBe(enc.reachPrimary);
  });

  it('actorAffinities is [individual]', () => {
    const unified = migrateEncounterTemplate(ENCOUNTER_TEMPLATES[0]);
    expect(unified.actorAffinities).toContain('individual');
  });
});

// ─── Unified template registry ────────────────────────────────────

describe('UNIFIED_ACTION_TEMPLATES', () => {
  it('has no duplicate IDs', () => {
    const ids = UNIFIED_ACTION_TEMPLATES.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has at least 1 motivation OR is a divine template', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      if (t.scale !== 'cosmic') {
        expect(t.motivations.length).toBeGreaterThan(0);
      }
    }
  });

  it('every step has difficulty in [0, 1]', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of t.steps) {
        expect(step.difficulty).toBeGreaterThanOrEqual(0);
        expect(step.difficulty).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every step has duration.min <= duration.max', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of t.steps) {
        expect(step.duration.min).toBeLessThanOrEqual(step.duration.max);
      }
    }
  });

  it('every step has duration.min >= 1', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of t.steps) {
        expect(step.duration.min).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('all 43 action templates are present', () => {
    const actionCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('action.')).length;
    expect(actionCount).toBe(43);
  });

  it('all encounter templates are present', () => {
    const encounterCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.')).length;
    expect(encounterCount).toBe(ENCOUNTER_TEMPLATES.length);
  });

  it('all 8 divine templates are present', () => {
    const divineCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('divine.')).length;
    expect(divineCount).toBe(8);
  });

  it('total template count is at least 54', () => {
    expect(UNIFIED_ACTION_TEMPLATES.length).toBeGreaterThanOrEqual(54);
  });
});

describe('getUnifiedTemplateById', () => {
  it('returns template by exact id', () => {
    const first = UNIFIED_ACTION_TEMPLATES[0];
    const result = getUnifiedTemplateById(first.id);
    expect(result).toBe(first);
  });

  it('returns undefined for unknown id', () => {
    expect(getUnifiedTemplateById('nonexistent.action')).toBeUndefined();
  });
});

// ─── Divine templates ────────────────────────────────────────────

describe('divine templates', () => {
  const divineTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('divine.'));

  it('all have scale cosmic', () => {
    for (const t of divineTemplates) {
      expect(t.scale).toBe('cosmic');
    }
  });

  it('all have essenceCost > 0', () => {
    for (const t of divineTemplates) {
      expect(t.essenceCost).toBeDefined();
      expect(t.essenceCost!).toBeGreaterThan(0);
    }
  });

  it('all have actorAffinities containing ascendant', () => {
    for (const t of divineTemplates) {
      expect(t.actorAffinities).toContain('ascendant');
    }
  });

  it('each step onSuccess contains exactly 1 apply_influence GraphOp', () => {
    for (const t of divineTemplates) {
      for (const step of t.steps) {
        expect(step.onSuccess).toHaveLength(1);
        expect(step.onSuccess[0].op).toBe('apply_influence');
        expect(step.onSuccess[0].influence).toBeDefined();
      }
    }
  });

  it('all have 1 step with duration {min:1, max:1}', () => {
    for (const t of divineTemplates) {
      expect(t.steps).toHaveLength(1);
      expect(t.steps[0].duration).toEqual({ min: 1, max: 1 });
    }
  });

  it('covers all 8 intervention types', () => {
    const interventionTypes = divineTemplates
      .flatMap(t => t.steps)
      .flatMap(s => s.onSuccess)
      .map(op => op.influence?.interventionType)
      .filter(Boolean);
    expect(interventionTypes).toContain('dream');
    expect(interventionTypes).toContain('persuade');
    expect(interventionTypes).toContain('deceive');
    expect(interventionTypes).toContain('intimidate');
    expect(interventionTypes).toContain('inspire_intervention');
    expect(interventionTypes).toContain('coincidence');
    expect(interventionTypes).toContain('omen');
    expect(interventionTypes).toContain('afflict_bless');
  });
});
