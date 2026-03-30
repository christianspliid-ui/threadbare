import { memo } from 'react';

interface SoulCardProps {
  name: string;
  locationName: string;
  sphereColor: string; // hex color from getSphereColor
  archetypeName?: string;
  flavorText: string;
  onClick: () => void;
}

export const SoulCard = memo(function SoulCard({
  name,
  locationName,
  sphereColor,
  archetypeName,
  flavorText,
  onClick,
}: SoulCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Soul: ${name}`}
      style={{
        background: 'var(--bg-raised)',
        borderLeft: `3px solid ${sphereColor}`,
        border: `1px solid var(--border-gold)`,
        borderLeftColor: sphereColor,
        borderRadius: '6px',
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        margin: '8px 0',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)';
        (e.currentTarget as HTMLDivElement).style.borderLeftColor = sphereColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-gold)';
        (e.currentTarget as HTMLDivElement).style.borderLeftColor = sphereColor;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'underline',
            textDecorationColor: 'var(--border-subtle)',
            textUnderlineOffset: '3px',
          }}
        >
          {name}
        </span>
        {archetypeName && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginLeft: 'auto',
            }}
          >
            {archetypeName}
          </span>
        )}
      </div>
      {flavorText && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: '3px 0 0 0',
          }}
        >
          {flavorText}
        </p>
      )}
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '3px',
        }}
      >
        {locationName}
      </div>
    </div>
  );
});
