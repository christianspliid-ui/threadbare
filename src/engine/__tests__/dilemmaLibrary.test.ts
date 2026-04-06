import { describe, it, expect } from 'vitest';
import { ENRICHED_DILEMMA_LIBRARY, DILEMMA_BY_ID } from '../../data/meeting-dilemma-library';

describe('meeting-dilemma-library', () => {
  it('has at least 140 templates', () => {
    expect(ENRICHED_DILEMMA_LIBRARY.length).toBeGreaterThanOrEqual(140);
  });

  it('has all four categories', () => {
    const categories = new Set(ENRICHED_DILEMMA_LIBRARY.map(t => t.category));
    expect(categories).toContain('axiological');
    expect(categories).toContain('reach_specific');
    expect(categories).toContain('domain_specific');
    expect(categories).toContain('general');
  });

  it('has no references to deprecated reaches or pairs', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.targetReach).not.toBe('flesh');
      expect(t.targetValuePair).not.toBe('frankness_propriety');
      expect(t.targetValuePair).not.toBe('humility_pride');
      expect(t.targetValuePair).not.toBe('stoicism_passion');
      for (const c of t.choices) {
        const shiftKeys = Object.keys(c.axiologicalShifts || {});
        expect(shiftKeys).not.toContain('frankness_propriety');
        expect(shiftKeys).not.toContain('humility_pride');
        expect(shiftKeys).not.toContain('stoicism_passion');
      }
    }
  });

  it('every template has 2+ choices with gateTags', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of t.choices) {
        expect(c.gateTags).toBeDefined();
        expect(c.gateTags.length).toBeGreaterThan(0);
      }
    }
  });

  it('every template has a resonance field', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.resonance).toBeDefined();
      expect(t.resonance.emotionalRegister).toBeDefined();
      expect(t.resonance.hungerResonance).toBeDefined();
      expect(t.resonance.driveResonance).toBeDefined();
      expect(t.resonance.incompatibleWith).toBeDefined();
    }
  });

  it('has reasonable category distribution', () => {
    const counts: Record<string, number> = {};
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    expect(counts['axiological']).toBeGreaterThanOrEqual(40);
    expect(counts['reach_specific']).toBeGreaterThanOrEqual(35);
    expect(counts['domain_specific']).toBeGreaterThanOrEqual(35);
    expect(counts['general']).toBeGreaterThanOrEqual(30);
  });

  it('DILEMMA_BY_ID lookup contains all templates', () => {
    expect(DILEMMA_BY_ID.size).toBe(ENRICHED_DILEMMA_LIBRARY.length);
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(DILEMMA_BY_ID.get(t.id)).toBe(t);
    }
  });

  it('all template IDs are unique', () => {
    const ids = ENRICHED_DILEMMA_LIBRARY.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all choice IDs are unique within each template', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      const choiceIds = t.choices.map(c => c.id);
      const uniqueChoiceIds = new Set(choiceIds);
      expect(uniqueChoiceIds.size).toBe(choiceIds.length);
    }
  });

  it('every template has non-empty setup prose', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      expect(t.setup.length).toBeGreaterThan(50);
    }
  });

  it('axiological templates have targetValuePair set', () => {
    const axiological = ENRICHED_DILEMMA_LIBRARY.filter(t => t.category === 'axiological');
    for (const t of axiological) {
      expect(t.targetValuePair).toBeDefined();
      expect(t.targetValuePair!.length).toBeGreaterThan(0);
    }
  });

  it('reach-specific templates have targetReach set', () => {
    const reachSpecific = ENRICHED_DILEMMA_LIBRARY.filter(t => t.category === 'reach_specific');
    for (const t of reachSpecific) {
      expect(t.targetReach).toBeDefined();
      expect(t.targetReach!.length).toBeGreaterThan(0);
    }
  });

  it('domain-specific templates have targetSphere set', () => {
    const domainSpecific = ENRICHED_DILEMMA_LIBRARY.filter(t => t.category === 'domain_specific');
    for (const t of domainSpecific) {
      expect(t.targetSphere).toBeDefined();
      expect(t.targetSphere!.length).toBeGreaterThan(0);
    }
  });

  it('no template contains raw Notion link artifacts', () => {
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      // Should not contain [agent.name](http://agent.name) pattern
      expect(t.setup).not.toContain('](http://agent');
      for (const c of t.choices) {
        expect(c.text).not.toContain('](http://agent');
      }
    }
  });
});
