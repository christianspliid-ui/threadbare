// THR-1687: does the cap's own-hex pass starve the templates registered last? Paired A/B on the
// engine's own filter. For every deciding individual at sampled ticks, take the board's nearby
// cache entries exactly as phaseAgentDecision does, then run `runFilterPipeline` twice on the
// same state:
//   walk — the shipped local pass (rotated walk over the list, enters each location block at its head)
//   hash — the prototype (proto/thr-1687 branch only): own-hex entries ordered by
//          hash(agent:tick:templateId), first 30 distinct templates
// Survival = an own-hex template in the input that reaches the candidates, bucketed by the
// template's window-fit band ← the decider's band on the template's reach (THR-1627 D2 helpers).
// Also: distinct templates on the decider's own hex, and survival by registration-order quartile.
// Usage: node .cache/cap-band.mjs <seeds> <ticks> <sampleEvery>
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../../../../src/engine/remembrance';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { runFilterPipeline } from '../../../../src/engine/encounterFilterPipeline';
import { getAgentLocationId } from '../../../../src/engine/graphQueries';
import { resolveLocationToHex } from '../../../../src/engine/encounterAwareness';
import { hexDistance } from '../../../../src/lib/hexMath';
import { MAX_AWARENESS_HOPS, EDGE_HEX_AWARENESS_BONUS } from '../../../../src/data/agent-behavior-constants';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../../../../src/data/unified-action-templates';
import { computeCapability } from '../../../../src/engine/domainCapability';
import { proficiencyBandFor, windowFitBandFor, demandedDifficultyOf } from '../../../../src/engine/kpi/engagementKpi';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 120);
const EVERY = Number(process.argv[4] ?? 10);
const RANGE = MAX_AWARENESS_HOPS + EDGE_HEX_AWARENESS_BONUS + 1;
const { cols, rows } = MAP_SIZE_PRESETS.medium;
const G = globalThis as Record<string, unknown>;
const ARMS = ['walk', 'hash'] as const;

const regIndex = new Map<string, number>();
(UNIFIED_ACTION_TEMPLATES as Array<{ id: string }>).forEach((t, i) => regIndex.set(t.id, i));
const regN = regIndex.size;
const bandCache = new Map<string, string>();
const contentBand = (id: string): string => {
  let b = bandCache.get(id);
  if (b === undefined) {
    const t = getUnifiedTemplateById(id);
    const d = t ? demandedDifficultyOf(t.steps ?? [], t.scale) : NaN;
    b = Number.isFinite(d) ? windowFitBandFor(d) : 'unknown';
    bandCache.set(id, b);
  }
  return b;
};

const out: Record<string, unknown> = {};
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  G.__CAP_LOCAL_ORDER = 'walk';
  const runtime = createSimulationRuntime();
  const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium') as any;
  devSeedTheFirst(state); devSeedAscendantTestPackage(state);
  // cell key `${contentBand}<-${deciderBand}` → per arm [seen, survived]
  const cells: Record<string, Record<string, [number, number]>> = { walk: {}, hash: {}, filterOnly: {} };
  const pipelineMs: Record<string, number> = { walk: 0, hash: 0 };
  const quart: Record<string, [number, number][]> = { walk: [[0,0],[0,0],[0,0],[0,0]], hash: [[0,0],[0,0],[0,0],[0,0]] };
  const localDistinct: number[] = [];
  let boards = 0;
  for (let i = 1; i <= TICKS; i++) {
    G.__CAP_LOCAL_ORDER = 'walk';
    state = runTick(state, [], runtime);
    if (i % EVERY !== 0) continue;
    const cache = (runtime as any).encounterCache;
    for (const n of state.graph.getNodesByType('actor')) {
      if (n.properties?.actorType !== 'individual' || n.properties?.spotlightTier === 'ambient') continue;
      const loc = getAgentLocationId(state.graph, n.id); if (!loc) continue;
      const hex = resolveLocationToHex(state.graph, loc); if (!hex) continue;
      const nearby = cache.getEntriesNearHex(hex.col, hex.row, RANGE) as any[];
      const onHex = new Map<string, boolean>();
      const localIds = new Set<string>();
      for (const e of nearby) {
        let l = onHex.get(e.locationId);
        if (l === undefined) { const h = resolveLocationToHex(state.graph, e.locationId); l = !!h && hexDistance(h, hex) === 0; onHex.set(e.locationId, l); }
        if (l) localIds.add(e.templateId);
      }
      if (!localIds.size) continue;
      boards++; localDistinct.push(localIds.size);
      for (const arm of ARMS) {
        G.__CAP_LOCAL_ORDER = arm;
        const t0 = performance.now();
        const r = runFilterPipeline(nearby, n.id, loc, state.graph, state.tick, cols, rows);
        pipelineMs[arm] += performance.now() - t0;
        const kept = new Set((r.candidates as any[]).map(c => c.templateId));
        for (const id of localIds) {
          const t = getUnifiedTemplateById(id);
          const db = t?.reach ? proficiencyBandFor(computeCapability(state.graph, n.id, t.reach)) : 'unknown';
          const key = `${contentBand(id)}<-${db}`;
          const c = (cells[arm][key] ??= [0, 0]); c[0]++; if (kept.has(id)) c[1]++;
          const ri = regIndex.get(id);
          if (ri !== undefined) { const q = quart[arm][Math.min(3, Math.floor(4 * ri / regN))]; q[0]++; if (kept.has(id)) q[1]++; }
        }
      }
      G.__CAP_LOCAL_ORDER = 'walk';
      if (process.env.FILTER_ONLY) {
        // Cap-free pass: each local template alone (<= 40 entries never reaches the cap), so
        // survival here is the earlier stages only (awareness, visibility, prerequisites).
        const byT = new Map<string, any[]>();
        for (const e of nearby) if (localIds.has(e.templateId)) { const a = byT.get(e.templateId) ?? []; a.push(e); byT.set(e.templateId, a); }
        for (const [id, es] of byT) {
          const r = runFilterPipeline(es.slice(0, 40), n.id, loc, state.graph, state.tick, cols, rows);
          const t = getUnifiedTemplateById(id);
          const db = t?.reach ? proficiencyBandFor(computeCapability(state.graph, n.id, t.reach)) : 'unknown';
          const c = (cells.filterOnly[`${contentBand(id)}<-${db}`] ??= [0, 0]); c[0]++; if ((r.candidates as any[]).length) c[1]++;
        }
      }
    }
  }
  localDistinct.sort((a, b) => a - b);
  const pct = (p: number) => localDistinct[Math.floor(p * (localDistinct.length - 1))];
  const fmt = (o: Record<string, [number, number]>) => Object.fromEntries(Object.entries(o).sort().map(([k, [s, k2]]) => [k, `${(100 * k2 / s).toFixed(1)}% (${k2}/${s})`]));
  const res = {
    boards,
    localDistinctTemplates: { p10: pct(0.1), p50: pct(0.5), p90: pct(0.9), max: localDistinct[localDistinct.length - 1] },
    walk: fmt(cells.walk), hash: fmt(cells.hash), filterOnly: fmt(cells.filterOnly),
    pipelineMsPerBoard: Object.fromEntries(ARMS.map(a => [a, +(pipelineMs[a] / Math.max(1, boards)).toFixed(3)])),
    registrationQuartile: Object.fromEntries(ARMS.map(a => [a, quart[a].map(([s, k]) => `${(100 * k / Math.max(1, s)).toFixed(1)}% (${k}/${s})`)])),
  };
  out[`seed${seed}`] = res;
  console.log(`seed ${seed}: ${JSON.stringify(res, null, 1)}`);
}
console.log('JSON ' + JSON.stringify(out));
