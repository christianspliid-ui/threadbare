/**
 * THR-1781 — a paid God's Will steer reaches the decision.
 *
 * Whispers wrote `whisper_*` influences nothing read, and a compulsion lapsed three
 * ticks after the click while The First was still mid-chapter. These pin the two
 * readers `premonitionSteer.ts` adds: the whisper pull (on `finalScore` and on the live
 * board, which never reads `finalScore`) and the held compulsion's resolution.
 */
import { describe, it, expect } from 'vitest';
import {
  computeWhisperPull,
  applyWhisperPull,
  resolveCompulsion,
  compulsionOutcomeMessage,
  whisperMatchesEntry,
  anchorHeldWhispers,
  isWhisperHeld,
  whisperLapseMessage,
} from '../premonitionSteer';
import { scoreUnifiedBoard } from '../decisionBoard';
import { routeNotifications, eventTypeToCategory } from '../notificationRouter';
import type { DivineInfluenceEntry } from '../../types/dream';
import type { ScoredCandidate } from '../encounterScoring';
import {
  WHISPER_INFLUENCE_STRENGTH,
  WHISPER_INFLUENCE_DURATION,
  WHISPER_INFLUENCE_DECAY_RATE,
  WHISPER_PULL_SCALE,
  COMPULSION_HOLD_MAX_TICKS,
  WHISPER_HOLD_MAX_TICKS,
} from '../../data/premonition-constants';

const PAID_AT = 100;

function whisper(tag: string, reach?: string): DivineInfluenceEntry {
  return {
    id: `di_${tag}`,
    interventionType: 'omen',
    sphere: 'force',
    tickApplied: PAID_AT,
    initialStrength: WHISPER_INFLUENCE_STRENGTH,
    decayRate: WHISPER_INFLUENCE_DECAY_RATE,
    minimumStrength: 0,
    maxDuration: WHISPER_INFLUENCE_DURATION,
    behaviorTag: tag,
    ...(reach ? { reachBoost: { reach, bonus: WHISPER_INFLUENCE_STRENGTH } } : {}),
  };
}

function candidate(
  templateId: string,
  reachPrimary: string,
  finalScore: number,
  extra: Record<string, unknown> = {},
): ScoredCandidate {
  return {
    entry: { templateId, locationId: 'loc_here', reachPrimary, threatRating: 'moderate', ...extra },
    finalScore,
    valuePerTick: finalScore,
    desireMultiplier: 1,
    engagementFit: 1,
  } as unknown as ScoredCandidate;
}

const emptyGraph = { getNode: () => null, getOutgoingEdges: () => [] } as never;

describe('whisper pull (THR-1781)', () => {
  const towardIron = [whisper('whisper_reach_iron', 'iron')];

  it('raises a matching reach for the whole influence duration, and nothing after', () => {
    const iron = { reachPrimary: 'iron', threatRating: 'moderate' } as never;
    const fresh = computeWhisperPull(towardIron, iron, PAID_AT);
    expect(fresh).toBeCloseTo(1 + WHISPER_PULL_SCALE * WHISPER_INFLUENCE_STRENGTH, 10);
    for (let dt = 0; dt < WHISPER_INFLUENCE_DURATION; dt++) {
      expect(computeWhisperPull(towardIron, iron, PAID_AT + dt)).toBeGreaterThan(1);
    }
    expect(computeWhisperPull(towardIron, iron, PAID_AT + WHISPER_INFLUENCE_DURATION)).toBe(1);
  });

  it('leaves other reaches alone', () => {
    expect(computeWhisperPull(towardIron, { reachPrimary: 'gold', threatRating: 'moderate' } as never, PAID_AT)).toBe(1);
  });

  it('reads every whisper category, and never a compulsion influence', () => {
    const entry = (reachPrimary: string, threatRating: string, sphereAffinity?: string) =>
      ({ reachPrimary, threatRating, sphereAffinity }) as never;
    expect(whisperMatchesEntry(whisper('whisper_sphere_force'), entry('iron', 'moderate', 'force'))).toBe(true);
    expect(whisperMatchesEntry(whisper('whisper_sphere_force'), entry('iron', 'moderate', 'matter'))).toBe(false);
    expect(whisperMatchesEntry(whisper('whisper_gather_strength', 'gold'), entry('iron', 'easy'))).toBe(true);
    // Its Gold reachBoost must not drag a resting mortal into a deadly Gold encounter.
    expect(whisperMatchesEntry(whisper('whisper_gather_strength', 'gold'), entry('gold', 'deadly'))).toBe(false);
    expect(whisperMatchesEntry(whisper('whisper_gather_courage'), entry('iron', 'deadly'))).toBe(true);
    expect(whisperMatchesEntry(whisper('whisper_gather_courage'), entry('iron', 'easy'))).toBe(false);
    expect(whisperMatchesEntry(whisper('compulsion_target_x', 'iron'), entry('iron', 'moderate'))).toBe(false);
  });

  it('lifts a whispered encounter over the one it lost to, on finalScore and on the live board', () => {
    const decision = {
      rankedCandidates: [candidate('enc.trade', 'gold', 1.0), candidate('enc.duel', 'iron', 0.9)],
      topCandidates: [candidate('enc.trade', 'gold', 1.0), candidate('enc.duel', 'iron', 0.9)],
      selected: null as ScoredCandidate | null,
    };
    decision.selected = decision.rankedCandidates[0];

    const unpulled = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: PAID_AT,
      encounterCandidates: decision.topCandidates, strategicCandidates: [],
    });
    expect(unpulled.winner?.id).toBe('enc.trade');

    expect(applyWhisperPull(decision, towardIron, PAID_AT, 0)).toBe(1);
    expect(decision.rankedCandidates[0].entry.templateId).toBe('enc.duel');
    expect(decision.selected?.entry.templateId).toBe('enc.duel');

    const pulled = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: PAID_AT,
      encounterCandidates: decision.topCandidates, strategicCandidates: [],
    });
    expect(pulled.winner?.id).toBe('enc.duel');
    expect(pulled.winner?.whisperPull).toBeGreaterThan(1);
  });

  it('re-cuts the top list so a whispered encounter just outside it reaches the board', () => {
    const ranked = [
      candidate('a', 'gold', 1.0), candidate('b', 'gold', 0.95), candidate('c', 'iron', 0.9),
    ];
    const decision = { rankedCandidates: ranked, topCandidates: ranked.slice(0, 2), selected: null };
    applyWhisperPull(decision, towardIron, PAID_AT, 0);
    expect(decision.topCandidates.map(c => c.entry.templateId)).toContain('c');
    expect(decision.topCandidates).toHaveLength(2);
  });

  it('is a no-op with no live whisper', () => {
    const ranked = [candidate('a', 'iron', 1.0)];
    const decision = { rankedCandidates: ranked, topCandidates: ranked, selected: null };
    expect(applyWhisperPull(decision, towardIron, PAID_AT + WHISPER_INFLUENCE_DURATION, 0)).toBe(0);
    expect(decision.rankedCandidates).toBe(ranked);
  });
});

describe('steer outcome reaches the player (THR-1781)', () => {
  it('routes the decision phase\'s outcome event to a toast in the divine category', () => {
    expect(eventTypeToCategory('divine_premonition')).toBe('divine');
    const empty = { toasts: [], alerts: [], popupQueue: [], entityNotices: [] } as never;
    const routed = routeNotifications([{
      id: 'divine_steer_a_10', tick: 10, type: 'divine_premonition',
      message: 'Your will holds: Kael turns to Duel.', significance: 0.6,
      isInterventionBeat: true, actorId: 'a', notification: { channel: 'toast' },
    }], empty, 1_000);
    expect(routed.toasts.map(t => t.message)).toEqual(['Your will holds: Kael turns to Duel.']);
  });
});

describe('held compulsion (THR-1781)', () => {
  const top = [candidate('enc.trade', 'gold', 1.0), candidate('enc.duel', 'iron', 0.9)];

  it('is taken at a decision long after the click — the old window was 3 ticks', () => {
    const decision = { rankedCandidates: top, topCandidates: [...top] };
    const r = resolveCompulsion(decision, 'enc.duel', undefined, PAID_AT, PAID_AT + 30);
    expect(r.kind).toBe('taken');
    if (r.kind === 'taken') expect(r.candidate.entry.templateId).toBe('enc.duel');
  });

  it('pulls the target onto the board from the ranked list when the top five dropped it', () => {
    const ranked = [...top, candidate('enc.mystery', 'veil', 0.2)];
    const decision = { rankedCandidates: ranked, topCandidates: [...top] };
    const r = resolveCompulsion(decision, 'enc.mystery', undefined, PAID_AT, PAID_AT + 5);
    expect(r).toMatchObject({ kind: 'taken', pulledFromRanked: true });
    expect(decision.topCandidates.map(c => c.entry.templateId)).toContain('enc.mystery');
  });

  it('lapses with a reason, never silently', () => {
    const decision = { rankedCandidates: top, topCandidates: [...top] };
    const gone = resolveCompulsion(decision, 'enc.absent', undefined, PAID_AT, PAID_AT + 5);
    expect(gone).toEqual({ kind: 'lapsed', reason: 'unavailable' });
    const stale = resolveCompulsion(decision, 'enc.duel', undefined, PAID_AT, PAID_AT + COMPULSION_HOLD_MAX_TICKS + 1);
    expect(stale).toEqual({ kind: 'lapsed', reason: 'expired' });
    expect(compulsionOutcomeMessage('Kael', 'Duel', gone)).toMatch(/Kael/);
    expect(compulsionOutcomeMessage('Kael', 'Duel', stale)).toMatch(/Duel/);
    expect(compulsionOutcomeMessage('Kael', 'Duel', { kind: 'none' })).toBeNull();
  });

  it('prefers the paid instance when the template sits at two places', () => {
    const here = candidate('enc.duel', 'iron', 0.9);
    const there = candidate('enc.duel', 'iron', 0.8, { locationId: 'loc_there' });
    const decision = { rankedCandidates: [here, there], topCandidates: [here, there] };
    const r = resolveCompulsion(decision, 'enc.duel', 'loc_there', PAID_AT, PAID_AT + 1);
    expect(r.kind === 'taken' && r.candidate).toBe(there);
  });

  it('pulls the paid instance up from the ranked list before taking the template elsewhere', () => {
    const here = candidate('enc.duel', 'iron', 0.9);
    const there = candidate('enc.duel', 'iron', 0.3, { locationId: 'loc_there' });
    const decision = { rankedCandidates: [here, there], topCandidates: [here] };
    const r = resolveCompulsion(decision, 'enc.duel', 'loc_there', PAID_AT, PAID_AT + 1);
    expect(r).toMatchObject({ kind: 'taken', pulledFromRanked: true });
    expect(r.kind === 'taken' && r.candidate).toBe(there);
    expect(decision.topCandidates).toContain(there);
  });
});

describe('held whisper (THR-1781)', () => {
  const held = (tag: string, reach?: string): DivineInfluenceEntry => ({ ...whisper(tag, reach), awaitingFirstRead: true });
  const goldEntry = { reachPrimary: 'gold', sphereAffinity: undefined, threatRating: 'moderate' } as never;

  it('starts its pull at the first full decision, not the click — a busy mortal still feels it', () => {
    const w = held('whisper_reach_gold', 'gold');
    const decisionAt = PAID_AT + WHISPER_INFLUENCE_DURATION + 10; // the old pull is long gone
    expect(computeWhisperPull([{ ...w, awaitingFirstRead: undefined }], goldEntry, decisionAt)).toBe(1);
    const r = anchorHeldWhispers([w], decisionAt);
    expect(r).toEqual({ anchored: 1, lapsed: [] });
    expect(w.tickApplied).toBe(decisionAt);
    expect(w.awaitingFirstRead).toBeUndefined();
    expect(computeWhisperPull([w], goldEntry, decisionAt)).toBeCloseTo(1 + WHISPER_PULL_SCALE * WHISPER_INFLUENCE_STRENGTH);
  });

  it('lapses unread past the hold, once, with a player-facing line', () => {
    const w = held('whisper_reach_gold', 'gold');
    const late = PAID_AT + WHISPER_HOLD_MAX_TICKS + 1;
    expect(isWhisperHeld(w, late)).toBe(false);
    const r = anchorHeldWhispers([w], late);
    expect(r.anchored).toBe(0);
    expect(r.lapsed).toEqual([w]);
    expect(w.tickApplied).toBe(PAID_AT);
    expect(anchorHeldWhispers([w], late + 1).lapsed).toHaveLength(0);
    expect(whisperLapseMessage('Aria')).toContain('Aria');
  });

  it('anchors only once — a second decision does not restart the clock', () => {
    const w = held('whisper_gather_courage');
    anchorHeldWhispers([w], PAID_AT + 5);
    anchorHeldWhispers([w], PAID_AT + 20);
    expect(w.tickApplied).toBe(PAID_AT + 5);
  });

  it('leaves non-whisper and already-read influences alone', () => {
    const plain = whisper('whisper_reach_gold', 'gold');
    const r = anchorHeldWhispers([plain], PAID_AT + 50);
    expect(r).toEqual({ anchored: 0, lapsed: [] });
    expect(plain.tickApplied).toBe(PAID_AT);
  });
});
