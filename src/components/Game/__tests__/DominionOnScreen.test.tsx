// @vitest-environment jsdom
/**
 * THR-1750 — Dominion on screen, DOM half (plan § U2, U5, U6):
 * the band box and row, the ghost and red pips, the switch and its legend.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CostPips } from '../../shared/OddsPips';
import { MapLensSwitch } from '../../HexMapV2/chrome/MapLensSwitch';
import { DOMINION_LEGEND_LINES } from '../../../data/dominion-ui-content';

describe('CostPips ghost and dear pips (THR-1750 § U6)', () => {
  it('cheaper: struck faint pips for the par difference', () => {
    const { container } = render(<CostPips cost={4} ghostFrom={6} data-testid="p" />);
    expect(container.querySelector('[data-cost-ghost="2"]')).not.toBeNull();
    expect(screen.getByTestId('p').getAttribute('data-cost-pips')).toBe('4');
  });

  it('dearer: the pips above par are red', () => {
    const { container } = render(<CostPips cost={6} dearFrom={4} data-testid="p" />);
    expect(container.querySelector('[data-cost-dear="2"]')).not.toBeNull();
  });

  it('default render unchanged: no ghost, no dear', () => {
    const { container } = render(<CostPips cost={4} />);
    expect(container.querySelector('[data-cost-ghost]')).toBeNull();
    expect(container.querySelector('[data-cost-dear]')).toBeNull();
  });
});

describe('MapLensSwitch (THR-1750 § U2)', () => {
  it('off: the Dominion button with its key, no legend; click turns it on', () => {
    const onToggle = vi.fn();
    render(<MapLensSwitch active={null} onChange={onToggle} bandColors={{}} />);
    const btn = screen.getByTestId('map-lens-dominion');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.textContent).toBe('Dominion1');
    expect(screen.queryByTestId('map-lens-legend')).toBeNull();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('dominion');
  });

  it('on: pressed, with the legend lines and five band words', () => {
    render(<MapLensSwitch active="dominion" onChange={() => {}} bandColors={{}} />);
    expect(screen.getByTestId('map-lens-dominion').getAttribute('aria-pressed')).toBe('true');
    const legend = screen.getByTestId('map-lens-legend');
    for (const line of DOMINION_LEGEND_LINES) expect(legend.textContent).toContain(line);
    for (const band of ['sovereign', 'held', 'touched', 'foreign', 'hostile']) {
      expect(screen.getByTestId(`map-lens-band-${band}`)).toBeTruthy();
    }
  });
});
