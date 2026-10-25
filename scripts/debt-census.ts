/**
 * Debt census — THR-2023 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * Runs real worlds (`initializeGameState` → `runTick`) and harvests, every tick (the trace
 * ring is too small for 600 ticks), how debts end and begin in the money encounters:
 *   - `agreement_settled` by settlement (paid / written off), and `debt_settle_noop` by reason;
 *   - how many debts The Loan created (successful `attachment_grant` traces on its actions);
 *   - how often The Loan and Debt Collection resolved (unified actions harvested on resolve).
 *
 * Kill criteria (plan § Kill criteria) are reported, not gated: `no_debt_owed` above 90% of
 * Debt Collection's settles, or The Loan resolving less than half as often as on `main`
 * (run this script on a `main` checkout for the baseline — the trace rows read zero there).
 *
 * Usage:
 *   npm run census:debts                       # seeds 42,99 × 600 ticks, medium
 *   npm run census:debts -- --seeds 42 --ticks 300
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer';

const DEFAULT_SEEDS: readonly number[] = [42, 99];
const DEFAULT_TICKS = 600;
const LOAN = 'encounter.the_loan';
const COLLECTION = 'encounter.debt_collection';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? DEFAULT_SEEDS.join(',')).split(',').map(Number);
const ticks = Number(arg('--ticks') ?? DEFAULT_TICKS);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

interface DebtTally {
  paid: number;
  writtenOff: number;
  noop: Map<string, number>;
  collectionSettles: number;
  collectionNoDebt: number;
  loanDebts: number;
  resolved: Map<string, number>;
}

function runSeed(seed: number): DebtTally {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  clearTraces();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'DebtCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const tally: DebtTally = {
    paid: 0, writtenOff: 0, noop: new Map(), collectionSettles: 0, collectionNoDebt: 0, loanDebts: 0, resolved: new Map(),
  };
  const counted = new Set<string>();
  const harvest = () => {
    for (const raw of getTraces()) {
      const t = raw as unknown as Record<string, unknown>;
      if (t.category === 'agreement_settled') {
        if (t.settlement === 'paid') tally.paid++; else tally.writtenOff++;
        if (t.templateId === COLLECTION) tally.collectionSettles++;
      } else if (t.category === 'debt_settle_noop') {
        const reason = String(t.reason);
        tally.noop.set(reason, (tally.noop.get(reason) ?? 0) + 1);
        if (t.templateId === COLLECTION) {
          tally.collectionSettles++;
          if (reason === 'no_debt_owed') tally.collectionNoDebt++;
        }
      } else if (t.category === 'encounter_aftermath_effect' && t.effectKind === 'attachment_grant'
        && t.success === true && t.encounterId === LOAN) {
        tally.loanDebts++;
      }
    }
    clearTraces();
    for (const action of state.unifiedActions ?? []) {
      if (!action.resolved || counted.has(action.actionId)) continue;
      if (action.templateId !== LOAN && action.templateId !== COLLECTION) continue;
      counted.add(action.actionId);
      tally.resolved.set(action.templateId, (tally.resolved.get(action.templateId) ?? 0) + 1);
    }
  };

  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    harvest();
  }
  return tally;
}

console.log(`\ndebt-census — map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
for (const seed of seeds) {
  const started = Date.now();
  const t = runSeed(seed);
  const share = t.collectionSettles > 0 ? Math.round((100 * t.collectionNoDebt) / t.collectionSettles) : 0;
  console.log(`── seed ${seed} (${Math.round((Date.now() - started) / 1000)} s)`);
  console.log(`  agreement_settled   paid ${t.paid}   written off ${t.writtenOff}`);
  console.log(`  debt_settle_noop    ${[...t.noop].map(([r, n]) => `${r} ${n}`).join('   ') || 'none'}`);
  console.log(`  Debt Collection     resolved ${t.resolved.get(COLLECTION) ?? 0}   settles ${t.collectionSettles}   no_debt_owed ${t.collectionNoDebt} (${share}%)`);
  console.log(`  The Loan            resolved ${t.resolved.get(LOAN) ?? 0}   debts created ${t.loanDebts}`);
}
