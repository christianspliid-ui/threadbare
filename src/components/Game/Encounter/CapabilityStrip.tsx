import React from 'react';

export interface CapabilityStripProps {
  label: string;
  sphereLabel?: string;
  narrativeHint?: string;
  filledDots: number;
  totalDots?: number;
  accentColor?: string;
}

const DEFAULT_TOTAL_DOTS = 5;
const MIN_DOTS = 1;

function clampDotCount(value: number, total: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), total));
}

export function CapabilityStrip({
  label,
  sphereLabel,
  narrativeHint,
  filledDots,
  totalDots = DEFAULT_TOTAL_DOTS,
  accentColor = 'var(--accent-gold)',
}: CapabilityStripProps) {
  const safeTotalDots = Math.max(MIN_DOTS, Math.round(totalDots));
  const safeFilledDots = clampDotCount(filledDots, safeTotalDots);

  return (
    <div
      data-testid="capability-strip"
      style={{
        display: 'grid',
        gridTemplateColumns: '80px auto minmax(0, 1fr)',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          color: accentColor,
          fontSize: 'var(--text-xs)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {sphereLabel ?? label}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: safeTotalDots }, (_, index) => (
          <span
            key={`${label}-dot-${index}`}
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '999px',
              background:
                index < safeFilledDots
                  ? accentColor
                  : 'color-mix(in srgb, var(--bg-raised) 75%, var(--text-tertiary) 25%)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          fontStyle: narrativeHint ? 'italic' : 'normal',
          lineHeight: 1.4,
          minWidth: 0,
        }}
      >
        {narrativeHint ?? ''}
      </div>
    </div>
  );
}
