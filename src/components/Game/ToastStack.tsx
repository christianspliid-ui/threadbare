import { useState, useCallback } from 'react';
import { AnimateMount } from '../shared/AnimateMount';
import type { ToastItem } from '../../types/notification';
import type { NavigationTarget } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';

/** Glyph indicating what clicking a notification navigates to */
const NAV_GLYPHS: Record<NavigationTarget['kind'], string> = {
  agent:     '→',
  encounter: '⚔',
  hex:       '⬡',
  location:  '🏘',
  faction:   '⚑',
  journey:   '↝',
};

/** Tooltip text for each navigation kind */
const NAV_TOOLTIPS: Record<NavigationTarget['kind'], string> = {
  agent:     'Click to view agent',
  encounter: 'Click to view encounter',
  hex:       'Click to view hex',
  location:  'Click to view location',
  faction:   'Click to view faction',
  journey:   'Click to view journey',
};

/** Opacity for navigation glyph */
const NAV_GLYPH_OPACITY = 0.6;

/** Maximum number of toasts visible at once — oldest are hidden when exceeded */
const MAX_VISIBLE_TOASTS = 6;

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Called when a toast with actorId is clicked — navigates to that agent */
  onSelectAgent?: (agentId: string) => void;
  /** Called when a toast with a navigation target is clicked */
  onNavigate?: (target: NavigationTarget) => void;
}

function formatCount(count: number): string {
  return count > 1 ? `×${count}` : '';
}

function filterActive(toasts: ToastItem[], now: number): ToastItem[] {
  return toasts.filter(t => t.expiresAt > now);
}

export const toastStackTestHelpers = { formatCount, filterActive };

export function ToastStack({ toasts, onDismiss, onSelectAgent, onNavigate }: ToastStackProps) {
  // Track which toasts are in exit animation (right-click dismissed)
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const handleRightClickDismiss = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Trigger fade-out animation, then remove after delay
    setDismissingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      onDismiss(id);
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 150);
  }, [onDismiss]);

  return (
    <div
      className="fixed left-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ top: 'calc(var(--topbar-height) + 80px)', maxWidth: '320px' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.slice(-MAX_VISIBLE_TOASTS).map(toast => {
        const accentColor = toast.sphere ? getSphereColor(toast.sphere) : 'var(--accent-gold-dim)';
        const navTarget = toast.navigationTarget;
        const isNavigable = Boolean(navTarget && onNavigate) || Boolean(toast.onClick) || Boolean(toast.actorId && onSelectAgent);
        const isDismissing = dismissingIds.has(toast.id);
        return (
          <AnimateMount key={toast.id} show={!isDismissing} animation="anim-fade-up" duration={150}>
            <div
              className="pointer-events-auto rounded-md shadow-lg backdrop-blur-sm border-l-[3px] px-3 py-2 flex items-start gap-2 cursor-pointer group"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderLeftColor: accentColor,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onClick={() => {
                // Prefer navigationTarget, fall back to legacy onClick/actorId
                if (navTarget && onNavigate) {
                  onNavigate(navTarget);
                } else if (toast.onClick) {
                  toast.onClick();
                } else if (toast.actorId && onSelectAgent) {
                  onSelectAgent(toast.actorId);
                }
                onDismiss(toast.id);
              }}
              onContextMenu={(e) => handleRightClickDismiss(e, toast.id)}
              role="status"
              aria-label={navTarget ? `${toast.message} — ${NAV_TOOLTIPS[navTarget.kind]}` : toast.message}
              aria-description="Right-click to dismiss"
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
              {/* Navigation glyph — show kind-specific icon if nav target, else legacy arrow */}
              {navTarget ? (
                <span
                  className="flex-shrink-0 transition-opacity"
                  style={{ fontSize: '10px', color: accentColor, opacity: NAV_GLYPH_OPACITY }}
                  title={NAV_TOOLTIPS[navTarget.kind]}
                  aria-hidden="true"
                >
                  {NAV_GLYPHS[navTarget.kind]}
                </span>
              ) : isNavigable && (
                <span
                  className="flex-shrink-0"
                  style={{ fontSize: '10px', color: accentColor, opacity: NAV_GLYPH_OPACITY }}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
              {/* Keyboard-accessible dismiss button — visible on focus */}
              <button
                className="flex-shrink-0 opacity-0 group-focus-within:opacity-100 hover:opacity-100 transition-opacity"
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 2px',
                  lineHeight: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(toast.id);
                }}
                aria-label="Dismiss notification"
                tabIndex={0}
              >
                ×
              </button>
            </div>
          </AnimateMount>
        );
      })}
    </div>
  );
}
