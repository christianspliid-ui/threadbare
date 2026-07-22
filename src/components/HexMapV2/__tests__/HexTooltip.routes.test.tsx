// @vitest-environment jsdom
/**
 * HexTooltip trade-route section (THR-670) — rendered through the real component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HexTooltip } from '../interaction/HexTooltip';
import type { RouteTooltipEntry } from '../../../engine/tradeRouteMarkers';

const base = {
  terrainName: 'Plains',
  coord: { col: 3, row: 4 },
  screenX: 300, screenY: 300, canvasWidth: 1920, canvasHeight: 1080,
};

const route = (over: Partial<RouteTooltipEntry> = {}): RouteTooltipEntry => ({
  otherName: 'Thornhaven', goods: ['gemstones', 'grain'],
  carriesStaple: true, threatened: false, volume: 2, ...over,
});

describe('HexTooltip trade routes (THR-670)', () => {
  it('lists routes with counterpart + cargo manifest + staple marker', () => {
    render(<HexTooltip {...base} tradeRoutes={[route()]} />);
    expect(screen.getByText(/Thornhaven — gemstones, grain/)).toBeTruthy();
    expect(screen.getByText(/·staple/)).toBeTruthy();
  });

  it('marks threatened routes and shows the overflow line past the cap', () => {
    const routes = [
      route({ otherName: 'A', threatened: true }),
      route({ otherName: 'B' }), route({ otherName: 'C' }), route({ otherName: 'D' }),
    ];
    render(<HexTooltip {...base} tradeRoutes={routes} />);
    expect(screen.getByText(/·threatened/)).toBeTruthy();
    expect(screen.getByText(/\(1 more route\)/)).toBeTruthy();
  });

  it('legacy manifest-less routes read as light trade; no section without routes', () => {
    const { unmount } = render(<HexTooltip {...base} tradeRoutes={[route({ goods: [], carriesStaple: false })]} />);
    expect(screen.getByText(/light trade/)).toBeTruthy();
    unmount();
    render(<HexTooltip {...base} />);
    expect(screen.queryByText(/light trade/)).toBeNull();
  });
});
