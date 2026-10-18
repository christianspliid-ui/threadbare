/**
 * HexLensLayer (THR-1878 plan § D3, D11).
 *
 * - The dim covers every land hex not lit, never water, in one instanced mesh.
 * - Marks draw through their MAP_MARKERS row's renderer; an agentStep mark asks the
 *   agent layer to draw that mortal one step up; an unknown kind draws the fallback.
 * - D11: no lens object is a pick target. Hex picking is screen-space math
 *   (`screenToHex`), so a click with a lens on lands on the same hex as with none, and
 *   a raycast through the lens group hits nothing.
 */
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { createHexLensLayer, HEX_LENS_LAYER_PREFIX, LENS_DIM_ALPHA } from '../HexLensLayer';
import { DOMINION_DIM_FOREIGN } from '../../../../data/dominion-ui-content';
import { screenToHex } from '../../interaction/HexRaycaster';
import { hexToWorld } from '../../../../lib/worldPosition';
import { HEX_CONSTANTS } from '../HexFillMesh';
import { buildThreadsLens } from '../../../../engine/views/lenses/threadsLens';
import { buildViewContext } from '../../../../engine/views/viewContext';
import { lensFixture } from '../../../../engine/views/lenses/__tests__/lensFixture';
import type { HexLensVM } from '../../../../engine/views/lenses/lensTypes';

function threadsLayer() {
  const { state, tiles } = lensFixture();
  const vm = buildThreadsLens(buildViewContext(null, state, tiles));
  const lensTiles = tiles.map(t => ({ col: t.coord.col, row: t.coord.row, isWater: t.terrain === 'ocean' }));
  return { vm, lensTiles, layer: createHexLensLayer(vm, lensTiles) };
}

describe('HexLensLayer', () => {
  it('names its group lens:<id> and dims every land hex not lit, at Dominion\'s Foreign alpha', () => {
    const { vm, lensTiles, layer } = threadsLayer();
    expect(layer.group.name).toBe(`${HEX_LENS_LAYER_PREFIX}threads`);
    const land = lensTiles.filter(t => !t.isWater).length;
    expect(layer.counts.dimmed).toBe(land - vm.lit.length);
    expect(LENS_DIM_ALPHA).toBe(DOMINION_DIM_FOREIGN);
    const dim = layer.group.children.find(c => c instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
    expect((dim.material as THREE.MeshBasicMaterial).opacity).toBe(DOMINION_DIM_FOREIGN);
    layer.dispose();
  });

  it('draws one arrow per heading and steps each threaded mortal up through the agent layer', () => {
    const { layer } = threadsLayer();
    expect(layer.counts.marks.destination).toBe(1);
    expect([...layer.agentStepIds].sort()).toEqual(['farwalker', 'maren', 'nameless', 'oswin']);
    expect(layer.markFallbacks).toEqual([]);
    layer.dispose();
  });

  it('an unknown mark kind draws the fallback badge and is reported (Law 58)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const vm: HexLensVM = {
      lensId: 'threads', lit: ['1,1'], hover: {}, legend: { head: 'Threads', lines: [] }, emptyLine: null,
      marks: [{ kind: 'mystery' as never, hexKey: '1,1', tone: 'first' }],
    };
    const layer = createHexLensLayer(vm, [{ col: 1, row: 1, isWater: false }]);
    expect(layer.markFallbacks).toEqual(['mystery']);
    expect(layer.counts.marks.mystery).toBe(1);
    warn.mockRestore();
    layer.dispose();
  });

  it('D11: no lens object is a pick target, and a click lands on the same hex with the lens on', () => {
    const { layer } = threadsLayer();
    const scene = new THREE.Scene();
    scene.add(layer.group);
    scene.updateMatrixWorld(true);

    const camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 1000);
    const centre = hexToWorld({ col: 4, row: 1 }, HEX_CONSTANTS.HEX_SIZE);
    camera.position.set(centre.x, centre.y, 100);
    camera.lookAt(centre.x, centre.y, 0);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    expect(raycaster.intersectObject(layer.group, true)).toEqual([]);

    // Hex picking is camera math only: the same screen point gives the same hex with or without the lens group.
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const withLens = screenToHex(400, 300, camera, canvas);
    scene.remove(layer.group);
    const withoutLens = screenToHex(400, 300, camera, canvas);
    expect(withLens).toEqual(withoutLens);
    expect(withLens).toEqual({ col: 4, row: 1 });
    layer.dispose();
  });
});
