import React from 'react';
import type { EncounterChoiceReach } from '../types/encounter-contract';
import {
  beginTensionReveal,
  endTensionReveal,
  playResolveNote,
} from '../audio/encounterSoundDesign';

// TODO(THR-1168): this hook has no production value-consumer. Its only non-test
// importer was `Encounter/ThreadOverlay.tsx` — type-only, and deleted by THR-1167 —
// and it is the sole caller of the three tension-cue functions imported above.
// Kept rather than deleted because the beat clock below is an authored THR-346 spec;
// THR-1168 carries the wire-or-retire call, naming EncounterVeil/NudgePhaseShell
// step-commit as the producer.

/**
 * Beat durations for the Moment 1 tension reveal sequence.
 *
 * Total reveal: commit (60ms) + inhale (380ms) + drawing (520ms) +
 * taut (420ms) + resolving (240ms) ≈ 1.62s.
 *
 * The unmount delay holds the settled overlay on screen long enough for
 * the calling EncounterScreen to swap in the resolved beat prose.
 */
const THREAD_REVEAL_COMMIT_MS = 60;
const THREAD_REVEAL_INHALE_MS = 380;
const THREAD_REVEAL_DRAW_MS = 520;
const THREAD_REVEAL_TAUT_MS = 420;
const THREAD_REVEAL_RESOLVE_MS = 240;
const THREAD_REVEAL_UNMOUNT_DELAY_MS = 600;

export type ThreadRevealPhase =
  | 'idle'
  | 'committed'
  | 'drawing'
  | 'taut'
  | 'resolving'
  | 'settled';

export interface ThreadRevealState {
  phase: ThreadRevealPhase;
  chosenReach: EncounterChoiceReach | null;
  outcomeBand: string | null;
}

export interface UseThreadRevealOptions {
  /**
   * Play the Moment 1 sound design (THR-346) alongside the visual sequence.
   * Defaults to true. Set false for silent consumers — style-guide demos that
   * replay on a loop, or tests that assert timing without audio side effects.
   */
  enableAudio?: boolean;
}

export interface UseThreadRevealResult {
  state: ThreadRevealState;
  /** Call when player commits a choice */
  commit: (reach: EncounterChoiceReach, outcomeBand: string) => void;
  /** Called internally at settle; also callable externally to force-reset */
  reset: () => void;
  /** Fires at the resolve beat — post-v1 audio consumes this */
  onResolveBeat?: (reach: EncounterChoiceReach, outcomeBand: string) => void;
}

/**
 * useThreadReveal — phase machine for the Moment 1 tension reveal.
 *
 * Drives the SVG `ThreadOverlay` through six phases:
 *
 *   idle → committed → drawing → taut → resolving → settled
 *
 * Transitions are time-driven (no requestAnimationFrame) — `setTimeout`
 * chains at the durations defined above. The hook fires `onResolveBeat`
 * once when entering the `resolving` phase.
 *
 * Sound design (THR-346) is driven from here rather than from `ThreadOverlay`,
 * because this hook owns the beat clock the §3.3 cue table is written against.
 * `beginTensionReveal()` schedules the inhale + thrum envelope on the Web Audio
 * clock at commit; the sphere-tinted resolve note fires at the resolving beat,
 * where the chosen reach is first known. Pass `{ enableAudio: false }` to opt out.
 *
 * After `settled`, the hook holds the state for `THREAD_REVEAL_UNMOUNT_DELAY_MS`
 * before auto-resetting to `idle` so the caller can swap to the next beat.
 *
 * Calling `commit()` while a sequence is in flight cancels and restarts.
 * Calling `reset()` at any time tears down all pending timers.
 */
export function useThreadReveal(
  onResolveBeat?: (reach: EncounterChoiceReach, outcomeBand: string) => void,
  options?: UseThreadRevealOptions,
): UseThreadRevealResult {
  const enableAudio = options?.enableAudio ?? true;
  const [state, setState] = React.useState<ThreadRevealState>({
    phase: 'idle',
    chosenReach: null,
    outcomeBand: null,
  });

  const timeoutsRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const onResolveBeatRef = React.useRef(onResolveBeat);
  const enableAudioRef = React.useRef(enableAudio);

  React.useEffect(() => {
    enableAudioRef.current = enableAudio;
  }, [enableAudio]);

  // Keep the latest onResolveBeat in a ref so timer callbacks see the
  // current value without re-running the effect.
  React.useEffect(() => {
    onResolveBeatRef.current = onResolveBeat;
  }, [onResolveBeat]);

  const clearAllTimeouts = React.useCallback(() => {
    for (const id of timeoutsRef.current) {
      clearTimeout(id);
    }
    timeoutsRef.current = [];
  }, []);

  const reset = React.useCallback(() => {
    clearAllTimeouts();
    if (enableAudioRef.current) endTensionReveal();
    setState({ phase: 'idle', chosenReach: null, outcomeBand: null });
  }, [clearAllTimeouts]);

  const commit = React.useCallback(
    (reach: EncounterChoiceReach, outcomeBand: string) => {
      // Cancel any in-flight reveal before starting a new one.
      clearAllTimeouts();

      // Schedule the inhale + thrum bed on the Web Audio clock. Also re-arms
      // the Moment 2 first-registration gate for this resolution.
      if (enableAudioRef.current) beginTensionReveal();

      // idle → committed (immediate)
      setState({ phase: 'committed', chosenReach: reach, outcomeBand });

      // committed → drawing (after commit + inhale)
      const toDrawing = setTimeout(() => {
        setState((prev) => ({ ...prev, phase: 'drawing' }));
      }, THREAD_REVEAL_COMMIT_MS + THREAD_REVEAL_INHALE_MS);
      timeoutsRef.current.push(toDrawing);

      // drawing → taut
      const toTaut = setTimeout(() => {
        setState((prev) => ({ ...prev, phase: 'taut' }));
      }, THREAD_REVEAL_COMMIT_MS + THREAD_REVEAL_INHALE_MS + THREAD_REVEAL_DRAW_MS);
      timeoutsRef.current.push(toTaut);

      // taut → resolving (fires onResolveBeat callback)
      const toResolving = setTimeout(() => {
        setState((prev) => ({ ...prev, phase: 'resolving' }));
        // Sphere-tinted struck-string node + slackening-thread release.
        if (enableAudioRef.current) playResolveNote(reach);
        onResolveBeatRef.current?.(reach, outcomeBand);
      }, THREAD_REVEAL_COMMIT_MS + THREAD_REVEAL_INHALE_MS + THREAD_REVEAL_DRAW_MS + THREAD_REVEAL_TAUT_MS);
      timeoutsRef.current.push(toResolving);

      // resolving → settled
      const toSettled = setTimeout(() => {
        setState((prev) => ({ ...prev, phase: 'settled' }));
      }, THREAD_REVEAL_COMMIT_MS + THREAD_REVEAL_INHALE_MS + THREAD_REVEAL_DRAW_MS + THREAD_REVEAL_TAUT_MS + THREAD_REVEAL_RESOLVE_MS);
      timeoutsRef.current.push(toSettled);

      // settled → idle (auto-reset after hold)
      const toIdle = setTimeout(
        () => {
          setState({ phase: 'idle', chosenReach: null, outcomeBand: null });
        },
        THREAD_REVEAL_COMMIT_MS +
          THREAD_REVEAL_INHALE_MS +
          THREAD_REVEAL_DRAW_MS +
          THREAD_REVEAL_TAUT_MS +
          THREAD_REVEAL_RESOLVE_MS +
          THREAD_REVEAL_UNMOUNT_DELAY_MS,
      );
      timeoutsRef.current.push(toIdle);
    },
    [clearAllTimeouts],
  );

  // Clear timers on unmount. Also stop any in-flight cue so a torn-down
  // encounter never leaves the drone hanging.
  React.useEffect(() => {
    return () => {
      clearAllTimeouts();
      if (enableAudioRef.current) endTensionReveal();
    };
  }, [clearAllTimeouts]);

  return {
    state,
    commit,
    reset,
    onResolveBeat,
  };
}
