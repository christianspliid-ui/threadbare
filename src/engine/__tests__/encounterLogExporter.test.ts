import { describe, it, expect } from 'vitest';
import { formatEncounterLog, makeFilename, type ExportOptions } from '../encounterLogExporter';
import type { TimelineEvent } from '../encounterTimeline';

const BASE_OPTIONS: ExportOptions = {
  agentId: 'agent_kaelen',
  agentName: 'Kaelen Ashford',
  seed: '7a3f2b4e',
  tickRange: [1, 20],
};

describe('formatEncounterLog', () => {
  it('produces header-only file for empty timeline', () => {
    const result = formatEncounterLog([], BASE_OPTIONS);

    expect(result).toContain('# ENCOUNTER LOG');
    expect(result).toContain('# Seed: 7a3f2b4e');
    expect(result).toContain('# Agent: Kaelen Ashford (agent_kaelen)');
    expect(result).toContain('# (no events recorded)');
    expect(result).not.toContain('TICK\tPHASE\tDETAIL');
  });

  it('formats DECIDE event correctly', () => {
    const events: TimelineEvent[] = [
      { phase: 'DECIDE', tick: 12, targetEncounter: 'ancient_ward_puzzle', targetLocation: 'Ruins of Ashenmoor', targetHex: [4, 7], score: 0.73, travelCost: 3, completionProb: 0.68 },
    ];

    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [12, 12] });
    const lines = result.split('\n');
    const dataLine = lines.find(l => l.startsWith('12'));

    expect(dataLine).toBeDefined();
    expect(dataLine).toContain('DECIDE');
    expect(dataLine).toContain('target=Ruins of Ashenmoor');
    expect(dataLine).toContain('encounter=ancient_ward_puzzle');
    expect(dataLine).toContain('score=0.73');
    expect(dataLine).toContain('hex=(4,7)');
    expect(dataLine).toContain('travelCost=3');
    expect(dataLine).toContain('prob=0.68');
  });

  it('formats IDLE event with optional driftTarget', () => {
    const events: TimelineEvent[] = [
      { phase: 'IDLE', tick: 5, reason: 'no_candidates_after_cooldown', idleAction: 'drift', driftTarget: 'Thornwall' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [5, 5] });
    expect(result).toContain('reason=no_candidates_after_cooldown');
    expect(result).toContain('action=drift');
    expect(result).toContain('driftTarget=Thornwall');
  });

  it('formats IDLE without driftTarget when not present', () => {
    const events: TimelineEvent[] = [
      { phase: 'IDLE', tick: 5, reason: 'below_score_threshold', idleAction: 'stay' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [5, 5] });
    expect(result).toContain('action=stay');
    expect(result).not.toContain('driftTarget');
  });

  it('formats MOVE event with and without road', () => {
    const events: TimelineEvent[] = [
      { phase: 'MOVE', tick: 13, fromHex: [3, 5], toHex: [3, 6], cost: '1/3', road: 'trail' },
      { phase: 'MOVE', tick: 14, fromHex: [3, 6], toHex: [4, 6], cost: '1/3' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [13, 14] });
    expect(result).toContain('(3,5)→(3,6) | cost=1/3 | road=trail');
    expect(result).toContain('(3,6)→(4,6) | cost=1/3');
    // Second MOVE should not have road field
    const lines = result.split('\n');
    const secondMove = lines.find(l => l.startsWith('14'));
    expect(secondMove).not.toContain('road=');
  });

  it('formats ARRIVE event', () => {
    const events: TimelineEvent[] = [
      { phase: 'ARRIVE', tick: 15, location: 'Ruins of Ashenmoor', hex: [4, 7] },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [15, 15] });
    expect(result).toContain('Ruins of Ashenmoor | hex=(4,7)');
  });

  it('formats ENCOUNTER_START event', () => {
    const events: TimelineEvent[] = [
      { phase: 'ENCOUNTER_START', tick: 15, encounter: 'ancient_ward_puzzle', steps: 3, threat: 0.6, reach: 'Warding' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [15, 15] });
    expect(result).toContain('ancient_ward_puzzle | steps=3 | threat=0.6 | reach=Warding');
  });

  it('formats ENCOUNTER_STEP event', () => {
    const events: TimelineEvent[] = [
      { phase: 'ENCOUNTER_STEP', tick: 16, step: '1/3', reach: 'Warding', diff: 45, cap: 62, prob: 0.71, roll: 0.38, result: 'PASS' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [16, 16] });
    expect(result).toContain('step=1/3 | reach=Warding | diff=45 | cap=62 | prob=0.71 | roll=0.38 | PASS');
  });

  it('formats ENCOUNTER_END with and without reward', () => {
    const events: TimelineEvent[] = [
      { phase: 'ENCOUNTER_END', tick: 17, encounter: 'ancient_ward_puzzle', status: 'abandoned' },
      { phase: 'ENCOUNTER_END', tick: 20, encounter: 'forest_shrine', status: 'completed', reward: 'Iron Talisman' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [17, 20] });
    expect(result).toContain('ancient_ward_puzzle | status=abandoned');
    expect(result).not.toContain('reward=none'); // no reward field when undefined
    expect(result).toContain('forest_shrine | status=completed | reward=Iron Talisman');
  });

  it('formats REROUTE event', () => {
    const events: TimelineEvent[] = [
      { phase: 'REROUTE', tick: 10, oldTarget: 'Ruins of Ashenmoor', newTarget: 'Thornwall', reason: 'better_encounter' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [10, 10] });
    expect(result).toContain('old=Ruins of Ashenmoor | new=Thornwall | reason=better_encounter');
  });

  it('produces tab-separated columns', () => {
    const events: TimelineEvent[] = [
      { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'stay' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [1, 1] });
    const dataLines = result.split('\n').filter(l => !l.startsWith('#'));
    // Header line
    expect(dataLines[0]).toBe('TICK\tPHASE\tDETAIL');
    // Data line should have exactly 2 tabs
    const tabs = (dataLines[1].match(/\t/g) ?? []).length;
    expect(tabs).toBe(2);
  });

  it('includes tick range in header', () => {
    const events: TimelineEvent[] = [
      { phase: 'IDLE', tick: 5, reason: 'test', idleAction: 'stay' },
      { phase: 'IDLE', tick: 147, reason: 'test', idleAction: 'stay' },
    ];
    const result = formatEncounterLog(events, { ...BASE_OPTIONS, tickRange: [5, 147] });
    expect(result).toContain('# Ticks: 5–147');
  });
});

describe('makeFilename', () => {
  it('produces safe filename from agent name', () => {
    expect(makeFilename('7a3f2b4e', 'Kaelen Ashford')).toBe('encounter-log_7a3f2b4e_Kaelen_Ashford.tsv');
  });

  it('sanitizes special characters', () => {
    expect(makeFilename('abc', 'Agent "The Bold"')).toBe('encounter-log_abc_Agent__The_Bold_.tsv');
  });
});
