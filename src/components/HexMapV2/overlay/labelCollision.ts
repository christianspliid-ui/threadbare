/**
 * labelCollision.ts — AABB collision detection for HTML label overlay.
 *
 * Implements screen-space axis-aligned bounding box (AABB) sweep to determine
 * which labels to show when they would overlap. Higher-priority labels (kingdom)
 * win over lower-priority labels (barony, geographic, river).
 *
 * NFP #1 Tunability: Font size estimates and priority order are named constants.
 * NFP #4 Fail-soft: Returns empty array on empty input, never throws.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenLabel {
  id: string;
  tier: 'kingdom' | 'barony' | 'geographic' | 'river';
  text: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  /** Screen-space width of the province/region (pixels), for letter-spacing calc */
  screenWidth?: number;
}

export interface ScreenBBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// ─── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/**
 * Approximate font sizes per tier for bounding box estimation.
 * Should match the actual rendered sizes in RegionLabelOverlay.tsx.
 */
const TIER_FONT_SIZE: Record<ScreenLabel['tier'], number> = {
  kingdom: 20,
  barony: 14,
  geographic: 12,
  river: 12,
};

/** Char width as fraction of font size — approximation for Cinzel display font.
 * Increased from 0.6 to account for letter-spacing: 0.08em and actual glyph widths. */
const CHAR_WIDTH_FACTOR = 0.72;

/** Line height factor for bbox height estimation */
const LINE_HEIGHT_FACTOR = 1.4;

/** Extra padding (px) added to each side of every label bbox.
 * Prevents labels from appearing to visually touch even when technically non-overlapping. */
const BBOX_PADDING_PX = 8;

/**
 * Collision priority: lower number = higher priority = placed first.
 * kingdom wins over barony wins over geographic wins over river.
 */
const TIER_PRIORITY: Record<ScreenLabel['tier'], number> = {
  kingdom: 0,
  barony: 1,
  geographic: 2,
  river: 3,
};

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Estimates the screen-space bounding box for a label.
 * Centered on (screenX, screenY).
 *
 * Uses character-count × approximate char-width for width estimation.
 * This is intentionally approximate — the goal is to prevent overlaps,
 * not to match exact browser text metrics.
 */
export function estimateBBox(label: ScreenLabel): ScreenBBox {
  const fontSize = TIER_FONT_SIZE[label.tier];
  const charWidth = fontSize * CHAR_WIDTH_FACTOR;
  let width = label.text.length * charWidth;
  let height = fontSize * LINE_HEIGHT_FACTOR;
  // If screenWidth is set (province width for scaled font), use the wider/taller estimate
  if (label.screenWidth) {
    const scaledWidth = label.screenWidth * 0.5; // 50% of province width
    if (scaledWidth > width) {
      const scale = scaledWidth / width;
      width = scaledWidth;
      height = height * scale; // font size scales proportionally
    }
  }
  return {
    left: label.screenX - width / 2 - BBOX_PADDING_PX,
    top: label.screenY - height / 2 - BBOX_PADDING_PX,
    right: label.screenX + width / 2 + BBOX_PADDING_PX,
    bottom: label.screenY + height / 2 + BBOX_PADDING_PX,
  };
}

/** True if two AABBs overlap (touching edges count as non-overlap). */
function intersects(a: ScreenBBox, b: ScreenBBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Removes overlapping labels by hiding lower-priority ones.
 *
 * Algorithm:
 * 1. Sort all labels by tier priority (kingdom first, river last).
 * 2. Sweep in priority order: place each label's bbox if it doesn't overlap any already-placed bbox.
 *    Otherwise mark it hidden.
 * 3. Return all labels with updated visible flag.
 *
 * @param labels - Labels to place.
 * @param prePlaced - Optional bboxes already occupied by a higher-priority system
 *   (e.g. region labels pre-placed before location labels run). These are treated
 *   as immovable obstacles but are NOT returned in the output.
 *
 * Time complexity: O(n²) — acceptable for the small number of labels on screen (< 200 at any zoom level).
 *
 * NFP #4 Fail-soft: Returns empty array for empty input.
 */
export function removeOverlaps(labels: ScreenLabel[], prePlaced: ScreenBBox[] = []): ScreenLabel[] {
  if (labels.length === 0) return [];

  // Sort by priority ascending (kingdom=0 placed first)
  const sorted = [...labels].sort(
    (a, b) => TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier],
  );

  // Seed with pre-placed bboxes from higher-priority systems (e.g. region labels)
  const placed: ScreenBBox[] = [...prePlaced];
  const result: ScreenLabel[] = [];

  for (const label of sorted) {
    const bbox = estimateBBox(label);
    const hasOverlap = placed.some(p => intersects(bbox, p));
    if (!hasOverlap) {
      placed.push(bbox);
      result.push({ ...label, visible: true });
    } else {
      result.push({ ...label, visible: false });
    }
  }

  return result;
}
