/**
 * THR-2039 — a seed's query reaches a tavern scene when the mortal stands in a tavern.
 *
 * All ten `#tavern_night` members gate on the Place type `sublocation-type.tavern`,
 * which no Location carries. The query path judged only the Location tier, so the
 * family withered even inside the tavern. It now also accepts the mortal's own Place
 * where they stand; the resolution anchor stays Location-tier.
 *
 * ## Falsification
 *
 *  • Dropping `sublocationTypeId` from the feet judgement in `seedJudgedLocations`
 *    makes (a) wither with `content.query_empty`.
 *  • Dropping it from the collapsed anchor makes (c) wither.
 *  • Copying it onto a distinct anchor makes (d) resolve at the anchor.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { evaluateEncounterSeeds } from '../encounterSeeding';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { TAVERN_SUBLOCATION_TYPE_ID } from '../sublocation';
import type { GameState } from '../../types/gameState';
import type { PendingEncounterSeed } from '../../types/unifiedAction';

const RIPE = 100;

/**
 *   loc-town   — a `town`
 *   town_tav   — a tavern Place inside loc-town
 *   town_mkt   — a market-district Place inside loc-town
 *   loc-city   — a second settlement, used as a distinct anchor
 */
function buildState(standAt: string): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Ashford', properties: { hexCol: 4, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addNode({ id: 'loc-city', type: 'location', name: 'Vell', properties: { hexCol: 8, hexRow: 0, locationSubtype: 'city', locationType: 'settlement' } });
  graph.addNode({ id: 'town_tav', type: 'location', name: 'The Gilded Flagon', properties: { parentLocationId: 'loc-town', sublocationTypeId: TAVERN_SUBLOCATION_TYPE_ID } });
  graph.addNode({ id: 'town_mkt', type: 'location', name: 'Market district', properties: { parentLocationId: 'loc-town', sublocationTypeId: 'sublocation-type.market' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: standAt, type: 'located_at', properties: {} });
  return {
    tick: RIPE, graph, tickEvents: [], recentEvents: [], unifiedActions: [], pendingEncounterSeeds: [],
  } as unknown as GameState;
}

function tavernSeed(over: Partial<PendingEncounterSeed> = {}): PendingEncounterSeed {
  return {
    seedId: 'seed_tavern_night', sourceEncounterId: 'src', sourceReactionId: 'rx',
    query: { kind: 'encounter_template', tags: ['#tavern_night'] },
    targetAgentId: 'actor-hero', eligibleAfterTick: RIPE, plantedTick: RIPE - 72,
    seedLabel: 'A night at the tavern comes due.',
    ...over,
  } as PendingEncounterSeed;
}

const rng = () => 0.5;
const run = (state: GameState, seeds: PendingEncounterSeed[]) =>
  evaluateEncounterSeeds({ ...state, pendingEncounterSeeds: seeds }, RIPE, rng);

type QueryTrace = { category: string; site: string; candidateCount: number; pickedId?: string; judgedAt?: string; judgedAtLocationId?: string };
const queryTrace = (category: 'content.query_resolved' | 'content.query_empty') =>
  getTraces().find(t => t.category === category) as QueryTrace | undefined;

describe('THR-2039 — a #tavern_night query reaches the tavern', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('(a) in a tavern Place, the query spawns a tavern member and traces candidates above 0', () => {
    const result = run(buildState('town_tav'), [tavernSeed()]);
    const spawned = result.unifiedActions[result.unifiedActions.length - 1];
    expect(spawned, 'the tavern query withered inside the tavern').toBeDefined();
    expect(getUnifiedTemplateById(spawned.templateId)!.locationSubtypes).toContain(TAVERN_SUBLOCATION_TYPE_ID);

    const trace = queryTrace('content.query_resolved');
    expect(trace?.site).toBe('encounter_seed');
    expect(trace!.candidateCount).toBeGreaterThan(0);
    expect(trace!.pickedId).toBe(spawned.templateId);
    expect(trace!.judgedAt).toBe('target_location');
    expect(trace!.judgedAtLocationId).toBe('loc-town');
  });

  it('(b) at the market district of the same town, the same seed withers as before', () => {
    const result = run(buildState('town_mkt'), [tavernSeed()]);
    expect(result.unifiedActions).toHaveLength(0);
    expect(result.pendingEncounterSeeds).toHaveLength(0);
    expect(queryTrace('content.query_resolved')).toBeUndefined();
    expect(queryTrace('content.query_empty')?.site).toBe('encounter_seed');
  });

  it('(c) an anchor on the town the mortal stands in still counts their tavern', () => {
    const result = run(buildState('town_tav'), [tavernSeed({ resolutionLocationId: 'loc-town' } as Partial<PendingEncounterSeed>)]);
    expect(result.unifiedActions).toHaveLength(1);
    expect(queryTrace('content.query_resolved')?.judgedAt).toBe('resolution_anchor');
  });

  it('(d) a distinct anchor is judged at the Location tier only; the tavern counts at the feet', () => {
    const result = run(buildState('town_tav'), [tavernSeed({ resolutionLocationId: 'loc-city' } as Partial<PendingEncounterSeed>)]);
    expect(result.unifiedActions).toHaveLength(1);
    const trace = queryTrace('content.query_resolved');
    expect(trace?.judgedAt).toBe('target_location');
    expect(trace?.judgedAtLocationId).toBe('loc-town');
  });

  it('(e) the legacy `tavern` family seed fires in the tavern Place too', () => {
    const result = run(buildState('town_tav'), [tavernSeed({ query: undefined, encounterFamily: 'tavern' } as Partial<PendingEncounterSeed>)]);
    expect(result.unifiedActions).toHaveLength(1);
    expect(result.unifiedActions[0].templateId.startsWith('tavern.')).toBe(true);
  });
});
