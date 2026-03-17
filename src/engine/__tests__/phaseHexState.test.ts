import { describe, it, expect, beforeEach } from 'vitest';
import { phaseHexState } from '../phaseHexState';
import {
  HEX_DIVINE_INFLUENCE_DECAY_RATE,
  HEX_CORRUPTION_DECAY_RATE,
  HEX_CORRUPTION_TRANSFORM_THRESHOLD,
  HEX_DIVINE_TRANSFORM_THRESHOLD,
  HEX_TRANSFORM_COOLDOWN_TICKS,
} from '../phaseHexState';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types/index';
import type { HexMutation } from '../../types/hexMutation';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeTile(overrides: Partial<HexTile> = {}): HexTile {
  return {
    coord: { col: 0, row: 0 },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain: 'grassland',
    ...overrides,
  };
}

function makeState(tiles: HexTile[]): GameState {
  return {
    tick: 10,
    tiles,
  } as unknown as GameState;
}

// ─── Decay ───────────────────────────────────────────────────────────────────

describe('phaseHexState — decay', () => {
  it('decays divineInfluence by HEX_DIVINE_INFLUENCE_DECAY_RATE', () => {
    const tile = makeTile({ coord: { col: 0, row: 0 }, divineInfluence: 0.5 });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    const updated = result.tiles![0];
    expect(updated.divineInfluence).toBeCloseTo(0.5 - HEX_DIVINE_INFLUENCE_DECAY_RATE, 5);
  });

  it('decays corruption by HEX_CORRUPTION_DECAY_RATE', () => {
    const tile = makeTile({ coord: { col: 0, row: 0 }, corruption: 0.3 });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    const updated = result.tiles![0];
    expect(updated.corruption).toBeCloseTo(0.3 - HEX_CORRUPTION_DECAY_RATE, 5);
  });

  it('clamps divineInfluence to 0 when below 0', () => {
    const tile = makeTile({ coord: { col: 0, row: 0 }, divineInfluence: 0.01 });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    expect(result.tiles![0].divineInfluence).toBeGreaterThanOrEqual(0);
  });

  it('returns same tile reference when both values are 0 and no mutations', () => {
    const tile = makeTile({ coord: { col: 0, row: 0 } });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    // Tile with no state should be returned as-is (optimization)
    expect(result.tiles![0]).toBe(tile);
  });
});

// ─── Mutations ───────────────────────────────────────────────────────────────

describe('phaseHexState — pending mutations', () => {
  it('applies divineInfluence mutation to matching hex', () => {
    const tile = makeTile({ coord: { col: 3, row: 5 }, divineInfluence: 0.1 });
    const state = makeState([tile]);
    const mutations: HexMutation[] = [{
      col: 3, row: 5, field: 'divineInfluence', delta: 0.3, source: 'hex.bless_land',
    }];
    const result = phaseHexState(state, mutations);
    // Should be 0.1 + 0.3 - decay
    const expected = 0.1 + 0.3 - HEX_DIVINE_INFLUENCE_DECAY_RATE;
    expect(result.tiles![0].divineInfluence).toBeCloseTo(expected, 4);
  });

  it('applies corruption mutation to matching hex', () => {
    const tile = makeTile({ coord: { col: 2, row: 4 }, corruption: 0.0 });
    const state = makeState([tile]);
    const mutations: HexMutation[] = [{
      col: 2, row: 4, field: 'corruption', delta: 0.25, source: 'hex.corrupt_land',
    }];
    const result = phaseHexState(state, mutations);
    // 0 + 0.25 - decay (corruption was 0, then becomes 0.25, then decays)
    const expected = 0.25 - HEX_CORRUPTION_DECAY_RATE;
    expect(result.tiles![0].corruption).toBeCloseTo(expected, 4);
  });

  it('does not apply mutation to non-matching hex', () => {
    const tile = makeTile({ coord: { col: 1, row: 1 }, divineInfluence: 0.2 });
    const state = makeState([tile]);
    const mutations: HexMutation[] = [{
      col: 9, row: 9, field: 'divineInfluence', delta: 0.5, source: 'hex.bless_land',
    }];
    const result = phaseHexState(state, mutations);
    // Only decay applied to tile at (1,1)
    expect(result.tiles![0].divineInfluence).toBeCloseTo(0.2 - HEX_DIVINE_INFLUENCE_DECAY_RATE, 4);
  });

  it('clamps divineInfluence to 1.0 when mutation would exceed it', () => {
    const tile = makeTile({ coord: { col: 0, row: 0 }, divineInfluence: 0.9 });
    const state = makeState([tile]);
    const mutations: HexMutation[] = [{
      col: 0, row: 0, field: 'divineInfluence', delta: 0.5, source: 'hex.bless_land',
    }];
    const result = phaseHexState(state, mutations);
    expect(result.tiles![0].divineInfluence).toBeLessThanOrEqual(1.0);
  });
});

// ─── Terrain transformation ───────────────────────────────────────────────────

describe('phaseHexState — terrain transformation', () => {
  it('degrades terrain when corruption crosses threshold', () => {
    const tile = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'grassland',
      corruption: HEX_CORRUPTION_TRANSFORM_THRESHOLD + 0.01,
    });
    const state = makeState([tile]);
    // Decay will keep it above threshold (0.71 - 0.01 = 0.70 which is right at threshold)
    // so start at 0.72 to ensure post-decay value remains >= threshold
    const tile2 = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'grassland',
      corruption: HEX_CORRUPTION_TRANSFORM_THRESHOLD + 0.05,
    });
    const state2 = makeState([tile2]);
    const result = phaseHexState(state2);
    expect(result.tiles![0].terrain).toBe('moor_bog');
    expect(result.tiles![0].baseTerrain).toBe('grassland');
    expect(result.tiles![0].terrainTransformedTick).toBe(10);
  });

  it('restores terrain when divineInfluence crosses threshold', () => {
    const tile = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'dead_forest',
      divineInfluence: HEX_DIVINE_TRANSFORM_THRESHOLD + 0.05,
    });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    expect(result.tiles![0].terrain).toBe('light_forest');
  });

  it('respects transformation cooldown', () => {
    const tile = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'grassland',
      corruption: HEX_CORRUPTION_TRANSFORM_THRESHOLD + 0.1,
      terrainTransformedTick: 5, // 10 - 5 = 5 ticks ago, cooldown is 10
    });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    // Should NOT transform because cooldown hasn't elapsed
    expect(result.tiles![0].terrain).toBe('grassland');
  });

  it('allows transformation after cooldown elapsed', () => {
    const tile = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'grassland',
      corruption: HEX_CORRUPTION_TRANSFORM_THRESHOLD + 0.1,
      terrainTransformedTick: 1, // 10 - 1 = 9... wait, cooldown is 10, so need tick - last >= 10
    });
    // tick=10, last=0: 10-0=10 >= 10 → allowed
    const tile2 = { ...tile, terrainTransformedTick: 0 };
    const state = makeState([tile2]);
    const result = phaseHexState(state);
    expect(result.tiles![0].terrain).toBe('moor_bog');
  });

  it('does not transform terrain not in the table (fail-soft)', () => {
    const tile = makeTile({
      coord: { col: 0, row: 0 },
      terrain: 'ocean',
      corruption: HEX_CORRUPTION_TRANSFORM_THRESHOLD + 0.1,
    });
    const state = makeState([tile]);
    const result = phaseHexState(state);
    // Ocean has no corruption transformation — stays ocean
    expect(result.tiles![0].terrain).toBe('ocean');
  });
});

// ─── Multiple tiles ───────────────────────────────────────────────────────────

describe('phaseHexState — multiple tiles', () => {
  it('processes all tiles independently', () => {
    const tiles: HexTile[] = [
      makeTile({ coord: { col: 0, row: 0 }, divineInfluence: 0.5 }),
      makeTile({ coord: { col: 1, row: 0 }, corruption: 0.3 }),
      makeTile({ coord: { col: 2, row: 0 } }),
    ];
    const state = makeState(tiles);
    const result = phaseHexState(state);
    expect(result.tiles!).toHaveLength(3);
    expect(result.tiles![0].divineInfluence).toBeCloseTo(0.5 - HEX_DIVINE_INFLUENCE_DECAY_RATE, 4);
    expect(result.tiles![1].corruption).toBeCloseTo(0.3 - HEX_CORRUPTION_DECAY_RATE, 4);
    // Tile 2 has no state — should be same reference
    expect(result.tiles![2]).toBe(tiles[2]);
  });
});
