/**
 * THR-1989 — UI Law 45: the opening screens' words read at rest at WCAG AA
 * (4.5:1) against the composited ground. The rgba is flattened onto the
 * screens' #0a0a0f ground first, which is how the browser draws it.
 */
import { describe, it, expect } from 'vitest';
import { FRAGMENT_CAPTION_REST_COLOR } from '../FragmentCard';

const GROUND: [number, number, number] = [10, 10, 15];
const AA = 4.5;

function flatten(rgba: string): [number, number, number] {
  const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) throw new Error(`not an rgba: ${rgba}`);
  const a = Number(m[4]);
  return [1, 2, 3].map(i => Number(m[i]) * a + GROUND[i - 1] * (1 - a)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(rgba: string): number {
  const fg = luminance(flatten(rgba));
  const bg = luminance(GROUND);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

describe('THR-1989 — opening captions meet Law 45 at rest', () => {
  it('origin, drive and hunger card words (shared rest colour)', () => {
    expect(contrast(FRAGMENT_CAPTION_REST_COLOR)).toBeGreaterThanOrEqual(AA);
  });

  it('the "What echoes?" and "You remember..." lines on the Origin screen', () => {
    expect(contrast('rgba(196,182,214,0.82)')).toBeGreaterThanOrEqual(AA);
    expect(contrast('rgba(155,196,169,0.82)')).toBeGreaterThanOrEqual(AA);
  });
});
