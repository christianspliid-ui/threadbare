/**
 * MomentBadge — THR-1299 slice 4
 *
 * The thread row's "their long work turned" affordance: a costly step, trouble,
 * a doubling-down, an abandonment, a finish — waiting where the player already
 * looks for that mortal. Fourth sibling of `EncounterBadge`, `ThreadTugBadge`
 * and `EntityNoticeBadge`, built from the same primitive (IconButton + Tooltip).
 *
 * Clicking opens the same `MomentCard` an interrupt opens (Law C1: one lesson —
 * this interface always means the same thing). Nothing is cleared by the click;
 * the record stays counted until the card is acknowledged (Law 40).
 */

import { useState } from 'react';
import { IconButton } from '../shared/IconButton';
import { Tooltip } from '../shared/Tooltip';
import type { MomentBadgeModel } from './momentBadgeModel';

/** Alpha of the accent colour used as the badge's resting background tint. */
const MOMENT_BADGE_BG_OPACITY = 0.12;

/** Alpha of the accent colour used as the badge's hover background tint. */
const MOMENT_BADGE_BG_HOVER_OPACITY = 0.26;

interface MomentBadgeProps {
  badge: MomentBadgeModel;
  /** Opens the badge's primary record in the moment card. */
  onOpen: (badge: MomentBadgeModel) => void;
}

export function MomentBadge({ badge, onOpen }: MomentBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const accent = badge.accentColor;
  const tintOpacity = hovered ? MOMENT_BADGE_BG_HOVER_OPACITY : MOMENT_BADGE_BG_OPACITY;

  return (
    <Tooltip label={badge.label} desc={badge.meta}>
      <IconButton
        size="sm"
        active
        icon={badge.glyph}
        badge={badge.countLabel}
        aria-label={badge.ariaLabel}
        data-testid="thread-moment-badge"
        data-moment-badge-class={badge.primary.momentClass}
        data-moment-badge-count={badge.count}
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
