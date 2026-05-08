/**
 * THR-139 — Unit tests for `findIntelReferencedProseMatch` and
 * `pickIntelReferencedProseLine` helpers in src/engine/intelligence.ts.
 *
 * Companion plan: Docs/plans/2026-05-08-thr-139-intel-referenced-prose-reaction.md §Tests
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  findIntelReferencedProseMatch,
  pickIntelReferencedProseLine,
} from '../intelligence';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { IntelligenceRecord, UnifiedAction } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'loc-grove',
    type: 'location',
    name: 'Amber Grove',
    properties: { locationType: 'wilderness', hexCol: 0, hexRow: 0, region: 'reach.northern' },
  });
  g.addNode({
    id: 'loc-other',
    type: 'location',
    name: 'Other',
    properties: { locationType: 'settlement', hexCol: 1, hexRow: 0, region: 'reach.southern' },
  });
  g.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Aelin',
    properties: { actorType: 'individual', locationId: 'loc-grove' },
  });
  return g;
}

function makeState(records: IntelligenceRecord[]): GameState {
  return {
    tick: 50,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph: makeGraph(),
    intelligenceRecords: records,
  } as unknown as GameState;
}

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_test',
    actorId: 'agent-1',
    templateId: 'enc.cultural.amber_grove_revisit',
    targetId: 'loc-grove',
    scale: 'personal',
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: [],
    ...overrides,
  } as UnifiedAction;
}

const INTEL_GROVE: IntelligenceRecord = {
  recordId: 'intel_grove_1',
  agentId: 'agent-1',
  category: 'cultural_knowledge',
  label: 'Amber-sap grove',
  detail: 'A grove of slow amber sap.',
  targetEntityId: 'loc-grove',
  sourceEncounterId: 'encounter.discovery',
  acquiredTick: 10,
  reliability: 0.85,
};

const INTEL_GROVE_OLDER: IntelligenceRecord = {
  ...INTEL_GROVE,
  recordId: 'intel_grove_older',
  acquiredTick: 5,
  detail: 'older record',
};

const INTEL_REGION: IntelligenceRecord = {
  recordId: 'intel_region_1',
  agentId: 'agent-1',
  category: 'cultural_knowledge',
  label: 'Northern lore',
  detail: 'Regional ritual practice in the northern reach.',
  targetRegion: 'reach.northern',
  sourceEncounterId: 'encounter.lore',
  acquiredTick: 20,
  reliability: 0.55,
};

const INTEL_TEMPLATE: IntelligenceRecord = {
  recordId: 'intel_template_1',
  agentId: 'agent-1',
  category: 'cultural_knowledge',
  label: 'Generic ritual lore',
  detail: 'Template-keyed cultural fragment.',
  sourceEncounterId: 'encounter.scholar',
  acquiredTick: 30,
  reliability: 0.7,
};

const INTEL_WRONG_CATEGORY: IntelligenceRecord = {
  ...INTEL_GROVE,
  recordId: 'intel_wrong_cat',
  category: 'shrine_location',
};

const INTEL_WRONG_AGENT: IntelligenceRecord = {
  ...INTEL_GROVE,
  recordId: 'intel_wrong_agent',
  agentId: 'agent-99',
};

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

describe('findIntelReferencedProseMatch (THR-139)', () => {
  it('matches by targetEntityId === action.targetId', () => {
    const state = makeState([INTEL_GROVE]);
    const matched = findIntelReferencedProseMatch(state, 'agent-1', 'cultural_knowledge', makeAction());
    expect(matched?.recordId).toBe('intel_grove_1');
  });

  it('matches by targetRegion via action.targetId\'s region property', () => {
    const state = makeState([INTEL_REGION]);
    const matched = findIntelReferencedProseMatch(
      state,
      'agent-1',
      'cultural_knowledge',
      makeAction({ targetId: 'loc-grove', templateId: 'enc.unrelated.template' }),
    );
    expect(matched?.recordId).toBe('intel_region_1');
  });

  it('matches by templateId via TEMPLATE_CATEGORY_MATCHERS substring', () => {
    const state = makeState([INTEL_TEMPLATE]);
    const matched = findIntelReferencedProseMatch(
      state,
      'agent-1',
      'cultural_knowledge',
      // 'ritual' substring is in TEMPLATE_CATEGORY_MATCHERS.cultural_knowledge
      makeAction({ targetId: undefined as unknown as string, templateId: 'enc.ritual.sap_grove' }),
    );
    expect(matched?.recordId).toBe('intel_template_1');
  });

  it('returns undefined when agent has zero records of the requested category', () => {
    const state = makeState([INTEL_WRONG_CATEGORY]);
    const matched = findIntelReferencedProseMatch(state, 'agent-1', 'cultural_knowledge', makeAction());
    expect(matched).toBeUndefined();
  });

  it('does not return another agent\'s records', () => {
    const state = makeState([INTEL_WRONG_AGENT]);
    const matched = findIntelReferencedProseMatch(state, 'agent-1', 'cultural_knowledge', makeAction());
    expect(matched).toBeUndefined();
  });

  it('returns the most-recent record when multiple match', () => {
    const state = makeState([INTEL_GROVE_OLDER, INTEL_GROVE]);
    const matched = findIntelReferencedProseMatch(state, 'agent-1', 'cultural_knowledge', makeAction());
    expect(matched?.recordId).toBe('intel_grove_1');
    expect(matched?.acquiredTick).toBe(10);
  });
});

describe('pickIntelReferencedProseLine (THR-139)', () => {
  const fullProse = {
    reliable: 'reliable line',
    uncertain: 'uncertain line',
    dubious: 'dubious line',
  };
  const reliableOnly = { reliable: 'only reliable' };
  const reliableUncertain = { reliable: 'reliable', uncertain: 'uncertain' };

  it('picks the exact band when present in all three', () => {
    expect(pickIntelReferencedProseLine(fullProse, 'reliable')).toBe('reliable line');
    expect(pickIntelReferencedProseLine(fullProse, 'uncertain')).toBe('uncertain line');
    expect(pickIntelReferencedProseLine(fullProse, 'dubious')).toBe('dubious line');
  });

  it('inherits dubious → uncertain → reliable when bands missing', () => {
    expect(pickIntelReferencedProseLine(reliableOnly, 'dubious')).toBe('only reliable');
    expect(pickIntelReferencedProseLine(reliableOnly, 'uncertain')).toBe('only reliable');
    expect(pickIntelReferencedProseLine(reliableUncertain, 'dubious')).toBe('uncertain');
  });

  it('returns empty string when reliable is empty string', () => {
    expect(pickIntelReferencedProseLine({ reliable: '' }, 'reliable')).toBe('');
    expect(pickIntelReferencedProseLine({ reliable: '' }, 'uncertain')).toBe('');
    expect(pickIntelReferencedProseLine({ reliable: '' }, 'dubious')).toBe('');
  });
});
