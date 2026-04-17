import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import type { HexCoord, HexTile } from '../../types';
import type { RiverPath } from '../../engine/worldGenData';
import type { RegionData } from '../../engine/regionTypes';
import type { VisibilityMap } from '../../types/visibility';
import { hexKey } from '../../lib/hexKey';
import { hexToWorld, worldToHex } from '../../lib/worldPosition';
import { AMBIENT_CONTEXT_DEBOUNCE_MS } from '../../audio/audioConstants';
import { createHexScene, resizeHexScene } from './scene/HexSceneSetup';
import { createHexFillMesh, HEX_CONSTANTS } from './scene/HexFillMesh';
import type { HexFillMeshResult } from './scene/HexFillMesh';
import { createHexGridLines } from './scene/HexGridLines';
import { createCoastlineMesh } from './scene/CoastlineMesh';
import { createRiverMesh } from './scene/RiverMesh';
import { createElevationTicks } from './scene/ElevationTicks';
import { createBorderMesh } from './scene/BorderMesh';
import { createGeoBorderMesh } from './scene/GeoBorderMesh';
import { createCapitalMarkers } from './scene/CapitalMarkers';
import { createSignifierMesh } from './scene/SignifierMesh';
import { createLocationIconMesh, LOCATION_ICON_THRESHOLD } from './scene/LocationIconMesh';
import { createSettlementModelMesh, disposeSettlementModelMesh } from './scene/SettlementModelMesh';
import type { LocationNode } from './scene/LocationIconMesh';
import { createAgentSpriteMesh, loadAgentPortraits, tickAvatarPulse } from './scene/AgentSpriteMesh';
import type { AgentSpriteGroup } from './scene/AgentSpriteMesh';
import type { AgentRenderData } from './agents/agentSpriteTypes';
import { createArmyLayer, preloadCoatOfArmsTextures, ARMY_TEXTURE_SIZE } from './scene/ArmyLayer';
import type { ArmyLayerGroup } from './scene/ArmyLayer';
import type { ArmyRenderData } from './scene/ArmySpriteMesh';
import { createBattleIndicatorLayer, tickBattleIndicators } from './scene/BattleIndicatorLayer';
import type { BattleIndicatorLayerGroup } from './scene/BattleIndicatorLayer';
import type { BattleIndicatorData } from './scene/BattleIndicatorLayer';
import { createThreadLineMesh } from './scene/ThreadLineMesh';
import type { ThreadLineData, ThreadLineLayer, TugData } from './scene/ThreadLineMesh';
import { createActivityIconLayer } from './scene/ActivityIconMesh';
import type { ActivityIconData, ActivityIconLayer } from './scene/ActivityIconMesh';
import { createStrategicMarkerLayer } from './scene/StrategicMarkerMesh';
import type { StrategicMarkerLayer } from './scene/StrategicMarkerMesh';
import type { HexStrategicOverlay } from '../../engine/strategicPresentation';
import { ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD } from '../../data/attention-constants';
import { createAnomalyShimmerLayer, tickAnomalyShimmers, triggerAnomalyRevealFlash } from './scene/AnomalyShimmerMesh';
import type { AnomalyShimmerLayerGroup } from './scene/AnomalyShimmerMesh';
import { tickAgentAnimations } from './agents/agentAnimationState';
import type { AgentAnimState } from './agents/agentAnimationState';
import { createMovementTrailMesh, updateTrails } from './scene/MovementTrailMesh';
import { spawnParticleBurst, tickParticleBursts } from './scene/ParticleBurstMesh';
import type { ActiveBurst } from './scene/ParticleBurstMesh';
import { useAgentAnimations } from './hooks/useAgentAnimations';
import type { AgentPrevPosition } from './hooks/useAgentAnimations';
import { useFogCulling } from './hooks/useFogCulling';
import { createFogOverlayMesh, updateFogOverlayTexture, setFogOverlayAlpha, flushFogOverlay } from './scene/FogOverlayMesh';
import type { FogOverlayResult } from './scene/FogOverlayMesh';
import { useZoomLayerVisibility } from './hooks/useZoomLayerVisibility';
import { RENDER_ORDER } from './scene/RenderLayers';
import * as d3 from 'd3';
import { setupD3Zoom, syncCameraToZoom, CAMERA_CONSTANTS } from './camera/D3ZoomCamera';
import { animateCameraTo } from './camera/CameraAnimator';
import { createRoadMesh } from './scene/RoadMesh';
import {
  getZoomTier,
  ZOOM_TIER_THRESHOLDS,
} from './scene/ZoomVisibilityMatrix';
import type { ZoomTier } from './scene/ZoomVisibilityMatrix';
import {
  buildOriginalColorCache,
} from './scene/FogCulling';
import { PARCHMENT_FOG_CONSTANTS } from './scene/fogShader';
import { createFollowMode, updateFollowTarget } from './camera/FollowMode';
import { WebGLDiagnostics } from './diagnostics/WebGLDiagnostics';
import type { WebGLDiagnosticsSnapshot } from './diagnostics/WebGLDiagnostics';
import type { FollowModeState } from './camera/FollowMode';
import { screenToHex, worldToScreen, pickAgentAtScreen, pickArmyAtScreen, INTERACTION_CONSTANTS } from './interaction/HexRaycaster';
import { RegionLabelOverlay } from './overlay/RegionLabelOverlay';
import { LocationLabelOverlay, type LocationLabelData } from './overlay/LocationLabelOverlay';
import type { ScreenBBox } from './overlay/labelCollision';
import { HexTooltip } from './interaction/HexTooltip';
import type { LocationActivitySummary } from '../../types/locationActivity';
import { LOCATION_IMPORTANCE_MAP, LOCATION_ICON_REGISTRY, CENTERED_SIZE_CLASSES } from './locations/locationIconRegistry';
import { getFixedSlotOffset } from '../../lib/movementPath';
import {
  SLOT_RING_RADIUS,
  VERTEX_ANGLES_DEG,
} from '../../data/agent-visual-content';
import { generateRegionLabels, generateRiverLabels } from '../../engine/regionLabels';

// ─── Location offset for trail endpoints ──────────────────────────────────────

/**
 * Builds a lookup from hex key ("col,row") to the world-space offset (dx, dy)
 * of the primary (most important) location in that hex.
 *
 * Trail endpoints use this so lines converge on the location icon
 * instead of the raw hex center.
 *
 * Uses the same centering/ring logic as LocationIconMesh:
 *  - full/medium size → offset (0, 0)
 *  - small/tiny → first ring slot
 *
 * NFP #4: Returns empty map if locations is undefined.
 */
function buildLocationOffsetLookup(
  locations: LocationNode[] | undefined,
): Map<string, { dx: number; dy: number }> {
  const lookup = new Map<string, { dx: number; dy: number }>();
  if (!locations || locations.length === 0) return lookup;

  // Group by hex, picking the most important location per hex
  const best = new Map<string, LocationNode>();
  for (const loc of locations) {
    const key = hexKey(loc.hexCol, loc.hexRow);
    const existing = best.get(key);
    if (!existing) {
      best.set(key, loc);
      continue;
    }
    // Prefer centered (larger) locations — they're more visually prominent
    const existingDef = LOCATION_ICON_REGISTRY[existing.locationType as keyof typeof LOCATION_ICON_REGISTRY];
    const locDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
    if (locDef && (!existingDef || CENTERED_SIZE_CLASSES.has(locDef.sizeClass))) {
      best.set(key, loc);
    }
  }

  for (const [key, loc] of best) {
    const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
    if (!iconDef) continue;

    if (CENTERED_SIZE_CLASSES.has(iconDef.sizeClass)) {
      // Large location — centered on hex, no offset
      lookup.set(key, { dx: 0, dy: 0 });
    } else {
      // Small location — first ring slot position
      const offset = getFixedSlotOffset(0, 1, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);
      // Y-flip: ring offset Y matches LocationIconMesh convention
      lookup.set(key, { dx: offset.x, dy: -offset.y });
    }
  }

  return lookup;
}

// ─── Destination marker (ascendant move order target) ────────────────────────

const DESTINATION_MARKER_CONSTANTS = {
  /** Pulse speed in radians per second */
  PULSE_SPEED: 2.8,
  /** Minimum opacity during pulse */
  PULSE_MIN: 0.3,
  /** Maximum opacity during pulse */
  PULSE_MAX: 1.0,
  /** Arm reach as a fraction of HEX_SIZE — controls cross + ring sizing */
  ARM_RATIO: 0.40,
  /** Thick stroke width as a fraction of arm length (calligraphy downstroke) */
  THICK_WIDTH_RATIO: 0.50,
  /** Thin stroke width as a fraction of arm length (calligraphy upstroke) */
  THIN_WIDTH_RATIO: 0.14,
  /** Ring color — white to contrast with the gold selection ring */
  RING_COLOR: 0xffffff,
  /** Cross color — black ink, calligraphy style */
  CROSS_COLOR: 0x000000,
} as const;

/**
 * Diamond-shaped (lozenge) mesh — sharp tips, widest in the middle.
 * Used for calligraphy strokes: thick for the downstroke, thin for the upstroke.
 */
function createLozengeMesh(length: number, width: number, color: number): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    0,          length / 2, 0,   // top tip
   -width / 2,  0,          0,   // left widest
    width / 2,  0,          0,   // right widest
    0,         -length / 2, 0,   // bottom tip
  ], 3));
  geo.setIndex([0, 1, 2,  1, 3, 2]);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: DESTINATION_MARKER_CONSTANTS.PULSE_MAX,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  }));
}

/**
 * Builds the destination marker for the ascendant's move order target:
 * white hex outline ring + black calligraphy X (thick downstroke, thin upstroke).
 * The whole group pulses in opacity each frame.
 */
function createDestinationMarkerGroup(size: number): THREE.Group {
  const group = new THREE.Group();
  const arm = size * DESTINATION_MARKER_CONSTANTS.ARM_RATIO;

  // White hex outline ring
  const ringPoints: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    ringPoints.push(new THREE.Vector3(size * Math.cos(angle), size * Math.sin(angle), 0));
  }
  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(ringPoints),
    new THREE.LineBasicMaterial({
      color: DESTINATION_MARKER_CONSTANTS.RING_COLOR,
      transparent: true,
      opacity: DESTINATION_MARKER_CONSTANTS.PULSE_MAX,
    }),
  );
  ring.renderOrder = RENDER_ORDER.GRID + 1;
  group.add(ring);

  // Thick calligraphy stroke — the \ diagonal (downstroke, broadest face of the pen)
  const thick = createLozengeMesh(
    arm * 1.85,
    arm * DESTINATION_MARKER_CONSTANTS.THICK_WIDTH_RATIO,
    DESTINATION_MARKER_CONSTANTS.CROSS_COLOR,
  );
  thick.rotation.z = Math.PI / 4;   // 45° → \ diagonal in y-up space
  thick.renderOrder = RENDER_ORDER.GRID + 1;
  group.add(thick);

  // Thin calligraphy stroke — the / diagonal (upstroke, narrow edge of the pen)
  const thin = createLozengeMesh(
    arm * 1.85,
    arm * DESTINATION_MARKER_CONSTANTS.THIN_WIDTH_RATIO,
    DESTINATION_MARKER_CONSTANTS.CROSS_COLOR,
  );
  thin.rotation.z = -Math.PI / 4;  // -45° → / diagonal in y-up space
  thin.renderOrder = RENDER_ORDER.GRID + 1;
  group.add(thin);

  group.visible = false;
  return group;
}

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
  onAgentClick?: (agentId: string) => void;
  onArmyClick?: (armyId: string) => void;
  /** River paths from worldgen — stored in ref for use by river rendering (Plan 03-02+) */
  riverPaths?: RiverPath[];
  /** Lake hex IDs from worldgen — stored in ref for use by lake coloring (Plan 03-01+) */
  lakeIds?: Int16Array;
  /** Region data from worldgen — baronies, kingdoms, borders, and capital markers (Plan 04-02+) */
  regionData?: RegionData;
  /** Location nodes to render as icons and labels (Plan 06-01+) */
  locations?: LocationNode[];
  /** Anomaly shimmer/halo data — all anomalies including undiscovered */
  anomalies?: import('./scene/AnomalyShimmerMesh').AnomalyShimmerData[];
  /** Pre-computed road paths from world graph for rendering */
  roadPaths?: import('./scene/RoadMesh').RoadPath[];
  /** Agent render data for Three.js sprite rendering (Plan 06-04+) */
  agents?: AgentRenderData[];
  /** Army render data for army indicator sprites (Plan 12-07+) */
  armies?: ArmyRenderData[];
  /** Battle/siege indicator data for combat overlays (Plan 12-07+) */
  battles?: BattleIndicatorData[];
  /** Thread line data — avatar-to-agent relationship lines (Attention UI) */
  threadLines?: ThreadLineData[];
  /** Activity icon data — reach micro-icons for active encounters (Attention UI) */
  activityIcons?: ActivityIconData[];
  /** Strategic hex overlays — project dots and control pips per hex. */
  strategicOverlays?: Map<string, HexStrategicOverlay>;
  /** Rich tug data keyed by agent ID — drives reach-coloured vibration animation. */
  activeTugs?: Map<string, TugData>;
  /**
   * Attention pool fill ratio 0.0-1.0 (pool / capacity).
   * Scales thread line opacity: depleted pool = dimmer lines.
   * Defaults to 1.0 (fully focused) when not provided.
   */
  attentionRatio?: number;
  /** Fog-of-war visibility map — keyed by "col,row". undefined = fog disabled (Plan 07-03+) */
  visibilityMap?: VisibilityMap;
  /** Whether the fog-of-war system is active. Default false. (Plan 07-03+) */
  fogEnabled?: boolean;
  /** Whether to render the organic shore (coastline) mesh. Default true. */
  showOrganicShore?: boolean;
  /** When true, suppresses label overlays (region/location). Use when a full-screen overlay covers the map. */
  overlayOpen?: boolean;
  /** CSS color string for the selected-hex tinted overlay (ascendant sphere color). Falls back to accent gold. */
  selectionColor?: string;
  /** Target hex for the ascendant's active move order. Shows a pulsing X destination marker. */
  moveDestinationHex?: HexCoord | null;
  /** Called (debounced) when the camera center hex changes — used by ambient audio context. */
  onCameraCenterHex?: (hex: HexCoord) => void;
  /** Location activity summaries keyed by locationId — drives murmur tooltips (THR-22). */
  locationActivityMap?: Map<string, LocationActivitySummary>;
}

export interface HexMapV2Handle {
  /**
   * Smoothly pan (and optionally zoom) the camera to a hex coordinate over 500ms.
   * Matches the HexMapHandle contract from Phase 8 drop-in swap.
   */
  centerOn: (x: number, y: number, scale?: number) => void;
  /**
   * Enable or disable camera follow mode for a specific agent.
   * Pass null to stop following and free the camera.
   */
  setFollowAgent: (agentId: string | null) => void;
  /**
   * Get a snapshot of WebGL diagnostics (render stats, context info, error log).
   * Returns null if the renderer isn't initialized yet.
   */
  getDiagnostics: () => WebGLDiagnosticsSnapshot | null;
  /**
   * Get the current d3-zoom scale (k value).
   * Returns the default zoom if not yet initialized.
   */
  getZoomLevel: () => number;
  /**
   * Spawn a sphere-colored particle burst at the given hex coordinate.
   * Particles expand radially and fade over PARTICLE_CONSTANTS.LIFETIME_MS ms.
   * No-op if the scene is not yet initialized.
   *
   * @param hexCol      - Target hex column
   * @param hexRow      - Target hex row
   * @param sphereColor - CSS color string (use getSphereColor from sphereIcons.ts)
   */
  spawnParticleBurst: (hexCol: number, hexRow: number, sphereColor: string) => void;
  /**
   * Trigger the anomaly reveal flash animation at a hex (shimmer → halo crossfade).
   * Also fires a particle burst in the anomaly's sphere color.
   * Call when an anomaly discovery encounter completes successfully.
   */
  triggerAnomalyReveal: (hexCol: number, hexRow: number, sphereColor: string) => void;
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

// ─── Selected hex tinted overlay ────────────────────────────────────────────

/**
 * Builds a hex-shaped filled overlay for the selected hex, tinted with the
 * ascendant's sphere color. Sits between the selection ring and hover overlay.
 */
function createSelectionOverlayMesh(size: number, color: string): THREE.Mesh {
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
  const c = new THREE.Color();
  c.setStyle(color, THREE.SRGBColorSpace);
  const mat = new THREE.MeshBasicMaterial({
    color: c,
    transparent: true,
    opacity: INTERACTION_CONSTANTS.SELECTION_OVERLAY_OPACITY,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = RENDER_ORDER.GRID + 1.5; // Between selection ring (+1) and hover overlay (+2)
  mesh.visible = false;
  return mesh;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Three.js hex map renderer — Phase 7, Plan 03: fog, zoom LOD, roads, follow mode.
 *
 * Features:
 * - d3-zoom drives OrthographicCamera for pan/zoom/pinch (continuous, no tier snapping)
 * - Double-click zoom disabled
 * - centerOn() smoothly flies to target hex over 500ms
 * - Hover shows HTML tooltip (terrain name + coordinates)
 * - Click selects hex with gold ring outline
 * - Hovered hex shows subtle white overlay
 * - Frustum culling enabled on InstancedMesh (Three.js default)
 * - Fog of war: unexplored=dark fill, explored=static layers, visible=all (Plan 07-01)
 * - Zoom LOD: 4-tier visibility matrix with smooth fade transitions (Plan 07-01)
 * - Road network: solid major roads + dashed trails + bridge sprites (Plan 07-02)
 * - Follow mode: camera tracks agent hex changes, breaks on manual pan (Plan 07-03)
 *
 * NFP #7 (Performance): Three.js handles per-instance frustum culling via GPU vertex shader.
 * At 60K hexes with an orthographic camera, the GPU efficiently discards off-screen vertices.
 * mesh.frustumCulled = true (default) applies bounding-sphere culling at the InstancedMesh level.
 * Per-instance culling is a Phase 7 concern if profiling reveals issues.
 */
const HexMapV2 = forwardRef<HexMapV2Handle, HexMapV2Props>(
  function HexMapV2(
    { tiles, cols, rows, seed = 42, hoveredHex, selectedHex, onHexClick, onHexHover, onAgentClick, onArmyClick, riverPaths, lakeIds, regionData, locations, anomalies, roadPaths, agents, armies, battles, threadLines, activityIcons, strategicOverlays, activeTugs, attentionRatio = 1.0, visibilityMap, fogEnabled = false, showOrganicShore = true, overlayOpen = false, selectionColor, moveDestinationHex, onCameraCenterHex, locationActivityMap },
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

    // Army and battle layer refs
    const armyLayerRef = useRef<ArmyLayerGroup | null>(null);
    const battleIndicatorLayerRef = useRef<BattleIndicatorLayerGroup | null>(null);
    const anomalyShimmerLayerRef = useRef<AnomalyShimmerLayerGroup | null>(null);

    // Thread line and activity icon layer refs (Attention UI)
    const threadLineLayerRef = useRef<ThreadLineLayer | null>(null);
    const activityIconLayerRef = useRef<ActivityIconLayer | null>(null);
    // Strategic marker layer ref — project dots and control pips
    const strategicMarkerLayerRef = useRef<StrategicMarkerLayer | null>(null);
    // Attention ratio ref — kept in sync with prop, read by the animation loop.
    const attentionRatioRef = useRef<number>(attentionRatio);
    attentionRatioRef.current = attentionRatio;

    // Ambient audio callback ref — kept in sync with prop so zoom handler always calls latest version
    const onCameraCenterHexRef = useRef<((hex: HexCoord) => void) | undefined>(undefined);
    onCameraCenterHexRef.current = onCameraCenterHex;
    // Debounce timer for camera-center ambient updates
    const cameraCenterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Particle burst ref — active bursts ticked each frame, consumed by tickParticleBursts
    const activeBurstsRef = useRef<ActiveBurst[]>([]);
    // Clock ref — exposed for imperative handle (anomaly reveal flash timing)
    const clockRef = useRef<THREE.Clock | null>(null);

    // Selection overlay ref — tinted hex fill for selected hex (ascendant sphere color)
    const selectionOverlayRef = useRef<THREE.Mesh | null>(null);

    // Destination marker ref — ascendant move order target, pulsed each frame
    const destinationMarkerRef = useRef<THREE.Group | null>(null);

    // Agent animation state refs — stable across renders, mutated by render loop
    const agentSpriteGroupRef = useRef<AgentSpriteGroup | null>(null);
    const animStatesRef = useRef<Map<string, AgentAnimState>>(new Map());
    const trailGroupRef = useRef<THREE.Group | null>(null);
    // Previous agent positions for movement detection (hex change diff + ring slot world position)
    const prevAgentPositionsRef = useRef<Map<string, AgentPrevPosition>>(new Map());
    // Location offset lookup for trail endpoints — rebuilt when locations change
    const locationOffsetRef = useRef<Map<string, { dx: number; dy: number }>>(new Map());
    locationOffsetRef.current = buildLocationOffsetLookup(locations);
    // Shared bbox ref: RegionLabelOverlay writes placed bboxes; LocationLabelOverlay reads to avoid overlaps
    const regionPlacedBBoxesRef = useRef<ScreenBBox[]>([]);

    // Fog culling refs — populated in scene init, read in fog update effect
    const fillResultRef        = useRef<HexFillMeshResult | null>(null);
    const landMeshRef          = useRef<THREE.InstancedMesh | null>(null);
    const waterMeshRef         = useRef<THREE.InstancedMesh | null>(null);
    /** Maps global tile index → { mesh, instanceIdx } for fast fog routing */
    const globalToMeshMapRef   = useRef<Map<number, { mesh: THREE.InstancedMesh; instanceIdx: number }> | null>(null);
    const originalColorsRef    = useRef<Float32Array | null>(null);
    const tileIndexByKeyRef    = useRef<Map<string, number> | null>(null);
    const parchmentTextureRef  = useRef<THREE.Texture | null>(null);
    const fogOverlayRef        = useRef<FogOverlayResult | null>(null);
    // Visibility map ref — kept in sync with prop for use without closure staleness
    const visibilityMapRef     = useRef<VisibilityMap | undefined>(visibilityMap);
    const fogEnabledRef        = useRef<boolean>(fogEnabled);

    // Keep fog refs in sync with latest props
    visibilityMapRef.current = visibilityMap;
    fogEnabledRef.current    = fogEnabled;

    // ── Load parchment texture for fog-of-war overlay ──
    useEffect(() => {
      const loader = new THREE.TextureLoader();
      loader.load(
        PARCHMENT_FOG_CONSTANTS.PARCHMENT_TEXTURE_PATH,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          parchmentTextureRef.current = tex;
          // Update fog overlay texture if already created
          if (fogOverlayRef.current) {
            updateFogOverlayTexture(fogOverlayRef.current, tex);
          }
        },
        undefined,
        () => {
          console.warn('[FoW] Parchment texture failed to load, using solid fallback color');
        },
      );
    }, []);

    // Scene group refs for fog layer culling and zoom matrix
    const signifierGroupRef  = useRef<THREE.Group | null>(null);
    const locationGroupRef   = useRef<THREE.Group | null>(null);
    const settlementModelGroupRef  = useRef<THREE.Group | null>(null);
    const roadGroupRef       = useRef<THREE.Group | null>(null);
    const riverGroupRef      = useRef<THREE.Group | null>(null);
    const gridLinesRef       = useRef<THREE.Mesh | null>(null);
    const elevTicksRef       = useRef<THREE.Mesh | null>(null);
    const borderDomainRef   = useRef<THREE.Mesh | null>(null);
    const borderProvinceRef    = useRef<THREE.Mesh | null>(null);
    const geoBorderRef       = useRef<THREE.LineSegments | null>(null);
    const coastlineRef       = useRef<THREE.Group | null>(null);

    // Follow mode ref — mutable state, does not trigger re-renders
    const followModeRef = useRef<FollowModeState>(createFollowMode());

    // WebGL diagnostics — captures render stats, context events, error log
    const diagnosticsRef = useRef<WebGLDiagnostics>(new WebGLDiagnostics());
    // Scene refs for diagnostics snapshot (renderer + scene needed at snapshot time)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef    = useRef<THREE.Scene | null>(null);

    // Region label overlay state
    const [regionLabels, setRegionLabels] = useState<import('../../engine/regionTypes').RegionLabel[]>([]);
    // Location label overlay state — derived from locations prop
    const [locationLabels, setLocationLabels] = useState<LocationLabelData[]>([]);
    // Current d3-zoom scale level — tracked to drive label tier filtering
    const [zoomLevel, setZoomLevel] = useState<number>(CAMERA_CONSTANTS.DEFAULT_ZOOM);
    // Zoom tier state — drives useZoomLayerVisibility hook
    const [zoomTier, setZoomTier] = useState<ZoomTier>(getZoomTier(CAMERA_CONSTANTS.DEFAULT_ZOOM));
    const [zoomK, setZoomK] = useState<number>(CAMERA_CONSTANTS.DEFAULT_ZOOM);

    // Canvas dimensions for label overlays
    const [canvasDimensions, setCanvasDimensions] = useState({ w: 800, h: 600 });

    // Build a fast tile lookup map: "col,row" -> HexTile
    const tileLookup = useRef<Map<string, HexTile>>(new Map());
    useEffect(() => {
      const map = new Map<string, HexTile>();
      for (const tile of tiles) {
        map.set(hexKey(tile.coord.col, tile.coord.row), tile);
      }
      tileLookup.current = map;
    }, [tiles]);

    // ── Imperative handle ─────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      centerOn(x: number, y: number, scale?: number) {
        const canvas = canvasRef.current;
        const zoom   = zoomRef.current;
        if (!canvas || !zoom) return;
        animateCameraTo(canvas, zoom, x, y, scale ?? CAMERA_CONSTANTS.DEFAULT_ZOOM);
      },
      setFollowAgent(agentId: string | null) {
        updateFollowTarget(followModeRef.current, agentId);
      },
      getDiagnostics(): WebGLDiagnosticsSnapshot | null {
        const renderer = rendererRef.current;
        const scene    = sceneRef.current;
        if (!renderer || !scene) return null;
        return diagnosticsRef.current.snapshot(renderer, scene);
      },
      getZoomLevel(): number {
        return zoomLevel;
      },
      spawnParticleBurst(hexCol: number, hexRow: number, sphereColor: string): void {
        const scene = sceneRef.current;
        if (!scene) return;
        const burst = spawnParticleBurst(
          scene,
          hexCol,
          hexRow,
          HEX_CONSTANTS.HEX_SIZE,
          sphereColor,
          performance.now(),
        );
        activeBurstsRef.current.push(burst);
      },
      triggerAnomalyReveal(hexCol: number, hexRow: number, sphereColor: string): void {
        // Fire particle burst
        const scene = sceneRef.current;
        if (scene) {
          const burst = spawnParticleBurst(
            scene, hexCol, hexRow, HEX_CONSTANTS.HEX_SIZE, sphereColor, performance.now(),
          );
          activeBurstsRef.current.push(burst);
        }
        // Trigger shimmer → halo crossfade
        const anomalyLayer = anomalyShimmerLayerRef.current;
        if (anomalyLayer) {
          const clock = clockRef.current;
          triggerAnomalyRevealFlash(anomalyLayer, hexCol, hexRow, clock?.getElapsedTime() ?? 0);
        }
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
        rendererRef.current = renderer;
        sceneRef.current = scene;
        diagnosticsRef.current.attach(canvas, renderer);
        setCanvasDimensions({ w, h });

        // Build fill mesh — split into land (stencil-tested) + water (normal) InstancedMeshes.
        // Land mesh only renders where stencil = 1 (set by CoastlineMesh stencil write pass).
        // Water mesh renders as full hexagonal shapes with no stencil constraints.
        // Pass lakeIds so lake hexes (lakeId >= 0) are classified as water (Plan 03-01).
        const lakeIdsArg = lakeIdsRef.current.length > 0 ? lakeIdsRef.current : undefined;
        const fillResult = createHexFillMesh(tiles, seed, lakeIdsArg);
        fillResult.landMesh.frustumCulled = true;
        fillResult.waterMesh.frustumCulled = true;
        scene.add(fillResult.landMesh);
        scene.add(fillResult.waterMesh);
        fillResultRef.current = fillResult;
        landMeshRef.current = fillResult.landMesh;
        waterMeshRef.current = fillResult.waterMesh;


        // Build fog overlay mesh — parchment layer floating above all scene content
        const fogOverlay = createFogOverlayMesh(tiles, cols, rows, parchmentTextureRef.current);
        scene.add(fogOverlay.mesh);
        scene.add(fogOverlay.backgroundPlane);
        fogOverlayRef.current = fogOverlay;

        // Apply current visibility state to the new overlay immediately.
        // useFogCulling only re-runs on visibilityMap/fogEnabled changes —
        // if the scene rebuilds without those changing, the overlay would
        // stay fully opaque (all hexes unexplored) without this.
        if (fogEnabledRef.current && visibilityMapRef.current) {
          for (const [key, hexVis] of visibilityMapRef.current) {
            setFogOverlayAlpha(fogOverlay, key, hexVis.state === 'unexplored' ? 1.0 : 0.0);
          }
          flushFogOverlay(fogOverlay);
        } else if (!fogEnabledRef.current) {
          fogOverlay.mesh.visible = false;
          fogOverlay.backgroundPlane.visible = false;
        }

        // Build global-to-mesh routing map for fog update (avoids re-scanning index arrays each fog update)
        const globalToMeshMap = new Map<number, { mesh: THREE.InstancedMesh; instanceIdx: number }>();
        for (let i = 0; i < fillResult.landTileIndices.length; i++) {
          globalToMeshMap.set(fillResult.landTileIndices[i], { mesh: fillResult.landMesh, instanceIdx: i });
        }
        for (let i = 0; i < fillResult.waterTileIndices.length; i++) {
          globalToMeshMap.set(fillResult.waterTileIndices[i], { mesh: fillResult.waterMesh, instanceIdx: i });
        }
        globalToMeshMapRef.current = globalToMeshMap;

        // Build original color cache for fog culling (Plan 07-01)
        // Stored in refs — fog update useEffect reads these without re-running scene init
        const { colors, indexByKey } = buildOriginalColorCache(
          tiles,
          seed,
          lakeIdsArg,
        );
        originalColorsRef.current = colors;
        tileIndexByKeyRef.current = indexByKey;

        // Build grid lines (skip entirely when opacity is 0 for seamless look)
        let gridLines: THREE.Mesh | null = null;
        if (HEX_CONSTANTS.GRID_LINE_OPACITY > 0) {
          gridLines = createHexGridLines(tiles);
          scene.add(gridLines);
        }
        gridLinesRef.current = gridLines;

        // Build coastline overlay — organic stencil boundary + ocean blue overlay (Phase 07.1)
        const coastlineMesh = createCoastlineMesh(tiles, cols, rows, seed, lakeIdsRef.current.length > 0 ? lakeIdsRef.current : undefined);
        coastlineRef.current = coastlineMesh;
        scene.add(coastlineMesh);

        // Build elevation tick marks — caterpillar-style marks on steep hex edges (Plan 03-03)
        // Renders at RENDER_ORDER.ELEVATION_TICKS (3), above grid lines, below rivers
        const elevTicks = createElevationTicks(tiles);
        scene.add(elevTicks);
        elevTicksRef.current = elevTicks;

        // Build river overlay — curved blue quad strips above terrain (Plan 03-02)
        // Renders at RENDER_ORDER.RIVERS (4), above grid lines, overlaying terrain without changing hex color
        let riverMesh: THREE.Group | null = null;
        if (riverPathsRef.current.length > 0) {
          riverMesh = createRiverMesh(riverPathsRef.current, tiles, seed);
          scene.add(riverMesh);
        }
        riverGroupRef.current = riverMesh;

        // Build geographic region borders — dim, ephemeral borders between geographic regions
        // Renders at RENDER_ORDER.GEO_BORDERS, below political borders
        let geoBorderMesh: THREE.Mesh | null = null;
        if (regionData && regionData.hexRegionId.size > 0) {
          geoBorderMesh = createGeoBorderMesh(regionData, tiles);
          scene.add(geoBorderMesh);
        }
        geoBorderRef.current = geoBorderMesh;

        // Build political border polylines — red quad-strip borders for domains and provinces
        // Renders at RENDER_ORDER.BORDERS, above geographic borders.
        // Geographic-only differences produce no geometry (REGN-06).
        let borderDomainMesh: THREE.Mesh | null = null;
        let borderProvinceMesh: THREE.Mesh | null = null;
        let capitalMarkers: THREE.Group | null = null;
        if (regionData && (regionData.provinces.length > 0 || regionData.hexProvinceId.size > 0)) {
          const borders = createBorderMesh(regionData, tiles, cols);
          borderDomainMesh = borders.domainMesh;
          borderProvinceMesh = borders.provinceMesh;
          scene.add(borderDomainMesh);
          scene.add(borderProvinceMesh);

          capitalMarkers = createCapitalMarkers(regionData);
          scene.add(capitalMarkers);
        }
        borderDomainRef.current = borderDomainMesh;
        borderProvinceRef.current = borderProvinceMesh;

        // Build road network — solid major roads + dashed trails (Plan 07-02)
        // Renders at RENDER_ORDER.ROADS, initially hidden (zoom matrix controls visibility)
        const roadGroup = createRoadMesh(
          roadPaths ?? [],
          tiles,
        );
        scene.add(roadGroup);
        roadGroupRef.current = roadGroup;

        // Build set of hex keys that have centered (full/medium) location icons.
        // Signifiers on these hexes are hidden to avoid overlapping with the location art.
        const centeredLocationHexes = new Set<string>();
        if (locations) {
          for (const loc of locations) {
            const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
            if (iconDef && CENTERED_SIZE_CLASSES.has(iconDef.sizeClass)) {
              centeredLocationHexes.add(hexKey(loc.hexCol, loc.hexRow));
            }
          }
        }

        // Build signifier sprites — landscape icons for each land hex (Plan 05-02)
        // Renders at RENDER_ORDER.SIGNIFIERS (7), above borders, below location overlays.
        // Hidden by default; visible only at regional+ zoom (k >= SIGNIFIER_ZOOM_THRESHOLD).
        const signifierGroup = createSignifierMesh(tiles, seed, centeredLocationHexes);
        scene.add(signifierGroup);
        signifierGroup.visible = false; // Hidden until zoom reaches regional tier
        signifierGroupRef.current = signifierGroup;

        // Build location icon sprites — settlement and landmark icons (Plan 06-01)
        // Renders at RENDER_ORDER.LOCATIONS (8), above signifiers.
        // Hidden by default; visible only at regional+ zoom (k >= LOCATION_ICON_THRESHOLD).
        let locationGroup: THREE.Group | null = null;
        if (locations && locations.length > 0) {
          locationGroup = createLocationIconMesh(locations);
          scene.add(locationGroup);
          locationGroup.visible = false; // Hidden until zoom reaches regional tier

          // Derive location label data from location nodes
          const labelData: LocationLabelData[] = locations.map(loc => ({
            id: `loc-${loc.hexCol}-${loc.hexRow}-${loc.name}`,
            name: loc.name,
            hexCol: loc.hexCol,
            hexRow: loc.hexRow,
            importance: LOCATION_IMPORTANCE_MAP[loc.locationType as keyof typeof LOCATION_IMPORTANCE_MAP] ?? 'small',
            locationType: loc.locationType,
          }));
          setLocationLabels(labelData);
        } else {
          setLocationLabels([]);
        }
        locationGroupRef.current = locationGroup;

        // Build 3D city models — for city/capital locations (asynchronous, fail-soft)
        // Renders at same zoom tier as location icons (regional+).
        // Group is added to scene immediately; GLTF instances appear once loaded.
        if (locations && locations.length > 0) {
          const settlementModelGroup = createSettlementModelMesh(locations, scene);
          settlementModelGroup.visible = false; // Hidden until zoom reaches regional tier
          settlementModelGroupRef.current = settlementModelGroup;
        }

        // Build agent sprites — single sprite per agent with material swap (Plan 06-04)
        // Renders at RENDER_ORDER.AGENTS (9), above location icons.
        const agentSpriteGroup = createAgentSpriteMesh(agents ?? []);
        scene.add(agentSpriteGroup.group);
        agentSpriteGroupRef.current = agentSpriteGroup;

        // Kick off portrait loading (fire-and-forget — fail-soft)
        if ((agents ?? []).length > 0) {
          void loadAgentPortraits(agentSpriteGroup, agents ?? []);
        }

        // Army layer is built incrementally via useEffect on `armies` prop
        // (see "Incremental army layer rebuild" effect below).
        // Pre-warm the coat of arms texture cache so first army render is fast.
        void preloadCoatOfArmsTextures(ARMY_TEXTURE_SIZE);

        // Build battle indicator layer — battle/siege overlays at combat hexes (Plan 12-07)
        // Renders at RENDER_ORDER.BATTLE_INDICATORS (10.8), above armies, below events.
        const battleIndicatorGroup = createBattleIndicatorLayer(battles ?? []);
        scene.add(battleIndicatorGroup.group);
        battleIndicatorLayerRef.current = battleIndicatorGroup;

        // Build thread line layer — avatar-to-agent relationship lines (Attention UI)
        // Renders at RENDER_ORDER.THREADS (9.5), below agent sprites.
        const threadLineLayer = createThreadLineMesh();
        scene.add(threadLineLayer.group);
        threadLineLayerRef.current = threadLineLayer;

        // Build activity icon layer — reach micro-icons for active encounters (Attention UI)
        // Renders at RENDER_ORDER.ACTIVITY_ICONS (10.9), above battle indicators, below events.
        const activityIconLayer = createActivityIconLayer();
        scene.add(activityIconLayer.group);
        activityIconLayerRef.current = activityIconLayer;

        // Build strategic marker layer — project dots + control pips on hex map.
        // Renders between locations (9) and agents (10).
        const strategicMarkerLayer = createStrategicMarkerLayer();
        scene.add(strategicMarkerLayer.group);
        strategicMarkerLayerRef.current = strategicMarkerLayer;

        // Build anomaly shimmer/halo layer — undiscovered glow + discovered ring
        if (anomalies && anomalies.length > 0) {
          const anomalyLayer = createAnomalyShimmerLayer(anomalies);
          scene.add(anomalyLayer.shimmerGroup);
          scene.add(anomalyLayer.haloGroup);
          anomalyLayer.shimmerGroup.visible = false; // Hidden until regional+ zoom
          anomalyLayer.haloGroup.visible = false;
          anomalyShimmerLayerRef.current = anomalyLayer;
        }

        // Create movement trail group — Line segments that fade over TRAIL_FADE_DURATION
        const trailGroup = createMovementTrailMesh();
        scene.add(trailGroup);
        trailGroupRef.current = trailGroup;

        // Initialize animation state map (shared ref — mutated by render loop)
        const animStates = animStatesRef.current;
        animStates.clear();

        // Generate HTML region labels from regionData (Plan 04-03)
        // Labels are generated client-side from regionData — worldgen produces the data,
        // RegionLabelOverlay handles the rendering.
        if (regionData && (regionData.domains.length > 0 || regionData.provinces.length > 0)) {
          const allLabels = [
            ...generateRegionLabels(regionData),
            ...generateRiverLabels(riverPathsRef.current, seed),
          ];
          setRegionLabels(allLabels);
        } else {
          setRegionLabels([]);
        }

        // Selected hex ring (initially hidden)
        const selectionRing = createHexRingMesh(HEX_CONSTANTS.HEX_SIZE);
        scene.add(selectionRing);

        // Selected hex tinted overlay — ascendant sphere color (initially hidden)
        const selOverlay = createSelectionOverlayMesh(
          HEX_CONSTANTS.HEX_SIZE,
          selectionColor ?? '#d4a040',
        );
        scene.add(selOverlay);
        selectionOverlayRef.current = selOverlay;

        // Destination marker: pulsing white ring + X cross for active move order target
        const destinationMarker = createDestinationMarkerGroup(HEX_CONSTANTS.HEX_SIZE);
        scene.add(destinationMarker);
        destinationMarkerRef.current = destinationMarker;

        const updateDestinationMarker = (hex: HexCoord | null) => {
          if (hex) {
            const world = hexToWorld(hex, HEX_CONSTANTS.HEX_SIZE);
            destinationMarker.position.set(world.x, world.y, 0.1);
            destinationMarker.visible = true;
          } else {
            destinationMarker.visible = false;
          }
        };
        (canvas as HTMLCanvasElement & { _updateDestinationMarker?: (h: HexCoord | null) => void })
          ._updateDestinationMarker = updateDestinationMarker;
        updateDestinationMarker(moveDestinationHex ?? null);

        // Hover overlay mesh (initially hidden)
        const hoverOverlay = createHoverOverlayMesh(HEX_CONSTANTS.HEX_SIZE);
        scene.add(hoverOverlay);

        // Set up d3-zoom — attaches to canvas, drives OrthographicCamera
        const { zoom, setZoomTarget, clearZoomTarget, destroy } = setupD3Zoom(canvas, camera, cols, rows);
        zoomRef.current = zoom;
        destroyZoomRef.current = destroy;
        setZoomTargetRef.current = setZoomTarget;
        clearZoomTargetRef.current = clearZoomTarget;

        // Track zoom level for label tier filtering and layer visibility (Plan 07-01)
        // Visibility toggling is handled by useZoomLayerVisibility hook — zoom handler just updates state.
        zoom.on('zoom.labels', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
          const k = event.transform.k;
          setZoomLevel(k);
          setZoomTier(getZoomTier(k));
          setZoomK(k);
        });

        // Break follow mode on manual pan (user-initiated zoom events have sourceEvent)
        zoom.on('zoom.follow', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
          if (event.sourceEvent && (
            event.sourceEvent.type === 'mousemove' ||
            event.sourceEvent.type === 'pointermove' ||
            event.sourceEvent.type === 'touchmove'
          )) {
            followModeRef.current.active = false;
          }
        });

        // Notify ambient audio system when camera center hex changes (debounced)
        zoom.on('zoom.ambient', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
          if (!onCameraCenterHexRef.current) return;
          const transform = event.transform;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const centerX = (canvas.width / 2 - transform.x) / transform.k;
          const centerY = (canvas.height / 2 - transform.y) / transform.k;
          const hex = worldToHex(centerX, centerY, HEX_CONSTANTS.HEX_SIZE);
          if (cameraCenterDebounceRef.current !== null) {
            clearTimeout(cameraCenterDebounceRef.current);
          }
          cameraCenterDebounceRef.current = setTimeout(() => {
            onCameraCenterHexRef.current?.(hex);
            cameraCenterDebounceRef.current = null;
          }, AMBIENT_CONTEXT_DEBOUNCE_MS);
        });

        // Update selection ring + tinted overlay when selectedHex prop changes
        // This runs inside the effect on mount; prop changes are handled separately below.
        const updateSelectionRing = (hex: HexCoord | null) => {
          if (hex) {
            const world = hexToWorld(hex, HEX_CONSTANTS.HEX_SIZE);
            selectionRing.position.set(world.x, world.y, 0.1); // slight Z offset above fill mesh
            selectionRing.visible = true;
            selOverlay.position.set(world.x, world.y, 0.05);
            selOverlay.visible = true;
          } else {
            selectionRing.visible = false;
            selOverlay.visible = false;
          }
        };

        // Store update function for prop-change effect
        (canvas as HTMLCanvasElement & { _updateSelectionRing?: (h: HexCoord | null) => void })
          ._updateSelectionRing = updateSelectionRing;

        updateSelectionRing(selectedHex);

        // ZOOM-05: Default camera on retinue agent when fog is enabled (Plan 07-03)
        // Centers camera on retinue at hero-local zoom so the player starts with vision
        const currentAgents = agents ?? [];
        const retinue = currentAgents.find(a => a.isRetinue);
        if (retinue && fogEnabledRef.current) {
          const retWorld = hexToWorld({ col: retinue.hexCol, row: retinue.hexRow }, HEX_CONSTANTS.HEX_SIZE);
          // setTimeout(0) ensures zoom is fully initialized before animating
          setTimeout(() => {
            if (zoomRef.current && canvasRef.current) {
              animateCameraTo(
                canvasRef.current,
                zoomRef.current,
                retWorld.x,
                retWorld.y,
                ZOOM_TIER_THRESHOLDS.HERO_LOCAL,
                0,
              );
            }
          }, 0);
        }

        // Render loop
        const clock = new THREE.Clock();
        clockRef.current = clock;
        function animate() {
          rafId = requestAnimationFrame(animate);
          diagnosticsRef.current.recordFrame();
          // Advance agent bezier hop animations (no-op if no active animations)
          const spriteGroup = agentSpriteGroupRef.current;
          if (spriteGroup) {
            tickAgentAnimations(animStates, spriteGroup.animationTargets);
            tickAvatarPulse(spriteGroup, clock.getElapsedTime());
          }
          // Fade and dispose expired movement trail segments
          const tGroup = trailGroupRef.current;
          if (tGroup) updateTrails(tGroup);
          // Pulse destination marker (ascendant move order X)
          const destMarker = destinationMarkerRef.current;
          if (destMarker?.visible) {
            const t = clock.getElapsedTime();
            const pulse = DESTINATION_MARKER_CONSTANTS.PULSE_MIN
              + (DESTINATION_MARKER_CONSTANTS.PULSE_MAX - DESTINATION_MARKER_CONSTANTS.PULSE_MIN)
              * (0.5 + 0.5 * Math.sin(t * DESTINATION_MARKER_CONSTANTS.PULSE_SPEED));
            for (const child of destMarker.children) {
              // Works for both LineBasicMaterial (ring) and MeshBasicMaterial (lozenges)
              ((child as THREE.LineLoop | THREE.Mesh).material as THREE.Material & { opacity: number }).opacity = pulse;
            }
          }
          // Pulse battle/siege indicators
          const battleLayer = battleIndicatorLayerRef.current;
          if (battleLayer && battleLayer.materials.length > 0) {
            tickBattleIndicators(battleLayer, clock.getElapsedTime());
          }
          // Pulse anomaly shimmer/halo effects
          const anomalyLayer = anomalyShimmerLayerRef.current;
          if (anomalyLayer) {
            tickAnomalyShimmers(anomalyLayer, clock.getElapsedTime());
          }
          // Tick thread lines, activity icons, and strategic markers (Attention UI)
          const threadLineLayer = threadLineLayerRef.current;
          const activityIconLayer = activityIconLayerRef.current;
          const strategicMarkerLayer = strategicMarkerLayerRef.current;
          if (threadLineLayer || activityIconLayer || strategicMarkerLayer) {
            const elapsedS = clock.getElapsedTime();
            if (threadLineLayer) {
              threadLineLayer.tick(elapsedS, attentionRatioRef.current);
            }
            if (activityIconLayer) {
              activityIconLayer.tick(elapsedS);
            }
            if (strategicMarkerLayer) {
              strategicMarkerLayer.tick(elapsedS);
            }
          }
          // Tick sphere-colored particle bursts (action activation feedback)
          if (activeBurstsRef.current.length > 0) {
            activeBurstsRef.current = tickParticleBursts(
              scene,
              activeBurstsRef.current,
              performance.now(),
            );
          }
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
          // Remove zoom listeners (Plan 04-03, Plan 07-03)
          zoom.on('zoom.labels', null);
          zoom.on('zoom.follow', null);
          zoom.on('zoom.ambient', null);
          if (cameraCenterDebounceRef.current !== null) {
            clearTimeout(cameraCenterDebounceRef.current);
            cameraCenterDebounceRef.current = null;
          }
          destroy();
          zoomRef.current = null;
          destroyZoomRef.current = null;
          setZoomTargetRef.current = null;
          clearZoomTargetRef.current = null;
          cameraRef.current = null;
          // Clear scene-bound refs
          fillResultRef.current = null;
          landMeshRef.current = null;
          waterMeshRef.current = null;
          globalToMeshMapRef.current = null;
          originalColorsRef.current = null;
          tileIndexByKeyRef.current = null;
          signifierGroupRef.current = null;
          locationGroupRef.current = null;
          if (settlementModelGroupRef.current) {
            disposeSettlementModelMesh(settlementModelGroupRef.current);
            settlementModelGroupRef.current = null;
          }
          roadGroupRef.current = null;
          riverGroupRef.current = null;
          coastlineRef.current = null;
          gridLinesRef.current = null;
          elevTicksRef.current = null;
          borderDomainRef.current   = null;
          borderProvinceRef.current = null;
          geoBorderRef.current = null;
          // Dispose remaining particle bursts on unmount
          for (const burst of activeBurstsRef.current) {
            scene.remove(burst.points);
            burst.points.geometry.dispose();
            (burst.points.material as THREE.PointsMaterial).dispose();
          }
          activeBurstsRef.current = [];
          scene.clear();
          fillResult.landMesh.geometry.dispose();
          fillResult.landMesh.material instanceof THREE.Material && fillResult.landMesh.material.dispose();
          fillResult.waterMesh.geometry.dispose();
          fillResult.waterMesh.material instanceof THREE.Material && fillResult.waterMesh.material.dispose();
          gridLines?.geometry.dispose();
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
          // Dispose road group geometries and materials (Plan 07-02)
          for (const child of roadGroup.children) {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                for (const mat of child.material) mat.dispose();
              } else {
                (child.material as THREE.Material).dispose();
              }
            } else if (child instanceof THREE.Sprite) {
              (child.material as THREE.SpriteMaterial).map?.dispose();
              child.material.dispose();
            }
          }
          // Dispose border meshes
          if (borderDomainMesh) {
            borderDomainMesh.geometry.dispose();
            (borderDomainMesh.material as THREE.Material).dispose();
          }
          if (borderProvinceMesh) {
            borderProvinceMesh.geometry.dispose();
            (borderProvinceMesh.material as THREE.Material).dispose();
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
          // Dispose signifier sprite materials and textures
          for (const child of signifierGroup.children) {
            if (child instanceof THREE.Sprite) {
              (child.material as THREE.SpriteMaterial).map?.dispose();
              child.material.dispose();
            }
          }
          // Dispose location icon sprite materials and textures
          if (locationGroup) {
            for (const child of locationGroup.children) {
              if (child instanceof THREE.Sprite) {
                (child.material as THREE.SpriteMaterial).map?.dispose();
                child.material.dispose();
              }
            }
          }
          // Dispose army and battle indicator layers
          if (armyLayerRef.current) {
            armyLayerRef.current.dispose();
            armyLayerRef.current = null;
          }
          if (battleIndicatorLayerRef.current) {
            battleIndicatorLayerRef.current.dispose();
            battleIndicatorLayerRef.current = null;
          }
          if (anomalyShimmerLayerRef.current) {
            anomalyShimmerLayerRef.current.dispose();
            anomalyShimmerLayerRef.current = null;
          }
          if (threadLineLayerRef.current) {
            threadLineLayerRef.current.dispose();
            threadLineLayerRef.current = null;
          }
          if (activityIconLayerRef.current) {
            activityIconLayerRef.current.dispose();
            activityIconLayerRef.current = null;
          }
          if (strategicMarkerLayerRef.current) {
            strategicMarkerLayerRef.current.dispose();
            strategicMarkerLayerRef.current = null;
          }
          // Dispose agent sprite groups
          agentSpriteGroup.dispose();
          agentSpriteGroupRef.current = null;
          // Dispose movement trail segments
          const finalTrailGroup = trailGroupRef.current;
          if (finalTrailGroup) {
            for (const child of finalTrailGroup.children) {
              if (child instanceof THREE.Line) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
              }
            }
          }
          trailGroupRef.current = null;
          selectionRing.geometry.dispose();
          selOverlay.geometry.dispose();
          (selOverlay.material as THREE.Material).dispose();
          selectionOverlayRef.current = null;
          hoverOverlay.geometry.dispose();
          diagnosticsRef.current.dispose();
          rendererRef.current = null;
          sceneRef.current = null;
          hexScene?.dispose();
        };
      } catch (err) {
        console.error('[HexMapV2] Three.js initialization failed:', err);
        diagnosticsRef.current.addLog('error', 'init', `Init failed: ${err instanceof Error ? err.message : String(err)}`);
        if (canvas) canvas.dataset.failed = 'true';
        return () => {
          diagnosticsRef.current.dispose();
          rendererRef.current = null;
          sceneRef.current = null;
          if (hexScene) hexScene.dispose();
        };
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // NOTE: `agents` is intentionally excluded — agent position updates are handled
    // incrementally by the animation useEffect below (line ~950). Including agents here
    // would tear down and recreate the entire Three.js scene every tick, destroying
    // animation state (prevPositions, animStates, trailGroup) and preventing movement
    // animations from ever triggering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tiles, cols, rows, seed, riverPaths, regionData, locations, anomalies, roadPaths]);

    // ── Fog update — delegated to useFogCulling hook ──
    useFogCulling({
      visibilityMap,
      fogEnabled,
      landMesh: landMeshRef,
      waterMesh: waterMeshRef,
      globalToMeshMap: globalToMeshMapRef,
      originalColors: originalColorsRef,
      tileIndexByKey: tileIndexByKeyRef,
      signifierGroup: signifierGroupRef,
      locationGroup: locationGroupRef,
      fogOverlay: fogOverlayRef,
    });

    // ── Zoom layer visibility — delegated to useZoomLayerVisibility hook ──
    useZoomLayerVisibility({
      zoomTier,
      zoomK,
      groups: {
        signifiers: signifierGroupRef,
        locations: locationGroupRef,
        cityModels: settlementModelGroupRef,
        roads: roadGroupRef,
        rivers: riverGroupRef,
        gridLines: gridLinesRef,
        elevTicks: elevTicksRef,
        geoBorder: geoBorderRef,
        borderDomain: borderDomainRef,
        borderProvince: borderProvinceRef,
        coastline: coastlineRef,
      },
      agentSpriteGroup: agentSpriteGroupRef,
      trailGroup: trailGroupRef,
    });

    // ── Anomaly shimmer/halo zoom sync — same visibility tier as locations ──
    useEffect(() => {
      const anomalyLayer = anomalyShimmerLayerRef.current;
      const locGroup = locationGroupRef.current;
      if (!anomalyLayer) return;
      const visible = locGroup?.visible ?? false;
      anomalyLayer.shimmerGroup.visible = visible;
      anomalyLayer.haloGroup.visible = visible;
    }, [zoomTier]);

    // Toggle organic shore (coastline) mesh visibility
    useEffect(() => {
      if (coastlineRef.current) {
        coastlineRef.current.visible = showOrganicShore;
      }
    }, [showOrganicShore]);

    // ── Incremental army layer rebuild when armies prop changes ──
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Dispose old army layer
      if (armyLayerRef.current) {
        scene.remove(armyLayerRef.current.group);
        armyLayerRef.current.dispose();
        armyLayerRef.current = null;
      }

      if (!armies || armies.length === 0) return;

      // Preload coat of arms textures (instant if already cached), then build layer
      void preloadCoatOfArmsTextures(ARMY_TEXTURE_SIZE).then(() => {
        if (!sceneRef.current) return;
        console.debug('[ArmyLayer] Building army layer for', armies.length, 'armies after texture preload');
        const armyLayerGroup = createArmyLayer(armies);
        sceneRef.current.add(armyLayerGroup.group);
        armyLayerRef.current = armyLayerGroup;
      });
    }, [armies]);

    // Update selection ring + zoom target when selectedHex prop changes
    useEffect(() => {
      const canvas = canvasRef.current as (HTMLCanvasElement & {
        _updateSelectionRing?: (h: HexCoord | null) => void;
      }) | null;
      canvas?._updateSelectionRing?.(selectedHex);

      // Set zoom target so scroll-zoom converges on the selected hex
      if (selectedHex) {
        const selWorld = hexToWorld(selectedHex, HEX_CONSTANTS.HEX_SIZE);
        setZoomTargetRef.current?.(selWorld.x, selWorld.y);
      } else {
        clearZoomTargetRef.current?.();
      }
    }, [selectedHex]);

    // Update selection overlay color when selectionColor prop changes
    useEffect(() => {
      const overlay = selectionOverlayRef.current;
      if (!overlay) return;
      const mat = overlay.material as THREE.MeshBasicMaterial;
      mat.color.setStyle(selectionColor ?? '#d4a040', THREE.SRGBColorSpace);
    }, [selectionColor]);

    // Update destination marker when moveDestinationHex prop changes
    useEffect(() => {
      const canvas = canvasRef.current as (HTMLCanvasElement & {
        _updateDestinationMarker?: (h: HexCoord | null) => void;
      }) | null;
      canvas?._updateDestinationMarker?.(moveDestinationHex ?? null);
    }, [moveDestinationHex]);

    // ── Agent animation — delegated to useAgentAnimations hook ──
    useAgentAnimations({
      agents,
      seed,
      agentSpriteGroup: agentSpriteGroupRef,
      trailGroup: trailGroupRef,
      animStates: animStatesRef,
      prevAgentPositions: prevAgentPositionsRef,
      locationOffsets: locationOffsetRef,
      followMode: followModeRef,
      zoomRef,
      canvasRef,
      cameraRef,
    });

    // ── Thread line layer rebuild when threadLines prop changes ──
    useEffect(() => {
      threadLineLayerRef.current?.rebuild(threadLines ?? []);
    }, [threadLines]);

    // ── Active tugs update — drives vibration animation on tugged thread lines ──
    useEffect(() => {
      threadLineLayerRef.current?.setActiveTugs(activeTugs ?? new Map());
    }, [activeTugs]);

    // ── Activity icon layer rebuild when activityIcons prop changes ──
    useEffect(() => {
      activityIconLayerRef.current?.rebuild(activityIcons ?? []);
    }, [activityIcons]);

    // ── Activity icon zoom visibility ──
    useEffect(() => {
      activityIconLayerRef.current?.setVisible(zoomK >= ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD);
    }, [zoomK]);

    // ── Strategic marker layer rebuild when strategicOverlays prop changes ──
    useEffect(() => {
      strategicMarkerLayerRef.current?.rebuild(strategicOverlays ?? new Map());
    }, [strategicOverlays]);

    // ── Strategic marker zoom visibility (same threshold as activity icons) ──
    useEffect(() => {
      strategicMarkerLayerRef.current?.setVisible(zoomK >= ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD);
    }, [zoomK]);

    // ── Mouse event handlers ───────────────────────────────────────

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      const hex = screenToHex(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas);
      onHexHover(hex ?? null);
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      // Agent sprites are small — try to pick them before falling back to hex.
      const spriteMap = agentSpriteGroupRef.current?.spriteMap ?? new Map();

      // DEBUG: log click and sprite positions to diagnose agent click detection
      if (import.meta.env.DEV) {
        console.log('[AgentClick] click at', e.nativeEvent.offsetX.toFixed(1), e.nativeEvent.offsetY.toFixed(1),
          '| spriteMap size:', spriteMap.size);
        for (const [id, entry] of spriteMap) {
          const sc = worldToScreen(entry.sprite.position, camera, canvas);
          const dx = e.nativeEvent.offsetX - sc.x;
          const dy = e.nativeEvent.offsetY - sc.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          console.log(`  agent ${id}: world(${entry.sprite.position.x.toFixed(1)},${entry.sprite.position.y.toFixed(1)}) → screen(${sc.x.toFixed(1)},${sc.y.toFixed(1)}) dist=${dist.toFixed(1)} visible=${entry.sprite.visible}`);
        }
      }

      const agentId = pickAgentAtScreen(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas, spriteMap, zoomK);
      if (agentId) {
        onAgentClick?.(agentId);
        return;
      }

      const armyId = pickArmyAtScreen(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas, armyLayerRef.current?.group ?? null);
      if (armyId) {
        onArmyClick?.(armyId);
        return;
      }

      const hex = screenToHex(e.nativeEvent.offsetX, e.nativeEvent.offsetY, camera, canvas);
      if (hex) {
        // Block clicks on unexplored hexes (fog of war).
        // !hexVis catches hexes absent from the map (never seen) — same as 'unexplored'.
        if (fogEnabledRef.current && visibilityMapRef.current) {
          const hexVis = visibilityMapRef.current.get(`${hex.col},${hex.row}`);
          if (!hexVis || hexVis.state === 'unexplored') return;
        }
        onHexClick(hex);
      }
    };

    const handleMouseLeave = () => {
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

    // ── Filter labels by fog state — hide labels on unexplored hexes ──
    const visibleRegionLabels = useMemo(() => {
      if (!fogEnabled || !visibilityMap) return regionLabels;
      return regionLabels.filter(label => {
        const hex = worldToHex(label.worldX, label.worldY, HEX_CONSTANTS.HEX_SIZE);
        const hexVis = visibilityMap.get(`${hex.col},${hex.row}`);
        return hexVis?.state !== 'unexplored';
      });
    }, [regionLabels, visibilityMap, fogEnabled]);

    const visibleLocationLabels = useMemo(() => {
      if (!fogEnabled || !visibilityMap) return locationLabels;
      return locationLabels.filter(loc => {
        const hexVis = visibilityMap.get(`${loc.hexCol},${loc.hexRow}`);
        return hexVis?.state !== 'unexplored';
      });
    }, [locationLabels, visibilityMap, fogEnabled]);

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
        {!overlayOpen && visibleRegionLabels.length > 0 && (
          <RegionLabelOverlay
            labels={visibleRegionLabels}
            cameraRef={cameraRef}
            canvasWidth={canvasDimensions.w}
            canvasHeight={canvasDimensions.h}
            zoomLevel={zoomLevel}
            placedBBoxesRef={regionPlacedBBoxesRef}
          />
        )}
        {!overlayOpen && visibleLocationLabels.length > 0 && (
          <LocationLabelOverlay
            locations={visibleLocationLabels}
            cameraRef={cameraRef}
            canvasWidth={canvasDimensions.w}
            canvasHeight={canvasDimensions.h}
            zoomLevel={zoomLevel}
            prePlacedBBoxesRef={regionPlacedBBoxesRef}
          />
        )}
        {/* Location murmur tooltip — shown on hex hover when location data is available (THR-22) */}
        {hoveredHex && cameraRef.current && canvasRef.current && (() => {
          const camera = cameraRef.current!;
          const canvas = canvasRef.current!;
          const worldPos = hexToWorld(hoveredHex, HEX_CONSTANTS.HEX_SIZE);
          const screen = worldToScreen(
            new THREE.Vector3(worldPos.x, worldPos.y, 0),
            camera,
            canvas,
          );
          // Look up location activity summary by hex key ("col,row")
          const locationActivity = locationActivityMap?.get(
            `${hoveredHex.col},${hoveredHex.row}`,
          );
          // Fall back to tile terrain name
          const hoveredTile = tiles.find(
            t => t.coord.col === hoveredHex.col && t.coord.row === hoveredHex.row,
          );
          const terrainName = String(hoveredTile?.terrain ?? '');
          return (
            <HexTooltip
              terrainName={terrainName}
              coord={hoveredHex}
              screenX={screen.x}
              screenY={screen.y}
              canvasWidth={canvasDimensions.w}
              canvasHeight={canvasDimensions.h}
              locationActivity={locationActivity}
            />
          );
        })()}
      </div>
    );
  },
);

export default HexMapV2;
