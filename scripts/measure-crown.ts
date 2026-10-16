/**
 * THR-1932 — the crown's Done-when predicates, measured on real seeded worlds.
 *
 * Runs each seed for 1080 ticks (90 days) with the purse live and reports, per seed:
 *   - the first day a realm is a Crown, and whether one stands between day 15 and day 45;
 *   - each Crown's oath income as a share of its full income at day 60 (15–35%);
 *   - oaths sworn and broken by kind (force should break first);
 *   - the share of swear-eligible factions still independent at day 90 (≥ 25%);
 *   - the one-layer invariant on every tick (no vassal is a liege, none has two lieges);
 *   - the courtship rate: the share of days a court-eligible realm ran `seek_fealty` (70–100%);
 *   - no faction's wealth below 0.
 *
 * Usage: npm run measure:crown [-- --seeds 42,99,7 --ticks 1080 --map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { isCrown, vassalsOf, readOath } from '../src/engine/crown/crownView';
import { isSwearableKind, mayCourt } from '../src/engine/crown/eligibility';
import { readPurseDay } from '../src/engine/factionPurse';
import { totalIncome } from '../src/engine/factionPurse/income';
import type { FactionActionRecord } from '../src/types/factionAction';
import { TICKS_PER_DAY } from '../src/data/attention-constants';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 1080);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;

interface SeedReport {
  seed: number;
  firstCrownDay: number | null;
  crownInWindow: boolean;
  oathShareAtDay60: { crown: string; share: number }[];
  sworn: Record<string, number>;
  broken: Record<string, number>;
  independentShareDay90: number | null;
  oneLayerViolations: number;
  courtshipRate: { realm: string; days: number; courted: number }[];
  negativeWealth: number;
}

function runSeed(seed: number): SeedReport {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[MAP];
  let { state } = initializeGameState(archetype, 'CrownMeasure', createBalancedCosmology(), seed, preset.cols, preset.rows);

  const report: SeedReport = {
    seed, firstCrownDay: null, crownInWindow: false, oathShareAtDay60: [],
    sworn: { persuaded: 0, bought: 0, coerced: 0 }, broken: { persuaded: 0, bought: 0, coerced: 0 },
    independentShareDay90: null, oneLayerViolations: 0, courtshipRate: [], negativeWealth: 0,
  };
  const seen = new Map<string, string>(); // edge id → kind
  const courtDays = new Map<string, { days: number; courted: number }>();

  for (let i = 0; i < TICKS; i++) {
    state = runTick(state, [], runtime);
    const g = state.graph;

    // One layer, every tick.
    for (const e of g.getEdgesByType('sworn_to')) {
      if (g.getIncomingEdges(e.source, 'sworn_to').length > 0) report.oneLayerViolations++;
      if (g.getOutgoingEdges(e.source, 'sworn_to').length > 1) report.oneLayerViolations++;
    }

    if (state.tick % TICKS_PER_DAY !== 0) continue;
    const day = state.tick / TICKS_PER_DAY;
    const factions = g.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');

    // Oaths sworn and broken.
    const now = new Map<string, string>();
    for (const e of g.getEdgesByType('sworn_to')) now.set(e.id, readOath(e).kind);
    for (const [id, kind] of now) if (!seen.has(id)) report.sworn[kind]++;
    for (const [id, kind] of seen) if (!now.has(id)) report.broken[kind]++;
    seen.clear();
    for (const [id, kind] of now) seen.set(id, kind);

    for (const f of factions) {
      if (typeof f.properties.wealth === 'number' && f.properties.wealth < 0) report.negativeWealth++;
      if (isCrown(g, f.id)) {
        if (report.firstCrownDay === null) report.firstCrownDay = day;
        if (day >= 15 && day <= 45) report.crownInWindow = true;
      }
      // Courtship: did a court-eligible realm run seek_fealty today?
      if (mayCourt(g, f)) {
        const c = courtDays.get(f.id) ?? { days: 0, courted: 0 };
        c.days++;
        const hist = (f.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? [];
        if (hist.some(r => r.actionType === 'seek_fealty' && r.executedTick > state.tick - TICKS_PER_DAY)) c.courted++;
        courtDays.set(f.id, c);
      }
    }

    if (day === 60) {
      for (const f of factions) {
        if (!isCrown(g, f.id)) continue;
        const pd = readPurseDay(f);
        const own = pd ? totalIncome(pd.income) : 0;
        const oath = pd?.fealtyIn ?? 0;
        report.oathShareAtDay60.push({ crown: f.name ?? f.id, share: own + oath > 0 ? oath / (own + oath) : 0 });
      }
    }
    if (day === 90) {
      const eligible = factions.filter(f => isSwearableKind(f) && vassalsOf(g, f.id).length === 0);
      const independent = eligible.filter(f => g.getOutgoingEdges(f.id, 'sworn_to').length === 0);
      report.independentShareDay90 = eligible.length > 0 ? independent.length / eligible.length : null;
    }
  }
  report.courtshipRate = [...courtDays].map(([realm, c]) => ({ realm, ...c }));
  return report;
}

for (const seed of SEEDS) {
  const t0 = Date.now();
  const r = runSeed(seed);
  console.log(`\n== seed ${seed} (${((Date.now() - t0) / 1000).toFixed(0)}s) ==`);
  console.log(`first crown day: ${r.firstCrownDay ?? 'none'} · crown in day 15–45: ${r.crownInWindow}`);
  console.log(`oath share at day 60: ${r.oathShareAtDay60.map(o => `${o.crown} ${(o.share * 100).toFixed(0)}%`).join(', ') || 'no crown'}`);
  console.log(`sworn ${JSON.stringify(r.sworn)} · broken ${JSON.stringify(r.broken)}`);
  console.log(`independent at day 90: ${r.independentShareDay90 === null ? 'n/a' : `${(r.independentShareDay90 * 100).toFixed(0)}%`}`);
  console.log(`one-layer violations: ${r.oneLayerViolations} · negative wealth readings: ${r.negativeWealth}`);
  console.log(`courtship: ${r.courtshipRate.map(c => `${c.realm} ${c.courted}/${c.days}`).join(', ')}`);
}
