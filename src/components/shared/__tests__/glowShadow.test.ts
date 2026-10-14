/**
 * glowShadow — one helper for tinted halos (THR-1821). A glow is a strength,
 * not a number: the two strengths read their named constants, and any colour
 * expression (hex, token) passes through `color-mix` untouched.
 */
import { describe, it, expect } from 'vitest';
import {
  glowShadow,
  GLOW_SOFT_BLUR_PX,
  GLOW_SOFT_PCT,
  GLOW_STRONG_BLUR_PX,
  GLOW_STRONG_PCT,
} from '../sphereTint';

describe('glowShadow', () => {
  it('builds a soft glow from the soft constants', () => {
    expect(glowShadow('var(--sphere-fire-bright)', 'soft')).toBe(
      `0 0 ${GLOW_SOFT_BLUR_PX}px color-mix(in srgb, var(--sphere-fire-bright) ${GLOW_SOFT_PCT}%, transparent)`,
    );
  });

  it('builds a strong glow from the strong constants', () => {
    expect(glowShadow('#d4a843', 'strong')).toBe(
      `0 0 ${GLOW_STRONG_BLUR_PX}px color-mix(in srgb, #d4a843 ${GLOW_STRONG_PCT}%, transparent)`,
    );
  });

  it('a strong glow is wider and denser than a soft one', () => {
    expect(GLOW_STRONG_BLUR_PX).toBeGreaterThan(GLOW_SOFT_BLUR_PX);
    expect(GLOW_STRONG_PCT).toBeGreaterThan(GLOW_SOFT_PCT);
  });
});
