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
 *        npm run measure:crown -- --seeds 42 --ticks 240 --trace   (THR-1961: one realm's
 *        `can_court` verdicts and `faction_action` traces, sweep by sweep)
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
import { FACTION_ACTION_INTERVAL } from '../src/types/factionAction';
import type { FactionActionRecord, FactionActionTrace } from '../src/types/factionAction';
import type { GameState } from '../src/types/gameState';
import { TICKS_PER_DAY } from '../src/data/attention-constants';
import { canCourt } from '../src/engine/crown';
import { buildCrownWorld } from '../src/engine/crown/eligibility';
import { buildRealmProjection } from '../src/engine/realmProjection';
import { seekFealtyWindowOpen } from '../src/engine/phaseFactionActions';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const SEEDS = (argValue('--seeds') ?? '42,99,7').split(',').map(Number);
const TICKS = Number(argValue('--ticks') ?? 1080);
const MAP = (argValue('--map') ?? 'medium') as MapSizePreset;
/** `--trace`: print the first court-eligible realm's sweeps for the first TRACE_TICKS ticks. */
const TRACE = process.argv.includes('--trace');
const TRACE_TICKS = Number(argValue('--trace-ticks') ?? 240);
if (TRACE) enableTracing();

interface SeedReport {
  seed: number;
  firstCrownDay: number | null;
  crownInWindow: boolean;
  oathShareAtDay60: { crown: string; share: number; vassals: number; ageDays: number }[];
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
  // THR-2017 — the day each realm became a Crown (reset when it falls below), so the
  // day-60 share can be read against how long the Crown has stood.
  const crownSince = new Map<string, number>();
  // THR-1961 — courtship counts calendar days (day = floor(tick / TICKS_PER_DAY)), the
  // same days the window rule keys on. The old count read a rolling 12-tick window ending
  // at each day's first tick, which straddles two calendar days and missed every day
  // whose only sweep was blocked by a courtship on the previous calendar day's first tick.
  const eligibleDays = new Map<string, Set<number>>();
  const courtedDays = new Map<string, Set<number>>();
  const traceRealm = TRACE ? { id: null as string | null } : null;

  for (let i = 0; i < TICKS; i++) {
    if (traceRealm && state.tick + 1 <= TRACE_TICKS) tracePreTick(state, traceRealm);
    state = runTick(state, [], runtime);
    const g = state.graph;
    const dayOfTick = Math.floor(state.tick / TICKS_PER_DAY);
    for (const f of g.getNodesByType('actor')) {
      if (f.properties.actorType !== 'faction' || !mayCourt(g, f)) continue;
      if (!eligibleDays.has(f.id)) eligibleDays.set(f.id, new Set());
      eligibleDays.get(f.id)!.add(dayOfTick);
      const hist = (f.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? [];
      if (hist.some(r => r.actionType === 'seek_fealty' && r.executedTick === state.tick)) {
        if (!courtedDays.has(f.id)) courtedDays.set(f.id, new Set());
        courtedDays.get(f.id)!.add(dayOfTick);
      }
    }
    if (traceRealm && state.tick <= TRACE_TICKS) tracePostTick(state, traceRealm);

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
      if (!isCrown(g, f.id)) crownSince.delete(f.id);
      else if (!crownSince.has(f.id)) crownSince.set(f.id, day);
      if (isCrown(g, f.id)) {
        if (report.firstCrownDay === null) report.firstCrownDay = day;
        if (day >= 15 && day <= 45) report.crownInWindow = true;
      }
    }

    if (day === 60) {
      for (const f of factions) {
        if (!isCrown(g, f.id)) continue;
        const pd = readPurseDay(f);
        const own = pd ? totalIncome(pd.income) : 0;
        const oath = pd?.fealtyIn ?? 0;
        report.oathShareAtDay60.push({
          crown: f.name ?? f.id, share: own + oath > 0 ? oath / (own + oath) : 0,
          vassals: vassalsOf(g, f.id).length, ageDays: day - (crownSince.get(f.id) ?? day),
        });
      }
    }
    if (day === 90) {
      const eligible = factions.filter(f => isSwearableKind(f) && vassalsOf(g, f.id).length === 0);
      const independent = eligible.filter(f => g.getOutgoingEdges(f.id, 'sworn_to').length === 0);
      report.independentShareDay90 = eligible.length > 0 ? independent.length / eligible.length : null;
    }
  }
  // Only whole days count: the run's last, partial day is dropped.
  const lastWholeDay = Math.floor(state.tick / TICKS_PER_DAY) - (state.tick % TICKS_PER_DAY === TICKS_PER_DAY - 1 ? 0 : 1);
  report.courtshipRate = [...eligibleDays].map(([realm, days]) => {
    const whole = [...days].filter(d => d <= lastWholeDay);
    const courted = courtedDays.get(realm) ?? new Set<number>();
    return { realm, days: whole.length, courted: whole.filter(d => courted.has(d)).length };
  });
  return report;
}

// ─── --trace: one realm's sweeps, verdict by verdict (THR-1961) ─────────────────

/** Before each faction sweep: the realm's `can_court` verdict as the sweep will see it. */
function tracePreTick(state: GameState, t: { id: string | null }): void {
  const tick = state.tick + 1;
  if (tick % FACTION_ACTION_INTERVAL !== 0) return;
  const g = state.graph;
  if (!t.id) {
    const realm = g.getNodesByType('actor').find(f => f.properties.actorType === 'faction' && mayCourt(g, f));
    if (!realm) return;
    t.id = realm.id;
    console.log(`\n-- trace: ${realm.name ?? realm.id} (${realm.id}), sweeps every ${FACTION_ACTION_INTERVAL} ticks, day = ${TICKS_PER_DAY} ticks --`);
  }
  const realm = g.getNode(t.id);
  if (!realm) return;
  const world = buildCrownWorld(g, tick, buildRealmProjection(g, state.tiles ?? []));
  const hist = (realm.properties.factionActionHistory as FactionActionRecord[] | undefined) ?? [];
  const window = seekFealtyWindowOpen(hist, tick);
  console.log(`tick ${String(tick).padStart(3)} day ${String(Math.floor(tick / TICKS_PER_DAY)).padStart(2)}`
    + ` · can_court ${canCourt(world, t.id) && window ? 'yes' : 'no'}`
    + ` (candidates ${canCourt(world, t.id) ? 'yes' : 'no'}, window ${window ? 'open' : 'closed'})`);
}

/** After the tick: the realm's `faction_action` trace, if it acted. */
function tracePostTick(state: GameState, t: { id: string | null }): void {
  if (!t.id || state.tick % FACTION_ACTION_INTERVAL !== 0) return;
  for (const tr of getTraces()) {
    if (tr.tick !== state.tick || tr.category !== 'faction_action') continue;
    const fa = tr as FactionActionTrace;
    if (fa.factionId !== t.id) continue;
    console.log(`         faction_action ${fa.outcome} ${fa.actionType}${fa.targetName ? ` → ${fa.targetName}` : ''}`);
  }
  clearTraces();
}

for (const seed of SEEDS) {
  const t0 = Date.now();
  const r = runSeed(seed);
  console.log(`\n== seed ${seed} (${((Date.now() - t0) / 1000).toFixed(0)}s) ==`);
  console.log(`first crown day: ${r.firstCrownDay ?? 'none'} · crown in day 15–45: ${r.crownInWindow}`);
  console.log(`oath share at day 60: ${r.oathShareAtDay60.map(o => `${o.crown} ${(o.share * 100).toFixed(0)}% (${o.vassals} vassals, crowned ${o.ageDays}d)`).join(', ') || 'no crown'}`);
  console.log(`sworn ${JSON.stringify(r.sworn)} · broken ${JSON.stringify(r.broken)}`);
  console.log(`independent at day 90: ${r.independentShareDay90 === null ? 'n/a' : `${(r.independentShareDay90 * 100).toFixed(0)}%`}`);
  console.log(`one-layer violations: ${r.oneLayerViolations} · negative wealth readings: ${r.negativeWealth}`);
  console.log(`courtship: ${r.courtshipRate.map(c => `${c.realm} ${c.courted}/${c.days}`).join(', ')}`);
}
