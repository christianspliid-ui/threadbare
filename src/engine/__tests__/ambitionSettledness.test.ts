/**
 * THR-822 Done-when #3 — both repointed ambitions can actually reach abandonment.
 *
 * The two triggers this ticket discharged were dead for years, and the way they were
 * dead is instructive: `validateTraitRefs` could see the ref was unsatisfiable, but no
 * test ever asked whether the *ambition* could resolve. So this file asserts the thing
 * that was missing rather than the thing that was already covered — it drives the real
 * `AMBITION_TEMPLATES` / `REACTIVE_AMBITION_TEMPLATES` entries through the real
 * `evaluateAmbitionProgress`, with residence written by the real `observeResidence`.
 *
 * Each ambition gets both assertions, because either one alone is satisfiable by a
 * broken implementation:
 *
 *   - **reaches abandonment** — a trigger stuck at `false` (the pre-THR-822 state) fails
 *     this. It is the Done-when.
 *   - **does not abandon at assignment** — a trigger that ignores the measurement window
 *     fails this. It is the failure mode THR-813 refused to ship, and it is *worse* than
 *     the dead ref: the ambition would never run at all.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { ActiveAmbition } from '../../types/ambition';
import { evaluateAmbitionProgress } from '../ambitionLifecycle';
import { observeResidence, SETTLED_DWELL_TICKS, EXILE_ACCEPTED_DWELL_TICKS } from '../agentResidence';
import { findAmbitionTemplateById } from '../../data/ambition-templates';

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'a1', type: 'actor', name: 'Wanderer', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'home', type: 'location', name: 'Hearthfall', properties: {} });
  graph.addNode({ id: 'far', type: 'location', name: 'Saltmarch', properties: {} });
  return graph;
}

/** Mirrors `updateLocatedAt` in `movementExecution.ts`: drop every edge, add one. */
function place(graph: WorldGraph, locationId: string): void {
  for (const edge of graph.getOutgoingEdges('a1', 'located_at')) graph.removeEdge(edge.id);
  graph.addEdge({
    id: `a1_located_at_${locationId}`,
    source: 'a1',
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function activeAt(templateId: string, assignedTick: number): ActiveAmbition {
  return {
    templateId,
    priority: 'primary',
    status: 'active',
    assignedTick,
    completedMilestones: [],
  };
}

describe('THR-822 — ambition_flee_the_ravaged_land reaches abandonment by settling', () => {
  const template = findAmbitionTemplateById('ambition_flee_the_ravaged_land')!;

  it('is authored against a durational condition, not a dead trait ref', () => {
    // Anti-vacuity: everything below would also pass if the trigger had simply been
    // deleted. Pin that the beat still exists and now names live engine state.
    expect(template.abandonmentTriggers).toHaveLength(1);
    expect(template.abandonmentTriggers[0].condition).toEqual({
      type: 'agent_settled_since',
      minTicks: SETTLED_DWELL_TICKS,
    });
  });

  it('does not abandon at assignment, however long the agent had been stationary', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0); // rooted since the world began

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template, activeAt(template.id, assignedTick), graph, 'a1', assignedTick,
    );
    expect(result.status).toBe('active');
  });

  it('still does not abandon one tick short of the threshold', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template,
      activeAt(template.id, assignedTick),
      graph,
      'a1',
      assignedTick + SETTLED_DWELL_TICKS - 1,
    );
    expect(result.status).toBe('active');
  });

  it('abandons once the agent has stayed put for the full dwell after taking it up', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template,
      activeAt(template.id, assignedTick),
      graph,
      'a1',
      assignedTick + SETTLED_DWELL_TICKS,
    );
    expect(result.status).toBe('abandoned');
  });

  it('does not abandon an agent who keeps moving — the road is still the road', () => {
    const graph = makeWorld();
    const assignedTick = 1000;
    place(graph, 'home');
    observeResidence(graph, 'a1', assignedTick);

    // Relocate well inside the dwell threshold, repeatedly.
    let tick = assignedTick;
    for (const stop of ['far', 'home', 'far']) {
      tick += SETTLED_DWELL_TICKS - 1;
      place(graph, stop);
      observeResidence(graph, 'a1', tick);
      const result = evaluateAmbitionProgress(
        template, activeAt(template.id, assignedTick), graph, 'a1', tick,
      );
      expect(result.status).toBe('active');
    }
  });
});

describe('THR-822 — ambition_reclaim_homeland reaches abandonment by accepting exile', () => {
  const template = findAmbitionTemplateById('ambition_reclaim_homeland')!;

  it('is authored against a durational condition, not a dead trait ref', () => {
    expect(template.abandonmentTriggers).toHaveLength(1);
    expect(template.abandonmentTriggers[0].condition).toEqual({
      type: 'agent_away_from_origin',
      minTicks: EXILE_ACCEPTED_DWELL_TICKS,
    });
  });

  it('does not abandon at assignment, even for an agent long since displaced', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);
    place(graph, 'far');
    observeResidence(graph, 'a1', 5); // away from home since tick 5

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template, activeAt(template.id, assignedTick), graph, 'a1', assignedTick,
    );
    expect(result.status).toBe('active');
  });

  it('abandons once the exile has been rooted away from home for the full dwell', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);
    place(graph, 'far');
    observeResidence(graph, 'a1', 5);

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template,
      activeAt(template.id, assignedTick),
      graph,
      'a1',
      assignedTick + EXILE_ACCEPTED_DWELL_TICKS,
    );
    expect(result.status).toBe('abandoned');
  });

  it('never abandons an agent who is settled at home — that is not exile', () => {
    // The half that separates this trigger from `agent_settled_since`. An agent who
    // stayed home cannot "accept exile", no matter how long they sit still.
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);

    const assignedTick = 1000;
    const result = evaluateAmbitionProgress(
      template,
      activeAt(template.id, assignedTick),
      graph,
      'a1',
      assignedTick + EXILE_ACCEPTED_DWELL_TICKS * 10,
    );
    expect(result.status).toBe('active');
  });

  it('stops abandoning if the exile goes home again', () => {
    const graph = makeWorld();
    place(graph, 'home');
    observeResidence(graph, 'a1', 0);
    place(graph, 'far');
    observeResidence(graph, 'a1', 5);

    const assignedTick = 1000;
    const settledAway = assignedTick + EXILE_ACCEPTED_DWELL_TICKS;
    expect(
      evaluateAmbitionProgress(template, activeAt(template.id, assignedTick), graph, 'a1', settledAway).status,
    ).toBe('abandoned');

    // Coming home resets both halves: the position matches origin again, and arrival
    // restamps. The ambition is live once more rather than permanently resolved.
    place(graph, 'home');
    observeResidence(graph, 'a1', settledAway);
    expect(
      evaluateAmbitionProgress(template, activeAt(template.id, assignedTick), graph, 'a1', settledAway).status,
    ).toBe('active');
  });
});

describe('THR-822 — the clock is required, so pre-existing callers are unaffected', () => {
  it('leaves both ambitions active when evaluated without a currentTick', () => {
    // `evaluateAmbitionProgress`'s 5th argument is optional; every caller that predates
    // THR-822 omits it. Those callers must keep the old behaviour (never abandoning on
    // these triggers) rather than acquiring a new failure mode.
    const graph = makeWorld();
    place(graph, 'far');
    observeResidence(graph, 'a1', 0);

    for (const id of ['ambition_flee_the_ravaged_land', 'ambition_reclaim_homeland']) {
      const template = findAmbitionTemplateById(id)!;
      const result = evaluateAmbitionProgress(template, activeAt(id, 0), graph, 'a1');
      expect(result.status, `${id} abandoned without a clock`).not.toBe('abandoned');
    }
  });
});
