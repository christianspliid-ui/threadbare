// @vitest-environment jsdom
/**
 * Unit tests for the central interrupt auto-pause hook (THR-668).
 *
 * Supersedes encounterAutoPause.test.ts, which tested an inline replica of the
 * per-modal pattern this hook replaces. These tests exercise the REAL hook.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useRef } from 'react';
import { useInterruptAutoPause } from '../hooks/useInterruptAutoPause';

/** Harness: two independent interrupt surfaces ORed into one interruptOpen flag. */
function useHarness(initialRunning: boolean) {
  const [running, setRunning] = useState(initialRunning);
  const [modalA, setModalA] = useState(false);
  const [modalB, setModalB] = useState(false);
  const forceResumeRef = useRef(false);

  useInterruptAutoPause({
    interruptOpen: modalA || modalB,
    running,
    setRunning,
    forceResumeRef,
  });

  return { running, setRunning, modalA, setModalA, modalB, setModalB, forceResumeRef };
}

describe('useInterruptAutoPause', () => {
  it('pauses when an interrupt opens while running', () => {
    const { result } = renderHook(() => useHarness(true));
    expect(result.current.running).toBe(true);

    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);
  });

  it('resumes when the interrupt closes if the pause was automatic', () => {
    const { result } = renderHook(() => useHarness(true));
    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);

    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);
  });

  it('stays paused after close when the player had paused manually before', () => {
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

    // Close B — now everything is closed, resume.
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

  it('forceResumeRef resumes on all-closed even without an automatic pause', () => {
    // Sim paused manually; an interrupt-opened flow demands resume on close.
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.setModalA(true));
    expect(result.current.running).toBe(false);

    act(() => {
      result.current.forceResumeRef.current = true;
      result.current.setModalA(false);
    });
    expect(result.current.running).toBe(true);
    // Flag is consumed.
    expect(result.current.forceResumeRef.current).toBe(false);
  });

  it('forceResumeRef waits for ALL interrupts to close', () => {
    const { result } = renderHook(() => useHarness(false));
    act(() => result.current.setModalA(true));
    act(() => result.current.setModalB(true));

    act(() => {
      result.current.forceResumeRef.current = true;
      result.current.setModalA(false);
    });
    // B still open — no resume yet, flag pending.
    expect(result.current.running).toBe(false);
    expect(result.current.forceResumeRef.current).toBe(true);

    act(() => result.current.setModalB(false));
    expect(result.current.running).toBe(true);
  });

  it('handles rapid open/close cycles without stale wasRunning state', () => {
    const { result } = renderHook(() => useHarness(true));

    act(() => result.current.setModalA(true));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(true);

    // Manually pause, then open/close again — must stay paused.
    act(() => result.current.setRunning(false));
    act(() => result.current.setModalA(true));
    act(() => result.current.setModalA(false));
    expect(result.current.running).toBe(false);
  });
});
