import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import type { HexCoord, HexTile } from '../../types';
import type { RiverPath } from '../../engine/worldGenData';
import type { RegionData } from '../../engine/regionTypes';
import { hexToPixel } from '../../lib/hexMath';
import { createHexScene, resizeHexScene } from './scene/HexSceneSetup';
import { createHexFillMesh, HEX_CONSTANTS } from './scene/HexFillMesh';
import { createHexGridLines } from './scene/HexGridLines';
import { createCoastlineMesh } from './scene/CoastlineMesh';
import { createRiverMesh } from './scene/RiverMesh';
import { createElevationTicks } from './scene/ElevationTicks';
import { createBorderMesh } from './scene/BorderMesh';
import { createCapitalMarkers } from './scene/CapitalMarkers';
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
  /** River paths from worldgen — stored in ref for use by river rendering (Plan 03-02+) */
  riverPaths?: RiverPath[];
  /** Lake hex IDs from worldgen — stored in ref for use by lake coloring (Plan 03-01+) */
  lakeIds?: Int16Array;
  /** Region data from worldgen — baronies, kingdoms, borders, and capital markers (Plan 04-02+) */
  regionData?: RegionData;
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
    { tiles, cols, rows, seed = 42, selectedHex, onHexClick, onHexHover, riverPaths, lakeIds, regionData },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef    = useRef<HTMLCanvasElement>(null);

    // Worldgen data refs — available for scene setup (Plan 03-02+ will use these for river/lake rendering)
    const riverPathsRef = useRef<RiverPath[]>(riverPaths ?? []);
    const lakeIdsRef    = useRef<Int16Array>(lakeIds ?? new Int16Array(0));

    // Keep refs in sync with latest props (stable reference, no re-render needed)
    riverPathsRef.current = riverPaths ?? [];
    lakeIdsRef.current    = lakeIds ?? new Int16Array(0);

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
      geoParams?: import('../../types').GeoParams;
      hasRiver?: boolean;
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
        // Pass lakeIds so lake hexes render with lake water color (Plan 03-01).
        const fillMesh = createHexFillMesh(tiles, seed, lakeIdsRef.current.length > 0 ? lakeIdsRef.current : undefined);
        fillMesh.frustumCulled = true; // Explicit for readability — this is already the default
        scene.add(fillMesh);

        // Build grid lines
        const gridLines = createHexGridLines(tiles);
        scene.add(gridLines);

        // Build coastline overlay — organic shoreline from marching squares contours (Plan 03-01)
        // Renders above hex fill (renderOrder = COASTLINE = 1), below grid lines (renderOrder = GRID = 2)
        const coastlineMesh = createCoastlineMesh(tiles, cols, rows, seed);
        scene.add(coastlineMesh);

        // Build elevation tick marks — caterpillar-style marks on steep hex edges (Plan 03-03)
        // Renders at RENDER_ORDER.ELEVATION_TICKS (3), above grid lines, below rivers
        const elevTicks = createElevationTicks(tiles);
        scene.add(elevTicks);

        // Build river overlay — curved blue quad strips above terrain (Plan 03-02)
        // Renders at RENDER_ORDER.RIVERS (4), above grid lines, overlaying terrain without changing hex color
        let riverMesh: THREE.Group | null = null;
        if (riverPathsRef.current.length > 0) {
          riverMesh = createRiverMesh(riverPathsRef.current, tiles, seed);
          scene.add(riverMesh);
        }

        // Build political border polylines — red quad-strip borders for kingdoms and baronies (Plan 04-02)
        // Renders at RENDER_ORDER.BORDERS (6), above rivers and elevation ticks.
        // Geographic-only differences produce no geometry (REGN-06).
        let borderKingdomMesh: THREE.Mesh | null = null;
        let borderBaronyMesh: THREE.Mesh | null = null;
        let capitalMarkers: THREE.Group | null = null;
        if (regionData && (regionData.baronies.length > 0 || regionData.hexBaronyId.size > 0)) {
          const borders = createBorderMesh(regionData, tiles, cols);
          borderKingdomMesh = borders.kingdomMesh;
          borderBaronyMesh = borders.baronyMesh;
          scene.add(borderKingdomMesh);
          scene.add(borderBaronyMesh);

          capitalMarkers = createCapitalMarkers(regionData);
          scene.add(capitalMarkers);
        }

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
          // Dispose coastline mesh children geometries and materials
          for (const child of coastlineMesh.children) {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                for (const mat of child.material) mat.dispose();
              } else {
                child.material.dispose();
              }
            }
          }
          // Dispose elevation tick geometry and material
          elevTicks.geometry.dispose();
          if (Array.isArray(elevTicks.material)) {
            for (const mat of elevTicks.material) mat.dispose();
          } else {
            (elevTicks.material as THREE.Material).dispose();
          }
          // Dispose river mesh children geometries and materials
          if (riverMesh) {
            for (const child of riverMesh.children) {
              if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                  for (const mat of child.material) mat.dispose();
                } else {
                  child.material.dispose();
                }
              }
            }
          }
          // Dispose border meshes
          if (borderKingdomMesh) {
            borderKingdomMesh.geometry.dispose();
            (borderKingdomMesh.material as THREE.Material).dispose();
          }
          if (borderBaronyMesh) {
            borderBaronyMesh.geometry.dispose();
            (borderBaronyMesh.material as THREE.Material).dispose();
          }
          // Dispose capital markers
          if (capitalMarkers) {
            for (const child of capitalMarkers.children) {
              if (child instanceof THREE.Points) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
              }
            }
          }
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
    }, [tiles, cols, rows, seed, riverPaths, regionData]);

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
          geoParams: tile?.geoParams,
          hasRiver: tile?.hasRiver,
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
            geoParams={tooltip.geoParams}
            hasRiver={tooltip.hasRiver}
          />
        )}
      </div>
    );
  },
);

export default HexMapV2;
