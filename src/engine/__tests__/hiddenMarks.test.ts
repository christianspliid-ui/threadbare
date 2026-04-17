import { describe, expect, it, beforeEach } from 'vitest';
import {
  getAgentHiddenMarks,
  getHiddenMarksByCategory,
  hasHiddenMark,
  checkMarkReveals,
  removeHiddenMark,
} from '../hiddenMarks';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { HiddenMark } from '../../types/unifiedAction';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────

const MARK_BETRAYAL: HiddenMark = {
  markId: 'mark_001',
  category: 'betrayal',
  severity: 0.6,
  label: 'Betrayed Brinewall',
  sourceEncounterId: 'broker.quest.rival_shrine_betrayal',
  placedTick: 10,
  targetAgentId: 'agent-1',
  revealFamilies: ['investigation', 'brinewall'],
};

const MARK_DEBT: HiddenMark = {
  markId: 'mark_002',
  category: 'debt',
  severity: 0.4,
  label: 'Owes the merchant guild',
  sourceEncounterId: 'merchant.quest.guild_debt',
  placedTick: 15,
  targetAgentId: 'agent-2',
  revealFamilies: ['merchant'],
};

const MARK_SECRET: HiddenMark = {
  markId: 'mark_003',
  category: 'secret_knowledge',
  severity: 0.8,
  label: 'Knows the location of the sealed vault',
  sourceEncounterId: 'ruins.quest.sealed_vault',
  placedTick: 20,
  targetAgentId: 'agent-1',
};

function makeState(marks?: HiddenMark[]): GameState {
  return { hiddenMarks: marks } as unknown as GameState;
}

// ─── Query Helper Tests ──────────────────────────────────────────

describe('getAgentHiddenMarks', () => {
  it('returns marks for the specified agent only', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT, MARK_SECRET]);
    const result = getAgentHiddenMarks(state, 'agent-1');
    expect(result).toHaveLength(2);
    expect(result.map(m => m.markId)).toEqual(['mark_001', 'mark_003']);
  });

  it('returns empty for an agent with no marks', () => {
    const state = makeState([MARK_BETRAYAL]);
    expect(getAgentHiddenMarks(state, 'agent-999')).toEqual([]);
  });

  it('handles undefined hiddenMarks gracefully', () => {
    const state = makeState(undefined);
    expect(getAgentHiddenMarks(state, 'agent-1')).toEqual([]);
  });
});

describe('getHiddenMarksByCategory', () => {
  it('filters by category across all agents', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT, MARK_SECRET]);
    const result = getHiddenMarksByCategory(state, 'betrayal');
    expect(result).toHaveLength(1);
    expect(result[0].markId).toBe('mark_001');
  });

  it('returns empty for categories with no marks', () => {
    const state = makeState([MARK_BETRAYAL]);
    expect(getHiddenMarksByCategory(state, 'forbidden_contact')).toEqual([]);
  });

  it('handles undefined hiddenMarks gracefully', () => {
    const state = makeState(undefined);
    expect(getHiddenMarksByCategory(state, 'debt')).toEqual([]);
  });
});

describe('hasHiddenMark', () => {
  it('returns true when agent has mark in category', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT]);
    expect(hasHiddenMark(state, 'agent-1', 'betrayal')).toBe(true);
  });

  it('returns false when agent does not have mark in category', () => {
    const state = makeState([MARK_BETRAYAL]);
    expect(hasHiddenMark(state, 'agent-1', 'debt')).toBe(false);
  });

  it('returns false for unknown agent', () => {
    const state = makeState([MARK_BETRAYAL]);
    expect(hasHiddenMark(state, 'agent-999', 'betrayal')).toBe(false);
  });

  it('handles undefined hiddenMarks gracefully', () => {
    const state = makeState(undefined);
    expect(hasHiddenMark(state, 'agent-1', 'betrayal')).toBe(false);
  });
});

describe('checkMarkReveals', () => {
  it('matches marks by encounter family prefix', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT]);
    const result = checkMarkReveals(state, 'agent-1', 'investigation.brinewall_audit');
    expect(result).toHaveLength(1);
    expect(result[0].markId).toBe('mark_001');
  });

  it('matches exact family name', () => {
    const state = makeState([MARK_BETRAYAL]);
    const result = checkMarkReveals(state, 'agent-1', 'brinewall');
    expect(result).toHaveLength(1);
  });

  it('returns empty for non-matching families', () => {
    const state = makeState([MARK_BETRAYAL]);
    const result = checkMarkReveals(state, 'agent-1', 'shadow.quest');
    expect(result).toEqual([]);
  });

  it('returns empty for marks without revealFamilies', () => {
    const state = makeState([MARK_SECRET]);
    const result = checkMarkReveals(state, 'agent-1', 'investigation');
    expect(result).toEqual([]);
  });

  it('returns empty for wrong agent even when family matches', () => {
    const state = makeState([MARK_BETRAYAL]);
    const result = checkMarkReveals(state, 'agent-2', 'investigation');
    expect(result).toEqual([]);
  });

  it('handles undefined hiddenMarks gracefully', () => {
    const state = makeState(undefined);
    expect(checkMarkReveals(state, 'agent-1', 'investigation')).toEqual([]);
  });
});

describe('removeHiddenMark', () => {
  it('removes the specified mark by ID', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT, MARK_SECRET]);
    const updated = removeHiddenMark(state, 'mark_001');
    expect(updated.hiddenMarks).toHaveLength(2);
    expect(updated.hiddenMarks!.map(m => m.markId)).toEqual(['mark_002', 'mark_003']);
  });

  it('leaves other marks untouched', () => {
    const state = makeState([MARK_BETRAYAL, MARK_DEBT]);
    const updated = removeHiddenMark(state, 'mark_001');
    expect(updated.hiddenMarks).toHaveLength(1);
    expect(updated.hiddenMarks![0]).toEqual(MARK_DEBT);
  });

  it('returns unchanged state when mark ID is not found', () => {
    const state = makeState([MARK_BETRAYAL]);
    const updated = removeHiddenMark(state, 'mark_nonexistent');
    expect(updated.hiddenMarks).toHaveLength(1);
  });

  it('handles undefined hiddenMarks gracefully', () => {
    const state = makeState(undefined);
    const updated = removeHiddenMark(state, 'mark_001');
    expect(updated.hiddenMarks).toEqual([]);
  });
});

// ─── Aftermath Integration Tests ─────────────────────────────────

describe('applyEncounterAftermathReaction — hidden_mark effect', () => {
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
      worldSoul: {} as never,
      echoDefinitions: [],
      echoStates: [],
      chronicle: {} as never,
    } as GameState;
  }

  it('creates a hidden mark in state from a hidden_mark effect', () => {
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
          kind: 'hidden_mark',
          category: 'betrayal',
          severity: 0.6,
          label: 'Betrayed Brinewall\'s salt-curing technique',
          revealFamilies: ['investigation', 'brinewall'],
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    expect(updated.hiddenMarks).toHaveLength(1);
    const mark = updated.hiddenMarks![0];
    expect(mark.category).toBe('betrayal');
    expect(mark.severity).toBe(0.6);
    expect(mark.label).toBe('Betrayed Brinewall\'s salt-curing technique');
    expect(mark.sourceEncounterId).toBe('broker.quest.rival_shrine_betrayal');
    expect(mark.placedTick).toBe(20);
    expect(mark.targetAgentId).toBe('actor-1');
    expect(mark.revealFamilies).toEqual(['investigation', 'brinewall']);
  });

  it('emits a low-significance chronicle event that does not reveal the mark', () => {
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
      id: 'accept_react_spend',
      label: 'Spend the intelligence',
      effects: [
        {
          kind: 'hidden_mark',
          category: 'betrayal',
          severity: 0.6,
          label: 'Betrayed Brinewall\'s salt-curing technique',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 20, runtime);

    const markEvent = updated.tickEvents.find(e => e.id.includes('mark_'));
    expect(markEvent).toBeDefined();
    expect(markEvent!.message).toBe('A consequence has taken root, unseen.');
    expect(markEvent!.significance).toBe(0.3);
    // The event should NOT mention betrayal, category, or label
    expect(markEvent!.message).not.toContain('betrayal');
    expect(markEvent!.message).not.toContain('Brinewall');
  });

  it('appends to existing hiddenMarks without overwriting', () => {
    const state = createMinimalGameState();
    state.hiddenMarks = [MARK_DEBT];

    const action: UnifiedAction = {
      actionId: 'ua_betrayal',
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
      id: 'react_new_mark',
      label: 'A new mark',
      effects: [
        {
          kind: 'hidden_mark',
          category: 'concealed_action',
          severity: 0.3,
          label: 'Concealed theft',
        },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 25, runtime);
    expect(updated.hiddenMarks).toHaveLength(2);
    expect(updated.hiddenMarks![0].markId).toBe('mark_002'); // pre-existing
    expect(updated.hiddenMarks![1].category).toBe('concealed_action');
  });

  it('leaves hiddenMarks unchanged when no hidden_mark effects are present', () => {
    const state = createMinimalGameState();
    state.hiddenMarks = [MARK_BETRAYAL];

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
      id: 'react_no_mark',
      label: 'No mark',
      effects: [
        { kind: 'reputation_score', delta: 0.05 },
      ],
    };

    const { state: updated } = applyEncounterAftermathReaction(state, action, reaction, 25, runtime);
    // Should be the same reference (not a new array) since no marks were added
    expect(updated.hiddenMarks).toBe(state.hiddenMarks);
  });
});
