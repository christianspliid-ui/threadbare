import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '28px', padding: '0 8px', fontSize: 'var(--text-xs)' },
  md: { height: '36px', padding: '0 14px', fontSize: 'var(--text-sm)' },
  lg: { height: '44px', padding: '0 18px', fontSize: 'var(--text-base)' },
};

const VARIANT_STYLES: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: {
      backgroundColor: 'var(--accent-gold)',
      border: 'none',
      color: 'var(--bg-abyss)',
      fontWeight: 600,
    },
    hover: {
      backgroundColor: '#c49038',
    },
  },
  secondary: {
    base: {
      backgroundColor: 'var(--bg-raised)',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
    },
    hover: {
      backgroundColor: 'var(--bg-hover)',
      borderColor: 'var(--border-medium)',
    },
  },
  ghost: {
    base: {
      backgroundColor: 'transparent',
      border: '1px solid transparent',
      color: 'var(--text-muted)',
    },
    hover: {
      backgroundColor: 'var(--bg-hover)',
      color: 'var(--text-primary)',
    },
  },
  danger: {
    base: {
      backgroundColor: 'rgba(248,113,113,0.15)',
      border: '1px solid rgba(248,113,113,0.25)',
      color: 'var(--negative)',
    },
    hover: {
      backgroundColor: 'rgba(248,113,113,0.25)',
    },
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = 'md', icon, loading, fullWidth, disabled, children, style, className, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size];
  const variantStyle = VARIANT_STYLES[variant];

  const baseStyle: React.CSSProperties = {
    ...sizeStyle,
    ...variantStyle.base,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '6px',
    fontFamily: 'var(--font-body)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'background-color var(--anim-fast) ease, border-color var(--anim-fast) ease, color var(--anim-fast) ease, transform var(--anim-fast) ease',
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    const el = e.currentTarget;
    const hv = variantStyle.hover;
    if (hv.backgroundColor) el.style.backgroundColor = hv.backgroundColor;
    if (hv.borderColor) el.style.borderColor = hv.borderColor;
    if (hv.color) el.style.color = hv.color;
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    const el = e.currentTarget;
    const bs = variantStyle.base;
    el.style.backgroundColor = (bs.backgroundColor ?? '') as string;
    el.style.borderColor = (bs.border?.includes('solid') ? bs.border.split('solid')[1].trim() : '') as string;
    if (bs.color) el.style.color = bs.color as string;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    e.currentTarget.style.transform = 'scale(0.98)';
  }

  function handleMouseUp(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.transform = '';
  }

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`${loading ? 'animate-breathe' : ''} ${className ?? ''}`}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...rest}
    >
      {icon && <span className="flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
});
