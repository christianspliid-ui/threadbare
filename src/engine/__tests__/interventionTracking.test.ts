import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  recordIntervention,
  getInterventionHistory,
  INTERVENTION_HISTORY_MAX,
} from '../interventionTracking';
import type { InterventionRecord } from '../interventionTracking';

// --- Helpers ---

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent.1', type: 'actor', name: 'Alice', properties: {} });
  return g;
}

function makeRecord(overrides?: Partial<InterventionRecord>): InterventionRecord {
  return {
    tick: 10,
    agentId: 'agent.1',
    encounterId: 'enc.1',
    essenceSpent: 15,
    sphereUsed: 'life',
    probabilityBonus: 0.05,
    outcome: 'success',
    ...overrides,
  };
}

// --- Tests ---

describe('getInterventionHistory', () => {
  it('returns empty array for agent with no history', () => {
    const g = makeGraph();
    expect(getInterventionHistory(g, 'agent.1')).toEqual([]);
  });

  it('returns empty array for non-existent agent', () => {
    const g = makeGraph();
    expect(getInterventionHistory(g, 'nonexistent')).toEqual([]);
  });
});

describe('recordIntervention', () => {
  it('adds a record to agent intervention history', () => {
    const g = makeGraph();
    const record = makeRecord();
    recordIntervention(g, record);
    const history = getInterventionHistory(g, 'agent.1');
    expect(history).toHaveLength(1);
    expect(history[0].essenceSpent).toBe(15);
  });

  it('appends multiple records', () => {
    const g = makeGraph();
    recordIntervention(g, makeRecord({ tick: 10 }));
    recordIntervention(g, makeRecord({ tick: 20, outcome: 'failure' }));
    const history = getInterventionHistory(g, 'agent.1');
    expect(history).toHaveLength(2);
    expect(history[1].outcome).toBe('failure');
  });

  it('is no-op for missing agent', () => {
    const g = makeGraph();
    // Should not throw
    recordIntervention(g, makeRecord({ agentId: 'nonexistent' }));
  });

  it('trims history to INTERVENTION_HISTORY_MAX', () => {
    const g = makeGraph();
    for (let i = 0; i < INTERVENTION_HISTORY_MAX + 10; i++) {
      recordIntervention(g, makeRecord({ tick: i }));
    }
    const history = getInterventionHistory(g, 'agent.1');
    expect(history.length).toBe(INTERVENTION_HISTORY_MAX);
    // Oldest entries should have been removed
    expect(history[0].tick).toBe(10);
  });

  it('returns a copy, not a reference', () => {
    const g = makeGraph();
    recordIntervention(g, makeRecord());
    const h1 = getInterventionHistory(g, 'agent.1');
    const h2 = getInterventionHistory(g, 'agent.1');
    expect(h1).not.toBe(h2);
    expect(h1).toEqual(h2);
  });
});
