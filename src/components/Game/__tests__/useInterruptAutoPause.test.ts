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
