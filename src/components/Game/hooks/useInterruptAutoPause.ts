import { useCallback, useEffect, useRef } from 'react';

interface UseInterruptAutoPauseParams {
  /**
   * True while ANY interrupt is open. The caller reads this from the interrupt
   * registry (`interruptRegistry.ts`, THR-1608) — never from an ad-hoc OR of
   * render conditions, or the pause and the debug surface can disagree.
   */
  interruptOpen: boolean;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface InterruptAutoPauseHandle {
  /**
   * Whether the clock was running when the current run of interrupts began.
   * `null` while no interrupt is open. Read by `__DEBUG.getInterruptState()`.
   */
  getWasRunningBeforeInterrupt: () => boolean | null;
}

/**
 * Central auto-pause for interrupts (THR-668), with the Stellaris resume
 * policy (THR-1608, plan § S3): **time returns to the state it was in.**
 *
 * - When the first interrupt opens, record whether the clock was running, and
 *   stop it.
 * - While any interrupt stays open, the clock stays stopped. Anything that
 *   restarts it behind the modal (a per-modal close handler, a stale path) is
 *   stopped again on the next effect pass, and does NOT change the recorded
 *   state — stacked interrupts cannot leak a running world.
 * - When the last interrupt closes, restore the recorded state. A player who
 *   paused stays paused; a running world runs on.
 *
 * There is no forced-resume side channel. THR-668 kept one for encounter
 * commit-and-continue and interrupt-opened encounters; both are resume-to-prior
 * now, per Christian's 2026-09-27 ruling (the clock is the Stellaris model). If
 * a surface ever genuinely needs "always resume", it becomes an explicit field
 * on its registry entry, never a ref.
 */
export function useInterruptAutoPause({
  interruptOpen,
  running,
  setRunning,
}: UseInterruptAutoPauseParams): InterruptAutoPauseHandle {
  /** `null` = no interrupt open; otherwise the clock state before the first one opened. */
  const priorRunning = useRef<boolean | null>(null);

  useEffect(() => {
    if (interruptOpen) {
      if (priorRunning.current === null) priorRunning.current = running;
      if (running) setRunning(false);
      return;
    }
    if (priorRunning.current !== null) {
      const resume = priorRunning.current;
      priorRunning.current = null;
      if (resume) setRunning(true);
    }
  }, [interruptOpen, running, setRunning]);

  const getWasRunningBeforeInterrupt = useCallback(() => priorRunning.current, []);
  return { getWasRunningBeforeInterrupt };
}
