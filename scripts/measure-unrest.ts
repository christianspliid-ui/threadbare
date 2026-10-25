/**
 * THR-1934 S1 — unrest-as-pressure Done-when predicates, measured on real seeded worlds.
 *
 * Runs each seed for 600 ticks (50 days) and reports, per seed:
 *   - towns that ever bore Restless (≥ 3 per seed), and that ever bore Lawless;
 *   - the most settlements Lawless on any one day, as a share (≤ 25%);
 *   - towns at unrest ≥ 50 whose only non-zero input was the death site (0);
 *   - towns at Lawless whose largest input was poverty (kill criterion);
 *   - every `unrest.leave`: destination within 6 hexes, not hungry and not Restless at the time;
 *   - whether any `scarcity_arc_phase` transition moved unrest in the tick it fired (0).
 *
 * THR-1957 S2 adds (run with `--ticks 1200` for the plan's 100 days):
 *   - towns that ever bore On the edge (≥ 1 per seed);
 *   - every `unrest.defect` / `unrest.rising`: it moved the town's `controls` and left a
 *     chronicle line (`A Town Turns` / `A Town Rises`) for a full-detail town;
 *   - the most times one town defected (kill criterion: > 2 raises the margin);
 *   - towns at unrest ≥ 70 whose only non-zero input was the death site (0).
 *
 * `--dump <tick>` instead writes each settlement's unrest at that tick to stdout as
 * JSON, for the rollback comparison (flag off on this branch vs main).
 *
 * Time: ~6–9 min per seed at 600 ticks on medium (≈0.8 s per tick, more as the world
 *       grows); one seed per command keeps a call under the 600 s command cap. The plan's
 *       three seeds (42,99,7) are three commands.
 * Usage: npm run measure:unrest [-- --seeds 42 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { getLocationNodes } from '../src/engine/sublocationShape';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { resolveLocationToHex } from '../src/engine/encounterAwareness';
import { hexDistance } from '../src/lib/hexMath';
import { TICKS_PER_DAY } from '../src/data/attention-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
console.error('[THR-2041] ~6–9 min per seed at 600 ticks on medium; run one seed per command (600 s command cap).');
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
const DUMP_AT = argValue('--dump') !== undefined ? Number(argValue('--dump')) : null;

const RESTLESS = 'trait.condition.location.restless';
const LAWLESS = 'trait.condition.location.lawless';
const ON_THE_EDGE = 'trait.condition.location.on_the_edge';
const SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

function hasTrait(g: { getOutgoingEdges: (id: string, t: string) => Array<{ target: string }> }, id: string, t: string): boolean {
  return g.getOutgoingEdges(id, 'has_trait').some(e => e.target === t);
}

function runSeed(seed: number) {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'UnrestMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);
  if (DUMP_AT === null) enableTracing();

  const everRestless = new Set<string>();
  const everLawless = new Set<string>();
  let maxLawlessShare = 0;
  let maxLawlessDay = 0;
  const deathOnlyAt50 = new Set<string>();
  const povertyLedLawless = new Set<string>();
  let leaves = 0;
  let leaveViolations = 0;
  let leaveNone = 0;
  let leaningMortals = 0;
  let fleeMinted = 0;
  let arcJumps = 0;
  let riotSeeds = 0;
  let maxUnrest = 0;
  // S2
  const everOnTheEdge = new Set<string>();
  const deathOnlyAt70 = new Set<string>();
  let defections = 0;
  let considered = 0;
  const risings: Record<string, number> = {};
  let risingNoOne = 0;
  let turnsWithoutControlsMove = 0;
  const defectsPerTown = new Map<string, number>();
  let chronicleTurns = 0;
  let chronicleRises = 0;
  let chronicleEdge = 0;
  let popups = 0;
  let seenChronicle = state.chronicleEntries?.length ?? 0;

  for (let i = 0; i < TICKS; i++) {
    const before = new Map<string, number>();
    for (const n of getLocationNodes(state.graph)) if (SUBTYPES.has(n.properties.locationSubtype as string)) before.set(n.id, (n.properties.unrest as number) ?? 0);
    // Snapshot destination state *before* the tick, as the daily pass reads it.
    const hungryBefore = new Map<string, boolean>();
    const restlessBefore = new Map<string, boolean>();
    for (const n of getLocationNodes(state.graph)) {
      hungryBefore.set(n.id, typeof n.properties.hungerDays === 'number' && (n.properties.hungerDays as number) > 0);
      restlessBefore.set(n.id, hasTrait(state.graph, n.id, RESTLESS));
    }
    state = runTick(state, [], runtime);
    const g = state.graph;

    if (DUMP_AT !== null) {
      if (state.tick === DUMP_AT) {
        const out: Record<string, number> = {};
        for (const n of getLocationNodes(g).filter(n => SUBTYPES.has(n.properties.locationSubtype as string)).sort((a, b) => a.id.localeCompare(b.id))) {
          out[n.id] = Math.round(((n.properties.unrest as number) ?? 0) * 1e6) / 1e6;
        }
        return { seed, dump: out };
      }
      continue;
    }

    for (const t of getTraces()) {
      if (t.tick !== state.tick) continue;
      const tr = t as unknown as Record<string, unknown>;
      if (t.category === 'unrest.leave') {
        leaves++;
        const from = resolveLocationToHex(g, tr.fromId as string);
        const to = resolveLocationToHex(g, tr.toId as string);
        const far = !from || !to || hexDistance(from, to) > 6;
        // The daily pass runs inside the tick, after the hunger counters moved; read the
        // destination's state the pass itself saw (its hungerDays now, its trait before).
        const dest = g.getNode(tr.toId as string);
        const hungry = typeof dest?.properties.hungerDays === 'number' && (dest.properties.hungerDays as number) > 0;
        if (far || hungry || restlessBefore.get(tr.toId as string)) leaveViolations++;
        if (tr.leaningAgentId) leaningMortals++;
        if (tr.fleeMinted) fleeMinted++;
      } else if (t.category === 'unrest.leave.none') leaveNone++;
      else if (t.category === 'unrest.riot_seed' && tr.seeded) riotSeeds++;
      else if (t.category === 'unrest.defect.considered') considered++;
      else if (t.category === 'unrest.defect' || t.category === 'unrest.rising') {
        const id = tr.locationId as string;
        const holder = tr.holderId as string;
        if (g.getIncomingEdges(id, 'controls').some(e => e.source === holder)) turnsWithoutControlsMove++;
        if (t.category === 'unrest.defect') {
          defections++;
          defectsPerTown.set(id, (defectsPerTown.get(id) ?? 0) + 1);
        } else {
          risings[tr.path as string] = (risings[tr.path as string] ?? 0) + 1;
        }
      } else if (t.category === 'unrest.rising.no_one') risingNoOne++;
      else if (t.category === 'scarcity_arc_phase') {
        // The unrest phase also moves the number each tick; the arc runs before it on
        // the same tick, so compare against the drift bound: a jump is > 1 in one tick.
        const id = tr.locationId as string;
        const now = (g.getNode(id)?.properties.unrest as number) ?? 0;
        if (Math.abs(now - (before.get(id) ?? 0)) > 1) arcJumps++;
      }
    }
    clearTraces();
    void hungryBefore;
    const entries = state.chronicleEntries ?? [];
    for (const e of entries.slice(seenChronicle)) {
      if (e.title === 'A Town Turns') chronicleTurns++;
      else if (e.title === 'A Town Rises') chronicleRises++;
      else if (e.title === 'A Town on the Edge') chronicleEdge++;
    }
    seenChronicle = entries.length;
    popups += (state.tickEvents ?? []).filter(e => e.notification?.channel === 'popup' && e.id.startsWith('evt_unrest_')).length;

    if (state.tick % TICKS_PER_DAY !== 0) continue;
    const towns = getLocationNodes(g).filter(n => SUBTYPES.has(n.properties.locationSubtype as string));
    let lawlessToday = 0;
    for (const n of towns) {
      const u = (n.properties.unrest as number) ?? 0;
      maxUnrest = Math.max(maxUnrest, u);
      if (hasTrait(g, n.id, RESTLESS)) everRestless.add(n.id);
      if (hasTrait(g, n.id, ON_THE_EDGE)) everOnTheEdge.add(n.id);
      const lawless = hasTrait(g, n.id, LAWLESS);
      if (lawless) { everLawless.add(n.id); lawlessToday++; }
      const inp = n.properties.unrestInputs as Record<string, number> | undefined;
      if (inp && u >= 50) {
        const raising = ['hunger', 'poverty', 'siege', 'sickness', 'deathSite'].filter(k => (inp[k] ?? 0) > 0);
        if (raising.length === 1 && raising[0] === 'deathSite') deathOnlyAt50.add(n.id);
        if (u >= 70 && raising.length === 1 && raising[0] === 'deathSite') deathOnlyAt70.add(n.id);
      }
      if (inp && lawless) {
        const keys = ['hunger', 'poverty', 'siege', 'sickness', 'deathSite'];
        const top = keys.reduce((a, b) => ((inp[b] ?? 0) > (inp[a] ?? 0) ? b : a), keys[0]);
        if (top === 'poverty' && (inp.poverty ?? 0) > 0) povertyLedLawless.add(n.id);
      }
    }
    const share = towns.length ? lawlessToday / towns.length : 0;
    if (share > maxLawlessShare) { maxLawlessShare = share; maxLawlessDay = state.tick / TICKS_PER_DAY; }
  }

  return {
    seed,
    settlements: getLocationNodes(state.graph).filter(n => SUBTYPES.has(n.properties.locationSubtype as string)).length,
    everRestless: everRestless.size,
    everLawless: everLawless.size,
    maxLawlessShare: Math.round(maxLawlessShare * 1000) / 10 + '%',
    maxLawlessDay,
    maxUnrest: Math.round(maxUnrest * 10) / 10,
    deathOnlyAt50: deathOnlyAt50.size,
    povertyLedLawless: [...povertyLedLawless],
    leaves, leaveViolations, leaveNone, leaningMortals, fleeMinted, riotSeeds, arcJumps,
    s2: {
      everOnTheEdge: everOnTheEdge.size,
      considered, defections, risings, risingNoOne,
      turnsWithoutControlsMove,
      maxDefectsOneTown: Math.max(0, ...defectsPerTown.values()),
      chronicleEdge, chronicleTurns, chronicleRises, popups,
      deathOnlyAt70: deathOnlyAt70.size,
    },
  };
}

for (const seed of SEEDS) console.log(JSON.stringify(runSeed(seed)));
