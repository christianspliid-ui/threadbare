/**
 * RowCards — card counts on every world-ref row and the inline tray (THR-1913, Inspector
 * plan § D9 way 2, THR-1827 call 13).
 *
 * Every rendered row that names a world thing (Connections, *In this land*, a `links`
 * section) carries a count chip — "2 cards" — when the god can cast something on that
 * thing now; zero renders nothing (Law 25). Pressing the count opens a tray under the row
 * with those cards. One tray is open at a time; Esc or a second press closes it. A card in
 * the tray arms with the row's target, and "Cast on Temple Quarter" casts it through the
 * one cast path (Law 48). The page never navigates.
 *
 * The counts are computed per row as the row mounts (`LinkRowAccessoryContext`), so a
 * folded row is never counted (plan kill criterion 6). It reads no graph: the host hands
 * in `cardsFor` and `cast`.
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
  cast: (actionId: string, ref: WorldRef) => ActCastResult;
  openKey: string | null;
  toggle: (key: string) => void;
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

function RowCardCount({ row }: { row: Row }) {
  const ctx = useContext(RowCardsContext);
  const cards = useRowCards(row.ref);
  if (!ctx || cards.length === 0) return null;
  const key = rowCardsKey(row.ref);
  const word = rowCardsWord(cards.length);
  return (
    <span data-row-cards={key} data-open={ctx.openKey === key ? 'true' : 'false'} style={{ flexShrink: 0, marginLeft: 'auto' }}>
      <Chip
        role="count"
        size="sm"
        count={cards.length}
        of={ROW_CARDS_COUNT_OF}
        icon="cards"
        label={word}
        desc={UI_TOOLTIPS[ROW_CARDS_TOOLTIP_ID]?.desc}
        onOpen={() => ctx.toggle(key)}
      />
    </span>
  );
}

function RowCardTray({ row }: { row: Row }) {
  const ctx = useContext(RowCardsContext);
  const key = rowCardsKey(row.ref);
  if (!ctx || ctx.openKey !== key) return null;
  return <OpenTray row={row} rowKey={key} ctx={ctx} />;
}

function OpenTray({ row, rowKey, ctx }: { row: Row; rowKey: string; ctx: RowCardsValue }) {
  const cards = useRowCards(row.ref);
  const { cast, close } = ctx;
  const onCast = useCallback((actionId: string): ActCastResult => {
    const result = cast(actionId, row.ref);
    if (result.cast) close();
    return result;
  }, [cast, close, row.ref]);
  const heading = INSPECTOR_WORDS.rowTray.replace('{name}', row.name);
  return (
    <li data-row-tray={rowKey} style={{ padding: '6px 8px', marginLeft: '12px', borderLeft: '2px solid var(--border-gold)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-control)', minWidth: 0 }}>
      <ActOnRow compact actOn={{ heading, cards, emptyLine: cards.length === 0 ? INSPECTOR_WORDS.actOnEmpty.replace('{name}', row.name) : null }} targetName={row.name} onCast={onCast} />
    </li>
  );
}

const ACCESSORY: LinkRowAccessory = {
  trailing: row => <RowCardCount row={row} />,
  below: row => <RowCardTray row={row} />,
};

/**
 * Wrap an Inspector page so its world-ref rows carry counts and trays. `cardsFor` is the
 * host's per-row read (`actOnRowCards` on the live state); `cast` is the one cast path.
 */
export function RowCardsProvider({ cardsFor, cast, children }: {
  cardsFor: (ref: WorldRef) => ActOnCardVM[];
  cast: (actionId: string, ref: WorldRef) => ActCastResult;
  children: ReactNode;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = useCallback((key: string) => setOpenKey(prev => (prev === key ? null : key)), []);
  const close = useCallback(() => setOpenKey(null), []);
  // Esc closes the open tray before it steps the Inspector down (a later layer wins its band).
  useEscapeLayer(openKey !== null, close, ESCAPE_LAYER_Z_PANEL, 'Inspector card tray');
  const value = useMemo<RowCardsValue>(() => ({ cardsFor, cast, openKey, toggle, close }), [cardsFor, cast, openKey, toggle, close]);
  return (
    <RowCardsContext.Provider value={value}>
      <LinkRowAccessoryContext.Provider value={ACCESSORY}>{children}</LinkRowAccessoryContext.Provider>
    </RowCardsContext.Provider>
  );
}
