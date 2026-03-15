import { AnimateMount } from '../shared/AnimateMount';
import type { PopupItem } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';

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
  return (
    <AnimateMount show={popup !== null} animation="anim-fade-up" duration={300}>
      {popup && (() => {
        const accentColor = popup.sphere ? getSphereColor(popup.sphere) : 'var(--accent-gold)';
        const badge = queueBadge(queueLength);
        const interactive = hasChoices(popup);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="rounded-lg shadow-2xl border overflow-hidden"
              style={{
                width: '420px',
                maxWidth: '90vw',
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-medium)',
              }}
              role="dialog"
              aria-label={popup.title}
            >
              {/* Header accent */}
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
                      border: '1px solid var(--border-subtle)',
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
                    <button
                      key={choice.effect}
                      onClick={() => onChoice?.(choice.effect)}
                      className="px-4 py-2 rounded font-medium transition-colors"
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: accentColor + '22',
                        color: accentColor,
                        border: `1px solid ${accentColor}55`,
                      }}
                      title={choice.tooltip}
                    >
                      {choice.label}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2 rounded font-medium transition-colors"
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </AnimateMount>
  );
}
