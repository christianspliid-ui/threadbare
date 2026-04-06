import { describe, it, expect } from 'vitest';
import {
  PARCHMENT_FOG_CONSTANTS,
  FOG_VERTEX_SHADER,
  FOG_FRAGMENT_SHADER,
} from '../fogShader';

describe('PARCHMENT_FOG_CONSTANTS', () => {
  it('has parchment texture path', () => {
    expect(PARCHMENT_FOG_CONSTANTS.PARCHMENT_TEXTURE_PATH).toBe('/textures/parchment-512.png');
  });

  it('has sepia strength between 0 and 1', () => {
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_STRENGTH).toBeGreaterThan(0);
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_STRENGTH).toBeLessThanOrEqual(1);
  });

  it('has sepia brightness scale between 0 and 1', () => {
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_BRIGHTNESS_SCALE).toBeGreaterThan(0);
    expect(PARCHMENT_FOG_CONSTANTS.SEPIA_BRIGHTNESS_SCALE).toBeLessThanOrEqual(1);
  });

  it('has fog state values for all three states', () => {
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_UNEXPLORED).toBe(0.0);
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_REMEMBERED).toBe(0.5);
    expect(PARCHMENT_FOG_CONSTANTS.FOG_STATE_VISIBLE).toBe(1.0);
  });

  it('has parchment fallback color', () => {
    expect(PARCHMENT_FOG_CONSTANTS.PARCHMENT_FALLBACK_COLOR).toBe('#3d3025');
  });
});

describe('FOG_VERTEX_SHADER', () => {
  it('is a non-empty string containing vFogState varying', () => {
    expect(FOG_VERTEX_SHADER.length).toBeGreaterThan(0);
    expect(FOG_VERTEX_SHADER).toContain('vFogState');
  });

  it('contains instanceMatrix for instanced rendering', () => {
    expect(FOG_VERTEX_SHADER).toContain('instanceMatrix');
  });
});

describe('FOG_FRAGMENT_SHADER', () => {
  it('is a non-empty string containing uParchmentTex uniform', () => {
    expect(FOG_FRAGMENT_SHADER.length).toBeGreaterThan(0);
    expect(FOG_FRAGMENT_SHADER).toContain('uParchmentTex');
  });

  it('contains fog state branching logic', () => {
    expect(FOG_FRAGMENT_SHADER).toContain('vFogState');
  });
});
