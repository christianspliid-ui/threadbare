/**
 * Contract test: reliabilityBand() and reliabilityDescriptor() must agree (THR-137).
 *
 * The decay phase uses reliabilityBand() for threshold detection.
 * Prose enrichment uses reliabilityDescriptor() for {intel:X.reliability} placeholders.
 * If these two diverge, the chronicle event fires at the wrong tick relative to
 * when the prose descriptor changes — breaking narrative continuity.
 *
 * This test asserts agreement across 100 sample reliabilities in [0, 1].
 */

import { describe, expect, it } from 'vitest';
import { reliabilityBand, reliabilityDescriptor } from '../../intelligence';

describe('intel-decay-band-agreement contract', () => {
  it('reliabilityBand and reliabilityDescriptor agree for all reliabilities in [0, 1]', () => {
    const samples = 100;
    for (let i = 0; i <= samples; i++) {
      const r = i / samples;
      expect(reliabilityBand(r)).toBe(reliabilityDescriptor(r));
    }
  });

  it('reliabilityDescriptor returns dubious for non-finite and negative inputs', () => {
    // reliabilityDescriptor is the defensive wrapper — it guards for NaN/negative/Infinity
    // before delegating to reliabilityBand. Infinity fails Number.isFinite, so → dubious.
    expect(reliabilityDescriptor(NaN)).toBe('dubious');
    expect(reliabilityDescriptor(-0.1)).toBe('dubious');
    expect(reliabilityDescriptor(Infinity)).toBe('dubious');
  });
});
