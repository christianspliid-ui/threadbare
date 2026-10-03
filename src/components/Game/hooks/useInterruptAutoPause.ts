import { useEffect, useMemo, useRef } from 'react';

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
  /**
   * A play/pause toggle pressed while an interrupt holds the clock (THR-1711).
   * Flips the *saved* state the clock returns to on close, instead of `running`
   * — which the hold would silently force back to false, so the press used to
   * be undone on close. Returns `true` when it handled the toggle; `false`
   * (no interrupt open) means the caller toggles `running` as usual.
   */
  toggleIfHeld: () => boolean;
  /**
   * A pause requested while an interrupt holds the clock (THR-1711) — e.g. the
   * avatar-arrival auto-pause. Sets the saved state to paused, so closing the
   * interrupt does not resume a world the game meant to stop. Returns `true`
   * when handled; `false` means the caller pauses `running` directly.
   */
  pauseIfHeld: () => boolean;
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
 * - A toggle or pause made *while* an interrupt is open changes the recorded
 *   state, not `running` (`toggleIfHeld` / `pauseIfHeld`, THR-1711). Before,
 *   Space or the play button flipped `running`, the hold forced it back, and
 *   close restored the old state — a pause pressed inside a popup was undone.
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

  return useMemo<InterruptAutoPauseHandle>(() => ({
    getWasRunningBeforeInterrupt: () => priorRunning.current,
    toggleIfHeld: () => {
      if (priorRunning.current === null) return false;
      priorRunning.current = !priorRunning.current;
      return true;
    },
    pauseIfHeld: () => {
      if (priorRunning.current === null) return false;
      priorRunning.current = false;
      return true;
    },
  }), []);
}
