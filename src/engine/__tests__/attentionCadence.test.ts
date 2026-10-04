/**
 * THR-1715 — "The First asks": daily life, the story breath, and the pause-mode
 * visibility gate.
 *
 * Plan: Docs/plans/2026-10-03-thr-1715-the-first-asks.md (Done-when: Toggle,
 * Breath, No chores in the Ledger). The toggle half lives in
 * encounterVisibility.test.ts beside the existing toggle cases.
 */

import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { ThreadEdgeProperties } from '../../types/influence';
import type { EncounterCacheEntry } from '../encounterCache';
import { WorldGraph } from '../graph';
import {
  isRoutineTemplate,
  recordStoryChapterEnd,
  resolveAttentionMode,
  storyBreathRemaining,
} from '../attentionCadence';
import { filterByStoryBreath } from '../encounterFilterPipeline';
import { phaseEncounterVisibility } from '../encounterVisibility';
import { getAnyEncounterById } from '../../data/encounter-content';
import { PAUSED_STORY_BREATH_TICKS, VISIBILITY_BY_POSITION } from '../../types/encounterVisibility';

const CHORE = 'encounter.mend_equipment';
const STORY = 'encounter.deep_descent';

function makeGraph(attentionMode: 'pause' | 'auto_resolve' | undefined, courtPosition = 'the_first'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', type: 'actor', name: 'The God', properties: {} });
  g.addNode({ id: 'agent_1', type: 'actor', name: 'Thessa', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
    properties: {
      courtPosition,
      tier: 1,
      ...(attentionMode ? { attentionMode } : {}),
      ticksAtCurrentTier: 0,
      establishedTick: 0,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
    } as unknown as Record<string, unknown>,
  });
  return g;
}

function threadProps(g: WorldGraph): ThreadEdgeProperties {
  return g.getEdge('thread_1')!.properties as unknown as ThreadEdgeProperties;
}

function entry(templateId: string): EncounterCacheEntry {
  return { templateId, locationId: 'loc_1' } as EncounterCacheEntry;
}

function action(templateId: string, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: `ua_${templateId}`,
    actorId: 'agent_1',
    templateId,
    resolved: false,
    currentStep: 0,
    stepOutcomes: [],
    choiceHistory: [],
    effectiveTier: 'shaping',
    ...overrides,
  } as unknown as UnifiedAction;
}

function makeState(graph: WorldGraph, unifiedActions: UnifiedAction[]): GameState {
  return {
    graph,
    ascendantId: 'asc_1',
    tick: 40,
    unifiedActions,
    encounterProgress: [],
    encounterNotifications: [],
    activeThreadTugs: [],
    premonitionQueue: [],
  } as unknown as GameState;
}

describe('daily life — the routine classification', () => {
  it('carries authored threatRating trivial through the converter as routine', () => {
    expect(getAnyEncounterById(CHORE)?.routine).toBe(true);
    expect(getAnyEncounterById(STORY)?.routine).toBeUndefined();
  });

  it('isRoutineTemplate: chore true, story false, unknown false (fails toward asking)', () => {
    expect(isRoutineTemplate(CHORE)).toBe(true);
    expect(isRoutineTemplate('encounter.forage_provisions')).toBe(true);
    expect(isRoutineTemplate(STORY)).toBe(false);
    expect(isRoutineTemplate('no.such.template')).toBe(false);
  });
});

describe('resolveAttentionMode', () => {
  it('reads the stored mode, else the court-position default', () => {
    expect(VISIBILITY_BY_POSITION.the_first.defaultAttentionMode).toBe('pause');
    expect(resolveAttentionMode(threadProps(makeGraph(undefined)))).toBe('pause');
    expect(resolveAttentionMode(threadProps(makeGraph(undefined, 'retinue')))).toBe('auto_resolve');
    expect(resolveAttentionMode(threadProps(makeGraph('auto_resolve')))).toBe('auto_resolve');
  });
});

describe('the story breath', () => {
  it('recordStoryChapterEnd writes the anchor for a pause-mode story chapter only', () => {
    const g = makeGraph('pause');
    expect(recordStoryChapterEnd(g, 'agent_1', 'ua_1', CHORE, 10)).toBe(false);
    expect(threadProps(g).lastStoryChapterEndTick).toBeUndefined();

    expect(recordStoryChapterEnd(g, 'agent_1', 'ua_2', STORY, 10)).toBe(true);
    expect(threadProps(g).lastStoryChapterEndTick).toBe(10);

    const auto = makeGraph('auto_resolve');
    expect(recordStoryChapterEnd(auto, 'agent_1', 'ua_3', STORY, 10)).toBe(false);
    expect(threadProps(auto).lastStoryChapterEndTick).toBeUndefined();
  });

  it('storyBreathRemaining counts down and ignores a future anchor', () => {
    const g = makeGraph('pause');
    expect(storyBreathRemaining(g, 'agent_1', 10)).toBe(0);
    recordStoryChapterEnd(g, 'agent_1', 'ua_1', STORY, 10);
    expect(storyBreathRemaining(g, 'agent_1', 10)).toBe(PAUSED_STORY_BREATH_TICKS);
    expect(storyBreathRemaining(g, 'agent_1', 10 + PAUSED_STORY_BREATH_TICKS - 1)).toBe(1);
    expect(storyBreathRemaining(g, 'agent_1', 10 + PAUSED_STORY_BREATH_TICKS)).toBe(0);
    expect(storyBreathRemaining(g, 'agent_1', 5)).toBe(0); // anchor in the future
  });

  it('filterByStoryBreath drops story candidates inside the breath for a pause-mode thread', () => {
    const g = makeGraph('pause');
    recordStoryChapterEnd(g, 'agent_1', 'ua_1', STORY, 10);
    const out = filterByStoryBreath([entry(CHORE), entry(STORY)], 'agent_1', g, 20);
    expect(out.map(e => e.templateId)).toEqual([CHORE]);
  });

  it('filterByStoryBreath keeps the story encounter she walked to (journeyGoal, THR-1639)', () => {
    const g = makeGraph('pause');
    recordStoryChapterEnd(g, 'agent_1', 'ua_1', STORY, 10);
    const goal = { ...entry(STORY), journeyGoal: true } as EncounterCacheEntry;
    const out = filterByStoryBreath([entry(CHORE), goal, entry('encounter.beast_hunt')], 'agent_1', g, 20);
    expect(out.map(e => e.templateId)).toEqual([CHORE, STORY]);
  });

  it('filterByStoryBreath passes everything for auto-mode threads', () => {
    const g = makeGraph('auto_resolve');
    g.updateEdge('thread_1', { properties: { lastStoryChapterEndTick: 10 } });
    const input = [entry(CHORE), entry(STORY)];
    expect(filterByStoryBreath(input, 'agent_1', g, 20)).toBe(input);
  });

  it('filterByStoryBreath passes everything once the breath ends, and for unthreaded agents', () => {
    const g = makeGraph('pause');
    recordStoryChapterEnd(g, 'agent_1', 'ua_1', STORY, 10);
    const input = [entry(CHORE), entry(STORY)];
    expect(filterByStoryBreath(input, 'agent_1', g, 10 + PAUSED_STORY_BREATH_TICKS)).toBe(input);
    expect(filterByStoryBreath(input, 'nobody', g, 20)).toBe(input);
  });
});

describe('encounter visibility — The First asks', () => {
  it('a pause-mode shaping step notifies without a tug and halts (autoResolveTick null)', () => {
    const state = makeState(makeGraph('pause'), [action(STORY)]);
    const { notifications } = phaseEncounterVisibility(state);
    const step = notifications.find(n => n.encounterId === STORY && n.kind === 'encounter');
    expect(step).toBeDefined();
    expect(step!.autoResolveTick).toBeNull();
  });

  it('an auto-mode shaping step still needs an attended tug', () => {
    const state = makeState(makeGraph('auto_resolve'), [action(STORY)]);
    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications.filter(n => n.encounterId === STORY)).toHaveLength(0);
  });

  it('daily life never notifies — neither its steps nor its aftermath', () => {
    const resolvedChore = action(CHORE, {
      actionId: 'ua_done',
      resolved: true,
      aftermathSummary: { overview: 'The straps hold.', narrativeTag: 'fortunate' },
    } as Partial<UnifiedAction>);
    const state = makeState(makeGraph('pause'), [action(CHORE), resolvedChore]);
    const { notifications } = phaseEncounterVisibility(state);
    expect(notifications.filter(n => n.encounterId === CHORE)).toHaveLength(0);
  });

  it('the pause-only pass (orchestrator 2b.2) builds step 0 for pause threads and skips auto threads', () => {
    const pause = phaseEncounterVisibility(makeState(makeGraph('pause'), [action(STORY)]), { pauseModeOnly: true });
    expect(pause.notifications.find(n => n.encounterId === STORY && n.stepIndex === 0)?.autoResolveTick).toBeNull();

    const autoState = makeState(makeGraph('auto_resolve'), [action(STORY)]);
    (autoState as { activeThreadTugs: unknown[] }).activeThreadTugs = [
      { agentId: 'agent_1', actionId: `ua_${STORY}`, attended: true },
    ];
    expect(phaseEncounterVisibility(autoState).notifications.length).toBeGreaterThan(0);
    expect(phaseEncounterVisibility(autoState, { pauseModeOnly: true }).notifications).toHaveLength(0);
  });

  it('the pause-only pass never doubles a notification the main pass built', () => {
    const state = makeState(makeGraph('pause'), [action(STORY)]);
    const first = phaseEncounterVisibility(state);
    state.encounterNotifications = first.notifications;
    expect(phaseEncounterVisibility(state, { pauseModeOnly: true }).notifications).toHaveLength(0);
  });
});
