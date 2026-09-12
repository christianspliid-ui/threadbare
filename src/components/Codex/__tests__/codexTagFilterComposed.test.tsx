// @vitest-environment jsdom

/**
 * The codex as composed, with the tag filter row in it (THR-1486, slice 2 of THR-1481).
 *
 * This is the **browser-verify substitution** for an unattended run that cannot start a
 * dev server (`Docs/canon/verification-gates.md` § Browser-verify, the jsdom-render
 * route). The component test beside this one pins the chip; this one pins the *surface*:
 * that the row appears exactly where it was scoped to, that pressing a chip narrows the
 * grid, and — the half a component test cannot show — that the row is **absent** from
 * the categories it was deliberately not given.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Codex from '../Codex';

function cardCount(): number {
  return document.querySelectorAll('[data-codex-entry-id]').length;
}

describe('codex — the tag filter row as composed', () => {
  it('renders the filter row on possessions, with chips grouped under axis labels', () => {
    render(<Codex />);
    fireEvent.click(screen.getByText('Possessions'));

    const row = document.querySelector('[data-testid="codex-tag-filter"]');
    expect(row).not.toBeNull();
    // The axis labels are the grouping a player reads; at least form and reach are worn
    // by the possessions corpus, so both groups must be on screen.
    expect(row!.textContent).toContain('Form');
    expect(row!.textContent).toContain('Reach');
    expect(document.querySelectorAll('[data-tag-chip]').length).toBeGreaterThan(10);
  });

  it('is absent from a category the vocabulary does not yet describe', () => {
    render(<Codex />);
    fireEvent.click(screen.getAllByText('Divine Actions')[0]);
    expect(document.querySelector('[data-testid="codex-tag-filter"]')).toBeNull();
  });

  it('pressing a chip narrows the grid and offers the way back', () => {
    render(<Codex />);
    fireEvent.click(screen.getByText('Possessions'));

    const before = cardCount();
    expect(before).toBeGreaterThan(20);

    fireEvent.click(document.querySelector('[data-tag-chip="#weapon"]')!);
    const after = cardCount();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);

    fireEvent.click(screen.getByTestId('codex-tag-filter-clear'));
    expect(cardCount()).toBe(before);
  });

  it('two chips narrow ALL-of, never any-of — the reward pool’s own rule', () => {
    render(<Codex />);
    fireEvent.click(screen.getByText('Possessions'));

    fireEvent.click(document.querySelector('[data-tag-chip="#weapon"]')!);
    const weaponOnly = cardCount();
    fireEvent.click(document.querySelector('[data-tag-chip="#iron"]')!);
    const weaponAndIron = cardCount();

    expect(weaponAndIron).toBeGreaterThan(0);
    expect(weaponAndIron).toBeLessThanOrEqual(weaponOnly);
  });

  it('switching category clears the filter, so no list is silently narrowed', () => {
    render(<Codex />);
    fireEvent.click(screen.getByText('Possessions'));
    fireEvent.click(document.querySelector('[data-tag-chip="#weapon"]')!);
    expect(screen.getByTestId('codex-tag-filter-clear')).toBeTruthy();

    fireEvent.click(screen.getByText('Conditions'));
    expect(screen.queryByTestId('codex-tag-filter-clear')).toBeNull();
  });
});
