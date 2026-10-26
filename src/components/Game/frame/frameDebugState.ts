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

/** The top bar as drawn (THR-1875, frame plan § Tracing). */
export interface DebugTopBarState {
  /** Every `TOP_BAR_ITEMS` entry: drawn (on the bar, with width) and guarded (an encounter is open). */
  items: { id: string; rendered: boolean; guarded: boolean }[];
  /** Measured `[data-testid="game-topbar"]` height; must equal `--topbar-height`. */
  heightPx: number;
  /** `--topbar-height` as the browser resolves it. */
  tokenHeightPx: number;
  /** 1, or a defect. */
  rows: number;
  /** `scrollWidth − clientWidth` of the bar; 0, or a defect. */
  overflowPx: number;
  /** § F3 yield steps applied, in order. */
  yielded: string[];
  /** Controls whose word label is missing from the bar (Read the Threads, Settings…): [] or a defect. */
  unlabelled: string[];
}

/** Needs you as drawn (THR-1875). */
export interface DebugNeedsYouState {
  /** THR-2061 — the pill's number: Waiting + Held rows (News not counted). */
  count: number;
  /** THR-2061 — every row in the list, News included; the pill shows while this is above 0. */
  total: number;
  groups: { waiting: number; held: number; news: number };
  open: boolean;
  /** Rows the list fits at this viewport (§ F4 formula). */
  capacityRows: number;
  /** Rows folded into "and N more" rows while open. */
  foldedRows: number;
  /** Row lines drawn in the open list, fold rows included. */
  rowsShown: number;
  raised: boolean;
}

/** THR-1875 — the whole frame: slices 1 and 2 plus the top bar, Needs you and the named pause. */
export interface DebugFrameState extends DebugFrameStateSlice1 {
  topBar: DebugTopBarState;
  needsYou: DebugNeedsYouState;
  namedPause: { line: string } | null;
}

const TOP_BAR_ITEM_IDS = ['time', 'needs_you', 'direction_line', 'doom', 'omen', 'rivals', 'notables', 'read_threads', 'settings'] as const;

function readTopBar(doc: Document, win: Window): DebugTopBarState {
  const bar = doc.querySelector<HTMLElement>('[data-testid="game-topbar"]');
  const token = parseFloat(win.getComputedStyle(doc.documentElement).getPropertyValue('--topbar-height')) || 0;
  const rootPx = parseFloat(win.getComputedStyle(doc.documentElement).fontSize) || 16;
  const tokenRaw = win.getComputedStyle(doc.documentElement).getPropertyValue('--topbar-height').trim();
  const tokenHeightPx = tokenRaw.endsWith('rem') ? token * rootPx : token;
  const items = TOP_BAR_ITEM_IDS.map(id => {
    const el = bar?.querySelector<HTMLElement>(`[data-topbar-item="${id}"]`);
    return {
      id,
      rendered: !!el && el.getBoundingClientRect().width > 0,
      guarded: el?.dataset.topbarGuarded === 'true',
    };
  });
  const heightPx = height(bar);
  // A row is the height of the bar's tallest item; a bar taller than 1.5 × its token wrapped.
  const rows = bar && tokenHeightPx > 0 ? Math.max(1, Math.round(heightPx / tokenHeightPx)) : 1;
  const unlabelled: string[] = [];
  for (const id of ['read_threads', 'settings', 'rivals', 'notables'] as const) {
    const el = bar?.querySelector<HTMLElement>(`[data-topbar-item="${id}"]`);
    if (el && (el.textContent ?? '').replace(/\d+/g, '').trim().length === 0) unlabelled.push(id);
  }
  return {
    items,
    heightPx,
    tokenHeightPx: Math.round(tokenHeightPx * 100) / 100,
    rows,
    overflowPx: bar ? Math.max(0, bar.scrollWidth - bar.clientWidth) : 0,
    yielded: (bar?.dataset.topbarYielded ?? '').split(',').filter(Boolean),
    unlabelled,
  };
}

function readNeedsYou(doc: Document): DebugNeedsYouState {
  const pill = doc.querySelector<HTMLElement>('[data-testid="needs-you-pill"]');
  const list = doc.querySelector<HTMLElement>('[data-testid="needs-you-list"]');
  const src = list ?? pill;
  const n = (k: string) => Number(src?.getAttribute(k) ?? 0);
  return {
    count: n('data-needs-you-count'),
    total: n('data-needs-you-total'),
    groups: { waiting: n('data-needs-you-waiting'), held: n('data-needs-you-held'), news: n('data-needs-you-news') },
    open: !!list,
    capacityRows: n('data-needs-you-capacity'),
    foldedRows: list ? n('data-needs-you-folded') : 0,
    rowsShown: list ? list.querySelectorAll('[data-needs-you-row], [data-needs-you-fold]').length : 0,
    raised: src?.getAttribute('data-needs-you-raised') === 'true',
  };
}

function width(el: Element | null): number {
  return el ? Math.round(el.getBoundingClientRect().width * 100) / 100 : 0;
}

function height(el: Element | null): number {
  return el ? Math.round(el.getBoundingClientRect().height * 100) / 100 : 0;
}

export function readFrameState(doc: Document = document, win: Window = window): DebugFrameState {
  const named = doc.querySelector<HTMLElement>('[data-testid="named-pause-status"]');
  return {
    ...readFrameStateSlice1(doc, win),
    topBar: readTopBar(doc, win),
    needsYou: readNeedsYou(doc),
    namedPause: named ? { line: (named.textContent ?? '').replace(/^paused · /, '') } : null,
  };
}

function readFrameStateSlice1(doc: Document, win: Window): DebugFrameStateSlice1 {
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
