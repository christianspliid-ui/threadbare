/**
 * EncounterNotificationCard — structured three-line card for encounter toasts (THR-636).
 *
 * Replaces the old prose-dump toast body. Answers "whose encounter, how far,
 * how it's going" at a glance:
 *   Line 1 (headline): agent name — encounter name (name plain + prominent)
 *   Line 2 (meta):     "step 2 of 4 · faltered" / "concluded · held" (band-tinted)
 *   Line 3 (tease):    first sentence of the prose, clamped
 *
 * Presentational only — the whole card is wrapped in ToastStack's clickable
 * container, which owns navigation + dismissal.
 */

import type { EncounterToastCard } from '../../types/notification';

interface EncounterNotificationCardProps {
  card: EncounterToastCard;
  /** Band-keyed accent colour resolved by ToastStack (used on the meta line). */
  accentColor: string;
}

export function EncounterNotificationCard({ card, accentColor }: EncounterNotificationCardProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      {/* Headline — agent name (prominent) + encounter name */}
      <div
        className="leading-snug"
        style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)' }}
      >
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{card.agentName}</span>
        <span style={{ color: 'var(--text-tertiary)' }}> — </span>
        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{card.encounterName}</span>
      </div>

      {/* Meta — step counter + band word */}
      {card.meta && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: accentColor,
            letterSpacing: '0.03em',
            opacity: 0.85,
          }}
        >
          {card.meta}
        </div>
      )}

      {/* Tease — first sentence, clamped upstream */}
      {card.tease && (
        <div
          className="leading-snug truncate"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
          }}
        >
          {card.tease}
        </div>
      )}
    </div>
  );
}
