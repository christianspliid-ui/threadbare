/**
 * labelCollision.test.ts — Tests for removeOverlaps AABB collision detection.
 *
 * TDD RED phase: all tests fail until labelCollision.ts is implemented.
 */

import { describe, it, expect } from 'vitest';
import { removeOverlaps, estimateBBox, applyCachedVisibility } from '../labelCollision';
import type { ScreenLabel } from '../labelCollision';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeLabel(
  id: string,
  tier: ScreenLabel['tier'],
  screenX: number,
  screenY: number,
): ScreenLabel {
  return { id, tier, text: id, screenX, screenY, visible: true };
}

// ─── estimateBBox ─────────────────────────────────────────────────────────────

describe('estimateBBox', () => {
  it('returns finite left/right/top/bottom for a label', () => {
    const label = makeLabel('k0', 'realm', 100, 100);
    const bbox = estimateBBox(label);
    expect(Number.isFinite(bbox.left)).toBe(true);
    expect(Number.isFinite(bbox.right)).toBe(true);
    expect(Number.isFinite(bbox.top)).toBe(true);
    expect(Number.isFinite(bbox.bottom)).toBe(true);
  });

  it('bbox is centered on screenX/screenY', () => {
    const label = makeLabel('k0', 'realm', 200, 150);
    const bbox = estimateBBox(label);
    const cx = (bbox.left + bbox.right) / 2;
    const cy = (bbox.top + bbox.bottom) / 2;
    expect(cx).toBeCloseTo(200, 0);
    expect(cy).toBeCloseTo(150, 0);
  });
});

// ─── removeOverlaps ───────────────────────────────────────────────────────────

describe('removeOverlaps', () => {
  it('returns both visible when two labels do not overlap', () => {
    // Place labels far apart
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'realm', 100, 100),
      makeLabel('b0', 'area', 900, 100), // Far away — no overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(true);
  });

  it('hides lower-priority label when two labels overlap: realm over area', () => {
    // Both at same position — guaranteed overlap
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'realm', 100, 100),
      makeLabel('b0', 'area', 100, 100), // Same position = overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
  });

  it('hides an area label overlapping a realm regardless of input order', () => {
    // Area first in input — still hidden, because the realm tier has higher priority
    const labels: ScreenLabel[] = [
      makeLabel('b0', 'area', 100, 100),
      makeLabel('k0', 'realm', 100, 100),
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
  });

  it('three labels: #2 overlaps #1, #3 does not overlap either — #1 visible, #2 hidden, #3 visible', () => {
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'realm', 100, 100),  // realm, placed first
      makeLabel('b0', 'area', 105, 100),   // area, overlaps k0
      makeLabel('b1', 'area', 900, 100),   // area, far away — no overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
    expect(result.find(l => l.id === 'b1')?.visible).toBe(true);
  });

  it('river label hidden when overlapping an area', () => {
    const labels: ScreenLabel[] = [
      makeLabel('g0', 'area', 100, 100),
      makeLabel('rv0', 'river', 100, 100),
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'g0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'rv0')?.visible).toBe(false);
  });

  it('returns empty array for empty input', () => {
    expect(removeOverlaps([])).toHaveLength(0);
  });

  it('returns single label as visible', () => {
    const labels: ScreenLabel[] = [makeLabel('k0', 'realm', 100, 100)];
    const result = removeOverlaps(labels);
    expect(result).toHaveLength(1);
    expect(result[0].visible).toBe(true);
  });
});

// ─── THR-1711: labels flickered into piles ───────────────────────────────────

describe('THR-1711 — the collision verdict holds between recomputes', () => {
  it('reapplies the last verdict to freshly projected positions', () => {
    const resolved = removeOverlaps([
      makeLabel('Ashford', 'area', 100, 100),
      makeLabel('Ashmoor', 'area', 104, 102),
    ]);
    const cache = new Map(resolved.map(l => [l.id, l.visible]));
    expect([...cache.values()].filter(Boolean)).toHaveLength(1);

    // Next frame: the camera panned 3px; collision is not recomputed.
    const panned = [makeLabel('Ashford', 'area', 103, 100), makeLabel('Ashmoor', 'area', 107, 102)];
    const held = applyCachedVisibility(panned, cache);
    // FALSIFICATION: the raw projection is all-visible — that was the pile.
    expect(panned.every(l => l.visible)).toBe(true);
    expect(held.filter(l => l.visible)).toHaveLength(1);
    expect(held.map(l => l.screenX)).toEqual([103, 107]);
  });

  it('keeps a label the last run never saw hidden until the next run places it', () => {
    const held = applyCachedVisibility([makeLabel('Newcomer', 'area', 10, 10)], new Map());
    expect(held[0].visible).toBe(false);
  });
});

describe('THR-1711 — the box matches the label as rendered', () => {
  it('sizes the box from the label\'s own font size, not the tier estimate', () => {
    const tierSized = estimateBBox(makeLabel('Kingsreach', 'realm', 0, 0));
    const capital16 = estimateBBox({ ...makeLabel('Kingsreach', 'realm', 0, 0), fontSize: 16 });
    // realm's tier estimate is 20 px; a 16 px capital is narrower.
    expect(capital16.right - capital16.left).toBeLessThan(tierSized.right - tierSized.left);

    const town13 = estimateBBox({ ...makeLabel('Kingsreach', 'area', 0, 0), fontSize: 13 });
    const area12 = estimateBBox(makeLabel('Kingsreach', 'area', 0, 0));
    expect(town13.right - town13.left).toBeGreaterThan(area12.right - area12.left);
  });

  it('a top-anchored label\'s box extends downward from its anchor', () => {
    const centered = estimateBBox({ ...makeLabel('Fen', 'area', 0, 100), fontSize: 13 });
    const top = estimateBBox({ ...makeLabel('Fen', 'area', 0, 100), fontSize: 13, anchorY: 'top' });
    expect(top.bottom - top.top).toBeCloseTo(centered.bottom - centered.top);
    expect(top.top).toBeGreaterThan(centered.top);
    // The anchor sits within the padding band at the box's top edge.
    expect(top.top).toBeLessThanOrEqual(100);
  });
});
