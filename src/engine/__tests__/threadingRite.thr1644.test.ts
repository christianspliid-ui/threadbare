/**
 * THR-1644 S1 — one writer, and The First is the first.
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md` § Done when, S1:
 *  (b) threading a mortal with `bind_thread_agent` in a world with no First
 *      writes `the_first`, `storyPhase: 'call'`, `attentionMode: 'pause'`;
 *      `isFirstBonded` is true, the meeting retires, the doom clock wakes;
 *  (c) threading a second mortal writes `watched` and `threadsBoundCount === 2`;
 *  (d) a dismissed rite applies a reception from the seeded stream, identical
 *      across two runs.
 * (a) — the meeting writer's golden pin — is `meetingWriterGolden.thr1644.test.ts`.
 *
 * Threads are written through the real template ops and the real executor, and
 * drained through the orchestrator's real drain, so a regression in any of the
 * three turns this red.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { isFirstBonded, isMeetTheFirstAvailable } from '../meetingEncounter';
import { phaseDoom, resetEventCounter } from '../orchestrator';
import {
  applyThreadingRite,
  candidateFromAgent,
  courtPositionForNewThread,
  riteShapeFor,
  threadsBoundCount,
  type PendingThreadingRite,
} from '../threadingRite';
import {
  collectPendingRites,
  dismissThreadingRite,
  drainThreadingRites,
  getThreadingRiteSnapshot,
  queueThreadingRite,
  riteSeed,
} from '../threadingRiteQueue';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { THREAD_CREATION_TEMPLATES } from '../../data/unified-action-templates';
import { RITE_QUEUE_MAX, RITE_SHORT_MAX_ORDINAL } from '../../data/threading-rite-constants';
import { MEETING_QUINTESSENCE_FLOOR } from '../../data/meeting-nudge-constants';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { FormativeOutcome } from '../../types/meetingEncounter';
import type { GameState } from '../../types/gameState';

const ASC = 'asc';

function makeGraph(mortals: readonly string[] = ['wren', 'hadrel', 'mira', 'orsk', 'tam']): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  for (const id of mortals) {
    g.addNode({
      id,
      type: 'actor',
      name: id[0].toUpperCase() + id.slice(1),
      properties: {
        actorType: 'individual',
        primaryReach: 'iron',
        secondaryReach: 'heart',
        axiologicalProfile: { mercy_ruthlessness: 0.2 },
        domainCapabilities: { iron: 40, heart: 20 },
        quintessence: 0.9,
      },
    });
  }
  return g;
}

function makeState(graph: WorldGraph, tick = 5): GameState {
  return {
    tick,
    seed: 42,
    graph,
    ascendantId: ASC,
    tickEvents: [],
    recentEvents: [],
    doomDefinition: generateDoomClock('breach', 360, 42),
    doomClock: createDoomClockState('breach', 360),
  } as unknown as GameState;
}

/** Thread `target` through the real Agent Thread template ops and executor. */
function threadWithCard(graph: WorldGraph, target: string, tick: number, templateId = 'bind_thread_agent'): void {
  const template = THREAD_CREATION_TEMPLATES.find(t => t.id === templateId)!;
  const step = template.steps[0];
  if (isActionStepBranch(step)) throw new Error('branch');
  const result = executeGraphOps(graph, [...step.onSuccess], { actorId: ASC, targetId: target, locationId: target, tick });
  expect(result.allSucceeded).toBe(true);
}

function threadTo(graph: WorldGraph, target: string) {
  return graph.getOutgoingEdges(ASC, 'thread').find(e => e.target === target)!;
}

beforeEach(() => {
  resetOpCounter();
  resetEventCounter();
  clearTraces();
  enableTracing();
});
afterEach(() => disableTracing());

describe('THR-1644 S1 (b) — the first mortal threaded by card is The First', () => {
  it('writes the_first with the journey fields and the real tick, and retires the meeting', () => {
    const g = makeGraph();
    expect(isMeetTheFirstAvailable(g, ASC, 5)).toBe(true);
    threadWithCard(g, 'wren', 5);

    const edge = threadTo(g, 'wren');
    expect(edge.properties.courtPosition).toBe('the_first');
    expect(edge.properties.storyPhase).toBe('call');
    expect(edge.properties.attentionMode).toBe('pause');
    expect(edge.properties.establishedTick).toBe(5);
    expect(edge.properties.riteShape).toBe('full_no_sensing');
    expect(isFirstBonded(g, ASC)).toBe(true);
    expect(isMeetTheFirstAvailable(g, ASC, 5)).toBe(false);
    expect(threadsBoundCount(g, ASC)).toBe(1);

    const trace = getTraces().find(t => t.category === 'thread.court_position_resolved');
    if (trace?.category !== 'thread.court_position_resolved') throw new Error('no D3 trace');
    expect(trace.cardPosition).toBe('watched');
    expect(trace.resolvedPosition).toBe('the_first');
    expect(trace.reason).toBe('no_first');
    expect(trace.threadsBoundCount).toBe(1);
  });

  it('wakes the doom clock on the next doom phase', () => {
    const g = makeGraph();
    const before = makeState(g);
    expect(before.doomClock.wokeAtTick).toBeNull();
    expect(phaseDoom(before)).toEqual({});

    threadWithCard(g, 'wren', 5);
    const woke = phaseDoom(makeState(g, 6));
    expect(woke.doomClock?.wokeAtTick).toBe(6);
  });

  it('the strong card makes a First the same way', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 7, 'bind_thread_agent_strong');
    expect(threadTo(g, 'wren').properties.courtPosition).toBe('the_first');
  });
});

describe('THR-1644 S1 (c) — later threads keep the card position and count up', () => {
  it('the second mortal threaded is watched, and the god has bound two', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    threadWithCard(g, 'hadrel', 6);
    expect(threadTo(g, 'hadrel').properties.courtPosition).toBe('watched');
    expect(threadTo(g, 'hadrel').properties.storyPhase).toBeUndefined();
    expect(threadTo(g, 'hadrel').properties.riteShape).toBe('short');
    expect(threadsBoundCount(g, ASC)).toBe(2);
  });

  it('the ladder shrinks: short through RITE_SHORT_MAX_ORDINAL, then the bond alone', () => {
    const g = makeGraph();
    const ids = ['wren', 'hadrel', 'mira', 'orsk', 'tam'];
    ids.forEach((id, i) => threadWithCard(g, id, 5 + i));
    const shapes = ids.map(id => threadTo(g, id).properties.riteShape);
    expect(shapes[0]).toBe('full_no_sensing');
    for (let ord = 2; ord <= ids.length; ord++) {
      expect(shapes[ord - 1]).toBe(ord <= RITE_SHORT_MAX_ORDINAL ? 'short' : 'bond_only');
    }
    expect(threadsBoundCount(g, ASC)).toBe(5);
  });

  it('a seeded First (no stored count) counts toward the ordinal', () => {
    const g = makeGraph();
    g.addEdge({ id: 'seeded', source: ASC, target: 'wren', type: 'thread', properties: { courtPosition: 'the_first' } });
    threadWithCard(g, 'hadrel', 5);
    expect(threadTo(g, 'hadrel').properties.courtPosition).toBe('watched');
    expect(threadsBoundCount(g, ASC)).toBe(2);
  });

  it('a cut thread does not lower the count', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    threadWithCard(g, 'hadrel', 6);
    g.removeEdge(threadTo(g, 'hadrel').id);
    threadWithCard(g, 'mira', 7);
    expect(threadsBoundCount(g, ASC)).toBe(3);
  });

  it('the Return cooldown holds the First slot shut for the card too', () => {
    const g = makeGraph();
    g.getNode(ASC)!.properties.firstSlotCooldownUntil = 50;
    expect(courtPositionForNewThread(g, ASC, 'watched', 10)).toEqual({ position: 'watched', reason: 'first_cooldown' });
    expect(courtPositionForNewThread(g, ASC, 'watched', 50)).toEqual({ position: 'the_first', reason: 'no_first' });
  });

  it('a First moved to dormant frees the slot for the meeting and the card alike', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    threadTo(g, 'wren').properties.courtPosition = 'dormant';
    expect(isMeetTheFirstAvailable(g, ASC, 6)).toBe(true);
    expect(courtPositionForNewThread(g, ASC, 'watched', 6).position).toBe('the_first');
  });

  it('a thread to the god\'s own herald plays no rite and makes no First', () => {
    const g = makeGraph(['herald']);
    g.addEdge({ id: 'av', source: 'herald', target: ASC, type: 'avatar_of', properties: {} });
    executeGraphOps(g, [{ op: 'add_edge', edgeType: 'thread', source: '$actor', target: '$target', properties: { tier: 1 } }],
      { actorId: ASC, targetId: 'herald', locationId: 'herald', tick: 3 });
    const edge = threadTo(g, 'herald');
    expect(edge.properties.courtPosition).toBeUndefined();
    expect(edge.properties.ritePending).toBeUndefined();
  });
});

describe('THR-1644 S1 (d) — Bond without a hand is seeded', () => {
  function threadAndDismiss(): { reception: unknown; history: unknown } {
    resetOpCounter();
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    threadWithCard(g, 'hadrel', 6);
    // Queue with a surface present, then wave the open rite through.
    let state = makeState(g, 6);
    state = drainThreadingRites(state, true);
    expect(state.pendingThreadingRite?.agentId).toBe('wren');
    expect(state.pendingThreadingRiteQueue?.map(r => r.agentId)).toEqual(['hadrel']);
    state = { ...state, ...dismissThreadingRite(state) };
    expect(state.pendingThreadingRite?.agentId).toBe('hadrel');
    return {
      reception: threadTo(g, 'wren').properties.bondReception,
      history: g.getNode('wren')!.properties.riteHistory,
    };
  }

  it('a dismissed rite lands the same reception on two runs', () => {
    const first = threadAndDismiss();
    const second = threadAndDismiss();
    expect(first.reception).toBeDefined();
    expect(first).toEqual(second);
    const applied = getTraces().filter(t => t.category === 'rite.applied');
    const last = applied[applied.length - 1];
    if (last?.category !== 'rite.applied') throw new Error('no rite.applied');
    expect(last.handPlayed).toBe(false);
    expect(last.fallbackReason).toBe('dismissed');
    expect(last.poleShifts).toEqual([]);
  });

  it('the seed is world × agent × tick', () => {
    expect(riteSeed(42, 'wren', 5)).toBe(riteSeed(42, 'wren', 5));
    expect(riteSeed(42, 'wren', 5)).not.toBe(riteSeed(42, 'wren', 6));
    expect(riteSeed(42, 'wren', 5)).not.toBe(riteSeed(43, 'wren', 5));
  });
});

describe('THR-1644 S1 — the pending rite', () => {
  it('without a rite surface (S1) every rite resolves at once as Bond without a hand', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    const state = drainThreadingRites(makeState(g), false);
    expect(state.pendingThreadingRite ?? null).toBeNull();
    expect(threadTo(g, 'wren').properties.bondReception).toBeDefined();
    expect(threadTo(g, 'wren').properties.ritePending).toBeUndefined();
    const snap = getThreadingRiteSnapshot(state);
    expect(snap.lastRite).toMatchObject({ agentId: 'wren', shape: 'full_no_sensing', ordinal: 1 });
    const applied = getTraces().find(t => t.category === 'rite.applied');
    if (applied?.category !== 'rite.applied') throw new Error('no rite.applied');
    expect(applied.fallbackReason).toBe('no_surface');
  });

  it('the drain runs once per thread — a second drain finds nothing', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    drainThreadingRites(makeState(g), true);
    expect(collectPendingRites(g, ASC)).toEqual([]);
  });

  it('overflow beyond RITE_QUEUE_MAX resolves bond-only, traced', () => {
    const g = makeGraph();
    const rite = (agentId: string, ordinal: number): PendingThreadingRite =>
      ({ agentId, ascendantId: ASC, ordinal, shape: 'bond_only', tick: 9 });
    let state = makeState(g);
    state = { ...state, pendingThreadingRite: rite('wren', 1), pendingThreadingRiteQueue: [] };
    const extras = ['hadrel', 'mira', 'orsk', 'tam'];
    for (const g2 of extras) g.addEdge({ id: `t_${g2}`, source: ASC, target: g2, type: 'thread', properties: {} });
    extras.forEach((id, i) => { state = { ...state, ...queueThreadingRite(state, rite(id, i + 2), true) }; });
    expect(state.pendingThreadingRiteQueue).toHaveLength(RITE_QUEUE_MAX);
    const overflow = getTraces().filter(t => t.category === 'rite.queued' && t.overflowed);
    expect(overflow).toHaveLength(extras.length - RITE_QUEUE_MAX);
    expect(threadTo(g, 'tam').properties.bondReception).toBeDefined();
  });

  it('absent GameState fields read as no pending rite', () => {
    const snap = getThreadingRiteSnapshot(makeState(makeGraph()));
    expect(snap).toEqual({ pending: null, queue: [], threadsBoundCount: 0, lastRite: null });
  });

  it('a mortal gone before the rite gets no writes, and the miss is traced', () => {
    const g = makeGraph();
    threadWithCard(g, 'wren', 5);
    g.getNode('wren')!.properties.status = 'dead';
    drainThreadingRites(makeState(g), false);
    expect(threadTo(g, 'wren').properties.bondReception).toBeUndefined();
    expect(g.getNode('wren')!.properties.riteHistory).toBeUndefined();
    const applied = getTraces().find(t => t.category === 'rite.applied');
    if (applied?.category !== 'rite.applied') throw new Error('no rite.applied');
    expect(applied.fallbackReason).toBe('agent_missing');
  });
});

describe('THR-1644 S1 — applyThreadingRite on an existing mortal', () => {
  const outcome = (shift: number, erosion: number): FormativeOutcome => ({
    testIndex: 0, templateId: 't', valuePair: 'mercy_ruthlessness', netLean: 0, playedNudgeIds: ['n'],
    band: 'success', writtenPole: 'a', shift, quintessenceErosion: erosion, essenceSpent: 0, prose: '',
  } as FormativeOutcome);

  it('bends the pole by the existing-mortal scale and floors the scar', () => {
    const g = makeGraph(['wren']);
    g.addEdge({ id: 't', source: ASC, target: 'wren', type: 'thread', properties: { courtPosition: 'watched' } });
    const r = applyThreadingRite(g, {
      agentId: 'wren', ascendantId: ASC, tick: 4, shape: 'short', viaMeeting: false,
      formativeOutcomes: [outcome(0.3, 5)], shiftScale: 0.5, handPlayed: true,
      spark: { reach: 'iron', amount: 0.2 },
    });
    expect(r.applied).toBe(true);
    const p = g.getNode('wren')!.properties;
    expect((p.axiologicalProfile as Record<string, number>).mercy_ruthlessness).toBeCloseTo(0.35);
    expect((p.domainCapabilities as Record<string, number>).iron).toBe(60);
    expect(p.quintessence).toBe(MEETING_QUINTESSENCE_FLOOR);
    expect(r.quintessence?.preClamp).toBeCloseTo(0.9 - 5);
  });

  it('a mortal without a profile skips the pole step and still bonds', () => {
    const g = makeGraph(['wren']);
    delete g.getNode('wren')!.properties.axiologicalProfile;
    g.addEdge({ id: 't', source: ASC, target: 'wren', type: 'thread', properties: {} });
    const r = applyThreadingRite(g, {
      agentId: 'wren', ascendantId: ASC, tick: 4, shape: 'bond_only', viaMeeting: false,
      formativeOutcomes: [outcome(0.3, 0)], handPlayed: false, reception: 'awe',
    });
    expect(r.poleShifts).toEqual([]);
    expect(g.getEdge('t')!.properties.bondReception).toBe('awe');
  });
});

describe('THR-1644 S1 — shape ladder and adapter', () => {
  it('riteShapeFor follows D2', () => {
    expect(riteShapeFor(1, true)).toBe('full_meeting');
    expect(riteShapeFor(4, true)).toBe('full_meeting');
    expect(riteShapeFor(1, false)).toBe('full_no_sensing');
    expect(riteShapeFor(5, false, true)).toBe('full_no_sensing');
    expect(riteShapeFor(2, false)).toBe('short');
    expect(riteShapeFor(RITE_SHORT_MAX_ORDINAL + 1, false)).toBe('bond_only');
  });

  it('candidateFromAgent renders the real mortal and refuses a non-individual', () => {
    const g = makeGraph(['wren']);
    const c = candidateFromAgent(g, 'wren');
    expect(c?.name).toBe('Wren');
    expect(c?.primaryReach).toBe('iron');
    expect(c?.reachCapabilities.iron).toBeCloseTo(0.4);
    expect(candidateFromAgent(g, ASC)).toBeNull();
    expect(candidateFromAgent(g, 'nobody')).toBeNull();
  });
});
