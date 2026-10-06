/**
 * WarmStartOverlay — "The world moves on" (THR-1744).
 *
 * Shown only while a `?warm=<ticks>` warm-up runs (`useWarmStart`). A full-viewport
 * scrim with no controls: it cannot be dismissed early and closes itself. It is an
 * interrupt surface (`warmStartRunning` in `interruptRegistry.ts`), so everything
 * else yields to it while it is up.
 *
 * Copy comes from the tooltip registry (Law 1/17). The First line reuses the
 * Lives-on toggle's own sentence word for word, so the two surfaces never disagree
 * about what the automatic step is (PC-6). Season words, never a tick count (Law 13).
 */

import { resolveTooltip } from '../../engine/tooltipResolver';
import { formatWarmSeason, type WarmStartProgress } from './hooks/useWarmStart';

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
  const livesOn = resolveTooltip('ui.attention.lives_on')?.desc;
  const firstLine = firstName && livesOn ? livesOn.replace(/{name}/g, firstName) : null;

  return (
    <div
      data-testid="warm-start-overlay"
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 anim-fade-enter"
    >
      <div
        className="max-w-xl w-full mx-4 rounded-xl p-8 text-center border"
        style={{ backgroundColor: 'var(--bg-abyss)', borderColor: 'var(--accent-gold-dim)' }}
      >
        <h2
          className="text-2xl tracking-wide mb-4"
          style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{wait}</p>
        <p className="text-sm italic mb-3" style={{ color: 'var(--text-muted)' }} data-testid="warm-start-progress">
          {progressLine}
        </p>
        {firstLine && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{firstLine}</p>
        )}
      </div>
    </div>
  );
}
