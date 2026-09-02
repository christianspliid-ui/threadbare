/**
 * Calling telemetry — the narratable-band gate for the chronicle-moment claim
 * (THR-1299 slice 5, review M1).
 *
 * The calling ships as a chronicle moment only if its change rate is narratable.
 * The band, from the plan's Done-when:
 *
 *   - **no flicker** — no spotlight mortal changes calling more than
 *     `MAX_CHANGES_PER_100_TICKS` times per 100 ticks;
 *   - **no fossil** — at least one change somewhere in a population that has
 *     completed undertakings.
 *
 * Outside the band the plan's kill criterion applies: the calling ships static
 * (`CALLING_CHANGE_SIGNIFICANCE = 0`) and the closeout records it. This is the
 * instrument that decides; it is a committed script so the decision can be
 * re-run, not asserted.
 *
 * A sibling of `undertaking-census.ts` rather than an extension of it: the census
 * gates the decision board's cutover and reads checkpoint traces; this reads
 * `calling_change` traces and the spotlight population, and folding the two would
 * couple two gates that should be able to move on their own.
 *
 * Usage:
 *   npm run telemetry:calling                      # seeds 42,99 × 300 ticks
 *   npm run telemetry:calling -- --seeds 42 --ticks 150
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { readStoredCalling } from '../src/engine/calling';

const DEFAULT_SEEDS: readonly number[] = [42, 99];
/**
 * The plan asked for 300; the default is 150 because that is the run. On a
 * medium map the doom clock ends `playing` around tick 170 and the post-run
 * phases are not the band's subject — a 300-tick request was measured at over
 * twenty minutes of wall-clock against under a minute for 150, with nothing the
 * gate reads happening in the difference. Pass `--ticks 300` to insist.
 */
const DEFAULT_TICKS = 150;
/** The flicker ceiling from the plan's Done-when. */
const MAX_CHANGES_PER_100_TICKS = 3;

function parseArgs(argv: readonly string[]): { seeds: number[]; ticks: number } {
  let seeds = [...DEFAULT_SEEDS];
  let ticks = DEFAULT_TICKS;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seeds' && argv[i + 1]) seeds = argv[++i].split(',').map(s => Number(s.trim())).filter(Number.isFinite);
    if (argv[i] === '--ticks' && argv[i + 1]) ticks = Number(argv[++i]);
  }
  return { seeds, ticks };
}

interface SeedReport {
  seed: number;
  ticks: number;
  spotlightAgents: number;
  namedAgents: number;
  initialDerivations: number;
  changes: number;
  changesByCause: Record<string, number>;
  /** Changes per spotlight agent that changed at all. */
  perAgent: Record<string, number>;
  maxPer100: number;
  completedUndertakings: number;
  titles: Record<string, number>;
  flicker: boolean;
  fossil: boolean;
}

function runSeed(seed: number, ticks: number): SeedReport {
  resetEventCounter();
  clearTraces();
  enableTracing();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(archetype, 'calling-telemetry', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const perAgent = new Map<string, number>();
  const changesByCause: Record<string, number> = {};
  let initial = 0;
  let changes = 0;

  for (let i = 0; i < ticks; i++) {
    clearTraces();
    state = runTick(state, [], runtime);
    for (const t of getTraces()) {
      if (t.category !== 'calling_change') continue;
      const row = t as unknown as { agentId: string; cause: string; fromTitleKey: string | null };
      if (row.fromTitleKey === null) { initial += 1; continue; }
      changes += 1;
      changesByCause[row.cause] = (changesByCause[row.cause] ?? 0) + 1;
      perAgent.set(row.agentId, (perAgent.get(row.agentId) ?? 0) + 1);
    }
  }
  disableTracing();

  const actors = state.graph.getNodesByType('actor').filter(n => n.properties?.actorType === 'individual');
  const spotlight = actors.filter(n => n.properties?.spotlightTier === 'spotlight');
  const titles: Record<string, number> = {};
  let named = 0;
  for (const n of actors) {
    const c = readStoredCalling(n);
    if (!c) continue;
    named += 1;
    titles[c.title] = (titles[c.title] ?? 0) + 1;
  }
  const completed = (state.strategicState?.history ?? []).filter(h => h.outcome === 'completed').length;
  const maxChanges = Math.max(0, ...perAgent.values());
  const maxPer100 = maxChanges * (100 / ticks);

  return {
    seed, ticks,
    spotlightAgents: spotlight.length,
    namedAgents: named,
    initialDerivations: initial,
    changes,
    changesByCause,
    perAgent: Object.fromEntries([...perAgent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)),
    maxPer100,
    completedUndertakings: completed,
    titles,
    flicker: maxPer100 > MAX_CHANGES_PER_100_TICKS,
    fossil: completed > 0 && changes === 0,
  };
}

function main(): void {
  const { seeds, ticks } = parseArgs(process.argv.slice(2));
  const reports = seeds.map(seed => runSeed(seed, ticks));
  for (const r of reports) {
    console.log(`\n=== seed ${r.seed} · ${r.ticks} ticks ===`);
    console.log(`spotlight ${r.spotlightAgents} · named ${r.namedAgents} · first derivations ${r.initialDerivations} · changes ${r.changes} · completed undertakings ${r.completedUndertakings}`);
    console.log(`changes by cause: ${JSON.stringify(r.changesByCause)}`);
    console.log(`most-changed agents: ${JSON.stringify(r.perAgent)} · max per 100 ticks ${r.maxPer100.toFixed(2)}`);
    console.log(`titles: ${JSON.stringify(r.titles)}`);
    console.log(`flicker ${r.flicker ? 'YES' : 'no'} · fossil ${r.fossil ? 'YES' : 'no'}`);
  }
  const anyFlicker = reports.some(r => r.flicker);
  const allFossil = reports.every(r => r.fossil);
  const verdict = anyFlicker ? 'OUTSIDE BAND (flicker)' : allFossil ? 'OUTSIDE BAND (fossil)' : 'NARRATABLE';
  console.log(`\nverdict: ${verdict} — band: no agent > ${MAX_CHANGES_PER_100_TICKS} changes/100 ticks, and ≥1 change on some seed with completed undertakings`);
  process.exitCode = verdict === 'NARRATABLE' ? 0 : 1;
}

main();
