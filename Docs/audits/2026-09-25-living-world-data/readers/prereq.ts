// THR-1597 — which sub-filter of the pipeline's stage 3 ("prerequisites") drops a template.
//
// The engine's funnel counter lumps filterByPrerequisites (chain, traits, group, band,
// monster, faction join, reputation-with, hold, faction rank), filterByReputationGates
// and filterByOutgrowth into one "prerequisites" bucket. This reader re-runs the three
// sub-filters separately for every deciding mortal at sampled ticks, on exactly the
// entries that pass awareness + visibility, and tallies the FIRST sub-filter that drops
// each template. It does not split filterByPrerequisites further; the template's static
// prerequisite fields (reach.ts `prereqFields`) say which of its gates can apply.
// Spatial range 6 hexes stands in for the decision loop's spatialQueryRange.
//
// Run: npx esbuild …/readers/prereq.ts --bundle --platform=node --format=esm --outfile=.cache/prereq.mjs --external:fs --external:path && node .cache/prereq.mjs 42,99 200
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { filterByVisibility, filterByPrerequisites, filterByReputationGates, filterByOutgrowth } from '../../../../src/engine/encounterFilterPipeline';
import { filterByAwareness } from '../../../../src/engine/encounterAwareness';
import { generateFactionQuestCandidates, generateFactionLifecycleCandidates } from '../../../../src/engine/factionQuestGeneration';
import { isAutonomousDecisionActor } from '../../../../src/engine/strategicKindReachability';
import { getAgentLocationId } from '../../../../src/engine/graphQueries';
import { resolveLocationToHex } from '../../../../src/engine/encounterAwareness';
import { computeCapability } from '../../../../src/engine/domainCapability';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const EVERY = 20;
const tally: Record<string, Record<string, number>> = {}; // templateId → sub-filter → count
const bump = (id: string, k: string) => { tally[id] ??= {}; tally[id][k] = (tally[id][k] ?? 0) + 1; };
const capSamples: number[] = [];

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime: any = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Prereq', createBalancedCosmology(), seed, preset.cols, preset.rows) as any;
  for (let i = 1; i <= TICKS; i++) {
    state = runTick(state, [], runtime);
    if (i % EVERY !== 0 || !runtime.encounterCache) continue;
    const g = state.graph;
    for (const n of g.getNodesByType('actor')) {
      if (!isAutonomousDecisionActor(n)) continue;
      const loc = getAgentLocationId(g, n.id); if (!loc) continue;
      const hex = resolveLocationToHex(g, loc); if (!hex) continue;
      for (const r of ['iron', 'eye', 'heart', 'gold', 'shadow', 'stone', 'star', 'veil'] as const) capSamples.push(computeCapability(g, n.id, r));
      const entries = [...runtime.encounterCache.getEntriesNearHex(hex.col, hex.row, 6),
        ...generateFactionQuestCandidates(g, n.id, loc, state.tick), ...generateFactionLifecycleCandidates(g, n.id, loc)];
      const aw = filterByAwareness(entries, n.id, loc, g, preset.cols, preset.rows);
      const vis = filterByVisibility(aw, n.id, g);
      const ids = (xs: any[]) => new Set(xs.map(x => x.templateId));
      const visIds = ids(vis);
      const p1 = filterByPrerequisites(vis, n.id, g); const p1Ids = ids(p1);
      const p2 = filterByReputationGates(p1, n.id, g); const p2Ids = ids(p2);
      const p3 = filterByOutgrowth(p2, n.id, g); const p3Ids = ids(p3);
      for (const id of visIds) {
        if (!p1Ids.has(id)) bump(id, 'prerequisites_core');
        else if (!p2Ids.has(id)) bump(id, 'reputation_trait_gate');
        else if (!p3Ids.has(id)) bump(id, 'outgrowth');
        else bump(id, 'pass');
      }
    }
  }
}
capSamples.sort((a, b) => a - b);
const q = (p: number) => capSamples[Math.floor(p * (capSamples.length - 1))]?.toFixed(3);
console.log(JSON.stringify({ seeds, ticks: TICKS, every: EVERY, deciderCapabilityQuantiles: { p10: q(0.1), p50: q(0.5), p90: q(0.9) }, tally }, null, 1));
