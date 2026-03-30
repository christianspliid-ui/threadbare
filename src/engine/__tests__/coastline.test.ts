import { describe, it, expect } from 'vitest';
import {
  buildScalarField,
  extractContours,
  chainSegmentsIntoLoops,
  chaikinSmooth,
  displaceContour,
  ensureClockwise,
  signedArea,
  computeCoastline,
  contourLoopToSvgPath,
} from '../coastline';
import type { HexTile } from '../../types';
import type { ContourLoop } from '../../types/coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';

function makeTile(col: number, row: number, terrain: string = 'grassland'): HexTile {
  return {
    coord: { col, row },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: terrain as HexTile['terrain'],
  };
}

// ─── Task 3: Scalar Field ───────────────────────────────────────

describe('buildScalarField', () => {
  it('returns a Float32Array with correct dimensions', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0, 'ocean')];
    const result = buildScalarField(tiles, 30, 2, 1, { blobRadius: 1.8, fieldResolution: 4 });
    expect(result.field).toBeInstanceOf(Float32Array);
    expect(result.gridW).toBeGreaterThan(0);
    expect(result.gridH).toBeGreaterThan(0);
    expect(result.field.length).toBe(result.gridW * result.gridH);
  });

  it('land hex center has highest field value', () => {
    const tiles = [makeTile(0, 0)];
    const hexSize = 30;
    const result = buildScalarField(tiles, hexSize, 1, 1, { blobRadius: 1.8, fieldResolution: 4 });
    const centerGx = Math.round(hexSize / result.fieldRes);
    const centerGy = Math.round(hexSize / result.fieldRes);
    const centerVal = result.field[centerGy * result.gridW + centerGx];
    expect(centerVal).toBeGreaterThan(0);
  });

  it('ocean hex does NOT contribute to field', () => {
    const tiles = [makeTile(0, 0, 'ocean')];
    const result = buildScalarField(tiles, 30, 1, 1, { blobRadius: 1.8, fieldResolution: 4 });
    const allZero = result.field.every(v => v === 0);
    expect(allZero).toBe(true);
  });

  it('field value decays with distance from land hex', () => {
    const tiles = [makeTile(10, 10)];
    const hexSize = 30;
    const result = buildScalarField(tiles, hexSize, 20, 20, { blobRadius: 1.8, fieldResolution: 4 });
    // Find max value in field (should be near the land hex)
    let maxVal = 0;
    let maxIdx = 0;
    for (let i = 0; i < result.field.length; i++) {
      if (result.field[i] > maxVal) {
        maxVal = result.field[i];
        maxIdx = i;
      }
    }
    // Check that values decay away from max
    const maxRow = Math.floor(maxIdx / result.gridW);
    const maxCol = maxIdx % result.gridW;
    const nearbyIdx = (maxRow + 10) * result.gridW + (maxCol + 10); // 10 grid cells away
    const nearbyVal = result.field[nearbyIdx] || 0;
    expect(maxVal).toBeGreaterThan(nearbyVal);
  });
});

// ─── Task 4: Marching Squares + Chaining ────────────────────────

describe('extractContours (marching squares)', () => {
  it('returns empty array for uniform field (all above threshold)', () => {
    const field = new Float32Array(9).fill(1.0);
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments).toHaveLength(0);
  });

  it('returns empty array for uniform field (all below threshold)', () => {
    const field = new Float32Array(9).fill(0.0);
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments).toHaveLength(0);
  });

  it('produces segments when field has both above and below threshold', () => {
    const field = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    const segments = extractContours(field, 3, 3, 0.5);
    expect(segments.length).toBeGreaterThan(0);
    for (const seg of segments) {
      expect(seg.p1).toHaveProperty('x');
      expect(seg.p1).toHaveProperty('y');
      expect(seg.p2).toHaveProperty('x');
      expect(seg.p2).toHaveProperty('y');
    }
  });
});

describe('chainSegmentsIntoLoops', () => {
  it('returns empty for no segments', () => {
    expect(chainSegmentsIntoLoops([])).toEqual([]);
  });

  it('chains a simple square into one loop', () => {
    const segments = [
      { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
      { p1: { x: 10, y: 0 }, p2: { x: 10, y: 10 } },
      { p1: { x: 10, y: 10 }, p2: { x: 0, y: 10 } },
      { p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } },
    ];
    const loops = chainSegmentsIntoLoops(segments);
    expect(loops).toHaveLength(1);
    expect(loops[0].length).toBeGreaterThanOrEqual(4);
  });

  it('produces separate loops for disconnected segment groups', () => {
    const segments = [
      { p1: { x: 0, y: 0 }, p2: { x: 5, y: 0 } },
      { p1: { x: 5, y: 0 }, p2: { x: 5, y: 5 } },
      { p1: { x: 5, y: 5 }, p2: { x: 0, y: 0 } },
      { p1: { x: 100, y: 100 }, p2: { x: 105, y: 100 } },
      { p1: { x: 105, y: 100 }, p2: { x: 105, y: 105 } },
      { p1: { x: 105, y: 105 }, p2: { x: 100, y: 100 } },
    ];
    const loops = chainSegmentsIntoLoops(segments);
    expect(loops).toHaveLength(2);
  });
});

// ─── Task 5: Smoothing, Displacement, Winding ──────────────────

describe('chaikinSmooth', () => {
  it('returns same points for 0 passes', () => {
    const triangle: ContourLoop = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    expect(chaikinSmooth(triangle, 0)).toEqual(triangle);
  });

  it('doubles point count per pass (closed loop)', () => {
    const triangle: ContourLoop = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];
    const smoothed = chaikinSmooth(triangle, 1);
    expect(smoothed).toHaveLength(6);
  });

  it('two passes quadruples point count', () => {
    const square: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const smoothed = chaikinSmooth(square, 2);
    expect(smoothed).toHaveLength(16);
  });
});

describe('ensureClockwise', () => {
  it('does not reverse already-CCW loops (prototype convention)', () => {
    const ccw: ContourLoop = [
      { x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 },
    ];
    // Prototype convention: ensureClockwise ensures negative signedArea (CCW in screen coords)
    expect(signedArea(ccw)).toBeLessThan(0);
    const result = ensureClockwise([...ccw]);
    expect(signedArea(result)).toBeLessThan(0);
  });

  it('reverses CW loops to CCW (prototype convention)', () => {
    const cw: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    // In screen coordinates (y down), CW is positive — should be reversed
    expect(signedArea(cw)).toBeGreaterThan(0);
    const result = ensureClockwise([...cw]);
    expect(signedArea(result)).toBeLessThan(0);
  });
});

describe('displaceContour', () => {
  it('returns same length array', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const displaced = displaceContour(loop, 42, 0.02, 0.5);
    expect(displaced).toHaveLength(loop.length);
  });

  it('no displacement when amplitude is 0', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const displaced = displaceContour(loop, 42, 0.02, 0);
    for (let i = 0; i < loop.length; i++) {
      expect(displaced[i].x).toBeCloseTo(loop[i].x, 5);
      expect(displaced[i].y).toBeCloseTo(loop[i].y, 5);
    }
  });

  it('is deterministic with same seed', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const a = displaceContour(loop, 42, 0.02, 0.5);
    const b = displaceContour(loop, 42, 0.02, 0.5);
    expect(a).toEqual(b);
  });
});

// ─── Task 6: Full Pipeline ──────────────────────────────────────

describe('computeCoastline (full pipeline)', () => {
  function makeGrid(cols: number, rows: number, waterFn: (c: number, r: number) => boolean): HexTile[] {
    const tiles: HexTile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push(makeTile(c, r, waterFn(c, r) ? 'ocean' : 'grassland'));
      }
    }
    return tiles;
  }

  it('returns empty loops for all-water map', () => {
    const tiles = makeGrid(5, 5, () => true);
    const result = computeCoastline(tiles, 30, 5, 5, 42, COASTLINE_DEFAULTS);
    expect(result.loops).toHaveLength(0);
    expect(result.shallowLoops).toHaveLength(0);
  });

  it('returns loops for island map (land center, water edges)', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const result = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(result.loops.length).toBeGreaterThan(0);
    for (const loop of result.loops) {
      expect(loop.length).toBeGreaterThanOrEqual(COASTLINE_DEFAULTS.minLoopPoints);
    }
  });

  it('produces shallowLoops when shallowWidth > 0', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const result = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(result.shallowLoops.length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed gives same loops', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const a = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    const b = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    expect(a.loops).toEqual(b.loops);
    expect(a.shallowLoops).toEqual(b.shallowLoops);
  });

  it('different seeds produce different loops', () => {
    const tiles = makeGrid(7, 7, (c, r) => c < 2 || c > 4 || r < 2 || r > 4);
    const a = computeCoastline(tiles, 30, 7, 7, 42, COASTLINE_DEFAULTS);
    const b = computeCoastline(tiles, 30, 7, 7, 99, COASTLINE_DEFAULTS);
    const aStr = JSON.stringify(a.loops);
    const bStr = JSON.stringify(b.loops);
    expect(aStr).not.toBe(bStr);
  });
});

// ─── Task 7: SVG Path Conversion ────────────────────────────────

describe('contourLoopToSvgPath', () => {
  it('produces valid SVG path d string for a triangle', () => {
    const loop: ContourLoop = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8.66 },
    ];
    const d = contourLoopToSvgPath(loop);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/Z$/);
    expect(d).toContain('L');
  });

  it('returns empty string for degenerate loop (< 3 points)', () => {
    expect(contourLoopToSvgPath([])).toBe('');
    expect(contourLoopToSvgPath([{ x: 0, y: 0 }])).toBe('');
    expect(contourLoopToSvgPath([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe('');
  });

  it('rounds coordinates to 1 decimal for compact output', () => {
    const loop: ContourLoop = [
      { x: 1.23456, y: 7.89012 },
      { x: 10.5, y: 0 },
      { x: 5, y: 8.66 },
    ];
    const d = contourLoopToSvgPath(loop);
    expect(d).toContain('1.2');
    expect(d).not.toContain('1.23456');
  });
});
