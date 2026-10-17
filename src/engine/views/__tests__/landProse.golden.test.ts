// @vitest-lane heavy — builds a small identity world (the seeded game's path) and compares the land page's moved prose with HexChronicle's memos on three hexes (THR-1876)
/**
 * THR-1876 § D7.3 — the land rows reproduce HexChronicle's text byte for byte.
 *
 * `legacyLandProse.ts` is HexChronicle's memos copied verbatim; `landProse.ts` is the
 * moved code. Three golden hexes: one with a settlement (resources), one whose Area has a
 * historical culture (the ruins block), and one surveyed hex (the survey band).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../../gameInit';
import { resetEventCounter, resetDecisionCache } from '../../orchestrator';
import { resetReputationTraitInit } from '../../phaseReputationTraits';
import { getLocationsInHex, getHexSphereInfluence } from '../../hexZoom';
import { getHexRegionData } from '../../hexRegion';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import { landParagraphs, soulParagraphs, ruinsParagraphs } from '../subjects/landProse';
import { landProseInputFor, proseMarkupToHtml } from '../subjects/pageResolvers';
import { generateLandPage } from '../../detailPageGenerator';
import { legacyLandChapters } from './legacyLandProse';

const WORLD_TIMEOUT_MS = 120_000;
let state: GameState;

beforeAll(() => {
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
  const init = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small');
  state = init.state;
  devSeedTheFirst(state);
}, WORLD_TIMEOUT_MS);

function legacyFor(tile: HexTile, survey?: { prose: string; tick: number }) {
  const { col, row } = tile.coord;
  return legacyLandChapters({
    terrain: tile.terrain,
    hexCol: col,
    hexRow: row,
    seed: state.seed,
    sphereInfluence: getHexSphereInfluence(state.graph, col, row),
    regionData: tile.regionId ? getHexRegionData(state.graph, tile.regionId) : null,
    locations: getLocationsInHex(state.graph, col, row),
    graph: state.graph,
    surveyPeopleProse: survey?.prose,
    surveyPeopleProseTick: survey?.tick,
    tick: state.tick,
  });
}

function goldenHexes(): HexTile[] {
  const tiles = state.tiles;
  const settled = tiles.find(t => getLocationsInHex(state.graph, t.coord.col, t.coord.row).some(l => l.properties.resources));
  const ruined = tiles.find(t => t.regionId && getHexRegionData(state.graph, t.regionId)?.historicalCulture);
  const wild = tiles.find(t => t !== settled && t !== ruined && t.terrain !== 'ocean' && t.terrain !== 'deep_ocean');
  return [settled, ruined, wild].filter((t): t is HexTile => Boolean(t));
}

describe('THR-1876 land prose is HexChronicle\'s, unchanged (generated world)', () => {
  it('finds three golden hexes, one of them with a ruins block', () => {
    const hexes = goldenHexes();
    expect(hexes).toHaveLength(3);
    expect(legacyFor(hexes[1]).ruins.length).toBeGreaterThan(0);
  });

  it('The land, Its soul and What came before match the memos paragraph for paragraph', () => {
    for (const tile of goldenHexes()) {
      const input = landProseInputFor(state, tile.coord.col, tile.coord.row)!;
      const legacy = legacyFor(tile);
      expect(landParagraphs(input), `land ${tile.coord.col},${tile.coord.row}`).toEqual(legacy.land);
      expect(soulParagraphs(input), `soul ${tile.coord.col},${tile.coord.row}`).toEqual(legacy.soul);
      expect(ruinsParagraphs(input), `ruins ${tile.coord.col},${tile.coord.row}`).toEqual(legacy.ruins);
    }
  });

  it('a surveyed hex carries the survey band and its attribution, as HexChronicle did', () => {
    const tile = goldenHexes()[2];
    const survey = { prose: 'The marshlands hum with old grief and new hunger.', tick: Math.max(0, state.tick - 30) };
    const withSurvey = { ...state, recentEvents: [{ type: 'survey_completed', tick: survey.tick, message: survey.prose, hexCoords: { col: tile.coord.col, row: tile.coord.row } }] } as unknown as GameState;
    const input = landProseInputFor(withSurvey, tile.coord.col, tile.coord.row)!;
    expect(landParagraphs(input)).toEqual(legacyFor(tile, survey).land);
  });

  it('the land rows render those paragraphs, keyword markup as linked terms and nothing else', () => {
    const tile = goldenHexes()[0];
    const page = generateLandPage({ state, col: tile.coord.col, row: tile.coord.row });
    const legacy = legacyFor(tile);
    expect(page.sections.find(s => s.typeId === 'the_land')).toMatchObject({ prose: legacy.land.map(proseMarkupToHtml).join('\n\n') });
    const soul = page.sections.find(s => s.typeId === 'its_soul');
    if (legacy.soul.length > 0) expect(soul).toMatchObject({ prose: legacy.soul.map(proseMarkupToHtml).join('\n\n') });
    expect(JSON.stringify(page)).not.toContain('**');
  });
});
