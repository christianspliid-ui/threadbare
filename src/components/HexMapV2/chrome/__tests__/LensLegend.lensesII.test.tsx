// @vitest-environment jsdom
/**
 * LensLegend for Trouble and Trade (THR-1898; THR-1878 plan § D4, Player-facing text).
 *
 * The Trouble head names the doom stage and carries the doom bar's tooltip; each mark
 * row entry shows its carved shape (Battle and Siege the sprites' own), in legend order;
 * Trade lists its two road tones.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LensLegend } from '../LensLegend';
import { mapLensById } from '../../../../data/map-lenses';
import { TROUBLE_LENS_WORDS, TRADE_LENS_WORDS } from '../../../../data/view-content';

describe('LensLegend — Lenses II', () => {
  it('Trouble: "Trouble · Doom: Signs", its line, and the nine marks with their carved shapes', () => {
    const { container } = render(
      <LensLegend
        lens={mapLensById('trouble')!}
        bandColors={{}}
        hexLegend={{
          head: TROUBLE_LENS_WORDS.legendHead,
          headNote: { text: 'Doom: Signs', tooltipId: 'ui.doom_bar' },
          lines: TROUBLE_LENS_WORDS.legend,
          emptyLine: null,
        }}
      />,
    );
    expect(screen.getByTestId('map-lens-legend-head').textContent).toBe('Trouble · Doom: Signs');
    expect(screen.getByTestId('map-lens-legend-head-note').textContent).toBe('Doom: Signs');
    expect(screen.getByText('Lit ground is where something is going wrong.')).toBeTruthy();
    const marks = [...container.querySelectorAll('[data-legend-mark]')];
    expect(marks.map(m => m.getAttribute('data-legend-mark')))
      .toEqual(['Battle', 'Siege', 'Unrest', 'Hunger', 'Strife', 'Scheme', 'Drain', 'Omen', 'Lair']);
    // Every Trouble mark has a carved shape, so each shows an svg, never a plain dot.
    for (const m of marks) expect(m.querySelector('svg'), m.getAttribute('data-legend-mark') ?? '').not.toBeNull();
  });

  it('Trade: its two lines and the two road tones', () => {
    const { container } = render(
      <LensLegend
        lens={mapLensById('trade')!}
        bandColors={{}}
        hexLegend={{ head: TRADE_LENS_WORDS.legendHead, lines: TRADE_LENS_WORDS.legend, emptyLine: TRADE_LENS_WORDS.empty }}
      />,
    );
    expect(screen.getByTestId('map-lens-legend-head').textContent).toBe('Trade');
    for (const line of TRADE_LENS_WORDS.legend) expect(screen.getByText(line)).toBeTruthy();
    expect(screen.getByTestId('map-lens-legend-empty').textContent).toBe('No trade road you know of yet.');
    expect([...container.querySelectorAll('[data-legend-mark]')].map(m => m.getAttribute('data-legend-mark')))
      .toEqual(['Trade road', 'Threatened road', 'Embargoed road']);
  });
});
