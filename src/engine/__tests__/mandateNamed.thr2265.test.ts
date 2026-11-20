/**
 * THR-2265 — the Mandate arrives with its first mention (decision on THR-2262).
 *
 * One predicate, `mandateNamed`, gates both the `mandate` rail row (trigger
 * `mandate_named`, which jumps the arrival queue) and the card hint "Counts toward
 * your Mandate." — so the screen never credits a goal it has not shown.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { SPHERE_NAMES } from '../../types/index';
import {
  EMPTY_ARRIVAL_LEDGER,
  readyQueuedSurfaces,
  releaseOpeningArrivals,
  seedArrivalLedger,
  selectOpeningReveal,
  type OpeningArrivalLedger,
} from '../openingReveal';
import { mandateNamed, mandateNamedReason, MANDATE_NAMED_GIFT_BEAT } from '../mandateNamed';
import { OPENING_REVEAL_TABLE } from '../../data/opening-reveal-table';
import { MANDATE_CARD_HINT } from '../../data/ascendant-bar-content';
import { buildNudgePhaseModel } from '../views/stage/buildNudgePhaseModel';

const ENCOUNTER_ID = 'encounter.deep_descent';
const BOND_TICK = 10;
const CREDIT = { entityId: 'loc.x', sphere: 'mind', points: 1, cause: 'god', sources: [], source: 'deed' };

interface Opts {
  staged?: boolean;
  tick?: number;
  resolvedBeats?: string[];
  /** A resolved First chapter at this tick that credited the Mandate. */
  creditedChapterAt?: number;
  /** A plain resolved First chapter at this tick. */
  chapterAt?: number[];
  recentDeeds?: boolean;
}

function makeState(o: Opts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual', gender: 'female' } });
  graph.addEdge({ id: 'e1', type: 'thread', source: 'asc', target: 'elara', properties: { courtPosition: 'the_first' } });
  const chapterTicks = [...(o.chapterAt ?? []), ...(o.creditedChapterAt !== undefined ? [o.creditedChapterAt] : [])];
  return {
    graph,
    ascendantId: 'asc',
    tick: o.tick ?? BOND_TICK + 5,
    openingRevealStaged: o.staged === false ? undefined : true,
    doomClock: { wokeAtTick: BOND_TICK },
    ascendantBeats: {
      spineCursor: 1,
      pending: null,
      lastBeatTurn: 0,
      history: (o.resolvedBeats ?? ['beat.spine.opening']).map(beatId => ({
        beatId, kind: 'spine', resolvedTurn: 1, outcome: 'success', grantedActionIds: [], seededNodeIds: [],
      })),
    },
    unifiedActions: o.creditedChapterAt !== undefined
      ? [{ actionId: 'act-c', templateId: ENCOUNTER_ID, actorId: 'elara', resolved: true, currentStep: 0, mandateDeedCredits: [CREDIT] }]
      : [],
    chapterArchive: chapterTicks.map((t, i) => ({
      actionId: `act-${i}`, templateId: ENCOUNTER_ID, templateName: 'x', actorId: 'elara', actorName: 'Elara',
      targetId: 'elara', targetName: 'Elara', scale: 'personal', startTick: 0,
      resolvedTick: t, resolved: true, threaded: true, participants: [], openingProse: '', steps: [],
    })),
    mandateState: o.recentDeeds ? { recentDeeds: [{ tick: 12, actorId: 'elara' }] } : null,
    rivalStates: [],
  } as unknown as GameState;
}

const at = (tick: number, chapters: number[] = []) => ({
  tick,
  chaptersClosedSince: (t: number) => chapters.filter(c => c > t).length,
});

describe('THR-2265 · mandateNamed', () => {
  it('reads the four ways the Mandate is named, and false before any of them', () => {
    expect(mandateNamedReason(makeState())).toBeNull();
    expect(mandateNamedReason(makeState({ staged: false }))).toBe('not_staged');
    expect(mandateNamedReason(makeState({ resolvedBeats: ['beat.spine.opening', MANDATE_NAMED_GIFT_BEAT] }))).toBe('seat');
    expect(mandateNamedReason(makeState({ creditedChapterAt: 14 }))).toBe('deed');
    // Durable after the resolved action is pruned.
    expect(mandateNamedReason(makeState({ recentDeeds: true }))).toBe('deed');
  });

  it('fails soft to named', () => {
    const broken = { openingRevealStaged: true, get unifiedActions() { throw new Error('x'); } } as unknown as GameState;
    expect(mandateNamed(broken)).toBe(true);
  });

  it('the mandate row is the only row that jumps the queue', () => {
    expect(OPENING_REVEAL_TABLE.filter(r => r.jumpsQueue).map(r => r.surface)).toEqual(['mandate']);
    expect(OPENING_REVEAL_TABLE.find(r => r.surface === 'mandate')!.trigger).toEqual({ kind: 'mandate_named' });
  });
});

describe('THR-2265 · the rail row arrives with the first mention', () => {
  it('(a) a credited chapter before the Seat brings the Mandate at that chapter, alone; Doom stays queued', () => {
    // Notables is ready and due on the same chapter close: the Mandate is this chapter's arrival.
    const beats = ['beat.spine.opening', 'beat.spine.the_first_word'];
    const before = makeState({ tick: 18, resolvedBeats: beats, chapterAt: [14] });
    let l: OpeningArrivalLedger = seedArrivalLedger(['chapter_ledger'], 15);
    expect(readyQueuedSurfaces(selectOpeningReveal(before))).toEqual(['chapter_ledger', 'notables']);
    expect(selectOpeningReveal(before).rows.mandate.revealed).toBe(false);

    const after = makeState({ tick: 20, resolvedBeats: beats, chapterAt: [14], creditedChapterAt: 19 });
    l = releaseOpeningArrivals(l, readyQueuedSurfaces(selectOpeningReveal(after)), at(20, [14, 19]));
    expect(l.arrived.mandate).toBe(20);
    expect(l.lastArrivalTick).toBe(20);
    expect(l.arrived.notables).toBeUndefined();
    const read = selectOpeningReveal(after, { ledger: l });
    expect(read.rows.mandate).toEqual({ revealed: true, reason: 'queued', readyReason: 'mandate_named' });
    expect(read.rows.doom).toEqual({ revealed: false, reason: 'waiting:beat.spine.the_seat' });
  });

  it('(b) the Seat first, no credit yet: the Mandate arrives on the Seat render, ahead of Doom and Rivals', () => {
    // An arrival just happened (tick 15), so nothing else is due on tick 16.
    let l: OpeningArrivalLedger = { arrived: { chapter_ledger: 15 }, lastArrivalTick: 15 };
    const seat = makeState({ tick: 16, resolvedBeats: ['beat.spine.opening', MANDATE_NAMED_GIFT_BEAT] });
    const ready = readyQueuedSurfaces(selectOpeningReveal(seat));
    expect(ready).toEqual(expect.arrayContaining(['doom', 'mandate', 'investiture']));
    l = releaseOpeningArrivals(l, ready, at(16));
    expect(Object.keys(l.arrived).sort()).toEqual(['chapter_ledger', 'mandate']);
    expect(l.arrived.mandate).toBe(16);
    const read = selectOpeningReveal(seat, { ledger: l });
    expect(read.queued[0]).toBe('doom');
    expect(read.rows.rivals.revealed).toBe(false);
  });

  it('(c) after the Mandate arrives, the next row still waits one closed chapter', () => {
    const seat = makeState({ tick: 16, resolvedBeats: ['beat.spine.opening', MANDATE_NAMED_GIFT_BEAT] });
    const ready = readyQueuedSurfaces(selectOpeningReveal(seat));
    let l = releaseOpeningArrivals({ arrived: { chapter_ledger: 15 }, lastArrivalTick: 15 }, ready, at(16));
    expect(releaseOpeningArrivals(l, ready, at(17))).toBe(l);
    expect(releaseOpeningArrivals(l, ready, at(20, [15]))).toBe(l); // a chapter before the arrival does not count
    l = releaseOpeningArrivals(l, ready, at(22, [21]));
    expect(l.arrived.doom).toBe(22);
  });

  it('a first-render seed with the Mandate ready is not an arrival burst', () => {
    const l = releaseOpeningArrivals(EMPTY_ARRIVAL_LEDGER, ['doom', 'mandate'], at(16));
    expect(Object.keys(l.arrived)).toEqual(['mandate']);
  });
});

// ─── (d) / (e): the card hint ──────────────────────────────────────

const MIND: StepNudge = { id: 'count_the_cost', name: 'Count What It Costs', sphere: 'mind', essenceCost: 3, forecastDelta: 0.05, effectLine: 'She reckons it.' };

const STEP = {
  reach: 'shadow', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [],
  failBehavior: 'continue_weakened', narrativeTemplate: 'The ledger is open.', purposeLine: 'Balance the ledger',
  nudges: [MIND],
} as unknown as ActionStep;

const TEMPLATE = {
  id: 'test.mandate_named', rarityTier: 1, intrinsicTier: 'background', name: 'The Ledger', reach: 'shadow',
  crudType: 'read', scale: 'local', steps: [STEP], apCost: 1, actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'The ledger is open.', success: 'It balances.', failure: 'It does not.' },
} as unknown as UnifiedActionTemplate;

const ACTION = {
  actionId: 'ua_m', actorId: 'elara', templateId: 'test.mandate_named', targetId: 'elara',
  scale: 'local', source: 'agent', startTick: 3, currentStep: 0, stepProgress: 0, stepDuration: 2,
  resolved: false, stepOutcomes: [],
} as unknown as UnifiedAction;

function hintOf(state: GameState): string | undefined {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 30;
  const full = {
    ...state,
    essencePool: pool,
    unlockedActionIds: [],
    ascendantIdentity: { sphereAlignment: { primary: 'mind', secondary: 'spirit' }, hungerId: 'hunger.witness' },
    mandateDefinition: { id: 'm', runtimeKind: 'sphere_growth', primarySphere: 'mind', secondarySphere: 'spirit' },
  } as unknown as GameState;
  const phase = buildNudgePhaseModel({ template: TEMPLATE, activeAction: ACTION, step: STEP, graph: full.graph, gameState: full })!;
  return phase.cards.find(c => c.id === MIND.id)?.mandateHint;
}

describe('THR-2265 · the card hint waits for the row', () => {
  it('(d) absent while the Mandate is unnamed, present once the Seat or a credit names it', () => {
    expect(hintOf(makeState())).toBeUndefined();
    expect(hintOf(makeState({ resolvedBeats: ['beat.spine.opening', MANDATE_NAMED_GIFT_BEAT] }))).toBe(MANDATE_CARD_HINT);
    expect(hintOf(makeState({ creditedChapterAt: 14 }))).toBe(MANDATE_CARD_HINT);
  });

  it('(e) an unstaged run shows the row and the hint from the bond', () => {
    const s = makeState({ staged: false });
    expect(selectOpeningReveal(s).rows.mandate).toEqual({ revealed: true, reason: 'not_staged' });
    expect(hintOf(s)).toBe(MANDATE_CARD_HINT);
  });
});
