/**
 * Tests for balanceTelemetry.ts — storage, record helpers, and session isolation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBalanceTelemetry,
  recordBalanceEvent,
  getBalanceEvents,
  getTrackedAgentIds,
  setTrackedAgents,
  getTrackedAgentEvents,
  getLatestEncounterDecisionForAgent,
  getLatestEncounterDecisionsByAgent,
  clearBalanceTelemetry,
  selectDefaultTrackedHero,
  exportBalanceTelemetry,
  BALANCE_RECENT_EVENTS_CAP,
  BALANCE_AGENT_EVENTS_CAP,
} from '../balanceTelemetry';
import { createSimulationRuntime } from '../simulationRuntime';
import type { SimulationRuntime } from '../simulationRuntime';
import type { BalanceEvent } from '../../types/balanceEval';

// ─── Helpers ──────────────────────────────────────────────────────

function makeRuntime(): SimulationRuntime {
  return createSimulationRuntime();
}

function makeEvent(overrides?: Partial<Omit<BalanceEvent, 'seq'>>): Omit<BalanceEvent, 'seq'> {
  return {
    tick: 1,
    kind: 'step_resolved',
    agentId: 'agent-1',
    sourceSystem: 'unified_action',
    result: 'success',
    ...overrides,
  };
}

// ─── Factory ──────────────────────────────────────────────────────

describe('createBalanceTelemetry()', () => {
  it('creates telemetry with empty counters', () => {
    const t = createBalanceTelemetry();
    expect(t.counters.totalStepsAttempted).toBe(0);
    expect(t.counters.totalEncountersAttempted).toBe(0);
    expect(t.counters.totalRewardsGranted).toBe(0);
    expect(t.counters.totalDissolutions).toBe(0);
  });

  it('stores seed and targetVersion in meta', () => {
    const t = createBalanceTelemetry({ seed: 42, targetVersion: 'v1.0' });
    expect(t.meta.seed).toBe(42);
    expect(t.meta.targetVersion).toBe('v1.0');
  });

  it('has no tracked agents by default', () => {
    const t = createBalanceTelemetry();
    expect(t.trackedAgentIds).toHaveLength(0);
  });
});

// ─── createSimulationRuntime ──────────────────────────────────────

describe('createSimulationRuntime() balance fields', () => {
  it('initializes balanceTelemetry', () => {
    const rt = createSimulationRuntime();
    expect(rt.balanceTelemetry).not.toBeNull();
  });

  it('initializes balanceTelemetryVersion to 0', () => {
    const rt = createSimulationRuntime();
    expect(rt.balanceTelemetryVersion).toBe(0);
  });
});

// ─── recordBalanceEvent ───────────────────────────────────────────

describe('recordBalanceEvent()', () => {
  let rt: SimulationRuntime;
  beforeEach(() => { rt = makeRuntime(); });

  it('increments balanceTelemetryVersion on each record', () => {
    recordBalanceEvent(rt, makeEvent());
    expect(rt.balanceTelemetryVersion).toBe(1);
    recordBalanceEvent(rt, makeEvent());
    expect(rt.balanceTelemetryVersion).toBe(2);
  });

  it('assigns monotonically increasing seq values', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 1 }));
    recordBalanceEvent(rt, makeEvent({ tick: 2 }));
    const events = getBalanceEvents(rt);
    expect(events[0].seq).toBe(0);
    expect(events[1].seq).toBe(1);
  });

  it('is fail-soft when balanceTelemetry is null', () => {
    rt.balanceTelemetry = null;
    expect(() => recordBalanceEvent(rt, makeEvent())).not.toThrow();
    expect(rt.balanceTelemetryVersion).toBe(0); // unchanged
  });

  it('does not throw on any event kind', () => {
    const kinds: Array<Omit<BalanceEvent, 'seq'>['kind']> = [
      'step_resolved', 'action_resolved', 'encounter_resolved',
      'encounter_decision',
      'quintessence_changed', 'reward_granted', 'attachment_changed',
      'growth_applied', 'state_transition', 'quintessence_push',
      'quintessence_resist', 'forecast_recorded',
    ];
    for (const kind of kinds) {
      expect(() => recordBalanceEvent(rt, makeEvent({ kind }))).not.toThrow();
    }
  });
});

// ─── Counter accumulation ─────────────────────────────────────────

describe('counter accumulation', () => {
  let rt: SimulationRuntime;
  beforeEach(() => { rt = makeRuntime(); });

  it('increments totalStepsAttempted on step_resolved', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'step_resolved', result: 'success' }));
    expect(rt.balanceTelemetry!.counters.totalStepsAttempted).toBe(1);
    expect(rt.balanceTelemetry!.counters.totalStepsSucceeded).toBe(1);
  });

  it('counts failure separately from success', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'step_resolved', result: 'failure' }));
    expect(rt.balanceTelemetry!.counters.totalStepsSucceeded).toBe(0);
    expect(rt.balanceTelemetry!.counters.totalStepsAttempted).toBe(1);
  });

  it('tracks stepSuccessByBand per threat band', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'step_resolved', result: 'success', threatBand: 'moderate' }));
    recordBalanceEvent(rt, makeEvent({ kind: 'step_resolved', result: 'failure', threatBand: 'moderate' }));
    const stats = rt.balanceTelemetry!.counters.stepSuccessByBand['moderate']!;
    expect(stats.attempts).toBe(2);
    expect(stats.successes).toBe(1);
  });

  it('increments totalEncountersCompleted on encounter_resolved with completed status', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'encounter_resolved', finalStatus: 'completed', threatBand: 'easy' }));
    expect(rt.balanceTelemetry!.counters.totalEncountersCompleted).toBe(1);
    expect(rt.balanceTelemetry!.counters.totalEncountersAbandoned).toBe(0);
  });

  it('increments totalEncountersAbandoned on encounter_resolved with abandoned status', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'encounter_resolved', finalStatus: 'abandoned', threatBand: 'easy' }));
    expect(rt.balanceTelemetry!.counters.totalEncountersAbandoned).toBe(1);
    expect(rt.balanceTelemetry!.counters.totalEncountersCompleted).toBe(0);
  });

  it('increments totalRewardsGranted when rewardTemplateId is set', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'reward_granted', rewardTemplateId: 'tmpl-1', rewardCategory: 'possession' }));
    expect(rt.balanceTelemetry!.counters.totalRewardsGranted).toBe(1);
    expect(rt.balanceTelemetry!.counters.totalRewardsMissed).toBe(0);
    expect(rt.balanceTelemetry!.counters.rewardsByCategory['possession']).toBe(1);
  });

  it('increments totalRewardsMissed when rewardTemplateId is null', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'reward_granted', rewardTemplateId: null }));
    expect(rt.balanceTelemetry!.counters.totalRewardsMissed).toBe(1);
    expect(rt.balanceTelemetry!.counters.totalRewardsGranted).toBe(0);
  });

  it('increments totalGrowthBeats on growth_applied', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'growth_applied', growthReach: 'iron' }));
    expect(rt.balanceTelemetry!.counters.totalGrowthBeats).toBe(1);
  });

  it('increments totalDissolutions on state_transition dissolved', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'state_transition', transitionType: 'dissolved' }));
    expect(rt.balanceTelemetry!.counters.totalDissolutions).toBe(1);
  });

  it('tracks quintessence negative delta separately from positive', () => {
    recordBalanceEvent(rt, makeEvent({ kind: 'quintessence_changed', quintessenceDelta: -0.05 }));
    recordBalanceEvent(rt, makeEvent({ kind: 'quintessence_changed', quintessenceDelta: 0.02 }));
    expect(rt.balanceTelemetry!.counters.quintessenceTotalNegativeDelta).toBeCloseTo(-0.05);
    expect(rt.balanceTelemetry!.counters.quintessenceTotalPositiveDelta).toBeCloseTo(0.02);
  });

  it('tracks encounter decision funnel counters by type, template, and location subtype', () => {
    recordBalanceEvent(rt, makeEvent({
      kind: 'encounter_decision',
      decisionType: 'queue_movement',
      templateId: 'encounter.bandit_ambush',
      locationSubtype: 'forest',
      travelCost: 2,
      forecastedUtility: 0.6,
      forecastedCompletionProb: 0.4,
      threaded: true,
    }));
    recordBalanceEvent(rt, makeEvent({
      kind: 'encounter_decision',
      decisionType: 'idle',
      locationSubtype: 'forest',
      idleReason: 'no_candidates_after_filter',
    }));
    recordBalanceEvent(rt, makeEvent({
      kind: 'encounter_decision',
      decisionType: 'forced_travel',
      locationSubtype: 'forest',
      idleReason: 'no_candidates_after_filter',
      threaded: true,
    }));

    const counters = rt.balanceTelemetry!.counters;
    expect(counters.encounterDecisionCounts['queue_movement']).toBe(1);
    expect(counters.encounterDecisionCounts['idle']).toBe(1);
    expect(counters.encounterDecisionCounts['forced_travel']).toBe(1);
    expect(counters.idleReasonCounts['no_candidates_after_filter']).toBe(2);
    expect(counters.decisionTemplateStats['encounter.bandit_ambush']).toMatchObject({
      decisions: 1,
      queueMovement: 1,
      threadedDecisions: 1,
      travelCostTotal: 2,
      forecastedUtilityTotal: 0.6,
      forecastedCompletionProbTotal: 0.4,
    });
    expect(counters.decisionLocationSubtypeStats['forest']).toMatchObject({
      decisions: 3,
      selectedDecisions: 1,
      idleDecisions: 1,
      forcedTravelDecisions: 1,
      threadedDecisions: 2,
    });
    expect(counters.decisionLocationSubtypeStats['forest'].idleReasons['no_candidates_after_filter']).toBe(2);
  });
});

// ─── Milestones ───────────────────────────────────────────────────

describe('milestones', () => {
  let rt: SimulationRuntime;
  beforeEach(() => { rt = makeRuntime(); });

  it('sets firstRewardTick on first reward_granted with a templateId', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 10, kind: 'reward_granted', rewardTemplateId: 'tmpl-1' }));
    expect(rt.balanceTelemetry!.milestones.firstRewardTick).toBe(10);
  });

  it('does not set firstRewardTick for empty pool events (null templateId)', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 5, kind: 'reward_granted', rewardTemplateId: null }));
    expect(rt.balanceTelemetry!.milestones.firstRewardTick).toBeNull();
  });

  it('does not overwrite firstRewardTick once set', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 10, kind: 'reward_granted', rewardTemplateId: 'tmpl-1' }));
    recordBalanceEvent(rt, makeEvent({ tick: 20, kind: 'reward_granted', rewardTemplateId: 'tmpl-2' }));
    expect(rt.balanceTelemetry!.milestones.firstRewardTick).toBe(10);
  });

  it('sets firstGrowthBeatTick on growth_applied', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 55, kind: 'growth_applied' }));
    expect(rt.balanceTelemetry!.milestones.firstGrowthBeatTick).toBe(55);
  });

  it('sets firstSetbackTick on dissolved state_transition', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 100, kind: 'state_transition', transitionType: 'dissolved' }));
    expect(rt.balanceTelemetry!.milestones.firstSetbackTick).toBe(100);
  });

  it('sets firstSetbackTick on large quintessence drop', () => {
    recordBalanceEvent(rt, makeEvent({ tick: 50, kind: 'quintessence_changed', quintessenceDelta: -0.1 }));
    expect(rt.balanceTelemetry!.milestones.firstSetbackTick).toBe(50);
  });
});

// ─── Tracked agents ───────────────────────────────────────────────

describe('tracked agents', () => {
  let rt: SimulationRuntime;
  beforeEach(() => { rt = makeRuntime(); });

  it('setTrackedAgents registers agents for journey tracking', () => {
    setTrackedAgents(rt, ['agent-A', 'agent-B']);
    expect(getTrackedAgentIds(rt)).toEqual(['agent-A', 'agent-B']);
  });

  it('stores events for tracked agents in their journey buffer', () => {
    setTrackedAgents(rt, ['agent-A']);
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-A', kind: 'step_resolved' }));
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-B', kind: 'step_resolved' })); // not tracked
    expect(getTrackedAgentEvents(rt, 'agent-A')).toHaveLength(1);
    expect(getTrackedAgentEvents(rt, 'agent-B')).toHaveLength(0);
  });

  it('limits tracked agent event buffer to BALANCE_AGENT_EVENTS_CAP', () => {
    setTrackedAgents(rt, ['agent-A']);
    for (let i = 0; i < BALANCE_AGENT_EVENTS_CAP + 50; i++) {
      recordBalanceEvent(rt, makeEvent({ agentId: 'agent-A', tick: i }));
    }
    expect(getTrackedAgentEvents(rt, 'agent-A').length).toBeLessThanOrEqual(BALANCE_AGENT_EVENTS_CAP);
  });
});

// ─── Bounded buffer ───────────────────────────────────────────────

describe('bounded recent events buffer', () => {
  it('caps recent events at BALANCE_RECENT_EVENTS_CAP', () => {
    const rt = makeRuntime();
    for (let i = 0; i < BALANCE_RECENT_EVENTS_CAP + 100; i++) {
      recordBalanceEvent(rt, makeEvent({ tick: i }));
    }
    expect(getBalanceEvents(rt).length).toBeLessThanOrEqual(BALANCE_RECENT_EVENTS_CAP);
  });
});

// ─── Session isolation ────────────────────────────────────────────

describe('session isolation', () => {
  it('two runtimes do not share telemetry', () => {
    const rt1 = makeRuntime();
    const rt2 = makeRuntime();
    recordBalanceEvent(rt1, makeEvent());
    expect(getBalanceEvents(rt1)).toHaveLength(1);
    expect(getBalanceEvents(rt2)).toHaveLength(0);
  });

  it('clearBalanceTelemetry resets events and counters', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-A', kind: 'step_resolved' }));
    clearBalanceTelemetry(rt);
    expect(getBalanceEvents(rt)).toHaveLength(0);
    expect(rt.balanceTelemetry!.counters.totalStepsAttempted).toBe(0);
  });

  it('clearBalanceTelemetry preserves tracked agent ids', () => {
    const rt = makeRuntime();
    setTrackedAgents(rt, ['agent-A']);
    clearBalanceTelemetry(rt);
    expect(getTrackedAgentIds(rt)).toEqual(['agent-A']);
  });
});

// ─── selectDefaultTrackedHero ─────────────────────────────────────

describe('selectDefaultTrackedHero()', () => {
  it('returns null for empty list', () => {
    expect(selectDefaultTrackedHero([])).toBeNull();
  });

  it('returns the lexicographically first id', () => {
    const hero = selectDefaultTrackedHero(['agent-c', 'agent-a', 'agent-b']);
    expect(hero).toBe('agent-a');
  });
});

// ─── getBalanceEvents filtering ───────────────────────────────────

describe('getBalanceEvents() filtering', () => {
  let rt: SimulationRuntime;
  beforeEach(() => {
    rt = makeRuntime();
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-1', kind: 'step_resolved' }));
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-2', kind: 'reward_granted', rewardTemplateId: 'tmpl-1' }));
    recordBalanceEvent(rt, makeEvent({ agentId: 'agent-1', kind: 'growth_applied' }));
  });

  it('filters by agentId', () => {
    const events = getBalanceEvents(rt, { agentId: 'agent-1' });
    expect(events.every(e => e.agentId === 'agent-1')).toBe(true);
    expect(events).toHaveLength(2);
  });

  it('filters by kind', () => {
    const events = getBalanceEvents(rt, { kind: 'reward_granted' });
    expect(events).toHaveLength(1);
  });

  it('limits with limit option', () => {
    const events = getBalanceEvents(rt, { limit: 2 });
    expect(events).toHaveLength(2);
  });
});

describe('latest encounter decision helpers', () => {
  it('returns the newest encounter decision for a single agent', () => {
    const rt = makeRuntime();
    recordBalanceEvent(rt, makeEvent({
      tick: 3,
      agentId: 'agent-1',
      kind: 'encounter_decision',
      decisionType: 'idle',
      candidatesAfterCooldown: 0,
    }));
    recordBalanceEvent(rt, makeEvent({
      tick: 4,
      agentId: 'agent-1',
      kind: 'encounter_decision',
      decisionType: 'queue_movement',
      candidatesAfterCooldown: 2,
      rankedEncounterPool: [{
        rank: 1,
        templateId: 'encounter.trade_route',
        templateName: 'Trade Route',
        locationId: 'loc-2',
        locationName: 'Green-shroud',
        action: 'queue_movement',
        reachPrimary: 'gold',
        reachSecondary: 'eye',
        encounterType: 'trade',
        threatBand: 'easy',
        stepCount: 2,
        totalTickCost: 4,
        rewardEstimate: 1.1,
        completionProb: 0.58,
        travelCost: 0.4,
        finalScore: 1.2,
        selected: true,
      }],
    }));

    expect(getLatestEncounterDecisionForAgent(rt, 'agent-1')?.decisionType).toBe('queue_movement');
    expect(getLatestEncounterDecisionForAgent(rt, 'agent-1')?.rankedEncounterPool?.[0]?.templateName).toBe('Trade Route');
  });

  it('returns the newest encounter decision per requested agent', () => {
    const rt = makeRuntime();
    recordBalanceEvent(rt, makeEvent({
      tick: 1,
      agentId: 'agent-1',
      kind: 'encounter_decision',
      decisionType: 'idle',
    }));
    recordBalanceEvent(rt, makeEvent({
      tick: 2,
      agentId: 'agent-2',
      kind: 'encounter_decision',
      decisionType: 'start_local',
    }));
    recordBalanceEvent(rt, makeEvent({
      tick: 3,
      agentId: 'agent-1',
      kind: 'encounter_decision',
      decisionType: 'attempt_remote',
    }));

    const latest = getLatestEncounterDecisionsByAgent(rt, ['agent-1', 'agent-2']);

    expect(latest.get('agent-1')?.decisionType).toBe('attempt_remote');
    expect(latest.get('agent-2')?.decisionType).toBe('start_local');
  });
});

// ─── exportBalanceTelemetry ───────────────────────────────────────

describe('exportBalanceTelemetry()', () => {
  it('returns null when balanceTelemetry is null', () => {
    const rt = makeRuntime();
    rt.balanceTelemetry = null;
    expect(exportBalanceTelemetry(rt)).toBeNull();
  });

  it('returns a JSON-serializable snapshot', () => {
    const rt = makeRuntime();
    recordBalanceEvent(rt, makeEvent());
    const exported = exportBalanceTelemetry(rt);
    expect(exported).not.toBeNull();
    expect(() => JSON.stringify(exported)).not.toThrow();
    expect((exported as Record<string, unknown>)['recentEventCount']).toBe(1);
  });
});
