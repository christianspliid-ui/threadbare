/**
 * THR-1403 — the two-seed acceptance census for the cells model.
 *
 * Ported from the THR-1402 prototype (`tfws-census-1402/scripts/proto-census-1402.ts`).
 * Reports per calling x cell starts and completions, cells that never fired, callings
 * idle with an active ambition, tier-default share per kind, the top unreachable
 * reasons, and a multi-tick calibration table (starts/completions/finish-rate per
 * cell with progressRequired > 0). Records the current UNDERTAKING_MODEL so the
 * census is legible as templates-model noise until the flip to cells. Writes JSON
 * to the path in --out.
 *
 *   npm run census:cells -- --seeds 42,99 --ticks 150 --map medium --out <file>
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
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import { deriveCalling, activeAmbitionInput, leadingReachPair } from '../src/engine/calling';
import { getAgentAmbitions } from '../src/engine/graphQueries';
import { UNDERTAKING_CELL_TEMPLATES } from '../src/data/undertaking-cells';
import { deriveCells, VERBS_BY_CATEGORY } from '../src/data/division-rule-tables';
import { UNDERTAKING_MODEL } from '../src/data/strategic-action-constants';
import type { AmbitionCategory } from '../src/types/ambition';
import type { GraphNode } from '../src/types/graph';

/** Same join both readers make: an ambition category's verbs x a mortal's leading reaches. */
function deriveDivisionCells(node: GraphNode, category: AmbitionCategory): string[] {
  return deriveCells(VERBS_BY_CATEGORY[category] ?? [], leadingReachPair(node));
}

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
  return {
    seeds: get('--seeds', '42,99').split(',').map(Number),
    ticks: Number(get('--ticks', '150')),
    map: get('--map', 'medium') as MapSizePreset,
    out: get('--out', 'census-cells.json'),
  };
}

interface SeedResult {
  seed: number;
  ticks: number;
  model: string;
  startsByCallingCell: Record<string, Record<string, number>>;
  completionsByCallingCell: Record<string, Record<string, number>>;
  startsByCell: Record<string, number>;
  completionsByCell: Record<string, number>;
  failuresByCell: Record<string, number>;
  bandsByCell: Record<string, Record<string, number>>;
  progressRequiredByCell: Record<string, Record<string, number>>;
  probByCell: Record<string, { sum: number; n: number }>;
  controlsByCell: Record<string, number>;
  endedValues: Record<string, number>;
  unreachable: Record<string, number>;
  tierDefaultByKind: Record<string, { defaulted: number; total: number }>;
  callingPopulation: Record<string, { mortals: number; withAmbition: number; withProfile: number; started: number; derivedCells: number }>;
  liveCellIds: string[];
  meanAutonomous: number;
  ambitionStatuses: Record<string, number>;
  refusalsByCell: Record<string, Record<string, number>>;
  proposedByCell: Record<string, number>;
  calibration: Record<string, { starts: number; completions: number; finishRate: number }>;
  overallFinishRate: { completions: number; starts: number; rate: number };
}

function censusOneSeed(seed: number, ticks: number, map: MapSizePreset): SeedResult {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const startsByCallingCell: Record<string, Record<string, number>> = {};
  const completionsByCallingCell: Record<string, Record<string, number>> = {};
  const startsByCell: Record<string, number> = {};
  const completionsByCell: Record<string, number> = {};
  const endedValues: Record<string, number> = {};
  const unreachable: Record<string, number> = {};
  const tierDefaultByKind: Record<string, { defaulted: number; total: number }> = {};
  const startedActors = new Set<string>();
  const seenHistory = new Set<string>();
  const seenControls = new Set<string>();
  const controlsByCell: Record<string, number> = {};
  const failuresByCell: Record<string, number> = {};
  const bandsByCell: Record<string, Record<string, number>> = {};
  const progressRequiredByCell: Record<string, Record<string, number>> = {};
  const probByCell: Record<string, { sum: number; n: number }> = {};
  let autonomousSum = 0;
  const refusalsByCell: Record<string, Record<string, number>> = {};
  const proposedByCell: Record<string, number> = {};
  const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };
  const bump2 = (m: Record<string, Record<string, number>>, a: string, b: string) => { (m[a] ??= {}); m[a][b] = (m[a][b] ?? 0) + 1; };
  const callingOf = (actorId: string) => deriveCalling(state.graph, actorId).title;

  for (let i = 0; i < ticks; i++) {
    autonomousSum += state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor).length;
    clearTraces();
    state = runTick(state, [], runtime);
    for (const t of getTraces()) {
      const a = t as unknown as Record<string, unknown>;
      if (a.category === 'strategic_action_started') {
        if (a.startedBy === 'review_lever') continue;
        const id = a.templateId as string | undefined;
        const actorId = (a.actorId ?? a.agentId) as string | undefined;
        if (!id || !actorId) continue;
        startedActors.add(actorId);
        bump(startsByCell, id);
        bump2(startsByCallingCell, callingOf(actorId), id);
        continue;
      }
      if (a.category === 'strategic_candidate_board') {
        for (const r of ((a.refusals ?? []) as { templateId: string; reason: string }[])) bump2(refusalsByCell, r.templateId, String(r.reason).split(':')[0]);
        for (const id of ((a.topCandidateIds ?? []) as string[])) bump(proposedByCell, id);
        continue;
      }
      if (a.category === 'undertaking_checkpoint') {
        const ended = a.ended as string | undefined;
        if (ended) bump(endedValues, `ended:${ended}`);
        else if (a.deferred) bump(endedValues, `deferred:${a.deferred}`);
        else bump(endedValues, `band:${a.band}/${a.effect}`);
        const tid = String(a.templateId ?? '?');
        bump2(bandsByCell, tid, a.deferred ? `deferred:${a.deferred}` : String(a.effect ?? a.ended ?? '?'));
        const pr = Number(a.progressRequired ?? 0);
        if (pr > 0) { const s = (progressRequiredByCell[tid] ??= {}); s[String(pr)] = (s[String(pr)] ?? 0) + 1; }
        const prob = a.probability as number | undefined;
        if (typeof prob === 'number') { const p = (probByCell[tid] ??= { sum: 0, n: 0 }); p.sum += prob; p.n += 1; }
        continue;
      }
      if (a.category === 'undertaking_cell_unreachable') {
        bump(unreachable, `${a.verb}.${a.objectTypeId}:${a.reason ?? "?"}`);
        continue;
      }
      if (a.category === 'undertaking_tier_defaulted') {
        const k = String(a.objectTypeId ?? '?');
        (tierDefaultByKind[k] ??= { defaulted: 0, total: 0 }).defaulted += 1;
      }
    }
    // A claim is a sustained stance: it never completes, it is *held* until neglect
    // retires it (the retirement writes `outcome: 'failed'`). Count stances established.
    for (const c of state.strategicState?.controls ?? []) {
      if (seenControls.has(c.controlId)) continue;
      seenControls.add(c.controlId);
      bump(controlsByCell, c.templateId);
    }
    // Completions live in the lifecycle's history ledger, not in a trace (the
    // checkpoint's `ended` is only ever `actor_lost`); the ledger is a pruned rolling
    // window, so harvest the entries written this tick before they age out.
    for (const h of state.strategicState?.history ?? []) {
      if (h.tick !== state.tick) continue;
      const key = `${h.tick}:${h.actorId}:${h.templateId}:${h.outcome}`;
      if (seenHistory.has(key)) continue;
      seenHistory.add(key);
      bump(endedValues, `history:${h.outcome}`);
      if (h.outcome === 'completed') {
        bump(completionsByCell, h.templateId);
        bump2(completionsByCallingCell, callingOf(h.actorId), h.templateId);
      } else {
        const reason = (h as unknown as Record<string, unknown>).failureReason ?? '';
        bump(failuresByCell, `${h.templateId}:${h.outcome}${reason ? ':' + reason : ''}`);
      }
    }
  }

  // Population at the end: every autonomous mortal, by calling — did they ever start?
  const callingPopulation: SeedResult['callingPopulation'] = {};
  const ambitionStatuses: Record<string, number> = {};
  for (const n of state.graph.getNodesByType('actor').filter(isAutonomousDecisionActor)) {
    const title = callingOf(n.id);
    const row = (callingPopulation[title] ??= { mortals: 0, withAmbition: 0, withProfile: 0, started: 0, derivedCells: 0 });
    row.mortals += 1;
    for (const e of getAgentAmbitions(state.graph, n.id)) bump(ambitionStatuses, String(e.status));
    if (getAgentAmbitions(state.graph, n.id).length === 0) {
      bump(ambitionStatuses, 'none');
      const p = n.properties as Record<string, unknown>;
      bump(ambitionStatuses, `none:tier=${p.spotlightTier ?? 'unset'}:type=${p.actorType ?? '?'}:profile=${p.axiologicalProfile ? 'y' : 'n'}:caps=${p.domainCapabilities ? 'y' : 'n'}:idPrefix=${n.id.split(/[_.]/)[0]}:role=${p.role ?? p.occupation ?? '?'}`);
    }
    const amb = activeAmbitionInput(state.graph, n.id);
    if (amb) {
      row.withAmbition += 1;
      const derived = deriveDivisionCells(n, amb.category);
      row.derivedCells += derived.length;
      if (derived.length > 0) row.withProfile += 1;
    }
    if (startedActors.has(n.id)) row.started += 1;
  }

  // Calibration: cells with at least one multi-tick start (progressRequired > 0 for
  // some checkpoint on that cell), their starts/completions/finish-rate, and the
  // overall multi-tick finish rate across those cells.
  const calibration: SeedResult['calibration'] = {};
  let overallStarts = 0;
  let overallCompletions = 0;
  for (const cellId of Object.keys(progressRequiredByCell)) {
    const starts = startsByCell[cellId] ?? 0;
    if (starts < 1) continue;
    const completions = completionsByCell[cellId] ?? 0;
    calibration[cellId] = { starts, completions, finishRate: starts > 0 ? completions / starts : 0 };
    overallStarts += starts;
    overallCompletions += completions;
  }

  return {
    seed, ticks, model: UNDERTAKING_MODEL,
    startsByCallingCell, completionsByCallingCell, startsByCell, completionsByCell, failuresByCell,
    bandsByCell, progressRequiredByCell, probByCell, controlsByCell,
    endedValues, unreachable, tierDefaultByKind, callingPopulation, ambitionStatuses, refusalsByCell, proposedByCell,
    liveCellIds: UNDERTAKING_CELL_TEMPLATES.map(t => t.id).sort(),
    meanAutonomous: ticks > 0 ? autonomousSum / ticks : 0,
    calibration,
    overallFinishRate: { completions: overallCompletions, starts: overallStarts, rate: overallStarts > 0 ? overallCompletions / overallStarts : 0 },
  };
}

const args = parseArgs();
const results = args.seeds.map(s => {
  const t0 = Date.now();
  const r = censusOneSeed(s, args.ticks, args.map);
  console.log(`seed ${s} [model=${r.model}]: ${args.ticks} ticks in ${((Date.now() - t0) / 1000).toFixed(0)}s — starts ${Object.values(r.startsByCell).reduce((x, y) => x + y, 0)}, completions ${Object.values(r.completionsByCell).reduce((x, y) => x + y, 0)}, cells started ${Object.keys(r.startsByCell).length}/${r.liveCellIds.length}, ended values ${JSON.stringify(r.endedValues)}`);
  console.log(`seed ${s} unreachable: ${JSON.stringify(r.unreachable)}`);
  console.log(`seed ${s} calibration (multi-tick cells, starts/completions/finishRate):`);
  for (const [cellId, c] of Object.entries(r.calibration).sort()) {
    console.log(`  ${cellId}: ${c.starts}/${c.completions} (${(c.finishRate * 100).toFixed(1)}%)`);
  }
  console.log(`seed ${s} overall multi-tick finish rate: ${r.overallFinishRate.completions}/${r.overallFinishRate.starts} (${(r.overallFinishRate.rate * 100).toFixed(1)}%)`);
  return r;
});
writeFileSync(args.out, JSON.stringify(results, null, 2));
console.log(`wrote ${args.out}`);
