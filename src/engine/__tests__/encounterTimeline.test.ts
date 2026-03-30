import { describe, it, expect, beforeEach } from 'vitest';
import {
  appendEvent,
  getTimeline,
  getTrackedAgentIds,
  clearTimelines,
  MAX_EVENTS_PER_AGENT,
  type TimelineEvent,
} from '../encounterTimeline';

describe('encounterTimeline', () => {
  beforeEach(() => {
    clearTimelines();
  });

  it('returns empty array for unknown agent', () => {
    expect(getTimeline('unknown_agent')).toEqual([]);
  });

  it('appends events and retrieves them in order', () => {
    const ev1: TimelineEvent = { phase: 'DECIDE', tick: 1, targetEncounter: 'enc_1', targetLocation: 'loc_1', targetHex: [3, 4], score: 0.7, travelCost: 2, completionProb: 0.65 };
    const ev2: TimelineEvent = { phase: 'MOVE', tick: 2, fromHex: [3, 4], toHex: [3, 5], cost: '1/2' };

    appendEvent('agent_a', ev1);
    appendEvent('agent_a', ev2);

    const timeline = getTimeline('agent_a');
    expect(timeline).toHaveLength(2);
    expect(timeline[0]).toEqual(ev1);
    expect(timeline[1]).toEqual(ev2);
  });

  it('auto-creates timeline for new agent on append', () => {
    appendEvent('new_agent', { phase: 'IDLE', tick: 5, reason: 'no_candidates', idleAction: 'stay' });
    expect(getTrackedAgentIds()).toContain('new_agent');
    expect(getTimeline('new_agent')).toHaveLength(1);
  });

  it('tracks multiple agents independently', () => {
    appendEvent('agent_a', { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'stay' });
    appendEvent('agent_b', { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'drift', driftTarget: 'loc_x' });
    appendEvent('agent_a', { phase: 'MOVE', tick: 2, fromHex: [0, 0], toHex: [1, 0], cost: '1/1' });

    expect(getTimeline('agent_a')).toHaveLength(2);
    expect(getTimeline('agent_b')).toHaveLength(1);
    expect(getTrackedAgentIds()).toEqual(expect.arrayContaining(['agent_a', 'agent_b']));
  });

  it('evicts oldest events when MAX_EVENTS_PER_AGENT exceeded', () => {
    for (let i = 0; i < MAX_EVENTS_PER_AGENT + 5; i++) {
      appendEvent('agent_a', { phase: 'IDLE', tick: i, reason: `reason_${i}`, idleAction: 'stay' });
    }

    const timeline = getTimeline('agent_a');
    expect(timeline).toHaveLength(MAX_EVENTS_PER_AGENT);
    // First event should be tick 5 (0–4 were evicted)
    expect(timeline[0].tick).toBe(5);
    expect(timeline[timeline.length - 1].tick).toBe(MAX_EVENTS_PER_AGENT + 4);
  });

  it('clearTimelines removes all agents', () => {
    appendEvent('agent_a', { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'stay' });
    appendEvent('agent_b', { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'stay' });

    clearTimelines();

    expect(getTrackedAgentIds()).toEqual([]);
    expect(getTimeline('agent_a')).toEqual([]);
    expect(getTimeline('agent_b')).toEqual([]);
  });

  it('handles all timeline event phases', () => {
    const events: TimelineEvent[] = [
      { phase: 'DECIDE', tick: 1, targetEncounter: 'e1', targetLocation: 'l1', targetHex: [0, 0], score: 0.5, travelCost: 3, completionProb: 0.8 },
      { phase: 'IDLE', tick: 2, reason: 'no_candidates', idleAction: 'drift', driftTarget: 'l2' },
      { phase: 'MOVE', tick: 3, fromHex: [0, 0], toHex: [1, 0], cost: '1/3', road: 'trail' },
      { phase: 'ARRIVE', tick: 4, location: 'Thornwall', hex: [1, 0] },
      { phase: 'ENCOUNTER_START', tick: 5, encounter: 'ancient_ward', steps: 3, threat: 0.6, reach: 'Warding' },
      { phase: 'ENCOUNTER_STEP', tick: 6, step: '1/3', reach: 'Warding', diff: 45, cap: 62, prob: 0.71, roll: 0.38, result: 'PASS' },
      { phase: 'ENCOUNTER_END', tick: 7, encounter: 'ancient_ward', status: 'completed', reward: 'Iron Talisman' },
      { phase: 'REROUTE', tick: 8, oldTarget: 'l1', newTarget: 'l3', reason: 'better_encounter' },
      { phase: 'ACTION_START', tick: 9, template: 'Raise Force', target: 'Market', reach: 'iron', scale: 'personal', steps: 1, source: 'agent' },
      { phase: 'ACTION_STEP', tick: 10, template: 'Raise Force', step: '1/1', reach: 'iron', diff: 0.3, cap: 0.45, prob: 0.15, roll: 12, result: 'PASS' },
      { phase: 'ACTION_END', tick: 10, template: 'Raise Force', status: 'success', stepResults: 'P' },
    ];

    for (const ev of events) {
      appendEvent('agent_a', ev);
    }

    const timeline = getTimeline('agent_a');
    expect(timeline).toHaveLength(11);
    expect(timeline.map(e => e.phase)).toEqual([
      'DECIDE', 'IDLE', 'MOVE', 'ARRIVE', 'ENCOUNTER_START', 'ENCOUNTER_STEP', 'ENCOUNTER_END', 'REROUTE',
      'ACTION_START', 'ACTION_STEP', 'ACTION_END',
    ]);
  });

  it('records ACTION_START with correct fields', () => {
    const ev: TimelineEvent = {
      phase: 'ACTION_START', tick: 5, template: 'Dream', target: 'Alice',
      reach: 'heart', scale: 'cosmic', steps: 1, source: 'player',
    };
    appendEvent('asc-1', ev);
    const timeline = getTimeline('asc-1');
    expect(timeline[0]).toEqual(ev);
  });

  it('records ACTION_STEP with resolution stats', () => {
    const ev: TimelineEvent = {
      phase: 'ACTION_STEP', tick: 6, template: 'Fortify', step: '2/3',
      reach: 'stone', diff: 0.4, cap: 0.55, prob: 0.15, roll: 42, result: 'FAIL',
    };
    appendEvent('agent_a', ev);
    expect(getTimeline('agent_a')[0].phase).toBe('ACTION_STEP');
  });

  it('records ACTION_END with step results summary', () => {
    const ev: TimelineEvent = {
      phase: 'ACTION_END', tick: 8, template: 'Trade Route',
      status: 'failure', stepResults: 'PPF',
    };
    appendEvent('agent_a', ev);
    const timeline = getTimeline('agent_a');
    expect(timeline[0]).toEqual(ev);
  });
});
