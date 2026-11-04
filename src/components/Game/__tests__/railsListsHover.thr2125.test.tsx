// @vitest-environment jsdom
/**
 * THR-2125 — legibility 4: the god rail, the Ledger rail, list rows and the hover tier read
 * on the same ladder as the other three slices. Pins the plan's Done-when (a)–(h).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { GameState } from '../../../types/gameState';
import type { DetailPage } from '../../../types/detailPage';
import type { ThreadedNode } from '../../../engine/retinue';
import type { LedgerRailVM } from '../../../engine/views/ledgerRail';
import type { AscendantIdentityView, QuintessenceView, EssenceRowView } from '../ascendant-bar/selectors';
import { emptyGodRail } from '../../../engine/views/godRail';
import { GOD_RAIL_COMPONENTS, type GodRailBag } from '../frame/godRailComponents';
import { EssenceBlock } from '../ascendant-bar/EssenceBlock';
import { ThreadsPanel } from '../ThreadsPanel';
import { ChroniclePanel } from '../ChroniclePanel';
import { ListRow } from '../../shared/ListRow';
import { Tooltip } from '../../shared/Tooltip';
import { HoverCard, hoverNow } from '../../shared/HoverCard';
import { TOOLTIP_SHOW_DELAY } from '../../../types/tooltip';
import { readListDressing } from '../listDressing';

afterEach(() => cleanup());

const IDENTITY: AscendantIdentityView = {
  divineName: 'Vess of the Long Dark',
  mortalName: 'Vess',
  archetypeTitle: 'The Unblinking',
  epithet: null,
  portraitSrc: null,
  primarySphere: 'mind',
  secondarySphere: 'spirit',
};
const QUINTESSENCE: QuintessenceView = { ratio: 0.72, band: 'healthy', lexiconWord: 'Resonant' };

function bag(over: Partial<GodRailBag['vm']> = {}): GodRailBag {
  return {
    vm: { ...emptyGodRail(), ...over },
    gameState: {} as GameState,
    shown: () => true,
    newly: () => false,
    handRest: null,
    onOpenSheet: vi.fn(),
    onOpenMandate: vi.fn(),
  };
}

const ROW: EssenceRowView = {
  sphere: 'mind', level: 42, trend: 'steady', isPrimary: true, isSecondary: false, isElder: false, hoverDesc: 'Steady.',
} as EssenceRowView;

function agent(name: string): ThreadedNode {
  return {
    id: 'agent-1', name, tier: 2, tierName: 'Devoted', category: 'agent', threadEdgeId: 't1',
    attentionMode: 'auto_resolve', courtPosition: null, threadStrength: 1, locationId: 'loc-1',
    locationName: 'Thornwall', activityLabel: 'Idling', portraitUrl: null, primaryDomain: 'iron',
    factionName: 'Iron Brotherhood', championEffectId: null, championTemplateId: null,
  } as ThreadedNode;
}

function ledgerVm(): Pick<LedgerRailVM, 'worldSoul' | 'now' | 'years' | 'ledger'> {
  return { worldSoul: null, now: { entryIds: [], emptyLine: null }, years: [], ledger: { rows: [], unread: 0 } } as unknown as Pick<LedgerRailVM, 'worldSoul' | 'now' | 'years' | 'ledger'>;
}

describe('THR-2125 R1 — the god rail', () => {
  it('(a) the essence balance is --text-sm with tabular figures', () => {
    render(<EssenceBlock rows={[ROW]} />);
    const el = screen.getByTestId('essence-balance-mind');
    expect(el.style.fontSize).toBe('var(--text-sm)');
    expect(el.style.fontVariantNumeric).toBe('tabular-nums');
    expect(el.style.textAlign).toBe('right');
  });

  it('(b) "Your First is" with no colon, and "Your primary sphere is Mind."', () => {
    const Identity = GOD_RAIL_COMPONENTS.identity;
    const Essence = GOD_RAIL_COMPONENTS.essence;
    render(
      <>
        {Identity(bag({ identity: { view: IDENTITY, quintessence: QUINTESSENCE, first: { id: 'a1', name: 'Kael Thornweaver', visual: null } } as GodRailBag['vm']['identity'] }))}
        {Essence(bag({ essence: { rows: [ROW], primary: 'mind', seat: null } }))}
      </>,
    );
    const first = screen.getByTestId('god-rail-your-first');
    expect(first.textContent).toMatch(/^Your First is/);
    expect(first.textContent).not.toContain(':');
    expect(first.style.paddingLeft).toBe('');
    expect(screen.getByTestId('god-rail-primary').textContent).toBe('Your primary sphere is Mind.');
  });

  it('draws no primary line without a primary sphere (fail-soft)', () => {
    render(<>{GOD_RAIL_COMPONENTS.essence(bag())}</>);
    expect(screen.queryByTestId('god-rail-primary')).toBeNull();
  });
});

describe('THR-2125 R2 — the Ledger rail', () => {
  it('(c) the thread row name is Text 700, sentence case, never truncated', () => {
    render(<ThreadsPanel threadedNodes={[agent('Kael Thornweaver')]} selectedNodeId={null} onNodeSelect={() => {}} onCenterOnHex={() => {}} />);
    const name = screen.getByTestId('threads-panel').querySelector('[data-row-name]') as HTMLElement;
    expect(name.textContent).toBe('Kael Thornweaver');
    expect(name.style.fontFamily).toBe('var(--font-body)');
    expect(name.style.fontWeight).toBe('700');
    expect(name.style.fontSize).toBe('var(--text-sm)');
    expect(name.style.textTransform).toBe('');
    expect(name.className).not.toContain('truncate');
  });

  it('(d) the Threads panel has no frame; (e) one rail Title each in Threads and the Chronicle', () => {
    render(<ThreadsPanel threadedNodes={[agent('Kael')]} selectedNodeId={null} onNodeSelect={() => {}} onCenterOnHex={() => {}} />);
    const threads = screen.getByTestId('threads-panel');
    expect(threads.classList.contains('panel')).toBe(false);
    expect(threads.querySelectorAll('[data-rail-title]').length).toBe(1);
    cleanup();
    render(<ChroniclePanel entries={[]} vm={ledgerVm()} />);
    const chronicle = screen.getByTestId('chronicle-panel');
    expect(chronicle.querySelectorAll('[data-rail-title]').length).toBe(1);
    expect(chronicle.style.border).toBe('');
    expect(chronicle.style.background).toBe('');
  });

  it('the empty Threads state uses the same rail Title, unframed', () => {
    render(<ThreadsPanel threadedNodes={[]} selectedNodeId={null} onNodeSelect={() => {}} onCenterOnHex={() => {}} />);
    const empty = screen.getByTestId('threads-panel-empty');
    expect(empty.classList.contains('panel')).toBe(false);
    expect(empty.querySelectorAll('[data-rail-title]').length).toBe(1);
  });

  it('the debug reader reports the Threads row name and a frame depth of at most 2', () => {
    render(<ThreadsPanel threadedNodes={[agent('Kael Thornweaver')]} selectedNodeId={null} onNodeSelect={() => {}} onCenterOnHex={() => {}} />);
    const threads = readListDressing().find((d) => d.surface === 'threads')!;
    expect(threads.rowName?.weight).toBe(700);
    expect(threads.rowName?.clipped).toBe(false);
    expect(threads.frameDepth).toBeLessThanOrEqual(2);
  });
});

describe('THR-2125 R3 — list rows', () => {
  it('(f) ListRow.Title is 700 and never cut', () => {
    render(<ListRow><ListRow.Title>Maren Hale of the Iron Market</ListRow.Title></ListRow>);
    const title = screen.getByText('Maren Hale of the Iron Market');
    expect(title.style.fontWeight).toBe('700');
    expect(title.style.textOverflow).toBe('');
    expect(title.style.whiteSpace).toBe('');
    expect(title.hasAttribute('data-row-name')).toBe(true);
  });
});

describe('THR-2125 R4 — the hover tier', () => {
  it('(g) the tooltip heading is the plain face at 700', () => {
    vi.useFakeTimers();
    try {
      render(<Tooltip label="Mind" desc="The sphere of thought."><span>hover me</span></Tooltip>);
      fireEvent.pointerEnter(screen.getByText('hover me').parentElement ?? screen.getByText('hover me'));
      act(() => { vi.advanceTimersByTime(TOOLTIP_SHOW_DELAY + 50); });
      const heading = document.querySelector('[data-tooltip-heading]') as HTMLElement | null;
      expect(heading).not.toBeNull();
      expect(heading!.style.fontFamily).toBe('var(--font-body)');
      expect(heading!.style.fontWeight).toBe('700');
    } finally {
      vi.useRealTimers();
    }
  });

  function page(over: Partial<DetailPage>): DetailPage {
    return { kindLabel: 'Actor', displayName: 'Maren Hale', subtitle: 'Gatekeeper of the Iron Market', sphere: 'order', sections: [], ...over } as unknown as DetailPage;
  }
  const anchor = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
  };

  it('(h) the name is --text-sm; a highlighted want becomes the Now line, said once', () => {
    const p = page({
      sections: [{ typeId: 'prose', label: 'Wants', prose: 'She wants the old debt paid.', highlight: { icon: 'mandate', headline: 'Seek Revenge' } }] as unknown as DetailPage['sections'],
    });
    render(<HoverCard page={p} anchorEl={anchor()} visual={null} />);
    const card = screen.getByTestId('hover-card');
    const name = card.querySelector('[data-row-name]') as HTMLElement;
    expect(name.style.fontSize).toBe('var(--text-sm)');
    const now = card.querySelector('[data-hover-now]') as HTMLElement;
    expect(now.textContent).toBe('Seek Revenge');
    expect(now.style.fontWeight).toBe('400');
    expect(card.querySelector('[data-highlight]')).toBeNull();
    expect(card.textContent?.match(/Seek Revenge/g)?.length).toBe(1);
    expect(card.querySelector('[data-hover-kind]')!.textContent).toBe('Actor · Gatekeeper of the Iron Market');
  });

  it('no Now line without a highlight, or when the headline is the subject\'s own name (a faction)', () => {
    const { unmount } = render(<HoverCard page={page({})} anchorEl={anchor()} visual={null} />);
    expect(document.querySelector('[data-hover-now]')).toBeNull();
    unmount();
    const faction = page({
      kindLabel: 'Faction', displayName: 'The Iron Brotherhood', subtitle: '',
      sections: [{ typeId: 'prose', label: 'How they hold her', prose: 'They have not yet noticed her.', highlight: { icon: 'mandate', headline: 'The Iron Brotherhood' } }] as unknown as DetailPage['sections'],
    });
    expect(hoverNow(faction)).toBeNull();
    render(<HoverCard page={faction} anchorEl={anchor()} visual={null} />);
    expect(document.querySelector('[data-hover-now]')).toBeNull();
    // An empty subtitle draws the kind alone, no trailing separator.
    expect(document.querySelector('[data-hover-kind]')!.textContent).toBe('Faction');
  });
});
