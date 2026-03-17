import type { AlertIcon, AlertItem } from '../../types/notification';
import { getSphereColor } from '../../data/sphereIcons';

interface AlertBarProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  /** Called when an alert with actorId is clicked — navigates to that agent */
  onSelectAgent?: (agentId: string) => void;
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
};

function getGlyph(icon: AlertIcon): string {
  return ALERT_GLYPHS[icon] ?? '●';
}

export const alertBarTestHelpers = { getGlyph };

export function AlertBar({ alerts, onDismiss, onSelectAgent }: AlertBarProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 ml-3" aria-label="Pending alerts" role="list">
      {alerts.map(alert => {
        const color = alert.sphere ? getSphereColor(alert.sphere) : 'var(--accent-gold)';
        const isAgentLinked = Boolean(alert.actorId && onSelectAgent);
        return (
          <button
            key={alert.id}
            role="listitem"
            onClick={() => {
              if (isAgentLinked) {
                onSelectAgent!(alert.actorId!);
              }
              onDismiss(alert.id);
            }}
            className="relative flex items-center justify-center rounded transition-colors pulse-gold"
            style={{
              width: '28px',
              height: '28px',
              fontSize: '14px',
              color,
              backgroundColor: color + '1a',
              border: `1px solid ${color}44`,
            }}
            title={isAgentLinked ? `${alert.message} — click to view agent` : alert.message}
            aria-label={`${alert.icon} alert: ${alert.message}${isAgentLinked ? ' (click to view agent)' : ''}`}
          >
            {getGlyph(alert.icon)}
          </button>
        );
      })}
    </div>
  );
}
