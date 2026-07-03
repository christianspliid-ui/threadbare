/**
 * Tests for scale-based resolution adjustment helpers (THR-451).
 *
 * Covers:
 * - Scale offset applied to difficulty
 * - Per-scale probability floor (via difficulty cap)
 * - Critical failure gating by scale
 * - Fail-soft: undefined scale treated as 'regional'
 */

import { describe, test, expect } from 'vitest';
import {
  applyScaleDifficultyAdjust,
  resolveCritFailureSeverity,
  SCALE_DIFFICULTY_OFFSETS,
  MIN_PROBABILITY_BY_SCALE,
  CRIT_FAILURE_SEVERITY_BY_SCALE,
} from '../resolutionScaleAdjust';

// ─── Constants shape ────────────────────────────────────────────────

describe('SCALE_DIFFICULTY_OFFSETS', () => {
  test('personal is negative (easier)', () => {
    expect(SCALE_DIFFICULTY_OFFSETS.personal).toBeLessThan(0);
  });

  test('local is negative (easier)', () => {
    expect(SCALE_DIFFICULTY_OFFSETS.local).toBeLessThan(0);
  });

  test('regional is neutral', () => {
    expect(SCALE_DIFFICULTY_OFFSETS.regional).toBe(0);
  });

  test('cosmic is positive (harder)', () => {
    expect(SCALE_DIFFICULTY_OFFSETS.cosmic).toBeGreaterThan(0);
  });
});

describe('CRIT_FAILURE_SEVERITY_BY_SCALE', () => {
  test('severity escalates with scale (personal/local minor → regional standard → cosmic severe)', () => {
    expect(CRIT_FAILURE_SEVERITY_BY_SCALE.personal).toBe('minor');
    expect(CRIT_FAILURE_SEVERITY_BY_SCALE.local).toBe('minor');
    expect(CRIT_FAILURE_SEVERITY_BY_SCALE.regional).toBe('standard');
    expect(CRIT_FAILURE_SEVERITY_BY_SCALE.cosmic).toBe('severe');
  });
});

// ─── applyScaleDifficultyAdjust ─────────────────────────────────────

describe('applyScaleDifficultyAdjust', () => {
  test('regional scale: no offset, no floor adjustment for moderate difficulty', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.5, 0, 0, 'regional');
    // offset = 0.00
    // maxDiffForFloor = 0.5 + 0 + 0 - 0.20 = 0.30 — floor is exactly met
    expect(result.scaleOffsetApplied).toBe(0);
    expect(result.adjustedDifficulty).toBeCloseTo(0.3, 5);
  });

  test('personal scale: applies -0.20 offset', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.75, 0, 0, 'personal');
    // offset = -0.20, so 0.3 - 0.20 = 0.10
    // floor check: maxDiff = max(0, 0.75 - 0.70) = 0.05; 0.10 > 0.05 → floor applied
    expect(result.scaleOffsetApplied).toBeCloseTo(-0.20, 5);
    expect(result.scaleFloorApplied).toBe(true);
    expect(result.adjustedDifficulty).toBeCloseTo(0.05, 5); // clamped to 0.75 - 0.70
  });

  test('local scale: applies -0.10 offset', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.75, 0, 0, 'local');
    // offset = -0.10, so 0.3 - 0.10 = 0.20
    // floor check: maxDiff = max(0, 0.75 - 0.65) = 0.10; 0.20 > 0.10 → floor applied
    expect(result.scaleOffsetApplied).toBeCloseTo(-0.10, 5);
    expect(result.scaleFloorApplied).toBe(true);
    expect(result.adjustedDifficulty).toBeCloseTo(0.10, 5); // clamped to 0.75 - 0.65
  });

  test('cosmic scale: applies +0.10 offset, no floor for high-capability actor', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.8, 0, 0, 'cosmic');
    // offset = +0.10, so 0.3 + 0.10 = 0.40
    // floor = 0.05 (PROBABILITY_FLOOR for cosmic); maxDiff = 0.8 - 0.05 = 0.75; 0.40 < 0.75
    expect(result.scaleOffsetApplied).toBeCloseTo(0.10, 5);
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(0.40, 5);
  });

  test('undefined scale treated as regional (no offset)', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.5, 0, 0, undefined);
    expect(result.scaleOffsetApplied).toBe(0);
  });

  test('floor not applied when difficulty is already below the cap', () => {
    // With high capability, floor is easy to exceed; low difficulty should not trigger floor
    const result = applyScaleDifficultyAdjust(0.05, 0.9, 0, 0, 'personal');
    // offset: -0.20 → adjusted = 0.05 - 0.20 = -0.15
    // maxDiff = 0.9 - 0.45 = 0.45; -0.15 < 0.45 → no floor applied
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(-0.15, 5);
  });

  test('scaleFloorApplied is true when difficulty after offset exceeds floor cap', () => {
    // Moderate actor, high difficulty, personal scale
    const result = applyScaleDifficultyAdjust(0.7, 0.75, 0, 0, 'personal');
    // offset: -0.20 → 0.7 - 0.20 = 0.50
    // maxDiff = max(0, 0.75 - 0.70) = 0.05; 0.50 > 0.05 → floor applied
    expect(result.scaleFloorApplied).toBe(true);
    expect(result.adjustedDifficulty).toBeCloseTo(0.05, 5); // clamped to 0.75 - 0.70
  });

  test('sphere factor and mods count toward probability computation', () => {
    // sphere + mods = 0.2 effectively lowers needed cap
    const result = applyScaleDifficultyAdjust(0.5, 0.6, 0.1, 0.1, 'personal');
    // offset: -0.20 → 0.50 - 0.20 = 0.30
    // effective = 0.6+0.1+0.1=0.80; maxDiff = max(0, 0.80 - 0.70) = 0.10; 0.30 > 0.10 → floor applied
    expect(result.scaleFloorApplied).toBe(true);
    expect(result.adjustedDifficulty).toBeCloseTo(0.10, 5); // clamped to 0.80 - 0.70
  });
});

// ─── resolveCritFailureSeverity (THR-571 E2) ────────────────────────

describe('resolveCritFailureSeverity', () => {
  test('personal scale → minor consequence tier', () => {
    expect(resolveCritFailureSeverity('personal')).toBe('minor');
  });

  test('local scale → minor consequence tier', () => {
    expect(resolveCritFailureSeverity('local')).toBe('minor');
  });

  test('regional scale → standard consequence tier', () => {
    expect(resolveCritFailureSeverity('regional')).toBe('standard');
  });

  test('cosmic scale → severe consequence tier', () => {
    expect(resolveCritFailureSeverity('cosmic')).toBe('severe');
  });

  test('undefined scale treated as regional → standard', () => {
    expect(resolveCritFailureSeverity(undefined)).toBe('standard');
  });
});

// ─── MIN_PROBABILITY_BY_SCALE ordering ─────────────────────────────

describe('MIN_PROBABILITY_BY_SCALE ordering', () => {
  test('personal floor > local floor > regional floor', () => {
    expect(MIN_PROBABILITY_BY_SCALE.personal).toBeGreaterThan(MIN_PROBABILITY_BY_SCALE.local);
    expect(MIN_PROBABILITY_BY_SCALE.local).toBeGreaterThan(MIN_PROBABILITY_BY_SCALE.regional);
  });
});
