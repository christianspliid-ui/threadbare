import { memo } from 'react';
import type { CodexEntry } from './codexRegistry';

interface CodexCardProps {
  entry: CodexEntry;
  isSelected: boolean;
  onClick: () => void;
}

export const CodexCard = memo(function CodexCard({
  entry,
  isSelected,
  onClick,
}: CodexCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all"
      style={{
        backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-surface)',
        borderTop: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderRight: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderBottom: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${entry.tierColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        cursor: 'pointer',
      }}
    >
      {/* Top row: thumbnail/glyph + name + tier badge */}
      <div className="flex items-center gap-2 mb-1">
        {entry.imageAssetPath ? (
          <img
            src={entry.imageAssetPath}
            alt=""
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <span style={{ fontSize: 'var(--text-base)', lineHeight: 1 }}>
            {entry.glyph}
          </span>
        )}
        <span
          className="flex-1 truncate"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}
        >
          {entry.name}
        </span>
        <span
          className="flex-shrink-0 px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
          style={{
            fontSize: 'var(--text-xs)',
            color: entry.tierColor,
            backgroundColor: `${entry.tierColor}15`,
            border: `1px solid ${entry.tierColor}30`,
          }}
        >
          {entry.tierName}
        </span>
      </div>

      {/* Subtitle */}
      <div
        className="mb-1"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        {entry.subtitle}
      </div>

      {/* Summary (truncated) */}
      {entry.summary && (
        <div
          className="line-clamp-2"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          {entry.summary}
        </div>
      )}
    </button>
  );
});
