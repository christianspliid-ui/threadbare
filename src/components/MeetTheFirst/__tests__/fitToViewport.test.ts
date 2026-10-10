/**
 * THR-1804 item 3 — the bonding hand's fit. jsdom cannot lay out, so the browser
 * run measures `scrollHeight <= clientHeight` on the composed beat; this pins the
 * arithmetic the hook applies.
 */
import { describe, it, expect } from 'vitest';
import { fitScale, FORMATIVE_FIT_MIN_SCALE } from '../fitToViewport';

describe('fitScale (THR-1804)', () => {
  it('leaves content that already fits at natural size', () => {
    expect(fitScale(800, 1048)).toBe(1);
    expect(fitScale(1048, 1048)).toBe(1);
  });

  it('shrinks taller content to fit, never past the panel', () => {
    const s = fitScale(1150, 1048);
    expect(s).toBeLessThan(1);
    expect(1150 * s).toBeLessThanOrEqual(1048);
  });

  it('stops at the readability floor', () => {
    expect(fitScale(3000, 1000)).toBe(FORMATIVE_FIT_MIN_SCALE);
  });

  it('fail-soft on unmeasured input', () => {
    expect(fitScale(0, 1000)).toBe(1);
    expect(fitScale(1200, 0)).toBe(1);
    expect(fitScale(Number.NaN, 1000)).toBe(1);
  });
});
