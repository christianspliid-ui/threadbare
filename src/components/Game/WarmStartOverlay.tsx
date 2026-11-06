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
 *
 * THR-2184 — "While you were away". When the warm-up ends with a recap, the same card
 * stays up and becomes the recap at the M tier: the title, at most five lines (names are
 * `EntityLink`s, band words carry their `ui.dominion.<band>` hover), a muted next-step
 * line, then **Begin** (focused; Escape is Begin, Law 23/50) and **Read it in the
 * Ledger**. A name link closes the card as Begin would, then opens its page.
 */

import { useEffect, useRef, type MouseEvent } from 'react';
import { resolveTooltip } from '../../engine/tooltipResolver';
import {
  formatWarmRemaining,
  formatWarmSeason,
  WARM_START_ALMOST_DONE_MS,
  WARM_START_FINE_BELOW_MS,
  type WarmStartProgress,
} from './hooks/useWarmStart';
import type { WarmRecapVM, WarmRecapSegment } from '../../engine/views/warmRecap';
import { EntityLink } from '../shared/EntityLink';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { Overlay } from '../shared/Overlay';
import { dialogSizeStyle } from '../shared/dialogSize';
import { Icon } from '../shared/Icon';
import { ICON_FOR_SEASON, SEASON_IDS } from '../../data/icons/conceptIcons';
import { deriveSeasonAndYear, TICKS_PER_SEASON } from '../../types/temporal';

const noop = () => {};

/**
 * THR-2133 — the wait in words, from the pace measured so far: "Working out how long…"
 * until enough ticks have run, then "About 6 minutes left.", then "Almost there."
 */
export function formatRemainingLine(remainingMs: number | null): string {
  if (remainingMs === null) {
    return resolveTooltip('ui.warm_start.estimating')?.desc ?? 'Working out how long this will take…';
  }
  if (remainingMs < WARM_START_ALMOST_DONE_MS) {
    return resolveTooltip('ui.warm_start.almost_done')?.desc ?? 'Almost there.';
  }
  // THR-2184: below three minutes the words step in half minutes.
  const key = remainingMs < WARM_START_FINE_BELOW_MS ? 'ui.warm_start.remaining_half' : 'ui.warm_start.remaining';
  const template = resolveTooltip(key)?.desc ?? 'About {time} left.';
  return template.replace('{time}', formatWarmRemaining(remainingMs));
}

export interface WarmStartOverlayProps {
  /** The warm-up's progress; null once it has ended and only the recap shows. */
  progress: WarmStartProgress | null;
  ticksPerSeason?: number;
  /** The First's name, or null when no First is bonded. */
  firstName: string | null;
  /** THR-2184 — the arrival recap. Present → the card is "While you were away". */
  recap?: WarmRecapVM | null;
  /** THR-2184 — a decision waited behind the warm-up and opens on Begin. */
  heldDecisionWaiting?: boolean;
  /** THR-2184 — Begin, Escape, or a name link: close the recap. */
  onBegin?: () => void;
  /** THR-2184 — close the recap and open the Ledger at `recap.ledgerKey`. */
  onOpenLedger?: () => void;
}

function RecapSegment({ seg }: { seg: WarmRecapSegment }) {
  if (seg.ref) return <EntityLink id={seg.ref.id} name={seg.text} entityRef={seg.ref} />;
  if (seg.tooltipId) {
    return (
      <Tooltip id={seg.tooltipId}>
        <span style={{ color: 'var(--text-primary)', textDecoration: 'underline dotted', textUnderlineOffset: '3px' }}>{seg.text}</span>
      </Tooltip>
    );
  }
  return <>{seg.text}</>;
}

/** THR-2184 — the recap state of the card. */
function WarmRecapCard({ recap, heldDecisionWaiting, onBegin, onOpenLedger }: {
  recap: WarmRecapVM;
  heldDecisionWaiting: boolean;
  onBegin: () => void;
  onOpenLedger: () => void;
}) {
  const title = resolveTooltip('ui.warm_recap.title')?.label ?? 'While you were away';
  const heldLine = resolveTooltip('ui.warm_start.held')?.desc ?? 'Anything that needs your choice has waited for you.';
  const nextHeld = resolveTooltip('ui.warm_recap.next_held')?.desc ?? 'It opens when you begin.';
  const nextPaused = resolveTooltip('ui.warm_recap.next_paused')?.desc
    ?? 'The world is paused. Press play when you are ready.';
  const nextLine = heldDecisionWaiting ? `${heldLine} ${nextHeld}` : nextPaused;
  const beginLabel = resolveTooltip('ui.warm_recap.begin')?.label ?? 'Begin';
  const ledgerLabel = resolveTooltip('ui.warm_recap.open_ledger')?.label ?? 'Read it in the Ledger';
  const beginRef = useRef<HTMLButtonElement>(null);
  // Law 50: focus lands on Begin.
  useEffect(() => { beginRef.current?.focus(); }, []);
  // A name link opens its page through the one router; the card closes as Begin would.
  const onLinesClick = (e: MouseEvent<HTMLUListElement>) => {
    if ((e.target as HTMLElement).closest('button')) onBegin();
  };

  return (
    <Overlay
      open
      onClose={onBegin}
      label={title}
      band="focused"
      backdrop="heavy"
      placement="center"
      closeOnEscape
      closeOnBackdrop={false}
      animation="fade"
      surfaceClassName="rounded-xl p-8 border"
      surfaceStyle={{ ...dialogSizeStyle('m'), backgroundColor: 'var(--bg-abyss)', borderColor: 'var(--accent-gold-dim)' }}
      surfaceProps={{ 'data-testid': 'warm-recap', 'data-dialog-size': 'm', role: 'dialog', 'aria-modal': 'true' }}
    >
      <h2
        className="text-2xl tracking-wide mb-4 text-center"
        style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <ul
        className="text-sm leading-relaxed mb-4"
        style={{ color: 'var(--text-primary)', maxWidth: 'var(--measure-ui)', margin: '0 auto var(--space-4)', paddingLeft: '1.1em', listStyle: 'disc' }}
        onClick={onLinesClick}
      >
        {recap.lines.map((line, i) => (
          <li key={i} className="mb-1" data-testid={`warm-recap-line-${line.kind}`}>
            {line.segments.map((seg, j) => <RecapSegment key={j} seg={seg} />)}
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed mb-4 text-center" style={{ color: 'var(--text-muted)' }} data-testid="warm-recap-next">
        {nextLine}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
        <Button variant="secondary" onClick={onOpenLedger} data-testid="warm-recap-open-ledger">{ledgerLabel}</Button>
        <Button ref={beginRef} variant="primary" onClick={onBegin} data-testid="warm-recap-begin">{beginLabel}</Button>
      </div>
    </Overlay>
  );
}

export function WarmStartOverlay({
  progress, ticksPerSeason, firstName, recap, heldDecisionWaiting = false, onBegin, onOpenLedger,
}: WarmStartOverlayProps) {
  if (recap) {
    return (
      <WarmRecapCard
        recap={recap}
        heldDecisionWaiting={heldDecisionWaiting}
        onBegin={onBegin ?? noop}
        onOpenLedger={onOpenLedger ?? onBegin ?? noop}
      />
    );
  }
  if (!progress) return null;
  return <WarmStartWaitCard progress={progress} ticksPerSeason={ticksPerSeason} firstName={firstName} />;
}

function WarmStartWaitCard({ progress, ticksPerSeason, firstName }: {
  progress: WarmStartProgress;
  ticksPerSeason?: number;
  firstName: string | null;
}) {
  const title = resolveTooltip('ui.warm_start.title')?.label ?? 'The world moves on';
  const wait = resolveTooltip('ui.warm_start.wait')?.desc
    ?? 'Catching up on the seasons you were away. This can take several minutes.';
  const remainingLine = formatRemainingLine(progress.remainingMs);
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
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }} data-testid="warm-start-remaining">
        {remainingLine}
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
