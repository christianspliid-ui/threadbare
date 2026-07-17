/**
 * EntityVisual (THR-637) — the shared primitive behind the Entity Visual Header
 * pattern. Every detail surface opens with its subject's image; this renders it
 * in one of three sizes, with an authored fallback tile when no art exists.
 *
 * See `Docs/design-system/entity-visual-header.md` for when to use each size.
 *
 * Two ways to feed it:
 *   1. `entity` (+ optional `graph`, `opts`) — the component resolves internally.
 *   2. `descriptor` — a pre-resolved `EntityVisualDescriptor` (use when the caller
 *      needs the resolved tier itself, e.g. to gate a click-to-expand affordance).
 *
 * NFP #4 (fail-soft): an art `<img>` that 404s swaps to the fallback tile in
 *   place (no broken-image icon, no layout shift) and logs one `console.warn`.
 * NFP #7 (performance): pure synchronous lookup at modal-open frequency; the
 *   `<img>` is `loading="lazy"`.
 */

import { useEffect, useState } from 'react';
import type { WorldGraph } from '../../engine/graph';
import { ENTITY_GRADIENTS } from '../../data/entity-visual-fallbacks';
import {
  resolveEntityVisual,
  type EntityVisualRef,
  type ResolveEntityVisualOpts,
  type EntityVisualDescriptor,
} from './entityVisualResolver';

// ── Layout constants (NFP #1) ───────────────────────────────────────

/** Hero banner aspect ratio (location landscapes, encounter illustrations). */
export const ENTITY_VISUAL_HERO_ASPECT = '16 / 9';
/** Portrait aspect ratio (agents, avatars, NPC roles). */
export const ENTITY_VISUAL_PORTRAIT_ASPECT = '3 / 4';
/** Chip tile edge length in px (cast lists, faction tags, items). */
export const ENTITY_VISUAL_CHIP_PX = 40;

export type EntityVisualSize = 'hero' | 'portrait' | 'chip';

/** Glyph font-size per size — legible without overwhelming the tile. */
const GLYPH_FONT_PX: Record<EntityVisualSize, number> = {
  hero: 56,
  portrait: 40,
  chip: 18,
};

export interface EntityVisualProps {
  size: EntityVisualSize;
  /** Pre-resolved descriptor. Takes precedence over `entity`. */
  descriptor?: EntityVisualDescriptor;
  /** Entity reference — resolved internally when `descriptor` is absent. */
  entity?: EntityVisualRef;
  /** World graph for internal resolution (null/omitted for graph-free surfaces). */
  graph?: WorldGraph | null;
  /** Resolver hints (knowledge gate, terrain, sphere influence). */
  opts?: ResolveEntityVisualOpts;
  /** Tile shape. Chips default to circle; hero/portrait default to rounded. */
  shape?: 'circle' | 'rounded';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label for the interactive/decorative tile; defaults to the entity name. */
  'aria-label'?: string;
  title?: string;
  /** Test hook forwarded to the rendered element. */
  'data-testid'?: string;
}

function sizeStyle(size: EntityVisualSize): React.CSSProperties {
  switch (size) {
    case 'hero':
      return { width: '100%', aspectRatio: ENTITY_VISUAL_HERO_ASPECT };
    case 'portrait':
      return { width: '100%', aspectRatio: ENTITY_VISUAL_PORTRAIT_ASPECT };
    case 'chip':
      return {
        width: ENTITY_VISUAL_CHIP_PX,
        height: ENTITY_VISUAL_CHIP_PX,
        flexShrink: 0,
      };
  }
}

export function EntityVisual({
  size,
  descriptor,
  entity,
  graph,
  opts,
  shape,
  onClick,
  className,
  style,
  'aria-label': ariaLabel,
  title,
  'data-testid': dataTestId,
}: EntityVisualProps) {
  const desc: EntityVisualDescriptor | null =
    descriptor ?? (entity ? resolveEntityVisual(entity, graph ?? null, opts) : null);

  // Art that fails to load swaps to the fallback tile in place.
  const [imgError, setImgError] = useState(false);
  // Reset the error latch when the resolved source changes.
  useEffect(() => {
    setImgError(false);
  }, [desc?.src]);

  if (!desc) return null;

  const gradient = ENTITY_GRADIENTS[desc.gradientIndex] ?? ENTITY_GRADIENTS[0];
  const showArt = desc.tier === 'art' && !!desc.src && !imgError;
  const radius = (shape ?? (size === 'chip' ? 'circle' : 'rounded')) === 'circle' ? '50%' : 4;
  const label = ariaLabel ?? desc.alt;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: gradient.background,
    border: '1px solid rgba(212, 175, 55, 0.22)',
    cursor: onClick ? 'pointer' : undefined,
    ...sizeStyle(size),
    ...style,
  };

  const content = showArt ? (
    <img
      src={desc.src}
      alt={label}
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={() => {
        setImgError(true);
        // One-time warn per broken asset path; not a trace-channel event.
        console.warn(`[EntityVisual] art failed to load, using fallback tile: ${desc.src}`);
      }}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{
        fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
        fontSize: GLYPH_FONT_PX[size],
        lineHeight: 1,
        color: gradient.glyphColor,
        userSelect: 'none',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
      }}
    >
      {desc.glyph}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label={label}
        title={title}
        style={{ padding: 0, ...containerStyle }}
        data-entity-visual-tier={desc.tier}
        data-testid={dataTestId}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={className}
      role={showArt ? 'img' : undefined}
      aria-label={showArt ? label : undefined}
      title={title}
      style={containerStyle}
      data-entity-visual-tier={desc.tier}
      data-testid={dataTestId}
    >
      {content}
    </div>
  );
}
