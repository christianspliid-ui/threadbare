import { describe, it, expect } from 'vitest';
import {
  RIVAL_NAME_PREFIXES,
  RIVAL_NAME_SUFFIXES,
  BEHAVIORS,
  BEHAVIOR_WEIGHTS,
  RIVAL_PERSONALITY_PROFILES,
} from '../rival-content';

describe('rival-content', () => {
  it('exports 12 name prefixes', () => {
    expect(RIVAL_NAME_PREFIXES).toHaveLength(12);
  });

  it('exports 12 name suffixes', () => {
    expect(RIVAL_NAME_SUFFIXES).toHaveLength(12);
  });

  it('all prefixes are unique', () => {
    expect(new Set(RIVAL_NAME_PREFIXES).size).toBe(RIVAL_NAME_PREFIXES.length);
  });

  it('all suffixes are unique', () => {
    expect(new Set(RIVAL_NAME_SUFFIXES).size).toBe(RIVAL_NAME_SUFFIXES.length);
  });

  it('exports 4 behaviors', () => {
    expect(BEHAVIORS).toHaveLength(4);
  });

  it('exports behavior weights for all 4 behaviors', () => {
    expect(Object.keys(BEHAVIOR_WEIGHTS)).toHaveLength(4);
    for (const weights of Object.values(BEHAVIOR_WEIGHTS)) {
      const sum = Object.values(weights).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });
});

describe('rival personality profiles', () => {
  it('should have 8 profiles', () => {
    expect(RIVAL_PERSONALITY_PROFILES).toHaveLength(8);
  });

  it('each profile should have id, name, sphereAffinities, taunts, reactions, and description', () => {
    for (const profile of RIVAL_PERSONALITY_PROFILES) {
      expect(profile.id.length).toBeGreaterThan(0);
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.sphereAffinities.length).toBeGreaterThanOrEqual(1);
      expect(profile.taunts).toHaveLength(3);
      expect(profile.reactions).toHaveLength(2);
      expect(profile.description.length).toBeGreaterThan(20);
    }
  });

  it('each profile should have a unique id', () => {
    const ids = RIVAL_PERSONALITY_PROFILES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each profile should have a unique name', () => {
    const names = RIVAL_PERSONALITY_PROFILES.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('reactions should have thwarted and succeeded entries', () => {
    for (const profile of RIVAL_PERSONALITY_PROFILES) {
      const reactionKeys = profile.reactions.map(r => r.type);
      expect(reactionKeys).toContain('thwarted');
      expect(reactionKeys).toContain('succeeded');
    }
  });

  it('each taunt should be 1-3 sentences', () => {
    for (const profile of RIVAL_PERSONALITY_PROFILES) {
      for (const taunt of profile.taunts) {
        const sentenceCount = (taunt.match(/[.!?]/g) || []).length;
        expect(sentenceCount).toBeGreaterThanOrEqual(1);
        expect(sentenceCount).toBeLessThanOrEqual(3);
      }
    }
  });
});
