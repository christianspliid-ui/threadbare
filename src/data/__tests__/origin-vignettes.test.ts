import { describe, it, expect } from 'vitest';
import {
  ORIGIN_VIGNETTES,
  type OriginVignettePole,
  type OriginVignetteMagnitude,
} from '../origin-vignettes';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';

const POLES: OriginVignettePole[] = ['virtue', 'vice'];
const ALLOWED_MAGNITUDES: OriginVignetteMagnitude[] = [0.05, 0.1, 0.15, 0.2];
/** Per-(reach, pole) bucket coverage target from THR-539 (~8 each). */
const PER_BUCKET_TARGET = 8;
/** Total-library floor from THR-539 Done-when. */
const TOTAL_FLOOR = 130;

function bucket(reach: ReachDomain, pole: OriginVignettePole) {
  return ORIGIN_VIGNETTES.filter((v) => v.reach === reach && v.pole === pole);
}

describe('ORIGIN_VIGNETTES', () => {
  it(`has at least ${TOTAL_FLOOR} vignettes`, () => {
    expect(ORIGIN_VIGNETTES.length).toBeGreaterThanOrEqual(TOTAL_FLOOR);
  });

  it('covers all 8 reaches and both poles', () => {
    const reaches = new Set(ORIGIN_VIGNETTES.map((v) => v.reach));
    const poles = new Set(ORIGIN_VIGNETTES.map((v) => v.pole));
    for (const reach of REACH_DOMAINS) expect(reaches.has(reach)).toBe(true);
    for (const pole of POLES) expect(poles.has(pole)).toBe(true);
  });

  it(`gives every (reach, pole) bucket >= ${PER_BUCKET_TARGET} vignettes`, () => {
    for (const reach of REACH_DOMAINS) {
      for (const pole of POLES) {
        expect(bucket(reach, pole).length).toBeGreaterThanOrEqual(PER_BUCKET_TARGET);
      }
    }
  });

  it('only uses the four allowed magnitudes', () => {
    for (const v of ORIGIN_VIGNETTES) {
      expect(ALLOWED_MAGNITUDES).toContain(v.magnitude);
    }
  });

  it('skews toward the smaller deltas (0.05/0.10) for a central-limit baseline', () => {
    const small = ORIGIN_VIGNETTES.filter((v) => v.magnitude <= 0.1).length;
    const large = ORIGIN_VIGNETTES.filter((v) => v.magnitude > 0.1).length;
    expect(small).toBeGreaterThan(large);
  });

  it('uses only the two valid pole values', () => {
    for (const v of ORIGIN_VIGNETTES) {
      expect(POLES).toContain(v.pole);
    }
  });

  it('has stable, unique ids', () => {
    const ids = ORIGIN_VIGNETTES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ids follow the origin.<reach>.<pole>.<slug> convention', () => {
    for (const v of ORIGIN_VIGNETTES) {
      expect(v.id).toMatch(/^origin\.[a-z]+\.(virtue|vice)\.[a-z0-9-]+$/);
      expect(v.id.startsWith(`origin.${v.reach}.${v.pole}.`)).toBe(true);
    }
  });

  it('has non-empty, trimmed text on every entry', () => {
    for (const v of ORIGIN_VIGNETTES) {
      expect(v.text.length).toBeGreaterThan(0);
      expect(v.text).toBe(v.text.trim());
    }
  });
});
