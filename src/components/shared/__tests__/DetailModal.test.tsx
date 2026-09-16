// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailModal } from '../DetailModal';
import { FOCUSABLE_SELECTOR } from '../focusableSelector';
import { DetailModalStackProvider, useDetailStack } from '../../../contexts/DetailModalStackContext';
import type { DetailPage } from '../../../types/detailPage';
import {
  DETAIL_BREADCRUMB_COLLAPSE_AT,
  DETAIL_EVENT_H,
  DETAIL_EVENT_W,
  DETAIL_PLACE_H,
  DETAIL_PLACE_W,
} from '../../../types/detailPage';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makePage(overrides: Partial<DetailPage> & { displayName: string }): DetailPage {
  return {
    kind: 'actor',
    nodeId: `node-${overrides.displayName.toLowerCase().replace(/\s/g, '-')}`,
    trail: [overrides.displayName],
    kindLabel: 'ACTOR',
    displayName: overrides.displayName,
    subtitle: 'IRON · CIVIC GUARD',
    sphere: 'force',
    isShowcase: false,
    sections: [],
    hasFullSheet: false,
    ...overrides,
  };
}

function Wrapper({ children }: { children?: React.ReactNode }) {
  return (
    <DetailModalStackProvider>
      <DetailModal />
      {children}
    </DetailModalStackProvider>
  );
}

/** Count rendered detail panels by data-detail-depth attribute. */
function panelCount(): number {
  return document.querySelectorAll('[data-detail-depth]').length;
}

/** Render N panels onto the stack; returns push button. */
function renderAtDepth(n: number) {
  const pages = Array.from({ length: n }, (_, i) =>
    makePage({ displayName: `Page ${i + 1}` }),
  );

  function Controller() {
    const { push } = useDetailStack();
    return (
      <button data-testid="push-all" onClick={() => pages.forEach(p => push(p))}>
        push all
      </button>
    );
  }

  render(
    <Wrapper>
      <Controller />
    </Wrapper>,
  );
  fireEvent.click(screen.getByTestId('push-all'));
  return pages;
}

function renderAtDepthInViewport(n: number, width: number, height: number) {
  const pages = Array.from({ length: n }, (_, i) =>
    makePage({ displayName: `Page ${i + 1}` }),
  );

  function Controller() {
    const { push } = useDetailStack();
    return (
      <button data-testid="push-all" onClick={() => pages.forEach(p => push(p))}>
        push all
      </button>
    );
  }

  render(
    <div style={{ width, height }}>
      <Wrapper>
        <Controller />
      </Wrapper>
    </div>,
  );
  fireEvent.click(screen.getByTestId('push-all'));
  return pages;
}

// ─── Depth 1 ──────────────────────────────────────────────────────────────────

describe('DetailModal — depth 1', () => {
  it('renders one panel', () => {
    renderAtDepth(1);
    expect(panelCount()).toBe(1);
  });

  it('snapshot: depth 1', () => {
    renderAtDepth(1);
    expect(document.body).toMatchSnapshot('detail-modal-depth-1');
  });

  it('snapshot: depth 1 at 2560x1440 sample viewport', () => {
    renderAtDepthInViewport(1, 2560, 1440);
    expect(document.body).toMatchSnapshot('detail-modal-2560x1440');
  });

  it('shows display name in the panel header', () => {
    renderAtDepth(1);
    // Display name appears in the header div AND in the breadcrumb; both are fine.
    expect(screen.getAllByText('Page 1').length).toBeGreaterThan(0);
  });

  it('breadcrumb shows ENCOUNTER as parent crumb', () => {
    renderAtDepth(1);
    // Trail is auto-built as ['ENCOUNTER', 'Page 1']. 'ENCOUNTER' is a non-last crumb.
    expect(screen.getByText('ENCOUNTER')).toBeInTheDocument();
  });

  it('renders ESC / ← hint in footer', () => {
    renderAtDepth(1);
    expect(screen.getByText(/ESC closes/)).toBeInTheDocument();
  });

  it('closes on × button click', () => {
    renderAtDepth(1);
    fireEvent.click(screen.getByLabelText('Close detail'));
    expect(panelCount()).toBe(0);
  });

  it('closes on Escape key', () => {
    renderAtDepth(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panelCount()).toBe(0);
  });

  it('closes on ArrowLeft key', () => {
    renderAtDepth(1);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(panelCount()).toBe(0);
  });

  it('renders nothing when stack is empty', () => {
    render(<Wrapper />);
    expect(panelCount()).toBe(0);
  });
});

// ─── Depth 2 ──────────────────────────────────────────────────────────────────

describe('DetailModal — depth 2', () => {
  it('renders two panels', () => {
    renderAtDepth(2);
    expect(panelCount()).toBe(2);
  });

  it('snapshot: depth 2', () => {
    renderAtDepth(2);
    expect(document.body).toMatchSnapshot('detail-modal-depth-2');
  });

  it('both panels have a close button', () => {
    renderAtDepth(2);
    expect(screen.getAllByLabelText('Close detail')).toHaveLength(2);
  });

  it('topmost panel (depth 1) shows Page 2 as its display name', () => {
    renderAtDepth(2);
    // The panel at depth=1 is the topmost. Its display name div contains 'Page 2'.
    const panel = document.querySelector('[data-detail-depth="1"]');
    expect(panel).not.toBeNull();
    expect(panel!.textContent).toContain('Page 2');
  });

  it('ESC pops only the topmost — leaves depth 1 panel, removes depth 2', () => {
    renderAtDepth(2);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panelCount()).toBe(1);
    expect(document.querySelector('[data-detail-depth="0"]')).not.toBeNull();
    expect(document.querySelector('[data-detail-depth="1"]')).toBeNull();
  });

  it('back button on topmost pops one level', () => {
    renderAtDepth(2);
    const backBtns = screen.getAllByLabelText('Go back');
    fireEvent.click(backBtns[backBtns.length - 1]);
    expect(panelCount()).toBe(1);
  });

  it('topmost panel shows breadcrumb with Page 1 as parent crumb (text is clickable)', () => {
    renderAtDepth(2);
    const panel = document.querySelector('[data-detail-depth="1"]');
    expect(panel!.textContent).toContain('PAGE 1');
    expect(panel!.textContent).toContain('PAGE 2');
  });
});

// ─── Depth 4 (boundary before collapse) ──────────────────────────────────────

describe(`DetailModal — depth ${DETAIL_BREADCRUMB_COLLAPSE_AT}`, () => {
  it('renders four panels', () => {
    renderAtDepth(4);
    expect(panelCount()).toBe(4);
  });

  it('snapshot: depth 4', () => {
    renderAtDepth(4);
    expect(document.body).toMatchSnapshot('detail-modal-depth-4');
  });

  it('topmost panel trail has 5 entries → breadcrumb collapses', () => {
    renderAtDepth(4);
    // Trail for depth 3 entry: ['ENCOUNTER','Page 1','Page 2','Page 3','Page 4'] = 5 items.
    // 5 > DETAIL_BREADCRUMB_COLLAPSE_AT(4) → collapse occurs, showing '…'.
    const topPanel = document.querySelector('[data-detail-depth="3"]');
    expect(topPanel!.textContent).toContain('…');
  });

  it('closing from depth 4 returns to 3 panels', () => {
    renderAtDepth(4);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panelCount()).toBe(3);
    expect(document.querySelector('[data-detail-depth="3"]')).toBeNull();
    expect(document.querySelector('[data-detail-depth="2"]')).not.toBeNull();
  });
});

// ─── Depth 5 (breadcrumb collapses) ──────────────────────────────────────────

describe('DetailModal — depth 5 (breadcrumb collapses to `…`)', () => {
  it('renders five panels', () => {
    renderAtDepth(5);
    expect(panelCount()).toBe(5);
  });

  it('snapshot: depth 5', () => {
    renderAtDepth(5);
    expect(document.body).toMatchSnapshot('detail-modal-depth-5');
  });

  it('topmost panel breadcrumb contains `…` for collapsed early entries', () => {
    renderAtDepth(5);
    const topPanel = document.querySelector('[data-detail-depth="4"]');
    expect(topPanel!.textContent).toContain('…');
  });

  it('topmost panel shows the most recent pages but hides Page 1 in breadcrumb', () => {
    renderAtDepth(5);
    // Trail for depth-5 entry: ['ENCOUNTER','Page 1','Page 2','Page 3','Page 4','Page 5'] = 6 items.
    // Collapse: keep DETAIL_BREADCRUMB_COLLAPSE_AT-1 = 3 visible entries + '…'.
    // Breadcrumb = [… , Page 3, Page 4, Page 5].
    // 'Page 1' and 'Page 2' should be hidden behind '…' in the topmost panel's breadcrumb.
    const topPanel = document.querySelector('[data-detail-depth="4"]');
    const breadcrumbEl = topPanel!.querySelector('[style*="margin-bottom: 6px"]');
    // 'Page 1' should NOT appear in the topmost breadcrumb (it's collapsed).
    expect(breadcrumbEl!.textContent).not.toContain('Page 1');
    expect(breadcrumbEl!.textContent).not.toContain('Page 2');
    expect(breadcrumbEl!.textContent).toContain('…');
    expect(breadcrumbEl!.textContent).toContain('PAGE 5');
  });

  it('ESC at depth 5 pops to 4 panels', () => {
    renderAtDepth(5);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panelCount()).toBe(4);
    expect(document.querySelector('[data-detail-depth="4"]')).toBeNull();
    expect(document.querySelector('[data-detail-depth="3"]')).not.toBeNull();
  });
});

// ─── Dialog semantics + Law 50 focus contract (THR-1024) ─────────────────────

/**
 * Renders a stack with a real invoking element, so "focus returns to the invoker"
 * is asserted against something that actually held focus rather than `document.body`.
 *
 * `fireEvent.click` does not move focus in jsdom, so the invoker is focused explicitly
 * — the same shape `Modal.test.tsx` uses for its own Law 50 suite.
 */
function renderWithInvoker() {
  const pages = [makePage({ displayName: 'Page 1' }), makePage({ displayName: 'Page 2' })];

  function Controller() {
    const { push, pop } = useDetailStack();
    return (
      <>
        <button data-testid="invoker" onClick={() => push(pages[0])}>open</button>
        <button data-testid="push-second" onClick={() => push(pages[1])}>deeper</button>
        <button data-testid="pop-one" onClick={pop}>back</button>
      </>
    );
  }

  render(
    <Wrapper>
      <Controller />
    </Wrapper>,
  );
  return {
    invoker: screen.getByTestId('invoker') as HTMLButtonElement,
    pushSecond: screen.getByTestId('push-second') as HTMLButtonElement,
    popOne: screen.getByTestId('pop-one') as HTMLButtonElement,
  };
}

function panelAt(depth: number): HTMLElement {
  const panel = screen.getByTestId(`detail-panel-${depth}`);
  expect(panel).not.toBeNull();
  return panel;
}

/**
 * A panel carrying two focusable controls, so a Tab wrap has a distinct first and last
 * to move between.
 *
 * A plain page at depth 0 carries exactly one button (the close button): the back button
 * needs depth > 0, the narration button needs prose, and the footer CTA needs a full sheet.
 * So the wrap is asserted on a full-sheet page — close in the header, "open her sheet" in
 * the footer — which is the ordinary actor card a player opens, not a contrived fixture.
 *
 * Collected through `FOCUSABLE_SELECTOR` rather than `button`, because since THR-1504 the
 * breadcrumb's navigable crumbs are tab stops too (Law 23) and they come first in document
 * order — the trap's "first" is the `ENCOUNTER` crumb, not the close button.
 */
function renderTwoControlPanel(): HTMLElement[] {
  const page = makePage({ displayName: 'Captain Veiren', hasFullSheet: true });

  function PushPage() {
    const { push } = useDetailStack();
    return <button data-testid="push" onClick={() => push(page)}>push</button>;
  }

  render(
    <Wrapper>
      <PushPage />
    </Wrapper>,
  );
  fireEvent.click(screen.getByTestId('push'));

  const focusable = Array.from(panelAt(0).querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  expect(focusable.length).toBeGreaterThan(1);
  return focusable;
}

describe('DetailModal — dialog semantics', () => {
  it('exposes the panel as a dialog', () => {
    renderAtDepth(1);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('marks the open dialog aria-modal', () => {
    renderAtDepth(1);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('names the dialog after the page it is showing', () => {
    renderAtDepth(1);
    expect(screen.getByRole('dialog', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('exposes no dialog at all when the stack is empty', () => {
    render(<Wrapper />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks only the topmost of a stack aria-modal', () => {
    renderAtDepth(2);
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(2);
    expect(dialogs[0]).toHaveAttribute('aria-modal', 'false');
    expect(dialogs[1]).toHaveAttribute('aria-modal', 'true');
  });
});

describe('DetailModal — Law 50 focus contract', () => {
  it('moves focus into the panel on open', () => {
    const { invoker } = renderWithInvoker();
    invoker.focus();
    fireEvent.click(invoker);

    expect(panelAt(0).contains(document.activeElement)).toBe(true);
  });

  it('returns focus to the invoking element on close', () => {
    const { invoker } = renderWithInvoker();
    invoker.focus();
    fireEvent.click(invoker);
    expect(document.activeElement).not.toBe(invoker);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(panelCount()).toBe(0);
    expect(document.activeElement).toBe(invoker);
  });

  it('hands focus back into the panel beneath when a pushed panel closes', () => {
    const { invoker, pushSecond } = renderWithInvoker();
    invoker.focus();
    fireEvent.click(invoker);

    // A control inside panel 0 is what opens panel 1, so that control is panel 1's invoker.
    const fromWithin = panelAt(0).querySelector<HTMLElement>('button');
    expect(fromWithin).not.toBeNull();
    fromWithin!.focus();
    fireEvent.click(pushSecond);
    expect(panelAt(1).contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(panelCount()).toBe(1);
    expect(document.activeElement).toBe(fromWithin);
  });

  it('wraps Tab forward from the last control back to the first', () => {
    const focusable = renderTwoControlPanel();

    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('wraps Shift+Tab backward from the first control to the last', () => {
    const focusable = renderTwoControlPanel();

    const first = focusable[0];
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it('holds focus on the panel when Tab has nowhere to go', () => {
    // A depth-0 page with no full sheet and no prose carries exactly one button — the
    // close button. Since THR-1504 the `ENCOUNTER` crumb is a second stop, so Tab from
    // the close button wraps to it; either way focus must not escape to the page behind
    // the overlay.
    renderAtDepth(1);
    const panel = panelAt(0);
    const only = panel.querySelectorAll<HTMLElement>('button');
    expect(only).toHaveLength(1);

    only[0].focus();
    fireEvent.keyDown(only[0], { key: 'Tab' });

    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('traps Tab in the topmost panel only — the one beneath never steals it', () => {
    renderAtDepth(2);
    const top = panelAt(1);
    const focusable = Array.from(top.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });

    expect(top.contains(document.activeElement)).toBe(true);
  });
});

// ─── Law 23 on the breadcrumb — the crumb is inside the panel's Tab cycle (THR-1504) ──

describe('DetailModal — breadcrumb crumbs sit inside the Law 50 Tab cycle', () => {
  it('a navigable crumb is in the topmost panel’s focusable set', () => {
    renderAtDepth(2);
    const top = panelAt(1);
    const focusable = Array.from(top.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const crumbs = focusable.filter(el => el.getAttribute('role') === 'button');
    // Trail at depth 1 is ['ENCOUNTER', 'Page 1', 'Page 2']: two navigable crumbs, the
    // last one inert.
    expect(crumbs.map(el => el.textContent)).toEqual(['ENCOUNTER', 'PAGE 1']);
    // And the crumbs come first in document order, ahead of the header buttons, so
    // Tab from the panel's first stop lands on the trail.
    expect(focusable[0]).toBe(crumbs[0]);
  });

  it('Shift+Tab from the first crumb wraps to the last control, and Tab from the last wraps back to the crumb', () => {
    renderAtDepth(2);
    const top = panelAt(1);
    const focusable = Array.from(top.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    expect(first).toHaveAttribute('role', 'button');
    expect(first.textContent).toBe('ENCOUNTER');
    expect(last.tagName).toBe('BUTTON');

    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('Enter on a crumb pops the stack to that level', () => {
    renderAtDepth(3);
    const top = panelAt(2);
    const crumbs = Array.from(top.querySelectorAll<HTMLElement>('[role="button"]'));
    // Trail at depth 2: ['ENCOUNTER', 'Page 1', 'Page 2', 'Page 3']; 'PAGE 1' is stackIndex 0.
    const pageOne = crumbs.find(el => el.textContent === 'PAGE 1');
    expect(pageOne).toBeDefined();
    fireEvent.keyDown(pageOne!, { key: 'Enter' });
    expect(panelCount()).toBe(1);
    expect(document.querySelector('[data-detail-depth="0"]')).not.toBeNull();
  });

  it('the last crumb of the topmost panel is not a tab stop', () => {
    renderAtDepth(2);
    const top = panelAt(1);
    const focusable = Array.from(top.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    expect(focusable.map(el => el.textContent)).not.toContain('PAGE 2');
  });
});

// ─── Section rendering ────────────────────────────────────────────────────────

describe('DetailModal — section rendering', () => {
  function renderWithSections() {
    const page = makePage({
      displayName: 'Captain Veiren',
      sections: [
        {
          kind: 'prose',
          typeId: 'disposition_toward_her',
          label: 'DISPOSITION TOWARD HER',
          gold: true,
          tier: 'routine',
          source: 'graphResolver',
          prose: 'He remembers her name.',
        },
        {
          kind: 'chips',
          typeId: 'threads_between_them',
          label: 'THREADS BETWEEN THEM',
          gold: false,
          tier: 'routine',
          source: 'graphResolver',
          chips: [{ label: 'authority taut', sphere: 'force' }],
        },
        {
          kind: 'event-card',
          typeId: 'recent_encounters',
          label: 'WHEN THIS THREAD LAST PULLED',
          gold: false,
          tier: 'routine',
          source: 'graphResolver',
          whenLabel: '12 TURNS AGO · THE IRON GATE',
          prose: 'She passed him without a word.',
          eventRef: { nodeId: 'event-1', pageKind: 'event' },
        },
        {
          kind: 'panel',
          typeId: 'reputations_they_hold',
          label: 'WHAT THEY TRACK',
          gold: false,
          tier: 'routine',
          source: 'graphResolver',
          rows: [{ left: 'Honour', right: 'observed', sentiment: 'positive' }],
        },
      ],
    });

    function PushPage() {
      const { push } = useDetailStack();
      return <button data-testid="push" onClick={() => push(page)}>push</button>;
    }

    render(
      <Wrapper>
        <PushPage />
      </Wrapper>,
    );
    fireEvent.click(screen.getByTestId('push'));
  }

  it('renders prose section label', () => {
    renderWithSections();
    expect(screen.getByText('DISPOSITION TOWARD HER')).toBeInTheDocument();
  });

  it('renders prose section body', () => {
    renderWithSections();
    expect(screen.getByText('He remembers her name.')).toBeInTheDocument();
  });

  it('renders chips section label', () => {
    renderWithSections();
    expect(screen.getByText('THREADS BETWEEN THEM')).toBeInTheDocument();
  });

  it('renders chip label', () => {
    renderWithSections();
    expect(screen.getByText('authority taut')).toBeInTheDocument();
  });

  it('renders event-card whenLabel', () => {
    renderWithSections();
    expect(screen.getByText('12 TURNS AGO · THE IRON GATE')).toBeInTheDocument();
  });

  it('renders panel row', () => {
    renderWithSections();
    expect(screen.getByText('Honour')).toBeInTheDocument();
    expect(screen.getByText('observed')).toBeInTheDocument();
  });

  it('shows "open her sheet ↗" when hasFullSheet is true', () => {
    const page = makePage({ displayName: 'Someone', hasFullSheet: true });

    function PushPage() {
      const { push } = useDetailStack();
      return <button data-testid="push" onClick={() => push(page)}>push</button>;
    }

    render(
      <Wrapper>
        <PushPage />
      </Wrapper>,
    );
    fireEvent.click(screen.getByTestId('push'));
    expect(screen.getByText('open her sheet ↗')).toBeInTheDocument();
  });

  it('does not show "open her sheet ↗" when hasFullSheet is false', () => {
    renderAtDepth(1);
    expect(screen.queryByText('open her sheet ↗')).not.toBeInTheDocument();
  });

  it('uses place modal size constants for place pages', () => {
    const page = makePage({ displayName: 'Market', kind: 'place' });

    function PushPage() {
      const { push } = useDetailStack();
      return <button data-testid="push-place" onClick={() => push(page)}>push</button>;
    }

    render(
      <Wrapper>
        <PushPage />
      </Wrapper>,
    );
    fireEvent.click(screen.getByTestId('push-place'));
    expect(screen.getByTestId('detail-panel-0')).toHaveStyle({
      width: `${DETAIL_PLACE_W}px`,
      height: `${DETAIL_PLACE_H}px`,
    });
  });

  it('uses event modal size constants for event pages', () => {
    const page = makePage({ displayName: 'Council', kind: 'event' });

    function PushPage() {
      const { push } = useDetailStack();
      return <button data-testid="push-event" onClick={() => push(page)}>push</button>;
    }

    render(
      <Wrapper>
        <PushPage />
      </Wrapper>,
    );
    fireEvent.click(screen.getByTestId('push-event'));
    expect(screen.getByTestId('detail-panel-0')).toHaveStyle({
      width: `${DETAIL_EVENT_W}px`,
      height: `${DETAIL_EVENT_H}px`,
    });
  });
});
