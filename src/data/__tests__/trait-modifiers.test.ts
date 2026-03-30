import { describe, it, expect } from 'vitest';
import { LOS_TRAIT_DEFINITIONS, getLOSTraitModifiers } from '../trait-modifiers';

describe('LOS trait definitions', () => {
  it('exports at least 3 LOS-modifying trait definitions', () => {
    expect(LOS_TRAIT_DEFINITIONS.length).toBeGreaterThanOrEqual(3);
  });

  it('each definition has required fields', () => {
    for (const def of LOS_TRAIT_DEFINITIONS) {
      expect(def.traitId).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(typeof def.modifiers.los_range).toBe('number');
      expect(def.description).toBeTruthy();
    }
  });

  it('Eagle-Eyed grants +1 los_range', () => {
    const eagle = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.innate.eagle-eyed');
    expect(eagle).toBeDefined();
    expect(eagle!.modifiers.los_range).toBe(1);
  });

  it('Night Blind gives -1 los_range', () => {
    const blind = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.scar.night-blind');
    expect(blind).toBeDefined();
    expect(blind!.modifiers.los_range).toBe(-1);
  });

  it('Far Sight grants +2 los_range', () => {
    const far = LOS_TRAIT_DEFINITIONS.find(d => d.traitId === 'trait.mastery.far-sight');
    expect(far).toBeDefined();
    expect(far!.modifiers.los_range).toBe(2);
  });

  it('getLOSTraitModifiers returns modifiers for known trait', () => {
    const mods = getLOSTraitModifiers('trait.innate.eagle-eyed');
    expect(mods).toEqual({ los_range: 1 });
  });

  it('getLOSTraitModifiers returns empty for unknown trait', () => {
    const mods = getLOSTraitModifiers('trait.nonexistent');
    expect(mods).toEqual({});
  });

  it('trait IDs follow naming convention', () => {
    for (const def of LOS_TRAIT_DEFINITIONS) {
      expect(def.traitId).toMatch(/^trait\.\w+\.\w[\w-]*$/);
    }
  });
});
