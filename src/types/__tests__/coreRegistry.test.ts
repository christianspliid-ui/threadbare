import { describe, it, expect } from 'vitest';
import {
  CORE_CONTINUA,
  CORE_CONTINUUM_IDS,
  CORE_NEUTRAL,
  CORE_VIRTUE,
  CORE_VICE,
  getCoreContinuum,
  getCorePoleLabel,
} from '../coreRegistry';

/**
 * The THR-542 spec's five Core continuums, restated independently here as the
 * test oracle so a regression in the registry can't silently match the source.
 */
const SPEC = {
  core_warmth: { virtue: 'Warm', vice: 'Cold', governs: 'care for others' },
  core_hope: { virtue: 'Hopeful', vice: 'Bitter', governs: 'outlook' },
  core_forgiveness: { virtue: 'Forgiving', vice: 'Vengeful', governs: 'how harm is metabolized' },
  core_humility: { virtue: 'Humble', vice: 'Proud', governs: 'self-regard' },
  core_integrity: { virtue: 'True', vice: 'False', governs: 'inner self matches outer' },
} as const;

describe('coreRegistry — canonical scale', () => {
  it('documents the 0–1 scale with 0.5 neutral, 1.0 virtue, 0.0 vice', () => {
    expect(CORE_NEUTRAL).toBe(0.5);
    expect(CORE_VIRTUE).toBe(1.0);
    expect(CORE_VICE).toBe(0.0);
  });
});

describe('coreRegistry — completeness', () => {
  it('has exactly five continuums', () => {
    expect(CORE_CONTINUA).toHaveLength(5);
  });

  it('exposes unique, stable, core_-prefixed ids matching CORE_CONTINUUM_IDS', () => {
    const ids = CORE_CONTINUA.map((c) => c.continuumId);
    expect(ids).toEqual([...CORE_CONTINUUM_IDS]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      // Never confusable with a reach axis (`<reach>_axis`).
      expect(id.startsWith('core_')).toBe(true);
      expect(id.endsWith('_axis')).toBe(false);
    }
  });

  it('matches the THR-542 virtue/vice words and governs text exactly', () => {
    for (const [id, spec] of Object.entries(SPEC)) {
      const c = getCoreContinuum(id);
      expect(c, `missing continuum ${id}`).toBeDefined();
      expect(c!.virtue.word).toBe(spec.virtue);
      expect(c!.vice.word).toBe(spec.vice);
      expect(c!.governs).toBe(spec.governs);
    }
  });

  it('marks only core_integrity (True↔False) as the most Quintessence-native', () => {
    const native = CORE_CONTINUA.filter((c) => c.quintessenceNative).map((c) => c.continuumId);
    expect(native).toEqual(['core_integrity']);
  });
});

describe('coreRegistry — reach couplings (v1, spec-stated only)', () => {
  it('encodes only the explicitly-stated couplings; signs are toward virtue', () => {
    expect(getCoreContinuum('core_warmth')!.reachCouplings).toEqual([
      { reach: 'gold', sign: 1 },
      { reach: 'heart', sign: 1 },
    ]);
    expect(getCoreContinuum('core_humility')!.reachCouplings).toEqual([{ reach: 'iron', sign: 1 }]);
    expect(getCoreContinuum('core_integrity')!.reachCouplings).toEqual([
      { reach: 'shadow', sign: 1 },
      { reach: 'eye', sign: 1 },
    ]);
    // Deliberately empty until the content slice authors them.
    expect(getCoreContinuum('core_hope')!.reachCouplings).toEqual([]);
    expect(getCoreContinuum('core_forgiveness')!.reachCouplings).toEqual([]);
  });
});

describe('coreRegistry — helpers', () => {
  it('getCoreContinuum returns undefined for unknown ids', () => {
    expect(getCoreContinuum('iron_axis')).toBeUndefined();
    expect(getCoreContinuum('nope')).toBeUndefined();
  });

  it('getCorePoleLabel returns the right pole word, or undefined for unknown', () => {
    expect(getCorePoleLabel('core_warmth', 'virtue')!.word).toBe('Warm');
    expect(getCorePoleLabel('core_warmth', 'vice')!.word).toBe('Cold');
    expect(getCorePoleLabel('core_integrity', 'vice')!.word).toBe('False');
    expect(getCorePoleLabel('unknown', 'virtue')).toBeUndefined();
  });
});
