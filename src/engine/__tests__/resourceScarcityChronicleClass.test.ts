/**
 * THR-2070 — a town short of stone does not "go hungry".
 *
 * The famine/glut chronicle fires for staple and strategic goods. The food lines
 * belong to staples; a strategic good (stone, timber, ore) draws the want-of-goods
 * pool, and the good is printed lower-case mid-sentence ("the stone", not "the Stone").
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseResourceStockTiers } from '../phases/resourceStockTiers';
import { resolveEconomicChronicle } from '../economicChronicle';
import {
  ECONOMIC_CHRONICLE_TEMPLATES,
  RESOURCE_WANT_CHRONICLE_TEMPLATES,
} from '../../data/economic-chronicle-content';
import type { GameState } from '../../types/gameState';
import type { ResourceInstance } from '../../types/resource';

const HUNGER_WORDS = /\b(famine|hungry|hunger|starv\w*|go without|rots?)\b/i;

/** One dense settlement whose single good was adequate and now has run out. */
function buildState(resourceId: string): GameState {
  const graph = new WorldGraph();
  const instance: ResourceInstance = { quantity: 0, renewable: true, renewalRate: 0.5, stockTier: 'adequate' };
  graph.addNode({
    id: 'loc1',
    type: 'location',
    name: 'Harrowmoor',
    properties: {
      terrain: 'hills',
      prosperity: 100,
      hexCol: 3,
      hexRow: 4,
      resources: { [resourceId]: instance },
    },
  });
  // A full town (demand at its ceiling), so even low-sensitivity stone reads scarce.
  for (let i = 0; i < 6; i++) {
    graph.addNode({ id: `sub${i}`, type: 'location', name: `Quarter ${i}`, properties: { parentLocationId: 'loc1' } });
    graph.addEdge({ id: `contains${i}`, type: 'contains', source: 'loc1', target: `sub${i}`, properties: {} });
  }
  return {
    graph,
    tick: 5,
    seed: 42,
    tickEvents: [],
    chronicleEntries: [],
    activeThreadTugs: [],
  } as unknown as GameState;
}

function scarcityProse(resourceId: string): string {
  const state = buildState(resourceId);
  const delta = phaseResourceStockTiers(state, {});
  const entries = delta.chronicleEntries ?? [];
  expect(entries.length).toBe(1);
  return entries[0].prose;
}

describe('resource_scarcity chronicle by resource class (THR-2070)', () => {
  it('a stone shortage names no hunger and prints the good lower-case', () => {
    const prose = scarcityProse('stone');
    expect(prose).not.toMatch(HUNGER_WORDS);
    expect(prose).toContain('stone');
    expect(prose).not.toContain('Stone');
    expect(RESOURCE_WANT_CHRONICLE_TEMPLATES.resource_scarcity.map(t => t.replace('{resource}', 'stone').replace('{settlement}', 'Harrowmoor')))
      .toContain(prose);
  });

  it('a grain shortage still draws the famine lines', () => {
    const prose = scarcityProse('grain');
    expect(ECONOMIC_CHRONICLE_TEMPLATES.resource_scarcity.map(t => t.replace('{resource}', 'grain').replace('{settlement}', 'Harrowmoor')))
      .toContain(prose);
  });

  it('no strategic scarcity or glut line, under any seed, carries a hunger word', () => {
    for (const trigger of ['resource_scarcity', 'resource_glut'] as const) {
      for (let seed = 0; seed < 64; seed++) {
        const result = resolveEconomicChronicle(
          trigger,
          { settlement: 'Harrowmoor', resource: 'stone', resourceCategory: 'strategic' },
          1,
          seed,
        );
        expect(result).not.toBeNull();
        expect(result!.chronicleChapter.prose).not.toMatch(HUNGER_WORDS);
      }
    }
  });

  it('a staple, or no category at all, keeps the food pool', () => {
    for (const resourceCategory of ['staple', undefined] as const) {
      const result = resolveEconomicChronicle(
        'resource_scarcity',
        { settlement: 'Harrowmoor', resource: 'grain', resourceCategory },
        1,
        7,
      );
      const pool = ECONOMIC_CHRONICLE_TEMPLATES.resource_scarcity
        .map(t => t.replace('{resource}', 'grain').replace('{settlement}', 'Harrowmoor'));
      expect(pool).toContain(result!.chronicleChapter.prose);
    }
  });
});
