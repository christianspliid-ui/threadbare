import { describe, it, expect } from 'vitest';
import {
  CANONICAL_AXES,
  CANONICAL_AXIS_IDS,
  AXIS_NEUTRAL,
  AXIS_VIRTUE,
  AXIS_VICE,
  getAxisByReach,
  getAxisById,
  getPoleLabel,
} from '../axisRegistry';
import { REACH_DOMAINS } from '../traits';
import { REACH_VALUE_PAIR } from '../agent';

/**
 * The THR-524-approved table, restated independently here as the test oracle so a
 * regression in the registry can't silently match a regression in the source.
 */
const APPROVED = {
  iron: { virtue: { role: 'Protector', word: 'Brave' }, vice: { role: 'Conqueror', word: 'Power-Hungry' } },
  gold: { virtue: { role: 'Patron', word: 'Generous' }, vice: { role: 'Extractor', word: 'Greedy' } },
  shadow: { virtue: { role: 'Broker', word: 'Fair' }, vice: { role: 'Manipulator', word: 'Scheming' } },
  veil: { virtue: { role: 'Weaver', word: 'Patient' }, vice: { role: 'Unraveller', word: 'Impatient' } },
  heart: { virtue: { role: 'Sworn', word: 'Loyal' }, vice: { role: 'Renegade', word: 'Disloyal' } },
  eye: { virtue: { role: 'Seer', word: 'Perceptive' }, vice: { role: 'Inquisitor', word: 'Judgemental' } },
  stone: { virtue: { role: 'Keeper', word: 'Dependable' }, vice: { role: 'Destroyer', word: 'Reckless' } },
  star: { virtue: { role: 'Beacon', word: 'Inspiring' }, vice: { role: 'Anchor', word: 'Discouraging' } },
} as const;

describe('axisRegistry — canonical scale', () => {
  it('documents the 0–1 scale with 0.5 neutral, 1.0 virtue, 0.0 vice', () => {
    expect(AXIS_NEUTRAL).toBe(0.5);
    expect(AXIS_VIRTUE).toBe(1.0);
    expect(AXIS_VICE).toBe(0.0);
  });
});

describe('axisRegistry — completeness', () => {
  it('has exactly one axis per reach (all 8)', () => {
    expect(CANONICAL_AXES).toHaveLength(REACH_DOMAINS.length);
    const reaches = CANONICAL_AXES.map((a) => a.reachDomain).sort();
    expect(reaches).toEqual([...REACH_DOMAINS].sort());
  });

  it('exposes unique, stable axis ids matching CANONICAL_AXIS_IDS', () => {
    const ids = CANONICAL_AXES.map((a) => a.axisId);
    expect(new Set(ids).size).toBe(ids.length); // unique
    for (const axis of CANONICAL_AXES) {
      expect(axis.axisId).toBe(`${axis.reachDomain}_axis`);
    }
    expect(CANONICAL_AXIS_IDS).toEqual(REACH_DOMAINS.map((r) => `${r}_axis`));
  });
});

describe('axisRegistry — vocabulary (THR-524 approved table)', () => {
  for (const reach of REACH_DOMAINS) {
    it(`${reach}: both poles match the approved table`, () => {
      const axis = getAxisByReach(reach);
      expect(axis.virtue).toEqual(APPROVED[reach].virtue);
      expect(axis.vice).toEqual(APPROVED[reach].vice);
    });
  }

  it('encodes the two relocated terms at their NEW reaches', () => {
    // Seer relocated Veil → Eye
    expect(getAxisByReach('eye').virtue.role).toBe('Seer');
    expect(getAxisByReach('veil').virtue.role).not.toBe('Seer');
    // Manipulator relocated Veil → Shadow
    expect(getAxisByReach('shadow').vice.role).toBe('Manipulator');
    expect(getAxisByReach('veil').vice.role).not.toBe('Manipulator');
  });
});

describe('axisRegistry — legacy ValuePair bridge', () => {
  it('sources valuePair from the real REACH_VALUE_PAIR keys (not invented)', () => {
    for (const axis of CANONICAL_AXES) {
      expect(axis.valuePair).toBe(REACH_VALUE_PAIR[axis.reachDomain]);
    }
  });
});

describe('axisRegistry — helper getters', () => {
  it('getAxisByReach returns the matching axis for every reach', () => {
    for (const reach of REACH_DOMAINS) {
      expect(getAxisByReach(reach).reachDomain).toBe(reach);
    }
  });

  it('getAxisById round-trips every axis id', () => {
    for (const axis of CANONICAL_AXES) {
      expect(getAxisById(axis.axisId)).toBe(axis);
    }
  });

  it('getAxisById returns undefined for an unknown id', () => {
    expect(getAxisById('nonexistent_axis')).toBeUndefined();
  });

  it('getPoleLabel returns role+word for both poles of every axis', () => {
    for (const axis of CANONICAL_AXES) {
      expect(getPoleLabel(axis.axisId, 'virtue')).toEqual(axis.virtue);
      expect(getPoleLabel(axis.axisId, 'vice')).toEqual(axis.vice);
    }
  });

  it('getPoleLabel returns undefined for an unknown id', () => {
    expect(getPoleLabel('nonexistent_axis', 'virtue')).toBeUndefined();
  });
});
