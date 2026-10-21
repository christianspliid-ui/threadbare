/**
 * THR-1988 — the path you chose comes back: the catalog titles, the resolver,
 * the first-chapter-only recall and the missing-record fallback.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { SPARK_VISION_CATALOG } from '../../data/spark-vision-catalog';
import { getUITooltip } from '../../data/ui-content';
import {
  firstPathInLine,
  firstPathRecallFor,
  formatFirstPathBondLine,
  getFirstPath,
  getFirstPathFor,
  noteFirstPathRecall,
} from '../firstPath';
import { isRoutineTemplate } from '../attentionCadence';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

const ENCOUNTER_ID = 'encounter.deep_descent';
const VISION_ID = 'vision.veil.wardsmith';
const BOND_TICK = 10;

interface Opts {
  record?: boolean;
  visionId?: string;
  chapters?: Array<{ actionId: string; resolved?: boolean; currentStep?: number; templateId?: string; actorId?: string }>;
  resolvedChapterTick?: number;
}

function makeState(o: Opts = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'elara', type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'other', type: 'actor', name: 'Other', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: 'e1', type: 'thread', source: 'asc', target: 'elara',
    properties: {
      courtPosition: 'the_first',
      establishedTick: BOND_TICK,
      ...(o.record === false ? {} : { meetingChoiceRecord: { sparkVisionId: o.visionId ?? VISION_ID } }),
    },
  });
  return {
    graph,
    ascendantId: 'asc',
    tick: BOND_TICK + 5,
    unifiedActions: (o.chapters ?? []).map(c => ({
      actionId: c.actionId, templateId: c.templateId ?? ENCOUNTER_ID, actorId: c.actorId ?? 'elara',
      resolved: c.resolved ?? false, currentStep: c.currentStep ?? 0,
    })),
    chapterArchive: o.resolvedChapterTick === undefined ? [] : [{
      actionId: 'act-0', templateId: ENCOUNTER_ID, templateName: 'x', actorId: 'elara', actorName: 'Elara',
      targetId: 'elara', targetName: 'Elara', scale: 'personal', startTick: 0,
      resolvedTick: o.resolvedChapterTick, resolved: true, threaded: true, participants: [],
      openingProse: '', steps: [],
    }],
  } as unknown as GameState;
}

const thread = (s: GameState) => s.graph.getEdge('e1')!;
const recallTraces = () => getTraces().filter(t => t.category === 'first_path_recalled');

describe('spark vision titles (THR-1988 content)', () => {
  it('every catalog vision has a title of two to four words, all distinct', () => {
    for (const v of SPARK_VISION_CATALOG) {
      expect(v.title, v.id).toBeTruthy();
      const words = v.title!.trim().split(/\s+/);
      expect(words.length, v.id).toBeGreaterThanOrEqual(2);
      expect(words.length, v.id).toBeLessThanOrEqual(4);
    }
    expect(new Set(SPARK_VISION_CATALOG.map(v => v.title)).size).toBe(SPARK_VISION_CATALOG.length);
  });

  it('every Reach a vision invests in has its Path tooltip, under 200 characters', () => {
    for (const v of SPARK_VISION_CATALOG) {
      const tip = getUITooltip(`ui.first.path.${v.reachInvestment}`);
      expect(tip, v.reachInvestment).not.toBeNull();
      expect(tip!.desc.length).toBeLessThanOrEqual(200);
    }
    expect(getUITooltip('ui.first.path')).not.toBeNull();
  });

  it('the bond line names the path inside a sentence', () => {
    expect(firstPathInLine('Warden of the walls')).toBe('the warden of the walls');
    expect(formatFirstPathBondLine('Elara', 'Warden of the walls')).toBe('Elara will become the warden of the walls.');
  });
});

describe('getFirstPath (THR-1988 resolver)', () => {
  it('resolves the stored spark vision to its title and Reach', () => {
    expect(getFirstPath(makeState())).toEqual({ visionId: VISION_ID, title: 'Warden of the walls', reach: 'stone' });
  });

  it('returns null with no meeting record, an unknown vision, or before the bond', () => {
    expect(getFirstPath(makeState({ record: false }))).toBeNull();
    expect(getFirstPath(makeState({ visionId: 'vision.nope' }))).toBeNull();
    const s = makeState();
    s.graph.removeEdge('e1');
    expect(getFirstPath(s)).toBeNull();
  });

  it('getFirstPathFor answers for The First only', () => {
    const s = makeState();
    expect(getFirstPathFor(s.graph, 'asc', 'elara')?.title).toBe('Warden of the walls');
    expect(getFirstPathFor(s.graph, 'asc', 'other')).toBeNull();
  });
});

describe('noteFirstPathRecall + firstPathRecallFor (THR-1988 first chapter only)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the fixture template is story, not routine', () => {
    expect(isRoutineTemplate(ENCOUNTER_ID)).toBe(false);
  });

  it('pins the first open chapter once, traces once, and the line names the path', () => {
    const s = makeState({ chapters: [{ actionId: 'act-1' }] });
    expect(noteFirstPathRecall(s)).toBe(true);
    expect(noteFirstPathRecall(s)).toBe(false);
    expect(thread(s).properties.firstPathRecalledActionId).toBe('act-1');
    const traces = recallTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ agentId: 'elara', visionId: VISION_ID, actionId: 'act-1' });

    const line = firstPathRecallFor(s.graph, 'asc', { actionId: 'act-1', actorId: 'elara', currentStep: 0, resolved: false });
    expect(line).toBe('Elara has not forgotten the path you showed at the bond: the warden of the walls.');
  });

  it('a later chapter does not repeat it', () => {
    const s = makeState({ chapters: [{ actionId: 'act-1' }] });
    noteFirstPathRecall(s);
    s.unifiedActions = [
      { actionId: 'act-1', templateId: ENCOUNTER_ID, actorId: 'elara', resolved: true, currentStep: 2 },
      { actionId: 'act-2', templateId: ENCOUNTER_ID, actorId: 'elara', resolved: false, currentStep: 0 },
    ] as unknown as GameState['unifiedActions'];
    expect(noteFirstPathRecall(s)).toBe(false);
    expect(firstPathRecallFor(s.graph, 'asc', { actionId: 'act-2', actorId: 'elara', currentStep: 0, resolved: false })).toBeNull();
    expect(recallTraces()).toHaveLength(1);
  });

  it('never pins when a chapter already resolved since the bond (an old save)', () => {
    const s = makeState({ chapters: [{ actionId: 'act-2' }], resolvedChapterTick: BOND_TICK + 1 });
    expect(noteFirstPathRecall(s)).toBe(false);
    expect(thread(s).properties.firstPathRecalledActionId).toBeUndefined();
  });

  it('skips another mortal’s encounter and waits for The First’s own', () => {
    const s = makeState({ chapters: [{ actionId: 'act-x', actorId: 'other' }] });
    expect(noteFirstPathRecall(s)).toBe(false);
  });

  it('shows only on the opening step of an unresolved chapter', () => {
    const s = makeState({ chapters: [{ actionId: 'act-1' }] });
    noteFirstPathRecall(s);
    expect(firstPathRecallFor(s.graph, 'asc', { actionId: 'act-1', actorId: 'elara', currentStep: 1, resolved: false })).toBeNull();
    expect(firstPathRecallFor(s.graph, 'asc', { actionId: 'act-1', actorId: 'elara', currentStep: 0, resolved: true })).toBeNull();
  });

  it('missing record: nothing pinned, no line, no trace', () => {
    const s = makeState({ record: false, chapters: [{ actionId: 'act-1' }] });
    expect(noteFirstPathRecall(s)).toBe(false);
    expect(firstPathRecallFor(s.graph, 'asc', { actionId: 'act-1', actorId: 'elara', currentStep: 0, resolved: false })).toBeNull();
    expect(recallTraces()).toHaveLength(0);
  });
});
