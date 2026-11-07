/**
 * CrossroadsBadge — the thread row's torn badge (THR-1928). Built from the tug badge's
 * primitives (IconButton + Icon + Tooltip, `ThreadTugBadge`), in a calm variant: a torn
 * mortal is a chance to lean, not a cost to pay, so the badge carries no price and is
 * never disabled. Clicking opens the person's page at the Crossroads row. Not an interrupt.
 */
import { IconButton } from '../shared/IconButton';
import { Icon } from '../shared/Icon';
import { Tooltip } from '../shared/Tooltip';
import type { CrossroadsBadgeModel } from './crossroadsBadgeModel';

/** Alpha of the accent used as the badge's resting tint (the tug badge's). */
const CROSSROADS_BADGE_BG_OPACITY = 0.16;

export function CrossroadsBadge({ badge, onOpen }: { badge: CrossroadsBadgeModel; onOpen: (badge: CrossroadsBadgeModel) => void }) {
  const accent = badge.accentColor;
  return (
    <Tooltip label={badge.label} desc={badge.meta}>
      <IconButton
        size="sm"
        active
        icon={<Icon name={badge.icon} size="chip" decorative />}
        aria-label={badge.ariaLabel}
        data-testid="thread-crossroads-badge"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(badge);
        }}
        style={{
          flexShrink: 0,
          color: accent,
          borderColor: accent,
          backgroundColor: `color-mix(in srgb, ${accent} ${Math.round(CROSSROADS_BADGE_BG_OPACITY * 100)}%, transparent)`,
        }}
      />
    </Tooltip>
  );
}
