/**
 * Tooltip Content — resolved from content packages or ui-content.ts.
 */

/** Resolved tooltip content returned by resolveTooltip(). */
export interface TooltipContent {
  /** Primary label — short, bold, Cinzel font. */
  label: string;
  /** Optional description — longer, Inter font. May contain {{concept.id}} links. */
  desc?: string;
}

/** Tooltip placement relative to trigger element. */
export type TooltipPlacement = 'above' | 'below';

// ─── Timing Constants ────────────────────────────────────────────

/** Delay before showing tooltip on hover (ms). Prevents flash on quick sweeps. */
export const TOOLTIP_SHOW_DELAY = 200;

/** Fade-in animation duration (ms). */
export const TOOLTIP_FADE_IN = 150;

/** Fade-out animation duration (ms). */
export const TOOLTIP_FADE_OUT = 100;

/** Grace period for moving between tooltip targets without re-delay (ms). */
export const TOOLTIP_RETRIGGER_GRACE = 300;

// ─── Positioning Constants ───────────────────────────────────────

/** Flip to below if trigger is within this many px of top viewport edge. */
export const TOOLTIP_TOP_THRESHOLD = 80;

/** Shift horizontally if within this many px of left/right viewport edge. */
export const TOOLTIP_SIDE_THRESHOLD = 100;

/** Maximum tooltip width in px. */
export const TOOLTIP_MAX_WIDTH = 220;

/** Gap between tooltip and trigger element in px. */
export const TOOLTIP_OFFSET = 8;

// ─── Chain Constants ─────────────────────────────────────────────

/** Maximum depth for linked tooltip chains. */
export const TOOLTIP_MAX_CHAIN_DEPTH = 2;

/** Regex to match {{concept.id}} markers in tooltip descriptions. */
export const TOOLTIP_LINK_PATTERN = /\{\{([a-z_]+\.[a-z0-9_.]+)\}\}/g;
