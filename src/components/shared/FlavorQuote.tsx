/**
 * FlavorQuote — inset quote well (THR-799).
 *
 * Narrative before mechanics: on a ceremonial surface the flavor line sits above
 * the effect text, in a recessed well with an ornamental divider. Consolidates
 * the ad-hoc `.quote-block` treatment into a primitive; the CSS class stays in
 * place for its existing callers (additive, NFP #6).
 *
 * Renders nothing when given no children — a missing prose field must remove
 * the zone, never leave an empty well (fail-soft, NFP #4).
 */

import React from 'react';

export interface FlavorQuoteProps {
  children?: React.ReactNode;
  /** Right-aligned source line beneath the quote. */
  attribution?: string;
  /** Ornamental divider above the quote. Default true. */
  divider?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** The divider glyph, flanked by hairlines — same construction as `.ornamental-rule`. */
const DIVIDER_GLYPH = '✦'; // ✦

export const FlavorQuote = React.memo(function FlavorQuote({
  children,
  attribution,
  divider = true,
  className,
  style,
}: FlavorQuoteProps) {
  // Zone omission, not an empty zone. `0` is not meaningful quote content, so a
  // plain falsy check is right here.
  if (!children) return null;

  return (
    <div
      className={`inset-well ${className ?? ''}`}
      data-testid="flavor-quote"
      style={{
        padding: 'var(--space-4) var(--space-5)',
        ...style,
      }}
    >
      {divider && (
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold-strong), transparent)' }} />
          <span style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', lineHeight: 1 }}>
            {DIVIDER_GLYPH}
          </span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-gold-strong), transparent)' }} />
        </div>
      )}

      <div style={{ font: 'var(--type-flavor)', color: 'var(--text-secondary)', textAlign: 'center' }}>
        {children}
      </div>

      {attribution && (
        <div
          data-testid="flavor-quote-attribution"
          style={{
            marginTop: 'var(--space-2)',
            textAlign: 'right',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em',
          }}
        >
          {attribution}
        </div>
      )}
    </div>
  );
});
