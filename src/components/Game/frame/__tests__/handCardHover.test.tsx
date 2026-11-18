// @vitest-environment jsdom
/**
 * THR-1975 — a hand row's full card face on hover (frame plan § F6).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HandSection } from '../HandSection';
import { handCardFaceModel, HAND_CARD_FACE_TEST_ID } from '../handCardFace';
import { handCardHoverPosition, HAND_CARD_HOVER_GAP_PX, HAND_CARD_HOVER_MARGIN_PX } from '../HandCardHover';
import { getUnifiedTemplateById } from '../../../../data/unified-action-templates';
import { CARD_WIDTH_PX } from '../../../shared/CardFace';
import type { GodRailHand, HandCardVM } from '../../../../engine/views/godRail';

const ID = 'divine.inspire';

function card(over: Partial<HandCardVM> = {}): HandCardVM {
  return {
    id: ID, name: 'Inspire', description: 'Kindle a mortal.', paySphere: 'mind', paySphereWord: 'Mind',
    parPriceLabel: '2 essence', parCost: 2, line2: 'Mind · 2 essence', priceTooltip: 'par',
    payable: true, reason: null, codexEntryId: ID, ...over,
  };
}

const hand = (c: HandCardVM): GodRailHand => ({ coreVerbs: ['move'], cards: [c], sphereOrder: [c.paySphere] });

afterEach(cleanup);

describe('handCardFaceModel — a target-free face', () => {
  const template = getUnifiedTemplateById(ID)!;

  it('the template exists (fixture guard)', () => {
    expect(template).toBeTruthy();
  });

  it('carries the row\'s name, par price and paying sphere tint, and no odds', () => {
    const m = handCardFaceModel(card(), template);
    expect(m.name).toBe('Inspire');
    expect(m.cost).toBe(2);
    expect(m.sphereTint).toBe('mind');
    expect(m.costSphere).toBe('mind');
    expect(m.odds).toBeNull();
    expect(m.dimmed).toBe(false);
    expect(m.disabled).toBe(false);
    expect(m.effectLine.length).toBeGreaterThan(0);
    expect(m.testIdPrefix).toBe(HAND_CARD_FACE_TEST_ID);
  });

  it('an unpayable card dims and says why', () => {
    const m = handCardFaceModel(card({ payable: false, reason: 'Not enough Mind essence' }), template);
    expect(m.dimmed).toBe(true);
    expect(m.blockedReason).toBe('Not enough Mind essence');
  });

  it('a free card draws no tint and no price sphere', () => {
    const m = handCardFaceModel(card({ parCost: 0 }), template);
    expect(m.cost).toBe(0);
    expect(m.sphereTint).toBeUndefined();
  });
});

describe('handCardHoverPosition — beside the rail, on screen', () => {
  const vp = { width: 1920, height: 1080 };

  it('sits right of the rail, level with the row', () => {
    expect(handCardHoverPosition({ top: 400 }, { left: 0, right: 320 }, vp, 300)).toEqual({ top: 400, left: 320 + HAND_CARD_HOVER_GAP_PX });
  });

  it('flips to the rail\'s left when the right has no room', () => {
    const pos = handCardHoverPosition({ top: 400 }, { left: 1600, right: 1920 }, vp, 300);
    expect(pos.left).toBe(1600 - HAND_CARD_HOVER_GAP_PX - CARD_WIDTH_PX);
  });

  it('pulls up so the bottom stays on screen, and never above the margin', () => {
    expect(handCardHoverPosition({ top: 1000 }, { left: 0, right: 320 }, vp, 300).top).toBe(1080 - HAND_CARD_HOVER_MARGIN_PX - 300);
    expect(handCardHoverPosition({ top: 1000 }, { left: 0, right: 320 }, vp, 5000).top).toBe(HAND_CARD_HOVER_MARGIN_PX);
  });
});

describe('the hand row hover', () => {
  it('hovering opens the full face; leaving closes it', () => {
    render(<HandSection hand={hand(card())} showInvestiture={false} rest={null} />);
    const row = screen.getByTestId('hand-card');
    expect(screen.queryByTestId('hand-card-hover')).toBeNull();
    fireEvent.mouseEnter(row);
    const hover = screen.getByTestId('hand-card-hover');
    expect(hover.dataset.cardId).toBe(ID);
    expect(hover.hasAttribute('inert')).toBe(true);
    expect(hover.style.pointerEvents).toBe('none');
    expect(hover.textContent).toContain('Inspire');
    expect(hover.querySelector(`[data-testid^="${HAND_CARD_FACE_TEST_ID}-art-"]`)).not.toBeNull();
    expect(row.dataset.hoverOpen).toBe('true');
    fireEvent.mouseLeave(row);
    expect(screen.queryByTestId('hand-card-hover')).toBeNull();
  });

  it('Esc closes it', () => {
    render(<HandSection hand={hand(card())} showInvestiture={false} rest={null} />);
    fireEvent.mouseEnter(screen.getByTestId('hand-card'));
    expect(screen.getByTestId('hand-card-hover')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('hand-card-hover')).toBeNull();
  });

  it('one surface at a time: the name carries no tooltip, and the face stands down over the price', () => {
    render(<HandSection hand={hand(card())} showInvestiture={false} rest={null} />);
    const row = screen.getByTestId('hand-card');
    const name = screen.getByTestId('hand-card-name');
    expect(name.querySelector('[data-tooltip-id], [aria-describedby]')).toBeNull();
    fireEvent.mouseEnter(row);
    fireEvent.mouseEnter(screen.getByTestId('hand-card-price'));
    expect(screen.queryByTestId('hand-card-hover')).toBeNull();
    // The pointer moves from the price back onto the name: it leaves the price, not the row.
    fireEvent.mouseOut(screen.getByTestId('hand-card-price'), { relatedTarget: name });
    expect(screen.getByTestId('hand-card-hover')).toBeTruthy();
  });

  it('a row with no template opens nothing (fail-soft)', () => {
    render(<HandSection hand={hand(card({ id: 'no.such.card' }))} showInvestiture={false} rest={null} />);
    fireEvent.mouseEnter(screen.getByTestId('hand-card'));
    expect(screen.queryByTestId('hand-card-hover')).toBeNull();
  });
});
