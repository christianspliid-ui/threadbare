/**
 * Needs you — the gold count pill in the top bar and the list it opens (THR-1875,
 * frame plan § F4). Data: `views/needsYou.ts`.
 *
 * The pill renders only while something waits and never pauses time (Laws 25, 53).
 * Opening the list never clears the count (Law 40): a row leaves when its thing is
 * opened or resolves. The list grows to its limit (60vh) and only there folds the
 * overflow into "and {n} more" rows (Law 57). While an interrupt holds the clock every
 * row is read-only: a dialog opened now would open beneath the moment (THR-1814).
 *
 * The THR-1809 raise: while a spine gift waits behind a player surface, the pill is drawn
 * above that surface's backdrop at `GIFT_PILL_Z`, through a portal at its measured place.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../shared/Button';
import { Chip } from '../../shared/Chip';
import { Icon } from '../../shared/Icon';
import { Tooltip } from '../../shared/Tooltip';
import { useEscapeLayer } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';
import { getUITooltip, TOPBAR_LOCKED_SUFFIX } from '../../../data/ui-content';
import {
  NEEDS_YOU_FOLD_ROW,
  NEEDS_YOU_GROUP_TITLES,
  NEEDS_YOU_LABEL,
  NEEDS_YOU_LIST_ARIA,
  NEEDS_YOU_PILL_LABEL,
  countWords,
  needsYouNewsTooltipDesc,
} from '../../../data/frame-content';
import {
  NEEDS_YOU_GROUP_HEAD_H_REM,
  NEEDS_YOU_GROUP_ORDER,
  NEEDS_YOU_LIST_MAX_VH,
  NEEDS_YOU_LIST_PAD_REM,
  NEEDS_YOU_LIST_W_REM,
  NEEDS_YOU_NEWS_KEEP_TICKS,
  NEEDS_YOU_ROW_H_REM,
  burstSuffix,
  foldNeedsYou,
  needsYouCapacityRows,
  type NeedsYouGroup,
  type NeedsYouRowVM,
  type NeedsYouVM,
} from '../../../engine/views/needsYou';
import { durationLabel } from '../../../engine/aftermathWords';
// THR-1809's band, reused: the raised pill sits above a player surface, below interrupts.
import { GIFT_PILL_Z } from '../AscendantBeatModal';


const GROUP_TOOLTIP: Record<NeedsYouGroup, string> = {
  waiting: 'ui.needs_you_waiting',
  held: 'ui.needs_you_held',
  news: 'ui.needs_you_news',
};

function rootPx(): number {
  if (typeof document === 'undefined') return 16;
  const v = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(v) && v > 0 ? v : 16;
}

export interface NeedsYouProps {
  vm: NeedsYouVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** An interrupt holds the clock: rows are read-only and say why. */
  guarded: boolean;
  /** THR-1809: draw the pill above the player surface holding a spine gift. */
  raised: boolean;
  /** A row's press. The list closes after a press that opens something. */
  onPressRow: (row: NeedsYouRowVM) => void;
  /** Alerts the router trimmed at its safety cap (Law 49): read by getFrameState. */
  trimmedAtCap?: number;
}

/** What the list drew, for `__DEBUG.getFrameState().needsYou` (read back off the DOM). */
function listAttrs(vm: NeedsYouVM, capacity: number, foldedRows: number, open: boolean, raised: boolean, trimmedAtCap: number) {
  return {
    'data-needs-you-trimmed': trimmedAtCap,
    'data-needs-you-count': vm.count,
    'data-needs-you-waiting': vm.groups.waiting.length,
    'data-needs-you-held': vm.groups.held.length,
    'data-needs-you-news': vm.groups.news.length,
    'data-needs-you-capacity': capacity,
    'data-needs-you-folded': foldedRows,
    'data-needs-you-open': open ? 'true' : 'false',
    'data-needs-you-raised': raised ? 'true' : 'false',
  };
}

export function NeedsYou({ vm, open, onOpenChange, guarded, raised, onPressRow, trimmedAtCap = 0 }: NeedsYouProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const raisedRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<NeedsYouGroup>>(new Set());
  const [openBursts, setOpenBursts] = useState<ReadonlySet<string>>(new Set());
  const [rect, setRect] = useState<{ left: number; top: number; bottom: number } | null>(null);
  const [viewportH, setViewportH] = useState(() => (typeof window === 'undefined' ? 1080 : window.innerHeight));

  const shown = vm.count > 0;
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // The list closes when nothing waits any more.
  useEffect(() => {
    if (!shown && open) onOpenChange(false);
  }, [shown, open, onOpenChange]);
  useEffect(() => {
    if (!open) {
      setExpanded(new Set());
      setOpenBursts(new Set());
    }
  }, [open]);

  // Where the pill sits: the list anchors under it, the raised pill draws over it.
  // Re-measured after every render and whenever the top bar's layout moves (a longer status
  // line, a yield step), so the raised copy never drifts from its slot (review gate).
  const tracking = shown && (open || raised);
  const measureRef = useRef<() => void>(() => {});
  measureRef.current = () => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (r) {
      setRect(prev => (prev && prev.left === r.left && prev.top === r.top && prev.bottom === r.bottom
        ? prev
        : { left: r.left, top: r.top, bottom: r.bottom }));
    }
    setViewportH(window.innerHeight);
  };
  useLayoutEffect(() => {
    if (tracking) measureRef.current();
  });
  useEffect(() => {
    if (!tracking) return;
    const measure = () => measureRef.current();
    window.addEventListener('resize', measure);
    const bar = anchorRef.current?.closest('[data-testid="game-topbar"]');
    const observer = bar && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (bar && observer) {
      observer.observe(bar);
      for (const child of Array.from(bar.children)) observer.observe(child);
    }
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [tracking]);

  // Esc closes the list (Law 23); focus moves into it and back to the pill (Law 50).
  useEscapeLayer(open, close, Z_BAND.menu, NEEDS_YOU_LABEL);
  // The list mounts once the pill is measured, so focus waits for it (`listMounted`).
  const wasOpen = useRef(false);
  const listMounted = open && rect !== null;
  useEffect(() => {
    if (listMounted) {
      const first = listRef.current?.querySelector<HTMLElement>('[data-needs-you-row], [data-needs-you-fold]');
      first?.focus();
    } else if (!open && wasOpen.current) {
      anchorRef.current?.querySelector<HTMLElement>('button')?.focus();
    }
    wasOpen.current = open;
  }, [open, listMounted]);

  // Close on a press outside the list and the pill.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (listRef.current?.contains(t) || anchorRef.current?.contains(t) || raisedRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);

  const groupsShown = NEEDS_YOU_GROUP_ORDER.filter(g => vm.groups[g].length > 0).length;
  const capacity = needsYouCapacityRows(viewportH, rootPx(), Math.max(1, groupsShown));
  const folded = useMemo(() => foldNeedsYou(vm, capacity, expanded), [vm, capacity, expanded]);

  const label = countWords(vm.count, NEEDS_YOU_PILL_LABEL);
  const desc = getUITooltip('ui.needs_you')?.desc;
  const pill = (
    <Chip
      role="count"
      of="needs-you"
      count={vm.count}
      icon="needs-you"
      word={NEEDS_YOU_LABEL}
      label={label}
      desc={desc}
      tint="gold"
      size="md"
      onOpen={() => onOpenChange(!open)}
    />
  );

  const attrs = listAttrs(vm, capacity, folded.foldedRows, open, raised, trimmedAtCap);

  return (
    <>
      <span
        ref={anchorRef}
        data-testid="needs-you-pill"
        {...attrs}
        style={{ display: shown ? 'inline-flex' : 'none', flexShrink: 0, visibility: raised && rect ? 'hidden' : undefined }}
      >
        {shown && pill}
      </span>
      {shown && raised && rect && typeof document !== 'undefined' && createPortal(
        <span
          ref={raisedRef}
          data-testid="needs-you-pill-raised"
          style={{ position: 'fixed', left: rect.left, top: rect.top, zIndex: GIFT_PILL_Z, display: 'inline-flex' }}
        >
          {pill}
        </span>,
        document.body,
      )}
      {shown && open && rect && typeof document !== 'undefined' && createPortal(
        <div
          ref={listRef}
          role="region"
          aria-label={NEEDS_YOU_LIST_ARIA}
          data-testid="needs-you-list"
          {...attrs}
          style={{
            position: 'fixed',
            left: rect.left,
            top: rect.bottom + 4,
            zIndex: Z_BAND.menu,
            width: `${NEEDS_YOU_LIST_W_REM}rem`,
            maxHeight: `${NEEDS_YOU_LIST_MAX_VH}vh`,
            overflowY: 'auto',
            padding: `${NEEDS_YOU_LIST_PAD_REM}rem 0`,
            background: 'var(--bg-panel, var(--bg-deep))',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 6px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {NEEDS_YOU_GROUP_ORDER.map(g => {
            const all = vm.groups[g];
            if (all.length === 0) return null;
            const { rows, folded: n } = folded.groups[g];
            return (
              <section key={g} data-needs-you-group={g}>
                <GroupHeader group={g} count={all.length} />
                {rows.map(row => (
                  <RowBlock
                    key={row.id}
                    row={row}
                    guarded={guarded}
                    burstOpen={openBursts.has(row.id)}
                    onToggleBurst={() => setOpenBursts(prev => {
                      const next = new Set(prev);
                      if (next.has(row.id)) next.delete(row.id);
                      else next.add(row.id);
                      return next;
                    })}
                    onPress={(r) => {
                      onPressRow(r);
                      if (r.opens !== 'none') close();
                    }}
                  />
                ))}
                {n > 0 && (
                  <Button
                    variant="ghost"
                    data-needs-you-fold={g}
                    className="focus-ring"
                    onClick={() => setExpanded(prev => new Set(prev).add(g))}
                    style={rowStyle(true)}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{countWords(n, NEEDS_YOU_FOLD_ROW)}</span>
                  </Button>
                )}
              </section>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

function GroupHeader({ group, count }: { group: NeedsYouGroup; count: number }) {
  const tip = getUITooltip(GROUP_TOOLTIP[group]);
  const desc = group === 'news' ? needsYouNewsTooltipDesc(durationLabel(NEEDS_YOU_NEWS_KEEP_TICKS)) : tip?.desc;
  return (
    <div
      style={{
        height: `${NEEDS_YOU_GROUP_HEAD_H_REM}rem`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-3)',
        font: 'var(--type-section-label)',
        color: 'var(--text-tertiary)',
      }}
    >
      <Tooltip id={GROUP_TOOLTIP[group]} label={tip?.label} desc={desc}>
        <span>{`${NEEDS_YOU_GROUP_TITLES[group]} · ${count}`}</span>
      </Tooltip>
    </div>
  );
}

function rowStyle(interactive: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 'var(--space-2)',
    width: '100%',
    borderRadius: 0,
    height: `${NEEDS_YOU_ROW_H_REM}rem`,
    padding: '0 var(--space-3)',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-sm)',
    cursor: interactive ? 'pointer' : 'default',
  };
}

function RowBlock({
  row,
  guarded,
  burstOpen,
  onToggleBurst,
  onPress,
}: {
  row: NeedsYouRowVM;
  guarded: boolean;
  burstOpen: boolean;
  onToggleBurst: () => void;
  onPress: (row: NeedsYouRowVM) => void;
}) {
  return (
    <>
      <Row row={row} guarded={guarded} onPress={onPress} onToggleBurst={row.burst ? onToggleBurst : undefined} />
      {burstOpen && row.burst?.map(member => (
        <div key={member.id} style={{ paddingLeft: 'var(--space-4)' }} data-needs-you-burst-member>
          <Row row={member} guarded={guarded} onPress={onPress} />
        </div>
      ))}
    </>
  );
}

function Row({
  row,
  guarded,
  onPress,
  onToggleBurst,
}: {
  row: NeedsYouRowVM;
  guarded: boolean;
  onPress: (row: NeedsYouRowVM) => void;
  onToggleBurst?: () => void;
}) {
  const live = !guarded && row.opens !== 'none';
  const action = guarded && !row.after ? 'after this' : row.action;
  const tip = guarded ? `${row.tooltip} ${TOPBAR_LOCKED_SUFFIX}` : row.tooltip;
  const body = (
    <>
      <Icon name={row.icon} size="chip" decorative />
      {/* A burst's "· and {n} more like it" never ellipsizes away (Law 49): the head line gives way first. */}
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {row.burst && row.burst.length > 1 ? row.burst[0].line : row.line}
      </span>
      {row.burst && row.burst.length > 1 && (
        <span style={{ flexShrink: 0, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{burstSuffix(row.burst.length - 1).trim()}</span>
      )}
      {action && (
        <span style={{ flexShrink: 0, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{action}</span>
      )}
    </>
  );
  const common = {
    'data-needs-you-row': row.producer,
    'data-needs-you-row-id': row.id,
  };
  // A burst row: its press opens the burst in place; each member is its own link.
  if (onToggleBurst) {
    return (
      <Tooltip label={tip} block focusable={false}>
        <Button variant="ghost" className="focus-ring" {...common} onClick={onToggleBurst} style={rowStyle(true)}>
          {body}
        </Button>
      </Tooltip>
    );
  }
  if (!live) {
    return (
      <Tooltip label={tip} block focusable={false}>
        <div {...common} tabIndex={0} aria-disabled="true" style={rowStyle(false)}>{body}</div>
      </Tooltip>
    );
  }
  return (
    <Tooltip label={tip} block focusable={false}>
      <Button variant="ghost" className="focus-ring" {...common} onClick={() => onPress(row)} style={rowStyle(true)}>
        {body}
      </Button>
    </Tooltip>
  );
}
