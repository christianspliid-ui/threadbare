import { memo } from 'react';
import type { ReactNode } from 'react';
import { getLocationConceptArtUrl } from '../../../data/location-concept-art';

interface LocationCardProps {
  name: string;
  subtype: string; // e.g. 'settlement', 'landmark', 'ruin'
  agentCount: number;
  flavorText: string;
  onClick: () => void;
  /** Nested content: sublocation cards, inline agent entries */
  children?: ReactNode;
}

export const LocationCard = memo(function LocationCard({
  name, subtype, agentCount, flavorText, onClick, children,
}: LocationCardProps) {
  const conceptArtUrl = getLocationConceptArtUrl(subtype);

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
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        margin: '8px 0',
      }}
    >
      {/* Concept art banner */}
      <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Location: ${name}`}
        style={{ cursor: 'pointer', position: 'relative' }}
        onMouseEnter={(e) => {
          const target = e.currentTarget.querySelector('[data-loc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--accent-gold)';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget.querySelector('[data-loc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--text-primary)';
        }}
      >
        <div style={{
          width: '100%',
          aspectRatio: '16 / 6',
          overflow: 'hidden',
        }}>
          <img
            src={conceptArtUrl}
            alt={subtype}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              opacity: 0.85,
              display: 'block',
            }}
          />
        </div>
        {/* Gradient overlay + title bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '16px 14px 8px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}>
          <span
            data-loc-name
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
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

      {/* Card body */}
      <div style={{ padding: '8px 14px 10px' }}>
        {flavorText && (
          <p
            style={{
              fontFamily: 'var(--font-prose)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              margin: '0 0 4px 0',
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
            }}
          >
            {agentCount} soul{agentCount !== 1 ? 's' : ''} present
          </div>
        )}
        {/* Nested children: sublocations and agents */}
        {children}
      </div>
    </div>
  );
});
