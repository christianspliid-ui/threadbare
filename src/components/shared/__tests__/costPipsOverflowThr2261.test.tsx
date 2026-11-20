// @vitest-environment jsdom
/**
 * THR-2261 item 1 (cold playtest round 8) — a card price past the pip cap shows
 * its number on the card face, not only in an aria-label or a title the cost
 * tooltip suppresses. "✦✦✦✦✦✦⋯" becomes "✦✦✦✦✦✦+3".
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CostPips } from '../OddsPips';
import { ESSENCE_PIP_GLYPH, MAX_COST_PIPS } from '../../../data/nudge-card-display';

describe('CostPips — an overflowing price is readable (THR-2261)', () => {
  it('a 9-cost card shows six pips and a visible "+3"', () => {
    render(<CostPips cost={9} tooltipId="ui.card.cost" data-testid="cost" />);
    const el = screen.getByTestId('cost');
    expect(el.textContent).toBe(`${ESSENCE_PIP_GLYPH.repeat(MAX_COST_PIPS)}+3`);
    expect(el.textContent).not.toContain('⋯');
    expect(el.querySelector('[data-cost-overflow]')?.getAttribute('data-cost-overflow')).toBe('3');
    expect(el.getAttribute('aria-label')).toBe('9 essence');
  });

  it('a price within the cap draws only pips, no overflow count', () => {
    render(<CostPips cost={3} data-testid="cost" />);
    const el = screen.getByTestId('cost');
    expect(el.textContent).toBe(ESSENCE_PIP_GLYPH.repeat(3));
    expect(el.querySelector('[data-cost-overflow]')).toBeNull();
  });
});
