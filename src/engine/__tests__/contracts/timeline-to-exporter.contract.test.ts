/**
 * Contract Test: encounterTimeline → encounterLogExporter
 *
 * Verifies that the timeline accumulator's output format is valid input
 * for the log exporter, producing well-formed TSV output. Uses realistic
 * event sequences that mirror what the emission wiring produces.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  appendEvent,
  getTimeline,
  clearTimelines,
  type TimelineEvent,
} from '../../encounterTimeline';
import { formatEncounterLog, makeFilename } from '../../encounterLogExporter';

describe('timeline → exporter contract', () => {
  beforeEach(() => {
    clearTimelines();
  });

  test('realistic agent lifecycle produces valid TSV', () => {
    const agentId = 'agent_kaelen';

    // Simulate a full decide → travel → encounter → outcome sequence
    const events: TimelineEvent[] = [
      { phase: 'DECIDE', tick: 12, targetEncounter: 'ancient_ward_puzzle', targetLocation: 'Ruins of Ashenmoor', targetHex: [4, 7], score: 0.73, travelCost: 3, completionProb: 0.68 },
      { phase: 'MOVE', tick: 13, fromHex: [3, 5], toHex: [3, 6], cost: '1/3', road: 'trail' },
      { phase: 'MOVE', tick: 14, fromHex: [3, 6], toHex: [4, 6], cost: '2/3' },
      { phase: 'MOVE', tick: 15, fromHex: [4, 6], toHex: [4, 7], cost: '3/3' },
      { phase: 'ARRIVE', tick: 15, location: 'Ruins of Ashenmoor', hex: [4, 7] },
      { phase: 'ENCOUNTER_START', tick: 15, encounter: 'ancient_ward_puzzle', steps: 3, threat: 0.6, reach: 'Warding' },
      { phase: 'ENCOUNTER_STEP', tick: 16, step: '1/3', reach: 'Warding', diff: 45, cap: 62, prob: 0.71, roll: 0.38, result: 'PASS' },
      { phase: 'ENCOUNTER_STEP', tick: 17, step: '2/3', reach: 'Lore', diff: 55, cap: 41, prob: 0.34, roll: 0.82, result: 'FAIL' },
      { phase: 'ENCOUNTER_END', tick: 17, encounter: 'ancient_ward_puzzle', status: 'abandoned' },
      { phase: 'IDLE', tick: 18, reason: 'no_candidates_after_cooldown', idleAction: 'drift', driftTarget: 'Thornwall' },
    ];

    for (const ev of events) {
      appendEvent(agentId, ev);
    }

    // Feed real timeline output into exporter
    const timeline = getTimeline(agentId);
    expect(timeline).toHaveLength(10);

    const tsv = formatEncounterLog(timeline, {
      agentId,
      agentName: 'Kaelen Ashford',
      seed: '7a3f2b4e',
      tickRange: [12, 18],
    });

    // Validate TSV structure
    const lines = tsv.split('\n');

    // Header lines
    const headerLines = lines.filter(l => l.startsWith('#'));
    expect(headerLines.length).toBeGreaterThanOrEqual(4);
    expect(headerLines.some(l => l.includes('Seed: 7a3f2b4e'))).toBe(true);
    expect(headerLines.some(l => l.includes('Kaelen Ashford'))).toBe(true);

    // Column header
    const colHeader = lines.find(l => l.startsWith('TICK'));
    expect(colHeader).toBe('TICK\tPHASE\tDETAIL');

    // Data lines
    const dataLines = lines.filter(l => !l.startsWith('#') && l !== 'TICK\tPHASE\tDETAIL' && l.length > 0);
    expect(dataLines).toHaveLength(10);

    // Each data line has exactly 3 tab-separated columns
    for (const line of dataLines) {
      const cols = line.split('\t');
      expect(cols).toHaveLength(3);
      // First column is a number (tick)
      expect(Number.isNaN(Number(cols[0]))).toBe(false);
      // Second column is a known phase
      expect(['DECIDE', 'IDLE', 'MOVE', 'ARRIVE', 'ENCOUNTER_START', 'ENCOUNTER_STEP', 'ENCOUNTER_END', 'REROUTE']).toContain(cols[1]);
    }

    // Verify chronological order
    const ticks = dataLines.map(l => Number(l.split('\t')[0]));
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
    }
  });

  test('multi-agent timelines produce independent logs', () => {
    appendEvent('agent_a', { phase: 'IDLE', tick: 1, reason: 'test', idleAction: 'stay' });
    appendEvent('agent_b', { phase: 'DECIDE', tick: 1, targetEncounter: 'e1', targetLocation: 'loc1', targetHex: [0, 0], score: 0.5, travelCost: 2, completionProb: 0.6 });
    appendEvent('agent_a', { phase: 'DECIDE', tick: 2, targetEncounter: 'e2', targetLocation: 'loc2', targetHex: [1, 1], score: 0.8, travelCost: 1, completionProb: 0.9 });

    const logA = formatEncounterLog(getTimeline('agent_a'), {
      agentId: 'agent_a', agentName: 'Agent A', seed: '123', tickRange: [1, 2],
    });
    const logB = formatEncounterLog(getTimeline('agent_b'), {
      agentId: 'agent_b', agentName: 'Agent B', seed: '123', tickRange: [1, 1],
    });

    // Agent A has 2 events, Agent B has 1
    const dataLinesA = logA.split('\n').filter(l => !l.startsWith('#') && !l.startsWith('TICK') && l.length > 0);
    const dataLinesB = logB.split('\n').filter(l => !l.startsWith('#') && !l.startsWith('TICK') && l.length > 0);
    expect(dataLinesA).toHaveLength(2);
    expect(dataLinesB).toHaveLength(1);

    // Agent names in headers are correct
    expect(logA).toContain('Agent A');
    expect(logB).toContain('Agent B');
  });

  test('empty timeline produces header-only file', () => {
    const log = formatEncounterLog(getTimeline('nonexistent'), {
      agentId: 'nonexistent', agentName: 'Nobody', seed: 'abc', tickRange: [0, 0],
    });

    expect(log).toContain('# (no events recorded)');
    expect(log).not.toContain('TICK\tPHASE\tDETAIL');
  });

  test('reroute events are captured with correct fields', () => {
    appendEvent('agent_a', {
      phase: 'REROUTE', tick: 10, oldTarget: 'Ruins', newTarget: 'Thornwall', reason: 'better_encounter',
    });

    const log = formatEncounterLog(getTimeline('agent_a'), {
      agentId: 'agent_a', agentName: 'Agent A', seed: '42', tickRange: [10, 10],
    });

    expect(log).toContain('REROUTE');
    expect(log).toContain('old=Ruins');
    expect(log).toContain('new=Thornwall');
    expect(log).toContain('reason=better_encounter');
  });

  test('filename is safe for filesystem', () => {
    expect(makeFilename('7a3f', "Kaelen 'The Bold' Ashford")).toBe(
      "encounter-log_7a3f_Kaelen__The_Bold__Ashford.tsv"
    );
  });
});
