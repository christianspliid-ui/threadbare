/**
 * THR-2068 — God's Will offers story, compelled work answers, the path leans.
 *
 * E1 story-only offers (`buildCompulsionEvent`), E2/E3 the compelled mark and the done
 * line (`buildChapterRecord` → `buildCompulsionDoneEvents`), E4 the path pull
 * (`firstPathPullFor`, `applyFirstPathPull`, the live board).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionOutcome } from '../../types/unifiedAction';
import type { ScoredCandidate } from '../encounterScoring';
import type { ReachDomain } from '../../types/traits';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { FIRST_PATH_PULL, COMPULSION_CANDIDATE_COUNT } from '../../data/premonition-constants';
import { buildCompulsionEvent, buildCompulsionDoneEvents, resolveCompulsionEncounterName } from '../premonitionCompulsion';
import { compulsionDoneMessage } from '../premonitionSteer';
import { applyFirstPathPull, firstPathPullFor, formatFirstPathFitLine, getFirstPathFor, firstPathFromRecord } from '../firstPath';
import { buildChapterRecord, isEncounterAction } from '../chapterArchive';
import { isRoutineTemplate } from '../attentionCadence';
import { scoreUnifiedBoard } from '../decisionBoard';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

const UNSEEN_BLADE = 'vision.shadow.assassin'; // shadow (who she is) + iron (what she becomes)

const CHORES = UNIFIED_ACTION_TEMPLATES.filter(t => t.routine === true).map(t => t.id);
const STORIES = UNIFIED_ACTION_TEMPLATES
  .filter(t => t.routine !== true && isEncounterAction(t.id))
  .map(t => t.id);

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'morthane', type: 'actor', name: 'Morthane', properties: { actorType: 'individual', quintessence: 1 } });
  graph.addNode({ id: 'retainer', type: 'actor', name: 'Retainer', properties: { actorType: 'individual', quintessence: 1 } });
  graph.addEdge({
    id: 't1', type: 'thread', source: 'asc', target: 'morthane',
    properties: { courtPosition: 'the_first', establishedTick: 0, meetingChoiceRecord: { sparkVisionId: UNSEEN_BLADE } },
  });
  graph.addEdge({
    id: 't2', type: 'thread', source: 'asc', target: 'retainer',
    properties: { courtPosition: 'retinue', establishedTick: 0 },
  });
  return { graph, ascendantId: 'asc', tick: 50, unifiedActions: [], chapterArchive: [] } as unknown as GameState;
}

function cand(templateId: string, finalScore: number, reachPrimary: ReachDomain = 'gold', extra: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    entry: { templateId, locationId: 'nowhere', reachPrimary, encounterType: 'explore', threatRating: 'moderate', requiresPresence: false },
    finalScore,
    valuePerTick: 0.4,
    desireMultiplier: 1,
    ...extra,
  } as unknown as ScoredCandidate;
}

function rngFrom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

describe('THR-2068 E1 — God\'s Will offers only story', () => {
  it('the fixtures are what they claim', () => {
    expect(CHORES.length).toBeGreaterThanOrEqual(3);
    expect(STORIES.length).toBeGreaterThanOrEqual(4);
    for (const id of CHORES.slice(0, 3)) expect(isRoutineTemplate(id)).toBe(true);
    for (const id of STORIES.slice(0, 4)) expect(isRoutineTemplate(id)).toBe(false);
  });

  it('drops three chores from the top list and fills from the ranked list to four story options', () => {
    const top = [
      cand(CHORES[0], 0.9), cand(STORIES[0], 0.85), cand(CHORES[1], 0.8), cand(STORIES[1], 0.75), cand(CHORES[2], 0.7),
    ];
    const ranked = [...top, cand(STORIES[0], 0.6), cand(STORIES[2], 0.5), cand(CHORES[0], 0.45), cand(STORIES[3], 0.4)];
    const event = buildCompulsionEvent(makeState(), 'morthane', 'Morthane', top, rngFrom(7), ranked);
    expect(event).not.toBeNull();
    const ids = (event?.compulsionCandidates ?? []).map(c => c.templateId);
    expect(ids).toEqual([STORIES[0], STORIES[1], STORIES[2], STORIES[3]]);
    expect(ids).toHaveLength(COMPULSION_CANDIDATE_COUNT);
    for (const id of ids) expect(isRoutineTemplate(id)).toBe(false);
  });

  it('makes no offer with one story scene in total', () => {
    const top = [cand(CHORES[0], 0.9), cand(STORIES[0], 0.85), cand(CHORES[1], 0.8)];
    const ranked = [...top, cand(CHORES[2], 0.5)];
    expect(buildCompulsionEvent(makeState(), 'morthane', 'Morthane', top, rngFrom(7), ranked)).toBeNull();
  });

  it('marks an option that fits the path and carries the path title for the fit line', () => {
    const top = [
      cand(STORIES[0], 0.9, 'shadow', { firstPathPull: 1 + FIRST_PATH_PULL }),
      cand(STORIES[1], 0.8, 'gold'),
    ];
    const event = buildCompulsionEvent(makeState(), 'morthane', 'Morthane', top, rngFrom(3), top);
    expect(event?.compulsionCandidates?.[0].fitsPath).toBe(true);
    expect(event?.compulsionCandidates?.[1].fitsPath).toBeUndefined();
    expect(event?.firstPathTitle).toBe('Unseen blade');
    expect(formatFirstPathFitLine(event!.firstPathTitle!)).toBe('Fits the unseen blade.');
  });
});

describe('THR-2068 E2/E3/C1 — compelled work says how it ended', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  const BANDS: Array<[UnifiedActionOutcome, string, string]> = [
    ['critical_success', 'Your will is done.', 'triumphed'],
    ['success', 'Your will is done.', 'held'],
    ['contested_won', 'Your will is done.', 'held'],
    ['success_at_cost', 'Your will is done.', 'held at a cost'],
    ['failure', 'Your will was not enough.', 'broke'],
    ['contested_lost', 'Your will was not enough.', 'broke'],
    ['critical_failure', 'Your will was not enough.', 'collapsed'],
  ];

  function compelledAction(templateId: string, outcome: UnifiedActionOutcome | undefined, compelled = true): UnifiedAction {
    return {
      actionId: `act_${templateId}_${outcome ?? 'none'}`, actorId: 'morthane', templateId, targetId: 'morthane',
      scale: 'personal', source: 'agent', startTick: 40, currentStep: 0, stepProgress: 0, stepDuration: 1,
      resolved: true, outcome, completedAtTick: 50, ...(compelled ? { compelledByGod: true as const } : {}),
    } as unknown as UnifiedAction;
  }

  it.each(BANDS)('a compelled %s archives compelled and raises exactly one done toast', (outcome, lead, word) => {
    const state = makeState();
    const rec = buildChapterRecord(compelledAction(STORIES[0], outcome), state);
    expect(rec?.compelled).toBe(true);
    const events = buildCompulsionDoneEvents([rec!], 50);
    expect(events).toHaveLength(1);
    const name = resolveCompulsionEncounterName(STORIES[0]);
    expect(events[0].id).toBe(`divine_steer_done_act_${STORIES[0]}_${outcome}`);
    expect(events[0].message).toBe(`${lead} ${name}: Morthane ${word}.`);
    expect(events[0].notification?.channel).toBe('toast');
    const done = getTraces().filter(t => (t as { subtype?: string }).subtype === 'compulsion_outcome');
    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({ outcome: 'done', band: outcome, agentId: 'morthane' });
  });

  it('a routine compelled action still archives a record and gets its line', () => {
    const rec = buildChapterRecord(compelledAction(CHORES[0], 'success'), makeState());
    expect(rec).not.toBeNull();
    expect(rec?.compelled).toBe(true);
    const events = buildCompulsionDoneEvents([rec!], 50);
    expect(events).toHaveLength(1);
    expect(events[0].message).toMatch(/^Your will is done\. .+: Morthane held\.$/);
  });

  it('a free choice raises no done line', () => {
    const rec = buildChapterRecord(compelledAction(STORIES[0], 'success', false), makeState());
    expect(rec?.compelled).toBeUndefined();
    expect(buildCompulsionDoneEvents([rec!], 50)).toEqual([]);
  });

  it('a missing outcome reads "unfolded"', () => {
    expect(compulsionDoneMessage('Morthane', 'The Haggle', undefined)).toBe('Your will is done. The Haggle: Morthane unfolded.');
  });
});

describe('THR-2068 E4 — the path leans The First\'s chapters', () => {
  it('firstPathPullFor is ×1.5 on each of Unseen blade\'s two Reaches and 1 elsewhere', () => {
    const path = firstPathFromRecord({ sparkVisionId: UNSEEN_BLADE } as never);
    expect(path?.reach).toBe('iron');
    expect(path?.requiredReach).toBe('shadow');
    expect(firstPathPullFor(path, 'shadow')).toBeCloseTo(1.5, 10);
    expect(firstPathPullFor(path, 'iron')).toBeCloseTo(1.5, 10);
    expect(firstPathPullFor(path, 'gold')).toBe(1);
    expect(firstPathPullFor(null, 'shadow')).toBe(1);
  });

  function decide(agentId: string) {
    const state = makeState();
    const decision = {
      rankedCandidates: [cand('enc.gold', 1, 'gold'), cand('enc.shadow', 1, 'shadow')],
      topCandidates: [cand('enc.gold', 1, 'gold'), cand('enc.shadow', 1, 'shadow')],
      selected: null as ScoredCandidate | null,
    };
    applyFirstPathPull(decision, getFirstPathFor(state.graph, state.ascendantId, agentId), 0);
    return scoreUnifiedBoard({
      graph: state.graph, agentId, tick: 50,
      encounterCandidates: decision.topCandidates,
      strategicCandidates: [],
    });
  }

  it('a shadow scene outranks an equal-EVT gold scene for The First', () => {
    const board = decide('morthane');
    expect(board.winner?.id).toBe('enc.shadow');
    expect(board.winner?.firstPathPull).toBeCloseTo(1.5, 10);
    expect(board.winner?.score).toBeCloseTo(0.4 * 1.5, 10);
    expect(board.entries.find(e => e.id === 'enc.gold')?.firstPathPull).toBeUndefined();
  });

  it('a retinue mortal carries no pull', () => {
    const board = decide('retainer');
    expect(board.entries.every(e => e.firstPathPull === undefined)).toBe(true);
    expect(board.entries.find(e => e.id === 'enc.shadow')?.score).toBeCloseTo(0.4, 10);
  });
});
