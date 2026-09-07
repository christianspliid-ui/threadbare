/**
 * THR-1422 — the sphere palette paints exactly what it painted before.
 *
 * De-duplicating `SPHERE_COLORS` and `REACH_TO_SPHERE` moved the declaration
 * from `components/icons/constants.ts` to `data/premonition-constants.ts`. No
 * visual change is intended, and "no visual change" is the hardest claim to
 * evidence: every existing icon test derives its expected colour from the very
 * constants the change moved, so all of them would keep passing if the surface
 * were re-pointed at a divergent map. They assert self-consistency, not parity.
 *
 * This file is the missing oracle. The hex strings below are **literals
 * transcribed from the pre-change tree** (`icons/constants.ts` before the move),
 * not reads of the live constant — so they still say what the UI used to paint
 * even after the source of truth moved out from under them. If a later edit
 * changes the palette, or points a renderer at some third map, these fail.
 *
 * That deliberately makes this test a maintenance cost when the palette is
 * *intentionally* re-tuned. That is the point: an intentional palette change
 * should have to say so here, in one obvious place.
 *
 * This is also the sanctioned Browser-verify substitution for the run that
 * shipped THR-1422 — `jsdom-render`, an unattended scheduled run with no
 * startable dev server (Docs/canon/verification-gates.md § Browser-verify).
 */
import { describe, it, expect } from 'vitest';

import { generateReachIconSvg } from '../ReachIcon';
import { generateSphereIconSvg } from '../SphereIcon';
import { SPHERE_COLORS, REACH_TO_SPHERE, SPHERE_COLORS_BASE } from '../constants';
import { SPHERE_NAMES } from '../../../types/index';
import { REACH_DOMAINS } from '../../../types/traits';

/** Transcribed from `components/icons/constants.ts` as it stood before THR-1422. */
const PALETTE_BEFORE: Readonly<Record<string, string>> = {
  force: '#ff6b6b', matter: '#d4a87a', energy: '#ffe44d', life: '#33ff77',
  mind: '#44aaff', spirit: '#cc66ff', time: '#ffb355', entropy: '#8fd4c0',
  chaos: '#d4d4d8', order: '#fbbf24', light: '#fef3c7', darkness: '#8b7fbf',
};

/** Likewise, the reach→sphere mapping as it stood before the move. */
const REACH_TO_SPHERE_BEFORE: Readonly<Record<string, string>> = {
  iron: 'force', stone: 'matter', eye: 'energy', gold: 'life',
  veil: 'mind', heart: 'spirit', star: 'time', shadow: 'entropy',
};

describe('sphere colour render parity across the THR-1422 move', () => {
  it('the live palette still equals the pre-change palette, key for key', () => {
    expect({ ...SPHERE_COLORS }).toEqual(PALETTE_BEFORE);
    expect({ ...REACH_TO_SPHERE }).toEqual(REACH_TO_SPHERE_BEFORE);
  });

  it('covers every sphere and every reach, so the parity check is not partial', () => {
    // Falsification guard: a shrunken SPHERE_NAMES / REACH_DOMAINS would make the
    // render loops below assert almost nothing while still reporting green.
    expect(SPHERE_NAMES).toHaveLength(12);
    expect(REACH_DOMAINS).toHaveLength(8);
    expect(Object.keys(PALETTE_BEFORE)).toHaveLength(12);
    expect(Object.keys(REACH_TO_SPHERE_BEFORE)).toHaveLength(8);
  });

  it('every reach icon renders the colour it rendered before', () => {
    for (const reach of REACH_DOMAINS) {
      const expected = PALETTE_BEFORE[REACH_TO_SPHERE_BEFORE[reach]];
      const svg = generateReachIconSvg(reach, 32);
      expect(svg, `${reach} icon should still paint ${expected}`).toContain(expected);
    }
  });

  it('every sphere icon renders the colour it rendered before', () => {
    for (const sphere of SPHERE_NAMES) {
      const expected = PALETTE_BEFORE[sphere];
      const svg = generateSphereIconSvg(sphere, 32);
      expect(svg, `${sphere} icon should still paint ${expected}`).toContain(expected);
    }
  });

  it('both icon variants still fall back to the moved palette', () => {
    // Both variants read SPHERE_COLORS as the CSS-variable fallback and differ
    // only in which variable they name — `--sphere-X` vs `--sphere-X-bright`.
    // SPHERE_COLORS_BASE is *not* wired into this generator; it stayed declared
    // at the icons site and is asserted distinct in the ownership test rather
    // than here, where it would look like a rendering claim it does not make.
    const base = generateSphereIconSvg('order', 32, 'base');
    const bright = generateSphereIconSvg('order', 32, 'bright');

    expect(base).toContain(`var(--sphere-order, ${PALETTE_BEFORE['order']})`);
    expect(bright).toContain(`var(--sphere-order-bright, ${PALETTE_BEFORE['order']})`);
    expect(base).not.toBe(bright);

    // The map that did not move is still reachable and still distinct.
    expect(SPHERE_COLORS_BASE['order']).not.toBe(PALETTE_BEFORE['order']);
  });
});
