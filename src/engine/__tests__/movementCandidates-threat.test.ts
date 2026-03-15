import { describe, it, expect } from 'vitest';
import { computeThreatModifier } from '../movementCandidates';

describe('computeThreatModifier', () => {
  it('returns 1.0 when threat is 0', () => {
    expect(computeThreatModifier(0, 0)).toBe(1.0);
  });

  it('returns 1.0 when agent has max courage (threat ignored)', () => {
    expect(computeThreatModifier(1.0, 1.0)).toBeCloseTo(1.0, 1);
  });

  it('reduces score for high threat + low courage', () => {
    const mod = computeThreatModifier(0.8, -1.0);
    expect(mod).toBeLessThan(1.0);
    expect(mod).toBeGreaterThan(0);
  });

  it('moderate courage partially resists threat', () => {
    const cowardMod = computeThreatModifier(0.5, -0.5);
    const braveMod = computeThreatModifier(0.5, 0.5);
    expect(braveMod).toBeGreaterThan(cowardMod);
  });

  it('floors at THREAT_MODIFIER_FLOOR', () => {
    const mod = computeThreatModifier(1.0, -1.0);
    expect(mod).toBeGreaterThanOrEqual(0.1);
  });
});
