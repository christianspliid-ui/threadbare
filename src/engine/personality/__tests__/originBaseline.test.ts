import { describe, it, expect } from 'vitest';
import {
  drawOriginVignettes,
  vignetteAxisContribution,
  sumAxisContributions,
  computeOriginBaseline,
  type AxisContributionMap,
} from '../originBaseline';
import { ORIGIN_VIGNETTES, type OriginVignette } from '../../../data/origin-vignettes';
import { ORIGIN_VIGNETTES_PER_AGENT } from '../originConstants';
import { getAxisByReach, canonical01ToSigned } from '../../../types/axisRegistry';
import { REACH_VALUE_PAIR } from '../../../types/agent';

/** Deterministic PRNG matching the phase's per-agent seed derivation. */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('vignetteAxisContribution', () => {
  it('maps reach → canonical axis id and derives the sign from the pole', () => {
    const virtue: OriginVignette = { id: 'x', text: '', reach: 'iron', pole: 'virtue', magnitude: 0.15 };
    const vice: OriginVignette = { id: 'y', text: '', reach: 'gold', pole: 'vice', magnitude: 0.1 };
    expect(vignetteAxisContribution(virtue)).toEqual({ axisId: getAxisByReach('iron').axisId, delta: 0.15 });
    expect(vignetteAxisContribution(vice)).toEqual({ axisId: getAxisByReach('gold').axisId, delta: -0.1 });
  });
});

describe('drawOriginVignettes', () => {
  it('draws the requested count of DISTINCT vignettes', () => {
    const drawn = drawOriginVignettes(mulberry32(1), ORIGIN_VIGNETTES_PER_AGENT);
    expect(drawn).toHaveLength(ORIGIN_VIGNETTES_PER_AGENT);
    expect(new Set(drawn.map((v) => v.id)).size).toBe(ORIGIN_VIGNETTES_PER_AGENT);
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const a = drawOriginVignettes(mulberry32(7)).map((v) => v.id);
    const b = drawOriginVignettes(mulberry32(7)).map((v) => v.id);
    const c = drawOriginVignettes(mulberry32(8)).map((v) => v.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('never exceeds the pool size and no-ops on an empty pool', () => {
    expect(drawOriginVignettes(mulberry32(1), 10, [])).toEqual([]);
    const tiny: OriginVignette[] = [{ id: 'only', text: '', reach: 'iron', pole: 'virtue', magnitude: 0.05 }];
    expect(drawOriginVignettes(mulberry32(1), 5, tiny)).toHaveLength(1);
  });
});

describe('sumAxisContributions', () => {
  it('sums per-axis deltas and skips + counts unknown axis ids', () => {
    const ironAxis = getAxisByReach('iron').axisId;
    const maps: AxisContributionMap[] = [
      { [ironAxis]: 0.1 },
      { [ironAxis]: -0.05 },
      { not_a_real_axis: 0.4 },
      { alsoNope: 0 }, // zero is ignored, not counted unknown
    ];
    const { totals, unknownAxes } = sumAxisContributions(maps);
    expect(totals.get(ironAxis)).toBeCloseTo(0.05, 6);
    expect(unknownAxes).toBe(1);
  });
});

describe('computeOriginBaseline', () => {
  it('folds a permanent trait axisContribution onto the baseline (field is consumed)', () => {
    const ironAxis = getAxisByReach('iron').axisId;
    // Force clamp so the assertion is independent of which vignettes get drawn:
    // +5 canonical on iron saturates to 1.0 → signed +1 on the iron valuePair.
    const res = computeOriginBaseline(mulberry32(3), {}, [{ [ironAxis]: 5 }]);
    expect(res.profileUpdates[REACH_VALUE_PAIR.iron]).toBe(1);

    const resVice = computeOriginBaseline(mulberry32(3), {}, [{ [ironAxis]: -5 }]);
    expect(resVice.profileUpdates[REACH_VALUE_PAIR.iron]).toBe(-1);
  });

  it('lays contributions ONTO the existing baseline, never replacing it (additive)', () => {
    const ironAxis = getAxisByReach('iron').axisId;
    // Existing baseline at neutral (0 signed = 0.5 canonical); +0.2 canonical → 0.7 → signed 0.4.
    const res = computeOriginBaseline(mulberry32(9), { mercy_ruthlessness: 0 }, [{ [ironAxis]: 0.2 }]);
    // Vignettes may add more iron contributions, so assert it moved toward virtue from the trait,
    // bounded by the clamp — never below the pure-trait floor of 0.4 and never above 1.
    const v = res.profileUpdates[REACH_VALUE_PAIR.iron]!;
    expect(v).toBeGreaterThanOrEqual(canonical01ToSigned(0.7) - 1e-9);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('counts unknown-axis trait contributions and never writes them to the profile', () => {
    const res = computeOriginBaseline(mulberry32(1), {}, [{ ghost_axis: 0.3 }]);
    expect(res.unknownAxes).toBeGreaterThanOrEqual(1);
    // No ValuePair key should be 'ghost_axis' — profile only ever holds ValuePairs.
    expect(Object.keys(res.profileUpdates)).not.toContain('ghost_axis');
  });

  it('is deterministic for the same seed', () => {
    const a = computeOriginBaseline(mulberry32(42), {}, []);
    const b = computeOriginBaseline(mulberry32(42), {}, []);
    expect(a.vignetteIds).toEqual(b.vignetteIds);
    expect(a.profileUpdates).toEqual(b.profileUpdates);
  });

  it('only ever emits reach ValuePairs (never the meta pair) as profile updates', () => {
    const res = computeOriginBaseline(mulberry32(5), { courage_prudence: 0.9 }, []);
    const reachPairs = new Set(Object.values(REACH_VALUE_PAIR));
    for (const key of Object.keys(res.profileUpdates)) {
      expect(reachPairs.has(key as never)).toBe(true);
    }
    expect(res.profileUpdates).not.toHaveProperty('courage_prudence');
  });

  it('applies every drawn vignette to a real reach ValuePair', () => {
    const res = computeOriginBaseline(mulberry32(11), {}, []);
    expect(res.vignettesApplied).toBe(res.vignetteIds.length);
    expect(res.vignetteIds.every((id) => ORIGIN_VIGNETTES.some((v) => v.id === id))).toBe(true);
  });
});
