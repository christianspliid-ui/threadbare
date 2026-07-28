import type { PopupItem } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { RevealCard } from '../shared/RevealCard';
import { SphereIcon } from '../shared/SphereIcon';
import { REVEAL_CATEGORY_TITLES } from '../../data/reveal-content';

interface EventPopupProps {
  popup: PopupItem | null;
  queueLength: number;
  onDismiss: () => void;
  onChoice?: (effect: string) => void;
}

function hasChoices(popup: PopupItem): boolean {
  return Array.isArray(popup.choices) && popup.choices.length > 0;
}

function queueBadge(queueLength: number): string {
  return queueLength > 1 ? `+${queueLength - 1}` : '';
}

/**
 * Which presentation tier a popup gets (THR-799).
 *
 * Ceremonial requires two things, not one:
 *  - a `sphere`, which is the event's canonical visual identity (no per-event
 *    art registry exists, so without it there is nothing to put in the medallion); and
 *  - no `choices`. A choice popup is a decision, not a reveal, and RevealCard is
 *    built on the premise that a reveal has no competing action — its single quiet
 *    dismiss button is the whole point. Decisions keep the compact layout, where
 *    the choice buttons read as choices.
 *
 * Exported so the presentation split is testable without rendering.
 */
export function isCeremonialPopup(popup: PopupItem): boolean {
  return Boolean(popup.sphere) && !hasChoices(popup);
}

export const eventPopupTestHelpers = { hasChoices, queueBadge, isCeremonialPopup };

/** The queue-depth chip. Behavior is unchanged across both tiers. */
function QueueBadge({ badge }: { badge: string }) {
  if (!badge) return null;
  return (
    <span
      className="px-2 py-0.5 rounded-full font-bold"
      style={{
        fontSize: 'var(--text-xs)',
        backgroundColor: 'var(--bg-raised)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-gold)',
      }}
    >
      {badge}
    </span>
  );
}

export function EventPopup({ popup, queueLength, onDismiss, onChoice }: EventPopupProps) {
  const isOpen = popup !== null;
  const accentColor = popup?.sphere ? getSphereColor(popup.sphere) : 'var(--accent-gold)';
  const badge = popup ? queueBadge(queueLength) : '';
  const interactive = popup ? hasChoices(popup) : false;
  const ceremonial = popup ? isCeremonialPopup(popup) : false;

  // ── Ceremonial tier: a sphere-carrying event with nothing to decide ──
  if (popup && ceremonial) {
    return (
      <RevealCard open={isOpen} onClose={onDismiss} aria-label={popup.title}>
        {badge && (
          <div style={{ alignSelf: 'flex-end', marginBottom: 'calc(-1 * var(--space-ceremonial))' }}>
            <QueueBadge badge={badge} />
          </div>
        )}
        <RevealCard.Title>{REVEAL_CATEGORY_TITLES.event}</RevealCard.Title>
        <RevealCard.Medallion accentColor={accentColor} title={popup.sphere}>
          <SphereIcon sphere={popup.sphere} size={44} />
        </RevealCard.Medallion>
        <RevealCard.Banner>{popup.title}</RevealCard.Banner>
        <RevealCard.Body>{popup.body}</RevealCard.Body>
        <RevealCard.Dismiss onClick={onDismiss} />
      </RevealCard>
    );
  }

  // ── Compact tier: plain notifications and anything with choices ──
  return (
    <Modal open={isOpen} onClose={onDismiss} maxWidth={420} animation="anim-fade">
      {popup && (
        <>
          {/* Header accent strip */}
          <div className="h-1" style={{ backgroundColor: accentColor }} />

          {/* Title row */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {popup.title}
            </h2>
            <QueueBadge badge={badge} />
          </div>

          {/* Body */}
          <div
            className="px-5 pb-4 leading-relaxed"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {popup.body}
          </div>

          {/* Actions */}
          <div
            className="px-5 py-3 flex gap-2 justify-end border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {interactive ? (
              popup.choices!.map(choice => (
                <Button
                  key={choice.effect}
                  variant="secondary"
                  size="sm"
                  onClick={() => onChoice?.(choice.effect)}
                  title={choice.tooltip}
                  style={{
                    backgroundColor: accentColor + '22',
                    color: accentColor,
                    borderColor: accentColor + '55',
                  }}
                >
                  {choice.label}
                </Button>
              ))
            ) : (
              <Button variant="secondary" size="sm" onClick={onDismiss}>
                Acknowledge
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
