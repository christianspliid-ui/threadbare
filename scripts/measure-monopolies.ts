/**
 * THR-1955 — regional monopolies and embargo, measured on real seeded worlds.
 *
 * Runs each seed for `--ticks` (default 1080, 90 days) and reports, per seed:
 *   - regional monopolies standing at day 10 (Done-when: ≥ 2 on each seed), and at day 60;
 *   - the largest holder's share of all regional monopolies at day 60 (kill criterion: ≤ half);
 *   - every embargo laid: whether it left an `embargo_laid` chronicle line and a stock change
 *     in the target region (an embargoed town bearing the good carries the cut derivation's
 *     tier; "tier moved" when the cut moved it off the uncut tier).
 *
 * Usage: npm run measure:monopolies [-- --seeds 42,99,7 --ticks 1080 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { allRegionalMonopolies, readActiveEmbargo, embargoedTownsOf, buildBearingIndex } from '../src/engine/regionalMonopoly';
import { readResources, deriveLocationStockTiers } from '../src/engine/resourceEconomy';
import { getSublocationsAt } from '../src/engine/graphQueries';
import { EMBARGO_BALANCE_CUT } from '../src/data/regional-monopoly-constants';
import { TICKS_PER_DAY } from '../src/data/attention-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 1080);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

interface EmbargoSeen {
  holder: string;
  target: string;
  resource: string;
  tick: number;
  chronicled: boolean;
  stockChanged: boolean;
  tierMoved: boolean;
  towns: number;
  line: string;
}

function runSeed(seed: number) {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'MonopolyMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const idx0 = buildBearingIndex(state.graph);
  const bearingSummary = [...idx0.entries()].map(([rid, ps]) => `${rid}:${ps.length}/${ps.filter(p => p.controllerId).length}`).join(' ');
  let day10 = -1;
  let day60 = -1;
  let topShare60 = 0;
  const embargoes: EmbargoSeen[] = [];
  const live = new Map<string, EmbargoSeen>();
  const monopolyLines: string[] = [];

  for (let i = 0; i < TICKS; i++) {
    const chronBefore = state.chronicleEntries.length;
    state = runTick(state, [], runtime);
    const g = state.graph;
    const newChron = state.chronicleEntries.slice(chronBefore);
    for (const c of newChron) {
      if ((c.title === 'A Hold on the Market' || c.title === 'Monopoly Broken') && monopolyLines.length < 4) monopolyLines.push(`t${state.tick} ${c.title}: ${c.prose}`);
    }

    for (const f of g.getNodesByType('actor')) {
      if (f.properties.actorType !== 'faction') continue;
      const rec = readActiveEmbargo(f.properties);
      if (!rec) continue;
      const key = `${f.id}|${rec.untilTick}`;
      let seen = live.get(key);
      if (!seen) {
        const line = newChron.find(c => c.title === 'An Embargo');
        seen = {
          holder: f.name,
          target: g.getNode(rec.targetFactionId)?.name ?? rec.targetFactionId,
          resource: rec.resourceId,
          tick: state.tick,
          chronicled: line !== undefined,
          stockChanged: false,
          tierMoved: false,
          towns: embargoedTownsOf(g, rec).length,
          line: line?.prose ?? '',
        };
        live.set(key, seen);
        embargoes.push(seen);
      }
      for (const t of embargoedTownsOf(g, rec)) {
        const inst = readResources(t.properties)[rec.resourceId] as { stockTier?: string } | undefined;
        if (!inst) continue;
        const subs = getSublocationsAt(g, t.id).length;
        const uncut = deriveLocationStockTiers(t.properties, subs).perResource[rec.resourceId];
        const cut = deriveLocationStockTiers(t.properties, subs, new Map([[rec.resourceId, EMBARGO_BALANCE_CUT]])).perResource[rec.resourceId];
        if (!cut || !uncut) continue;
        if (inst.stockTier === cut.tier) seen.stockChanged = true;
        if (inst.stockTier === cut.tier && cut.tier !== uncut.tier) seen.tierMoved = true;
      }
    }

    if (state.tick % TICKS_PER_DAY !== 0) continue;
    const day = state.tick / TICKS_PER_DAY;
    if (day === 10) day10 = allRegionalMonopolies(g).length;
    if (day === 60) {
      const all = allRegionalMonopolies(g);
      day60 = all.length;
      const by = new Map<string, number>();
      for (const m of all) by.set(m.factionId, (by.get(m.factionId) ?? 0) + 1);
      topShare60 = all.length ? Math.max(...by.values()) / all.length : 0;
    }
  }
  return { seed, bearingSummary, day10, day60, topShare60, embargoes, monopolyLines };
}

for (const seed of SEEDS) {
  const r = runSeed(seed);
  console.log(`\n=== seed ${seed} ===`);
  console.log(`bearing places (resource:total/held) at start: ${r.bearingSummary}`);
  console.log(`regional monopolies day 10: ${r.day10} (need >= 2)  ·  day 60: ${r.day60}  ·  top holder share day 60: ${(r.topShare60 * 100).toFixed(0)}% (kill > 50%)`);
  for (const l of r.monopolyLines) console.log(`  ${l}`);
  const ok = r.embargoes.filter(e => e.chronicled && e.stockChanged).length;
  console.log(`embargoes laid: ${r.embargoes.length} (chronicle + stock change: ${ok})`);
  for (const e of r.embargoes) {
    console.log(`  t${e.tick} ${e.holder} -> ${e.target} on ${e.resource}: towns ${e.towns}, chronicle ${e.chronicled ? 'yes' : 'NO'}, stock change ${e.stockChanged ? 'yes' : 'NO'}${e.tierMoved ? ' (tier moved)' : ''}`);
    if (e.line) console.log(`      "${e.line}"`);
  }
}
