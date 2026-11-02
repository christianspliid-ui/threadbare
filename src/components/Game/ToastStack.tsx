import { useState, useCallback, useEffect } from 'react';
import { AnimateMount } from '../shared/AnimateMount';
import type { ToastItem } from '../../types/notification';
import type { NavigationTarget } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';
import { renderProseWithIPK } from '../ProseKeyword';
import { TOPBAR_LOCKED_SUFFIX } from '../../data/ui-content';
// Band → left-border accent colour. Shared with the thread-row encounter badge
// (THR-664). Fail-soft: unknown band → undefined, falls through to sphere/gold.
import { BAND_ACCENT } from './outcomeBandAccent';
import { Icon } from '../shared/Icon';
import { ICON_FOR_WORLD_REF_KIND } from '../../data/icons/conceptIcons';
import { RowPicture, rowDressingAttrs } from '../shared/RowPicture';
import { ROW_VISUAL_KIND } from '../../engine/views/rowVisual';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';

// What clicking a notification navigates to draws the object-kind icon from
// `ICON_FOR_WORLD_REF_KIND` (THR-1906, Law 9) — one shape per kind, shared with Find and Connections.

/** Tooltip text for each navigation kind */
// THR-1911 (Inspector plan § D14): every toast opens a page in the Inspector.
const NAV_TOOLTIPS: Record<NavigationTarget['kind'], string> = {
  agent:     'Open their page',
  encounter: 'Open the encounter',
  hex:       'Open this land',
  location:  'Open the place',
  area:      'Open the area',
  faction:   'Open the faction',
  journey:   'Open the journey',
  receipt:   'Open the receipt',
  artifact:  'Open the artifact',
  attachment:'Open what was granted',
  army:      'Open the army',
};

/** Opacity for navigation glyph */
const NAV_GLYPH_OPACITY = 0.6;

/**
 * THR-1877 — how long a guarded receipt toast keeps its "Opens when this chapter
 * closes." line after a click. The shake itself runs `.anim-shake-no` (`--anim-slow`).
 */
const RECEIPT_LOCKED_HINT_MS = 2000;

/** Maximum number of toasts visible at once — oldest are hidden when exceeded */
const MAX_VISIBLE_TOASTS = 6;

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  /** Called when a toast with actorId is clicked — navigates to that agent */
  onSelectAgent?: (agentId: string) => void;
  /** Called when a toast with a navigation target is clicked */
  onNavigate?: (target: NavigationTarget) => void;
  /**
   * THR-1877 (D7) — a ceremony or Stage moment holds the foreground. A receipt toast's
   * click then answers with a shake and "Opens when this chapter closes." and opens
   * nothing: the receipt waits for the moment, like the guarded top bar.
   */
  receiptOpenLocked?: boolean;
  /**
   * THR-2103 (decision 4) — each toast's subject picture, keyed by toast id, resolved by the
   * host (`GameView`): the picture of what the click opens. It leads the toast; the trailing
   * kind icon stays, because that is the click affordance, not the subject.
   */
  toastVisuals?: Readonly<Record<string, EntityVisualDescriptor | null>>;
}

function formatCount(count: number): string {
  return count > 1 ? `×${count}` : '';
}

function filterActive(toasts: ToastItem[], now: number): ToastItem[] {
  return toasts.filter(t => t.expiresAt > now);
}

/** Whether a navigation target's kind draws a row picture (`ROW_VISUAL_KIND`). */
function navTargetHasPicture(target: NavigationTarget): boolean {
  return !!(ROW_VISUAL_KIND as Readonly<Record<string, unknown>>)[target.kind];
}

export const toastStackTestHelpers = { formatCount, filterActive };

export function ToastStack({ toasts, onDismiss, onSelectAgent, onNavigate, receiptOpenLocked = false, toastVisuals }: ToastStackProps) {
  // Track which toasts are in exit animation (right-click dismissed)
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  // THR-1877 — the receipt toast whose click was refused, and a counter that restarts its shake.
  const [lockedHint, setLockedHint] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => {
    if (!lockedHint) return undefined;
    const timer = setTimeout(() => setLockedHint(null), RECEIPT_LOCKED_HINT_MS);
    return () => clearTimeout(timer);
  }, [lockedHint]);

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
    // THR-1711 (5): `absolute`, not `fixed`. GameView mounts the stack inside the
    // map area (a `relative` box), so it anchors to the map's own corner rather
    // than the viewport's, where it sat on top of the Chronicle sidebar. Top-right,
    // not bottom-right: the action drawer rises from the map's bottom edge, and a
    // bottom-anchored toast covered its Cast bar.
    <div
      data-testid="toast-stack"
      className="absolute right-4 top-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 'var(--toast-w)' }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.slice(-MAX_VISIBLE_TOASTS).map(toast => {
        const accentColor = (toast.band && BAND_ACCENT[toast.band])
          ?? (toast.sphere ? getSphereColor(toast.sphere) : 'var(--accent-gold-dim)');
        const navTarget = toast.navigationTarget;
        const isNavigable = Boolean(navTarget && onNavigate) || Boolean(toast.onClick) || Boolean(toast.actorId && onSelectAgent);
        const isDismissing = dismissingIds.has(toast.id);
        const receiptLocked = receiptOpenLocked && navTarget?.kind === 'receipt';
        const showLockedHint = receiptLocked && lockedHint?.id === toast.id;
        const visual = toastVisuals?.[toast.id] ?? null;
        // A toast names a subject when what its click opens is a person, place, faction, army or relic.
        const namesSubject = !!toastVisuals && !!navTarget && navTargetHasPicture(navTarget);
        return (
          <AnimateMount key={toast.id} show={!isDismissing} animation="anim-fade-up" duration={150}>
            <div
              key={showLockedHint ? `locked-${lockedHint?.n}` : 'toast'}
              data-receipt-locked={receiptLocked ? 'true' : undefined}
              data-testid="toast"
              {...rowDressingAttrs(visual, namesSubject)}
              className={`pointer-events-auto rounded-md shadow-lg backdrop-blur-sm border-l-[3px] px-3 py-2 flex items-start gap-2 cursor-pointer group${showLockedHint ? ' anim-shake-no' : ''}`}
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderLeftColor: accentColor,
                borderTop: '1px solid var(--border-subtle)',
                borderRight: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onClick={() => {
                // THR-1877 — a receipt waits while a moment holds the foreground.
                if (receiptLocked) {
                  setLockedHint(prev => ({ id: toast.id, n: (prev?.n ?? 0) + 1 }));
                  return;
                }
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
              aria-label={
                navTarget
                  ? `${toast.message.replace(/\*\*/g, '')} — ${receiptLocked ? TOPBAR_LOCKED_SUFFIX : NAV_TOOLTIPS[navTarget.kind]}`
                  : toast.message.replace(/\*\*/g, '')
              }
              aria-description="Right-click to dismiss"
            >
              <RowPicture visual={visual} />
              <span
                className="flex-1 leading-snug"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {/* IPK-aware: identity for plain text (THR-628) */}
                {renderProseWithIPK(toast.message)}
                {showLockedHint && (
                  <span
                    data-testid="toast-receipt-locked"
                    className="block"
                    style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}
                  >
                    {TOPBAR_LOCKED_SUFFIX}
                  </span>
                )}
              </span>
              {toast.count > 1 && (
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    fontSize: 'var(--text-xs)',
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
                  style={{ fontSize: 'var(--text-xs)', color: accentColor, opacity: NAV_GLYPH_OPACITY }}
                  title={NAV_TOOLTIPS[navTarget.kind]}
                  aria-hidden="true"
                >
                  <Icon name={ICON_FOR_WORLD_REF_KIND[navTarget.kind]} size="floor" decorative />
                </span>
              ) : isNavigable && (
                <span
                  className="flex-shrink-0"
                  style={{ fontSize: 'var(--text-xs)', color: accentColor, opacity: NAV_GLYPH_OPACITY }}
                  aria-hidden="true"
                >
                  <Icon name="forward" size="floor" decorative />
                </span>
              )}
              {/* Keyboard-accessible dismiss button — visible on focus */}
              <button
                className="flex-shrink-0 opacity-0 group-focus-within:opacity-100 hover:opacity-100 transition-opacity"
                style={{
                  fontSize: 'var(--text-xs)',
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
                <Icon name="close" size="floor" decorative />
              </button>
            </div>
          </AnimateMount>
        );
      })}
    </div>
  );
}
