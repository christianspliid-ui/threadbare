import { SectionHeading } from './SectionHeading';
import { IconButton } from './IconButton';

type CardVariant = 'surface' | 'raised' | 'glass';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<CardVariant, React.CSSProperties> = {
  surface: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
  },
  raised: {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border-medium)',
  },
  glass: {
    border: '1px solid var(--border-subtle)',
  },
};

function CardRoot({ variant = 'surface', children, className, style }: CardProps) {
  const isGlass = variant === 'glass';
  const baseStyle: React.CSSProperties = {
    ...VARIANT_STYLES[variant],
    borderRadius: 'var(--panel-radius)',
    overflow: 'hidden',
    ...style,
  };

  return (
    <div
      className={`${isGlass ? 'panel-glass' : ''} ${className ?? ''}`}
      style={baseStyle}
    >
      {children}
    </div>
  );
}

interface HeaderProps {
  title: string;
  count?: number;
  onBack?: () => void;
  trailing?: React.ReactNode;
}

function Header({ title, count, onBack, trailing }: HeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: 'var(--panel-padding)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <SectionHeading count={count}>{title}</SectionHeading>
      {trailing && <div style={{ marginLeft: 'auto' }}>{trailing}</div>}
      {onBack && (
        <IconButton
          icon={<span>✕</span>}
          size="sm"
          aria-label="Close"
          onClick={onBack}
          style={{ marginLeft: trailing ? undefined : 'auto' }}
        />
      )}
    </div>
  );
}

interface BodyProps {
  children: React.ReactNode;
  scroll?: boolean;
}

function Body({ children, scroll }: BodyProps) {
  return (
    <div
      style={{
        padding: 'var(--panel-padding)',
        ...(scroll ? { overflowY: 'auto' as const } : {}),
      }}
    >
      {children}
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        padding: 'var(--panel-padding)',
      }}
    >
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, { Header, Body, Footer });
