// @vitest-environment jsdom
/**
 * THR-2261 item 1 (cold playtest round 8) — a card price past the pip cap stays
 * countable on the card face: it wraps onto a second row of pips instead of
 * collapsing to "✦✦✦✦✦✦⋯". No numeral is drawn (UI Law 13: no raw magnitudes on
 * a card face); the number stays in the aria-label.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostPips } from '../OddsPips';
import { COST_OVERFLOW_GLYPH, COST_PIP_ROWS, ESSENCE_PIP_GLYPH, MAX_COST_PIPS } from '../../../data/nudge-card-display';

describe('CostPips — an overflowing price is countable (THR-2261)', () => {
  it('a 9-cost card draws six pips and a wrapped row of three, with no numeral and no "⋯"', () => {
    render(<CostPips cost={9} tooltipId="ui.card.cost" data-testid="cost" />);
    const el = screen.getByTestId('cost');
    expect(el.textContent).toBe(ESSENCE_PIP_GLYPH.repeat(9));
    expect(el.textContent).not.toMatch(/\d|⋯/);
    const row = el.querySelector('[data-cost-wrapped]') as HTMLElement;
    expect(row.getAttribute('data-cost-wrapped')).toBe('3');
    expect(row.textContent).toBe(ESSENCE_PIP_GLYPH.repeat(3));
    expect(el.getAttribute('aria-label')).toBe('9 essence');
  });

  it('a price within the cap draws one row only', () => {
    render(<CostPips cost={3} data-testid="cost" />);
    const el = screen.getByTestId('cost');
    expect(el.textContent).toBe(ESSENCE_PIP_GLYPH.repeat(3));
    expect(el.querySelector('[data-cost-wrapped]')).toBeNull();
  });

  it('only a price past every row ends in the overflow glyph', () => {
    const cap = MAX_COST_PIPS * COST_PIP_ROWS;
    render(<CostPips cost={cap + 3} data-testid="cost" />);
    expect(screen.getByTestId('cost').textContent).toBe(ESSENCE_PIP_GLYPH.repeat(cap) + COST_OVERFLOW_GLYPH);
  });

  it('dear pips past par stay marked across the wrap', () => {
    render(<CostPips cost={8} dearFrom={5} data-testid="cost" />);
    const el = screen.getByTestId('cost');
    const dear = [...el.querySelectorAll('[data-cost-dear]')].reduce((n, d) => n + Number(d.getAttribute('data-cost-dear')), 0);
    expect(dear).toBe(3);
    expect(el.textContent).toBe(ESSENCE_PIP_GLYPH.repeat(8));
  });
});
