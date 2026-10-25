/**
 * THR-2021 — a water hex's land page reads as water, not as a desert.
 *
 * Every terrain the land page can open on has biome prose of its own (no water hex falls
 * through to "an unremarkable stretch of land"), and a water hex inside an old culture's
 * territory places that culture's ruins beneath the water.
 */
import { describe, it, expect } from 'vitest';
import type { TerrainType } from '../../../types';
import { BIOME_PROSE } from '../../../data/prose-layer-content';
import { biomeParagraphs, ruinsParagraphs, FALLBACK_TERRAIN_PROSE, type LandProseInput } from '../subjects/landProse';
import { buildExplorationHooks } from '../../explorationHooks';
import { WorldGraph } from '../../graph';

const ALL_TERRAINS: TerrainType[] = [
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
  'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
  'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
  'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
  'swamp', 'marsh', 'moor_bog',
  'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
  'forested_hills',
  'great_home_trees', 'broken_lands', 'oasis',
  'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
  'arctic', 'snow_fields',
];

const SAND_KINGS = {
  name: 'The Sand-Kings',
  legacyFlavor: 'They built to outlast the desert. The desert let them think so.',
  ruinDescriptors: ['wind-scoured obelisks', 'buried step-pyramids', 'sand-choked colonnades'],
};

function inputFor(terrain: TerrainType): LandProseInput {
  return {
    terrain,
    col: 13,
    row: 3,
    seed: 7,
    sphereInfluence: null,
    regionData: { regionId: 'region_missing', historicalCulture: SAND_KINGS } as unknown as LandProseInput['regionData'],
    locations: [],
    graph: new WorldGraph(),
    tick: 0,
  };
}

describe('THR-2021 water terrains get their own land prose', () => {
  it('every terrain has biome prose, so none falls back to the generic line', () => {
    const missing = ALL_TERRAINS.filter(t => !(BIOME_PROSE[t]?.length));
    expect(missing).toEqual([]);
  });

  it.each(['lake', 'river', 'ocean', 'coastal_shallows'] as TerrainType[])('%s tagline is its own, not the fallback', terrain => {
    for (let seed = 0; seed < 20; seed++) {
      const [p1, p2] = biomeParagraphs(terrain, seed);
      expect(p1).not.toBe(FALLBACK_TERRAIN_PROSE);
      expect(p2).toBeDefined();
      expect(BIOME_PROSE[terrain]).toContain(p1);
    }
  });

  it('water prose does not talk about sand or desert', () => {
    for (const terrain of ['lake', 'river', 'ocean', 'coastal_shallows']) {
      for (const line of BIOME_PROSE[terrain]) expect(line).not.toMatch(/desert|dune|sand-choked/i);
    }
  });
});

describe('THR-2021 a water hex sinks its culture\'s ruins', () => {
  it('a lake hex in Sand-King territory places the ruins beneath the water', () => {
    const paragraphs = ruinsParagraphs(inputFor('lake'));
    const hook = paragraphs[paragraphs.length - 1];
    expect(hook).toMatch(/^Beneath the water lie the wind-scoured obelisks/);
    expect(hook).toMatch(/drowned/);
  });

  it('a desert hex keeps the dry-land line, unchanged', () => {
    const paragraphs = ruinsParagraphs(inputFor('desert'));
    expect(paragraphs[paragraphs.length - 1]).toBe(
      'The wind-scoured obelisks, buried step-pyramids and sand-choked colonnades have not been fully explored. What remains within may reward — or punish — the curious.',
    );
  });

  it('open water takes the underwater line; coast, river and every land terrain stay dry', () => {
    const submerged = ['ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'reef', 'lake'];
    for (const terrain of ALL_TERRAINS) {
      const paragraphs = ruinsParagraphs(inputFor(terrain));
      const hook = paragraphs[paragraphs.length - 1];
      expect(hook.startsWith('Beneath the water'), terrain).toBe(submerged.includes(terrain));
    }
  });

  it('the underwater flag only changes the line, not which descriptors it names', () => {
    const dry = buildExplorationHooks(SAND_KINGS.ruinDescriptors)[0];
    const wet = buildExplorationHooks(SAND_KINGS.ruinDescriptors, true)[0];
    expect(dry).toContain('wind-scoured obelisks, buried step-pyramids and sand-choked colonnades');
    expect(wet).toContain('wind-scoured obelisks, buried step-pyramids and sand-choked colonnades');
  });
});
