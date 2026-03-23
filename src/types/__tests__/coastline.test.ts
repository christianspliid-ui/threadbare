import { describe, it, expect } from 'vitest';
import {
  COASTLINE_DEFAULTS,
  type CoastlineConfig,
  type ContourLoop,
  type CoastlineData,
} from '../coastline';

describe('coastline types', () => {
  it('exports COASTLINE_DEFAULTS with all required fields', () => {
    const c = COASTLINE_DEFAULTS;
    expect(c.blobRadius).toBe(1.8);
    expect(c.threshold).toBe(0.35);
    expect(c.smoothPasses).toBe(2);
    expect(c.displacement).toBe(0.02);
    expect(c.noiseScale).toBe(0.02);
    expect(c.shallowWidth).toBe(0.28);
    expect(c.fieldResolution).toBe(4);
    expect(c.minLoopPoints).toBe(20);
  });

  it('exports COASTLINE_COLORS with all required fields', () => {
    expect(COASTLINE_DEFAULTS.colors.deepWater).toBe('#12243a');
    expect(COASTLINE_DEFAULTS.colors.shallows).toBe('#1e4858');
    expect(COASTLINE_DEFAULTS.colors.coastEdge).toBe('#5a4a28');
  });

  it('CoastlineData shape has loops and shallowLoops arrays', () => {
    const data: CoastlineData = { loops: [], shallowLoops: [] };
    expect(data.loops).toEqual([]);
    expect(data.shallowLoops).toEqual([]);
  });

  it('ContourLoop is an array of {x, y} points', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 8.66 },
    ];
    expect(loop).toHaveLength(3);
    expect(loop[0]).toEqual({ x: 0, y: 0 });
  });
});
