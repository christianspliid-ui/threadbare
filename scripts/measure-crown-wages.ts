/**
 * THR-1974 — the wage rules' Done-when predicates, measured on real seeded worlds.
 *
 * Plan: `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md` § Done when / § Kill
 * criteria. Runs each seed for `--ticks` (default 600, 50 days; seed 42 by default), medium map, purse + crown + war aims
 * live, and reports per seed:
 *   - price never free: free-company days with `oathValueOf` ≤ 0 (want 0);
 *   - companies field armies (a report, not a gate): the share of sworn free-company days
 *     on which the company fields an army (< 50% → file the plan's Deferral);
 *   - wage bill: wages paid as a share of each paying liege's full income, the reserve
 *     invariant on every pay day (want 0 breaches), and kill criterion 1 (a liege Destitute
 *     on a pay day it paid wages, that the last 10 days' wages would have kept above it);
 *   - courtable: per free company, the days some court-eligible realm reaches it (≥ 45);
 *   - no march on the paymaster: armies fighting for a liege whose objective or siege is a
 *     town of that liege or of a fellow vassal at peace with it (want 0);
 *   - kill criterion 3: the largest daily share of realm-vassal armies fighting for a liege.
 *
 * Time: ~6–9 min per seed at 600 ticks on medium (≈0.8 s per tick, more as the world
 *       grows); one seed per command keeps a call under the 600 s command cap. The 90-day
 *       read (--ticks 1080) is ~11–22 min per seed and does not fit one command.
 * Usage: npm run measure:crown-wages [-- --seeds 42 --ticks 600 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime, ensureRealmProjection } from '../src/engine/simulationRuntime';
import { buildCrownWorld, oathValueOf } from '../src/engine/crown/eligibility';
import { isRealmFaction } from '../src/engine/crown/crownView';
import { readPurseDay, readMeansBand } from '../src/engine/factionPurse';
import { totalIncome } from '../src/engine/factionPurse/income';
import { armiesOf, upkeepPerDayOf } from '../src/engine/factionPurse/upkeep';
import { meansBand } from '../src/engine/factionPurse/means';
import { commanderFactionOf, isEnemyFaction } from '../src/engine/warAims/enemy';
import { ownFactionOf } from '../src/engine/crown/wages';
import { armyRefusal } from '../src/engine/armySpawning';
import { TICKS_PER_DAY } from '../src/data/attention-constants';
import { LIEGE_WAGE_RESERVE_DAYS } from '../src/data/crown-constants';
import type { ArmyState } from '../src/types/army';
import type { BattleState } from '../src/types/battle';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 600);
console.error('[THR-2041] ~6–9 min per seed at 600 ticks on medium; run one seed per command (600 s command cap).');
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
const KILL_WINDOW_DAYS = 10;
const PROGRESS = process.argv.includes('--progress');
const DEBUG_COMPANIES = process.argv.includes('--debug-companies');
const VASSAL_COMMAND_KILL_SHARE = 0.25;

interface SeedReport {
  seed: number;
  companies: { id: string; name: string; reachedDays: number; swornDays: number; armedSwornDays: number; zeroPriceDays: number }[];
  wageShare: { liege: string; wages: number; income: number }[];
  wagePayDays: number;
  reserveBreaches: number;
  kill1: string[];
  paymasterMarches: number;
  vassalCommandMaxShare: number;
  vassalCommandDaysOver: number;
}

function runSeed(seed: number): SeedReport {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  const started = Date.now();
  let { state } = initializeGameState(archetype, 'WageMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const report: SeedReport = {
    seed, companies: [], wageShare: [], wagePayDays: 0, reserveBreaches: 0, kill1: [],
    paymasterMarches: 0, vassalCommandMaxShare: 0, vassalCommandDaysOver: 0,
  };
  const companies = new Map<string, SeedReport['companies'][number]>();
  const wageByLiege = new Map<string, { wages: number; income: number }>();
  /** liege → wages paid per day (last KILL_WINDOW_DAYS days). */
  const recentWages = new Map<string, number[]>();

  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    if (PROGRESS && state.tick % 120 === 0) console.error(`seed ${seed} tick ${state.tick} ${((Date.now() - started) / 1000).toFixed(0)}s`);
    const g = state.graph;

    // No march on the paymaster, every tick: an army fighting for its liege never aims at
    // or besieges a town of the liege or of a fellow vassal the liege is not at war with.
    for (const n of g.getNodesByType('actor')) {
      const as = n.properties.armyState as ArmyState | undefined;
      if (!as) continue;
      const own = ownFactionOf(g, n.id);
      const commander = commanderFactionOf(g, n.id, state.tick);
      if (!own || !commander || own === commander) continue;
      const friendly = (holder: string | undefined) => !!holder && (holder === commander
        || (g.getOutgoingEdges(holder, 'sworn_to')[0]?.target === commander && !isEnemyFaction(g, commander, holder)));
      const target = as.objective?.type === 'conquer' ? as.objective.targetNodeId : undefined;
      if (target && friendly(g.getIncomingEdges(target, 'controls')[0]?.source)) { report.paymasterMarches++; if (DEBUG_COMPANIES) console.error(`march tick ${state.tick} ${n.name} own ${own} commander ${commander} liegePaid ${as.liegePaidTick ?? '-'} raised ${as.raisedTick} obj ${as.objective?.type}:${as.objective?.targetNodeId ?? '-'}`); }
      for (const e of g.getOutgoingEdges(n.id, 'participates_in')) {
        const bs = g.getNode(e.target)?.properties.battleState as BattleState | undefined;
        if (bs?.battleType === 'siege' && bs.attackerArmyId === n.id && bs.settlementId
          && friendly(g.getIncomingEdges(bs.settlementId, 'controls')[0]?.source)) { report.paymasterMarches++; if (DEBUG_COMPANIES) console.error(`march tick ${state.tick} ${n.name} own ${own} commander ${commander} liegePaid ${as.liegePaidTick ?? '-'} raised ${as.raisedTick} obj ${as.objective?.type}:${as.objective?.targetNodeId ?? '-'}`); }
      }
    }

    if (state.tick % TICKS_PER_DAY !== 0) continue;
    const factions = g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');
    const world = buildCrownWorld(g, state.tick, ensureRealmProjection(runtime, g, state.tiles, state.tick));

    // Free companies: price, reach, sworn days, armed sworn days.
    for (const f of factions) {
      const def = f.properties.factionDefId ?? f.properties.factionDefinitionId;
      if (def !== 'mercenary_company') continue;
      const row = companies.get(f.id) ?? { id: f.id, name: f.name ?? f.id, reachedDays: 0, swornDays: 0, armedSwornDays: 0, zeroPriceDays: 0 };
      companies.set(f.id, row);
      const pd = readPurseDay(f);
      if (oathValueOf(g, f.id, pd ? totalIncome(pd.income) : 0) <= 0) row.zeroPriceDays++;
      if (world.courtRealms.some(r => (world.reach.get(r) ?? []).includes(f.id))) row.reachedDays++;
      if (DEBUG_COMPANIES) {
        const liege = g.getOutgoingEdges(f.id, 'sworn_to')[0]?.target;
        const ln = liege ? g.getNode(liege) : undefined;
        console.error(`day ${state.tick / TICKS_PER_DAY} ${f.name}: wealth ${Number(f.properties.wealth ?? 0).toFixed(1)}`
          + ` armies ${armiesOf(g, f.id).map(a => a.id).join(',') || '-'} unpaid ${pd?.armiesUnpaid.join(',') || '-'} paidByLiege ${pd?.armiesPaidByLiege?.join(',') || '-'}`
          + ` refusal ${armyRefusal(state, f.id) ?? '-'}`
          + (ln ? ` · liege ${ln.name} wealth ${Number(ln.properties.wealth ?? 0).toFixed(1)} own upkeep ${upkeepPerDayOf(g, ln.id)}` : ' · free'));
      }
      if (g.getOutgoingEdges(f.id, 'sworn_to').length > 0) {
        row.swornDays++;
        if (armiesOf(g, f.id).length > 0) row.armedSwornDays++;
      }
    }

    // Wages paid today, by liege; the reserve invariant; kill criterion 1.
    // Read off the purse days the crown phase wrote today (no trace buffer: it is slow at this length).
    const paidToday = new Map<string, number>();
    for (const f of factions) {
      const pd = readPurseDay(f);
      if (pd && pd.tick === state.tick && (pd.wagesToVassals ?? 0) > 0) paidToday.set(f.id, pd.wagesToVassals!);
    }
    if (paidToday.size > 0) report.wagePayDays++;
    for (const f of factions) {
      const list = recentWages.get(f.id) ?? [];
      list.push(paidToday.get(f.id) ?? 0);
      if (list.length > KILL_WINDOW_DAYS) list.shift();
      recentWages.set(f.id, list);
      const paid = paidToday.get(f.id) ?? 0;
      if (paid <= 0) continue;
      const wealth = typeof f.properties.wealth === 'number' ? f.properties.wealth : 0;
      const upkeep = upkeepPerDayOf(g, f.id);
      // The tax lands after the wages, so wealth now ≥ wealth just after the wages.
      if (wealth + 1e-6 < LIEGE_WAGE_RESERVE_DAYS * upkeep) report.reserveBreaches++;
      const pd = readPurseDay(f);
      const row = wageByLiege.get(f.id) ?? { wages: 0, income: 0 };
      row.wages += paid;
      row.income += (pd ? totalIncome(pd.income) : 0) + (pd?.fealtyIn ?? 0);
      wageByLiege.set(f.id, row);
      if (readMeansBand(f) === 'Destitute') {
        const back = list.reduce((s, x) => s + x, 0);
        if (meansBand(wealth + back, upkeep, false) !== 'Destitute') report.kill1.push(`${f.name ?? f.id} day ${state.tick / TICKS_PER_DAY}`);
      }
    }

    // Kill criterion 3: realm-vassal armies fighting for their liege, as a share.
    let vassalArmies = 0;
    let commanded = 0;
    for (const n of g.getNodesByType('actor')) {
      if (!n.properties.armyState) continue;
      const own = ownFactionOf(g, n.id);
      if (!own || !isRealmFaction(g.getNode(own)) || g.getOutgoingEdges(own, 'sworn_to').length === 0) continue;
      vassalArmies++;
      if (commanderFactionOf(g, n.id, state.tick) !== own) commanded++;
    }
    if (vassalArmies > 0) {
      const share = commanded / vassalArmies;
      report.vassalCommandMaxShare = Math.max(report.vassalCommandMaxShare, share);
      if (share > VASSAL_COMMAND_KILL_SHARE) report.vassalCommandDaysOver++;
    }
  }

  report.companies = [...companies.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  report.wageShare = [...wageByLiege].map(([id, v]) => ({ liege: state.graph.getNode(id)?.name ?? id, ...v }));
  return report;
}

for (const seed of SEEDS) {
  const t0 = Date.now();
  const r = runSeed(seed);
  console.log(`\n== seed ${seed} (${((Date.now() - t0) / 1000).toFixed(0)}s) ==`);
  for (const c of r.companies) {
    const armed = c.swornDays > 0 ? `${((c.armedSwornDays / c.swornDays) * 100).toFixed(0)}%` : 'n/a';
    console.log(`company ${c.name}: reached ${c.reachedDays} days · sworn ${c.swornDays} days, armed on ${c.armedSwornDays} (${armed}) · zero-price days ${c.zeroPriceDays}`);
  }
  const sworn = r.companies.reduce((s, c) => s + c.swornDays, 0);
  const armed = r.companies.reduce((s, c) => s + c.armedSwornDays, 0);
  console.log(`companies field armies: ${armed}/${sworn} sworn company-days (${sworn > 0 ? ((armed / sworn) * 100).toFixed(0) : 'n/a'}%)`);
  console.log(`wage pay days: ${r.wagePayDays} · wage share of income: ${r.wageShare.map(w => `${w.liege} ${w.income > 0 ? ((w.wages / w.income) * 100).toFixed(0) : '∞'}%`).join(', ') || 'no wages paid'}`);
  console.log(`reserve breaches: ${r.reserveBreaches} · kill 1 (bankrupted by wages): ${r.kill1.length ? r.kill1.join(', ') : 'never'}`);
  console.log(`no march on the paymaster: ${r.paymasterMarches} violations`);
  console.log(`kill 3: realm-vassal armies under their liege — max daily share ${(r.vassalCommandMaxShare * 100).toFixed(0)}%, days over 25%: ${r.vassalCommandDaysOver}`);
}
