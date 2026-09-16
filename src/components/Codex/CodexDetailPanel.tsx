/**
 * The Codex detail panel — one entry's art, prose, effect and detail rows.
 *
 * ## Concept words in detail rows — the ruling (THR-1507)
 *
 * A detail row's value names concepts — a reach, a Sphere, a scale, a price — and Law 17
 * wants each to hover from the one registry. The whole-value `tooltipId` the Undertakings
 * section shipped with cannot cover a value that names two (*a slight edge in Gold, a
 * faint edge in Heart*), so the question was whether to (a) mark concept **spans** inside a
 * value, or (b) restructure rows so every row names exactly one concept.
 *
 * **Ruled (a): spans.** It is Law 2's own shape — *the producer declares the concepts, the
 * surface never parses English* — and the aftermath chip already implements it
 * (`EncounterAftermathChange.concepts`, THR-1004), so the Codex gets a second instance of
 * one pattern rather than a pattern of its own. (b) was rejected because it would have made
 * the sections read worse for the sake of the renderer: a companion's *good for* is one
 * sentence, not two rows. The whole-value `tooltipId` survives as the single-concept
 * shorthand, and `detailConcepts` folds it into the same list, so this panel has exactly
 * one render path and one vocabulary — the half-measure the ticket warned against (tag the
 * single-concept rows, leave the rest) is unreachable by construction.
 *
 * How a value is drawn: `splitDetailValue` cuts it into runs at the declared spans —
 * first occurrence, declaration order, never re-splitting a claimed run — and each span
 * renders as a dotted-underlined `Tooltip` trigger, the plain runs as text. A concept the
 * value does not contain is skipped, so a mapper slip degrades to plain text (NFP #4).
 * The shape, its rules and the mapper helpers live in `codexConcepts.ts`; the guard that
 * a new mapper cannot ship a concept row plain is `__tests__/codexDetailConcepts.test.tsx`.
 */

import { Fragment, memo } from 'react';
import type { CodexEntry } from './codexRegistry';
import { detailConcepts, splitDetailValue } from './codexConcepts';
import { SectionHeading } from '../shared/SectionHeading';
import { Tooltip } from '../shared/Tooltip';
import { effectLabel, EFFECT_SOURCE_BADGE_COLORS } from '../../data/actionEffectSource';

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
          {/* A JSX text node does not decode escapes \u2014 as `\u2715` this painted the six
              literal characters on the close control (seen in THR-1507's capture). */}
          {'\u2715'}
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

        {/* Technical effect — what state this action changes + where it's wired (THR-610).
            Absent for non-action entries (possessions/conditions/agreements) → hidden. */}
        {entry.technicalEffect && (
          <div data-testid="codex-effect-block">
            <div className="flex items-center gap-2">
              <SectionHeading as="h3">Effect</SectionHeading>
              {entry.effectSource && (
                <span
                  data-testid="codex-effect-badge"
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    padding: '0.05rem 0.35rem',
                    borderRadius: '3px',
                    color: '#fff',
                    background: EFFECT_SOURCE_BADGE_COLORS[entry.effectSource],
                  }}
                >
                  {effectLabel(entry.effectSource)}
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginTop: '0.25rem',
                borderLeft: '2px solid var(--border-subtle)',
                paddingLeft: '0.6rem',
              }}
            >
              {entry.technicalEffect}
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
                  <span
                    data-testid="codex-detail-value"
                    style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}
                  >
                    {splitDetailValue(detail.value, detailConcepts(detail)).map((segment, segIdx) =>
                      segment.tooltipId ? (
                        <Tooltip key={segIdx} id={segment.tooltipId}>
                          <span
                            className="underline decoration-dotted cursor-help"
                            data-testid="codex-detail-concept"
                            data-tooltip-id={segment.tooltipId}
                          >
                            {segment.text}
                          </span>
                        </Tooltip>
                      ) : (
                        <Fragment key={segIdx}>{segment.text}</Fragment>
                      ),
                    )}
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
