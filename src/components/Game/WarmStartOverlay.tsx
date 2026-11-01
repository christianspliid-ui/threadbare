/**
 * WarmStartOverlay — "The world moves on" (THR-1744).
 *
 * Shown only while a `?warm=<ticks>` warm-up runs (`useWarmStart`). A heavy
 * `Overlay` cover with no controls: it cannot be dismissed early (no Escape layer,
 * no backdrop close) and closes itself. Its card takes the S tier through
 * `dialogSizeStyle('s')` (THR-1880), never a free width. It is an
 * interrupt surface (`warmStartRunning` in `interruptRegistry.ts`), so everything
 * else yields to it while it is up.
 *
 * Copy comes from the tooltip registry (Law 1/17). The First line reuses the
 * Lives-on toggle's own sentence word for word, so the two surfaces never disagree
 * about what the automatic step is (PC-6). Season words, never a tick count (Law 13).
 */

import { resolveTooltip } from '../../engine/tooltipResolver';
import { formatWarmSeason, type WarmStartProgress } from './hooks/useWarmStart';
import { Overlay } from '../shared/Overlay';
import { dialogSizeStyle } from '../shared/dialogSize';
import { Icon } from '../shared/Icon';
import { ICON_FOR_SEASON, SEASON_IDS } from '../../data/icons/conceptIcons';
import { deriveSeasonAndYear, TICKS_PER_SEASON } from '../../types/temporal';

const noop = () => {};

export interface WarmStartOverlayProps {
  progress: WarmStartProgress;
  ticksPerSeason?: number;
  /** The First's name, or null when no First is bonded. */
  firstName: string | null;
}

export function WarmStartOverlay({ progress, ticksPerSeason, firstName }: WarmStartOverlayProps) {
  const title = resolveTooltip('ui.warm_start.title')?.label ?? 'The world moves on';
  const wait = resolveTooltip('ui.warm_start.wait')?.desc
    ?? 'Catching up on the seasons you were away. This takes a minute or two.';
  const progressTemplate = resolveTooltip('ui.warm_start.progress')?.desc ?? '{now} — catching up to {target}';
  const progressLine = progressTemplate
    .replace('{now}', formatWarmSeason(progress.currentTick, ticksPerSeason))
    .replace('{target}', formatWarmSeason(progress.targetTick, ticksPerSeason));
  // THR-2101 (decision 7) — the current season's shape beside the season words, from the
  // same derivation `formatWarmSeason` makes. Decorative: the words carry the meaning.
  const { season } = deriveSeasonAndYear(progress.currentTick, ticksPerSeason ?? TICKS_PER_SEASON);
  const seasonIcon = ICON_FOR_SEASON[SEASON_IDS[season % SEASON_IDS.length]];
  const livesOn = resolveTooltip('ui.attention.lives_on')?.desc;
  const firstLine = firstName && livesOn ? livesOn.replace(/{name}/g, firstName) : null;
  // THR-1787: the Lives-on line is true of The First's moments, but the player is then
  // asked to decide things — say that those waited.
  const heldLine = resolveTooltip('ui.warm_start.held')?.desc
    ?? 'Anything that needs your choice has waited for you.';

  return (
    <Overlay
      open
      onClose={noop}
      label={title}
      band="focused"
      backdrop="heavy"
      placement="center"
      closeOnEscape={false}
      closeOnBackdrop={false}
      animation="fade"
      surfaceClassName="rounded-xl p-8 text-center border"
      surfaceStyle={{ ...dialogSizeStyle('s'), backgroundColor: 'var(--bg-abyss)', borderColor: 'var(--accent-gold-dim)' }}
      surfaceProps={{ 'data-testid': 'warm-start-overlay', 'data-dialog-size': 's', role: 'status', 'aria-live': 'polite' }}
    >
      <h2
        className="text-2xl tracking-wide mb-4"
        style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{wait}</p>
      <p className="text-sm italic mb-3" style={{ color: 'var(--text-muted)' }} data-testid="warm-start-progress">
        {seasonIcon && (
          <span data-dialog-heading-icon={seasonIcon} style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 'var(--space-1)' }}>
            <Icon name={seasonIcon} size="chip" decorative />
          </span>
        )}
        {progressLine}
      </p>
      {firstLine && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{firstLine}</p>
      )}
      <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }} data-testid="warm-start-held">
        {heldLine}
      </p>
    </Overlay>
  );
}
