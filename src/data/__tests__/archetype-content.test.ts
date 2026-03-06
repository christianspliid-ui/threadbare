import { describe, it, expect } from 'vitest';
import { NARRATIVE_ARCHETYPES, getArchetype } from '../archetype-content';

describe('archetype-content', () => {
  it('exports exactly 19 archetypes', () => {
    expect(NARRATIVE_ARCHETYPES).toHaveLength(19);
  });

  it('each archetype has required fields', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.id).toBeTruthy();
      expect(arch.name).toBeTruthy();
      expect(arch.storyShape).toBeTruthy();
      expect(arch.proseTone).toBeTruthy();
      expect(arch.reachAffinities.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all archetype ids are unique', () => {
    const ids = NARRATIVE_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getArchetype returns correct archetype by id', () => {
    const hero = getArchetype('tragic_hero');
    expect(hero).toBeDefined();
    expect(hero!.name).toBe('Tragic Hero');
  });

  it('getArchetype returns undefined for unknown id', () => {
    expect(getArchetype('nonexistent')).toBeUndefined();
  });

  it('reach affinities use valid ReachDomain values', () => {
    const validDomains = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const reach of arch.reachAffinities) {
        expect(validDomains).toContain(reach);
      }
    }
  });
});
