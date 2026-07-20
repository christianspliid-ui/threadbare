/**
 * ThreadTugBadge — THR-665
 *
 * The thread row's tug affordance: "something is about to happen — attend?".
 *
 * Sibling of `EncounterBadge` and built from the same primitive (IconButton +
 * Tooltip) in a distinct state. The encounter badge reports what happened; this
 * one offers a choice that costs attention, so the price is always in the
 * tooltip and the aria-label — attending is never a hidden charge.
 *
 * Tinted by threat level via `TUG_THREAT_ACCENT`. When the pool cannot cover the
 * cost the badge dims and marks itself `aria-disabled`; clicking then selects
 * the agent without spending anything.
 */

import { useState } from 'react';
import { IconButton } from '../shared/IconButton';
import { Tooltip } from '../shared/Tooltip';
import type { ThreadTugBadgeModel } from './threadTugBadgeModel';

/** Alpha of the accent colour used as the badge's resting background tint. */
const TUG_BADGE_BG_OPACITY = 0.16;

/** Alpha of the accent colour used as the badge's hover background tint. */
const TUG_BADGE_BG_HOVER_OPACITY = 0.3;

/** Opacity applied when the attention pool cannot cover the attend cost. */
const TUG_BADGE_UNAFFORDABLE_OPACITY = 0.45;

interface ThreadTugBadgeProps {
  badge: ThreadTugBadgeModel;
  /** Attends `badge.primary` and selects the agent. */
  onAttend: (badge: ThreadTugBadgeModel) => void;
}

export function ThreadTugBadge({ badge, onAttend }: ThreadTugBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const accent = badge.accentColor;
  const tintOpacity = hovered ? TUG_BADGE_BG_HOVER_OPACITY : TUG_BADGE_BG_OPACITY;

  return (
    <Tooltip label={badge.label} desc={badge.meta}>
      <IconButton
        size="sm"
        // `active` keeps IconButton's built-in hover mutation from resetting the
        // threat tint; hover is handled here instead, per the dynamic-base-colour
        // pattern in the design system.
        active
        icon={badge.glyph}
        badge={badge.countLabel}
        aria-label={badge.ariaLabel}
        aria-disabled={!badge.affordable}
        data-testid="thread-tug-badge"
        data-tug-badge-threat={badge.primary.threatLevel}
        data-tug-badge-count={badge.count}
        data-tug-badge-affordable={badge.affordable}
        onClick={(e) => {
          e.stopPropagation();
          onAttend(badge);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => setFocusRing(e.currentTarget.matches(':focus-visible'))}
        onBlur={() => setFocusRing(false)}
        style={{
          flexShrink: 0,
          color: accent,
          borderColor: accent,
          backgroundColor: `color-mix(in srgb, ${accent} ${Math.round(tintOpacity * 100)}%, transparent)`,
          opacity: badge.affordable ? undefined : TUG_BADGE_UNAFFORDABLE_OPACITY,
          fontWeight: 700,
          outline: focusRing ? '2px solid var(--accent-gold-dim)' : undefined,
          outlineOffset: focusRing ? '-2px' : undefined,
        }}
      />
    </Tooltip>
  );
}
