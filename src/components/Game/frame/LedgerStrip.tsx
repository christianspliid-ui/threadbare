/**
 * LedgerStrip — the Ledger rail folded to a 56 px column of icons with counts
 * (THR-1893, frame plan § F8).
 *
 * At the top, an unfold button; then one item per `LEDGER_RAIL_SECTIONS` entry and
 * per `LEDGER_TABS` entry that declares a `strip` (Threads, Chronicle, and the Ledger
 * once revealed). The word lives in the tooltip (THR-1834 § 5); the count chip is not
 * drawn at zero, but the icon stays, because it still unfolds (Law 25). Hit areas are
 * 32 px (Law 46).
 */
import { IconButton } from '../../shared/IconButton';
import { Icon } from '../../shared/Icon';
import { Tooltip } from '../../shared/Tooltip';
import { countWords, STRIP_UNFOLD_LABEL } from '../../../data/frame-content';
import type { StripDef } from '../../../data/frame-registry';

export type LedgerStripItemId = 'threads' | 'chronicle' | 'ledger';

export interface LedgerStripItem {
  id: LedgerStripItemId;
  /** The word the tooltip names it by ("Threads", "Chapter Ledger"). */
  label: string;
  tooltipId: string;
  strip: StripDef;
  count: number;
}

/** "Threads · 1 chapter waits"; at zero just the word. */
export function stripTooltipLabel(item: Pick<LedgerStripItem, 'label' | 'strip' | 'count'>): string {
  return item.count > 0 ? `${item.label} · ${countWords(item.count, item.strip.countLabel)}` : item.label;
}

export function LedgerStrip({
  items,
  onUnfold,
  onItem,
}: {
  items: readonly LedgerStripItem[];
  onUnfold: () => void;
  onItem: (id: LedgerStripItemId) => void;
}) {
  return (
    <div
      data-testid="ledger-strip"
      style={{
        width: 'var(--rail-strip-w)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        paddingTop: 'var(--space-3)',
      }}
    >
      <Tooltip label={STRIP_UNFOLD_LABEL}>
        <IconButton
          data-testid="ledger-strip-unfold"
          icon={<Icon name="disclosure" size="list" decorative style={{ transform: 'rotate(180deg)' }} />}
          onClick={onUnfold}
          aria-label={STRIP_UNFOLD_LABEL}
        />
      </Tooltip>
      {items.map(item => {
        const label = stripTooltipLabel(item);
        return (
          <Tooltip key={item.id} id={item.tooltipId} label={label}>
            <IconButton
              data-testid={`ledger-strip-${item.id}`}
              data-strip-id={item.id}
              data-strip-count={item.count}
              icon={<Icon name={item.strip.icon} size="list" decorative />}
              badge={item.count}
              badgeOf={`ledger-strip.${item.id}`}
              onClick={() => onItem(item.id)}
              aria-label={label}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}
