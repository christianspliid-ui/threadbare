/**
 * THR-1933 — the war-aims Done-when predicates, measured on real seeded worlds.
 *
 * Runs each seed for 600 ticks with the purse live and reports, per seed:
 *   - enemies only: picks whose town holder is not an enemy, and sieges laid on a
 *     non-enemy's town or a town the besieger keeps a hall in (both must be 0);
 *   - not just the nearest: of picks scoring ≥ 2 candidates, the share that chose a town
 *     other than the nearest (≥ 50%);
 *   - in reach: picks whose town resolves no supply line for the attacker (must be 0);
 *   - holds speak: armies with no objective (outside a battle) and no hold reason (must be 0);
 *   - ambitions aim: fielded territorial/revenge armies whose ambition target differs
 *     from their conquer target (must be 0);
 *   - defence turns and re-aims by why, armies seen, and the cost of one re-aim pass.
 *
 * Usage: npm run measure:war-aims [-- --seeds 42,99,7 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { isEnemyFaction, factionKeepsHallAt, wasTakenFrom, campaignTargetOf } from '../src/engine/warAims/enemy';
import { buildWarAimContext, hexOfActor } from '../src/engine/warAims/context';
import { pickWarAim } from '../src/engine/warAims/score';
import { resolveSupplyLine } from '../src/engine/armySupply';
import { buildRealmProjection } from '../src/engine/realmProjection';
import type { ArmyState } from '../src/types/army';
import type { TraceEntry } from '../src/types/trace';
import { TICKS_PER_DAY } from '../src/data/attention-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

interface SeedReport {
  seed: number;
  armiesSeen: number;
  picks: number;
  picksNonEnemy: number;
  picksOutOfReach: number;
  multiCandidatePicks: number;
  notNearest: number;
  holds: number;
  defends: number;
  reaims: Record<string, number>;
  siegesSeen: number;
  siegesNonEnemy: number;
  siegesOwnHall: number;
  silentHolds: number;
  ambitionMismatch: number;
  reaimPassMs: number[];
}

function runSeed(seed: number): SeedReport {
  resetEventCounter();
  enableTracing();
  clearTraces();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'WarAimsMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const r: SeedReport = {
    seed, armiesSeen: 0, picks: 0, picksNonEnemy: 0, picksOutOfReach: 0, multiCandidatePicks: 0,
    notNearest: 0, holds: 0, defends: 0, reaims: {}, siegesSeen: 0, siegesNonEnemy: 0, siegesOwnHall: 0,
    silentHolds: 0, ambitionMismatch: 0, reaimPassMs: [],
  };
  const armies = new Set<string>();
  const sieges = new Set<string>();

  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    const g = state.graph;

    for (const t of getTraces() as ReadonlyArray<TraceEntry & Record<string, unknown>>) {
      if (t.category === 'war.aim.picked') {
        r.picks++;
        const holder = g.getIncomingEdges(String(t.townId), 'controls')[0]?.source;
        if (!isEnemyFaction(g, String(t.factionId), holder)) {
          // holder by first controls edge is a proxy; recheck any controller
          const any = g.getIncomingEdges(String(t.townId), 'controls').some(e => isEnemyFaction(g, String(t.factionId), e.source));
          if (!any) r.picksNonEnemy++;
        }
        if (resolveSupplyLine(state, String(t.townId), String(t.factionId)).hostId === null) r.picksOutOfReach++;
        if (Number(t.candidates) >= 2) {
          r.multiCandidatePicks++;
          if (t.townId !== t.nearestEnemyTownId) r.notNearest++;
        }
      } else if (t.category === 'war.aim.hold') r.holds++;
      else if (t.category === 'war.aim.defend') r.defends++;
      else if (t.category === 'war.aim.reaim') r.reaims[String(t.why)] = (r.reaims[String(t.why)] ?? 0) + 1;
    }
    clearTraces();

    for (const n of g.getNodesByType('actor')) {
      const bs = n.properties.battleState as { battleType?: string; settlementId?: string } | undefined;
      if (bs?.battleType !== 'siege' || !bs.settlementId || sieges.has(n.id)) continue;
      sieges.add(n.id);
      r.siegesSeen++;
      const holder = g.getIncomingEdges(bs.settlementId, 'controls')[0]?.source;
      for (const e of g.getIncomingEdges(n.id, 'participates_in')) {
        const f = g.getOutgoingEdges(e.source, 'member_of')[0]?.target;
        if (!f || f === holder) continue;
        const declared = campaignTargetOf(g, e.source) === bs.settlementId;
        if (!isEnemyFaction(g, f, holder) && !declared) r.siegesNonEnemy++;
        if (factionKeepsHallAt(g, f, bs.settlementId) && !wasTakenFrom(g, f, bs.settlementId)) r.siegesOwnHall++;
      }
    }

    if (state.tick % TICKS_PER_DAY !== 0) continue;
    const armyNodes = g.getNodesByType('actor').filter(n => n.properties.armyState != null);
    for (const a of armyNodes) {
      armies.add(a.id);
      const as = a.properties.armyState as ArmyState;
      const inBattle = g.getOutgoingEdges(a.id, 'participates_in').length > 0;
      if (!as.objective && !inBattle && !as.holdReason) r.silentHolds++;
      if (as.objective?.type === 'conquer' && as.objective.source !== 'agenda') {
        for (const e of g.getOutgoingEdges(a.id, 'pursues')) {
          const amb = g.getNode(e.target);
          const type = amb?.properties.ambitionType;
          if (amb && !amb.properties.compositionId && (type === 'territorial_expansion' || type === 'revenge')
            && amb.properties.targetNodeId !== as.objective.targetNodeId) r.ambitionMismatch++;
        }
      }
    }
    // Cost of one re-aim pass, read-only: context + one pick per army.
    if (armyNodes.length > 0) {
      const t0 = performance.now();
      const ctx = buildWarAimContext(g, buildRealmProjection(g, state.tiles ?? []).hexRealmId);
      for (const a of armyNodes) {
        const f = g.getOutgoingEdges(a.id, 'member_of')[0]?.target;
        const hex = hexOfActor(g, a.id);
        if (f && hex) pickWarAim(state, ctx, f, hex);
      }
      r.reaimPassMs.push(performance.now() - t0);
    }
  }
  r.armiesSeen = armies.size;
  return r;
}

const rows = SEEDS.map(runSeed);
for (const r of rows) {
  const ms = [...r.reaimPassMs].sort((a, b) => a - b);
  const median = ms.length ? ms[Math.floor(ms.length / 2)] : 0;
  const max = ms.length ? ms[ms.length - 1] : 0;
  console.log(`seed ${r.seed}: armies ${r.armiesSeen} · picks ${r.picks} (non-enemy ${r.picksNonEnemy}, out of reach ${r.picksOutOfReach})`
    + ` · not nearest ${r.notNearest}/${r.multiCandidatePicks} · holds ${r.holds} · defends ${r.defends}`
    + ` · sieges ${r.siegesSeen} (non-enemy ${r.siegesNonEnemy}, own hall ${r.siegesOwnHall})`
    + ` · silent holds ${r.silentHolds} · ambition mismatch ${r.ambitionMismatch}`
    + ` · re-aims ${JSON.stringify(r.reaims)} · pass ms median ${median.toFixed(2)} max ${max.toFixed(2)}`);
}
