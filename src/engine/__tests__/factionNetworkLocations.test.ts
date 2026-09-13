/**
 * A faction draws each Location it holds once — THR-1460.
 *
 * The defect: `halls` and `controlledLocations` were each deduped against
 * themselves and never against each other, so a Location that is both a guild
 * hall and a `controls` target sat in both lists. `FactionNetworkGraph`
 * concatenated the two and keyed by `location.id`, and React logged
 * `Encountered two children with the same key, \`loc_58\`` on every open of The
 * Merchant Consortium's sheet.
 *
 * **The world is generated, never a fixture.** The duplicate is a product of
 * worldgen edges — a settlement that receives a guild hall AND falls under the
 * same faction's `controls` — so a fixture asserting it would be inventing both
 * sides of the thing under test. `initializeGameState` at tick 0 is enough: the
 * overlap is laid down at worldgen, not accumulated by ticking, which is also
 * why this file stays out of the heavy lane.
 *
 * **The non-vacuity arm is the load-bearing one.** "Every id is unique" passes
 * trivially on a world where no faction holds a Location two ways, which is
 * exactly the shape that would let a reverted fix sit green. So the first test
 * proves the overlap exists on this seed, and the falsification arm proves the
 * naive concatenation still duplicates — together they show the uniqueness
 * assertion is measuring something.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { getFactionNetworkSummary, type FactionNetworkSummary } from '../factionNetwork';
import type { GameState } from '../../types/gameState';

const SEED = 42;

let state: GameState;
/** Every faction on the generated world that `getFactionNetworkSummary` answers for. */
let summaries: FactionNetworkSummary[];
/** Those holding at least one Location as BOTH a hall and a `controls` target. */
let overlapping: FactionNetworkSummary[];

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Network', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;

  summaries = state.graph.getNodesByType('actor')
    .filter(node => node.properties.actorType === 'faction')
    .map(node => getFactionNetworkSummary(state.graph, node.id))
    .filter((summary): summary is FactionNetworkSummary => summary !== null);

  overlapping = summaries.filter(summary => {
    const hallIds = new Set(summary.halls.map(hall => hall.id));
    return summary.controlledLocations.some(location => hallIds.has(location.id));
  });
});

describe('a faction holds each Location once in the network list (THR-1460)', () => {
  it('mints a world where some faction holds a Location two ways — the non-vacuity arm', () => {
    expect(summaries.length).toBeGreaterThan(0);
    // Without this, every assertion below is true of a world that simply never
    // produced the overlap, and a reverted dedupe would still read green.
    expect(overlapping.length).toBeGreaterThan(0);
  });

  it('the naive concatenation still repeats an id — the falsification arm', () => {
    // The exact expression the sheet used before the fix. It must STILL duplicate,
    // or the uniqueness arm below is passing for some unrelated reason.
    const concatenated = overlapping.map(summary => [
      ...summary.halls,
      ...summary.controlledLocations,
    ]);
    const anyRepeats = concatenated.some(list => new Set(list.map(l => l.id)).size !== list.length);
    expect(anyRepeats).toBe(true);
  });

  it('networkLocations never repeats an id, on any faction', () => {
    for (const summary of summaries) {
      const ids = summary.networkLocations.map(location => location.id);
      expect(new Set(ids).size, `${summary.name} repeats a Location in networkLocations`).toBe(ids.length);
    }
  });

  it('loses no Location — it is exactly the union of halls and controls', () => {
    for (const summary of summaries) {
      const expected = new Set([
        ...summary.halls.map(hall => hall.id),
        ...summary.controlledLocations.map(location => location.id),
      ]);
      const actual = new Set(summary.networkLocations.map(location => location.id));
      expect(actual, `${summary.name} dropped or invented a Location`).toEqual(expected);
    }
  });

  it('names the tie a hall — the stronger claim wins', () => {
    for (const summary of overlapping) {
      const hallIds = new Set(summary.halls.map(hall => hall.id));
      const shared = summary.networkLocations.filter(location => hallIds.has(location.id));
      expect(shared.length).toBeGreaterThan(0);
      for (const location of shared) {
        expect(location.role, `${summary.name}/${location.id} should read as a hall`).toBe('hall');
      }
    }
  });
});
