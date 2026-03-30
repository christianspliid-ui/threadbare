/**
 * LocationLabelOverlay.tsx — HTML label overlay for location icons on the hex map.
 *
 * Renders location name labels as positioned <div> elements over the canvas using
 * camera.project() for world→screen mapping. Follows the RegionLabelOverlay pattern.
 *
 * Features:
 * - Importance-based font sizing: capital 13px/700, city/town 11px/400, small 9px/400
 * - White halo text-shadow for legibility over varied terrain
 * - Zoom-tier visibility: all tiers at regional+, capital-only at continental
 * - Collision detection via removeOverlaps (debounced)
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
import { removeOverlaps, type ScreenLabel } from './labelCollision';
import { getActivePalette, buildLandHalo } from '../palette/activePalette';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/**
 * Font sizes (px) per location importance tier.
 * capital=16, city/town=13, small=11.
 */
export const LOCATION_LABEL_FONT_SIZES: Record<LocationImportance, number> = {
  capital: 16,
  city:    13,
  town:    13,
  small:   11,
};

/**
 * Font weights per location importance tier.
 * All tiers use bold (700).
 */
export const LOCATION_LABEL_FONT_WEIGHTS: Record<LocationImportance, number> = {
  capital: 700,
  city:    700,
  town:    700,
  small:   700,
};

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
}

// ── Label styles ──────────────────────────────────────────────────────────────

/** Halo text-shadow — built from active palette theme */
const LAND_HALO = buildLandHalo();

/** Shared base style for all location labels. */
const LABEL_BASE: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, 0)',  // Horizontally centered, positioned below icon
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 200ms ease',
  userSelect: 'none',
  fontFamily: 'var(--font-display)',
  color: getActivePalette().labelLocationColor,
  textShadow: LAND_HALO,
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
  // Below regional: no text labels
  if (zoomLevel < ZOOM_THRESHOLDS.CONTINENTAL_MAX) return false;
  // Lower regional (region labels still showing): hide small
  if (zoomLevel < ZOOM_THRESHOLDS.REGION_LABEL_MAX) {
    return importance !== 'small';
  }
  // Upper regional + hero-local (region labels gone): all visible
  return true;
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
}: LocationLabelOverlayProps) {
  const [projected, setProjected] = useState<ProjectedLocationLabel[]>([]);
  const lastCollisionTime = useRef<number>(0);
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
          projectLocationLabel(loc, 0, 0, iconHalfSize, camera, canvasWidth, canvasHeight, screenLabels, inViewportSet);
        }

        // Process ring locations (icon at ring offset)
        for (let i = 0; i < ringVisible.length; i++) {
          const loc = ringVisible[i];
          const offset = getFixedSlotOffset(i, ringVisible.length, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);
          const iconDef = LOCATION_ICON_REGISTRY[loc.locationType as keyof typeof LOCATION_ICON_REGISTRY];
          const iconHalfSize = iconDef
            ? HEX_CONSTANTS.HEX_SIZE * LOCATION_SIZE_SCALE[iconDef.sizeClass] * LOCATION_RING_SCALE_FACTOR / 2
            : HEX_CONSTANTS.HEX_SIZE * 0.15;
          projectLocationLabel(loc, offset.x, offset.y, iconHalfSize, camera, canvasWidth, canvasHeight, screenLabels, inViewportSet);
        }
      }

      let resolvedLabels: ScreenLabel[] = screenLabels;

      if (shouldRecomputeCollision) {
        resolvedLabels = removeOverlaps(screenLabels);
        lastCollisionTime.current = now;
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
        zIndex: 21,
        overflow: 'hidden',
      }}
    >
      {projected.map(pl => {
        if (!pl.inViewport) return null;

        const fontSize = LOCATION_LABEL_FONT_SIZES[pl.importance];
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
 * 'capital' → 'barony' (similar priority), 'city'/'town'/'small' → 'geographic'.
 *
 * This is a compatibility shim — location labels participate in collision detection
 * with region labels but use the closest available tier for priority ordering.
 */
function importanceToTier(importance: LocationImportance): ScreenLabel['tier'] {
  switch (importance) {
    case 'capital': return 'barony';
    case 'city':    return 'geographic';
    case 'town':    return 'geographic';
    case 'small':   return 'river';
  }
}
