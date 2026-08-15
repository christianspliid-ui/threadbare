// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import UbiquitousLanguageDashboard from '../UbiquitousLanguageDashboard';
import { TERMS, SHARDS } from '../ulDashboardData';
import { SEARCH_DEBOUNCE_MS } from '../../../data/ul-dashboard-constants';

describe('UbiquitousLanguageDashboard', () => {
  it('renders the topbar, sidebar, table, and footer', () => {
    render(<UbiquitousLanguageDashboard />);
    expect(screen.getByRole('heading', { name: /ubiquitous language/i })).toBeTruthy();
    expect(screen.getByTestId('ul-search-input')).toBeTruthy();
    expect(screen.getByTestId('ul-term-table')).toBeTruthy();
    expect(screen.getByTestId('ul-detail-pane')).toBeTruthy();
    expect(screen.getByTestId('ul-shard-all')).toBeTruthy();
  });

  it('renders one row per shard tab + All', () => {
    render(<UbiquitousLanguageDashboard />);
    for (const shard of SHARDS) {
      expect(screen.getByTestId(`ul-shard-${shard.title.toLowerCase()}`)).toBeTruthy();
    }
  });

  it('opens the detail pane when a term is clicked', () => {
    render(<UbiquitousLanguageDashboard />);
    const reach = TERMS.find((t) => t.slug === 'reach' && t.shardId === 'cosmology');
    expect(reach).toBeDefined();
    const row = screen.getByTestId(`ul-term-row-cosmology#reach`);
    fireEvent.click(row);
    const detail = screen.getByTestId('ul-detail-pane');
    expect(detail.textContent).toMatch(/Reach/);
    expect(detail.textContent).toMatch(/canonical/);
  });

  it('filters terms via debounced search', async () => {
    render(<UbiquitousLanguageDashboard />);
    const input = screen.getByTestId('ul-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sphere' } });
    await act(async () => {
      await new Promise((r) => setTimeout(r, SEARCH_DEBOUNCE_MS + 50));
    });
    const rows = screen.getAllByTestId(/ul-term-row-/);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(TERMS.length);
    const sphereRow = screen.queryByTestId('ul-term-row-cosmology#sphere');
    expect(sphereRow).not.toBeNull();
  });

  // THR-991 — jsdom-render substitution for the browser-verify clause (this ran
  // in an unattended session with no startable dev server). Asserts the
  // `rejected` badge reaches the composed surface AND is a different colour from
  // `deprecated`: the two carry opposite histories, so a badge that merely
  // renders — in a second red indistinguishable from deprecated — would satisfy
  // the type checker and still fail the reader this status exists for.
  it('renders the rejected badge, coloured distinctly from deprecated', () => {
    render(<UbiquitousLanguageDashboard />);

    const unsetWeave = TERMS.find((t) => t.slug === 'unset-weave');
    expect(unsetWeave?.status).toBe('rejected');

    const rejectedRow = screen.getByTestId('ul-term-row-encounters#unset-weave');
    const rejectedBadge = within(rejectedRow).getByText('rejected');

    const deprecatedTerm = TERMS.find((t) => t.status === 'deprecated');
    expect(deprecatedTerm).toBeDefined();
    const deprecatedRow = screen.getByTestId(
      `ul-term-row-${deprecatedTerm!.shardId}#${deprecatedTerm!.slug}`,
    );
    const deprecatedBadge = within(deprecatedRow).getByText('deprecated');

    expect(rejectedBadge.style.color).toBeTruthy();
    expect(rejectedBadge.style.color).not.toBe(deprecatedBadge.style.color);

    // And the same status reaches the detail pane, which reads its colour from
    // a second, independently-declared STATUS_COLOR map.
    fireEvent.click(rejectedRow);
    const detail = screen.getByTestId('ul-detail-pane');
    expect(detail.textContent).toMatch(/Unset Weave/);
    expect(within(detail).getByText('rejected').style.color).toBeTruthy();
  });

  it('switches shard tabs and updates the visible term count', () => {
    render(<UbiquitousLanguageDashboard />);
    const cosmologyTab = screen.getByTestId('ul-shard-cosmology');
    fireEvent.click(cosmologyTab);
    const rows = screen.getAllByTestId(/ul-term-row-/);
    const cosmologyTerms = TERMS.filter((t) => t.shardId === 'cosmology');
    expect(rows).toHaveLength(cosmologyTerms.length);
  });
});
