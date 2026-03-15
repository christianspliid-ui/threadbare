import { describe, it, expect } from 'vitest';
import { assignInitialAmbitions } from '../ambitionAssignment';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import type { AmbitionAgentSnapshot } from '../ambitionSelection';
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';

function makeSnapshot(overrides: Partial<AmbitionAgentSnapshot> = {}): AmbitionAgentSnapshot {
  const caps: Record<ReachDomain, number> = {} as Record<ReachDomain, number>;
  for (const r of REACH_DOMAINS) caps[r] = 0.5;
  return {
    domainCapabilities: caps,
    traits: [],
    culturalSpheres: [],
    bonds: [],
    ...overrides,
  };
}

function makeLowCapSnapshot(): AmbitionAgentSnapshot {
  const caps: Record<ReachDomain, number> = {} as Record<ReachDomain, number>;
  for (const r of REACH_DOMAINS) caps[r] = 0.05;
  return {
    domainCapabilities: caps,
    traits: [],
    culturalSpheres: [],
    bonds: [],
  };
}

describe('assignInitialAmbitions', () => {
  it('returns ambition assignments for a capable agent with primary priority', () => {
    const agent = makeSnapshot();
    const result = assignInitialAmbitions(AMBITION_TEMPLATES, agent, 42);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].priority).toBe('primary');
    expect(result[0].templateId).toBeTruthy();
  });

  it('returns empty for a very low-capability agent (all reaches 0.05)', () => {
    const agent = makeLowCapSnapshot();
    const result = assignInitialAmbitions(AMBITION_TEMPLATES, agent, 42);

    // With all reaches at 0.05, no template should pass eligibility floors
    expect(result).toEqual([]);
  });

  it('is deterministic with the same seed', () => {
    const agent = makeSnapshot();
    const result1 = assignInitialAmbitions(AMBITION_TEMPLATES, agent, 999);
    const result2 = assignInitialAmbitions(AMBITION_TEMPLATES, agent, 999);

    expect(result1).toEqual(result2);
  });

  it('returns at most 2 assignments', () => {
    const agent = makeSnapshot();
    // Try multiple seeds to ensure we never exceed 2
    for (let seed = 0; seed < 50; seed++) {
      const result = assignInitialAmbitions(AMBITION_TEMPLATES, agent, seed);
      expect(result.length).toBeLessThanOrEqual(2);
    }
  });

  it('assigns secondary priority to the second ambition when present', () => {
    const agent = makeSnapshot();
    const result = assignInitialAmbitions(AMBITION_TEMPLATES, agent, 42);

    if (result.length === 2) {
      expect(result[0].priority).toBe('primary');
      expect(result[1].priority).toBe('secondary');
    }
  });
});
