import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseAscendantBeatDirector,
  createInitialAscendantBeatState,
  resolvePendingBeat,
} from '../ascendantBeat';
import {
  ASCENDANT_SPINE,
  SPINE_BEAT_PRESENTATION,
  ASCENDANT_ACTION_BUCKETS,
  isSpineBeatId,
} from '../../data/ascendant-beat-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { AscendantBeatState } from '../../types/ascendantBeat';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function directorState(tick: number, beats: AscendantBeatState, unlocked: readonly string[] = []): GameState {
  return {
    tick,
    seed: 42,
    ascendantId: 'asc-1',
    graph: new WorldGraph(),
    ascendantBeats: beats,
    unlockedActionIds: unlocked,
  } as unknown as GameState;
}

const templateResolver = (id: string) => getUnifiedTemplateById(id) !== undefined;

// Expected scripted arc (plan §4.1), as (beatId, kind) in order.
const EXPECTED_SPINE: ReadonlyArray<readonly [string, string]> = [
  ['beat.spine.opening', 'spine'],
  ['beat.spine.the_seat', 'spine'],
  ['beat.spine.thing_left_behind', 'spine'],
  ['beat.spine.the_first_word', 'spine'],
  ['beat.spine.a_path_opens', 'selection'],
];

describe('Scripted onboarding spine — Beats 0–4 (THR-504)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  it('ships the full five-beat arc in order with the expected kinds', () => {
    expect(ASCENDANT_SPINE).toHaveLength(EXPECTED_SPINE.length);
    ASCENDANT_SPINE.forEach((beat, i) => {
      expect([beat.beatId, beat.kind]).toEqual(EXPECTED_SPINE[i]);
    });
  });

  it('every spine beat grants only real, bucketed action templates', () => {
    for (const beat of ASCENDANT_SPINE) {
      const grants = beat.grantsActionIds ?? [];
      expect(grants.length).toBeGreaterThan(0);
      for (const id of grants) {
        expect(getUnifiedTemplateById(id), `spine grant "${id}" has no template`).toBeDefined();
        expect(ASCENDANT_ACTION_BUCKETS[id], `spine grant "${id}" has no bucket`).toBeDefined();
      }
    }
  });

  it('every spine beat has authored Threadbare presentation (no generic fallback)', () => {
    for (const beat of ASCENDANT_SPINE) {
      const p = SPINE_BEAT_PRESENTATION[beat.beatId];
      expect(p, `spine beat "${beat.beatId}" missing presentation`).toBeDefined();
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.eyebrow.length).toBeGreaterThan(0);
      expect(p.prose.length).toBeGreaterThan(40); // long-form welcome, not a stub
      expect(p.cta.length).toBeGreaterThan(0);
    }
  });

  it('isSpineBeatId recognises the scripted spine and rejects pool ids', () => {
    expect(isSpineBeatId('beat.spine.a_path_opens')).toBe(true);
    expect(isSpineBeatId('beat.pool.intro.first_stirring')).toBe(false);
  });

  it('Beat 4 is a selection: no choice no-ops, a valid choice grants exactly one path', () => {
    const beat4 = ASCENDANT_SPINE[4];
    expect(beat4.kind).toBe('selection');
    const options = beat4.grantsActionIds ?? [];
    expect(options.length).toBeGreaterThanOrEqual(2);

    // Drive the Director to Beat 4 by exhausting the cursor up to it.
    let beats: AscendantBeatState = { ...createInitialAscendantBeatState(), spineCursor: 4, lastBeatTurn: 0 };
    beats = phaseAscendantBeatDirector(directorState(8, beats), () => 0.5).ascendantBeats!;
    expect(beats.pending?.beatId).toBe('beat.spine.a_path_opens');

    const noChoice = resolvePendingBeat(directorState(8, beats), {}, templateResolver);
    expect(noChoice.resolved).toBe(false);
    expect(noChoice.state.ascendantBeats?.pending).not.toBeNull();

    const chosen = resolvePendingBeat(directorState(8, beats), { chosenActionId: options[0] }, templateResolver);
    expect(chosen.resolved).toBe(true);
    expect(chosen.grantedActionIds).toEqual([options[0]]);
    expect(chosen.state.unlockedActionIds).toEqual([options[0]]);
  });

  it('the Director walks the whole arc 0→4 and the player holds the first cards by ~turn 8', () => {
    let beats = createInitialAscendantBeatState();
    let unlocked: readonly string[] = [];
    const offeredOrder: string[] = [];

    for (let turn = 0; turn <= 8; turn++) {
      const offer = phaseAscendantBeatDirector(directorState(turn, beats, unlocked), () => 0.5).ascendantBeats;
      if (offer?.pending) {
        beats = offer;
        offeredOrder.push(offer.pending.beatId);
        // Resolve immediately (player enters + resolves); selection beats pick the first path.
        const isSel = offer.pending.kind === 'selection';
        const chosen = isSel ? (ASCENDANT_SPINE[4].grantsActionIds ?? [])[0] : undefined;
        const res = resolvePendingBeat(
          directorState(turn, offer, unlocked),
          { chosenActionId: chosen },
          templateResolver,
        );
        expect(res.resolved).toBe(true);
        beats = res.state.ascendantBeats!;
        unlocked = res.state.unlockedActionIds ?? unlocked;
      } else if (offer) {
        beats = offer;
      }
    }

    // All five spine beats were offered, in order.
    expect(offeredOrder).toEqual(EXPECTED_SPINE.map(([id]) => id));
    // Spine exhausted.
    expect(beats.spineCursor).toBe(-1);
    // History records the full arc.
    expect(beats.history).toHaveLength(5);
    // Player now holds the opening cards: thread an actor, thread a location, imbue an artifact,
    // speak the first word — plus exactly one chosen god-path from Beat 4.
    expect(unlocked).toEqual(
      expect.arrayContaining(['bind_thread_agent', 'observe_agent', 'bind_thread_location', 'action.imbue', 'divine.persuade']),
    );
    const pathGrants = (ASCENDANT_SPINE[4].grantsActionIds ?? []).filter(id => unlocked.includes(id));
    expect(pathGrants).toHaveLength(1);
  });
});
