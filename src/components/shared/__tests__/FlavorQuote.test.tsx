// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlavorQuote } from '../FlavorQuote';

describe('FlavorQuote (THR-799)', () => {
  it('renders the quote inside an inset well', () => {
    render(<FlavorQuote>What is held changes the hand that holds it.</FlavorQuote>);
    const well = screen.getByTestId('flavor-quote');
    expect(well.className).toContain('inset-well');
    expect(well.textContent).toContain('What is held changes the hand that holds it.');
  });

  it('omits the zone entirely when there is no prose (fail-soft, not an empty well)', () => {
    const { container } = render(<FlavorQuote>{null}</FlavorQuote>);
    expect(screen.queryByTestId('flavor-quote')).toBeNull();
    expect(container.innerHTML).toBe('');
  });

  it('omits the zone for an empty string too', () => {
    render(<FlavorQuote>{''}</FlavorQuote>);
    expect(screen.queryByTestId('flavor-quote')).toBeNull();
  });

  it('renders attribution only when supplied', () => {
    const { unmount } = render(<FlavorQuote>Line.</FlavorQuote>);
    expect(screen.queryByTestId('flavor-quote-attribution')).toBeNull();
    unmount();

    render(<FlavorQuote attribution="A smith of Darkhollow">Line.</FlavorQuote>);
    expect(screen.getByTestId('flavor-quote-attribution').textContent).toBe('A smith of Darkhollow');
  });

  it('shows the ornamental divider by default and hides it on divider={false}', () => {
    const { unmount } = render(<FlavorQuote>Line.</FlavorQuote>);
    expect(screen.getByTestId('flavor-quote').querySelector('[aria-hidden="true"]')).toBeTruthy();
    unmount();

    render(<FlavorQuote divider={false}>Line.</FlavorQuote>);
    expect(screen.getByTestId('flavor-quote').querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
