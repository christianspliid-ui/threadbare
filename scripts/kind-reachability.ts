/**
 * Strategic kind reachability census — THR-1329.
 *
 * Answers, per seed, the question no existing instrument asked: **is there anybody
 * in this world who could take this strategic family at all?**
 *
 * THR-1329 measured a world (seed 99) where the `trade_route` kind cannot exist —
 * zero routes in 150 ticks — while `census:undertakings` reported PASS on every gate
 * and checkpoint liveness read 100%. Nothing was broken in the route pipeline: on
 * seed 42 the same code founds routes. What differed is that seed 42 happened to put
 * `ambition_dominate_trade` on a *spotlight* actor and seed 99 did not. Only spotlight
 * actors run the autonomous decision loop, so an ambition held at `notable` or
 * `ambient` tier is never offered to the strategic board, never refused, and never
 * traced. Absence with no refusal is invisible by construction — which is exactly
 * what this script exists to make visible.
 *
 * It reports. It does not widen: a world whose merchants have no viable partners is
 * a legitimate world, and this script's job is to say so out loud rather than to
 * force routes into a world that should not have them.
 *
 * Usage:
 *   npm run census:reachability                            # seeds 42,99 × 40 ticks
 *   npm run census:reachability -- --seeds 1,7,13 --ticks 60
 *   npm run census:reachability -- --json
 *
 * Flags:
 *   --seeds N,N,...  Comma-separated seeds (default 42,99)
 *   --ticks N        Ticks per run (default 40 — past initial assignment and the
 *                    first world-minted ambitions, short enough to sweep many seeds)
 *   --map <preset>   Map size (default medium)
 *   --json           Emit one JSON object instead of the report
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import {
  measureStrategicReachability,
  type StrategicReachabilityReport,
} from '../src/engine/strategicKindReachability';

const DEFAULT_SEEDS: readonly number[] = [42, 99];
/** Past initial assignment and the first minted ambitions; cheap enough to sweep. */
const DEFAULT_TICKS = 40;

// ─── Args ─────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const seeds = arg('seeds')?.split(',').map(Number) ?? [...DEFAULT_SEEDS];
const ticks = Number(arg('ticks') ?? DEFAULT_TICKS);
const map = (arg('map') ?? 'medium') as MapSizePreset;
const asJson = process.argv.includes('--json');

// ─── Run ──────────────────────────────────────────────────────────

interface SeedResult { readonly seed: number; readonly report: StrategicReachabilityReport }

function runSeed(seed: number): SeedResult {
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(
    archetype, 'Reachability', createBalancedCosmology(), seed, preset.cols, preset.rows,
  );
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return { seed, report: measureStrategicReachability(state.graph) };
}

const results = seeds.map(runSeed);

// ─── Report ───────────────────────────────────────────────────────

if (asJson) {
  console.log(JSON.stringify({ ticks, map, seeds: results }, null, 2));
} else {
  for (const { seed, report } of results) {
    console.log(`\n─── seed ${seed} · ${ticks} ticks · ${map} ───────────────────`);
    console.log(`autonomous (spotlight) actors: ${report.autonomousActorCount}\n`);
    // Keyed on the ambition, not the family: two ambitions share `builder-civic` and
    // two share `scholar-seeker`, so a family label alone renders one row OK and its
    // twin UNREACHABLE with no way to tell which gate is which.
    const aw = Math.max(...report.rows.map(r => r.ambitionId.length));
    const fw = Math.max(...report.rows.map(r => r.behaviorFamily.length));
    for (const row of report.rows) {
      const mark = (row.reachable ? 'OK' : 'UNREACHABLE').padEnd(11);
      // The tier split is the whole point when an ambition is unreachable: "nobody
      // wants this" and "the ones who want it cannot act" are different worlds.
      const held = `holders ${row.autonomousHolders} autonomous / ${row.silencedHolders} silenced`;
      console.log(`  ${mark}  ${row.ambitionId.padEnd(aw)}  ${row.behaviorFamily.padEnd(fw)}  ${held}`);
    }
    if (report.silencedFamilies.length > 0) {
      console.log(`\n  SILENCED — wanted here, but only by actors with no agency path:`);
      for (const f of report.silencedFamilies) console.log(`    ${f}`);
    }
    if (report.unreachableTemplateIds.length > 0) {
      console.log(`\n  ${report.unreachableTemplateIds.length} strategic templates unreachable this seed:`);
      for (const t of report.unreachableTemplateIds) console.log(`    ${t}`);
    }
  }

  console.log(`\n═══ reachability summary ═══`);
  for (const { seed, report } of results) {
    console.log(
      `  seed ${String(seed).padStart(5)}  ` +
      `${report.rows.length - report.unreachableFamilies.length}/${report.rows.length} families reachable, ` +
      `${report.unreachableTemplateIds.length} templates unreachable` +
      (report.silencedFamilies.length > 0 ? `, ${report.silencedFamilies.length} silenced` : ''),
    );
  }
}
