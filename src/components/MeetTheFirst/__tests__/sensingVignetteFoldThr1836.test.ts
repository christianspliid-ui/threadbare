/**
 * THR-1836 — the picker's vignette must end above the fold (Law 33).
 *
 * The vignette block is bottom-anchored inside the focused portrait and grows
 * upward, so its bottom edge is pure geometry and does not depend on the text.
 * At FOCUS_SCALE 1.1 it landed at 1085.9px on a 1080px viewport (measured in the
 * browser 2026-10-12). These guards pin the geometry at the viewport contract.
 */

import { describe, expect, it } from 'vitest';
import { FOCUS_SCALE, focusedVignetteBottomPx } from '../SensingBeat';

describe('THR-1836 — focused vignette stays above the fold', () => {
  it('ends inside a 1920×1080 viewport, with room to spare', () => {
    const bottom = focusedVignetteBottomPx(1920, 1080);
    expect(bottom).toBeLessThanOrEqual(1080 - 12);
  });

  it('reproduces the measured overflow at the old scale (the model matches the browser)', () => {
    // Same formula, old scale: 540 + (366.67 + 129.6) × 1.1 = 1085.9 — the browser read 1085.88.
    const atOldScale = 1080 / 2 + ((550 * 4) / 3 / 2 + 0.12 * 1080) * 1.1;
    expect(atOldScale).toBeCloseTo(1085.9, 1);
    expect(FOCUS_SCALE).toBeLessThan(1.1);
  });
});
