import { describe, it, expect } from 'vitest';
import type { TraitCategory, TraitAssignmentProperties } from '../traits';

describe('TraitCategory', () => {
  it('accepts bestowed as a valid TraitCategory', () => {
    const cat: TraitCategory = 'bestowed';
    expect(cat).toBe('bestowed');
  });

  it('accepts all valid TraitCategory values', () => {
    const categories: TraitCategory[] = [
      'innate',
      'mastery',
      'reputation',
      'scar',
      'condition',
      'destiny',
      'cultural',
      'bestowed',
    ];
    expect(categories).toHaveLength(8);
    expect(categories).toContain('bestowed');
  });
});

describe('TraitAssignmentProperties', () => {
  it('supports ticksRemaining as a number', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'blessing',
      visibility: 'public',
      ticksRemaining: 50,
    };
    expect(props.ticksRemaining).toBe(50);
  });

  it('supports ticksRemaining as null (permanent)', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'blessing',
      visibility: 'public',
      ticksRemaining: null,
    };
    expect(props.ticksRemaining).toBeNull();
  });

  it('supports ticksRemaining as undefined (no decay)', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'blessing',
      visibility: 'public',
      ticksRemaining: undefined,
    };
    expect(props.ticksRemaining).toBeUndefined();
  });

  it('supports modifiers as a Record<string, number>', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'blessing',
      visibility: 'public',
      modifiers: {
        'iron.capability': 2,
        'heart.capability': -1,
        'veil.capability': 1.5,
      },
    };
    expect(props.modifiers).toEqual({
      'iron.capability': 2,
      'heart.capability': -1,
      'veil.capability': 1.5,
    });
    expect(props.modifiers?.['iron.capability']).toBe(2);
  });

  it('supports both ticksRemaining and modifiers together', () => {
    const props: TraitAssignmentProperties = {
      level: 2,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'blessing',
      visibility: 'discoverable',
      ticksRemaining: 75,
      modifiers: {
        'iron.capability': 3,
        'star.capability': 2,
      },
    };
    expect(props.ticksRemaining).toBe(75);
    expect(props.modifiers).toEqual({
      'iron.capability': 3,
      'star.capability': 2,
    });
  });

  it('works without optional fields (backward compatibility)', () => {
    const props: TraitAssignmentProperties = {
      level: 1,
      acquiredTick: 100,
      lastReinforcedTick: 150,
      source: 'innate',
      visibility: 'public',
    };
    expect(props.ticksRemaining).toBeUndefined();
    expect(props.modifiers).toBeUndefined();
  });
});
