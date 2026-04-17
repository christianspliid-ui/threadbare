import React from 'react';
import type { IntelligenceDisplayEntry } from '../../engine/intelligence';
import { INTEL_PANEL_MAX_RECORDS } from '../../engine/intelligence';

interface AgentIntelligencePanelProps {
  entries: readonly IntelligenceDisplayEntry[];
  isStranger: boolean;
  maxRecords?: number;
}

const RELIABILITY_COLORS: Record<'reliable' | 'uncertain' | 'dubious', string> = {
  reliable: 'var(--color-success, #6a9a6e)',
  uncertain: 'var(--color-warning, #c49a3c)',
  dubious: 'var(--text-muted)',
};

export function AgentIntelligencePanel({
  entries,
  isStranger,
  maxRecords = INTEL_PANEL_MAX_RECORDS,
}: AgentIntelligencePanelProps) {
  if (isStranger) return null;

  const visible = entries.slice(0, maxRecords);
  const overflow = entries.length - visible.length;

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
      <h3
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          margin: 0,
          marginBottom: 'var(--space-1)',
        }}
      >
        Intelligence
      </h3>

      {entries.length === 0 ? (
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            margin: 0,
            fontFamily: 'var(--font-body)',
          }}
        >
          Knows nothing of consequence.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {visible.map(entry => (
            <IntelligenceRow key={entry.recordId} entry={entry} />
          ))}
          {overflow > 0 && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                margin: 0,
                fontFamily: 'var(--font-body)',
              }}
            >
              +{overflow} more intelligence {overflow === 1 ? 'record' : 'records'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function IntelligenceRow({ entry }: { entry: IntelligenceDisplayEntry }) {
  const chipColor = RELIABILITY_COLORS[entry.reliabilityDescriptor];
  const chipBg = `color-mix(in srgb, ${chipColor} 18%, transparent)`;

  return (
    <div
      style={{
        padding: 'var(--space-2)',
        border: '1px solid color-mix(in srgb, var(--border-gold) 35%, transparent)',
        borderRadius: '6px',
        backgroundColor: 'color-mix(in srgb, var(--bg-deep) 60%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      {/* Top row: chip + category label + acquired date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', minWidth: 0 }}>
          <span
            title={entry.reliabilityDescriptor}
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 600,
              color: chipColor,
              backgroundColor: chipBg,
              padding: '1px 5px',
              borderRadius: '3px',
              flexShrink: 0,
              textTransform: 'capitalize',
            }}
            aria-label={`Reliability: ${entry.reliabilityDescriptor}`}
          >
            {entry.reliabilityDescriptor}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontVariant: 'small-caps',
              letterSpacing: '0.04em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.categoryLabel}
          </span>
        </div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {entry.acquiredLabel}
        </span>
      </div>

      {/* Label (one line, ellipsis) */}
      <div
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.label}
      </div>

      {/* Detail (two-line clamp) */}
      <div
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {entry.detail}
      </div>

      {/* Target line — only when resolved */}
      {entry.targetDisplayName !== null && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          about: {entry.targetDisplayName} ({entry.targetKind})
        </div>
      )}
    </div>
  );
}
