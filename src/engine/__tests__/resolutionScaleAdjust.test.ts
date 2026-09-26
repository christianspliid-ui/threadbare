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
  SCALE_FLOOR_DIFFICULTY_CAP_ENABLED,
} from '../resolutionScaleAdjust';
import { PROBABILITY_FLOOR } from '../resolutionService';

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

  // THR-1581: the difficulty cap is switched off (SCALE_FLOOR_DIFFICULTY_CAP_ENABLED
  // = false) — it encoded the old `P = cap − diff` arithmetic. Only the offset moves
  // difficulty now; the floor never applies, whatever the actor's capability.
  test('personal scale: applies -0.20 offset, no cap', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.75, 0, 0, 'personal');
    expect(result.scaleOffsetApplied).toBeCloseTo(-0.20, 5);
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(0.10, 5);
  });

  test('local scale: applies -0.10 offset, no cap', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.75, 0, 0, 'local');
    expect(result.scaleOffsetApplied).toBeCloseTo(-0.10, 5);
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(0.20, 5);
  });

  test('cosmic scale: applies +0.10 offset', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.8, 0, 0, 'cosmic');
    expect(result.scaleOffsetApplied).toBeCloseTo(0.10, 5);
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(0.40, 5);
  });

  test('undefined scale treated as regional (no offset)', () => {
    const result = applyScaleDifficultyAdjust(0.3, 0.5, 0, 0, undefined);
    expect(result.scaleOffsetApplied).toBe(0);
  });

  test('negative adjusted difficulty passes through (the resolver zeroes it)', () => {
    const result = applyScaleDifficultyAdjust(0.05, 0.9, 0, 0, 'personal');
    expect(result.scaleFloorApplied).toBe(false);
    expect(result.adjustedDifficulty).toBeCloseTo(-0.15, 5);
  });

  test('the cap never recreates a floor: capable actors keep the full authored difficulty', () => {
    // Under the old cap this clamped to 0.05 (= 0.75 − 0.70). Under the new odds
    // formula that clamp would be a silent floor near 0.61 — the reason it is off.
    for (const scale of ['personal', 'local', 'regional', 'cosmic'] as const) {
      const result = applyScaleDifficultyAdjust(0.7, 0.75, 0.1, 0.1, scale);
      expect(result.scaleFloorApplied).toBe(false);
      expect(result.adjustedDifficulty).toBeCloseTo(0.7 + SCALE_DIFFICULTY_OFFSETS[scale], 5);
    }
  });

  test('SCALE_FLOOR_DIFFICULTY_CAP_ENABLED is off (load-bearing)', () => {
    expect(SCALE_FLOOR_DIFFICULTY_CAP_ENABLED).toBe(false);
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

describe('MIN_PROBABILITY_BY_SCALE (retired by value, THR-1581)', () => {
  test('every scale floor is PROBABILITY_FLOOR — never restore one to hit a KPI', () => {
    for (const scale of ['personal', 'local', 'regional', 'cosmic'] as const) {
      expect(MIN_PROBABILITY_BY_SCALE[scale]).toBe(PROBABILITY_FLOOR);
    }
  });
});
