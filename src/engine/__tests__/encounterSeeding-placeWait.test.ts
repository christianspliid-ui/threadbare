/**
 * THR-1929 — a templateId sequel waits for a place its template accepts.
 *
 * A ripe seed naming one gated scene holds while the mortal stands somewhere the
 * template rejects, fires the first time they stand somewhere it fits, and withers
 * after SEQUEL_PLACE_WAIT_TICKS with `place_never_reached`. Kept appointments and
 * ungated templates are untouched.
 *
 * ## Falsification
 *
 *  • Removing the `templateAcceptsWhereTheyStand` gate in `evaluateEncounterSeeds`
 *    makes (a) spawn the mill-lease auction on the open road.
 *  • Reading only the Location tier (dropping the Place `sublocationTypeId` arm)
 *    makes (d)'s tavern rematch wait in the tavern instead of firing.
 *  • Falling through to query/family after the window makes (c) leave a family line
 *    instead of the withered one.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { evaluateEncounterSeeds, templateAcceptsWhereTheyStand } from '../encounterSeeding';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { SEQUEL_PLACE_WAIT_TICKS } from '../../data/movement-content';
import { TAVERN_SUBLOCATION_TYPE_ID } from '../sublocation';
import type { GameState } from '../../types/gameState';
import type { PendingEncounterSeed } from '../../types/unifiedAction';

const MILL = 'encounter.town.mill_lease_auction';
const CHALLENGE = 'tavern.the_challenge';
const RIPE = 100;

/**
 *   loc-road   — a `wilderness` stretch (nowhere a town scene belongs)
 *   loc-town   — a `town`
 *   town_tav   — a tavern Place inside loc-town
 *   town_mkt   — a market-district Place inside loc-town
 */
function buildState(standAt: string): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-road', type: 'location', name: 'The Old Road', properties: { hexCol: 0, hexRow: 0, locationSubtype: 'wilderness', locationType: 'wilderness' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Ashford', properties: { hexCol: 4, hexRow: 0, locationSubtype: 'town', locationType: 'settlement' } });
  graph.addNode({ id: 'town_tav', type: 'location', name: 'The Gilded Flagon', properties: { parentLocationId: 'loc-town', sublocationTypeId: TAVERN_SUBLOCATION_TYPE_ID } });
  graph.addNode({ id: 'town_mkt', type: 'location', name: 'Market district', properties: { parentLocationId: 'loc-town', sublocationTypeId: 'sublocation-type.market' } });
  graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: standAt, type: 'located_at', properties: {} });
  return {
    tick: RIPE, graph, tickEvents: [], recentEvents: [], unifiedActions: [], pendingEncounterSeeds: [],
  } as unknown as GameState;
}

function moveTo(state: GameState, locationId: string): void {
  state.graph.removeEdge('hero_loc');
  state.graph.addEdge({ id: 'hero_loc', source: 'actor-hero', target: locationId, type: 'located_at', properties: {} });
}

function seed(templateId: string, over: Partial<PendingEncounterSeed> = {}): PendingEncounterSeed {
  return {
    seedId: `seed_${templateId}`, sourceEncounterId: 'src', sourceReactionId: 'rx',
    templateId, targetAgentId: 'actor-hero', eligibleAfterTick: RIPE, plantedTick: RIPE - 72,
    seedLabel: 'A thread comes due.',
    ...over,
  } as PendingEncounterSeed;
}

const rng = () => 0.5;
const run = (state: GameState, tick: number, seeds: PendingEncounterSeed[]) =>
  evaluateEncounterSeeds({ ...state, pendingEncounterSeeds: seeds }, tick, rng);

describe('THR-1929 — a templateId sequel waits for its place', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the fixtures are honest: the auction is gated to towns, the rematch to taverns, the road is neither', () => {
    const mill = getUnifiedTemplateById(MILL)!;
    expect(mill.locationSubtypes).toContain('town');
    expect(mill.locationSubtypes).not.toContain('wilderness');
    expect(getUnifiedTemplateById(CHALLENGE)!.locationSubtypes).toEqual([TAVERN_SUBLOCATION_TYPE_ID]);
  });

  it('(a) a ripe town sequel on the open road does not spawn and stays queued, traced once', () => {
    const state = buildState('loc-road');
    const first = run(state, RIPE, [seed(MILL)]);
    expect(first.unifiedActions).toHaveLength(0);
    expect(first.pendingEncounterSeeds!.map(s => s.seedId)).toEqual([`seed_${MILL}`]);
    const second = evaluateEncounterSeeds(first, RIPE + 1, rng);
    expect(second.unifiedActions).toHaveLength(0);
    const waits = getTraces().filter(t => t.category === 'encounter_seed_waiting');
    expect(waits).toHaveLength(1);
    expect(waits[0]).toMatchObject({ templateId: MILL, judgedSubtype: 'wilderness', waitsUntilTick: RIPE + SEQUEL_PLACE_WAIT_TICKS - 1 });
  });

  it('(b) the same seed spawns in town once the mortal arrives inside the window', () => {
    const state = buildState('loc-road');
    const waited = run(state, RIPE, [seed(MILL)]);
    moveTo(waited, 'loc-town');
    const fired = evaluateEncounterSeeds(waited, RIPE + 20, rng);
    expect(fired.unifiedActions.map(a => a.templateId)).toEqual([MILL]);
    expect(fired.pendingEncounterSeeds).toHaveLength(0);
  });

  it('(c) past the window still on the road: withered with place_never_reached, no action, no family line', () => {
    const state = buildState('loc-road');
    const lastWait = run(state, RIPE + SEQUEL_PLACE_WAIT_TICKS - 1, [seed(MILL)]);
    expect(lastWait.pendingEncounterSeeds).toHaveLength(1);
    const withered = evaluateEncounterSeeds(lastWait, RIPE + SEQUEL_PLACE_WAIT_TICKS, rng);
    expect(withered.unifiedActions).toHaveLength(0);
    expect(withered.pendingEncounterSeeds).toHaveLength(0);
    expect(withered.tickEvents.map(e => e.id)).toEqual([`seed_${MILL}_expired`]);
    const discard = getTraces().find(t => t.category === 'encounter_seed_triggered');
    expect(discard).toMatchObject({ outcome: 'discarded', discardReason: 'place_never_reached' });
  });

  it('(d) a tavern rematch fires in a tavern Place and waits at the market district of the same town', () => {
    const inTavern = run(buildState('town_tav'), RIPE, [seed(CHALLENGE)]);
    expect(inTavern.unifiedActions.map(a => a.templateId)).toEqual([CHALLENGE]);
    const atMarket = run(buildState('town_mkt'), RIPE, [seed(CHALLENGE)]);
    expect(atMarket.unifiedActions).toHaveLength(0);
    expect(atMarket.pendingEncounterSeeds).toHaveLength(1);
  });

  it('(e) a kept appointment is not gated: it fires at its place even where the template would not', () => {
    const state = buildState('loc-road');
    const kept = run(state, RIPE, [seed(MILL, {
      appointment: {
        locationId: 'loc-road', dueTick: RIPE, windowTicks: 12, counterpartyId: 'actor-hero',
        missed: { seedLabel: 'missed', query: { kind: 'encounter_template', tags: ['#crossroads_debt'] } },
      },
    } as Partial<PendingEncounterSeed>)]);
    expect(kept.unifiedActions.map(a => a.templateId)).toEqual([MILL]);
    expect(getTraces().some(t => t.category === 'encounter_seed_waiting')).toBe(false);
  });

  it('(f) an ungated templateId sequel fires anywhere, unchanged', () => {
    const id = UNIFIED_ACTION_TEMPLATES.find(x => !x.locationSubtypes?.length && x.actorAffinities?.includes('individual'))!.id;
    expect(templateAcceptsWhereTheyStand(buildState('loc-road').graph, 'actor-hero', getUnifiedTemplateById(id)!)).toBe(true);
    const fired = run(buildState('loc-road'), RIPE, [seed(id)]);
    expect(fired.unifiedActions.map(a => a.templateId)).toEqual([id]);
  });

  it('templateAcceptsWhereTheyStand: a dangling location is nowhere a gated template accepts', () => {
    const state = buildState('loc-road');
    state.graph.addNode({ id: 'orphan_sub', type: 'location', name: 'A room', properties: { parentLocationId: 'no-such-town' } });
    moveTo(state, 'orphan_sub');
    expect(templateAcceptsWhereTheyStand(state.graph, 'actor-hero', { locationSubtypes: ['town'] as never })).toBe(false);
    expect(templateAcceptsWhereTheyStand(state.graph, 'actor-ghost', { locationSubtypes: ['town'] as never })).toBe(false);
    expect(templateAcceptsWhereTheyStand(state.graph, 'actor-ghost', { locationSubtypes: [] })).toBe(true);
  });
});
