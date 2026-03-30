import type { PopupItem } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';

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

export const eventPopupTestHelpers = { hasChoices, queueBadge };

export function EventPopup({ popup, queueLength, onDismiss, onChoice }: EventPopupProps) {
  const isOpen = popup !== null;
  const accentColor = popup?.sphere ? getSphereColor(popup.sphere) : 'var(--accent-gold)';
  const badge = popup ? queueBadge(queueLength) : '';
  const interactive = popup ? hasChoices(popup) : false;

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
            {badge && (
              <span
                className="px-2 py-0.5 rounded-full font-bold"
                style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--bg-raised)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-gold)',
                }}
              >
                {badge}
              </span>
            )}
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
