// @vitest-environment jsdom
/**
 * DeltaCluster (THR-1082) — the aftermath's magnitude idiom.
 *
 * These tests pin the two properties the design rests on rather than the
 * styling: that the reading survives without colour (Law 11 — shape is the
 * accessibility channel), and that a change which happened never draws zero
 * marks, which would say the opposite of what the chip exists to say.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeltaCluster, DELTA_CLUSTER_MAX, DELTA_CLUSTER_GLYPH_SIZE_PX } from '../DeltaCluster';

/** The marks themselves, ignoring the wrapper. */
function glyphText(): string {
  return screen.getByTestId('delta-cluster').textContent ?? '';
}

describe('DeltaCluster', () => {
  it('draws one mark per step of the count', () => {
    render(<DeltaCluster direction="gain" count={3} label="Stone rose, a great amount" />);
    expect(glyphText()).toBe('▲▲▲');
  });

  it('LAW 11: states its whole reading in words, so the row is legible without sight of it', () => {
    render(<DeltaCluster direction="loss" count={2} label="Standing fell, a clear amount" />);
    const cluster = screen.getByTestId('delta-cluster');
    expect(cluster).toHaveAttribute('aria-label', 'Standing fell, a clear amount');
    expect(cluster).toHaveAttribute('role', 'img');
  });

  it('LAW 31: direction is carried by the glyph, not by colour alone', () => {
    const { rerender } = render(<DeltaCluster direction="gain" count={1} label="rose" />);
    expect(glyphText()).toBe('▲');
    rerender(<DeltaCluster direction="loss" count={1} label="fell" />);
    expect(glyphText()).toBe('▼');
  });

  it('draws the scale-less marker for a way opening, never a run', () => {
    // A PATH has no magnitude, so a count is meaningless and must not be drawn
    // even when a caller passes one.
    render(<DeltaCluster direction="opens" count={3} label="A way opens" />);
    expect(glyphText()).toBe('◆');
  });

  it('never draws zero marks — a change that happened is not nothing', () => {
    const { rerender } = render(<DeltaCluster direction="gain" count={0} label="rose" />);
    expect(glyphText()).toBe('▲');
    rerender(<DeltaCluster direction="gain" count={-2} label="rose" />);
    expect(glyphText()).toBe('▲');
    rerender(<DeltaCluster direction="gain" count={Number.NaN} label="rose" />);
    expect(glyphText()).toBe('▲');
  });

  it('never draws more than the maximum, however large the count', () => {
    render(<DeltaCluster direction="loss" count={97} label="fell" />);
    expect(glyphText()).toBe('▼'.repeat(DELTA_CLUSTER_MAX));
  });

  it('LAW 11: renders at or above the legibility floor', () => {
    render(<DeltaCluster direction="gain" count={1} label="rose" />);
    const size = screen.getByTestId('delta-cluster').style.fontSize;
    expect(parseInt(size, 10)).toBeGreaterThanOrEqual(DELTA_CLUSTER_GLYPH_SIZE_PX);
  });

  it('LAW 30: takes its colour from tokens, never a hardcoded hex', () => {
    const { rerender } = render(<DeltaCluster direction="gain" count={1} label="rose" />);
    expect(screen.getByTestId('delta-cluster').style.color).toContain('--positive');
    rerender(<DeltaCluster direction="loss" count={1} label="fell" />);
    expect(screen.getByTestId('delta-cluster').style.color).toContain('--negative');
    rerender(<DeltaCluster direction="opens" count={1} label="opens" />);
    expect(screen.getByTestId('delta-cluster').style.color).toContain('--accent-gold');
  });

  it('lets a sanctioned palette variant pass its own token', () => {
    // The encounter veil has its own named tones (Law 30's sanctioned variant
    // set); it must be able to use them without forking the component.
    render(
      <DeltaCluster direction="gain" count={1} label="rose" color="var(--veil-gold)" />,
    );
    expect(screen.getByTestId('delta-cluster').style.color).toBe('var(--veil-gold)');
  });

  it('LAW 13: draws no numeral, whatever the count', () => {
    for (const count of [1, 2, 3, 40]) {
      const { unmount } = render(<DeltaCluster direction="gain" count={count} label="rose" />);
      expect(glyphText()).not.toMatch(/\d/);
      unmount();
    }
  });
});
