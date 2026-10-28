/**
 * Larder census — THR-2040 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Runs real worlds (`initializeGameState` → `runTick`) with the larder planter on or
 * off (`setLarderSeedsEnabledOverride`) and reports, pooled over the seeds:
 *   - hungry spells (≥ `FAMINE_SEED_DAY` days) in which someone standing in the town
 *     plays a famine scene, and glut runs in which someone plays a plenty scene;
 *   - the famine and plenty rows' share of firings in hungry, glutted and fed towns;
 *   - seeds planted (the `larder.seed` trace) and taken up by their target, and the
 *     per-template spread of planted scenes (the plan's Vision-audit note).
 *
 * A firing counts for the town its actor stands in (a Place resolves to its town).
 * Spells and firings are classified with `readLarder`, the planter's own reading.
 * Predicates are reported, not gated (plan § Done when): compare the two arms.
 *
 * Usage:
 *   npm run census:larder                                   # both arms, seeds 42,99,7,1,2,3 × 360
 *   npm run census:larder -- --arm on --seeds 42,99 --ticks 360
 *
 * Plan: Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md.
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { getAgentLocation } from '../src/engine/graphQueries';
import { getLocationNodes, resolveToParentLocation } from '../src/engine/sublocationShape';
import { isPressureSettlement } from '../src/engine/unrestPressure/inputs';
import { isHungryToday } from '../src/engine/unrestPressure/hunger';
import { readLarder, setLarderSeedsEnabledOverride } from '../src/engine/larderSeeds';
import { FAMINE_SEED_DAY, FAMINE_SEED_ROWS, PLENTY_SEED_ROWS } from '../src/data/larder-seed-config';
import { TICKS_PER_DAY } from '../src/data/attention-constants';

const DEFAULT_SEEDS: readonly number[] = [42, 99, 7, 1, 2, 3];
const DEFAULT_TICKS = 360;
const FAMINE = new Set(FAMINE_SEED_ROWS.map(r => r.templateId));
const PLENTY = new Set(PLENTY_SEED_ROWS.map(r => r.templateId));

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const ticks = Number(arg('--ticks') ?? DEFAULT_TICKS);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const armArg = arg('--arm') ?? 'both';
const arms: boolean[] = armArg === 'on' ? [true] : armArg === 'off' ? [false] : [false, true];

type Ctx = 'hungry' | 'glut' | 'fed';
type Tally = Map<string, number>;
const inc = (t: Tally, k: string, n = 1) => t.set(k, (t.get(k) ?? 0) + n);

function runSeed(seed: number, on: boolean, t: Tally): void {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  clearTraces();
  setLarderSeedsEnabledOverride(on);
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'LarderCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const seen = new Set<string>();
  const planted: Array<{ agent: string; tpl: string; tick: number }> = [];
  const spell = new Map<string, { kind: 'hungry' | 'glut'; start: number; covered: boolean }>();
  const closeSpell = (id: string, tick: number) => {
    const sp = spell.get(id);
    if (!sp) return;
    const days = (tick - sp.start) / TICKS_PER_DAY;
    if (days >= (sp.kind === 'hungry' ? FAMINE_SEED_DAY : 1)) {
      inc(t, `spell|${sp.kind}|n`);
      if (sp.covered) inc(t, `spell|${sp.kind}|covered`);
    }
    spell.delete(id);
  };

  for (let tick = 1; tick <= ticks; tick++) {
    state = runTick(state, [], runtime);
    // Harvest every tick: the ring is too small for a whole run.
    for (const tr of getTraces()) {
      if (tr.category !== 'larder.seed') continue;
      const r = tr as unknown as { state: string; templateId: string | null; targetAgentId: string | null; skipped?: string; tick: number };
      if (r.skipped) inc(t, `seed|${r.state}|skip|${r.skipped}`);
      else if (r.templateId && r.targetAgentId) {
        inc(t, `seed|${r.state}|planted`);
        inc(t, `tpl|${r.templateId}`);
        planted.push({ agent: r.targetAgentId, tpl: r.templateId, tick: r.tick });
      }
    }
    clearTraces();

    const ctx = new Map<string, Ctx>();
    for (const town of getLocationNodes(state.graph)) {
      if (!isPressureSettlement(town)) continue;
      const l = readLarder(town, isHungryToday(town).hungry).state;
      const c: Ctx = l === 'famine' ? 'hungry' : l === 'glut' ? 'glut' : 'fed';
      ctx.set(town.id, c);
      const sp = spell.get(town.id);
      if (sp && sp.kind !== c) closeSpell(town.id, tick);
      if (c !== 'fed' && !spell.has(town.id)) spell.set(town.id, { kind: c, start: tick, covered: false });
    }

    for (const a of state.unifiedActions ?? []) {
      if (seen.has(a.actionId)) continue;
      seen.add(a.actionId);
      const at = resolveToParentLocation(state.graph, getAgentLocation(state.graph, a.actorId))?.id;
      const c = at ? ctx.get(at) : undefined;
      if (!c || !at) continue;
      const sp = spell.get(at);
      if (sp && ((sp.kind === 'hungry' && FAMINE.has(a.templateId)) || (sp.kind === 'glut' && PLENTY.has(a.templateId)))) sp.covered = true;
      inc(t, `${c}|all`);
      if (FAMINE.has(a.templateId)) inc(t, `${c}|famine`);
      if (PLENTY.has(a.templateId)) inc(t, `${c}|plenty`);
      const i = planted.findIndex(p => p.agent === a.actorId && p.tpl === a.templateId);
      if (i >= 0) { inc(t, 'seed|taken'); planted.splice(i, 1); }
    }
  }
  for (const id of [...spell.keys()]) closeSpell(id, ticks + 1);
  setLarderSeedsEnabledOverride(null);
}

const pct = (n = 0, d = 0) => `${n}/${d} (${((100 * n) / Math.max(1, d)).toFixed(1)}%)`;

for (const on of arms) {
  const t: Tally = new Map();
  for (const seed of seeds) {
    const started = Date.now();
    runSeed(seed, on, t);
    console.error(`[larder-census] arm ${on ? 'on' : 'off'} seed ${seed} done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }
  const g = (k: string) => t.get(k) ?? 0;
  console.log(`\n== larder seeds ${on ? 'ON' : 'OFF'} — seeds ${seeds.join(',')} × ${ticks} ticks, ${map}`);
  console.log(`hungry spells (>= ${FAMINE_SEED_DAY} days) with a famine scene by someone in town: ${pct(g('spell|hungry|covered'), g('spell|hungry|n'))}`);
  console.log(`glut runs with a plenty scene by someone in town:            ${pct(g('spell|glut|covered'), g('spell|glut|n'))}`);
  for (const c of ['hungry', 'glut', 'fed'] as const) {
    console.log(`firings in ${c.padEnd(6)} towns: famine ${pct(g(`${c}|famine`), g(`${c}|all`))} · plenty ${pct(g(`${c}|plenty`), g(`${c}|all`))}`);
  }
  const plantedN = g('seed|famine|planted') + g('seed|glut|planted');
  console.log(`seeds planted: famine ${g('seed|famine|planted')} · glut ${g('seed|glut|planted')} · taken up by their target ${pct(g('seed|taken'), plantedN)}`);
  const skips = [...t.entries()].filter(([k]) => k.includes('|skip|')).map(([k, v]) => `${k.replace('seed|', '')} ${v}`);
  if (skips.length) console.log(`skipped: ${skips.join(' · ')}`);
  const spread = [...t.entries()].filter(([k]) => k.startsWith('tpl|')).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k.slice(4)} ${v}`);
  if (spread.length) console.log(`planted scenes by template: ${spread.join(' · ')}`);
}
