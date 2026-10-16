/**
 * placeIcons.coverage.test.ts — Law 58 coverage for the map's place icons (THR-1878 plan D13,
 * THR-1903).
 *
 * A place type's map icon is one entry in `LOCATION_ICON_REGISTRY` (its size class) plus its
 * shape in `PLACE_ICON` (THR-1879). This test names a type that is missing either, pins the
 * eleven shapes Christian chose (THR-1834 call 2b), and checks the one texture builder draws a
 * carved 512-grid shape and a 100-grid drawing into the same box.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { LOCATION_ICON_REGISTRY, LOCATION_SIZE_SCALE, resolvePlaceIconDef } from '../locationIconRegistry';
import {
  buildLocationIconTexture,
  buildMapIconTexture,
  CLEARED_LAIR_FILL_COLOR,
  getPlaceIconStatus,
  LAIR_SPHERE_FILL_COLORS,
  LOCATION_FILL_COLOR,
  LOCATION_OUTLINE_WIDTH_FRACTION,
  LOCATION_TEXTURE_SIZE,
  MAP_ICON_INK,
  mapIconTransform,
  placeIconShape,
  resetPlaceIconFallbacksForTest,
} from '../locationIconTextures';
import { PLACE_ICON } from '../../../../data/icons/conceptIcons';
import { ICON_REGISTRY, type IconShape } from '../../../../data/icons/iconRegistry';
import { iconShape } from '../../../shared/iconShape';

// ── A recording canvas: what the builder drew, without a real 2D context ──────

interface Recorded {
  scale: [number, number][];
  lineWidth: number[];
  fills: { style: string; d: string }[];
  strokes: { style: string; d: string }[];
}
let recorded: Recorded;

class Path2DStub {
  constructor(public d = '') {}
}

beforeEach(() => {
  recorded = { scale: [], lineWidth: [], fills: [], strokes: [] };
  vi.stubGlobal('Path2D', Path2DStub);
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag !== 'canvas') return null;
      const ctx = {
        fillStyle: '',
        strokeStyle: '',
        lineJoin: '',
        globalAlpha: 1,
        set lineWidth(w: number) { recorded.lineWidth.push(w); },
        save: () => {},
        restore: () => {},
        scale: (x: number, y: number) => { recorded.scale.push([x, y]); },
        fill: (p: Path2DStub) => { recorded.fills.push({ style: ctx.fillStyle, d: p.d }); },
        stroke: (p: Path2DStub) => { recorded.strokes.push({ style: ctx.strokeStyle, d: p.d }); },
      };
      return { width: 0, height: 0, getContext: () => ctx };
    },
  });
  resetPlaceIconFallbacksForTest();
});

const PLACE_TYPES = Object.keys(LOCATION_ICON_REGISTRY);

/** Christian's eleven named shapes (THR-1834 call 2b; THR-1903 description). */
const NAMED_SHAPES: Record<string, string> = {
  capital: 'tower-flag',
  city: 'medieval-gate',
  town: 'village',
  hamlet: 'wood-cabin',
  castle: 'white-tower',
  temple: 'greek-temple',
  shrine: 'fire-shrine',
  ruins: 'ancient-ruins',
  mining: 'mine-wagon',
  camp: 'camping-tent',
  lair: 'cave-entrance',
};

describe('place icons — every LocationType (Law 58)', () => {
  it('every place type has a size class', () => {
    for (const type of PLACE_TYPES) {
      const { def, known } = resolvePlaceIconDef(type);
      expect(known, `${type} has no LOCATION_ICON_REGISTRY entry`).toBe(true);
      expect(LOCATION_SIZE_SCALE[def.sizeClass], `${type} size class "${def.sizeClass}"`).toBeGreaterThan(0);
    }
  });

  it('every place type resolves through PLACE_ICON and iconShape to a drawn shape, not fallback', () => {
    const fallback = iconShape('fallback');
    for (const type of PLACE_TYPES) {
      expect(type in PLACE_ICON, `${type} has no PLACE_ICON row (src/data/icons/conceptIcons.ts)`).toBe(true);
      const shape = placeIconShape(type);
      expect(shape, `${type} draws the fallback mark`).not.toBe(fallback);
      expect(shape.paths.length, `${type} shape has no paths`).toBeGreaterThan(0);
    }
    expect(getPlaceIconStatus().fallbacks).toEqual([]);
  });

  it("the eleven named types draw exactly Christian's carved shapes", () => {
    for (const [type, slug] of Object.entries(NAMED_SHAPES)) {
      const entry = ICON_REGISTRY[PLACE_ICON[type as keyof typeof PLACE_ICON]];
      expect(entry.source, `${type}`).toMatchObject({ family: 'game-icons', slug });
      expect(placeIconShape(type), `${type}`).toBe(entry.shape);
    }
  });

  it('the registry carries no hand-drawn paths any more', () => {
    for (const [type, def] of Object.entries(LOCATION_ICON_REGISTRY)) {
      expect(Object.keys(def), `${type}`).toEqual(['sizeClass']);
    }
  });

  it('an unknown place type draws the fallback shape at small and is reported once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(placeIconShape('not_a_place')).toBe(iconShape('fallback'));
    placeIconShape('not_a_place');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(getPlaceIconStatus().fallbacks).toEqual(['not_a_place']);
    expect(resolvePlaceIconDef('not_a_place')).toEqual({ def: { sizeClass: 'small' }, known: false });
    warn.mockRestore();
  });
});

describe('buildMapIconTexture — the one map icon texture path (D13)', () => {
  const carved512: IconShape = { viewBox: '0 0 512 512', paths: [{ d: 'M0 0H512V512H0Z' }] };
  const drawing100: IconShape = { viewBox: '0 0 100 100', paths: [{ d: 'M0 0H100V100H0Z' }] };

  it('textures are 256 px', () => {
    expect(LOCATION_TEXTURE_SIZE).toBe(256);
    expect(MAP_ICON_INK.size).toBe(256);
  });

  it('a 512-grid shape and a 100-grid shape fill the same pixel bounds at the same size', () => {
    for (const shape of [carved512, drawing100]) {
      const t = mapIconTransform(shape.viewBox, LOCATION_TEXTURE_SIZE, LOCATION_OUTLINE_WIDTH_FRACTION);
      expect(t.vbW * t.scaleX).toBe(LOCATION_TEXTURE_SIZE);
      expect(t.vbH * t.scaleY).toBe(LOCATION_TEXTURE_SIZE);
      // The outline is the same on screen: 0.025 of the texture whatever the grid
      expect(t.outlineWidth * t.scaleX).toBeCloseTo(LOCATION_TEXTURE_SIZE * LOCATION_OUTLINE_WIDTH_FRACTION);
    }
    buildMapIconTexture(carved512);
    buildMapIconTexture(drawing100);
    expect(recorded.scale).toEqual([[0.5, 0.5], [2.56, 2.56]]);
    expect(recorded.lineWidth).toEqual([12.8, 2.5]);
  });

  it('strokes the outline under the fill, in the map ink', () => {
    const tex = buildMapIconTexture(carved512);
    expect(tex).toBeInstanceOf(THREE.CanvasTexture);
    expect(recorded.strokes).toEqual([{ style: '#0a0a0a', d: carved512.paths[0].d }]);
    expect(recorded.fills).toEqual([{ style: LOCATION_FILL_COLOR, d: carved512.paths[0].d }]);
  });

  it('a malformed viewBox falls back to the 100 grid (NFP #4)', () => {
    const t = mapIconTransform('nonsense', 256, LOCATION_OUTLINE_WIDTH_FRACTION);
    expect(t.vbW).toBe(100);
    expect(t.scaleX).toBe(2.56);
  });
});

describe('lair tints carry over unchanged', () => {
  it('the tint table and cleared-lair fill are the pre-THR-1903 values', () => {
    expect(LAIR_SPHERE_FILL_COLORS).toEqual({
      force: '#5c1010',
      matter: '#3d2f1f',
      energy: '#5c4e00',
      life: '#004d1f',
      mind: '#0d3366',
      spirit: '#3d1a52',
      time: '#5c3800',
      entropy: '#1f3330',
    });
    expect(CLEARED_LAIR_FILL_COLOR).toBe('#2a2520');
  });

  it('a tinted lair fills its carved cave entrance with the tint', () => {
    buildLocationIconTexture('lair', undefined, LAIR_SPHERE_FILL_COLORS.mind);
    expect(recorded.fills).toHaveLength(1);
    expect(recorded.fills[0].style).toBe('#0d3366');
    expect(recorded.fills[0].d).toBe(placeIconShape('lair').paths[0].d);
  });
});
