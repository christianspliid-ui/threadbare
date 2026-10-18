/**
 * `__DEBUG.getFrameState()` — what the frame drew, read off the DOM (THR-1875 plan
 * § Debug inspection; slice 1 THR-1893 fills `ledgerRail` and `mapShare`).
 *
 * Each frame host writes its state as `data-*` attributes on its root; this reads them
 * back, so the accessor reports what is on screen, not what a store believes. Slice 2
 * (THR-1894) adds `godRail`; slice 3 adds `topBar` / `needsYou`.
 */

/** The god rail as drawn (THR-1894, frame plan § Tracing). */
export interface DebugGodRailState {
  sections: { id: string; rendered: boolean; open: boolean }[];
  hand: {
    cards: number;
    mode: 'whole' | 'grouped';
    openGroup: string | null;
    armedCardId: string | null;
    rest: 'encounter' | 'moment' | null;
    /** The hand region's measured height; null without a ResizeObserver. */
    freeHeightPx: number | null;
    /** Rows wider than their box (`scrollWidth > clientWidth`); 0 or a defect. */
    overflowingRows: number;
  };
  /** Measured rail width in px (320 / 400). */
  widthPx: number;
}
export interface DebugLedgerRailState {
  state: 'open' | 'strip' | 'hidden';
  folded: boolean;
  foldedBy: 'player' | 'inspector' | 'stage' | null;
  flyout: 'threads' | 'chronicle' | null;
  tab: 'now' | 'years' | 'ledger' | null;
  tabsRendered: string[];
  strip: { id: string; count: number }[];
  /** Measured rail width in px (56 folded). */
  widthPx: number;
}

export interface DebugFrameStateSlice1 {
  ledgerRail: DebugLedgerRailState;
  godRail: DebugGodRailState;
  /** Measured map area / viewport area: (W − rails) × (H − top bar) / (W × H). */
  mapShare: number;
}

function width(el: Element | null): number {
  return el ? Math.round(el.getBoundingClientRect().width * 100) / 100 : 0;
}

function height(el: Element | null): number {
  return el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : 0;
}

export function readFrameState(doc: Document = document, win: Window = window): DebugFrameStateSlice1 {
  const rail = doc.querySelector<HTMLElement>('[data-testid="right-sidebar"]');
  const panel = doc.querySelector<HTMLElement>('[data-testid="chronicle-panel"]');
  const flyoutPanel = doc.querySelector<HTMLElement>('[data-testid="ledger-flyout"] [data-testid="chronicle-panel"]');
  const tabSource = flyoutPanel ?? panel;
  const foldedBy = rail?.dataset.foldedBy;
  const flyout = rail?.dataset.flyout;
  const ledgerRail: DebugLedgerRailState = {
    state: (rail?.dataset.ledgerState as DebugLedgerRailState['state']) ?? 'hidden',
    folded: rail?.dataset.folded === 'true',
    foldedBy: foldedBy === 'player' || foldedBy === 'inspector' || foldedBy === 'stage' ? foldedBy : null,
    flyout: flyout === 'threads' || flyout === 'chronicle' ? flyout : null,
    tab: (tabSource?.dataset.tab as DebugLedgerRailState['tab']) ?? null,
    tabsRendered: tabSource?.dataset.tabsRendered ? tabSource.dataset.tabsRendered.split(',') : [],
    strip: [...doc.querySelectorAll<HTMLElement>('[data-testid="ledger-strip"] [data-strip-id]')].map(el => ({
      id: el.dataset.stripId ?? '',
      count: Number(el.dataset.stripCount ?? 0),
    })),
    widthPx: width(rail),
  };

  const W = win.innerWidth;
  const H = win.innerHeight;
  const godRail = doc.querySelector('aside[aria-label="Ascendant status"]');
  const topBar = doc.querySelector('[data-testid="game-topbar"]');
  const mapW = Math.max(0, W - width(godRail) - width(rail));
  const mapH = Math.max(0, H - height(topBar));
  const mapShare = W > 0 && H > 0 ? Math.round(((mapW * mapH) / (W * H)) * 1000) / 1000 : 0;

  return { ledgerRail, godRail: readGodRail(doc), mapShare };
}

const GOD_RAIL_SECTION_IDS = ['identity', 'essence', 'hand', 'reaches', 'mandate', 'covenants', 'signatures', 'hooks'] as const;

function readGodRail(doc: Document): DebugGodRailState {
  const rail = doc.querySelector<HTMLElement>('[data-testid="god-rail"]');
  const rendered = new Set((rail?.dataset.sectionsRendered ?? '').split(',').filter(Boolean));
  const open = new Set((rail?.dataset.rowsOpen ?? '').split(',').filter(Boolean));
  const hand = doc.querySelector<HTMLElement>('[data-testid="god-rail-hand"]');
  const rest = hand?.dataset.handRest;
  const free = hand?.dataset.handFreeHeight;
  const rows = [...doc.querySelectorAll<HTMLElement>('[data-testid="hand-card"]')];
  return {
    sections: GOD_RAIL_SECTION_IDS.map((id) => ({
      id,
      rendered: rendered.has(id),
      open: rendered.has(id) && (open.has(id) || ['identity', 'essence', 'hand'].includes(id)),
    })),
    hand: {
      cards: Number(hand?.dataset.handCards ?? 0),
      mode: hand?.dataset.handMode === 'grouped' ? 'grouped' : 'whole',
      openGroup: hand?.dataset.handOpenGroup || null,
      armedCardId: hand?.dataset.armedCard || null,
      rest: rest === 'encounter' || rest === 'moment' ? rest : null,
      freeHeightPx: free ? Number(free) : null,
      overflowingRows: rows.filter((r) => r.scrollWidth > r.clientWidth + 1).length,
    },
    widthPx: width(rail),
  };
}
