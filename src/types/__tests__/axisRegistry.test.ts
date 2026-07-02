import { describe, it, expect } from 'vitest';
import {
  CANONICAL_AXES,
  CANONICAL_AXIS_IDS,
  AXIS_NEUTRAL,
  AXIS_VIRTUE,
  AXIS_VICE,
  getAxisByReach,
  getAxisById,
  getAxisByValuePair,
  getPoleLabel,
  reachToAxisId,
  axisIdToReach,
  signedToCanonical01,
  canonical01ToSigned,
} from '../axisRegistry';
import { REACH_DOMAINS } from '../traits';
import { REACH_VALUE_PAIR } from '../agent';
import { MORAL_AXIS_POLES_BY_REACH } from '../encounter-contract';

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
  star: { virtue: { role: 'Beacon', word: 'Guiding' }, vice: { role: 'Wrecker', word: 'Misleading' } }, // re-scoped THR-545: wayfinding/fate, not inner outlook
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

  it('getAxisByValuePair round-trips every legacy ValuePair to its axis', () => {
    for (const axis of CANONICAL_AXES) {
      expect(getAxisByValuePair(axis.valuePair)).toBe(axis);
    }
  });
});

// ─── THR-559: canonical keying + scale conversion ───────────────────────────

describe('axisRegistry — reach ↔ axisId keying (THR-559)', () => {
  it('reachToAxisId returns the canonical `${reach}_axis` id for every moral reach', () => {
    for (const reach of REACH_DOMAINS) {
      expect(reachToAxisId(reach)).toBe(`${reach}_axis`);
      expect(getAxisById(reachToAxisId(reach))).toBe(getAxisByReach(reach));
    }
  });

  it('reachToAxisId passes non-moral reaches through unchanged (e.g. quintessence)', () => {
    // quintessence has no moral axis; its drift entries are inert and keep their key.
    expect(reachToAxisId('quintessence')).toBe('quintessence');
  });

  it('axisIdToReach reverses reachToAxisId for every moral reach', () => {
    for (const reach of REACH_DOMAINS) {
      expect(axisIdToReach(reachToAxisId(reach))).toBe(reach);
    }
  });

  it('axisIdToReach returns undefined for a non-canonical id', () => {
    expect(axisIdToReach('quintessence')).toBeUndefined();
    expect(axisIdToReach('nonexistent_axis')).toBeUndefined();
  });
});

describe('axisRegistry — signed ±1 ↔ canonical 0–1 conversion (THR-559)', () => {
  it('maps the three canonical anchors', () => {
    expect(signedToCanonical01(-1)).toBe(AXIS_VICE); // 0.0
    expect(signedToCanonical01(0)).toBe(AXIS_NEUTRAL); // 0.5
    expect(signedToCanonical01(1)).toBe(AXIS_VIRTUE); // 1.0
    expect(canonical01ToSigned(0)).toBe(-1);
    expect(canonical01ToSigned(0.5)).toBe(0);
    expect(canonical01ToSigned(1)).toBe(1);
  });

  it('clamps out-of-range inputs to the scale bounds', () => {
    expect(signedToCanonical01(-2)).toBe(0);
    expect(signedToCanonical01(2)).toBe(1);
    expect(canonical01ToSigned(-0.5)).toBe(-1);
    expect(canonical01ToSigned(1.5)).toBe(1);
  });

  it('round-trips signed values through the canonical scale', () => {
    for (const v of [-1, -0.6, -0.05, 0, 0.05, 0.6, 1]) {
      expect(canonical01ToSigned(signedToCanonical01(v))).toBeCloseTo(v, 10);
    }
  });
});

// ─── THR-559: legacy naming sites reconciled to the registry ────────────────

describe('axisRegistry — legacy tables agree with the registry (THR-559)', () => {
  it('MORAL_AXIS_POLES_BY_REACH (EncounterArchetypePole) covers exactly the 8 registry reaches', () => {
    expect(Object.keys(MORAL_AXIS_POLES_BY_REACH).sort()).toEqual([...REACH_DOMAINS].sort());
  });

  it('each reach in MORAL_AXIS_POLES_BY_REACH has exactly two distinct poles (virtue, vice)', () => {
    for (const reach of REACH_DOMAINS) {
      const poles = MORAL_AXIS_POLES_BY_REACH[reach];
      expect(poles).toHaveLength(2);
      expect(poles[0]).not.toBe(poles[1]);
    }
  });

  it('REACH_VALUE_PAIR (AxiologicalProfile keys) is exactly the registry valuePair bridge', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_VALUE_PAIR[reach]).toBe(getAxisByReach(reach).valuePair);
    }
  });
});
