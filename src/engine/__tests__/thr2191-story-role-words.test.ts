// THR-2191 — a Story row says whose deed it was only when it was not the subject's own:
// "done to them", "set upon", "defending", "fell in it". Own deeds stay unmarked, and
// own runs of a chapter fold apart from the runs done to the subject.
//
// Plan: Docs/plans/2026-11-17-thr-2191-story-rows-say-whose-deed.md

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createUnifiedActionEventNode } from '../encounterEventNode';
import { buildConnections, storyRoleWord } from '../views/connections';
import type { ConnectionSubject } from '../views/connections';

const SUBJECT = 'agent.subject';
const OTHER = 'agent.other';
const TEMPLATE_ID = 'faction.bounty.price_on_head';
const TEMPLATE_NAME = 'The Price on Their Head';

function graphWithPeople(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: SUBJECT, type: 'actor', name: 'Queen Ysolde', properties: { actorType: 'individual' } });
  graph.addNode({ id: OTHER, type: 'actor', name: 'Vara the Grey', properties: { actorType: 'individual' } });
  return graph;
}

type RunParams = Parameters<typeof createUnifiedActionEventNode>[0];

/** One run of the chapter; `onSubject` makes the subject its target, not its doer. */
function addRun(graph: WorldGraph, actionId: string, tick: number, onSubject: boolean, stepIndex = 0): string {
  const id = createUnifiedActionEventNode({
    graph,
    actorId: onSubject ? OTHER : SUBJECT,
    ...(onSubject && { targetAgentId: SUBJECT }),
    actionId,
    templateId: TEMPLATE_ID,
    templateName: TEMPLATE_NAME,
    stepIndex,
    outcome: 'success',
    tick,
  } as RunParams);
  expect(id).toBeDefined();
  return id!;
}

/** A bare event the subject took part in under `role` (fights, battles, the world's past). */
function addRoleEvent(graph: WorldGraph, subjectId: string, id: string, name: string, role: unknown, tick: number, eventType = 'fight_fought'): void {
  graph.addNode({ id, type: 'event', name, properties: { eventType, tick, summary: `${name}.` } });
  graph.addEdge({ id: `p_${id}`, source: subjectId, target: id, type: 'participated_in', properties: role === undefined ? {} : { role } });
}

function storyRows(graph: WorldGraph, subject: ConnectionSubject = { cls: 'person', id: SUBJECT }) {
  return buildConnections(graph, null, subject).groups.find(g => g.id === 'story')?.rows ?? [];
}

describe('THR-2191 — 1: one role word per edge role', () => {
  it('a target on an encounter event reads "done to them"', () => {
    const graph = graphWithPeople();
    addRun(graph, 'act.1', 10, true);
    const rows = storyRows(graph);
    expect(rows.map(r => [r.name, r.fact])).toEqual([[TEMPLATE_NAME, 'done to them']]);
  });

  it.each([
    ['opponent', 'set upon'],
    ['defender', 'defending'],
    ['fallen', 'fell in it'],
  ])('role %s reads "%s"', (role, word) => {
    const graph = graphWithPeople();
    addRoleEvent(graph, SUBJECT, 'evt.1', 'Fight at the Old Mill', role, 10);
    expect(storyRows(graph).map(r => r.fact)).toEqual([word]);
  });

  it.each(['primary', 'fighter', 'attacker', 'winner', 'loser', undefined, 42, 'answered'])(
    'role %s (own deed, unknown or not a string) says nothing',
    (role) => {
      const graph = graphWithPeople();
      addRoleEvent(graph, SUBJECT, 'evt.1', 'Fight at the Old Mill', role, 10);
      expect(storyRows(graph).map(r => r.fact)).toEqual(['']);
    },
  );

  it('storyRoleWord ignores inherited object keys', () => {
    expect(storyRoleWord({ id: 'e', source: 'a', target: 'b', type: 'participated_in', properties: { role: 'toString' } } as never)).toBe('');
    expect(storyRoleWord({ id: 'e', source: 'a', target: 'b', type: 'participated_in', properties: { role: '__proto__' } } as never)).toBe('');
  });

  it('the subject\'s own run stays unmarked', () => {
    const graph = graphWithPeople();
    addRun(graph, 'act.1', 10, false);
    expect(storyRows(graph).map(r => r.fact)).toEqual(['']);
  });
});

describe('THR-2191 — 2: own runs and runs done to the subject fold apart', () => {
  it('twice by the subject and once on them is two rows: "twice" and "done to them"', () => {
    const graph = graphWithPeople();
    addRun(graph, 'act.1', 10, false);
    addRun(graph, 'act.2', 20, false);
    addRun(graph, 'act.3', 30, true);
    const rows = storyRows(graph);
    expect(rows.map(r => [r.name, r.fact])).toEqual([
      [TEMPLATE_NAME, 'done to them'],
      [TEMPLATE_NAME, 'twice'],
    ]);
  });

  it('twice on the subject is one row: "done to them · twice"', () => {
    const graph = graphWithPeople();
    addRun(graph, 'act.1', 10, true);
    const latest = addRun(graph, 'act.2', 20, true);
    const rows = storyRows(graph);
    expect(rows).toHaveLength(1);
    expect(rows[0].fact).toBe('done to them · twice');
    expect(rows[0].ref.id).toBe(latest);
  });

  it('a two-step chapter done to the subject is one row that still reads "done to them"', () => {
    const graph = graphWithPeople();
    addRun(graph, 'act.1', 10, true, 0);
    const later = addRun(graph, 'act.1', 12, true, 1);
    const rows = storyRows(graph);
    expect(rows).toHaveLength(1);
    expect(rows[0].fact).toBe('done to them');
    expect(rows[0].ref.id).toBe(later);
  });
});

describe('THR-2191 — 3: factions and relics, and no raw keys anywhere', () => {
  it('a faction target on an undertaking outcome reads "done to them"', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'faction.red', type: 'actor', name: 'The Red Hand', properties: { actorType: 'faction' } });
    addRoleEvent(graph, 'faction.red', 'evt.uo', 'Seize a place', 'target', 10, 'undertaking_outcome');
    const rows = storyRows(graph, { cls: 'faction', id: 'faction.red' });
    expect(rows.map(r => r.fact)).toEqual(['done to them']);
  });

  it('a relic target reads "done to them"', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'art.crown', type: 'artifact', name: 'The Ash Crown', properties: {} });
    addRoleEvent(graph, 'art.crown', 'evt.a', 'Destroy a power', 'target', 10, 'encounter_outcome');
    expect(storyRows(graph, { cls: 'artifact', id: 'art.crown' }).map(r => r.fact)).toEqual(['done to them']);
  });

  it('no Story fact carries an underscore or a raw role key', () => {
    const graph = graphWithPeople();
    const roles = ['primary', 'target', 'fighter', 'opponent', 'attacker', 'defender', 'winner', 'loser', 'fallen', 'answered'];
    roles.forEach((role, i) => addRoleEvent(graph, SUBJECT, `evt.${i}`, `Event ${i}`, role, i));
    const facts = storyRows(graph).map(r => r.fact);
    expect(facts).toHaveLength(roles.length);
    for (const fact of facts) {
      expect(fact).not.toMatch(/_/);
      for (const role of roles) expect(fact).not.toBe(role);
    }
  });
});
