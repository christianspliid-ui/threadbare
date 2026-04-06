import React, { useMemo } from 'react';
import type { DigestEntry } from '../../types/attention';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ENTRIES_DEFAULT = 6;

const REACH_DOT_COLORS: Record<string, string> = {
  iron: '#ff6b6b',
  stone: '#d4a87a',
  eye: '#ffe44d',
  gold: '#33ff77',
  veil: '#44aaff',
  heart: '#cc66ff',
  star: '#ffb355',
  shadow: '#8fd4c0',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentActivityLogProps {
  entries: DigestEntry[];
  lastViewedTick: number;
  maxEntries?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a one-line summary for a digest entry. */
function buildSummary(entry: DigestEntry): string {
  const outcome = entry.success ? 'Success' : 'Failed';
  const capEntries = Object.entries(entry.capabilityChanges);
  if (capEntries.length === 0) {
    return `${entry.encounterName}. ${outcome}.`;
  }
  // Show first capability delta
  const [reach, delta] = capEntries[0];
  const sign = delta >= 0 ? '+' : '';
  return `${entry.encounterName}. ${outcome}. (${sign}${delta.toFixed(1)} ${reach})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RecentActivityLog = React.memo(function RecentActivityLog({
  entries,
  lastViewedTick,
  maxEntries = MAX_ENTRIES_DEFAULT,
}: RecentActivityLogProps) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.tick - a.tick).slice(0, maxEntries),
    [entries, maxEntries],
  );

  if (sorted.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 'var(--space-1)',
          fontWeight: 600,
        }}
      >
        Recent Activity
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {sorted.map((entry, idx) => {
          const dotColor = REACH_DOT_COLORS[entry.reachPrimary] ?? '#a8a29e';
          const isNew = entry.tick > lastViewedTick;
          const isMissed = entry.wasCuratedOut;
          const summary = buildSummary(entry);

          return (
            <div
              key={`${entry.encounterId}-${entry.tick}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: isMissed ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
            >
              {/* Tick number */}
              <span
                style={{
                  color: 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                  minWidth: '2.5rem',
                  textAlign: 'right',
                }}
              >
                t{entry.tick}
              </span>

              {/* Reach colour dot */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />

              {/* Summary text */}
              <span
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontStyle: isMissed ? 'italic' : undefined,
                }}
                title={summary}
              >
                {summary}
              </span>

              {/* NEW badge */}
              {isNew && !isMissed && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-gold)',
                    fontWeight: 700,
                    flexShrink: 0,
                    letterSpacing: '0.05em',
                  }}
                >
                  NEW
                </span>
              )}

              {/* missed tag */}
              {isMissed && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--accent-gold-dim)',
                    fontStyle: 'italic',
                    flexShrink: 0,
                  }}
                >
                  missed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
