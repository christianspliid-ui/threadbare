import { describe, it, expect } from 'vitest';
import { hexToWorld, hexToWorldWithOffset } from '../worldPosition';
import { hexToPixel } from '../hexMath';
import { HEX_CONSTANTS } from '../../components/HexMapV2/scene/HexFillMesh';

const SIZE = HEX_CONSTANTS.HEX_SIZE;

describe('hexToWorld', () => {
  it('returns hexToPixel x with negated y', () => {
    const hex = { col: 3, row: 5 };
    const pixel = hexToPixel(hex, SIZE);
    const world = hexToWorld(hex, SIZE);
    expect(world.x).toBe(pixel.x);
    expect(world.y).toBe(-pixel.y);
  });

  it('origin hex produces (0, -0)', () => {
    const world = hexToWorld({ col: 0, row: 0 }, SIZE);
    expect(world.x).toBe(0);
    expect(world.y).toBe(-0); // hexToPixel(0,0) = {x:0, y:0}, negated = -0
  });

  it('accepts custom hex size', () => {
    const hex = { col: 1, row: 0 };
    const customSize = 20;
    const pixel = hexToPixel(hex, customSize);
    const world = hexToWorld(hex, customSize);
    expect(world.x).toBe(pixel.x);
    expect(world.y).toBe(-pixel.y);
  });

  it('positive SVG y produces negative world y', () => {
    const hex = { col: 0, row: 5 };
    const pixel = hexToPixel(hex, SIZE);
    expect(pixel.y).toBeGreaterThan(0); // SVG y-down
    const world = hexToWorld(hex, SIZE);
    expect(world.y).toBeLessThan(0); // Three.js y-up
  });
});

describe('hexToWorldWithOffset', () => {
  it('applies offset before Y-flip', () => {
    const hex = { col: 0, row: 0 };
    const offset = { x: 5, y: 10 };
    const world = hexToWorldWithOffset(hex, offset, SIZE);
    expect(world.x).toBe(5);
    expect(world.y).toBe(-10);
  });

  it('matches manual hexToPixel + offset + Y-flip', () => {
    const hex = { col: 3, row: 2 };
    const offset = { x: 1.5, y: -0.5 };
    const pixel = hexToPixel(hex, SIZE);
    const expected = { x: pixel.x + offset.x, y: -(pixel.y + offset.y) };
    const world = hexToWorldWithOffset(hex, offset, SIZE);
    expect(world.x).toBeCloseTo(expected.x);
    expect(world.y).toBeCloseTo(expected.y);
  });

  it('zero offset equals hexToWorld', () => {
    const hex = { col: 4, row: 1 };
    const world = hexToWorld(hex, SIZE);
    const withOffset = hexToWorldWithOffset(hex, { x: 0, y: 0 }, SIZE);
    expect(withOffset.x).toBe(world.x);
    expect(withOffset.y).toBe(world.y);
  });
});
