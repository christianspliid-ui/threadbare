import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateRegionName } from '../regionNaming';
import type { RegionFeatureType } from '../regionDetection';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('generateRegionName', () => {
  it('generates a name for a claimed region using culture fragments', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hist_culture_0',
      type: 'actor',
      name: 'The Pale Builders',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        cultureIdentity: {
          foundationBias: 'order',
          veneratedSpheres: ['matter'],
          primaryBiome: 'mountains',
          socialStructure: 'Rigid hierarchy',
          accountability: 'Written law',
          behavioralKeywords: [],
          materialVocabulary: [],
          metaphorPalette: [],
          formativeTraitSeedIds: [],
          behavioralTraitSeedIds: [],
        },
      },
    });

    const rng = mulberry32(42);
    const name = generateRegionName(
      'mountain_range',
      'hist_culture_0',
      graph,
      rng,
      new Set(),
    );
    expect(name).toBeTruthy();
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(3);
  });

  it('generates a wilderness name when no culture provided', () => {
    const graph = new WorldGraph();
    const rng = mulberry32(42);
    const name = generateRegionName(
      'forest',
      undefined,
      graph,
      rng,
      new Set(),
    );
    expect(name).toBeTruthy();
    expect(typeof name).toBe('string');
  });

  it('avoids duplicate names via usedNames set', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'hist_culture_0',
      type: 'actor',
      name: 'Test Culture',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        cultureIdentity: {
          foundationBias: 'chaos',
          veneratedSpheres: ['force'],
          primaryBiome: 'desert',
          socialStructure: '', accountability: '',
          behavioralKeywords: [], materialVocabulary: [],
          metaphorPalette: [], formativeTraitSeedIds: [], behavioralTraitSeedIds: [],
        },
      },
    });

    const usedNames = new Set<string>();
    const rng = mulberry32(42);
    const names: string[] = [];
    for (let i = 0; i < 10; i++) {
      const name = generateRegionName('desert', 'hist_culture_0', graph, rng, usedNames);
      usedNames.add(name);
      names.push(name);
    }
    // All should be unique
    expect(new Set(names).size).toBe(names.length);
  });
});
