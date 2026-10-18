/**
 * lensInk — one ink per lens mark tone (THR-1878 plan § D3, D4; THR-1830 "one ink per lens").
 *
 * The legend's swatches and the lens layer's marks read the same table, so a legend
 * cannot show a colour the map does not draw (Law 12). Court tones are the thread
 * colours the plain map already draws (`THREAD_COLORS`); the Lenses II tones are the
 * doom red, the caravan gold and the threat red.
 *
 * NFP #1: retune a tone here.
 */
import type { LensMarkTone } from '../../../engine/views/lenses/lensTypes';
import type { MarkerInk } from '../../../data/map-markers';
import { THREAD_COLORS } from './ThreadLineMesh';
import { TRADE_ROUTE_COLOR, TRADE_ROUTE_THREATENED_COLOR } from './TradeRouteMesh';
import { FIELD_BATTLE_COLOR, SIEGE_COLOR } from './BattleIndicatorLayer';

export const LENS_TONE_COLORS: Readonly<Record<LensMarkTone, string>> = {
  first: THREAD_COLORS.the_first,
  retinue: THREAD_COLORS.retinue,
  watched: THREAD_COLORS.watched,
  /** `--forecast-doomed-rgb` (232 64 56). */
  trouble: '#e84038',
  /** The road's own colours (TradeRouteMesh), so the legend and the road agree. */
  caravan: TRADE_ROUTE_COLOR,
  threat: TRADE_ROUTE_THREATENED_COLOR,
};

/** The ink a mark without a known tone falls back to (Law 58's plain fallback). */
export const LENS_FALLBACK_INK = '#a09880';

export function lensToneColor(tone: string | undefined): string {
  return (tone && (LENS_TONE_COLORS as Record<string, string>)[tone]) || LENS_FALLBACK_INK;
}

/**
 * A marker row's ink as a colour (THR-1898) — the legend swatch for an entry with no tone
 * (Battle and Siege show their sprites' own colours). Total over `MarkerInk`.
 */
export const MARKER_INK_COLORS: Readonly<Record<MarkerInk, string>> = {
  faction: LENS_FALLBACK_INK,
  /** No single court colour: a toneless court entry (Heading) keeps the neutral swatch, since its arrows take each mortal's own colour. */
  court: LENS_FALLBACK_INK,
  trouble: LENS_TONE_COLORS.trouble,
  caravan: LENS_TONE_COLORS.caravan,
  threat: LENS_TONE_COLORS.threat,
  battle: FIELD_BATTLE_COLOR,
  siege: SIEGE_COLOR,
  frontierGold: '#d4a040',
};

/** The colour a legend entry shows: its tone's when it names one, else its row's ink. */
export function legendInkColor(tone: string | undefined, ink: MarkerInk): string {
  return tone ? lensToneColor(tone) : MARKER_INK_COLORS[ink] ?? LENS_FALLBACK_INK;
}
