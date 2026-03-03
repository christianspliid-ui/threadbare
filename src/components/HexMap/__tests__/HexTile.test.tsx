// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile } from '../../../types';

const mockTile: HexTile = {
  coord: { col: 0, row: 0 },
  geoParams: { elevation: 0.5, temperature: 0.6, moisture: 0.3 },
  terrain: 'grassland',
};

describe('HexTileComponent', () => {
  it('renders an SVG polygon', () => {
    const { container } = render(
      <svg>
        <HexTileComponent tile={mockTile} cx={100} cy={100} size={30} />
      </svg>
    );
    expect(container.querySelector('polygon')).toBeTruthy();
  });

  it('has a fill color from biome palette', () => {
    const { container } = render(
      <svg>
        <HexTileComponent tile={mockTile} cx={100} cy={100} size={30} />
      </svg>
    );
    const polygon = container.querySelector('polygon');
    const fillColor = polygon?.getAttribute('fill');
    expect(fillColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(fillColor).toBe('#c8d87a'); // grassland color
  });

  it('renders terrain icon as text', () => {
    const { container } = render(
      <svg>
        <HexTileComponent tile={mockTile} cx={100} cy={100} size={30} />
      </svg>
    );
    const text = container.querySelector('text');
    expect(text).toBeTruthy();
    expect(text?.textContent).toBe('🌾'); // grassland icon
  });
});
