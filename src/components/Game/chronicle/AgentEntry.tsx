import { memo } from 'react';

interface AgentEntryProps {
  name: string;
  sphereColor: string;
  archetypeName?: string;
  onClick: () => void;
}

/** Compact inline agent row for display within a LocationCard. */
export const AgentEntry = memo(function AgentEntry({
  name, sphereColor, archetypeName, onClick,
}: AgentEntryProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Soul: ${name}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 0',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget.querySelector('[data-agent-name]') as HTMLElement | null;
        if (target) target.style.color = 'var(--accent-gold)';
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget.querySelector('[data-agent-name]') as HTMLElement | null;
        if (target) target.style.color = 'var(--text-primary)';
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: sphereColor,
          flexShrink: 0,
        }}
      />
      <span
        data-agent-name
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          textDecoration: 'underline',
          textDecorationColor: 'var(--border-subtle)',
          textUnderlineOffset: '2px',
          transition: 'color 0.15s ease',
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
          }}
        >
          {archetypeName}
        </span>
      )}
    </div>
  );
});
