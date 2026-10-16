/**
 * Medallion — circular icon frame (THR-799).
 *
 * The layered-ring treatment the ceremonial reveal tier uses for an element's
 * hero icon: outer accent ring → dark gap → content disc that clips whatever it
 * is given. Also usable standalone in sidebars as a small chip.
 *
 * It introduces NO second art-resolution path. The child is whatever the
 * existing resolver already produced — a `SphereIcon`, a THR-637 `EntityVisual`,
 * a codex mark, an <img> — and Medallion only frames and clips it. With no child it draws
 * `fallbackIcon` — the subject's kind icon when the caller knows it, else the `fallback` mark
 * (THR-1906, Law 4): never an empty disc, never a glyph.
 */

import React from 'react';
import type { IconName } from '../../data/icons/iconRegistry';
import { Icon } from './Icon';

export type MedallionSize = 'sm' | 'md' | 'lg';

/** Medallion diameters in px. Tunable per NFP #1 — no bare numbers below. */
export const MEDALLION_SIZE_SM = 40;
export const MEDALLION_SIZE_MD = 64;
export const MEDALLION_SIZE_LG = 96;

const SIZE_PX: Record<MedallionSize, number> = {
  sm: MEDALLION_SIZE_SM,
  md: MEDALLION_SIZE_MD,
  lg: MEDALLION_SIZE_LG,
};

/** Ring thickness and the dark gap between ring and content disc, in px. */
export const MEDALLION_RING_WIDTH = 2;
export const MEDALLION_RING_GAP = 3;

/** Last-resort icon when a caller has nothing to put in the disc and names no kind. */
export const MEDALLION_FALLBACK_ICON: IconName = 'fallback';

export interface MedallionProps {
  size?: MedallionSize;
  /**
   * Ring color. Defaults to dim gold; `lg` defaults to full `--accent-gold`
   * because the hero medallion is the single bright-gold element on a
   * ceremonial surface (gold budget, THR-799).
   */
  accentColor?: string;
  /** Accessible label / hover title for the framed subject. */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** The already-resolved visual. Absent → `fallbackIcon`, never an empty disc. */
  children?: React.ReactNode;
  /** The subject's kind icon, drawn when there is no child. Default: the `fallback` mark. */
  fallbackIcon?: IconName;
}

export const Medallion = React.memo(function Medallion({
  size = 'md',
  accentColor,
  title,
  className,
  style,
  children,
  fallbackIcon = MEDALLION_FALLBACK_ICON,
}: MedallionProps) {
  const diameter = SIZE_PX[size] ?? MEDALLION_SIZE_MD;
  const ring = accentColor ?? (size === 'lg' ? 'var(--accent-gold)' : 'var(--accent-gold-dim)');
  const inset = MEDALLION_RING_WIDTH + MEDALLION_RING_GAP;

  return (
    <span
      className={className}
      title={title}
      aria-label={title}
      role={title ? 'img' : undefined}
      data-testid="medallion"
      data-size={size}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: `${MEDALLION_RING_WIDTH}px solid ${ring}`,
        backgroundColor: 'var(--bg-abyss)',
        ...style,
      }}
    >
      {/* Content disc — sits inside the dark gap and clips its child to a circle. */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: diameter - inset * 2,
          height: diameter - inset * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-deep)',
          color: 'var(--accent-gold)',
          fontSize: Math.round(diameter * 0.4),
          lineHeight: 1,
        }}
      >
        {children ?? <Icon name={fallbackIcon} size="list" decorative />}
      </span>
    </span>
  );
});
