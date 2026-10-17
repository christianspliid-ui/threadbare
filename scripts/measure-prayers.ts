/**
 * THR-1935 S1 — prayers and the faithful, measured on real seeded worlds.
 *
 * Runs each seed for 1,080 ticks (90 days) and reports, per seed:
 *   - prayers opened (≤ PRAYER_FLOOD_LINE per seed, and ≥ 1 on any seed where some day had
 *     a town passing the four-part gate), and how each closed;
 *   - gate-passing towns: distinct towns that passed the four-part gate on some day (the
 *     ones the god heard, plus the ones left waiting by the one-at-a-time rule);
 *   - faithful towns held (at the end and at most), and how every prayer closed;
 *   - the Restless-town census by the god's band (the kill criterion's evidence when
 *     no prayer opens: Touched and hunger-largest rarely meet).
 *
 * `--dump <tick>` instead writes every essence source and every place's sphere scores at
 * that tick as JSON, for the rollback comparison (PRAYER_ENABLED off vs main).
 *
 * The scripted god never casts, so no prayer is answered here; answering is proved by
 * the unit tests and the browser lever (`__DEBUG.forcePrayer`).
 *
 * Usage: npm run measure:prayers [-- --seeds 42,99,7 --ticks 1080 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { dominionOf } from '../src/engine/dominion';
import { listPrayers, listFaithful, passesPrayerGate } from '../src/engine/prayers';
import { PRAYER_FLOOD_LINE } from '../src/data/prayer-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 1080);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
const DUMP_AT = argValue('--dump') !== undefined ? Number(argValue('--dump')) : null;

const RESTLESS = 'trait.condition.location.restless';
const SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

function runSeed(seed: number) {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'PrayerMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const restlessByBand: Record<string, Set<string>> = {};
  let hungerLedRestlessOnGround = 0;
  let maxFaithful = 0;
  const gatePassing = new Set<string>();

  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    const g = state.graph;

    if (DUMP_AT !== null) {
      if (state.tick === DUMP_AT) {
        const sources: Record<string, unknown> = {};
        const scores: Record<string, unknown> = {};
        for (const n of getLocationNodes(g).sort((a, b) => a.id.localeCompare(b.id))) {
          if (n.properties.essenceSource) sources[n.id] = n.properties.essenceSource;
          const bag = n.properties.sphereAffinity as { scores?: unknown; progress?: unknown } | undefined;
          if (bag) scores[n.id] = { scores: bag.scores, progress: bag.progress };
        }
        return { seed, dump: { sources, scores } };
      }
      continue;
    }

    if (state.tick % 12 === 0) {
      for (const n of getLocationNodes(g)) {
        if (!SUBTYPES.has(n.properties.locationSubtype as string)) continue;
        if (passesPrayerGate(g, state.ascendantId, n, state.tick)) gatePassing.add(n.id);
        if (!g.getOutgoingEdges(n.id, 'has_trait').some(e => e.target === RESTLESS)) continue;
        const band = dominionOf(g, state.ascendantId, n.id).band;
        (restlessByBand[band] ??= new Set()).add(n.id);
        const inputs = n.properties.unrestInputs as Record<string, number> | undefined;
        if (inputs && band !== 'foreign' && band !== 'hostile') {
          const top = Object.entries(inputs).filter(([k]) => k !== 'contentment').sort((a, b) => b[1] - a[1])[0];
          if (top && top[0] === 'hunger') hungerLedRestlessOnGround++;
        }
      }
      maxFaithful = Math.max(maxFaithful, listFaithful(g, state.ascendantId).length);
    }
  }

  const prayers = listPrayers(state.graph);
  for (const p of prayers) gatePassing.add(p.townId);
  return {
    seed,
    prayersOpened: prayers.length,
    gatePassingTowns: gatePassing.size,
    byStatus: prayers.reduce<Record<string, number>>((acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc; }, {}),
    faithfulAtEnd: listFaithful(state.graph, state.ascendantId).length,
    maxFaithful,
    restlessTownsByBand: Object.fromEntries(Object.entries(restlessByBand).map(([b, s]) => [b, s.size])),
    hungerLedRestlessDaysOnGround: hungerLedRestlessOnGround,
    withinFloodLine: prayers.length <= PRAYER_FLOOD_LINE,
  };
}

const results = SEEDS.map(runSeed);
console.log(JSON.stringify(results, null, 2));
if (DUMP_AT === null) {
  const runs = results.filter((r): r is Extract<typeof r, { prayersOpened: number }> => 'prayersOpened' in r);
  // Census predicate (calibration ruling 2026-10-17): ≤ flood line on every seed; ≥ 1 on
  // every seed with a gate-passing town; ≥ 1 overall.
  const ok = runs.every(r => r.withinFloodLine && (r.gatePassingTowns === 0 || r.prayersOpened >= 1))
    && runs.some(r => r.prayersOpened >= 1);
  console.log(ok
    ? `
measure:prayers OK — every seed ≤ ${PRAYER_FLOOD_LINE} prayers, ≥ 1 wherever a town passed the gate, ≥ 1 overall (${TICKS} ticks)`
    : `
measure:prayers OUT — a seed flooded, opened none despite a gate-passing town, or no seed opened one`);
}
