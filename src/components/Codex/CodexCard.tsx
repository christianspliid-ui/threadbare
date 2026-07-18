import { memo } from 'react';
import type { CodexEntry } from './codexRegistry';
import { CODEX_RUN_STATE_BADGE, SIGNATURE_STATE_COPY, type CodexRunState } from './codexRunState';

interface CodexCardProps {
  entry: CodexEntry;
  isSelected: boolean;
  onClick: () => void;
  /**
   * This card's state for the current incarnation (THR-613 Slice 3b-tail). Undefined when
   * browsing without a live ascendant (standalone `?view=codex`) or for non-ascendant
   * entries — then no badge renders and the card is at full opacity.
   */
  runState?: CodexRunState | null;
}

// Badge colour per state. `available` reads gold (yours), `acquirable` a cool "not yet",
// `locked_incarnation` muted (another life). Prose-first — the words carry the meaning.
const RUN_STATE_COLOR: Record<CodexRunState, string> = {
  available: 'var(--accent-gold)',
  acquirable: 'var(--text-secondary)',
  locked_incarnation: 'var(--text-muted)',
};

export const CodexCard = memo(function CodexCard({
  entry,
  isSelected,
  onClick,
  runState,
}: CodexCardProps) {
  // Dim what the god cannot wield right now — acquirable (not yet earned) and
  // another-incarnation cards read quieter than the ones already held.
  const dimmed = runState === 'acquirable' || runState === 'locked_incarnation';
  const badgeColor = runState ? RUN_STATE_COLOR[runState] : undefined;
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all"
      data-run-state={runState ?? undefined}
      style={{
        backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-surface)',
        borderTop: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderRight: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderBottom: isSelected ? `1px solid ${entry.tierColor}80` : '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${entry.tierColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        cursor: 'pointer',
        opacity: dimmed ? 0.62 : 1,
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

      {/* Incarnation state badge (THR-613 Slice 3b-tail) — only with a live ascendant. */}
      {runState && badgeColor && (
        <div
          className="mb-1 inline-flex items-center gap-1.5"
          title={SIGNATURE_STATE_COPY[runState]}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: '999px',
              backgroundColor: badgeColor,
              flexShrink: 0,
            }}
          />
          <span
            className="uppercase tracking-wider"
            style={{ fontSize: 'var(--text-xs)', color: badgeColor, letterSpacing: '0.1em' }}
          >
            {CODEX_RUN_STATE_BADGE[runState]}
          </span>
        </div>
      )}

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
