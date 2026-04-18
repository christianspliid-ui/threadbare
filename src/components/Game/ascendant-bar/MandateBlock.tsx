import React, { useState } from 'react';
import { MANDATE_TREND_COLOR, MANDATE_TREND_ARROW, MANDATE_TREND_WORD } from '../../../data/ascendant-bar-content';
import type { MandateRowView } from './selectors';
import styles from './styles.module.css';

interface MandateBlockProps {
  mandate: MandateRowView;
  onOpen: () => void;
}

export function MandateBlock({ mandate, onOpen }: MandateBlockProps) {
  const [hov, setHov] = useState(false);
  const trendColor = MANDATE_TREND_COLOR[mandate.trend] ?? 'var(--text-secondary)';
  const arrow = MANDATE_TREND_ARROW[mandate.trend] ?? '—';
  const word = MANDATE_TREND_WORD[mandate.trend] ?? 'Holding';
  const fillPct = Math.round(mandate.progress * 100);

  return (
    <div
      className={styles.mandateBlock}
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
      aria-label="View mandate details"
    >
      {/* Flavor line */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: hov ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontStyle: 'italic', lineHeight: 1.4,
        transition: 'color 0.15s ease',
      }}>
        {mandate.flavorLine}
      </div>

      {/* Progress bar + trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={styles.mandateFillBar}>
          <div style={{
            height: '100%', width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${trendColor}88, ${trendColor})`,
            boxShadow: mandate.trend === 'rising' ? `0 0 8px ${trendColor}` : undefined,
            transition: 'width 0.4s ease-out',
          }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 12, color: trendColor,
          display: 'flex', alignItems: 'center', gap: 4,
          letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          {word} <span style={{ fontSize: 14 }}>{arrow}</span>
        </span>
      </div>
    </div>
  );
}
