/**
 * AgentSpriteMesh.bands.test.ts — markers keep one screen size per zoom band (THR-1899).
 *
 * A world unit is k CSS px (D3ZoomCamera: half-width = canvasWidth / 2 / k), so a
 * sprite's on-screen size is its world scale × k. At two zooms inside each band the
 * measured size must equal the MAP_MARKERS px for that band.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type * as THREE from 'three';
import type { AgentRenderData } from '../../agents/agentSpriteTypes';
import { MAP_MARKERS, type ZoomBand } from '../../../../data/map-markers';
import type { ZoomTier } from '../ZoomVisibilityMatrix';

vi.stubGlobal('document', {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }),
  }),
});

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three');
  class CanvasTextureMock { needsUpdate = false; isTexture = true; dispose() {} }
  return { ...actual, CanvasTexture: CanvasTextureMock };
});

let mod: typeof import('../AgentSpriteMesh');
beforeAll(async () => { mod = await import('../AgentSpriteMesh'); });

const TIER_OF: Record<ZoomBand, ZoomTier> = {
  fullWorld: 'full-world', continental: 'continental', regional: 'regional', heroLocal: 'hero-local',
};
/** Two zooms inside each band (ZOOM_TIER_THRESHOLDS: <1.5, 1.5–5, 5–15, ≥15). */
const KS: Record<ZoomBand, [number, number]> = {
  fullWorld: [0.8, 1.4], continental: [1.6, 4.5], regional: [5.5, 14], heroLocal: [15, 30],
};

function agents(): AgentRenderData[] {
  return [
    { id: 'plain', hexCol: 0, hexRow: 0, factionIndex: 1, isRetinue: false },
    { id: 'threaded', hexCol: 1, hexRow: 0, factionIndex: 2, isRetinue: true, isThreaded: true },
    { id: 'avatar', hexCol: 2, hexRow: 0, factionIndex: 0, isRetinue: false, isAvatar: true, avatarSphereColor: '#ff0000', avatarSigil: 'S' },
  ];
}

describe('agent markers are screen-fixed per band (MAP_MARKERS)', () => {
  for (const band of Object.keys(KS) as ZoomBand[]) {
    for (const k of KS[band]) {
      it(`${band} at k=${k}: world scale × k equals the list's px`, () => {
        const group = mod.createAgentSpriteMesh(agents());
        mod.updateZoomVisibility(group, TIER_OF[band], k);
        for (const [id, kind] of [['plain', 'agent'], ['threaded', 'threadedAgent'], ['avatar', 'avatar']] as const) {
          const entry = group.spriteMap.get(id)!;
          const sizes = MAP_MARKERS[kind].sizePx as Record<ZoomBand, number | null>;
          const px = sizes[band];
          if (px === null) {
            expect(entry.sprite.visible, `${kind} hidden at ${band}`).toBe(false);
          } else {
            expect(entry.sprite.visible).toBe(true);
            expect(entry.sprite.scale.x * k, `${kind} at ${band}, k=${k}`).toBeCloseTo(px, 6);
          }
        }
      });
    }
  }

  it('the retinue-dot branch is gone: no entry carries a continental material', () => {
    const group = mod.createAgentSpriteMesh(agents());
    for (const entry of group.spriteMap.values()) {
      expect(Object.keys(entry.materials).sort()).toEqual(['dot', 'pip', 'portrait']);
    }
  });

  // Budget 1 ms per zoom event (plan § Done when). Logged here; the assertion is a 10 ms regression
  // ceiling because wall time under the parallel test runner swings several-fold.
  it('the per-zoom-event resize for every agent stays inside its 1 ms budget (logged; ceiling 10 ms)', () => {
    // Medium maps draw the avatar plus a few dozen threaded mortals and groups;
    // 300 is several times that.
    const many: AgentRenderData[] = Array.from({ length: 300 }, (_, i) => ({
      id: `a${i}`, hexCol: i % 40, hexRow: Math.floor(i / 40), factionIndex: i % 6,
      isRetinue: i % 5 === 0, isThreaded: i % 3 === 0,
    }));
    const group = mod.createAgentSpriteMesh(many);
    // Warm up, then take the median of repeated resizes.
    for (let i = 0; i < 20; i++) mod.updateZoomVisibility(group, 'regional', 6 + i * 0.1);
    const samples: number[] = [];
    for (let i = 0; i < 40; i++) {
      const t0 = performance.now();
      mod.updateZoomVisibility(group, i % 2 ? 'regional' : 'hero-local', i % 2 ? 9 : 18);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    console.log(`[THR-1899] sprite resize, 300 agents: median ${median.toFixed(3)} ms`);
    expect(median).toBeLessThanOrEqual(10);
  });
});
