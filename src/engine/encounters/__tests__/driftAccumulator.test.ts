import { describe, expect, it } from 'vitest';
import { applyDriftMagnitude, decayAllDrift } from '../driftAccumulator';
import type { ArchetypeDrift } from '../../../types/gameState';

const TICK = 10;

function emptyDrift(): ArchetypeDrift[] {
  return [];
}

describe('applyDriftMagnitude', () => {
  describe('additive math', () => {
    it('creates a new entry when none exists', () => {
      const { drift } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.04, TICK);
      expect(drift).toHaveLength(1);
      expect(drift[0]).toMatchObject({ agentId: 'agt', axisId: 'iron', fromPosition: 0, toPosition: 0.04 });
    });

    it('accumulates drift additively', () => {
      const d1 = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.04, TICK);
      const d2 = applyDriftMagnitude(d1.drift, 'agt', 'iron', 0.07, TICK + 1);
      expect(d2.drift[0].toPosition).toBeCloseTo(0.11, 10);
    });

    it('handles negative magnitude (flaw pole)', () => {
      const { drift } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', -0.12, TICK);
      expect(drift[0].toPosition).toBeCloseTo(-0.12, 10);
    });

    it('tracks multiple axes for the same agent independently', () => {
      const d1 = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.1, TICK);
      const d2 = applyDriftMagnitude(d1.drift, 'agt', 'heart', 0.2, TICK);
      expect(d2.drift).toHaveLength(2);
      expect(d2.drift.find(d => d.axisId === 'iron')?.toPosition).toBeCloseTo(0.1, 10);
      expect(d2.drift.find(d => d.axisId === 'heart')?.toPosition).toBeCloseTo(0.2, 10);
    });

    it('does not affect other agents', () => {
      const d1 = applyDriftMagnitude(emptyDrift(), 'agt-a', 'iron', 0.3, TICK);
      const d2 = applyDriftMagnitude(d1.drift, 'agt-b', 'iron', 0.5, TICK);
      expect(d2.drift.find(d => d.agentId === 'agt-a')?.toPosition).toBeCloseTo(0.3, 10);
      expect(d2.drift.find(d => d.agentId === 'agt-b')?.toPosition).toBeCloseTo(0.5, 10);
    });
  });

  describe('clamping', () => {
    it('clamps at +1.0 (fail-soft: no throw, no exceeding bounds)', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.9, toPosition: 0.95, lastUpdatedTick: 1 }];
      const { drift } = applyDriftMagnitude(existing, 'agt', 'iron', 0.12, TICK);
      expect(drift[0].toPosition).toBe(1.0);
    });

    it('clamps at -1.0', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: -0.9, toPosition: -0.95, lastUpdatedTick: 1 }];
      const { drift } = applyDriftMagnitude(existing, 'agt', 'iron', -0.12, TICK);
      expect(drift[0].toPosition).toBe(-1.0);
    });
  });

  describe('threshold crossing detection', () => {
    it('emits no trace when not crossing a threshold', () => {
      const { traces } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.1, TICK);
      expect(traces).toHaveLength(0);
    });

    it('emits soft trace when crossing 0.30', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.25, toPosition: 0.25, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt', 'iron', 0.07, TICK);
      expect(traces.some(t => t.thresholdCrossed === 'soft')).toBe(true);
    });

    it('emits banner trace when crossing 0.60', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.55, toPosition: 0.55, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt', 'iron', 0.12, TICK);
      expect(traces.some(t => t.thresholdCrossed === 'banner')).toBe(true);
    });

    it('emits becoming trace when crossing 0.85', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.82, toPosition: 0.82, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt', 'iron', 0.12, TICK);
      expect(traces.some(t => t.thresholdCrossed === 'becoming')).toBe(true);
    });

    it('emits multiple traces when crossing multiple thresholds in one step', () => {
      // Jump from 0 to 0.90 in one step — crosses soft, banner, and becoming
      const { traces } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.90, TICK);
      const bands = traces.map(t => t.thresholdCrossed);
      expect(bands).toContain('soft');
      expect(bands).toContain('banner');
      expect(bands).toContain('becoming');
    });

    it('populates trace agentId and axisId correctly', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt-x', axisId: 'heart', fromPosition: 0.25, toPosition: 0.25, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt-x', 'heart', 0.07, TICK);
      const softTrace = traces.find(t => t.thresholdCrossed === 'soft')!;
      expect(softTrace.agentId).toBe('agt-x');
      expect(softTrace.axisId).toBe('heart');
    });

    it('does not emit traces on decay (inward crossing)', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.65, toPosition: 0.65, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt', 'iron', -0.1, TICK);
      // Moving from 0.65 toward 0 — crossing back through 0.60. Should NOT emit.
      expect(traces).toHaveLength(0);
    });

    it('populates trace fromPosition and toPosition correctly', () => {
      const existing: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.25, toPosition: 0.25, lastUpdatedTick: 1 }];
      const { traces } = applyDriftMagnitude(existing, 'agt', 'iron', 0.07, TICK);
      const softTrace = traces.find(t => t.thresholdCrossed === 'soft')!;
      expect(softTrace.fromPosition).toBeCloseTo(0.25, 10);
      expect(softTrace.toPosition).toBeCloseTo(0.32, 10);
    });

    it('sets pole to virtue for positive position', () => {
      const { traces } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', 0.90, TICK);
      expect(traces.every(t => t.pole === 'virtue')).toBe(true);
    });

    it('sets pole to flaw for negative position', () => {
      const { traces } = applyDriftMagnitude(emptyDrift(), 'agt', 'iron', -0.90, TICK);
      expect(traces.every(t => t.pole === 'flaw')).toBe(true);
    });
  });
});

describe('decayAllDrift', () => {
  it('decays positive drift toward zero', () => {
    const drift: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.5, toPosition: 0.5, lastUpdatedTick: 1 }];
    const decayed = decayAllDrift(drift, 0.001, TICK);
    expect(decayed[0].toPosition).toBeCloseTo(0.499, 10);
  });

  it('decays negative drift toward zero', () => {
    const drift: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: -0.3, toPosition: -0.3, lastUpdatedTick: 1 }];
    const decayed = decayAllDrift(drift, 0.001, TICK);
    expect(decayed[0].toPosition).toBeCloseTo(-0.299, 10);
  });

  it('zeroes out tiny drift (avoids endless tiny steps)', () => {
    const drift: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.0005, toPosition: 0.0005, lastUpdatedTick: 1 }];
    const decayed = decayAllDrift(drift, 0.001, TICK);
    expect(decayed[0].toPosition).toBe(0);
  });

  it('leaves zero entries unchanged', () => {
    const drift: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0, toPosition: 0, lastUpdatedTick: 1 }];
    const decayed = decayAllDrift(drift, 0.001, TICK);
    expect(decayed[0]).toBe(drift[0]); // same reference — not mutated
  });

  it('handles empty drift array', () => {
    expect(decayAllDrift([], 0.001, TICK)).toEqual([]);
  });

  it('decays to zero over 200 ticks without floor-hunting', () => {
    let drift: ArchetypeDrift[] = [{ agentId: 'agt', axisId: 'iron', fromPosition: 0.1, toPosition: 0.1, lastUpdatedTick: 1 }];
    for (let tick = 2; tick <= 200; tick += 1) {
      drift = decayAllDrift(drift, 0.001, tick);
    }
    expect(drift[0].toPosition).toBe(0);
  });
});
