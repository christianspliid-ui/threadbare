/**
 * THR-2044 prototype (never merged) — does planting Debt Collection on The Loan's lender
 * make collections find a debt?
 *
 * Arm `--delay 0` is `main` exactly. `--delay N` adds one authored `encounter_seed` row to
 * every band of The Loan's outcome table at runtime: Debt Collection, targeting the acting
 * lender, ripening N ticks after the loan. Tallies the debt census's numbers plus the seeds'
 * fate (fired / place never reached / other) and the plant→fire latency.
 *
 * Usage: node --experimental-strip-types scripts/_scratch-2044.ts --delay 24 --seeds 42,99 --ticks 600
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';
import { getUnifiedTemplateById } from '../src/data/unified-action-templates';

const LOAN = 'encounter.the_loan';
const COLLECTION = 'encounter.debt_collection';
const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 600);
const delay = Number(arg('--delay') ?? 0);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

if (delay > 0) {
  const loan = getUnifiedTemplateById(LOAN) as unknown as { outcomeEffects: Record<string, unknown[]> };
  const row = { kind: 'encounter_seed', templateId: COLLECTION, delayTicks: delay, seedLabel: 'a debt falls due' };
  for (const band of Object.keys(loan.outcomeEffects)) loan.outcomeEffects[band] = [...loan.outcomeEffects[band], row];
}

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); enableTracing(); clearTraces();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Scratch2044', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const t = { paid: 0, off: 0, settles: 0, noDebt: 0, loanDebts: 0, planted: 0, fired: 0, neverReached: 0, otherDiscard: 0, latency: [] as number[], loanRes: 0, collRes: 0, collFromSeed: 0, seededNoDebt: 0 };
  const planted = new Map<string, number>();
  const seededActors = new Map<string, number>(); // agentId → count of loan-seed fires pending a settle
  const counted = new Set<string>();
  const started = Date.now();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    for (const raw of getTraces()) {
      const r = raw as unknown as Record<string, unknown>;
      const c = r.category;
      if (c === 'encounter_seed_planted' && r.sourceEncounterId === LOAN) { t.planted++; planted.set(String(r.seedId), Number(r.tick)); }
      else if (c === 'encounter_seed_triggered' && planted.has(String(r.seedId))) {
        if (r.outcome === 'discarded') { if (r.discardReason === 'place_never_reached') t.neverReached++; else t.otherDiscard++; }
        else { t.fired++; t.latency.push(Number(r.ticksBetweenPlantAndTrigger)); const a = String(r.targetAgentId); seededActors.set(a, (seededActors.get(a) ?? 0) + 1); }
      } else if (c === 'agreement_settled' && r.templateId === COLLECTION) {
        t.settles++; if (r.settlement === 'paid') t.paid++; else t.off++;
      } else if (c === 'debt_settle_noop' && r.templateId === COLLECTION) {
        t.settles++; if (r.reason === 'no_debt_owed') t.noDebt++;
      } else if (c === 'encounter_aftermath_effect' && r.effectKind === 'attachment_grant' && r.success === true && r.encounterId === LOAN) t.loanDebts++;
    }
    clearTraces();
    for (const a of state.unifiedActions ?? []) {
      if (!a.resolved || counted.has(a.actionId)) continue;
      if (a.templateId !== LOAN && a.templateId !== COLLECTION) continue;
      counted.add(a.actionId);
      if (a.templateId === LOAN) t.loanRes++; else t.collRes++;
    }
  }
  const lat = [...t.latency].sort((x, y) => x - y);
  const q = (p: number) => lat.length ? lat[Math.min(lat.length - 1, Math.floor(p * lat.length))] : NaN;
  console.log(`delay ${delay} seed ${seed} (${Math.round((Date.now() - started) / 1000)} s) | Loan resolved ${t.loanRes}, debts ${t.loanDebts} | Collection resolved ${t.collRes}, settles ${t.settles}: paid ${t.paid}, written off ${t.off}, no_debt_owed ${t.noDebt} (${t.settles ? Math.round(100 * t.noDebt / t.settles) : 0}%) | seeds planted ${t.planted}, fired ${t.fired}, place never reached ${t.neverReached}, other discard ${t.otherDiscard}, latency p50 ${q(0.5)} p90 ${q(0.9)}`);
}
