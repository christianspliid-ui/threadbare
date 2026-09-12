/**
 * CodexTagFilter — the first surface where the player meets the tag vocabulary as
 * *words* rather than as keys (THR-1486, slice 2 of THR-1481).
 *
 * One chip per tag actually worn by the entries in view, grouped by axis. Selecting
 * chips narrows the list, ALL-of — the same rule the reward pool has always used, so a
 * player learning to read these chips is learning to read what the engine does.
 *
 * **Only the tags the entries in view actually carry are offered.** A filter row that
 * lists the whole vocabulary would show the player thirty chips that select nothing,
 * which is the "dead link that looks live" shape Law 21 names. The count on each chip
 * is the promise the chip makes.
 *
 * **Every chip carries its `tag.*` tooltip** (Law 17) — the one registry explains the
 * word, and this component never writes copy of its own. A tag the vocabulary does not
 * recognise (a saved world carrying a retired spelling) is shown in an `other` group
 * without a tooltip rather than dropped: hiding it would make the entry unfindable by
 * the only word it carries.
 */

import { memo, useMemo } from 'react';

import { Tooltip } from '../shared/Tooltip';
import { SphereIcon } from '../shared/SphereIcon';
import {
  axisOfContentTag,
  contentTagTooltipId,
  getContentTag,
  type ContentTag,
  type ContentTagAxis,
} from '../../data/content-tags';
import type { SphereName } from '../../types';
import type { CodexEntry } from './codexRegistry';

/**
 * Axis render order and the word the player sees for each. `polarity` is deliberately
 * last: it is the narrowest question ("does this help or hurt?") and the one a player
 * asks after they have already decided what kind of thing they want.
 */
const AXIS_ROW: ReadonlyArray<{ axis: ContentTagAxis; label: string }> = [
  { axis: 'form', label: 'Form' },
  { axis: 'family', label: 'Kind' },
  { axis: 'reach', label: 'Reach' },
  { axis: 'sphere', label: 'Sphere' },
  { axis: 'polarity', label: 'Bearing' },
];

/** The reach glyph vocabulary, matching the one the codex cards already paint. */
const REACH_GLYPHS: Readonly<Record<string, string>> = {
  iron: '⚔',
  gold: '⚖',
  shadow: '✴',
  veil: '✨',
  heart: '♥',
  eye: '◉',
  stone: '■',
  star: '★',
};

/** One glyph per authored axis — a chip is recognisable before it is read. */
const AXIS_GLYPH: Readonly<Record<string, string>> = {
  form: '◇', // ◇
  family: '○', // ○
  polarity: '●', // ●
};

export interface CodexTagFilterProps {
  /** The entries the filter row is offered over — before tag filtering, after every other filter. */
  entries: readonly CodexEntry[];
  selected: readonly string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

interface TagOption {
  tag: string;
  axis: ContentTagAxis | 'other';
  count: number;
  label: string;
}

/** The tag's own word, without the marker: `#star_metal` → `star metal`. */
function tagWord(tag: string): string {
  return (tag.startsWith('#') ? tag.slice(1) : tag).replace(/_/g, ' ');
}

export function tagOptionsFor(entries: readonly CodexEntry[]): TagOption[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({
      tag,
      axis: axisOfContentTag(tag) ?? ('other' as const),
      count,
      label: tagWord(tag),
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const CodexTagFilter = memo(function CodexTagFilter({
  entries,
  selected,
  onToggle,
  onClear,
}: CodexTagFilterProps) {
  const options = useMemo(() => tagOptionsFor(entries), [entries]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const groups = useMemo(
    () =>
      [...AXIS_ROW.map(row => ({ ...row, options: options.filter(o => o.axis === row.axis) })), {
        axis: 'other' as const,
        label: 'Other',
        options: options.filter(o => o.axis === 'other'),
      }].filter(group => group.options.length > 0),
    [options],
  );

  if (groups.length === 0) return null;

  return (
    <div
      data-testid="codex-tag-filter"
      className="flex flex-col gap-1 px-4 py-2 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-deep)',
        borderBottom: '1px solid var(--border-subtle)',
        maxHeight: '92px',
        overflowY: 'auto',
      }}
    >
      {groups.map(group => (
        <div key={group.axis} className="flex items-center gap-1.5 flex-wrap">
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              minWidth: '52px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {group.label}
          </span>
          {group.options.map(option => {
            const active = selectedSet.has(option.tag);
            const def = getContentTag(option.tag);
            const chip = (
              <button
                type="button"
                onClick={() => onToggle(option.tag)}
                data-tag-chip={option.tag}
                aria-pressed={active}
                className="focus-ring"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 999,
                  border: `1px solid ${active ? 'var(--accent-gold-dim)' : 'var(--border-subtle)'}`,
                  padding: '2px 9px',
                  fontSize: 'var(--text-xs)',
                  color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  backgroundColor: active ? 'var(--accent-gold-glow)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.axis === 'sphere' ? (
                  <SphereIcon sphere={tagWord(option.tag) as SphereName} size={11} />
                ) : (
                  <span aria-hidden="true">
                    {group.axis === 'reach'
                      ? REACH_GLYPHS[tagWord(option.tag)] ?? '◈'
                      : AXIS_GLYPH[group.axis] ?? '◈'}
                  </span>
                )}
                <span>{option.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{option.count}</span>
              </button>
            );
            // Law 17: the explanation comes from the one registry, and only for a word
            // the registry knows. An unrecognised spelling gets the chip and no hover,
            // rather than a hover that explains nothing.
            return def ? (
              <Tooltip key={option.tag} id={contentTagTooltipId(option.tag as ContentTag)}>
                {chip}
              </Tooltip>
            ) : (
              <span key={option.tag}>{chip}</span>
            );
          })}
        </div>
      ))}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          data-testid="codex-tag-filter-clear"
          style={{
            alignSelf: 'flex-start',
            marginTop: 2,
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold-dim)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Clear {selected.length} tag{selected.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
});
