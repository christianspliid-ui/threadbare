/**
 * EntityNoticeBadge — THR-666
 *
 * The thread row's "word of them" affordance: a becoming, a complication, an
 * ambition milestone — news about this one person, waiting where the player
 * already looks for them.
 *
 * Third sibling of `EncounterBadge` and `ThreadTugBadge`, built from the same
 * primitive (IconButton + Tooltip) in a quieter state. The tug asks for a
 * decision and the encounter badge reports a live beat; this one is only news,
 * so it is the dimmest of the three and clicking it just opens their thread.
 *
 * Unthreaded agents never render one — the threading gate drops their
 * notifications before they reach this surface.
 */

import { useState } from 'react';
import { IconButton } from '../shared/IconButton';
import { Tooltip } from '../shared/Tooltip';
import type { EntityNoticeBadgeModel } from './entityNoticeBadgeModel';

/** Alpha of the accent colour used as the badge's resting background tint. */
const NOTICE_BADGE_BG_OPACITY = 0.1;

/** Alpha of the accent colour used as the badge's hover background tint. */
const NOTICE_BADGE_BG_HOVER_OPACITY = 0.24;

interface EntityNoticeBadgeProps {
  badge: EntityNoticeBadgeModel;
  /** Opens the agent's thread and clears their notices. */
  onOpen: (badge: EntityNoticeBadgeModel) => void;
}

export function EntityNoticeBadge({ badge, onOpen }: EntityNoticeBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const accent = badge.accentColor;
  const tintOpacity = hovered ? NOTICE_BADGE_BG_HOVER_OPACITY : NOTICE_BADGE_BG_OPACITY;

  return (
    <Tooltip label={badge.label} desc={badge.meta}>
      <IconButton
        size="sm"
        // `active` keeps IconButton's built-in hover mutation from resetting the
        // category tint; hover is handled here instead, per the dynamic-base-colour
        // pattern in the design system.
        active
        icon={badge.glyph}
        badge={badge.countLabel}
        aria-label={badge.ariaLabel}
        data-testid="thread-entity-notice-badge"
        data-notice-badge-category={badge.primary.category}
        data-notice-badge-count={badge.count}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(badge);
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
          fontWeight: 700,
          outline: focusRing ? '2px solid var(--accent-gold-dim)' : undefined,
          outlineOffset: focusRing ? '-2px' : undefined,
        }}
      />
    </Tooltip>
  );
}
