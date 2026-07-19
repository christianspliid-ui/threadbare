/**
 * EncounterBadge — THR-664
 *
 * The thread row's encounter affordance. Encounter activity is anchored to the
 * entity it concerns: a pending notification shows here, on the agent's
 * persistent card, instead of a transient toast in a global queue.
 *
 * Two states, distinguished by glyph and wording:
 *   - live beat   — `!`, the encounter is waiting on the player
 *   - aftermath   — `✦`, the encounter concluded and has not been read
 *
 * Tinted by the notification's outcome band via the same table the toast cards
 * used (`outcomeBandAccent`), falling back to gold when no band is present.
 */

import { useState } from 'react';
import { IconButton } from '../shared/IconButton';
import { Tooltip } from '../shared/Tooltip';
import type { EncounterBadgeModel } from './encounterBadgeModel';

/** Alpha of the accent colour used as the badge's resting background tint. */
const BADGE_BG_OPACITY = 0.16;

/** Alpha of the accent colour used as the badge's hover background tint. */
const BADGE_BG_HOVER_OPACITY = 0.3;

interface EncounterBadgeProps {
  badge: EncounterBadgeModel;
  /** Opens the encounter modal for `badge.primary`. */
  onOpen: (badge: EncounterBadgeModel) => void;
}

export function EncounterBadge({ badge, onOpen }: EncounterBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const accent = badge.accentColor;

  return (
    <Tooltip label={badge.label} desc={badge.meta}>
      <IconButton
        size="sm"
        // `active` keeps IconButton's built-in hover mutation from resetting the
        // band tint; hover is handled here instead, per the dynamic-base-colour
        // pattern in the design system.
        active
        icon={badge.glyph}
        badge={badge.countLabel}
        aria-label={badge.ariaLabel}
        data-testid="thread-encounter-badge"
        data-encounter-badge-kind={badge.kind}
        data-encounter-badge-count={badge.count}
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
          backgroundColor: `color-mix(in srgb, ${accent} ${Math.round((hovered ? BADGE_BG_HOVER_OPACITY : BADGE_BG_OPACITY) * 100)}%, transparent)`,
          fontWeight: 700,
          outline: focusRing ? '2px solid var(--accent-gold-dim)' : undefined,
          outlineOffset: focusRing ? '-2px' : undefined,
        }}
      />
    </Tooltip>
  );
}
