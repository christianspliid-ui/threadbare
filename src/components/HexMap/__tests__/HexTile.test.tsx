// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile, TerrainType } from '../../../types';
import type { HexVisibilityState } from '../../../types/visibility';

// Helper to render a tile inside an <svg> element
const renderTile = (props: Partial<React.ComponentProps<typeof HexTileComponent>>) => {
  const defaultTile: HexTile = {
    coord: { col: 0, row: 0 },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: 'grassland' as TerrainType,
  };

  const defaults = {
    tile: defaultTile,
    cx: 100,
    cy: 100,
    size: 30,
    isHovered: false,
    isSelected: false,
  };

  return render(
    <svg>
      <HexTileComponent {...defaults} {...props} />
    </svg>
  );
};

describe('HexTile fog rendering', () => {
  it('renders normally when visibility is visible', () => {
    const { container } = renderTile({ visibility: 'visible' });
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
    // Should not have pure black fill
    expect(polygons[0].getAttribute('fill')).not.toBe('#0a0a0e');
  });

  it('renders black when visibility is unexplored', () => {
    const { container } = renderTile({ visibility: 'unexplored' });
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0].getAttribute('fill')).toBe('#0a0a0e');
    // No terrain icon text when unexplored
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBe(0);
  });

  it('renders dimmed when visibility is remembered', () => {
    const { container } = renderTile({ visibility: 'remembered' });
    const groups = container.querySelectorAll('g');
    // Second group (first is the outer wrapper) should have reduced opacity
    expect(groups[1]?.getAttribute('opacity')).toBe('0.4');
  });
});

describe('avatar hex overlay', () => {
  it('renders pulsing ring when isAvatarHex is true', () => {
    const { container } = renderTile({ isAvatarHex: true, sphereColor: '#ff6633' });
    const avatarOverlay = container.querySelector('.avatar-pulse');
    expect(avatarOverlay).toBeTruthy();
    // Verify it's a polygon with correct stroke
    expect(avatarOverlay?.tagName).toBe('polygon');
    expect(avatarOverlay?.getAttribute('stroke')).toBe('#ff6633');
    expect(avatarOverlay?.getAttribute('fill')).toBe('none');
  });

  it('does not render pulsing ring when isAvatarHex is false', () => {
    const { container } = renderTile({ isAvatarHex: false });
    const avatarOverlay = container.querySelector('.avatar-pulse');
    expect(avatarOverlay).toBeNull();
  });

  it('avatar ring uses correct sphere color', () => {
    const { container } = renderTile({ isAvatarHex: true, sphereColor: '#aa00ff' });
    const avatarOverlay = container.querySelector('.avatar-pulse');
    expect(avatarOverlay?.getAttribute('stroke')).toBe('#aa00ff');
  });
});
