// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('switches shard tabs and updates the visible term count', () => {
    render(<UbiquitousLanguageDashboard />);
    const cosmologyTab = screen.getByTestId('ul-shard-cosmology');
    fireEvent.click(cosmologyTab);
    const rows = screen.getAllByTestId(/ul-term-row-/);
    const cosmologyTerms = TERMS.filter((t) => t.shardId === 'cosmology');
    expect(rows).toHaveLength(cosmologyTerms.length);
  });
});
