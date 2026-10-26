// @vitest-environment jsdom
/**
 * MapLensSwitch on Tabs (THR-1878 plan § D1, D2).
 *
 * One toggle per MAP_LENSES row with its key cap; radio, not stack; the legend is
 * derived from the lens's view model and MAP_MARKERS; while a moment holds the lens off
 * the button stays pressed and the legend steps aside.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapLensSwitch } from '../MapLensSwitch';
import { MAP_LENSES } from '../../../../data/map-lenses';
import { THREADS_LENS_WORDS } from '../../../../data/view-content';

const THREADS_LEGEND = { head: THREADS_LENS_WORDS.legendHead, lines: THREADS_LENS_WORDS.legend, emptyLine: null };

describe('MapLensSwitch', () => {
  it('draws one toggle per MAP_LENSES row with its key cap, inside a toolbar', () => {
    render(<MapLensSwitch active={null} onChange={() => {}} bandColors={{}} />);
    expect(screen.getByRole('toolbar', { name: 'Map lenses' })).toBeTruthy();
    for (const lens of MAP_LENSES) {
      const btn = screen.getByTestId(`map-lens-${lens.id}`);
      expect(btn.textContent).toBe(`${lens.label}${lens.key}`);
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('THR-2060: shows only the lenses that have arrived, and is absent with none', () => {
    const { rerender } = render(<MapLensSwitch active={null} onChange={() => {}} bandColors={{}} shownLenses={new Set(['dominion', 'trouble'])} />);
    expect(screen.getByTestId('map-lens-dominion')).toBeTruthy();
    expect(screen.getByTestId('map-lens-trouble')).toBeTruthy();
    expect(screen.queryByTestId('map-lens-threads')).toBeNull();
    expect(screen.queryByTestId('map-lens-trade')).toBeNull();
    rerender(<MapLensSwitch active={null} onChange={() => {}} bandColors={{}} shownLenses={new Set()} />);
    expect(screen.queryByTestId('map-lens-switch')).toBeNull();
  });

  it('THR-2060: each lens names the reveal surface that brings it', () => {
    expect(Object.fromEntries(MAP_LENSES.map(l => [l.id, l.revealSurface]))).toEqual({
      dominion: 'dominion', threads: 'lens_threads', trouble: 'doom', trade: 'lens_trade',
    });
  });

  it('radio, not stack: pressing Threads while Dominion is on asks for Threads; pressing the pressed one asks for none', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MapLensSwitch active="dominion" onChange={onChange} bandColors={{}} />);
    fireEvent.click(screen.getByTestId('map-lens-threads'));
    expect(onChange).toHaveBeenLastCalledWith('threads');
    rerender(<MapLensSwitch active="threads" onChange={onChange} bandColors={{}} hexLegend={THREADS_LEGEND} />);
    fireEvent.click(screen.getByTestId('map-lens-threads'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('the Threads legend: head, lines and the mark row derived from MAP_MARKERS', () => {
    render(<MapLensSwitch active="threads" onChange={() => {}} bandColors={{}} hexLegend={THREADS_LEGEND} />);
    const legend = screen.getByTestId('map-lens-legend');
    expect(screen.getByTestId('map-lens-legend-head').textContent).toBe('Threads');
    for (const line of THREADS_LENS_WORDS.legend) expect(legend.textContent).toContain(line);
    expect(screen.getByTestId('map-lens-legend-marks').textContent).toBe('The FirstRetinueWatchedHeading');
  });

  it('shows the empty line when the lens has nothing to light', () => {
    render(<MapLensSwitch active="threads" onChange={() => {}} bandColors={{}} hexLegend={{ ...THREADS_LEGEND, emptyLine: THREADS_LENS_WORDS.empty }} />);
    expect(screen.getByTestId('map-lens-legend-empty').textContent).toBe('You have no threaded mortals yet.');
  });

  it('suppressed: the button stays pressed and the legend steps aside', () => {
    render(<MapLensSwitch active="threads" suppressed onChange={() => {}} bandColors={{}} hexLegend={THREADS_LEGEND} />);
    expect(screen.getByTestId('map-lens-threads').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByTestId('map-lens-legend')).toBeNull();
    expect(screen.getByTestId('map-lens-switch').getAttribute('data-suppressed')).toBe('true');
  });
});
