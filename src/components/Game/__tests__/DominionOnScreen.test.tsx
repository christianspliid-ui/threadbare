// @vitest-environment jsdom
/**
 * THR-1750 — Dominion on screen, DOM half (plan § U2, U5, U6):
 * the band box and row, the ghost and red pips, the switch and its legend.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DominionBox } from '../DominionBox';
import { CostPips } from '../../shared/OddsPips';
import { MapLensSwitch } from '../../HexMapV2/chrome/MapLensSwitch';
import type { DominionSheetVM } from '../../../engine/dominionViewModels';
import { DOMINION_LEGEND_LINES } from '../../../data/dominion-ui-content';

const HELD: DominionSheetVM = {
  band: 'held',
  word: 'Held',
  line: 'Yours, and holding. Cheaper works, richer threads.',
  tendLine: 'Left untended, it will slip back.',
  sphereColorVar: 'var(--sphere-mind-bright)',
  tooltipId: 'ui.dominion.held',
  headerTooltipId: 'ui.dominion',
};

describe('DominionBox (THR-1750 § U5)', () => {
  it('the box says the band word, its line and the tend line — no number', () => {
    render(<DominionBox vm={HELD} />);
    const box = screen.getByTestId('dominion-box');
    expect(box.textContent).toContain('Dominion');
    expect(box.textContent).toContain('Held. Yours, and holding. Cheaper works, richer threads. Left untended, it will slip back.');
    expect(box.textContent).not.toMatch(/\d/);
    expect(box.querySelector('[data-dominion-band="held"]')).not.toBeNull();
  });

  it('the row omits the tend line; a null VM renders nothing', () => {
    render(<DominionBox vm={{ ...HELD, tendLine: null }} variant="row" />);
    expect(screen.getByTestId('dominion-row').textContent).toBe('DominionHeld· Yours, and holding. Cheaper works, richer threads.');
    const { container } = render(<DominionBox vm={null} />);
    expect(container.innerHTML).toBe('');
  });
});

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
  it('off: one Dominion button with its key, no legend; click toggles', () => {
    const onToggle = vi.fn();
    render(<MapLensSwitch active={null} onToggle={onToggle} bandColors={{}} />);
    const btn = screen.getByTestId('map-lens-dominion');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.textContent).toBe('Dominion1');
    expect(screen.queryByTestId('map-lens-legend')).toBeNull();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('dominion');
  });

  it('on: pressed, with the legend lines and five band words', () => {
    render(<MapLensSwitch active="dominion" onToggle={() => {}} bandColors={{}} />);
    expect(screen.getByTestId('map-lens-dominion').getAttribute('aria-pressed')).toBe('true');
    const legend = screen.getByTestId('map-lens-legend');
    for (const line of DOMINION_LEGEND_LINES) expect(legend.textContent).toContain(line);
    for (const band of ['sovereign', 'held', 'touched', 'foreign', 'hostile']) {
      expect(screen.getByTestId(`map-lens-band-${band}`)).toBeTruthy();
    }
  });
});
