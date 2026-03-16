import { describe, it, expect } from 'vitest';
import { AMBITION_TEMPLATES, REACTIVE_AMBITION_TEMPLATES } from '../ambition-templates';
import { REACH_DOMAINS } from '../../types/traits';

describe('AMBITION_TEMPLATES', () => {
  it('has at least 8 templates', () => {
    expect(AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it('has unique IDs', () => {
    const ids = AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has at least one reach floor', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(Object.keys(t.reachFloors).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every reach floor references a valid reach domain', () => {
    for (const t of AMBITION_TEMPLATES) {
      for (const reach of Object.keys(t.reachFloors)) {
        expect(REACH_DOMAINS).toContain(reach);
      }
    }
  });

  it('every reach affinity references a valid reach domain', () => {
    for (const t of AMBITION_TEMPLATES) {
      for (const reach of Object.keys(t.reachAffinity)) {
        expect(REACH_DOMAINS).toContain(reach);
      }
    }
  });

  it('every template has at least 2 milestones', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.milestones.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('completion requires <= total milestones', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.completion.requires).toBeLessThanOrEqual(t.completion.of);
      expect(t.completion.of).toBe(t.milestones.length);
    }
  });

  it('has selection and completion prose', () => {
    for (const t of AMBITION_TEMPLATES) {
      expect(t.selectionProse.length).toBeGreaterThanOrEqual(1);
      expect(t.completionProse.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers at least 5 different categories', () => {
    const categories = new Set(AMBITION_TEMPLATES.map((t) => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});

describe('REACTIVE_AMBITION_TEMPLATES', () => {
  it('has at least 3 templates', () => {
    expect(REACTIVE_AMBITION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('each has a triggerEvent', () => {
    for (const t of REACTIVE_AMBITION_TEMPLATES) {
      expect(t.triggerEvent).toBeDefined();
    }
  });

  it('has unique IDs', () => {
    const ids = REACTIVE_AMBITION_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
