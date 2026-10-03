// @vitest-environment jsdom
/**
 * Unit tests for the central interrupt auto-pause hook (THR-668), with the
 * Stellaris resume policy (THR-1608): time returns to the state it was in.
 *
 * Supersedes encounterAutoPause.test.ts, which tested an inline replica of the
 * per-modal pattern this hook replaces. These tests exercise the REAL hook.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useInterruptAutoPause } from '../hooks/useInterruptAutoPause';

/** Harness: two independent interrupt surfaces ORed into one interruptOpen flag. */
function useHarness(initialRunning: boolean) {
  const [running, setRunning] = useState(initialRunning);
  const [modalA, setModalA] = useState(false);
  const [modalB, setModalB] = useState(false);

  const handle = useInterruptAutoPause({
    interruptOpen: modalA || modalB,
    running,
    setRunning,
  });

  return { running, setRunning, modalA, setModalA, modalB, setModalB, handle };
}

describe('useInterruptAutoPause', () => {
  it('pauses when an interrupt opens while running', () => {
    const { result } = renderHook(() => useHarness(true));
    expect(result.current.running).toBe(true);

    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);
  });

  it('running resumes: the clock runs on when the interrupt closes', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);

    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);
  });

  it('paused stays paused: a player who paused before the interrupt is still paused after', () => {
    const { result } = renderHook(() => useHarness(false));

    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);

    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });

  it('does not resume while a second interrupt is still open (stacked modals)', () => {
    const { result } = renderHook(() => useHarness(true));

    act(() => result.current.setModalA(true));
    act(() => result.current.setModalB(true));
    expect(result.current.running).toBe(false);

    // Close A — B is still open, so the sim must stay paused.
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);

    // Close B — now everything is closed, restore the running clock.
    act(() => result.current.setModalB(false));
    expect(result.current.running).toBe(true);
  });

  it('re-pauses if something resumes the sim while an interrupt is open', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);

    // A per-modal close handler (or stale code path) resumes behind our back.
    act(() => result.current.setRunning(true));
    expect(result.current.running).toBe(false);
  });

  it('a resume behind the modal does not rewrite a manual pause (no side channel)', () => {
    // THR-1608: the old forceResumeRef path turned a player's pause into a
    // running world after an encounter. Resume-to-prior has no such channel.
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.setModalA(true));
    act(() => result.current.setRunning(true)); // stale "always resume" path
    expect(result.current.running).toBe(false);

    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });

  it('reports the recorded clock state while open, and null when closed', () => {
    const { result } = renderHook(() => useHarness(true));
    expect(result.current.handle.getWasRunningBeforeInterrupt()).toBeNull();

    act(() => result.current.setModalA(true));
    expect(result.current.handle.getWasRunningBeforeInterrupt()).toBe(true);

    act(() => result.current.setModalA(false));
    expect(result.current.handle.getWasRunningBeforeInterrupt()).toBeNull();

    act(() => result.current.setRunning(false));
    act(() => result.current.setModalB(true));
    expect(result.current.handle.getWasRunningBeforeInterrupt()).toBe(false);
  });

  it('handles rapid open/close cycles without stale recorded state', () => {
    const { result } = renderHook(() => useHarness(true));

    act(() => result.current.setModalA(true));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);

    // Manually pause, then open/close again — must stay paused.
    act(() => result.current.setRunning(false));
    act(() => result.current.setModalA(true));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);

    // Resume manually, then open/close — must run on.
    act(() => result.current.setRunning(true));
    act(() => result.current.setModalB(true));
    act(() => result.current.setModalB(false));
    expect(result.current.running).toBe(true);
  });
});

describe('useInterruptAutoPause — a toggle pressed inside an interrupt (THR-1711)', () => {
  /**
   * The hotkey/play-button wiring as GameView composes it: toggle the saved
   * state if an interrupt holds the clock, else flip `running`.
   */
  function toggle(h: ReturnType<typeof useHarness>) {
    if (!h.handle.toggleIfHeld()) h.setRunning(r => !r);
  }

  it('a pause pressed inside a popup survives the close', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    act(() => toggle(result.current)); // the player presses Space to pause
    expect(result.current.running).toBe(false);
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });

  it('FALSIFICATION — flipping `running` directly (the old wiring) is undone on close', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    act(() => result.current.setRunning(r => !r));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);
  });

  it('a play pressed inside a popup over a paused world resumes on close', () => {
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.setModalA(true));
    act(() => toggle(result.current));
    expect(result.current.running).toBe(false); // still held while open
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);
  });

  it('the arrival auto-pause inside a popup also survives the close', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    act(() => {
      if (!result.current.handle.pauseIfHeld()) result.current.setRunning(false);
    });
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });

  it('with no interrupt open, the routing declines and the caller toggles as usual', () => {
    const { result } = renderHook(() => useHarness(true));
    expect(result.current.handle.toggleIfHeld()).toBe(false);
    expect(result.current.handle.pauseIfHeld()).toBe(false);
    act(() => toggle(result.current));
    expect(result.current.running).toBe(false);
  });

  it('the plain sequence pause → open → close is unchanged', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => toggle(result.current));
    act(() => result.current.setModalA(true));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });
});

describe('useInterruptAutoPause — the held state is visible (THR-1711 review)', () => {
  it('exposes the state the clock returns to, and tracks a toggle inside the popup', () => {
    const { result } = renderHook(() => useHarness(true));
    expect(result.current.handle.heldRunning).toBeNull();
    act(() => result.current.setModalA(true));
    // The live clock is frozen, but the control must show "running" — a press pauses.
    expect(result.current.running).toBe(false);
    expect(result.current.handle.heldRunning).toBe(true);
    act(() => { result.current.handle.toggleIfHeld(); });
    expect(result.current.handle.heldRunning).toBe(false);
    act(() => result.current.setModalA(false));
    expect(result.current.handle.heldRunning).toBeNull();
    expect(result.current.running).toBe(false);
  });
});
