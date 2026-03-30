import { forwardRef } from 'react';

interface ListRowProps {
  accentColor?: string;
  selected?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Leading({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {children}
    </span>
  );
}

export const ListRow = Object.assign(
  forwardRef<HTMLDivElement, ListRowProps>(function ListRow(
    { accentColor, selected, onClick, trailing, children, className },
    ref,
  ) {
    const interactive = !!onClick;

    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.625rem 0.75rem',
      borderRadius: '0.375rem',
      cursor: interactive ? 'pointer' : undefined,
      borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
      transition: 'background-color var(--anim-fast) ease',
      ...(selected
        ? {
            backgroundColor: 'var(--accent-gold-glow)',
            outline: '1px solid var(--border-accent)',
          }
        : {}),
    };

    function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
      if (!interactive || selected) return;
      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
    }

    function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
      if (!interactive || selected) return;
      e.currentTarget.style.backgroundColor = '';
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        e.preventDefault();
        onClick();
      }
    }

    function handleTrailingClick(e: React.MouseEvent) {
      e.stopPropagation();
    }

    return (
      <div
        ref={ref}
        className={`interactive-row ${className ?? ''}`}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={interactive ? handleKeyDown : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {children}
        </div>
        {trailing && (
          <div onClick={handleTrailingClick} style={{ flexShrink: 0 }}>
            {trailing}
          </div>
        )}
      </div>
    );
  }),
  { Title, Subtitle, Leading },
);
