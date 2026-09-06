// @vitest-environment jsdom
/**
 * Debug-panel tab reachability (THR-1412).
 *
 * The defect: `TAB_BAR_STYLE` was a bare `display: flex` with no wrap and no
 * overflow, inside ancestors that are `overflow: hidden`. Measured at 1920×1080
 * with 43 tabs, the strip reported `clientWidth 479` against `scrollWidth 3751`
 * and the **Tallies** tab's rect sat at `x 5125` — 3,200px past the right edge.
 * Everything from Marks onward could only be opened by a scripted
 * `button.click()`, which is how the THR-1133 sweep had to drive it.
 *
 * Two things are asserted here, and it is worth being precise about which is
 * which: jsdom performs no layout, so a test in this environment **cannot**
 * measure that a tab is on-screen. The rect evidence is the browser capture on
 * the ticket. What these tests pin is (a) every declared tab actually renders a
 * clickable control, and (b) the style contract that keeps the strip from being
 * a single unbounded row again — the specific property combination whose
 * absence caused the defect.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TABS } from '../DebugTabContent';
import { TAB_BAR_STYLE, TAB_BAR_MAX_HEIGHT } from '../debugPanelStyles';
import { DebugPanel } from '../../DebugPanel';

describe('debug panel tab strip (THR-1412)', () => {
  it('wraps rather than running off the panel in one unbounded row', () => {
    // The exact absence that put 37 tabs off-canvas.
    expect(TAB_BAR_STYLE.flexWrap).toBe('wrap');
  });

  it('bounds its own height so wrapping does not eat the trace area', () => {
    // Wrapping alone would cost ~8 rows of a 480px-wide panel — the THR-1133
    // pass-7(a) concern. The cap plus vertical overflow keeps both properties:
    // every tab reachable, the feed below still the bulk of the panel.
    expect(TAB_BAR_STYLE.maxHeight).toBe(TAB_BAR_MAX_HEIGHT);
    expect(TAB_BAR_STYLE.overflowY).toBe('auto');
    expect(TAB_BAR_MAX_HEIGHT).toBeGreaterThan(0);
    expect(TAB_BAR_MAX_HEIGHT).toBeLessThan(400);
  });

  it('does not let the strip be squeezed by the scroll area below it', () => {
    expect(TAB_BAR_STYLE.flexShrink).toBe(0);
  });

  it('renders a clickable control for every declared tab, including the tail', () => {
    // The real component, not a hand-rolled strip — this is the sanctioned
    // `jsdom-render` browser-verify substitution for an unattended run, so it
    // has to exercise what ships.
    render(<DebugPanel currentTick={0} />);

    for (const { label } of TABS) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }

    // Guard the guard: a TABS list that had silently shrunk to the six
    // mouse-reachable tabs would satisfy the loop above vacuously.
    expect(TABS.length).toBeGreaterThanOrEqual(43);
    expect(TABS.map(t => t.label)).toContain('Tallies');
  });

  it('carries the wrap + bounded-scroll styles on the strip it actually renders', () => {
    // Asserting the exported constant proves the intent; asserting the mounted
    // node proves the constant is the one the panel uses.
    render(<DebugPanel currentTick={0} />);

    const strip = screen.getByRole('button', { name: 'Tallies' }).parentElement!;
    expect(strip.style.flexWrap).toBe('wrap');
    expect(strip.style.overflowY).toBe('auto');
    expect(strip.style.maxHeight).toBe(`${TAB_BAR_MAX_HEIGHT}px`);
  });

  it('opens the Tallies tab from a plain click — the tab the defect hid', () => {
    // Previously reachable only by scripted `button.click()` on an off-canvas
    // node. `fireEvent.click` is the same event a mouse produces.
    render(<DebugPanel currentTick={0} />);

    const tallies = screen.getByRole('button', { name: 'Tallies' });
    fireEvent.click(tallies);

    // The active tab is styled with the gold accent; the inactive one is not.
    expect(tallies.style.color).toBe('var(--accent-gold)');
    expect(screen.getByRole('button', { name: 'Feed' }).style.color)
      .not.toBe('var(--accent-gold)');
  });
});
