/**
 * LocationLabelOverlay.tsx — HTML label overlay for location icons on the hex map.
 *
 * Renders location name labels as positioned <div> elements over the canvas using
 * camera.project() for world→screen mapping. Follows the RegionLabelOverlay pattern.
 *
 * Features (THR-1899; THR-1831 § 6, THR-1833 § 5):
 * - Sizes stepped by zoom band (LOCATION_LABEL_SIZES), weights by importance
 *   (capital 800, city 700, town 500, small 400), in Alegreya Sans
 * - A dark halo (LABEL_HALO) behind light text, legible over any terrain
 * - Zoom visibility: none below regional; small places from k 10
 * - Collision detection via removeOverlaps (debounced). Map markers that are label
 *   obstacles (threaded medallions, the avatar, close-up portraits) are immovable
 *   boxes: a name that hits one moves to its free slot below its anchor, or hides
 * - pointer-events: none throughout — labels are display-only
 *
 * NFP #1 Tunability: All font sizes, weights, and zoom thresholds are named constants.
 * NFP #4 Fail-soft: Renders nothing if camera is not available.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import { hexToPixel } from '../../../lib/hexMath';
import { getFixedSlotOffset } from '../../../lib/movementPath';
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import {
  LOCATION_ICON_REGISTRY,
  LOCATION_SIZE_SCALE,
  CENTERED_SIZE_CLASSES,
} from '../locations/locationIconRegistry';
import {
  SLOT_RING_RADIUS,
  VERTEX_ANGLES_DEG,
  LOCATION_RING_SCALE_FACTOR,
  MAX_RING_LOCATIONS,
} from '../../../data/agent-visual-content';
import { ZOOM_THRESHOLDS } from './RegionLabelOverlay';
import {
  removeOverlaps,
  applyCachedVisibility,
  verdictsOf,
  type LabelVerdict,
  type ScreenLabel,
  type ScreenBBox,
} from './labelCollision';
import { MAP_OVERLAY_Z } from './mapOverlayZ';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/** The zoom steps place names are sized by (THR-1878 plan § D14). */
export type LocationLabelBand = 'regionalOuter' | 'regionalInner' | 'heroLocal';

/**
 * Screen px per importance and band (THR-1831 § 6). null = no name in that band.
 * regionalOuter is k 5–10 (region names still showing), regionalInner k 10–15,
 * heroLocal k ≥ 15. Map label sizes are screen px and do not take the root type step.
 */
export const LOCATION_LABEL_SIZES: Record<LocationLabelBand, Record<LocationImportance, number | null>> = {
  regionalOuter: { capital: 16, city: 14, town: 13, small: null },
  regionalInner: { capital: 19, city: 16, town: 14, small: 12 },
  heroLocal:     { capital: 22, city: 19, town: 16, small: 14 },
};

/**
 * Font sizes (px) at the first regional step, kept for readers that want one
 * number per importance. Small has none there (hidden); 12 is its first size.
 */
export const LOCATION_LABEL_FONT_SIZES: Record<LocationImportance, number> = {
  capital: 16,
  city:    14,
  town:    13,
  small:   12,
};

/**
 * Font weights per importance (THR-1833 § 5). Alegreya Sans 800 ships with
 * THR-1879's font slice; until then the browser draws the nearest cut (700).
 */
export const LOCATION_LABEL_FONT_WEIGHTS: Record<LocationImportance, number> = {
  capital: 800,
  city:    700,
  town:    500,
  small:   400,
};

/** Px a place name moves down to its free slot when a marker or a bigger name holds its spot. */
export const LABEL_ALT_SLOT_OFFSET_PX = 14;

/**
 * The dark halo behind map labels (THR-1833 § 5): the stroke paints under the fill,
 * so only its outer half shows, as a rim around each glyph.
 */
export const LABEL_HALO: CSSProperties = {
  WebkitTextStroke: '3px var(--bg-abyss)',
  paintOrder: 'stroke fill',
};

/** Place-name ink: light on the dark halo, as in THR-1833's specimen. */
export const PLACE_LABEL_COLOR = 'var(--text-primary)';

/** The label band for a zoom, or null below regional (no place names). */
export function locationLabelBand(zoomLevel: number): LocationLabelBand | null {
  if (zoomLevel < ZOOM_THRESHOLDS.CONTINENTAL_MAX) return null;
  if (zoomLevel < ZOOM_THRESHOLDS.REGION_LABEL_MAX) return 'regionalOuter';
  if (zoomLevel < ZOOM_THRESHOLDS.REGIONAL_MAX) return 'regionalInner';
  return 'heroLocal';
}

/** A place name's px at a zoom, or null when that importance shows no name there. */
export function locationLabelFontSize(importance: LocationImportance, zoomLevel: number): number | null {
  const band = locationLabelBand(zoomLevel);
  return band ? LOCATION_LABEL_SIZES[band][importance] : null;
}

/** What the last label pass did — read by `__DEBUG.getMapChrome().labels` (THR-1899). */
export interface LabelPassStats {
  /** Wall time of the last collision pass (ms). */
  lastPassMs: number;
  /** The slowest pass seen since mount (ms). */
  maxPassMs: number;
  passes: number;
  labels: number;
  obstacles: number;
  moved: number;
  hidden: number;
}

export function emptyLabelPassStats(): LabelPassStats {
  return { lastPassMs: 0, maxPassMs: 0, passes: 0, labels: 0, obstacles: 0, moved: 0, hidden: 0 };
}

/**
 * Minimum zoom level at which location labels are rendered.
 * At continental (k < 5): icons visible but no text labels.
 * At regional+ (k >= 5): labels appear based on importance tier.
 */
export const LOCATION_MIN_ZOOM = ZOOM_THRESHOLDS.CONTINENTAL_MAX; // 5

/** Extra padding (px) between projected icon bottom and label top */
const ICON_LABEL_GAP_PX = 2;

/** Debounce interval for collision detection recomputation (ms) */
const COLLISION_DEBOUNCE_MS = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

/** Location importance tier (drives label font size and visibility). */
export type LocationImportance = 'capital' | 'city' | 'town' | 'small';

/** Input data for a single location label. */
export interface LocationLabelData {
  id: string;
  name: string;
  hexCol: number;
  hexRow: number;
  importance: LocationImportance;
  /** Raw location type — needed to compute icon position (centered vs ring) */
  locationType: string;
}

interface LocationLabelOverlayProps {
  locations: LocationLabelData[];
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  /** Read-only ref populated by RegionLabelOverlay with already-placed region label
   *  bboxes. Location labels avoid these positions (cross-system collision). */
  prePlacedBBoxesRef?: React.RefObject<ScreenBBox[]>;
  /** THR-1899: screen boxes of the map markers names must step aside for, read each pass. */
  getMarkerObstacles?: () => ScreenBBox[];
  /** THR-1899: written after each collision pass, for `__DEBUG.getMapChrome().labels`. */
  labelPassStatsRef?: React.MutableRefObject<LabelPassStats>;
}

// ── Label styles ──────────────────────────────────────────────────────────────

/** Shared base style for all location labels. */
const LABEL_BASE: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, 0)',  // Horizontally centered, positioned below icon
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 200ms ease',
  userSelect: 'none',
  fontFamily: 'var(--font-body)',
  color: PLACE_LABEL_COLOR,
  ...LABEL_HALO,
  lineHeight: '1.2',
};

// ── Visibility helpers ────────────────────────────────────────────────────────

/**
 * Determines whether a location importance tier should show a text label
 * at the given zoom level.
 *
 * Zoom tier mapping:
 * - k >= 10 (REGION_LABEL_MAX): all locations (region labels gone, room for small)
 * - k >= 5 (regional): capital, city, town (not small — region labels still present)
 * - k < 5 (continental/full-world): no text labels (icons only)
 */
function isLabelVisible(importance: LocationImportance, zoomLevel: number): boolean {
  return locationLabelFontSize(importance, zoomLevel) !== null;
}

// ── Projected label state ─────────────────────────────────────────────────────

interface ProjectedLocationLabel {
  id: string;
  name: string;
  importance: LocationImportance;
  screenX: number;
  screenY: number;
  visible: boolean;
  inViewport: boolean;
}

// ── Projection helper ────────────────────────────────────────────────────────

/** Project a location label to screen space, positioned below its icon. */
function projectLocationLabel(
  loc: LocationLabelData,
  fontSize: number,
  offsetX: number,
  offsetY: number,
  iconHalfSize: number,
  camera: THREE.OrthographicCamera,
  canvasWidth: number,
  canvasHeight: number,
  screenLabels: ScreenLabel[],
  inViewportSet: Set<string>,
): void {
  try {
    const { x, y } = hexToPixel(
      { col: loc.hexCol, row: loc.hexRow },
      HEX_CONSTANTS.HEX_SIZE,
    );
    // Icon center in world space (Three.js y-up, ring offset y is flipped)
    const iconCenterX = x + offsetX;
    const iconCenterY = -y - offsetY;
    // Label anchor = bottom of icon + gap
    const labelAnchorY = iconCenterY - iconHalfSize - 0.5;

    const vec = new THREE.Vector3(iconCenterX, labelAnchorY, 0);
    vec.project(camera);
    const sx = (vec.x + 1) / 2 * canvasWidth;
    const sy = (1 - vec.y) / 2 * canvasHeight + ICON_LABEL_GAP_PX;

    // Viewport culling — 100px margin
    const inViewport =
      sx >= -100 && sx <= canvasWidth + 100 &&
      sy >= -100 && sy <= canvasHeight + 100;

    if (inViewport) {
      screenLabels.push({
        id: loc.id,
        tier: importanceToTier(loc.importance),
        // The box is sized from what actually renders, hung below the icon (THR-1711).
        fontSize,
        anchorY: 'top',
        altSlotOffsetPx: LABEL_ALT_SLOT_OFFSET_PX,
        text: loc.name,
        screenX: sx,
        screenY: sy,
        visible: true,
      });
      inViewportSet.add(loc.id);
    }
  } catch {
    // NFP #4: skip malformed locations
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * LocationLabelOverlay — HTML div overlay positioned over the Three.js canvas.
 *
 * Position updates run in requestAnimationFrame for zero-lag tracking during pan.
 * Collision detection is debounced to avoid running every frame.
 */
export function LocationLabelOverlay({
  locations,
  cameraRef,
  canvasWidth,
  canvasHeight,
  zoomLevel,
  prePlacedBBoxesRef,
  getMarkerObstacles,
  labelPassStatsRef,
}: LocationLabelOverlayProps) {
  const [projected, setProjected] = useState<ProjectedLocationLabel[]>([]);
  const lastCollisionTime = useRef<number>(0);
  /** The last collision verdict, reapplied on the frames between recomputes (THR-1711). */
  const lastVisibleById = useRef<Map<string, LabelVerdict>>(new Map());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let running = true;

    function update() {
      if (!running) return;

      const camera = cameraRef.current;
      if (!camera) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      const now = performance.now();
      const shouldRecomputeCollision = (now - lastCollisionTime.current) >= COLLISION_DEBOUNCE_MS;

      // Filter to zoom-tier-visible locations
      const visibleLocations = locations.filter(
        loc => isLabelVisible(loc.importance, zoomLevel),
      );

      // Group by hex to replicate LocationIconMesh ring layout logic
      const hexGroups = new Map<string, LocationLabelData[]>();
      for (const loc of visibleLocations) {
        const key = `${loc.hexCol},${loc.hexRow}`;
        if (!hexGroups.has(key)) hexGroups.set(key, []);
        hexGroups.get(key)!.push(loc);
      }

      const screenLabels: ScreenLabel[] = [];
      const inViewportSet = new Set<string>();

      for (const hexLocs of hexGroups.values()) {
        // Partition centered vs ring — same logic as LocationIconMesh
        const centered: LocationLabelData[] = [];
        const ringEligible: LocationLabelData[] = [];
        for (const loc of hexLocs) {
          const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
          if (iconDef && CENTERED_SIZE_CLASSES.has(iconDef.sizeClass)) {
            centered.push(loc);
          } else {
            ringEligible.push(loc);
          }
        }
        // Sort ring-eligible by name for deterministic slot assignment (NFP #3)
        ringEligible.sort((a, b) => a.name.localeCompare(b.name));
        const ringVisible = ringEligible.slice(0, MAX_RING_LOCATIONS);

        // Process centered locations (icon at hex center)
        for (const loc of centered) {
          const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
          const iconHalfSize = iconDef
            ? HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass] / 2
            : HEX_CONSTANTS.HEX_SIZE * 0.3;
          projectLocationLabel(loc, locationLabelFontSize(loc.importance, zoomLevel) ?? 0, 0, 0, iconHalfSize, camera, canvasWidth, canvasHeight, screenLabels, inViewportSet);
        }

        // Process ring locations (icon at ring offset)
        for (let i = 0; i < ringVisible.length; i++) {
          const loc = ringVisible[i];
          const offset = getFixedSlotOffset(i, ringVisible.length, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);
          const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
          const iconHalfSize = iconDef
            ? HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass] * LOCATION_RING_SCALE_FACTOR / 2
            : HEX_CONSTANTS.HEX_SIZE * 0.15;
          projectLocationLabel(loc, locationLabelFontSize(loc.importance, zoomLevel) ?? 0, offset.x, offset.y, iconHalfSize, camera, canvasWidth, canvasHeight, screenLabels, inViewportSet);
        }
      }

      let resolvedLabels: ScreenLabel[];

      if (shouldRecomputeCollision) {
        const passStart = performance.now();
        const obstacles = getMarkerObstacles?.() ?? [];
        const prePlaced = prePlacedBBoxesRef?.current ?? [];
        resolvedLabels = removeOverlaps(
          screenLabels,
          obstacles.length > 0 ? [...prePlaced, ...obstacles] : prePlaced,
        );
        lastVisibleById.current = verdictsOf(resolvedLabels, screenLabels);
        lastCollisionTime.current = now;
        if (labelPassStatsRef) {
          const ms = performance.now() - passStart;
          const prev = labelPassStatsRef.current;
          let moved = 0;
          let hidden = 0;
          for (const l of resolvedLabels) {
            if (!l.visible) hidden++;
            else if (l.moved) moved++;
          }
          labelPassStatsRef.current = {
            lastPassMs: ms,
            maxPassMs: Math.max(prev.maxPassMs, ms),
            passes: prev.passes + 1,
            labels: resolvedLabels.length,
            obstacles: obstacles.length,
            moved,
            hidden,
          };
        }
      } else {
        // THR-1711: between recomputes, keep the last verdict instead of rendering
        // the raw all-visible list — that is what flickered clusters into piles.
        resolvedLabels = applyCachedVisibility(screenLabels, lastVisibleById.current);
      }

      const next: ProjectedLocationLabel[] = resolvedLabels.map(sl => {
        const orig = locations.find(l => l.id === sl.id);
        return {
          id: sl.id,
          name: sl.text,
          importance: orig?.importance ?? 'small',
          screenX: sl.screenX,
          screenY: sl.screenY,
          visible: sl.visible,
          inViewport: inViewportSet.has(sl.id),
        };
      });

      setProjected(next);
      rafRef.current = requestAnimationFrame(update);
    }

    rafRef.current = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  // Re-run RAF loop when locations or zoom change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, cameraRef, canvasWidth, canvasHeight, zoomLevel]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: MAP_OVERLAY_Z.LOCATION_LABELS,
        overflow: 'hidden',
      }}
    >
      {projected.map(pl => {
        if (!pl.inViewport) return null;

        const fontSize = locationLabelFontSize(pl.importance, zoomLevel) ?? LOCATION_LABEL_FONT_SIZES[pl.importance];
        const fontWeight = LOCATION_LABEL_FONT_WEIGHTS[pl.importance];
        const opacity = pl.visible ? 1 : 0;

        return (
          <div
            key={pl.id}
            style={{
              ...LABEL_BASE,
              fontSize: `${fontSize}px`,
              fontWeight,
              left: `${pl.screenX}px`,
              top: `${pl.screenY}px`,
              opacity,
              visibility: pl.visible ? 'visible' : 'hidden',
            }}
          >
            {pl.name}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps LocationImportance to the ScreenLabel tier format used by labelCollision.ts.
 * 'capital' → 'realm', 'city'/'town' → 'area', 'small' → 'river'.
 *
 * This is a compatibility shim — location labels participate in collision detection
 * with region labels but borrow the map tier whose *priority* matches their importance;
 * the words name map tiers, not what a location is. THR-1155 retargeted it when the
 * tiers became realm/area/river, and fixed a pre-existing miss on the way: 'capital'
 * returned 'barony', a tier that had not existed in the union for some time, so a
 * capital's label carried no priority at all.
 */
function importanceToTier(importance: LocationImportance): ScreenLabel['tier'] {
  switch (importance) {
    case 'capital': return 'realm';
    case 'city':    return 'area';
    case 'town':    return 'area';
    case 'small':   return 'river';
  }
}
