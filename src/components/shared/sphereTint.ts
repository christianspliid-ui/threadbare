/**
 * sphereTint — the per-option sphere tint, shared (THR-1586).
 *
 * Extracted verbatim from `PremonitionModal` (THR-1031), whose sphere-tinted
 * option cards are the treatment Christian reacted to ("i love the colorfulness
 * of the dialogue window"). `CardFace` now adopts the same recipe for any card
 * that draws essence from a named sphere, so one colour-that-means-something
 * runs across the Premonition, encounter nudge cards and action cards.
 *
 * `color-mix` rather than hex-suffix concatenation (`${color}40`), which emits
 * invalid CSS the moment `color` is not a 6-digit hex. The percentages reproduce
 * the Premonition's shipped alphas (0x40 ≈ 25%, 0x08 ≈ 3%, 0xdd ≈ 87%).
 */

import type { SphereName } from '../../types';

/** Card / option edge in sphere colour. */
export const SPHERE_TINT_BORDER_PCT = 25;
/** Card / option ground wash. */
export const SPHERE_TINT_BG_PCT = 3;
/** Option cost text (Premonition only — cards never tint the price, Law 31). */
export const SPHERE_TINT_TEXT_PCT = 87;

export type SphereTintPart = 'border' | 'bg' | 'text';

const PART_PCT: Record<SphereTintPart, number> = {
  border: SPHERE_TINT_BORDER_PCT,
  bg: SPHERE_TINT_BG_PCT,
  text: SPHERE_TINT_TEXT_PCT,
};

/** `color-mix(in srgb, <color> N%, transparent)` for the named part. */
export function sphereTint(color: string, part: SphereTintPart): string {
  return `color-mix(in srgb, ${color} ${PART_PCT[part]}%, transparent)`;
}

/** The sphere's bright token — what cards read (Law 30: sphere colours flow from the sphere tokens). */
export function sphereBrightToken(sphere: SphereName): string {
  return `var(--sphere-${sphere}-bright)`;
}
