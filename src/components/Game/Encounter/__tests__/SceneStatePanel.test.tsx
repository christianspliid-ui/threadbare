// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  SceneStatePanel,
  type SceneStatePanelData,
} from '../SceneStatePanel';
import { ThreadStrip } from '../ThreadStrip';
import { DriftIndicator, type DriftIndicatorData } from '../DriftIndicator';
import { DetectionThread } from '../DetectionThread';

function baseData(overrides?: Partial<SceneStatePanelData>): SceneStatePanelData {
  return {
    threads: [
      { id: 'oath', name: 'an oath she has not paid', weight: 'taut', sphereColor: 'spirit' },
      { id: 'rumor', name: 'a rumor sharpening into a name', weight: 'thin', sphereColor: 'mind' },
    ],
    factionsPresent: ['Civic Guard'],
    placeConditions: ['the gate is shut'],
    protagonistConditions: ['her name is known here'],
    ...overrides,
  };
}

describe('SceneStatePanel (C4)', () => {
  it('renders the populated baseline snapshot', () => {
    const { asFragment } = render(
      <div style={{ width: 1920, height: 1080 }}>
        <SceneStatePanel data={baseData()} />
      </div>,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders the empty-fallback snapshot when nothing is present', () => {
    const { asFragment } = render(
      <SceneStatePanel
        data={{
          threads: [],
          factionsPresent: [],
          placeConditions: [],
          protagonistConditions: [],
        }}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('ThreadStrip weight tiers', () => {
  it('renders each weight tier snapshot', () => {
    const { asFragment, rerender } = render(
      <ThreadStrip thread={{ id: 'a', name: 'a held promise', weight: 'taut', sphereColor: 'spirit' }} />,
    );
    expect(asFragment()).toMatchSnapshot('thread-taut');

    rerender(
      <ThreadStrip thread={{ id: 'a', name: 'a held promise', weight: 'thin', sphereColor: 'spirit' }} />,
    );
    expect(asFragment()).toMatchSnapshot('thread-thin');

    rerender(
      <ThreadStrip thread={{ id: 'a', name: 'a held promise', weight: 'fraying', sphereColor: 'spirit' }} />,
    );
    expect(asFragment()).toMatchSnapshot('thread-fraying');
  });
});

describe('DetectionThread threshold tiers', () => {
  it('renders nothing below NOTICE (pressure < 0.50)', () => {
    const { container } = render(<DetectionThread pressure={0.4} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders NOTICE band snapshot at pressure ≥ 0.50', () => {
    const { asFragment } = render(<DetectionThread pressure={0.5} />);
    expect(asFragment()).toMatchSnapshot('detection-notice');
    expect(screen.getByTestId('encounter-detection-thread')).toHaveAttribute('data-band', 'notice');
    expect(screen.getByText(/rivals are starting to notice/i)).toBeInTheDocument();
  });

  it('renders TURN band snapshot at pressure ≥ 0.80', () => {
    const { asFragment } = render(<DetectionThread pressure={0.8} />);
    expect(asFragment()).toMatchSnapshot('detection-turn');
    expect(screen.getByTestId('encounter-detection-thread')).toHaveAttribute('data-band', 'turn');
    expect(screen.getByText(/a rival god turns its head/i)).toBeInTheDocument();
  });

  it('renders ENCOUNTER band snapshot at pressure ≥ 1.00', () => {
    const { asFragment } = render(<DetectionThread pressure={1} />);
    expect(asFragment()).toMatchSnapshot('detection-encounter');
    expect(screen.getByTestId('encounter-detection-thread')).toHaveAttribute('data-band', 'encounter');
  });
});

describe('DriftIndicator threshold tiers', () => {
  function driftAt(band: DriftIndicatorData['band']): DriftIndicatorData {
    return {
      axisId: 'protector_conqueror',
      band,
      prose: `Eira has tilted toward Conqueror at the ${band} tier.`,
    };
  }

  it('renders nothing when drift is null', () => {
    const { container } = render(<DriftIndicator drift={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders SOFT tier snapshot', () => {
    const { asFragment } = render(<DriftIndicator drift={driftAt('soft')} />);
    expect(asFragment()).toMatchSnapshot('drift-soft');
    expect(screen.getByTestId('encounter-drift-indicator')).toHaveAttribute('data-band', 'soft');
  });

  it('renders BANNER tier snapshot', () => {
    const { asFragment } = render(<DriftIndicator drift={driftAt('banner')} />);
    expect(asFragment()).toMatchSnapshot('drift-banner');
    expect(screen.getByTestId('encounter-drift-indicator')).toHaveAttribute('data-band', 'banner');
  });

  it('renders BECOMING tier snapshot', () => {
    const { asFragment } = render(<DriftIndicator drift={driftAt('becoming')} />);
    expect(asFragment()).toMatchSnapshot('drift-becoming');
    expect(screen.getByTestId('encounter-drift-indicator')).toHaveAttribute('data-band', 'becoming');
  });

  it('hides the indicator after dismissal for the same axis+band', () => {
    const onDismiss = vi.fn();
    const drift = driftAt('soft');
    const { rerender, queryByTestId } = render(
      <DriftIndicator drift={drift} onDismiss={onDismiss} />,
    );
    fireEvent.click(screen.getByTestId('encounter-drift-indicator-dismiss'));
    expect(onDismiss).toHaveBeenCalledWith('protector_conqueror::soft');

    // Re-render with the same drift signature — should stay hidden.
    rerender(<DriftIndicator drift={drift} onDismiss={onDismiss} />);
    expect(queryByTestId('encounter-drift-indicator')).toBeNull();
  });

  it('returns when the next fresh threshold crosses after dismissal', () => {
    const drift = driftAt('soft');
    const { rerender, queryByTestId } = render(<DriftIndicator drift={drift} />);
    fireEvent.click(screen.getByTestId('encounter-drift-indicator-dismiss'));
    expect(queryByTestId('encounter-drift-indicator')).toBeNull();

    // Crossing into BANNER produces a new (axis, band) signature — visible again.
    rerender(<DriftIndicator drift={driftAt('banner')} />);
    const indicator = screen.getByTestId('encounter-drift-indicator');
    expect(indicator).toHaveAttribute('data-band', 'banner');
  });
});

describe('SceneStatePanel — composite tiered renders', () => {
  it('renders detection NOTICE + drift SOFT snapshot', () => {
    const { asFragment } = render(
      <SceneStatePanel
        data={baseData({
          detectionPressure: 0.55,
          drift: {
            axisId: 'protector_conqueror',
            band: 'soft',
            prose: 'Eira has tilted toward Conqueror.',
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders detection TURN + drift BECOMING snapshot', () => {
    const { asFragment } = render(
      <SceneStatePanel
        data={baseData({
          detectionPressure: 0.85,
          drift: {
            axisId: 'protector_conqueror',
            band: 'becoming',
            prose: 'Eira has become the Conqueror.',
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
