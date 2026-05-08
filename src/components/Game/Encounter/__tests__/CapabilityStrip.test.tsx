// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CapabilityStrip } from '../CapabilityStrip';

function renderInViewport(node: React.ReactElement) {
  return render(<div style={{ width: 1920, height: 1080 }}>{node}</div>);
}

describe('CapabilityStrip', () => {
  it('renders sphere label, filled dots, and narrative hint', () => {
    renderInViewport(
      <CapabilityStrip
        label="Force"
        sphereLabel="IRON"
        filledDots={3}
        narrativeHint="a steady arm in a tight queue"
      />,
    );

    const strip = screen.getByTestId('capability-strip');
    expect(strip).toBeInTheDocument();
    expect(strip.textContent).toContain('IRON');
    expect(strip.textContent).toContain('a steady arm in a tight queue');
  });

  it('falls back to label text when sphereLabel is omitted', () => {
    renderInViewport(<CapabilityStrip label="Force" filledDots={2} />);
    expect(screen.getByTestId('capability-strip').textContent).toContain('Force');
  });

  it('matches the snapshot for 3 of 5 dots filled at 1920x1080', () => {
    const { asFragment } = renderInViewport(
      <CapabilityStrip
        label="Force"
        sphereLabel="IRON"
        filledDots={3}
        narrativeHint="a steady arm in a tight queue"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot for 0 of 5 dots filled', () => {
    const { asFragment } = renderInViewport(
      <CapabilityStrip label="Force" sphereLabel="IRON" filledDots={0} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot for 5 of 5 dots filled (max)', () => {
    const { asFragment } = renderInViewport(
      <CapabilityStrip
        label="Spirit"
        sphereLabel="HEART"
        filledDots={5}
        narrativeHint="her deepest thread"
        accentColor="var(--sphere-spirit-bright)"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot with no narrative hint', () => {
    const { asFragment } = renderInViewport(
      <CapabilityStrip label="Mind" sphereLabel="EYE" filledDots={2} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches the snapshot with a custom totalDots count', () => {
    const { asFragment } = renderInViewport(
      <CapabilityStrip
        label="Force"
        sphereLabel="IRON"
        filledDots={2}
        totalDots={3}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('clamps filledDots above totalDots to totalDots', () => {
    renderInViewport(
      <CapabilityStrip label="Force" sphereLabel="IRON" filledDots={10} totalDots={5} />,
    );
    const strip = screen.getByTestId('capability-strip');
    const dots = strip.querySelectorAll('span[aria-hidden="true"]');
    expect(dots).toHaveLength(5);
  });

  it('clamps non-finite filledDots to zero', () => {
    renderInViewport(
      <CapabilityStrip label="Force" sphereLabel="IRON" filledDots={Number.NaN} />,
    );
    const strip = screen.getByTestId('capability-strip');
    expect(strip).toBeInTheDocument();
  });
});
