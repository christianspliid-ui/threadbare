/**
 * Uncharted land as parchment (THR-1902, THR-1878 plan § D12).
 *
 * The overlay drew near-black because its custom shader skipped the sRGB output encode;
 * these tests pin the fix (the encode is in the shader), the palette token (both themes
 * set their own fill, and it is never the scene background), the off-grid vignette
 * uniforms, and the status `__DEBUG.getMapChrome().fog` reads.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as THREE from 'three';
import type { HexTile } from '../../../../types';
import {
  OVERLAY_FRAGMENT_SHADER,
  UNCHARTED_FILL_CONSTANTS,
  createFogOverlayMesh,
  getFogOverlayStatus,
  setFogOverlayAlpha,
  updateFogOverlayTexture,
} from '../FogOverlayMesh';
import { DARK_PARCHMENT, GOLDEN_HOUR } from '../../palette/paletteTheme';
import { setActivePalette } from '../../palette/activePalette';

function tiles(n: number): HexTile[] {
  const out: HexTile[] = [];
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      out.push({ coord: { col: c, row: r }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain: 'grassland' } as HexTile);
    }
  }
  return out;
}

afterEach(() => setActivePalette('golden-hour'));

describe('fogUnexploredFill — the palette token', () => {
  it('both palettes set their own fill, and neither is the scene background', () => {
    for (const theme of [GOLDEN_HOUR, DARK_PARCHMENT]) {
      const bg = `#${theme.sceneBackground.toString(16).padStart(6, '0')}`;
      expect(theme.fogUnexploredFill.tint.toLowerCase()).not.toBe(bg);
    }
    expect(DARK_PARCHMENT.fogUnexploredFill).not.toEqual(GOLDEN_HOUR.fogUnexploredFill);
  });

  it('Golden Hour keeps the parchment texture and its old fallback tint', () => {
    expect(GOLDEN_HOUR.fogUnexploredFill.texture).toBe('/textures/parchment-512.png');
    expect(GOLDEN_HOUR.fogUnexploredFill.tint).toBe('#3d3025');
  });
});

describe('fog overlay — the near-black fix', () => {
  it('the fragment shader encodes its output colour (the missing step that crushed it to black)', () => {
    expect(OVERLAY_FRAGMENT_SHADER).toContain('#include <colorspace_fragment>');
  });

  it('samples in world space and fades to the background at the grid edge', () => {
    const fog = createFogOverlayMesh(tiles(4), 4, 4, null);
    const u = (fog.mesh.material as THREE.ShaderMaterial).uniforms;
    expect(u.uWorldSpan.value).toBe(UNCHARTED_FILL_CONSTANTS.PARCHMENT_WORLD_SPAN);
    expect(u.uVignetteWidth.value).toBeGreaterThan(0);
    const rect = u.uGridRect.value as THREE.Vector4;
    expect(rect.z).toBeGreaterThan(rect.x);
    expect(rect.w).toBeGreaterThan(rect.y);
    const bg = new THREE.Color(GOLDEN_HOUR.sceneBackground);
    expect((u.uBackground.value as THREE.Color).equals(bg)).toBe(true);
    expect((u.uTint.value as THREE.Color).equals(new THREE.Color(GOLDEN_HOUR.fogUnexploredFill.tint))).toBe(true);
  });
});

describe('getFogOverlayStatus — getMapChrome().fog', () => {
  it('reports the tint until the parchment loads, then parchment', () => {
    const fog = createFogOverlayMesh(tiles(3), 3, 3, null);
    expect(getFogOverlayStatus(fog)).toMatchObject({ enabled: true, unexplored: 'tint', textureLoaded: false, unexploredHexes: 9 });
    updateFogOverlayTexture(fog, new THREE.Texture());
    setFogOverlayAlpha(fog, '0,0', 0);
    expect(getFogOverlayStatus(fog)).toMatchObject({ unexplored: 'parchment', textureLoaded: true, unexploredHexes: 8 });
  });

  it('a palette whose fill has no texture keeps its tint even when one loads', () => {
    // Swap in a texture-less fill on a throwaway copy of the theme via the active palette.
    const flat = { ...GOLDEN_HOUR, fogUnexploredFill: { texture: null, tint: '#55462f' } };
    const original = GOLDEN_HOUR.fogUnexploredFill;
    (GOLDEN_HOUR as { fogUnexploredFill: typeof flat.fogUnexploredFill }).fogUnexploredFill = flat.fogUnexploredFill;
    try {
      const fog = createFogOverlayMesh(tiles(2), 2, 2, new THREE.Texture());
      expect(getFogOverlayStatus(fog).unexplored).toBe('tint');
      updateFogOverlayTexture(fog, new THREE.Texture());
      expect(getFogOverlayStatus(fog).unexplored).toBe('tint');
    } finally {
      (GOLDEN_HOUR as { fogUnexploredFill: typeof original }).fogUnexploredFill = original;
    }
  });

  it('no overlay reads as fog off (fail-soft)', () => {
    expect(getFogOverlayStatus(null)).toEqual({ enabled: false, unexplored: 'tint', textureLoaded: false, unexploredHexes: 0 });
  });
});
