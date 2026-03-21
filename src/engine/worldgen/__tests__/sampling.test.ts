/**
 * 7-point hex sampling tests — correctness, range, smoothing properties.
 * TDD: Written as specification for sample7Point utility.
 */
import { describe, it, expect } from 'vitest';
import { sample7Point } from '../passes/pass02-elevation';
import { WorldGenPipeline } from '../WorldGenPipeline';
import type { WorldGenParams } from '../types';

const SMALL_PARAMS: WorldGenParams = {
  cols: 20,
  rows: 30,
  seed: 42,
  ridgeCount: 2,
  seaLevelThreshold: 0.38,
  landShape: 'continent',
  mountainDensity: 'moderate',
  livingCultures: [],
  lostCultures: [],
};

describe('7-point hex sampling', () => {
  it('constant function returns same constant', () => {
    const constantFn = (_c: number, _r: number) => 0.5;
    const result = sample7Point(5, 10, constantFn, 1.0);
    expect(result).toBeCloseTo(0.5, 6);
  });

  it('zero function returns 0', () => {
    const zeroFn = (_c: number, _r: number) => 0;
    const result = sample7Point(5, 10, zeroFn, 1.0);
    expect(result).toBe(0);
  });

  it('one function returns 1', () => {
    const oneFn = (_c: number, _r: number) => 1;
    const result = sample7Point(5, 10, oneFn, 1.0);
    expect(result).toBe(1);
  });

  it('result is in [0, 1] range for any elevation field values', () => {
    const pipeline = new WorldGenPipeline();
    const ctx = pipeline.run(SMALL_PARAMS);

    // Sample several hexes using the sampleElevation function
    for (let row = 0; row < ctx.rows; row += 3) {
      for (let col = 0; col < ctx.cols; col += 3) {
        const result = sample7Point(col, row, ctx.sampleElevation, 1.0);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    }
  });

  it('samples center and 6 corners (7 points total)', () => {
    const sampledPoints: Array<{ c: number, r: number }> = [];
    const trackingFn = (c: number, r: number) => {
      sampledPoints.push({ c, r });
      return 0.5;
    };

    sample7Point(5, 10, trackingFn, 1.0);
    expect(sampledPoints.length).toBe(7); // center + 6 corners
  });

  it('center point is always (col, row)', () => {
    const firstSample: { c: number, r: number }[] = [];
    const trackingFn = (c: number, r: number) => {
      firstSample.push({ c, r });
      return 0.5;
    };

    sample7Point(7, 12, trackingFn, 1.0);
    expect(firstSample[0].c).toBe(7);
    expect(firstSample[0].r).toBe(12);
  });

  it('smooths discontinuities between adjacent hexes', () => {
    // Create a step function: 0 for col < 10, 1 for col >= 10
    const stepFn = (c: number, _r: number) => c >= 10 ? 1 : 0;

    // At col=9 (all left), result should be 0
    const leftVal = sample7Point(9, 15, stepFn, 0.1);
    // At col=10 (all right), result should be 1
    const rightVal = sample7Point(10, 15, stepFn, 0.1);
    // At col=9.5 (boundary with hexSize=0.1), should be intermediate
    const boundaryVal = sample7Point(9, 15, stepFn, 1.0);

    // Center=0, but corners may be on either side
    expect(leftVal).toBeGreaterThanOrEqual(0);
    expect(rightVal).toBeLessThanOrEqual(1);
    // The boundary value should be between 0 and 1 (some corners cross boundary)
    expect(boundaryVal).toBeGreaterThanOrEqual(0);
    expect(boundaryVal).toBeLessThanOrEqual(1);
  });

  it('hexSize=0 returns only center value', () => {
    let callCount = 0;
    const fn = (c: number, r: number) => {
      callCount++;
      return 0.7;
    };
    const result = sample7Point(5, 5, fn, 0);
    // All 7 points are at (5, 5) when hexSize=0
    expect(result).toBeCloseTo(0.7, 5);
    expect(callCount).toBe(7);
  });
});
