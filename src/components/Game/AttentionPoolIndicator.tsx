import { useMemo } from 'react';
import type { AscendantAttentionState, AttentionVisualState } from '../../types/attention';
import { getAttentionVisualState } from '../../engine/attentionPool';
import {
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
} from '../../data/attention-constants';

export interface AttentionPoolIndicatorProps {
  attentionPool: number;
  attentionCapacity: number;
  attentionRegen: number;
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
 * Compact attention pool indicator for the top bar.
 *
 * Shows a 40×4 px progress bar whose colour and opacity reflect the
 * ascendant's current attention pool fill ratio. A short text label
 * appears in non-focused states. Hover for numeric details.
 */
export function AttentionPoolIndicator({
  attentionPool,
  attentionCapacity,
  attentionRegen,
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

  const poolDisplay  = attentionState.attentionPool.toFixed(1);
  const capDisplay   = attentionState.attentionCapacity.toFixed(1);
  const regenDisplay = attentionState.attentionRegen.toFixed(1);
  const stateLabel   = visualState.charAt(0).toUpperCase() + visualState.slice(1);

  const tooltipTitle = `Attention: ${poolDisplay} / ${capDisplay} (${stateLabel})\nRegen: ${regenDisplay}/tick`;

  return (
    <div
      className="topbar-tier"
      style={{ opacity }}
      title={tooltipTitle}
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
      <span
        style={{
          font: 'var(--type-body-small)',
          color: 'var(--text-tertiary)',
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}
      >
        regen {regenDisplay}/tick
      </span>
    </div>
  );
}
