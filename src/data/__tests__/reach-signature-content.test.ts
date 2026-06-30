import { describe, it, expect } from 'vitest';
import { REACH_DOMAINS } from '../../types/traits';
import { CREATION_SPHERE_NAMES } from '../../types/index';
import {
  resolveSignatureIndividualization,
  composeDefaultSignature,
  REACH_SIGNATURE_DEFAULTS,
  SIGNATURE_MATRIX,
  SIGNATURE_DEFAULT_BASE_VALUE,
  type SignatureIndividualization,
} from '../reach-signature-content';

describe('reach-signature-content — individualization layer (THR-549)', () => {
  it('has a composed-default seed for every ReachDomain', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_SIGNATURE_DEFAULTS[reach]).toBeDefined();
    }
  });

  it('keeps every ReachDomain present in the (skeleton) authored matrix', () => {
    for (const reach of REACH_DOMAINS) {
      expect(SIGNATURE_MATRIX[reach]).toBeDefined();
    }
  });

  // The core correctness property: under the two-domain lock the player's
  // (reach × primarySphere) cell is fixed for the run, so EVERY pair must
  // resolve to a real signature — never an empty card.
  it('resolves a non-null individualization for every ReachDomain × CreationSphereName', () => {
    for (const reach of REACH_DOMAINS) {
      for (const sphere of CREATION_SPHERE_NAMES) {
        const ind = resolveSignatureIndividualization(reach, sphere);
        expect(ind, `${reach} × ${sphere}`).not.toBeNull();
        expect(ind.nameFragment.length, `${reach} × ${sphere} nameFragment`).toBeGreaterThan(0);
        expect(ind.proseKey.length, `${reach} × ${sphere} proseKey`).toBeGreaterThan(0);
        expect(ind.twist.id.length, `${reach} × ${sphere} twist.id`).toBeGreaterThan(0);
        expect(ind.twist.trigger.length, `${reach} × ${sphere} twist.trigger`).toBeGreaterThan(0);
      }
    }
  });

  // The individualization bar: named effect WITH numbers. The composed default
  // is never mechanically empty — even time/entropy (no sphere_flavored_effect
  // table entry) carry the reach base passive.
  it('gives every cell a payload with at least the reach base passive', () => {
    for (const reach of REACH_DOMAINS) {
      for (const sphere of CREATION_SPHERE_NAMES) {
        const { twist } = resolveSignatureIndividualization(reach, sphere);
        expect(twist.payload.length, `${reach} × ${sphere}`).toBeGreaterThan(0);
        const basePassive = twist.payload.find(
          (e) => e.type === 'passive' && e.reach === reach,
        );
        expect(basePassive, `${reach} × ${sphere} base passive`).toBeDefined();
        if (basePassive && basePassive.type === 'passive') {
          expect(basePassive.value).toBe(SIGNATURE_DEFAULT_BASE_VALUE);
        }
      }
    }
  });

  it('layers the sphere-flavored passive on top of the reach base when the primitive table has one', () => {
    // `force` → iron passive in SPHERE_EFFECT_TABLE, so iron×force gets two passives.
    const ind = composeDefaultSignature('iron', 'force');
    const reaches = ind.twist.payload
      .filter((e) => e.type === 'passive')
      .map((e) => (e.type === 'passive' ? e.reach : null));
    expect(reaches).toContain('iron'); // base
    expect(ind.twist.payload.length).toBe(2); // base + sphere-flavored
  });

  it('still yields a real payload for creation spheres absent from the primitive table (time, entropy)', () => {
    for (const sphere of ['time', 'entropy'] as const) {
      const ind = composeDefaultSignature('stone', sphere);
      expect(ind.twist.payload.length).toBe(1); // reach base only, but non-empty
      expect(ind.nameFragment).toContain('of ');
    }
  });

  it('is pure/deterministic — same inputs produce equal individualization', () => {
    const a = resolveSignatureIndividualization('veil', 'mind');
    const b = resolveSignatureIndividualization('veil', 'mind');
    expect(a).toEqual(b);
  });

  it('prefers a bespoke matrix cell over the composed default', () => {
    // Inject a bespoke cell locally to prove the resolver branch (matrix is an
    // empty skeleton on main, so we patch a copy here, not the export).
    const bespoke: SignatureIndividualization = {
      twist: { id: 'test.bespoke', trigger: 'test trigger', payload: [] },
      nameFragment: 'Bespoke',
      proseKey: 'test.bespoke',
    };
    const original = SIGNATURE_MATRIX.iron.force;
    SIGNATURE_MATRIX.iron.force = bespoke;
    try {
      expect(resolveSignatureIndividualization('iron', 'force')).toBe(bespoke);
    } finally {
      if (original === undefined) delete SIGNATURE_MATRIX.iron.force;
      else SIGNATURE_MATRIX.iron.force = original;
    }
  });
});
