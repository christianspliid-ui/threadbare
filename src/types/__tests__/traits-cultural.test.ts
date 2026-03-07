import { describe, it, expect } from 'vitest';
import type { TraitCategory, TraitDefinitionProperties } from '../traits';

describe('cultural trait category', () => {
  it('accepts cultural as a valid TraitCategory', () => {
    const cat: TraitCategory = 'cultural';
    expect(cat).toBe('cultural');
  });

  it('TraitDefinitionProperties supports strengthThresholds', () => {
    const def: TraitDefinitionProperties = {
      subcategory: 'cultural',
      description: 'Test cultural trait',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: 2 },
      tags: ['test'],
      flavorText: 'Test',
      strengthThresholds: {
        fanatical: 'Extreme expression',
        strong: 'Clear expression',
        fading: 'Faint expression',
        silent: 'Dormant',
      },
    };
    expect(def.subcategory).toBe('cultural');
    expect(def.strengthThresholds?.fanatical).toBe('Extreme expression');
  });
});
