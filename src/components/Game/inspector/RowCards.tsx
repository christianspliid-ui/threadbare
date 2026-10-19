/**
 * RowCards — card counts on every world-ref row and the inline tray (THR-1913, Inspector
 * plan § D9 way 2, THR-1827 call 13).
 *
 * Every rendered row that names a world thing (Connections, *In this land*, a `links`
 * section) carries a count chip — "2 cards" — when the god can cast something on that
 * thing now; zero renders nothing (Law 25). Pressing the count opens a tray under the row
 * with those cards. One tray is open at a time — keyed by the row, not its ref, since two
 * rows may link one thing; Esc or a second press closes it. A card in the tray arms with
 * the row's target, and "Cast on Temple Quarter" casts it through the one cast path
 * (Law 48), naming the thing the cast lands on. The page never navigates.
 *
 * The counts are computed per row as the row mounts (`LinkRowAccessoryContext`), so a
 * folded row is never counted (plan kill criterion 6). It reads no graph: the host hands
 * in `cardsFor`, `targetNameFor` and `cast`.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ActOnCardVM, LinkRowVM } from '../../../engine/views/subjects/subjectTypes';
import { rowCardsKey } from '../../../engine/views/subjects/actOn';
import type { WorldRef } from '../../../types/worldRef';
import type { LinkRow } from '../../../types/detailPage';
import { INSPECTOR_WORDS } from '../../../data/view-content';
import { UI_TOOLTIPS } from '../../../data/ui-content';
import { Chip } from '../../shared/Chip';
import { LinkRowAccessoryContext, type LinkRowAccessory } from '../../shared/Section';
import { useEscapeLayer, ESCAPE_LAYER_Z_PANEL } from '../../shared/useEscapeLayer';
import { ActOnRow, type ActCastResult } from './InspectorParts';

/** The tooltip registry entry the count chip explains itself with (Law 17). */
export const ROW_CARDS_TOOLTIP_ID = 'ui.inspector.cards';
/** The count chip's owner key, read by `__DEBUG.getCountChips()`. */
const ROW_CARDS_COUNT_OF = 'inspector-row-cards';

type Row = LinkRow | LinkRowVM;

interface RowCardsValue {
  cardsFor: (ref: WorldRef) => ActOnCardVM[];
  targetNameFor: (ref: WorldRef) => string | null;
  cast: (actionId: string, ref: WorldRef) => ActCastResult;
  /** The open tray's row id (`LinkRows`' per-row id), or null. */
  openRow: string | null;
  toggle: (rowId: string) => void;
  close: () => void;
}

const RowCardsContext = createContext<RowCardsValue | null>(null);

/** "2 cards" / "1 card". */
export function rowCardsWord(n: number): string {
  return n === 1 ? INSPECTOR_WORDS.rowCards.one : INSPECTOR_WORDS.rowCards.many.replace('{n}', String(n));
}

function useRowCards(ref: WorldRef): ActOnCardVM[] {
  const ctx = useContext(RowCardsContext);
  const cardsFor = ctx?.cardsFor;
  // One read per row per world state the host hands down (a new `cardsFor` each state).
  return useMemo(() => (cardsFor ? cardsFor(ref) : []), [cardsFor, ref]);
}

function RowCardCount({ row, rowId }: { row: Row; rowId: string }) {
  const ctx = useContext(RowCardsContext);
  const cards = useRowCards(row.ref);
  if (!ctx || cards.length === 0) return null;
  const word = rowCardsWord(cards.length);
  return (
    <span data-row-cards={rowCardsKey(row.ref)} data-open={ctx.openRow === rowId ? 'true' : 'false'} style={{ flexShrink: 0, marginLeft: 'auto' }}>
      <Chip
        role="count"
        size="sm"
        count={cards.length}
        of={ROW_CARDS_COUNT_OF}
        icon="cards"
        label={word}
        desc={UI_TOOLTIPS[ROW_CARDS_TOOLTIP_ID]?.desc}
        onOpen={() => ctx.toggle(rowId)}
      />
    </span>
  );
}

function RowCardTray({ row, rowId }: { row: Row; rowId: string }) {
  const ctx = useContext(RowCardsContext);
  if (!ctx || ctx.openRow !== rowId) return null;
  return <OpenTray row={row} ctx={ctx} />;
}

function OpenTray({ row, ctx }: { row: Row; ctx: RowCardsValue }) {
  const cards = useRowCards(row.ref);
  const { cast, close, targetNameFor } = ctx;
  // The thing the cast lands on, which a row's own label may not name (a resource, a covenant).
  const name = useMemo(() => targetNameFor(row.ref) ?? row.name, [targetNameFor, row.ref, row.name]);
  const onCast = useCallback((actionId: string): ActCastResult => {
    const result = cast(actionId, row.ref);
    if (result.cast) close();
    return result;
  }, [cast, close, row.ref]);
  const heading = INSPECTOR_WORDS.rowTray.replace('{name}', name);
  return (
    <li data-row-tray={rowCardsKey(row.ref)} style={{ padding: '6px 8px', marginLeft: '12px', borderLeft: '2px solid var(--border-gold)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-control)', minWidth: 0 }}>
      <ActOnRow compact actOn={{ heading, cards, emptyLine: cards.length === 0 ? INSPECTOR_WORDS.actOnEmpty.replace('{name}', name) : null }} targetName={name} onCast={onCast} />
    </li>
  );
}

const ACCESSORY: LinkRowAccessory = {
  trailing: (row, rowId) => <RowCardCount row={row} rowId={rowId} />,
  below: (row, rowId) => <RowCardTray row={row} rowId={rowId} />,
};

/**
 * Wrap an Inspector page so its world-ref rows carry counts and trays. `cardsFor` is the
 * host's per-row read (`actOnRowCards` on the live state), `targetNameFor` names what a
 * row's cast lands on (`actOnRowTargetName`), and `cast` is the one cast path.
 */
export function RowCardsProvider({ cardsFor, targetNameFor, cast, children }: {
  cardsFor: (ref: WorldRef) => ActOnCardVM[];
  targetNameFor: (ref: WorldRef) => string | null;
  cast: (actionId: string, ref: WorldRef) => ActCastResult;
  children: ReactNode;
}) {
  const [openRow, setOpenRow] = useState<string | null>(null);
  const toggle = useCallback((rowId: string) => setOpenRow(prev => (prev === rowId ? null : rowId)), []);
  const close = useCallback(() => setOpenRow(null), []);
  // Esc closes the open tray before it steps the Inspector down (a later layer wins its band).
  useEscapeLayer(openRow !== null, close, ESCAPE_LAYER_Z_PANEL, 'Inspector card tray');
  const value = useMemo<RowCardsValue>(() => ({ cardsFor, targetNameFor, cast, openRow, toggle, close }), [cardsFor, targetNameFor, cast, openRow, toggle, close]);
  return (
    <RowCardsContext.Provider value={value}>
      <LinkRowAccessoryContext.Provider value={ACCESSORY}>{children}</LinkRowAccessoryContext.Provider>
    </RowCardsContext.Provider>
  );
}
