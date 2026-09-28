// @vitest-lane heavy — drives a generated medium world 160 ticks before it reads the past (THR-1637)
/**
 * The live world's past dresses every found core (THR-1637 Done when, row 2).
 *
 * A seeded world past tick 150 — the real `initializeGameState → runTick` pipeline, no
 * record injected — is read by `buildItemWorldContext` with no maker, which reads the
 * past: the retained dead, the battles fought, the monster hosts. Every core that can be
 * found must then grow an item on that live context alone (not the review world) with
 * zero validator problems on its first draw and a clean engine read-back.
 *
 * The world is seed 42 on a **medium** map deliberately: a lifecycle death removes its
 * node, so only band, plot, fight, battle and commission deaths leave someone to name,
 * and a small seed-42 world has none by tick 160 (measured while building this). The
 * cores that tell only of a dead person (the weapon that chose its bearer, the saint's
 * relic, the heirloom) are unreachable in a world with no retained dead — that is the
 * world's truth, not the generator's, and this test asserts the world it runs on has one.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import { ITEM_GEN_CORES } from '../../../data/item-generator-cores';
import { buildItemWorldContext } from '../worldContext';
import { reviewWorldContext } from '../reviewWorld';
import { tryGenerate, coreEligible } from '../generateItem';
import { validateGeneratedItem } from '../validateGeneratedItem';
import { readBack } from '../readBack';
import { bandsForOrigin } from '../reviewBatch';
import type { ItemWorldContext } from '../types';

const SEED = 42;
/** Past tick 150, per the Done-when. */
const TICKS = 160;
/** Keys per core × legal band — enough to exercise each core's lines and both signatures. */
const KEYS_PER_BAND = 3;
/** ≈8× the measured ~20 s build (THR-1517: a `runTick` loop carries its own ceiling). */
const WORLD_TIMEOUT_MS = 180_000;

describe('the live world context dresses every found core (THR-1637)', () => {
  let world: ItemWorldContext;

  beforeAll(() => {
    resetEventCounter();
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS.medium;
    const archetype = generateArchetypes(4, SEED)[0];
    let { state } = initializeGameState(archetype, 'Found things', createBalancedCosmology(), SEED, preset.cols, preset.rows);
    for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
    world = buildItemWorldContext(state.graph, {});
  }, WORLD_TIMEOUT_MS);

  it('the world past tick 150 has a past: the dead, battles and monster hosts', () => {
    const counts = { heroes: Object.keys(world.heroes).length, events: Object.keys(world.events).length, monsters: Object.keys(world.monsters).length };
    console.log(`[THR-1637] live past at tick ${TICKS}: ${JSON.stringify(counts)}`);
    expect(counts.heroes).toBeGreaterThan(0);
    expect(counts.events).toBeGreaterThan(0);
    expect(counts.monsters).toBeGreaterThan(0);
    // Nothing from the review world leaks in.
    const review = reviewWorldContext(null);
    for (const table of ['heroes', 'events', 'monsters', 'places'] as const) {
      expect(Object.keys(world[table]).filter(id => id in review[table])).toEqual([]);
    }
  });

  it('every found core, every legal band: zero validator problems, zero read-back failures', () => {
    const failures: string[] = [];
    const fired = new Map<string, number>();
    let items = 0;
    // A core this world cannot host (e.g. a faction-voiced core when none of the retained
    // dead belonged to a faction) is the world's truth, not a generator defect — the same
    // rule the header applies to the dead. Such a core is held to the review world instead,
    // so a core that can never grow anywhere still fails here. Measured THR-1636: with
    // standing trade lanes, seed 42 at t160 keeps no faction-member dead, and
    // `oath_object` (all four lines voice a faction) has nothing to name.
    const unhosted = new Set<string>();
    const review = reviewWorldContext(null);
    for (const core of ITEM_GEN_CORES.filter(c => c.origins.includes('found'))) {
      for (const band of core.bands.filter(b => bandsForOrigin('found').includes(b))) {
        const probe = { seedKey: `probe:${core.id}:${band}`, band, origin: 'found' as const, coreId: core.id };
        if (!coreEligible(core, { ...probe, world })) {
          unhosted.add(core.id);
          const inReview = tryGenerate({ ...probe, world: review });
          if (typeof inReview === 'string') failures.push(`${core.id} b${band}: grows in neither the live nor the review world (${inReview})`);
          continue;
        }
        for (let k = 0; k < KEYS_PER_BAND; k++) {
          const seedKey = `gen_item:${SEED}:found:live:${core.id}:${band}:${k}`;
          const r = tryGenerate({ seedKey, band, origin: 'found', world, coreId: core.id });
          if (typeof r === 'string') { failures.push(`${core.id} b${band} #${k}: ${r}`); continue; }
          items++;
          fired.set(core.id, (fired.get(core.id) ?? 0) + 1);
          const problems = validateGeneratedItem(r);
          if (problems.length) failures.push(`${core.id}/${r.signatureId} b${band} (${r.name}): ${problems.join('; ')}`);
          const rb = readBack(r);
          if (!rb.ok) failures.push(`${core.id}/${r.signatureId} b${band} (${r.name}): ${rb.failures.join('; ')}`);
          // A named dead person is only ever told at their own battle.
          for (const c of r.concepts.filter(x => x.kind === 'actor')) {
            const own = world.heroes[c.id]?.eventId;
            const stray = Object.values(world.events).find(ev => ev.id !== own && r.provenance.includes(ev.name));
            if (stray) failures.push(`${core.id} (${r.name}): ${c.name} told at ${stray.name} — ${r.provenance}`);
          }
          if (k === 0 && band === core.bands[0]) console.log(`[THR-1637] ${core.id}: ${r.name} — ${r.provenance}`);
        }
      }
    }
    console.log(`[THR-1637] ${items} found items on the live context, ${failures.length} failures`);
    expect(failures).toEqual([]);
    const foundCores = ITEM_GEN_CORES.filter(c => c.origins.includes('found')).map(c => c.id);
    if (unhosted.size) console.log(`[THR-1637] cores this live world cannot host (held to the review world): ${[...unhosted].join(', ')}`);
    expect(foundCores.filter(id => !fired.has(id) && !unhosted.has(id))).toEqual([]);
    // The world must still host most of the catalogue, or the context reader has regressed.
    expect(unhosted.size).toBeLessThanOrEqual(Math.floor(foundCores.length / 4));
  });
});
