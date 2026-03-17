import { memo } from 'react';
import type { ReactNode } from 'react';

interface SubLocationEntryProps {
  name: string;
  flavorText?: string;
  onClick: () => void;
  onDoubleClick: () => void;
  /** Inline agent entries for this sublocation */
  children?: ReactNode;
}

/** Compact nested sublocation row for display within a parent LocationCard. */
export const SubLocationEntry = memo(function SubLocationEntry({
  name, flavorText, onClick, onDoubleClick, children,
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
        borderLeft: '2px solid var(--border-subtle)',
        paddingLeft: '12px',
        margin: '6px 0',
      }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
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
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: 'var(--border-subtle)',
            textUnderlineOffset: '2px',
            transition: 'color 0.15s ease',
          }}
        >
          {name}
        </span>
      </div>
      {flavorText && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-tertiary)',
            fontSize: '0.75rem',
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
