// THR-2223 — a ruler's Story tab: repeated runs of one chapter fold into one chip that
// carries a count, and an event with no stored summary never says only its own title.
//
// Warm playtest round 4: "Rulers' 'Story · 17' was the same three chips repeated, and
// opening one just repeated its own title under 'What happened'."

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { createUnifiedActionEventNode } from '../encounterEventNode';
import { buildConnections, storyRepeatWord } from '../views/connections';
import { generateDetailPage } from '../detailPageGenerator';
import { eventFallbackSummary } from '../detailPageResolvers';

const RULER = 'agent.ruler';
const TEMPLATE_ID = 'faction.bounty.price_on_head';
const TEMPLATE_NAME = 'The Price on Their Head';

function rulerGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: RULER, type: 'actor', name: 'Queen Ysolde', properties: { actorType: 'individual' } });
  return graph;
}

function addRun(graph: WorldGraph, actionId: string, tick: number, outcome: 'success' | 'failure' = 'success'): string {
  const id = createUnifiedActionEventNode({
    graph,
    actorId: RULER,
    actionId,
    templateId: TEMPLATE_ID,
    templateName: TEMPLATE_NAME,
    stepIndex: 0,
    outcome,
    tick,
  } as Parameters<typeof createUnifiedActionEventNode>[0]);
  expect(id).toBeDefined();
  return id!;
}

describe('THR-2223 — 1: three runs of one template are one Story chip with a count', () => {
  it('a notable with three runs of one template yields one chip carrying "three times"', () => {
    const graph = rulerGraph();
    addRun(graph, 'act.1', 10);
    addRun(graph, 'act.2', 20);
    const latest = addRun(graph, 'act.3', 30);

    const story = buildConnections(graph, null, { cls: 'person', id: RULER }).groups.find(g => g.id === 'story');
    expect(story?.rows).toHaveLength(1);
    expect(story?.total).toBe(1);
    const row = story!.rows[0];
    expect(row.name).toBe(TEMPLATE_NAME);
    expect(row.fact).toBe('three times');
    expect(row.ref.id).toBe(latest); // the newest chapter opens
  });

  it('two different templates stay two rows; a single run carries no count', () => {
    const graph = rulerGraph();
    addRun(graph, 'act.1', 10);
    addRun(graph, 'act.2', 20);
    createUnifiedActionEventNode({
      graph, actorId: RULER, actionId: 'act.3', templateId: 'other.tpl', templateName: 'A Quiet Audience',
      stepIndex: 0, outcome: 'success', tick: 25,
    } as Parameters<typeof createUnifiedActionEventNode>[0]);

    const story = buildConnections(graph, null, { cls: 'person', id: RULER }).groups.find(g => g.id === 'story');
    expect(story?.rows.map(r => [r.name, r.fact])).toEqual([
      ['A Quiet Audience', ''],
      [TEMPLATE_NAME, 'twice'],
    ]);
  });

  it('the repeat word is spelled out, never a numeral', () => {
    expect(storyRepeatWord(1)).toBe('');
    expect(storyRepeatWord(2)).toBe('twice');
    expect(storyRepeatWord(5)).toBe('five times');
    expect(storyRepeatWord(17)).toBe('seventeen times');
    expect(storyRepeatWord(17)).not.toMatch(/\d/);
  });
});

describe('THR-2223 — 2: "What happened" never echoes the title', () => {
  it('an event with no summary reads differently from its own title', () => {
    const graph = rulerGraph();
    const id = addRun(graph, 'act.1', 10, 'success');
    const page = generateDetailPage({ nodeId: id, pageKind: 'event', graph, tick: 12, seed: 1 });
    const happened = page.sections.find(s => s.typeId === 'what_happened');
    expect(happened?.kind).toBe('prose');
    const prose = happened?.kind === 'prose' ? happened.prose : '';
    expect(prose).not.toBe(TEMPLATE_NAME);
    expect(prose).not.toBe(page.displayName);
    expect(prose).toBe(`Queen Ysolde won ${TEMPLATE_NAME}.`);
  });

  it('a step band reads as the step, and an outcome-less event still names who took part', () => {
    const graph = rulerGraph();
    graph.addNode({ id: 'evt.step', type: 'event', name: 'x', properties: { templateName: TEMPLATE_NAME, outcome: 'near_miss' } });
    graph.addEdge({ id: 'e1', source: RULER, target: 'evt.step', type: 'participated_in', properties: { role: 'primary' } });
    expect(eventFallbackSummary(graph, graph.getNode('evt.step')!)).toBe(`Queen Ysolde took a step in ${TEMPLATE_NAME}, and it nearly broke.`);

    graph.addNode({ id: 'evt.bare', type: 'event', name: TEMPLATE_NAME, properties: {} });
    expect(eventFallbackSummary(graph, graph.getNode('evt.bare')!)).toBe(`Someone took part in ${TEMPLATE_NAME}.`);
  });

  it('a stored summary still wins', () => {
    const graph = rulerGraph();
    graph.addNode({ id: 'evt.sum', type: 'event', name: TEMPLATE_NAME, properties: { summary: 'The bounty was paid in silver.' } });
    const page = generateDetailPage({ nodeId: 'evt.sum', pageKind: 'event', graph, tick: 1, seed: 1 });
    const happened = page.sections.find(s => s.typeId === 'what_happened');
    expect(happened?.kind === 'prose' && happened.prose).toBe('The bounty was paid in silver.');
  });
});
