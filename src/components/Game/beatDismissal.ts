/**
 * Debug-only beat dismissal decisions (THR-1019).
 *
 * Browser-verification runs have to reach a surface *behind* the game's narrative
 * interrupts, and the game's interrupt design keeps making beats more interruptive
 * (THR-934, THR-1005, THR-1017). Seven impediment entries in the week of 2026-08-07
 * (#385, #427, #445, #446, #447, #453, #455) each spent 5–15 minutes hand-rolling a
 * dialog-clicking loop to get past them.
 *
 * This module holds the *decisions* that loop got wrong, kept free of React so they
 * can be falsified in a unit test:
 *
 * - which narrative interrupts a debug dismissal is allowed to clear, and
 * - what to pass `resolvePendingBeat` so the beat actually retires.
 *
 * The wiring lives in `GameView.tsx` (`dismissOpenBeatInterrupts`), which routes each
 * surface through its own React handler — and therefore through the engine's beat
 * state machine — rather than clicking DOM nodes.
 */

import type { PendingBeat } from '../../types/ascendantBeat';

/**
 * Narrative interrupt surfaces a debug dismissal may clear.
 *
 * Deliberately NOT the whole `interruptModalOpen` set. The encounter veil, the
 * Meet-The-First flow, choice sets, emergence dilemmas and divine receipts are the
 * surfaces a verification run exists to *look at* — clearing them would defeat the
 * purpose and would make this lever a change to game behavior rather than a way to
 * observe it. See `GameView.tsx` § central interrupt auto-pause for the full set.
 */
export type BeatInterruptSurface =
  | 'AscendantBeatModal'
  | 'AscendantBeatOfferBanner'
  | 'JourneyVignetteModal'
  | 'StoryBeatModal'
  | 'PremonitionModal';

/** Every surface {@link BeatInterruptSurface} covers, in dismissal order. */
export const DISMISSABLE_BEAT_SURFACES: readonly BeatInterruptSurface[] = [
  // Entered beat first: it is the one that swallows pointer events over the veil
  // (#445), and resolving it can reveal the offer banner for the next beat.
  'AscendantBeatModal',
  'AscendantBeatOfferBanner',
  'JourneyVignetteModal',
  'StoryBeatModal',
  'PremonitionModal',
] as const;

/**
 * Maximum drain passes {@link import('../../debug-bridge').DebugBridge.dismissBeats}
 * will make before giving up.
 *
 * Beats chain: dismissing one can immediately offer the next (#453 — "dismissing one
 * beat advances to the next"), and each pass needs a React re-render to observe the
 * successor. The bound stops a self-refilling queue from hanging a verification run;
 * it is not a correctness limit, and a run that hits it gets `exhausted: true` rather
 * than an exception (NFP #4).
 */
export const DEBUG_DISMISS_BEATS_MAX_PASSES = 12;

/** Minimal shape of a beat definition this module needs. Mirrors `BeatDefinition`. */
export interface BeatChoiceSource {
  readonly grantsActionIds?: readonly string[];
}

/**
 * The action id a debug dismissal should pass to `resolvePendingBeat` for `pending`.
 *
 * **This is the load-bearing decision, and the reason the hand-rolled loop was fragile
 * "against beats with multiple choices."** `resolvePendingBeat` refuses a `selection`
 * beat that arrives without a choice — it returns `resolved: false` and leaves
 * `ascendantBeats.pending` exactly where it was:
 *
 * ```
 * message: `Selection beat '${pending.beatId}' needs a choice from [...]`
 * ```
 *
 * So a dismissal that passes `undefined` for every beat silently no-ops on precisely
 * the beats hardest to click past, and the caller sees a modal that will not close.
 * Picking the first grant is deterministic (NFP #3) and is a *default*, not a
 * recommendation — a run that cares which branch it takes should resolve the beat
 * itself rather than reaching for the debug lever.
 *
 * Returns `undefined` for every non-`selection` kind, where the engine grants the
 * definition's full `grantsActionIds` and the argument is ignored.
 */
export function selectDefaultBeatChoice(
  pending: Pick<PendingBeat, 'beatId' | 'kind'>,
  lookupDefinition: (beatId: string) => BeatChoiceSource | null | undefined,
): string | undefined {
  if (pending.kind !== 'selection') return undefined;
  let definition: BeatChoiceSource | null | undefined;
  try {
    definition = lookupDefinition(pending.beatId);
  } catch {
    return undefined; // fail-soft: an unknown beat resolves via the engine's own skip path
  }
  return definition?.grantsActionIds?.[0];
}

/** Outcome of one dismissal pass, per surface. */
export interface BeatDismissalRecord {
  readonly surface: BeatInterruptSurface;
  /** True when the surface's handler ran without throwing. */
  readonly dismissed: boolean;
  /** Present when the handler threw — the run continues regardless (NFP #4). */
  readonly error?: string;
}

/** Aggregate result returned to the caller of `__DEBUG.dismissBeats()`. */
export interface BeatDismissalResult {
  /** How many interrupt surfaces were cleared across every pass. */
  readonly dismissed: number;
  /** Surfaces cleared, in the order they were cleared, with repeats across passes. */
  readonly surfaces: BeatInterruptSurface[];
  /** How many drain passes ran. */
  readonly passes: number;
  /**
   * True when the drain stopped at {@link DEBUG_DISMISS_BEATS_MAX_PASSES} with beats
   * still open, rather than because the screen was clear.
   */
  readonly exhausted: boolean;
  /** Interrupt surfaces still open when the drain stopped (from `getOpenModals`). */
  readonly remaining: string[];
}
