/**
 * THR-2198 item 1 — the person page's disposition row read "Disposition toward her" on every
 * mortal (round-7 cold playtest: "who is 'her'? I never picked a gender"). It now names the
 * mortal and speaks to the player, and no section label on the page carries a gendered pronoun.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { Section } from '../../../types/detailPage';
import { composeSections } from '../../detailPageGenerator';
import { actorPortraitFallback, dispositionLabel } from '../../detailPageResolvers';

const ASC = 'asc';
const GENDERED = /\b(she|her|hers|he|him|his)\b/i;

function world(threaded: boolean): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual', npcRole: 'smith', wealth: 30 } });
  graph.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'rel1', source: 'kael', target: ASC, type: 'relates_to', properties: { basis: 'thread', sentiment: 0.6 } });
  if (threaded) graph.addEdge({ id: 'th1', source: ASC, target: 'kael', type: 'thread', properties: { tier: 2, courtPosition: 'the_first' } });
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: [],
    recentEvents: [],
    familiarityMap: new Map([['kael', 0.9]]),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
}

function sections(state: GameState): Section[] {
  return composeSections('actor', { nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
}

describe('THR-2198 — the disposition row names the mortal, not "her"', () => {
  it('the label is built from one shared helper', () => {
    expect(dispositionLabel('Seren')).toBe('How Seren regards you');
  });

  it('the composed portrait row carries it, threaded or not', () => {
    for (const threaded of [true, false]) {
      const row = sections(world(threaded)).find(s => s.typeId === 'portrait_with_disposition');
      expect(row?.label).toBe('How Kael regards you');
    }
  });

  it('the fallback floor carries it too', () => {
    const state = world(true);
    const row = actorPortraitFallback({ nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
    expect(row?.label).toBe('How Kael regards you');
  });

  it('no section label on a person page holds a gendered pronoun', () => {
    for (const threaded of [true, false]) {
      const labels = sections(world(threaded)).map(s => s.label ?? '');
      expect(labels.length).toBeGreaterThan(0);
      for (const label of labels) expect(label).not.toMatch(GENDERED);
    }
  });
});
