// @vitest-environment jsdom
/**
 * THR-1724 — Christian's 2026-10-04 encounter-screen layout pass: the pieces
 * that are not pinned by the veil, header-merge and nudge-stage suites.
 *
 * - `ReachStanding`, the character sheet's reach readout as a shared primitive
 *   (the encounter title row and `DomainCard` draw the same thing).
 * - The time control names what holds the clock ("paused · <encounter>"),
 *   which is how Law 52 is satisfied now that the veil says nothing itself.
 * - Playable cards carry the hover/focus light; dimmed and disabled ones do not.
 * - The hand wraps into rows of at most `CARDS_PER_ROW`, not one scrolling row.
 * - The card picture band is 16:9 at the card's width (Law 5, amended).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ReachStanding } from '../../shared/ReachStanding';
import { DomainCard } from '../../shared/DomainCard';
import { SimulationControls } from '../SimulationControls';
import { CARD_PICTURE_BAND_PX, CARD_WIDTH_PX } from '../../shared/CardFace';
import { CARDS_PER_ROW, NudgeCard } from '../encounter-stage/shells/NudgePhaseShell';
import type { NudgeHandCard } from '../encounter-stage/useNudgeHand';
import { DOMAIN_WORD_SCALES } from '../../../data/domain-words';

afterEach(cleanup);

const CARD: NudgeHandCard = {
  id: 'nudge.steady_hand',
  libraryCardId: 'card.boost',
  keyword: 'Boost',
  keywordIcon: '◆',
  name: 'Steady The Hand',
  effectLine: 'His grip stops shaking.',
  essenceCost: 2,
  sphere: 'force',
  state: 'playable',
  forecastDelta: 0.08,
  selected: false,
  interactive: true,
};

describe('ReachStanding — the sheet readout as a primitive', () => {
  it('draws reach name, rank word and five magnitude dots, inline', () => {
    render(<ReachStanding reach="stone" tier={2} layout="inline" data-testid="rs" />);
    const el = screen.getByTestId('rs');
    expect(el.textContent).toContain('Stone');
    expect(el.textContent).toContain(DOMAIN_WORD_SCALES.stone[2]);
    expect(el.getAttribute('data-reach-tier')).toBe('2');
    expect(el.style.flexDirection).toBe('row');
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Stone magnitude 3 of 5');
  });

  it('clamps the tier and hides word and dots when unrevealed (fail-soft)', () => {
    render(<ReachStanding reach="iron" tier={99} revealed={false} data-testid="rs" />);
    const el = screen.getByTestId('rs');
    expect(el.getAttribute('data-reach-tier')).toBe('4');
    expect(el.textContent).toContain('???');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('is what DomainCard draws, so the sheet and the encounter read alike', () => {
    render(<DomainCard reach="eye" tier={1} agentName="Vara" revealed />);
    expect(document.querySelector('[data-reach="eye"][data-reach-tier="1"]')).toBeTruthy();
  });
});

describe('the time control names an encounter auto-pause (Law 52, amended)', () => {
  it('reads "paused · <encounter>" while an encounter holds the clock', () => {
    render(
      <SimulationControls
        season="spring" year={1} running={false} speed={1}
        onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
        compact held heldBy="The Unsafe Bridge"
      />,
    );
    expect(document.body.textContent).toContain('paused · The Unsafe Bridge');
  });

  it('keeps the generic held wording when nothing names the hold', () => {
    render(
      <SimulationControls
        season="spring" year={1} running={false} speed={1}
        onToggle={vi.fn()} onStep={vi.fn()} onSpeedChange={vi.fn()}
        compact held
      />,
    );
    expect(document.body.textContent).toContain('held · stays paused');
  });
});

describe('the hand (Laws 5, 23, 25, 33 as amended)', () => {
  it('lights playable cards and leaves dimmed ones dark', () => {
    const { container, rerender } = render(<NudgeCard card={CARD} designerView={false} onToggle={() => {}} />);
    expect(container.firstElementChild!.classList.contains('card-face--playable')).toBe(true);
    rerender(
      <NudgeCard
        card={{ ...CARD, state: 'dimmed', blockedCode: 'essence_unavailable', blockedReason: 'Not enough essence' }}
        designerView={false}
        onToggle={() => {}}
      />,
    );
    expect(container.firstElementChild!.classList.contains('card-face--playable')).toBe(false);
    // Law 25 — the dimmed card shows its reason instead.
    expect(container.textContent).toContain('Not enough essence');
  });

  it('draws the picture band at 16:9 of the card width', () => {
    expect(CARD_PICTURE_BAND_PX).toBe(Math.round((CARD_WIDTH_PX * 9) / 16));
    const { container } = render(<NudgeCard card={CARD} designerView={false} onToggle={() => {}} />);
    const band = container.querySelector('[data-testid="nudge-card-art-nudge.steady_hand"]') as HTMLElement;
    expect(band.style.aspectRatio).toBe('16 / 9');
    expect(band.style.height).toBe(`${CARD_PICTURE_BAND_PX}px`);
  });

  it('caps a row at four cards', () => {
    expect(CARDS_PER_ROW).toBe(4);
  });
});
