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
import { HEX_CONSTANTS } from '../scene/HexFillMesh';
import { ZOOM_THRESHOLDS } from './RegionLabelOverlay';
import { removeOverlaps, type ScreenLabel } from './labelCollision';

// ── NFP #1: Tunable constants ─────────────────────────────────────────────────

/**
 * Font sizes (px) per location importance tier.
 * Per UI-SPEC: capital=13, city/town=11, small=9.
 */
export const LOCATION_LABEL_FONT_SIZES: Record<LocationImportance, number> = {
  capital: 13,
  city:    11,
  town:    11,
  small:   9,
};

/**
 * Font weights per location importance tier.
 * Capital uses bold (700); others use regular (400).
 */
export const LOCATION_LABEL_FONT_WEIGHTS: Record<LocationImportance, number> = {
  capital: 700,
  city:    400,
  town:    400,
  small:   400,
};

/**
 * Minimum zoom level at which location labels are rendered.
 * At continental (k < 5): icons visible but no text labels.
 * At regional+ (k >= 5): labels appear based on importance tier.
 */
export const LOCATION_MIN_ZOOM = ZOOM_THRESHOLDS.CONTINENTAL_MAX; // 5

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
}

interface LocationLabelOverlayProps {
  locations: LocationLabelData[];
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
}

// ── Label styles ──────────────────────────────────────────────────────────────

/** Shared halo text-shadow for location labels (identical to LAND_HALO in RegionLabelOverlay) */
const LAND_HALO = [
  '1px 0 0 rgba(240,235,220,0.9)',
  '-1px 0 0 rgba(240,235,220,0.9)',
  '0 1px 0 rgba(240,235,220,0.9)',
  '0 -1px 0 rgba(240,235,220,0.9)',
  '2px 0 0 rgba(240,235,220,0.6)',
  '-2px 0 0 rgba(240,235,220,0.6)',
].join(', ');

/** Shared base style for all location labels. */
const LABEL_BASE: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, 0)',  // Horizontally centered, positioned below icon
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 200ms ease',
  userSelect: 'none',
  fontFamily: 'var(--font-display)',
  color: '#1a1a1a',
  textShadow: LAND_HALO,
  lineHeight: '1.2',
};

// ── Visibility helpers ────────────────────────────────────────────────────────

/**
 * Determines whether a location importance tier should show a text label
 * at the given zoom level.
 *
 * Zoom tier mapping per UI-SPEC:
 * - hero-local (k >= 15): all locations
 * - regional (5 <= k < 15): capital, city, town (not small)
 * - continental (1.5 <= k < 5): no text labels (icons only)
 * - full-world (k < 1.5): nothing
 */
function isLabelVisible(importance: LocationImportance, zoomLevel: number): boolean {
  // Below regional: no text labels
  if (zoomLevel < ZOOM_THRESHOLDS.CONTINENTAL_MAX) return false;
  // Regional: capital, city, town visible; small hidden
  if (zoomLevel < ZOOM_THRESHOLDS.REGIONAL_MAX) {
    return importance !== 'small';
  }
  // Hero-local: all visible
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

      const screenLabels: ScreenLabel[] = [];
      const inViewportSet = new Set<string>();

      for (const loc of visibleLocations) {
        try {
          const { x, y } = hexToPixel(
            { col: loc.hexCol, row: loc.hexRow },
            HEX_CONSTANTS.HEX_SIZE,
          );
          const vec = new THREE.Vector3(x, -y, 0);
          vec.project(camera);
          const sx = (vec.x + 1) / 2 * canvasWidth;
          // Offset 4px below the icon center (icon is roughly half a hex size tall)
          const sy = (1 - vec.y) / 2 * canvasHeight + 4;

          // Viewport culling — 100px margin for labels partially at edge
          const inViewport =
            sx >= -100 && sx <= canvasWidth + 100 &&
            sy >= -100 && sy <= canvasHeight + 100;

          if (inViewport) {
            const sl: ScreenLabel = {
              id: loc.id,
              tier: importanceToTier(loc.importance),
              text: loc.name,
              screenX: sx,
              screenY: sy,
              visible: true,
            };
            screenLabels.push(sl);
            inViewportSet.add(loc.id);
          }
        } catch {
          // NFP #4: skip malformed locations
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
