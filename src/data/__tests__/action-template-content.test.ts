import { describe, it, expect } from 'vitest';
import {
  ACTION_TEMPLATES,
  getActionTemplateById,
  getActionsByReach,
  getActionsByCrudType,
} from '../action-template-content';

describe('action-template-content', () => {
  it('should export action templates', () => {
    expect(ACTION_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have templates for all reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
    for (const reach of reaches) {
      const templates = getActionsByReach(reach);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it('should have templates for all CRUD types', () => {
    const crudTypes = ['create', 'read', 'update', 'delete'];
    for (const crud of crudTypes) {
      const templates = getActionsByCrudType(crud);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it('should have IDs matching world-model.json pattern', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.id).toMatch(/^action\.\w+\.\w[\w-]*$/);
    }
  });

  it('every template should have motivations (1-3 value pairs)', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.motivations.length).toBeGreaterThanOrEqual(1);
      expect(t.motivations.length).toBeLessThanOrEqual(3);
    }
  });

  it('every template should have duration range with min <= max', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.durationRange.min).toBeLessThanOrEqual(t.durationRange.max);
      expect(t.durationRange.min).toBeGreaterThan(0);
    }
  });

  it('every template should have at least one success and one failure GraphOp', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.onSuccess.length).toBeGreaterThanOrEqual(1);
      expect(t.onFailure.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every template should have narrative templates for initiation, success, failure', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.narrativeTemplates.initiation).toBeTruthy();
      expect(t.narrativeTemplates.success).toBeTruthy();
      expect(t.narrativeTemplates.failure).toBeTruthy();
    }
  });

  it('difficulty should be in 0-1 range', () => {
    for (const t of ACTION_TEMPLATES) {
      expect(t.difficulty).toBeGreaterThanOrEqual(0);
      expect(t.difficulty).toBeLessThanOrEqual(1);
    }
  });

  it('getActionTemplateById should return correct template', () => {
    const t = getActionTemplateById('action.iron.raise-force');
    expect(t).toBeDefined();
    expect(t?.name).toBe('Raise Force');
    expect(t?.reach).toBe('iron');
    expect(t?.crudType).toBe('create');
  });

  it('getActionTemplateById should return undefined for unknown ID', () => {
    expect(getActionTemplateById('nonexistent')).toBeUndefined();
  });

  it('unique IDs across all templates', () => {
    const ids = new Set(ACTION_TEMPLATES.map(t => t.id));
    expect(ids.size).toBe(ACTION_TEMPLATES.length);
  });
});
