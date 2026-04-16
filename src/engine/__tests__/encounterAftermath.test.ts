import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { ClearanceGateRuntimeState } from '../../types/contentShells';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

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
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map<string, ClearanceGateRuntimeState>([
      ['gate-1', {
        runtimeId: 'gate-1',
        templateId: 'cg.quest.gate_duty',
        gateId: 'checkpoint_clearance',
        anchorLocationId: 'loc.town',
        subjectNodeId: 'npc.courier',
        authorityNodeId: 'npc.captain',
        witnessNodeIds: ['npc.witness'],
        locationNodeId: 'loc.gatehouse',
        persistence: 'must-persist',
        state: 'cleared',
        revealedSignalKeys: ['witness_pressure'],
        followOnTags: ['#watch_trusted'],
        attempts: 2,
        lastUpdatedTick: 20,
        history: [],
      }],
    ]),
  } as GameState;
}

describe('applyEncounterAftermathReaction — trace emission (THR-111)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('emits encounter_aftermath_applied once per reaction application', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-1', templateId: 'enc.test.template',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_1',
      label: 'Test reaction',
      effects: [{ kind: 'reputation_score', delta: 0.05 }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const traces = getTraces();
    const applied = traces.filter(t => t.category === 'encounter_aftermath_applied');
    expect(applied).toHaveLength(1);
    expect(applied[0].category).toBe('encounter_aftermath_applied');
    if (applied[0].category === 'encounter_aftermath_applied') {
      expect(applied[0].encounterId).toBe('enc.test.template');
      expect(applied[0].reactionId).toBe('react_1');
      expect(applied[0].effectKinds).toEqual(['reputation_score']);
    }
  });

  it('emits encounter_aftermath_effect for each effect in the reaction', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-1', templateId: 'enc.test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_multi',
      label: 'Multi-effect',
      effects: [
        { kind: 'reputation_score', delta: 0.02 },
        { kind: 'reputation_tally', key: 'test.tally', delta: 1 },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'A narrative ripple.',
          significance: 0.5,
        },
      ],
      closeAfterSelection: false,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const effectTraces = getTraces().filter(t => t.category === 'encounter_aftermath_effect');
    expect(effectTraces).toHaveLength(3);
    const kinds = effectTraces.map(t => {
      if (t.category === 'encounter_aftermath_effect') return t.effectKind;
      return null;
    });
    expect(kinds).toEqual(['reputation_score', 'reputation_tally', 'recent_event']);
    // All should be success
    effectTraces.forEach(t => {
      if (t.category === 'encounter_aftermath_effect') expect(t.success).toBe(true);
    });
  });

  it('emits encounter_aftermath_effect with success=false when actor node missing', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_test', actorId: 'actor-NONEXISTENT', templateId: 'enc.test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_fail',
      label: 'Fail reaction',
      effects: [{ kind: 'reputation_score', delta: 0.1 }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const effectTraces = getTraces().filter(t => t.category === 'encounter_aftermath_effect');
    expect(effectTraces).toHaveLength(1);
    if (effectTraces[0].category === 'encounter_aftermath_effect') {
      expect(effectTraces[0].success).toBe(false);
      expect(effectTraces[0].failReason).toBe('actor_node_missing');
    }
  });

  it('emits encounter_seed_planted + encounter_aftermath_effect for encounter_seed effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_seed', actorId: 'actor-1', templateId: 'enc.source',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_seed',
      label: 'Plant a seed',
      effects: [{
        kind: 'encounter_seed',
        encounterFamily: 'thieves_guild',
        seedLabel: 'The mark knows your face',
        delayTicks: 10,
        priority: 1.5,
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const plantedTrace = traces.filter(t => t.category === 'encounter_seed_planted');
    expect(effectTrace).toHaveLength(1);
    expect(plantedTrace).toHaveLength(1);
    if (plantedTrace[0].category === 'encounter_seed_planted') {
      expect(plantedTrace[0].encounterFamily).toBe('thieves_guild');
      expect(plantedTrace[0].seedLabel).toBe('The mark knows your face');
      expect(plantedTrace[0].eligibleAfterTick).toBe(15);
    }
  });

  it('emits hidden_mark_placed + encounter_aftermath_effect for hidden_mark effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_mark', actorId: 'actor-1', templateId: 'enc.marking',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_mark',
      label: 'Leave a mark',
      effects: [{
        kind: 'hidden_mark',
        category: 'suspicion',
        severity: 0.7,
        label: 'Seen at the scene',
        revealFamilies: ['investigation', 'thieves_guild'],
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const markTrace = traces.filter(t => t.category === 'hidden_mark_placed');
    expect(effectTrace).toHaveLength(1);
    expect(markTrace).toHaveLength(1);
    if (markTrace[0].category === 'hidden_mark_placed') {
      expect(markTrace[0].markCategory).toBe('suspicion');
      expect(markTrace[0].severity).toBe(0.7);
      expect(markTrace[0].revealFamilies).toContain('investigation');
    }
  });

  it('emits intelligence_granted + encounter_aftermath_effect for intelligence effects', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_intel', actorId: 'actor-1', templateId: 'enc.scouting',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_intel',
      label: 'File the report',
      effects: [{
        kind: 'intelligence',
        category: 'patrol_routes',
        label: 'North gate rotation schedule',
        detail: 'Guards rotate every 4 ticks',
        reliability: 0.9,
        targetRegion: 'city_north',
      }],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 5);
    const traces = getTraces();
    const effectTrace = traces.filter(t => t.category === 'encounter_aftermath_effect');
    const intelTrace = traces.filter(t => t.category === 'intelligence_granted');
    expect(effectTrace).toHaveLength(1);
    expect(intelTrace).toHaveLength(1);
    if (intelTrace[0].category === 'intelligence_granted') {
      expect(intelTrace[0].intelCategory).toBe('patrol_routes');
      expect(intelTrace[0].reliability).toBe(0.9);
      expect(intelTrace[0].targetRegion).toBe('city_north');
    }
  });

  it('contract: multi-effect reaction produces correct trace counts (1 applied + N effect + sub-traces)', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_contract', actorId: 'actor-1', templateId: 'enc.contract_test',
      targetId: 'actor-1', scale: 'personal', source: 'agent',
      startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
      resolved: true, outcome: 'success', stepOutcomes: [],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'react_contract',
      label: 'Contract test',
      effects: [
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'Something happened.',
          significance: 0.5,
        },
        {
          kind: 'hidden_mark',
          category: 'suspicion',
          severity: 0.3,
          label: 'Noticed',
          revealFamilies: ['investigation'],
        },
        {
          kind: 'encounter_seed',
          encounterFamily: 'city_watch',
          seedLabel: 'The watch has questions',
          delayTicks: 5,
          priority: 1.0,
        },
        {
          kind: 'intelligence',
          category: 'faction_activity',
          label: 'Guild meets at the mill',
          detail: 'Weekly gathering point identified.',
          reliability: 0.75,
        },
      ],
      closeAfterSelection: true,
    };
    applyEncounterAftermathReaction(state, action, reaction, 10);
    const traces = getTraces();
    // 1 applied + 4 per-effect + 1 mark_placed + 1 seed_planted + 1 intel_granted
    expect(traces.filter(t => t.category === 'encounter_aftermath_applied')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'encounter_aftermath_effect')).toHaveLength(4);
    expect(traces.filter(t => t.category === 'hidden_mark_placed')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'encounter_seed_planted')).toHaveLength(1);
    expect(traces.filter(t => t.category === 'intelligence_granted')).toHaveLength(1);
  });
});

describe('applyEncounterAftermathReaction', () => {
  it('applies general aftermath effects back into the world model', () => {
    const state = createMinimalGameState();
    const action: UnifiedAction = {
      actionId: 'ua_gate_duty',
      actorId: 'actor-1',
      templateId: 'cg.quest.gate_duty',
      targetId: 'loc-1',
      scale: 'personal',
      source: 'agent',
      startTick: 10,
      currentStep: 2,
      stepProgress: 1,
      stepDuration: 1,
      resolved: true,
      outcome: 'success',
      stepOutcomes: ['success', 'success', 'success'],
      clearanceGateIds: ['gate-1'],
    };
    const reaction: EncounterAftermathReaction = {
      id: 'follow_witness_story',
      label: "Follow the witness's telling",
      effects: [
        { kind: 'reputation_score', delta: 0.03 },
        { kind: 'reputation_tally', key: 'gate_duty.witness_story_followed', delta: 1 },
        { kind: 'clearance_gate_tag', tag: '#witness_story_followed' },
        {
          kind: 'recent_event',
          eventType: 'ripple_consequence',
          message: 'You keep a finger on the witness’s telling as it leaves the gate.',
          significance: 0.61,
        },
      ],
      closeAfterSelection: true,
    };

    const updated = applyEncounterAftermathReaction(state, action, reaction, 20);
    const actor = updated.graph.getNode('actor-1');
    expect((actor?.properties?.reputationScore as number | undefined) ?? 0).toBeGreaterThan(0);
    expect((actor?.properties?.reputationTallies as Record<string, number>)['gate_duty.witness_story_followed']).toBe(1);
    expect(updated.clearanceGateStates?.get('gate-1')?.followOnTags).toContain('#witness_story_followed');
    expect(updated.recentEvents.at(-1)?.message).toContain('witness’s telling');
    expect(updated.tickEvents.at(-1)?.type).toBe('ripple_consequence');
  });
});
