/**
 * borderInk.ts — a Realm's border in its holder's ink (THR-1902, THR-1878 plan § D12;
 * look decided in THR-1831 § 5).
 *
 * The ink of a border edge is the holder's heraldic colour, mixed toward the shadow
 * tone of the terrain on the Realm's side of the edge. Two colours are reserved and
 * never appear in border ink (UI Law 10): the doom red, which means trouble, and the
 * Dominion frontier gold, which means the god's own. A heraldic colour that would read
 * as either is remapped before it is mixed, and `borderInk.test.ts` checks every
 * heraldic colour against every terrain colour of every palette.
 *
 * Pure — no THREE scene objects, no graph. Colours are `#RRGGBB` in, `[r, g, b]` floats
 * (sRGB, 0–1) out, the same convention `getHexColor` uses.
 *
 * NFP #1 Tunability: every number is in BORDER_INK.
 * NFP #3 Determinism: same holder index and terrain colour → same ink.
 * NFP #4 Fail-soft: a missing holder, a malformed colour or an unmapped reserved hue
 * draws the palette's unheld ink, never throws.
 */
import { FACTION_HERALDIC_COLORS } from '../agents/agentSpriteTypes';
import { hexToThreeColor } from '../palette/colorUtils';

// ─── Constants (NFP #1) ──────────────────────────────────────────────────────

export const BORDER_INK = {
  /** How far the holder's colour is mixed toward the terrain's shadow (0 = pure heraldic). */
  SHADOW_MIX: 0.4,
  /** The terrain's shadow tone: its palette colour × this. */
  TERRAIN_SHADE: 0.5,
  /** Border opacity (was 0.7 for the single red ink). */
  OPACITY: 0.45,
  /** Full border width in world units (was 1.5). */
  WIDTH: 1.0,
  /** A heraldic hue this close to a reserved hue (degrees) is remapped. */
  MIN_HUE_DISTANCE_DEG: 30,
  /** Below this HSL saturation a colour reads as neutral, not as red or gold. */
  NEUTRAL_SAT: 0.25,
} as const;

/** The doom red — `--forecast-doomed-rgb` (232 64 56). Trouble, threat and doom. */
export const RESERVED_DOOM_RED = '#e84038';
/** The Dominion frontier gold (UI Law 10). */
export const RESERVED_DOMINION_GOLD = '#d4a040';

/**
 * Heraldic colours that read as doom red or Dominion gold, and what border ink draws
 * instead. Red and orange read as the reserved colours directly; magenta sits 33° from
 * the doom red and drifts inside 30° once mixed toward warm terrain (the test found it).
 * Agent rings and army banners keep the original heraldic colour — only the border
 * ink, which covers whole frontiers, is held off the reserved hues.
 */
export const BORDER_INK_REMAP: Readonly<Record<string, string>> = {
  '#e53e3e': '#2f855a', // red     → forest green
  '#d53f8c': '#6b2c91', // magenta → plum
  '#dd6b20': '#434190', // orange  → indigo
};

// ─── Colour maths ────────────────────────────────────────────────────────────

export type Rgb = [number, number, number];

/** HSL of an sRGB triple: hue in degrees [0, 360), saturation and lightness in [0, 1]. */
export function rgbToHsl([r, g, b]: Rgb): { h: number; s: number; l: number } {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

/** Shortest distance between two hues, in degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

/**
 * The reserved colour this ink would read as, or null when it reads as neither.
 * A colour below NEUTRAL_SAT is neutral and never reads as red or gold.
 */
export function reservedHueClash(rgb: Rgb): 'doom red' | 'Dominion gold' | null {
  const { h, s } = rgbToHsl(rgb);
  if (s < BORDER_INK.NEUTRAL_SAT) return null;
  if (hueDistance(h, rgbToHsl(hexToThreeColor(RESERVED_DOOM_RED)).h) < BORDER_INK.MIN_HUE_DISTANCE_DEG) return 'doom red';
  if (hueDistance(h, rgbToHsl(hexToThreeColor(RESERVED_DOMINION_GOLD)).h) < BORDER_INK.MIN_HUE_DISTANCE_DEG) return 'Dominion gold';
  return null;
}

// ─── Resolution ──────────────────────────────────────────────────────────────

/**
 * The heraldic colour border ink starts from for a holder index, after the remap.
 * Null for no holder (-1, or an index the palette cannot resolve).
 */
export function holderHeraldicInk(factionIndex: number): string | null {
  if (!Number.isInteger(factionIndex) || factionIndex < 0) return null;
  const heraldic = FACTION_HERALDIC_COLORS[factionIndex % FACTION_HERALDIC_COLORS.length];
  if (!heraldic) return null;
  return BORDER_INK_REMAP[heraldic.toLowerCase()] ?? heraldic;
}

/**
 * The ink of one border edge: the holder's (remapped) colour mixed SHADOW_MIX toward
 * the shadow of the terrain on the holder's side.
 *
 * @param heraldic - `holderHeraldicInk(...)`, or null for an unheld Realm
 * @param terrainRgb - the palette colour of the Realm's hex at the edge (sRGB floats)
 * @param unheldInk - the palette's `borderInkUnheld` (`#RRGGBB`)
 */
export function resolveBorderInk(heraldic: string | null, terrainRgb: Rgb, unheldInk: string): Rgb {
  if (!heraldic) return hexToThreeColor(unheldInk);
  const base = hexToThreeColor(heraldic);
  const mix = BORDER_INK.SHADOW_MIX;
  const shade = BORDER_INK.TERRAIN_SHADE;
  const ink: Rgb = [
    base[0] * (1 - mix) + terrainRgb[0] * shade * mix,
    base[1] * (1 - mix) + terrainRgb[1] * shade * mix,
    base[2] * (1 - mix) + terrainRgb[2] * shade * mix,
  ];
  // A remap missed a new heraldic colour → neutral, never a reserved hue (fail-soft).
  return reservedHueClash(ink) ? hexToThreeColor(unheldInk) : ink;
}

/** `#RRGGBB` of an sRGB triple — for capital rings and debug output. */
export function rgbToHex([r, g, b]: Rgb): string {
  const c = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** The ink a Realm's seat marker and capital ring take: the holder's colour on neutral ground. */
export function capitalInk(factionIndex: number, unheldInk: string): string {
  const heraldic = holderHeraldicInk(factionIndex);
  return heraldic ?? unheldInk;
}
