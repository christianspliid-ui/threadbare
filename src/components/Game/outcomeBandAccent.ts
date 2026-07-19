/**
 * Outcome-band → accent colour mapping.
 *
 * Extracted from ToastStack (THR-664) so the thread-row encounter badge and the
 * toast cards tint from one table. Fail-soft: an unknown band returns undefined
 * and the caller falls through to its own default (sphere colour / gold).
 */

/** Band → accent colour. */
export const BAND_ACCENT: Record<string, string> = {
  surge:       'var(--positive)',
  fortunate:   'var(--accent-near-miss)',
  neutral:     'var(--text-tertiary)',
  strained:    'var(--warning)',
  setback:     'var(--negative)',
  catastrophe: '#b91c1c',
};

/** Accent colour for a band, or `fallback` when the band is absent/unknown. */
export function bandAccentColor(band: string | undefined, fallback: string): string {
  return (band && BAND_ACCENT[band]) ?? fallback;
}
