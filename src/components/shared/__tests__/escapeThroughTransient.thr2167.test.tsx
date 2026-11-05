// @vitest-environment jsdom
/**
 * THR-2167 — Escape and Space do what the player meant (warm playtest round 3).
 *
 * 1. One Escape with an armed card and its tooltip showing disarms the card (the tooltip
 *    is transient; the armed layer reaches through it). A tooltip over a dialog still
 *    closes alone (Law 23 — pinned in Overlay.test.tsx and re-checked here).
 * 2. Escape closes an open hover card (`useRefRouter` registers it).
 * 3. Space on a focused top-bar control activates only that control.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import { Tooltip } from '../Tooltip';
import { Modal } from '../Modal';
import {
  THROUGH_TRANSIENT_ESCAPE_LAYER,
  TRANSIENT_ESCAPE_LAYER,
  getEscapeLayers,
  layersForOneEscape,
  pushEscapeLayer,
  useEscapeLayer,
} from '../useEscapeLayer';
import { Z_BAND } from '../zBands';
import { ARMED_ESCAPE_LABEL } from '../../Game/inspector/useCardArming';
import { useRefRouter, HOVER_CARD_ESCAPE_LABEL } from '../../../hooks/useRefRouter';
import { WorldGraph } from '../../../engine/graph';
import { useTopBarHotkeys } from '../../Game/hooks/useTopBarHotkeys';

const escape = () => fireEvent.keyDown(document, { key: 'Escape' });

afterEach(() => {
  vi.useRealTimers();
});

describe('the escape registry — transient layers (THR-2167)', () => {
  const pops: Array<() => void> = [];
  afterEach(() => { while (pops.length) pops.pop()!(); });

  it('runs a transient layer and the through-transient layer beneath it on one Escape', () => {
    const tooltip = vi.fn();
    const armed = vi.fn();
    const below = vi.fn();
    pops.push(pushEscapeLayer(Z_BAND.mapOverlay, below));
    pops.push(pushEscapeLayer(Z_BAND.modalAboveInterrupt, armed, 'armed', THROUGH_TRANSIENT_ESCAPE_LAYER));
    pops.push(pushEscapeLayer(Z_BAND.tooltip, tooltip, 'tooltip', TRANSIENT_ESCAPE_LAYER));
    expect(layersForOneEscape().map(l => l.label)).toEqual(['tooltip', 'armed']);
    escape();
    expect(tooltip).toHaveBeenCalledOnce();
    expect(armed).toHaveBeenCalledOnce();
    expect(below).not.toHaveBeenCalled();
  });

  it('stops at an ordinary solid layer beneath a transient one (Law 23)', () => {
    const tooltip = vi.fn();
    const modal = vi.fn();
    pops.push(pushEscapeLayer(Z_BAND.modal, modal, 'modal'));
    pops.push(pushEscapeLayer(Z_BAND.tooltip, tooltip, 'tooltip', TRANSIENT_ESCAPE_LAYER));
    escape();
    expect(tooltip).toHaveBeenCalledOnce();
    expect(modal).not.toHaveBeenCalled();
  });

  it('runs a through-transient layer alone when nothing transient is above it', () => {
    const armed = vi.fn();
    const below = vi.fn();
    pops.push(pushEscapeLayer(Z_BAND.mapOverlay, below));
    pops.push(pushEscapeLayer(Z_BAND.modalAboveInterrupt, armed, 'armed', THROUGH_TRANSIENT_ESCAPE_LAYER));
    escape();
    expect(armed).toHaveBeenCalledOnce();
    expect(below).not.toHaveBeenCalled();
  });
});

/** The armed card as `useCardArming` registers it, with the card's own tooltip on it. */
function ArmedCardWithTooltip() {
  const [armed, setArmed] = useState(true);
  useEscapeLayer(armed, () => setArmed(false), Z_BAND.modalAboveInterrupt, ARMED_ESCAPE_LABEL, THROUGH_TRANSIENT_ESCAPE_LAYER);
  return (
    <div>
      <Tooltip label="Kindle" desc="Light a fire in a mortal's heart.">
        <span>Kindle card</span>
      </Tooltip>
      {armed && <div data-testid="armed-banner">Kindle is ready — Esc to put it down</div>}
    </div>
  );
}

describe('an armed card with its tooltip showing (THR-2167 §1)', () => {
  it('one Escape disarms the card and hides the tooltip', async () => {
    vi.useFakeTimers();
    render(<ArmedCardWithTooltip />);
    fireEvent.pointerEnter(screen.getByText('Kindle card'));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(getEscapeLayers().map(l => l.label)).toEqual(['tooltip', ARMED_ESCAPE_LABEL]);

    act(() => { escape(); });
    expect(screen.queryByTestId('armed-banner')).toBeNull();
    expect(getEscapeLayers()).toEqual([]);
  });

  it('a tooltip over a dialog still closes alone', async () => {
    vi.useFakeTimers();
    const modalClose = vi.fn();
    render(
      <Modal open onClose={modalClose} aria-label="Sheet">
        <Modal.Body>
          <Tooltip label="Doom" desc="How near the end is."><span>Doom</span></Tooltip>
        </Modal.Body>
      </Modal>,
    );
    fireEvent.pointerEnter(screen.getByText('Doom'));
    await act(async () => { vi.advanceTimersByTime(1000); });
    act(() => { escape(); });
    expect(modalClose).not.toHaveBeenCalled();
    expect(getEscapeLayers().map(l => l.label)).toEqual(['Sheet']);
  });
});

describe('the hover card (THR-2167 §2)', () => {
  it('Escape closes an open hover card', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'rival', type: 'actor', name: 'The Ashen Rival', properties: { actorType: 'individual' } });
    const { result } = renderHook(() => useRefRouter({
      graph, tick: 1, seed: 42, protagonistId: 'rival', openSheet: () => true, openInspector: () => {},
    }));
    const anchor = document.createElement('span');
    document.body.appendChild(anchor);
    act(() => { result.current.open({ kind: 'agent', id: 'rival' }, 'hover', { anchorEl: anchor }); });
    expect(result.current.hoverCard).not.toBeNull();
    expect(getEscapeLayers().map(l => l.label)).toEqual([HOVER_CARD_ESCAPE_LABEL]);

    act(() => { escape(); });
    expect(result.current.hoverCard).toBeNull();
    expect(getEscapeLayers()).toEqual([]);
    anchor.remove();
  });
});

function TopBar({ onToggle, onDoom }: { onToggle: () => void; onDoom: () => void }) {
  useTopBarHotkeys({ running: false, speed: 1, onToggle, onSpeedChange: () => {}, onStep: () => {} });
  return (
    <div>
      {/* The Doom item's shape in GameViewTopBar: a role=button div with its own Space handler. */}
      <div
        role="button"
        tabIndex={0}
        data-testid="doom"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDoom(); } }}
      >
        Doom
      </div>
      <button type="button" data-testid="lens">Lens</button>
    </div>
  );
}

describe('Space on a focused top-bar control (THR-2167 §3)', () => {
  it('activates only the focused Doom item and leaves the clock alone', () => {
    const onToggle = vi.fn();
    const onDoom = vi.fn();
    render(<TopBar onToggle={onToggle} onDoom={onDoom} />);
    const doom = screen.getByTestId('doom');
    doom.focus();
    fireEvent.keyDown(doom, { key: ' ' });
    expect(onDoom).toHaveBeenCalledOnce();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still runs the clock when Space lands on the page, not a control', () => {
    const onToggle = vi.fn();
    render(<TopBar onToggle={onToggle} onDoom={() => {}} />);
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('gives Space to a keyboard-focused native button, not the clock', () => {
    const onToggle = vi.fn();
    render(<TopBar onToggle={onToggle} onDoom={() => {}} />);
    const lens = screen.getByTestId('lens');
    lens.focus();
    // jsdom's `:focus-visible` support varies; pin keyboard modality for this case.
    const matches = vi.spyOn(lens, 'matches').mockImplementation((sel: string) => sel === ':focus-visible' || Element.prototype.matches.call(lens, sel));
    fireEvent.keyDown(lens, { key: ' ' });
    expect(onToggle).not.toHaveBeenCalled();
    matches.mockRestore();
  });

  it('keeps the old contract for a mouse-focused button: Space runs the clock', () => {
    const onToggle = vi.fn();
    render(<TopBar onToggle={onToggle} onDoom={() => {}} />);
    const lens = screen.getByTestId('lens');
    lens.focus();
    const matches = vi.spyOn(lens, 'matches').mockImplementation((sel: string) => sel !== ':focus-visible' && Element.prototype.matches.call(lens, sel));
    fireEvent.keyDown(lens, { key: ' ' });
    expect(onToggle).toHaveBeenCalledOnce();
    matches.mockRestore();
  });
});
