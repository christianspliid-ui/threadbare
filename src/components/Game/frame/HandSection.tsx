/**
 * HandSection — the god rail's hand, headed "Your cards" (THR-1894, frame plan § F6).
 *
 * The two core verbs (Move, and Investiture once The Seat brings it), then one row per
 * god card the run has revealed, each tinted by the pool that pays it — one line, the
 * name on the left and its par price on the trailing edge, as in a deck list (THR-2177). The hand takes the rail's free height (Law 57): whole while every row fits,
 * grouped by paying sphere at the limit (`handFit.ts`), an open group scrolling inside
 * the hand region only. While a moment is open the rows rest — dimmed, presses
 * swallowed — under one line that says why. The hand keeps a floor of
 * `GOD_RAIL_HAND_MIN_ROWS` rows (`data-hand-floor`): the folded rows give way first.
 *
 * A press calls `useHandPress()` (the frame's seam); the armed row's look comes from
 * `useArmedCard()`. Both are THR-1876's to fill; the default opens the Codex entry.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { GodRailHand, HandCardVM } from '../../../engine/views/godRail';
import type { SphereName } from '../../../types';
import { Tooltip } from '../../shared/Tooltip';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { SectionLabel } from '../../shared/Section';
import { getSphereColor } from '../../../data/sphereIcons';
import { sphereWord } from '../../../data/essence-format';
import { countWords } from '../../../data/frame-content';
import {
  HAND_CORE_VERBS,
  HAND_EMPTY_LINE,
  HAND_GROUP_HEADER,
  HAND_HEADER,
  HAND_REST_LINES,
} from '../../../data/frame-content';
import { GOD_RAIL_HAND_GROUP_KEY, godRailSectionIcon } from '../../../data/frame-registry';
import { NEWLY_REVEALED_STYLE } from '../GameView/openingReveal';
import { CARD_DRAG_MIME, useArmedCard, useHandDragStart, useHandPress } from './HandPressContext';
import {
  GOD_RAIL_HAND_MIN_ROWS,
  HAND_CHROME_EST_PX,
  HAND_REST_OPACITY,
  HAND_ROW_EST_PX,
  HAND_ROW_GAP_PX,
  HAND_ROW_PADDING,
  HAND_ROW_PRICE_GAP_PX,
  handFloorPx,
  handWholeHeight,
  nextHandFitMode,
  openHandGroup,
  type HandFitMode,
} from './handFit';

export type HandRest = 'encounter' | 'moment' | null;

export interface HandSectionProps {
  hand: GodRailHand;
  /** THR-1837 — Investiture arrives with The Seat. */
  showInvestiture: boolean;
  investitureNewlyRevealed?: boolean;
  onMove?: () => void;
  onInvestiture?: () => void;
  /** Why the hand rests, or null while it answers (the interrupt registry's `anyOpen`). */
  rest: HandRest;
}

function readGroupPref(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(GOD_RAIL_HAND_GROUP_KEY);
  } catch {
    return null;
  }
}

function writeGroupPref(sphere: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(GOD_RAIL_HAND_GROUP_KEY, sphere);
  } catch {
    /* private browsing: the choice holds for the session */
  }
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
};

/** THR-2099 — the "Your cards" heading's shape, from the hand's rail row. */
const HAND_ICON = godRailSectionIcon('hand');

function CardRow({ card, rest, armed }: { card: HandCardVM; rest: HandRest; armed: boolean }) {
  const press = useHandPress();
  // THR-1914: with an arming provider a card can be dragged onto a row or the map — a
  // shortcut that chooses a target and never casts; the click always works.
  const dragStart = useHandDragStart();
  const draggable = !!dragStart && !rest;
  const tint = getSphereColor(card.paySphere);
  return (
    <button
      type="button"
      data-testid="hand-card"
      data-card-id={card.id}
      data-pay-sphere={card.paySphere}
      data-payable={card.payable ? 'true' : 'false'}
      data-armed={armed ? 'true' : undefined}
      data-row-layout="line"
      aria-pressed={dragStart ? armed : undefined}
      aria-disabled={rest ? true : undefined}
      draggable={draggable || undefined}
      onDragStart={draggable ? (e) => {
        e.dataTransfer.setData(CARD_DRAG_MIME, card.id);
        e.dataTransfer.effectAllowed = 'link';
        dragStart!(card.id);
      } : undefined}
      onClick={() => {
        if (rest) return;
        press(card.id);
      }}
      className="focus-ring"
      style={{
        // THR-2177 (U1) — one line: name, then the price on the trailing edge. The
        // unpayable reason wraps onto its own line under them (flexBasis 100%).
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: HAND_ROW_PRICE_GAP_PX,
        rowGap: 0,
        minHeight: 24,
        lineHeight: 1.25,
        width: '100%',
        textAlign: 'left',
        padding: HAND_ROW_PADDING,
        background: armed ? 'var(--bg-raised)' : 'transparent',
        // Longhands only: React warns when a shorthand and a longhand of one value change together.
        borderTop: armed ? '1px solid var(--border-accent)' : '1px solid transparent',
        borderRight: armed ? '1px solid var(--border-accent)' : '1px solid transparent',
        borderBottom: armed ? '1px solid var(--border-accent)' : '1px solid transparent',
        borderLeft: `3px solid ${tint}`,
        borderRadius: 'var(--radius-control)',
        cursor: rest ? 'default' : 'pointer',
        opacity: card.payable ? 1 : 0.6,
      }}
    >
      {/* TODO(THR-1975): the full card face on hover (HoverCard + CardFace); the description tooltip is the interim. */}
      <span data-testid="hand-card-name" style={{ flex: '1 1 auto', minWidth: 0 }}>
      <Tooltip label={card.name} desc={card.description} block focusable={false}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: armed ? 'var(--accent-gold)' : 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {card.name}
        </span>
      </Tooltip>
      </span>
      <span data-testid="hand-card-price" style={{ flexShrink: 0, marginLeft: 'auto', textAlign: 'right', whiteSpace: 'nowrap' }}>
      {card.priceTooltip ? (
        <Tooltip id="ui.hand_price" desc={card.priceTooltip} focusable={false}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {card.line2}
          </span>
        </Tooltip>
      ) : (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{card.line2}</span>
      )}
      </span>
      {card.reason && (
        <span data-testid="hand-card-reason" style={{ flexBasis: '100%', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {card.reason}
        </span>
      )}
    </button>
  );
}

export function HandSection({ hand, showInvestiture, investitureNewlyRevealed = false, onMove, onInvestiture, rest }: HandSectionProps) {
  const armedId = useArmedCard();
  const regionRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [freePx, setFreePx] = useState<number | null>(null);
  // THR-2177 — the hand's chrome (header, rest line, core verbs, gaps), measured on the
  // same observer, so the floor follows the 2560 type step.
  const [chromePx, setChromePx] = useState<number>(HAND_CHROME_EST_PX);
  const [rowPx, setRowPx] = useState<number>(HAND_ROW_EST_PX);
  const [mode, setMode] = useState<HandFitMode>('whole');
  const [groupPref, setGroupPref] = useState<string | null>(() => readGroupPref());

  const cards = hand.cards;

  // The free height: the hand region's own box, which takes what the pinned sections,
  // the core-verb row and the open folded rows leave (one ResizeObserver).
  useEffect(() => {
    const el = regionRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      setFreePx(el.clientHeight);
      const section = sectionRef.current;
      if (section && section.offsetHeight > 0) {
        const chrome = section.offsetHeight - el.offsetHeight;
        if (chrome >= 0) setChromePx((prev) => (Math.abs(prev - chrome) > 1 ? chrome : prev));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => ro.disconnect();
  }, []);

  // A rendered row's real height, so the whole-hand estimate tracks the shipped fonts.
  useEffect(() => {
    const row = regionRef.current?.querySelector<HTMLElement>('[data-testid="hand-card"]');
    if (row && row.offsetHeight > 0 && Math.abs(row.offsetHeight - rowPx) > 1) setRowPx(row.offsetHeight);
  });

  const neededPx = handWholeHeight(cards.length, rowPx, HAND_ROW_GAP_PX);
  // THR-2177 (U2) — the floor: three rows, or as many as the hand holds (one at least,
  // so the empty line and a single card show whole — THR-2176).
  const floorRows = Math.min(GOD_RAIL_HAND_MIN_ROWS, Math.max(1, cards.length));
  const floorPx = handFloorPx(rowPx, HAND_ROW_GAP_PX, chromePx, floorRows);
  useEffect(() => {
    setMode((prev) => nextHandFitMode(prev, neededPx, freePx));
  }, [neededPx, freePx]);

  const groups = useMemo(() => {
    const bySphere = new Map<SphereName, HandCardVM[]>();
    for (const c of cards) {
      const list = bySphere.get(c.paySphere) ?? [];
      list.push(c);
      bySphere.set(c.paySphere, list);
    }
    const order = hand.sphereOrder.length > 0 ? hand.sphereOrder : [...bySphere.keys()];
    return order.filter((s) => bySphere.has(s)).map((s) => ({ sphere: s, cards: bySphere.get(s)! }));
  }, [cards, hand.sphereOrder]);

  const armedGroup = armedId ? (cards.find((c) => c.id === armedId)?.paySphere ?? null) : null;
  const openGroup = mode === 'grouped' ? openHandGroup(groups.map((g) => g.sphere), armedGroup, groupPref) : null;

  const restLine = rest ? HAND_REST_LINES[rest] : null;
  const ring = (on: boolean) => (on ? { 'data-newly-revealed': 'true', style: NEWLY_REVEALED_STYLE } : {});

  return (
    <section
      ref={sectionRef}
      data-testid="god-rail-hand"
      data-hand-mode={mode}
      data-hand-cards={cards.length}
      data-hand-open-group={openGroup ?? ''}
      data-hand-rest={rest ?? ''}
      data-hand-free-height={freePx ?? ''}
      data-hand-floor={floorPx}
      data-armed-card={armedId ?? ''}
      aria-label={HAND_HEADER}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: floorPx }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <Tooltip id="ui.your_cards" focusable={false}>
          {/* THR-2099 (R2) — the heading's carved shape, read from its rail row. THR-2122 (U3.4):
              the one section heading, its count beside the words ("Your cards · 2"). */}
          <SectionLabel label={HAND_HEADER} count={cards.length} icon={HAND_ICON ?? undefined} flush />
        </Tooltip>
      </div>
      {restLine && (
        <div data-testid="hand-rest-line" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {restLine}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          opacity: rest ? HAND_REST_OPACITY : 1,
          pointerEvents: rest ? 'none' : undefined,
        }}
        aria-disabled={rest ? true : undefined}
      >
        <Button variant="secondary" size="sm" icon={<Icon name="move" size="floor" decorative />} onClick={onMove} title={HAND_CORE_VERBS.move.desc}>
          {HAND_CORE_VERBS.move.label}
        </Button>
        {showInvestiture && (
          <span {...ring(investitureNewlyRevealed)}>
            <Tooltip id="ui.investiture" focusable={false}>
              <Button variant="secondary" size="sm" icon={<Icon name="investiture" size="floor" decorative />} onClick={onInvestiture}>
                {HAND_CORE_VERBS.investiture.label}
              </Button>
            </Tooltip>
          </span>
        )}
      </div>

      <div
        ref={regionRef}
        data-testid="hand-region"
        style={{
          flex: 1,
          minHeight: 0,
          // THR-2177 — size containment: the region's rows never count toward the hand's
          // min-content, so the rail wrapper's automatic minimum is the floor alone. Without
          // it the wrapper grew to the rows' height, the folded block shrank, the region's
          // free height changed with the mode, and whole/grouped flipped every frame.
          contain: 'size',
          overflowY: 'auto',
          overflowX: 'hidden',
          opacity: rest ? HAND_REST_OPACITY : 1,
        }}
      >
        {cards.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>{HAND_EMPTY_LINE}</div>
        ) : mode === 'whole' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: HAND_ROW_GAP_PX }}>
            {cards.map((c) => <CardRow key={c.id} card={c} rest={rest} armed={c.id === armedId} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: HAND_ROW_GAP_PX }}>
            {groups.map((g) => {
              const isOpen = g.sphere === openGroup;
              return (
                <div key={g.sphere} data-testid="hand-group" data-sphere={g.sphere} data-open={isOpen ? 'true' : 'false'}>
                  <button
                    type="button"
                    className="focus-ring"
                    aria-expanded={isOpen}
                    onClick={() => {
                      setGroupPref(g.sphere);
                      writeGroupPref(g.sphere);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, width: '100%', minHeight: 24,
                      background: 'transparent', border: 'none', padding: '2px 0', cursor: 'pointer',
                      borderLeft: `3px solid ${getSphereColor(g.sphere)}`, paddingLeft: 8,
                    }}
                  >
                    <Icon name="disclosure" size="floor" decorative style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(90deg)' }} />
                    <span style={{ ...labelStyle, color: 'var(--text-secondary)' }}>
                      {countWords(g.cards.length, { one: HAND_GROUP_HEADER, other: HAND_GROUP_HEADER }, { sphere: sphereWord(g.sphere) })}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: HAND_ROW_GAP_PX, marginTop: HAND_ROW_GAP_PX }}>
                      {g.cards.map((c) => <CardRow key={c.id} card={c} rest={rest} armed={c.id === armedId} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
