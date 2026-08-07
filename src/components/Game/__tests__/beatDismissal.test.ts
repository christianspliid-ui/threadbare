/**
 * THR-1019 — the debug beat-dismissal lever resolves beats through the engine's beat
 * state machine, not by clicking DOM nodes.
 *
 * The Done-when asks this to be asserted rather than asserted-about, so the central
 * test here is a **falsification arm**: the naive dismissal (resolve with no choice,
 * which is what the hand-rolled `[role="dialog"]` loop effectively did) leaves a
 * `selection` beat pending, and only the helper's choice retires it. If
 * `selectDefaultBeatChoice` ever regressed to returning `undefined`, that arm goes red.
 */

import { describe, it, expect } from 'vitest';
import {
  selectDefaultBeatChoice,
  DISMISSABLE_BEAT_SURFACES,
  DEBUG_DISMISS_BEATS_MAX_PASSES,
  type BeatInterruptSurface,
} from '../beatDismissal';
import {
  createInitialAscendantBeatState,
  forceOfferBeatById,
  getBeatDefinitionById,
  resolvePendingBeat,
} from '../../../engine/ascendantBeat';
import { WorldGraph } from '../../../engine/graph';
import type { GameState } from '../../../types/gameState';

/** A selection beat from the shipped spine: three god-paths, 1-of-N. */
const SELECTION_BEAT = 'beat.spine.a_path_opens';
/** A non-selection beat from the same spine: grants its full set unconditionally. */
const GRANT_BEAT = 'beat.spine.opening';

/** Build a GameState with the named beat already offered (mirrors ascendantBeat.test.ts). */
function pendingState(beatId: string, tick = 5): GameState {
  const offered = forceOfferBeatById(createInitialAscendantBeatState(), beatId, tick)!.next;
  const state = {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph: new WorldGraph(),
    ascendantBeats: offered,
  } as unknown as GameState;
  (state as { unlockedActionIds?: readonly string[] }).unlockedActionIds = [];
  return state;
}

describe('selectDefaultBeatChoice — THR-1019', () => {
  it('picks the first grant of a selection beat', () => {
    const state = pendingState(SELECTION_BEAT);
    const pending = state.ascendantBeats!.pending!;
    expect(pending.kind).toBe('selection');

    const grants = getBeatDefinitionById(SELECTION_BEAT)!.grantsActionIds!;
    expect(grants.length).toBeGreaterThan(1); // otherwise "first of N" proves nothing

    expect(selectDefaultBeatChoice(pending, getBeatDefinitionById)).toBe(grants[0]);
  });

  it('returns undefined for a non-selection beat, where the engine ignores the argument', () => {
    const pending = pendingState(GRANT_BEAT).ascendantBeats!.pending!;
    expect(pending.kind).not.toBe('selection');
    expect(selectDefaultBeatChoice(pending, getBeatDefinitionById)).toBeUndefined();
  });

  it('fail-soft: an unknown beat id yields undefined rather than throwing (NFP #4)', () => {
    expect(
      selectDefaultBeatChoice({ beatId: 'beat.does.not.exist', kind: 'selection' }, getBeatDefinitionById),
    ).toBeUndefined();
  });

  it('fail-soft: a lookup that throws yields undefined rather than propagating (NFP #4)', () => {
    expect(
      selectDefaultBeatChoice({ beatId: SELECTION_BEAT, kind: 'selection' }, () => {
        throw new Error('catalogue unavailable');
      }),
    ).toBeUndefined();
  });

  it('is deterministic — repeated calls agree (NFP #3)', () => {
    const pending = pendingState(SELECTION_BEAT).ascendantBeats!.pending!;
    const first = selectDefaultBeatChoice(pending, getBeatDefinitionById);
    for (let i = 0; i < 5; i += 1) {
      expect(selectDefaultBeatChoice(pending, getBeatDefinitionById)).toBe(first);
    }
  });
});

describe('dismissal routes through the beat state machine — THR-1019', () => {
  it('FALSIFICATION: resolving a selection beat WITHOUT the choice leaves it pending', () => {
    // This is what a dismissal that only closed the modal would amount to. The engine
    // refuses it, so the beat survives — the exact "fragile against beats with multiple
    // choices" failure the hand-rolled loop hit (#445).
    const state = pendingState(SELECTION_BEAT);
    const naive = resolvePendingBeat(state);

    expect(naive.resolved).toBe(false);
    expect(naive.state.ascendantBeats!.pending).not.toBeNull();
    expect(naive.state.ascendantBeats!.pending!.beatId).toBe(SELECTION_BEAT);
    expect(naive.message).toContain('needs a choice');
  });

  it('resolving with selectDefaultBeatChoice retires the beat and applies its grant', () => {
    const state = pendingState(SELECTION_BEAT);
    const pending = state.ascendantBeats!.pending!;
    const chosen = selectDefaultBeatChoice(pending, getBeatDefinitionById);

    const result = resolvePendingBeat(state, { chosenActionId: chosen });

    // Retired through the state machine — pending cleared, history recorded.
    expect(result.resolved).toBe(true);
    expect(result.state.ascendantBeats!.pending).toBeNull();
    expect(result.state.ascendantBeats!.history).toHaveLength(1);
    expect(result.state.ascendantBeats!.history[0].beatId).toBe(SELECTION_BEAT);

    // And it granted exactly the chosen god-path, not the whole set.
    expect(result.grantedActionIds).toEqual([chosen]);
  });

  it('a non-selection beat retires on the same path with no choice supplied', () => {
    const state = pendingState(GRANT_BEAT);
    const pending = state.ascendantBeats!.pending!;

    const result = resolvePendingBeat(state, {
      chosenActionId: selectDefaultBeatChoice(pending, getBeatDefinitionById),
    });

    expect(result.resolved).toBe(true);
    expect(result.state.ascendantBeats!.pending).toBeNull();
    expect(result.grantedActionIds).toEqual(getBeatDefinitionById(GRANT_BEAT)!.grantsActionIds);
  });
});

describe('dismissal scope — THR-1019', () => {
  it('covers the narrative interrupts, and none of the surfaces a run exists to observe', () => {
    // The lever must not weaken the game: clearing the veil or a choice set would
    // destroy the very thing a verification run is usually there to capture.
    expect([...DISMISSABLE_BEAT_SURFACES].sort()).toEqual([
      'AscendantBeatModal',
      'AscendantBeatOfferBanner',
      'JourneyVignetteModal',
      'PremonitionModal',
      'StoryBeatModal',
    ]);

    const mustNeverBeDismissed = [
      'EncounterVeil',
      'MeetTheFirstFlow',
      'ChoiceSetModal',
      'EmergenceDilemmaModal',
      'DivineReceiptModal',
    ];
    for (const surface of mustNeverBeDismissed) {
      expect(DISMISSABLE_BEAT_SURFACES).not.toContain(surface as BeatInterruptSurface);
    }
  });

  it('bounds the drain so a self-refilling beat queue cannot hang a run', () => {
    expect(DEBUG_DISMISS_BEATS_MAX_PASSES).toBeGreaterThan(1);
    expect(Number.isInteger(DEBUG_DISMISS_BEATS_MAX_PASSES)).toBe(true);
  });
});
