/**
 * Natural-firing baseline (THR-1218 design evidence, 2026-10-16, main 617802fb). Based on scripts/firing-census.ts.
 * Build: esbuild <this> --bundle --platform=node --format=esm --external:fs --external:path
 *        --alias:WT=<repo root> --outfile=nfb.mjs ; then `node analyse.cjs 42 7 1234` over the run-<seed>.json outputs.
 * S1 of the THR-1218 plan promotes this into scripts/firing-rhythm-census.ts.
 * Headless world + devSeedTheFirst (the same bond `?seeded` writes), no spawn levers.
 * Harvests every new unified action per tick, attributes to actor, splits by threaded /
 * spotlight / tier / family, and records encounter notifications (pause vs auto_resolve).
 *
 *   node .cache/nfb.mjs --seeds 42,7,1234 --ticks 600 --map medium --out <json>
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS, devSeedTheFirst } from 'WT/src/engine/gameInit';
import type { MapSizePreset } from 'WT/src/engine/gameInit';
import { runTick, resetEventCounter } from 'WT/src/engine/orchestrator';
import { createBalancedCosmology } from 'WT/src/engine/cosmology';
import { generateArchetypes } from 'WT/src/engine/ascendant';
import { createSimulationRuntime, touchStructure } from 'WT/src/engine/simulationRuntime';
import { resetReputationTraitInit } from 'WT/src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from 'WT/src/data/unified-action-templates';
import { computeCapability } from 'WT/src/engine/domainCapability';
import { proficiencyBandFor } from 'WT/src/engine/kpi/engagementKpi';
import { REACH_DOMAINS } from 'WT/src/types/traits';
import { TICKS_PER_DAY } from 'WT/src/data/attention-constants';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 100);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const out = arg('--out');
const TIER_SAMPLE_EVERY = 20;

const TEMPLATES = new Map<string, any>();
for (const t of [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES] as any[]) TEMPLATES.set(t.id, t);

interface Firing {
  seed: number; tick: number; actionId: string; actorId: string; templateId: string;
  source: string; seeded: boolean; actorType: string; threaded: boolean; courtPosition: string | null;
  spotlight: string; agentTier: string; reachBand: string; effectiveTier: string;
  intrinsicTier: string; routine: boolean; encounterType: string; known: boolean; targetIsActor: boolean;
}

function runSeed(seed: number) {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'NFB', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const firstId = devSeedTheFirst(state);
  touchStructure(runtime);
  const asc = state.ascendantId;

  const agentTier = new Map<string, string>();
  // agent-ticks denominators
  const exposure = new Map<string, number>(); // key -> agent-ticks
  const addExp = (k: string, n = 1) => exposure.set(k, (exposure.get(k) ?? 0) + n);

  const threadInfo = () => {
    const m = new Map<string, string | null>();
    for (const e of state.graph.getOutgoingEdges(asc, 'thread')) m.set(e.target, (e.properties?.courtPosition as string) ?? null);
    return m;
  };
  const livingIndividuals = () => state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true && n.properties.isDead !== true);
  const sampleTiers = () => {
    for (const n of livingIndividuals()) {
      let best = 0;
      for (const r of REACH_DOMAINS) { try { best = Math.max(best, computeCapability(state.graph, n.id, r)); } catch { /* fail-soft */ } }
      agentTier.set(n.id, proficiencyBandFor(best));
    }
  };

  const seenA = new Set<string>();
  const seenN = new Set<string>();
  const firings: Firing[] = [];
  const notif = new Map<string, { pause: boolean; auto: boolean; aftermath: boolean }>();
  let threaded = threadInfo();

  const harvest = () => {
    for (const a of state.unifiedActions ?? []) {
      if (seenA.has(a.actionId)) continue;
      seenA.add(a.actionId);
      const actor = state.graph.getNode(a.actorId);
      const t = TEMPLATES.get(a.templateId);
      let reachBand = 'n/a';
      const stamp = runtime.engagementLedger.stamps.get(a.actionId);
      if (stamp) reachBand = stamp.band;
      else if (t?.reach && actor) { try { reachBand = proficiencyBandFor(computeCapability(state.graph, a.actorId, t.reach)); } catch { /* */ } }
      const tgt = state.graph.getNode(a.targetId);
      firings.push({
        seed, tick: state.tick, actionId: a.actionId, actorId: a.actorId, templateId: a.templateId,
        source: String(a.source), seeded: !!a.spawnedFromSeedId,
        actorType: actor ? String(actor.properties.actorType ?? actor.type) : 'missing',
        threaded: threaded.has(a.actorId), courtPosition: threaded.get(a.actorId) ?? null,
        spotlight: String(actor?.properties.spotlightTier ?? 'none'),
        agentTier: agentTier.get(a.actorId) ?? 'unsampled', reachBand,
        effectiveTier: String(a.effectiveTier ?? 'unset'), intrinsicTier: String(t?.intrinsicTier ?? 'unknown'),
        routine: t?.routine === true, encounterType: String(t?.encounterType ?? ''), known: !!t,
        targetIsActor: tgt?.type === 'actor',
      });
    }
    for (const n of state.encounterNotifications ?? []) {
      if (seenN.has(n.id)) continue;
      seenN.add(n.id);
      const key = n.actionId ?? n.encounterId;
      const r = notif.get(key) ?? { pause: false, auto: false, aftermath: false };
      if (n.kind === 'aftermath') r.aftermath = true;
      else if (n.autoResolveTick === null) r.pause = true;
      else r.auto = true;
      notif.set(key, r);
    }
  };

  const t0 = Date.now();
  sampleTiers();
  harvest();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    if (i % TIER_SAMPLE_EVERY === 0) { sampleTiers(); threaded = threadInfo(); }
    // exposure
    for (const n of livingIndividuals()) {
      const th = threaded.has(n.id);
      addExp('all');
      addExp(th ? 'threaded' : 'unthreaded');
      addExp(`spot:${n.properties.spotlightTier ?? 'none'}`);
      addExp(`tier:${agentTier.get(n.id) ?? 'unsampled'}`);
    }
    harvest();
  }
  const ms = Date.now() - t0;
  return { seed, firstId, ms, firings, exposure: Object.fromEntries(exposure), notif: Object.fromEntries(notif), finalThreads: Object.fromEntries(threadInfo()) };
}

const results = [];
for (const s of seeds) {
  const r = runSeed(s);
  console.log(`seed ${s}: ${r.firings.length} actions, ${r.ms} ms, threads=${JSON.stringify(r.finalThreads)}, first=${r.firstId}`);
  results.push(r);
}
if (out) writeFileSync(out, JSON.stringify({ map, ticks, TICKS_PER_DAY, results }));
