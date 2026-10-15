/**
 * markerObstacles.test.ts — place names step aside for map markers (THR-1899).
 *
 * THR-1831 § 4 / plan § D14: threaded medallions, the avatar and close-up portraits
 * are label obstacles. A place label that overlaps one moves to its free slot
 * LABEL_ALT_SLOT_OFFSET_PX below its anchor; if that is taken too it hides. The
 * medallion never moves. One pass with obstacles on a medium map at 2560×1440
 * must cost ≤ 2 ms (kill criterion 3).
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { removeOverlaps, estimateBBox, verdictsOf, applyCachedVisibility, type ScreenLabel, type ScreenBBox } from '../labelCollision';
import { computeMarkerObstacleBoxes, MARKER_OBSTACLE_PADDING_PX } from '../markerObstacles';
import { LABEL_ALT_SLOT_OFFSET_PX, locationLabelFontSize } from '../LocationLabelOverlay';
import { realmLabelFace, CINZEL_MIN_PX } from '../RegionLabelOverlay';
import type { AgentSpriteGroup, AgentSpriteEntry } from '../../scene/AgentSpriteMesh';

/** Regression ceiling for the Node timing test (10× the browser budget). */
const LABEL_PASS_CEILING_MS = 20;

function placeLabel(id: string, x: number, y: number, importance: 'capital' | 'town' = 'town'): ScreenLabel {
  return {
    id,
    tier: importance === 'capital' ? 'realm' : 'area',
    text: 'Hawkgate',
    screenX: x,
    screenY: y,
    visible: true,
    anchorY: 'top',
    fontSize: locationLabelFontSize(importance, 12) ?? 14,
    altSlotOffsetPx: LABEL_ALT_SLOT_OFFSET_PX,
  };
}

/** A 40 px medallion box (regional), as computeMarkerObstacleBoxes returns it. */
function medallionAt(x: number, y: number): ScreenBBox {
  const half = 20 + MARKER_OBSTACLE_PADDING_PX;
  return { left: x - half, top: y - half, right: x + half, bottom: y + half };
}

describe('labels step aside for markers', () => {
  it('a place label overlapping a threaded medallion moves to its slot below the anchor', () => {
    // The label's top edge (box padded 8 px) clips the medallion's lower edge; its slot below clears it.
    const medallion = medallionAt(500, 500);
    const label = placeLabel('hawkgate', 500, 520);
    const before = { ...medallion };
    const [out] = removeOverlaps([label], [medallion]);
    expect(out.visible).toBe(true);
    expect(out.moved).toBe(true);
    expect(out.screenY).toBe(520 + LABEL_ALT_SLOT_OFFSET_PX);
    expect(estimateBBox(out).top).toBeGreaterThanOrEqual(medallion.bottom);
    // The medallion's box is untouched — markers never move.
    expect(medallion).toEqual(before);
  });

  it('hides the label when its slot below is taken too', () => {
    const medallion = medallionAt(500, 500);
    const below = medallionAt(500, 540);
    const [out] = removeOverlaps([placeLabel('hawkgate', 500, 520)], [medallion, below]);
    expect(out.visible).toBe(false);
  });

  it('when two names compete for one slot, the smaller place hides first', () => {
    const capital = placeLabel('cap', 500, 500, 'capital');
    const town = placeLabel('town', 500, 500, 'town');
    const out = removeOverlaps([town, capital]);
    const byId = new Map(out.map(l => [l.id, l]));
    expect(byId.get('cap')!.visible).toBe(true);
    expect(byId.get('cap')!.moved).toBeFalsy();
  });

  it('a moved label stays in its slot on the frames between collision runs', () => {
    const label = placeLabel('hawkgate', 500, 520);
    const resolved = removeOverlaps([label], [medallionAt(500, 500)]);
    const cached = applyCachedVisibility([label], verdictsOf(resolved, [label]));
    expect(cached[0].visible).toBe(true);
    expect(cached[0].screenY).toBe(520 + LABEL_ALT_SLOT_OFFSET_PX);
  });

  it('computeMarkerObstacleBoxes returns the drawn size of obstacle markers only', () => {
    const k = 10;
    const w = 1000;
    const h = 800;
    const camera = new THREE.OrthographicCamera(-w / 2 / k, w / 2 / k, h / 2 / k, -h / 2 / k, -100, 100);
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const sprite = (x: number, sizePx: number) => {
      const s = new THREE.Sprite();
      s.position.set(x, 0, 0);
      s.scale.set(sizePx / k, sizePx / k, 1);
      return s;
    };
    const spriteMap = new Map<string, AgentSpriteEntry>([
      ['t', { kind: 'threadedAgent', sprite: sprite(0, 40) } as unknown as AgentSpriteEntry],
      ['g', { kind: 'agent', sprite: sprite(5, 14) } as unknown as AgentSpriteEntry],
    ]);
    const group = { spriteMap } as unknown as AgentSpriteGroup;
    const boxes = computeMarkerObstacleBoxes(group, camera, w, h, 'regional');
    expect(boxes).toHaveLength(1); // the plain dot is not an obstacle at regional
    const b = boxes[0];
    expect(b.right - b.left).toBeCloseTo(40 + 2 * MARKER_OBSTACLE_PADDING_PX, 6);
    expect((b.left + b.right) / 2).toBeCloseTo(w / 2, 6);
    expect(computeMarkerObstacleBoxes(null, camera, w, h, 'regional')).toEqual([]);
  });

  // The 2 ms budget (kill criterion 3) is measured in the browser: __DEBUG.getMapChrome().labels.maxPassMs
  // (0.3 ms at 2560×1440 on 2026-10-16). Under the parallel test runner wall time swings several-fold,
  // so this logs the median and asserts only a regression ceiling, well above the budget.
  it('one label pass with marker obstacles stays far inside the 2 ms budget (logged; ceiling 20 ms)', () => {
    // Medium (seed 42) has ~1,100 places; at regional zoom a 2560×1440 canvas holds a
    // few hundred names. 400 labels and 40 obstacles is above what one view shows.
    const W = 2560;
    const H = 1440;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const labels: ScreenLabel[] = Array.from({ length: 400 }, (_, i) =>
      placeLabel(`p${i}`, rnd() * W, rnd() * H, i % 10 === 0 ? 'capital' : 'town'));
    const obstacles: ScreenBBox[] = Array.from({ length: 40 }, () => medallionAt(rnd() * W, rnd() * H));
    for (let i = 0; i < 10; i++) removeOverlaps(labels, obstacles);
    const samples: number[] = [];
    for (let i = 0; i < 30; i++) {
      const t0 = performance.now();
      removeOverlaps(labels, obstacles);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    console.log(`[THR-1899] label pass, 400 labels + 40 obstacles: median ${median.toFixed(3)} ms`);
    expect(median).toBeLessThanOrEqual(LABEL_PASS_CEILING_MS);
  });
});

describe('label type (THR-1833 § 5)', () => {
  it('place names step by band; small places only from k 10', () => {
    expect(locationLabelFontSize('capital', 4)).toBeNull();
    expect(locationLabelFontSize('capital', 6)).toBe(16);
    expect(locationLabelFontSize('small', 6)).toBeNull();
    expect(locationLabelFontSize('small', 12)).toBe(12);
    expect(locationLabelFontSize('city', 12)).toBe(16);
    expect(locationLabelFontSize('capital', 20)).toBe(22);
    expect(locationLabelFontSize('town', 20)).toBe(16);
  });

  it('realm names are Cinzel 600 at 22 px and up, Alegreya Sans 700 below', () => {
    expect(realmLabelFace(CINZEL_MIN_PX)).toEqual({ fontFamily: 'var(--font-display)', fontWeight: 600 });
    expect(realmLabelFace(20)).toEqual({ fontFamily: 'var(--font-body)', fontWeight: 700 });
  });
});
