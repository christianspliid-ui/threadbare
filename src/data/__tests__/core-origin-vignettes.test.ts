import { describe, it, expect } from 'vitest';
import {
  CORE_ORIGIN_VIGNETTES,
  CORE_ORIGIN_VIGNETTES_BY_CONTINUUM,
  type CoreOriginVignettePole,
  type CoreOriginVignetteMagnitude,
} from '../core-origin-vignettes';
import { CORE_CONTINUUM_IDS } from '../../types/coreRegistry';

const POLES: CoreOriginVignettePole[] = ['virtue', 'vice'];
const ALLOWED_MAGNITUDES: CoreOriginVignetteMagnitude[] = [0.05, 0.1, 0.15, 0.2];
/** Per-(continuum, pole) bucket coverage target. */
const PER_BUCKET_TARGET = 6;
/** Total-library floor (5 continuums × 2 poles × 6). */
const TOTAL_FLOOR = 60;

function bucket(continuumId: string, pole: CoreOriginVignettePole) {
  return CORE_ORIGIN_VIGNETTES.filter((v) => v.continuumId === continuumId && v.pole === pole);
}

describe('CORE_ORIGIN_VIGNETTES', () => {
  it(`has at least ${TOTAL_FLOOR} vignettes`, () => {
    expect(CORE_ORIGIN_VIGNETTES.length).toBeGreaterThanOrEqual(TOTAL_FLOOR);
  });

  it('covers all 5 Core continuums and both poles', () => {
    const continuums = new Set(CORE_ORIGIN_VIGNETTES.map((v) => v.continuumId));
    const poles = new Set(CORE_ORIGIN_VIGNETTES.map((v) => v.pole));
    for (const id of CORE_CONTINUUM_IDS) expect(continuums.has(id)).toBe(true);
    for (const pole of POLES) expect(poles.has(pole)).toBe(true);
  });

  it(`gives every (continuum, pole) bucket >= ${PER_BUCKET_TARGET} vignettes`, () => {
    for (const id of CORE_CONTINUUM_IDS) {
      for (const pole of POLES) {
        expect(bucket(id, pole).length).toBeGreaterThanOrEqual(PER_BUCKET_TARGET);
      }
    }
  });

  it('only references continuum ids that exist in the registry', () => {
    const known = new Set(CORE_CONTINUUM_IDS);
    for (const v of CORE_ORIGIN_VIGNETTES) {
      expect(known.has(v.continuumId)).toBe(true);
    }
  });

  it('only uses the four allowed magnitudes', () => {
    for (const v of CORE_ORIGIN_VIGNETTES) {
      expect(ALLOWED_MAGNITUDES).toContain(v.magnitude);
    }
  });

  it('skews toward the smaller deltas (0.05/0.10) for a central-limit baseline', () => {
    const small = CORE_ORIGIN_VIGNETTES.filter((v) => v.magnitude <= 0.1).length;
    const large = CORE_ORIGIN_VIGNETTES.filter((v) => v.magnitude > 0.1).length;
    expect(small).toBeGreaterThan(large);
  });

  it('uses only the two valid pole values', () => {
    for (const v of CORE_ORIGIN_VIGNETTES) {
      expect(POLES).toContain(v.pole);
    }
  });

  it('has stable, unique ids', () => {
    const ids = CORE_ORIGIN_VIGNETTES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids follow the core-origin.<continuumId>.<pole>.<slug> convention', () => {
    for (const v of CORE_ORIGIN_VIGNETTES) {
      expect(v.id).toMatch(/^core-origin\.core_[a-z]+\.(virtue|vice)\.[a-z0-9-]+$/);
      expect(v.id.startsWith(`core-origin.${v.continuumId}.${v.pole}.`)).toBe(true);
    }
  });

  it('has non-empty, trimmed text on every entry', () => {
    for (const v of CORE_ORIGIN_VIGNETTES) {
      expect(v.text.length).toBeGreaterThan(0);
      expect(v.text).toBe(v.text.trim());
    }
  });

  it('exposes a by-continuum index with both poles populated for each continuum', () => {
    for (const id of CORE_CONTINUUM_IDS) {
      const entry = CORE_ORIGIN_VIGNETTES_BY_CONTINUUM.get(id);
      expect(entry).toBeDefined();
      expect(entry!.virtue.length).toBeGreaterThan(0);
      expect(entry!.vice.length).toBeGreaterThan(0);
    }
  });
});
