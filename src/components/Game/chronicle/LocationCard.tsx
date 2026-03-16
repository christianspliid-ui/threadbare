import { memo } from 'react';

interface LocationCardProps {
  name: string;
  subtype: string; // e.g. 'settlement', 'landmark', 'ruin'
  agentCount: number;
  flavorText: string;
  onClick: () => void;
  onDoubleClick: () => void;
}

const SUBTYPE_GLYPHS: Record<string, string> = {
  settlement: '🏘',
  landmark: '⛰',
  ruin: '🏚',
  shrine: '⛩',
  crossing: '🌉',
  default: '◆',
};

export const LocationCard = memo(function LocationCard({
  name, subtype, agentCount, flavorText, onClick, onDoubleClick,
}: LocationCardProps) {
  const glyph = SUBTYPE_GLYPHS[subtype] || SUBTYPE_GLYPHS.default;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Location: ${name}`}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        margin: '8px 0',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-gold-dim)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1em' }}>{glyph}</span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginLeft: 'auto',
          }}
        >
          {subtype}
        </span>
      </div>
      {flavorText && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: '4px 0 0 0',
            paddingLeft: '26px',
          }}
        >
          {flavorText}
        </p>
      )}
      {agentCount > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            textAlign: 'right',
            marginTop: '4px',
          }}
        >
          {agentCount} soul{agentCount !== 1 ? 's' : ''} present
        </div>
      )}
    </div>
  );
});
