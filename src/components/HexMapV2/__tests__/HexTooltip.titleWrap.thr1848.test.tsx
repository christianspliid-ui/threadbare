// @vitest-environment jsdom
/**
 * THR-1848 — the tooltip box is `white-space: nowrap` with a width cap, so a
 * long place name used to inherit `nowrap` and run past the border (Law 33).
 * The title line now wraps inside the box, and the height estimate counts the
 * extra line so the tooltip still clears the hovered hex.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexTooltip } from '../interaction/HexTooltip';
import { INTERACTION_CONSTANTS } from '../interaction/HexRaycaster';
import type { LocationActivitySummary } from '../../../types/locationActivity';

const base = {
  coord: { col: 4, row: 7 },
  terrainName: 'grassland',
  screenX: 600, screenY: 600, canvasWidth: 1920, canvasHeight: 1080,
};

function activity(locationName: string): LocationActivitySummary {
  return {
    locationName,
    murmurs: ['Carts creak along the ruts.'],
    agentThreads: [],
  } as unknown as LocationActivitySummary;
}

const LONG_NAME = 'The Shattered Sanctum–Hawkgate Road';

describe('HexTooltip title line (THR-1848)', () => {
  it('wraps the place name instead of inheriting the box nowrap', () => {
    render(<HexTooltip {...base} locationActivity={activity(LONG_NAME)} />);
    const title = screen.getByTestId('hex-tooltip-title');
    expect(title.textContent).toBe(LONG_NAME);
    expect(title.style.whiteSpace).toBe('normal');
    expect(title.style.overflowWrap).toBe('anywhere');
  });

  it('wraps a terrain-only title too', () => {
    render(<HexTooltip {...base} terrainKey="grassland" />);
    expect(screen.getByTestId('hex-tooltip-title').style.whiteSpace).toBe('normal');
  });

  it('lifts the box by the wrapped line so it still clears the hex', () => {
    const { container: shortBox } = render(<HexTooltip {...base} locationActivity={activity('Hesk')} />);
    const { container: longBox } = render(<HexTooltip {...base} locationActivity={activity(LONG_NAME)} />);
    const topOf = (c: HTMLElement) => parseFloat((c.firstElementChild as HTMLElement).style.top);
    expect(topOf(longBox)).toBeLessThan(topOf(shortBox));
    expect(topOf(longBox)).toBeLessThan(base.screenY - INTERACTION_CONSTANTS.TOOLTIP_OFFSET_Y);
  });

  it('counts the river suffix, which wraps with the title', () => {
    const topOf = (c: HTMLElement) => parseFloat((c.firstElementChild as HTMLElement).style.top);
    const { container: dry } = render(<HexTooltip {...base} terrainKey="temperate_forest" />);
    const { container: wet } = render(<HexTooltip {...base} terrainKey="temperate_forest" hasRiver />);
    // "Temperate Forest · River" is past one line of the 180 px terrain-only box.
    expect(topOf(wet)).toBeLessThan(topOf(dry));
  });
});
