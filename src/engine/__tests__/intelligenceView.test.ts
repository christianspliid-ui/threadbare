/**
 * Unit tests for the THR-113 intelligence consumption helpers.
 * Covers buildIntelligenceView, findActionableIntelligence, and reliabilityDescriptor.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildIntelligenceView,
  findActionableIntelligence,
  reliabilityDescriptor,
  RELIABILITY_THRESHOLD_RELIABLE,
  RELIABILITY_THRESHOLD_UNCERTAIN,
} from '../intelligence';
import type { GameState } from '../../types/gameState';
import type { IntelligenceRecord } from '../../types/unifiedAction';
import { clearTraces, disableTracing } from '../traceBuffer';

// ─── Fixtures ────────────────────────────────────────────────────

const INTEL_SHRINE_OLD: IntelligenceRecord = {
  recordId: 'intel_shrine_old',
  category: 'shrine_location',
  label: 'Old shrine rumor',
  detail: 'Half-remembered pilgrim tale.',
  targetRegion: 'vessen_uplands',
  sourceEncounterId: 'encounter.old',
  agentId: 'agent-1',
  acquiredTick: 5,
  reliability: 0.3,
};

const INTEL_SHRINE_NEW: IntelligenceRecord = {
  recordId: 'intel_shrine_new',
  category: 'shrine_location',
  label: 'Fresh shrine sighting',
  detail: 'Map fragment with guardian schedules.',
  targetRegion: 'vessen_uplands',
  targetEntityId: 'loc-shrine-pale',
  sourceEncounterId: 'encounter.new',
  agentId: 'agent-1',
  acquiredTick: 50,
  reliability: 0.85,
};

const INTEL_TRADE: IntelligenceRecord = {
  recordId: 'intel_trade',
  category: 'trade_route',
  label: 'Salt caravan schedule',
  detail: 'Northern waystation rotations.',
  targetEntityId: 'route-salt-north',
  sourceEncounterId: 'encounter.merchant',
  agentId: 'agent-1',
  acquiredTick: 30,
  reliability: 0.7,
};

const INTEL_POLITICAL: IntelligenceRecord = {
  recordId: 'intel_politic',
  category: 'political_secret',
  label: 'Steward\'s allegiance',
  detail: 'The steward corresponds with the rival faction.',
  targetEntityId: 'actor-steward',
  sourceEncounterId: 'encounter.shadow',
  agentId: 'agent-2',
  acquiredTick: 40,
  reliability: 0.5,
};

function makeState(records: IntelligenceRecord[]): GameState {
  return { intelligenceRecords: records } as unknown as GameState;
}

// Tracing is enabled globally (toggle on/off between suites to keep the buffer
// pristine; findActionableIntelligence does not emit traces itself).
beforeEach(() => {
  disableTracing();
  clearTraces();
});

// ─── reliabilityDescriptor ────────────────────────────────────────

describe('reliabilityDescriptor', () => {
  it('returns "reliable" at the reliable threshold', () => {
    expect(reliabilityDescriptor(RELIABILITY_THRESHOLD_RELIABLE)).toBe('reliable');
    expect(reliabilityDescriptor(0.95)).toBe('reliable');
    expect(reliabilityDescriptor(1)).toBe('reliable');
  });

  it('returns "uncertain" between thresholds', () => {
    expect(reliabilityDescriptor(RELIABILITY_THRESHOLD_UNCERTAIN)).toBe('uncertain');
    expect(reliabilityDescriptor(0.5)).toBe('uncertain');
    expect(reliabilityDescriptor(RELIABILITY_THRESHOLD_RELIABLE - 0.001)).toBe('uncertain');
  });

  it('returns "dubious" below the uncertain threshold', () => {
    expect(reliabilityDescriptor(0)).toBe('dubious');
    expect(reliabilityDescriptor(0.1)).toBe('dubious');
    expect(reliabilityDescriptor(RELIABILITY_THRESHOLD_UNCERTAIN - 0.001)).toBe('dubious');
  });

  it('returns "dubious" for invalid reliability values (NFP #4)', () => {
    expect(reliabilityDescriptor(NaN)).toBe('dubious');
    expect(reliabilityDescriptor(-1)).toBe('dubious');
    expect(reliabilityDescriptor(Infinity)).toBe('dubious'); // non-finite → conservative
  });
});

// ─── buildIntelligenceView ────────────────────────────────────────

describe('buildIntelligenceView', () => {
  it('returns empty view for agent with no records', () => {
    const state = makeState([INTEL_POLITICAL]); // belongs to agent-2
    const view = buildIntelligenceView(state, 'agent-1');
    expect(view.all).toEqual([]);
    expect(view.byCategory).toEqual({});
    expect(view.flags).toEqual({});
  });

  it('returns empty view when intelligenceRecords is undefined', () => {
    const state = { intelligenceRecords: undefined } as unknown as GameState;
    const view = buildIntelligenceView(state, 'agent-1');
    expect(view.all).toEqual([]);
  });

  it('groups records by category and exposes flags', () => {
    const state = makeState([INTEL_SHRINE_OLD, INTEL_TRADE, INTEL_POLITICAL]);
    const view = buildIntelligenceView(state, 'agent-1');
    expect(view.all).toHaveLength(2); // shrine_old + trade (political belongs to agent-2)
    expect(view.flags.shrine_location).toBe(true);
    expect(view.flags.trade_route).toBe(true);
    expect(view.flags.political_secret).toBeUndefined();
    expect(view.byCategory.shrine_location?.recordId).toBe('intel_shrine_old');
  });

  it('picks the most recent record per category (highest acquiredTick)', () => {
    const state = makeState([INTEL_SHRINE_OLD, INTEL_SHRINE_NEW]);
    const view = buildIntelligenceView(state, 'agent-1');
    expect(view.byCategory.shrine_location?.recordId).toBe('intel_shrine_new');
    // all[] is sorted desc by acquiredTick
    expect(view.all[0].recordId).toBe('intel_shrine_new');
    expect(view.all[1].recordId).toBe('intel_shrine_old');
  });

  it('filters out records belonging to other agents', () => {
    const state = makeState([INTEL_SHRINE_NEW, INTEL_POLITICAL]);
    const agent1View = buildIntelligenceView(state, 'agent-1');
    const agent2View = buildIntelligenceView(state, 'agent-2');
    expect(agent1View.all.map(r => r.recordId)).toEqual(['intel_shrine_new']);
    expect(agent2View.all.map(r => r.recordId)).toEqual(['intel_politic']);
  });
});

// ─── findActionableIntelligence ───────────────────────────────────

describe('findActionableIntelligence', () => {
  it('matches on locationId equal to targetEntityId', () => {
    const match = findActionableIntelligence([INTEL_SHRINE_NEW], 'agent-1', {
      templateId: 'any.template',
      locationId: 'loc-shrine-pale',
    });
    expect(match?.recordId).toBe('intel_shrine_new');
  });

  it('matches on targetAgentId equal to targetEntityId', () => {
    const polSelf: IntelligenceRecord = { ...INTEL_POLITICAL, agentId: 'agent-1' };
    const match = findActionableIntelligence([polSelf], 'agent-1', {
      templateId: 'court.scheme',
      locationId: 'loc-court',
      targetAgentId: 'actor-steward',
    });
    expect(match?.recordId).toBe('intel_politic');
  });

  it('matches on region equality', () => {
    const match = findActionableIntelligence([INTEL_SHRINE_OLD], 'agent-1', {
      templateId: 'any.template',
      locationId: 'loc-other',
      region: 'vessen_uplands',
    });
    expect(match?.recordId).toBe('intel_shrine_old');
  });

  it('matches via TEMPLATE_CATEGORY_MATCHERS substring', () => {
    // INTEL_TRADE has no matching targetEntityId/region; falls through to category matcher
    const match = findActionableIntelligence([INTEL_TRADE], 'agent-1', {
      templateId: 'merchant.caravan.raid',
      locationId: 'loc-unrelated',
    });
    expect(match?.recordId).toBe('intel_trade');
  });

  it('returns undefined when no matching rule applies', () => {
    const match = findActionableIntelligence([INTEL_TRADE], 'agent-1', {
      templateId: 'unrelated.template',
      locationId: 'loc-unrelated',
    });
    expect(match).toBeUndefined();
  });

  it('prefers most recent record when multiple match', () => {
    const match = findActionableIntelligence(
      [INTEL_SHRINE_OLD, INTEL_SHRINE_NEW],
      'agent-1',
      {
        templateId: 'pilgrim.shrine.visit',
        locationId: 'loc-something',
        region: 'vessen_uplands',
      },
    );
    expect(match?.recordId).toBe('intel_shrine_new');
  });

  it('accepts GameState in place of a records array', () => {
    const state = makeState([INTEL_SHRINE_NEW, INTEL_POLITICAL]);
    const match = findActionableIntelligence(state, 'agent-1', {
      templateId: 'x',
      locationId: 'loc-shrine-pale',
    });
    expect(match?.recordId).toBe('intel_shrine_new');
  });

  it('filters the state branch to the requested agent', () => {
    const state = makeState([INTEL_POLITICAL]); // agent-2 only
    const match = findActionableIntelligence(state, 'agent-1', {
      templateId: 'court.scheme',
      locationId: 'actor-steward',
    });
    expect(match).toBeUndefined();
  });

  it('returns undefined on empty records', () => {
    const match = findActionableIntelligence([], 'agent-1', {
      templateId: 'x',
      locationId: 'loc',
    });
    expect(match).toBeUndefined();
  });
});

