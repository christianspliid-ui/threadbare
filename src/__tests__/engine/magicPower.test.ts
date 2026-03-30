/**
 * Tests for magic power calculation, overchannel resolution, and agent AI decision.
 * Written before implementation (TDD RED phase).
 *
 * Plan: 10-05 (Magic as Sphere Fluency)
 * Design: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import { describe, it, expect } from 'vitest';
import {
  computeEffectivePower,
  resolveOverchannel,
  shouldAgentOverchannel,
  OVERCHANNEL_SELF_PRESSURE_RATIO,
  MAGIC_MINIMUM_CASTER_SCORE,
  OVERCHANNEL_AI_WILLINGNESS_DEFAULT,
  OVERCHANNEL_AI_WILLINGNESS_DESPERATE,
  OVERCHANNEL_OVERFLOW_TO_WOUND,
} from '../../engine/magicPower';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import type { SphereAffinity } from '../../types/sphereAffinity';

// ─── Helpers ──────────────────────────────────────────────────────

/** Create a SphereAffinity with specified scores, all others 0 */
function makeAffinity(overrides: Partial<Record<string, number>>): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const [sphere, score] of Object.entries(overrides)) {
    base.scores[sphere as keyof typeof base.scores] = score as number;
  }
  return base;
}

/** Simple seeded pseudo-random for deterministic tests */
function makeSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

// ─── Constants ────────────────────────────────────────────────────

describe('magicPower constants', () => {
  it('OVERCHANNEL_SELF_PRESSURE_RATIO is exported and a number', () => {
    expect(typeof OVERCHANNEL_SELF_PRESSURE_RATIO).toBe('number');
  });

  it('MAGIC_MINIMUM_CASTER_SCORE equals 1', () => {
    expect(MAGIC_MINIMUM_CASTER_SCORE).toBe(1);
  });

  it('OVERCHANNEL_AI_WILLINGNESS_DEFAULT equals 0.1', () => {
    expect(OVERCHANNEL_AI_WILLINGNESS_DEFAULT).toBe(0.1);
  });

  it('OVERCHANNEL_AI_WILLINGNESS_DESPERATE equals 0.5', () => {
    expect(OVERCHANNEL_AI_WILLINGNESS_DESPERATE).toBe(0.5);
  });

  it('OVERCHANNEL_OVERFLOW_TO_WOUND is a boolean', () => {
    expect(typeof OVERCHANNEL_OVERFLOW_TO_WOUND).toBe('boolean');
  });
});

// ─── computeEffectivePower ────────────────────────────────────────

describe('computeEffectivePower', () => {
  it('adds caster + location and subtracts opposite sphere: Life=3, location Life=5, location Entropy=1 → power=7', () => {
    // Life opposite is Entropy
    const caster = makeAffinity({ life: 3 });
    const location = makeAffinity({ life: 5, entropy: 1 });
    const result = computeEffectivePower(caster, location, 'life');
    expect(result.power).toBe(7); // 3 + 5 - 1 = 7
  });

  it('overchannel cost = max(0, locationContribution - casterScore): Life=3, location Life=5 → overchannelCost=2', () => {
    const caster = makeAffinity({ life: 3 });
    const location = makeAffinity({ life: 5 });
    const result = computeEffectivePower(caster, location, 'life');
    expect(result.overchannelCost).toBe(2); // max(0, 5-3) = 2
  });

  it('no overchannel when caster score >= location: Force=5, location Force=3 → overchannelCost=0', () => {
    const caster = makeAffinity({ force: 5 });
    const location = makeAffinity({ force: 3 });
    const result = computeEffectivePower(caster, location, 'force');
    expect(result.power).toBe(8); // 5 + 3 = 8
    expect(result.overchannelCost).toBe(0);
  });

  it('strong location opposition floors power to 0: Mind=1, location Mind=0, location Force=4 → power=0', () => {
    // Mind opposite is Force (per updated cosmology)
    const caster = makeAffinity({ mind: 1 });
    const location = makeAffinity({ mind: 0, force: 4 });
    const result = computeEffectivePower(caster, location, 'mind');
    expect(result.power).toBe(0); // max(0, 1 + 0 - 4) = 0
  });

  it('no overchannel cost when power floors to 0', () => {
    const caster = makeAffinity({ mind: 1 });
    const location = makeAffinity({ mind: 0, force: 4 });
    const result = computeEffectivePower(caster, location, 'mind');
    expect(result.overchannelCost).toBe(0);
  });

  it('high location score generates large overchannel: Life=2, location Life=8 → overchannelCost=6', () => {
    const caster = makeAffinity({ life: 2 });
    const location = makeAffinity({ life: 8 });
    const result = computeEffectivePower(caster, location, 'life');
    expect(result.overchannelCost).toBe(6); // max(0, 8-2) = 6
  });

  it('high location score: Life=2, location Life=8, no opposition → power=10', () => {
    const caster = makeAffinity({ life: 2 });
    const location = makeAffinity({ life: 8 }); // entropy=0 (no opposition)
    const result = computeEffectivePower(caster, location, 'life');
    expect(result.power).toBe(10); // 2 + 8 - 0 = 10
  });

  it('blocks casting when caster score is 0 (MAGIC_MINIMUM_CASTER_SCORE=1)', () => {
    const caster = makeAffinity({ force: 0 }); // zero score
    const location = makeAffinity({ force: 5 });
    const result = computeEffectivePower(caster, location, 'force');
    expect(result.power).toBe(0);
    expect(result.overchannelCost).toBe(0);
  });

  it('returns power=0 and overchannelCost=0 for zero caster regardless of location strength', () => {
    const caster = makeAffinity({}); // all zeros
    const location = makeAffinity({ life: 10, entropy: 0 });
    const result = computeEffectivePower(caster, location, 'life');
    expect(result.power).toBe(0);
    expect(result.overchannelCost).toBe(0);
  });

  it('works with zero location score (caster contribution only)', () => {
    const caster = makeAffinity({ spirit: 4 });
    const location = makeAffinity({}); // all zeros
    const result = computeEffectivePower(caster, location, 'spirit');
    expect(result.power).toBe(4); // 4 + 0 - 0 = 4
    expect(result.overchannelCost).toBe(0);
  });

  it('applies OVERCHANNEL_SELF_PRESSURE_RATIO to overchannel cost calculation', () => {
    // If ratio is 1.0, overchannelCost == raw difference
    const caster = makeAffinity({ energy: 2 });
    const location = makeAffinity({ energy: 7 });
    const result = computeEffectivePower(caster, location, 'energy');
    // Raw difference = 7 - 2 = 5, times ratio
    expect(result.overchannelCost).toBe(5 * OVERCHANNEL_SELF_PRESSURE_RATIO);
  });
});

// ─── resolveOverchannel ───────────────────────────────────────────

describe('resolveOverchannel', () => {
  it('returns null when overchannelCost is 0', () => {
    const result = resolveOverchannel('agent-1', 'life', 0);
    expect(result).toBeNull();
  });

  it('returns null when overchannelCost is negative', () => {
    const result = resolveOverchannel('agent-1', 'life', -1);
    expect(result).toBeNull();
  });

  it('returns a SpherePressureEvent targeting the agent', () => {
    const result = resolveOverchannel('agent-42', 'life', 6);
    expect(result).not.toBeNull();
    expect(result!.targetEntityId).toBe('agent-42');
  });

  it('SpherePressureEvent has source "overchannel"', () => {
    const result = resolveOverchannel('agent-1', 'life', 6);
    expect(result!.source).toBe('overchannel');
  });

  it('SpherePressureEvent magnitude equals overchannelCost', () => {
    const result = resolveOverchannel('agent-1', 'life', 6);
    expect(result!.magnitude).toBe(6);
  });

  it('applies opposing sphere as damage vector (life → entropy damage)', () => {
    // Life opposite is Entropy
    const result = resolveOverchannel('agent-1', 'life', 6);
    expect(result!.sphere).toBe('entropy');
  });

  it('applies opposing sphere: force overchannel → mind damage', () => {
    // Force opposite is Mind (per updated cosmology)
    const result = resolveOverchannel('agent-1', 'force', 3);
    expect(result!.sphere).toBe('mind');
  });

  it('applies opposing sphere: mind overchannel → force damage', () => {
    // Mind opposite is Force (per updated cosmology)
    const result = resolveOverchannel('agent-1', 'mind', 4);
    expect(result!.sphere).toBe('force');
  });

  it('sourceId includes agent id and sphere', () => {
    const result = resolveOverchannel('agent-99', 'spirit', 2);
    expect(result!.sourceId).toContain('agent-99');
    expect(result!.sourceId).toContain('spirit');
  });
});

// ─── shouldAgentOverchannel ───────────────────────────────────────

describe('shouldAgentOverchannel', () => {
  it('returns false when willingness is 0', () => {
    const rng = makeSeededRng(42);
    expect(shouldAgentOverchannel(rng, 0)).toBe(false);
  });

  it('returns false for any rng value when willingness is 0', () => {
    // Should always be false regardless of rng output
    for (let i = 0; i < 20; i++) {
      const rng = makeSeededRng(i);
      expect(shouldAgentOverchannel(rng, 0)).toBe(false);
    }
  });

  it('returns true when willingness is 1', () => {
    const rng = makeSeededRng(42);
    expect(shouldAgentOverchannel(rng, 1)).toBe(true);
  });

  it('returns true for any rng value when willingness is 1', () => {
    for (let i = 0; i < 20; i++) {
      const rng = makeSeededRng(i);
      expect(shouldAgentOverchannel(rng, 1)).toBe(true);
    }
  });

  it('uses rng for intermediate willingness — deterministic with seed 42', () => {
    const rng = makeSeededRng(42);
    const result = shouldAgentOverchannel(rng, 0.1);
    // Deterministic — same seed → same result
    const rng2 = makeSeededRng(42);
    const result2 = shouldAgentOverchannel(rng2, 0.1);
    expect(result).toBe(result2);
  });

  it('uses default willingness when not provided', () => {
    const rng1 = makeSeededRng(42);
    const rng2 = makeSeededRng(42);
    // Default vs explicit OVERCHANNEL_AI_WILLINGNESS_DEFAULT should match
    const withDefault = shouldAgentOverchannel(rng1);
    const withExplicit = shouldAgentOverchannel(rng2, OVERCHANNEL_AI_WILLINGNESS_DEFAULT);
    expect(withDefault).toBe(withExplicit);
  });

  it('higher willingness increases probability of true', () => {
    // Statistical test: willingness=0.9 should produce more trues than willingness=0.1
    const results01: boolean[] = [];
    const results09: boolean[] = [];
    for (let i = 0; i < 100; i++) {
      results01.push(shouldAgentOverchannel(makeSeededRng(i), 0.1));
      results09.push(shouldAgentOverchannel(makeSeededRng(i), 0.9));
    }
    const count01 = results01.filter(Boolean).length;
    const count09 = results09.filter(Boolean).length;
    expect(count09).toBeGreaterThan(count01);
  });
});
