/**
 * THR-1973 — the army census: how many armies the map fields each day, and, for every
 * faction without one, the first gate that refuses it a raise.
 *
 * Reports per seed:
 *   - army-days: the share of days on which the map fields at least one army;
 *   - armies per day (one line per 10 days);
 *   - disbandments by cause (attrition with its largest source, battle);
 *   - re-raise gaps: for the largest realm, days from losing its last army to raising
 *     the next, while it could afford one;
 *   - refusals: for factions fielding no army on a day, a count of the first gate
 *     `isEligibleForArmySpawn` fails (no_ambition, not_military, commander, gold_tier,
 *     purse).
 *
 * Disband causes need traces, which slow the run roughly twofold: pass --trace.
 *
 * Usage: npm run measure:army-census [-- --seeds 42,99 --days 90 --map medium --trace]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { armyRefusal } from '../src/engine/armySpawning';
import { readWealth } from '../src/engine/wealth';
import type { TraceEntry } from '../src/types/trace';
import { TICKS_PER_DAY } from '../src/data/attention-constants';
import type { GameState } from '../src/types/gameState';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99').split(',').map(Number);
const DAYS = Number(argValue('--days') ?? 90);
const TRACE = process.argv.includes('--trace');
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

function armiesOf(state: GameState, factionId: string): number {
  return state.graph.getIncomingEdges(factionId, 'member_of')
    .filter(e => state.graph.getNode(e.source)?.properties.armyState != null).length;
}

function runSeed(seed: number): void {
  resetEventCounter();
  if (TRACE) enableTracing();
  clearTraces();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'ArmyCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const factions = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');
  const realms = factions.filter(f => f.properties.factionClass === 'realm');
  const largest = realms
    .map(r => ({ id: r.id, members: state.graph.getIncomingEdges(r.id, 'member_of').length }))
    .sort((a, b) => b.members - a.members || (a.id < b.id ? -1 : 1))[0]?.id;

  const started = performance.now();
  const perDay: number[] = [];
  const disbands: Record<string, number> = {};
  const refusals: Record<string, Record<string, number>> = {};
  const raises: Record<string, number> = {};
  let largestLostDay: number | null = null;
  const largestGaps: number[] = [];

  for (let day = 1; day <= DAYS; day++) {
    for (let t = 0; t < TICKS_PER_DAY; t++) {
      state = runTick(state, [], runtime);
      const lastAttrition = new Map<string, Record<string, number>>();
      for (const tr of getTraces() as ReadonlyArray<TraceEntry & Record<string, unknown>>) {
        if (tr.event === 'attrition' && tr.armyId) lastAttrition.set(String(tr.armyId), tr.attritionSources as Record<string, number>);
        if (tr.event === 'army_raised' && tr.factionId) raises[String(tr.factionId)] = (raises[String(tr.factionId)] ?? 0) + 1;
        if (tr.event === 'army_disbanded') {
          const src = lastAttrition.get(String(tr.armyId));
          let key = 'other';
          if (src) {
            const top = Object.entries(src).filter(([k]) => k !== 'base').sort((a, b) => b[1] - a[1])[0];
            key = `attrition:${top && top[1] > 0 ? top[0] : 'base'}`;
          }
          disbands[key] = (disbands[key] ?? 0) + 1;
        }
      }
      clearTraces();
    }
    const armies = state.graph.getNodesByType('actor').filter(n => n.properties.armyState != null);
    perDay.push(armies.length);
    if (day % 10 === 0) console.error(`  seed ${seed} day ${day}: ${armies.length} armies (${((performance.now() - started) / 1000).toFixed(0)} s)`);
    for (const f of state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction')) {
      if (armiesOf(state, f.id) > 0) continue;
      const why = armyRefusal(state, f.id) ?? 'eligible';
      const label = `${f.id}(${String(f.properties.factionClass ?? '?')})`;
      refusals[label] ??= {};
      refusals[label][why] = (refusals[label][why] ?? 0) + 1;
    }
    if (largest) {
      const fielding = armiesOf(state, largest) > 0;
      if (!fielding && largestLostDay === null) largestLostDay = day;
      if (fielding && largestLostDay !== null) { largestGaps.push(day - largestLostDay); largestLostDay = null; }
    }
  }

  const armyDays = perDay.filter(n => n > 0).length;
  console.log(`\n=== seed ${seed} · ${MAP} · ${DAYS} days ===`);
  console.log(`army-days: ${armyDays}/${DAYS} (${((armyDays / DAYS) * 100).toFixed(0)}%)`);
  console.log(`armies by day (every 10th): ${perDay.filter((_, i) => (i + 1) % 10 === 0).join(' ')}`);
  console.log(`disbands: ${JSON.stringify(disbands)}`);
  console.log(`raises: ${JSON.stringify(raises)}`);
  const lf = largest ? state.graph.getNode(largest) : undefined;
  console.log(`largest realm ${largest}: gaps ${JSON.stringify(largestGaps)}${largestLostDay !== null ? ` open since day ${largestLostDay}` : ''}, wealth now ${lf ? readWealth(lf.properties) : '?'}`);
  console.log('refusals (faction days without an army, by first failing gate):');
  for (const [f, r] of Object.entries(refusals)) console.log(`  ${f}: ${JSON.stringify(r)}`);
}

for (const s of SEEDS) runSeed(s);
