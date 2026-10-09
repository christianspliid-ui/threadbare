/**
 * THR-1754 — threading rite S2: the rite on screen, engine half.
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md` § Done when, S2.
 * The browser evidence covers the surface; these pin what the surface reads and
 * writes: the rite plan (D2's shapes, the slot-1 draw, the degrade), the close
 * paths through the one writer (played, waved through, mortal gone), the queue
 * promotion, the chronicle line each path writes, the sheet's rite line, the
 * cast-receipt suppression predicate, and the `riteText` content check.
 *
 * Threads are written through the real Agent Thread template ops and executor
 * and drained through the orchestrator's real drain, as in S1's suite.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { castOpensRite } from '../threadingRite';
import {
  closeThreadingRite,
  drainThreadingRites,
  getThreadingRiteSnapshot,
  isRiteAgentMissing,
  planThreadingRite,
  RITE_BOND_ONLY_TEST,
  RITE_BOND_TEST,
} from '../threadingRiteQueue';
import { resolveBondTest } from '../meetingEncounter';
import { getRiteSheetLine } from '../agentDetail';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { THREAD_CREATION_TEMPLATES } from '../../data/unified-action-templates';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import {
  RITE_BOND_ONLY_HAND_SIZE,
  RITE_EXISTING_MORTAL_SHIFT_SCALE,
  RITE_QUEUE_MAX,
  RITE_SHORT_TEST_COUNT,
  RITE_SURFACE_ENABLED,
} from '../../data/threading-rite-constants';
import {
  firstClaimedMessage,
  riteChronicleLine,
  riteChronicleMissingLine,
  riteChronicleNoHandLine,
  riteOpeningLine,
  ritePlaceName,
  riteReceptionLine,
  riteSheetLine,
  riteSubtitle,
} from '../../data/threading-rite-prose';
import { REACH_VALUE_PAIR } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ASC = 'asc';
const FIRST = 'wren';

function makeGraph(mortals: readonly string[] = ['wren', 'hadrel', 'mira', 'orsk', 'tam', 'ivo']): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'ketterwell', type: 'location', name: 'Ketterwell', properties: { locationSubtype: 'village' } });
  for (const id of mortals) {
    g.addNode({
      id,
      type: 'actor',
      name: id[0].toUpperCase() + id.slice(1),
      properties: {
        actorType: 'individual',
        gender: 'male',
        primaryReach: 'iron',
        secondaryReach: 'heart',
        axiologicalProfile: { mercy_ruthlessness: 0.2 },
        domainCapabilities: { iron: 40, heart: 20 },
        quintessence: 0.9,
      },
    });
    g.addEdge({ id: `loc_${id}`, source: id, target: 'ketterwell', type: 'located_at', properties: {} });
  }
  return g;
}

function makeState(graph: WorldGraph, tick = 5): GameState {
  return { tick, seed: 42, graph, ascendantId: ASC, tickEvents: [], recentEvents: [] } as unknown as GameState;
}

/** Thread `target` through the real Agent Thread template ops and executor. */
function threadWithCard(graph: WorldGraph, target: string, tick: number): void {
  const template = THREAD_CREATION_TEMPLATES.find(t => t.id === 'bind_thread_agent')!;
  const step = template.steps[0];
  if (isActionStepBranch(step)) throw new Error('branch');
  const result = executeGraphOps(graph, [...step.onSuccess], { actorId: ASC, targetId: target, locationId: target, tick });
  expect(result.allSucceeded).toBe(true);
}

/** A world whose First (`wren`) is already bonded, as `?seeded` starts. */
function seededWorld(): GameState {
  const g = makeGraph();
  threadWithCard(g, FIRST, 1);
  let s = drainThreadingRites(makeState(g, 1), true);
  s = { ...s, ...closeThreadingRite(s, { kind: 'no_hand', reason: 'dismissed' }) };
  return s;
}

/** Thread `target` at `tick` and drain with the surface on. */
function threadAndDrain(state: GameState, target: string, tick: number): GameState {
  threadWithCard(state.graph, target, tick);
  return drainThreadingRites({ ...state, tick }, true);
}

function threadTo(g: WorldGraph, target: string) {
  return g.getOutgoingEdges(ASC, 'thread').find(e => e.target === target)!;
}

beforeEach(() => {
  resetOpCounter();
  enableTracing();
  clearTraces();
});
afterEach(() => {
  disableTracing();
});

describe('THR-1754 S2 — the surface is on', () => {
  it('RITE_SURFACE_ENABLED is on, so a rite waits for the player', () => {
    expect(RITE_SURFACE_ENABLED).toBe(true);
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    expect(s.pendingThreadingRite?.agentId).toBe('hadrel');
    expect(s.pendingThreadingRite?.shape).toBe('short');
    expect(threadTo(s.graph, 'hadrel').properties.bondReception).toBeUndefined();
  });
});

describe('THR-1754 S2 — only a mounted surface holds a rite', () => {
  it('a headless run (no surface mounted) resolves the rite at once, no hand', () => {
    const s = seededWorld();
    threadWithCard(s.graph, 'hadrel', 10);
    const headless = drainThreadingRites({ ...s, tick: 10, riteSurfaceMounted: undefined });
    expect(headless.pendingThreadingRite ?? null).toBeNull();
    expect(threadTo(headless.graph, 'hadrel').properties.bondReception).toBeDefined();
  });

  it('a session with the surface mounted queues it for the player', () => {
    const s = seededWorld();
    threadWithCard(s.graph, 'hadrel', 10);
    const mounted = drainThreadingRites({ ...s, tick: 10, riteSurfaceMounted: true });
    expect(mounted.pendingThreadingRite?.agentId).toBe('hadrel');
  });
});

describe('THR-1754 S2 — planning the rite (D2)', () => {
  it('a short rite draws one converted slot-1 test for the primary reach, deterministically', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    const rite = s.pendingThreadingRite!;
    const plan = planThreadingRite(s.graph, rite, s.seed);
    expect(plan.shape).toBe('short');
    expect(plan.degraded).toBe(false);
    expect(plan.tests).toHaveLength(RITE_SHORT_TEST_COUNT);
    expect(plan.tests[0].instance.category).toBe('axiological');
    expect(plan.tests[0].test.valuePair).toBe(REACH_VALUE_PAIR.iron);
    const again = planThreadingRite(s.graph, rite, s.seed);
    expect(again.tests.map(t => t.instance.templateId)).toEqual(plan.tests.map(t => t.instance.templateId));
  });

  it('a short rite with no fitting test degrades to the bond alone, traced', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    // An archetype no slot-1 template admits does not starve the draw (`archetypeIds`
    // empty = all); a missing mortal does — `candidateFromAgent` returns null.
    s.graph.getNode('hadrel')!.properties.actorType = 'group';
    const plan = planThreadingRite(s.graph, s.pendingThreadingRite!, s.seed);
    expect(plan).toMatchObject({ shape: 'bond_only', degraded: true, tests: [] });
    expect(getTraces().some(t => t.category === 'rite.degraded')).toBe(true);
  });

  it('the fourth mortal threaded (counting the First) plays the bond alone', () => {
    let s = seededWorld();
    for (const [i, id] of ['hadrel', 'mira'].entries()) {
      s = threadAndDrain(s, id, 10 + i);
      s = { ...s, ...closeThreadingRite(s, { kind: 'no_hand', reason: 'dismissed' }) };
    }
    s = threadAndDrain(s, 'orsk', 20);
    expect(s.pendingThreadingRite).toMatchObject({ agentId: 'orsk', ordinal: 4, shape: 'bond_only' });
    expect(planThreadingRite(s.graph, s.pendingThreadingRite!, s.seed).tests).toHaveLength(0);
  });

  it('the bond-only hand is the meeting bond test, cut to its first two cards', () => {
    expect(RITE_BOND_ONLY_TEST.nudges).toHaveLength(RITE_BOND_ONLY_HAND_SIZE);
    expect(RITE_BOND_ONLY_TEST.nudges.map(n => n.name)).toEqual(['Still the room', 'Say their name']);
    expect(RITE_BOND_ONLY_TEST.setup).toBe(MEETING_BOND_TEST.setup);
    expect(RITE_BOND_ONLY_TEST.factorLines).toEqual(MEETING_BOND_TEST.factorLines);
    // The meeting's per-Hunger voice speaks of a first soul; every rite has its own line.
    expect(RITE_BOND_ONLY_TEST.godVoiceByHunger).toEqual({});
    expect(RITE_BOND_TEST.godVoiceByHunger).toEqual({});
    expect(RITE_BOND_TEST.nudges).toEqual(MEETING_BOND_TEST.nudges);
  });
});

describe('THR-1754 S2 — closing the rite through the one writer', () => {
  it('a played short rite bends the pole at the existing-mortal scale, lands the reception, writes the history and one chronicle line', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    const plan = planThreadingRite(s.graph, s.pendingThreadingRite!, s.seed);
    const before = (s.graph.getNode('hadrel')!.properties.axiologicalProfile as Record<string, number>)[plan.tests[0].test.valuePair] ?? 0;
    const bondOutcome = resolveBondTest(MEETING_BOND_TEST, [], 7);
    const formative = { valuePair: plan.tests[0].test.valuePair, shift: 0.2, quintessenceErosion: 0 } as never;

    const closed = closeThreadingRite(s, { kind: 'played', formativeOutcomes: [formative], bondOutcome, shape: 'short' });

    expect(closed.result?.applied).toBe(true);
    expect(closed.result?.poleShifts[0]).toMatchObject({ before, scale: RITE_EXISTING_MORTAL_SHIFT_SCALE });
    expect(closed.result?.poleShifts[0].after).toBeCloseTo(before + 0.2 * RITE_EXISTING_MORTAL_SHIFT_SCALE);
    expect(threadTo(s.graph, 'hadrel').properties.bondReception).toBe(bondOutcome.reception);
    expect(s.graph.getNode('hadrel')!.properties.riteHistory).toEqual([{ tick: 10, shape: 'short', reception: bondOutcome.reception }]);
    expect(closed.event?.message).toBe(riteChronicleLine('Hadrel', bondOutcome.reception));
    expect(closed.pendingThreadingRite).toBeNull();
    const snap = getThreadingRiteSnapshot({ ...s, ...closed });
    expect(snap.lastRite).toMatchObject({ agentId: 'hadrel', shape: 'short', reception: bondOutcome.reception });
    expect(snap.threads.find(t => t.agentId === 'hadrel')).toMatchObject({ riteShape: 'short', bondReception: bondOutcome.reception });
  });

  it('Bond without a hand lands the seeded no-hand reception and says so', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    const closed = closeThreadingRite(s, { kind: 'no_hand', reason: 'dismissed' });
    const reception = threadTo(s.graph, 'hadrel').properties.bondReception as string;
    expect(reception).toBeDefined();
    expect(closed.event?.message).toBe(riteChronicleNoHandLine('Hadrel', reception as never));
    const applied = getTraces().filter(t => t.category === 'rite.applied' && t.agentId === 'hadrel');
    expect(applied.at(-1)).toMatchObject({ handPlayed: false, fallbackReason: 'dismissed' });
  });

  it('Bond without a hand at the bond keeps the played tests but says no hand was played', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    const plan = planThreadingRite(s.graph, s.pendingThreadingRite!, s.seed);
    const bondOutcome = resolveBondTest(MEETING_BOND_TEST, [], 7);
    const formative = { valuePair: plan.tests[0].test.valuePair, shift: 0.2, quintessenceErosion: 0 } as never;

    const closed = closeThreadingRite(s, { kind: 'played', formativeOutcomes: [formative], bondOutcome, shape: 'short', handPlayed: false });

    expect(closed.result?.applied).toBe(true);
    expect(closed.result?.poleShifts).toHaveLength(1);
    expect(closed.event?.message).toBe(riteChronicleNoHandLine('Hadrel', bondOutcome.reception));
    const applied = getTraces().filter(t => t.category === 'rite.applied' && t.agentId === 'hadrel');
    expect(applied.at(-1)).toMatchObject({ handPlayed: false, fallbackReason: 'dismissed' });
  });

  it('a mortal who died before the rite opened gets no writes and a too-late line', () => {
    const s = threadAndDrain(seededWorld(), 'hadrel', 10);
    s.graph.getNode('hadrel')!.properties.deceased = true;
    expect(isRiteAgentMissing(s.graph, s.pendingThreadingRite!)).toBe(true);
    const closed = closeThreadingRite(s, { kind: 'no_hand', reason: 'agent_missing' });
    expect(closed.result?.applied).toBe(false);
    expect(threadTo(s.graph, 'hadrel').properties.bondReception).toBeUndefined();
    expect(closed.event?.message).toBe(riteChronicleMissingLine('Hadrel'));
  });

  it('closing promotes the next queued rite', () => {
    let s = seededWorld();
    s = threadAndDrain(s, 'hadrel', 10);
    s = threadAndDrain(s, 'mira', 10);
    expect(s.pendingThreadingRite?.agentId).toBe('hadrel');
    expect(s.pendingThreadingRiteQueue?.map(r => r.agentId)).toEqual(['mira']);
    const closed = closeThreadingRite(s, { kind: 'no_hand', reason: 'dismissed' });
    expect(closed.pendingThreadingRite?.agentId).toBe('mira');
    expect(closed.pendingThreadingRiteQueue).toEqual([]);
  });

  it('closing with nothing pending is a no-op', () => {
    const s = seededWorld();
    expect(closeThreadingRite(s, { kind: 'no_hand', reason: 'dismissed' })).toMatchObject({ result: null, event: null });
  });
});

describe('THR-1754 S2 — the chronicle at the drain', () => {
  it('a card-route First prints the meeting\'s own claimed line', () => {
    const g = makeGraph();
    threadWithCard(g, FIRST, 3);
    const s = drainThreadingRites(makeState(g, 3), true);
    expect(s.pendingThreadingRite?.shape).toBe('full_no_sensing');
    expect(s.recentEvents.map(e => e.message)).toContain(firstClaimedMessage('Wren'));
  });

  it('an overflowing thread says it took the thread without a rite', () => {
    let s = seededWorld();
    const extras = ['hadrel', 'mira', 'orsk', 'tam', 'ivo'];
    for (const id of extras) threadWithCard(s.graph, id, 10);
    s = drainThreadingRites({ ...s, tick: 10 }, true);
    const overflowed = extras.length - 1 - RITE_QUEUE_MAX;
    expect(s.recentEvents.filter(e => e.message.startsWith('Too many threads at once:'))).toHaveLength(overflowed);
  });
});

describe('THR-1754 S2 — the cast receipt and the sheet', () => {
  it('castOpensRite is true for an Agent Thread on an unthreaded living mortal only', () => {
    const s = seededWorld();
    expect(castOpensRite(s.graph, ASC, 'bind_thread_agent', 'hadrel')).toBe(true);
    expect(castOpensRite(s.graph, ASC, 'bind_thread_agent_strong', 'hadrel')).toBe(true);
    expect(castOpensRite(s.graph, ASC, 'bind_thread_agent', FIRST)).toBe(false); // already threaded
    expect(castOpensRite(s.graph, ASC, 'observe_agent', 'hadrel')).toBe(false);
    expect(castOpensRite(s.graph, ASC, 'bind_thread_agent', 'hadrel', false)).toBe(false);
    s.graph.getNode('mira')!.properties.deceased = true;
    expect(castOpensRite(s.graph, ASC, 'bind_thread_agent', 'mira')).toBe(false);
  });

  it('the sheet reads the newest rite in the calendar\'s words', () => {
    const s = seededWorld();
    const reception = threadTo(s.graph, FIRST).properties.bondReception as never;
    expect(getRiteSheetLine(s.graph, FIRST)).toBe(riteSheetLine(0, 0, reception));
    expect(getRiteSheetLine(s.graph, FIRST)).toBe(`Bound in spring, Year 1 — took your thread in ${reception}.`);
    expect(getRiteSheetLine(s.graph, 'hadrel')).toBeUndefined();
  });
});

describe('THR-1754 S2 — the rite\'s words', () => {
  it('the opening names the real mortal and place, and never leaves a slot empty', () => {
    expect(riteOpeningLine('Hadrel Vosk', 'male', 'iron', 'Ketterwell'))
      .toBe('Your thread finds Hadrel Vosk in Ketterwell. He does not look up from the work. He feels it all the same.');
    for (const reach of REACH_DOMAINS) {
      for (const gender of ['male', 'female', undefined]) {
        const line = riteOpeningLine('Mira', gender, reach, '');
        expect(line).not.toMatch(/\{|\}/);
        expect(line).toContain('Mira');
      }
    }
    expect(riteOpeningLine('Mira', 'female', undefined, null)).toContain('where she stands');
  });

  it('reception lines and subtitles read as plain sentences', () => {
    expect(riteReceptionLine('Hadrel', 'male', 'doubt')).toBe('Hadrel takes your thread in doubt. He will carry it, and question it.');
    expect(riteReceptionLine('Mira', undefined, 'devotion')).toBe('Mira takes your thread as a gift. They will carry it gladly.');
    expect(riteSubtitle(2)).toBe('Your second thread');
    expect(riteSubtitle(5)).toBe('Your fifth thread');
    expect(riteSubtitle(12)).toBe('Your 12th thread');
    expect(riteSubtitle(23)).toBe('Your 23rd thread');
  });
});

describe('THR-1754 S2 — riteText on the 40 slot-1 meeting tests', () => {
  const slotOne = ENRICHED_DILEMMA_LIBRARY.filter(t =>
    t.category === 'axiological' && t.test && Object.values(REACH_VALUE_PAIR).includes(t.targetValuePair as never));

  it('covers all 40 slot-1 templates', () => {
    expect(slotOne).toHaveLength(40);
  });

  it('no line the rite shows assumes a stranger who cannot feel the god', () => {
    const strangerWording = /do not know you are here|does not know you are here|a soul you sense|among the crowd/i;
    for (const t of slotOne) {
      const godVoice = t.riteText?.godVoice ?? t.godVoice;
      const setup = t.riteText?.setup ?? t.setup;
      expect(`${t.id}: ${godVoice} ${setup}`).not.toMatch(strangerWording);
    }
  });
});

describe('THR-1754 S2 — a coordinate never reaches the player', () => {
  it('a generated wilderness name reads as plain words in the opening and the test prose', () => {
    expect(riteOpeningLine('Nesrin', undefined, 'gold', 'Wilderness (30, 22)')).toMatch(/^Your thread finds Nesrin out in the wilderness\. /);
    expect(riteOpeningLine('Nesrin', 'female', 'gold', 'Hex (4, -2)')).toContain('where she stands');
    expect(ritePlaceName('Wilderness (30, 22)')).toBe('the wilderness');
    expect(ritePlaceName('Ketterwell')).toBe('Ketterwell');
    expect(ritePlaceName('')).toBe('the wilderness');
  });
});
