/**
 * `__DEBUG.getFrameState()` — what the frame drew, read off the DOM (THR-1875 plan
 * § Debug inspection; slice 1 THR-1893 fills `ledgerRail` and `mapShare`).
 *
 * Each frame host writes its state as `data-*` attributes on its root; this reads them
 * back, so the accessor reports what is on screen, not what a store believes. Slices 2
 * and 3 add `godRail` and `topBar` / `needsYou`.
 */
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

  return { ledgerRail, mapShare };
}
