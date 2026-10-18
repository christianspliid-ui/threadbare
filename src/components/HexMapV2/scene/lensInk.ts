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
import { THREAD_COLORS } from './ThreadLineMesh';

export const LENS_TONE_COLORS: Readonly<Record<LensMarkTone, string>> = {
  first: THREAD_COLORS.the_first,
  retinue: THREAD_COLORS.retinue,
  watched: THREAD_COLORS.watched,
  /** `--forecast-doomed-rgb` (232 64 56). */
  trouble: '#e84038',
  caravan: '#c9a227',
  threat: '#dc2626',
};

/** The ink a mark without a known tone falls back to (Law 58's plain fallback). */
export const LENS_FALLBACK_INK = '#a09880';

export function lensToneColor(tone: string | undefined): string {
  return (tone && (LENS_TONE_COLORS as Record<string, string>)[tone]) || LENS_FALLBACK_INK;
}
