import { describe, it, expect } from 'vitest';
import {
  getCultureFoundationPairKey,
  DEFAULT_LIGHT_DARKNESS_POLE,
  DEFAULT_ORDER_CHAOS_POLE,
} from '../cultureFoundationPair';
import { CULTURE_LOCATION_PROSE } from '../../data/prose-layer-content';
import { FOUNDATION_SPHERE_NAMES, SPHERE_NAMES } from '../../types';

describe('getCultureFoundationPairKey (THR-1623)', () => {
  it('fills the other axis from the venerated spheres', () => {
    expect(getCultureFoundationPairKey({ foundationBias: 'order', veneratedSpheres: ['darkness'] }))
      .toBe('order_darkness');
    expect(getCultureFoundationPairKey({ foundationBias: 'chaos', veneratedSpheres: ['mind', 'light'] }))
      .toBe('chaos_light');
    expect(getCultureFoundationPairKey({ foundationBias: 'light', veneratedSpheres: ['chaos'] }))
      .toBe('chaos_light');
    expect(getCultureFoundationPairKey({ foundationBias: 'darkness', veneratedSpheres: ['order', 'time'] }))
      .toBe('order_darkness');
  });

  it('takes the axis default when the culture venerates neither pole of the other axis', () => {
    expect(getCultureFoundationPairKey({ foundationBias: 'order', veneratedSpheres: ['force'] }))
      .toBe(`order_${DEFAULT_LIGHT_DARKNESS_POLE}`);
    expect(getCultureFoundationPairKey({ foundationBias: 'darkness', veneratedSpheres: [] }))
      .toBe(`${DEFAULT_ORDER_CHAOS_POLE}_darkness`);
  });

  it('never produces light_light or darkness_darkness — Light/Darkness cultures take an Order/Chaos pole', () => {
    expect(getCultureFoundationPairKey({ foundationBias: 'light', veneratedSpheres: ['light'] }))
      .toBe(`${DEFAULT_ORDER_CHAOS_POLE}_light`);
    expect(getCultureFoundationPairKey({ foundationBias: 'darkness', veneratedSpheres: ['darkness'] }))
      .toBe(`${DEFAULT_ORDER_CHAOS_POLE}_darkness`);
  });

  it('every foundation, with any one or two venerated spheres, resolves to an authored key', () => {
    for (const bias of FOUNDATION_SPHERE_NAMES) {
      for (const a of SPHERE_NAMES) {
        for (const b of [undefined, ...SPHERE_NAMES]) {
          const spheres = b ? [a, b] : [a];
          const key = getCultureFoundationPairKey({ foundationBias: bias, veneratedSpheres: spheres });
          expect(key, `${bias} + ${spheres.join(',')}`).not.toBeNull();
          expect(CULTURE_LOCATION_PROSE[key!], `${bias} + ${spheres.join(',')} → ${key}`).toBeDefined();
        }
      }
    }
  });

  it('honours a legacy explicit foundationPair, and fails soft on an unknown foundation', () => {
    expect(getCultureFoundationPairKey({ foundationPair: 'chaos_darkness', foundationBias: 'order' }))
      .toBe('chaos_darkness');
    expect(getCultureFoundationPairKey({ foundationBias: 'entropy' })).toBeNull();
    expect(getCultureFoundationPairKey({})).toBeNull();
    expect(getCultureFoundationPairKey(undefined)).toBeNull();
  });
});
