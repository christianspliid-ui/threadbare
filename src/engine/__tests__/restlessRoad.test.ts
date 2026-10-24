/**
 * THR-1959 — the restless road (THR-1218 D6 / E5): when it is due, where she
 * goes, what it writes on the thread edge, its trace, and its Chronicle line.
 *
 * Plan: Docs/plans/2026-10-16-thr-1218-encounter-firing-rhythm.md (E5, UI pillar).
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  buildRestlessRoadEvent,
  emitRestlessRoadTrace,
  findRestlessRoadDestination,
  lastRestlessRoadTick,
  recordRestlessRoad,
  restlessRoadDue,
} from '../restlessRoad';
import {
  RESTLESS_ROAD_COOLDOWN_TICKS,
  RESTLESS_ROAD_MAX_HEXES,
  STORY_DROUGHT_TICKS,
} from '../../data/agent-behavior-constants';
import { RESTLESS_ROAD_FALLBACK_PLACE } from '../../data/attention-content';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { EncounterCacheEntry } from '../encounterCache';

const CHORE = 'encounter.mend_equipment';
const STORY = 'encounter.deep_descent';
const OTHER_STORY = 'encounter.other_story';
const AGENT = 'agent_1';
const ESTABLISHED = 10;

function makeGraph(opts: { attentionMode?: 'pause' | 'auto_resolve'; extra?: Record<string, unknown> } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: AGENT, type: 'actor', name: 'Thessa', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: AGENT, type: 'thread',
    properties: {
      courtPosition: 'the_first',
      tier: 1,
      attentionMode: opts.attentionMode ?? 'pause',
      ticksAtCurrentTier: 0,
      establishedTick: ESTABLISHED,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
      ...(opts.extra ?? {}),
    } as unknown as Record<string, unknown>,
  });
  // Home at (0,0); places at 2, 2 (tie), 5 and 40 hexes east; a sublocation of the 2-hex town.
  g.addNode({ id: 'loc_home', type: 'location', name: 'Hearth', properties: { hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'loc_b', type: 'location', name: 'Bramble', properties: { hexCol: 2, hexRow: 0 } });
  g.addNode({ id: 'loc_a', type: 'location', name: 'Greywater', properties: { hexCol: 0, hexRow: 2 } });
  g.addNode({ id: 'loc_far', type: 'location', name: 'Farhold', properties: { hexCol: 5, hexRow: 0 } });
  g.addNode({ id: 'loc_edge', type: 'location', name: 'Edge', properties: { hexCol: 40, hexRow: 0 } });
  g.addNode({ id: 'loc_a_inn', type: 'location', name: 'The Drowned Inn', properties: { parentLocationId: 'loc_a' } });
  return g;
}

const entry = (templateId: string, locationId: string, questPriority = 1) => ({ templateId, locationId, questPriority }) as EncounterCacheEntry;
const everything = (list: EncounterCacheEntry[]) => list;

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('when the road is due', () => {
  it('waits for STORY_DROUGHT_TICKS of drought', () => {
    const g = makeGraph();
    expect(restlessRoadDue(g, AGENT, ESTABLISHED + STORY_DROUGHT_TICKS - 1)).toBeNull();
    expect(restlessRoadDue(g, AGENT, ESTABLISHED + STORY_DROUGHT_TICKS)).toBe(STORY_DROUGHT_TICKS);
  });

  it('counts the drought from her latest story start', () => {
    const g = makeGraph({ extra: { lastStoryChapterStartTick: 200 } });
    expect(restlessRoadDue(g, AGENT, 200 + STORY_DROUGHT_TICKS - 1)).toBeNull();
    expect(restlessRoadDue(g, AGENT, 200 + STORY_DROUGHT_TICKS)).toBe(STORY_DROUGHT_TICKS);
  });

  it('is never due for a mortal the player does not follow in pause mode', () => {
    expect(restlessRoadDue(makeGraph({ attentionMode: 'auto_resolve' }), AGENT, 1000)).toBeNull();
  });

  it('waits RESTLESS_ROAD_COOLDOWN_TICKS after any check, whatever its outcome', () => {
    const g = makeGraph();
    const t = ESTABLISHED + STORY_DROUGHT_TICKS;
    recordRestlessRoad(g, AGENT, t, 'no_destination');
    expect(restlessRoadDue(g, AGENT, t + RESTLESS_ROAD_COOLDOWN_TICKS - 1)).toBeNull();
    expect(restlessRoadDue(g, AGENT, t + RESTLESS_ROAD_COOLDOWN_TICKS)).not.toBeNull();
    expect(lastRestlessRoadTick(g, AGENT)).toBeNull(); // only set_out stamps it
  });

  it('waits out her story breath — every story is held back then, so the road would be the breath talking', () => {
    const t = ESTABLISHED + STORY_DROUGHT_TICKS + 10;
    const g = makeGraph({ extra: { lastStoryChapterEndTick: t - 1 } });
    expect(restlessRoadDue(g, AGENT, t)).toBeNull();
    expect(restlessRoadDue(g, AGENT, t + 30)).not.toBeNull();
  });

  it('a future check tick (a save edit) does not hold her', () => {
    const g = makeGraph({ extra: { restlessRoadCheckTick: 5000 } });
    expect(restlessRoadDue(g, AGENT, ESTABLISHED + STORY_DROUGHT_TICKS)).not.toBeNull();
  });

  it('set_out stamps lastRestlessRoadTick as well as the check', () => {
    const g = makeGraph();
    recordRestlessRoad(g, AGENT, 90, 'set_out');
    expect(lastRestlessRoadTick(g, AGENT)).toBe(90);
  });
});

describe('where she goes', () => {
  it('picks the nearest place holding a story; ties go to the lower location id', () => {
    const g = makeGraph();
    const dest = findRestlessRoadDestination(g, 'loc_home', [
      entry(STORY, 'loc_far'),
      entry(STORY, 'loc_b'),
      entry(OTHER_STORY, 'loc_a'),
    ], everything);
    expect(dest).toMatchObject({ locationId: 'loc_a', hexDistance: 2, storyTemplateIds: [OTHER_STORY] });
    expect(dest?.targetEntry.templateId).toBe(OTHER_STORY);
  });

  it('ignores chores, her own place, and places beyond RESTLESS_ROAD_MAX_HEXES', () => {
    const g = makeGraph();
    expect(RESTLESS_ROAD_MAX_HEXES).toBeLessThan(40);
    const dest = findRestlessRoadDestination(g, 'loc_home', [
      entry(CHORE, 'loc_a'),
      entry(STORY, 'loc_home'),
      entry(STORY, 'loc_edge'),
    ], everything);
    expect(dest).toBeNull();
  });

  it('skips a place whose stories she may no longer draw', () => {
    const g = makeGraph();
    const dest = findRestlessRoadDestination(g, 'loc_home', [
      entry(STORY, 'loc_a'),
      entry(OTHER_STORY, 'loc_far'),
    ], list => list.filter(e => e.templateId !== STORY));
    expect(dest?.locationId).toBe('loc_far');
  });

  it('targets the drawable story with the highest questPriority, and asks mayStillDraw per place', () => {
    const g = makeGraph();
    const asked: string[] = [];
    const dest = findRestlessRoadDestination(g, 'loc_home', [
      entry(STORY, 'loc_b', 2),
      entry(OTHER_STORY, 'loc_b', 5),
      entry(STORY, 'loc_far', 9),
    ], (list, placeId) => { asked.push(placeId); return list; });
    expect(dest?.locationId).toBe('loc_b');
    expect(dest?.targetEntry.templateId).toBe(OTHER_STORY);
    expect(asked).toEqual(['loc_b']); // nearest first; stops at the first that passes
  });

  it('a place whose stories fail the pipeline from there is passed over', () => {
    const g = makeGraph();
    const dest = findRestlessRoadDestination(g, 'loc_home', [
      entry(STORY, 'loc_a'),
      entry(STORY, 'loc_far'),
    ], (list, placeId) => (placeId === 'loc_a' ? [] : list));
    expect(dest?.locationId).toBe('loc_far');
  });

  it('reads a sublocation at its parent\'s hex', () => {
    const g = makeGraph();
    const dest = findRestlessRoadDestination(g, 'loc_home', [entry(STORY, 'loc_a_inn')], everything);
    expect(dest).toMatchObject({ locationId: 'loc_a_inn', hexDistance: 2, storyTemplateIds: [STORY] });
  });

  it('fails soft when her own place has no hex', () => {
    const g = makeGraph();
    g.addNode({ id: 'loc_void', type: 'location', name: 'Nowhere', properties: {} });
    expect(findRestlessRoadDestination(g, 'loc_void', [entry(STORY, 'loc_a')], everything)).toBeNull();
  });
});

describe('the trace', () => {
  it('emits agent.restless_road with the destination on set_out', () => {
    emitRestlessRoadTrace(90, AGENT, 80, 'set_out', 'loc_home', { locationId: 'loc_a', hexDistance: 2, storyTemplateIds: [STORY], targetEntry: entry(STORY, 'loc_a') });
    const t = getTraces().find(x => x.category === 'agent.restless_road') as unknown as Record<string, unknown>;
    expect(t).toMatchObject({ agentId: AGENT, droughtTicks: 80, outcome: 'set_out', fromLocationId: 'loc_home', toLocationId: 'loc_a', hexDistance: 2, storyTemplateIds: [STORY] });
  });

  it('carries nulls when she stays', () => {
    emitRestlessRoadTrace(90, AGENT, 80, 'no_destination', 'loc_home', null);
    const t = getTraces().find(x => x.category === 'agent.restless_road') as unknown as Record<string, unknown>;
    expect(t).toMatchObject({ outcome: 'no_destination', toLocationId: null, hexDistance: null, storyTemplateIds: [] });
  });
});

describe('the Chronicle line', () => {
  it('names both as declared references, reaches the Chronicle, and raises no toast', () => {
    const g = makeGraph();
    const ev = buildRestlessRoadEvent(g, AGENT, 'loc_a', 90);
    expect(ev.message).toBe('Thessa grows restless and takes the road to Greywater.');
    expect(ev.segments?.map(s => s.text).join('')).toBe(ev.message);
    expect(ev.segments?.filter(s => s.ref).map(s => s.ref)).toEqual([
      { kind: 'agent', id: AGENT, name: 'Thessa' },
      { kind: 'location', id: 'loc_a', name: 'Greywater' },
    ]);
    expect(ev.significance).toBeGreaterThanOrEqual(0.8);
    expect(ev.chronicleGate).toBe('threaded_only');
    expect(ev.notification).toBeUndefined();
  });

  it('a sublocation destination links as a sublocation', () => {
    const ev = buildRestlessRoadEvent(makeGraph(), AGENT, 'loc_a_inn', 90);
    expect(ev.segments?.find(s => s.ref?.id === 'loc_a_inn')?.ref?.kind).toBe('sublocation');
  });

  it('an unresolvable place falls back to plain words, never a {token}', () => {
    const ev = buildRestlessRoadEvent(makeGraph(), AGENT, 'loc_gone', 90);
    expect(ev.message).toBe(`Thessa grows restless and takes the road to ${RESTLESS_ROAD_FALLBACK_PLACE}.`);
    expect(ev.message).not.toMatch(/[{}]/);
  });
});
