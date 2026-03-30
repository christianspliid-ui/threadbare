// @vitest-environment jsdom
/**
 * Unit tests for encounter auto-pause/resume logic.
 *
 * These tests verify the behavior of wasRunningBeforeEncounterPause ref
 * and the conditional resume pattern introduced in GameView.tsx (Phase 14-01).
 *
 * Rather than rendering the full GameView component (1300+ lines, many deps),
 * we test the logic in isolation using renderHook to exercise the same
 * useEffect and useRef patterns used in production.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A minimal hook that mirrors the encounter auto-pause logic from GameView.tsx:
 *
 * - wasRunningBeforeEncounterPause ref tracks pre-modal running state
 * - useEffect pauses when encounterModalOpen && running
 * - close callbacks resume if wasRunning was true
 */
function useEncounterAutoPause(initialRunning = false) {
  const [running, setRunning] = useState(initialRunning);
  const [encounterOpen, setEncounterOpen] = useState(false);
  const wasRunningBeforeEncounterPause = useRef<boolean>(false);

  useEffect(() => {
    if (encounterOpen && running) {
      wasRunningBeforeEncounterPause.current = true;
      setRunning(false);
    }
  }, [encounterOpen, running]);

  const handleClose = useCallback(() => {
    setEncounterOpen(false);
    if (wasRunningBeforeEncounterPause.current) {
      wasRunningBeforeEncounterPause.current = false;
      setRunning(true);
    }
  }, []);

  const openEncounter = useCallback(() => setEncounterOpen(true), []);

  return { running, encounterOpen, openEncounter, handleClose, setRunning };
}

describe('encounter auto-pause', () => {
  it('pauses when encounter modal opens while running', () => {
    const { result } = renderHook(() => useEncounterAutoPause(true));

    expect(result.current.running).toBe(true);

    act(() => {
      result.current.openEncounter();
    });

    expect(result.current.running).toBe(false);
    expect(result.current.encounterOpen).toBe(true);
  });

  it('resumes when encounter modal closes if game was running before', () => {
    const { result } = renderHook(() => useEncounterAutoPause(true));

    // Open encounter — should pause
    act(() => {
      result.current.openEncounter();
    });
    expect(result.current.running).toBe(false);

    // Close encounter — should resume because wasRunning was true
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.running).toBe(true);
    expect(result.current.encounterOpen).toBe(false);
  });

  it('stays paused after encounter close if manually paused before', () => {
    // Start with running = false (manually paused)
    const { result } = renderHook(() => useEncounterAutoPause(false));

    expect(result.current.running).toBe(false);

    // Open encounter — running is already false, wasRunning stays false
    act(() => {
      result.current.openEncounter();
    });
    expect(result.current.running).toBe(false);

    // Close encounter — should NOT resume because wasRunning was false
    act(() => {
      result.current.handleClose();
    });
    expect(result.current.running).toBe(false);
  });

  it('does not set wasRunning when game was already paused before modal opens', () => {
    const setRunningSpy = vi.fn();
    const { result } = renderHook(() => {
      const hook = useEncounterAutoPause(false);
      return hook;
    });

    // The game is not running — open encounter
    act(() => {
      result.current.openEncounter();
    });

    // Close — running should remain false
    act(() => {
      result.current.handleClose();
    });

    expect(result.current.running).toBe(false);
  });

  it('handles rapid open/close without stale wasRunning state', () => {
    const { result } = renderHook(() => useEncounterAutoPause(true));

    // First cycle: open and close (resumes)
    act(() => {
      result.current.openEncounter();
    });
    expect(result.current.running).toBe(false);

    act(() => {
      result.current.handleClose();
    });
    expect(result.current.running).toBe(true);

    // Second cycle: manually pause, then open/close (should stay paused)
    act(() => {
      result.current.setRunning(false);
    });
    expect(result.current.running).toBe(false);

    act(() => {
      result.current.openEncounter();
    });
    expect(result.current.running).toBe(false);

    act(() => {
      result.current.handleClose();
    });
    // Was paused before second open, so should remain paused
    expect(result.current.running).toBe(false);
  });
});
