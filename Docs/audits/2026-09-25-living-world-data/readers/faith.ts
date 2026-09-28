// Census reader (THR-1632 S1): faith and politics at game start — what the world
// scenario block put in a fresh world. Read-only; one world per seed, medium map,
// unattended (no player, no First) — `past.ts`'s pattern.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/faith.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/faith.mjs --external:fs --external:path
//   node .cache/faith.mjs [seeds=42,99] [ticks=0] [today|default]
//
// A 5th argument is a JSON partial scenario laid over the mode (ablation).
// `today` builds the world with WORLD_SCENARIO_TODAY — every knob at the value that
// reproduces the world before the block existed (the "before" column). With ticks > 0
// it also advances the world and reports steady-state ms/tick (after 5 warm-up ticks)
// and how often `encounter.pilgrimage_trial` was offered or run at a capital.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { selectWorldScenarioCensus } from '../../../../src/engine/worldScenarioCensus';
import { EncounterCacheManager } from '../../../../src/engine/encounterCache';
import { resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { WORLD_SCENARIO_TODAY } from '../../../../src/data/world-scenario';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 0);
const MODE = process.argv[4] === 'today' ? 'today' : 'default';
// Optional 5th arg: a JSON partial WorldScenario laid over the mode, for ablating one knob.
const OVERRIDE = process.argv[5] ? JSON.parse(process.argv[5]) as Record<string, unknown> : {};
const WARMUP = 5;
const PILGRIMAGE = 'encounter.pilgrimage_trial';

type P = Record<string, unknown>;
const out: Record<string, unknown> = {};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows,
    undefined, { ...(MODE === 'today' ? WORLD_SCENARIO_TODAY : {}), ...OVERRIDE },
  ) as { state: GameState };
  const g = state.graph;
  const census = selectWorldScenarioCensus(g);

  const factionsByType: Record<string, number> = {};
  for (const n of g.getNodesByType('actor')) {
    const p = n.properties as P;
    if (p.actorType !== 'faction') continue;
    const k = String(p.factionType ?? 'none');
    factionsByType[k] = (factionsByType[k] ?? 0) + 1;
  }
  const mortals = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true);
  const culturelessMortals = mortals.filter(n => !g.getOutgoingEdges(n.id, 'belongs_to')
    .some(e => g.getNode(e.target)?.properties.actorType === 'culture')).length;
  const capitals = g.getNodesByType('location').filter(n => n.properties.locationSubtype === 'capital').map(n => n.id);

  // Is the pilgrimage in the encounter pool at each capital at t0? (the route's live reader)
  let capitalsPoolingPilgrimage: number | string = 0;
  try {
    const cache = new EncounterCacheManager();
    cache.buildFullCache(g, 0);
    const pooled = new Set(cache.getAllEntries().filter(e => e.templateId === PILGRIMAGE).map(e => e.locationId));
    capitalsPoolingPilgrimage = capitals.filter(id => pooled.has(id)).length;
  } catch (err) {
    capitalsPoolingPilgrimage = `unreadable: ${String(err).slice(0, 80)}`;
  }

  const report: P = {
    mode: MODE,
    scenario: state.worldScenario,
    census,
    factionsByType,
    mortals: mortals.length,
    culturelessMortals,
    capitals: capitals.length,
    capitalsPoolingPilgrimage,
  };

  if (TICKS > 0) {
    let steadyMs = 0; let steadyTicks = 0;
    const pilgrimageActions = new Set<string>();
    const pilgrimageAtCapital = new Set<string>();
    const encounterCounts: Record<string, number> = {};
    const capitalSet = new Set(capitals);
    for (let i = 0; i < TICKS; i++) {
      const s = Date.now();
      state = runTick(state, [], rt);
      const ms = Date.now() - s;
      if (i >= WARMUP) { steadyMs += ms; steadyTicks++; }
      for (const a of state.unifiedActions ?? []) {
        if (!a.templateId) continue;
        const key = `${a.actionId}:${a.templateId}`;
        if (!encounterCounts[key]) encounterCounts[key] = 0;
        if (a.templateId === PILGRIMAGE) {
          pilgrimageActions.add(key);
          // Where it happens: the target if it is a place, else where the actor stands.
          const g2 = state.graph;
          const target = g2.getNode(a.targetId);
          const here = target?.type === 'location'
            ? target
            : g2.getNode(g2.getOutgoingEdges(a.actorId, 'located_at')[0]?.target ?? '');
          const loc = resolveToParentLocation(g2, here)?.id;
          if (loc && capitalSet.has(loc)) pilgrimageAtCapital.add(key);
        }
      }
    }
    const byTemplate: Record<string, number> = {};
    for (const key of Object.keys(encounterCounts)) {
      const t = key.slice(key.indexOf(':') + 1);
      byTemplate[t] = (byTemplate[t] ?? 0) + 1;
    }
    const top = Object.entries(byTemplate).sort((a, b) => b[1] - a[1]).slice(0, 5);
    report.ticks = TICKS;
    report.steadyMsPerTick = steadyTicks ? +(steadyMs / steadyTicks).toFixed(1) : null;
    report.pilgrimageActions = pilgrimageActions.size;
    report.pilgrimageAtCapital = pilgrimageAtCapital.size;
    report.topActionTemplates = top;
  }
  out[seed] = report;
}
console.log(JSON.stringify(out, null, 2));
