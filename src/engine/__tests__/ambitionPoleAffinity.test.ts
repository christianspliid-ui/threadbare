/**
 * THR-1298 — the value-pole selector term.
 *
 * Two agents handed the same harm should want different things because of who they
 * are. The risk the plan flags with an exclamation mark is the **two-scale mapping**:
 * `AxiologicalProfile` stores signed ±1, the canonical axis scale is 0–1 with 0.5
 * neutral, and a silent inversion between them would leave the term firing with the
 * poles backwards — merciful agents taking up revenge — while every test that only
 * checked "the term is non-zero" stayed green.
 *
 * So these tests assert *direction*, not presence, and each one confirms its own
 * perturbation applied before reading the result.
 */

import { describe, it, expect } from 'vitest';
import { scoreDesirability, type AmbitionAgentSnapshot } from '../ambitionSelection';
import { POLE_AFFINITY_WEIGHT } from '../../data/ambition-selection-constants';
import { signedToCanonical01 } from '../../types/axisRegistry';
import { VALUE_PAIRS, type AxiologicalProfile } from '../../types/agent';
import {
  GRIEVANCE_AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
} from '../../data/ambition-templates';
import type { AmbitionTemplate } from '../../types/ambition';

/** A profile sitting at the named pole of one pair, neutral everywhere else. */
function profileAt(pair: keyof AxiologicalProfile, signed: number): AxiologicalProfile {
  const profile = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  profile[pair] = signed;
  return profile;
}

function snapshot(profile?: AxiologicalProfile): AmbitionAgentSnapshot {
  return {
    domainCapabilities: {} as AmbitionAgentSnapshot['domainCapabilities'],
    traits: [],
    culturalSpheres: [],
    bonds: [],
    axiologicalProfile: profile,
  };
}

/** No jitter, so a score difference is the term under test and nothing else. */
const noJitter = () => 0;

const REVENGE = GRIEVANCE_AMBITION_TEMPLATES.find((t) => t.id === 'ambition_seek_revenge')!;
const PROTECT = EVENT_MINTED_AMBITION_TEMPLATES.find((t) => t.id === 'ambition_protect_the_home')!;

describe('value-pole selector term', () => {
  it('the templates under test really do author the poles this file assumes', () => {
    // Falsifies the whole file: if authoring moved, every assertion below would be
    // comparing two zeroes and passing for the wrong reason.
    expect(REVENGE.poleAffinities?.some(
      (a) => a.valuePair === 'mercy_ruthlessness' && a.pole === 'vice',
    )).toBe(true);
    expect(PROTECT.poleAffinities?.some(
      (a) => a.valuePair === 'mercy_ruthlessness' && a.pole === 'virtue',
    )).toBe(true);
  });

  it('scores revenge higher for a ruthless agent than a merciful one', () => {
    const ruthless = scoreDesirability(REVENGE, snapshot(profileAt('mercy_ruthlessness', -1)), noJitter);
    const merciful = scoreDesirability(REVENGE, snapshot(profileAt('mercy_ruthlessness', +1)), noJitter);
    expect(ruthless).toBeGreaterThan(merciful);
  });

  it('scores protection the other way round on the same axis', () => {
    const ruthless = scoreDesirability(PROTECT, snapshot(profileAt('mercy_ruthlessness', -1)), noJitter);
    const merciful = scoreDesirability(PROTECT, snapshot(profileAt('mercy_ruthlessness', +1)), noJitter);
    // The inversion guard: if signed→canonical were flipped, this and the test above
    // would both point the same way and only one of them would look wrong.
    expect(merciful).toBeGreaterThan(ruthless);
  });

  it('flips which drive wins when only the profile changes', () => {
    const pick = (profile: AxiologicalProfile): string => {
      const scored = [REVENGE, PROTECT]
        .map((t) => ({ id: t.id, score: scoreDesirability(t, snapshot(profile), noJitter) }))
        .sort((a, b) => b.score - a.score);
      return scored[0]!.id;
    };
    // Same templates, same (empty) capabilities, same rng — one input perturbed.
    expect(pick(profileAt('mercy_ruthlessness', -1))).toBe('ambition_seek_revenge');
    expect(pick(profileAt('mercy_ruthlessness', +1))).toBe('ambition_protect_the_home');
  });

  it('computes the term through the canonical bridge, at the documented magnitude', () => {
    const withProfile = scoreDesirability(REVENGE, snapshot(profileAt('mercy_ruthlessness', -1)), noJitter);
    const without = scoreDesirability(REVENGE, snapshot(undefined), noJitter);

    // Recompute the expectation from the same primitives the scorer must use. Written
    // as the bridge call rather than `(v+1)/2` on purpose: an open-coded conversion
    // here would agree with an open-coded conversion there and pin nothing.
    const expected = (REVENGE.poleAffinities ?? []).reduce((sum, a) => {
      const signed = a.valuePair === 'mercy_ruthlessness' ? -1 : 0;
      const virtue01 = signedToCanonical01(signed);
      const alignment = a.pole === 'virtue' ? virtue01 : 1 - virtue01;
      return sum + POLE_AFFINITY_WEIGHT * a.weight * alignment;
    }, 0);

    expect(withProfile - without).toBeCloseTo(expected, 10);
  });

  it('contributes nothing when the agent carries no profile', () => {
    const a = scoreDesirability(REVENGE, snapshot(undefined), noJitter);
    const b = scoreDesirability({ ...REVENGE, poleAffinities: undefined }, snapshot(undefined), noJitter);
    expect(a).toBe(b);
  });

  /**
   * The half-dead vocabulary trap: a `valuePair` naming nothing contributes 0 forever
   * and reads as mistuning rather than a typo. Type-checking does not catch it —
   * content is authored as literals that widen — so it is pinned here.
   */
  it('every authored valuePair is a real member of VALUE_PAIRS', () => {
    const pools: readonly AmbitionTemplate[] = [
      ...GRIEVANCE_AMBITION_TEMPLATES,
      ...EVENT_MINTED_AMBITION_TEMPLATES,
    ];
    const authored = pools.flatMap((t) => t.poleAffinities ?? []);
    // Guard the vacuous arm — zero authored affinities would satisfy the loop.
    expect(authored.length).toBeGreaterThanOrEqual(20);
    for (const affinity of authored) {
      expect(VALUE_PAIRS).toContain(affinity.valuePair);
      expect(['virtue', 'vice']).toContain(affinity.pole);
      expect(affinity.weight).toBeGreaterThan(0);
    }
  });

  it('every minted-pool template authors at least one pole lean', () => {
    for (const template of [...GRIEVANCE_AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES]) {
      expect(
        template.poleAffinities?.length ?? 0,
        `${template.id} authors no poleAffinities`,
      ).toBeGreaterThan(0);
    }
  });
});
