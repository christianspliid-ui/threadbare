// @vitest-environment jsdom
/**
 * HexLensLayer — Lenses II draw kinds (THR-1898; THR-1878 plan § D3, D4).
 *
 * - Trouble badges are carved-icon sprites, at most LENS_BADGES_PER_HEX per hex.
 * - A local omen draws one dotted ring and its centre badge.
 * - A road draws the trade-route line (gold, red when threatened) and one mid-road badge.
 * - Badges show at regional and hero-local only, LENS_BADGE_PX on screen at any k.
 * - No lens object is a pick target (D11).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createHexLensLayer,
  updateHexLensZoom,
  LENS_BADGES_PER_HEX,
} from '../HexLensLayer';
import { LENS_BADGE_PX } from '../../../../data/map-markers';
import { buildTroubleLens } from '../../../../engine/views/lenses/troubleLens';
import { buildTradeLens } from '../../../../engine/views/lenses/tradeLens';
import { buildViewContext } from '../../../../engine/views/viewContext';
import { lensFixture } from '../../../../engine/views/lenses/__tests__/lensFixture';
import type { HexLensVM } from '../../../../engine/views/lenses/lensTypes';

function layerFor(build: typeof buildTroubleLens) {
  const { state, tiles } = lensFixture();
  const vm = build(buildViewContext(null, state, tiles));
  const lensTiles = tiles.map(t => ({ col: t.coord.col, row: t.coord.row, isWater: t.terrain === 'ocean' }));
  return { vm, layer: createHexLensLayer(vm, lensTiles) };
}

const badges = (g: THREE.Group) => g.children.filter(c => c.userData.lensBadge);

describe('HexLensLayer — Trouble', () => {
  it('draws a carved badge per mark kind, with no fallback', () => {
    const { vm, layer } = layerFor(buildTroubleLens);
    expect(layer.markFallbacks).toEqual([]);
    const kinds = new Set(vm.marks.map(m => m.kind));
    for (const kind of kinds) expect(layer.counts.marks[kind], kind).toBeGreaterThan(0);
    expect(badges(layer.group).every(b => b instanceof THREE.Sprite)).toBe(true);
    expect(layer.group.name).toBe('lens:trouble');
  });

  it('a hex shows at most LENS_BADGES_PER_HEX badges; the hover keeps every kind', () => {
    const vm: HexLensVM = {
      lensId: 'trouble', lit: ['2,2'], hover: {}, legend: { head: 'Trouble', lines: [] }, emptyLine: null,
      marks: (['unrest', 'strife', 'scheme', 'lair'] as const).map(kind => ({ kind, hexKey: '2,2', tone: 'trouble' as const })),
    };
    const layer = createHexLensLayer(vm, [{ col: 2, row: 2, isWater: false }]);
    expect(badges(layer.group)).toHaveLength(LENS_BADGES_PER_HEX);
    // Two badges sit side by side along the lower edge, not on top of each other.
    const [a, b] = badges(layer.group);
    expect(a.position.x).not.toBe(b.position.x);
    expect(a.position.y).toBe(b.position.y);
  });

  it('an omen draws one dotted ring and one centre badge', () => {
    const { layer } = layerFor(buildTroubleLens);
    const omenParts = layer.group.children.filter(c => c.userData.lensMark === 'omen');
    expect(omenParts.filter(c => c instanceof THREE.Line)).toHaveLength(1);
    expect(omenParts.filter(c => c.userData.lensBadge)).toHaveLength(1);
    const ring = omenParts.find(c => c instanceof THREE.Line) as THREE.Line;
    expect(ring.material).toBeInstanceOf(THREE.LineDashedMaterial);
  });
});

describe('HexLensLayer — Trade', () => {
  it('draws each road as its route line plus one mid-road badge', () => {
    const { vm, layer } = layerFor(buildTradeLens);
    const roads = vm.marks.filter(m => m.kind === 'road');
    const lines = layer.group.children.filter(c => c.userData.lensMark === 'road' && c instanceof THREE.Group);
    expect(lines).toHaveLength(roads.length);
    expect(badges(layer.group)).toHaveLength(roads.length);
    expect(layer.counts.marks.road).toBe(roads.length);
  });

  it('a threatened road is red, a healthy one gold', () => {
    const { layer } = layerFor(buildTradeLens);
    const colours = layer.group.children
      .filter(c => c instanceof THREE.Group)
      .flatMap(g => g.children as THREE.Mesh[])
      .map(m => '#' + (m.material as THREE.MeshBasicMaterial).color.getHexString(THREE.SRGBColorSpace));
    expect(colours.sort()).toEqual(['#c9a227', '#dc2626']);
  });
});

describe('HexLensLayer — zoom and picking', () => {
  it('badges hide far out and keep LENS_BADGE_PX on screen in their bands', () => {
    const { layer } = layerFor(buildTroubleLens);
    updateHexLensZoom(layer, 'continental', 3);
    expect(badges(layer.group).every(b => !b.visible)).toBe(true);
    for (const k of [6, 12]) {
      updateHexLensZoom(layer, 'regional', k);
      for (const b of badges(layer.group)) {
        expect(b.visible).toBe(true);
        expect(b.scale.x * k).toBeCloseTo(LENS_BADGE_PX);
      }
    }
  });

  it('the omen ring shows from continental in; at full-world only the dim carries the lens', () => {
    const { layer } = layerFor(buildTroubleLens);
    const ring = layer.group.children.find(c => c.userData.lensMark === 'omen' && c instanceof THREE.Line)!;
    updateHexLensZoom(layer, 'continental', 3);
    expect(ring.visible).toBe(true);
    updateHexLensZoom(layer, 'fullWorld', 1);
    expect(ring.visible).toBe(false);
  });

  it('no Trouble or Trade object is a pick target (D11)', () => {
    for (const build of [buildTroubleLens, buildTradeLens]) {
      const { layer } = layerFor(build);
      layer.group.updateMatrixWorld(true);
      const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 50), new THREE.Vector3(0, 0, -1));
      // World y is the pixel y negated (hexToWorld), so the fixture marks sit at negative y.
      let probed = 0;
      for (let x = 0; x < 120; x += 3) {
        for (let y = -90; y < 10; y += 3) {
          probed++;
          ray.set(new THREE.Vector3(x, y, 50), new THREE.Vector3(0, 0, -1));
          expect(ray.intersectObject(layer.group, true)).toEqual([]);
        }
      }
      expect(probed).toBeGreaterThan(0);
    }
  });
});
