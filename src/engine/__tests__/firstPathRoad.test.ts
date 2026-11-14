/**
 * THR-2214 — the path's road: when it is due, which places it may walk to, what it
 * writes on the thread edge, its trace and its Chronicle line; and the Crossroads
 * snapshot's `fitsPath` flag.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import {
  buildFirstPathRoadEvent,
  emitFirstPathRoadTrace,
  firstPathChapters,
  firstPathRoadDue,
  fittingEntries,
  recordFirstPathRoad,
  type PathScene,
} from '../firstPathRoad';
import { findRestlessRoadDestination } from '../restlessRoad';
import { firstPathFromRecord } from '../firstPath';
import { buildCrossroadsSnapshot } from '../crossroads';
import { FIRST_PATH_ROAD_DROUGHT_TICKS, RESTLESS_ROAD_COOLDOWN_TICKS } from '../../data/agent-behavior-constants';
import { FIRST_PATH_ROAD_LINE, RESTLESS_ROAD_FALLBACK_NAME, RESTLESS_ROAD_FALLBACK_PLACE } from '../../data/attention-content';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ChapterRecord } from '../../types/chapterRecord';
import type { BoardEntry } from '../decisionBoard';
import type { ScoredCandidate } from '../encounterScoring';

const AGENT = 'agent_1';
const ASC = 'asc_1';
const BOND = 10;
const VISION = 'vision.heart.unifier'; // gold / heart; loyalty_ambition, mercy_ruthlessness
const FIT = 'encounter.clan_council';
const UNFIT = 'encounter.deep_descent';
const CHORE = 'encounter.mend_equipment';

const PATH = firstPathFromRecord({ sparkVisionId: VISION } as never)!;
const fitScene: PathScene = { reachPrimary: 'heart', motivations: ['loyalty_ambition'] };
const unfitScene: PathScene = { reachPrimary: 'iron', motivations: ['loyalty_ambition'] };
const scenes: Record<string, PathScene> = { [FIT]: fitScene, [UNFIT]: unfitScene, [CHORE]: fitScene };
const sceneOf = (id: string) => scenes[id];

function makeGraph(opts: { thread?: Record<string, unknown>; courtPosition?: string; record?: boolean } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: AGENT, type: 'actor', name: 'Seren', properties: {} });
  g.addEdge({
    id: 'thread_1', source: ASC, target: AGENT, type: 'thread',
    properties: {
      courtPosition: opts.courtPosition ?? 'the_first',
      attentionMode: 'pause',
      establishedTick: BOND,
      ...(opts.record === false ? {} : { meetingChoiceRecord: { sparkVisionId: VISION } }),
      ...(opts.thread ?? {}),
    } as unknown as Record<string, unknown>,
  });
  g.addNode({ id: 'loc_home', type: 'location', name: 'Hearth', properties: { hexCol: 0, hexRow: 0 } });
  g.addNode({ id: 'loc_near', type: 'location', name: 'Bramble', properties: { hexCol: 2, hexRow: 0 } });
  g.addNode({ id: 'loc_far', type: 'location', name: 'Harrowmere', properties: { hexCol: 5, hexRow: 0 } });
  return g;
}

const noHistory = () => ({ chapters: [], resolvedSinceBond: false });
const resolvedHistory = (chapters: { templateId: string; startTick: number }[] = []) => () => ({ chapters, resolvedSinceBond: true });
const entry = (templateId: string, locationId: string, scene: PathScene, questPriority = 1) =>
  ({ templateId, locationId, questPriority, ...scene }) as unknown as EncounterCacheEntry;

beforeEach(() => {
  clearTraces();
  enableTracing();
});

describe('when the path road is due', () => {
  it('is due before any chapter of hers has resolved since the bond', () => {
    const due = firstPathRoadDue(makeGraph(), ASC, AGENT, BOND + 1, [], noHistory, sceneOf);
    expect(due?.reason).toBe('no_chapter_yet');
    expect(due?.path.visionId).toBe(VISION);
  });

  it('waits while a scene on her shortlist carries the path pull', () => {
    expect(firstPathRoadDue(makeGraph(), ASC, AGENT, BOND + 1, [{ firstPathPull: 3 }], noHistory, sceneOf)).toBeNull();
    // A shortlist without the pull does not hold the road back.
    expect(firstPathRoadDue(makeGraph(), ASC, AGENT, BOND + 1, [{}, { firstPathPull: 1 }], noHistory, sceneOf)).not.toBeNull();
  });

  it('counts the drought from her latest path-fitting chapter, not from an unfitting one', () => {
    const start = 100;
    const history = resolvedHistory([{ templateId: FIT, startTick: start }, { templateId: UNFIT, startTick: start + 20 }]);
    const g = makeGraph();
    expect(firstPathRoadDue(g, ASC, AGENT, start + FIRST_PATH_ROAD_DROUGHT_TICKS - 1, [], history, sceneOf)).toBeNull();
    const due = firstPathRoadDue(g, ASC, AGENT, start + FIRST_PATH_ROAD_DROUGHT_TICKS, [], history, sceneOf);
    expect(due).toEqual(expect.objectContaining({ reason: 'path_drought', droughtTicks: FIRST_PATH_ROAD_DROUGHT_TICKS }));
  });

  it('counts from the bond when no chapter of hers has fitted, and a routine chapter never counts', () => {
    const history = resolvedHistory([{ templateId: CHORE, startTick: BOND + 30 }, { templateId: UNFIT, startTick: BOND + 5 }]);
    const due = firstPathRoadDue(makeGraph(), ASC, AGENT, BOND + FIRST_PATH_ROAD_DROUGHT_TICKS, [], history, sceneOf);
    expect(due?.droughtTicks).toBe(FIRST_PATH_ROAD_DROUGHT_TICKS);
  });

  it('shares the restless road cooldown: any check waits RESTLESS_ROAD_COOLDOWN_TICKS', () => {
    const g = makeGraph({ thread: { restlessRoadCheckTick: 50 } });
    expect(firstPathRoadDue(g, ASC, AGENT, 50 + RESTLESS_ROAD_COOLDOWN_TICKS - 1, [], noHistory, sceneOf)).toBeNull();
    expect(firstPathRoadDue(g, ASC, AGENT, 50 + RESTLESS_ROAD_COOLDOWN_TICKS, [], noHistory, sceneOf)).not.toBeNull();
  });

  it('waits out her story breath', () => {
    const g = makeGraph({ thread: { lastStoryChapterEndTick: 60 } });
    expect(firstPathRoadDue(g, ASC, AGENT, 61, [], noHistory, sceneOf)).toBeNull();
  });

  it('is never due for a mortal who is not The First, nor without a chosen path', () => {
    expect(firstPathRoadDue(makeGraph({ courtPosition: 'the_second' }), ASC, AGENT, 500, [], noHistory, sceneOf)).toBeNull();
    expect(firstPathRoadDue(makeGraph({ record: false }), ASC, AGENT, 500, [], noHistory, sceneOf)).toBeNull();
    expect(firstPathRoadDue(makeGraph(), undefined, AGENT, 500, [], noHistory, sceneOf)).toBeNull();
  });
});

describe('her chapters since the bond', () => {
  it('gathers archived and open non-routine chapters, and whether one resolved since the bond', () => {
    const archive = [
      { actorId: AGENT, templateId: UNFIT, startTick: 4, resolvedTick: 8, resolved: true },
      { actorId: AGENT, templateId: FIT, startTick: 20, resolvedTick: 30, resolved: true },
      { actorId: 'other', templateId: FIT, startTick: 40, resolvedTick: 45, resolved: true },
    ] as unknown as ChapterRecord[];
    // An open action counts only when it is a real encounter (`isEncounterAction`).
    const open = [
      { actorId: AGENT, templateId: UNFIT, startTick: 50, resolved: false },
      { actorId: AGENT, templateId: 'strategic.not_a_scene', startTick: 55, resolved: false },
    ];
    const { chapters, resolvedSinceBond } = firstPathChapters(makeGraph(), ASC, AGENT, archive, open);
    expect(chapters.map(c => c.templateId)).toEqual([FIT, UNFIT]);
    expect(resolvedSinceBond).toBe(true);
  });
});

describe('where the path road goes', () => {
  it('walks to the nearest place holding a fitting story, past a nearer unfitting one', () => {
    const entries = [
      entry(UNFIT, 'loc_near', unfitScene),
      entry(FIT, 'loc_far', fitScene),
    ];
    const dest = findRestlessRoadDestination(makeGraph(), 'loc_home', entries, (list) => fittingEntries(PATH, list));
    expect(dest?.locationId).toBe('loc_far');
    expect(dest?.targetEntry.templateId).toBe(FIT);
  });

  it('keeps only entries the path pulls: reach, motivations, and never a chore', () => {
    const kept = fittingEntries(PATH, [
      entry(FIT, 'loc_far', fitScene),
      entry(UNFIT, 'loc_far', unfitScene),
      entry('encounter.heart_but_off_theme', 'loc_far', { reachPrimary: 'heart', motivations: ['order_freedom'] }),
      entry(CHORE, 'loc_far', fitScene),
    ]);
    expect(kept.map(e => e.templateId)).toEqual([FIT]);
  });
});

describe('the thread write and the trace', () => {
  it('stamps the shared check tick on every outcome and lastFirstPathRoadTick on set_out', () => {
    const g = makeGraph();
    recordFirstPathRoad(g, ASC, AGENT, 70, 'no_destination');
    expect(g.getEdge('thread_1')?.properties).toEqual(expect.objectContaining({ restlessRoadCheckTick: 70 }));
    expect(g.getEdge('thread_1')?.properties.lastFirstPathRoadTick).toBeUndefined();
    recordFirstPathRoad(g, ASC, AGENT, 130, 'set_out');
    expect(g.getEdge('thread_1')?.properties).toEqual(expect.objectContaining({ restlessRoadCheckTick: 130, lastFirstPathRoadTick: 130 }));
  });

  it('traces first_path_road with outcome, destination, distance and target', () => {
    const dest = { locationId: 'loc_far', hexDistance: 5, storyTemplateIds: [FIT], targetEntry: entry(FIT, 'loc_far', fitScene) };
    emitFirstPathRoadTrace(90, AGENT, { path: PATH, reason: 'path_drought', droughtTicks: 40 }, 'set_out', 'loc_home', dest);
    const t = getTraces().find(x => x.category === 'first_path_road') as Record<string, unknown> | undefined;
    expect(t).toEqual(expect.objectContaining({
      outcome: 'set_out', visionId: VISION, dueReason: 'path_drought', droughtTicks: 40,
      fromLocationId: 'loc_home', toLocationId: 'loc_far', hexDistance: 5, targetTemplateId: FIT,
    }));
  });
});

describe('the Chronicle line', () => {
  it('names her, the place and the path, with both names as links', () => {
    const ev = buildFirstPathRoadEvent(makeGraph(), AGENT, 'loc_far', PATH, 90);
    expect(ev.message).toBe('Seren takes the road to Harrowmere, where the uniter of the clans has work.');
    expect(ev.refs?.map(r => r.id)).toEqual([AGENT, 'loc_far']);
    expect(ev.notification).toBeUndefined();
  });

  it('never shows a {token} when a name is missing (Law 43)', () => {
    const g = makeGraph();
    const ev = buildFirstPathRoadEvent(g, 'ghost', 'nowhere', PATH, 90);
    expect(ev.message).not.toMatch(/\{\w+\}/);
    expect(ev.message).toContain(RESTLESS_ROAD_FALLBACK_NAME);
    expect(ev.message).toContain(RESTLESS_ROAD_FALLBACK_PLACE);
    expect(FIRST_PATH_ROAD_LINE).toContain('{path}');
  });
});

describe('the Crossroads snapshot marks the road that fits', () => {
  it('writes fitsPath only on an entry whose board pull carried firstPathPull > 1', () => {
    const cand = (templateId: string) => ({ entry: { templateId, locationId: 'loc_far', reachPrimary: 'heart' } }) as unknown as ScoredCandidate;
    const encounters = [cand(FIT), cand(UNFIT), cand('encounter.third')];
    const board = [
      { id: 'e0', family: 'encounter', candidateIndex: 0, score: 3, firstPathPull: 3 },
      { id: 'e1', family: 'encounter', candidateIndex: 1, score: 2 },
      { id: 'e2', family: 'encounter', candidateIndex: 2, score: 1, firstPathPull: 1 },
    ] as unknown as BoardEntry[];
    const snap = buildCrossroadsSnapshot(board, encounters, [], null, () => false, 100);
    expect(snap.options.map(o => o.fitsPath ?? false)).toEqual([true, false, false]);
  });
});
