import React from 'react';
import type { DriftThresholdBand } from '../../../types/traces/encounter-traces';

export interface DriftIndicatorData {
  readonly axisId: string;
  readonly prose: string;
  readonly band: DriftThresholdBand;
}

export interface DriftIndicatorProps {
  drift: DriftIndicatorData | null;
  onDismiss?: (signature: string) => void;
}

const BAND_FONT_SIZE_PX: Record<DriftThresholdBand, number> = {
  soft: 11,
  banner: 12,
  becoming: 13,
};

const BAND_COLOR: Record<DriftThresholdBand, string> = {
  soft: 'var(--text-tertiary)',
  banner: 'var(--text-secondary)',
  becoming: 'var(--accent-gold-dim)',
};

const BAND_LETTER_SPACING: Record<DriftThresholdBand, string> = {
  soft: '0.01em',
  banner: '0.02em',
  becoming: '0.04em',
};

const BAND_WEIGHT: Record<DriftThresholdBand, number> = {
  soft: 400,
  banner: 500,
  becoming: 600,
};

function makeSignature(drift: DriftIndicatorData): string {
  return `${drift.axisId}::${drift.band}`;
}

/**
 * DriftIndicator — italic single-line readout of the protagonist's strongest archetype tilt.
 * Hidden when below SOFT (drift < 0.30). Becomes more emphatic at BANNER (0.60) and BECOMING (0.85).
 * Dismissible per (axisId, band) tuple — returns when the next fresh threshold crosses.
 */
export function DriftIndicator({ drift, onDismiss }: DriftIndicatorProps) {
  const [dismissed, setDismissed] = React.useState<ReadonlySet<string>>(new Set());

  if (!drift) return null;

  const signature = makeSignature(drift);
  if (dismissed.has(signature)) return null;

  const handleDismiss = () => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(signature);
      return next;
    });
    onDismiss?.(signature);
  };

  return (
    <div
      data-testid="encounter-drift-indicator"
      data-axis-id={drift.axisId}
      data-band={drift.band}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '6px 8px',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <em
        style={{
          fontSize: BAND_FONT_SIZE_PX[drift.band],
          color: BAND_COLOR[drift.band],
          letterSpacing: BAND_LETTER_SPACING[drift.band],
          fontWeight: BAND_WEIGHT[drift.band],
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {drift.prose}
      </em>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="dismiss drift indicator"
        data-testid="encounter-drift-indicator-dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 14,
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
