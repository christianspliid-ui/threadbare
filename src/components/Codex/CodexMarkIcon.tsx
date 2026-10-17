/**
 * CodexMarkIcon — draws a Codex entry's mark (THR-1907): a carved registry icon, or a reach's own
 * `ReachIcon` (reaches keep their one vocabulary, plan THR-1879 § 9). Decorative: the entry's name
 * always sits beside it.
 */

import { memo } from 'react';
import type { CodexMark } from './codexRegistry';
import { Icon } from '../shared/Icon';
import { ReachIcon } from '../icons';

/** Px edge of a `ReachIcon` per named size — `Icon`'s list / alone at the 1080p root (Law 11). */
const REACH_MARK_PX = { list: 24, alone: 34 } as const;

export const CodexMarkIcon = memo(function CodexMarkIcon({ mark, size = 'list' }: {
  mark: CodexMark;
  size?: 'list' | 'alone';
}) {
  if ('reach' in mark) {
    return (
      <span data-codex-mark={`reach:${mark.reach}`} style={{ display: 'inline-flex', flexShrink: 0 }}>
        <ReachIcon reach={mark.reach} size={REACH_MARK_PX[size]} />
      </span>
    );
  }
  return <Icon name={mark.icon} size={size} decorative style={{ flexShrink: 0 }} />;
});
