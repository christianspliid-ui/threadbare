/**
 * THR-1218 S1 — the firing rhythm for paused (followed) mortals: one predicate,
 * the drought clock, the story tellings cap and its relax, the drought anchor,
 * and the repeat floor now covering every paused mortal (D4).
 *
 * Plan: Docs/plans/2026-10-16-thr-1218-encounter-firing-rhythm.md (E1–E4).
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyStoryTellingsCap,
  isPausedThreadActor,
  isRoutineTemplate,
  isTellingsCapRelaxed,
  recordStoryChapterStart,
  storyBreathRemaining,
  storyDroughtTicks,
  storyTellings,
} from '../attentionCadence';
import { filterByCooldown } from '../phaseAgentDecision';
import {
  PAUSED_STORY_MAX_TELLINGS,
  PAUSED_STORY_REPEAT_FLOOR_TICKS,
  FIRST_CHAPTER_REPEAT_FLOOR_TICKS,
  STORY_DROUGHT_RELAX_TICKS,
  STORY_DROUGHT_TICKS,
} from '../../data/agent-behavior-constants';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { EncounterCacheEntry } from '../encounterCache';
import type { EncounterProgress } from '../../types/encounter';

const CHORE = 'encounter.mend_equipment';
const STORY = 'encounter.deep_descent';
const OTHER_STORY = 'encounter.other_story';
const AGENT = 'agent_1';
const ESTABLISHED = 10;

function makeGraph(opts: { attentionMode?: 'pause' | 'auto_resolve'; courtPosition?: string; extra?: Record<string, unknown> } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: AGENT, type: 'actor', name: 'Thessa', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: AGENT, type: 'thread',
    properties: {
      courtPosition: opts.courtPosition ?? 'the_first',
      tier: 1,
      ...(opts.attentionMode ? { attentionMode: opts.attentionMode } : {}),
      ticksAtCurrentTier: 0,
      establishedTick: ESTABLISHED,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
      ...(opts.extra ?? {}),
    } as unknown as Record<string, unknown>,
  });
  return g;
}

const entries = (...ids: string[]) => ids.map(templateId => ({ templateId, locationId: 'loc_1' }) as EncounterCacheEntry);
const idsOf = (list: { templateId: string }[]) => list.map(c => c.templateId);

describe('the paused-mortal predicate (E1)', () => {
  it('holds for a pause-mode thread, including a retinue mortal set to pause', () => {
    expect(isRoutineTemplate(CHORE)).toBe(true);
    expect(isPausedThreadActor(makeGraph({ attentionMode: 'pause' }), AGENT)).toBe(true);
    expect(isPausedThreadActor(makeGraph({ attentionMode: 'pause', courtPosition: 'retinue' }), AGENT)).toBe(true);
  });

  it('fails for auto-resolve, dormant, or no thread', () => {
    expect(isPausedThreadActor(makeGraph({ attentionMode: 'auto_resolve' }), AGENT)).toBe(false);
    expect(isPausedThreadActor(makeGraph({ attentionMode: 'pause', courtPosition: 'dormant' }), AGENT)).toBe(false);
    const g = new WorldGraph();
    g.addNode({ id: AGENT, type: 'actor', name: 'x', properties: {} });
    expect(isPausedThreadActor(g, AGENT)).toBe(false);
  });

  it('the story breath still reads through it (behaviour unchanged)', () => {
    const g = makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterEndTick: 100 } });
    expect(storyBreathRemaining(g, AGENT, 105)).toBeGreaterThan(0);
    const auto = makeGraph({ attentionMode: 'auto_resolve', extra: { lastStoryChapterEndTick: 100 } });
    expect(storyBreathRemaining(auto, AGENT, 105)).toBe(0);
  });
});

describe('the drought clock (E4)', () => {
  it('counts from establishedTick before the first story chapter', () => {
    expect(storyDroughtTicks(makeGraph({ attentionMode: 'pause' }), AGENT, 50)).toBe(50 - ESTABLISHED);
  });

  it('counts from the latest story start, and a future anchor reads as no drought', () => {
    expect(storyDroughtTicks(makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 40 } }), AGENT, 100)).toBe(60);
    expect(storyDroughtTicks(makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 400 } }), AGENT, 100)).toBe(0);
  });

  it('is 0 for a mortal who is not paused', () => {
    expect(storyDroughtTicks(makeGraph({ attentionMode: 'auto_resolve' }), AGENT, 500)).toBe(0);
  });

  it('the relax threshold sits past the restless-road threshold', () => {
    expect(STORY_DROUGHT_RELAX_TICKS).toBeGreaterThan(STORY_DROUGHT_TICKS);
    const g = makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 0 } });
    expect(isTellingsCapRelaxed(g, AGENT, STORY_DROUGHT_RELAX_TICKS - 1)).toBe(false);
    expect(isTellingsCapRelaxed(g, AGENT, STORY_DROUGHT_RELAX_TICKS)).toBe(true);
  });

  it('recordStoryChapterStart writes the anchor for a story, never for a chore or an auto mortal', () => {
    const g = makeGraph({ attentionMode: 'pause' });
    expect(recordStoryChapterStart(g, AGENT, CHORE, 30)).toBe(false);
    expect(g.getEdge('thread_1')!.properties.lastStoryChapterStartTick).toBeUndefined();
    expect(recordStoryChapterStart(g, AGENT, STORY, 30)).toBe(true);
    expect(g.getEdge('thread_1')!.properties.lastStoryChapterStartTick).toBe(30);
    const auto = makeGraph({ attentionMode: 'auto_resolve' });
    expect(recordStoryChapterStart(auto, AGENT, STORY, 30)).toBe(false);
  });
});

describe('the story tellings cap (E3 / D5)', () => {
  const told = { [STORY]: PAUSED_STORY_MAX_TELLINGS, [CHORE]: 9, [OTHER_STORY]: PAUSED_STORY_MAX_TELLINGS - 1 };

  it('drops a story told PAUSED_STORY_MAX_TELLINGS times; chores and fresher stories stay', () => {
    const g = makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 100 } });
    enableTracing();
    clearTraces();
    const kept = applyStoryTellingsCap(g, AGENT, 110, entries(STORY, CHORE, OTHER_STORY), told);
    expect(idsOf(kept)).toEqual([CHORE, OTHER_STORY]);
    const trace = getTraces().find(t => t.category === 'encounter.tellings_capped') as unknown as {
      droppedTemplateIds: string[]; remainingStoryCandidates: number; relaxed: boolean;
    };
    expect(trace).toBeDefined();
    expect(trace.droppedTemplateIds).toEqual([STORY]);
    expect(trace.remainingStoryCandidates).toBe(1);
    expect(trace.relaxed).toBe(false);
  });

  it('may leave no story at all — she lives her daily life instead of retelling', () => {
    const g = makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 100 } });
    expect(idsOf(applyStoryTellingsCap(g, AGENT, 110, entries(STORY, CHORE), told))).toEqual([CHORE]);
  });

  it('relaxes after STORY_DROUGHT_RELAX_TICKS with no story chapter', () => {
    const g = makeGraph({ attentionMode: 'pause', extra: { lastStoryChapterStartTick: 100 } });
    const tick = 100 + STORY_DROUGHT_RELAX_TICKS;
    expect(idsOf(applyStoryTellingsCap(g, AGENT, tick, entries(STORY, CHORE), told))).toEqual([STORY, CHORE]);
  });

  it('passes every agent who is not a paused mortal through untouched', () => {
    const auto = makeGraph({ attentionMode: 'auto_resolve' });
    const list = entries(STORY, CHORE);
    expect(applyStoryTellingsCap(auto, AGENT, 110, list, told)).toBe(list);
  });

  it('missing familiarity counts as zero tellings', () => {
    const g = makeGraph({ attentionMode: 'pause' });
    expect(idsOf(applyStoryTellingsCap(g, AGENT, 20, entries(STORY), {}))).toEqual([STORY]);
  });

  it('storyTellings reports story templates only, and nothing for a non-paused mortal', () => {
    expect(storyTellings(makeGraph({ attentionMode: 'pause' }), AGENT, told)).toEqual({
      [STORY]: PAUSED_STORY_MAX_TELLINGS,
      [OTHER_STORY]: PAUSED_STORY_MAX_TELLINGS - 1,
    });
    expect(storyTellings(makeGraph({ attentionMode: 'auto_resolve' }), AGENT, told)).toEqual({});
  });
});

describe('the repeat floor covers every paused mortal (D4)', () => {
  it('keeps the old name as a deprecated alias of the same value', () => {
    expect(FIRST_CHAPTER_REPEAT_FLOOR_TICKS).toBe(PAUSED_STORY_REPEAT_FLOOR_TICKS);
  });

  it('a paused retinue mortal is under the floor the same way the First is', () => {
    const g = makeGraph({ attentionMode: 'pause', courtPosition: 'retinue' });
    expect(isPausedThreadActor(g, AGENT)).toBe(true);
    const completed = {
      encounterId: STORY, actorId: AGENT, status: 'completed', startedTick: 94, history: [{ tick: 100 }],
    } as unknown as EncounterProgress;
    const floor = isPausedThreadActor(g, AGENT) ? PAUSED_STORY_REPEAT_FLOOR_TICKS : 0;
    const out = filterByCooldown(entries(STORY, OTHER_STORY), AGENT, [completed], [], 110, 1, [], floor);
    expect(idsOf(out)).toEqual([OTHER_STORY]);
  });
});
