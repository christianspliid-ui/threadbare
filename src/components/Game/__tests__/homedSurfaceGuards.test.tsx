// @vitest-environment jsdom
/**
 * THR-1877 — two guards the home list needs on screen:
 * - a receipt toast clicked while a moment holds the foreground shakes, says
 *   "Opens when this chapter closes." and opens nothing (plan § D7);
 * - `HomedSurfaceFallback`'s Continue sets the kind down, so the clock can resume (§ D1).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastStack } from '../ToastStack';
import { HomedSurfaceFallback, resetHomedSurfaceFallbackWarnings } from '../hosts/HomedSurfaceFallback';
import { resolveInterrupts, type InterruptSnapshot } from '../interruptRegistry';
import type { ToastItem } from '../../../types/notification';

const receiptToast: ToastItem = {
  id: 'toast.receipt',
  message: 'Your blessing answered',
  count: 1,
  createdTick: 1,
  expiresAt: Date.now() + 10_000,
  navigationTarget: { kind: 'receipt', receiptId: 'receipt.1' },
};

describe('a receipt toast while a moment holds the foreground (D7)', () => {
  it('shakes, shows "Opens when this chapter closes." and opens nothing', () => {
    const onNavigate = vi.fn();
    const onDismiss = vi.fn();
    render(<ToastStack toasts={[receiptToast]} onDismiss={onDismiss} onNavigate={onNavigate} receiptOpenLocked />);
    fireEvent.click(screen.getByRole('status'));
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByTestId('toast-receipt-locked').textContent).toBe('Opens when this chapter closes.');
    expect(screen.getByRole('status').className).toContain('anim-shake-no');
    expect(screen.getByRole('status').getAttribute('aria-label')).toContain('Opens when this chapter closes.');
  });

  it('opens the receipt as before when nothing holds the foreground', () => {
    const onNavigate = vi.fn();
    render(<ToastStack toasts={[receiptToast]} onDismiss={vi.fn()} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('status'));
    expect(onNavigate).toHaveBeenCalledWith({ kind: 'receipt', receiptId: 'receipt.1' });
    expect(screen.queryByTestId('toast-receipt-locked')).toBeNull();
  });

  it('guards only receipts: other toasts still navigate', () => {
    const onNavigate = vi.fn();
    const hexToast: ToastItem = { ...receiptToast, id: 'toast.hex', navigationTarget: { kind: 'hex', col: 3, row: 4 } };
    render(<ToastStack toasts={[hexToast]} onDismiss={vi.fn()} onNavigate={onNavigate} receiptOpenLocked />);
    fireEvent.click(screen.getByRole('status'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe('HomedSurfaceFallback (D1)', () => {
  beforeEach(() => resetHomedSurfaceFallbackWarnings());

  it("names the moment by its holder words and its Continue lets the clock resume", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const skipped: string[] = [];
    const onFallback = vi.fn();
    render(<HomedSurfaceFallback kind="story-beat" onContinue={k => skipped.push(k)} onFallback={onFallback} />);
    expect(screen.getByText('A story beat')).toBeTruthy();
    expect(screen.getByTestId('homed-surface-fallback').textContent).toBe('This moment has no screen yet.');
    expect(onFallback).toHaveBeenCalledWith('story-beat');
    expect(warn).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('homed-surface-fallback-continue'));
    expect(skipped).toEqual(['story-beat']);

    // The host feeds the set-down kind back through the snapshot: the clock is free.
    const base: InterruptSnapshot = {
      interruptsSuppressed: false, encounterOpen: false, meetingPending: false, hasAscendantIdentity: true,
      premonitionPending: false, vignettePending: false, storyBeatPending: true, ascendantBeatEntered: false,
      choiceSetPending: false, emergenceDecisionPending: false, divineReceiptPending: false,
      momentPending: false, chapterLedgerOpen: false, courtOpen: false, popupQueued: false,
    };
    expect(resolveInterrupts(base).anyOpen).toBe(true);
    expect(resolveInterrupts({ ...base, skippedKinds: ['story-beat'] }).anyOpen).toBe(false);
    warn.mockRestore();
  });
});
