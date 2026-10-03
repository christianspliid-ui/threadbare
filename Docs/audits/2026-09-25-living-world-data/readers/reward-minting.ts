// Census reader (THR-1626): what reward draws hand out in a live world today, and whether a
// generated `found` item could stand in for the Storied and Mythic ones. Read-only; one
// world per seed, medium map, unattended (no player, no First), default scenario.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/reward-minting.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/reward-minting.mjs --external:fs --external:path
//   node .cache/reward-minting.mjs [seeds=42,99,7] [ticks=150] [out.json]
//
// A. Every reward draw (the three sites that call drawSeededReward: `reward_draw` from an
//    aftermath, `step_reward_pool` from a step, `fight_trophy` from a fight ending), read off
//    `content.query_resolved` traces: site, the recipe's tag filters, and the drawn
//    template's node type / tier / category.
// B. For the draws that landed on an authored `artifact` at tier 2 or 3, whether a generated
//    `found` item at that band can carry the recipe's tag filters: on the live world context
//    at the final tick (the past included), GEN_SAMPLES items per band, and the share whose
//    tags satisfy each observed filter set (`rewardCandidateMatchesTags`, the draw's own rule).
// C. (THR-1626 build) What the minting point actually did, off `reward.generated` traces:
//    substitutions per world, the outcome split, the distinct cores used and the most-repeated
//    core's share of generated rewards (the kill criterion: none above a third).
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { rewardCandidateMatchesTags } from '../../../../src/engine/rewardPool';
import { buildItemWorldContext, hasItemWorldPast, itemGenHistoryFromGraph } from '../../../../src/engine/itemGenerator/worldContext';
import { generateValidItem } from '../../../../src/engine/itemGenerator/mintGeneratedItem';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 150);
const OUT_PATH = process.argv[4];
const GEN_SAMPLES = 60;
const REWARD_SITES = new Set(['reward_draw', 'step_reward_pool', 'fight_trophy']);

type P = Record<string, unknown>;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };

const out: P = { ticks: TICKS, map: 'medium', scenario: 'default', genSamplesPerBand: GEN_SAMPLES };

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows,
  ) as { state: GameState };
  enableTracing();
  clearTraces();

  const bySite: Record<string, number> = {};
  const byKind: Record<string, number> = {};           // `${type}:t${tier}`
  const storiedMythicFilters: Record<string, number> = {}; // filter set → draws, for tier-2/3 authored artifacts
  const storiedMythicTemplates: Record<string, number> = {};
  let draws = 0; let empty = 0;
  const genOutcomes: Record<string, number> = {};
  const genCores: Record<string, number> = {};
  const genExamples: string[] = [];

  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], rt);
    for (const t of getTraces() as unknown as P[]) {
      const site = t.site as string | undefined;
      if (t.category === 'reward.generated') {
        inc(genOutcomes, t.outcome as string);
        const id = t.itemId as string | null;
        const g = id ? (state.graph.getNode(id)?.properties?.generated as { coreId?: string } | undefined) : undefined;
        if (g?.coreId) inc(genCores, g.coreId);
        if (id && genExamples.length < 8) genExamples.push(String(t.summary));
        continue;
      }
      if (!site || !REWARD_SITES.has(site)) continue;
      if (t.category === 'content.query_empty') { empty++; continue; }
      if (t.category !== 'content.query_resolved') continue;
      const picked = t.pickedId as string | undefined;
      if (!picked) continue;
      draws++;
      inc(bySite, site);
      const node = state.graph.getNode(picked);
      const type = node?.type ?? 'registry';
      const tier = Number(node?.properties?.tier ?? 1);
      inc(byKind, `${type}:t${tier}`);
      if (type === 'artifact' && (tier === 2 || tier === 3)) {
        const q = (t.query ?? {}) as { tags?: string[] };
        inc(storiedMythicFilters, `t${tier} [${(q.tags ?? []).join(',')}]`);
        inc(storiedMythicTemplates, `${picked} (${(node?.properties?.subcategory as string) ?? '?'})`);
      }
    }
    clearTraces();
  }

  // B. Can a generated found item carry those filters, on this world's own context?
  const world = buildItemWorldContext(state.graph, { past: true });
  const history = itemGenHistoryFromGraph(state.graph);
  const genByBand: Record<string, { ok: number; refused: number; tags: string[][]; cores: Record<string, number>; kinds: Record<string, number> }> = {};
  for (const band of [2, 3] as const) {
    const row = { ok: 0, refused: 0, tags: [] as string[][], cores: {} as Record<string, number>, kinds: {} as Record<string, number> };
    for (let k = 0; k < GEN_SAMPLES; k++) {
      const r = generateValidItem({ seedKey: `census:${seed}:found:${band}:${k}`, band, origin: 'found', world, history });
      if (!r.ok) { row.refused++; continue; }
      row.ok++;
      row.tags.push([...r.item.tags]);
      inc(row.cores, r.item.coreId);
      inc(row.kinds, r.item.kind);
    }
    genByBand[band] = row;
  }
  const filterFit: Record<string, string> = {};
  for (const key of Object.keys(storiedMythicFilters)) {
    const m = /^t(\d) \[(.*)\]$/.exec(key)!;
    const band = m[1];
    const filters = m[2] ? m[2].split(',') : [];
    const row = genByBand[band];
    const fit = row.tags.filter(tags => rewardCandidateMatchesTags(tags, filters)).length;
    filterFit[key] = `${fit}/${row.ok}`;
  }

  out[seed] = {
    draws, emptyQueries: empty, bySite, byKind,
    storiedMythicArtifactDraws: Object.values(storiedMythicFilters).reduce((a, b) => a + b, 0),
    storiedMythicFilters, storiedMythicTemplates,
    worldHasPast: hasItemWorldPast(world),
    pastCounts: { heroes: Object.keys(world.heroes).length, events: Object.keys(world.events).length, monsters: Object.keys(world.monsters).length },
    generatedFound: Object.fromEntries(Object.entries(genByBand).map(([b, r]) => [b, { ok: r.ok, refused: r.refused, cores: r.cores, kinds: r.kinds, distinctTags: [...new Set(r.tags.flat())].sort() }])),
    filterFit,
    generatedRewards: {
      substituted: genOutcomes.substituted ?? 0,
      outcomes: genOutcomes,
      distinctCores: Object.keys(genCores).length,
      cores: genCores,
      topCoreShare: (() => { const n = Object.values(genCores).reduce((a, b) => a + b, 0); return n ? Math.max(...Object.values(genCores)) / n : 0; })(),
      examples: genExamples,
    },
  };
}

const json = JSON.stringify(out, null, 1);
if (OUT_PATH) fs.writeFileSync(OUT_PATH, json); else console.log(json);
