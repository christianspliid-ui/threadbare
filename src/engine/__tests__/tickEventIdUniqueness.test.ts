/**
 * TickEvent id uniqueness across a long run (THR-853).
 *
 * ## What this pins, and why it is a whole-run sweep rather than a `amb_evt` probe
 *
 * `orchestrator.resetEventCounters()` resets every ephemeral event counter at the
 * top of each tick, so the same seed replays the same ids (NFP #3 determinism).
 * The consequence nobody had encoded: a counter reset per tick is unique only
 * *within* a tick, while the events it labels are held far longer —
 * `recentEvents` is a 100-entry rolling buffer spanning many ticks, and React
 * keys the event list on `event.id`. A minter that omits the tick therefore
 * collides with the previous tick's Nth event of the same kind, and React warns
 * "children may be duplicated and/or omitted".
 *
 * Three producers had that shape (`amb_evt_N`, `rev_evt_N`, `ua_evt_N`); the
 * ones that got it right encode the tick (`evt_${tick}_${n}`,
 * `faction_join_${tick}_${n}`). Because the defect is a property of the *reset
 * contract* and not of any one module, a test that pinned `amb_evt` alone would
 * have gone green while its two identical siblings shipped broken, and would go
 * green again for the next minter added without the tick. So this asserts the
 * invariant the contract actually implies — no TickEvent id repeats across the
 * run — and any future tick-less minter fails it on arrival.
 *
 * Deliberately a full `initializeGameState` + `runTick` pipeline: the collision
 * only appears once several producers fire across many ticks, which is exactly
 * what a unit-level fixture cannot reproduce (and is how this survived to be
 * found by hand in a browser console during unrelated THR-621 verification).
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../orchestrator';
import { generateArchetypes } from '../ascendant';
import { SPHERE_NAMES } from '../../types/index';
import type { CosmologyProfile } from '../../types/index';
import { WORLD_SIM_TEST_TIMEOUT_MS } from '../../testing/testTimeouts';

/**
 * Ticks driven per run. The reported collision surfaced at ~260 ticks
 * (`amb_evt_17` ×9), but the mechanism bites as soon as two ticks each emit an
 * event from the same producer — 300 is chosen to clear the original repro with
 * margin, not because the bound is delicate.
 */
const UNIQUENESS_RUN_TICKS = 300;

/** Seed pinned so a failure is reproducible rather than a flake to re-roll. */
const UNIQUENESS_RUN_SEED = 42;

/** Collided ids listed in the failure message before truncating. */
const MAX_REPORTED_COLLISIONS = 10;

/** Even weight across all 12 spheres — this run is about ids, not cosmology. */
const EVEN_SPHERE_WEIGHT = 1 / SPHERE_NAMES.length;

/**
 * Archetype and cosmology are *derived*, not hand-written literals.
 *
 * The obvious move was to copy the fixture out of `content-layer1-integration`,
 * and doing so imported two type errors with it — that file's literal predates
 * the current `AscendantArchetype` / `CosmologyProfile` shapes and survives only
 * because it sits inside the THR-489 red baseline. `generateArchetypes` is the
 * production factory and is seeded, so it cannot drift from the type and stays
 * deterministic (NFP #3).
 */
const testArchetype = generateArchetypes(1, UNIQUENESS_RUN_SEED)[0];

const testCosmology: CosmologyProfile = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, EVEN_SPHERE_WEIGHT]),
) as CosmologyProfile;

describe(`TickEvent id uniqueness across ${UNIQUENESS_RUN_TICKS} ticks (THR-853)`, () => {
  resetDecisionCache();
  resetEventCounter();

  const { state: initialState } = initializeGameState(
    testArchetype,
    'Test Avatar',
    testCosmology,
    UNIQUENESS_RUN_SEED,
  );

  /** id -> ticks it was minted on. More than one entry is a collision. */
  const idToTicks = new Map<string, number[]>();
  let totalEvents = 0;

  let state = initialState;
  for (let i = 0; i < UNIQUENESS_RUN_TICKS; i++) {
    state = runTick(state);
    for (const event of state.tickEvents) {
      totalEvents++;
      const seen = idToTicks.get(event.id);
      if (seen) seen.push(state.tick);
      else idToTicks.set(event.id, [state.tick]);
    }
  }

  const collisions = [...idToTicks.entries()].filter(([, ticks]) => ticks.length > 1);

  it('emits events at all — guards against a vacuous pass on an empty run', () => {
    // Without this the uniqueness assertion below is trivially satisfiable by a
    // pipeline that produced nothing, which is the failure mode a whole-run
    // sweep is most exposed to.
    expect(totalEvents).toBeGreaterThan(0);
    expect(state.tick).toBe(initialState.tick + UNIQUENESS_RUN_TICKS);
  }, WORLD_SIM_TEST_TIMEOUT_MS);

  it('never mints the same TickEvent id twice', () => {
    const report = collisions
      .slice(0, MAX_REPORTED_COLLISIONS)
      .map(([id, ticks]) => `  ${id} — minted on ticks ${ticks.join(', ')}`)
      .join('\n');

    expect(
      collisions.length,
      collisions.length === 0
        ? ''
        : `${collisions.length} TickEvent id(s) minted more than once across `
          + `${UNIQUENESS_RUN_TICKS} ticks (${totalEvents} events). React keys the `
          + `event list on this id, so duplicates render duplicated or omitted rows.\n`
          + `${report}${collisions.length > MAX_REPORTED_COLLISIONS ? '\n  …' : ''}\n`
          + `A per-tick counter alone is not unique — encode the tick, as `
          + `evt_\${tick}_\${n} does.`,
    ).toBe(0);
  }, WORLD_SIM_TEST_TIMEOUT_MS);

  it('mints ambition event ids with the tick embedded', () => {
    // Shape, not just absence-of-collision, so the fix cannot regress into
    // "unique by luck because this seed happened to emit one per tick".
    //
    // **Only `amb_evt` is asserted, and that is a measured limit, not an
    // oversight.** Instrumenting this run showed `amb_evt` 198 ids, `rev_evt`
    // **0**, `ua_evt` **0** — neither `revelationEmitter` nor
    // `phaseIdleSelection` emits anything across 300 ticks of seed 42 from this
    // bare archetype. Looping the two dead prefixes here would have read as
    // three-producer coverage while asserting nothing about two of them, which
    // is the empty-population trap this codebase keeps re-finding. Their
    // identical fix rests on the typecheck and on the collision sweep above,
    // which covers them the moment they do fire; it is deliberately not claimed
    // as tested. Do not "restore" the other two prefixes to this loop without
    // first making them actually produce events.
    const ids = [...idToTicks.keys()].filter(id => id.startsWith('amb_evt_'));

    expect(ids.length, 'no amb_evt ids in the run — this assertion would be vacuous')
      .toBeGreaterThan(0);

    for (const id of ids) {
      expect(id, `${id} must be amb_evt_<tick>_<n>`).toMatch(/^amb_evt_\d+_\d+$/);
    }
  }, WORLD_SIM_TEST_TIMEOUT_MS);
});
