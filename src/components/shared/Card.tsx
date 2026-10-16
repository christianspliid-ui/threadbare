import { SectionHeading } from './SectionHeading';
import { IconButton } from './IconButton';
import { Icon } from './Icon';
import { Panel, type PanelProps } from './Panel';

type CardVariant = 'surface' | 'raised' | 'glass';

interface CardProps {
  variant?: CardVariant;
  /** Padding applied to the root container. Use for simple (non-compound) cards. */
  padding?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Card — the titled panel (THR-1884). A `Panel` at level `panel` plus
 * `Card.Header` (title, count, trailing, close), `Card.Body` and `Card.Footer`.
 * A bounded surface is a `Panel`; one with a title row is a `Card`; a playing
 * card is `CardFace`.
 *
 * The three variants map onto Panel: `surface` → `panel`; `raised` → `panel` +
 * `floating` (the panel shadow on the surface ground); `glass` → `panel` +
 * `material="glass"`.
 */
const VARIANT_PANEL: Record<CardVariant, Pick<PanelProps, 'floating' | 'material'>> = {
  surface: {},
  raised: { floating: true },
  glass: { material: 'glass' },
};

function CardRoot({ variant = 'surface', padding, children, className, style }: CardProps) {
  return (
    <Panel
      level="panel"
      {...VARIANT_PANEL[variant]}
      className={className ?? ''}
      style={{
        overflow: 'hidden',
        ...(padding !== undefined ? { padding } : {}),
        ...style,
      }}
    >
      {children}
    </Panel>
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
          icon={<Icon name="close" size="chip" decorative />}
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
