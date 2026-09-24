/**
 * THR-1578 — the roll-spread gauge (forecast-window plan S1,
 * `Docs/plans/2026-09-24-thr-1575-forecast-window.md`).
 *
 * Productises the 2026-09-24 scratch measurement behind THR-1575. Runs seeded
 * headless worlds, harvests every `resolution.input` trace (one per step roll),
 * and reports:
 *
 *   1. the P histogram — the odds the dice actually rolled at;
 *   2. the share of rolls pinned exactly on their scale's floor
 *      (`MIN_PROBABILITY_BY_SCALE`) — the drift THR-1575 undoes;
 *   3. success by the roller's raw score band, and by authored step difficulty —
 *      whether *who the mortal is* and *what it faces* move the odds;
 *   4. content coverage per proficiency band — drawable encounter templates,
 *      undertaking cells and monster families whose at-par proficiency (the demanded
 *      difficulty after the scale offset) falls in each band. This is the brief for
 *      the higher-difficulty content authored after S4.
 *
 * Changes no behaviour. The raw score is read directly through the trace's `reach`
 * (added by this ticket) instead of inverting the capability sigmoid.
 *
 * Usage: npm run measure:roll-spread [-- --seeds 42,99 --ticks 300 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { computeRawScore } from '../src/engine/domainCapability';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { MIN_PROBABILITY_BY_SCALE, SCALE_DIFFICULTY_OFFSETS } from '../src/engine/resolutionScaleAdjust';
import { isEncounterAction } from '../src/engine/chapterArchive';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { UNDERTAKING_CELL_TEMPLATES } from '../src/data/undertaking-cells';
import { MONSTER_FAMILIES } from '../src/data/monster-families';
import { FIGHT_RATING_DIFFICULTY, FIGHT_STEP_SCALE } from '../src/data/fight-constants';
import { PROFICIENCY_BANDS, proficiencyBandFor, isSuccessFamily } from '../src/engine/kpi/engagementKpi';
import type { ProficiencyBand } from '../src/engine/kpi/engagementKpi';
import { KPI_FLOOR_PINNED_MAX } from '../src/engine/kpi/kpiConstants';
import type { ResolutionInputTrace } from '../src/types/trace';
import type { ActionScale } from '../src/types/unifiedAction';

// ─── Args ────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
const TICKS = parseInt(argValue('--ticks') ?? '300', 10);
const MAP: MapSizePreset = (argValue('--map') ?? 'medium') as MapSizePreset;

/** A roll is floor-pinned when its P sits on its scale's floor to within this. */
const FLOOR_PIN_EPSILON = 0.0005;
const RAW_BANDS: ReadonlyArray<readonly [string, number, number]> = [
  ['<10', -Infinity, 10], ['10-20', 10, 20], ['20-30', 20, 30], ['30-40', 30, 40], ['40-60', 40, 60], ['>=60', 60, Infinity],
];
const P_BUCKETS: ReadonlyArray<readonly [string, number, number]> = [
  ['<0.20', -Infinity, 0.2], ['0.20-0.39', 0.2, 0.4], ['0.40-0.59', 0.4, 0.6],
  ['0.60-0.64', 0.6, 0.65], ['0.65-0.69', 0.65, 0.7], ['0.70-0.79', 0.7, 0.8], ['0.80-0.94', 0.8, 0.95], ['>=0.95', 0.95, Infinity],
];

interface Roll {
  seed: number;
  scale: ActionScale;
  raw: number;
  rawDifficulty: number;
  probability: number;
  pinned: boolean;
  success: boolean;
}

// ─── Harvest ─────────────────────────────────────────────────────

function harvest(seed: number): { rolls: Roll[]; rollers: Set<string> } {
  resetDecisionCache();
  resetEventCounter();
  resetReputationTraitInit();
  const preset = MAP_SIZE_PRESETS[MAP];
  const archetypes = generateArchetypes(4, seed);
  let { state } = initializeGameState(archetypes[0], 'RollSpread', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const runtime = createSimulationRuntime();
  enableTracing();
  clearTraces();

  const rolls: Roll[] = [];
  const rollers = new Set<string>();
  for (let t = 0; t < TICKS; t++) {
    state = runTick(state, [], runtime);
    for (const entry of getTraces()) {
      if (entry.category !== 'resolution.input') continue;
      const tr = entry as unknown as ResolutionInputTrace;
      const rollerId = tr.actingMemberId ?? tr.actorId;
      rollers.add(rollerId);
      const raw = tr.reach ? computeRawScore(state.graph, rollerId, tr.reach) : NaN;
      const floor = MIN_PROBABILITY_BY_SCALE[tr.scale] ?? MIN_PROBABILITY_BY_SCALE.regional;
      rolls.push({
        seed,
        scale: tr.scale,
        raw,
        rawDifficulty: tr.rawDifficulty,
        probability: tr.probability,
        pinned: Math.abs(tr.probability - floor) < FLOOR_PIN_EPSILON,
        success: isSuccessFamily(tr.outcome),
      });
    }
    clearTraces();
  }
  return { rolls, rollers };
}

// ─── Report helpers ──────────────────────────────────────────────

const pct = (a: number, b: number) => (b > 0 ? `${((100 * a) / b).toFixed(1)}%` : '  n/a');

function successRow(label: string, subset: Roll[], total: number): string {
  const s = subset.filter(r => r.success).length;
  const meanP = subset.length > 0 ? subset.reduce((a, r) => a + r.probability, 0) / subset.length : NaN;
  return `  ${label.padEnd(12)} n=${String(subset.length).padStart(5)} (${pct(subset.length, total).padStart(6)})  success=${pct(s, subset.length).padStart(6)}  meanP=${Number.isFinite(meanP) ? meanP.toFixed(2) : 'n/a'}`;
}

function report(label: string, rolls: Roll[]): void {
  const n = rolls.length;
  console.log(`\n=== ${label} — ${n} rolls ===`);

  console.log('P histogram (the odds rolled):');
  for (const [name, lo, hi] of P_BUCKETS) {
    const c = rolls.filter(r => r.probability >= lo && r.probability < hi).length;
    console.log(`  ${name.padEnd(10)} ${pct(c, n).padStart(6)}  ${'#'.repeat(Math.round((c / Math.max(1, n)) * 60))}`);
  }

  const pinned = rolls.filter(r => r.pinned).length;
  const verdict = n > 0 && pinned / n <= KPI_FLOOR_PINNED_MAX ? 'within' : 'ABOVE';
  console.log(`floor-pinned: ${pct(pinned, n)} of rolls sit exactly on their scale floor (${verdict} KPI_FLOOR_PINNED_MAX ${KPI_FLOOR_PINNED_MAX})`);
  for (const scale of ['personal', 'local', 'regional', 'cosmic'] as const) {
    const sub = rolls.filter(r => r.scale === scale);
    if (sub.length === 0) continue;
    console.log(`  scale ${scale.padEnd(9)} n=${String(sub.length).padStart(5)} floor=${MIN_PROBABILITY_BY_SCALE[scale].toFixed(2)} pinned=${pct(sub.filter(r => r.pinned).length, sub.length)}`);
  }

  console.log('success by the roller\'s raw score on the step reach:');
  for (const [name, lo, hi] of RAW_BANDS) {
    console.log(successRow(`raw ${name}`, rolls.filter(r => r.raw >= lo && r.raw < hi), n));
  }
  const noRaw = rolls.filter(r => !Number.isFinite(r.raw));
  if (noRaw.length > 0) console.log(successRow('raw n/a', noRaw, n));

  console.log('success by authored step difficulty (pre scale offset):');
  const diffs = [...new Set(rolls.map(r => Math.round(r.rawDifficulty * 10) / 10))].sort((a, b) => a - b);
  for (const d of diffs) {
    console.log(successRow(`diff ${d.toFixed(1)}`, rolls.filter(r => Math.round(r.rawDifficulty * 10) / 10 === d), n));
  }
}

// ─── Content coverage (seed-independent) ─────────────────────────

function emptyBandCounts(): Record<ProficiencyBand, number> {
  return { novice: 0, journeyman: 0, expert: 0, master: 0 };
}

function coverage(): void {
  console.log('\n=== Content coverage per proficiency band (at-par proficiency = demanded difficulty after scale offset) ===');
  const rows: Array<[string, Record<ProficiencyBand, number>, number]> = [];

  const encounters = emptyBandCounts();
  let encounterTotal = 0;
  for (const tmpl of UNIFIED_ACTION_TEMPLATES) {
    if (!isEncounterAction(tmpl.id)) continue;
    const steps = tmpl.steps ?? [];
    if (steps.length === 0) continue;
    const offset = SCALE_DIFFICULTY_OFFSETS[tmpl.scale ?? 'regional'] ?? 0;
    const demanded = steps.reduce((s, st) => s + (st.difficulty ?? 0), 0) / steps.length + offset;
    encounters[proficiencyBandFor(demanded)]++;
    encounterTotal++;
  }
  rows.push(['encounter templates', encounters, encounterTotal]);

  const cells = emptyBandCounts();
  let cellTotal = 0;
  for (const cell of UNDERTAKING_CELL_TEMPLATES) {
    const d = (cell as { checkpointDifficulty?: number }).checkpointDifficulty;
    if (typeof d !== 'number') continue;
    // Checkpoints pass no scale, so they resolve at the regional default (offset 0).
    cells[proficiencyBandFor(d + SCALE_DIFFICULTY_OFFSETS.regional)]++;
    cellTotal++;
  }
  rows.push(['undertaking cells', cells, cellTotal]);

  const monsters = emptyBandCounts();
  let monsterTotal = 0;
  for (const fam of Object.values(MONSTER_FAMILIES)) {
    const demanded = (FIGHT_RATING_DIFFICULTY[fam.dread] + FIGHT_RATING_DIFFICULTY[fam.might]) / 2
      + SCALE_DIFFICULTY_OFFSETS[FIGHT_STEP_SCALE];
    monsters[proficiencyBandFor(demanded)]++;
    monsterTotal++;
  }
  rows.push(['monster families', monsters, monsterTotal]);

  console.log(`  ${'content'.padEnd(20)} ${PROFICIENCY_BANDS.map(b => b.padStart(14)).join('')}   total`);
  for (const [name, counts, total] of rows) {
    console.log(`  ${name.padEnd(20)} ${PROFICIENCY_BANDS.map(b => `${counts[b]} (${pct(counts[b], total).trim()})`.padStart(14)).join('')}   ${total}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────

console.log('THR-1578 — roll-spread gauge');
console.log(`seeds=${SEEDS.join(',')} map=${MAP} ticks=${TICKS}`);

const all: Roll[] = [];
const allRollers = new Set<string>();
for (const seed of SEEDS) {
  const t0 = Date.now();
  const { rolls, rollers } = harvest(seed);
  for (const r of rollers) allRollers.add(`${seed}:${r}`);
  all.push(...rolls);
  console.log(`seed ${seed}: ${rolls.length} rolls by ${rollers.size} rollers in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

for (const seed of SEEDS) report(`seed ${seed}`, all.filter(r => r.seed === seed));
if (SEEDS.length > 1) report(`all seeds (${allRollers.size} rollers)`, all);
coverage();
