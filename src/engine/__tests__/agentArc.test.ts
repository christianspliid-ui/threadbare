/**
 * The arc so far — THR-1299 slice 4.
 *
 * Persisted sources only, newest last, capped, and every time a word.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { UndertakingMomentRecord, StrategicHistoryEntry } from '../../types/strategicAction';
import { MOMENT_ARC_STRIP_MAX } from '../../data/strategic-action-constants';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { getAgentArc, ticksAgoWord } from '../agentArc';

function graphWithCompletedAmbition(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'kael', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'amb_1', name: 'Dominate Trade', type: 'ambition', properties: { templateId: 'ambition_dominate_trade' } });
  graph.addEdge({
    id: 'pursues_kael_amb_1', source: 'kael', target: 'amb_1', type: 'pursues',
    properties: { status: 'completed', resolvedTick: 30, priority: 'primary', completedMilestones: [] },
  });
  return graph;
}

function history(overrides: Partial<StrategicHistoryEntry>): StrategicHistoryEntry {
  return {
    tick: 20, actorId: 'kael', templateId: 'strategic_build_warehouse', ambitionId: 'a', verb: 'create',
    behaviorFamily: 'merchant-expansion', displayName: 'Build Warehouse', outcome: 'completed',
    graphOps: [], catalystSeeded: false, ...overrides,
  };
}

function moment(overrides: Partial<UndertakingMomentRecord>): UndertakingMomentRecord {
  return {
    id: 'm1', projectId: 'p', actorId: 'kael', templateId: 't', momentClass: 'at_cost', presentation: 'badge',
    tick: 40, label: 'x', undertakingName: 'Build Warehouse', acknowledged: false, ...overrides,
  };
}

describe('ticksAgoWord', () => {
  it('never renders a numeral', () => {
    for (const t of [0, 5, 11, 12, 13, 36, 100, 1000]) {
      expect(ticksAgoWord(t)).not.toMatch(/\d/);
    }
    expect(ticksAgoWord(0)).toBe('today');
    expect(ticksAgoWord(TICKS_PER_DAY - 1)).toBe('today');
    expect(ticksAgoWord(TICKS_PER_DAY * 2)).toBe('two days past');
  });
});

describe('getAgentArc', () => {
  it('reads history, completed ambitions and queued moments, newest last, only for this agent', () => {
    const graph = graphWithCompletedAmbition();
    const arc = getAgentArc({
      tick: 50,
      strategicState: {
        projects: [], controls: [],
        history: [
          history({ tick: 20 }),
          history({ tick: 25, outcome: 'failed', displayName: 'Raid the Road' }),
          history({ tick: 22, actorId: 'bram', displayName: 'Not Mine' }),
        ],
      },
      pendingUndertakingMoments: [
        moment({ tick: 40 }),
        moment({ tick: 45, momentClass: 'completion', id: 'm2' }),
        moment({ tick: 41, actorId: 'bram', id: 'm3' }),
      ],
    }, graph, 'kael');

    expect(arc.map(e => e.kind)).toEqual(['undertaking_completed', 'undertaking_failed', 'ambition_completed', 'moment']);
    expect(arc.map(e => e.tick)).toEqual([20, 25, 30, 40]);
    expect(arc[0].line).toBe('Finished Build Warehouse.');
    expect(arc[1].line).toBe('Raid the Road came to nothing.');
    // The name comes from the ambition template's displayName, not the node label.
    expect(arc[2].line).toMatch(/^Saw .*Trade through\.$/);
    expect(arc[3].line).toContain('Pressing On at a Cost');
    expect(arc.some(e => e.line.includes('Not Mine'))).toBe(false);
    for (const e of arc) expect(e.when).not.toMatch(/\d/);
  });

  it('keeps the newest entries when the strip overflows', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'kael', name: 'Kael', type: 'actor', properties: { actorType: 'individual' } });
    const entries = Array.from({ length: MOMENT_ARC_STRIP_MAX + 4 }, (_, i) => history({ tick: i + 1, templateId: `t${i}` }));
    const arc = getAgentArc({ tick: 100, strategicState: { projects: [], controls: [], history: entries }, pendingUndertakingMoments: [] }, graph, 'kael');
    expect(arc.length).toBe(MOMENT_ARC_STRIP_MAX);
    expect(arc[0].tick).toBe(5);
    expect(arc[arc.length - 1].tick).toBe(MOMENT_ARC_STRIP_MAX + 4);
  });

  it('is empty, not thrown, for an agent with no story', () => {
    const graph = new WorldGraph();
    expect(getAgentArc({ tick: 1 }, graph, 'nobody')).toEqual([]);
  });
});
