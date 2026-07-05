import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ASCENDANT_DEEPENING_BEATS,
  DEEPENING_BEAT_PRESENTATION,
  getDeepeningBeatById,
  deepeningChronicleProse,
} from '../ascendant-deepening-beats';
import { deepeningBeatIdForReach } from '../player-progression';
import { REACH_DOMAINS } from '../../types/traits';
import {
  forceOfferBeatById,
  resolvePendingBeat,
  createInitialAscendantBeatState,
  getBeatDefinitionById,
} from '../../engine/ascendantBeat';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../engine/traceBuffer';
import type { GameState } from '../../types/gameState';

// ─── Content: the eight Deepening beats + their authored prose ────────────────

describe('ASCENDANT_DEEPENING_BEATS — one per Reach, no dead identity (THR-613 §4.1)', () => {
  it('has exactly one Deepening beat per Reach domain', () => {
    expect(ASCENDANT_DEEPENING_BEATS).toHaveLength(REACH_DOMAINS.length);
    const byReach = new Set(REACH_DOMAINS.map(deepeningBeatIdForReach));
    const ids = new Set(ASCENDANT_DEEPENING_BEATS.map(b => b.beatId));
    expect(ids).toEqual(byReach);
  });

  it('every beat is kind "deepening", carries its reach identity, and grants no card in v1', () => {
    for (const reach of REACH_DOMAINS) {
      const def = getDeepeningBeatById(deepeningBeatIdForReach(reach));
      expect(def).not.toBeNull();
      expect(def!.kind).toBe('deepening');
      expect(def!.identity?.reach).toBe(reach);
      // v1: prose-first, the tier-up itself is the reward — no fake card reveal.
      expect(def!.grantsActionIds ?? []).toEqual([]);
      expect(def!.templateId).toBeUndefined();
    }
  });

  it('getDeepeningBeatById returns null for a non-deepening id', () => {
    expect(getDeepeningBeatById('beat.spine.opening')).toBeNull();
    expect(getDeepeningBeatById('nope')).toBeNull();
  });
});

describe('DEEPENING_BEAT_PRESENTATION — authored plain-register vignettes (THR-609)', () => {
  it('covers every Deepening beat id with non-empty title + prose', () => {
    for (const reach of REACH_DOMAINS) {
      const p = DEEPENING_BEAT_PRESENTATION[deepeningBeatIdForReach(reach)];
      expect(p, `presentation for ${reach}`).toBeDefined();
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.prose.length).toBeGreaterThan(40);
      expect(p.cta.length).toBeGreaterThan(0);
    }
  });

  it('never states the growth mechanically — no digits, no "+1", no "tier"', () => {
    for (const reach of REACH_DOMAINS) {
      const { prose } = DEEPENING_BEAT_PRESENTATION[deepeningBeatIdForReach(reach)];
      expect(prose, `prose for ${reach}`).not.toMatch(/\d/);
      expect(prose.toLowerCase()).not.toContain('+1');
      expect(prose.toLowerCase()).not.toContain('tier');
    }
  });
});

describe('deepeningChronicleProse — reach-named one-liner (THR-613 §4.3)', () => {
  it('names the reach and carries no digits', () => {
    const line = deepeningChronicleProse('iron');
    expect(line).toContain('Iron');
    expect(line).not.toMatch(/\d/);
  });
});

// ─── Resolve path: an enqueued Deepening beat now resolves (was skipped as missing) ──

describe('resolvePendingBeat — Deepening beats are catalogued (THR-613 Slice 2)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    clearTraces();
    disableTracing();
  });

  function pendingDeepeningState(reach: (typeof REACH_DOMAINS)[number], tick = 30): GameState {
    const beatId = deepeningBeatIdForReach(reach);
    const offered = forceOfferBeatById(createInitialAscendantBeatState(), beatId, tick)!.next;
    return {
      tick,
      seed: 42,
      ascendantId: 'asc-1',
      graph: {} as never,
      ascendantBeats: offered,
      unlockedActionIds: [],
    } as unknown as GameState;
  }

  it('force-offer + resolve clears pending and records history (no missing_template skip)', () => {
    const state = pendingDeepeningState('iron');
    expect(state.ascendantBeats?.pending?.beatId).toBe('beat.deepening.iron');
    // The catalogue now finds it (Slice 2) — Slice 1 alone would skip as missing_template.
    expect(getBeatDefinitionById('beat.deepening.iron')).not.toBeNull();

    const result = resolvePendingBeat(state);
    expect(result.resolved).toBe(true);
    expect(result.grantedActionIds).toEqual([]); // prose-first, grants nothing in v1
    expect(result.state.ascendantBeats?.pending).toBeNull();
    expect(result.state.ascendantBeats?.history).toHaveLength(1);
    expect(result.state.ascendantBeats?.history[0].beatId).toBe('beat.deepening.iron');

    const cats = getTraces().map(t => t.category);
    expect(cats).toContain('ascendant.beat.resolved');
    expect(cats).not.toContain('ascendant.beat.skipped');
  });
});
