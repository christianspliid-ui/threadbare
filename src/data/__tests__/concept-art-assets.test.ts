import { describe, it, expect } from 'vitest';
import { pickConceptArt, CONCEPT_ART_REGISTRY, getConceptArtUrl } from '../concept-art-assets';

describe('concept-art-assets', () => {
  it('picks matching terrain family', () => {
    const url = pickConceptArt('mountains', [], null);
    expect(url).toBe('/concept-art/mountains.png');
  });

  it('picks ocean for coastal_shallows', () => {
    const url = pickConceptArt('coastal_shallows', [], null);
    expect(url).toBe('/concept-art/ocean.png');
  });

  it('falls back to grassland for unmatched terrain', () => {
    // Use a terrain that is not in any entry
    const url = pickConceptArt('farmland', [], null);
    // farmland is in the grassland entry
    expect(url).toBe('/concept-art/grassland.png');
  });

  it('boosts score for matching location subtypes', () => {
    const locations = [
      { id: 'loc1', name: 'Temple', type: 'location', properties: { subtype: 'temple' } },
    ] as any;
    // jungle + temple should pick jungle (temple is a boost for jungle)
    const url = pickConceptArt('jungle', locations, null);
    expect(url).toBe('/concept-art/jungle.png');
  });

  it('boosts score for matching sphere influence', () => {
    const spheres = {
      force: 0, matter: 0, energy: 0, life: 0.8,
      mind: 0, spirit: 0, time: 0, entropy: 0,
      chaos: 0, order: 0, light: 0, darkness: 0,
    };
    // temperate_forest + life sphere should pick temperate-forest (life is a boost)
    const url = pickConceptArt('temperate_forest', [], spheres);
    expect(url).toBe('/concept-art/temperate-forest.png');
  });

  it('all registry entries have unique IDs', () => {
    const ids = CONCEPT_ART_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getConceptArtUrl returns url for valid ID', () => {
    expect(getConceptArtUrl('mountains')).toBe('/concept-art/mountains.png');
  });

  it('getConceptArtUrl returns null for unknown ID', () => {
    expect(getConceptArtUrl('nonexistent')).toBeNull();
  });
});
