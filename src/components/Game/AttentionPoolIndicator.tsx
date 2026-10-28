import { useMemo } from 'react';
import type { AscendantAttentionState, AttentionVisualState } from '../../types/attention';
import { getAttentionVisualState } from '../../engine/attentionPool';
import { Tooltip } from '../shared/Tooltip';
import {
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
} from '../../data/attention-constants';

export interface AttentionPoolIndicatorProps {
  attentionPool: number;
  attentionCapacity: number;
  attentionRegen: number;
  /**
   * THR-1894 — where the meter sits. `rail` (the god rail, under essence) draws a
   * full-width row at the 16 px floor; `topbar` keeps the compact top-bar tier.
   */
  placement?: 'topbar' | 'rail';
}

/** CSS variable name for each visual state's bar colour. */
const STATE_COLOR: Record<AttentionVisualState, string> = {
  focused:    'var(--accent-gold)',
  busy:       'var(--accent-gold-dim)',
  strained:   'var(--warning)',
  overwhelmed:'var(--negative)',
};

/** Bar opacity for each visual state. */
const STATE_OPACITY: Record<AttentionVisualState, number> = {
  focused:    1.0,
  busy:       0.8,
  strained:   0.6,
  overwhelmed:0.4,
};

/** Human-readable label (empty string = no label rendered for "focused"). */
const STATE_LABEL: Record<AttentionVisualState, string> = {
  focused:    '',
  busy:       'Busy',
  strained:   'Strained',
  overwhelmed:'Overwhelmed',
};

/**
 * THR-2062 U2: the gauge's tooltip in words — the state word and how full the pool
 * is, never `pool / capacity` figures (Law 13). Figures stay on the trace.
 */
export const ATTENTION_TOOLTIP_TEXT: Record<AttentionVisualState, string> = {
  focused:     'Attention: most of your notice is free.',
  busy:        'Attention: Busy. Some of your notice is free.',
  strained:    'Attention: Strained. Little of your notice is free.',
  overwhelmed: 'Attention: Overwhelmed. Almost none of your notice is free.',
};

/**
 * Compact attention pool indicator for the top bar.
 *
 * Shows a 40×4 px progress bar whose colour and opacity reflect the
 * ascendant's current attention pool fill ratio. A short text label
 * appears in non-focused states. Hover for numeric details.
 *
 * THR-1711 (3): a passive meter, not a tab. Its label is styled like the Doom
 * and Omen tier labels, which *do* open a detail, so testers clicked it and
 * nothing happened (two testers, two rounds). It now reads as what it is: a
 * `role="meter"` with a help cursor and the shared, visible Tooltip that says
 * what the meter measures — never a native `title`, which shows late or not at
 * all and never explains itself.
 */
export function AttentionPoolIndicator({
  attentionPool,
  attentionCapacity,
  attentionRegen,
  placement = 'topbar',
}: AttentionPoolIndicatorProps) {
  const attentionState: AscendantAttentionState = useMemo(() => ({
    attentionPool:     attentionPool     ?? ATTENTION_BASE_CAPACITY,
    attentionCapacity: attentionCapacity ?? ATTENTION_BASE_CAPACITY,
    attentionRegen:    attentionRegen    ?? ATTENTION_BASE_REGEN,
  }), [attentionPool, attentionCapacity, attentionRegen]);

  const visualState = useMemo(
    () => getAttentionVisualState(attentionState),
    [attentionState],
  );

  const ratio = attentionState.attentionCapacity > 0
    ? Math.min(attentionState.attentionPool / attentionState.attentionCapacity, 1)
    : 0;

  const color   = STATE_COLOR[visualState];
  const opacity = STATE_OPACITY[visualState];
  const label   = STATE_LABEL[visualState];

  /*
   * THR-1426 dropped the per-tick rate; THR-2062 (U2) drops the balance figures too.
   * The bar shows how full the pool is and the words say it, so the tooltip needs no
   * number (Law 13; the taste profile's "no numbers visible"). Figures stay on the trace.
   */
  const tooltipTitle = ATTENTION_TOOLTIP_TEXT[visualState];

  if (placement === 'rail') {
    return (
      <Tooltip id="ui.attention" label={tooltipTitle} block>
        <div
          data-testid="attention-pool-indicator"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={attentionState.attentionCapacity}
          aria-valuenow={attentionState.attentionPool}
          aria-label={tooltipTitle}
          style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24, cursor: 'help' }}
        >
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {label ? `Attention · ${label}` : 'Attention'}
          </span>
          <div style={{ flex: 1, height: 4, borderRadius: 'var(--radius-chip)', backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${ratio * 100}%`,
                height: '100%',
                backgroundColor: color,
                opacity,
                borderRadius: 'var(--radius-chip)',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    // THR-1814: the desc comes from the registry (`ui.attention`, Law 17); the live
    // pool / cap / state label stays as the per-render override.
    <Tooltip id="ui.attention" label={tooltipTitle}>
    <div
      className="topbar-tier"
      data-testid="attention-pool-indicator"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={attentionState.attentionCapacity}
      aria-valuenow={attentionState.attentionPool}
      style={{ opacity, cursor: 'help' }}
      aria-label={tooltipTitle}
    >
      <span className="topbar-section-label">Attention</span>
      <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
        {/* Progress bar track */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'var(--bg-surface)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {/* Filled portion */}
          <div
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: 2,
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        </div>

        {/* State label — only shown when not focused */}
        {label && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
    </Tooltip>
  );
}
