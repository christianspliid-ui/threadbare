// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HexTileComponent } from '../HexTile';
import type { HexTile, TerrainType } from '../../../types';
import type { HexVisibilityState } from '../../../types/visibility';

// Helper to create a tile with specified terrain
function makeTile(terrain: TerrainType): HexTile {
  return {
    coord: { col: 0, row: 0 },
    geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.9 },
    terrain,
  };
}

// Helper to render a tile inside an <svg> element
function renderTile(terrain: TerrainType, visibility: HexVisibilityState = 'visible') {
  return render(
    <svg>
      <HexTileComponent
        tile={makeTile(terrain)}
        cx={50}
        cy={50}
        size={30}
        hexClipId="test-clip"
        visibility={visibility}
      />
    </svg>
  );
}

describe('HexTile water rendering with coastline integration', () => {
  describe('visible water hexes should be transparent (no terrain image)', () => {
    it('visible ocean hex renders transparent — no terrain image', () => {
      const { container } = renderTile('ocean', 'visible');
      const images = container.querySelectorAll('image');
      expect(images).toHaveLength(0);
    });

    it('visible coastal_shallows hex renders transparent — no terrain image', () => {
      const { container } = renderTile('coastal_shallows', 'visible');
      const images = container.querySelectorAll('image');
      expect(images).toHaveLength(0);
    });

    it('visible lake hex renders transparent — no terrain image', () => {
      const { container } = renderTile('lake', 'visible');
      const images = container.querySelectorAll('image');
      expect(images).toHaveLength(0);
    });

    it('visible river hex renders transparent — no terrain image', () => {
      const { container } = renderTile('river', 'visible');
      const images = container.querySelectorAll('image');
      expect(images).toHaveLength(0);
    });

    it('visible land hex still renders terrain image', () => {
      const { container } = renderTile('grassland', 'visible');
      const images = container.querySelectorAll('image');
      expect(images.length).toBeGreaterThan(0);
    });

    it('visible mountain hex renders terrain image', () => {
      const { container } = renderTile('mountains', 'visible');
      const images = container.querySelectorAll('image');
      expect(images.length).toBeGreaterThan(0);
    });

    it('visible water hex still has transparent polygon hit area for interactions', () => {
      const { container } = renderTile('ocean', 'visible');
      const polygons = container.querySelectorAll('polygon');
      // Should have a transparent polygon for clicks
      expect(polygons.length).toBeGreaterThan(0);
      const firstPolygon = polygons[0];
      expect(firstPolygon.getAttribute('fill')).toBe('transparent');
    });
  });

  describe('unexplored water hexes still render dark', () => {
    it('unexplored ocean hex still renders dark fill', () => {
      const { container } = renderTile('ocean', 'unexplored');
      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBeGreaterThan(0);
      const fills = Array.from(polygons).map(p => p.getAttribute('fill'));
      expect(fills).toContain('#1e1b2e');
    });

    it('unexplored coastal_shallows hex renders dark', () => {
      const { container } = renderTile('coastal_shallows', 'unexplored');
      const polygons = container.querySelectorAll('polygon');
      const fills = Array.from(polygons).map(p => p.getAttribute('fill'));
      expect(fills).toContain('#1e1b2e');
    });

    it('unexplored water hex has border stroke', () => {
      const { container } = renderTile('ocean', 'unexplored');
      const polygons = container.querySelectorAll('polygon');
      const strokes = Array.from(polygons).map(p => p.getAttribute('stroke'));
      expect(strokes.some(s => s && s.length > 0)).toBe(true);
    });
  });

  describe('remembered water hexes render with reduced opacity tint', () => {
    it('remembered ocean hex renders with reduced opacity group', () => {
      const { container } = renderTile('ocean', 'remembered');
      const dimmedGroup = container.querySelector('g[opacity="0.4"]');
      expect(dimmedGroup).not.toBeNull();
    });

    it('remembered coastal_shallows hex renders with dimmed appearance', () => {
      const { container } = renderTile('coastal_shallows', 'remembered');
      const dimmedGroup = container.querySelector('g[opacity="0.4"]');
      expect(dimmedGroup).not.toBeNull();
    });

    it('remembered water hex does not render terrain image', () => {
      const { container } = renderTile('ocean', 'remembered');
      const images = container.querySelectorAll('image');
      expect(images).toHaveLength(0);
    });

    it('remembered land hex still renders dimmed terrain image', () => {
      const { container } = renderTile('grassland', 'remembered');
      const images = container.querySelectorAll('image');
      expect(images.length).toBeGreaterThan(0);
      const dimmedGroup = container.querySelector('g[opacity="0.4"]');
      expect(dimmedGroup).not.toBeNull();
    });
  });

  describe('interactive states preserved for water hexes', () => {
    it('visible water hex shows selection ring when isSelected is true', () => {
      const { container } = render(
        <svg>
          <HexTileComponent
            tile={makeTile('ocean')}
            cx={50}
            cy={50}
            size={30}
            hexClipId="test-clip"
            visibility="visible"
            isSelected={true}
          />
        </svg>
      );
      const selectionRing = container.querySelector('polygon[stroke-dasharray="4,2"]');
      expect(selectionRing).not.toBeNull();
    });

    it('visible water hex shows avatar pulse when isAvatarHex is true', () => {
      const { container } = render(
        <svg>
          <HexTileComponent
            tile={makeTile('ocean')}
            cx={50}
            cy={50}
            size={30}
            hexClipId="test-clip"
            visibility="visible"
            isAvatarHex={true}
            sphereColor="#ff6633"
          />
        </svg>
      );
      const avatarPulse = container.querySelector('.avatar-pulse');
      expect(avatarPulse).not.toBeNull();
      expect(avatarPulse?.getAttribute('stroke')).toBe('#ff6633');
    });

    it('remembered water hex shows avatar pulse when isAvatarHex is true', () => {
      const { container } = render(
        <svg>
          <HexTileComponent
            tile={makeTile('ocean')}
            cx={50}
            cy={50}
            size={30}
            hexClipId="test-clip"
            visibility="remembered"
            isAvatarHex={true}
            sphereColor="#aa00ff"
          />
        </svg>
      );
      const avatarPulse = container.querySelector('.avatar-pulse');
      expect(avatarPulse).not.toBeNull();
      expect(avatarPulse?.getAttribute('stroke')).toBe('#aa00ff');
    });

    it('visible water hex preserves Tooltip wrapper for consistent interaction', () => {
      const { container } = renderTile('ocean', 'visible');
      // Tooltip wraps the component and provides hover behavior
      const tooltipGroup = container.querySelector('g');
      expect(tooltipGroup).not.toBeNull();
    });
  });
});
