import { memo } from 'react';
import type { ReactNode } from 'react';

interface LocationCardProps {
  name: string;
  subtype: string; // e.g. 'settlement', 'landmark', 'ruin'
  agentCount: number;
  flavorText: string;
  onClick: () => void;
  /** Nested content: sublocation cards, inline agent entries */
  children?: ReactNode;
}

const SUBTYPE_GLYPHS: Record<string, string> = {
  settlement: '🏘',
  landmark: '⛰',
  ruin: '🏚',
  shrine: '⛩',
  crossing: '🌉',
  city: '◆',
  default: '◆',
};

export const LocationCard = memo(function LocationCard({
  name, subtype, agentCount, flavorText, onClick, children,
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
      className="card-gold-edge"
      style={{
        background: 'var(--bg-raised)',
        padding: '10px 14px',
        transition: 'border-color 0.2s ease',
        margin: '8px 0',
      }}
    >
      {/* Clickable header row */}
      <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Location: ${name}`}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => {
          const target = e.currentTarget.querySelector('[data-loc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--accent-gold)';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget.querySelector('[data-loc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--text-primary)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1em' }}>{glyph}</span>
          <span
            data-loc-name
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'underline',
              textDecorationColor: 'var(--border-subtle)',
              textUnderlineOffset: '3px',
              transition: 'color 0.15s ease',
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--accent-gold-dim)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginLeft: 'auto',
            }}
          >
            {subtype}
          </span>
        </div>
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
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            textAlign: 'right',
            marginTop: '4px',
          }}
        >
          {agentCount} soul{agentCount !== 1 ? 's' : ''} present
        </div>
      )}
      {/* Nested children: sublocations and agents */}
      {children}
    </div>
  );
});
