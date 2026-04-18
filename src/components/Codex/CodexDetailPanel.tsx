import { memo } from 'react';
import type { CodexEntry } from './codexRegistry';
import { SectionHeading } from '../shared/SectionHeading';

interface CodexDetailPanelProps {
  entry: CodexEntry | null;
  onClose: () => void;
}

export const CodexDetailPanel = memo(function CodexDetailPanel({
  entry,
  onClose,
}: CodexDetailPanelProps) {
  if (!entry) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{
          width: '360px',
          backgroundColor: 'var(--bg-deep)',
          borderLeft: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Select an entry to view details
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        width: '360px',
        backgroundColor: 'var(--bg-deep)',
        borderLeft: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `2px solid ${entry.tierColor}40` }}
      >
        <span style={{ fontSize: 'var(--text-xl)' }}>{entry.glyph}</span>
        <div className="flex-1 min-w-0">
          <h2
            className="truncate"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-base)',
              color: entry.tierColor,
              letterSpacing: '0.03em',
            }}
          >
            {entry.name}
          </h2>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {entry.subtitle}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-base)',
            padding: '0.25rem',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
          }}
        >
          \u2715
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Art asset */}
        {entry.imageAssetPath && (
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: `1px solid ${entry.tierColor}30`,
            }}
          >
            <img
              src={entry.imageAssetPath}
              alt={entry.name}
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Flavor text */}
        {entry.flavorText && (
          <div>
            <p
              className="italic"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                borderLeft: `2px solid ${entry.tierColor}40`,
                paddingLeft: '0.75rem',
              }}
            >
              {entry.flavorText}
            </p>
          </div>
        )}

        {/* Mechanical summary */}
        {entry.summary && (
          <div>
            <SectionHeading as="h3">Mechanics</SectionHeading>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginTop: '0.25rem',
              }}
            >
              {entry.summary}
            </p>
          </div>
        )}

        {/* Details grid */}
        {entry.details.length > 0 && (
          <div>
            <SectionHeading as="h3">Details</SectionHeading>
            <div
              className="mt-1 space-y-1.5"
            >
              {entry.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex justify-between"
                  style={{ fontSize: 'var(--text-xs)' }}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {detail.label}
                  </span>
                  <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div>
            <SectionHeading as="h3">Tags</SectionHeading>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {entry.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 rounded-sm"
                  style={{
                    fontSize: 'var(--text-xs)',
                    backgroundColor: 'var(--bg-raised)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer tier badge */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 flex-shrink-0"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: `${entry.tierColor}08`,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: entry.tierColor,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {entry.tierName}
        </span>
      </div>
    </div>
  );
});
