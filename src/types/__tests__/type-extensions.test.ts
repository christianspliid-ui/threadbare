import { describe, it, expect } from 'vitest';
import type { HexTile } from '../index';
import type { NodeType } from '../graph';

describe('HexTile extension', () => {
  it('accepts hasRiver optional property', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
      hasRiver: true,
    };
    expect(tile.hasRiver).toBe(true);
  });

  it('accepts regionId optional property', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
      regionId: 'region-001',
    };
    expect(tile.regionId).toBe('region-001');
  });

  it('works without optional properties', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    };
    expect(tile.hasRiver).toBeUndefined();
    expect(tile.regionId).toBeUndefined();
  });
});

describe('NodeType extension', () => {
  it('accepts region as a valid NodeType', () => {
    const type: NodeType = 'region';
    expect(type).toBe('region');
  });
});
