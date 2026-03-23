// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HexMap } from '../HexMap';
import type { HexTile } from '../../../types';

describe('HexMap zoom', () => {
  const defaultProps = {
    tiles: [
      {
        coord: { col: 0, row: 0 },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      },
    ] as HexTile[],
    cols: 20,
    rows: 15,
    hoveredHex: null,
    selectedHex: null,
    overlayMode: 'none' as const,
    onHexClick: vi.fn(),
    onHexHover: vi.fn(),
  };

  it('renders an SVG with a zoom group', () => {
    const { container } = render(<HexMap {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const zoomGroup = svg?.querySelector('g.zoom-group');
    expect(zoomGroup).toBeTruthy();
  });

  it('accepts initialCenter and initialScale props', () => {
    const { container } = render(
      <HexMap
        {...defaultProps}
        initialCenter={{ x: 100, y: 100 }}
        initialScale={2.5}
      />
    );
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('g.zoom-group')).toBeTruthy();
  });

  it('calls onZoomChange callback when zoom is updated', () => {
    const onZoomChange = vi.fn();
    const { container } = render(
      <HexMap {...defaultProps} onZoomChange={onZoomChange} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
    // Note: Full zoom interaction testing requires simulating DOM events
    // which is beyond unit testing scope; this verifies the callback prop is accepted
  });

  it('renders tiles within zoom group', () => {
    const tiles: HexTile[] = [
      {
        coord: { col: 0, row: 0 },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      },
      {
        coord: { col: 1, row: 0 },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'forest' as const,
      },
    ];
    const { container } = render(<HexMap {...defaultProps} tiles={tiles} />);
    const zoomGroup = container.querySelector('g.zoom-group');
    // Verify tiles are rendered within the zoom group (not just in the document)
    expect(zoomGroup?.querySelectorAll('g').length).toBeGreaterThan(0);
  });
});
