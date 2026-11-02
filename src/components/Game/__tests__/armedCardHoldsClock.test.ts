// @vitest-environment jsdom
/**
 * THR-2141 — an armed card holds the clock. Cold playtest round 6: tokens kept walking
 * while the player aimed, so the target slid out from under the cursor. Arming now holds
 * time through the same Stellaris hold as an interrupt, and disarming returns the clock
 * to the state it was in.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { clockHoldOpen, useInterruptAutoPause } from '../hooks/useInterruptAutoPause';

/** Harness: GameView's hold inputs, with the armed card as one of them. */
function useHarness(initialRunning: boolean) {
  const [running, setRunning] = useState(initialRunning);
  const [cardArmed, setCardArmed] = useState(false);
  const [interruptOpen, setInterruptOpen] = useState(false);
  const handle = useInterruptAutoPause({
    interruptOpen: clockHoldOpen({ interruptOpen, inspectorFullOpen: false, cardArmed }),
    running,
    setRunning,
  });
  return { running, setCardArmed, setInterruptOpen, handle };
}

describe('an armed card holds the clock (THR-2141)', () => {
  it('counts an armed card as a hold, alone', () => {
    expect(clockHoldOpen({ interruptOpen: false, inspectorFullOpen: false, cardArmed: true })).toBe(true);
    expect(clockHoldOpen({ interruptOpen: false, inspectorFullOpen: false, cardArmed: false })).toBe(false);
  });

  it('arming stops a running clock and disarming runs it again', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setCardArmed(true));
    expect(result.current.running).toBe(false);
    expect(result.current.handle.heldRunning).toBe(true);

    act(() => result.current.setCardArmed(false));
    expect(result.current.running).toBe(true);
    expect(result.current.handle.heldRunning).toBeNull();
  });

  it('a paused world stays paused after the card is put down', () => {
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.setCardArmed(true));
    act(() => result.current.setCardArmed(false));
    expect(result.current.running).toBe(false);
  });

  it('a cast that opens an interrupt keeps the clock held until that interrupt closes', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setCardArmed(true));
    // The cast lands: the card disarms as the scene it opened takes the screen.
    act(() => {
      result.current.setInterruptOpen(true);
      result.current.setCardArmed(false);
    });
    expect(result.current.running).toBe(false);

    act(() => result.current.setInterruptOpen(false));
    expect(result.current.running).toBe(true);
  });
});
