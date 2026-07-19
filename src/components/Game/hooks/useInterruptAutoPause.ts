import { useEffect, useRef } from 'react';

interface UseInterruptAutoPauseParams {
  /**
   * True while ANY blocking interrupt surface is open (encounter veil, beat
   * modal, vignette, story beat, premonition, emergence dilemma, choice set,
   * meeting flow). The caller ORs the render conditions of every such surface —
   * mirror the render condition exactly, or a modal that cannot render will
   * hold the sim paused behind an invisible gate.
   */
  interruptOpen: boolean;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Optional external escape hatch: when a flow sets this ref to true (e.g.
   * commit-and-continue, interrupt-opened encounters), the next
   * all-interrupts-closed transition resumes the sim even if it was not
   * auto-paused. Cleared by the hook when consumed.
   */
  forceResumeRef?: React.MutableRefObject<boolean>;
}

/**
 * Central auto-pause for blocking interrupt surfaces (THR-668).
 *
 * Semantics:
 * - Opening any interrupt surface while the sim runs pauses it and records
 *   that the pause was automatic.
 * - The sim resumes only when ALL interrupt surfaces are closed AND the pause
 *   was automatic. A manual pause taken before the interrupt stays a manual
 *   pause — closing the modal does not resume.
 * - While an interrupt is open, any attempt to resume (e.g. a per-modal close
 *   handler firing while a second modal is still up) is re-paused on the next
 *   effect pass, so stacked modals cannot leak a running sim.
 */
export function useInterruptAutoPause({
  interruptOpen,
  running,
  setRunning,
  forceResumeRef,
}: UseInterruptAutoPauseParams): void {
  /** Tracks whether the current pause was taken by this hook (vs. the player). */
  const wasRunningBeforeInterrupt = useRef(false);

  useEffect(() => {
    if (interruptOpen && running) {
      wasRunningBeforeInterrupt.current = true;
      setRunning(false);
    }
  }, [interruptOpen, running, setRunning]);

  useEffect(() => {
    if (interruptOpen) return;
    if (wasRunningBeforeInterrupt.current || forceResumeRef?.current) {
      wasRunningBeforeInterrupt.current = false;
      if (forceResumeRef) forceResumeRef.current = false;
      setRunning(true);
    }
  }, [interruptOpen, setRunning, forceResumeRef]);
}
