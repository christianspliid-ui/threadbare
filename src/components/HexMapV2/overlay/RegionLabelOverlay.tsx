/**
 * RegionLabelOverlay.tsx — HTML label overlay for the Three.js hex map canvas.
 *
 * Renders region names (kingdom, barony, geographic feature, river) as positioned
 * <div> elements over the canvas using camera.project() for world→screen mapping.
 *
 * Features:
 * - Zoom-tier filtering: labels appear only at appropriate zoom levels
 * - AABB collision detection: lower-priority labels hidden when they overlap higher-priority ones
 * - CSS opacity transitions for smooth fade in/out on zoom tier changes
 * - Dark text with light halo (cartographic Mystara style)
 * - pointer-events: none throughout — labels are display-only
 *
 * NFP #1 Tunability: All zoom thresholds are named constants.
 * NFP #4 Fail-soft: Renders nothing if camera is not available.
 * NFP #7 Performance: RAF-driven position updates, debounced collision detection.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';
import type { RegionLabel } from '../../../engine/regionTypes';
import { removeOverlaps, estimateBBox, type ScreenLabel, type ScreenBBox } from './labelCollision';
import { getActivePalette, buildLandHalo, buildRiverHalo } from '../palette/activePalette';

// ─── Zoom tier thresholds (NFP #1: Tunability) ───────────────────────────────

/**
 * Zoom level boundaries for label tier visibility.
 *
 * Mapping to approximate visual scales:
 *   Full-world:   zoomLevel < 1.5  (~10px/hex)
 *   Continental:  1.5 <= zoom < 5  (~30px/hex)
 *   Regional:     5 <= zoom < 15   (~100px/hex)
 *   Hero-local:   zoom >= 15       (~300px/hex)
 */
export const ZOOM_THRESHOLDS = {
  FULL_WORLD_MAX: 1.5,
  CONTINENTAL_MAX: 5,
  REGIONAL_MAX: 15,
  /** Zoom level at which region labels give way to location labels.
   *  At this zoom, individual locations dominate and region names are clutter. */
  REGION_LABEL_MAX: 10,
} as const;

/** Debounce interval for collision detection recomputation (ms) */
const COLLISION_DEBOUNCE_MS = 60;

// ─── Label style definitions (per UI-SPEC.md) ─────────────────────────────────

/** Halo text-shadows — built from active palette theme */
const LAND_HALO = buildLandHalo();
const RIVER_HALO = buildRiverHalo();

/** Shared positioning and transition properties for all label tiers */
const LABEL_BASE: CSSProperties = {
  position: 'absolute',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity 200ms ease',
  userSelect: 'none',
};

const palette = getActivePalette();

const KINGDOM_STYLE: CSSProperties = {
  ...LABEL_BASE,
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: palette.labelLandColor,
  textShadow: LAND_HALO,
  lineHeight: '1.1',
};

const BARONY_STYLE: CSSProperties = {
  ...LABEL_BASE,
  fontFamily: 'var(--font-display)',
  fontSize: '14px',
  fontWeight: 400,
  color: palette.labelLandColor,
  textShadow: LAND_HALO,
  lineHeight: '1.2',
};

const GEOGRAPHIC_STYLE: CSSProperties = {
  ...LABEL_BASE,
  fontFamily: 'var(--font-display)',
  fontSize: '12px',
  fontWeight: 400,
  fontStyle: 'italic',
  color: palette.labelLandColor,
  textShadow: LAND_HALO,
  lineHeight: '1.2',
};

const RIVER_STYLE: CSSProperties = {
  ...LABEL_BASE,
  fontFamily: 'var(--font-display)',
  fontSize: '12px',
  fontWeight: 400,
  fontStyle: 'italic',
  color: palette.labelRiverColor,
  textShadow: RIVER_HALO,
  lineHeight: '1.2',
};

const TIER_STYLES: Record<RegionLabel['tier'], CSSProperties> = {
  kingdom: KINGDOM_STYLE,
  barony: BARONY_STYLE,
  geographic: GEOGRAPHIC_STYLE,
  river: RIVER_STYLE,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fraction of province width that the label text should span at continental zoom */
const PROVINCE_LABEL_WIDTH_FRACTION = 0.5;

/** Approximate character width as fraction of font size (for font scaling calc) */
const LABEL_CHAR_WIDTH = 0.6;

/** Base font sizes per tier (px) — used as minimum; scaled up to fill province width */
const TIER_BASE_FONT_SIZE: Record<RegionLabel['tier'], number> = {
  kingdom: 20,
  barony: 14,
  geographic: 12,
  river: 12,
};

/** Maximum font size cap (px) — prevent labels from becoming absurdly large */
const MAX_SCALED_FONT_SIZE = 60;

/** Convert a world label to a ScreenLabel using the camera's projection. */
function projectLabel(
  label: RegionLabel,
  camera: THREE.OrthographicCamera,
  canvasWidth: number,
  canvasHeight: number,
): ScreenLabel | null {
  try {
    const vec = new THREE.Vector3(label.worldX, label.worldY, 0);
    vec.project(camera);
    const sx = (vec.x + 1) / 2 * canvasWidth;
    const sy = (1 - vec.y) / 2 * canvasHeight;

    // Compute screen-space province width if worldWidth is available
    let screenWidth: number | undefined;
    if (label.worldWidth && label.worldWidth > 0) {
      const left = new THREE.Vector3(label.worldX - label.worldWidth / 2, label.worldY, 0);
      const right = new THREE.Vector3(label.worldX + label.worldWidth / 2, label.worldY, 0);
      left.project(camera);
      right.project(camera);
      screenWidth = ((right.x - left.x) / 2) * canvasWidth; // NDC to pixels
    }

    return {
      id: label.id,
      tier: label.tier,
      text: label.text,
      screenX: sx,
      screenY: sy,
      visible: true,
      screenWidth,
    };
  } catch {
    return null;
  }
}

/**
 * Determines whether a label tier is visible at the given zoom level.
 *
 * Region labels fade out at REGION_LABEL_MAX (k=10) to avoid overlapping
 * with location labels at higher zoom levels. Previously this was REGIONAL_MAX (k=15)
 * but MAX_ZOOM was bumped from 10→15, creating a k=10-15 band where both
 * region and location labels rendered with independent collision detection.
 *
 * Zoom tier mapping:
 * - Kingdom: continental + lower regional (zoomLevel < 10)
 * - Barony: continental + lower regional (1.5 <= zoom < 10)
 * - Geographic: lower regional only (5 <= zoom < 10)
 * - River: lower regional only (5 <= zoom < 10)
 */
function isTierVisible(tier: RegionLabel['tier'], zoomLevel: number): boolean {
  switch (tier) {
    case 'kingdom':
      // Visible at continental and lower regional
      return zoomLevel < ZOOM_THRESHOLDS.REGION_LABEL_MAX;
    case 'barony':
      // Visible at continental and lower regional (not full-world)
      return zoomLevel >= ZOOM_THRESHOLDS.FULL_WORLD_MAX && zoomLevel < ZOOM_THRESHOLDS.REGION_LABEL_MAX;
    case 'geographic':
    case 'river':
      // Visible at lower regional only
      return zoomLevel >= ZOOM_THRESHOLDS.CONTINENTAL_MAX && zoomLevel < ZOOM_THRESHOLDS.REGION_LABEL_MAX;
  }
}

/** Apply title case to a string (NFP #4: fail-soft for undefined/null text) */
function toTitleCase(text: string): string {
  if (!text) return '';
  return text.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/** Apply display text transform per tier */
function displayText(label: RegionLabel): string {
  // Kingdom: uppercase handled by CSS textTransform: 'uppercase'
  // Barony: title case
  // Geographic: title case (sentence-case visually via italic)
  // River: title case with River suffix
  if (label.tier === 'kingdom') return label.text;
  return toTitleCase(label.text);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegionLabelOverlayProps {
  labels: RegionLabel[];
  cameraRef: React.RefObject<THREE.OrthographicCamera | null>;
  canvasWidth: number;
  canvasHeight: number;
  zoomLevel: number;
  /** Mutable ref that receives the bboxes of all visible (placed) region labels after
   *  each collision run. LocationLabelOverlay reads this to avoid overlapping with
   *  region labels (cross-system collision detection). */
  placedBBoxesRef?: React.MutableRefObject<ScreenBBox[]>;
}

// ─── Projected label state ────────────────────────────────────────────────────

interface ProjectedLabel {
  id: string;
  tier: RegionLabel['tier'];
  text: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  inViewport: boolean;
  /** Screen-space province width for letter-spacing at continental zoom */
  screenWidth?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RegionLabelOverlay — HTML div overlay positioned over the Three.js canvas.
 *
 * Position updates run in requestAnimationFrame for zero-lag tracking during pan.
 * Collision detection is debounced to avoid running every frame.
 */
export function RegionLabelOverlay({
  labels,
  cameraRef,
  canvasWidth,
  canvasHeight,
  zoomLevel,
  placedBBoxesRef,
}: RegionLabelOverlayProps) {
  const [projected, setProjected] = useState<ProjectedLabel[]>([]);
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

      // Project all labels to screen space
      // Filter to zoom-tier-visible labels first
      const tierVisibleLabels = labels.filter(l => isTierVisible(l.tier, zoomLevel));

      const screenLabels: ScreenLabel[] = [];
      const inViewportSet = new Set<string>();

      for (const label of tierVisibleLabels) {
        const sl = projectLabel(label, camera, canvasWidth, canvasHeight);
        if (!sl) continue;

        // Viewport culling — 100px margin for labels partially at edge
        const inViewport =
          sl.screenX >= -100 && sl.screenX <= canvasWidth + 100 &&
          sl.screenY >= -100 && sl.screenY <= canvasHeight + 100;

        if (inViewport) {
          screenLabels.push(sl);
          inViewportSet.add(label.id);
        }
      }

      let resolvedLabels: ScreenLabel[] = screenLabels;

      if (shouldRecomputeCollision) {
        resolvedLabels = removeOverlaps(screenLabels);
        lastCollisionTime.current = now;
        // Publish placed bboxes for cross-system collision (LocationLabelOverlay reads this)
        if (placedBBoxesRef) {
          placedBBoxesRef.current = resolvedLabels
            .filter(sl => sl.visible)
            .map(sl => estimateBBox(sl));
        }
      }

      // Build projected state
      const next: ProjectedLabel[] = resolvedLabels.map(sl => ({
        id: sl.id,
        tier: sl.tier,
        text: sl.text,
        screenX: sl.screenX,
        screenY: sl.screenY,
        visible: sl.visible,
        inViewport: inViewportSet.has(sl.id),
        screenWidth: sl.screenWidth,
      }));

      setProjected(next);

      rafRef.current = requestAnimationFrame(update);
    }

    rafRef.current = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  // Re-run RAF loop when labels or zoom change (new labels or visibility thresholds change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, cameraRef, canvasWidth, canvasHeight, zoomLevel]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {projected.map(pl => {
        const baseLabel = labels.find(l => l.id === pl.id);
        if (!baseLabel) return null;

        // Labels outside viewport: display none (perf skip — no transition needed)
        if (!pl.inViewport) return null;

        const tierStyle = TIER_STYLES[pl.tier];
        const opacity = pl.visible ? 1 : 0;

        // At continental zoom (k < 5), scale font size so text fills ~50% of province width
        let scaledFontSize: number | undefined;
        if (zoomLevel < ZOOM_THRESHOLDS.CONTINENTAL_MAX && pl.screenWidth && pl.text.length > 0) {
          const baseFontSize = TIER_BASE_FONT_SIZE[pl.tier];
          const targetWidth = pl.screenWidth * PROVINCE_LABEL_WIDTH_FRACTION;
          // fontSize that makes text.length * fontSize * CHAR_WIDTH = targetWidth
          const needed = targetWidth / (pl.text.length * LABEL_CHAR_WIDTH);
          if (needed > baseFontSize) {
            scaledFontSize = Math.min(needed, MAX_SCALED_FONT_SIZE);
          }
        }

        return (
          <div
            key={pl.id}
            style={{
              ...tierStyle,
              left: `${pl.screenX}px`,
              top: `${pl.screenY}px`,
              opacity,
              // Collision-hidden labels: visibility hidden (preserves DOM, stable rendering)
              visibility: pl.visible ? 'visible' : 'hidden',
              ...(scaledFontSize ? { fontSize: `${scaledFontSize}px` } : {}),
            }}
          >
            {displayText(baseLabel)}
          </div>
        );
      })}
    </div>
  );
}
