// THR-2145 — an undertaking outcome's Story row names the deed, never its template id.
//
// The harm-outcome minter used to name its event node `${templateId} (${harmClass})`, so a
// mortal's sheet → Story list read `cell.destroy.power (afflicted)` (UI Law 14). The name now
// comes from `outcomeDeedName`: the work's card phrase, a fight's title, or fallback words.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { outcomeDeedName, createUndertakingOutcomeNode } from '../undertakingOutcomeNode';
import { getAllStrategicTemplates } from '../../strategicActionCandidates';
import { UNDERTAKING_CELL_TEMPLATES } from '../../../data/undertaking-cells';
import { OUTCOME_DEED_FALLBACK_NAMES } from '../../../data/grievance-constants';
import { buildConnections } from '../../views/connections';
import type { StrategicProjectRuntime } from '../../../types/strategicAction';

/** A dotted key (`cell.destroy.power`) or a snake id (`strategic_the_plot`). */
const DOTTED_KEY = /[a-z]+\.[a-z_.]+/;
const SNAKE_KEY = /[a-z]+_[a-z_]+/;

describe('THR-2145 — outcomeDeedName never returns an id', () => {
  const ids = [
    ...getAllStrategicTemplates().map(t => t.id),
    ...UNDERTAKING_CELL_TEMPLATES.map(t => t.id),
  ];

  it('the registries are not empty (the sweep below is not vacuous)', () => {
    expect(ids.length).toBeGreaterThan(20);
  });

  it('every strategic template and every cell names a player phrase', () => {
    const bad = ids
      .map(id => ({ id, name: outcomeDeedName(id) }))
      .filter(({ name }) => !name || DOTTED_KEY.test(name) || SNAKE_KEY.test(name));
    expect(bad).toEqual([]);
  });

  it('a cell reads its card phrase', () => {
    expect(outcomeDeedName('cell.destroy.power')).toBe('Destroy a power');
  });

  it('a fight reads its template title', () => {
    const name = outcomeDeedName('fight.lair.confront', 'fight');
    expect(name).toBe('The Beast in Its Den');
  });

  it('a commander slain in battle reads plain words', () => {
    expect(outcomeDeedName('battle', 'battle')).toBe(OUTCOME_DEED_FALLBACK_NAMES.battle);
  });

  it('an id no registry knows falls back to words, never the id', () => {
    expect(outcomeDeedName('cell.nonsense.thing')).toBe(OUTCOME_DEED_FALLBACK_NAMES.undertaking);
    expect(outcomeDeedName('fight.nonsense', 'fight')).toBe(OUTCOME_DEED_FALLBACK_NAMES.fight);
  });
});

describe('THR-2145 — the Story row on a mortal\'s sheet reads the deed', () => {
  function world(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: {} });
    for (const [id, name] of [['ind_culprit', 'Mira'], ['ind_victim', 'Kael Thornweaver']] as const) {
      graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
      graph.addEdge({ id: `${id}_at`, source: id, target: 'loc.town', type: 'located_at', properties: {} });
    }
    return graph;
  }

  function storyNames(graph: WorldGraph, actorId: string): string[] {
    const story = buildConnections(graph, null, { cls: 'person', id: actorId }).groups.find(g => g.id === 'story');
    return story?.rows.map(r => r.name) ?? [];
  }

  it('an undertaking harm — the row the bug report saw — names the work, not the key', () => {
    const graph = world();
    const project = {
      projectId: 'proj_1', actorId: 'ind_culprit', templateId: 'cell.destroy.power',
      verb: 'destroy', originLocationId: 'loc.town',
    } as unknown as StrategicProjectRuntime;
    const id = createUndertakingOutcomeNode({
      graph, project, harmClass: 'afflicted', tick: 200, victimAgentId: 'ind_victim',
    });
    expect(id).toBeDefined();
    expect(graph.getNode(id!)!.properties.templateName).toBe('Destroy a power');

    for (const actor of ['ind_victim', 'ind_culprit']) {
      const names = storyNames(graph, actor);
      expect(names).toContain('Destroy a power');
      expect(names.filter(n => DOTTED_KEY.test(n))).toEqual([]);
    }
  });

  it('a fight death and a commander slain read words too', () => {
    const graph = world();
    createUndertakingOutcomeNode({
      graph, harmClass: 'named_death', tick: 10, victimAgentId: 'ind_victim',
      source: { kind: 'fight', actorId: 'ind_culprit', actionId: 'ua.fight.1', templateId: 'fight.lair.confront', siteId: 'loc.town' },
    });
    createUndertakingOutcomeNode({
      graph, harmClass: 'named_death', tick: 11, victimAgentId: 'ind_victim',
      source: { kind: 'battle', actorId: 'ind_culprit', actionId: 'battle_1', templateId: 'battle', siteId: 'loc.town' },
    });
    const names = storyNames(graph, 'ind_victim');
    expect(names).toEqual(expect.arrayContaining(['The Beast in Its Den', OUTCOME_DEED_FALLBACK_NAMES.battle]));
    expect(names.filter(n => DOTTED_KEY.test(n) || n === 'battle')).toEqual([]);
  });
});
