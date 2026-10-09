// @vitest-lane heavy — four small world builds (THR-1774)
/**
 * THR-1774 — world creation draws the doom through `selectDoomArchetype`, an
 * explicit doom always wins, and the identity path keys the draw on the hunger.
 */
import { describe, it, expect } from 'vitest';
import {
  initializeGameState,
  initializeGameStateFromIdentity,
  DEV_ASCENDANT_IDENTITY,
  MAP_SIZE_PRESETS,
} from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { selectDoomArchetype } from '../doomArchetypeSelection';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';

const SEED = 42;
const WORLD_BUILD_TIMEOUT_MS = 60_000;
const { cols, rows } = MAP_SIZE_PRESETS.small;
const archetype = generateArchetypes(4, SEED)[0];

describe('initializeGameState draws the doom (THR-1774)', () => {
  it('draws through selectDoomArchetype when no doom is passed, and traces the draw', () => {
    clearTraces();
    enableTracing();
    try {
      const { state } = initializeGameState(archetype, 'Test-Runner', createBalancedCosmology(), SEED, cols, rows);
      const expected = selectDoomArchetype(SEED, archetype.id).archetype;
      expect(state.doomDefinition.archetype).toBe(expected);
      expect(state.doomClock.definitionArchetype).toBe(expected);
      expect(state.doomIdentityMatrix.archetype).toBe(expected);
      const trace = getTraces().find(t => t.category === 'doom.archetype_drawn');
      expect(trace).toMatchObject({ archetype: expected, source: 'draw', identityKey: archetype.id, seed: SEED });
    } finally {
      disableTracing();
      clearTraces();
    }
  }, WORLD_BUILD_TIMEOUT_MS);

  it('an explicit doom wins over the draw', () => {
    const drawn = selectDoomArchetype(SEED, archetype.id).archetype;
    const pin = drawn === 'reckoning' ? 'sundering' : 'reckoning';
    const { state } = initializeGameState(archetype, 'Test-Runner', createBalancedCosmology(), SEED, cols, rows, pin);
    expect(state.doomDefinition.archetype).toBe(pin);
  }, WORLD_BUILD_TIMEOUT_MS);

  it('the identity path keys the draw on the stored hunger id, and takes an override', () => {
    const drawn = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, SEED, undefined, 'small');
    expect(drawn.state.doomDefinition.archetype)
      .toBe(selectDoomArchetype(SEED, DEV_ASCENDANT_IDENTITY.hungerId).archetype);
    const pinned = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, SEED, undefined, 'small', 'reckoning');
    expect(pinned.state.doomDefinition.archetype).toBe('reckoning');
  }, WORLD_BUILD_TIMEOUT_MS * 2);
});
