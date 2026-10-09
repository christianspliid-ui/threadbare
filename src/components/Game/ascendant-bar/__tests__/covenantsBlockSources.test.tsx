// @vitest-environment jsdom
/**
 * THR-1747 — a held essence source renders in the Covenants block as composed:
 * its title, its place, its upkeep in words, and no Release control (letting a
 * source go is not a verb). A control row beside it keeps its Release.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CovenantsBlock } from '../CovenantsBlock';
import { COVENANT_SOURCE_COPY } from '../../../../data/ascendant-bar-content';
import type { CovenantRowView } from '../selectors';

const controlRow: CovenantRowView = {
  effectId: 'cov_1',
  title: 'Your will presses on the fortress gates.',
  target: 'Greywatch',
  upkeepLine: 'Draws on your essence, moment to moment.',
  contested: false,
  kind: 'control',
  releasable: true,
};

const sourceRow: CovenantRowView = {
  effectId: 'source-loc.spring',
  title: COVENANT_SOURCE_COPY.titleDormant,
  target: 'Thornwick Spring',
  upkeepLine: COVENANT_SOURCE_COPY.upkeepPaid,
  contested: false,
  kind: 'source',
  releasable: false,
};

describe('CovenantsBlock — held sources (THR-1747)', () => {
  it('renders the source row with its words and no Release; the control keeps Release', () => {
    const onRelease = vi.fn();
    render(<CovenantsBlock rows={[controlRow, sourceRow]} onRelease={onRelease} />);
    const row = screen.getByTestId('covenant-row-source-loc.spring');
    expect(row.textContent).toContain('A wellspring you hold');
    expect(row.textContent).toContain('Thornwick Spring');
    expect(row.textContent).toContain('Costs a little of your essence to keep, and gives back more.');
    expect(row.textContent).not.toMatch(/[0-9]/);
    expect(screen.queryByTestId('covenant-release-source-loc.spring')).toBeNull();
    fireEvent.click(screen.getByTestId('covenant-release-cov_1'));
    expect(onRelease).toHaveBeenCalledWith('cov_1');
  });

  it('a sources-only list does not show the empty state', () => {
    render(<CovenantsBlock rows={[sourceRow]} />);
    expect(screen.queryByText('You hold nothing in a lasting grip.')).toBeNull();
  });
});
