/**
 * @vitest-environment jsdom
 *
 * THR-1986 (plan `2026-10-18-thr-1980-words-teach-themselves.md` U6) — first-use
 * captions: at most two at once in table order, dismissed by a tooltip hover, a
 * press inside the panel or "got it", and remembered across a reload (Law 51).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { FirstUseCaption, FirstUseCaptionZone, isOverCaptionGround } from '../FirstUseCaption';
import {
  getFirstUseCaptionSnapshot,
  resetFirstUseCaptions,
  dismissFirstUseCaption,
} from '../firstUseCaptionStore';
import {
  FIRST_USE_CAPTIONS,
  FIRST_USE_CAPTIONS_MAX_VISIBLE,
  FIRST_USE_CAPTION_STORE_PREFIX,
  getFirstUseCaptionText,
} from '../../../data/first-use-captions';

afterEach(() => {
  cleanup();
  act(() => resetFirstUseCaptions());
});

describe('first-use caption content', () => {
  it('every caption is ≤ 15 words and carries no guessed pronoun', () => {
    for (const c of FIRST_USE_CAPTIONS) {
      expect(c.text.split(/\s+/).length, c.id).toBeLessThanOrEqual(15);
      expect(c.text, c.id).not.toMatch(/\b(she|her|he|his|him)\b/i);
    }
  });

  it('names the mortal at render, or falls back without a raw token', () => {
    expect(getFirstUseCaptionText('asks_you', 'Elara')).toBe("Elara's chapters keep happening either way. This only decides if they pause the world.");
    expect(getFirstUseCaptionText('asks_you')).not.toContain('{name}');
    expect(getFirstUseCaptionText('nope')).toBeNull();
  });
});

describe('FirstUseCaption', () => {
  it('after the bond, essence and threads show; a third waits for a slot', () => {
    render(
      <>
        <FirstUseCaption id="essence" />
        <FirstUseCaption id="threads" />
        <FirstUseCaption id="reaches" />
      </>,
    );
    expect(FIRST_USE_CAPTIONS_MAX_VISIBLE).toBe(2);
    const snap = getFirstUseCaptionSnapshot();
    expect(snap.visible).toEqual(['essence', 'threads']);
    expect(snap.queued).toEqual(['reaches']);
    expect(screen.getByTestId('first-use-caption-essence')).toBeTruthy();
    expect(screen.queryByTestId('first-use-caption-reaches')).toBeNull();
  });

  it('a caption for a panel not on screen never shows', () => {
    render(<FirstUseCaption id="essence" />);
    expect(getFirstUseCaptionSnapshot().visible).toEqual(['essence']);
  });

  it('hovering a tooltip inside the panel dismisses it, and the next caption takes the slot', () => {
    render(
      <>
        <FirstUseCaptionZone id="essence">
          <span data-tooltip-trigger="" data-testid="row">Life 50</span>
          <FirstUseCaption id="essence" />
        </FirstUseCaptionZone>
        <FirstUseCaption id="threads" />
        <FirstUseCaption id="reaches" />
      </>,
    );
    fireEvent.pointerOver(screen.getByTestId('row'));
    expect(screen.queryByTestId('first-use-caption-essence')).toBeNull();
    expect(getFirstUseCaptionSnapshot().visible).toEqual(['threads', 'reaches']);
    expect(localStorage.getItem(FIRST_USE_CAPTION_STORE_PREFIX + 'essence')).toBe('1');
  });

  it('"got it" dismisses; a press inside the panel dismisses', () => {
    render(
      <>
        <FirstUseCaption id="essence" />
        <FirstUseCaptionZone id="threads">
          <button type="button" data-testid="inside">x</button>
          <FirstUseCaption id="threads" />
        </FirstUseCaptionZone>
      </>,
    );
    fireEvent.click(screen.getByTestId('first-use-caption-essence-dismiss'));
    expect(screen.queryByTestId('first-use-caption-essence')).toBeNull();
    fireEvent.pointerDown(screen.getByTestId('inside'));
    expect(screen.queryByTestId('first-use-caption-threads')).toBeNull();
  });

  it('"got it" on a caption nested in another panel dismisses only that caption', () => {
    render(
      <FirstUseCaptionZone id="threads">
        <FirstUseCaption id="threads" />
        <FirstUseCaption id="asks_you" name="Elara" />
      </FirstUseCaptionZone>,
    );
    const inner = screen.getByTestId('first-use-caption-asks_you-dismiss');
    fireEvent.pointerDown(inner);
    fireEvent.click(inner);
    expect(getFirstUseCaptionSnapshot().dismissed).toEqual(['asks_you']);
    expect(screen.getByTestId('first-use-caption-threads')).toBeTruthy();
  });

  // THR-2078 — the Doom hint landed on the Inspector's header once a page opened.
  it('a floating caption yields while a surface covers its spot, and returns when it closes', () => {
    vi.useFakeTimers();
    const doc = document as Document & { elementsFromPoint?: (x: number, y: number) => Element[] };
    const original = doc.elementsFromPoint;
    try {
      const { getByTestId } = render(
        <>
          <div data-first-use-caption-ground="" data-testid="map" />
          <div data-testid="inspector" />
          <div style={{ position: 'relative' }}><FirstUseCaption id="doom" floating /></div>
        </>,
      );
      let under: Element = getByTestId('inspector');
      doc.elementsFromPoint = () => [under];
      act(() => { vi.advanceTimersByTime(500); });
      expect(screen.queryByTestId('first-use-caption-doom')).toBeNull();
      // Still visible in the store: hidden, not dismissed.
      expect(getFirstUseCaptionSnapshot().visible).toContain('doom');

      under = getByTestId('map');
      act(() => { vi.advanceTimersByTime(500); });
      expect(screen.getByTestId('first-use-caption-doom')).toBeTruthy();

      expect(isOverCaptionGround({ top: 0, left: 0 })).toBe(true);
      under = getByTestId('inspector');
      expect(isOverCaptionGround({ top: 0, left: 0 })).toBe(false);
    } finally {
      doc.elementsFromPoint = original;
      vi.useRealTimers();
    }
  });

  it('a dismissal survives a reload (fresh store module, same localStorage)', async () => {
    act(() => dismissFirstUseCaption('essence'));
    vi.resetModules();
    const fresh = await import('../firstUseCaptionStore');
    const unmount = fresh.mountFirstUseCaption('essence');
    expect(fresh.getFirstUseCaptionSnapshot().dismissed).toContain('essence');
    expect(fresh.getFirstUseCaptionSnapshot().visible).not.toContain('essence');
    unmount();
  });
});
