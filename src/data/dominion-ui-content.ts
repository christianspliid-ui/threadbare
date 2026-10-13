/**
 * dominion-ui-content.ts — the words and tuning of Dominion on screen (THR-1750).
 *
 * Plan doc: `Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md` § Content, § Constants.
 *
 * The five band words and lines live in `dominion-content.ts` (THR-1748) and are
 * imported, never copied, so a band is told one way everywhere (PC-6). Everything
 * here is the lens, the legend, the tend line, the card chip, the cast-bar clause,
 * the hex line and the numbers that tune how the lens looks.
 *
 * NFP #1: every alpha, width, radius, cadence and duration is a named constant.
 */

import { DOMINION_BAND_WORDS, type DominionBand } from './dominion-content';

// ─── Projection ──────────────────────────────────────────────────────

/**
 * Which band a hex shows when two places are equally near: the strongest lean,
 * threats before mild ground, so a Hostile town is never hidden by a Touched one.
 */
export const DOMINION_HEX_TIE_PRIORITY = ['sovereign', 'hostile', 'held', 'touched', 'foreign'] as const satisfies readonly DominionBand[];

/** Legend chip order, best to worst. */
export const DOMINION_LEGEND_ORDER = ['sovereign', 'held', 'touched', 'foreign', 'hostile'] as const satisfies readonly DominionBand[];

/** How far a town lends its band to open land (measured: 99.4% of land within 2). */
export const DOMINION_HEX_FILL_RADIUS = 2;

/** Band recompute cadence in ticks while the lens is on (half a day). */
export const DOMINION_LENS_REFRESH_TICKS = 6;

/** Bands that count as the god's turf: the frontier runs round them. */
export const DOMINION_TURF_BANDS: readonly DominionBand[] = ['touched', 'held', 'sovereign'];

// ─── Lens look (THR-1766 mock, variant C) ────────────────────────────

/** Dim alpha per band. Sovereign and Held keep their colour; the rest darken. */
export const DOMINION_DIM_SOVEREIGN = 0;
export const DOMINION_DIM_HELD = 0;
export const DOMINION_DIM_TOUCHED = 0.15;
export const DOMINION_DIM_FOREIGN = 0.45;
export const DOMINION_DIM_HOSTILE = 0.60;
/** The dim colour: near-black, never a hue ("lightness instead of hue"). */
export const DOMINION_DIM_COLOR = '#0b0907';
/** Hostile hatch strength. */
export const DOMINION_HATCH_ALPHA = 0.12;
/** Hostile hatch spacing in texture pixels. */
export const DOMINION_HATCH_SPACING_PX = 6;
/** Sovereign glow strength — the only hue in the lens. */
export const DOMINION_GLOW_ALPHA = 0.22;
/** Frontier line half-width in world units at the regional zoom (2 px). */
export const DOMINION_FRONTIER_WIDTH = 2.0;
/** Thicker line where turf meets Hostile. */
export const DOMINION_FRONTIER_HOSTILE_WIDTH_MULT = 1.75;
/** How long a band-drop badge stays (three days at 12 ticks a day). */
export const DOMINION_DROP_BADGE_TICKS = 36;
/** Opacity of the struck "ghost" pips that show the par price on cheaper ground. */
export const DOMINION_GHOST_PIP_OPACITY = 0.35;
/** Cap on the legend card height (Law 33). */
export const DOMINION_LEGEND_MAX_HEIGHT_PX = 180;

/** Dim alpha by band — the lookup the dim mesh reads. */
export const DOMINION_DIM_BY_BAND: Readonly<Record<DominionBand, number>> = {
  sovereign: DOMINION_DIM_SOVEREIGN,
  held: DOMINION_DIM_HELD,
  touched: DOMINION_DIM_TOUCHED,
  foreign: DOMINION_DIM_FOREIGN,
  hostile: DOMINION_DIM_HOSTILE,
};

// ─── Words ───────────────────────────────────────────────────────────

export const DOMINION_LENS_LABEL = 'Dominion';
export const DOMINION_LENS_KEY_HINT = '1';
/** Header on the place, faction and artifact box, and the mortal-sheet row label. */
export const DOMINION_BOX_HEADER = 'Dominion';

export const DOMINION_LEGEND_LINES: readonly string[] = [
  'Your ground keeps its colour.',
  'Dimmed ground is not yours; darker is turned against you.',
  'The gold line is your frontier.',
];

/** Who holds the ground (§ Decided 4) — built from `isTended`, never a direction. */
export const DOMINION_TEND_LINES = {
  seat: 'Tended by your seat.',
  claim: 'Tended by your Claim.',
  mortal: 'Tended by {name}.',
  faction: 'Tended by {faction}.',
  /** A `{name}` / `{faction}` slot with no name to fill (PC-3: never a raw slot). */
  unnamed: 'Tended by one of yours.',
  /** Touched or better, nobody tending: what will happen on its own (PC-4). */
  untended: 'Left untended, it will slip back.',
} as const;

/** The card chip after the pips. Foreign has none (Law 56: a chip shows only a change). */
export const DOMINION_CHIP_WORDS: Readonly<Partial<Record<DominionBand, string>>> = {
  sovereign: `${DOMINION_BAND_WORDS.sovereign} · cheaper here`,
  held: `${DOMINION_BAND_WORDS.held} · cheaper here`,
  touched: `${DOMINION_BAND_WORDS.touched} · cheaper here`,
  hostile: `${DOMINION_BAND_WORDS.hostile} · dearer here`,
};

/**
 * The cast-bar clause. Touched moves odds by only +0.03 (`DOMINION_SPHERE_FACTOR`),
 * so its clause names only the price — the words stay true to the effect (PC-6).
 */
export const DOMINION_CAST_CLAUSE: Readonly<Partial<Record<DominionBand, string>>> = {
  sovereign: 'Sovereign ground: cheapest, likeliest',
  held: 'Held ground: a little cheaper, a little likelier',
  touched: 'Touched ground: a little cheaper',
  hostile: 'Hostile ground: dearer, and less likely',
};

/** The hex-tooltip line while the lens is on. */
export const DOMINION_HEX_LINE = {
  byPlace: '{band} ground, by {place}',
  terrain: '{band} ground',
} as const;

// ─── Tooltip ids (UI_TOOLTIPS, Law 17) ───────────────────────────────

export const DOMINION_TOOLTIP_IDS = {
  term: 'ui.dominion',
  lens: 'ui.dominion.lens',
  chip: 'ui.dominion.chip',
  drop: 'ui.dominion.drop',
} as const;

/** `ui.dominion.<band>` — each band word's tooltip is its line. */
export function dominionBandTooltipId(band: DominionBand): string {
  return `ui.dominion.${band}`;
}
