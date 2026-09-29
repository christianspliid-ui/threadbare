// Census reader (THR-1631 S1, THR-1657 S3): the past worldgen writes, and the ambitions
// it mints (with every skipped source's reason). Read-only; one world per seed, medium map, unattended (no player, no First) — `dying.ts`'s pattern.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/past.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/past.mjs --external:fs --external:path
//   node .cache/past.mjs [seeds=42,99] [ticks=0] [off]
//
// `off` runs with the pass disabled (the "before" column). With ticks > 0 it also
// advances the world and reports steady-state ms/tick plus the seeded-dead invariant
// (no seeded dead is a decider, an encounter participant or resurrected).
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { locationClassOf } from '../../../../src/data/world-objects';
import { readWorldPast, isSeededDead } from '../../../../src/engine/worldPast';
import { WORLD_PAST_DEFAULTS } from '../../../../src/data/world-past-constants';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../../../src/engine/traceBuffer';
import type { GameState } from '../../../../src/types/gameState';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 0);
const OFF = process.argv[4] === 'off';
WORLD_PAST_DEFAULTS.enabled = !OFF;
// Optional 5th arg: a JSON override of WORLD_PAST_DEFAULTS, for ablating one component.
if (process.argv[5]) Object.assign(WORLD_PAST_DEFAULTS, JSON.parse(process.argv[5]));

type P = Record<string, unknown>;

/** Living deciders at t0 — S3 must leave this unchanged against the 'off' run. */
function g0Deciders(s: GameState): number {
  return s.graph.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n) && n.properties.deceased !== true).length;
}
const out: Record<string, unknown> = {};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  enableTracing(); clearTraces();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  const t0 = Date.now();
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
  const worldgenMs = Date.now() - t0;
  // S3 (THR-1657): the minted and skipped past ambitions, read off the one worldgen trace.
  const pastTrace = getTraces().find(t => t.category === 'world_past_seeded') as unknown as { ambitions?: { minted: P[]; skipped: P[] } } | undefined;
  const holdersAtT0 = g0Deciders(state);
  disableTracing();
  const g = state.graph;
  const view = readWorldPast(g);
  const events = g.getNodesByType('event').filter(n => n.properties.pastOrigin === 'worldgen');
  const dead = g.getNodesByType('actor').filter(n => isSeededDead(n));
  const settlements = getLocationNodes(g).filter(n => locationClassOf(n.properties.locationSubtype as string) === 'settlement');
  const oldLand = new Set<string>();
  const mortals = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true);
  const withDescent = mortals.filter(n => Array.isArray(n.properties.backstoryStrata)
    && (n.properties.backstoryStrata as P[]).some(s => s.relation === 'descent'));
  for (const n of withDescent) oldLand.add(n.id);
  const report: Record<string, unknown> = {
    pass: OFF ? 'off' : 'on',
    worldgenMs,
    pastEvents: events.length,
    elderWar: view.elderAge.war ? { empires: view.elderAge.war.empireIds, sites: view.elderAge.war.siteIds.length, yearsAgo: view.elderAge.war.yearsAgo, name: view.elderAge.war.pastName } : null,
    livingWars: view.livingMemory.map(w => ({ realms: w.realmIds, winner: w.winnerId, burnedTown: w.burnedTownId ?? null, fallen: w.fallenIds.length, yearsAgo: w.yearsAgo })),
    settlements: settlements.length,
    settlementsFounded: settlements.filter(n => typeof n.properties.foundedYearsAgo === 'number').length,
    founders: view.settling.filter(s => s.founderId).length,
    dead: { total: dead.length, byRole: dead.reduce<Record<string, number>>((m, n) => { const r = String(n.properties.pastRole); m[r] = (m[r] ?? 0) + 1; return m; }, {}) },
    descent: { mortals: withDescent.length, livingMortals: mortals.length },
    wondersWithFinder: view.wonders.filter(w => w.finderId).length,
    deciderHeadcountT0: holdersAtT0,
    ambitions: pastTrace?.ambitions ?? null,
  };

  if (TICKS > 0) {
    const leaks: string[] = [];
    let steadyMs = 0; let steadyTicks = 0;
    for (let i = 0; i < TICKS; i++) {
      const s = Date.now();
      state = runTick(state, [], rt);
      const ms = Date.now() - s;
      if (i >= 20) { steadyMs += ms; steadyTicks++; }
      for (const d of state.graph.getNodesByType('actor').filter(n => n.properties.pastOrigin === 'worldgen')) {
        if (d.properties.deceased !== true) leaks.push(`t${state.tick}:${d.id}:alive`);
        else if (isAutonomousDecisionActor(d)) leaks.push(`t${state.tick}:${d.id}:decider`);
      }
      for (const a of state.unifiedActions ?? []) {
        const ids = [a.actorId, ...((a as unknown as { participantIds?: string[] }).participantIds ?? [])];
        for (const id of ids) if (isSeededDead(state.graph.getNode(id))) leaks.push(`t${state.tick}:${id}:action:${a.templateId}`);
      }
    }
    report.ticks = TICKS;
    report.steadyMsPerTick = steadyTicks ? +(steadyMs / steadyTicks).toFixed(1) : null;
    report.deadLeaks = [...new Set(leaks)].slice(0, 20);
    report.deadLeakCount = leaks.length;
    report.endLivingIndividuals = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual' && n.properties.deceased !== true).length;
    report.endEvents = state.graph.getNodesByType('event').length;
    report.endEventsByType = state.graph.getNodesByType('event').reduce<Record<string, number>>((m, n) => { const k = String(n.properties.eventType ?? n.properties.kind ?? '?'); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  }
  out[seed] = report;
}
console.log(JSON.stringify(out, null, 2));
