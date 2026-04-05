/**
 * Pacing Governor
 *
 * Controls the cadence of story beat delivery to the player.
 * Enforces a cooldown between beats, caps queue depth, and demotes overflow.
 *
 * Constants:
 *   STORY_BEAT_COOLDOWN      = 12  (ticks between beats)
 *   STORY_BEAT_QUEUE_MAX     = 3   (max queued beats)
 *   STORY_BEAT_QUEUE_OVERFLOW_DEMOTE = true (demote vs. drop)
 */

import {
  STORY_BEAT_COOLDOWN,
  STORY_BEAT_QUEUE_MAX,
} from '../data/attention-constants';
import type { QueuedStoryBeat, StoryBeatPriority } from '../types/attention';

// ─── State ────────────────────────────────────────────────────────────────────

export interface PacingState {
  /** encounterId of the currently-firing story beat, or null. */
  activeStoryBeat: string | null;
  /** Tick when the last story beat completed. */
  lastCompletedTick: number;
  /** Queued beats, sorted highest→lowest priority. */
  queue: QueuedStoryBeat[];
}

// ─── Priority ordering ────────────────────────────────────────────────────────

/**
 * Lower number = higher priority.
 * doom_clock > faction_war > promoted > template_intrinsic
 */
const PRIORITY_ORDER: Record<StoryBeatPriority, number> = {
  doom_clock: 0,
  faction_war: 1,
  promoted: 2,
  template_intrinsic: 3,
};

function comparePriority(a: QueuedStoryBeat, b: QueuedStoryBeat): number {
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Returns true when it is safe to fire the next story beat.
 *
 * Conditions for false:
 *   - A beat is already active (activeStoryBeat !== null)
 *   - Not enough ticks have elapsed since the last beat completed
 *     (currentTick - lastCompletedTick < STORY_BEAT_COOLDOWN)
 */
export function canFireStoryBeat(pacing: PacingState, currentTick: number): boolean {
  if (pacing.activeStoryBeat !== null) return false;
  if (currentTick - pacing.lastCompletedTick < STORY_BEAT_COOLDOWN) return false;
  return true;
}

/**
 * Adds a beat to the queue, re-sorts by priority, and enforces the queue cap.
 *
 * If the queue exceeds STORY_BEAT_QUEUE_MAX after insertion the lowest-priority
 * beat is removed and returned (demoted).  Returns null if no demotion occurred.
 */
export function enqueueStoryBeat(
  pacing: PacingState,
  beat: QueuedStoryBeat
): QueuedStoryBeat | null {
  pacing.queue.push(beat);
  pacing.queue.sort(comparePriority);

  if (pacing.queue.length > STORY_BEAT_QUEUE_MAX) {
    // Pop from the end — lowest priority after sort.
    const demoted = pacing.queue.pop()!;
    return demoted;
  }

  return null;
}

/**
 * Fires the next story beat if conditions allow.
 *
 * Returns the beat and sets pacing.activeStoryBeat.
 * Returns null when: canFireStoryBeat is false, or the queue is empty.
 */
export function dequeueStoryBeat(
  pacing: PacingState,
  currentTick: number
): QueuedStoryBeat | null {
  if (!canFireStoryBeat(pacing, currentTick)) return null;
  if (pacing.queue.length === 0) return null;

  const beat = pacing.queue.shift()!;
  pacing.activeStoryBeat = beat.encounterId;
  return beat;
}

/**
 * Marks the currently-active story beat as complete.
 * Clears activeStoryBeat and records the completion tick for cooldown tracking.
 */
export function completeStoryBeat(pacing: PacingState, tick: number): void {
  pacing.activeStoryBeat = null;
  pacing.lastCompletedTick = tick;
}
