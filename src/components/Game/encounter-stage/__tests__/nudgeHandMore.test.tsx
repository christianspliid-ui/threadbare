// @vitest-environment jsdom
/**
 * "N more cards below" — THR-1942.
 *
 * A hand of five to eight cards wraps to two rows and scrolls under the stuck
 * hand bar. The bar names how many cards sit under it, and clicking the line
 * scrolls the column until the last card clears the bar. jsdom has no layout,
 * so the geometry is stubbed: the pure count against hand-built spans, and the
 * rendered shell against a stubbed column, bar and card rects.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import {
  HAND_MORE_SCROLL_MARGIN_PX,
  HAND_MORE_VISIBLE_FRACTION,
  countCardsBelowBar,
  NudgePhaseShell,
} from '../shells/NudgePhaseShell';
import {
  NUDGE_HAND_MORE_ONE,
  nudgeHandMoreLine,
} from '../../../../data/nudge-stage-content';

// ─── Words ────────────────────────────────────────────────────────

describe('the more-cards line words (THR-1942)', () => {
  it('reads singular for one card', () => {
    expect(nudgeHandMoreLine(1)).toBe(NUDGE_HAND_MORE_ONE);
    expect(nudgeHandMoreLine(1)).toBe('1 more card below');
  });

  it('reads plural with the count for many', () => {
    expect(nudgeHandMoreLine(2)).toBe('2 more cards below');
    expect(nudgeHandMoreLine(4)).toBe('4 more cards below');
  });
});

// ─── The hidden test ──────────────────────────────────────────────

describe('countCardsBelowBar (THR-1942)', () => {
  const VIEW_TOP = 0;
  const BAR_TOP = 900;

  it('counts nothing when every card is above the bar', () => {
    expect(countCardsBelowBar([{ top: 100, bottom: 400 }, { top: 500, bottom: 850 }], VIEW_TOP, BAR_TOP)).toBe(0);
  });

  it('counts a card wholly under the bar', () => {
    expect(countCardsBelowBar([{ top: 950, bottom: 1300 }], VIEW_TOP, BAR_TOP)).toBe(1);
  });

  it('counts a card cut by the bar when less than the threshold shows', () => {
    // 100 of 350 px visible ≈ 0.29 < 0.6
    expect(countCardsBelowBar([{ top: 800, bottom: 1150 }], VIEW_TOP, BAR_TOP)).toBe(1);
  });

  it('does not count a card cut by the bar when most of it shows', () => {
    // 300 of 350 px visible ≈ 0.86 ≥ 0.6
    expect(countCardsBelowBar([{ top: 600, bottom: 950 }], VIEW_TOP, BAR_TOP)).toBe(0);
  });

  it('does not count a card scrolled off the top', () => {
    expect(countCardsBelowBar([{ top: -400, bottom: -50 }], VIEW_TOP, BAR_TOP)).toBe(0);
  });

  it('skips zero-height cards (no layout)', () => {
    expect(countCardsBelowBar([{ top: 0, bottom: 0 }, { top: 0, bottom: 0 }], VIEW_TOP, BAR_TOP)).toBe(0);
  });

  it('starts the threshold at 0.6', () => {
    expect(HAND_MORE_VISIBLE_FRACTION).toBe(0.6);
  });
});

// ─── The rendered shell ───────────────────────────────────────────

function nudge(i: number): StepNudge {
  return {
    id: `nudge_${i}`,
    name: `Card ${i}`,
    essenceCost: 0,
    forecastDelta: 0.02,
    effectLine: `Effect ${i}.`,
  };
}

function buildPhase(count: number) {
  const step: ActionStep = {
    reach: 'iron',
    duration: { min: 1, max: 2 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate: 'The vault door has not moved in a hundred years.',
    nudges: Array.from({ length: count }, (_, i) => nudge(i)),
  };
  const template: UnifiedActionTemplate = {
    id: 'test.hand_more',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Darkhollow Vault',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    steps: [step],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'x', success: 'y', failure: 'z' },
  };
  const action: UnifiedAction = {
    actionId: 'ua_hand_more',
    actorId: 'agent.thief',
    templateId: 'test.hand_more',
    targetId: 'loc.vault',
    scale: 'local',
    source: 'agent',
    startTick: 3,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.thief', type: 'actor', name: 'Sera Vance', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.vault', type: 'location', name: 'Darkhollow Vault', properties: {} });
  return buildNudgePhaseModel({
    template,
    activeAction: action,
    step,
    graph,
    gameState: {
      essencePool: { force: 3 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as unknown as GameState,
    allowEmptyHand: true,
  })!;
}

/** Card geometry: four per row, 368 px tall, rows at 575 and 955 — the ticket's measurement. */
const CARD_H = 368;
const ROW_TOPS = [575, 955];
const COLUMN_TOP = 0;
const BAR_TOP = 964;

let scrollOffset = 0;

function rectFor(el: Element): DOMRect {
  const make = (top: number, height: number) =>
    ({ top, bottom: top + height, left: 0, right: 210, width: 210, height, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
  const testId = el.getAttribute('data-testid');
  if (testId === 'hand-column') return make(COLUMN_TOP, 983);
  if (testId === 'nudge-hand-bar') return make(BAR_TOP, 92);
  const row = el.parentElement?.parentElement;
  if (row?.getAttribute('data-testid') === 'nudge-card-row') {
    const index = [...row.children].indexOf(el.parentElement!);
    return make(ROW_TOPS[Math.floor(index / 4)] - scrollOffset, CARD_H);
  }
  return make(0, 0);
}

class StubResizeObserver {
  private cb: () => void;
  constructor(cb: () => void) { this.cb = cb; }
  observe() { this.cb(); }
  disconnect() {}
  unobserve() {}
}

function renderInColumn(count: number) {
  return render(
    <div data-testid="hand-column" style={{ overflowY: 'auto' }}>
      <NudgePhaseShell phase={buildPhase(count)} onCommit={() => {}} />
    </div>,
  );
}

describe('the hand bar names the cards below it (THR-1942)', () => {
  let scrollBy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollOffset = 0;
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return rectFor(this);
    });
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('data-testid') === 'hand-column' ? 1326 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('data-testid') === 'hand-column' ? 983 : 0;
    });
    scrollBy = vi.fn(({ top }: { top: number }) => {
      scrollOffset += top;
      fireEvent.scroll(screen.getByTestId('hand-column'));
    });
    (HTMLElement.prototype as unknown as { scrollBy: unknown }).scrollBy = scrollBy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('a six-card hand names the two cards under the bar', () => {
    renderInColumn(6);
    const line = screen.getByTestId('nudge-hand-more');
    expect(line.tagName).toBe('BUTTON');
    expect(line.textContent).toBe('2 more cards below');
    expect(screen.getByTestId('nudge-hand-bar').getAttribute('data-cards-below')).toBe('2');
  });

  it('a five-card hand reads in the singular', () => {
    renderInColumn(5);
    expect(screen.getByTestId('nudge-hand-more').textContent).toBe('1 more card below');
  });

  it('clicking the line scrolls the last card above the bar, and the line goes', () => {
    renderInColumn(6);
    fireEvent.click(screen.getByTestId('nudge-hand-more'));
    const lastBottom = ROW_TOPS[1] + CARD_H;
    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({ top: lastBottom - BAR_TOP + HAND_MORE_SCROLL_MARGIN_PX }),
    );
    expect(screen.queryByTestId('nudge-hand-more')).toBeNull();
    expect(screen.getByTestId('nudge-hand-bar').getAttribute('data-cards-below')).toBe('0');
  });

  it('a four-card hand never shows the line', () => {
    renderInColumn(4);
    expect(screen.queryByTestId('nudge-hand-more')).toBeNull();
  });

  it('a hand that fits the column never shows the line', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(0);
    renderInColumn(6);
    expect(screen.getByTestId('nudge-hand-bar').getAttribute('data-hand-overflow')).toBe('false');
    expect(screen.queryByTestId('nudge-hand-more')).toBeNull();
  });

  it('the miss line comes before the more-cards line', () => {
    render(
      <div data-testid="hand-column" style={{ overflowY: 'auto' }}>
        <NudgePhaseShell phase={buildPhase(6)} onCommit={() => {}} missLine="A miss would harden her." />
      </div>,
    );
    const bar = screen.getByTestId('nudge-hand-bar');
    const miss = screen.getByTestId('nudge-miss-line');
    const more = screen.getByTestId('nudge-hand-more');
    expect(bar.contains(miss) && bar.contains(more)).toBe(true);
    expect(miss.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
