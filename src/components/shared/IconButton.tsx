import { forwardRef } from 'react';

type IconButtonSize = 'sm' | 'md';
type IconButtonVariant = 'default' | 'close';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  badge?: number | string;
  active?: boolean;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

const SIZE_PX: Record<IconButtonSize, number> = { sm: 28, md: 32 };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, badge, active, size = 'md', variant = 'default', disabled, style, className, ...rest },
  ref,
) {
  const px = SIZE_PX[size];
  const isClose = variant === 'close';

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${px}px`,
    height: `${px}px`,
    padding: 0,
    fontSize: 'var(--text-xs)',
    borderRadius: isClose ? '50%' : '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background-color var(--anim-fast) ease, border-color var(--anim-fast) ease, color var(--anim-fast) ease',
    ...(isClose
      ? {
          backgroundColor: 'rgba(10, 10, 14, 0.6)',
          border: 'none',
          color: 'var(--text-tertiary)',
        }
      : active
        ? {
            backgroundColor: 'var(--accent-gold-glow)',
            border: '1px solid var(--accent-gold-dim)',
            color: 'var(--accent-gold)',
          }
        : {
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }),
    ...style,
  };

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    const el = e.currentTarget;
    if (isClose) {
      el.style.color = 'var(--text-primary)';
    } else if (!active) {
      el.style.backgroundColor = 'var(--bg-hover)';
      el.style.color = 'var(--text-primary)';
    }
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    const el = e.currentTarget;
    if (isClose) {
      el.style.color = 'var(--text-tertiary)';
    } else if (!active) {
      el.style.backgroundColor = 'transparent';
      el.style.color = 'var(--text-muted)';
    }
  }

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    fontFamily: 'monospace',
    fontSize: 'var(--text-xs)',
    lineHeight: 1,
    minWidth: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '7px',
    backgroundColor: 'var(--bg-deep)',
    border: '1px solid var(--border-subtle)',
    color: 'inherit',
    padding: '0 3px',
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={className}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      {badge !== undefined && (
        <span aria-hidden="true" style={badgeStyle}>
          {badge}
        </span>
      )}
    </button>
  );
});
