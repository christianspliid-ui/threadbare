/**
 * THR-1560 — the hunts census (plan doc `Docs/plans/2026-09-23-hunts.md` § Slices H2).
 *
 * Runs a seeded world headlessly for N ticks — past the CLI's twilight stop, which is
 * why this is a script and not `tick 300` — and reports what H2's Done-when asks:
 *
 * - the hunt ledger (`describeHunts`): hunts founded, tracking count, confronts
 *   planted / kept / missed with the miss reasons, the travel ticks at plant time, and
 *   the reason-holders whose beast fell outside the monster scan (expected 0);
 * - the candidate board's refusals for the two hunt cells, by reason — the first
 *   thing the kill criterion says to read when no hunt is founded;
 * - how many mortals hold each hunt reason at the end;
 * - **the furniture re-measure** (plan doc 3's M4): natural fights against a monster
 *   (`fight.trigger` spawned, plus `fight.lair.confront` actions started);
 * - **the avenger census**: vengeance-family projects founded, and the share founded
 *   by `ambition_avenge_fallen` holders.
 *
 *   npm run census:hunts -- --seeds 42,99 --ticks 300 --map medium [--out <file>]
 */
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { createHuntLedger, recordHuntTick, describeHunts, type HuntReport } from '../src/engine/monsters/huntReport';
import { huntReason, isLiveMonster } from '../src/engine/monsters/hunts';
import { isMonster } from '../src/engine/monsters/isMonster';
import { isAgentGone } from '../src/engine/groups/groupQueries';
import { findAmbitionTemplateById } from '../src/data/ambition-templates';
import { FIGHT_LAIR_CONFRONT_ID } from '../src/data/encounters/fight-lair-confront';

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return {
    seeds: get('--seeds', '42,99').split(',').map(Number),
    ticks: Number(get('--ticks', '300')),
    map: get('--map', 'medium') as MapSizePreset,
    out: get('--out', ''),
  };
}

const HUNT_CELLS = ['cell.destroy.monster', 'cell.observe.monster'];

interface SeedCensus {
  seed: number;
  map: string;
  ticks: number;
  report: Omit<HuntReport, 'outOfScan'> & { outOfScan: number };
  refusals: Record<string, Record<string, number>>;
  gateExempt: Record<string, number>;
  proposed: Record<string, number>;
  started: Record<string, number>;
  reasonHolders: Record<string, number>;
  naturalMonsterFights: { lairTriggerSpawned: number; confrontActionsStarted: number; triggerSkips: Record<string, number> };
  avengers: { vengeanceProjects: number; byAvengeFallen: number; share: number; avengeFallenHolders: number; byAmbition: Record<string, number> };
}

function censusOneSeed(seed: number, ticks: number, map: MapSizePreset): SeedCensus {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const ledger = createHuntLedger();
  const refusals: Record<string, Record<string, number>> = {};
  const gateExempt: Record<string, number> = {};
  const proposed: Record<string, number> = {};
  const started: Record<string, number> = {};
  const triggerSkips: Record<string, number> = {};
  let lairTriggerSpawned = 0;
  const confrontActions = new Set<string>();
  const vengeanceProjects = new Set<string>();
  const avengeProjects = new Set<string>();
  const avengeHolders = new Set<string>();
  const vengeanceByAmbition: Record<string, number> = {};
  const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };

  for (let i = 0; i < ticks; i++) {
    clearTraces();
    state = runTick(state, [], runtime);
    const traces = getTraces();
    recordHuntTick(ledger, state, traces);
    for (const t of traces) {
      const a = t as unknown as Record<string, unknown>;
      if (a.category === 'strategic_candidate_board') {
        for (const r of ((a.refusals ?? []) as { templateId: string; reason: string }[])) {
          if (!HUNT_CELLS.includes(r.templateId)) continue;
          const reason = String(r.reason);
          if (reason.startsWith('gate_exempt:')) { bump(gateExempt, reason); continue; }
          (refusals[r.templateId] ??= {});
          const key = reason.split(':').slice(0, reason.startsWith('ineligible:') ? 2 : 1).join(':');
          refusals[r.templateId][key] = (refusals[r.templateId][key] ?? 0) + 1;
        }
        for (const id of ((a.topCandidateIds ?? []) as string[])) if (HUNT_CELLS.includes(id)) bump(proposed, id);
      } else if (a.category === 'strategic_action_started') {
        const id = String(a.templateId ?? '');
        if (HUNT_CELLS.includes(id)) bump(started, id);
      } else if (a.category === 'fight.trigger') {
        if (a.skipped) bump(triggerSkips, String(a.skipped));
        else lairTriggerSpawned += 1;
      }
    }
    for (const act of state.unifiedActions ?? []) {
      if (act.templateId === FIGHT_LAIR_CONFRONT_ID) confrontActions.add(act.actionId);
    }
    for (const p of state.strategicState?.projects ?? []) {
      const ambition = (p as { ambitionId?: string }).ambitionId ?? '';
      // The vengeance family: every project founded under a vengeance-category ambition,
      // read across all three ambition pools.
      if (findAmbitionTemplateById(ambition)?.category !== 'vengeance') continue;
      if (!vengeanceProjects.has(p.projectId)) vengeanceByAmbition[ambition] = (vengeanceByAmbition[ambition] ?? 0) + 1;
      vengeanceProjects.add(p.projectId);
      if (ambition === 'ambition_avenge_fallen') { avengeProjects.add(p.projectId); avengeHolders.add(p.actorId); }
    }
  }

  const report = describeHunts(state, ledger);
  const reasonHolders: Record<string, number> = {};
  const actors = state.graph.getNodesByType('actor');
  const monsters = actors.filter(n => isLiveMonster(n));
  for (const n of actors) {
    if (n.properties.actorType !== 'individual' || isMonster(n) || isAgentGone(n)) continue;
    for (const m of monsters) {
      const r = huntReason(state.graph, n.id, m.id);
      if (r) bump(reasonHolders, r);
    }
  }
  return {
    seed, map, ticks,
    report: { ...report, outOfScan: report.outOfScan.length },
    refusals, gateExempt, proposed, started, reasonHolders,
    naturalMonsterFights: { lairTriggerSpawned, confrontActionsStarted: confrontActions.size, triggerSkips },
    avengers: {
      vengeanceProjects: vengeanceProjects.size,
      byAvengeFallen: avengeProjects.size,
      share: vengeanceProjects.size ? avengeProjects.size / vengeanceProjects.size : 0,
      avengeFallenHolders: avengeHolders.size,
      byAmbition: vengeanceByAmbition,
    },
  };
}

const args = parseArgs();
const results = args.seeds.map(seed => censusOneSeed(seed, args.ticks, args.map));
for (const r of results) {
  console.log(`\n== seed ${r.seed} · ${r.map} · ${r.ticks} ticks ==`);
  console.log(JSON.stringify(r, null, 2));
}
if (args.out) writeFileSync(args.out, JSON.stringify(results, null, 2));
