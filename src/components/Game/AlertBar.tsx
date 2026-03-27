import { useState, useCallback } from 'react';
import type { AlertIcon, AlertItem, NavigationTarget } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';

interface AlertBarProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  /** Called when an alert with actorId is clicked — navigates to that agent */
  onSelectAgent?: (agentId: string) => void;
  /** Called when an alert with a navigation target is clicked */
  onNavigate?: (target: NavigationTarget) => void;
}

const ALERT_GLYPHS: Record<AlertIcon, string> = {
  death:      '✝',
  birth:      '✦',
  doom:       '◈',
  mandate:    '⬡',
  discovery:  '◎',
  rival:      '⚔',
  dilemma:    '⚖',
  harvest:    '⟡',
  revelation: '📖',
  social:     '🤝',
  faction:    '⚜',
  trust:      '🔗',
};

function getGlyph(icon: AlertIcon): string {
  return ALERT_GLYPHS[icon] ?? '●';
}

export const alertBarTestHelpers = { getGlyph };

export function AlertBar({ alerts, onDismiss, onSelectAgent, onNavigate }: AlertBarProps) {
  // Track which alerts are fading out (right-click dismissed)
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const handleRightClickDismiss = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (alerts.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 ml-3" aria-label="Pending alerts" role="list">
      {alerts.map(alert => {
        const color = alert.sphere ? getSphereColor(alert.sphere) : 'var(--accent-gold)';
        const navTarget = alert.navigationTarget;
        const isNavigable = Boolean(navTarget && onNavigate) || Boolean(alert.actorId && onSelectAgent);
        const isDismissing = dismissingIds.has(alert.id);
        return (
          <button
            key={alert.id}
            role="listitem"
            onClick={() => {
              // Alert left-click: navigate only, keep alert visible (bookmark behavior)
              if (navTarget && onNavigate) {
                onNavigate(navTarget);
              } else if (alert.actorId && onSelectAgent) {
                onSelectAgent(alert.actorId);
              }
              // NOTE: alerts no longer auto-dismiss on left-click — use right-click to dismiss
            }}
            onContextMenu={(e) => handleRightClickDismiss(e, alert.id)}
            className="relative flex items-center justify-center rounded transition-all pulse-gold"
            style={{
              width: '28px',
              height: '28px',
              fontSize: '14px',
              color,
              backgroundColor: color + '1a',
              border: `1px solid ${color}44`,
              opacity: isDismissing ? 0 : 1,
              transition: 'opacity 150ms ease-out',
            }}
            title={`${alert.message}${isNavigable ? ' — click to navigate, right-click to dismiss' : ' — right-click to dismiss'}`}
            aria-label={`${alert.icon} alert: ${alert.message}${isNavigable ? ' (click to navigate)' : ''}`}
            aria-description="Right-click to dismiss"
          >
            {getGlyph(alert.icon)}
          </button>
        );
      })}
    </div>
  );
}
