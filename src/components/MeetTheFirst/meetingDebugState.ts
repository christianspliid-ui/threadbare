/**
 * meetingDebugState — THR-868 (WS6 debug surface).
 *
 * The Meet-The-First flow keeps its progress in React state, not in
 * `GameState`, so `window.__DEBUG` has nothing to read it from: every other
 * bridge method resolves through `_gameStateProvider`, and the meeting is
 * deliberately outside that (it runs before the agent exists as a graph node).
 *
 * This is the one-way publish point that closes that gap. The flow writes a
 * flat snapshot on each beat transition; `__DEBUG.getMeetingState()` reads it.
 * Nothing in the game reads this module — it is an observation channel, and a
 * stale snapshot after the flow unmounts is cleared explicitly rather than left
 * to mislead.
 */

import type { BondReception } from '../../data/meeting-nudge-constants';
import type { StepOutcome } from '../../types/unifiedAction';

/** Flat, JSON-safe snapshot of where the meeting flow currently is. */
export interface MeetingDebugSnapshot {
  /** Which beat is on screen. */
  beat: 'sensing' | 'testing' | 'spark' | 'bond';
  /** Candidate under consideration, once one is chosen. */
  candidateName?: string;
  /** Dilemmas drawn this run, and how many carry a formative test. */
  dilemmaIds: string[];
  convertedCount: number;
  /**
   * `true` when this run renders the nudge beat. `false` means every drawn
   * template is unconverted and the legacy choice scene is showing — which is
   * a real state during the rollout, not an error.
   */
  usingFormativeTests: boolean;
  /** Resolved formative outcomes so far, in order. */
  formativeOutcomes: Array<{
    templateId: string;
    band: StepOutcome;
    writtenPole: 'a' | 'b';
    netLean: 'a' | 'b' | 'none';
    shift: number;
    playedNudgeIds: string[];
  }>;
  /** Resolved bond outcome, once the bond test has been committed. */
  bondOutcome?: {
    band: StepOutcome;
    reception: BondReception;
    playedNudgeIds: string[];
  };
}

let snapshot: MeetingDebugSnapshot | null = null;

/** Called by the flow on every beat transition. Overwrites wholesale. */
export function publishMeetingDebugState(next: MeetingDebugSnapshot): void {
  snapshot = next;
}

/** Called on unmount so a finished run cannot be mistaken for a live one. */
export function clearMeetingDebugState(): void {
  snapshot = null;
}

/** Read the current snapshot, or `null` when no meeting is on screen. */
export function readMeetingDebugState(): MeetingDebugSnapshot | null {
  return snapshot;
}
