import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { HexCoord, HexTile } from '../../types';
import { createHexScene, resizeHexScene } from './scene/HexSceneSetup';
import { createHexFillMesh } from './scene/HexFillMesh';
import { createHexGridLines } from './scene/HexGridLines';

// ─── Props & Handle ───────────────────────────────────────────────────────────

export interface HexMapV2Props {
  tiles: HexTile[];
  cols: number;
  rows: number;
  seed?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}

export interface HexMapV2Handle {
  /**
   * Smoothly pan the camera to a world-space position.
   * Full implementation lives in Plan 02 (camera controls).
   * Stub here to satisfy the HexMapHandle contract from Phase 8 drop-in swap.
   */
  centerOn: (x: number, y: number, scale?: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Three.js hex map renderer — Phase 1 foundation.
 *
 * Renders 60K hexes via a single InstancedMesh draw call with:
 * - Tait-derived terrain/water palette colors
 * - Per-hex seeded brightness noise (±5%)
 * - Thin grid lines at ~12% opacity
 *
 * Camera controls (pan/zoom/centerOn) are implemented in Plan 02.
 */
const HexMapV2 = forwardRef<HexMapV2Handle, HexMapV2Props>(
  function HexMapV2(
    { tiles, seed = 42 },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);

    // ── Imperative handle (stub for Phase 1 — camera in Plan 02) ──
    useImperativeHandle(ref, () => ({
      centerOn: (_x: number, _y: number, _scale?: number) => {
        // Phase 2: will animate the OrthographicCamera to (x, y)
      },
    }));

    // ── Three.js lifecycle ─────────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      const canvas    = canvasRef.current;
      if (!container || !canvas) return;

      // Early-exit with a handled error if tiles are missing
      if (tiles.length === 0) return;

      let hexScene: ReturnType<typeof createHexScene> | null = null;
      let rafId = 0;

      try {
        const { width, height } = container.getBoundingClientRect();
        hexScene = createHexScene(canvas, width || 800, height || 600);
        const { renderer, scene, camera } = hexScene;

        // Build fill mesh (single draw call for all hexes)
        const fillMesh = createHexFillMesh(tiles, seed);
        scene.add(fillMesh);

        // Build grid lines
        const gridLines = createHexGridLines(tiles);
        scene.add(gridLines);

        // Render loop
        function animate() {
          rafId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();

        // Resize observer: keep renderer and camera in sync with container
        const resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width: w, height: h } = entry.contentRect;
            if (w > 0 && h > 0 && hexScene) {
              resizeHexScene(hexScene, w, h);
            }
          }
        });
        resizeObserver.observe(container);

        // Cleanup
        return () => {
          cancelAnimationFrame(rafId);
          resizeObserver.disconnect();
          scene.clear();
          fillMesh.geometry.dispose();
          gridLines.geometry.dispose();
          hexScene?.dispose();
        };
      } catch (err) {
        // Fail-soft: log the error, let the error-state div render (NFP #4)
        console.error('[HexMapV2] Three.js initialization failed:', err);
        // Mark canvas as failed so the error overlay can show
        if (canvas) canvas.dataset.failed = 'true';
        return () => {
          if (hexScene) hexScene.dispose();
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tiles, seed]);

    // ── Empty state ───────────────────────────────────────────────
    if (tiles.length === 0) {
      return (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width:    '100%',
            height:   '100%',
            overflow: 'hidden',
            display:  'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            className="animate-breathe"
            style={{
              fontStyle: 'italic',
              color:     'var(--text-tertiary)',
              fontSize:  'var(--text-xs)',
            }}
          >
            The world has not yet been shaped.
          </p>
        </div>
      );
    }

    // ── Normal render ─────────────────────────────────────────────
    return (
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width:    '100%',
          height:   '100%',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    );
  },
);

export default HexMapV2;
