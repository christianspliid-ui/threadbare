import { describe, it, expect, vi } from 'vitest';
import type { HexTile } from '../../../../types';
import {
  FOG_CONSTANTS,
  isLayerVisibleForHex,
  buildOriginalColorCache,
  updateFogColors,
  computeVisibilityFromSources,
} from '../FogCulling';
import type { FogLayer } from '../FogCulling';
import type { VisibilityMap, HexVisibility } from '../../../../types/visibility';

// ── Minimal HexTile factory ──────────────────────────────────────────────────

function makeTile(col: number, row: number, terrain = 'grassland'): HexTile {
  return {
    col,
    row,
    terrain,
    elevation: 0.3,
    temperature: 0.5,
    moisture: 0.5,
    biome: 'temperate',
  } as HexTile;
}

// ── Minimal InstancedMesh mock ───────────────────────────────────────────────

function makeMeshMock() {
  const setColorAt = vi.fn();
  const instanceColor = { needsUpdate: false };
  return { setColorAt, instanceColor } as unknown as import('three').InstancedMesh;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('FOG_CONSTANTS', () => {
  it('UNEXPLORED_HEX_COLOR is #0a0a0c', () => {
    expect(FOG_CONSTANTS.UNEXPLORED_HEX_COLOR).toBe('#0a0a0c');
  });

  it('DEFAULT_SIGHT_RANGE is 0', () => {
    expect(FOG_CONSTANTS.DEFAULT_SIGHT_RANGE).toBe(0);
  });

  it('ELEVATION_BONUS is 1', () => {
    expect(FOG_CONSTANTS.ELEVATION_BONUS).toBe(1);
  });
});

describe('isLayerVisibleForHex — unexplored', () => {
  const layers: FogLayer[] = ['terrain', 'signifier', 'location', 'label', 'agent', 'event', 'grid'];

  it('returns true for terrain (shows dark fill color)', () => {
    expect(isLayerVisibleForHex('unexplored', 'terrain')).toBe(true);
  });

  it('returns false for signifier', () => {
    expect(isLayerVisibleForHex('unexplored', 'signifier')).toBe(false);
  });

  it('returns false for agent', () => {
    expect(isLayerVisibleForHex('unexplored', 'agent')).toBe(false);
  });

  it('returns false for location', () => {
    expect(isLayerVisibleForHex('unexplored', 'location')).toBe(false);
  });

  it('returns false for label', () => {
    expect(isLayerVisibleForHex('unexplored', 'label')).toBe(false);
  });

  it('returns false for event', () => {
    expect(isLayerVisibleForHex('unexplored', 'event')).toBe(false);
  });

  it('returns false for grid', () => {
    expect(isLayerVisibleForHex('unexplored', 'grid')).toBe(false);
  });
});

describe('isLayerVisibleForHex — remembered', () => {
  it('returns true for terrain', () => {
    expect(isLayerVisibleForHex('remembered', 'terrain')).toBe(true);
  });

  it('returns true for signifier', () => {
    expect(isLayerVisibleForHex('remembered', 'signifier')).toBe(true);
  });

  it('returns true for location', () => {
    expect(isLayerVisibleForHex('remembered', 'location')).toBe(true);
  });

  it('returns true for label', () => {
    expect(isLayerVisibleForHex('remembered', 'label')).toBe(true);
  });

  it('returns false for agent', () => {
    expect(isLayerVisibleForHex('remembered', 'agent')).toBe(false);
  });

  it('returns false for event', () => {
    expect(isLayerVisibleForHex('remembered', 'event')).toBe(false);
  });

  it('returns false for grid', () => {
    expect(isLayerVisibleForHex('remembered', 'grid')).toBe(false);
  });
});

describe('isLayerVisibleForHex — visible', () => {
  const layers: FogLayer[] = ['terrain', 'signifier', 'location', 'label', 'agent', 'event', 'grid'];

  it.each(layers)('returns true for %s', (layer) => {
    expect(isLayerVisibleForHex('visible', layer)).toBe(true);
  });
});

describe('buildOriginalColorCache', () => {
  it('returns Float32Array of length 9 for 3 tiles (3*3 RGB floats)', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const { colors } = buildOriginalColorCache(tiles, 42);
    expect(colors).toBeInstanceOf(Float32Array);
    expect(colors.length).toBe(9);
  });

  it('returns indexByKey Map of size 3 for 3 tiles', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const { indexByKey } = buildOriginalColorCache(tiles, 42);
    expect(indexByKey).toBeInstanceOf(Map);
    expect(indexByKey.size).toBe(3);
  });

  it('maps "col,row" keys to tile indices', () => {
    const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(2, 0)];
    const { indexByKey } = buildOriginalColorCache(tiles, 42);
    expect(indexByKey.has('0,0')).toBe(true);
    expect(indexByKey.has('1,0')).toBe(true);
    expect(indexByKey.has('2,0')).toBe(true);
  });

  it('color values are normalized floats in [0, 1]', () => {
    const tiles = [makeTile(0, 0, 'forest')];
    const { colors } = buildOriginalColorCache(tiles, 42);
    for (let i = 0; i < colors.length; i++) {
      expect(colors[i]).toBeGreaterThanOrEqual(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
    }
  });
});

describe('updateFogColors', () => {
  it('calls setColorAt for unexplored hex with fog color (dark)', () => {
    const tiles = [makeTile(5, 5)];
    const { colors, indexByKey } = buildOriginalColorCache(tiles, 42);
    const mesh = makeMeshMock();

    const visMap: VisibilityMap = new Map([
      ['5,5', { state: 'unexplored' } as HexVisibility],
    ]);

    updateFogColors(mesh, visMap, indexByKey, colors);

    expect(mesh.setColorAt).toHaveBeenCalledOnce();
    // The color argument should be a THREE.Color-like object
    const [idx] = (mesh.setColorAt as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(idx).toBe(0); // first (only) tile index
  });

  it('calls setColorAt for remembered hex with original color', () => {
    const tiles = [makeTile(3, 3, 'grassland')];
    const { colors, indexByKey } = buildOriginalColorCache(tiles, 42);
    const mesh = makeMeshMock();

    const visMap: VisibilityMap = new Map([
      ['3,3', { state: 'remembered' } as HexVisibility],
    ]);

    updateFogColors(mesh, visMap, indexByKey, colors);
    expect(mesh.setColorAt).toHaveBeenCalledOnce();
  });

  it('calls setColorAt for visible hex with original color', () => {
    const tiles = [makeTile(7, 2, 'forest')];
    const { colors, indexByKey } = buildOriginalColorCache(tiles, 42);
    const mesh = makeMeshMock();

    const visMap: VisibilityMap = new Map([
      ['7,2', { state: 'visible' } as HexVisibility],
    ]);

    updateFogColors(mesh, visMap, indexByKey, colors);
    expect(mesh.setColorAt).toHaveBeenCalledOnce();
  });

  it('sets instanceColor.needsUpdate to true after updates', () => {
    const tiles = [makeTile(0, 0)];
    const { colors, indexByKey } = buildOriginalColorCache(tiles, 42);
    const mesh = makeMeshMock();

    const visMap: VisibilityMap = new Map([
      ['0,0', { state: 'visible' } as HexVisibility],
    ]);

    updateFogColors(mesh, visMap, indexByKey, colors);
    expect((mesh.instanceColor as { needsUpdate: boolean }).needsUpdate).toBe(true);
  });

  it('skips keys not in indexByKey without throwing (fail-soft)', () => {
    const tiles = [makeTile(0, 0)];
    const { colors, indexByKey } = buildOriginalColorCache(tiles, 42);
    const mesh = makeMeshMock();

    // Key '99,99' is not in indexByKey
    const visMap: VisibilityMap = new Map([
      ['99,99', { state: 'visible' } as HexVisibility],
    ]);

    expect(() => updateFogColors(mesh, visMap, indexByKey, colors)).not.toThrow();
    expect(mesh.setColorAt).not.toHaveBeenCalled();
  });
});

describe('computeVisibilityFromSources', () => {
  it('returns visible for own hex at range 0', () => {
    const result = computeVisibilityFromSources(
      [{ hexCol: 5, hexRow: 5, range: 0 }],
      20,
      20,
    );
    expect(result.get('5,5')).toBe('visible');
    expect(result.size).toBe(1);
  });

  it('returns visible for source hex and 6 neighbors at range 1', () => {
    const result = computeVisibilityFromSources(
      [{ hexCol: 5, hexRow: 5, range: 1 }],
      20,
      20,
    );
    // Center + 6 neighbors = 7 hexes (assuming all in-bounds)
    expect(result.get('5,5')).toBe('visible');
    expect(result.size).toBe(7);
  });

  it('does not include out-of-bounds hexes', () => {
    // Source at corner (0,0) with range 1 — many neighbors are out of bounds
    const result = computeVisibilityFromSources(
      [{ hexCol: 0, hexRow: 0, range: 1 }],
      20,
      20,
    );
    for (const key of result.keys()) {
      const [col, row] = key.split(',').map(Number);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(col).toBeLessThan(20);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(20);
    }
  });

  it('remaining hexes are not in returned map', () => {
    // Only source hex visible — '0,0' is not in result if source is at (5,5) range 0
    const result = computeVisibilityFromSources(
      [{ hexCol: 5, hexRow: 5, range: 0 }],
      20,
      20,
    );
    expect(result.has('0,0')).toBe(false);
  });

  it('merges visibility from multiple sources', () => {
    const result = computeVisibilityFromSources(
      [
        { hexCol: 2, hexRow: 2, range: 0 },
        { hexCol: 10, hexRow: 10, range: 0 },
      ],
      20,
      20,
    );
    expect(result.get('2,2')).toBe('visible');
    expect(result.get('10,10')).toBe('visible');
    expect(result.size).toBe(2);
  });

  it('handles source at grid boundary without throwing', () => {
    expect(() =>
      computeVisibilityFromSources(
        [{ hexCol: 19, hexRow: 19, range: 2 }],
        20,
        20,
      ),
    ).not.toThrow();
  });
});
