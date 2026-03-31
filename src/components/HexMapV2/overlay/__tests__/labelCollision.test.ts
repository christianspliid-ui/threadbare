/**
 * labelCollision.test.ts — Tests for removeOverlaps AABB collision detection.
 *
 * TDD RED phase: all tests fail until labelCollision.ts is implemented.
 */

import { describe, it, expect } from 'vitest';
import { removeOverlaps, estimateBBox } from '../labelCollision';
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
    const label = makeLabel('k0', 'domain', 100, 100);
    const bbox = estimateBBox(label);
    expect(Number.isFinite(bbox.left)).toBe(true);
    expect(Number.isFinite(bbox.right)).toBe(true);
    expect(Number.isFinite(bbox.top)).toBe(true);
    expect(Number.isFinite(bbox.bottom)).toBe(true);
  });

  it('bbox is centered on screenX/screenY', () => {
    const label = makeLabel('k0', 'domain', 200, 150);
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
      makeLabel('k0', 'domain', 100, 100),
      makeLabel('b0', 'province', 900, 100), // Far away — no overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(true);
  });

  it('hides lower-priority label when two labels overlap: domain over province', () => {
    // Both at same position — guaranteed overlap
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'domain', 100, 100),
      makeLabel('b0', 'province', 100, 100), // Same position = overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
  });

  it('hides province overlapping domain regardless of input order', () => {
    // Barony first in input — should still be hidden because domain has higher priority
    const labels: ScreenLabel[] = [
      makeLabel('b0', 'province', 100, 100),
      makeLabel('k0', 'domain', 100, 100),
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
  });

  it('three labels: #2 overlaps #1, #3 does not overlap either — #1 visible, #2 hidden, #3 visible', () => {
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'domain', 100, 100),  // domain, placed first
      makeLabel('b0', 'province', 105, 100),   // province, overlaps k0
      makeLabel('b1', 'province', 900, 100),   // province, far away — no overlap
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'b0')?.visible).toBe(false);
    expect(result.find(l => l.id === 'b1')?.visible).toBe(true);
  });

  it('geographic label hidden when overlapping domain', () => {
    const labels: ScreenLabel[] = [
      makeLabel('k0', 'domain', 100, 100),
      makeLabel('g0', 'geographic', 100, 100),
    ];
    const result = removeOverlaps(labels);
    expect(result.find(l => l.id === 'k0')?.visible).toBe(true);
    expect(result.find(l => l.id === 'g0')?.visible).toBe(false);
  });

  it('river label hidden when overlapping geographic', () => {
    const labels: ScreenLabel[] = [
      makeLabel('g0', 'geographic', 100, 100),
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
    const labels: ScreenLabel[] = [makeLabel('k0', 'domain', 100, 100)];
    const result = removeOverlaps(labels);
    expect(result).toHaveLength(1);
    expect(result[0].visible).toBe(true);
  });
});
