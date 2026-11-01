/**
 * The 1440p layout contract — the one TS home for the layout and type tokens (THR-1819).
 *
 * `src/index.css` is authoritative for CSS consumers: its `:root` block and the
 * three `@media (min-width: …)` blocks hold every width, padding and type step.
 * This module mirrors those numbers for JS consumers (positioning maths, the
 * debug bridge, the budget test), and `__tests__/layoutContract.test.ts` fails
 * the build if the two copies disagree.
 *
 * Screens: 2560×1440 is the primary screen, 1920×1080 the supported floor,
 * 3440 wide adds width only, and below 1920 keeps the earlier behaviour
 * (Christian's 2026-10-11 ruling on THR-1823; Law 33).
 *
 * Sources for the numbers: THR-1828 (frame), THR-1827 (Inspector), THR-1829
 * (Stage), THR-1833 (type roles). Plan: Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md.
 */

/** The four screen tiers. `base` is below the supported floor. */
export type LayoutTier = 'base' | 'fhd' | 'qhd' | 'uwqhd';

/** Tier edges in CSS px. Must equal the `@media (min-width: …)` blocks in `index.css`. */
export const LAYOUT_BREAKPOINTS_PX = { fhd: 1920, qhd: 2560, uwqhd: 3440 } as const;

/** The 1440p type step-up: `@media (min-width: 2560px) and (min-height: 1200px) { html { font-size: 112.5% } }`. */
export const ROOT_FONT_STEP = { scale: 1.125, minWidthPx: 2560, minHeightPx: 1200 } as const;

/** The six type steps in rem (`--text-*`). */
export const TYPE_SCALE_REM = { xs: 1, sm: 1.125, base: 1.25, lg: 1.375, xl: 1.625, '2xl': 2 } as const;

/** The smallest readable size at 1080p — `--text-xs` at a 16 px root. */
export const TYPE_FLOOR_PX = 16;

/** The smallest size Cinzel may take (THR-1833) — `--text-lg` at a 16 px root. */
export const CINZEL_MIN_PX = 22;

/** No two adjacent type steps closer than this at a 16 px root. */
export const TYPE_MIN_STEP_PX = 2;

/** The browser default root size, and the fallback when the DOM cannot say. */
export const DEFAULT_ROOT_FONT_PX = 16;

/** Frame geometry, px, restated in every tier block of `index.css`. Keys are the CSS names. */
export interface FrameTokens {
  '--topbar-height': number;
  '--topbar-padding-x': number;
  '--topbar-gap': number;
  '--rail-left-w': number;
  '--rail-right-w': number;
  '--rail-strip-w': number;
  '--inspector-w': number;
  '--inspector-wide-w': number;
  '--inspector-full-trail-w': number;
  '--inspector-full-aside-w': number;
  '--stage-gutter': number;
  '--stage-window-w': number;
  '--stage-left-col-w': number;
  /** Dialog size tiers L and XL, the clamp gutter, SheetColumns (THR-1820). */
  '--dialog-l-w': number;
  '--dialog-xl-w': number;
  '--dialog-gutter': number;
  '--sheet-aside-w': number;
  '--sheet-gap': number;
}

export const FRAME_TOKENS_PX: Record<LayoutTier, FrameTokens> = {
  base: {
    '--topbar-height': 44,
    '--topbar-padding-x': 12,
    '--topbar-gap': 12,
    '--rail-left-w': 320,
    '--rail-right-w': 280,
    '--rail-strip-w': 56,
    '--inspector-w': 560,
    '--inspector-wide-w': 960,
    '--inspector-full-trail-w': 240,
    '--inspector-full-aside-w': 360,
    '--stage-gutter': 24,
    '--stage-window-w': 280,
    '--stage-left-col-w': 340,
    '--dialog-l-w': 1280,
    '--dialog-xl-w': 1760,
    '--dialog-gutter': 24,
    '--sheet-aside-w': 400,
    '--sheet-gap': 24,
  },
  fhd: {
    '--topbar-height': 48,
    '--topbar-padding-x': 16,
    '--topbar-gap': 16,
    '--rail-left-w': 320,
    '--rail-right-w': 340,
    '--rail-strip-w': 56,
    '--inspector-w': 560,
    '--inspector-wide-w': 960,
    '--inspector-full-trail-w': 240,
    '--inspector-full-aside-w': 360,
    '--stage-gutter': 24,
    '--stage-window-w': 280,
    '--stage-left-col-w': 340,
    '--dialog-l-w': 1280,
    '--dialog-xl-w': 1760,
    '--dialog-gutter': 24,
    '--sheet-aside-w': 400,
    '--sheet-gap': 24,
  },
  qhd: {
    '--topbar-height': 56,
    '--topbar-padding-x': 20,
    '--topbar-gap': 20,
    '--rail-left-w': 400,
    '--rail-right-w': 420,
    '--rail-strip-w': 56,
    '--inspector-w': 717,
    '--inspector-wide-w': 1280,
    '--inspector-full-trail-w': 300,
    '--inspector-full-aside-w': 440,
    '--stage-gutter': 24,
    '--stage-window-w': 520,
    '--stage-left-col-w': 560,
    '--dialog-l-w': 1600,
    '--dialog-xl-w': 2240,
    '--dialog-gutter': 32,
    '--sheet-aside-w': 480,
    '--sheet-gap': 28,
  },
  uwqhd: {
    '--topbar-height': 56,
    '--topbar-padding-x': 20,
    '--topbar-gap': 20,
    '--rail-left-w': 400,
    '--rail-right-w': 420,
    '--rail-strip-w': 56,
    '--inspector-w': 717,
    '--inspector-wide-w': 1280,
    '--inspector-full-trail-w': 300,
    '--inspector-full-aside-w': 440,
    '--stage-gutter': 24,
    // 3440 − 400 − 1400 − 48 = 1592: the Stage panel holds its 2560 size and the window takes the extra width.
    '--stage-window-w': 1400,
    '--stage-left-col-w': 560,
    '--dialog-l-w': 1600,
    '--dialog-xl-w': 2880,
    '--dialog-gutter': 32,
    '--sheet-aside-w': 480,
    '--sheet-gap': 28,
  },
};

/**
 * THR-2097 — the Inspector's person portrait width at wide and Full (`--inspector-portrait-w`),
 * in rem per tier, restated in every tier block of `index.css`.
 */
export const INSPECTOR_PORTRAIT_W_REM: Readonly<Record<LayoutTier, number>> = { base: 15, fhd: 15, qhd: 18, uwqhd: 18 };

/**
 * THR-2100 — the one Stage face width (`--stage-subject-portrait-w`), 3:4, in rem per tier,
 * restated in every tier block of `index.css`. Kill criterion: 6rem at the 1920 tier if the
 * encounter's *At stake* falls below the fold.
 */
export const STAGE_SUBJECT_PORTRAIT_W_REM: Readonly<Record<LayoutTier, number>> = { base: 8, fhd: 8, qhd: 10, uwqhd: 10 };

/**
 * THR-2101 — a dialog's subject face (ChapterView), `--dialog-subject-portrait-w`, 3:4, in rem
 * per tier, restated in every tier block of `index.css`. Kill criterion: 5rem at the 1920 tier
 * if ChapterView's prose falls below the fold.
 */
export const DIALOG_SUBJECT_PORTRAIT_W_REM: Readonly<Record<LayoutTier, number>> = { base: 7, fhd: 7, qhd: 9, uwqhd: 9 };

/** Text-container widths in rem, declared once in `:root`, so they follow the root step-up. */
export const TEXT_TOKENS_REM = {
  tooltipMaxW: 17.5,
  hovercardW: 26.25,
  toastW: 20,
  stageCompactW: 53.75,
  /** Dialog size tier S (`--dialog-s-w`, THR-1820) — 600 px at 1080p, 675 at 1440p. */
  dialogSW: 37.5,
  /** Dialog size tier M (`--dialog-m-w`, THR-1820) — 960 px at 1080p, 1080 at 1440p. */
  dialogMW: 60,
  /** The Find box (`--find-box-w`, THR-1915) — 560 px at 1080p, 630 at 1440p. */
  findBoxW: 35,
  /** `--panel-padding` at ≥1920 (1rem below). */
  panelPaddingFhd: 1.25,
} as const;

/** Story-column reading measure (`--measure-prose`), in em. */
export const MEASURE_PROSE_EM = 34;

/** The one dialog height cap (`--modal-max-h`, Law 33). */
export const MODAL_MAX_HEIGHT_VH = 85;

/** Map share floor with both rails open (THR-1828). */
export const FRAME_MAP_SHARE_MIN = 0.6;

/** Map share floor with the Inspector docked beside the god rail and the folded strip (THR-1828). */
export const FRAME_MAP_SHARE_MIN_INSPECTOR = 0.45;

/** The tier a CSS-px viewport width falls in. Non-finite widths read as `base`. */
export function layoutTierFor(widthPx: number): LayoutTier {
  if (!Number.isFinite(widthPx)) return 'base';
  if (widthPx >= LAYOUT_BREAKPOINTS_PX.uwqhd) return 'uwqhd';
  if (widthPx >= LAYOUT_BREAKPOINTS_PX.qhd) return 'qhd';
  if (widthPx >= LAYOUT_BREAKPOINTS_PX.fhd) return 'fhd';
  return 'base';
}

/**
 * The map's share of the screen: the map rectangle's area over the screen's.
 * `columnsPx` is the sum of the vertical chrome (rails, strip, Inspector).
 */
export function mapShare(screen: { w: number; h: number }, columnsPx: number, topBarPx: number): number {
  if (!(screen.w > 0) || !(screen.h > 0)) return 0;
  const mapW = Math.max(0, screen.w - columnsPx);
  const mapH = Math.max(0, screen.h - topBarPx);
  return (mapW * mapH) / (screen.w * screen.h);
}

/** The live root font size in px; 16 when the DOM cannot say (jsdom, SSR, NaN, empty). */
export function rootFontPx(): number {
  try {
    if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return DEFAULT_ROOT_FONT_PX;
    const root = document.documentElement;
    if (!root) return DEFAULT_ROOT_FONT_PX;
    const px = parseFloat(getComputedStyle(root).fontSize);
    return Number.isFinite(px) && px > 0 ? px : DEFAULT_ROOT_FONT_PX;
  } catch {
    return DEFAULT_ROOT_FONT_PX;
  }
}

/** rem → px at the live root size. Read once per positioning pass, never per frame. */
export function remToPx(rem: number): number {
  return rem * rootFontPx();
}
