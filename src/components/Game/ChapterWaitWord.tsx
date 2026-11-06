/**
 * THR-2178 — the chapter's wait word: "Waits for you" or "Theirs alone", trailing
 * the chapter's title on the Ledger rows and the Stage header (R7 of the
 * text-positions decision: a badge sits after its word).
 *
 * The word itself is decided in the engine (`chapterWaitWord`,
 * engine/playerStepHold.ts) from the same predicate the hold reads, so the word
 * and the behaviour cannot disagree. The copy and its hover live in the tooltip
 * registry (`ui.chapter.waits` / `ui.chapter.theirs_alone`, Law 17); `{name}` is
 * filled with the mortal's name here.
 */
import type { CSSProperties } from 'react';
import { Tooltip } from '../shared/Tooltip';
import { resolveTooltip } from '../../engine/tooltipResolver';
import type { ChapterWaitWord } from '../../engine/playerStepHold';

const FALLBACK_LABEL: Record<ChapterWaitWord, string> = {
  waits: 'Waits for you',
  theirs_alone: 'Theirs alone',
};

const TOOLTIP_ID: Record<ChapterWaitWord, string> = {
  waits: 'ui.chapter.waits',
  theirs_alone: 'ui.chapter.theirs_alone',
};

/** The word's label and its filled hover line. Pure; exported for tests. */
export function chapterWaitWordCopy(word: ChapterWaitWord, name: string): { label: string; desc: string } {
  const entry = resolveTooltip(TOOLTIP_ID[word]);
  const label = entry?.label ?? FALLBACK_LABEL[word];
  const desc = (entry?.desc ?? '').replace(/{name}/g, name || 'this mortal');
  return { label, desc };
}

export function ChapterWaitWordBadge({ word, name, style }: {
  word: ChapterWaitWord | undefined;
  name: string;
  style?: CSSProperties;
}) {
  if (!word) return null;
  const { label, desc } = chapterWaitWordCopy(word, name);
  return (
    <Tooltip label={label} desc={desc} focusable={false}>
      <span
        data-testid="chapter-wait-word"
        data-wait-word={word}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          fontStyle: 'normal',
          fontWeight: 600,
          letterSpacing: '0.04em',
          // "Waits for you" is the one that asks something of the player: gold.
          // "Theirs alone" is a quiet fact: the secondary text tone.
          color: word === 'waits' ? 'var(--accent-gold)' : 'var(--text-secondary)',
          marginLeft: 8,
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        {label}
      </span>
    </Tooltip>
  );
}
