import { describe, expect, it, beforeEach } from 'vitest';
import {
  getAgentIntelligence,
  getIntelligenceByCategory,
  hasIntelligenceAbout,
  getRegionIntelligence,
  hasRegionIntelligence,
} from '../intelligence';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { IntelligenceRecord } from '../../types/unifiedAction';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────

const INTEL_SHRINE: IntelligenceRecord = {
  recordId: 'intel_001',
  category: 'shrine_location',
  label: 'Location of the Pale Court shrine',
  detail: 'Map fragment with route notes and guardian schedules.',
  targetRegion: 'vessen_uplands',
  sourceEncounterId: 'broker.quest.rival_shrine_betrayal',
  agentId: 'agent-1',
  acquiredTick: 10,
  reliability: 0.9,
};

const INTEL_TRADE: IntelligenceRecord = {
  recordId: 'intel_002',
  category: 'trade_route',
  label: 'Northern salt route schedules',
  detail: 'Caravan timing, waystation locations, guard rotations.',
  targetRegion: 'northern_coast',
  targetEntityId: 'route-salt-north',
  sourceEncounterId: 'merchant.quest.trade_analysis',
  agentId: 'agent-2',
  acquiredTick: 15,
  reliability: 0.7,
};

const INTEL_SECRET: IntelligenceRecord = {
  recordId: 'intel_003',
  category: 'political_secret',
  label: 'The steward\'s hidden allegiance',
  detail: 'The steward of Greywater has been corresponding with the rival faction.',
  targetEntityId: 'actor-steward',
  sourceEncounterId: 'shadow.quest.steward_investigation',
  agentId: 'agent-1',
  acquiredTick: 20,
  reliability: 0.6,
};

function makeState(records?: IntelligenceRecord[]): GameState {
  return { intelligenceRecords: records } as unknown as GameState;
}

// ─── Query Helper Tests ──────────────────────────────────────────

describe('getAgentIntelligence', () => {
  it('returns intelligence for the specified agent only', () => {
    const state = makeState([INTEL_SHRINE, INTEL_TRADE, INTEL_SECRET]);
    const result = getAgentIntelligence(state, 'agent-1');
    expect(result).toHaveLength(2);
    expect(result.map(r => r.recordId)).toEqual(['intel_001', 'intel_003']);
  });

  it('returns empty for an agent with no intelligence', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(getAgentIntelligence(state, 'agent-999')).toEqual([]);
  });

  it('handles undefined intelligenceRecords gracefully', () => {
    const state = makeState(undefined);
    expect(getAgentIntelligence(state, 'agent-1')).toEqual([]);
  });
});

describe('getIntelligenceByCategory', () => {
  it('filters by category across all agents', () => {
    const state = makeState([INTEL_SHRINE, INTEL_TRADE, INTEL_SECRET]);
    const result = getIntelligenceByCategory(state, 'shrine_location');
    expect(result).toHaveLength(1);
    expect(result[0].recordId).toBe('intel_001');
  });

  it('returns empty for categories with no records', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(getIntelligenceByCategory(state, 'military_position')).toEqual([]);
  });

  it('handles undefined intelligenceRecords gracefully', () => {
    const state = makeState(undefined);
    expect(getIntelligenceByCategory(state, 'trade_route')).toEqual([]);
  });
});

describe('hasIntelligenceAbout', () => {
  it('returns true when agent has intelligence about the entity', () => {
    const state = makeState([INTEL_SHRINE, INTEL_TRADE, INTEL_SECRET]);
    expect(hasIntelligenceAbout(state, 'agent-1', 'actor-steward')).toBe(true);
  });

  it('returns false when agent does not have intelligence about the entity', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(hasIntelligenceAbout(state, 'agent-1', 'actor-steward')).toBe(false);
  });

  it('returns false for wrong agent even when entity matches', () => {
    const state = makeState([INTEL_SECRET]);
    expect(hasIntelligenceAbout(state, 'agent-2', 'actor-steward')).toBe(false);
  });

  it('returns false when targetEntityId is undefined on the record', () => {
    const state = makeState([INTEL_SHRINE]); // INTEL_SHRINE has no targetEntityId
    expect(hasIntelligenceAbout(state, 'agent-1', 'some-entity')).toBe(false);
  });

  it('handles undefined intelligenceRecords gracefully', () => {
    const state = makeState(undefined);
    expect(hasIntelligenceAbout(state, 'agent-1', 'actor-steward')).toBe(false);
  });
});

describe('getRegionIntelligence', () => {
  it('returns intelligence for the specified region', () => {
    const state = makeState([INTEL_SHRINE, INTEL_TRADE, INTEL_SECRET]);
    const result = getRegionIntelligence(state, 'vessen_uplands');
    expect(result).toHaveLength(1);
    expect(result[0].recordId).toBe('intel_001');
  });

  it('returns empty for regions with no intelligence', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(getRegionIntelligence(state, 'southern_wastes')).toEqual([]);
  });

  it('does not return records without targetRegion', () => {
    const state = makeState([INTEL_SECRET]); // INTEL_SECRET has no targetRegion
    expect(getRegionIntelligence(state, 'vessen_uplands')).toEqual([]);
  });

  it('handles undefined intelligenceRecords gracefully', () => {
    const state = makeState(undefined);
    expect(getRegionIntelligence(state, 'vessen_uplands')).toEqual([]);
  });
});

describe('hasRegionIntelligence', () => {
  it('returns true when matching category and region exist', () => {
    const state = makeState([INTEL_SHRINE, INTEL_TRADE]);
    expect(hasRegionIntelligence(state, 'shrine_location', 'vessen_uplands')).toBe(true);
  });

  it('returns false when category matches but region does not', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(hasRegionIntelligence(state, 'shrine_location', 'northern_coast')).toBe(false);
  });

  it('returns false when region matches but category does not', () => {
    const state = makeState([INTEL_SHRINE]);
    expect(hasRegionIntelligence(state, 'trade_route', 'vessen_uplands')).toBe(false);
  });

  it('handles undefined intelligenceRecords gracefully', () => {
    const state = makeState(undefined);
    expect(hasRegionIntelligence(state, 'shrine_location', 'vessen_uplands')).toBe(false);
  });
});

// ─── Aftermath Integration Tests ─────────────────────────────────

describe('applyEncounterAftermathReaction — intelligence effect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });
  function createMinimalGameState(): GameState {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-1',
      type: 'actor',
      name: 'Ashara',
      properties: { actorType: 'individual' },
    });

    return {
      tick: 20,
      seed: 42,
      cycle: 1,
      phase: 'playing',
      graph,
      cosmology: {} as never,
      tiles: [],
      clock: {} as never,
      ascendantId: 'asc-1',
      essencePool: {} as never,
      mandateDefinition: null,
      mandateState: null,
      rivalDefinitions: [],
      rivalStates: [],
      doomDefinition: {} as never,
      doomClock: {} as never,
      tickEvents: [],
      recentEvents: [],
      chronicleEntries: [],
      stealthExposure: 0,
      visibilityMap: {} as never,
      familiarityMap: {} as never,
      culturalInsightMap: new Map(),
      agentKnowledge: new Map(),
      encounterProgress: [],
      actionsInProgress: [],
      unifiedActions: [],
      hiddenMarks: [],
      intelligenceRecords: [],
      worldSoul: {} as never,
      echoDefinitions: [],
      echoStates: [],
      chronicle: {} as never,
    } as GameState;
  }

  it('creates an intelligence record in state from an intelligence effect', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_betrayal',
      actorId: 'actor-1',
      templateId: 'broker.quest.rival_shrine_betrayal',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 1,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success', 'success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'accept_react_prepare',
      label: 'Prepare Brinewall',
      effects: [
        {
          kind: 'intelligence',
          category: 'shrine_location',
          label: 'Location of the Pale Court shrine in the Vessen uplands',
          detail: 'Map fragment, route notes, guardian schedules.',
          targetRegion: 'vessen_uplands',
          reliability: 0.9,
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    expect(updated.intelligenceRecords).toHaveLength(1);
    const record = updated.intelligenceRecords![0];
    expect(record.category).toBe('shrine_location');
    expect(record.label).toBe('Location of the Pale Court shrine in the Vessen uplands');
    expect(record.detail).toBe('Map fragment, route notes, guardian schedules.');
    expect(record.targetRegion).toBe('vessen_uplands');
    expect(record.sourceEncounterId).toBe('broker.quest.rival_shrine_betrayal');
    expect(record.acquiredTick).toBe(20);
    expect(record.agentId).toBe('actor-1');
    expect(record.reliability).toBe(0.9);
  });

  it('defaults reliability to 0.8 when omitted', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_intel',
      actorId: 'actor-1',
      templateId: 'test.encounter',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_intel',
      label: 'Gain intelligence',
      effects: [
        {
          kind: 'intelligence',
          category: 'trade_route',
          label: 'Northern trade schedules',
          detail: 'Basic caravan timing information.',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 25, runtime);
    expect(updated.intelligenceRecords![0].reliability).toBe(0.8);
  });

  it('emits a medium-significance chronicle event mentioning the intelligence label', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_intel',
      actorId: 'actor-1',
      templateId: 'test.encounter',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_intel',
      label: 'Gain intelligence',
      effects: [
        {
          kind: 'intelligence',
          category: 'shrine_location',
          label: 'Rival shrine location',
          detail: 'Detailed shrine coordinates.',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    const intelEvent = updated.tickEvents.find(e => e.id.includes('intel_'));
    expect(intelEvent).toBeDefined();
    expect(intelEvent!.message).toBe('Intelligence acquired: Rival shrine location');
    expect(intelEvent!.significance).toBe(0.6);
  });

  it('appends to existing intelligenceRecords without overwriting', () => {
    const state = createMinimalGameState();
    state.intelligenceRecords = [INTEL_TRADE];

    const action: UnifiedAction = {
      actionId: 'ua_intel',
      actorId: 'actor-1',
      templateId: 'test.encounter',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_new_intel',
      label: 'New intelligence',
      effects: [
        {
          kind: 'intelligence',
          category: 'political_secret',
          label: 'Hidden allegiance',
          detail: 'The steward corresponds with the rival faction.',
          targetEntityId: 'actor-steward',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 25, runtime);
    expect(updated.intelligenceRecords).toHaveLength(2);
    expect(updated.intelligenceRecords![0].recordId).toBe('intel_002'); // pre-existing
    expect(updated.intelligenceRecords![1].category).toBe('political_secret');
  });

  it('leaves intelligenceRecords unchanged when no intelligence effects are present', () => {
    const state = createMinimalGameState();
    state.intelligenceRecords = [INTEL_SHRINE];

    const action: UnifiedAction = {
      actionId: 'ua_other',
      actorId: 'actor-1',
      templateId: 'test.encounter',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_no_intel',
      label: 'No intelligence',
      effects: [
        { kind: 'reputation_score', delta: 0.05 },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 25, runtime);
    // Should be the same reference (not a new array) since no records were added
    expect(updated.intelligenceRecords).toBe(state.intelligenceRecords);
  });

  it('preserves targetEntityId when provided', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_intel',
      actorId: 'actor-1',
      templateId: 'test.encounter',
      targetId: 'loc-1',
      scale: 'local',
      source: 'agent',
      startTick: 10,
      currentStep: 0,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_entity_intel',
      label: 'Entity intelligence',
      effects: [
        {
          kind: 'intelligence',
          category: 'agent_network',
          label: 'Spy network contacts',
          detail: 'Three agents operating under cover in the port district.',
          targetEntityId: 'faction-shadow-court',
          reliability: 0.5,
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 30, runtime);
    const record = updated.intelligenceRecords![0];
    expect(record.targetEntityId).toBe('faction-shadow-court');
    expect(record.targetRegion).toBeUndefined();
  });
});
