import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile } from '../../../types';

const mockTile: HexTile = {
  coord: { col: 0, row: 0 },
  forces: { aether: 0.4, verdance: 0.2, ignis: 0.1, umbra: 0.1, terra: 0.2 },
  terrain: 'crystal_wastes',
  elevation: 0.5, moisture: 0.3, magicDensity: 0.6,
};

describe('HexTileComponent', () => {
  it('renders an SVG polygon', () => {
    const { container } = render(
      <svg><HexTileComponent tile={mockTile} cx={100} cy={100} size={30} /></svg>
    );
    expect(container.querySelector('polygon')).toBeTruthy();
  });

  it('has a fill color', () => {
    const { container } = render(
      <svg><HexTileComponent tile={mockTile} cx={100} cy={100} size={30} /></svg>
    );
    expect(container.querySelector('polygon')?.getAttribute('fill')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
