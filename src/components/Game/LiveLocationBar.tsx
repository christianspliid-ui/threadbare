/**
 * LiveLocationBar.tsx — Living World summary bar (THR-127).
 *
 * Shows the top-3 most active visible locations sorted by pulse severity.
 * Rotates through a pool of up to 9 non-quiet locations every ROTATE_EVERY_TICKS ticks.
 * Clicking a location entry centers the camera on that hex.
 * Dismissible via the × button.
 *
 * Placement: absolute bottom-left of the map area, below AvatarHUD.
 * Only visible when viewLevel === 'world'.
 */

import React, { useState, useMemo } from 'react';
import type { LocationActivitySummary, LocationPulse } from '../../types/locationActivity';

export const LIVE_LOCATION_BAR_CONSTANTS = {
  /** Ticks between rotation to the next page of locations (12 ticks = 1 game day) */
  ROTATE_EVERY_TICKS: 4,
  /** Max locations to draw from when building the rotation pool */
  POOL_SIZE: 9,
  /** Locations shown per page */
  PAGE_SIZE: 3,
} as const;

const PULSE_SEVERITY: Record<LocationPulse, number> = {
  volatile: 5,
  tense: 4,
  busy: 3,
  stirring: 2,
  quiet: 1,
};

const PULSE_COLOR: Record<LocationPulse, string> = {
  volatile: '#c0392b',
  tense: '#d4a040',
  busy: '#b8963a',
  stirring: 'var(--text-tertiary)',
  quiet: 'var(--text-disabled)',
};

const PULSE_GLYPH: Record<LocationPulse, string> = {
  volatile: '◉',
  tense: '◎',
  busy: '●',
  stirring: '·',
  quiet: '·',
};

const PULSE_LABEL: Record<LocationPulse, string> = {
  volatile: 'volatile',
  tense: 'tense',
  busy: 'busy',
  stirring: 'stirring',
  quiet: 'quiet',
};

interface LiveLocationBarProps {
  summaries: Map<string, LocationActivitySummary>;
  tick: number;
  /** Optional callback to center the map camera on a hex */
  onCenterOnHex?: (col: number, row: number) => void;
}

/**
 * Selects up to PAGE_SIZE non-quiet locations for the current rotation page.
 */
function selectPage(
  summaries: Map<string, LocationActivitySummary>,
  tick: number,
): LocationActivitySummary[] {
  const { ROTATE_EVERY_TICKS, POOL_SIZE, PAGE_SIZE } = LIVE_LOCATION_BAR_CONSTANTS;

  const sorted = [...summaries.values()]
    .filter(s => s.pulse !== 'quiet')
    .sort((a, b) => PULSE_SEVERITY[b.pulse] - PULSE_SEVERITY[a.pulse])
    .slice(0, POOL_SIZE);

  if (sorted.length === 0) return [];

  const numPages = Math.ceil(sorted.length / PAGE_SIZE);
  const page = numPages > 1
    ? Math.floor(tick / ROTATE_EVERY_TICKS) % numPages
    : 0;

  return sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

export const LiveLocationBar = React.memo(function LiveLocationBar({
  summaries,
  tick,
  onCenterOnHex,
}: LiveLocationBarProps) {
  const [dismissed, setDismissed] = useState(false);

  const entries = useMemo(() => selectPage(summaries, tick), [summaries, tick]);

  if (dismissed || entries.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Active locations"
      style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        zIndex: 20,
        backgroundColor: 'rgba(10, 10, 14, 0.85)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0.375rem',
        padding: 'var(--space-2) var(--space-3)',
        minWidth: '240px',
        maxWidth: '320px',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--space-1)' }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Active Locations
        </span>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss active locations bar"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            padding: '0 0 0 var(--space-2)',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Location entries */}
      <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
        {entries.map(summary => {
          const color = PULSE_COLOR[summary.pulse];
          const glyph = PULSE_GLYPH[summary.pulse];
          const murmur = summary.murmurs[0] ?? '';
          const canClick = Boolean(onCenterOnHex);

          return (
            <button
              key={summary.locationId}
              onClick={() => onCenterOnHex?.(summary.hexCol, summary.hexRow)}
              disabled={!canClick}
              aria-label={`${summary.locationName}: ${PULSE_LABEL[summary.pulse]}. ${murmur}`}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: canClick ? 'pointer' : 'default',
                width: '100%',
              }}
            >
              <div
                className="flex items-start gap-1.5"
                style={{
                  padding: '2px 0',
                  borderRadius: '2px',
                  transition: 'background 100ms',
                }}
              >
                {/* Pulse glyph */}
                <span
                  aria-hidden
                  style={{
                    color,
                    fontSize: '10px',
                    flexShrink: 0,
                    marginTop: '2px',
                    lineHeight: 1,
                  }}
                >
                  {glyph}
                </span>

                {/* Text block */}
                <div className="flex flex-col" style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {summary.locationName}
                  </span>
                  {murmur && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-tertiary)',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                      }}
                    >
                      {murmur}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
