/**
 * Mandate evaluation integration tests.
 *
 * THR-1198 retired `generateMandate` and the one test here that exercised it —
 * the run's spine is remembrance-derived, so nothing instantiates a template
 * mandate and a test asserting that it could was green on a dead contract.
 *
 * What remains is deliberately kept: `evaluateMandate`, `advanceMandateStage`
 * and `evaluateCondition` are live (`phaseMandate.ts` calls all three), and the
 * templates are still a valid `MandateDefinition` fixture for them — the only
 * one carrying graph-condition stages. These are coverage of live functions, not
 * of the retired instantiation route.
 */
import { describe, it, expect } from 'vitest';
import { createMandateState, evaluateMandate, advanceMandateStage, evaluateCondition } from '../mandate';
import { WorldGraph } from '../graph';
import { MANDATE_TEMPLATES } from '../../data/mandate-content';

describe('mandate integration — full lifecycle', () => {
  it('actor_tier mandate: full cycle with graph changes', () => {
    // Pick a mandate that uses actor_tier
    const mandate = MANDATE_TEMPLATES.find(t => t.id === 'mandate.devoted_circle')!; // Devoted Circle
    expect(mandate).toBeTruthy();

    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'The One', properties: { actorType: 'ascendant' } });

    // Start: 0 agents, setup needs 2 at tier 2+
    let state = createMandateState(mandate.id, 0);
    state = evaluateMandate(graph, mandate, state, 'asc', 1);
    expect(state.progress).toBe(0);

    // Add 2 agents at tier 2
    for (let i = 1; i <= 2; i++) {
      graph.addNode({ id: `agent.${i}`, type: 'actor', name: `Agent ${i}`, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `wor.${i}`, source: 'asc', target: `agent.${i}`, type: 'thread', properties: { tier: 2 } });
    }

    state = evaluateMandate(graph, mandate, state, 'asc', 10);
    expect(state.progress).toBe(1.0);

    // Advance to escalation
    state = advanceMandateStage(state, 10);
    expect(state.currentStage).toBe('escalation');

    // Escalation needs 3 at tier 3+ — promote 2 existing and add 1 more at tier 3
    graph.getEdge('wor.1')!.properties.tier = 3;
    graph.getEdge('wor.2')!.properties.tier = 3;
    graph.addNode({ id: 'agent.3', type: 'actor', name: 'Agent 3', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.3', source: 'asc', target: 'agent.3', type: 'thread', properties: { tier: 3 } });

    state = evaluateMandate(graph, mandate, state, 'asc', 20);
    expect(state.progress).toBe(1.0);

    // Advance to culmination
    state = advanceMandateStage(state, 20);
    expect(state.currentStage).toBe('culmination');

    // Culmination needs 5 at tier 3+ — add 2 more
    graph.addNode({ id: 'agent.4', type: 'actor', name: 'Agent 4', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.4', source: 'asc', target: 'agent.4', type: 'thread', properties: { tier: 3 } });
    graph.addNode({ id: 'agent.5', type: 'actor', name: 'Agent 5', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'wor.5', source: 'asc', target: 'agent.5', type: 'thread', properties: { tier: 3 } });

    state = evaluateMandate(graph, mandate, state, 'asc', 30);
    expect(state.progress).toBe(1.0);

    // Complete!
    state = advanceMandateStage(state, 30);
    expect(state.completed).toBe(true);
  });

  it('all 9 templates have evaluable conditions (no condition throws)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });

    for (const template of MANDATE_TEMPLATES) {
      for (const stage of template.stages) {
        for (const condition of stage.conditions) {
          // Should not throw, even if graph is sparse
          expect(() => evaluateCondition(graph, condition, 'asc')).not.toThrow();
        }
      }
    }
  });
});
