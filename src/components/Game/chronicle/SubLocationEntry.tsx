import { memo } from 'react';
import type { ReactNode } from 'react';

interface SubLocationEntryProps {
  name: string;
  flavorText?: string;
  onClick: () => void;
  /** Number of souls currently at this sublocation */
  soulCount?: number;
  /** Inline agent entries for this sublocation */
  children?: ReactNode;
}

/** Compact nested sublocation row for display within a parent LocationCard. */
export const SubLocationEntry = memo(function SubLocationEntry({
  name, flavorText, onClick, soulCount, children,
}: SubLocationEntryProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      style={{
        borderLeft: '2px solid var(--border-gold)',
        paddingLeft: '12px',
        margin: '6px 0',
      }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Sublocation: ${name}`}
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => {
          const target = e.currentTarget.querySelector('[data-subloc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--accent-gold)';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget.querySelector('[data-subloc-name]') as HTMLElement | null;
          if (target) target.style.color = 'var(--text-secondary)';
        }}
      >
        <span
          data-subloc-name
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: 'var(--border-subtle)',
            textUnderlineOffset: '2px',
            transition: 'color 0.15s ease',
          }}
        >
          {name}
          {soulCount !== undefined && soulCount > 0 && (
            <span style={{ fontWeight: 400, opacity: 0.6, textDecoration: 'none', marginLeft: '4px' }}>
              ({soulCount})
            </span>
          )}
        </span>
      </div>
      {flavorText && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: '2px 0 0 0',
          }}
        >
          {flavorText}
        </p>
      )}
      {children}
    </div>
  );
});
