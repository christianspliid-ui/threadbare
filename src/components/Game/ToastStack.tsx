import { AnimateMount } from '../shared/AnimateMount';
import type { ToastItem } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Called when a toast with actorId is clicked — navigates to that agent */
  onSelectAgent?: (agentId: string) => void;
}

function formatCount(count: number): string {
  return count > 1 ? `×${count}` : '';
}

function filterActive(toasts: ToastItem[], now: number): ToastItem[] {
  return toasts.filter(t => t.expiresAt > now);
}

export const toastStackTestHelpers = { formatCount, filterActive };

export function ToastStack({ toasts, onDismiss, onSelectAgent }: ToastStackProps) {
  return (
    <div
      className="fixed bottom-20 left-4 z-50 flex flex-col-reverse gap-2 pointer-events-none"
      style={{ maxWidth: '320px' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => {
        const accentColor = toast.sphere ? getSphereColor(toast.sphere) : 'var(--accent-gold-dim)';
        const isAgentLinked = Boolean(toast.actorId && onSelectAgent);
        return (
          <AnimateMount key={toast.id} show={true} animation="anim-fade-up" duration={300}>
            <div
              className="pointer-events-auto rounded-md shadow-lg backdrop-blur-sm border-l-[3px] px-3 py-2 flex items-start gap-2 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderLeftColor: accentColor,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onClick={() => {
                if (toast.onClick) {
                  toast.onClick();
                } else if (isAgentLinked) {
                  onSelectAgent!(toast.actorId!);
                }
                onDismiss(toast.id);
              }}
              role="status"
              aria-label={isAgentLinked ? `${toast.message} — click to view agent` : toast.message}
            >
              <span
                className="flex-1 leading-snug"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {toast.message}
              </span>
              {toast.count > 1 && (
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    fontSize: '10px',
                    backgroundColor: accentColor + '33',
                    color: accentColor,
                  }}
                >
                  {formatCount(toast.count)}
                </span>
              )}
              {isAgentLinked && (
                <span
                  className="flex-shrink-0"
                  style={{ fontSize: '10px', color: accentColor, opacity: 0.7 }}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </div>
          </AnimateMount>
        );
      })}
    </div>
  );
}
