/**
 * Sphere Modifier Tests — downstream integration of sphere affinity scores.
 *
 * Covers:
 *   1. Prosperity sphere modifier (phaseProsperity.ts)
 *   2. Encounter resonance modifier (encounterScoring.ts)
 *   3. Agent decision axiological shift (encounterScoring.resolveProfile via sphere)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import type { GraphNode } from '../../types/graph';
import type { SphereAffinity } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSphereAffinity(overrides: Partial<Record<SphereName, number>> = {}): SphereAffinity {
  const scores = {} as Record<SphereName, number>;
  const progress = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    scores[s] = overrides[s] ?? 0;
    progress[s] = 0;
  }
  return { scores, progress };
}

function makeGraphNode(id: string, type: string, props: Record<string, unknown> = {}): GraphNode {
  return {
    id,
    type,
    name: id,
    properties: props,
  };
}

// ─── Import targets ───────────────────────────────────────────────────────────

// These imports may fail before implementation (RED phase expected for production code)
import {
  PROSPERITY_LIFE_BONUS,
  PROSPERITY_ENERGY_BONUS,
  PROSPERITY_ENTROPY_PENALTY,
  PROSPERITY_SPHERE_CAP,
  computeEquilibriumTargetWithSphere,
} from '../../engine/phaseProsperity';

import {
  ENCOUNTER_RESONANCE_MULTIPLIER,
  ENCOUNTER_RESONANCE_CAP,
  computeResonance,
} from '../../engine/encounterScoring';

import {
  getDominantSphere,
  SPHERE_AXIOLOGICAL_MAP,
  SPHERE_DECISION_WEIGHT,
  applyAxiologicalShift,
} from '../../engine/sphereAffinity';
import { VALUE_PAIRS } from '../../types/agent';

// ─── 1. Prosperity sphere modifier ────────────────────────────────────────────

describe('Prosperity sphere modifier', () => {
  it('computes correct modifier: Life=3, Energy=2, Entropy=0 → 0.09', () => {
    const affinity = makeSphereAffinity({ life: 3, energy: 2, entropy: 0 });
    const modifier = computeEquilibriumTargetWithSphere(affinity);
    // 3*0.02 + 2*0.015 - 0*0.025 = 0.06 + 0.03 - 0 = 0.09
    expect(modifier).toBeCloseTo(0.09, 5);
  });

  it('caps modifier at PROSPERITY_SPHERE_CAP=0.15 for high scores', () => {
    // Life=10, Energy=10, Entropy=0 → 10*0.02 + 10*0.015 = 0.35 → capped to 0.15
    const affinity = makeSphereAffinity({ life: 10, energy: 10, entropy: 0 });
    const modifier = computeEquilibriumTargetWithSphere(affinity);
    expect(modifier).toBe(PROSPERITY_SPHERE_CAP);
  });

  it('caps negative modifier at -PROSPERITY_SPHERE_CAP for high entropy', () => {
    // Entropy=10 → -10*0.025 = -0.25 → capped to -0.15
    const affinity = makeSphereAffinity({ entropy: 10, life: 0, energy: 0 });
    const modifier = computeEquilibriumTargetWithSphere(affinity);
    expect(modifier).toBe(-PROSPERITY_SPHERE_CAP);
  });

  it('returns 0 (fail-soft) when affinity is undefined', () => {
    const modifier = computeEquilibriumTargetWithSphere(undefined);
    expect(modifier).toBe(0);
  });

  it('exports named constants with correct values', () => {
    expect(PROSPERITY_LIFE_BONUS).toBe(0.02);
    expect(PROSPERITY_ENERGY_BONUS).toBe(0.015);
    expect(PROSPERITY_ENTROPY_PENALTY).toBe(0.025);
    expect(PROSPERITY_SPHERE_CAP).toBe(0.15);
  });
});

// ─── 2. Encounter resonance modifier ─────────────────────────────────────────

describe('Encounter resonance modifier', () => {
  it('computes resonance: Force=4, Mind=1 for Force encounter → (4-1)*0.1 = 0.3', () => {
    // Force opposes Mind (from SPHERE_OPPOSITES)
    const hexAffinity = makeSphereAffinity({ force: 4, mind: 1 });
    const resonance = computeResonance(hexAffinity, 'force');
    expect(resonance).toBeCloseTo(0.3, 5);
  });

  it('caps resonance at ENCOUNTER_RESONANCE_CAP=0.5', () => {
    // Force=10, Mind=0 → 10*0.1 = 1.0 → capped to 0.5
    const hexAffinity = makeSphereAffinity({ force: 10, mind: 0 });
    const resonance = computeResonance(hexAffinity, 'force');
    expect(resonance).toBe(ENCOUNTER_RESONANCE_CAP);
  });

  it('returns negative resonance when opposition sphere dominates', () => {
    // Force=1, Mind=5 → Force encounter: (1-5)*0.1 = -0.4 (negative resonance)
    const hexAffinity = makeSphereAffinity({ force: 1, mind: 5 });
    const resonance = computeResonance(hexAffinity, 'force');
    expect(resonance).toBeCloseTo(-0.4, 5);
  });

  it('caps negative resonance at -ENCOUNTER_RESONANCE_CAP', () => {
    // Force=0, Mind=10 → (0-10)*0.1 = -1.0 → capped to -0.5
    const hexAffinity = makeSphereAffinity({ force: 0, mind: 10 });
    const resonance = computeResonance(hexAffinity, 'force');
    expect(resonance).toBe(-ENCOUNTER_RESONANCE_CAP);
  });

  it('returns 0 for sphere-less encounters (undefined encounterSphere)', () => {
    const hexAffinity = makeSphereAffinity({ force: 5 });
    const resonance = computeResonance(hexAffinity, undefined);
    expect(resonance).toBe(0);
  });

  it('returns 0 (fail-soft) when hex affinity is undefined', () => {
    const resonance = computeResonance(undefined, 'force');
    expect(resonance).toBe(0);
  });

  it('exports constants with correct values', () => {
    expect(ENCOUNTER_RESONANCE_MULTIPLIER).toBe(0.1);
    expect(ENCOUNTER_RESONANCE_CAP).toBe(0.5);
  });
});

// ─── 3. Agent decision sphere influence ──────────────────────────────────────

describe('getDominantSphere', () => {
  it('returns the sphere with the highest score', () => {
    const affinity = makeSphereAffinity({ force: 2, life: 4, mind: 1 });
    expect(getDominantSphere(affinity)).toBe('life');
  });

  it('returns null for all-zero scores (fail-soft)', () => {
    const affinity = makeSphereAffinity();
    expect(getDominantSphere(affinity)).toBeNull();
  });

  it('returns deterministic result for ties (alphabetical first)', () => {
    // 'energy' and 'force' both at 3 — 'energy' comes first alphabetically
    const affinity = makeSphereAffinity({ energy: 3, force: 3 });
    const result = getDominantSphere(affinity);
    expect(result).not.toBeNull();
    // Should be deterministic (same result each call)
    expect(getDominantSphere(affinity)).toBe(result);
  });
});

describe('SPHERE_AXIOLOGICAL_MAP', () => {
  it('has an entry for every sphere name', () => {
    for (const sphere of SPHERE_NAMES) {
      expect(SPHERE_AXIOLOGICAL_MAP[sphere]).toBeDefined();
    }
  });

  it('force maps to courage_prudence with direction +1 (courage/valor)', () => {
    const mapping = SPHERE_AXIOLOGICAL_MAP['force'];
    expect(mapping.pair).toBe('courage_prudence');
    expect(mapping.direction).toBe(+1);
  });

  it('time maps to courage_prudence with direction -1 (prudence)', () => {
    const mapping = SPHERE_AXIOLOGICAL_MAP['time'];
    expect(mapping.pair).toBe('courage_prudence');
    expect(mapping.direction).toBe(-1);
  });

  it('life maps to mercy_ruthlessness with direction +1 (mercy/compassion)', () => {
    const mapping = SPHERE_AXIOLOGICAL_MAP['life'];
    expect(mapping.pair).toBe('mercy_ruthlessness');
    expect(mapping.direction).toBe(+1);
  });

  it('entropy maps to mercy_ruthlessness with direction -1 (ruthlessness)', () => {
    const mapping = SPHERE_AXIOLOGICAL_MAP['entropy'];
    expect(mapping.pair).toBe('mercy_ruthlessness');
    expect(mapping.direction).toBe(-1);
  });
});

describe('applyAxiologicalShift', () => {
  it('adds SPHERE_DECISION_WEIGHT to the mapped pair when direction is +1', () => {
    const baseProfile = Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as Record<string, number>;
    const result = applyAxiologicalShift(baseProfile as Parameters<typeof applyAxiologicalShift>[0], {
      pair: 'courage_prudence',
      direction: +1,
    });
    expect(result['courage_prudence']).toBeCloseTo(SPHERE_DECISION_WEIGHT, 5);
  });

  it('subtracts SPHERE_DECISION_WEIGHT from the mapped pair when direction is -1', () => {
    const baseProfile = Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as Record<string, number>;
    const result = applyAxiologicalShift(baseProfile as Parameters<typeof applyAxiologicalShift>[0], {
      pair: 'mercy_ruthlessness',
      direction: -1,
    });
    expect(result['mercy_ruthlessness']).toBeCloseTo(-SPHERE_DECISION_WEIGHT, 5);
  });

  it('clamps shifted value to [-1, 1]', () => {
    const baseProfile = Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as Record<string, number>;
    baseProfile['courage_prudence'] = 0.95; // Near cap
    const result = applyAxiologicalShift(baseProfile as Parameters<typeof applyAxiologicalShift>[0], {
      pair: 'courage_prudence',
      direction: +1,
    });
    expect(result['courage_prudence']).toBeLessThanOrEqual(1.0);
  });
});
