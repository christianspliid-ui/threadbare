import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import type { HexCoord, HexTile } from '../../types';
import { hexToPixel } from '../../lib/hexMath';
import { createHexScene, resizeHexScene } from './scene/HexSceneSetup';
import { createHexFillMesh, HEX_CONSTANTS } from './scene/HexFillMesh';
import { createHexGridLines } from './scene/HexGridLines';
import { RENDER_ORDER } from './scene/RenderLayers';
import * as d3 from 'd3';
import { setupD3Zoom, syncCameraToZoom, CAMERA_CONSTANTS } from './camera/D3ZoomCamera';
import { animateCameraTo } from './camera/CameraAnimator';
import { screenToHex, worldToScreen, hexToWorldCenter, INTERACTION_CONSTANTS } from './interaction/HexRaycaster';
import { terrainDisplayName } from './palette/terrainPalette';
import { HexTooltip } from './interaction/HexTooltip';

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
   * Smoothly pan (and optionally zoom) the camera to a hex coordinate over 500ms.
   * Matches the HexMapHandle contract from Phase 8 drop-in swap.
   */
  centerOn: (x: number, y: number, scale?: number) => void;
}

// ─── Selected hex ring geometry ──────────────────────────────────────────────

/**
 * Builds a flat-top hex outline as a LineLoop.
 * Uses a RingGeometry approximation is too circular for hex; instead, manually
 * create a 6-vertex loop matching the hex shape.
 */
function createHexRingMesh(size: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(new THREE.Vector3(size * Math.cos(angle), size * Math.sin(angle), 0));
  }
  // Close the loop explicitly (LineLoop closes automatically, but push first again for clarity)
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xd4a040,       // --accent-gold per UI-SPEC
    linewidth: INTERACTION_CONSTANTS.SELECTED_RING_WIDTH,
    // Note: linewidth > 1 only works in WebGL1 with the ANGLE extension on some platforms.
    // The visual will degrade to 1px on unsupported hardware — this is acceptable for Phase 1.
    // Phase 7 can switch to a mesh-based outline if needed.
  });
  const ring = new THREE.LineLoop(geo, mat);
  ring.renderOrder = RENDER_ORDER.GRID + 1; // Above grid lines
  ring.visible = false;
  return ring;
}

/**
 * Builds a single-instance overlay mesh for hover highlight.
 * Positioned over the hovered hex each frame.
 */
function createHoverOverlayMesh(size: number): THREE.Mesh {
  const positions: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 180) * (60 * i);
    const a1 = (Math.PI / 180) * (60 * ((i + 1) % 6));
    positions.push(0, 0, 0);
    positions.push(size * Math.cos(a0), size * Math.sin(a0), 0);
    positions.push(size * Math.cos(a1), size * Math.sin(a1), 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: INTERACTION_CONSTANTS.HOVER_OVERLAY_OPACITY,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = RENDER_ORDER.GRID + 2; // Above grid lines and ring
  mesh.visible = false;
  return mesh;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Three.js hex map renderer — Phase 1, Plan 02: interactive camera + raycasting.
 *
 * Features:
 * - d3-zoom drives OrthographicCamera for pan/zoom/pinch (continuous, no tier snapping)
 * - Double-click zoom disabled
 * - centerOn() smoothly flies to target hex over 500ms
 * - Hover shows HTML tooltip (terrain name + coordinates)
 * - Click selects hex with gold ring outline
 * - Hovered hex shows subtle white overlay
 * - Frustum culling enabled on InstancedMesh (Three.js default)
 *
 * NFP #7 (Performance): Three.js handles per-instance frustum culling via GPU vertex shader.
 * At 60K hexes with an orthographic camera, the GPU efficiently discards off-screen vertices.
 * mesh.frustumCulled = true (default) applies bounding-sphere culling at the InstancedMesh level.
 * Per-instance culling is a Phase 7 concern if profiling reveals issues.
 */
const HexMapV2 = forwardRef<HexMapV2Handle, HexMapV2Props>(
  function HexMapV2(
    { tiles, seed = 42, selectedHex, onHexClick, onHexHover },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);

    // Camera and zoom refs — stable across renders
    const cameraRef   = useRef<THREE.OrthographicCamera | null>(null);
    const zoomRef     = useRef<import('d3').ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
    const destroyZoomRef = useRef<(() => void) | null>(null);
    const setZoomTargetRef   = useRef<((wx: number, wy: number) => void) | null>(null);
    const clearZoomTargetRef = useRef<(() => void) | null>(null);

    // Tooltip state (internal — not exposed to parent)
    const [tooltip, setTooltip] = useState<{
      coord: HexCoord;
      terrainKey: string;
      terrainName: string;
      screenX: number;
      screenY: number;
    } | null>(null);

    // Canvas dimensions for tooltip clamping
    const [canvasDimensions, setCanvasDimensions] = useState({ w: 800, h: 600 });

    // Build a fast tile lookup map: "col,row" -> HexTile
    const tileLookup = useRef<Map<string, HexTile>>(new Map());
    useEffect(() => {
      const map = new Map<string, HexTile>();
      for (const tile of tiles) {
        map.set(`${tile.coord.col},${tile.coord.row}`, tile);
      }
      tileLookup.current = map;
    }, [tiles]);

    // ── Imperative handle ─────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      centerOn(x: number, y: number, scale?: number) {
        const canvas = canvasRef.current;
        const zoom   = zoomRef.current;
        if (!canvas || !zoom) return;
        // x, y are already world-space coordinates (caller uses hexToPixel + Y-flip externally,
        // or passes hex coord which we convert here if needed).
        // For the HexMapHandle contract, x and y are world-space pixel coords.
        animateCameraTo(canvas, zoom, x, y, scale ?? CAMERA_CONSTANTS.DEFAULT_ZOOM);
      },
    }));

    // ── Three.js lifecycle ─────────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      const canvas    = canvasRef.current;
      if (!container || !canvas) return;
      if (tiles.length === 0) return;

      let hexScene: ReturnType<typeof createHexScene> | null = null;
      let rafId = 0;

      try {
        const { width, height } = container.getBoundingClientRect();
        const w = width  || 800;
        const h = height || 600;
        hexScene = createHexScene(canvas, w, h);
        const { renderer, scene, camera } = hexScene;

        cameraRef.current = camera;
        setCanvasDimensions({ w, h });

        // Build fill mesh — InstancedMesh with frustumCulled = true (Three.js default)
        // Three.js performs bounding-sphere culling on the whole InstancedMesh.
        // Individual instances that pass the bounding sphere are handled by the GPU.
        // frustumCulled = true is the correct setting for Phase 1 performance targets.
        const fillMesh = createHexFillMesh(tiles, seed);
        fillMesh.frustumCulled = true; // Explicit for readability — this is already the default
        scene.add(fillMesh);

        // Build grid lines
        const gridLines = createHexGridLines(tiles);
        scene.add(gridLines);

        // Selected hex ring (initially hidden)
        const selectionRing = createHexRingMesh(HEX_CONSTANTS.HEX_SIZE);
        scene.add(selectionRing);

        // Hover overlay mesh (initially hidden)
        const hoverOverlay = createHoverOverlayMesh(HEX_CONSTANTS.HEX_SIZE);
        scene.add(hoverOverlay);

        // Set up d3-zoom — attaches to canvas, drives OrthographicCamera
        const { zoom, setZoomTarget, clearZoomTarget, destroy } = setupD3Zoom(canvas, camera);
        zoomRef.current = zoom;
        destroyZoomRef.current = destroy;
        setZoomTargetRef.current = setZoomTarget;
        clearZoomTargetRef.current = clearZoomTarget;

        // Update selection ring when selectedHex prop changes
        // This runs inside the effect on mount; prop changes are handled separately below.
        const updateSelectionRing = (hex: HexCoord | null) => {
          if (hex) {
            const { x, y } = hexToPixel(hex, HEX_CONSTANTS.HEX_SIZE);
            selectionRing.position.set(x, -y, 0.1); // slight Z offset above fill mesh
            selectionRing.visible = true;
          } else {
            selectionRing.visible = false;
          }
        };

        // Store update function for prop-change effect
        (canvas as HTMLCanvasElement & { _updateSelectionRing?: (h: HexCoord | null) => void })
          ._updateSelectionRing = updateSelectionRing;

        updateSelectionRing(selectedHex);

        // Render loop
        function animate() {
          rafId = requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();

        // Resize observer
        const resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width: rw, height: rh } = entry.contentRect;
            if (rw > 0 && rh > 0 && hexScene) {
              resizeHexScene(hexScene, rw, rh);
              // Re-sync camera frustum from current d3-zoom transform
              // (resizeHexScene only updates renderer size, not camera)
              if (zoomRef.current && cameraRef.current) {
                const currentTransform = d3.zoomTransform(canvas);
                syncCameraToZoom(cameraRef.current, currentTransform, rw, rh);
              }
              setCanvasDimensions({ w: rw, h: rh });
            }
          }
        });
        resizeObserver.observe(container);

        // Cleanup
        return () => {
          cancelAnimationFrame(rafId);
          resizeObserver.disconnect();
          destroy();
          zoomRef.current = null;
          destroyZoomRef.current = null;
          setZoomTargetRef.current = null;
          clearZoomTargetRef.current = null;
          cameraRef.current = null;
          scene.clear();
          fillMesh.geometry.dispose();
          gridLines.geometry.dispose();
          selectionRing.geometry.dispose();
          hoverOverlay.geometry.dispose();
          hexScene?.dispose();
        };
      } catch (err) {
        console.error('[HexMapV2] Three.js initialization failed:', err);
        if (canvas) canvas.dataset.failed = 'true';
        return () => {
          if (hexScene) hexScene.dispose();
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tiles, seed]);

    // Update selection ring + zoom target when selectedHex prop changes
    useEffect(() => {
      const canvas = canvasRef.current as (HTMLCanvasElement & {
        _updateSelectionRing?: (h: HexCoord | null) => void;
      }) | null;
      canvas?._updateSelectionRing?.(selectedHex);

      // Set zoom target so scroll-zoom converges on the selected hex
      if (selectedHex) {
        const { x, y } = hexToPixel(selectedHex, HEX_CONSTANTS.HEX_SIZE);
        setZoomTargetRef.current?.(x, -y); // Y-flip to match world space
      } else {
        clearZoomTargetRef.current?.();
      }
    }, [selectedHex]);

    // ── Mouse event handlers ───────────────────────────────────────

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      const hex = screenToHex(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas);
      if (hex) {
        const worldPos = hexToWorldCenter(hex);
        const screen   = worldToScreen(worldPos, camera, canvas);

        const tile = tileLookup.current.get(`${hex.col},${hex.row}`);
        const terrainKey  = tile?.terrain ?? 'unknown';
        const terrainName = terrainDisplayName(terrainKey);

        setTooltip({
          coord: hex,
          terrainKey,
          terrainName,
          screenX: screen.x,
          screenY: screen.y,
        });
        onHexHover(hex);
      } else {
        setTooltip(null);
        onHexHover(null);
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      const hex = screenToHex(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas);
      if (hex) {
        onHexClick(hex);
      }
    };

    const handleMouseLeave = () => {
      setTooltip(null);
      onHexHover(null);
    };

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
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <HexTooltip
            terrainName={tooltip.terrainName}
            terrainKey={tooltip.terrainKey}
            coord={tooltip.coord}
            screenX={tooltip.screenX}
            screenY={tooltip.screenY}
            canvasWidth={canvasDimensions.w}
            canvasHeight={canvasDimensions.h}
          />
        )}
      </div>
    );
  },
);

export default HexMapV2;
