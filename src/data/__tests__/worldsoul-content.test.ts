import { describe, it, expect } from 'vitest';
import { FUNDAMENT_DESCRIPTIONS, RESONANCE_FRAGMENT_PROSE } from '../worldsoul-content';

describe('worldsoul-content', () => {
  // ─── Fundament Descriptions ──────────────────────────────────────

  it('should have 12 fundament coefficient descriptions (4 foundations + 8 creations)', () => {
    expect(Object.keys(FUNDAMENT_DESCRIPTIONS)).toHaveLength(12);
  });

  it('should have all required sphere keys', () => {
    const requiredKeys = [
      // 4 Foundation spheres
      'chaos',
      'order',
      'light',
      'darkness',
      // 8 Creation spheres
      'force',
      'matter',
      'energy',
      'life',
      'mind',
      'spirit',
      'time',
      'entropy',
    ];
    for (const key of requiredKeys) {
      expect(FUNDAMENT_DESCRIPTIONS).toHaveProperty(key);
    }
  });

  it('each fundament description should have high and low variants', () => {
    for (const [key, desc] of Object.entries(FUNDAMENT_DESCRIPTIONS)) {
      expect(desc, `${key} should have high property`).toHaveProperty('high');
      expect(desc, `${key} should have low property`).toHaveProperty('low');
      expect(typeof desc.high, `${key}.high should be string`).toBe('string');
      expect(typeof desc.low, `${key}.low should be string`).toBe('string');
    }
  });

  it('each fundament variant should be non-empty and substantial (>20 chars)', () => {
    for (const [key, desc] of Object.entries(FUNDAMENT_DESCRIPTIONS)) {
      expect(desc.high.length, `${key} high variant too short`).toBeGreaterThan(20);
      expect(desc.low.length, `${key} low variant too short`).toBeGreaterThan(20);
    }
  });

  it('each fundament variant should feel thematically distinct (high vs low)', () => {
    for (const [key, desc] of Object.entries(FUNDAMENT_DESCRIPTIONS)) {
      // High and low should not be identical
      expect(desc.high, `${key} high and low are identical`).not.toBe(desc.low);
      // Both should be non-empty after trimming
      expect(desc.high.trim().length).toBeGreaterThan(0);
      expect(desc.low.trim().length).toBeGreaterThan(0);
    }
  });

  // ─── Resonance Fragment Prose ────────────────────────────────────

  it('should have 8 resonance fragment prose templates', () => {
    expect(RESONANCE_FRAGMENT_PROSE).toHaveLength(8);
  });

  it('each resonance fragment should be non-empty string', () => {
    for (const fragment of RESONANCE_FRAGMENT_PROSE) {
      expect(typeof fragment).toBe('string');
      expect(fragment.length).toBeGreaterThan(10);
    }
  });

  it('resonance fragments should feel ancient and haunting', () => {
    // Check that fragments have some narrative substance
    for (const fragment of RESONANCE_FRAGMENT_PROSE) {
      expect(fragment.length).toBeGreaterThan(30);
      // Should generally not be all caps (boring)
      const hasLowercase = /[a-z]/.test(fragment);
      expect(hasLowercase).toBe(true);
    }
  });

  it('resonance fragments should be able to reference world context', () => {
    // At least some fragments should have template variables (e.g., {sphere}, {actor})
    const fragmentsWithVars = RESONANCE_FRAGMENT_PROSE.filter(
      (f) => f.includes('{') && f.includes('}')
    );
    expect(fragmentsWithVars.length).toBeGreaterThan(0);
  });
});
