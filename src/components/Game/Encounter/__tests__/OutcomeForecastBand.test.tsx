// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutcomeForecastBand } from '../OutcomeForecastBand';
import type { EncounterForecastFactors } from '../../../../types/encounter-contract';

const factors: EncounterForecastFactors = [
  'the captain remembers her name',
  'the queue is restless tonight',
  'the lantern threads run thin',
];

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('OutcomeForecastBand', () => {
  it.each([
    [0.1, 'doomed', /threads have already broken/i],
    [0.3, 'perilous', /threads are fraying/i],
    [0.5, 'uncertain', /threads stand uncertain/i],
    [0.7, 'favorable', /threads pull toward her/i],
    [0.9, 'favored', /threads bend in her favour/i],
  ])(
    'renders the qualitative tier for probability %s as %s',
    (probability, tierId, phrase) => {
      const { unmount } = renderInViewport(
        <OutcomeForecastBand successProbability={probability} factors={factors} />,
      );
      const band = screen.getByTestId('encounter-outcome-forecast-band');
      expect(band).toHaveAttribute('data-tier', tierId);
      const tierLine = screen.getByTestId('encounter-outcome-forecast-tier');
      expect(tierLine.textContent).toMatch(phrase);
      unmount();
    },
  );

  it('matches the snapshot at each tier plus placeholder state in a 1920x1080 container', () => {
    const probabilities: Array<number | null> = [0.1, 0.3, 0.5, 0.7, 0.9, null];
    for (const p of probabilities) {
      const { asFragment, unmount } = renderInViewport(
        <OutcomeForecastBand successProbability={p} factors={factors} />,
      );
      expect(asFragment()).toMatchSnapshot(
        p === null ? 'tier-placeholder-null' : `tier-${p}`,
      );
      unmount();
    }
  });

  it('shows FORECAST_FACTORS_VISIBLE_DEFAULT factor by default and expands on hover', () => {
    renderInViewport(
      <OutcomeForecastBand successProbability={0.5} factors={factors} />,
    );
    const list = screen.getByTestId('encounter-outcome-forecast-factors');
    expect(list.children.length).toBe(1);
    expect(list.children[0]).toHaveTextContent('the captain remembers her name');

    const band = screen.getByTestId('encounter-outcome-forecast-band');
    fireEvent.mouseEnter(band);

    const expandedList = screen.getByTestId('encounter-outcome-forecast-factors');
    expect(expandedList.children.length).toBe(3);
    expect(expandedList.textContent).toContain('the queue is restless tonight');
    expect(expandedList.textContent).toContain('the lantern threads run thin');
  });

  it('respects a controlled expanded prop', () => {
    renderInViewport(
      <OutcomeForecastBand
        successProbability={0.5}
        factors={factors}
        expanded
      />,
    );
    const list = screen.getByTestId('encounter-outcome-forecast-factors');
    expect(list.children.length).toBe(3);
  });

  it('renders only the placeholder when successProbability is null', () => {
    renderInViewport(
      <OutcomeForecastBand successProbability={null} factors={factors} />,
    );
    expect(screen.queryByTestId('encounter-outcome-forecast-tier')).toBeNull();
    expect(
      screen.getByTestId('encounter-outcome-forecast-factors'),
    ).toHaveTextContent(/the threads are still gathering/);
  });

  it('renders only the placeholder when successProbability is undefined', () => {
    renderInViewport(
      <OutcomeForecastBand successProbability={undefined} factors={factors} />,
    );
    expect(screen.queryByTestId('encounter-outcome-forecast-tier')).toBeNull();
    expect(
      screen.getByTestId('encounter-outcome-forecast-factors'),
    ).toHaveTextContent(/the threads are still gathering/);
  });

  it('renders only the tier line when factors array is empty', () => {
    const empty: EncounterForecastFactors = [''];
    renderInViewport(
      <OutcomeForecastBand successProbability={0.5} factors={empty} />,
    );
    expect(screen.getByTestId('encounter-outcome-forecast-tier')).toBeInTheDocument();
    expect(
      screen.queryByTestId('encounter-outcome-forecast-factors'),
    ).toBeNull();
  });

  it.each([0.1, 0.3, 0.5, 0.7, 0.9, null] as const)(
    'renders no number-like substring in any visible text for probability %s',
    (probability) => {
      const { unmount } = renderInViewport(
        <OutcomeForecastBand
          successProbability={probability}
          factors={factors}
          expanded
        />,
      );
      const band = screen.getByTestId('encounter-outcome-forecast-band');
      const visibleText = band.textContent ?? '';
      expect(visibleText).not.toMatch(/[0-9]+%/);
      expect(visibleText).not.toMatch(/[0-9]+\.[0-9]+/);
      expect(visibleText).not.toMatch(/[0-9]/);
      unmount();
    },
  );
});
